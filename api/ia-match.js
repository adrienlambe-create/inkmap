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

const rateStore = new Map();
function rateLimit(ip, max = 30, windowMs = 60_000) {
  const now = Date.now();
  const rec = rateStore.get(ip) || { n: 0, reset: now + windowMs };
  if (now > rec.reset) { rec.n = 0; rec.reset = now + windowMs; }
  rec.n++;
  rateStore.set(ip, rec);
  return rec.n <= max;
}

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Trop de requêtes, réessaie dans une minute.' });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ error: 'API key not configured' });

  const { image, mediaType } = req.body || {};
  if (!image || typeof image !== 'string') return res.status(400).json({ error: 'Image manquante' });

  const safeMediaType = ALLOWED_MEDIA_TYPES.includes(mediaType) ? mediaType : 'image/jpeg';

  const prompt = `Tu es un expert en tatouage avec 20 ans d'expérience. Analyse cette image en deux étapes.

ÉTAPE 1 — Observe les caractéristiques visuelles :
- Épaisseur des traits (ultra-fins, moyens, épais, absents)
- Palette de couleurs (noir pur, noir & gris, couleurs vives, aquarelle, monochrome)
- Technique (pointillisme, hachures, aplats, dégradés, effets aquarelle)
- Sujet (portrait, nature, géométrie, lettering, symboles, motifs culturels)
- Niveau de détail et réalisme

ÉTAPE 2 — Attribue un score à chaque style selon tes observations.

Styles possibles (utilise uniquement ces noms exacts) :
Fineline, Blackwork, Réalisme, Micro-réalisme, Noir & Gris, Portrait, Old School, Neo-Traditional, Japonais, Irezumi, Aquarelle, Géométrique, Tribal, Polynésien, Dotwork, Illustratif, Floral, Minimaliste, Flash, Organique, Biomécanique, Lettering, Trash Polka, Chicano, Surréalisme

Retourne UNIQUEMENT ce JSON sans aucun texte autour :
{"style":"<style principal>","explication":"<1 phrase courte, max 15 mots>","scores":[["<style1>",<score1>],["<style2>",<score2>],["<style3>",<score3>],["<style4>",<score4>],["<style5>",<score5>]]}

Règles :
- Les scores sont entre 0 et 100
- Le style principal = scores[0][0]
- Si l'image n'est pas un tatouage, analyse quand même le style graphique`;

  const groqBody = JSON.stringify({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 400,
    temperature: 0.2,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${safeMediaType};base64,${image}` } },
        { type: 'text', text: prompt },
      ],
    }],
  });

  async function callGroq() {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: groqBody,
    });
    return r;
  }

  try {
    let response = await callGroq();

    // 1 retry on server-side errors
    if (response.status >= 500) {
      await new Promise(r => setTimeout(r, 800));
      response = await callGroq();
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[ia-match] Groq error', response.status, errBody.slice(0, 200));
      const msg = response.status === 429
        ? 'Trop de requêtes vers le service d\'IA, réessaie dans quelques secondes.'
        : 'Le service d\'analyse est temporairement indisponible.';
      return res.status(502).json({ error: msg });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response from Groq');

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const result = JSON.parse(match[0]);
    if (!result.style || !Array.isArray(result.scores)) throw new Error('Invalid JSON structure');

    res.status(200).json(result);
  } catch (e) {
    console.error('[ia-match] catch:', e.message);
    res.status(500).json({ error: 'Analyse impossible pour le moment. L\'analyse locale sera utilisée à la place.' });
  }
};
