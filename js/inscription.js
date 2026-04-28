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

// ── TYPE: solo par défaut, toggle via checkbox ───────────────────────────────
let profileType = 'solo';

function toggleStudioMode(isStudio) {
  profileType = isStudio ? 'studio' : 'solo';

  if (isStudio) {
    document.getElementById('soloNameFields').style.display = 'none';
    document.getElementById('soloArtSection').style.display = 'none';
    document.getElementById('studioArtSection').style.display = '';
    if (artistBlocks.length === 0) addArtistBlock();
  } else {
    document.getElementById('soloNameFields').style.display = '';
    document.getElementById('soloArtSection').style.display = '';
    document.getElementById('studioArtSection').style.display = 'none';
  }
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const STYLE_LIST = [
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

// Build solo styles grid
const grid = document.getElementById('stylesGrid');
STYLE_LIST.forEach(s => {
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

// ── PHOTO UPLOAD (solo mode) ─────────────────────────────────────────────────
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

// ── STUDIO: ARTIST BLOCKS ────────────────────────────────────────────────────
let artistBlocks = []; // { id, files: [] }
let artistIdCounter = 0;

function buildStylesGridHTML(blockId) {
  return STYLE_LIST.map(s =>
    `<label class="style-check">
      <input type="checkbox" value="${s.nom}" onchange="this.closest('.style-check').classList.toggle('checked', this.checked)" />
      <span>${s.emoji} ${s.nom}</span>
    </label>`
  ).join('');
}

function addArtistBlock() {
  const id = artistIdCounter++;
  artistBlocks.push({ id, files: [] });

  const container = document.getElementById('artistBlocks');
  const block = document.createElement('div');
  block.className = 'artist-block';
  block.id = `artist-block-${id}`;
  block.innerHTML = `
    <div class="artist-block-header">
      <div class="artist-block-title">Artiste ${artistBlocks.length}</div>
      ${artistBlocks.length > 1 ? `<button type="button" class="artist-block-remove" onclick="removeArtistBlock(${id})">Supprimer</button>` : ''}
    </div>

    <div class="form-row" style="margin-bottom:16px">
      <div class="form-group">
        <label>Pr&eacute;nom &amp; Nom <span class="required">*</span></label>
        <input type="text" id="artist-nom-${id}" placeholder="Ex : Lucas Moreau" />
        <div class="field-error" id="err-artist-nom-${id}">Champ obligatoire</div>
      </div>
      <div class="form-group">
        <label>Pseudo / Nom d'artiste <span class="required">*</span></label>
        <input type="text" id="artist-pseudo-${id}" placeholder="Ex : Lorie Ink" />
        <div class="field-error" id="err-artist-pseudo-${id}">Champ obligatoire</div>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:16px">
      <label>Styles <span class="required">*</span></label>
      <div class="styles-grid" id="artist-styles-${id}">
        ${buildStylesGridHTML(id)}
      </div>
      <div class="field-error" id="err-artist-styles-${id}">S&eacute;lectionne au moins un style</div>
    </div>

    <div class="form-group" style="margin-bottom:16px">
      <label>Tarif horaire</label>
      <div class="tarif-display">
        <span id="artist-tarifVal-${id}">150</span>&euro; <small>/ heure</small>
      </div>
      <input type="range" id="artist-tarif-${id}" min="50" max="400" value="150" step="10"
        oninput="document.getElementById('artist-tarifVal-${id}').textContent = this.value" />
      <div class="tarif-labels">
        <span>50&euro;</span>
        <span>200&euro;</span>
        <span>400&euro;+</span>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:16px">
      <label>Bio / Description <span style="color:var(--muted);font-weight:400;font-size:0.72rem">(optionnel)</span></label>
      <textarea id="artist-bio-${id}" placeholder="Son style, son parcours, ce qui l'inspire..."></textarea>
    </div>

    <div class="form-group">
      <label>Photos <span style="color:var(--muted);font-weight:400;font-size:0.78rem">(optionnel)</span></label>
      <div class="upload-zone" id="artist-uploadZone-${id}">
        <input type="file" id="artist-photos-${id}" accept="image/*" multiple />
        <div id="artist-uploadPlaceholder-${id}">
          <div class="upload-icon">&#x1F5BC;&#xFE0F;</div>
          <div class="upload-text">
            <strong>Glisse les photos ici</strong>
            Max 5 photos, 10 MB chacune
          </div>
          <div class="upload-counter">
            <span id="artist-uploadCount-${id}">0 / 5</span>
          </div>
        </div>
        <div class="upload-preview" id="artist-photoPreview-${id}"></div>
      </div>
    </div>
  `;

  container.appendChild(block);

  // Init upload for this artist block
  initArtistUpload(id);

  // Hide error
  document.getElementById('err-artists').style.display = 'none';

  // Update numbering
  updateArtistNumbering();
}

function removeArtistBlock(id) {
  const idx = artistBlocks.findIndex(a => a.id === id);
  if (idx === -1) return;
  artistBlocks.splice(idx, 1);
  const el = document.getElementById(`artist-block-${id}`);
  if (el) el.remove();
  updateArtistNumbering();
}

function updateArtistNumbering() {
  const blocks = document.querySelectorAll('.artist-block');
  blocks.forEach((block, i) => {
    block.querySelector('.artist-block-title').textContent = `Artiste ${i + 1}`;
    // Show/hide remove button: always show if more than 1
    const removeBtn = block.querySelector('.artist-block-remove');
    if (blocks.length > 1 && !removeBtn) {
      const id = parseInt(block.id.replace('artist-block-', ''));
      const header = block.querySelector('.artist-block-header');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'artist-block-remove';
      btn.textContent = 'Supprimer';
      btn.onclick = () => removeArtistBlock(id);
      header.appendChild(btn);
    } else if (blocks.length <= 1 && removeBtn) {
      removeBtn.remove();
    }
  });
}

function initArtistUpload(id) {
  const zone = document.getElementById(`artist-uploadZone-${id}`);
  const input = document.getElementById(`artist-photos-${id}`);
  const block = artistBlocks.find(a => a.id === id);

  zone.addEventListener('click', (e) => {
    if (e.target !== input) input.click();
  });

  input.addEventListener('change', () => {
    addArtistPhotos(id, input.files);
    input.value = '';
  });

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    addArtistPhotos(id, e.dataTransfer.files);
  });
}

function addArtistPhotos(id, files) {
  const block = artistBlocks.find(a => a.id === id);
  if (!block) return;
  const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  const remaining = 5 - block.files.length;
  block.files = block.files.concat(newFiles.slice(0, remaining));
  renderArtistPreviews(id);
}

function removeArtistPhoto(id, index) {
  const block = artistBlocks.find(a => a.id === id);
  if (!block) return;
  block.files.splice(index, 1);
  renderArtistPreviews(id);
}

function renderArtistPreviews(id) {
  const block = artistBlocks.find(a => a.id === id);
  if (!block) return;
  const preview = document.getElementById(`artist-photoPreview-${id}`);
  const placeholder = document.getElementById(`artist-uploadPlaceholder-${id}`);
  const count = block.files.length;

  document.getElementById(`artist-uploadCount-${id}`).textContent = `${count} / 5`;

  if (count > 0) {
    placeholder.style.display = 'none';
    preview.style.display = 'grid';
  } else {
    placeholder.style.display = '';
    preview.style.display = 'none';
  }

  preview.innerHTML = '';
  block.files.forEach((file, i) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    const btn = document.createElement('button');
    btn.className = 'preview-delete';
    btn.type = 'button';
    btn.innerHTML = '\u2715';
    btn.onclick = (e) => { e.stopPropagation(); removeArtistPhoto(id, i); };
    item.appendChild(img);
    item.appendChild(btn);
    preview.appendChild(item);
  });
}

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
  studio: v => v.length >= 2,
  email:  v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  ville:  () => villesArr.length > 0,
  region: v => v !== '',
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
['nom','studio','email','region'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('blur', () => {
    if (el.value.trim()) validateField(id);
  });
});

