// Lecture d'un brief client par un tatoueur, accès via magic link.
// Token HMAC {did: recordId demande, tid: recordId tatoueur, exp}.
// Ne renvoie PAS l'email/téléphone du client : la mise en relation reste manuelle.

const { cors, rateLimit, getIp, airtableConfig } = require('./_utils');
const { verifyGeneric } = require('./_token');

module.exports = async (req, res) => {
  if (cors(req, res, 'GET, OPTIONS')) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = getIp(req);
  if (!rateLimit(ip, 30)) return res.status(429).json({ error: 'Trop de requêtes' });

  const token = typeof req.query?.t === 'string' ? req.query.t : '';
  const payload = verifyGeneric(token);
  if (!payload || !payload.did || !payload.tid) {
    return res.status(401).json({ error: 'Lien invalide ou expiré' });
  }

  const { token: airtableToken, base } = airtableConfig();
  const demandesTable = process.env.AIRTABLE_DEMANDES_TABLE_ID || 'Demandes';
  const tatoueursTable = process.env.AIRTABLE_TABLE_ID || 'tbl5xdM5VGqrieG4a';
  const transmissionsTable = process.env.AIRTABLE_TRANSMISSIONS_TABLE_ID || 'Transmissions';

  try {
    // Fetch parallèle demande + tatoueur
    const [demandeRes, tatoueurRes] = await Promise.all([
      fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(demandesTable)}/${payload.did}`, {
        headers: { Authorization: `Bearer ${airtableToken}` },
      }),
      fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(tatoueursTable)}/${payload.tid}`, {
        headers: { Authorization: `Bearer ${airtableToken}` },
      }),
    ]);

    if (!demandeRes.ok || !tatoueurRes.ok) {
      console.error('[brief] fetch failed', demandeRes.status, tatoueurRes.status);
      return res.status(404).json({ error: 'Ressource introuvable' });
    }

    const demande = await demandeRes.json();
    const tatoueur = await tatoueurRes.json();

    const df = demande.fields || {};
    const tf = tatoueur.fields || {};

    // Recherche d'une transmission existante (si le tatoueur a déjà répondu)
    let transmissionId = '';
    let statutActuel = '';
    let messageActuel = '';
    try {
      const formula = encodeURIComponent(
        `AND({DemandeId} = "${payload.did}", {TatoueurId} = "${payload.tid}")`
      );
      const tRes = await fetch(
        `https://api.airtable.com/v0/${base}/${encodeURIComponent(transmissionsTable)}?filterByFormula=${formula}&maxRecords=1`,
        { headers: { Authorization: `Bearer ${airtableToken}` } }
      );
      if (tRes.ok) {
        const tData = await tRes.json();
        const existing = (tData.records || [])[0];
        if (existing) {
          transmissionId = existing.id;
          statutActuel = existing.fields?.Statut || '';
          messageActuel = existing.fields?.MessageTatoueur || '';
        }
      }
    } catch (e) {
      console.warn('[brief] transmissions lookup failed', e.message);
    }

    return res.status(200).json({
      ok: true,
      tatoueur: {
        pseudo: tf.Pseudo || tf.Nom || '',
      },
      demande: {
        description: df.Description || '',
        ville: df.Ville || '',
        styles: Array.isArray(df.Styles) ? df.Styles : [],
        budget: df.Budget || null,
        zoneCorps: df.ZoneCorps || '',
        photos: Array.isArray(df.Photos)
          ? df.Photos.map(p => p.thumbnails?.large?.url || p.url || '').filter(Boolean)
          : [],
        dateDemande: demande.createdTime || '',
      },
      reponse: {
        statut: statutActuel,
        message: messageActuel,
      },
    });
  } catch (e) {
    console.error('[brief] exception', e.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
