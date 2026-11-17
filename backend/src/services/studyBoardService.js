// ============================================================================
// STUDY BOARD (the classroom-style whiteboard; separate from the AI Smartboard)
//
//   catalog   - the subjects, chapters and topics a student (their class) or a
//               teacher (their subject) can open, with the student's progress
//   lesson    - a topic taught as board frames: what it is, key ideas and
//               formulas, derivations to know, worked examples, common
//               mistakes, and a short "check yourself"
//   practice  - one question at a time with hints revealed step by step
//   doubt     - a typed or photographed question worked out line by line
//
// Content comes from the school's own syllabus map and question bank, so the
// board works with no AI service at all. When GEMINI_API_KEY is set, a topic
// also gets a plain-language explanation and doubts are worked out directly;
// if that service is slow or fails, the board falls back to the bank content.
// Nothing here changes the existing AI Smartboard.
// ============================================================================

const { inMemoryStore } = require('../config/database');
const content = require('./canonicalContentService');
const subjectScope = require('./subjectScope');
const { getSubjectTaxonomy } = require('./curriculumTaxonomy');
const { recordsForChapter, significantWords, normalizeText } = require('../modules/shared');
const desk = require('./classDeskService');

const diagrams = require('./diagramLibrary');
const gemini = require('./geminiClient');

function fail(status, error) { const e = new Error(error); e.status = status; return e; }
function coll(name) { if (!Array.isArray(inMemoryStore[name])) inMemoryStore[name] = []; return inMemoryStore[name]; }
function clean(text, max) { return String(text || '').replace(/\u0000/g, '').trim().slice(0, max); }

// ------------------------------------------------------------------- who --
// Returns { role, subjects:[{key,name}], grades:Set, student? } for the caller.
function resolveUser({ studentId, teacherSubjectKey } = {}) {
  if (studentId) {
    const student = desk.student(studentId);
    return { role: 'student', student, subjects: desk.classSubjects(student.section), grades: new Set([String(student.grade)]) };
  }
  const key = String(teacherSubjectKey || '').toUpperCase().trim();
  if (!key) throw fail(400, 'studentId or teacherSubjectKey is required.');
  const tax = getSubjectTaxonomy(key);
  if (!tax) throw fail(403, `Unknown teacher subject "${teacherSubjectKey}".`);
  return { role: 'teacher', subjects: [{ key, name: tax.subjectName || key }], grades: subjectScope.allowedGrades(key) };
}

function assertSubject(user, subjectKey) {
  const key = String(subjectKey || '').toUpperCase();
  const s = user.subjects.find(x => x.key === key);
  if (!s) throw fail(403, 'That subject is not part of your class.');
  return s;
}

function chaptersFor(subjectKey, grades) {
  const tax = getSubjectTaxonomy(subjectKey);
  if (!tax || !Array.isArray(tax.chapters)) return [];
  const withGrade = tax.chapters.some(c => c.grade);
  return tax.chapters.filter(c => !withGrade || !grades || grades.size === 0 || grades.has(String(c.grade)));
}

function findTopic(subjectKey, chapterId, topicId) {
  const tax = getSubjectTaxonomy(subjectKey);
  const chapter = tax && (tax.chapters || []).find(c => c.id === chapterId);
  if (!chapter) throw fail(404, 'Chapter not found.');
  const topic = topicId ? (chapter.topics || []).find(t => t.id === topicId) : null;
  if (topicId && !topic) throw fail(404, 'Topic not found.');
  return { tax, chapter, topic };
}

// --------------------------------------------------------------- catalog --
function catalog(params = {}) {
  const user = resolveUser(params);
  const understood = user.student
    ? coll('studyProgress').filter(p => p.studentId === user.student.id && p.understood).map(p => p.topicId)
    : [];
  const subjects = user.subjects.map(s => {
    const chapters = chaptersFor(s.key, user.grades).map(c => ({
      id: c.id,
      grade: c.grade || null,
      chapterNumber: c.chapterNumber,
      chapterName: c.chapterName,
      unit: c.unit || '',
      topics: (c.topics || []).map(t => ({ id: t.id, topicName: t.topicName, ncertSection: t.ncertSection || '', highYield: Boolean(t.highYield) }))
    }));
    return { key: s.key, name: s.name, chapters };
  }).filter(s => s.chapters.length > 0);
  return { role: user.role, subjects, understood };
}

