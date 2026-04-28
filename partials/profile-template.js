// Template page profil tatoueur — Inkmap
// Export : buildProfilePage({ tatoueur, slug, qrSvg, linkToStyleCity })

const fs = require('fs');
const path = require('path');

const HEADER_HTML = fs.readFileSync(path.join(__dirname, 'header.html'), 'utf-8');
const FOOTER_HTML = fs.readFileSync(path.join(__dirname, 'footer.html'), 'utf-8');

function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(s) { return escHtml(s); }

function buildProfilePage({ tatoueur: t, slug, qrSvg, linkToStyleCity }) {
  const displayName = t.pseudo || t.nom;
  const url = `https://inkmap.fr/tatoueur/${slug}`;
  const mainStyle = (t.styles && t.styles[0]) || '';
  const styleSuffix = mainStyle ? ` ${mainStyle.toLowerCase()}` : '';
  const role = `Tatoueur${styleSuffix} à ${t.ville}`;

  // Bio auto-générée en fallback — garantit du contenu SEO même sans bio rédigée
  const topStyles = (t.styles || []).slice(0, 3).map(s => s.toLowerCase());
  const autoBio = `${displayName} est tatoueur à ${t.ville}` +
    (topStyles.length ? `, spécialisé en ${topStyles.join(', ')}` : '') +
    '. Découvre son portfolio ci-dessous.';
  const bioText = t.bio || autoBio;

  const title = `${displayName} — Tatoueur${styleSuffix} à ${t.ville} | Inkmap`;
  const rawDesc = `${displayName}, tatoueur${styleSuffix} à ${t.ville}. ` +
    (t.bio ? t.bio.slice(0, 90) + '…' : 'Portfolio, tarifs et contact. Prise de RDV via Instagram.');
  const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + '…' : rawDesc;

  const instaHandle = (t.instagram || '').replace(/^@/, '').trim();
  const instaUrl = instaHandle ? `https://instagram.com/${instaHandle}` : '';
  const siteUrl = t.site || '';

  // Cover : photo uploadée si dispo, sinon thumbnail Insta scrapée
  const coverImg = (t.photos && t.photos[0]) || (t.instagramThumb || '');

  // Posts Insta à embarquer (uniquement pour profils non-revendiqués + kill-switch off)
  const showInstaEmbeds = !t.verifie
    && !t.instagramEmbedDisabled
    && Array.isArray(t.instagramPosts)
    && t.instagramPosts.length > 0;
  const instaPosts = showInstaEmbeds ? t.instagramPosts.slice(0, 3) : [];

  // Profils externes (Instagram, site perso) pour sameAs
  const sameAs = [instaUrl, siteUrl].filter(Boolean);

  // JSON-LD TattooParlor
  const schemaTattoo = {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: displayName,
    url,
    ...(coverImg ? { image: t.photos } : {}),
    description: bioText,
    address: {
      '@type': 'PostalAddress',
      ...(t.adresse ? { streetAddress: t.adresse } : {}),
      addressLocality: t.ville,
      ...(t.region ? { addressRegion: t.region } : {}),
      addressCountry: 'FR',
    },
    ...(t.tarif ? { priceRange: `${t.tarif}€ / heure` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  // JSON-LD Breadcrumb
  const schemaBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inkmap', item: 'https://inkmap.fr/' },
      { '@type': 'ListItem', position: 2, name: `Tatoueurs ${t.ville}`, item: `https://inkmap.fr/#ville=${encodeURIComponent(t.ville)}` },
      { '@type': 'ListItem', position: 3, name: displayName, item: url },
    ],
  };

  // JSON-LD Person (identité)
  const schemaPerson = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    jobTitle: 'Tatoueur',
    url,
    ...(sameAs.length ? { sameAs } : {}),
    workLocation: { '@type': 'Place', name: t.ville },
  };

  // Galerie photos
  const galleryHtml = (t.photos || [])
    .map((p, i) => `<figure class="flash-item" data-src="${escAttr(p)}" onclick="openLightbox(${i})">
      <img src="${escAttr(p)}" alt="Tatouage par ${escAttr(displayName)} — ${escAttr(mainStyle || 'tatouage')} à ${escAttr(t.ville)}" loading="lazy" />
    </figure>`)
    .join('');

  // Tags styles — avec liens vers pages style×ville quand dispo
  const stylesHtml = (t.styles || [])
    .map(s => {
      const link = linkToStyleCity ? linkToStyleCity(s, t.ville) : null;
      return link
        ? `<a href="${link}" class="style-tag-link">${escHtml(s)}</a>`
        : `<span class="style-tag-static">${escHtml(s)}</span>`;
    })
    .join('');

  const photosJsonArray = JSON.stringify((t.photos || []).map(String));

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escAttr(description)}" />
  <link rel="canonical" href="${url}" />
  <meta name="robots" content="index, follow" />

  <meta property="og:title" content="${escAttr(displayName + ' — Tatoueur' + styleSuffix + ' à ' + t.ville)}" />
  <meta property="og:description" content="${escAttr(description)}" />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content="${url}" />
  ${coverImg ? `<meta property="og:image" content="${escAttr(coverImg)}" />` : ''}
  <meta property="og:site_name" content="Inkmap" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(displayName)} — Tatoueur${escAttr(styleSuffix)} à ${escAttr(t.ville)}" />
  <meta name="twitter:description" content="${escAttr(description)}" />
  ${coverImg ? `<meta name="twitter:image" content="${escAttr(coverImg)}" />` : ''}

  <meta name="theme-color" content="#c0392b" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  <script type="application/ld+json">${JSON.stringify(schemaTattoo)}</script>
  <script type="application/ld+json">${JSON.stringify(schemaBreadcrumb)}</script>
  <script type="application/ld+json">${JSON.stringify(schemaPerson)}</script>

  <link rel="stylesheet" href="/styles.css" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

  <style>
    /* ── PROFILE HERO ── */
    .profile-hero {
      position: relative;
      padding: 120px 56px 56px;
      overflow: hidden;
      border-bottom: 1px solid var(--border);
    }
    .profile-hero-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #f5f5f5 0%, #eaeaea 100%);
      z-index: 0;
    }
    .profile-hero-inner {
      position: relative; z-index: 1;
      max-width: 980px; margin: 0 auto;
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 48px;
      align-items: start;
    }
    .profile-cover {
      width: 320px; height: 320px;
      border-radius: 4px;
      overflow: hidden;
      background: var(--surface);
      box-shadow: 0 20px 60px rgba(0,0,0,0.12);
    }
    .profile-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .profile-cover-empty {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
      font-family: 'Syne', sans-serif;
      font-size: 0.75rem; color: var(--muted);
      letter-spacing: 3px; text-transform: uppercase;
    }

    .profile-tag {
      font-family: 'Space Mono', monospace;
      font-size: 0.62rem; color: var(--accent);
      text-transform: uppercase; letter-spacing: 3px;
      margin-bottom: 12px;
    }
    .profile-hero h1 {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2.2rem, 4.5vw, 3.6rem);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -1px;
      line-height: 1;
      margin-bottom: 16px;
      color: var(--text);
    }
    .profile-hero h1 em { font-style: normal; color: var(--accent); }
    .profile-role {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.05rem;
      font-weight: 500;
      color: var(--muted2);
      margin-bottom: 18px;
      letter-spacing: 0.2px;
    }
    .profile-meta {
      display: flex; flex-wrap: wrap; gap: 16px;
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem; color: var(--muted2);
      text-transform: uppercase; letter-spacing: 1.5px;
      margin-bottom: 20px;
    }
    .profile-meta span { display: inline-flex; align-items: center; gap: 6px; }
    .profile-meta strong { color: var(--text); font-weight: 700; }

    .profile-badge-verified {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(39,174,96,0.08);
      border: 1px solid rgba(39,174,96,0.25);
      color: #1e8a4c;
      font-family: 'Space Mono', monospace;
      font-size: 0.65rem; letter-spacing: 1px;
      padding: 4px 10px; border-radius: 2px;
      text-transform: uppercase;
    }
    .profile-badge-unclaimed {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(192,57,43,0.06);
      border: 1px solid rgba(192,57,43,0.2);
      color: var(--accent);
      font-family: 'Space Mono', monospace;
      font-size: 0.65rem; letter-spacing: 1px;
      padding: 4px 10px; border-radius: 2px;
      text-transform: uppercase;
    }

    .profile-style-tags {
      display: flex; flex-wrap: wrap; gap: 6px;
      margin-bottom: 24px;
    }
    .style-tag-link, .style-tag-static {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--text);
      text-decoration: none;
      letter-spacing: 0.5px;
      transition: all .15s;
    }
    .style-tag-link:hover {
      border-color: var(--accent); color: var(--accent);
      background: rgba(192,57,43,0.04);
    }

    .profile-actions {
      display: flex; gap: 12px; flex-wrap: wrap;
    }
    .profile-cta-primary, .profile-cta-secondary {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 14px 24px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.82rem; font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      text-decoration: none;
      border-radius: 3px;
      transition: all .15s;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .profile-cta-primary {
      background: var(--accent); color: #fff;
    }
    .profile-cta-primary:hover { background: var(--text); }
    .profile-cta-secondary {
      background: transparent; color: var(--text);
      border-color: var(--border);
    }
    .profile-cta-secondary:hover { border-color: var(--text); }

    /* ── SECTIONS ── */
    .profile-section {
      max-width: 980px; margin: 0 auto;
      padding: 56px;
      border-bottom: 1px solid var(--border);
    }
    .profile-section-alt { background: var(--surface); }
    .profile-section-title {
      font-family: 'Syne', sans-serif;
      font-size: 1.1rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: -0.5px;
      margin-bottom: 24px;
      color: var(--text);
      display: flex; align-items: center; gap: 12px;
    }
    .profile-section-title::before {
      content: ''; display: inline-block;
      width: 20px; height: 2px; background: var(--accent);
    }
    .profile-bio {
      color: var(--muted2);
      font-size: 0.98rem; line-height: 1.75;
      max-width: 720px;
      white-space: pre-wrap;
    }

    /* ── GRID INFOS ── */
    .profile-infos {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 24px;
    }
    .info-block {
      padding: 20px; border: 1px solid var(--border);
      border-radius: 4px; background: var(--card);
    }
    .info-label {
      font-family: 'Space Mono', monospace;
      font-size: 0.6rem; color: var(--muted);
      text-transform: uppercase; letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .info-value {
      font-family: 'Syne', sans-serif;
      font-size: 1.4rem; font-weight: 700;
      color: var(--text);
    }
    .info-value small {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.7rem; font-weight: 400; color: var(--muted2);
      margin-left: 4px;
    }
    .info-value-sm {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.95rem; font-weight: 500;
      line-height: 1.4;
    }
    .info-detail {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.82rem; color: var(--muted2);
      margin-top: 8px; line-height: 1.4;
    }

    /* ── GALERIE ── */
    .profile-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 8px;
    }
    .flash-item {
      aspect-ratio: 1/1; overflow: hidden;
      cursor: pointer;
      background: var(--surface);
      border-radius: 2px;
    }
    .flash-item img {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform .4s ease;
    }
    .flash-item:hover img { transform: scale(1.04); }
    .profile-no-photos {
      padding: 32px; border: 1px dashed var(--border); border-radius: 4px;
      color: var(--muted2); font-size: 0.9rem; text-align: center;
    }

    /* ── LIGHTBOX ── */
    .lightbox {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.92);
      display: none; align-items: center; justify-content: center;
      z-index: 10001; padding: 24px;
    }
    .lightbox.open { display: flex; }
    .lightbox img {
      max-width: 92%; max-height: 88%;
      object-fit: contain; display: block;
      box-shadow: 0 30px 100px rgba(0,0,0,0.8);
    }
    .lightbox-close {
      position: absolute; top: 20px; right: 24px;
      background: none; border: 0; color: #fff;
      font-size: 2rem; cursor: pointer; line-height: 1;
    }
    .lightbox-nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,0.1); border: 0; color: #fff;
      width: 48px; height: 48px; border-radius: 50%;
      font-size: 1.5rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .lightbox-prev { left: 20px; }
    .lightbox-next { right: 20px; }

    /* ── QR CODE ── */
    .profile-qr {
      display: flex; gap: 32px; align-items: center; flex-wrap: wrap;
    }
    .qr-box {
      width: 180px; height: 180px;
      padding: 16px; background: #fff;
      border: 1px solid var(--border); border-radius: 4px;
    }
    .qr-box svg { width: 100%; height: 100%; display: block; }
    .qr-info {
      flex: 1; min-width: 220px;
    }
    .qr-info p {
      color: var(--muted2); font-size: 0.9rem;
      line-height: 1.6; margin-bottom: 16px;
    }

    /* ── CTA JOIN ── */
    .cta-join {
      background: var(--text); color: #fff;
      padding: 56px; text-align: center;
    }
    .cta-join h2 {
      font-family: 'Syne', sans-serif;
      font-size: 1.8rem; font-weight: 800;
      text-transform: uppercase; margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    .cta-join p {
      color: rgba(255,255,255,0.65);
      font-size: 0.95rem; margin-bottom: 24px;
    }
    .cta-join a {
      display: inline-block;
      background: var(--accent); color: #fff;
      padding: 14px 32px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1.5px;
      text-decoration: none; border-radius: 3px;
      transition: background .15s;
    }
    .cta-join a:hover { background: #fff; color: var(--text); }

    /* ── EMBEDS INSTAGRAM ── */
    /* Insta force min-width: 326px sur ses iframes — flexbox pour layout prévisible 1/2/3 posts */
    .insta-embeds-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 8px;
    }
    .insta-embed-cell {
      position: relative;
      flex: 1 1 340px;
      max-width: 480px;
      min-height: 480px;
      border-radius: 4px;
      overflow: hidden;
      background: linear-gradient(135deg, #f5f5f5, #ebebeb);
    }
    .insta-embed-cell.is-loading::before {
      content: '';
      position: absolute; inset: 0;
      background:
        linear-gradient(110deg, rgba(255,255,255,0) 25%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 75%)
        no-repeat,
        linear-gradient(135deg, #f5f5f5, #ebebeb);
      background-size: 200% 100%, 100% 100%;
      animation: insta-shimmer 1.6s linear infinite;
    }
    @keyframes insta-shimmer { from { background-position: -100% 0, 0 0; } to { background-position: 100% 0, 0 0; } }
    .insta-embed-cell blockquote.instagram-media {
      margin: 0 !important;
      max-width: 100% !important;
      min-width: 0 !important;
      width: 100% !important;
      box-shadow: none !important;
      border: 1px solid var(--border) !important;
      border-radius: 4px !important;
    }
    .insta-fallback {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 12px;
      height: 100%; min-height: 480px;
      padding: 24px; text-align: center;
      background: linear-gradient(135deg, #fafafa, #efefef);
      color: var(--muted2);
      text-decoration: none;
      border: 1px dashed var(--border);
      border-radius: 4px;
    }
    .insta-fallback strong {
      font-family: 'Syne', sans-serif;
      font-size: 1.1rem; color: var(--text);
      letter-spacing: -0.3px;
    }
    .insta-fallback span {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem; letter-spacing: 1px;
      color: var(--accent); text-transform: uppercase;
    }
    .insta-claim-cta {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
      margin-top: 24px;
      padding: 16px 20px;
      background: rgba(192,57,43,0.04);
      border: 1px solid rgba(192,57,43,0.15);
      border-radius: 4px;
    }
    .insta-claim-cta p {
      margin: 0; font-size: 0.88rem; color: var(--muted2);
    }
    .insta-claim-cta a {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.78rem; font-weight: 600;
      color: var(--accent);
      text-decoration: none;
      white-space: nowrap;
      letter-spacing: 0.3px;
    }
    .insta-claim-cta a:hover { text-decoration: underline; }
    .insta-disclaimer {
      margin-top: 12px;
      font-family: 'Space Mono', monospace;
      font-size: 0.62rem;
      color: var(--muted);
      letter-spacing: 0.5px;
    }

    /* ── RESPONSIVE EMBEDS ── */
    @media (max-width: 720px) {
      .insta-embeds-grid { gap: 14px; }
      .insta-embed-cell { flex: 1 1 100%; max-width: 100%; min-height: 400px; }
      .insta-fallback { min-height: 400px; }
    }

    @media (max-width: 900px) {
      .profile-hero { padding: 96px 20px 40px; }
      .profile-hero-inner {
        grid-template-columns: 200px 1fr;
        gap: 24px;
      }
      .profile-cover {
        width: 200px; height: 200px;
      }
      .profile-section { padding: 40px 20px; }
      .cta-join { padding: 40px 20px; }
      .profile-hero h1 { font-size: clamp(1.8rem, 6vw, 2.4rem); }
    }
    @media (max-width: 600px) {
      .profile-hero-inner {
        grid-template-columns: 120px 1fr;
        gap: 16px;
      }
      .profile-cover { width: 120px; height: 120px; }
      .profile-hero h1 { font-size: clamp(1.4rem, 6vw, 1.8rem); margin-bottom: 10px; }
      .profile-tag { font-size: 0.55rem; margin-bottom: 8px; letter-spacing: 2px; }
      .profile-role { font-size: 0.9rem; margin-bottom: 12px; }
      .profile-meta { font-size: 0.65rem; gap: 10px; margin-bottom: 14px; }
      .profile-style-tags { margin-bottom: 16px; }
    }
  </style>
</head>
<body>

${HEADER_HTML}

<!-- HERO -->
<section class="profile-hero">
  <div class="profile-hero-inner">
    <div class="profile-cover">
      ${coverImg
        ? `<img src="${escAttr(coverImg)}" alt="Portfolio ${escAttr(displayName)} — tatoueur à ${escAttr(t.ville)}" />`
        : `<div class="profile-cover-empty">Aucune photo</div>`}
    </div>
    <div>
      <div class="profile-tag">Profil tatoueur · ${escHtml(t.ville)}${t.region ? ' · ' + escHtml(t.region) : ''}</div>
      <h1>${escHtml(displayName)}</h1>
      <p class="profile-role">${escHtml(role)}</p>
      <div class="profile-meta">
        ${instaHandle ? `<span><strong>@${escHtml(instaHandle)}</strong></span>` : ''}
        <span>📍 ${escHtml(t.ville)}</span>
        ${t.verifie
          ? `<span class="profile-badge-verified">✓ Vérifié</span>`
          : `<span class="profile-badge-unclaimed">Profil non réclamé</span>`}
      </div>
      ${stylesHtml ? `<div class="profile-style-tags">${stylesHtml}</div>` : ''}
      <div class="profile-actions">
        ${instaUrl
          ? `<a href="${escAttr(instaUrl)}" target="_blank" rel="noopener noreferrer" class="profile-cta-primary">Contacter sur Instagram →</a>`
          : ''}
        ${siteUrl
          ? `<a href="${escAttr(siteUrl)}" target="_blank" rel="noopener noreferrer" class="profile-cta-secondary">Site web →</a>`
          : ''}
        <a href="#portfolio" class="profile-cta-secondary">Voir le portfolio</a>
      </div>
    </div>
  </div>
</section>

<!-- À PROPOS -->
<section class="profile-section">
  <h2 class="profile-section-title">À propos</h2>
  <p class="profile-bio">${escHtml(bioText)}</p>
</section>

<!-- INFOS -->
<section class="profile-section profile-section-alt">
  <h2 class="profile-section-title">Infos</h2>
  <div class="profile-infos">
    ${t.tarif ? `
    <div class="info-block">
      <div class="info-label">Tarif horaire</div>
      <div class="info-value">${escHtml(t.tarif)}€<small>/h</small></div>
      ${t.tarifInfo ? `<div class="info-detail">${escHtml(t.tarifInfo)}</div>` : ''}
    </div>` : ''}
    <div class="info-block">
      <div class="info-label">Ville</div>
      <div class="info-value">${escHtml(t.ville)}</div>
      ${t.region ? `<div class="info-detail">${escHtml(t.region)}</div>` : ''}
    </div>
    ${t.adresse ? `
    <div class="info-block">
      <div class="info-label">Adresse</div>
      <div class="info-value info-value-sm">${escHtml(t.adresse)}</div>
    </div>` : ''}
    ${t.styles && t.styles.length ? `
    <div class="info-block">
      <div class="info-label">Spécialité</div>
      <div class="info-value">${escHtml(t.styles[0])}</div>
    </div>` : ''}
  </div>
</section>

${showInstaEmbeds ? `
<!-- APERÇU INSTAGRAM (profils non-revendiqués uniquement) -->
<section class="profile-section" id="apercu-instagram">
  <h2 class="profile-section-title">Aperçu Instagram</h2>
  <div class="insta-embeds-grid" id="insta-embeds-grid" data-insta-handle="${escAttr(instaHandle)}">
    ${instaPosts.map((postUrl, i) => `
    <div class="insta-embed-cell is-loading" data-insta-url="${escAttr(postUrl)}" data-insta-idx="${i}">
      <blockquote class="instagram-media" data-instgrm-permalink="${escAttr(postUrl)}" data-instgrm-version="14" style="margin:0;max-width:100%;width:100%;min-width:0"></blockquote>
    </div>`).join('')}
  </div>
  <p class="insta-disclaimer">Photos affichées via l'embed officiel Instagram — chaque image renvoie au compte source. Aucune copie hébergée.</p>
  <div class="insta-claim-cta">
    <p>C'est ton compte ? Reprends la main sur cette page Inkmap en quelques secondes.</p>
    <a href="/inscription.html?nom=${encodeURIComponent(t.nom)}&ville=${encodeURIComponent(t.ville)}${t.instagram ? '&instagram=' + encodeURIComponent(t.instagram) : ''}${t.type === 'Studio' ? '&type=studio' : ''}">Réclamer ce profil →</a>
  </div>
</section>` : ''}

<!-- PORTFOLIO -->
<section class="profile-section" id="portfolio">
  <h2 class="profile-section-title">Portfolio</h2>
  ${galleryHtml
    ? `<div class="profile-gallery">${galleryHtml}</div>`
    : `<div class="profile-no-photos">Le portfolio arrive bientôt.${!t.verifie ? ' <a href="/inscription.html?nom=' + encodeURIComponent(t.nom) + (t.type === 'Studio' ? '&type=studio' : '') + '" style="color:var(--accent)">Vous êtes ' + escHtml(displayName) + ' ? Réclamez ce profil →</a>' : ''}</div>`}
</section>

${qrSvg ? `
<!-- QR CODE -->
<section class="profile-section profile-section-alt">
  <h2 class="profile-section-title">Partage rapide</h2>
  <div class="profile-qr">
    <div class="qr-box" id="qr-box">${qrSvg}</div>
    <div class="qr-info">
      <p>Scanne ce QR code ou partage-le sur ta carte de visite. Il redirige directement vers ta page Inkmap.</p>
      <a href="${url}" class="profile-cta-secondary" onclick="downloadQR(event)">Télécharger le QR (PNG)</a>
    </div>
  </div>
</section>` : ''}

<!-- CTA JOIN -->
<section class="cta-join">
  <h2>${t.verifie ? `Envie d'apparaître comme ` + escHtml(displayName) + ` ?` : `Tu es ` + escHtml(displayName) + ` ?`}</h2>
  <p>${t.verifie ? `Rejoins Inkmap, l'annuaire tatoueurs de France.` : `Réclame gratuitement ce profil et reprends la main dessus.`}</p>
  <a href="/inscription.html${!t.verifie ? '?nom=' + encodeURIComponent(t.nom) + '&ville=' + encodeURIComponent(t.ville) + (t.instagram ? '&instagram=' + encodeURIComponent(t.instagram) : '') + (t.type === 'Studio' ? '&type=studio' : '') : ''}">${t.verifie ? 'Inscrire mon studio →' : 'Réclamer ce profil →'}</a>
</section>

${t.verifie ? `
<!-- EDIT LINK (profils vérifiés uniquement) -->
<section style="text-align:center;padding:24px 20px 40px;border-top:1px solid var(--border);background:#fafafa">
  <p style="font-size:0.85rem;color:var(--muted);margin:0">
    Tu es ${escHtml(displayName)} ?
    <a href="/modifier" style="color:var(--accent);text-decoration:none;font-weight:600">Modifier mon profil →</a>
  </p>
</section>` : ''}

<!-- LIGHTBOX -->
<div class="lightbox" id="lightbox" onclick="if(event.target.id==='lightbox')closeLightbox()">
  <button class="lightbox-close" onclick="closeLightbox()" aria-label="Fermer">✕</button>
  <button class="lightbox-nav lightbox-prev" onclick="lightboxPrev()" aria-label="Précédent">‹</button>
  <img id="lightbox-img" src="" alt="" />
  <button class="lightbox-nav lightbox-next" onclick="lightboxNext()" aria-label="Suivant">›</button>
</div>

${FOOTER_HTML}

<script>
const PHOTOS = ${photosJsonArray};
let currentIdx = 0;

function openLightbox(idx) {
  if (!PHOTOS.length) return;
  currentIdx = idx;
  document.getElementById('lightbox-img').src = PHOTOS[idx];
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
function lightboxPrev() {
  currentIdx = (currentIdx - 1 + PHOTOS.length) % PHOTOS.length;
  document.getElementById('lightbox-img').src = PHOTOS[currentIdx];
}
function lightboxNext() {
  currentIdx = (currentIdx + 1) % PHOTOS.length;
  document.getElementById('lightbox-img').src = PHOTOS[currentIdx];
}
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
});

function downloadQR(e) {
  e.preventDefault();
  const svg = document.querySelector('#qr-box svg');
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const dataUrl = URL.createObjectURL(blob);
  img.onload = () => {
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(dataUrl);
    canvas.toBlob(b => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(b);
      link.download = 'inkmap-qr-${slug}.png';
      link.click();
    });
  };
  img.src = dataUrl;
}

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const ouvert = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', ouvert);
    hamburger.setAttribute('aria-expanded', ouvert);
    document.body.style.overflow = ouvert ? 'hidden' : '';
  });
}
function fermerMenu() {
  mobileNav.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
window.addEventListener('resize', () => { if (window.innerWidth > 768) fermerMenu(); });

// ── LAZY-LOAD EMBEDS INSTAGRAM ────────────────────────────────────────────
(function() {
  const grid = document.getElementById('insta-embeds-grid');
  if (!grid) return;
  const cells = Array.from(grid.querySelectorAll('.insta-embed-cell'));
  if (!cells.length) return;
  const handle = grid.dataset.instaHandle || '';
  let scriptInjected = false;
  let processCalled = false;

  function injectScriptOnce() {
    if (scriptInjected) return;
    scriptInjected = true;
    const s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (window.instgrm && window.instgrm.Embeds) {
        try { window.instgrm.Embeds.process(); processCalled = true; } catch (e) {}
      }
    };
    document.body.appendChild(s);
  }

  function processIfReady() {
    if (processCalled) return;
    if (window.instgrm && window.instgrm.Embeds) {
      try { window.instgrm.Embeds.process(); processCalled = true; } catch (e) {}
    }
  }

  function makeFallback(cell) {
    if (!cell.classList.contains('is-loading')) return; // déjà rendu
    const url = cell.dataset.instaUrl || '';
    const profileUrl = handle ? 'https://instagram.com/' + handle : url;
    cell.classList.remove('is-loading');
    cell.innerHTML =
      '<a class="insta-fallback" href="' + profileUrl + '" target="_blank" rel="noopener noreferrer">' +
      '<strong>Voir sur Instagram</strong>' +
      (handle ? '<span>@' + handle + '</span>' : '') +
      '</a>';
  }

  // Une fois l'iframe Insta présente → enlève le shimmer.
  const mo = new MutationObserver(() => {
    cells.forEach(cell => {
      if (cell.querySelector('iframe')) cell.classList.remove('is-loading');
    });
  });
  mo.observe(grid, { childList: true, subtree: true });

  // Watchdog : après 7s, toute cellule encore "loading" → fallback.
  setTimeout(() => {
    cells.forEach(cell => {
      if (cell.classList.contains('is-loading') || !cell.querySelector('iframe')) {
        makeFallback(cell);
      }
    });
    mo.disconnect();
  }, 7000);

  // Lazy-load : on injecte embed.js dès qu'une cellule approche du viewport.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        injectScriptOnce();
        processIfReady();
        io.disconnect();
      }
    }, { rootMargin: '300px 0px' });
    cells.forEach(c => io.observe(c));
  } else {
    // Pas d'IntersectionObserver → injection directe.
    injectScriptOnce();
  }
})();
</script>

</body>
</html>`;
}

module.exports = { buildProfilePage };
