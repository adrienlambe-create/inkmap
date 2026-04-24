// Enregistre la réponse d'un tatoueur à un brief (Intéressé / Question / Décliné).
// Upsert sur la table Transmissions, puis notifie l'admin par email.
// Lien réutilisable : le tatoueur peut revenir changer sa réponse.

const { cors, rateLimit, getIp, sanitize, escHtml, airtableConfig } = require('./_utils');
const { verifyGeneric } = require('./_token');

const STATUTS_VALIDES = new Set(['Intéressé', 'Question', 'Décliné']);
const MAX_MESSAGE = 1000;

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip, 10)) return res.status(429).json({ error: 'Trop de requêtes' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Payload invalide' });

  const payload = verifyGeneric(body.token);
  if (!payload || !payload.did || !payload.tid) {
    return res.status(401).json({ error: 'Lien invalide ou expiré' });
  }

  const statut = typeof body.statut === 'string' ? body.statut : '';
  if (!STATUTS_VALIDES.has(statut)) return res.status(400).json({ error: 'Statut invalide' });

  const message = sanitize(body.message, MAX_MESSAGE);
  if (statut === 'Question' && !message) {
    return res.status(400).json({ error: 'Écris ta question pour que je puisse te répondre' });
  }

  const { token: airtableToken, base } = airtableConfig();
  const transmissionsTable = process.env.AIRTABLE_TRANSMISSIONS_TABLE_ID || 'Transmissions';
  const demandesTable = process.env.AIRTABLE_DEMANDES_TABLE_ID || 'Demandes';
  const tatoueursTable = process.env.AIRTABLE_TABLE_ID || 'tbl5xdM5VGqrieG4a';

  const fields = {
    Statut: statut,
    MessageTatoueur: message,
    DateResponse: new Date().toISOString().slice(0, 10),
  };

  try {
    // Recherche d'une transmission existante pour ce (demande, tatoueur)
    const formula = encodeURIComponent(
      `AND({DemandeId} = "${payload.did}", {TatoueurId} = "${payload.tid}")`
    );
    const lookup = await fetch(
      `https://api.airtable.com/v0/${base}/${encodeURIComponent(transmissionsTable)}?filterByFormula=${formula}&maxRecords=1`,
      { headers: { Authorization: `Bearer ${airtableToken}` } }
    );
    if (!lookup.ok) {
      console.error('[brief-respond] lookup failed', lookup.status);
      return res.status(502).json({ error: 'Erreur enregistrement' });
    }
    const lookupData = await lookup.json();
    const existing = (lookupData.records || [])[0];

    let recordId = '';
    if (existing) {
      // Update
      const r = await fetch(
        `https://api.airtable.com/v0/${base}/${encodeURIComponent(transmissionsTable)}/${existing.id}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${airtableToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields }),
        }
      );
      if (!r.ok) {
        console.error('[brief-respond] update failed', r.status, await r.text().catch(() => ''));
        return res.status(502).json({ error: 'Erreur enregistrement' });
      }
      recordId = existing.id;
    } else {
      // Create — le script CLI crée normalement les transmissions en amont.
      // Fallback si absente : on la crée avec la réponse.
      const createFields = {
        ...fields,
        Demande: [payload.did],
        Tatoueur: [payload.tid],
        DemandeId: payload.did,
        TatoueurId: payload.tid,
      };
      const r = await fetch(
        `https://api.airtable.com/v0/${base}/${encodeURIComponent(transmissionsTable)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${airtableToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: createFields }),
        }
      );
      if (!r.ok) {
        console.error('[brief-respond] create failed', r.status, await r.text().catch(() => ''));
        return res.status(502).json({ error: 'Erreur enregistrement' });
      }
      const created = await r.json();
      recordId = created.id;
    }

    // Notification admin (non bloquante côté UX : si ça rate, on a déjà sauvegardé)
    try {
      await notifyAdmin({ did: payload.did, tid: payload.tid, statut, message, airtableToken, base, demandesTable, tatoueursTable, transmissionsTable, recordId });
    } catch (e) {
      console.error('[brief-respond] notify admin failed', e.message);
    }

    return res.status(200).json({ ok: true, statut });
  } catch (e) {
    console.error('[brief-respond] exception', e.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

async function notifyAdmin({ did, tid, statut, message, airtableToken, base, demandesTable, tatoueursTable, transmissionsTable, recordId }) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const adminEmail = process.env.ADMIN_EMAIL || 'inkmap.contact@gmail.com';

  // Récup contexte (demande + tatoueur) pour un email informatif
  const [dRes, tRes] = await Promise.all([
    fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(demandesTable)}/${did}`, {
      headers: { Authorization: `Bearer ${airtableToken}` },
    }),
    fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(tatoueursTable)}/${tid}`, {
      headers: { Authorization: `Bearer ${airtableToken}` },
    }),
  ]);

  const demande = dRes.ok ? await dRes.json() : { fields: {} };
  const tatoueur = tRes.ok ? await tRes.json() : { fields: {} };
  const df = demande.fields || {};
  const tf = tatoueur.fields || {};

  const pseudo = tf.Pseudo || tf.Nom || 'Tatoueur';
  const ville = df.Ville || '—';
  const descriptionShort = (df.Description || '').slice(0, 140);
  const transmissionLink = `https://airtable.com/${base}/${encodeURIComponent(transmissionsTable)}/${recordId}`;

  const statutEmoji = statut === 'Intéressé' ? '✅' : statut === 'Question' ? '❓' : '❌';
  const subject = `${statutEmoji} ${pseudo} — ${statut} · demande ${ville}`;

  const messageBlock = message
    ? `<div style="margin-top:16px;padding:14px 18px;background:#fafafa;border-left:3px solid #c0392b;white-space:pre-wrap;font-size:14px;color:#333">${escHtml(message)}</div>`
    : '';

  const html = `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0d0d0d;line-height:1.5">
      <h2 style="font-size:18px;margin:0 0 16px">Réponse tatoueur — ${escHtml(statut)}</h2>
      <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="color:#666;width:140px">Tatoueur</td><td><strong>${escHtml(pseudo)}</strong></td></tr>
        <tr><td style="color:#666">Ville demande</td><td>${escHtml(ville)}</td></tr>
        <tr><td style="color:#666">Statut</td><td>${escHtml(statut)}</td></tr>
      </table>
      <div style="margin-top:16px;padding:14px 18px;background:#fff;border:1px solid #e5e5e5;font-size:13px;color:#555">
        <strong style="color:#333">Demande :</strong> ${escHtml(descriptionShort)}${descriptionShort.length >= 140 ? '…' : ''}
      </div>
      ${messageBlock}
      <p style="margin-top:24px"><a href="${transmissionLink}" style="color:#c0392b;text-decoration:none">Ouvrir dans Airtable →</a></p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Inkmap <bonjour@inkmap.fr>',
      to: adminEmail,
      subject,
      html,
    }),
  });
}
