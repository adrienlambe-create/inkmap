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

module.exports = { cors, rateLimit, getIp, sanitize, validEmail, validUrl, normalizeUrl, escHtml, airtableConfig };
