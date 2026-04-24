#!/usr/bin/env node
// Transmit brief : génère les Transmissions Airtable + les liens magic + l'email HTML
// prêt à copier-coller (un par tatoueur) pour une demande donnée.
//
// Usage :
//   node scripts/transmit-brief.js <demandeRecordId> <tatoueurRecordId1> [tatoueurRecordId2] ...
//
// Exemple :
//   node scripts/transmit-brief.js recABC123 recTAT001 recTAT002 recTAT003
//
// Prérequis : fichier .env.local avec AIRTABLE_TOKEN et EDIT_LINK_SECRET
//
// Sortie : pour chaque tatoueur, l'email HTML + sujet + destinataire copiable.
// Tu envoies chaque email manuellement depuis ton mail pro.

require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
// Prod par défaut. Override en local dev via BRIEF_BASE_URL=http://localhost:3000 dans .env.local
const BASE_URL = process.env.BRIEF_BASE_URL || 'https://inkmap.fr';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || 'appD1ZqrwZXTza0KR';
const TATOUEURS_TABLE = process.env.AIRTABLE_TABLE_ID || 'tbl5xdM5VGqrieG4a';
const DEMANDES_TABLE = process.env.AIRTABLE_DEMANDES_TABLE_ID || 'Demandes';
const TRANSMISSIONS_TABLE = process.env.AIRTABLE_TRANSMISSIONS_TABLE_ID || 'Transmissions';
const SECRET = process.env.EDIT_LINK_SECRET;

if (!AIRTABLE_TOKEN) { console.error('❌ AIRTABLE_TOKEN manquant dans .env.local'); process.exit(1); }
if (!SECRET || SECRET.length < 16) { console.error('❌ EDIT_LINK_SECRET manquant ou trop court'); process.exit(1); }

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(payload) {
  const data = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

function escHtml(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function fetchRecord(tableId, recordId) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(tableId)}/${recordId}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    throw new Error(`Airtable ${r.status} (${tableId}/${recordId}) — ${err.slice(0, 200)}`);
  }
  return r.json();
}

async function findExistingTransmission(did, tid) {
  const formula = encodeURIComponent(`AND({DemandeId} = "${did}", {TatoueurId} = "${tid}")`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(TRANSMISSIONS_TABLE)}?filterByFormula=${formula}&maxRecords=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    throw new Error(`Airtable lookup Transmissions — ${r.status} — ${err.slice(0, 200)}`);
  }
  const data = await r.json();
  return (data.records || [])[0] || null;
}

async function createTransmission(did, tid) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(TRANSMISSIONS_TABLE)}`;
  const fields = {
    Demande: [did],
    Tatoueur: [tid],
    DemandeId: did,
    TatoueurId: tid,
    Statut: 'Envoyé',
    DateEnvoi: new Date().toISOString().slice(0, 10),
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => '');
    throw new Error(`Airtable create Transmission — ${r.status} — ${err.slice(0, 300)}`);
  }
  return r.json();
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
  <p style="font-size:12px;color:#999;margin:20px 0 0;word-break:break-all">
    ${link}
  </p>
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:13px;color:#666">
    — Adrien, Inkmap<br>
    <a href="mailto:inkmap.contact@gmail.com" style="color:#c0392b;text-decoration:none">inkmap.contact@gmail.com</a>
  </div>
</div>
`.trim();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage : node scripts/transmit-brief.js <demandeId> <tatoueurId1> [tatoueurId2] ...');
    process.exit(1);
  }
  const [did, ...tids] = args;
  if (!did.startsWith('rec') || tids.some(t => !t.startsWith('rec'))) {
    console.error('❌ Les IDs Airtable commencent par "rec" (ex: recABC123)');
    process.exit(1);
  }

  console.log(`\n📨 Transmission du brief ${did} à ${tids.length} tatoueur(s)...\n`);

  // Charge la demande
  let demande;
  try {
    demande = await fetchRecord(DEMANDES_TABLE, did);
  } catch (e) {
    console.error('❌ Impossible de charger la demande :', e.message);
    process.exit(1);
  }
  const df = demande.fields || {};
  const descShort = (df.Description || '').slice(0, 160);
  const styles = Array.isArray(df.Styles) ? df.Styles : [];

  const exp = Date.now() + TOKEN_TTL_MS;

  for (const tid of tids) {
    try {
      // Tatoueur
      const tatoueur = await fetchRecord(TATOUEURS_TABLE, tid);
      const tf = tatoueur.fields || {};
      const pseudo = tf.Pseudo || tf.Nom || 'Tatoueur';
      const emailTat = (tf.Email || '').trim();

      // Transmission (upsert-ish : skip si déjà présent)
      let transmissionId = '';
      const existing = await findExistingTransmission(did, tid);
      if (existing) {
        transmissionId = existing.id;
        console.log(`↻ ${pseudo} — transmission existe déjà (${existing.id}), on réutilise`);
      } else {
        const created = await createTransmission(did, tid);
        transmissionId = created.id;
        console.log(`✓ ${pseudo} — transmission créée (${transmissionId})`);
      }

      // Token + lien
      const token = sign({ did, tid, exp });
      const link = `${BASE_URL}/brief?t=${encodeURIComponent(token)}`;

      // Email HTML
      const html = buildEmailHtml({
        pseudo,
        ville: df.Ville || '',
        styles,
        budget: df.Budget || null,
        zoneCorps: df.ZoneCorps || '',
        descriptionShort: descShort,
        link,
      });

      console.log('─────────────────────────────────────────────────────────');
      console.log(`À       : ${emailTat || '(email non renseigné — vérifie Airtable)'}`);
      console.log(`Sujet   : Une demande client pour toi — ${df.Ville || 'Inkmap'}`);
      console.log(`Lien    : ${link}`);
      console.log('─────────────────────────────────────────────────────────');
      console.log('Email HTML (copier dans ton client mail en mode "code HTML") :\n');
      console.log(html);
      console.log('─────────────────────────────────────────────────────────\n');
    } catch (e) {
      console.error(`❌ Erreur sur ${tid} :`, e.message);
    }
  }

  console.log('✅ Terminé. Lien valable 30 jours.\n');
}

main().catch(e => { console.error('Erreur fatale :', e); process.exit(1); });