// ── MAILCHECK: détection de typos sur le domaine email ───────────────────────
const EMAIL_DOMAIN_TYPOS = {
  'gmail.com':  ['gmial.com','gmai.com','gmaul.com','gmial.co','gmail.co','gmail.cm','gmil.com','gmail.con','gnail.com','gmail.fr'],
  'hotmail.com':['hotmial.com','hotmai.com','htomail.com','hotmail.co','hotmal.com','hotmail.cm','hotmial.fr'],
  'hotmail.fr': ['hotmial.fr','hotmai.fr','htomail.fr','hotmail.f','hotmal.fr'],
  'yahoo.fr':   ['yaho.fr','yahoo.f','yahho.fr','yahou.fr'],
  'yahoo.com':  ['yahoo.cm','yaho.com','yahho.com'],
  'outlook.fr': ['outlook.f','outlok.fr','outloook.fr'],
  'outlook.com':['outlok.com','outlook.cm','outloook.com'],
  'orange.fr':  ['oranege.fr','orangee.fr','orange.f','oange.fr'],
  'free.fr':    ['frre.fr','free.f','fre.fr'],
  'wanadoo.fr': ['wanadoo.f','wandoo.fr','wanado.fr'],
  'sfr.fr':     ['sfr.f','sffr.fr'],
  'laposte.net':['laposte.fr','laposte.ne','laposte.com']
};

