// Tokens HMAC stateless pour le magic link de modification profil
const crypto = require('crypto');

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function getSecret() {
  const s = process.env.EDIT_LINK_SECRET;
  if (!s || s.length < 16) throw new Error('EDIT_LINK_SECRET missing or too short');
  return s;
}

// payload = { rid: "rec...", exp: 1775000000000 } (exp en ms)
function sign(payload) {
  const data = b64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest();
  return `${data}.${b64urlEncode(sig)}`;
}

function verify(token) {
  try {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, sigB64] = parts;
    const expected = crypto.createHmac('sha256', getSecret()).update(data).digest();
    const provided = b64urlDecode(sigB64);
    if (provided.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(provided, expected)) return null;
    const payload = JSON.parse(b64urlDecode(data).toString('utf-8'));
    if (!payload || typeof payload !== 'object') return null;
    if (!payload.rid || typeof payload.rid !== 'string') return null;
    if (!payload.exp || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Verify générique : HMAC valide + payload non expiré, sans contrainte de schéma.
// Utilisé pour les tokens briefs (champs did/tid) et tout autre usage futur.
function verifyGeneric(token) {
  try {
    if (typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, sigB64] = parts;
    const expected = crypto.createHmac('sha256', getSecret()).update(data).digest();
    const provided = b64urlDecode(sigB64);
    if (provided.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(provided, expected)) return null;
    const payload = JSON.parse(b64urlDecode(data).toString('utf-8'));
    if (!payload || typeof payload !== 'object') return null;
    if (!payload.exp || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { sign, verify, verifyGeneric };
