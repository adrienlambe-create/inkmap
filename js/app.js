// Échappement HTML — protège contre les injections XSS via innerHTML
function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

const tatoueurs = [];



let styleActif = "";
let villeActive = "";

function getBudgetLabel(t) { return t < 100 ? "low" : t <= 200 ? "mid" : "high"; }

// Normalise une ville en ville principale (retire les arrondissements)
function villeBase(ville) {
  if (!ville) return '';
  return ville.trim().replace(/\s+\d+(e|er|ème|eme|ième|ieme)?\s*$/i, '').trim() || ville.trim();
}

function mettreAJourTags() {
  const bar = document.getElementById('filtres-actifs-bar');
  const tags = [];
  if (styleActif) {
    tags.push(`<button class="filtre-tag" onclick="supprimerFiltreStyle()">${esc(styleActif)} <span>×</span></button>`);
  }
  if (villeActive) {
    tags.push(`<button class="filtre-tag" onclick="supprimerFiltreVille()">${esc(villeActive)} <span>×</span></button>`);
  }
  bar.innerHTML = tags.join('');
  bar.classList.toggle('visible', tags.length > 0);
}

function supprimerFiltreStyle() {
  styleActif = "";
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const btnTous = document.querySelector('.filter-btn');
  if (btnTous) btnTous.classList.add('active');
  mettreAJourTags();
  filtrer();
}

function supprimerFiltreVille() {
  villeActive = "";
  mettreAJourTags();
  filtrer();
}

function appliquerFiltreStyle(style) {
  styleActif = style;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.textContent.trim() === style));
  mettreAJourTags();
  filtrer();
}

function filtreVille(ville) {
  villeActive = ville;
  mettreAJourTags();
  filtrer();
}

function resetVille() {
  villeActive = "";
  mettreAJourTags();
  filtrer();
}

function renderCard(t) {
  const profileHref = t.slug ? `/tatoueur/${t.slug}` : '#';
  return `
    <a class="card card-link" href="${profileHref}" style="text-decoration:none;color:inherit;display:block">
      <div class="card-img">${cardMedia(t)}</div>
      <div class="card-body">
        <div class="card-top">
          <div class="card-name">${esc(t.nom)}</div>
          ${t.isNouveau ? '<span class="badge-nouveau">Nouveau</span>' : ''}${t.verifie ? '<span class="badge-verifie">✓ Vérifié</span>' : ''}
        </div>
        <div class="card-location">${esc(t.ville)}</div>
        <div class="styles">${t.styles.map(s=>`<span class="style-tag" onclick="event.preventDefault();event.stopPropagation();appliquerFiltreStyle('${esc(s)}')" title="Filtrer par ${esc(s)}" style="cursor:pointer">${esc(s)}</span>`).join('')}</div>
        <div class="card-footer">
          <div class="tarif">${t.tarif > 0 ? t.tarif + '€ <small>/ heure</small>' : '<small style="font-family:\'Space Mono\',monospace;font-size:0.72rem;color:var(--muted2);font-weight:400;letter-spacing:0">Sur devis</small>'}</div>
          <div class="card-actions">
            <span class="btn-voir">Voir →</span>
            ${t.instagram ? `<span class="btn-insta" role="link" tabindex="0" onclick="event.stopPropagation();event.preventDefault();window.open('https://www.instagram.com/${encodeURIComponent(t.instagram.replace('@',''))}','_blank','noopener,noreferrer')" style="cursor:pointer;display:flex;align-items:center;justify-content:center">Insta</span>` : ''}
          </div>
        </div>
      </div>
    </a>`;
}

function noResultsHTML(style, ville) {
  if (tatoueurs.length === 0) {
    return `<div class="no-results"><strong>Bientôt disponible</strong>Les premiers tatoueurs arrivent — <a href="inscription.html" style="color:var(--accent);text-decoration:none">inscris ton studio →</a></div>`;
  }
  if (style && ville) {
    return `<div class="no-results-rich" id="zero-results-message">
      <div class="nr-tag">// 0 résultat</div>
      <div class="nr-title">Aucun artiste <em>${esc(style)}</em><br>référencé à ${esc(ville)}</div>
      <p class="nr-sub">Pas encore de tatoueur ${esc(style)} sur Inkmap à ${esc(ville)} — mais ça arrive.</p>
      <div class="nr-actions">
        <button class="btn-primary" style="font-size:0.72rem;padding:12px 22px" onclick="supprimerFiltreVille()">Voir tous les ${esc(style)} en France →</button>
        <button class="btn-secondary" style="font-size:0.72rem;padding:12px 22px" onclick="supprimerFiltreStyle()">Voir tous les tatoueurs à ${esc(ville)} →</button>
        <a href="inscription.html" class="btn-secondary" style="font-size:0.72rem;padding:12px 22px">Inscrire mon studio</a>
      </div>
    </div>`;
  }
  if (style) {
    return `<div class="no-results-rich" id="zero-results-message">
      <div class="nr-tag">// 0 résultat</div>
      <div class="nr-title">Aucun artiste <em>${esc(style)}</em><br>référencé pour le moment</div>
      <p class="nr-sub">Pas encore de tatoueur ${esc(style)} sur Inkmap — mais ça arrive.</p>
      <div class="nr-actions">
        <button class="btn-primary" style="font-size:0.72rem;padding:12px 22px" onclick="filtreRapide('',document.querySelector('.filter-btn'))">Voir tous les artistes →</button>
        <a href="inscription.html" class="btn-secondary" style="font-size:0.72rem;padding:12px 22px">Inscrire mon studio</a>
      </div>
    </div>`;
  }
  if (ville) {
    return `<div class="no-results-rich" id="zero-results-message">
      <div class="nr-tag">// 0 résultat</div>
      <div class="nr-title">Aucun artiste référencé<br>à <em>${esc(ville)}</em></div>
      <p class="nr-sub">Pas encore de tatoueur sur Inkmap à ${esc(ville)} — mais ça arrive.</p>
      <div class="nr-actions">
        <button class="btn-primary" style="font-size:0.72rem;padding:12px 22px" onclick="supprimerFiltreVille()">Voir tous les artistes →</button>
        <a href="inscription.html" class="btn-secondary" style="font-size:0.72rem;padding:12px 22px">Inscrire mon studio</a>
      </div>
    </div>`;
  }
  return `<div class="no-results-rich" id="zero-results-message">
    <div class="nr-tag">// 0 résultat</div>
    <div class="nr-title">Aucun artiste trouvé<br>avec ces critères</div>
    <p class="nr-sub">Essaie d'élargir ta recherche : retire un filtre ou change de ville.</p>
    <div class="nr-actions">
      <button class="btn-primary" style="font-size:0.72rem;padding:12px 22px" onclick="document.getElementById('searchNom').value='';styleActif='';villeActive='';document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));document.querySelector('.filter-btn').classList.add('active');mettreAJourTags();filtrer()">Réinitialiser les filtres →</button>
      <a href="inscription.html" class="btn-secondary" style="font-size:0.72rem;padding:12px 22px">Inscrire mon studio</a>
    </div>
  </div>`;
}

