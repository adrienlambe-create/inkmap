#!/usr/bin/env node
// Mini serveur dev local — alternative à `vercel dev` quand il plante (Error: spawn EBADF).
// Sert les fichiers statiques + route /api/* vers les handlers serverless du dossier api/.
// Usage : node scripts/dev-server.js  (port 3000)

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = parseInt(process.env.PORT || '3000');
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
};

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    req.on('error', () => resolve(''));
  });
}

// Anti path-traversal : le chemin résolu doit rester dans ROOT
function safeResolve(p) {
  const resolved = path.resolve(ROOT, '.' + p);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);
  const tag = `${req.method} ${pathname}${url.search}`;

  // ── API routes ──
  if (pathname.startsWith('/api/')) {
    const apiName = pathname.slice(5).split('/')[0].replace(/[^a-z0-9-]/gi, '');
    const apiPath = path.join(ROOT, 'api', apiName + '.js');
    if (!fs.existsSync(apiPath)) {
      console.log(`✗ ${tag}  → 404 (api not found)`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'API not found: ' + apiName }));
    }
    try {
      delete require.cache[require.resolve(apiPath)]; // hot reload
      const handler = require(apiPath);
      req.query = Object.fromEntries(url.searchParams);
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.body = await parseBody(req);
      }
      // Polyfill des helpers Vercel sur res (status, json, send, end)
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (obj) => {
        if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(obj));
        return res;
      };
      res.send = (data) => {
        if (typeof data === 'object' && data !== null) return res.json(data);
        res.end(String(data));
        return res;
      };
      await handler(req, res);
      console.log(`→ ${tag}  → ${res.statusCode}`);
    } catch (e) {
      console.error(`✗ ${tag}  → 500`, e);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    }
    return;
  }

  // ── Static files ──
  let filePath = safeResolve(pathname);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  // Clean URLs : /brief → /brief.html
  if (!path.extname(filePath) && !pathname.endsWith('/') && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  // Répertoires → index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    console.log(`✗ ${tag}  → 404`);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 — fichier introuvable : ' + pathname);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  fs.createReadStream(filePath).pipe(res);
  console.log(`→ ${tag}  → 200 (${ext})`);
});

server.listen(PORT, () => {
  console.log(`\n🚀 Dev server prêt sur http://localhost:${PORT}\n   Appuie Ctrl+C pour arrêter.\n`);
});
