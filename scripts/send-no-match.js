#!/usr/bin/env node
// Envoie un mail "pas de tatoueur dispo dans ton secteur" au client d'une demande
// orpheline. Usage : node scripts/send-no-match.js <demandeRecordId> [--ville-proche "Strasbourg"]
//
// Le mail garde un ton chaleureux et propose 2 portes de sortie :
//   1) recommander des tatoueurs d'une grande ville à proximité (si fournie)
//   2) garder la demande sous le coude et recontacter quand un tatoueur s'inscrit
// Logge dans Airtable (Statut = "Sans match") si le champ accepte cette valeur.

require('dotenv').config({ path: '.env.local' });

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE = 'appD1ZqrwZXTza0KR';
const DEMANDES_TABLE = 'Demandes';
const RESEND_KEY = process.env.RESEND_API_KEY;

function escHtml(s) {
  return (typeof s !== 'string' ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function fetchDemande(did) {
  const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(DEMANDES_TABLE)}/${did}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  });
  if (!r.ok) throw new Error(`Airtable ${r.status}`);
  return r.json();
}

async function setStatutSansMatch(did) {
  // Tentative best-effort : si le single-select n'a pas l'option, Airtable refuse, on ignore.
  const r = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(DEMANDES_TABLE)}/${did}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { Statut: 'Sans match' } }),
  });
  return r.ok;
}

function buildEmailHtml({ prenom, ville, villeProche, descriptionShort }) {
  const villeProcheLine = villeProche
    ? `<p style="font-size:15px;color:#333;margin:0 0 18px">
         Le tatoueur Inkmap le plus proche de chez toi se trouve à <strong>${escHtml(villeProche)}</strong>. Si tu es prêt·e à te déplacer, dis-le moi et je te transmets directement quelques profils qui collent à ton projet.
       </p>`
    : '';

  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0d0d0d;line-height:1.6">
  <div style="text-align:center;margin-bottom:28px">
    <img src="https://inkmap.fr/logo-email.png" alt="Inkmap" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto" />
  </div>
  <h1 style="font-size:20px;margin:0 0 14px;font-weight:700">Salut ${escHtml(prenom)},</h1>
  <p style="font-size:15px;color:#333;margin:0 0 18px">
    Merci pour ta demande Inkmap${descriptionShort ? ` (${escHtml(descriptionShort)})` : ''}.
  </p>
  <p style="font-size:15px;color:#333;margin:0 0 18px">
    Petite mauvaise nouvelle : je n'ai pas encore de tatoueur référencé sur Inkmap à <strong>${escHtml(ville)}</strong> ni dans les environs proches. L'annuaire est tout récent et certaines zones, comme la tienne, ne sont pas encore couvertes.
  </p>
  ${villeProcheLine}
  <p style="font-size:15px;color:#333;margin:0 0 18px">
    Sinon, je garde ta demande sous le coude. <strong>Dès qu'un tatoueur intéressant s'inscrit dans ton secteur</strong>, je te recontacte directement avec une short-list — pas besoin de re-soumettre quoi que ce soit.
  </p>
  <p style="font-size:15px;color:#333;margin:0 0 18px">
    Désolé pour l'attente, et merci d'avoir testé Inkmap !
  </p>
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:13px;color:#666">
    — Adrien, Inkmap<br>
    <a href="mailto:inkmap.contact@gmail.com" style="color:#c0392b;text-decoration:none">inkmap.contact@gmail.com</a>
  </div>
</div>`.trim();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage : node scripts/send-no-match.js <demandeId> [--ville-proche "Strasbourg"]');
    process.exit(1);
  }
  const did = args[0];
  const villeProcheArg = args.indexOf('--ville-proche');
  const villeProche = villeProcheArg !== -1 ? args[villeProcheArg + 1] : '';

  if (!AIRTABLE_TOKEN || !RESEND_KEY) throw new Error('AIRTABLE_TOKEN ou RESEND_API_KEY manquant');

  const demande = await fetchDemande(did);
  const f = demande.fields;
  const email = (f.Email || '').trim();
  const ville = f.Ville || '';
  const description = f.Description || '';
  if (!email) throw new Error(`Pas d'email sur la demande ${did}`);
  if (!ville) throw new Error(`Pas de ville sur la demande ${did}`);

  const prenom = (f.Prenom || email.split('@')[0]).split(/[\s.]+/)[0];
  const descShort = description.length > 80 ? description.slice(0, 80) + '…' : description;

  const html = buildEmailHtml({ prenom, ville, villeProche, descriptionShort: descShort });
  const subject = `Ta demande Inkmap — pas encore de tatoueur dans ton secteur`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Inkmap <bonjour@inkmap.fr>',
      to: email,
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
  console.log(`📧 Mail envoyé à ${email} (id: ${out.id})`);
  console.log(`   Sujet : ${subject}`);
  console.log(`   Ville : ${ville}${villeProche ? ` → recommandation ${villeProche}` : ''}`);

  const ok = await setStatutSansMatch(did);
  if (ok) console.log(`✓ Statut Airtable passé à "Sans match"`);
  else console.log(`↻ Statut Airtable inchangé (option "Sans match" peut-être absente du single-select — à ajouter manuellement si tu veux)`);
}

main().catch(e => { console.error('Erreur :', e.message); process.exit(1); });