function scrollVersResultats(avecResultats) {
  requestAnimationFrame(() => {
    if (avecResultats) {
      const el = document.getElementById('tatoueurs-grid');
      if (!el) return;
      const headerH = window.innerWidth <= 768 ? 56 : 64;
      const top = el.getBoundingClientRect().top + window.pageYOffset - headerH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      const el = document.getElementById('zero-results-message');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

const PAR_PAGE = 32;
let pageCourante = 1;
let listeFiltree = [];

function renderPagination(total) {
  const nbPages = Math.ceil(total / PAR_PAGE);
  const el = document.getElementById('pagination');
  if (!el) return;
  if (nbPages <= 1) { el.innerHTML = ''; return; }
  let html = `<span class="pagination-info">Page ${pageCourante} / ${nbPages}</span>`;
  if (pageCourante > 1) html += `<button class="page-btn" onclick="allerPage(${pageCourante - 1})">←</button>`;
  for (let i = 1; i <= nbPages; i++) {
    html += `<button class="page-btn${i === pageCourante ? ' active' : ''}" onclick="allerPage(${i})">${i}</button>`;
  }
  if (pageCourante < nbPages) html += `<button class="page-btn" onclick="allerPage(${pageCourante + 1})">→</button>`;
  el.innerHTML = html;
}

function allerPage(n) {
  pageCourante = n;
  const debut = (n - 1) * PAR_PAGE;
  const page = listeFiltree.slice(debut, debut + PAR_PAGE);
  document.getElementById('grid').innerHTML = page.map(renderCard).join('');
  renderPagination(listeFiltree.length);
  scrollVersResultats(true);
}

function afficher(liste, doScroll) {
  listeFiltree = liste;
  pageCourante = 1;
  document.getElementById('results-count').textContent = `— ${liste.length} résultat${liste.length>1?'s':''}`;
  if (liste.length === 0) {
    document.getElementById('grid').innerHTML = noResultsHTML(styleActif, villeActive);
    document.getElementById('pagination').innerHTML = '';
  } else {
    const page = liste.slice(0, PAR_PAGE);
    document.getElementById('grid').innerHTML = page.map(renderCard).join('');
    renderPagination(liste.length);
  }
  if (doScroll) scrollVersResultats(liste.length > 0);
}

function filtrer(doScroll) {
  if (doScroll === undefined) doScroll = true;
  const nom = document.getElementById('searchNom').value.toLowerCase();
  const style = document.getElementById('filterStyle').value;
  const budget = document.getElementById('filterBudget').value;
  afficher(tatoueurs.filter(t =>
    (t.nom.toLowerCase().includes(nom) || (t.nomComplet || '').toLowerCase().includes(nom) || t.ville.toLowerCase().includes(nom)) &&
    (style === '' || t.styles.includes(style)) &&
    (budget === '' || getBudgetLabel(t.tarif) === budget) &&
    (styleActif === '' || t.styles.includes(styleActif)) &&
    (villeActive === '' || villeBase(t.ville).toLowerCase() === villeActive.toLowerCase())
  ), doScroll);
}

function filtreRapide(style, btn) {
  styleActif = style;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  mettreAJourTags();
  filtrer();
}

// ── PLACEHOLDER BRANDED ───────────────────────────────────────────────────────
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style="display:block">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.6" fill="rgba(192,57,43,0.12)"/>
    </pattern>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#141414"/>
      <stop offset="50%" stop-color="#0d0d0d"/>
      <stop offset="100%" stop-color="#111"/>
    </linearGradient>
  </defs>
  <rect width="320" height="180" fill="url(#glow)"/>
  <rect width="320" height="180" fill="url(#grid)"/>
  <line x1="0" y1="180" x2="320" y2="0" stroke="rgba(192,57,43,0.06)" stroke-width="40"/>
  <g transform="translate(160,68)" fill="none" stroke="#333" stroke-width="1.2" stroke-linecap="round">
    <path d="M-8,-18 L-8,8 C-8,12 -4,14 0,14 C4,14 8,12 8,8 L8,-18" />
    <line x1="-8" y1="-8" x2="8" y2="-8" />
    <line x1="-6" y1="-13" x2="6" y2="-13" />
    <line x1="0" y1="14" x2="0" y2="22" stroke="#c0392b" stroke-width="1.5"/>
    <circle cx="-12" cy="-14" r="2.5" stroke="#333"/>
    <line x1="-12" y1="-11.5" x2="-12" y2="-4" />
    <path d="M-12,-4 L-8,-2" />
  </g>
  <text x="160" y="116" font-family="Arial Black, Impact, sans-serif" font-size="13" font-weight="900" letter-spacing="5" fill="#fff" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle">INK<tspan fill="#c0392b">MAP</tspan></text>
  <text x="160" y="134" font-family="Arial, Helvetica, sans-serif" font-size="7.5" letter-spacing="3" fill="#555" text-anchor="middle" dominant-baseline="middle">PHOTO À VENIR</text>
</svg>`;

function cardMedia(t) {
  if (t.photo) return `<img src="${esc(t.photo)}" alt="Tatouage ${esc(t.styles[0] || '')} par ${esc(t.nom)} à ${esc(t.ville)}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />`;
  return PLACEHOLDER_SVG;
}

// ── AIRTABLE SYNC ─────────────────────────────────────────────────────────────
const STYLE_EMOJI = {
  'Blackwork':'◼','Fineline':'🌿','Réalisme':'📷','Old School':'⚓',
  'Aquarelle':'🎨','Géométrique':'◆','Japonais':'⛩','Neo-Traditional':'🌹',
  'Tribal':'◉','Dotwork':'⬡','Illustratif':'🖤','Floral':'🌸',
  'Minimaliste':'✦','Portrait':'👁','Flash':'🦅','Organique':'🌑',
  'Micro-réalisme':'🔬','Noir & Gris':'🖤','Irezumi':'⛩'
};

async function chargerDepuisAirtable() {
  try {
    const res = await fetch('/api/tatoueurs');
    if (!res.ok) return;
    const { records } = await res.json();
    let nextId = tatoueurs.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    records.forEach(({ fields: f, createdTime, slug, verifie }) => {
      if (!f.Nom) return;
      // styles peut être un tableau (multi-select Airtable) ou une chaîne
      const rawStyles = f.Styles || f.styles || [];
      const styles = Array.isArray(rawStyles)
        ? rawStyles
        : rawStyles.split(',').map(s => s.trim()).filter(Boolean);
      const photoArr = f.Photos || f.Photo || f.photo || [];
      const allPhotos = Array.isArray(photoArr)
        ? photoArr.map(p => p.thumbnails?.large?.url || p.url || '').filter(Boolean)
        : [];
      const profile = {
        nom: f.Pseudo || f.Nom,
        nomComplet: f.Nom,
        ville: f.Ville || f.ville || '',
        region: f.Region || f.region || '',
        styles,
        tarif: parseInt(f.Tarif || f.tarif) || 0,
        instagram: f.Instagram || f.instagram || '',
        bio: f.Bio || f.bio || '',
        verifie: !!verifie,
        slug: slug || '',
        photo: allPhotos[0] || '',
        photos: allPhotos,
        emoji: STYLE_EMOJI[styles[0]] || '✦',
        createdAt: createdTime || '',
      };
      const idx = tatoueurs.findIndex(t => t.nom.toLowerCase().trim() === f.Nom.toLowerCase().trim());
      if (idx !== -1) {
        profile.id = tatoueurs[idx].id;
        tatoueurs[idx] = profile;
      } else {
        profile.id = nextId++;
        tatoueurs.push(profile);
      }
    });
  } catch(e) {
    console.warn('Airtable indisponible, affichage du catalogue local.', e);
  }
}

function ouvrirModal(id) {
  const t = tatoueurs.find(x => x.id === id);
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-photo" id="modal-carousel">${t.photos && t.photos.length > 0
      ? `<div class="carousel-track" id="carouselTrack" onclick="openLightbox()">${t.photos.map((p,i) => `<img src="${esc(p)}" alt="${esc(t.nom)} - photo ${i+1}" />`).join('')}</div>${t.photos.length > 1 ? `<button class="carousel-btn prev" onclick="event.stopPropagation();carouselNav(-1)">&#8249;</button><button class="carousel-btn next" onclick="event.stopPropagation();carouselNav(1)">&#8250;</button><div class="carousel-dots">${t.photos.map((_,i) => `<div class="carousel-dot${i===0?' active':''}" data-i="${i}"></div>`).join('')}</div>` : ''}`
      : PLACEHOLDER_SVG}</div>
    <div class="modal-name">${esc(t.nom)}</div>
    <div class="modal-city">📍 ${esc(t.ville)} — ${esc(t.region)}</div>
    <div class="styles">${t.styles.map(s=>`<span class="style-tag">${esc(s)}</span>`).join('')}</div>
    <div class="modal-section"><h3>À propos</h3><p>${esc(t.bio)}</p></div>
    <div class="modal-section"><h3>Tarif</h3><div class="modal-price">${t.tarif > 0 ? `${t.tarif}€<small style="font-size:0.9rem;color:var(--muted)"> / heure</small>` : '<span style="font-size:1.6rem;font-weight:700">Sur devis</span>'}</div></div>
    <div class="modal-section"><h3>Contact</h3><p style="font-family:'Space Mono',monospace">${esc(t.instagram) || 'Non renseigné'}</p></div>
    ${t.instagram ? `<div class="modal-actions">
      <a href="${t.id === 0 ? `https://www.tiktok.com/@${encodeURIComponent(t.instagram.replace('@',''))}` : `https://www.instagram.com/${encodeURIComponent(t.instagram.replace('@',''))}`}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="text-decoration:none;display:inline-flex;align-items:center">Voir le profil ${t.id === 0 ? 'TikTok' : 'Instagram'} →</a>
    </div>` : ''}
    ${!t.verifie ? `
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div>
        <div style="font-size:0.75rem;color:var(--muted);font-family:'Space Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Profil non réclamé</div>
        <div style="font-size:0.85rem;color:var(--muted2)">C'est vous ? Réclamez ce profil gratuitement et personnalisez-le.</div>
      </div>
      <a href="inscription.html?nom=${encodeURIComponent(t.nom)}&ville=${encodeURIComponent(t.ville)}&instagram=${encodeURIComponent(t.instagram)}&region=${encodeURIComponent(t.region)}&tarif=${t.tarif}" style="background:transparent;border:1px solid var(--accent);color:var(--accent);padding:10px 20px;border-radius:3px;font-family:'Space Grotesk',sans-serif;font-size:0.85rem;font-weight:600;text-decoration:none;white-space:nowrap;transition:background .2s" onmouseover="this.style.background='rgba(192,57,43,0.1)'" onmouseout="this.style.background='transparent'">Réclamer ce profil →</a>
    </div>` : `
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px">
      <span style="background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.2);color:#4caf50;font-size:0.72rem;padding:3px 10px;border-radius:2px;font-family:'Space Mono',monospace;text-transform:uppercase;letter-spacing:0.5px">✓ Profil vérifié</span>
      <span style="color:var(--muted);font-size:0.78rem">Artiste inscrit et actif sur Inkmap</span>
    </div>`}
  `;
  const overlay = document.getElementById('modal');
  const modalEl = overlay.querySelector('.modal');
  overlay.style.opacity = '0';
  modalEl.style.transform = 'translateY(40px)';
  modalEl.style.opacity = '0';
  overlay.classList.add('open');
  requestAnimationFrame(() => {
    overlay.style.transition = 'opacity 0.3s ease';
    modalEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    overlay.style.opacity = '1';
    modalEl.style.transform = 'translateY(0)';
    modalEl.style.opacity = '1';
    setTimeout(() => {
      overlay.style.transition = '';
      modalEl.style.transition = '';
    }, 300);
  });
}

// ── CAROUSEL ────────────────────────────────────────────────────────────────
let carouselIdx = 0;
function carouselNav(dir) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  const total = track.children.length;
  carouselIdx = (carouselIdx + dir + total) % total;
  track.style.transform = `translateX(-${carouselIdx * 100}%)`;
  document.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === carouselIdx));
}
// Reset carousel index when modal opens
const _origOuvrirModal = ouvrirModal;
ouvrirModal = function(id) {
  carouselIdx = 0;
  _origOuvrirModal(id);
  // Auto-shrink pseudo si trop long pour une ligne
  const nameEl = document.querySelector('.modal-name');
  if (nameEl) {
    nameEl.style.fontSize = '';
    requestAnimationFrame(() => {
      let size = 2.2;
      while (nameEl.scrollWidth > nameEl.clientWidth && size > 0.9) {
        size -= 0.15;
        nameEl.style.fontSize = size + 'rem';
      }
    });
  }
};

