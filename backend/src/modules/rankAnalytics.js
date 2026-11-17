// ============================================================================
// MODULE: Predictive Rank Analytics (Competitive)
// Reads recorded submissions of JEE/NEET-pattern assessments and maps score
// percentages to an INDICATIVE percentile and rank band using the rank curve
// in exam_patterns.json. It is practice feedback, not an NTA prediction.
// ============================================================================

const { inMemoryStore } = require('../config/database');
const examPatterns = require('../services/examPatternRegistry');
const { emptyPayload } = require('./shared');

const MODULE = {
  id: 'rank_analytics',
  title: 'Predictive Rank Analytics',
  description: 'Indicative percentile and rank bands from recorded JEE/NEET-pattern mocks.',
  featureFlag: 'rankAnalytics',
  modes: ['COMPETITIVE'],
  roles: ['teacher']
};

const BUCKETS = [
  { id: 'P99', label: '99+ percentile', min: 99 },
  { id: 'P95', label: '95 to 99', min: 95 },
  { id: 'P90', label: '90 to 95', min: 90 },
  { id: 'P80', label: '80 to 90', min: 80 },
  { id: 'P50', label: '50 to 80', min: 50 },
  { id: 'P0', label: 'Below 50', min: -Infinity }
];

function subjectMatches(assessment, teacherSubjectKey) {
  if (!teacherSubjectKey) return true;
  const key = String(teacherSubjectKey).toUpperCase();
  const a = String(assessment.subjectKey || assessment.subject || '').toUpperCase();
  return a === key || a.includes(key) || key.includes(a);
}

function build(ctx) {
  const pattern = examPatterns.getPattern(ctx.patternId);
  if (!pattern || !pattern.rankModel) {
    return emptyPayload(MODULE, ctx, 'No rank model is configured for this stream.');
  }
  const assessments = (inMemoryStore.assessments || []).filter(a => {
    const p = examPatterns.resolvePatternForAssessment(a);
    return p && p.patternId === pattern.patternId && subjectMatches(a, ctx.teacherSubjectKey);
  });
  const ids = new Set(assessments.map(a => a.id));
  const submissions = (inMemoryStore.submissions || []).filter(s => ids.has(s.assessmentId));
  if (!submissions.length) {
    return emptyPayload(MODULE, ctx, `No ${pattern.label} mock submissions are recorded yet. Publish an NTA-pattern test to start rank tracking.`, {
      data: { pattern: { patternId: pattern.patternId, label: pattern.label }, assessments: assessments.map(a => ({ id: a.id, title: a.title })) }
    });
  }

  const byStudent = new Map();
  submissions.forEach(s => {
    const total = Number(s.totalMarks) || 0;
    const pct = total > 0 ? Math.max(0, Math.min(100, (Number(s.totalScore) / total) * 100)) : 0;
    const percentile = examPatterns.estimatePercentile(pattern, pct);
    const low = examPatterns.estimatePercentile(pattern, Math.max(0, pct - 5));
    const high = examPatterns.estimatePercentile(pattern, Math.min(100, pct + 5));
    const entry = {
      assessmentId: s.assessmentId,
      assessmentTitle: s.assessmentTitle || '',
      scorePercent: Number(pct.toFixed(1)),
      estimatedPercentile: percentile,
      estimatedRank: examPatterns.estimateRank(pattern, percentile),
      rankRange: [examPatterns.estimateRank(pattern, high), examPatterns.estimateRank(pattern, low)],
      weakTopics: (s.questionBreakdown || []).filter(q => !q.isCorrect).map(q => q.subtopic || q.topic).filter(Boolean)
    };
    if (!byStudent.has(s.studentId)) {
      byStudent.set(s.studentId, { studentId: s.studentId, studentName: s.studentName || s.studentId, rollNumber: s.rollNumber || '', attempts: [] });
    }
    byStudent.get(s.studentId).attempts.push(entry);
  });

  const students = Array.from(byStudent.values()).map(st => {
    const avgPct = st.attempts.reduce((n, a) => n + a.scorePercent, 0) / st.attempts.length;
    const percentile = examPatterns.estimatePercentile(pattern, avgPct);
    const weak = {};
    st.attempts.forEach(a => a.weakTopics.forEach(t => { weak[t] = (weak[t] || 0) + 1; }));
    return {
      studentId: st.studentId,
      studentName: st.studentName,
      rollNumber: st.rollNumber,
      mocksTaken: st.attempts.length,
      averageScorePercent: Number(avgPct.toFixed(1)),
      estimatedPercentile: percentile,
      estimatedRank: examPatterns.estimateRank(pattern, percentile),
      bestScorePercent: Math.max(...st.attempts.map(a => a.scorePercent)),
      focusTopics: Object.entries(weak).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t),
      attempts: st.attempts
    };
  }).sort((a, b) => b.estimatedPercentile - a.estimatedPercentile);

  const distribution = BUCKETS.map(b => ({ id: b.id, label: b.label, count: 0 }));
  students.forEach(s => {
    const idx = BUCKETS.findIndex(b => s.estimatedPercentile >= b.min);
    distribution[idx].count += 1;
  });
  const classAvgPct = students.reduce((n, s) => n + s.averageScorePercent, 0) / students.length;

  return {
    moduleId: MODULE.id,
    title: MODULE.title,
    mode: ctx.mode,
    track: ctx.track,
    empty: false,
    data: {
      pattern: { patternId: pattern.patternId, label: pattern.label, marking: pattern.marking },
      disclaimer: pattern.rankModel.note,
      approxCandidatePool: pattern.rankModel.approxCandidatePool,
      summary: {
        students: students.length,
        mocks: assessments.length,
        submissions: submissions.length,
        classAverageScorePercent: Number(classAvgPct.toFixed(1)),
        classEstimatedPercentile: examPatterns.estimatePercentile(pattern, classAvgPct)
      },
      distribution,
      students
    }
  };
}

module.exports = Object.assign(MODULE, { build });