// ------------------------------------------------------- bank helpers --
let idIndex = null;
let idIndexSource = null;
function recordById(id) {
  const idx = content.getIndex();
  if (idIndexSource !== idx.records || !idIndex) {
    idIndex = new Map(idx.records.map(r => [r.id, r]));
    idIndexSource = idx.records;
  }
  return idIndex.get(id) || null;
}

function chapterRecords(subjectKey, chapter) {
  const all = content.query({ subjectKey, grade: chapter.grade || undefined }).items;
  return recordsForChapter(all, chapter);
}

// Records ranked by how well they match a topic (name + subtopic words).
function topicRanked(records, topic) {
  if (!topic) return records.slice();
  const words = Array.from(new Set(significantWords(`${topic.topicName} ${(topic.subtopics || []).join(' ')}`)));
  return records
    .map(r => {
      const hay = normalizeText(`${r.topic} ${r.subtopic} ${r.question_latex}`);
      return { r, score: words.filter(w => hay.includes(w)).length };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => Object.assign(x.r, {}))
    .filter((r, i, arr) => arr.indexOf(r) === i);
}

function isObjective(r) {
  return Boolean(r.is_objective) && Array.isArray(r.mcq_options) && r.mcq_options.length >= 2 && Boolean(r.correct_answer) && r.mcq_options.some(o => o.key === r.correct_answer);
}

function publicQuestion(r) {
  return {
    id: r.id,
    kind: isObjective(r) ? 'MCQ' : 'WRITTEN',
    questionLatex: r.question_latex,
    options: isObjective(r) ? r.mcq_options.map(o => ({ key: o.key, latex: o.latex })) : [],
    chapterName: r.chapter_name,
    topic: r.topic || '',
    difficulty: r.difficulty_level || 'MEDIUM',
    marks: r.marks || null,
    source: sourceLabel(r)
  };
}

function sourceLabel(r) {
  const raw = String(r.source_raw || '');
  if (raw === 'NCERT_EXAMPLE') return 'NCERT solved example';
  if (raw === 'NCERT_EXERCISE' || raw === 'NCERT_TEXTBOOK') return 'NCERT exercise';
  if (raw.includes('EXEMPLAR')) return 'NCERT Exemplar';
  if (raw === 'CBSE_PYQ') return r.pyq_appearance ? String(r.pyq_appearance).split('&')[0].trim() : 'Board previous year question';
  if (raw === 'COMPETITIVE_OTHER') return 'JEE / NEET practice';
  return 'Practice question';
}

// Splits a worked solution into board lines without cutting through $...$ maths.
function splitSolution(solution) {
  const s = String(solution || '').replace(/\r/g, '').trim();
  if (!s) return [];
  let parts = s.split(/\n+|(?=\bStep\s*\d+\s*[:.)-])/i).map(x => x.trim()).filter(Boolean);
  if (parts.length === 1) parts = splitSentences(parts[0]);
  return parts.slice(0, 14);
}
function splitSentences(s) {
  const out = [];
  let cur = '';
  let inMath = false;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '$' && s[i - 1] !== '\\') inMath = !inMath;
    cur += ch;
    const next = s.slice(i + 1, i + 3);
    if (!inMath && (ch === '.' || ch === ';') && /^\s[A-Z$\\(]/.test(next) && cur.trim().length > 24) {
      out.push(cur.trim());
      cur = '';
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// ---------------------------------------------------------------- lesson --
function ideaLines(topic) {
  const ideas = [];
  const derivations = [];
  (topic.subtopics || []).forEach(raw => {
    const text = String(raw).trim();
    if (!text) return;
    if (/^derivation\b/i.test(text)) {
      derivations.push({ t: 'derive', v: text.replace(/^derivation\s*:?\s*/i, '') });
      return;
    }
    const at = text.indexOf(':');
    if (at > 0 && at < 80) ideas.push({ t: 'term', term: text.slice(0, at).trim(), v: text.slice(at + 1).trim() });
    else ideas.push({ t: 'point', v: text });
  });
  return { ideas, derivations };
}

function exampleFrames(records, topic, max) {
  const solved = topicRanked(records.filter(r => String(r.solution_latex || '').trim().length > 15), topic);
  const rank = r => (r.source_raw === 'NCERT_EXAMPLE' ? 0 : (r.source_raw === 'CBSE_PYQ' ? 1 : 2));
  const top = solved.slice(0, 12).sort((a, b) => rank(a) - rank(b)).slice(0, max);
  return top.map((r, i) => {
    const lines = [{ t: 'question', v: r.question_latex }];
    if (isObjective(r)) lines.push({ t: 'options', options: r.mcq_options.map(o => ({ key: o.key, latex: o.latex })) });
    splitSolution(r.solution_latex).forEach((l, n) => lines.push({ t: 'work', n: n + 1, v: l }));
    if (isObjective(r)) lines.push({ t: 'answer', v: `Answer: option ${r.correct_answer}` });
    return { kind: 'example', title: `Worked example ${i + 1}`, tag: sourceLabel(r), lines };
  });
}

function checkQuestions(records, topic, count) {
  const pool = topicRanked(records.filter(isObjective), topic).slice(0, 12);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map(publicQuestion);
}

function baseLesson(subject, chapter, topic) {
  const records = chapterRecords(subject.key, chapter);
  const focus = chapter.boardExamFocus || {};
  const frames = [];
  const intro = [
    { t: 'point', v: `${subject.name} • Chapter ${chapter.chapterNumber}: ${chapter.chapterName}` }
  ];
  if (topic.ncertSection) intro.push({ t: 'point', v: `NCERT section ${topic.ncertSection}` });
  if (chapter.unit) intro.push({ t: 'point', v: `Unit: ${chapter.unit}` });
  if (topic.highYield) intro.push({ t: 'note', v: 'Important topic: questions from here are asked almost every year.' });
  if (focus.questionType) intro.push({ t: 'note', v: `How it is asked: ${focus.questionType}` });
  frames.push({ kind: 'intro', title: topic.topicName, lines: intro });

  const { ideas, derivations } = ideaLines(topic);
  const picture = diagrams.diagramsForTopic({ chapterName: chapter.chapterName, topicName: topic.topicName, subtopics: topic.subtopics })[0] || null;
  if (ideas.length) frames.push({ kind: 'ideas', title: 'Key ideas and formulas', lines: ideas, diagram: picture });
  else if (picture) frames[0].diagram = picture;
  if (derivations.length) frames.push({ kind: 'derivations', title: 'Derivations you must know', lines: derivations });
  exampleFrames(records, topic, 2).forEach(f => frames.push(f));
  const traps = [];
  if (focus.standardTrap) traps.push({ t: 'mistake', v: focus.standardTrap });
  if (focus.highYield) traps.push({ t: 'note', v: `Most asked from this chapter: ${focus.highYield}` });
  if (traps.length) frames.push({ kind: 'mistakes', title: 'Where students lose marks', lines: traps });
  const checks = checkQuestions(records, topic, 3);
  if (checks.length) frames.push({ kind: 'check', title: 'Check yourself', lines: [], questions: checks });
  return {
    topicId: topic.id,
    chapterId: chapter.id,
    subjectKey: subject.key,
    subjectName: subject.name,
    title: topic.topicName,
    chapterName: chapter.chapterName,
    grade: chapter.grade || null,
    frames,
    explained: false
  };
}

// In-depth explanation frames written by the AI for a student who starts from zero
// (only with an AI key; cached per topic). Every diagram is checked before use.
function lineList(list, max, len, t) {
  return (Array.isArray(list) ? list : []).filter(x => typeof x === 'string' && x.trim()).slice(0, max).map(v => ({ t: t || 'point', v: clean(v, len) }));
}
function explanationFrames(note) {
  const frames = [];
  const why = [];
  if (typeof note.hook === 'string' && note.hook.trim()) why.push({ t: 'note', v: clean(note.hook, 400) });
  lineList(note.basics, 5, 300).forEach(l => why.push(Object.assign(l, { v: 'You need: ' + l.v })));
  if (why.length) frames.push({ kind: 'explain', title: 'Why this matters', lines: why });
  const simple = lineList(note.simple, 7, 400);
  if (note.analogy && typeof note.analogy === 'string') simple.push({ t: 'note', v: `Think of it like this: ${clean(note.analogy, 400)}` });
  if (simple.length) frames.push({ kind: 'explain', title: 'In simple words', lines: simple, diagram: diagrams.sanitizeDiagram(note.main_diagram) });
  (Array.isArray(note.points) ? note.points : []).slice(0, 5).forEach(p => {
    const lines = lineList(p && p.lines, 7, 400);
    if (p && typeof p.title === 'string' && lines.length) frames.push({ kind: 'explain', title: clean(p.title, 90), lines, diagram: diagrams.sanitizeDiagram(p.diagram) });
  });
  const w = note.worked;
  if (w && typeof w.question === 'string' && Array.isArray(w.steps) && w.steps.length) {
    const lines = [{ t: 'question', v: clean(w.question, 600) }];
    lineList(w.steps, 8, 400).forEach((l, i) => lines.push({ t: 'work', n: i + 1, v: l.v }));
    if (typeof w.answer === 'string' && w.answer.trim()) lines.push({ t: 'answer', v: clean(w.answer, 200) });
    frames.push({ kind: 'example', title: 'Worked example, explained', tag: 'Every step with its reason', lines, diagram: diagrams.sanitizeDiagram(w.diagram) });
  }
  const remember = lineList(note.misconceptions, 4, 300, 'mistake').concat(lineList(note.remember, 5, 300, 'note'));
  frames.forEach(f => { if (!f.diagram) delete f.diagram; });
  return { frames, remember };
}

const LESSON_SYSTEM = `You are a warm, experienced Indian school teacher writing a lesson on a classroom whiteboard for a student who knows NOTHING about this topic yet.
Teach from zero: start from what the student already sees in daily life, define every new word the first time you use it, never skip a step, and explain WHY, not only WHAT.
Short board lines (one idea per line, under 25 words). Write maths and units in LaTeX between single dollar signs, and after every formula say what each symbol means and its unit.
Stay inside the school syllabus points given. Never mention AI, models or yourself.`;

function lessonPrompt(subject, chapter, topic) {
  return `Class ${chapter.grade || ''} ${subject.name}. Chapter: ${chapter.chapterName}. Topic: ${topic.topicName}.
Syllabus points:
- ${(topic.subtopics || []).join('\n- ')}

${diagrams.DIAGRAM_GUIDE}

Return JSON with exactly these keys:
{"hook": "one or two lines: a real-life question or situation this topic explains",
 "basics": [1 to 3 things the student must already know, each explained in one simple line],
 "simple": [4 to 6 lines that explain the main idea in plain words, building up step by step],
 "analogy": "one everyday comparison from an Indian student's life",
 "main_diagram": a diagram (see DIAGRAMS) that shows the main idea,
 "points": [3 to 5 objects {"title": "short heading", "lines": [3 to 6 board lines that build the idea; formulas with the meaning of every symbol], "diagram": a diagram for this point or null}],
 "worked": {"question": "one typical exam question", "steps": [3 to 6 lines, each with its reason], "answer": "final answer with unit", "diagram": a diagram or null},
 "misconceptions": [2 or 3 lines "Wrong: ... Right: ..."],
 "remember": [2 to 4 one-line exam points]}`;
}

const lessonJobs = new Map(); // topicId -> { promise } while writing, or { failedAt } after a failure
function startLessonJob(subject, chapter, topic) {
  const promise = callAi({ system: LESSON_SYSTEM, user: lessonPrompt(subject, chapter, topic), timeoutMs: 45000 })
    .then(data => {
      if (!(data && Array.isArray(data.simple) && data.simple.length)) throw new Error('The explanation came back empty.');
      const list = coll('lessonNotes');
      const old = list.findIndex(n => n.id === topic.id);
      const note = { id: topic.id, version: 2, subjectKey: subject.key, data, at: new Date().toISOString() };
      if (old === -1) list.push(note); else list[old] = note;
      lessonJobs.delete(topic.id);
    })
    .catch(err => {
      console.warn('[STUDY BOARD] Explanation unavailable, using syllabus and bank content:', err.message);
      lessonJobs.set(topic.id, { failedAt: Date.now() });
    });
  lessonJobs.set(topic.id, { promise });
}

async function lesson(params = {}) {
  const user = resolveUser(params);
  const subject = assertSubject(user, params.subjectKey);
  const { chapter, topic } = findTopic(subject.key, params.chapterId, params.topicId);
  if (!topic) throw fail(400, 'Choose a topic.');
  if (user.grades.size && chapter.grade && !user.grades.has(String(chapter.grade))) throw fail(403, 'That chapter is not part of your class.');
  const out = baseLesson(subject, chapter, topic);

  // The board opens at once with the syllabus lesson; the detailed explanation is written in the
  // background and the board picks it up (aiPending tells the browser to ask again shortly).
  const note = coll('lessonNotes').find(n => n.id === topic.id && n.version === 2);
  if (!note && aiEnabled()) {
    const job = lessonJobs.get(topic.id);
    if (!job || (job.failedAt && Date.now() - job.failedAt > 120000)) startLessonJob(subject, chapter, topic);
    const now = lessonJobs.get(topic.id);
    if (now && !now.failedAt) out.aiPending = true;
  }
  if (note && note.data) {
    const { frames, remember } = explanationFrames(note.data);
    if (frames.length) {
      out.frames.splice(1, 0, ...frames);
      out.explained = true;
    }
    if (remember.length) {
      const m = out.frames.find(f => f.kind === 'mistakes');
      if (m) m.lines.push(...remember); else out.frames.splice(out.frames.length - (out.frames[out.frames.length - 1].kind === 'check' ? 1 : 0), 0, { kind: 'mistakes', title: 'Remember for the exam', lines: remember });
    }
  }
  return out;
}

// -------------------------------------------------------------- practice --
function practiceNext(params = {}) {
  const user = resolveUser(params);
  const subject = assertSubject(user, params.subjectKey);
  const { chapter, topic } = findTopic(subject.key, params.chapterId, params.topicId || null);
  if (user.grades.size && chapter.grade && !user.grades.has(String(chapter.grade))) throw fail(403, 'That chapter is not part of your class.');
  const exclude = new Set(Array.isArray(params.exclude) ? params.exclude.map(String) : String(params.exclude || '').split(',').filter(Boolean));
  const records = chapterRecords(subject.key, chapter).filter(r => String(r.solution_latex || '').trim() || isObjective(r));
  const ranked = topicRanked(records, topic);
  let pool = ranked.filter(r => isObjective(r) && !exclude.has(r.id));
  if (!pool.length) pool = ranked.filter(r => !exclude.has(r.id));
  if (!pool.length) return { question: null, remaining: 0, total: records.length };
  const window = pool.slice(0, Math.min(pool.length, topic ? 8 : pool.length));
  const pick = window[Math.floor(Math.random() * window.length)];
  return { question: publicQuestion(pick), hintCount: hintsFor(pick).length, remaining: pool.length - 1, total: records.length };
}

// Splits "a = b = c" at the top level (not inside braces) of one math segment.
function splitEquals(math) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < math.length; i += 1) {
    const ch = math[i];
    if (ch === '{') depth += 1;
    if (ch === '}') depth = Math.max(0, depth - 1);
    if (ch === '=' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch;
  }
  parts.push(cur.trim());
  return parts.filter(Boolean);
}

// For a one-line solution: the idea in words and the first equation, without the final value.
function openingOf(line) {
  const out = { idea: '', start: '' };
  const at = line.indexOf('$');
  const lead = (at === -1 ? '' : line.slice(0, at)).replace(/[\s:,(-]+$/, '').trim();
  if (lead.length >= 20) out.idea = lead;
  const m = at === -1 ? null : line.slice(at).match(/^\$([^$]+)\$/);
  if (m) {
    const chain = splitEquals(m[1]);
    const first = chain.length >= 3 ? chain[1].split(/\\(?:implies|Rightarrow|therefore|quad|qquad)\b/)[0].trim() : '';
    if (first) out.start = `$${chain[0]} = ${first}$`;
  }
  return out;
}

// Hints go from general to specific and never state the final answer:
// where the question is from -> the idea -> the first steps -> (MCQ) one option crossed out.
function hintsFor(r) {
  const hints = [];
  const where = [r.chapter_name, r.topic].filter(Boolean).join(' • ');
  hints.push(`This is from ${where || 'this chapter'}. Write down what is given and what is asked.`);
  const lines = splitSolution(r.solution_latex);
  if (lines.length > 1) {
    // The last line usually states the final answer; it is shown only with the full solution.
    lines.slice(0, lines.length - 1).forEach(l => hints.push(l));
  } else if (lines.length === 1) {
    const o = openingOf(lines[0]);
    if (o.idea) hints.push(`Idea to use: ${o.idea}.`);
    if (o.start) hints.push(`Start with ${o.start} and put in the given values.`);
  }
  if (isObjective(r)) {
    const wrong = (r.mcq_options || []).filter(o => o.key && o.key !== r.correct_answer);
    if (wrong.length >= 2) hints.push(`Option ${wrong[wrong.length - 1].key} is not the answer. Cross it out and choose from the rest.`);
  }
  return hints;
}

function questionForUser(params) {
  const user = resolveUser(params);
  const r = recordById(String(params.questionId || ''));
  if (!r) throw fail(404, 'Question not found.');
  if (!user.subjects.some(s => s.key === r.subject_key)) throw fail(403, 'That question is not from your subjects.');
  return { user, r };
}

function hint(params = {}) {
  const { r } = questionForUser(params);
  const hints = hintsFor(r);
  const level = Math.max(1, Math.min(hints.length, Number(params.level) || 1));
  return { level, total: hints.length, hints: hints.slice(0, level), last: level >= hints.length };
}

function check(params = {}) {
  const { user, r } = questionForUser(params);
  const reveal = Boolean(params.reveal);
  const answer = String(params.answer || '').toUpperCase().trim();
  const objective = isObjective(r);
  if (!reveal && objective && !answer) throw fail(400, 'Choose an option.');
  const correct = objective && !reveal ? answer === r.correct_answer : null;
  if (user.student && objective && ((correct === false && Number(params.attempt || 1) === 1) || (reveal && !params.answeredCorrectly))) {
    desk.recordPracticeMistake({
      studentId: user.student.id,
      questionId: r.id,
      subject: (user.subjects.find(s => s.key === r.subject_key) || {}).name || '',
      chapterName: r.chapter_name,
      topic: r.topic || '',
      questionLatex: r.question_latex,
      options: r.mcq_options.map(o => ({ key: o.key, latex: o.latex })),
      yourAnswer: answer || null,
      correctAnswer: r.correct_answer,
      solutionLatex: r.solution_latex || ''
    });
  }
  const out = { correct, objective };
  if (correct || reveal || !objective) {
    out.correctAnswer = objective ? r.correct_answer : null;
    out.solutionLines = splitSolution(r.solution_latex);
  }
  return out;
}

// ----------------------------------------------------------------- doubt --
const STOP = new Set('a an the of in on at to for from by with and or is are was were be been it its this that these those as if then than so what which who how why when where find calculate determine show prove give write state explain define value given following will would can could shall should has have had do does did not no into about between each per one two three'.split(' '));
function tokens(text) {
  return Array.from(new Set(normalizeText(String(text).replace(/\$[^$]*\$/g, m => m.replace(/[^A-Za-z ]+/g, ' '))).split(' ').filter(w => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))));
}

function similarSolved(text, subjectKeys) {
  const q = tokens(text);
  if (q.length < 3) return null;
  let best = null;
  content.query({ subjectKeys }).items.forEach(r => {
    if (!String(r.solution_latex || '').trim()) return;
    const hay = new Set(tokens(`${r.question_latex} ${r.topic} ${r.subtopic}`));
    const common = q.filter(w => hay.has(w)).length;
    const score = common / q.length;
    if (common >= 3 && score >= 0.5 && (!best || score > best.score || (score === best.score && r.question_latex.length < best.r.question_latex.length))) best = { r, score, common };
  });
  return best;
}

async function doubt(params = {}) {
  const user = resolveUser(params);
  const text = clean(params.text, 1500);
  const image = params.imageData ? String(params.imageData) : null;
  if (image && (!/^data:image\/(png|jpe?g|webp);base64,/.test(image) || image.length > 2200000)) throw fail(400, 'Attach a PNG or JPG photo under 1.5 MB.');
  if (text.length < 8 && !image) throw fail(400, 'Type your question (or attach a clear photo of it).');
  const subject = params.subjectKey ? assertSubject(user, params.subjectKey) : null;
  const subjectKeys = subject ? [subject.key] : user.subjects.map(s => s.key);
  const base = { asked: text, hadImage: Boolean(image), subjectKey: subject ? subject.key : null, canAskTeacher: user.role === 'student' };
  const lang = LANGUAGES[params.language] ? params.language : 'en';
  const context = clean(params.context, 300); // what the student was learning when they asked

  if (aiEnabled()) {
    try {
      const data = await callAi({
        system: `You are a warm, experienced Indian school teacher solving a student's question on a classroom whiteboard for a student who may know very little about the topic. Work it out line by line, one idea per line, in simple words, and give the reason for every step. Write maths in LaTeX between single dollar signs. ${LANGUAGES[lang].write} Solve only school-syllabus questions (Physics, Chemistry, Mathematics, Biology, Science for classes 10 to 12). Never mention AI, models or yourself.`,
        user: `Class ${Array.from(user.grades).join('/')} ${subject ? subject.name : user.subjects.map(s => s.name).join(', ')}.\n${context ? `The student is learning: ${context}. Use it only to understand the question; answer exactly what the student asked, not the lesson.\n` : ''}Student's question: ${text || '(see the attached photo)'}\n\n${diagrams.DIAGRAM_GUIDE}\n\nReturn JSON with exactly these keys:\n{"readable": true or false (false if the question cannot be read or is not a school-subject question), "reason": "why, if not readable", "question": "the question restated clearly", "steps": [{"title": "short step name", "lines": ["one board line", "..."]}], "answer": "final answer in one line", "concept": "the idea or formula this question tests", "tip": "one line on how to check the answer or avoid the usual mistake", "diagram": a diagram (see DIAGRAMS) that helps, or null}`,
        image,
        timeoutMs: 30000
      });
      if (data && data.readable !== false && Array.isArray(data.steps) && data.steps.some(s => s && Array.isArray(s.lines) && s.lines.length)) {
        return Object.assign(base, {
          mode: 'worked',
          question: clean(data.question, 1500) || text,
          steps: data.steps.filter(s => s && Array.isArray(s.lines)).slice(0, 10).map((s, i) => ({ title: clean(s.title, 90) || `Step ${i + 1}`, lines: s.lines.filter(l => typeof l === 'string' && l.trim()).slice(0, 8).map(l => clean(l, 500)) })).filter(s => s.lines.length),
          answer: clean(data.answer, 500),
          concept: clean(data.concept, 300),
          tip: clean(data.tip, 300),
          diagram: diagrams.sanitizeDiagram(data.diagram) || undefined
        });
      }
      if (data && data.readable === false) {
        return Object.assign(base, { mode: 'unread', message: clean(data.reason, 300) || 'The question could not be read. Type it out, or send it to your teacher.' });
      }
    } catch (err) {
      console.warn('[STUDY BOARD] Doubt solver unavailable, searching solved questions instead:', err.message);
      base.aiError = true;
    }
  }
  if (!text || text.length < 8) {
    return Object.assign(base, { mode: 'unread', message: 'The photo could not be read here. Type the question, or send the photo to your teacher.' });
  }
  const match = similarSolved(text, subjectKeys);
  if (match) {
    const r = match.r;
    return Object.assign(base, {
      mode: 'similar',
      match: {
        questionLatex: r.question_latex,
        options: isObjective(r) ? r.mcq_options.map(o => ({ key: o.key, latex: o.latex })) : [],
        chapterName: r.chapter_name,
        topic: r.topic || '',
        source: sourceLabel(r),
        lines: splitSolution(r.solution_latex),
        answer: isObjective(r) ? `Option ${r.correct_answer}` : '',
        closeness: Math.round(match.score * 100)
      }
    });
  }
  return Object.assign(base, { mode: 'none', message: base.aiError ? 'Your doubt could not be answered right now (the answer service is busy). Please try again in a minute, or send it to your teacher.' : 'No solved question like this was found in the question bank.' });
}

// -------------------------------------------------------------- progress --
function setProgress(params = {}) {
  const user = resolveUser({ studentId: params.studentId });
  const subject = assertSubject(user, params.subjectKey);
  const { topic } = findTopic(subject.key, params.chapterId, params.topicId);
  if (!topic) throw fail(400, 'Choose a topic.');
  const list = coll('studyProgress');
  const id = `${user.student.id}|${topic.id}`;
  let rec = list.find(p => p.id === id);
  if (!rec) { rec = { id, studentId: user.student.id, topicId: topic.id, subjectKey: subject.key, chapterId: params.chapterId }; list.push(rec); }
  rec.understood = params.understood !== false;
  rec.at = new Date().toISOString();
  return { topicId: topic.id, understood: rec.understood };
}

// --------------------------------------------------------- AI service --
function aiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY) && String(process.env.STUDY_BOARD_AI || '').toLowerCase() !== 'false';
}

