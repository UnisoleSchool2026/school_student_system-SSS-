// ============================================================================
// SECURITY MIDDLEWARE (no extra dependencies)
//   securityHeaders  - safe default response headers for a JSON API
//   rateLimit        - per-IP request limits (general + stricter for costly routes)
//   errorHandler     - consistent JSON errors; no stack traces or internals in production
// ============================================================================

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // the frontend is served from another origin
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  if (req.secure || String(req.headers['x-forwarded-proto'] || '').includes('https')) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
}

// Fixed-window limiter kept in memory (per backend instance).
function rateLimit({ windowMs = 60000, max = 600, name = 'general' } = {}) {
  const hits = new Map();
  const sweep = setInterval(() => {
    const now = Date.now();
    hits.forEach((v, k) => { if (v.resetAt <= now) hits.delete(k); });
  }, windowMs);
  if (sweep.unref) sweep.unref();
  return function limiter(req, res, next) {
    if (req.method === 'OPTIONS' || String(process.env.RATE_LIMIT_DISABLED || '').toLowerCase() === 'true') return next();
    const ip = req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
    const now = Date.now();
    let entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) { entry = { count: 0, resetAt: now + windowMs }; hits.set(ip, entry); }
    entry.count += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, error: 'Too many requests. Please wait a moment and try again.', limit: name });
    }
    return next();
  };
}

function notFound(req, res) {
  res.status(404).json({ success: false, error: 'Endpoint not found.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  let status = err.status || err.statusCode || 500;
  let message = 'Something went wrong on the server.';
  if (err.type === 'entity.too.large') { status = 413; message = 'That upload is too large. The limit is 25 MB.'; }
  else if (err.code === 'LIMIT_FILE_SIZE') { status = 413; message = 'That file is too large.'; }
  else if (err.name === 'MulterError') { status = 400; message = 'The file upload could not be read.'; }
  else if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) { status = 400; message = 'The request body is not valid JSON.'; }
  else if (/not allowed by CORS/i.test(String(err.message))) { status = 403; message = 'This website is not allowed to use the API (CORS).'; }
  else if (status < 500 && err.message) { message = err.message; }
  if (status >= 500) console.error('[SERVER ERROR]', req.method, req.originalUrl, err.stack || err.message);
  if (res.headersSent) return;
  const body = { success: false, error: message };
  if (!isProd && status >= 500) body.details = err.message;
  res.status(status).json(body);
}

module.exports = { securityHeaders, rateLimit, notFound, errorHandler };
