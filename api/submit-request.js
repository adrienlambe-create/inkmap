// Réception d'une demande client (lead) : validation, stockage Airtable, emails.
// Modèle en 2 phases : v1 stocke + notifie admin (matching manuel) ; v2 ajoutera le matching auto.

const { cors, rateLimit, getIp, sanitize, validEmail, escHtml, airtableConfig } = require('./_utils');

const MAX_DESCRIPTION = 2000;
const MAX_PHOTOS = 3;
const MAX_STYLES = 5;
const RATE_LIMIT_MAX = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1h

// Hôtes autorisés pour les photos uploadées (anti-SSRF)
const PHOTO_HOST_REGEX = /^https:\/\/([a-z0-9-]+\.)*public\.blob\.vercel-storage\.com\//i;

const ZONES_CORPS = new Set([
  'Bras', 'Avant-bras', 'Épaule', 'Main', 'Jambe', 'Cuisse',
  'Mollet', 'Pied', 'Dos', 'Torse', 'Cou', 'Visage', 'Autre',
]);

const STYLES_ALLOWED = new Set([
  'Fineline', 'Blackwork', 'Réalisme', 'Japonais', 'Old school',
  'Traditionnel', 'Géométrique', 'Aquarelle', 'Dotwork', 'Graphique',
  'Tribal', 'Lettering', 'Floral', 'Portrait', 'Micro-réalisme',
]);

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip, RATE_LIMIT_MAX, RATE_WINDOW_MS)) {
    return res.status(429).json({ error: 'Trop de demandes. Réessaie plus tard.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Payload invalide' });

  // Honeypot : champ caché rempli uniquement par les bots
  if (body.website) return res.status(200).json({ ok: true });

  // Champs obligatoires
  const description = sanitize(body.description, MAX_DESCRIPTION);
  const ville = sanitize(body.ville, 100);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!description || description.length < 10) {
    return res.status(400).json({ error: 'Décris ton projet en quelques mots (10 caractères min)' });
  }
  if (!ville) return res.status(400).json({ error: 'Ville manquante' });
  if (!validEmail(email)) return res.status(400).json({ error: 'Email invalide' });

  // Champs optionnels
  const styles = Array.isArray(body.styles)
    ? body.styles.map(s => sanitize(String(s), 50)).filter(s => STYLES_ALLOWED.has(s)).slice(0, MAX_STYLES)
    : [];
  const budget = Number.isFinite(+body.budget) && +body.budget > 0 ? Math.min(parseInt(body.budget), 100000) : null;
  const zoneRaw = sanitize(body.zoneCorps, 50);
  const zoneCorps = ZONES_CORPS.has(zoneRaw) ? zoneRaw : '';
  const telephone = sanitize(body.telephone, 30);

  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
  const photos = rawPhotos
    .filter(u => typeof u === 'string' && PHOTO_HOST_REGEX.test(u))
    .slice(0, MAX_PHOTOS)
    .map(url => ({ url }));

  const { token: airtableToken, base } = airtableConfig();
  const tableId = process.env.AIRTABLE_DEMANDES_TABLE_ID || 'Demandes';

  const fields = {
    Description: description,
    Email: email,
    Ville: ville,
    ...(styles.length ? { Styles: styles } : {}),
    ...(budget ? { Budget: budget } : {}),
    ...(zoneCorps ? { ZoneCorps: zoneCorps } : {}),
    ...(telephone ? { Telephone: telephone } : {}),
    ...(photos.length ? { Photos: photos } : {}),
    Statut: 'Nouvelle',
  };

  let recordId = '';
  try {
    let fieldsToSend = { ...fields };
    let attempt = 0;
    let created = null;

    while (attempt < 4) {
      const r = await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(tableId)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${airtableToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsToSend }),
      });

      if (r.ok) { created = await r.json(); break; }

      const errBody = await r.json().catch(() => ({}));
      console.error('[submit-request] airtable', r.status, JSON.stringify(errBody));

      // Retry en retirant les champs refusés (ex: Single select inconnu côté Airtable)
      const errType = errBody?.error?.type;
      if (errType === 'UNKNOWN_FIELD_NAME' || errType === 'INVALID_MULTIPLE_CHOICE_OPTIONS') {
        const m = errBody.error.message?.match(/"([^"]+)"/);
        if (m) {
          const badField = errType === 'UNKNOWN_FIELD_NAME'
            ? m[1]
            : (Object.keys(fieldsToSend).find(k => JSON.stringify(fieldsToSend[k]).includes(m[1])) || m[1]);
          delete fieldsToSend[badField];
          attempt++;
          continue;
        }
      }
      return res.status(502).json({ error: 'Erreur enregistrement' });
    }

    if (!created) return res.status(500).json({ error: 'Création impossible' });
    recordId = created.id;
  } catch (e) {
    console.error('[submit-request] airtable exception', e.message);
    return res.status(500).json({ error: 'Erreur interne' });
  }

  // Emails : await pour garantir l'envoi (sur Vercel serverless, le fire-and-forget est gelé après la réponse).
  // Si l'envoi échoue on renvoie quand même OK : le lead est déjà en Airtable, l'important est sauvegardé.
  try {
    await sendEmails({ email, description, ville, styles, budget, zoneCorps, telephone, photos, recordId });
  } catch (e) {
    console.error('[submit-request] email exception', e.message);
  }

  return res.status(200).json({ ok: true });
};

