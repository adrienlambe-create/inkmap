// ── TOAST ──────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'error', duration = 4000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── STATS DYNAMIQUES ──────────────────────────────────────────────────────────
(async function() {
  try {
    const res = await fetch('/api/tatoueurs');
    if (!res.ok) return;
    const { records } = await res.json();
    const villes = new Set(records.map(r => {
      const v = (r.fields.Ville || '').trim().replace(/\s+\d+(e|er|ème|eme)?\s*$/i, '').trim();
      return v || r.fields.Ville;
    }).filter(Boolean));
    document.getElementById('trust-nb-tatoueurs').innerHTML = `${records.length}<em>+</em>`;
    document.getElementById('trust-nb-villes').innerHTML = `${villes.size}<em>+</em>`;
  } catch(e) {
    document.getElementById('trust-nb-tatoueurs').innerHTML = `10<em>+</em>`;
    document.getElementById('trust-nb-villes').innerHTML = `5<em>+</em>`;
  }
})();

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = [
  { emoji: "\u2726", nom: "Fineline" },
  { emoji: "\u25C6", nom: "Blackwork" },
  { emoji: "\u26E9", nom: "Japonais" },
  { emoji: "\u2693", nom: "Old School" },
  { emoji: "\uD83D\uDC41", nom: "Réalisme" },
  { emoji: "\u25B3", nom: "Géométrique" },
  { emoji: "\uD83C\uDFA8", nom: "Aquarelle" },
  { emoji: "\uD83C\uDF11", nom: "Tribal" },
  { emoji: "\uD83C\uDF38", nom: "Floral" },
  { emoji: "\uD83C\uDFAC", nom: "Neo-Traditional" },
  { emoji: "\u26A1", nom: "Lettering" },
  { emoji: "\uD83D\uDDA4", nom: "Micro-réalisme" },
];

const grid = document.getElementById('stylesGrid');
styles.forEach(s => {
  const label = document.createElement('label');
  label.className = 'style-check';
  label.innerHTML = `
    <input type="checkbox" value="${s.nom}" onchange="toggleStyle(this)" />
    <span>${s.emoji} ${s.nom}</span>
  `;
  grid.appendChild(label);
});

function toggleStyle(cb) {
  cb.closest('.style-check').classList.toggle('checked', cb.checked);
}

// ── PHOTO UPLOAD ──────────────────────────────────────────────────────────────
let uploadedFiles = [];

function updateUploadUI() {
  const count = uploadedFiles.length;
  document.getElementById('uploadCount').textContent = `${count} / 5`;
  document.querySelectorAll('#uploadDots .dot').forEach((dot, i) => {
    dot.classList.toggle('filled', i < count);
  });
  const placeholder = document.getElementById('uploadPlaceholder');
  const preview = document.getElementById('photoPreview');
  if (count > 0) {
    placeholder.style.display = 'none';
    preview.style.display = 'grid';
  } else {
    placeholder.style.display = '';
    preview.style.display = 'none';
  }
}

function renderPreviews() {
  const preview = document.getElementById('photoPreview');
  preview.innerHTML = '';
  uploadedFiles.forEach((file, i) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    const btn = document.createElement('button');
    btn.className = 'preview-delete';
    btn.type = 'button';
    btn.innerHTML = '\u2715';
    btn.onclick = (e) => { e.stopPropagation(); removePhoto(i); };
    item.appendChild(img);
    item.appendChild(btn);
    preview.appendChild(item);
  });
  updateUploadUI();
}

function addPhotos(files) {
  const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  const remaining = 5 - uploadedFiles.length;
  uploadedFiles = uploadedFiles.concat(newFiles.slice(0, remaining));
  renderPreviews();
}

function removePhoto(index) {
  uploadedFiles.splice(index, 1);
  renderPreviews();
}

(function initUpload() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('photos');

  zone.addEventListener('click', (e) => {
    if (e.target !== input) input.click();
  });

  input.addEventListener('change', () => { addPhotos(input.files); input.value = ''; });

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    addPhotos(e.dataTransfer.files);
  });

  updateUploadUI();
})();

// ── MULTI-VILLES TAGS ────────────────────────────────────────────────────────
const villesArr = [];
const villeInput = document.getElementById('villeInput');
const villesTags = document.getElementById('villesTags');
const villesWrap = document.getElementById('villesWrap');
const villeHidden = document.getElementById('ville');

