const { cors, rateLimit, getIp, sanitize, airtableConfig } = require('./_utils');

const ALLOWED_SOURCES = new Set([
  'Instagram', 'Google', 'ChatGPT', 'Bouche-a-oreille', 'Convention', 'Autre'
]);

module.exports = async (req, res) => {
  if (cors(req, res, 'POST, OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Trop de requêtes' });

  const { recordId, source } = req.body || {};
  const id = sanitize(recordId, 50);
  const src = sanitize(source, 50);

  if (!id || !/^rec[a-zA-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'recordId invalide' });
  if (!ALLOWED_SOURCES.has(src)) return res.status(400).json({ error: 'source invalide' });

  const { token, base, table } = airtableConfig();

  try {
    const r = await fetch(`https://api.airtable.com/v0/${base}/${table}/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Source: src } }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      console.error('[update-source] Airtable error:', r.status, body);
      return res.status(r.status).json({ error: 'Erreur enregistrement source' });
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[update-source] error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
};
