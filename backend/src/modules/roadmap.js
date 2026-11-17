// ============================================================================
// MODULE: Roadmap & Milestones
// Board: Term-1 / Term-2 / Pre-Board milestones from the NCERT taxonomy with
//        unit weightage and board high-yield focus.
// Competitive: chapters ranked by weightage signals (exam blueprint high-yield
//        topics, high-yield NCERT topics, PYQ density) and a week-by-week
//        countdown drill plan.
// ============================================================================

const content = require('../services/canonicalContentService');
const { EXAM_BLUEPRINTS } = require('../services/examPatternAnalyzer');
const { resolveSubject, getTaxonomyChapters, chapterKey, significantWords, normalizeText, recordsForChapter, emptyPayload } = require('./shared');

const MODULE = {
  id: 'roadmap',
  title: 'Roadmap & Milestones',
  description: 'Board term milestones or competitive topic-weightage ranking with countdown drills.',
  featureFlag: 'topicRoadmap',
  modes: ['BOARD', 'COMPETITIVE'],
  roles: ['teacher', 'student']
};

const BLUEPRINT_FOR_STREAM = { JEE: 'JEE_MAIN_NON_MED', NEET: 'NEET_UG_MED' };
const BLUEPRINT_SUBJECT_KEYS = {
  PHYSICS: ['Physics'],
  CHEMISTRY: ['Chemistry'],
  MATHEMATICS: ['Mathematics'],
  BIOLOGY: ['Biology_Botany', 'Biology_Zoology']
};

function unitWeightage(taxonomy, ch) {
  const units = (taxonomy && taxonomy.units) || [];
  const unit = units.find(u => Array.isArray(u.chapters) && u.chapters.includes(ch.chapterNumber) && (!u.grade || String(u.grade) === String(ch.grade)));
  if (!unit) return { unitName: ch.unit || '', weightageMarks: null };
  return { unitName: unit.unitName, weightageMarks: Number(unit.weightageMarks) || null };
}

function chapterSummary(taxonomy, ch, records) {
  const topics = Array.isArray(ch.topics) ? ch.topics : [];
  const w = unitWeightage(taxonomy, ch);
  const chapterRecords = recordsForChapter(records, ch);
  return {
    key: chapterKey(ch),
    grade: ch.grade || null,
    chapterNumber: ch.chapterNumber,
    chapterName: ch.chapterName,
    unitName: w.unitName,
    unitWeightageMarks: w.weightageMarks,
    topicCount: topics.length,
    highYieldTopicCount: topics.filter(t => t.highYield).length,
    highYieldTopics: topics.filter(t => t.highYield).map(t => t.topicName).slice(0, 4),
    boardFocus: ch.boardExamFocus ? ch.boardExamFocus.highYield || '' : '',
    questionTypes: ch.boardExamFocus ? ch.boardExamFocus.questionType || '' : '',
    pyqCount: chapterRecords.filter(r => r.content_type === 'PYQ').length,
    questionCount: chapterRecords.length
  };
}

function buildBoard(ctx, subjectKey, taxonomy, chapters, records) {
  const summaries = chapters.map(ch => chapterSummary(taxonomy, ch, records));
  const half = Math.ceil(summaries.length / 2);
  const preBoardFocus = [];
  const hy = taxonomy && taxonomy.boardHighYieldSummary;
  if (hy) {
    ['fiveMarkGuarantees', 'caseStudyFourMark', 'threeMarkHeavyweights'].forEach(group => {
      (hy[group] || []).forEach(item => preBoardFocus.push({ group, topic: item.topic, detail: item.detail || '', chapter: item.chapter || '' }));
    });
  }
  const preBoardChapters = summaries.slice().sort((a, b) => (b.highYieldTopicCount + b.pyqCount / 10) - (a.highYieldTopicCount + a.pyqCount / 10)).slice(0, 6);
  return {
    kind: 'BOARD_MILESTONES',
    milestones: [
      { id: 'TERM_1', title: 'Term-1', goal: 'Finish NCERT reading, solved examples and chapter PYQs', chapters: summaries.slice(0, half) },
      { id: 'TERM_2', title: 'Term-2', goal: 'Finish remaining chapters with step-rubric answer writing', chapters: summaries.slice(half) },
      {
        id: 'PRE_BOARD',
        title: 'Pre-Board',
        goal: 'Full-length papers, 5-mark derivations and case studies under time',
        chapters: preBoardChapters,
        focus: preBoardFocus.slice(0, 10)
      }
    ],
    totals: {
      chapters: summaries.length,
      pyqs: summaries.reduce((s, c) => s + c.pyqCount, 0)
    }
  };
}

function blueprintTopics(stream, subjectKey) {
  const bp = EXAM_BLUEPRINTS[BLUEPRINT_FOR_STREAM[stream]];
  if (!bp || !bp.highYieldTopics) return [];
  return (BLUEPRINT_SUBJECT_KEYS[subjectKey] || []).flatMap(k => bp.highYieldTopics[k] || []);
}