// Asks Gemini for one JSON object (best available model, see services/geminiClient.js).
async function callAi({ system, user, image, timeoutMs }) {
  const parts = [{ text: `${user}\n\nReturn ONLY one valid JSON object.` }];
  if (image) parts.push(gemini.inlinePart(image));
  const { data } = await gemini.generateJson({ parts, systemInstruction: system, kind: image ? 'vision' : 'text', temperature: 0.35, timeoutMs: timeoutMs || 30000 });
  return data;
}

// Languages the student can choose for the teacher's voice and for doubt answers.
const LANGUAGES = {
  en: { name: 'English', write: 'Write in simple Indian English.', speak: 'Speak simple, friendly Indian English.' },
  hinglish: { name: 'Hinglish', write: 'Write in Hinglish: simple Hindi in Roman letters mixed with the English words used in class (formula names, units, technical terms stay in English).', speak: 'Speak natural Hinglish, the way Indian teachers talk in class: Hindi sentences with English technical words (for example "Dekho, yahan force aur distance ka relation simple hai").' },
  hi: { name: 'Hindi', write: 'Write in simple Hindi in Devanagari script; keep formulas, symbols and units in standard notation.', speak: 'Speak in simple, natural Hindi; say formulas and units the way Hindi-medium teachers do, keeping common English technical words where students use them.' }
};

module.exports = { catalog, lesson, practiceNext, hint, check, doubt, setProgress, splitSolution, aiEnabled, LANGUAGES, resolveUser, assertSubject, findTopic };
