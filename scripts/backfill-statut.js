// Remplit le champ Statut des inscriptions qui n'en ont pas encore.
// Toutes → "Publié", sauf les IDs passés en --attente=rec1,rec2 → "En attente".
// Dry-run par défaut ; ajouter --apply pour écrire dans Airtable.
//
//   node scripts/backfill-statut.js --attente=recGi0hmVbqMpQWoE
//   node scripts/backfill-statut.js --attente=recGi0hmVbqMpQWoE --apply

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), quiet: true });
const { airtableConfig, STATUT_PUBLIE, STATUT_EN_ATTENTE } = require('../api/_utils');

const { token, base, table } = airtableConfig();
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');
const attenteArg = process.argv.find(a => a.startsWith('--attente='));
const enAttente = new Set(attenteArg ? attenteArg.slice('--attente='.length).split(',') : []);

async function fetchAll() {
  const all = [];
  let offset;
  do {
    const qs = `fields[]=Nom&fields[]=Pseudo&fields[]=Statut${offset ? `&offset=${offset}` : ''}`;
    const r = await fetch(`https://api.airtable.com/v0/${base}/${table}?${qs}`, { headers });
    if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
    const d = await r.json();
    all.push(...d.records);
    offset = d.offset;
  } while (offset);
  return all;
}

(async () => {
  const records = await fetchAll();
  const updates = records
    .filter(r => !r.fields.Statut)
    .map(r => ({ id: r.id, fields: { Statut: enAttente.has(r.id) ? STATUT_EN_ATTENTE : STATUT_PUBLIE } }));

  for (const u of updates) {
    const rec = records.find(r => r.id === u.id);
    console.log(`${u.fields.Statut.padEnd(10)}  ${u.id}  ${rec.fields.Pseudo || rec.fields.Nom || '?'}`);
  }
  console.log(`\n${updates.length} fiche(s) sans Statut sur ${records.length}.`);

  if (!apply) {
    console.log('Dry-run — relance avec --apply pour écrire.');
    return;
  }

  // typecast : crée les options du single-select si elles n'existent pas encore
  for (let i = 0; i < updates.length; i += 10) {
    const r = await fetch(`https://api.airtable.com/v0/${base}/${table}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ records: updates.slice(i, i + 10), typecast: true }),
    });
    if (!r.ok) throw new Error(`Airtable ${r.status}: ${await r.text()}`);
  }
  console.log(`✅ ${updates.length} fiche(s) mises à jour.`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
