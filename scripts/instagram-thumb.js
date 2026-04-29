// Scraper Instagram — utilisé au build par generate-profiles.js
// Pour un URL de post Insta public :
//   1) fetch le HTML de la page /embed/ (≠ page principale, qui sert souvent
//      une og:image déjà cropée 1:1 par Instagram en haut de l'image)
//   2) parse le contextJSON intégré pour récupérer l'URL d'image en RATIO
//      ORIGINAL (1080x1440 portrait, ou 1080x1080) selon img_index
//   3) crop carré centré 800x800 nous-mêmes (Insta ne nous fait pas le crop)
//   4) télécharge le résultat vers Vercel Blob (cache par postId + img_index)
//   5) retourne { ok, blobUrl, reason }
//
// Détecte les comptes privés / posts supprimés et renvoie ok=false.
// Robuste aux pannes Insta (timeout + retry + fallbacks en cascade).

const { put, head } = require('@vercel/blob');
const sharp = require('sharp');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Taille cible : carré 800x800 — bon compromis entre qualité et poids.
const CROP_SIZE = 800;

// Bumper cette version invalide tous les caches Blob précédents.
// v6 : passage à l'endpoint /embed/ pour récupérer l'image source non-cropée
// par Insta + support de ?img_index= dans la clé Blob.
const KEY_VERSION = 'v6';

const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.5 Safari/605.1.15';

// Parse une URL Insta. Renvoie { postId, imgIndex } ou null.
// Accepte /p/{id}/, /reel/{id}/, /tv/{id}/ avec ou sans query ?img_index=.
function parseInstagramUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(p|reel|tv)\/([\w-]+)/i);
    if (!m) return null;
    const raw = u.searchParams.get('img_index');
    const imgIndex = raw ? Math.max(1, parseInt(raw, 10) || 1) : 1;
    return { postId: m[2], imgIndex };
  } catch {
    return null;
  }
}

function extractPostId(url) {
  return parseInstagramUrl(url)?.postId || null;
}

function isValidInstagramPostUrl(url) {
  return !!extractPostId(url);
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Détecte les pages "Login required" servies par Insta pour les contenus non-publics.
function isLoginWall(html) {
  if (!html) return true;
  const sample = html.slice(0, 50000);
  return (
    /"require_login"\s*:\s*true/i.test(sample) ||
    /Login\s*&bull;\s*Instagram/i.test(sample) ||
    /<title>\s*Login\s*•\s*Instagram\s*<\/title>/i.test(sample)
  );
}

// Extrait le contextJSON imbriqué dans la page /embed/.
// Le JSON est doublement échappé (chaîne JS contenant du JSON).
function extractEmbedGraph(html) {
  const m = html.match(/"contextJSON":"((?:\\.|[^"\\])*)"/);
  if (!m) return null;
  try {
    const decoded = JSON.parse(`"${m[1]}"`); // unescape la chaîne JS
    const ctx = JSON.parse(decoded); // parse le JSON
    return ctx?.gql_data?.shortcode_media || ctx?.shortcode_media || null;
  } catch {
    return null;
  }
}

// Fallback : récupère directement l'<img class="EmbeddedMediaImage"> de la page embed.
// Utilisé quand contextJSON est absent (single posts collapsed côté Insta).
function extractEmbeddedMediaImage(html) {
  const m = html.match(/<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]*src="([^"]+)"/i);
  return m ? m[1].replace(/&amp;/g, '&') : null;
}

