// Shared helpers for workspace modules.

const content = require('../services/canonicalContentService');
const { getSubjectTaxonomy } = require('../services/curriculumTaxonomy');

// Resolves the subject a module should show, honoring teacher subject isolation.
function resolveSubject(ctx) {
  const subjects = content.availableSubjects({
    mode: ctx.mode,
    stream: ctx.stream,
    grade: ctx.grade,
    teacherSubjectKey: ctx.teacherSubjectKey
  });
  const requested = String(ctx.subjectKey || '').toUpperCase();
  const chosen = subjects.find(s => s.key === requested) || subjects[0] || null;
  return { subjects, subjectKey: chosen ? chosen.key : null };
}

function getTaxonomyChapters(subjectKey, grade) {
  const tax = subjectKey ? getSubjectTaxonomy(subjectKey) : null;
  if (!tax || !Array.isArray(tax.chapters)) return { taxonomy: tax, chapters: [] };
  let chapters = tax.chapters.slice();
  if (grade && chapters.some(c => c.grade)) {
    const filtered = chapters.filter(c => String(c.grade) === String(grade));
    if (filtered.length) chapters = filtered;
  }
  return { taxonomy: tax, chapters };
}

function chapterKey(ch) {
  return ch.id || `${ch.grade || ''}_${ch.chapterNumber}`;
}

function normalizeText(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const STOPWORDS = new Set(['and', 'the', 'of', 'in', 'its', 'with', 'from', 'to', 'for', 'law', 'laws', 'theory', 'basic', 'general', 'principles', 'applications', 'concepts']);

function significantWords(s) {
  return normalizeText(s).split(' ').filter(w => w.length > 3 && !STOPWORDS.has(w));
}

// Canonical records whose chapter name overlaps a taxonomy chapter name.
function recordsForChapter(records, ch) {
  const target = normalizeText(ch.chapterName);
  const words = significantWords(ch.chapterName);
  return records.filter(r => {
    if (r.grade && ch.grade && String(r.grade) !== String(ch.grade)) return false;
    const name = normalizeText(r.chapter_name);
    if (!name) return false;
    if (name === target || name.includes(target) || target.includes(name)) return true;
    if (r.chapter_number && ch.chapterNumber && Number(r.chapter_number) === Number(ch.chapterNumber) && words.some(w => name.includes(w))) return true;
    const overlap = words.filter(w => name.includes(w)).length;
    return words.length > 0 && overlap >= Math.min(2, words.length);
  });
}

function emptyPayload(moduleDef, ctx, reason, extra = {}) {
  return Object.assign({
    moduleId: moduleDef.id,
    title: moduleDef.title,
    mode: ctx.mode,
    track: ctx.track,
    empty: true,
    emptyReason: reason,
    data: null
  }, extra);
}

module.exports = {
  resolveSubject,
  getTaxonomyChapters,
  chapterKey,
  normalizeText,
  significantWords,
  recordsForChapter,
  emptyPayload
};
