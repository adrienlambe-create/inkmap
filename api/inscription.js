const ALLOWED_ORIGINS = ['https://inkmap.fr'];
function cors(req, res) {
  const origin = req.headers.origin || '';
  const ok = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  if (ok) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

// Rate limiting : 10 requêtes / minute / IP
const rateStore = new Map();
function rateLimit(ip, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const rec = rateStore.get(ip) || { n: 0, reset: now + windowMs };
  if (now > rec.reset) { rec.n = 0; rec.reset = now + windowMs; }
  rec.n++;
  rateStore.set(ip, rec);
  return rec.n <= max;
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
  if (!url) return true; // optionnel
  try { const u = new URL(url); return ['http:', 'https:'].includes(u.protocol); } catch { return false; }
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Trop de requêtes, réessaie dans une minute.' });

  const { fields } = req.body || {};
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }

  // Validation des champs obligatoires
  const nom    = sanitize(fields.Nom, 100);
  const studio = sanitize(fields.Studio, 100);
  const email  = sanitize(fields.email || fields.Email, 254);
  if (!nom)    return res.status(400).json({ error: 'Nom requis' });
  if (!studio) return res.status(400).json({ error: 'Studio requis' });
  if (!validEmail(email)) return res.status(400).json({ error: 'Email invalide' });

  const website = sanitize(fields.website || fields.SiteWeb || '', 300);
  if (website && !validUrl(website)) return res.status(400).json({ error: 'URL de site invalide' });

  const tarif = parseInt(fields.tarif ?? fields.Tarif);
  if (isNaN(tarif) || tarif < 0 || tarif > 10_000) {
    return res.status(400).json({ error: 'Tarif invalide' });
  }

  // Construction du payload sanitisé — seuls les champs connus sont transmis
  const cleanFields = {
    Nom:       nom,
    Studio:    studio,
    email:     email,
    instagram: sanitize(fields.instagram || '', 100),
    website:   website,
    ville:     sanitize(fields.ville || '', 100),
    region:    sanitize(fields.region || '', 100),
    adresse:   sanitize(fields.adresse || '', 200),
    styles:    sanitize(fields.styles || '', 300),
    tarif:     tarif,
    tarifInfo: sanitize(fields.tarifInfo || '', 500),
    bio:       sanitize(fields.bio || '', 2000),
    Statut:    'En attente', // forcé côté serveur, pas de confiance au client
  };

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = 'appD1ZqrwZXTza0KR';
  const TABLE = 'tbl5xdM5VGqrieG4a';

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: cleanFields }),
    });
    if (!r.ok) return res.status(r.status).json({ error: 'Erreur lors de l\'enregistrement' });
    res.status(200).json(await r.json());
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
};
