// ============================================================================
// MODULE: NCERT Core & Reading Engine
// Reference: https://github.com/moktagithub005/Ncert_reading_engine
// Powers the NCERT menu with the authentic NCERT Reading Engine:
// - Book ingestion & processing status
// - Active book chapter & topic hierarchy tree
// - Full text viewer & extraction details
// ============================================================================

const content = require('../services/canonicalContentService');
const ncertEngine = require('../services/ncertReadingEngineService');
const { resolveSubject, getTaxonomyChapters, chapterKey, recordsForChapter, emptyPayload } = require('./shared');

const MODULE = {
  id: 'ncert_core',
  title: 'NCERT Core & Reading Engine',
  description: 'NCERT section-wise concepts and Reading Engine digitization.',
  featureFlag: 'ncertExemplar',
  modes: ['BOARD', 'COMPETITIVE'],
  roles: ['teacher', 'student']
};

function collectTraps(ch, records) {
  const traps = [];
  if (ch.boardExamFocus && ch.boardExamFocus.standardTrap) traps.push(ch.boardExamFocus.standardTrap);
  records.forEach(r => (r.mcq_options || []).forEach(o => { if (o.trap) traps.push(o.trap); }));
  return Array.from(new Set(traps.map(t => String(t).trim()).filter(Boolean))).slice(0, 8);
}

function build(ctx) {
  const { subjects, subjectKey } = resolveSubject(ctx);
  if (!subjectKey) return emptyPayload(MODULE, ctx, 'No subject is available for this class and mode.', { availableSubjects: subjects });
  const grade = ctx.mode === 'BOARD' ? ctx.grade : null;
  const { taxonomy, chapters } = getTaxonomyChapters(subjectKey, grade);
  if (!chapters.length) {
    return emptyPayload(MODULE, ctx, 'No syllabus chapters are loaded for this subject yet.', { availableSubjects: subjects, subjectKey });
  }
  const records = content.query({ mode: ctx.mode, board: ctx.board, stream: ctx.stream, subjectKey }).items;
  const isComp = ctx.mode === 'COMPETITIVE';

  const chapterList = chapters.map(ch => {
    const chRecords = recordsForChapter(records, ch);
    return {
      key: chapterKey(ch),
      grade: ch.grade || null,
      chapterNumber: ch.chapterNumber,
      chapterName: ch.chapterName,
      topicCount: (ch.topics || []).length,
      ncertQuestionCount: chRecords.filter(r => r.is_ncert || r.content_type === 'NCERT').length,
      exerciseCount: chRecords.filter(r => r.source_raw === 'NCERT_EXERCISE' || r.source_raw === 'NCERT_TEXTBOOK').length,
      exampleCount: chRecords.filter(r => r.source_raw === 'NCERT_EXAMPLE').length,
      exemplarCount: chRecords.filter(r => r.source_raw.includes('EXEMPLAR') || /EXEMPLAR/i.test(r.pyq_appearance || '')).length
    };
  });
  const selectedKey = ctx.chapter && chapterList.some(c => c.key === ctx.chapter) ? ctx.chapter : chapterList[0].key;
  const ch = chapters.find(c => chapterKey(c) === selectedKey);
  const chRecords = recordsForChapter(records, ch);
  const ncertSamples = chRecords
    .filter(r => r.is_ncert || r.content_type === 'NCERT')
    .slice(0, 5)
    .map(r => ({ id: r.id, questionLatex: r.question_latex, source: r.pyq_appearance || r.content_type, difficulty: r.difficulty_level }));

  const asItem = r => ({ id: r.id, questionLatex: r.question_latex, solutionLatex: r.solution_latex, marks: r.marks, difficulty: r.difficulty_level, source: r.pyq_appearance || r.source_raw });
  const ncertSets = {
    exercise: chRecords.filter(r => r.source_raw === 'NCERT_EXERCISE' || r.source_raw === 'NCERT_TEXTBOOK').map(asItem),
    example: chRecords.filter(r => r.source_raw === 'NCERT_EXAMPLE').map(asItem),
    exemplar: chRecords.filter(r => r.source_raw.includes('EXEMPLAR') || /EXEMPLAR/i.test(r.pyq_appearance || '')).map(asItem)
  };

  // Also include authentic Reading Engine state
  const allBooks = ncertEngine.listBooks();
  let matchedBook = null;
  if (grade) {
    matchedBook = allBooks.find(b => String(b.class_no) === String(grade) && (
      (subjectKey && (b.subject.toLowerCase().includes(subjectKey.toLowerCase()) || subjectKey.toLowerCase().includes(b.subject.toLowerCase())))
    ));
    if (!matchedBook) {
      matchedBook = allBooks.find(b => String(b.class_no) === String(grade));
    }
  }
  if (!matchedBook && allBooks.length > 0) matchedBook = allBooks[0];
  const activeBookId = ctx.bookId || (matchedBook ? matchedBook.id : null);
  let activeBookTree = null;
  let firstTopic = null;
  if (activeBookId) {
    try {
      activeBookTree = ncertEngine.getBookTree(activeBookId, true);
      if (activeBookTree && activeBookTree.chapters && activeBookTree.chapters.length > 0) {
        const ch0 = activeBookTree.chapters[0];
        if (ch0 && ch0.topics && ch0.topics.length > 0) {
          firstTopic = ncertEngine.getTopic(ch0.topics[0].id);
        }
      }
    } catch (e) {}
  }

  return {
    moduleId: MODULE.id,
    title: 'NCERT Reading Engine',
    subtitle: 'Textbook Ingestion, Chapter-wise Topics & Extracted Reading Content',
    mode: ctx.mode,
    track: ctx.track,
    empty: false,
    availableSubjects: subjects,
    subjectKey,
    data: {
      subjectName: taxonomy.subjectName || subjectKey,
      chapters: chapterList,
      selectedChapter: {
        key: selectedKey,
        chapterName: ch.chapterName,
        grade: ch.grade || null,
        unit: ch.unit || '',
        boardFocus: ch.boardExamFocus || null,
        topics: (ch.topics || []).map(t => ({
          topicName: t.topicName,
          ncertSection: t.ncertSection || '',
          highYield: Boolean(t.highYield),
          subtopics: t.subtopics || []
        })),
        ncertQuestions: ncertSamples,
        ncertSets: {
          exercise: { count: ncertSets.exercise.length, items: ncertSets.exercise.slice(0, 15) },
          example: { count: ncertSets.example.length, items: ncertSets.example.slice(0, 15) },
          exemplar: { count: ncertSets.exemplar.length, items: ncertSets.exemplar.slice(0, 15) }
        },
        traps: isComp ? collectTraps(ch, chRecords) : []
      },
      readingEngine: {
        isReadingEngine: true,
        books: allBooks,
        activeBookId,
        activeBookTree,
        firstTopic
      }
    }
  };
}

module.exports = Object.assign(MODULE, { build });
