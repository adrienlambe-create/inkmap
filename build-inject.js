#!/usr/bin/env node
// Build-time injection : fetch Airtable → inject pre-rendered artist cards into HTML pages
// Run: AIRTABLE_TOKEN=xxx node build-inject.js

const fs = require('fs');
const path = require('path');

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD1ZqrwZXTza0KR';
const TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tbl5xdM5VGqrieG4a';
const TOKEN = process.env.AIRTABLE_TOKEN;

if (!TOKEN) {
  console.error('❌ AIRTABLE_TOKEN manquant. Usage : AIRTABLE_TOKEN=xxx node build-inject.js');
  process.exit(1);
}

const PUBLIC_FIELDS = ['Nom', 'Pseudo', 'Ville', 'Region', 'Styles', 'Tarif', 'Instagram', 'Bio', 'Photos', 'Statut', 'Email'];

const STYLE_EMOJI = {
  'Blackwork':'◼','Fineline':'🌿','Réalisme':'📷','Old School':'⚓',
  'Aquarelle':'🎨','Géométrique':'◆','Japonais':'⛩','Neo-Traditional':'🌹',
  'Tribal':'◉','Dotwork':'⬡','Illustratif':'🖤','Floral':'🌸',
  'Minimaliste':'✦','Portrait':'👁','Flash':'🦅','Organique':'🌑',
  'Micro-réalisme':'🔬','Noir & Gris':'🖤','Irezumi':'⛩','Lettering':'✍️'
};

function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function villeBase(ville) {
  if (!ville) return '';
  return ville.trim().replace(/\s+\d+(e|er|ème|eme|ième|ieme)?\s*$/i, '').trim() || ville.trim();
}