// Matches an exam-blueprint topic (e.g. "Current & Magnetism") to a syllabus chapter.
// Deliberately strict so one shared generic word ("current", "power") does not count:
//   A. at least half the topic's words are in the chapter name and all are in name + topic names
//   B. a multi-word topic whose words all appear in the chapter's NCERT topic names
//   C. a distinctive word (9+ letters, e.g. "semiconductor", "thermodynamic") is in the chapter name
function stem(w) {
  return w.length > 4 ? w.replace(/(ies|es|s)$/, m => (m === 'ies' ? 'y' : '')) : w;
}

function blueprintTopicMatches(topic, ch) {
  const words = significantWords(topic).map(stem);
  if (!words.length) return false;
  const name = normalizeText(ch.chapterName);
  const topicsText = normalizeText((ch.topics || []).map(t => t.topicName).join(' '));
  const inName = words.filter(w => name.includes(w)).length;
  const inTopics = words.filter(w => topicsText.includes(w)).length;
  const inAll = words.filter(w => name.includes(w) || topicsText.includes(w)).length;
  const ruleA = inName / words.length >= 0.5 && inAll === words.length;
  const ruleB = words.length >= 2 && inTopics === words.length;
  const ruleC = words.some(w => w.length >= 9 && name.includes(w));
  return ruleA || ruleB || ruleC;
}

function buildCompetitive(ctx, subjectKey, taxonomy, chapters, records, weeks) {
  const hyTopics = blueprintTopics(ctx.stream, subjectKey);
  const ranked = chapters.map(ch => {
    const s = chapterSummary(taxonomy, ch, records);
    const matchedBlueprintTopics = hyTopics.filter(topic => blueprintTopicMatches(topic, ch));
    const score = matchedBlueprintTopics.length * 3
      + s.highYieldTopicCount
      + Math.min(s.pyqCount, 20) / 4
      + (s.unitWeightageMarks || 0) / 10;
    return Object.assign(s, { matchedBlueprintTopics, weightageScore: Number(score.toFixed(2)) });
  }).sort((a, b) => b.weightageScore - a.weightageScore);

  const n = ranked.length;
  ranked.forEach((c, i) => {
    c.rank = i + 1;
    c.tier = i < Math.ceil(n * 0.3) ? 'MUST_DO' : (i < Math.ceil(n * 0.7) ? 'HIGH' : 'STANDARD');
  });

  // Countdown: first ~70% of weeks cover chapters in rank order, the rest are mocks + must-do revision.
  const totalWeeks = Math.max(4, Math.min(52, Number(weeks) || 12));
  const coverageWeeks = Math.max(1, Math.round(totalWeeks * 0.7));
  const perWeek = Math.max(1, Math.ceil(n / coverageWeeks));
  const mustDo = ranked.filter(c => c.tier === 'MUST_DO').map(c => c.chapterName);
  const weekPlan = [];
  for (let w = 1; w <= totalWeeks; w++) {
    if (w <= coverageWeeks) {
      const slice = ranked.slice((w - 1) * perWeek, w * perWeek);
      weekPlan.push({
        week: w,
        phase: 'COVERAGE',
        focusChapters: slice.map(c => c.chapterName),
        drill: slice.length ? 'Daily DPP + one timed chapter PYQ set per chapter' : 'Backlog clearance + mixed DPP'
      });
    } else {
      const k = w - coverageWeeks - 1;
      weekPlan.push({
        week: w,
        phase: 'MOCK_AND_REVISION',
        focusChapters: mustDo.length ? [mustDo[k % mustDo.length]] : [],
        drill: 'Two full-length timed mocks + error-log revision of must-do chapters'
      });
    }
  }
  return {
    kind: 'COMPETITIVE_WEIGHTAGE',
    rankingSignals: ['Exam blueprint high-yield topics (x3)', 'High-yield NCERT topics', 'PYQ density (capped)', 'Board unit weightage'],
    blueprintTopics: hyTopics,
    chapters: ranked,
    countdown: { totalWeeks, coverageWeeks, weekPlan }
  };
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
  const data = ctx.mode === 'COMPETITIVE'
    ? buildCompetitive(ctx, subjectKey, taxonomy, chapters, records, ctx.weeks)
    : buildBoard(ctx, subjectKey, taxonomy, chapters, records);
  return {
    moduleId: MODULE.id,
    title: ctx.mode === 'COMPETITIVE' ? 'Topic Weightage Roadmap' : 'Roadmap & Milestones',
    mode: ctx.mode,
    track: ctx.track,
    empty: false,
    availableSubjects: subjects,
    subjectKey,
    data: Object.assign({ subjectName: taxonomy.subjectName || subjectKey }, data)
  };
}

module.exports = Object.assign(MODULE, { build });
