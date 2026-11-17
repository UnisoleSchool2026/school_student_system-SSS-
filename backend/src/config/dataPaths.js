// ============================================================================
// Runtime data files
// ----------------------------------------------------------------------------
// Files the server changes while it runs (uploaded NCERT books, AI study-aid
// cache, teacher DPPs, teacher-added questions) are written to DATA_DIR
// (default: backend/data, ignored by git). The JSON files committed under
// src/database are only the starting data and are never written at runtime,
// so running the app or the tests does not change tracked files (and does not
// cause merge conflicts between teammates).
// With DATABASE_URL set, the same school data is also saved to PostgreSQL.
// ============================================================================
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  return DATA_DIR;
}

// Where the server writes a runtime file.
function runtimePath(fileName) {
  return path.join(DATA_DIR, fileName);
}

// Where to read a file from: the runtime copy when it exists, otherwise the committed starting data.
function readPath(fileName, seedPath) {
  const rt = runtimePath(fileName);
  if (fs.existsSync(rt)) return rt;
  return seedPath && fs.existsSync(seedPath) ? seedPath : null;
}

// Writes JSON to the runtime copy (temp file + rename, so a crash never leaves half a file).
function writeJson(fileName, data, pretty) {
  ensureDataDir();
  const target = runtimePath(fileName);
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data), 'utf8');
  fs.renameSync(tmp, target);
  return target;
}

module.exports = { DATA_DIR, ensureDataDir, runtimePath, readPath, writeJson };