async function sendEmails({ email, description, ville, styles, budget, zoneCorps, telephone, photos, recordId }) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) { console.warn('[submit-request] RESEND_API_KEY absent — emails non envoyés'); return; }

  const adminEmail = process.env.ADMIN_EMAIL || 'inkmap.contact@gmail.com';
  const { base } = airtableConfig();
  const tableId = process.env.AIRTABLE_DEMANDES_TABLE_ID || 'Demandes';
  const airtableLink = recordId ? `https://airtable.com/${base}/${encodeURIComponent(tableId)}/${recordId}` : '';

  // Email client : confirmation
  const clientHtml = clientEmailHtml({ description, ville });
  // Email admin : brief complet
  const adminHtml = adminEmailHtml({ email, description, ville, styles, budget, zoneCorps, telephone, photos, airtableLink });

  const sends = [
    resendSend({
      apiKey: RESEND_KEY,
      to: email,
      subject: 'On a bien reçu ta demande — Inkmap',
      html: clientHtml,
    }),
    resendSend({
      apiKey: RESEND_KEY,
      to: adminEmail,
      subject: `[Demande] ${ville} — ${description.slice(0, 60)}${description.length > 60 ? '…' : ''}`,
      html: adminHtml,
      replyTo: email,
    }),
  ];

  await Promise.allSettled(sends);
}

async function resendSend({ apiKey, to, subject, html, replyTo }) {
  const payload = {
    from: 'Inkmap <bonjour@inkmap.fr>',
    to,
    subject,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    console.error('[submit-request] resend failed', r.status, err);
  }
}

function clientEmailHtml({ description, ville }) {
  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0d0d0d;line-height:1.6">
      <div style="text-align:center;margin-bottom:32px">
        <div style="font-family:Georgia,serif;font-size:28px;font-weight:800;letter-spacing:3px;text-transform:uppercase">
          INK<span style="color:#c0392b">MAP</span>
        </div>
        <div style="height:2px;width:40px;background:#c0392b;margin:12px auto"></div>
      </div>
      <h1 style="font-size:20px;margin:0 0 16px;font-weight:700">On a bien reçu ta demande ✓</h1>
      <p style="font-size:15px;color:#333;margin:0 0 20px">
        Merci d'avoir décrit ton projet sur Inkmap. On te recontacte sous <strong>48h</strong> avec une sélection de tatoueurs correspondant à ton brief.
      </p>
      <div style="background:#fafafa;border-left:3px solid #c0392b;padding:16px 20px;margin:24px 0">
        <div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Ton brief</div>
        <div style="font-size:14px;color:#333;margin-bottom:6px"><strong>Ville :</strong> ${escHtml(ville)}</div>
        <div style="font-size:14px;color:#333;white-space:pre-wrap">${escHtml(description)}</div>
      </div>
      <p style="font-size:13px;color:#666;margin:20px 0 0">
        En attendant, tu peux déjà <a href="https://inkmap.fr" style="color:#c0392b;text-decoration:none">explorer l'annuaire</a>.
      </p>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:13px;color:#666">
        — Adrien, fondateur d'Inkmap<br>
        <a href="mailto:inkmap.contact@gmail.com" style="color:#c0392b;text-decoration:none">inkmap.contact@gmail.com</a>
      </div>
    </div>
  `;
}

function adminEmailHtml({ email, description, ville, styles, budget, zoneCorps, telephone, photos, airtableLink }) {
  const photosHtml = photos.length
    ? `<div style="margin-top:12px">${photos.map(p => `<a href="${escHtml(p.url)}"><img src="${escHtml(p.url)}" alt="inspi" style="max-width:120px;margin-right:8px;border-radius:4px" /></a>`).join('')}</div>`
    : '';
  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#0d0d0d;line-height:1.5">
      <h2 style="font-size:18px;margin:0 0 16px">Nouvelle demande — ${escHtml(ville)}</h2>
      <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="color:#666;width:140px">Email</td><td><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
        ${telephone ? `<tr><td style="color:#666">Téléphone</td><td>${escHtml(telephone)}</td></tr>` : ''}
        <tr><td style="color:#666">Ville</td><td>${escHtml(ville)}</td></tr>
        ${styles.length ? `<tr><td style="color:#666">Styles</td><td>${escHtml(styles.join(', '))}</td></tr>` : ''}
        ${budget ? `<tr><td style="color:#666">Budget</td><td>${escHtml(String(budget))} €</td></tr>` : ''}
        ${zoneCorps ? `<tr><td style="color:#666">Zone</td><td>${escHtml(zoneCorps)}</td></tr>` : ''}
      </table>
      <div style="margin-top:20px;padding:16px;background:#fafafa;border-left:3px solid #c0392b;white-space:pre-wrap;font-size:14px">
        ${escHtml(description)}
      </div>
      ${photosHtml}
      ${airtableLink ? `<p style="margin-top:24px"><a href="${escHtml(airtableLink)}" style="color:#c0392b">Ouvrir dans Airtable →</a></p>` : ''}
    </div>
  `;
}