function suggestEmailCorrection(email) {
  const at = email.indexOf('@');
  if (at < 1) return null;
  const domain = email.slice(at + 1).toLowerCase();
  for (const [good, typos] of Object.entries(EMAIL_DOMAIN_TYPOS)) {
    if (typos.includes(domain)) return email.slice(0, at + 1) + good;
  }
  return null;
}

(function initEmailCheck() {
  const emailEl = document.getElementById('email');
  const sugg = document.getElementById('emailSuggest');
  if (!emailEl || !sugg) return;
  emailEl.addEventListener('blur', () => {
    const v = emailEl.value.trim();
    if (!v) { sugg.style.display = 'none'; return; }
    const fix = suggestEmailCorrection(v);
    if (fix) {
      sugg.innerHTML = `Tu voulais dire <strong>${fix}</strong>&nbsp;? <span style="text-decoration:underline">Oui, corriger</span>`;
      sugg.style.display = 'block';
      sugg.onclick = () => { emailEl.value = fix; sugg.style.display = 'none'; validateField('email'); };
    } else {
      sugg.style.display = 'none';
    }
  });
})();

// ── ARTIST BLOCK VALIDATION ──────────────────────────────────────────────────
function validateArtistBlock(block) {
  let ok = true;
  const id = block.id;

  // Nom
  const nom = document.getElementById(`artist-nom-${id}`);
  const nomOk = nom.value.trim().length >= 2;
  nom.classList.toggle('invalid', !nomOk);
  document.getElementById(`err-artist-nom-${id}`).style.display = nomOk ? 'none' : 'block';
  if (!nomOk) ok = false;

  // Pseudo
  const pseudo = document.getElementById(`artist-pseudo-${id}`);
  const pseudoOk = pseudo.value.trim().length >= 2;
  pseudo.classList.toggle('invalid', !pseudoOk);
  document.getElementById(`err-artist-pseudo-${id}`).style.display = pseudoOk ? 'none' : 'block';
  if (!pseudoOk) ok = false;

  // Styles
  const stylesChecked = document.querySelectorAll(`#artist-styles-${id} input:checked`);
  const stylesOk = stylesChecked.length > 0;
  document.getElementById(`err-artist-styles-${id}`).style.display = stylesOk ? 'none' : 'block';
  if (!stylesOk) ok = false;

  // Bio optionnelle (pas de validation)

  return ok;
}

