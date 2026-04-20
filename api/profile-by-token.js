// Renvoie les champs du profil ciblé par le token. Sert à pré-remplir le form.

const { cors, rateLimit, getIp, airtableConfig } = require('./_utils');
const { verify } = require('./_token');

// Champs qu'on expose au front d'édition (sans Email)
const EXPOSED_FIELDS = [
  'Nom', 'Pseudo', 'Ville', 'Region', 'Styles', 'Tarif',
  'Instagram', 'Bio', 'Photos', 'Site', 'Adresse', 'TarifInfo',
];

module.exports = async (req, res) => {
  if (cors(req, res, 'GET, OPTIONS')) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip, 30)) return res.status(429).json({ error: 'Trop de requêtes' });

  const token = typeof req.query?.token === 'string' ? req.query.token : '';
  const payload = verify(token);
  if (!payload) return res.status(401).json({ error: 'Lien invalide ou expiré' });

  const { token: airtableToken, base, table } = airtableConfig();

  try {
    const url = `https://api.airtable.com/v0/${base}/${table}/${payload.rid}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
    if (!r.ok) return res.status(502).json({ error: 'Erreur Airtable' });
    const data = await r.json();
    const f = data.fields || {};
    const safeFields = {};
    for (const k of EXPOSED_FIELDS) {
      if (f[k] !== undefined) safeFields[k] = f[k];
    }
    // Normalise Photos en URLs simples
    if (Array.isArray(safeFields.Photos)) {
      safeFields.Photos = safeFields.Photos
        .map(p => p?.url || p?.thumbnails?.large?.url || '')
        .filter(Boolean);
    }
    return res.status(200).json({ fields: safeFields });
  } catch (e) {
    console.error('[profile-by-token] error', e.message);
    return res.status(500).json({ error: 'Erreur interne' });
  }
};