// Swipe support for mobile
document.addEventListener('touchstart', function(e) {
  if (!e.target.closest('#modal-carousel')) return;
  const startX = e.touches[0].clientX;
  const onEnd = (ev) => {
    const diff = startX - ev.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) carouselNav(diff > 0 ? 1 : -1);
    document.removeEventListener('touchend', onEnd);
  };
  document.addEventListener('touchend', onEnd, { once: true });
}, { passive: true });

function fermerModal(e) {
  const overlay = document.getElementById('modal');
  if (e && e.target !== overlay) return;
  const modal = overlay.querySelector('.modal');
  overlay.style.opacity = '0';
  modal.style.transform = 'translateY(100px)';
  modal.style.opacity = '0';
  setTimeout(() => {
    overlay.classList.remove('open');
    overlay.style.opacity = '';
    modal.style.transform = '';
    modal.style.opacity = '';
  }, 300);
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') fermerModal();
});

// ── SWIPE TO CLOSE MODAL (mobile) ──────────────────────────────────────────
(function() {
  const overlay = document.getElementById('modal');
  let startY = 0, isDragging = false;

  overlay.addEventListener('touchstart', function(e) {
    const modal = overlay.querySelector('.modal');
    if (!modal.contains(e.target)) return;
    // Only allow drag-to-close when modal content is scrolled to top
    if (modal.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    isDragging = true;
    modal.style.transition = 'none';
  }, { passive: true });

  overlay.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    const modal = overlay.querySelector('.modal');
    const dy = e.touches[0].clientY - startY;
    // If user swipes up, cancel drag and let normal scroll happen
    if (dy < 0) { isDragging = false; modal.style.transition = ''; modal.style.transform = ''; overlay.style.opacity = ''; return; }
    if (dy > 0) {
      modal.style.transform = `translateY(${dy}px)`;
      overlay.style.opacity = Math.max(0, 1 - dy / 400);
    }
  }, { passive: true });

  overlay.addEventListener('touchend', function() {
    if (!isDragging) return;
    const modal = overlay.querySelector('.modal');
    const dy = parseFloat(modal.style.transform.replace('translateY(','')) || 0;
    isDragging = false;
    if (dy > 80) {
      // Smooth slide out
      modal.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      modal.style.transform = 'translateY(100vh)';
      modal.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.classList.remove('open');
        modal.style.transition = '';
        modal.style.transform = '';
        modal.style.opacity = '';
        overlay.style.transition = '';
        overlay.style.opacity = '';
      }, 300);
    } else {
      // Snap back
      modal.style.transition = 'transform 0.25s ease';
      modal.style.transform = '';
      setTimeout(() => { modal.style.transition = ''; }, 250);
    }
  });
})();

