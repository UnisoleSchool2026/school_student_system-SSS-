// ============================================================================
// MODULE: Cheat Sheets & Flashcards
// Board: definition and derivation flashcards built from NCERT taxonomy
//        subtopics ("Derivation: ...", "Term: meaning").
// Competitive: high-speed formula sheet (subtopics that state a relation),
//        curated formula repository entries with sign rules, and chapter traps.
// ============================================================================

const { FORMULA_REPOSITORY } = require('../services/remedialAssignmentService');
const { resolveSubject, getTaxonomyChapters, chapterKey, emptyPayload } = require('./shared');

const MODULE = {
  id: 'cheatsheets',
  title: 'Cheat Sheets & Flashcards',
  description: 'Board definition/derivation flashcards or competitive formula sheets with shortcut tricks.',
  featureFlag: 'cheatSheets',
  modes: ['BOARD', 'COMPETITIVE'],
  roles: ['teacher', 'student']
};

const SUBJECT_REPO_MATCH = {
  PHYSICS: 'physics',
  CHEMISTRY: 'chemistry',
  MATHEMATICS: 'mathematics',
  BIOLOGY: 'biology',
  CLASS10_MATHEMATICS: 'mathematics',
  CLASS10_SCIENCE: 'science'
};

function splitCard(text) {
  const s = String(text || '').trim();
  const idx = s.indexOf(':');
  if (idx > 0 && idx < 90) {
    return { front: s.slice(0, idx).trim(), back: s.slice(idx + 1).trim() };
  }
  return { front: s, back: '' };
}

function isFormulaLine(s) {
  return /[=≈∝]/.test(s) && /[A-Za-zα-ωΑ-Ωθλμπστφω]/.test(s);
}

function boardCards(ch) {
  const cards = [];
  (ch.topics || []).forEach(t => {
    (t.subtopics || []).forEach(raw => {
      const text = String(raw);
      if (/^derivation\b/i.test(text)) {
        const { front, back } = splitCard(text.replace(/^derivation\s*:?\s*/i, ''));
        cards.push({ type: 'DERIVATION', front: `Derive: ${front}`, back: back || 'Write the full step-wise derivation as per NCERT.', topic: t.topicName, ncertSection: t.ncertSection || '' });
      } else if (text.includes(':')) {
        const { front, back } = splitCard(text);
        if (back) cards.push({ type: 'DEFINITION', front, back, topic: t.topicName, ncertSection: t.ncertSection || '' });
      }
    });
  });
  // Taxonomies that list plain subtopic names (e.g. Class 10 Science) get one concept card per topic.
  if (cards.length === 0) {
    (ch.topics || []).forEach(t => {
      if ((t.subtopics || []).length) {
        cards.push({ type: 'CONCEPT', front: t.topicName, back: t.subtopics.join('; '), topic: t.topicName, ncertSection: t.ncertSection || '' });
      }
    });
  }
  return cards;
}

function competitiveCards(ch) {
  const cards = [];
  (ch.topics || []).forEach(t => {
    (t.subtopics || []).forEach(raw => {
      const text = String(raw);
      if (isFormulaLine(text)) {
        const { front, back } = splitCard(text.replace(/^derivation\s*:?\s*/i, ''));
        cards.push({ type: 'FORMULA', front, back: back || front, topic: t.topicName, ncertSection: t.ncertSection || '' });
      }
    });
  });
  if (ch.boardExamFocus && ch.boardExamFocus.standardTrap) {
    cards.push({ type: 'TRAP', front: 'Common trap', back: ch.boardExamFocus.standardTrap, topic: ch.chapterName, ncertSection: '' });
  }
  return cards;
}

function repositoryCards(subjectKey) {
  const match = SUBJECT_REPO_MATCH[subjectKey] || '';
  return Object.entries(FORMULA_REPOSITORY)
    .filter(([, f]) => String(f.subject || '').toLowerCase().includes(match))
    .map(([key, f]) => ({
      type: 'FORMULA_LATEX',
      front: f.name || key,
      latex: f.latex || '',
      back: f.signRules || '',
      topic: key
    }));
}

function build(ctx) {
  const { subjects, subjectKey } = resolveSubject(ctx);
  if (!subjectKey) return emptyPayload(MODULE, ctx, 'No subject is available for this class and mode.', { availableSubjects: subjects });
  const grade = ctx.mode === 'BOARD' ? ctx.grade : null;
  const { taxonomy, chapters } = getTaxonomyChapters(subjectKey, grade);
  if (!chapters.length) {
    return emptyPayload(MODULE, ctx, 'No syllabus chapters are loaded for this subject yet.', { availableSubjects: subjects, subjectKey });
  }
  const isComp = ctx.mode === 'COMPETITIVE';
  const sheets = chapters.map(ch => ({
    key: chapterKey(ch),
    grade: ch.grade || null,
    chapterNumber: ch.chapterNumber,
    chapterName: ch.chapterName,
    cards: isComp ? competitiveCards(ch) : boardCards(ch)
  })).filter(s => s.cards.length > 0);

  const selected = String(ctx.chapter || 'ALL');
  const visible = selected === 'ALL' ? sheets : sheets.filter(s => s.key === selected);
  return {
    moduleId: MODULE.id,
    title: isComp ? 'Formula & Cheat Sheets' : 'Definition & Derivation Cards',
    mode: ctx.mode,
    track: ctx.track,
    empty: sheets.length === 0,
    emptyReason: sheets.length === 0 ? 'No cards could be built for this subject yet.' : '',
    availableSubjects: subjects,
    subjectKey,
    data: {
      subjectName: taxonomy.subjectName || subjectKey,
      cardStyle: isComp ? 'FORMULA_SHEET' : 'FLASHCARD',
      chapters: sheets.map(s => ({ key: s.key, chapterName: s.chapterName, grade: s.grade, cardCount: s.cards.length })),
      selectedChapter: selected,
      sheets: visible,
      quickFormulas: isComp ? repositoryCards(subjectKey) : [],
      totalCards: sheets.reduce((n, s) => n + s.cards.length, 0)
    }
  };
}

module.exports = Object.assign(MODULE, { build });
