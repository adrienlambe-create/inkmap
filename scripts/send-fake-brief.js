#!/usr/bin/env node
// One-shot : envoie le mail "demande client pour toi" à adrienlambe@gmail.com
// pour la demande de Raphaëlle, comme si Adrien (tatoueur Adrib0u) avait été
// sélectionné. Sert à filmer le Reel mockup. À supprimer après usage.

require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const BASE_URL = 'https://inkmap.fr';
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE = 'appD1ZqrwZXTza0KR';
const TATOUEURS_TABLE = 'tbl5xdM5VGqrieG4a';
const DEMANDES_TABLE = 'Demandes';
const TRANSMISSIONS_TABLE = 'Transmissions';
const SECRET = process.env.EDIT_LINK_SECRET;
const RESEND_KEY = process.env.RESEND_API_KEY;

const DEMANDE_ID = 'receAEtCLvlEWGmSa'; // Raphaëlle - 2 hirondelles
const TATOUEUR_ID = 'recfHjYSQbWxMB8sB'; // Adrib0u
const TO_EMAIL = 'adrienlambe@gmail.com';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sign(payload) {
  const data = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest();
  return `${data}.${b64url(sig)}`;
}
function escHtml(s) {
  return (typeof s !== 'string' ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
async function fetchRecord(tableId, recordId) {
  const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(tableId)}/${recordId}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  });
  if (!r.ok) throw new Error(`Airtable ${r.status} pour ${tableId}/${recordId}`);
  return r.json();
}
async function findOrCreateTransmission(did, tid) {
  const formula = encodeURIComponent(`AND({DemandeId} = "${did}", {TatoueurId} = "${tid}")`);
  const search = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(TRANSMISSIONS_TABLE)}?filterByFormula=${formula}&maxRecords=1`, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  }).then(r => r.json());
  if (search.records?.[0]) return search.records[0].id;
  const created = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(TRANSMISSIONS_TABLE)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: {
      Demande: [did], Tatoueur: [tid],
      DemandeId: did, TatoueurId: tid,
      Statut: 'Envoyé',
      DateEnvoi: new Date().toISOString().slice(0, 10),
    } }),
  }).then(r => r.json());
  if (created.error) throw new Error('Création Transmission : ' + JSON.stringify(created.error));
  return created.id;
}

function buildEmailHtml({ pseudo, ville, styles, budget, zoneCorps, descriptionShort, link }) {
  const firstName = pseudo ? pseudo.split(' ')[0] : 'salut';
  const metaBits = [
    ville ? `📍 ${escHtml(ville)}` : '',
    styles.length ? `🎨 ${escHtml(styles.join(', '))}` : '',
    budget ? `💰 ${budget} €` : '',
    zoneCorps ? `🫲 ${escHtml(zoneCorps)}` : '',
  ].filter(Boolean).join(' · ');
  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0d0d0d;line-height:1.6">
  <div style="text-align:center;margin-bottom:28px">
    <img src="https://inkmap.fr/logo-email.png" alt="Inkmap" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto" />
  </div>
  <h1 style="font-size:20px;margin:0 0 14px;font-weight:700">Salut ${escHtml(firstName)},</h1>
  <p style="font-size:15px;color:#333;margin:0 0 18px">
    J'ai une demande client qui tombe pile dans ton créneau. Je te la partage en priorité — si tu la prends, je te mets en relation directe avec le client.
  </p>
  <div style="background:#fafafa;border-left:3px solid #c0392b;padding:16px 20px;margin:20px 0;font-size:14px">
    <div style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Aperçu</div>
    <div style="margin-bottom:8px;color:#333">${metaBits}</div>
    <div style="color:#555;font-style:italic">"${escHtml(descriptionShort)}${descriptionShort.length >= 160 ? '…' : ''}"</div>
  </div>
  <div style="text-align:center;margin:28px 0">
    <a href="${link}" style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:14px 28px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase">
      Voir le brief complet →
    </a>
  </div>
  <p style="font-size:13px;color:#666;margin:0 0 8px">
    Tu peux répondre directement depuis le lien : je prends / j'ai une question / pas pour moi. Tu peux changer d'avis tant qu'on n'a pas bouclé.
  </p>
  <p style="font-size:12px;color:#999;margin:20px 0 0;word-break:break-all">${link}</p>
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:13px;color:#666">
    — Adrien, Inkmap<br>
    <a href="mailto:inkmap.contact@gmail.com" style="color:#c0392b;text-decoration:none">inkmap.contact@gmail.com</a>
  </div>
</div>`.trim();
}

async function main() {
  if (!AIRTABLE_TOKEN) throw new Error('AIRTABLE_TOKEN manquant');
  if (!SECRET) throw new Error('EDIT_LINK_SECRET manquant');
  if (!RESEND_KEY) throw new Error('RESEND_API_KEY manquant');

  const [demande, tatoueur] = await Promise.all([
    fetchRecord(DEMANDES_TABLE, DEMANDE_ID),
    fetchRecord(TATOUEURS_TABLE, TATOUEUR_ID),
  ]);
  const df = demande.fields;
  const tf = tatoueur.fields;
  const pseudo = tf.Pseudo || tf.Nom || 'Tatoueur';

  const transmissionId = await findOrCreateTransmission(DEMANDE_ID, TATOUEUR_ID);
  console.log(`✓ Transmission Airtable : ${transmissionId}`);

  const token = sign({ did: DEMANDE_ID, tid: TATOUEUR_ID, exp: Date.now() + TOKEN_TTL_MS });
  const link = `${BASE_URL}/brief?t=${encodeURIComponent(token)}`;

  // Forcer la zone "Bras" et la ville "Paris" pour coller au texte de la notif du Reel
  const html = buildEmailHtml({
    pseudo,
    ville: 'Paris',
    styles: Array.isArray(df.Styles) ? df.Styles : [],
    budget: df.Budget || null,
    zoneCorps: df.ZoneCorps || 'Bras',
    descriptionShort: (df.Description || '').slice(0, 160),
    link,
  });

  const subject = `Une demande client pour toi — Paris`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Inkmap <bonjour@inkmap.fr>',
      to: TO_EMAIL,
      subject,
      html,
      replyTo: 'inkmap.contact@gmail.com',
    }),
  });
  const out = await r.json();
  if (!r.ok) {
    console.error('❌ Resend a refusé :', out);
    process.exit(1);
  }
  console.log(`📧 Mail envoyé à ${TO_EMAIL} (id: ${out.id})`);
  console.log(`🔗 Lien brief : ${link}`);
}

main().catch(e => { console.error('Erreur :', e.message); process.exit(1); });