async function fetchAllRecords() {
  const fieldsParam = PUBLIC_FIELDS.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
  let allRecords = [];
  let offset = null;

  do {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${fieldsParam}${offset ? `&offset=${offset}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) {
      console.error(`❌ Airtable error: ${res.status} ${res.statusText}`);
      process.exit(1);
    }
    const data = await res.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

function parseRecords(records) {
  let id = 1;
  return records.map(({ fields: f, createdTime }) => {
    if (!f.Nom) return null;
    const rawStyles = f.Styles || f.styles || [];
    const styles = Array.isArray(rawStyles) ? rawStyles : rawStyles.split(',').map(s => s.trim()).filter(Boolean);
    const statut = (f.Statut || f.statuts || '').toLowerCase();
    const photoArr = f.Photos || f.Photo || f.photo || [];
    const allPhotos = Array.isArray(photoArr)
      ? photoArr.map(p => p.thumbnails?.large?.url || p.url || '').filter(Boolean)
      : [];
    return {
      id: id++,
      nom: f.Pseudo || f.Nom,
      nomComplet: f.Nom,
      ville: f.Ville || f.ville || '',
      region: f.Region || f.region || '',
      styles,
      tarif: parseInt(f.Tarif || f.tarif) || 0,
      instagram: f.Instagram || f.instagram || '',
      bio: f.Bio || f.bio || '',
      verifie: statut.includes('véri') || statut.includes('actif') || statut.includes('publi') || !!(f.Email || f.email),
      photo: allPhotos[0] || '',
      photos: allPhotos,
      emoji: STYLE_EMOJI[styles[0]] || '✦',
      createdAt: createdTime || '',
    };
  }).filter(Boolean);
}

// Generate a static HTML card (visible to Googlebot without JS)
function buildStaticCard(t) {
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style="display:block"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.6" fill="rgba(192,57,43,0.12)"/></pattern><linearGradient id="glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#141414"/><stop offset="50%" stop-color="#0d0d0d"/><stop offset="100%" stop-color="#111"/></linearGradient></defs><rect width="320" height="180" fill="url(#glow)"/><rect width="320" height="180" fill="url(#grid)"/><line x1="0" y1="180" x2="320" y2="0" stroke="rgba(192,57,43,0.06)" stroke-width="40"/><g transform="translate(160,68)" fill="none" stroke="#333" stroke-width="1.2" stroke-linecap="round"><path d="M-8,-18 L-8,8 C-8,12 -4,14 0,14 C4,14 8,12 8,8 L8,-18"/><line x1="-8" y1="-8" x2="8" y2="-8"/><line x1="-6" y1="-13" x2="6" y2="-13"/><line x1="0" y1="14" x2="0" y2="22" stroke="#c0392b" stroke-width="1.5"/><circle cx="-12" cy="-14" r="2.5" stroke="#333"/><line x1="-12" y1="-11.5" x2="-12" y2="-4"/><path d="M-12,-4 L-8,-2"/></g><text x="160" y="116" font-family="Arial Black, Impact, sans-serif" font-size="13" font-weight="900" letter-spacing="5" fill="#fff" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle">INK<tspan fill="#c0392b">MAP</tspan></text><text x="160" y="134" font-family="Arial, Helvetica, sans-serif" font-size="7.5" letter-spacing="3" fill="#555" text-anchor="middle" dominant-baseline="middle">PHOTO À VENIR</text></svg>`;
  // Always use placeholder in build-time HTML — Airtable signed URLs expire after a few hours.
  // The client-side JS (chargerDepuisAirtable) fetches fresh URLs and re-renders with real photos.
  const photoHtml = placeholderSvg;
  const badgeHtml = t.verifie
    ? '<span class="badge-verifie">✓ Vérifié</span>'
    : '';
  const tarifHtml = t.tarif > 0
    ? `${t.tarif}€ <small>/ heure</small>`
    : `Sur devis`;
  return `<div class="card" data-id="${t.id}">
      <div class="card-img">${photoHtml}</div>
      <div class="card-body">
        <div class="card-top">
          <div class="card-name">${esc(t.nom)}</div>
          ${badgeHtml}
        </div>
        <div class="card-location">📍 ${esc(t.ville)}</div>
        <div class="styles">${t.styles.map(s => `<span class="style-tag">${esc(s)}</span>`).join('')}</div>
        <div class="card-footer">
          <div class="tarif">${tarifHtml}</div>
        </div>
      </div>
    </div>`;
}

// Inject into style/city pages
function injectStyleCityPages(tatoueurs) {
  const dir = __dirname;
  const files = fs.readdirSync(dir).filter(f => /^tatoueur-.+-.+\.html$/.test(f));
  let injected = 0;

  for (const file of files) {
    const match = file.match(/^tatoueur-(.+)-(.+)\.html$/);
    if (!match) continue;
    const [, styleSlug, citySlug] = match;

    // Filter artists matching this style/city
    const filtered = tatoueurs.filter(t => {
      const matchStyle = t.styles.some(s =>
        s.toLowerCase().replace(/[éè]/g, 'e').replace(/[- ]/g, '') ===
        styleSlug.toLowerCase().replace(/-/g, '')
      );
      const matchVille = villeBase(t.ville).toLowerCase() === citySlug.toLowerCase();
      return matchStyle && matchVille;
    });

    const filepath = path.join(dir, file);
    let html = fs.readFileSync(filepath, 'utf-8');

    // 1. Inject tatoueurs data into JS variable
    const safeData = filtered.map(t => ({
      id: t.id, nom: t.nom, nomComplet: t.nomComplet, ville: t.ville,
      region: t.region, styles: t.styles, tarif: t.tarif,
      instagram: t.instagram, bio: t.bio, verifie: t.verifie,
      photo: t.photo, photos: t.photos, emoji: t.emoji,
    }));
    html = html.replace(
      /const tatoueurs\s*=\s*\[\];/,
      `const tatoueurs = ${JSON.stringify(safeData)};`
    );

    // 2. Inject pre-rendered HTML cards into the grid
    if (filtered.length > 0) {
      const cardsHtml = filtered.map(buildStaticCard).join('\n');
      html = html.replace(
        '<div class="grid" id="grid"></div>',
        `<div class="grid" id="grid">\n${cardsHtml}\n</div>`
      );
      // Update the stats number
      html = html.replace(
        '<div class="seo-stat-num" id="nb-resultats">—</div>',
        `<div class="seo-stat-num" id="nb-resultats">${filtered.length}</div>`
      );
    }

    // 3. Set index/noindex based on whether there are results
    if (filtered.length > 0) {
      html = html.replace(
        '<meta name="robots" content="noindex, follow" />',
        '<meta name="robots" content="index, follow" />'
      );
    } else {
      html = html.replace(
        '<meta name="robots" content="index, follow" />',
        '<meta name="robots" content="noindex, follow" />'
      );
    }

    // 4. Build ItemList schema for pages with results
    if (filtered.length > 0) {
      const itemListSchema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Tatoueurs ${styleSlug} à ${citySlug}`,
        "numberOfItems": filtered.length,
        "itemListElement": filtered.map((t, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": t.nom,
          "description": `Tatoueur ${t.styles[0] || ''} à ${t.ville}`,
        }))
      });
      // Insert before closing </head>
      html = html.replace(
        '</head>',
        `  <script type="application/ld+json">\n  ${itemListSchema}\n  </script>\n</head>`
      );
    }

    fs.writeFileSync(filepath, html, 'utf-8');
    if (filtered.length > 0) {
      console.log(`✅ ${file} — ${filtered.length} artiste(s) injecté(s)`);
      injected++;
    } else {
      console.log(`⬚  ${file} — 0 résultat (noindex)`);
    }
  }
  return injected;
}

// Inject into homepage (index.html)
function injectHomepage(tatoueurs) {
  const filepath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(filepath, 'utf-8');

  // Inject tatoueurs data into JS
  const safeData = tatoueurs.map(t => ({
    id: t.id, nom: t.nom, nomComplet: t.nomComplet, ville: t.ville,
    region: t.region, styles: t.styles, tarif: t.tarif,
    instagram: t.instagram, bio: t.bio, verifie: t.verifie,
    photo: t.photo, photos: t.photos, emoji: t.emoji,
    createdAt: t.createdAt,
  }));
  html = html.replace(
    /const tatoueurs\s*=\s*\[\];/,
    `const tatoueurs = ${JSON.stringify(safeData)};`
  );

  // Pre-render cards into the grid (replace skeleton loaders)
  const gridRegex = /(<div class="grid" id="grid">)([\s\S]*?)(<\/div>\s*<div class="pagination")/;
  const gridMatch = html.match(gridRegex);
  if (gridMatch) {
    const cardsHtml = tatoueurs.map(buildStaticCard).join('\n');
    html = html.replace(gridRegex, `$1\n${cardsHtml}\n$3`);
  }

  // Update counters
  const villes = [...new Set(tatoueurs.map(t => villeBase(t.ville).toLowerCase()))].length;
  const styles = [...new Set(tatoueurs.flatMap(t => t.styles))].length;

  html = html.replace(
    /id="nb-tatoueurs" data-value="\d+"/,
    `id="nb-tatoueurs" data-value="${tatoueurs.length}"`
  );
  html = html.replace(
    /<span itemprop="value" id="nb-tatoueurs-val">\d+<\/span>/,
    `<span itemprop="value" id="nb-tatoueurs-val">${tatoueurs.length}</span>`
  );

  fs.writeFileSync(filepath, html, 'utf-8');
  console.log(`\n✅ index.html — ${tatoueurs.length} artistes injectés`);
}

// Update sitemap based on which pages have content
function updateSitemap(tatoueurs) {
  const today = new Date().toISOString().split('T')[0];
  const dir = __dirname;
  const files = fs.readdirSync(dir).filter(f => /^tatoueur-.+-.+\.html$/.test(f));

  const pagesWithContent = [];
  for (const file of files) {
    const match = file.match(/^tatoueur-(.+)-(.+)\.html$/);
    if (!match) continue;
    const [, styleSlug, citySlug] = match;
    const hasResults = tatoueurs.some(t => {
      const matchStyle = t.styles.some(s =>
        s.toLowerCase().replace(/[éè]/g, 'e').replace(/[- ]/g, '') ===
        styleSlug.toLowerCase().replace(/-/g, '')
      );
      const matchVille = villeBase(t.ville).toLowerCase() === citySlug.toLowerCase();
      return matchStyle && matchVille;
    });
    if (hasResults) {
      pagesWithContent.push(`tatoueur-${styleSlug}-${citySlug}`);
    }
  }

  const staticPages = [
    { loc: '/', priority: '1.0' },
    { loc: '/inscription', priority: '0.9' },
    { loc: '/rejoindre', priority: '0.9' },
    { loc: '/faq', priority: '0.7' },
    { loc: '/guide/trouver-clients-tatoueur', priority: '0.7' },
    { loc: '/guide/referencer-studio-tatouage-gratuit', priority: '0.7' },
    { loc: '/outils/calculateur-tarif-tatouage', priority: '0.7' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const p of staticPages) {
    xml += `  <url><loc>https://inkmap.fr${p.loc}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>\n`;
  }
  for (const slug of pagesWithContent.sort()) {
    xml += `  <url><loc>https://inkmap.fr/${slug}</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>\n`;
  }
  xml += `</urlset>\n`;

  fs.writeFileSync(path.join(dir, 'sitemap.xml'), xml, 'utf-8');
  console.log(`\n✅ sitemap.xml — ${staticPages.length + pagesWithContent.length} URLs (${pagesWithContent.length} pages style/ville)`);
}

async function main() {
  console.log('🔄 Fetch Airtable...');
  const records = await fetchAllRecords();
  console.log(`   ${records.length} records récupérés\n`);

  const tatoueurs = parseRecords(records);
  console.log(`   ${tatoueurs.length} profils valides\n`);

  console.log('── Injection pages style/ville ──');
  const injected = injectStyleCityPages(tatoueurs);

  console.log('\n── Injection homepage ──');
  injectHomepage(tatoueurs);

  console.log('\n── Mise à jour sitemap ──');
  updateSitemap(tatoueurs);

  console.log(`\n🎉 Build terminé ! ${injected} pages avec contenu, ${tatoueurs.length} artistes injectés.`);
}

main().catch(e => { console.error('❌ Erreur:', e); process.exit(1); });
