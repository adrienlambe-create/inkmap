// Scraper Instagram og:image — utilisé au build par generate-profiles.js
// Pour un URL de post Insta public :
//   1) fetch le HTML de la page
//   2) extrait <meta property="og:image" content="...">
//   3) télécharge l'image vers Vercel Blob (cache par ID de post)
//   4) retourne { ok, blobUrl, reason }
//
// Détecte les comptes privés / posts supprimés et renvoie ok=false.
// Robuste aux pannes Insta (timeout + retry + fallback gracieux).

const { put, head } = require('@vercel/blob');
const sharp = require('sharp');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Taille cible : carré 800x800 — bon compromis entre qualité et poids.
// Le smart crop ('attention') détecte la zone la plus saillante.
const CROP_SIZE = 800;

const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.5 Safari/605.1.15';

// Extrait l'ID d'un post Insta depuis son URL.
// Accepte /p/{id}/, /reel/{id}/, /tv/{id}/ avec ou sans query.
function extractPostId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(p|reel|tv)\/([\w-]+)/i);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

// Valide qu'une URL est bien un post Insta supporté.
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

function extractOgImage(html) {
  if (!html) return null;
  // Match <meta property="og:image" content="..."> ou name="og:image"
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
    html.match(/<meta[^>]+name=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (!m) return null;
  return m[1].replace(/&amp;/g, '&');
}

// Tente de récupérer l'og:image avec retry.
async function fetchOgImage(postUrl) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const r = await fetchWithTimeout(postUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
      });
      if (!r.ok) {
        lastErr = new Error(`HTTP ${r.status}`);
        if (r.status === 404 || r.status === 410) {
          return { ok: false, reason: 'post_supprime' };
        }
        continue;
      }
      const html = await r.text();
      if (isLoginWall(html)) {
        return { ok: false, reason: 'compte_prive_ou_login_requis' };
      }
      const ogUrl = extractOgImage(html);
      if (!ogUrl) {
        lastErr = new Error('og:image absent');
        continue;
      }
      return { ok: true, ogUrl };
    } catch (e) {
      lastErr = e;
    }
  }
  return { ok: false, reason: 'fetch_echec', error: String(lastErr || 'inconnu') };
}

// Smart-crop carré centré sur le sujet (l'algo 'attention' de sharp détecte
// la zone la plus saillante — pour un tatouage : forte signature de contraste).
async function cropToSquare(buf) {
  return sharp(buf)
    .resize(CROP_SIZE, CROP_SIZE, {
      fit: 'cover',
      position: sharp.strategy.attention,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

// Upload une image vers Vercel Blob (cache stable par clé).
// La clé "v2" force un re-scrape pour les profils déjà cachés avec l'ancien crop.
async function uploadToBlob(imgUrl, postId) {
  if (!BLOB_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN absent');
  }
  const key = `instagram-thumbs-v2/${postId}.jpg`;

  // 1) Existe déjà ? — réutilise l'URL
  try {
    const meta = await head(key, { token: BLOB_TOKEN });
    if (meta?.url) return meta.url;
  } catch (_) {
    // 404 normal, on upload plus bas
  }

  // 2) Télécharge l'og:image, smart-crop carré, push vers Blob
  const r = await fetchWithTimeout(imgUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!r.ok) throw new Error(`Téléchargement og:image échoué (${r.status})`);
  const rawBuf = Buffer.from(await r.arrayBuffer());
  let croppedBuf;
  try {
    croppedBuf = await cropToSquare(rawBuf);
  } catch (e) {
    // Sharp peut échouer sur certains formats exotiques — fallback sur l'image brute
    console.warn(`   ⚠️  smart-crop échec (${e.message}) — fallback image brute`);
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
  const postId = extractPostId(postUrl);
  if (!postId) return { ok: false, reason: 'url_invalide' };

  // Si l'image est déjà sur Blob (clé v2 = avec smart-crop), on évite de hit Insta.
  if (BLOB_TOKEN) {
    try {
      const meta = await head(`instagram-thumbs-v2/${postId}.jpg`, { token: BLOB_TOKEN });
      if (meta?.url) return { ok: true, blobUrl: meta.url, cached: true };
    } catch (_) {
      // pas en cache, on continue
    }
  }

  const og = await fetchOgImage(postUrl);
  if (!og.ok) return og;

  if (!BLOB_TOKEN) {
    // Pas de Blob configuré : on retourne l'URL og brute (CDN Insta, peut expirer).
    return { ok: true, blobUrl: og.ogUrl, cached: false, fallback: 'og_direct' };
  }

  try {
    const blobUrl = await uploadToBlob(og.ogUrl, postId);
    return { ok: true, blobUrl, cached: false };
  } catch (e) {
    return { ok: false, reason: 'upload_blob_echec', error: String(e?.message || e) };
  }
}

module.exports = {
  scrapeInstagramThumb,
  extractPostId,
  isValidInstagramPostUrl,
};