// Fallback ultime : og:image de la page principale (souvent cropée 1:1 par Insta).
function extractOgImage(html) {
  if (!html) return null;
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
    html.match(/<meta[^>]+name=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  return m ? m[1].replace(/&amp;/g, '&') : null;
}

// Sélectionne la plus grande résolution disponible.
function pickBestResource(resources) {
  if (!Array.isArray(resources) || !resources.length) return null;
  const best = resources.reduce(
    (b, r) => (r.config_width > (b?.config_width || 0) ? r : b),
    null,
  );
  return best?.src || null;
}

// Sélectionne le bon média dans le graph selon img_index.
// - GraphSidecar (carrousel) : prend la slide à imgIndex, fallback sur 1ère photo si vidéo
// - GraphImage (single) : retourne directement
// - GraphVideo (Reel) : { ok: false }
function selectMediaFromGraph(graph, imgIndex) {
  if (!graph) return { ok: false, reason: 'no_graph' };
  const t = graph.__typename;
  if (t === 'GraphSidecar') {
    const edges = graph.edge_sidecar_to_children?.edges || [];
    if (!edges.length) return { ok: false, reason: 'sidecar_vide' };
    let target = edges[imgIndex - 1]?.node;
    let usedFallback = false;
    if (!target || target.is_video) {
      const firstPhoto = edges.map(e => e.node).find(n => !n.is_video);
      if (!firstPhoto) return { ok: false, reason: 'sidecar_que_des_videos' };
      target = firstPhoto;
      usedFallback = true;
    }
    const url = pickBestResource(target.display_resources) || target.display_url;
    if (!url) return { ok: false, reason: 'pas_de_display_url' };
    return { ok: true, imgUrl: url, fallback: usedFallback };
  }
  if (t === 'GraphImage') {
    const url = pickBestResource(graph.display_resources) || graph.display_url;
    return url ? { ok: true, imgUrl: url } : { ok: false, reason: 'pas_de_display_url' };
  }
  if (t === 'GraphVideo' || graph.is_video) {
    return { ok: false, reason: 'post_video' };
  }
  return { ok: false, reason: 'typename_inconnu_' + t };
}

// Tente d'obtenir l'URL d'une image source (ratio original) pour un post.
// Cascade : embed contextJSON → embed EmbeddedMediaImage → og:image page principale.
async function fetchInstaImage(postId, imgIndex) {
  const embedUrl = `https://www.instagram.com/p/${postId}/embed/`;
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const r = await fetchWithTimeout(embedUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
      });
      if (!r.ok) {
        if (r.status === 404 || r.status === 410) return { ok: false, reason: 'post_supprime' };
        lastErr = new Error(`HTTP ${r.status}`);
        continue;
      }
      const html = await r.text();
      if (isLoginWall(html)) return { ok: false, reason: 'compte_prive_ou_login_requis' };

      // 1) Cas idéal : contextJSON présent → image en ratio original + img_index respecté
      const graph = extractEmbedGraph(html);
      if (graph) {
        const sel = selectMediaFromGraph(graph, imgIndex);
        if (sel.ok) return { ok: true, imgUrl: sel.imgUrl, fallback: sel.fallback };
        if (sel.reason === 'post_video' || sel.reason === 'sidecar_que_des_videos') {
          // Pour les Reels, on tente quand même og:image plus bas (frame avec play overlay)
          break;
        }
      }

      // 2) Fallback : EmbeddedMediaImage (single post, contextJSON collapsed)
      const embedded = extractEmbeddedMediaImage(html);
      if (embedded) return { ok: true, imgUrl: embedded, fallback: 'embed_img' };

      lastErr = new Error('aucune image dans embed');
    } catch (e) {
      lastErr = e;
    }
  }

  // 3) Dernier recours : og:image de la page principale (souvent cropée 1:1, et avec
  //    play overlay pour les Reels — mais mieux que rien)
  try {
    const r = await fetchWithTimeout(`https://www.instagram.com/p/${postId}/`, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
      redirect: 'follow',
    });
    if (r.ok) {
      const html = await r.text();
      if (!isLoginWall(html)) {
        const og = extractOgImage(html);
        if (og) return { ok: true, imgUrl: og, fallback: 'og_image' };
      }
    }
  } catch (_) {}

  return { ok: false, reason: 'fetch_echec', error: String(lastErr || 'inconnu') };
}

// Crop carré centré. L'image source vient de /embed/ et est en ratio original
// (typiquement 1080x1440 portrait), donc le centrage géométrique garde le tatouage
// quand il est cadré au milieu du post Insta — ce qui est le cas le plus fréquent.
async function cropToSquare(buf) {
  return sharp(buf)
    .resize(CROP_SIZE, CROP_SIZE, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

// Upload vers Vercel Blob. La clé inclut img_index : deux profils ciblant le même
// post à des index différents ont deux entrées distinctes.
async function uploadToBlob(imgUrl, postId, imgIndex) {
  if (!BLOB_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN absent');
  const key = `instagram-thumbs-${KEY_VERSION}/${postId}-i${imgIndex}.jpg`;

  try {
    const meta = await head(key, { token: BLOB_TOKEN });
    if (meta?.url) return meta.url;
  } catch (_) {
    // 404 normal, on upload plus bas
  }

  const r = await fetchWithTimeout(imgUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!r.ok) throw new Error(`Téléchargement image échoué (${r.status})`);
  const rawBuf = Buffer.from(await r.arrayBuffer());
  let croppedBuf;
  try {
    croppedBuf = await cropToSquare(rawBuf);
  } catch (e) {
    console.warn(`   ⚠️  crop échec (${e.message}) — fallback image brute`);
    croppedBuf = rawBuf;
  }
  const blob = await put(key, croppedBuf, {
    access: 'public',
    contentType: 'image/jpeg',
    token: BLOB_TOKEN,
    allowOverwrite: false,
  });
  return blob.url;
}

// API publique : prend une URL de post, retourne { ok, blobUrl?, reason? }.
async function scrapeInstagramThumb(postUrl) {
  const parsed = parseInstagramUrl(postUrl);
  if (!parsed) return { ok: false, reason: 'url_invalide' };
  const { postId, imgIndex } = parsed;

  // Cache hit ?
  if (BLOB_TOKEN) {
    try {
      const meta = await head(
        `instagram-thumbs-${KEY_VERSION}/${postId}-i${imgIndex}.jpg`,
        { token: BLOB_TOKEN },
      );
      if (meta?.url) return { ok: true, blobUrl: meta.url, cached: true };
    } catch (_) {
      // pas en cache
    }
  }

  const img = await fetchInstaImage(postId, imgIndex);
  if (!img.ok) return img;

  if (!BLOB_TOKEN) {
    return { ok: true, blobUrl: img.imgUrl, cached: false, fallback: 'no_blob' };
  }

  try {
    const blobUrl = await uploadToBlob(img.imgUrl, postId, imgIndex);
    return { ok: true, blobUrl, cached: false, fallback: img.fallback };
  } catch (e) {
    return { ok: false, reason: 'upload_blob_echec', error: String(e?.message || e) };
  }
}

module.exports = {
  scrapeInstagramThumb,
  extractPostId,
  isValidInstagramPostUrl,
};
