const { cors, rateLimit, getIp, sanitize, validEmail, validUrl, normalizeUrl, escHtml, airtableConfig } = require('./_utils');

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Trop de requêtes, réessaie dans une minute.' });

  const { fields } = req.body || {};
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }

  // Validation des champs obligatoires
  const nom    = sanitize(fields.Nom, 100);
  const studio = sanitize(fields.Studio, 100);
  const email  = sanitize(fields.email || fields.Email, 254);
  if (!nom)    return res.status(400).json({ error: 'Nom requis' });
  if (!studio) return res.status(400).json({ error: 'Studio requis' });
  if (!validEmail(email)) return res.status(400).json({ error: 'Email invalide' });

  const rawWebsite = sanitize(fields.website || fields.SiteWeb || '', 300);
  if (rawWebsite && !validUrl(rawWebsite)) return res.status(400).json({ error: 'URL de site invalide' });
  const website = normalizeUrl(rawWebsite);

  const tarif = parseInt(fields.tarif ?? fields.Tarif);
  if (isNaN(tarif) || tarif < 0 || tarif > 10_000) {
    return res.status(400).json({ error: 'Tarif invalide' });
  }

  const pseudo = sanitize(fields.Pseudo || '', 100);

  const cleanFields = {
    Nom:       nom,
    Studio:    studio,
    Email:     email,
  };
  if (pseudo) cleanFields.Pseudo = pseudo;

  const optionalMap = {
    Ville:     sanitize(fields.ville || '', 100),
    Styles:    sanitize(fields.styles || '', 300),
    Tarif:     tarif,
    Bio:       sanitize(fields.bio || '', 2000),
    Instagram: sanitize(fields.instagram || '', 100),
    Region:    sanitize(fields.region || '', 100),
    Adresse:   sanitize(fields.adresse || '', 200),
    TarifInfo: sanitize(fields.tarifInfo || '', 500),
  };
  if (website) optionalMap.Site = website;

  for (const [k, v] of Object.entries(optionalMap)) {
    if (v !== '' && v !== 0 && v !== undefined) cleanFields[k] = v;
  }

  // Photos (URLs)
  const photoUrls = Array.isArray(fields.photos) ? fields.photos : [];
  const validPhotos = photoUrls
    .filter(u => typeof u === 'string' && u.startsWith('https://'))
    .slice(0, 5)
    .map(url => ({ url }));
  if (validPhotos.length > 0) {
    cleanFields.Photos = validPhotos;
  }

  const { token, base, table } = airtableConfig();

  try {
    // Anti-doublon : vérifier si cet email existe déjà
    const checkUrl = `https://api.airtable.com/v0/${base}/${table}?filterByFormula=${encodeURIComponent(`{Email}="${email}"`)}&maxRecords=1&fields[]=Email`;
    const checkRes = await fetch(checkUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.records && checkData.records.length > 0) {
        return res.status(409).json({ error: 'Un profil avec cet email existe déjà.' });
      }
    }

    // Envoyer à Airtable avec retry si un champ est inconnu
    let attempt = 0;
    let fieldsToSend = { ...cleanFields };
    let result;

    while (attempt < 5) {
      const r = await fetch(`https://api.airtable.com/v0/${base}/${table}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsToSend }),
      });

      if (r.ok) {
        result = await r.json();
        break;
      }

      const errBody = await r.json().catch(() => ({}));
      console.error('Airtable error:', r.status, JSON.stringify(errBody));

      const errType = errBody?.error?.type;
      if (errType === 'UNKNOWN_FIELD_NAME' || errType === 'INVALID_MULTIPLE_CHOICE_OPTIONS') {
        const match = errBody.error.message?.match(/"([^"]+)"/);
        if (match) {
          const fieldName = errType === 'UNKNOWN_FIELD_NAME' ? match[1] :
            Object.keys(fieldsToSend).find(k => String(fieldsToSend[k]).includes(match[1])) || match[1];
          console.log('Removing problematic field:', fieldName);
          delete fieldsToSend[fieldName];
          attempt++;
          continue;
        }
      }

      return res.status(r.status).json({ error: 'Erreur lors de l\'enregistrement', detail: errBody });
    }

    if (!result) {
      return res.status(500).json({ error: 'Impossible d\'enregistrer après plusieurs tentatives' });
    }

    // Notification email via Resend
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Inkmap <onboarding@resend.dev>',
            to: 'inkmap.contact@gmail.com',
            subject: `Nouvelle inscription - ${escHtml(cleanFields.Nom)} (${escHtml(cleanFields.Studio)})`,
            html: `
              <h2 style="color:#c0392b;font-family:sans-serif">Nouvelle inscription sur Inkmap</h2>
              <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 12px;font-weight:bold">Nom</td><td style="padding:6px 12px">${escHtml(cleanFields.Nom)}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Pseudo</td><td style="padding:6px 12px">${escHtml(cleanFields.Pseudo) || '—'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Studio</td><td style="padding:6px 12px">${escHtml(cleanFields.Studio)}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Email</td><td style="padding:6px 12px">${escHtml(cleanFields.Email)}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Instagram</td><td style="padding:6px 12px">${escHtml(cleanFields.Instagram) || '—'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Ville(s)</td><td style="padding:6px 12px">${escHtml(cleanFields.Ville) || '—'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Styles</td><td style="padding:6px 12px">${escHtml(cleanFields.Styles) || '—'}</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Tarif</td><td style="padding:6px 12px">${cleanFields.Tarif} €/h</td></tr>
                <tr><td style="padding:6px 12px;font-weight:bold">Bio</td><td style="padding:6px 12px">${escHtml(cleanFields.Bio) || '—'}</td></tr>
              </table>
              ${validPhotos.length > 0 ? `
              <h3 style="font-family:sans-serif;color:#333;margin-top:20px">Photos (${validPhotos.length})</h3>
              <div>${validPhotos.map(p => `<img src="${escHtml(p.url)}" style="width:150px;height:150px;object-fit:cover;border-radius:8px;margin:4px" />`).join('')}</div>
              ` : ''}
              <p style="margin-top:16px;font-size:13px;color:#666">
                <a href="https://airtable.com/${base}" style="color:#c0392b">Voir sur Airtable</a>
              </p>
            `
          })
        });
      } catch (err) { console.error('[resend] Email notification failed:', err.message); }
    }

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
};