// ── STEP VALIDATION ──────────────────────────────────────────────────────────
function validateStep(step) {
  let ok = true;
  if (step === 0) {
    if (profileType === 'solo') {
      ['nom','studio','email'].forEach(id => { if (!validateField(id)) ok = false; });
    } else {
      ['studio','email'].forEach(id => { if (!validateField(id)) ok = false; });
    }
  } else if (step === 1) {
    ['ville','region'].forEach(id => { if (!validateField(id)) ok = false; });
  } else if (step === 2) {
    if (profileType === 'solo') {
      const stylesChecked = [...document.querySelectorAll('#stylesGrid input:checked')];
      const stylesOk = stylesChecked.length > 0;
      document.getElementById('err-styles').style.display = stylesOk ? 'none' : 'block';
      if (!stylesOk) ok = false;
    } else {
      // Studio: validate each artist block
      if (artistBlocks.length === 0) {
        document.getElementById('err-artists').style.display = 'block';
        ok = false;
      } else {
        document.getElementById('err-artists').style.display = 'none';
        artistBlocks.forEach(block => {
          if (!validateArtistBlock(block)) ok = false;
        });
      }
    }
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
  const studio = document.getElementById('studio').value.trim();
  const email = document.getElementById('email').value.trim();
  const instagram = document.getElementById('instagram').value.trim();
  const ville = villesArr.join(', ');
  const region = document.getElementById('region').value;

  const items = [];

  if (profileType === 'solo') {
    const nom = document.getElementById('nom').value.trim();
    const pseudo = document.getElementById('pseudo').value.trim();
    const stylesCoches = [...document.querySelectorAll('#stylesGrid input:checked')].map(cb => cb.value).join(', ');
    const tarif = document.getElementById('tarif').value + ' \u20AC/h';
    const bio = document.getElementById('bio').value.trim();
    const nbPhotos = uploadedFiles.length;

    items.push(
      { label: 'Type', value: 'Tatoueur ind\u00E9pendant' },
      { label: 'Nom', value: nom },
      { label: 'Nom d\'artiste', value: pseudo || '\u2014' },
      { label: 'Studio', value: studio },
      { label: 'Email', value: email },
      { label: 'Instagram', value: instagram || '\u2014' },
      { label: 'Ville(s)', value: ville },
      { label: 'R\u00E9gion', value: region },
      { label: 'Styles', value: stylesCoches, full: true },
      { label: 'Tarif', value: tarif },
      { label: 'Photos', value: nbPhotos > 0 ? nbPhotos + ' photo(s)' : 'Aucune' },
      { label: 'Bio', value: bio ? (bio.length > 120 ? bio.slice(0, 120) + '\u2026' : bio) : '(g\u00E9n\u00E9r\u00E9e auto)', full: true },
    );
  } else {
    items.push(
      { label: 'Type', value: 'Studio' },
      { label: 'Studio', value: studio },
      { label: 'Email', value: email },
      { label: 'Instagram', value: instagram || '\u2014' },
      { label: 'Ville(s)', value: ville },
      { label: 'R\u00E9gion', value: region },
    );

    artistBlocks.forEach((block, i) => {
      const nom = document.getElementById(`artist-nom-${block.id}`).value.trim();
      const pseudo = document.getElementById(`artist-pseudo-${block.id}`).value.trim();
      const styles = [...document.querySelectorAll(`#artist-styles-${block.id} input:checked`)].map(cb => cb.value).join(', ');
      const tarif = document.getElementById(`artist-tarif-${block.id}`).value + ' \u20AC/h';
      const bio = document.getElementById(`artist-bio-${block.id}`).value.trim();
      const nbPhotos = block.files.length;

      items.push(
        { label: `Artiste ${i + 1}`, value: `${pseudo} (${nom})`, full: true,
          style: 'background:rgba(192,57,43,0.06);border-color:rgba(192,57,43,0.15)' },
        { label: 'Styles', value: styles },
        { label: 'Tarif', value: tarif },
        { label: 'Photos', value: nbPhotos > 0 ? nbPhotos + ' photo(s)' : 'Aucune' },
        { label: 'Bio', value: bio.length > 80 ? bio.slice(0, 80) + '\u2026' : bio, full: true },
      );
    });
  }

  const recapGrid = document.getElementById('recapGrid');
  recapGrid.innerHTML = items.map(it =>
    `<div class="recap-item${it.full ? ' full' : ''}"${it.style ? ` style="${it.style}"` : ''}>
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

async function uploadArtistPhotos(files) {
  const urls = [];
  for (const file of files) {
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
    const studioName = document.getElementById('studio').value.trim();
    const email = document.getElementById('email').value.trim();
    const instagram = document.getElementById('instagram').value.trim();
    const website = document.getElementById('website').value.trim();
    const ville = document.getElementById('ville').value.trim();
    const region = document.getElementById('region').value;
    const adresse = document.getElementById('adresse').value.trim();

    if (profileType === 'solo') {
      // Solo: single inscription (same as before)
      let photoUrls = [];
      if (uploadedFiles.length > 0) {
        btn.textContent = '\u23F3  Upload des photos...';
        photoUrls = await uploadPhotos();
      }

      btn.textContent = '\u23F3  Envoi en cours...';

      const stylesCoches = [...document.querySelectorAll('#stylesGrid input:checked')]
        .map(cb => cb.value).join(', ');

      const data = {
        fields: {
          Nom:       document.getElementById('nom').value.trim(),
          Pseudo:    document.getElementById('pseudo').value.trim(),
          Studio:    studioName,
          email,
          instagram,
          website,
          ville,
          region,
          adresse,
          styles:    stylesCoches,
          tarif:     parseInt(document.getElementById('tarif').value),
          tarifInfo: document.getElementById('tarifInfo').value.trim(),
          bio:       document.getElementById('bio').value.trim(),
          photos:    photoUrls,
          type:      'Solo',
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
          throw new Error('Un profil avec cet email existe d\u00E9j\u00E0. Contacte-nous si tu veux le modifier.');
        }
        throw new Error(err.error || 'Erreur serveur');
      }
      const submitted = await res.json();
      window.__lastRecordIds = submitted && submitted.id ? [submitted.id] : [];
    } else {
      // Studio: one inscription per artist
      btn.textContent = '\u23F3  Envoi en cours...';

      for (let i = 0; i < artistBlocks.length; i++) {
        const block = artistBlocks[i];
        const artistNom = document.getElementById(`artist-nom-${block.id}`).value.trim();
        const artistPseudo = document.getElementById(`artist-pseudo-${block.id}`).value.trim();
        const artistStyles = [...document.querySelectorAll(`#artist-styles-${block.id} input:checked`)]
          .map(cb => cb.value).join(', ');
        const artistTarif = parseInt(document.getElementById(`artist-tarif-${block.id}`).value);
        const artistBio = document.getElementById(`artist-bio-${block.id}`).value.trim();

        let photoUrls = [];
        if (block.files.length > 0) {
          btn.textContent = `\u23F3  Upload photos artiste ${i + 1}/${artistBlocks.length}...`;
          photoUrls = await uploadArtistPhotos(block.files);
        }

        btn.textContent = `\u23F3  Envoi artiste ${i + 1}/${artistBlocks.length}...`;

        const data = {
          fields: {
            Nom:       artistNom,
            Pseudo:    artistPseudo,
            Studio:    studioName,
            email,
            instagram,
            website,
            ville,
            region,
            adresse,
            styles:    artistStyles,
            tarif:     artistTarif,
            bio:       artistBio,
            photos:    photoUrls,
            type:      'Studio',
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
          throw new Error(err.error || `Erreur pour l'artiste ${artistPseudo}`);
        }
        const artistSubmitted = await res.json();
        if (artistSubmitted && artistSubmitted.id) {
          window.__lastRecordIds = window.__lastRecordIds || [];
          window.__lastRecordIds.push(artistSubmitted.id);
        }
      }
    }

    // Hide form, show success
    document.getElementById('formCard').classList.add('hide');
    document.getElementById('progressWrap').style.display = 'none';
    document.getElementById('success').classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Inscription envoy\u00E9e avec succ\u00E8s !', 'success');

    // Vider l'autosave
    try { localStorage.removeItem('inkmap_inscription_draft'); } catch(e) {}
  } catch(err) {
    btn.disabled = false;
    btn.textContent = '\u2192  Recevoir mes premi\u00E8res demandes';
    showToast(err.message, 'error');
  }
});

