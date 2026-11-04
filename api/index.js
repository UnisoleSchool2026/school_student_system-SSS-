const { app } = require('../backend/src/server');

// Explicit static references for Vercel serverless file tracer
try {
  require('pdf-parse');
  require('pdf-parse/worker');
} catch (e) {}

module.exports = (req, res) => {
  // Vercel serverless function receives the stripped path (e.g. /health instead of /api/health)
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
