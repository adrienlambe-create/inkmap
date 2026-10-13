// Modération d'une inscription depuis l'email admin : boutons « Publier » / « Refuser ».
// GET  → page de confirmation (les scanners de mail ouvrent les liens tout seuls,
//        donc un simple GET ne doit jamais rien modifier)
// POST → passe le Statut Airtable à « Publié » ou « Refusé », puis redéploie le site
//        si publié (les pages profil sont générées au build).

const { airtableConfig, escHtml, STATUT_PUBLIE } = require('./_utils');
const { verifyGeneric } = require('./_token');

const STATUT_REFUSE = 'Refusé';
const ACTIONS = {
  publier: { statut: STATUT_PUBLIE, label: 'Publier', done: 'publié' },
  refuser: { statut: STATUT_REFUSE, label: 'Refuser', done: 'refusé' },
};

function verifyModeration(token) {
  const payload = verifyGeneric(token);
  if (!payload || payload.act !== 'moderer' || typeof payload.rid !== 'string') return null;
  return payload;
}

function page(res, status, title, body) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(status).send(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${escHtml(title)} — Inkmap</title>
<style>
  body{margin:0;background:#111;color:#eee;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;line-height:1.5}
  main{max-width:520px;margin:48px auto;padding:0 20px}
  h1{font-size:1.4rem;margin:0 0 20px}
  table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:0.92rem}
  td{padding:6px 0;vertical-align:top}td:first-child{color:#888;width:110px}
  .btns{display:flex;gap:12px;flex-wrap:wrap}
  button{font:inherit;font-weight:700;border:0;border-radius:6px;padding:12px 22px;cursor:pointer}
  .ok{background:#c0392b;color:#fff}.ko{background:#333;color:#eee}
  .muted{color:#888;font-size:0.88rem}a{color:#e74c3c}
</style></head><body><main>${body}</main></body></html>`);
}

async function fetchRecord(rid) {
  const { token, base, table } = airtableConfig();
  const r = await fetch(`https://api.airtable.com/v0/${base}/${table}/${encodeURIComponent(rid)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}

function resume(f) {
  const rows = [
    ['Nom', f.Nom], ['Pseudo', f.Pseudo], ['Studio', f.Studio], ['Ville', f.Ville],
    ['Styles', Array.isArray(f.Styles) ? f.Styles.join(', ') : f.Styles],
    ['Instagram', f.Instagram], ['Photos', String((f.Photos || []).length)],
    ['Statut', f.Statut || '—'],
  ];
  return `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${escHtml(String(v || '—'))}</td></tr>`).join('')}</table>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();

  const src = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const token = typeof src.t === 'string' ? src.t : '';
  const action = ACTIONS[src.action] ? src.action : '';
  const payload = verifyModeration(token);
  if (!payload || !action) {
    return page(res, 401, 'Lien invalide', '<h1>Lien invalide ou expiré</h1><p class="muted">Modère cette inscription directement dans Airtable.</p>');
  }

  const rec = await fetchRecord(payload.rid);
  if (!rec) return page(res, 502, 'Erreur', '<h1>Impossible de lire la fiche Airtable</h1><p class="muted">Réessaie dans un instant.</p>');
  const f = rec.fields || {};
  const nom = f.Pseudo || f.Nom || 'cette inscription';
  const { statut, label, done } = ACTIONS[action];

  if (req.method === 'GET') {
    const other = action === 'publier' ? 'refuser' : 'publier';
    return page(res, 200, `${label} ${nom}`, `
      <h1>${escHtml(label)} « ${escHtml(nom)} » ?</h1>
      ${resume(f)}
      <form method="POST" class="btns">
        <input type="hidden" name="t" value="${escHtml(token)}">
        <button class="${action === 'publier' ? 'ok' : 'ko'}" name="action" value="${action}">${escHtml(label)}</button>
        <button class="${other === 'publier' ? 'ok' : 'ko'}" name="action" value="${other}">${escHtml(ACTIONS[other].label)} plutôt</button>
      </form>`);
  }

  // POST : écrit le Statut (typecast crée l'option « Refusé » si elle n'existe pas encore)
  const { token: airtableToken, base, table } = airtableConfig();
  const r = await fetch(`https://api.airtable.com/v0/${base}/${table}/${encodeURIComponent(payload.rid)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${airtableToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { Statut: statut }, typecast: true }),
  });
  if (!r.ok) {
    console.error('[moderer] airtable patch', r.status, await r.text().catch(() => ''));
    return page(res, 502, 'Erreur', '<h1>La mise à jour Airtable a échoué</h1><p class="muted">Réessaie, ou change le Statut directement dans Airtable.</p>');
  }

  let deployMsg = '';
  if (action === 'publier') {
    const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
    let deployed = false;
    if (hook) {
      try { deployed = (await fetch(hook, { method: 'POST' })).ok; } catch (e) { console.error('[moderer] deploy hook', e.message); }
    }
    deployMsg = deployed
      ? '<p>Le site est en cours de redéploiement : le profil sera en ligne d\'ici 2 à 3 minutes.</p>'
      : '<p class="muted">Le redéploiement automatique n\'a pas pu être lancé : relance un déploiement dans Vercel pour mettre le profil en ligne.</p>';
  }

  return page(res, 200, `${nom} ${done}`, `
    <h1>« ${escHtml(nom)} » ${done} ✓</h1>
    ${deployMsg}
    <p class="muted"><a href="https://inkmap.fr/">Retour au site</a></p>`);
};
