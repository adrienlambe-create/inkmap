const { put } = require('@vercel/blob');
const { cors, rateLimit, getIp } = require('./_utils');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip, 20)) return res.status(429).json({ error: 'Trop de requêtes' });

  const contentType = req.headers['content-type'] || '';
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: 'Seules les images sont acceptées' });
  }

  // Collect body
  const chunks = [];
  let size = 0;
  const MAX_SIZE = 10 * 1024 * 1024;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_SIZE) {
      return res.status(413).json({ error: 'Image trop volumineuse (max 10 MB)' });
    }
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);

  // Extension from content-type
  const ext = contentType.split('/')[1] || 'jpg';
  const filename = `tattoo-${Date.now()}.${ext}`;

  try {
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
    });

    res.status(200).json({ url: blob.url });
  } catch (e) {
    console.error('[blob]', e.message);
    res.status(500).json({ error: 'Erreur upload' });
  }
};
