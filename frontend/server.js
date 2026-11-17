const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT) || 3008;

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.map': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.ico': 'image/x-icon'
};

// Only these top-level entries are part of the website. Everything else in this folder
// (.git, .env files, logs, docs, scripts, node_modules, server.js, package.json) is never served.
// test_ui.html is the NCERT Reading Engine admin page (also at /ncert and /test-ui).
const PUBLIC_ROOTS = new Set(['index.html', 'whiteboard.html', 'test_ui.html', 'assets', 'css', 'js', 'vendor']);

function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=UTF-8', 'X-Content-Type-Options': 'nosniff' });
  res.end(text);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return sendText(res, 405, 'Method Not Allowed');
  }
  let cleanUrl;
  try {
    cleanUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (_) {
    return sendText(res, 400, 'Bad Request');
  }
  if (cleanUrl.includes('\0')) return sendText(res, 400, 'Bad Request');
  let relPath = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\/+/, '');

  // Support clean URLs (e.g. /whiteboard -> whiteboard.html, /test-ui -> test_ui.html)
  if (relPath === 'whiteboard') {
    relPath = 'whiteboard.html';
  } else if (relPath === 'test-ui' || relPath === 'ncert' || relPath === 'ncert-reading-engine') {
    relPath = 'test_ui.html';
  }

  let filePath = path.resolve(ROOT_DIR, relPath);

  // Serve lightweight inline SVG favicon so browsers do not log 404 on /favicon.ico
  if (cleanUrl === '/favicon.ico') {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2563eb"/><text x="32" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="30" fill="#ffffff">H</text></svg>';
    res.writeHead(200, {
      'Content-Type': 'image/svg+xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(svg);
    return;
  }

  // Prevent directory traversal outside frontend root
  if (filePath !== ROOT_DIR && !filePath.startsWith(ROOT_DIR + path.sep)) {
    return sendText(res, 403, 'Forbidden');
  }

  // Serve website files only: no dot-files or dot-folders, and nothing outside the public entries.
  const segments = path.relative(ROOT_DIR, filePath).split(path.sep).filter(Boolean);
  if (segments.some(s => s.startsWith('.'))) {
    return sendText(res, 404, 'Not Found');
  }
  if (segments.length && !PUBLIC_ROOTS.has(segments[0])) {
    // Unknown page-like URLs fall back to the app; unknown files are a 404.
    if (path.extname(filePath)) return sendText(res, 404, 'Not Found');
    filePath = path.join(ROOT_DIR, 'index.html');
  }

  // Fallback to index.html for SPA routes or missing HTML routes
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const extCheck = path.extname(filePath).toLowerCase();
    if (!extCheck || extCheck === '.html') {
      filePath = path.join(ROOT_DIR, 'index.html');
    } else {
      return sendText(res, 404, 'Not Found');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const stream = fs.createReadStream(filePath);
  // A read error must never crash the server.
  stream.on('error', () => {
    if (!res.headersSent) sendText(res, 500, 'Could not read the file');
    else res.destroy();
  });
  stream.once('open', () => {
    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      // Always re-check with the server, so a new version of a file is picked up straight away.
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    if (req.method === 'HEAD') { stream.destroy(); res.end(); return; }
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[FRONTEND SERVER] Serving HAPS-AI frontend at http://localhost:${PORT}`);
});

