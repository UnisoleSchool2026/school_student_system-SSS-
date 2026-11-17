// Shared route wrapper: runs a (sync or async) handler and returns consistent JSON.
module.exports = function handle(tag, fn) {
  return async (req, res) => {
    try {
      const out = await fn(req);
      res.json(Object.assign({ success: true }, out));
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) console.error(`[${tag} ERROR]`, err);
      res.status(status).json({ success: false, error: status >= 500 ? 'Something went wrong. Please try again.' : err.message });
    }
  };
};
