// ============================================================================
// Question figures (diagrams, circuits, graphs cropped from uploaded photos)
// ----------------------------------------------------------------------------
// A question refers to its figure with the token [[figure:<id>]] inside
// question_latex; the frontend renders the token as an image. Figures are kept
// in inMemoryStore.questionFigures (saved to PostgreSQL by persistence.js when
// a database is configured) and as files in backend/data/question_figures
// (so they also survive restarts without a database).
// ============================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { inMemoryStore } = require('../config/database');
const dataPaths = require('../config/dataPaths');

const MAX_BYTES = 1500 * 1024; // decoded image size
const ID_RE = /^fig_[a-z0-9]{8,32}$/;
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function store() {
  if (!Array.isArray(inMemoryStore.questionFigures)) inMemoryStore.questionFigures = [];
  return inMemoryStore.questionFigures;
}

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function dir() {
  return path.join(dataPaths.ensureDataDir(), 'question_figures');
}

function save({ dataUrl, teacherSubjectKey, description }) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) throw fail(400, 'The figure must be a JPG, PNG or WEBP image.');
  const bytes = Buffer.from(m[2], 'base64');
  if (!bytes.length) throw fail(400, 'The figure image is empty.');
  if (bytes.length > MAX_BYTES) throw fail(413, 'The figure image is too large (limit 1.5 MB).');
  const id = 'fig_' + crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 20);
  const list = store();
  if (!list.some(f => f.id === id)) {
    list.push({
      id,
      mime: m[1],
      data: m[2],
      description: String(description || '').slice(0, 300),
      subjectKey: String(teacherSubjectKey || '').toUpperCase(),
      createdAt: new Date().toISOString()
    });
    try {
      if (!fs.existsSync(dir())) fs.mkdirSync(dir(), { recursive: true });
      fs.writeFileSync(path.join(dir(), `${id}.${EXT[m[1]]}`), bytes);
    } catch (err) {
      console.warn('[FIGURES] Could not write figure file:', err.message);
    }
  }
  return { id, token: `[[figure:${id}]]` };
}

function get(id) {
  if (!ID_RE.test(String(id || ''))) return null;
  const hit = store().find(f => f.id === id);
  if (hit) return { mime: hit.mime, bytes: Buffer.from(hit.data, 'base64') };
  for (const [mime, ext] of Object.entries(EXT)) {
    const file = path.join(dataPaths.DATA_DIR, 'question_figures', `${id}.${ext}`);
    if (fs.existsSync(file)) return { mime, bytes: fs.readFileSync(file) };
  }
  return null;
}

module.exports = { save, get, ID_RE };
