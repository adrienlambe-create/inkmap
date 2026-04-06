const { cors, airtableConfig } = require('./_utils');

// Champs publics uniquement — jamais exposer Email, Adresse, Site, TarifInfo
const PUBLIC_FIELDS = ['Nom', 'Pseudo', 'Ville', 'Region', 'Styles', 'Tarif', 'Instagram', 'Bio', 'Photos', 'Statut'];

module.exports = async (req, res) => {
  if (cors(req, res, 'GET, OPTIONS')) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { token, base, table } = airtableConfig();

  try {
    const fieldsParam = PUBLIC_FIELDS.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
    const r = await fetch(
      `https://api.airtable.com/v0/${base}/${table}?${fieldsParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!r.ok) return res.status(r.status).json({ error: 'Airtable error' });
    const data = await r.json();

    // Double protection : ne renvoyer que les champs connus côté serveur
    const safeRecords = (data.records || []).map(rec => ({
      id: rec.id,
      createdTime: rec.createdTime,
      fields: Object.fromEntries(
        Object.entries(rec.fields || {}).filter(([k]) => PUBLIC_FIELDS.includes(k))
      ),
    }));

    res.status(200).json({ records: safeRecords });
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
};
