// Formulaire de demande (lead capture) — upload photos, submit, validation client.

const STYLES_DISPONIBLES = [
  'Fineline', 'Blackwork', 'Réalisme', 'Japonais', 'Old school',
  'Traditionnel', 'Géométrique', 'Aquarelle', 'Dotwork', 'Graphique',
  'Tribal', 'Lettering', 'Floral', 'Portrait', 'Micro-réalisme'
];

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const state = {
  styles: new Set(),
  photos: [],
};

function flash(kind, text) {
  const el = $('#formMsg');
  el.innerHTML = `<div class="msg ${kind}">${esc(text)}</div>`;
  if (kind === 'err') el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderStyleTags() {
  const container = $('#styleTags');
  container.innerHTML = STYLES_DISPONIBLES.map(s => {
    const active = state.styles.has(s) ? ' active' : '';
    return `<div class="style-tag${active}" data-style="${esc(s)}">${esc(s)}</div>`;
  }).join('');
  container.querySelectorAll('.style-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const s = tag.dataset.style;
      if (state.styles.has(s)) state.styles.delete(s);
      else state.styles.add(s);
      tag.classList.toggle('active');
    });
  });
}

function renderPhotos() {
  const grid = $('#photosGrid');
  const items = state.photos.map((url, i) => `
    <div class="photo-item" data-i="${i}">
      <img src="${esc(url)}" alt="Inspiration ${i + 1}" loading="lazy" />
      <button type="button" class="photo-remove" title="Supprimer" data-i="${i}">×</button>
    </div>
  `).join('');
  const addBtn = state.photos.length < MAX_PHOTOS
    ? `<div class="photo-add" id="addPhotoBtn">+ Ajouter<br>une photo</div>`
    : '';
  grid.innerHTML = items + addBtn;

  grid.querySelectorAll('.photo-remove').forEach(b => {
    b.addEventListener('click', () => {
      const i = parseInt(b.dataset.i);
      state.photos.splice(i, 1);
      renderPhotos();
    });
  });
  const add = $('#addPhotoBtn');
  if (add) add.addEventListener('click', () => $('#photoInput').click());
}

async function uploadPhoto(file) {
  const r = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'image/jpeg',
      'X-Filename': encodeURIComponent(file.name || 'photo.jpg'),
    },
    body: file,
  });
  if (!r.ok) throw new Error('Upload failed');
  const { url } = await r.json();
  return url;
}

function initBudget() {
  const input = $('#f-budget');
  const display = $('#budgetValue');

  const update = () => {
    const v = parseInt(input.value);
    display.textContent = v >= 2000 ? '2000€ et +' : `${v}€`;
  };

  // Valeur par défaut : pas de budget sélectionné tant que l'utilisateur ne touche pas le slider.
  // Le champ n'est envoyé que si interaction explicite.
  input.value = 300;
  display.textContent = '— (touche le curseur pour régler)';

  input.addEventListener('input', () => {
    input.dataset.touched = '1';
    update();
  });
}

function initPhotoUpload() {
  $('#photoInput').addEventListener('change', async (e) => {
    const files = [...(e.target.files || [])];
    const grid = $('#photosGrid');
    grid.classList.add('upload-loading');
    for (const f of files) {
      if (state.photos.length >= MAX_PHOTOS) break;
      if (f.size > MAX_FILE_SIZE) {
        flash('err', `Photo trop lourde (max 10 MB) : ${f.name}`);
        continue;
      }
      try {
        const url = await uploadPhoto(f);
        state.photos.push(url);
      } catch {
        flash('err', `Erreur upload : ${f.name}`);
      }
    }
    grid.classList.remove('upload-loading');
    e.target.value = '';
    renderPhotos();
  });
}

function initSubmit() {
  $('#demandeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#formMsg').innerHTML = '';

    const description = $('#f-description').value.trim();
    const ville = $('#f-ville').value.trim();
    const email = $('#f-email').value.trim();

    if (description.length < 10) {
      flash('err', 'Décris ton projet en quelques mots (10 caractères minimum).');
      return;
    }
    if (!ville) { flash('err', 'Indique ta ville.'); return; }
    if (!email.includes('@') || !email.includes('.')) { flash('err', 'Email invalide.'); return; }

    const budgetInput = $('#f-budget');
    const budget = budgetInput.dataset.touched ? parseInt(budgetInput.value) : null;

    const payload = {
      description,
      ville,
      email,
      styles: [...state.styles],
      zoneCorps: $('#f-zone').value || '',
      telephone: $('#f-telephone').value.trim(),
      photos: state.photos,
      website: $('#website').value, // honeypot
      ...(budget ? { budget } : {}),
    };

    const btn = $('#submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span id="spinner"></span>Envoi...';

    try {
      const r = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        $('#formState').classList.add('hidden');
        $('#successState').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (r.status === 429) {
        flash('err', data.error || 'Trop de demandes. Réessaie plus tard.');
      } else {
        flash('err', data.error || 'Erreur lors de l\'envoi. Réessaie.');
      }
    } catch {
      flash('err', 'Erreur réseau. Vérifie ta connexion.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Envoyer ma demande →';
    }
  });
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  const styleParam = params.get('style');
  if (styleParam) {
    const match = STYLES_DISPONIBLES.find(s => s.toLowerCase() === styleParam.toLowerCase());
    if (match) state.styles.add(match);
  }
  const villeParam = params.get('ville');
  if (villeParam) {
    const input = $('#f-ville');
    if (input) input.value = villeParam.slice(0, 100);
  }
}

// Bootstrap
applyUrlParams();
renderStyleTags();
renderPhotos();
initBudget();
initPhotoUpload();
initSubmit();
