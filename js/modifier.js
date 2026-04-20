// Page d'édition profil — gère 3 états : demande de lien, édition, lien invalide.

const STYLES_DISPONIBLES = [
  'Fineline', 'Blackwork', 'Réalisme', 'Japonais', 'Old school',
  'Traditionnel', 'Géométrique', 'Aquarelle', 'Dotwork', 'Graphique',
  'Tribal', 'Lettering', 'Floral', 'Portrait', 'Micro-réalisme'
];

const $ = (sel) => document.querySelector(sel);
const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

let state = {
  token: '',
  photos: [],       // Array<string> URLs
  styles: new Set(),
};

function getToken() {
  const p = new URLSearchParams(window.location.search);
  return (p.get('token') || '').trim();
}

function flash(el, kind, text) {
  el.innerHTML = `<div class="msg ${kind}">${esc(text)}</div>`;
  if (kind === 'ok') setTimeout(() => { el.innerHTML = ''; }, 6000);
}

// ── ÉTAT 1 : demande de lien ─────────────────────────────────────────────
function initRequestState() {
  show('stateRequest');
  const form = $('#requestForm');
  const btn = $('#requestBtn');
  const msg = $('#requestMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.innerHTML = '';
    const email = $('#email').value.trim();
    if (!email || !email.includes('@')) {
      flash(msg, 'err', 'Email invalide');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Envoi...';
    try {
      const r = await fetch('/api/request-edit-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (r.status === 429) {
        flash(msg, 'err', 'Trop de demandes, réessaie dans une minute.');
      } else {
        flash(msg, 'ok', 'Si un profil existe avec cet email, tu vas recevoir un lien dans quelques instants. Pense à vérifier tes spams.');
        form.reset();
      }
    } catch {
      flash(msg, 'err', 'Erreur réseau, réessaie.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Recevoir le lien →';
    }
  });
}

// ── ÉTAT 2 : édition ─────────────────────────────────────────────────────
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
      <img src="${esc(url)}" alt="Photo ${i+1}" loading="lazy" />
      <button type="button" class="photo-remove" title="Supprimer" data-i="${i}">×</button>
    </div>
  `).join('');
  const addBtn = state.photos.length < 12
    ? `<div class="photo-add" id="addPhotoBtn">+ Ajouter</div>`
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

function initEditState(fields) {
  show('stateEdit');
  $('#f-nom').value = fields.Nom || '';
  $('#f-pseudo').value = fields.Pseudo || '';
  $('#f-ville').value = fields.Ville || '';
  $('#f-region').value = fields.Region || '';
  $('#f-instagram').value = fields.Instagram || '';
  $('#f-site').value = fields.Site || '';
  $('#f-adresse').value = fields.Adresse || '';
  $('#f-bio').value = fields.Bio || '';
  $('#f-tarifInfo').value = fields.TarifInfo || '';

  const tarif = parseInt(fields.Tarif) || 150;
  $('#f-tarif').value = tarif;
  $('#tarifValue').textContent = tarif;
  $('#f-tarif').addEventListener('input', () => {
    $('#tarifValue').textContent = $('#f-tarif').value;
  });

  const rawStyles = fields.Styles;
  state.styles = new Set(Array.isArray(rawStyles)
    ? rawStyles
    : (typeof rawStyles === 'string' ? rawStyles.split(',').map(s => s.trim()).filter(Boolean) : []));
  renderStyleTags();

  state.photos = Array.isArray(fields.Photos) ? [...fields.Photos] : [];
  renderPhotos();

  // Upload handler
  $('#photoInput').addEventListener('change', async (e) => {
    const files = [...(e.target.files || [])];
    const grid = $('#photosGrid');
    grid.classList.add('upload-loading');
    for (const f of files) {
      if (state.photos.length >= 12) break;
      if (f.size > 10 * 1024 * 1024) {
        flash($('#editMsg'), 'err', `Photo trop lourde (max 10 MB) : ${f.name}`);
        continue;
      }
      try {
        const url = await uploadPhoto(f);
        state.photos.push(url);
      } catch (err) {
        flash($('#editMsg'), 'err', `Erreur upload : ${f.name}`);
      }
    }
    grid.classList.remove('upload-loading');
    e.target.value = '';
    renderPhotos();
  });

  // Submit
  $('#editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#editMsg');
    const btn = $('#saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<span id="spinner"></span>Enregistrement...';
    msg.innerHTML = '';

    const payload = {
      token: state.token,
      fields: {
        Nom: $('#f-nom').value.trim(),
        Pseudo: $('#f-pseudo').value.trim(),
        Ville: $('#f-ville').value.trim(),
        Region: $('#f-region').value.trim(),
        Instagram: $('#f-instagram').value.trim(),
        Site: $('#f-site').value.trim(),
        Adresse: $('#f-adresse').value.trim(),
        Bio: $('#f-bio').value.trim(),
        TarifInfo: $('#f-tarifInfo').value.trim(),
        Tarif: parseInt($('#f-tarif').value) || 0,
        Styles: [...state.styles],
        Photos: state.photos,
      },
    };

    try {
      const r = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        flash(msg, 'ok', 'Profil mis à jour ✓ Les changements apparaitront sur Inkmap dans la minute.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (r.status === 401) {
        hide('stateEdit');
        show('stateInvalid');
      } else {
        flash(msg, 'err', data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      flash(msg, 'err', 'Erreur réseau');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enregistrer les modifications →';
    }
  });
}

// ── Bootstrap ────────────────────────────────────────────────────────────
(async function init() {
  const token = getToken();
  if (!token) { initRequestState(); return; }

  state.token = token;
  try {
    const r = await fetch(`/api/profile-by-token?token=${encodeURIComponent(token)}`);
    if (r.status === 401 || r.status === 400) { show('stateInvalid'); return; }
    if (!r.ok) throw new Error('fetch');
    const { fields } = await r.json();
    initEditState(fields || {});
  } catch {
    show('stateInvalid');
  }
})();
