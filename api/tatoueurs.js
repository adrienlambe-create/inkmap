const ALLOWED_ORIGINS = ['https://inkmap.fr'];
function cors(req, res) {
  const origin = req.headers.origin || '';
  const ok = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
  if (ok) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE  = 'appD1ZqrwZXTza0KR';
  const TABLE = 'tbl5xdM5VGqrieG4a';

  try {
    const r = await fetch(
      `https://api.airtable.com/v0/${BASE}/${TABLE}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    if (!r.ok) return res.status(r.status).json({ error: 'Airtable error' });
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
};