// ── CARTE ──
const coords = {
  // Paris arrondissements
  "Paris":[48.8566,2.3522],
  "Paris 1er":[48.8604,2.3477],"Paris 2e":[48.8659,2.3477],"Paris 3e":[48.8635,2.3590],
  "Paris 4e":[48.8534,2.3523],"Paris 5e":[48.8462,2.3511],"Paris 6e":[48.8490,2.3340],
  "Paris 7e":[48.8566,2.3117],"Paris 8e":[48.8742,2.3083],"Paris 9e":[48.8768,2.3378],
  "Paris 10e":[48.8764,2.3609],"Paris 11e":[48.8566,2.3791],"Paris 12e":[48.8414,2.3887],
  "Paris 13e":[48.8322,2.3561],"Paris 14e":[48.8330,2.3262],"Paris 15e":[48.8416,2.2945],
  "Paris 16e":[48.8638,2.2765],"Paris 17e":[48.8876,2.3083],"Paris 18e":[48.8924,2.3445],
  "Paris 19e":[48.8827,2.3809],"Paris 20e":[48.8637,2.3960],
  // Lyon arrondissements
  "Lyon":[45.7640,4.8357],
  "Lyon 1er":[45.7676,4.8344],"Lyon 2e":[45.7484,4.8306],"Lyon 3e":[45.7513,4.8577],
  "Lyon 4e":[45.7785,4.8281],"Lyon 5e":[45.7588,4.8067],"Lyon 6e":[45.7713,4.8531],
  "Lyon 7e":[45.7396,4.8422],"Lyon 8e":[45.7302,4.8622],"Lyon 9e":[45.7759,4.8056],
  // Autres grandes villes
  "Marseille":[43.2965,5.3698],"Bordeaux":[44.8378,-0.5792],"Toulouse":[43.6047,1.4442],
  "Nantes":[47.2184,-1.5536],"Strasbourg":[48.5734,7.7521],"Montpellier":[43.6108,3.8767],
  "Lille":[50.6292,3.0573],"Nice":[43.7102,7.2620],"Rennes":[48.1173,-1.6778],
  "Grenoble":[45.1885,5.7245],"Aix-en-Provence":[43.5297,5.4474],"Saint-Étienne":[45.4397,4.3872],
  "Toulon":[43.1242,5.9280],"Angers":[47.4784,-0.5632],"Le Mans":[48.0061,0.1996],
  "Dijon":[47.3220,5.0415],"Reims":[49.2583,4.0317],"Amiens":[49.8941,2.2957],
  "Limoges":[45.8336,1.2611],"Clermont-Ferrand":[45.7797,3.0863],"Tours":[47.3941,0.6848],
  "Caen":[49.1829,-0.3707],"Nancy":[48.6921,6.1844],"Metz":[49.1193,6.1757],
  "Brest":[48.3904,-4.4861],"Perpignan":[42.6887,2.8948],"Avignon":[43.9493,4.8055],
  "La Rochelle":[46.1591,-1.1520],"Biarritz":[43.4832,-1.5586],"Pau":[43.2951,-0.3708],
  "Bayonne":[43.4929,-1.4748],"Versailles":[48.8049,2.1204],"Nîmes":[43.8367,4.3601],
  "Rouen":[49.4432,1.0993],"Orléans":[47.9029,1.9093],"Besançon":[47.2378,6.0241],
  "Mulhouse":[47.7508,7.3359],"Poitiers":[46.5802,0.3404],"Valenciennes":[50.3579,3.5238],
  "Saint-Denis":[48.9362,2.3574],"Montreuil":[48.8642,2.4444],"Vincennes":[48.8473,2.4393],
  "Boulogne-Billancourt":[48.8353,2.2400],"Créteil":[48.7774,2.4567],
  "Vitry-sur-Seine":[48.7876,2.3974],"Levallois-Perret":[48.8952,2.2876],
  "Neuilly-sur-Seine":[48.8845,2.2694],"Courbevoie":[48.8976,2.2534],
  "Issy-les-Moulineaux":[48.8239,2.2738],"Argenteuil":[48.9472,2.2467],
  "Saint-Maur-des-Fossés":[48.7994,2.4994],"Aubagne":[43.2934,5.5713],
};

