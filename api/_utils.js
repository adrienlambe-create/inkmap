// Utilitaires partagés entre les endpoints API
// Préfixé _ pour être ignoré par Vercel comme endpoint

const ALLOWED_ORIGINS = ['https://inkmap.fr'];

function cors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.headers.origin || '';
  const ok = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  if (ok) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

// Rate limiting en mémoire — limité sur serverless (reset au cold start)
// TODO: migrer vers Upstash Redis ou Vercel KV pour un rate limiting persistant
const rateStore = new Map();
function rateLimit(ip, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const rec = rateStore.get(ip) || { n: 0, reset: now + windowMs };
  if (now > rec.reset) { rec.n = 0; rec.reset = now + windowMs; }
  rec.n++;
  rateStore.set(ip, rec);
  return rec.n <= max;
}

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

// Sanitize : supprime les balises HTML, limite la longueur
function sanitize(val, maxLen = 500) {
  if (typeof val !== 'string') return '';
  return val.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

function validUrl(url) {
  if (!url) return true;
  const withProto = /^https?:\/\//i.test(url) ? url : 'https://' + url;
  try { const u = new URL(withProto); return ['http:', 'https:'].includes(u.protocol); } catch { return false; }
}

function normalizeUrl(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : 'https://' + url;
}

// Échappement HTML pour les templates email
function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Config Airtable
function airtableConfig() {
  return {
    token: process.env.AIRTABLE_TOKEN,
    base: process.env.AIRTABLE_BASE_ID || 'appD1ZqrwZXTza0KR',
    table: process.env.AIRTABLE_TABLE_ID || 'tbl5xdM5VGqrieG4a',
  };
}

// Une inscription n'apparaît sur le site (annuaire, profil, matching des demandes)
// qu'une fois validée à la main dans Airtable : Statut = "Publié".
const STATUT_PUBLIE = 'Publié';
const STATUT_EN_ATTENTE = 'En attente';
function isPublie(fields) {
  return String(fields?.Statut || '').trim().toLowerCase().startsWith('publi');
}

// Filet de sécurité quand Airtable refuse une écriture (quota dépassé, panne…) :
// envoie toutes les données soumises à l'admin pour saisie manuelle.
// Renvoie true si l'email est parti — l'appelant peut alors répondre OK au visiteur.
async function sendAdminFallback({ kind, fields, error }) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return false;
  const fmt = v => {
    if (Array.isArray(v)) return v.map(x => (x && x.url) ? `<a href="${escHtml(x.url)}">${escHtml(x.url)}</a>` : escHtml(String(x))).join('<br>');
    return escHtml(String(v ?? '')).replace(/\n/g, '<br>');
  };
  const rows = Object.entries(fields)
    .filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top">${escHtml(k)}</td><td style="padding:6px 12px">${fmt(v)}</td></tr>`)
    .join('');
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Inkmap <notifications@inkmap.fr>',
        to: process.env.ADMIN_EMAIL || 'inkmap.contact@gmail.com',
        subject: `⚠️ ${kind} non enregistrée dans Airtable — à saisir à la main`,
        html: `
          <h2 style="color:#c0392b;font-family:sans-serif">${escHtml(kind)} non enregistrée dans Airtable</h2>
          <p style="font-family:sans-serif;font-size:14px">Airtable a refusé l'écriture. Le visiteur a vu un message de succès : <strong>crée la fiche à la main</strong> avec les infos ci-dessous.</p>
          <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">${rows}</table>
          <p style="font-family:monospace;font-size:12px;color:#888;margin-top:20px">Erreur Airtable : ${escHtml(String(error || '').slice(0, 500))}</p>`,
      }),
    });
    if (!r.ok) console.error('[fallback] resend', r.status, await r.text().catch(() => ''));
    return r.ok;
  } catch (e) {
    console.error('[fallback] resend exception', e.message);
    return false;
  }
}

module.exports = { cors, rateLimit, getIp, sanitize, validEmail, validUrl, normalizeUrl, escHtml, airtableConfig, STATUT_PUBLIE, STATUT_EN_ATTENTE, isPublie, sendAdminFallback };