function renderVilles() {
  villesTags.innerHTML = villesArr.map((v, i) =>
    `<span class="ville-tag">${v}<span class="ville-tag-x" data-i="${i}">&times;</span></span>`
  ).join('');
  villeHidden.value = villesArr.join(', ');
  villesWrap.classList.toggle('invalid', villesArr.length === 0 && villesWrap.classList.contains('invalid'));
}

villesTags.addEventListener('click', e => {
  if (e.target.classList.contains('ville-tag-x')) {
    villesArr.splice(+e.target.dataset.i, 1);
    renderVilles();
  }
});

function addVille() {
  const v = villeInput.value.trim().replace(/,/g, '');
  if (v && !villesArr.includes(v)) {
    villesArr.push(v);
    renderVilles();
  }
  villeInput.value = '';
}

villeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addVille();
  }
  if (e.key === 'Backspace' && !villeInput.value && villesArr.length) {
    villesArr.pop();
    renderVilles();
  }
});

villeInput.addEventListener('blur', () => addVille());
villesWrap.addEventListener('click', () => villeInput.focus());

villeInput.addEventListener('focus', () => {
  const scrollY = window.scrollY;
  const restore = () => window.scrollTo(0, scrollY);
  window.addEventListener('scroll', restore);
  setTimeout(() => window.removeEventListener('scroll', restore), 600);
});

// ── MULTI-STEP ───────────────────────────────────────────────────────────────
let currentStep = 0;
const totalSteps = 4;

function updateProgress() {
  const pct = currentStep / (totalSteps - 1) * 100;
  document.getElementById('progressFill').style.width = pct + '%';

  document.querySelectorAll('.progress-dot').forEach(dot => {
    const s = +dot.dataset.step;
    dot.classList.remove('active', 'done');
    if (s < currentStep) dot.classList.add('done');
    else if (s === currentStep) dot.classList.add('active');
  });

  document.querySelectorAll('.progress-lbl').forEach(lbl => {
    const s = +lbl.dataset.step;
    lbl.classList.remove('active', 'done');
    if (s < currentStep) lbl.classList.add('done');
    else if (s === currentStep) lbl.classList.add('active');
  });
}

