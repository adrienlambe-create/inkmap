// Générateur pages profil tatoueur — /tatoueur/{slug}.html
// Fetch Airtable → normalise → slug → QR → HTML

require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { put, head } = require('@vercel/blob');
const { buildProfilePage } = require('./partials/profile-template');

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD1ZqrwZXTza0KR';
const TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tbl5xdM5VGqrieG4a';

if (!AIRTABLE_TOKEN) {
  console.error('❌ AIRTABLE_TOKEN manquant — ajoute-le dans .env.local ou en env var.');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, 'tatoueur');
const ROOT_DIR = __dirname;

// ── Utils ─────────────────────────────────────────────────────────────────
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function makeUniqueSlug(t, used) {
  const nameSource = t.pseudo || t.nom;
  const base = `${slugify(nameSource)}-${slugify(t.ville)}`.replace(/^-+|-+$/g, '');
  if (!base) return null;
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

// Liste des fichiers tatoueur-{style}-{ville}.html existants à la racine
const GENERATED_STYLE_CITY_FILES = new Set(
  fs.readdirSync(ROOT_DIR)
    .filter(f => /^tatoueur-[a-z0-9-]+\.html$/.test(f))
);

function linkToStyleCity(styleLabel, ville) {
  const styleSlug = slugify(styleLabel);
  const citySlug = slugify(ville);
  const filename = `tatoueur-${styleSlug}-${citySlug}.html`;
  if (GENERATED_STYLE_CITY_FILES.has(filename)) {
    return `/tatoueur-${styleSlug}-${citySlug}`;
  }
  return null;
}

// ── Fetch Airtable (tous les records, paginé) ────────────────────────────
async function fetchAllAirtableRecords() {
  const all = [];
  let offset;
  do {
    const qs = new URLSearchParams();
    if (offset) qs.set('offset', offset);
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}${qs.toString() ? '?' + qs : ''}`;
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });
    if (!r.ok) {
      const msg = await r.text();
      throw new Error(`Airtable error ${r.status}: ${msg}`);
    }
    const data = await r.json();
    all.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return all;
}

// ── Normalisation record → objet tatoueur ────────────────────────────────
function normalizeRecord(rec) {
  const f = rec.fields || {};
  const rawStyles = f.Styles || f.styles || [];
  const styles = Array.isArray(rawStyles)
    ? rawStyles
    : String(rawStyles).split(',').map(s => s.trim()).filter(Boolean);
  // Un profil est "vérifié" s'il a un Email (= inscription via formulaire).
  // Les profils scrappés n'ont pas d'email.
  const verifie = !!(f.Email && String(f.Email).trim());

  const photoArr = f.Photos || f.Photo || [];
  const photoAttachments = Array.isArray(photoArr)
    ? photoArr
        .map(p => {
          const url = p?.thumbnails?.large?.url || p?.url || '';
          if (!url) return null;
          return {
            id: p?.id || '',
            url,
            type: p?.type || 'image/jpeg',
            filename: p?.filename || '',
          };
        })
        .filter(Boolean)
    : [];

  return {
    airtableId: rec.id,
    nom: (f.Nom || '').trim(),
    pseudo: (f.Pseudo || '').trim(),
    ville: (f.Ville || '').trim(),
    region: (f.Region || '').trim(),
    styles,
    tarif: parseInt(f.Tarif) || 0,
    instagram: (f.Instagram || '').trim(),
    bio: (f.Bio || '').trim(),
    photoAttachments,
    photos: photoAttachments.map(a => a.url), // fallback si migration échoue
    verifie,
  };
}

// ── Migration des photos Airtable → Vercel Blob (URLs permanentes) ────────
// Airtable signe les URLs qui expirent après quelques heures. On copie chaque
// pièce jointe vers Blob une seule fois (clé = attachment ID), puis on réutilise.
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function extFromType(type) {
  if (!type) return 'jpg';
  const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  return map[type.toLowerCase()] || 'jpg';
}

async function ensureStableUrl(att) {
  if (!att?.id || !att?.url) return att?.url || '';
  if (!BLOB_TOKEN) return att.url; // pas de token → fallback URL signée
  const ext = extFromType(att.type);
  const key = `tatoueurs/${att.id}.${ext}`;

  // 1. Existe déjà ? → réutilise
  try {
    const meta = await head(key, { token: BLOB_TOKEN });
    if (meta?.url) return meta.url;
  } catch (e) {
    // 404 normal — on upload plus bas
  }

  // 2. Télécharge depuis Airtable + upload vers Blob
  try {
    const r = await fetch(att.url);
    if (!r.ok) throw new Error(`fetch airtable ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const blob = await put(key, buf, {
      access: 'public',
      contentType: att.type || 'image/jpeg',
      token: BLOB_TOKEN,
      allowOverwrite: false,
    });
    return blob.url;
  } catch (e) {
    console.warn(`   ⚠️  blob ${att.id} : ${e.message} — fallback URL signée`);
    return att.url;
  }
}

async function migratePhotos(t) {
  if (!t.photoAttachments?.length) return t;
  const urls = [];
  for (const att of t.photoAttachments) {
    const url = await ensureStableUrl(att);
    if (url) urls.push(url);
  }
  t.photos = urls;
  return t;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('📡 Fetch Airtable...');
  const records = await fetchAllAirtableRecords();
  console.log(`   ${records.length} records trouvés.`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  if (!BLOB_TOKEN) {
    console.warn('⚠️  BLOB_READ_WRITE_TOKEN absent — photos Airtable resteront des URLs signées (expirent).');
  }

  const used = new Set();
  const generated = [];
  const skipped = [];
  let migratedCount = 0;

  for (const rec of records) {
    const t = normalizeRecord(rec);

    // Skip si incomplet
    if (!t.nom || !t.ville) {
      skipped.push({ id: rec.id, reason: 'nom/ville manquant' });
      continue;
    }

    const slug = makeUniqueSlug(t, used);
    if (!slug) {
      skipped.push({ id: rec.id, reason: 'slug impossible' });
      continue;
    }
    used.add(slug);

    // Migre les photos Airtable → Vercel Blob (URLs permanentes)
    const beforeCount = t.photos.length;
    await migratePhotos(t);
    if (BLOB_TOKEN && beforeCount) migratedCount += beforeCount;

    // Génère le QR SVG pour l'URL de la page
    const url = `https://inkmap.fr/tatoueur/${slug}`;
    const qrSvg = await QRCode.toString(url, {
      type: 'svg',
      margin: 0,
      color: { dark: '#0d0d0d', light: '#ffffff' },
    });

    const html = buildProfilePage({ tatoueur: t, slug, qrSvg, linkToStyleCity });
    const outPath = path.join(OUT_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, html, 'utf8');

    generated.push({ slug, nom: t.pseudo || t.nom, ville: t.ville });
    console.log(`  ✓ /tatoueur/${slug}`);
  }

  console.log(`\n✅ ${generated.length} pages profil générées.`);
  if (migratedCount) console.log(`   🖼  ${migratedCount} photos vérifiées/migrées sur Vercel Blob.`);
  if (skipped.length) {
    console.log(`⚠️  ${skipped.length} records ignorés :`);
    skipped.forEach(s => console.log(`   · ${s.id} → ${s.reason}`));
  }

  // Écrit l'index des slugs générés (utilisé par generate-all.js pour le sitemap)
  fs.writeFileSync(
    path.join(__dirname, '.profiles-index.json'),
    JSON.stringify({ generated, generatedAt: new Date().toISOString() }, null, 2)
  );
}

main().catch(err => {
  console.error('❌ generate-profiles a échoué :', err);
  process.exit(1);
});