// \u2500\u2500 SOURCE POST-SUBMIT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.querySelectorAll('input[name="source"]').forEach(radio => {
  radio.addEventListener('change', async () => {
    const ids = window.__lastRecordIds || [];
    if (ids.length === 0) return;
    const source = radio.value;
    const confirmEl = document.getElementById('sourceConfirm');
    try {
      await Promise.all(ids.map(id =>
        fetch('/api/update-source', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId: id, source })
        })
      ));
      if (confirmEl) confirmEl.style.display = 'block';
    } catch(e) {
      console.error('update-source failed', e);
    }
  });
});

// \u2500\u2500 AUTOSAVE localStorage \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const AUTOSAVE_KEY = 'inkmap_inscription_draft';
const AUTOSAVE_FIELDS = ['nom','pseudo','studio','email','instagram','website','region','adresse','tarif','tarifInfo','bio'];

function saveDraft() {
  try {
    const draft = { v: 1, ts: Date.now() };
    AUTOSAVE_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) draft[id] = el.value;
    });
    draft.villes = villesArr.slice();
    draft.isStudio = document.getElementById('isStudio')?.checked || false;
    draft.styles = [...document.querySelectorAll('#stylesGrid input:checked')].map(cb => cb.value);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
  } catch(e) {}
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft.ts || Date.now() - draft.ts > 7 * 24 * 3600 * 1000) {
      localStorage.removeItem(AUTOSAVE_KEY);
      return;
    }
    AUTOSAVE_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && draft[id]) {
        el.value = draft[id];
        if (id === 'tarif') {
          const lbl = document.getElementById('tarifVal');
          if (lbl) lbl.textContent = draft[id];
        }
      }
    });
    if (Array.isArray(draft.villes)) {
      draft.villes.forEach(v => { if (!villesArr.includes(v)) villesArr.push(v); });
      renderVilles();
    }
    if (draft.isStudio) {
      const cb = document.getElementById('isStudio');
      if (cb) { cb.checked = true; toggleStudioMode(true); }
    }
    if (Array.isArray(draft.styles)) {
      draft.styles.forEach(v => {
        const cb = document.querySelector(`#stylesGrid input[value="${v}"]`);
        if (cb) { cb.checked = true; cb.closest('.style-check').classList.add('checked'); }
      });
    }
    setTimeout(() => showToast('Brouillon restaur\u00E9', 'success', 2500), 600);
  } catch(e) { console.warn('restoreDraft failed', e); }
}