function showStep(n) {
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.form-step[data-step="${n}"]`).classList.add('active');
  currentStep = n;
  updateProgress();
  document.getElementById('progressWrap').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

// Allow clicking on progress dots to navigate to completed steps
document.querySelectorAll('.progress-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    const target = +dot.dataset.step;
    if (target < currentStep) showStep(target);
  });
});

// ── INLINE VALIDATION ────────────────────────────────────────────────────────
const validators = {
  nom:    v => v.length >= 2,
  pseudo: v => v.length >= 2,
  studio: v => v.length >= 2,
  email:  v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  ville:  () => villesArr.length > 0,
  region: v => v !== '',
  bio:    v => v.length >= 50,
};

function validateField(id) {
  const el = document.getElementById(id);
  if (!validators[id]) return true;
  const val = el.value.trim();
  const ok = validators[id](val);
  const toggleEl = id === 'ville' ? villesWrap : el;
  toggleEl.classList.toggle('invalid', !ok);
  toggleEl.classList.toggle('valid', ok);
  const errEl = document.getElementById('err-' + id);
  if (errEl) errEl.style.display = ok ? 'none' : 'block';
  return ok;
}

// Attach blur validation to required fields
['nom','pseudo','studio','email','region','bio'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('blur', () => {
    if (el.value.trim()) validateField(id);
  });
});

// ── STEP VALIDATION ──────────────────────────────────────────────────────────
function validateStep(step) {
  let ok = true;
  if (step === 0) {
    ['nom','pseudo','studio','email'].forEach(id => { if (!validateField(id)) ok = false; });
  } else if (step === 1) {
    ['ville','region'].forEach(id => { if (!validateField(id)) ok = false; });
  } else if (step === 2) {
    if (!validateField('bio')) ok = false;
    const stylesChecked = [...document.querySelectorAll('#stylesGrid input:checked')];
    const stylesOk = stylesChecked.length > 0;
    document.getElementById('err-styles').style.display = stylesOk ? 'none' : 'block';
    if (!stylesOk) ok = false;
  } else if (step === 3) {
    const cgu = document.getElementById('cgu').checked;
    document.getElementById('err-cgu').style.display = cgu ? 'none' : 'block';
    if (!cgu) ok = false;
  }
  return ok;
}

function nextStep() {
  if (!validateStep(currentStep)) {
    const firstErr = document.querySelector('.form-step.active .field-error[style*="block"], .form-step.active .invalid');
    if (firstErr) firstErr.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }
  if (currentStep < totalSteps - 1) {
    // Build recap if going to last step
    if (currentStep + 1 === totalSteps - 1) buildRecap();
    showStep(currentStep + 1);
  }
}

function prevStep() {
  if (currentStep > 0) showStep(currentStep - 1);
}

// ── RECAP ────────────────────────────────────────────────────────────────────
function buildRecap() {
  const nom = document.getElementById('nom').value.trim();
  const pseudo = document.getElementById('pseudo').value.trim();
  const studio = document.getElementById('studio').value.trim();
  const email = document.getElementById('email').value.trim();
  const instagram = document.getElementById('instagram').value.trim();
  const ville = villesArr.join(', ');
  const region = document.getElementById('region').value;
  const stylesCoches = [...document.querySelectorAll('#stylesGrid input:checked')].map(cb => cb.value).join(', ');
  const tarif = document.getElementById('tarif').value + ' \u20AC/h';
  const bio = document.getElementById('bio').value.trim();
  const nbPhotos = uploadedFiles.length;

  const items = [
    { label: 'Nom', value: nom },
    { label: 'Nom d\'artiste', value: pseudo },
    { label: 'Studio', value: studio },
    { label: 'Email', value: email },
    { label: 'Instagram', value: instagram || '\u2014' },
    { label: 'Ville(s)', value: ville },
    { label: 'R\u00E9gion', value: region },
    { label: 'Styles', value: stylesCoches, full: true },
    { label: 'Tarif', value: tarif },
    { label: 'Photos', value: nbPhotos > 0 ? nbPhotos + ' photo(s)' : 'Aucune' },
    { label: 'Bio', value: bio.length > 120 ? bio.slice(0, 120) + '\u2026' : bio, full: true },
  ];

  const grid = document.getElementById('recapGrid');
  grid.innerHTML = items.map(it =>
    `<div class="recap-item${it.full ? ' full' : ''}">
      <div class="recap-label">${it.label}</div>
      <div class="recap-value">${it.value}</div>
    </div>`
  ).join('');
}

// ── SUBMIT ────────────────────────────────────────────────────────────────────
async function uploadPhotos() {
  const urls = [];
  for (const file of uploadedFiles) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        'X-Filename': file.name,
      },
      body: file,
    });
    if (!res.ok) throw new Error('Erreur upload photo : ' + file.name);
    const data = await res.json();
    urls.push(data.url);
  }
  return urls;
}

document.getElementById('inscriptionForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validate final step (CGU)
  if (!validateStep(3)) {
    const firstErr = document.querySelector('.form-step.active .field-error[style*="block"]');
    if (firstErr) firstErr.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;

  try {
    // Upload photos first
    let photoUrls = [];
    if (uploadedFiles.length > 0) {
      btn.textContent = '\u23F3  Upload des photos...';
      photoUrls = await uploadPhotos();
    }

    btn.textContent = '\u23F3  Envoi en cours...';

    // Récupère les styles cochés
    const stylesCoches = [...document.querySelectorAll('#stylesGrid input:checked')]
      .map(cb => cb.value).join(', ');

    const data = {
      fields: {
        Nom:       document.getElementById('nom').value.trim(),
        Pseudo:    document.getElementById('pseudo').value.trim(),
        Studio:    document.getElementById('studio').value.trim(),
        email:     document.getElementById('email').value.trim(),
        instagram: document.getElementById('instagram').value.trim(),
        website:   document.getElementById('website').value.trim(),
        ville:     document.getElementById('ville').value.trim(),
        region:    document.getElementById('region').value,
        adresse:   document.getElementById('adresse').value.trim(),
        styles:    stylesCoches,
        tarif:     parseInt(document.getElementById('tarif').value),
        tarifInfo: document.getElementById('tarifInfo').value.trim(),
        bio:       document.getElementById('bio').value.trim(),
        photos:    photoUrls,
        Statut:    'En attente',
      }
    };

    const res = await fetch('/api/inscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      if (res.status === 409) {
        throw new Error('Un profil avec cet email existe déjà. Contacte-nous si tu veux le modifier.');
      }
      throw new Error(err.error || 'Erreur serveur');
    }

    // Hide form, show success
    document.getElementById('formCard').classList.add('hide');
    document.getElementById('progressWrap').style.display = 'none';
    document.getElementById('success').classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Inscription envoy\u00E9e avec succ\u00E8s !', 'success');
  } catch(err) {
    btn.disabled = false;
    btn.textContent = '\u2726  Cr\u00E9er mon profil gratuitement';
    showToast(err.message, 'error');
  }
});

// ── PRÉ-REMPLISSAGE DEPUIS URL (mode "Réclamer ce profil") ──────────────────
(function() {
  const p = new URLSearchParams(window.location.search);
  if (!p.get('nom')) return;

  const banner = document.getElementById('claimBanner');
  banner.style.display = 'flex';
  document.getElementById('claimNom').textContent = p.get('nom');

  const set = (id, val) => { if (val && document.getElementById(id)) document.getElementById(id).value = val; };
  set('nom',       p.get('nom'));
  set('instagram', p.get('instagram'));
  if (p.get('ville')) {
    p.get('ville').split(',').map(v => v.trim()).filter(Boolean).forEach(v => {
      if (!villesArr.includes(v)) villesArr.push(v);
    });
    renderVilles();
  }
  set('region',    p.get('region'));

  if (p.get('tarif')) {
    const slider = document.getElementById('tarif');
    const label  = document.getElementById('tarifVal');
    if (slider) { slider.value = p.get('tarif'); if (label) label.textContent = p.get('tarif'); }
  }

  document.querySelector('.hero h1').innerHTML =
    'R\u00E9clame ton <em>profil</em>';
  document.querySelector('.hero p').textContent =
    'V\u00E9rifie et compl\u00E8te tes infos pour prendre le contr\u00F4le de ton profil Inkmap.';
})();

// ── ENCRE ORGANIQUE ───────────────────────────────────────────────────────────
(function() {
  const turb = document.getElementById('ink-turb');
  if (!turb) return;

  const CFG = [
    { id:'ink-b1', x:78,  y:-8,  w:700, h:620, color:'#c0392b', op:0.32, bph:0.0,  bspd:0.38 },
    { id:'ink-b2', x:-6,  y:55,  w:580, h:520, color:'#d4511a', op:0.26, bph:1.8,  bspd:0.31 },
    { id:'ink-b3', x:52,  y:84,  w:480, h:420, color:'#b02818', op:0.24, bph:3.5,  bspd:0.44 },
    { id:'ink-b4', x:30,  y:25,  w:380, h:340, color:'#e06828', op:0.22, bph:5.1,  bspd:0.27 },
  ];

  CFG.forEach(c => {
    const el = document.getElementById(c.id);
    if (!el) return;
    el.style.cssText = `
      width:${c.w}px; height:${c.h}px;
      left:${c.x}%; top:${c.y}%;
      background: radial-gradient(ellipse at 44% 46%,
        ${c.color} 0%,
        ${c.color}dd 18%,
        ${c.color}88 38%,
        ${c.color}33 58%,
        transparent 72%);
      opacity: ${c.op};
      filter: url(#ink-f);
    `;
  });

  const AMP   = [160, 190, 140, 120];
  const DELAY = [2800, 3600, 3200, 2400];
  const PAR   = [{ x:.04,y:.06 },{ x:-.05,y:-.04 },{ x:.03,y:-.05 },{ x:-.03,y:.04 }];
  const state = CFG.map(() => ({ cx:0, cy:0, tx:0, ty:0 }));

  function pickTarget(i) {
    state[i].tx = (Math.random()*2-1) * AMP[i];
    state[i].ty = (Math.random()*2-1) * AMP[i];
  }
  function schedule(i) {
    setTimeout(() => { pickTarget(i); schedule(i); }, DELAY[i] + Math.random()*2500);
  }
  state.forEach((_, i) => { pickTarget(i); schedule(i); });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  let t = 0, frame = 0;
  const LERP = 0.014;
  const els = CFG.map(c => document.getElementById(c.id));

  (function loop() {
    requestAnimationFrame(loop);
    t += 0.0006;

    if (++frame % 2 === 0) {
      const f1 = (0.013 + Math.sin(t * 1.1) * 0.007).toFixed(5);
      const f2 = (0.009 + Math.cos(t * 0.8) * 0.005).toFixed(5);
      turb.setAttribute('baseFrequency', `${f1} ${f2}`);
    }

    state.forEach((s, i) => {
      s.cx += (s.tx - s.cx) * LERP;
      s.cy += (s.ty - s.cy) * LERP;
      const sc = 1.05 + Math.sin(t * CFG[i].bspd + CFG[i].bph) * 0.17;
      const tx = (s.cx + scrollY * PAR[i].x).toFixed(1);
      const ty = (s.cy + scrollY * PAR[i].y).toFixed(1);
      if (els[i]) els[i].style.transform =
        `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${sc.toFixed(3)})`;
    });
  })();
})();
