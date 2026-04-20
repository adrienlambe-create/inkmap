// PATCH du record Airtable avec les champs édités. Auth via token HMAC.

const { cors, rateLimit, getIp, sanitize, validUrl, normalizeUrl, airtableConfig } = require('./_utils');
const { verify } = require('./_token');

// Whitelist stricte des champs modifiables
const EDITABLE_FIELDS = ['Nom', 'Pseudo', 'Ville', 'Region', 'Styles', 'Tarif', 'Instagram', 'Bio', 'Site', 'Adresse', 'TarifInfo', 'Photos'];

// Hôtes autorisés pour les photos (anti-SSRF / anti-injection d'URLs arbitraires)
const PHOTO_HOST_REGEX = /^https:\/\/([a-z0-9-]+\.)*public\.blob\.vercel-storage\.com\/|^https:\/\/v\d+\.airtableusercontent\.com\//i;

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip, 20)) return res.status(429).json({ error: 'Trop de requêtes' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const token = typeof body?.token === 'string' ? body.token : '';
  const rawFields = body?.fields && typeof body.fields === 'object' && !Array.isArray(body.fields) ? body.fields : null;

  const payload = verify(token);
  if (!payload) return res.status(401).json({ error: 'Lien invalide ou expiré' });
  if (!rawFields) return res.status(400).json({ error: 'Champs manquants' });

  // Sanitize & valide chaque champ autorisé
  const clean = {};
  for (const key of EDITABLE_FIELDS) {
    if (!(key in rawFields)) continue;
    const v = rawFields[key];

    if (key === 'Tarif') {
      const n = parseInt(v);
      if (!isNaN(n) && n >= 0 && n <= 10000) clean.Tarif = n;
      continue;
    }

    if (key === 'Styles') {
      if (Array.isArray(v)) {
        clean.Styles = v.map(s => sanitize(String(s), 50)).filter(Boolean).slice(0, 12);
      } else if (typeof v === 'string') {
        clean.Styles = v.split(',').map(s => sanitize(s, 50)).filter(Boolean).slice(0, 12);
      }
      continue;
    }

    if (key === 'Photos') {
      if (!Array.isArray(v)) continue;
      const urls = v
        .map(p => (typeof p === 'string' ? p : p?.url || ''))
        .filter(u => typeof u === 'string' && PHOTO_HOST_REGEX.test(u))
        .slice(0, 12);
      clean.Photos = urls.map(url => ({ url }));
      continue;
    }

    if (key === 'Site') {
      const s = sanitize(v, 300);
      if (!s) { clean.Site = ''; continue; }
      if (!validUrl(s)) return res.status(400).json({ error: 'URL site invalide' });
      clean.Site = normalizeUrl(s);
      continue;
    }

    if (key === 'Bio') { clean.Bio = sanitize(v, 2000); continue; }
    if (key === 'Adresse') { clean.Adresse = sanitize(v, 200); continue; }
    if (key === 'TarifInfo') { clean.TarifInfo = sanitize(v, 500); continue; }

    // Champs texte courts (Nom, Pseudo, Ville, Region, Instagram)
    const s = sanitize(v, 150);
    clean[key] = s;
  }

  if (Object.keys(clean).length === 0) {
    return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });
  }

  const { token: airtableToken, base, table } = airtableConfig();

  try {
    // PATCH avec retry si un champ est refusé (multiple choice inexistant, etc.)
    let fieldsToSend = { ...clean };
    let attempt = 0;
    let result;

    while (attempt < 5) {
      const r = await fetch(`https://api.airtable.com/v0/${base}/${table}/${payload.rid}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${airtableToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsToSend }),
      });

      if (r.ok) { result = await r.json(); break; }

      const errBody = await r.json().catch(() => ({}));
      console.error('[update-profile] airtable', r.status, JSON.stringify(errBody));

      const errType = errBody?.error?.type;
      if (errType === 'UNKNOWN_FIELD_NAME' || errType === 'INVALID_MULTIPLE_CHOICE_OPTIONS') {
        const match = errBody.error.message?.match(/"([^"]+)"/);
        if (match) {
          const badField = errType === 'UNKNOWN_FIELD_NAME'
            ? match[1]
            : (Object.keys(fieldsToSend).find(k => String(fieldsToSend[k]).includes(match[1])) || match[1]);
          delete fieldsToSend[badField];
          attempt++;
          continue;
        }
      }
      return res.status(502).json({ error: 'Erreur Airtable', detail: errBody });
    }

    if (!result) return res.status(500).json({ error: 'Mise à jour impossible' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[update-profile] error', e.message);
    return res.status(500).json({ error: 'Erreur interne' });
  }
};
