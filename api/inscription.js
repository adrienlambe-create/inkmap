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
  // Ajouter https:// si pas de protocole
  const withProto = /^https?:\/\//i.test(url) ? url : 'https://' + url;
  try { const u = new URL(withProto); return ['http:', 'https:'].includes(u.protocol); } catch { return false; }
}

function normalizeUrl(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : 'https://' + url;
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

  const rawWebsite = sanitize(fields.website || fields.SiteWeb || '', 300);
  if (rawWebsite && !validUrl(rawWebsite)) return res.status(400).json({ error: 'URL de site invalide' });
  const website = normalizeUrl(rawWebsite);

  const tarif = parseInt(fields.tarif ?? fields.Tarif);
  if (isNaN(tarif) || tarif < 0 || tarif > 10_000) {
    return res.status(400).json({ error: 'Tarif invalide' });
  }

  // Construction du payload sanitisé — seuls les champs connus sont transmis
  // On envoie chaque champ un par un — si Airtable rejette un nom,
  // on réessaie sans ce champ pour ne pas bloquer l'inscription
  const cleanFields = {
    Nom:       nom,
    Studio:    studio,
    Email:     email,
  };

  // Tous les autres champs : on tente de les ajouter
  const optionalMap = {
    Ville:     sanitize(fields.ville || '', 100),
    Styles:    sanitize(fields.styles || '', 300),
    Tarif:     tarif,
    Bio:       sanitize(fields.bio || '', 2000),
    Instagram: sanitize(fields.instagram || '', 100),
    Region:    sanitize(fields.region || '', 100),
    Adresse:   sanitize(fields.adresse || '', 200),
    TarifInfo: sanitize(fields.tarifInfo || '', 500),
  };
  if (website) optionalMap.Site = website;

  for (const [k, v] of Object.entries(optionalMap)) {
    if (v !== '' && v !== 0 && v !== undefined) cleanFields[k] = v;
  }

  // Photos (URLs from Vercel Blob)
  const photoUrls = Array.isArray(fields.photos) ? fields.photos : [];
  const validPhotos = photoUrls
    .filter(u => typeof u === 'string' && u.startsWith('https://'))
    .slice(0, 5)
    .map(url => ({ url }));
  if (validPhotos.length > 0) {
    cleanFields.Photos = validPhotos;
  }

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = 'appD1ZqrwZXTza0KR';
  const TABLE = 'tbl5xdM5VGqrieG4a';

  try {
    // Envoyer à Airtable avec retry si un champ est inconnu
    let attempt = 0;
    let fieldsToSend = { ...cleanFields };
    let result;

    while (attempt < 5) {
      const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsToSend }),
      });

      if (r.ok) {
        result = await r.json();
        break;
      }

      const errBody = await r.json().catch(() => ({}));
      console.error('Airtable error:', r.status, JSON.stringify(errBody));

      // Si champ inconnu ou option select invalide, retirer le champ et réessayer
      const errType = errBody?.error?.type;
      if (errType === 'UNKNOWN_FIELD_NAME' || errType === 'INVALID_MULTIPLE_CHOICE_OPTIONS') {
        const match = errBody.error.message?.match(/"([^"]+)"/);
        if (match) {
          // Pour UNKNOWN_FIELD_NAME le nom est dans le message, pour select on cherche le champ
          const fieldName = errType === 'UNKNOWN_FIELD_NAME' ? match[1] :
            Object.keys(fieldsToSend).find(k => String(fieldsToSend[k]).includes(match[1])) || match[1];
          console.log('Removing problematic field:', fieldName);
          delete fieldsToSend[fieldName];
          attempt++;
          continue;
        }
      }

      return res.status(r.status).json({ error: 'Erreur lors de l\'enregistrement', detail: errBody });
    }

    if (!result) {
      return res.status(500).json({ error: 'Impossible d\'enregistrer après plusieurs tentatives' });
    }

    // Notification email via Resend
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Inkmap <onboarding@resend.dev>',
            to: 'inkmap.contact@gmail.com',
            subject: `Nouvelle inscription - ${cleanFields.Nom} (${cleanFields.Studio})`,
            html: `
              <h2 style="color:#c0392b;font-family:sans-serif">Nouvelle inscription sur Inkmap</h2>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 12px;font-weight:bold">Nom</td><td style="padding:6px 12px">${cleanFields.Nom}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Studio</td><td style="padding:6px 12px">${cleanFields.Studio}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px">${cleanFields.Email}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Instagram</td><td style="padding:6px 12px">${cleanFields.Instagram || '—'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Ville(s)</td><td style="padding:6px 12px">${cleanFields.Ville || '—'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Styles</td><td style="padding:6px 12px">${cleanFields.Styles || '—'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Tarif</td><td style="padding:6px 12px">${cleanFields.Tarif} €/h</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Bio</td><td style="padding:6px 12px">${cleanFields.Bio || '—'}</td></tr>
              </table>
              ${validPhotos.length > 0 ? `
              <h3 style="font-family:sans-serif;color:#333;margin-top:20px">Photos (${validPhotos.length})</h3>
              <div>${validPhotos.map(p => `<img src="${p.url}" style="width:150px;height:150px;object-fit:cover;border-radius:8px;margin:4px" />`).join('')}</div>
              ` : ''}
              <p style="margin-top:16px;font-size:13px;color:#666">
                <a href="https://airtable.com/appD1ZqrwZXTza0KR" style="color:#c0392b">Voir sur Airtable</a>
              </p>
            `
          })
        });
      } catch (_) { /* email non bloquant */ }
    }

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
};
