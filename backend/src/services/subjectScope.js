// ============================================================================
// UNISOLE AI SCHOOL: TEACHER SUBJECT SCOPE (content isolation)
// Single source of truth for "what can a teacher of subject X see or change".
// A teacher's scope = the classes whose `subjects` list contains their subject
// key (inMemoryStore.classes, the same data GET /api/curriculum/classes uses).
//   PHYSICS / CHEMISTRY  -> 11/12 Medical + Non-Medical
//   MATHEMATICS          -> 11/12 Non-Medical
//   BIOLOGY              -> 11/12 Medical
//   CLASS10_MATHEMATICS  -> Class 10 sections teaching Maths
//   CLASS10_SCIENCE      -> Class 10 sections teaching Science
// ============================================================================

const { inMemoryStore } = require('../config/database');

const SUBJECT_NAMES = {
  PHYSICS: ['PHYSICS'],
  CHEMISTRY: ['CHEMISTRY'],
  BIOLOGY: ['BIOLOGY'],
  MATHEMATICS: ['MATHEMATICS', 'MATHS'],
  CLASS10_MATHEMATICS: ['CLASS10_MATHEMATICS', 'MATHEMATICS', 'MATHS'],
  CLASS10_SCIENCE: ['CLASS10_SCIENCE', 'SCIENCE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']
};

// Used only if the class list has not been loaded yet.
const FALLBACK_GRADES = {
  PHYSICS: ['11', '12'],
  CHEMISTRY: ['11', '12'],
  BIOLOGY: ['11', '12'],
  MATHEMATICS: ['11', '12'],
  CLASS10_MATHEMATICS: ['10'],
  CLASS10_SCIENCE: ['10']
};

function normKey(value) {
  return String(value || '').toUpperCase().trim();
}

function classSubjectKeys(cls) {
  return (cls.subjects || []).map(s => normKey(typeof s === 'string' ? s : (s.key || s.name)));
}

function isKnownSubject(subjectKey) {
  return Object.prototype.hasOwnProperty.call(SUBJECT_NAMES, normKey(subjectKey));
}

function allowedClasses(subjectKey) {
  const key = normKey(subjectKey);
  return (inMemoryStore.classes || []).filter(c => classSubjectKeys(c).includes(key));
}

function allowedSections(subjectKey) {
  const set = new Set();
  allowedClasses(subjectKey).forEach(c => {
    [c.id, c.key, c.section].filter(Boolean).forEach(v => set.add(String(v).toLowerCase()));
  });
  return set;
}

function allowedGrades(subjectKey) {
  const classes = allowedClasses(subjectKey);
  if (classes.length) return new Set(classes.map(c => String(c.grade)));
  return new Set(FALLBACK_GRADES[normKey(subjectKey)] || []);
}

function sectionAllowed(subjectKey, section) {
  if (!section) return false;
  const sections = allowedSections(subjectKey);
  if (sections.size === 0) return true; // classes not loaded: do not block
  return sections.has(String(section).toLowerCase());
}

function subjectMatches(subjectKey, record) {
  const key = normKey(subjectKey);
  const names = SUBJECT_NAMES[key] || [key];
  const aKey = normKey(record.subjectKey);
  const aSub = normKey(record.subject);
  if (aKey && SUBJECT_NAMES[aKey]) {
    // Records with an explicit subject key must match it exactly (CLASS10_* vs senior stay apart),
    // except Class 10 Science, which covers Class 10 Physics/Chemistry/Biology records.
    if (aKey === key) return true;
    if (key === 'CLASS10_SCIENCE' && ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(aKey) && String(record.grade) === '10') return true;
    if (key === 'CLASS10_MATHEMATICS' && aKey === 'MATHEMATICS' && String(record.grade) === '10') return true;
    return false;
  }
  return names.includes(aSub) || names.some(n => aSub.includes(n));
}

// True when a test / paper / submission-bearing record belongs to this teacher's scope.
function assessmentInScope(subjectKey, record) {
  if (!record) return false;
  if (!subjectMatches(subjectKey, record)) return false;
  const section = record.section || record.targetClass || record.classId;
  if (section && allowedSections(subjectKey).size) return sectionAllowed(subjectKey, section);
  return allowedGrades(subjectKey).has(String(record.grade || ''));
}

function studentInScope(subjectKey, student) {
  if (!student) return false;
  if (allowedSections(subjectKey).size === 0) return allowedGrades(subjectKey).has(String(student.grade));
  return sectionAllowed(subjectKey, student.section);
}

// Validates a teacher write request (create test / paper) against their scope.
// Returns null when allowed, otherwise { status, error }.
function checkTeacherWrite(teacherSubjectKey, { subjectKey, section, grade } = {}) {
  const tKey = normKey(teacherSubjectKey);
  if (!tKey) return null;
  if (!isKnownSubject(tKey)) return { status: 403, error: `Unknown teacher subject "${teacherSubjectKey}".` };
  if (subjectKey && !subjectMatches(tKey, { subjectKey: normKey(subjectKey), subject: subjectKey, grade })) {
    return { status: 403, error: `Subject isolation: ${tKey} faculty cannot create ${subjectKey} content.` };
  }
  if (section && !sectionAllowed(tKey, section)) {
    return { status: 403, error: `Subject isolation: ${tKey} faculty does not teach class ${section}.` };
  }
  return null;
}

// True when the class (section) actually teaches this subject.
function classTeachesSubject(section, subjectKey) {
  const cls = (inMemoryStore.classes || []).find(c => [c.id, c.key, c.section].some(v => String(v || '').toLowerCase() === String(section || '').toLowerCase()));
  if (!cls) return true; // unknown / ad-hoc class: do not block
  return classSubjectKeys(cls).includes(normKey(subjectKey));
}

module.exports = {
  normKey,
  isKnownSubject,
  allowedClasses,
  allowedSections,
  allowedGrades,
  sectionAllowed,
  subjectMatches,
  assessmentInScope,
  studentInScope,
  checkTeacherWrite,
  classTeachesSubject
};