AUTOSAVE_FIELDS.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', saveDraft);
});
document.addEventListener('change', e => {
  if (e.target.matches('#stylesGrid input, #isStudio')) saveDraft();
});
window.addEventListener('beforeunload', saveDraft);

setTimeout(restoreDraft, 0);

// ── PRÉ-REMPLISSAGE DEPUIS URL (mode "Réclamer ce profil") ──────────────────
(function() {
  const p = new URLSearchParams(window.location.search);
  if (!p.get('nom')) return;

  const banner = document.getElementById('claimBanner');
  banner.style.display = 'flex';
  document.getElementById('claimNom').textContent = p.get('nom');

  const set = (id, val) => { if (val && document.getElementById(id)) document.getElementById(id).value = val; };

  // Si le profil réclamé est un studio, on auto-coche la case et on met le nom
  // scrappé dans le champ "Nom du studio" (pas dans "Prénom & Nom" solo).
  const isStudioClaim = (p.get('type') || '').toLowerCase() === 'studio';
  if (isStudioClaim) {
    const checkbox = document.getElementById('isStudio');
    if (checkbox) {
      checkbox.checked = true;
      toggleStudioMode(true);
    }
    set('studio', p.get('nom'));
  } else {
    set('nom', p.get('nom'));
  }

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
