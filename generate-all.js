// Orchestrateur : génère toutes les pages du site + met à jour le sitemap
// Ordre : 1) pages style×ville  2) profils tatoueur  3) sitemap.xml

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SITEMAP_PATH = path.join(__dirname, 'sitemap.xml');
const PROFILES_INDEX = path.join(__dirname, '.profiles-index.json');

function run(script) {
  console.log(`\n▶️  ${script}`);
  const r = spawnSync('node', [script], { stdio: 'inherit', cwd: __dirname });
  if (r.status !== 0) {
    console.error(`❌ ${script} a échoué (exit ${r.status})`);
    process.exit(r.status || 1);
  }
}

function regenSitemap() {
  console.log('\n🗺  Mise à jour sitemap.xml');
  const today = new Date().toISOString().split('T')[0];

  // Pages statiques (toujours présentes)
  const staticUrls = [
    { loc: 'https://inkmap.fr/', priority: '1.0' },
    { loc: 'https://inkmap.fr/inscription', priority: '0.9' },
    { loc: 'https://inkmap.fr/rejoindre', priority: '0.9' },
    { loc: 'https://inkmap.fr/faq', priority: '0.7' },
    { loc: 'https://inkmap.fr/guide/trouver-clients-tatoueur', priority: '0.7' },
    { loc: 'https://inkmap.fr/guide/referencer-studio-tatouage-gratuit', priority: '0.7' },
    { loc: 'https://inkmap.fr/outils/calculateur-tarif-tatouage', priority: '0.7' },
  ];

  // Pages style×ville : on scanne les fichiers
  const styleVilleFiles = fs.readdirSync(__dirname)
    .filter(f => /^tatoueur-[a-z0-9-]+\.html$/.test(f))
    .map(f => f.replace(/\.html$/, ''))
    .sort();
  const styleVilleUrls = styleVilleFiles.map(slug => ({
    loc: `https://inkmap.fr/${slug}`,
    priority: '0.8',
  }));

  // Pages profil tatoueur : on lit l'index généré
  let profileUrls = [];
  if (fs.existsSync(PROFILES_INDEX)) {
    const { generated } = JSON.parse(fs.readFileSync(PROFILES_INDEX, 'utf-8'));
    profileUrls = generated.map(p => ({
      loc: `https://inkmap.fr/tatoueur/${p.slug}`,
      priority: '0.85', // priorité haute — pages vitrine tatoueur
    }));
  }

  const all = [...staticUrls, ...styleVilleUrls, ...profileUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(u => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf-8');
  console.log(`  ✓ ${all.length} URLs dans sitemap.xml (${profileUrls.length} profils)`);
}

// ── Main ──
console.log('🏗  Build Inkmap — début');
run('generate-pages.js');       // pages style×ville
run('generate-profiles.js');     // pages profil tatoueur
regenSitemap();
console.log('\n✅ Build terminé.');
