// Envoie un magic link de modification de profil à l'email fourni,
// SEULEMENT s'il correspond à un profil existant. Réponse toujours générique
// pour éviter l'énumération d'emails.

const { cors, rateLimit, getIp, validEmail, escHtml, airtableConfig } = require('./_utils');
const { sign } = require('./_token');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  // Rate limit strict : 5 demandes / min / IP (anti-spam)
  if (!rateLimit(ip, 5)) return res.status(429).json({ error: 'Trop de demandes, réessaie dans une minute.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!validEmail(email)) return res.status(400).json({ error: 'Email invalide' });

  const GENERIC_OK = { ok: true };

  const { token: airtableToken, base, table } = airtableConfig();
  const RESEND_KEY = process.env.RESEND_API_KEY;

  try {
    // Recherche du record par email (exact match insensible à la casse)
    const safeEmail = email.replace(/"/g, '\\"');
    const formula = encodeURIComponent(`LOWER({Email}) = "${safeEmail}"`);
    const url = `https://api.airtable.com/v0/${base}/${table}?filterByFormula=${formula}&maxRecords=1`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
    if (!r.ok) {
      console.error('[edit-link] airtable lookup failed', r.status);
      return res.status(200).json(GENERIC_OK);
    }
    const data = await r.json();
    const rec = (data.records || [])[0];
    if (!rec) return res.status(200).json(GENERIC_OK);

    // Génère le token
    const token = sign({ rid: rec.id, exp: Date.now() + TOKEN_TTL_MS });
    const link = `https://inkmap.fr/modifier?token=${encodeURIComponent(token)}`;

    const f = rec.fields || {};
    const displayName = (f.Pseudo || f.Nom || '').trim();
    const prenom = escHtml((displayName.split(' ')[0] || 'toi'));

    if (!RESEND_KEY) {
      console.warn('[edit-link] RESEND_API_KEY absent — lien non envoyé');
      return res.status(200).json(GENERIC_OK);
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Inkmap <bonjour@inkmap.fr>',
        to: email,
        reply_to: 'inkmap.contact@gmail.com',
        subject: 'Ton lien de modification de profil Inkmap',
        html: `
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0d0d0d;line-height:1.6">
            <div style="text-align:center;margin-bottom:32px">
              <img src="https://inkmap.fr/logo-email.png" alt="Inkmap" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto" />
            </div>
            <h1 style="font-size:20px;margin:0 0 16px;font-weight:700">Modifier ton profil, ${prenom} ?</h1>
            <p style="font-size:15px;color:#333;margin:0 0 20px">
              Clique sur le bouton ci-dessous pour accéder au formulaire de modification de ton profil Inkmap.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${link}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:14px 28px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase">
                Modifier mon profil →
              </a>
            </div>
            <p style="font-size:13px;color:#666;margin:0 0 8px">
              Le lien est valable <strong>7 jours</strong>. Si tu n'as pas demandé cette modification, ignore ce mail.
            </p>
            <p style="font-size:12px;color:#999;margin:20px 0 0;word-break:break-all">
              ${link}
            </p>
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:13px;color:#666">
              — Adrien, fondateur d'Inkmap<br>
              <a href="mailto:inkmap.contact@gmail.com" style="color:#c0392b;text-decoration:none">inkmap.contact@gmail.com</a>
            </div>
          </div>
        `,
      }),
    });

    return res.status(200).json(GENERIC_OK);
  } catch (e) {
    console.error('[edit-link] error', e.message);
    return res.status(200).json(GENERIC_OK);
  }
};
