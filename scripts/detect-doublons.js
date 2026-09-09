#!/usr/bin/env node
// Détection de doublons dans la base Airtable — lecture seule, ne modifie rien.
// Compare chaque paire de profils sur (nom normalisé + ville normalisée) et
// signale les paires trop proches (distance de Levenshtein sur le slug) pour
// validation manuelle avant fusion/suppression.
//
// Usage : node scripts/detect-doublons.js [--seuil=3]

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appD1ZqrwZXTza0KR';
const TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tbl5xdM5VGqrieG4a';
const TOKEN = process.env.AIRTABLE_TOKEN;

if (!TOKEN) {
  console.error('❌ AIRTABLE_TOKEN manquant. Usage : AIRTABLE_TOKEN=xxx node scripts/detect-doublons.js');
  process.exit(1);
}

const SEUIL = parseInt((process.argv.find(a => a.startsWith('--seuil=')) || '').split('=')[1]) || 3;

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function villeBase(ville) {
  if (!ville) return '';
  return ville.trim().replace(/\s+\d+(e|er|ème|eme|ième|ieme)?\s*$/i, '').trim() || ville.trim();
}

// Distance de Levenshtein classique (matrice complète, simple et suffisant ici)
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function normalizeInsta(handle) {
  return String(handle || '').toLowerCase().trim().replace(/^@/, '').replace(/\/$/, '');
}

async function fetchAllRecords() {
  const fields = ['Nom', 'Pseudo', 'Ville', 'Instagram', 'Email', 'Statut', 'Tarif'];
  const fieldsParam = fields.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
  let allRecords = [];
  let offset = null;
  do {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${fieldsParam}${offset ? `&offset=${offset}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) {
      console.error(`❌ Airtable error: ${res.status} ${res.statusText}`);
      process.exit(1);
    }
    const data = await res.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset;
  } while (offset);
  return allRecords;
}

async function main() {
  const records = await fetchAllRecords();
  const profils = records
    .filter(r => r.fields && r.fields.Nom)
    .map(r => {
      const f = r.fields;
      const nom = f.Pseudo || f.Nom;
      const ville = villeBase(f.Ville || '');
      return {
        id: r.id,
        nom,
        nomComplet: f.Nom,
        ville,
        instagram: normalizeInsta(f.Instagram),
        tarif: f.Tarif || '',
        verifie: !!(f.Email && String(f.Email).trim()),
        nomSlug: slugify(nom),
        slug: `${slugify(nom)}-${slugify(ville)}`.replace(/^-+|-+$/g, ''),
      };
    });

  const paires = [];
  for (let i = 0; i < profils.length; i++) {
    for (let j = i + 1; j < profils.length; j++) {
      const a = profils[i], b = profils[j];
      if (!a.nomSlug || !b.nomSlug) continue;

      // Signal fort : même compte Instagram déclaré → quasi certainement le même
      // profil, même si la ville diffère (ex : ville principale vs commune limitrophe).
      const instaMatch = a.instagram && a.instagram === b.instagram;

      // Signal fort : même nom/pseudo exact (recoupe la logique de fusion du front,
      // qui affiche ces deux fiches comme un seul profil) — même si la ville diffère.
      const dist = levenshtein(a.nomSlug, b.nomSlug);
      const nomExact = a.nomSlug === b.nomSlug;

      // Signal secondaire, plus bruité : même ville + nom très proche (typo).
      // Seuil resserré pour éviter les faux positifs entre studios différents
      // qui partagent juste le mot "tattoo".
      const sameVille = a.ville.toLowerCase() === b.ville.toLowerCase();
      const distRelative = dist / Math.max(a.nomSlug.length, b.nomSlug.length);
      const nomProche = sameVille && dist <= 2 && distRelative <= 0.15;

      if (instaMatch || nomExact || nomProche) {
        const motif = instaMatch ? 'même Instagram' : nomExact ? 'même nom/pseudo' : 'nom proche + même ville';
        paires.push({ a, b, dist, motif });
      }
    }
  }

  console.log(`\n${profils.length} profils analysés — seuil de distance : ${SEUIL}\n`);

  if (paires.length === 0) {
    console.log('✅ Aucun doublon candidat détecté.');
    return;
  }

  console.log(`⚠️  ${paires.length} paire(s) candidate(s) à valider manuellement :\n`);
  paires
    .sort((x, y) => x.dist - y.dist)
    .forEach(({ a, b, dist, motif }) => {
      console.log(`— ${motif} (distance nom : ${dist}) —`);
      console.log(`  [${a.id}] "${a.nomComplet}" (${a.nom}) — ${a.ville} — ${a.verifie ? '✓ vérifié' : 'non vérifié'} — ${a.tarif || '?'}€ — @${a.instagram || '?'}`);
      console.log(`  [${b.id}] "${b.nomComplet}" (${b.nom}) — ${b.ville} — ${b.verifie ? '✓ vérifié' : 'non vérifié'} — ${b.tarif || '?'}€ — @${b.instagram || '?'}`);
      console.log('');
    });

  console.log('Aucune donnée n\'a été modifiée. Vérifie chaque paire dans Airtable avant de fusionner ou supprimer.');
}

main();