// Lookup intelligent : exact → insensible à la casse → fallback sur la ville principale
function getCoords(ville) {
  if (!ville) return null;
  const v = ville.trim();
  // 1. Exact match
  if (coords[v]) return coords[v];
  // 2. Case-insensitive
  const vLow = v.toLowerCase();
  const exactKey = Object.keys(coords).find(k => k.toLowerCase() === vLow);
  if (exactKey) return coords[exactKey];
  // 3. Fallback : première partie avant espace ou tiret (ex: "Lyon 3ème" → "Lyon")
  const firstWord = v.split(/[\s-]/)[0];
  const fallbackKey = Object.keys(coords).find(k => k.toLowerCase() === firstWord.toLowerCase());
  if (fallbackKey) return coords[fallbackKey];
  return null;
}

const map = L.map('carte', { minZoom: 5, maxZoom: 7 }).setView([46.8, 2.3], 6);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap © CartoDB', maxZoom: 7
}).addTo(map);

const icone = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#c0392b;border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
  iconSize: [28,28], iconAnchor: [14,28], popupAnchor: [0,-32],
});

function afficherMessageVilleGrise(ville) {
  document.getElementById('results-count').textContent = '— 0 résultat';
  document.getElementById('grid').innerHTML = `
    <div class="no-results-rich" id="zero-results-message">
      <div class="nr-tag">// bientôt disponible</div>
      <div class="nr-title">Aucun tatoueur référencé<br>à <em>${esc(ville)}</em> pour le moment<br>— mais ça arrive bientôt !</div>
      <p class="nr-sub">En attendant tu peux :</p>
      <div class="nr-actions">
        <button class="btn-primary" style="font-size:0.72rem;padding:12px 22px" onclick="supprimerFiltreVille();supprimerFiltreStyle()">Voir tous les tatoueurs disponibles →</button>
        <a href="inscription.html" class="btn-secondary" style="font-size:0.72rem;padding:12px 22px">Inscrire mon studio à ${esc(ville)}</a>
      </div>
    </div>`;
  requestAnimationFrame(() => {
    const el = document.getElementById('zero-results-message');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function initialiserAffichage() {
  // Trier : derniers inscrits en premier
  tatoueurs.sort((a, b) => {
    if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    return 0;
  });

  // Marquer les 5 plus récents comme "nouveau"
  const now = Date.now();
  const SEUIL_NOUVEAU = 14 * 24 * 60 * 60 * 1000; // 14 jours
  tatoueurs.forEach(t => {
    t.isNouveau = t.createdAt && (now - new Date(t.createdAt).getTime()) < SEUIL_NOUVEAU;
  });

  // Grouper par ville principale (un pin par ville)
  const parVille = {};
  tatoueurs.forEach(t => {
    const base = villeBase(t.ville);
    if (!base) return;
    if (!parVille[base]) parVille[base] = [];
    parVille[base].push(t);
  });

  Object.entries(parVille).forEach(([ville, artistes]) => {
    const c = getCoords(ville) || getCoords(artistes[0].ville);
    if (!c) return;

    const count = artistes.length;
    const iconeVille = L.divIcon({
      className: '',
      html: `<div style="position:relative;display:inline-block;cursor:pointer;text-align:center;">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.9));display:block;">
          <path d="M16 0C7.163 0 0 7.163 0 16C0 25.6 16 42 16 42S32 25.6 32 16C32 7.163 24.837 0 16 0Z" fill="#ffffff"/>
          <circle cx="16" cy="14" r="7" fill="#c0392b"/>
        </svg>
        <div style="position:absolute;top:45px;left:50%;transform:translateX(-50%);white-space:nowrap;color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:0.58rem;letter-spacing:1px;text-transform:uppercase;text-shadow:0 1px 4px #000,0 1px 4px #000;">${ville}${count > 1 ? ` (${count})` : ''}</div>
      </div>`,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });

    L.marker(c, { icon: iconeVille }).addTo(map).on('click', () => {
      filtreVille(ville);
    });
  });

  // Pins grisés pour villes sans tatoueurs
  const VILLES_GRISES = ['Marseille','Toulouse','Nantes','Montpellier','Lille','Strasbourg','Rennes','Nice','Grenoble','Rouen'];
  VILLES_GRISES.forEach(ville => {
    if (parVille[ville]) return;
    const c = getCoords(ville);
    if (!c) return;
    const iconeGrise = L.divIcon({
      className: '',
      html: `<div style="position:relative;display:inline-block;cursor:pointer;text-align:center;opacity:0.7;">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.7));display:block;">
          <path d="M16 0C7.163 0 0 7.163 0 16C0 25.6 16 42 16 42S32 25.6 32 16C32 7.163 24.837 0 16 0Z" fill="#ffffff"/>
          <circle cx="16" cy="14" r="7" fill="#888888"/>
        </svg>
        <div style="position:absolute;top:45px;left:50%;transform:translateX(-50%);white-space:nowrap;color:#888;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:0.58rem;letter-spacing:1px;text-transform:uppercase;text-shadow:0 1px 3px #000;">${ville}</div>
      </div>`,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });
    L.marker(c, { icon: iconeGrise }).addTo(map).on('click', () => {
      afficherMessageVilleGrise(ville);
    });
  });

  afficher(tatoueurs, false);
  const stylesUniques = new Set(tatoueurs.flatMap(t => t.styles));
  const villesUniques = new Set(Object.keys(parVille));

  const nbTatEl  = document.getElementById('nb-tatoueurs-val');
  const nbStyEl  = document.getElementById('nb-styles-val');
  const nbVilEl  = document.getElementById('nb-villes-val');
  const tarifEl  = document.getElementById('tarif-moyen-val');
  const tarifDd  = document.getElementById('tarif-moyen');
  const tarifDet = document.getElementById('tarif-detail');
  const NB_STYLES_REF = 13;
  const NB_VILLES_REF = 13;

  // Tarif moyen calculé depuis Airtable
  const tarifsRenseignes = tatoueurs.filter(t => t.tarif > 0).map(t => t.tarif);
  const tarifMoyen = tarifsRenseignes.length > 0
    ? Math.round(tarifsRenseignes.reduce((a, b) => a + b, 0) / tarifsRenseignes.length)
    : 0;

  // Mise à jour des valeurs texte et data-value
  nbTatEl.textContent = tatoueurs.length;
  nbStyEl.textContent = NB_STYLES_REF;
  nbVilEl.textContent = NB_VILLES_REF;
  document.getElementById('nb-tatoueurs').dataset.value = tatoueurs.length;
  document.getElementById('nb-villes').dataset.value = NB_VILLES_REF;
  document.getElementById('nb-styles').dataset.value = NB_STYLES_REF;

  if (tarifMoyen > 0) {
    tarifEl.textContent = tarifMoyen;
    tarifDd.dataset.value = tarifMoyen;
    tarifDet.textContent = `calculé sur ${tarifsRenseignes.length} profil${tarifsRenseignes.length > 1 ? 's' : ''} renseigné${tarifsRenseignes.length > 1 ? 's' : ''}`;
  }

  // Wrappers pour le counter animé (observe les <dd>)
  const nbTatDd = document.getElementById('nb-tatoueurs');
  const nbStyDd = document.getElementById('nb-styles');
  const nbVilDd = document.getElementById('nb-villes');

  function animerCompteurSpan(spanEl, cible) {
    if (!cible) return;
    const duree = 1200;
    const debut = performance.now();
    const depart = 0;
    function step(now) {
      const t = Math.min((now - debut) / duree, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      spanEl.textContent = Math.round(depart + (cible - depart) * ease);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const io2 = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.counted) {
        e.target.dataset.counted = '1';
        const val = parseInt(e.target.dataset.value);
        const spanId = e.target.id + '-val';
        const span = document.getElementById(spanId);
        if (span && val > 0) animerCompteurSpan(span, val);
        if (e.target.id === 'tarif-moyen' && tarifMoyen > 0) animerCompteurSpan(tarifEl, tarifMoyen);
        io2.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  io2.observe(nbTatDd); io2.observe(nbStyDd); io2.observe(nbVilDd);
  if (tarifMoyen > 0) io2.observe(tarifDd);
}

chargerDepuisAirtable().then(initialiserAffichage);

// ── MENU HAMBURGER ────────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');

hamburger.addEventListener('click', function() {
  const ouvert = mobileNav.classList.toggle('open');
  hamburger.classList.toggle('open', ouvert);
  hamburger.setAttribute('aria-expanded', ouvert);
  document.body.style.overflow = ouvert ? 'hidden' : '';
});

function fermerMenu() {
  mobileNav.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// Fermer le menu si on resize > 768px
window.addEventListener('resize', function() {
  if (window.innerWidth > 768) fermerMenu();
});

// ── DROPDOWN STYLES (desktop) ─────────────────────────────────────────────────
const navStylesBtn = document.getElementById('nav-styles-btn');
const navStylesDd  = document.getElementById('nav-styles-dropdown');

navStylesBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  const open = navStylesDd.classList.toggle('open');
  navStylesBtn.setAttribute('aria-expanded', open);
});

document.addEventListener('click', function() {
  navStylesDd.classList.remove('open');
  navStylesBtn.setAttribute('aria-expanded', 'false');
});

navStylesDd.querySelector('.nav-dropdown-menu').addEventListener('click', function(e) {
  e.stopPropagation();
});

function navFiltreStyle(style) {
  navStylesDd.classList.remove('open');
  navStylesBtn.setAttribute('aria-expanded', 'false');
  styleActif = style;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === style);
  });
  mettreAJourTags();
  filtrer();
}

// ── DROPDOWN STYLES (mobile) ──────────────────────────────────────────────────
document.getElementById('mobile-styles-toggle').addEventListener('click', function() {
  const section = document.getElementById('mobile-styles-section');
  const open = section.classList.toggle('open');
  this.setAttribute('aria-expanded', open);
});



// ── IA MATCH ──────────────────────────────────────────────────────────────────

const iaZone = document.getElementById('iaUploadZone');
iaZone.addEventListener('dragover', e => { e.preventDefault(); iaZone.classList.add('dragover'); });
iaZone.addEventListener('dragleave', () => iaZone.classList.remove('dragover'));
iaZone.addEventListener('drop', e => {
  e.preventDefault(); iaZone.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) processIaImage(f);
});

function handleIaUpload(e) {
  const f = e.target.files[0];
  if (f) processIaImage(f);
}

// Redimensionne l'image côté client avant envoi (max 1024px, qualité 0.85)
function redimensionnerImage(file, maxDim) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        resolve({ base64, mediaType: 'image/jpeg' });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function processIaImage(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const previewImg = document.getElementById('ia-preview-img');
    previewImg.onload = () => {
      document.getElementById('iaUploadZone').style.display = 'none';
      document.getElementById('iaResultLayout').classList.add('visible');
      document.getElementById('iaScanOverlay').classList.remove('hidden');
      document.getElementById('iaResultsCol').style.opacity = '0';
      analyseEtAffiche(file);
    };
    previewImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

async function analyseEtAffiche(file) {
  try {
    const { base64, mediaType } = await redimensionnerImage(file, 1024);
    const res = await fetch('/api/ia-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'API ' + res.status);
    }
    const { style, scores, explication } = await res.json();
    afficherResultats(style, scores, explication, false);
  } catch(e) {
    // Afficher un message d'erreur clair au lieu d'un fallback approximatif
    document.getElementById('iaScanOverlay').classList.add('hidden');
    const col = document.getElementById('iaResultsCol');
    col.style.transition = 'opacity .5s';
    col.style.opacity = '1';
    document.getElementById('iaDetectedStyle').textContent = '—';
    const explEl = document.getElementById('iaExplication');
    explEl.textContent = 'Service d\'analyse indisponible pour le moment. Réessaie dans quelques instants.';
    explEl.classList.add('visible');
    document.getElementById('iaBars').innerHTML = '';
  }
}

function afficherResultats(best, scores, explication, isFallback) {
  document.getElementById('iaScanOverlay').classList.add('hidden');
  // Trier les scores par ordre décroissant pour que le style principal soit le plus haut score
  scores.sort((a, b) => b[1] - a[1]);
  best = scores[0][0];
  const col = document.getElementById('iaResultsCol');
  col.style.transition = 'opacity .5s';
  col.style.opacity = '1';
  document.getElementById('iaDetectedStyle').textContent = best;

  // Explication IA ou notice de fallback
  const explEl = document.getElementById('iaExplication');
  if (explication) {
    explEl.textContent = explication;
    explEl.classList.add('visible');
  } else if (isFallback) {
    explEl.textContent = '⚠ Analyse locale — service IA indisponible. Résultat basé sur les couleurs et la luminosité de l\'image.';
    explEl.classList.add('visible');
  } else {
    explEl.classList.remove('visible');
  }

  const barsEl = document.getElementById('iaBars');
  barsEl.innerHTML = scores.map(([style, score], i) => `
    <div class="ia-bar-row">
      <div class="ia-bar-name">${esc(style)}</div>
      <div class="ia-bar-track"><div class="ia-bar-fill" id="bar-${i}" style="width:0%"></div></div>
      <div class="ia-bar-pct">${parseInt(score) || 0}%</div>
    </div>`).join('');

  scores.forEach(([, score], i) => {
    setTimeout(() => {
      const el = document.getElementById(`bar-${i}`);
      if (el) el.style.width = score + '%';
    }, 100 + i * 80);
  });

  // Matching artistes : style + filtre ville active si définie
  const stylesDetectes = scores.slice(0, 3).map(([s]) => s.toLowerCase());
  const matches = tatoueurs.filter(t =>
    t.styles.some(s => stylesDetectes.includes(s.toLowerCase())) &&
    (villeActive === '' || villeBase(t.ville).toLowerCase() === villeActive.toLowerCase())
  ).sort((a, b) => {
    const aMain = a.styles.some(s => s.toLowerCase() === best.toLowerCase()) ? 1 : 0;
    const bMain = b.styles.some(s => s.toLowerCase() === best.toLowerCase()) ? 1 : 0;
    return bMain - aMain;
  }).slice(0, 8);

  const sec = document.getElementById('iaMatchesSection');
  document.getElementById('iaMatchesStyleTag').textContent = best;
  const villeCtx = villeActive ? ` à ${esc(villeActive)}` : '';
  document.getElementById('iaMatchesGrid').innerHTML = matches.length > 0
    ? matches.map(renderCard).join('')
    : `<div class="no-results-rich" style="background:transparent">
        <div class="nr-tag">// 0 résultat</div>
        <div class="nr-title">Aucun artiste <em>${esc(best)}</em><br>référencé${villeCtx} pour le moment</div>
        <p class="nr-sub">Pas encore de tatoueur ${esc(best)} sur Inkmap${villeCtx} — mais ça arrive. Tu peux t'inscrire sur la liste d'attente ou consulter les artistes disponibles${villeActive ? ' dans d\'autres villes' : ''}.</p>
        <div class="nr-actions">
          ${villeActive
            ? `<button class="btn-primary" style="font-size:0.72rem;padding:12px 22px" onclick="supprimerFiltreVille()">Voir tous les ${esc(best)} en France →</button>
               <button class="btn-secondary" style="font-size:0.72rem;padding:12px 22px" onclick="supprimerFiltreStyle()">Voir tous les tatoueurs à ${esc(villeActive)} →</button>`
            : `<button class="btn-primary" style="font-size:0.72rem;padding:12px 22px" onclick="navFiltreStyle('${esc(best)}');document.getElementById('results-count').scrollIntoView({behavior:'smooth'})">Voir tous les ${esc(best)} →</button>`
          }
          <a href="inscription.html" class="btn-secondary" style="font-size:0.72rem;padding:12px 22px">Inscrire mon studio</a>
        </div>
      </div>`;
  sec.classList.add('visible');
}

function resetIaMatch() {
  document.getElementById('iaUploadZone').style.display = '';
  document.getElementById('iaResultLayout').classList.remove('visible');
  document.getElementById('iaMatchesSection').classList.remove('visible');
  document.getElementById('iaExplication').classList.remove('visible');
  document.getElementById('iaFileInput').value = '';
}

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
let lightboxPhotos = [];
let lightboxIdx = 0;

function openLightbox() {
  const t = tatoueurs.find(x => x.id === document.querySelector('#modal.open') ? true : false);
  // Get photos from current carousel
  const track = document.getElementById('carouselTrack');
  if (!track) return;
  lightboxPhotos = Array.from(track.querySelectorAll('img')).map(img => img.src);
  if (lightboxPhotos.length === 0) return;
  lightboxIdx = carouselIdx || 0;
  renderLightbox();
  document.getElementById('photoLightbox').classList.add('open');
}

function renderLightbox() {
  document.getElementById('lightboxImg').src = lightboxPhotos[lightboxIdx];
  document.getElementById('lightboxCounter').textContent = `${lightboxIdx + 1} / ${lightboxPhotos.length}`;
  // Show/hide nav buttons
  const hasMultiple = lightboxPhotos.length > 1;
  document.querySelectorAll('.lightbox-nav').forEach(b => b.style.display = hasMultiple ? 'flex' : 'none');
  document.getElementById('lightboxCounter').style.display = hasMultiple ? 'block' : 'none';
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('photoLightbox') && !e.target.closest('.lightbox-close')) return;
  document.getElementById('photoLightbox').classList.remove('open');
}

function lightboxNav(dir) {
  lightboxIdx = (lightboxIdx + dir + lightboxPhotos.length) % lightboxPhotos.length;
  renderLightbox();
  // Sync carousel
  carouselIdx = lightboxIdx;
  const track = document.getElementById('carouselTrack');
  if (track) track.style.transform = `translateX(-${carouselIdx * 100}%)`;
  document.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === carouselIdx));
}

// Keyboard nav
document.addEventListener('keydown', function(e) {
  const lb = document.getElementById('photoLightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') lb.classList.remove('open');
  if (e.key === 'ArrowLeft') lightboxNav(-1);
  if (e.key === 'ArrowRight') lightboxNav(1);
});

// Swipe in lightbox
document.addEventListener('touchstart', function(e) {
  if (!e.target.closest('#photoLightbox.open')) return;
  const startX = e.touches[0].clientX;
  document.addEventListener('touchend', function onEnd(ev) {
    const diff = startX - ev.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) lightboxNav(diff > 0 ? 1 : -1);
    document.removeEventListener('touchend', onEnd);
  }, { once: true });
}, { passive: true });

