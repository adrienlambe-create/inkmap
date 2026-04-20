const { cors, airtableConfig } = require('./_utils');

// Champs publics uniquement — jamais exposer Email, Adresse, Site, TarifInfo
// (Email est lu pour calculer verifie=true, mais jamais retourné)
const PUBLIC_FIELDS = ['Nom', 'Pseudo', 'Ville', 'Region', 'Styles', 'Tarif', 'Instagram', 'Bio', 'Photos', 'Statut', 'Email'];
const RETURN_FIELDS = PUBLIC_FIELDS.filter(f => f !== 'Email');

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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

    // Dédup du slug par ordre de récupération (premier gagne, suivants reçoivent -2, -3...)
    const usedSlugs = new Set();

    // Double protection : ne renvoyer que les champs connus côté serveur (+ slug calculé)
    const safeRecords = (data.records || []).map(rec => {
      const f = rec.fields || {};
      const nameSource = f.Pseudo || f.Nom;
      const base = `${slugify(nameSource)}-${slugify(f.Ville)}`.replace(/^-+|-+$/g, '');
      let slug = base;
      if (base) {
        let i = 2;
        while (usedSlugs.has(slug)) { slug = `${base}-${i}`; i++; }
        usedSlugs.add(slug);
      }
      const verifie = !!(f.Email && String(f.Email).trim());
      return {
        id: rec.id,
        createdTime: rec.createdTime,
        slug,
        verifie,
        fields: Object.fromEntries(
          Object.entries(f).filter(([k]) => RETURN_FIELDS.includes(k))
        ),
      };
    });

    res.status(200).json({ records: safeRecords });
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
};
