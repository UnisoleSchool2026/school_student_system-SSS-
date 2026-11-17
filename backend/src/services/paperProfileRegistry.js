// ============================================================================
// PAPER PROFILE REGISTRY & MANIFEST EXTRACTION ENGINE
// Authoritative definitions of official exam papers (CBSE, HPBOSE, ICSE, JEE, NEET)
// Self-declared instruction manifest parser to eliminate position-based guessing
// ============================================================================

const PAPER_PROFILES = {
  CBSE_CLASS_12_PHYSICS: {
    paperName: 'CBSE Class 12 Physics',
    totalQuestions: 33,
    totalMarks: 70,
    sections: [
      { label: 'A', name: 'Section A', startQ: 1, endQ: 16, count: 16, marksPerQ: 1, totalMarks: 16, type: 'MCQ_AND_AR' },
      { label: 'B', name: 'Section B', startQ: 17, endQ: 21, count: 5, marksPerQ: 2, totalMarks: 10, type: 'VSA' },
      { label: 'C', name: 'Section C', startQ: 22, endQ: 28, count: 7, marksPerQ: 3, totalMarks: 21, type: 'SA' },
      { label: 'D', name: 'Section D', startQ: 29, endQ: 30, count: 2, marksPerQ: 4, totalMarks: 8, type: 'CASE_STUDY' },
      { label: 'E', name: 'Section E', startQ: 31, endQ: 33, count: 3, marksPerQ: 5, totalMarks: 15, type: 'LA' }
    ]
  },
  CBSE_CLASS_12_CHEMISTRY: {
    paperName: 'CBSE Class 12 Chemistry',
    totalQuestions: 33,
    totalMarks: 70,
    sections: [
      { label: 'A', name: 'Section A', startQ: 1, endQ: 16, count: 16, marksPerQ: 1, totalMarks: 16, type: 'MCQ_AND_AR' },
      { label: 'B', name: 'Section B', startQ: 17, endQ: 21, count: 5, marksPerQ: 2, totalMarks: 10, type: 'VSA' },
      { label: 'C', name: 'Section C', startQ: 22, endQ: 28, count: 7, marksPerQ: 3, totalMarks: 21, type: 'SA' },
      { label: 'D', name: 'Section D', startQ: 29, endQ: 30, count: 2, marksPerQ: 4, totalMarks: 8, type: 'CASE_STUDY' },
      { label: 'E', name: 'Section E', startQ: 31, endQ: 33, count: 3, marksPerQ: 5, totalMarks: 15, type: 'LA' }
    ]
  },
  CBSE_CLASS_12_MATHEMATICS: {
    paperName: 'CBSE Class 12 Mathematics',
    totalQuestions: 38,
    totalMarks: 80,
    sections: [
      { label: 'A', name: 'Section A', startQ: 1, endQ: 20, count: 20, marksPerQ: 1, totalMarks: 20, type: 'MCQ_AND_AR' },
      { label: 'B', name: 'Section B', startQ: 21, endQ: 25, count: 5, marksPerQ: 2, totalMarks: 10, type: 'VSA' },
      { label: 'C', name: 'Section C', startQ: 26, endQ: 31, count: 6, marksPerQ: 3, totalMarks: 18, type: 'SA' },
      { label: 'D', name: 'Section D', startQ: 32, endQ: 35, count: 4, marksPerQ: 5, totalMarks: 20, type: 'LA' },
      { label: 'E', name: 'Section E', startQ: 36, endQ: 38, count: 3, marksPerQ: 4, totalMarks: 12, type: 'CASE_STUDY' }
    ]
  },
  CBSE_CLASS_12_BIOLOGY: {
    paperName: 'CBSE Class 12 Biology',
    totalQuestions: 33,
    totalMarks: 70,
    sections: [
      { label: 'A', name: 'Section A', startQ: 1, endQ: 16, count: 16, marksPerQ: 1, totalMarks: 16, type: 'MCQ_AND_AR' },
      { label: 'B', name: 'Section B', startQ: 17, endQ: 21, count: 5, marksPerQ: 2, totalMarks: 10, type: 'VSA' },
      { label: 'C', name: 'Section C', startQ: 22, endQ: 28, count: 7, marksPerQ: 3, totalMarks: 21, type: 'SA' },
      { label: 'D', name: 'Section D', startQ: 29, endQ: 30, count: 2, marksPerQ: 4, totalMarks: 8, type: 'CASE_STUDY' },
      { label: 'E', name: 'Section E', startQ: 31, endQ: 33, count: 3, marksPerQ: 5, totalMarks: 15, type: 'LA' }
    ]
  },
  CBSE_CLASS_10_SCIENCE: {
    paperName: 'CBSE Class 10 Science',
    totalQuestions: 39,
    totalMarks: 80,
    sections: [
      { label: 'A', name: 'Section A', startQ: 1, endQ: 20, count: 20, marksPerQ: 1, totalMarks: 20, type: 'MCQ_AND_AR' },
      { label: 'B', name: 'Section B', startQ: 21, endQ: 26, count: 6, marksPerQ: 2, totalMarks: 12, type: 'VSA' },
      { label: 'C', name: 'Section C', startQ: 27, endQ: 33, count: 7, marksPerQ: 3, totalMarks: 21, type: 'SA' },
      { label: 'D', name: 'Section D', startQ: 34, endQ: 36, count: 3, marksPerQ: 5, totalMarks: 15, type: 'LA' },
      { label: 'E', name: 'Section E', startQ: 37, endQ: 39, count: 3, marksPerQ: 4, totalMarks: 12, type: 'CASE_STUDY' }
    ]
  },
  CBSE_CLASS_10_MATHEMATICS: {
    paperName: 'CBSE Class 10 Mathematics',
    totalQuestions: 38,
    totalMarks: 80,
    sections: [
      { label: 'A', name: 'Section A', startQ: 1, endQ: 20, count: 20, marksPerQ: 1, totalMarks: 20, type: 'MCQ_AND_AR' },
      { label: 'B', name: 'Section B', startQ: 21, endQ: 25, count: 5, marksPerQ: 2, totalMarks: 10, type: 'VSA' },
      { label: 'C', name: 'Section C', startQ: 26, endQ: 31, count: 6, marksPerQ: 3, totalMarks: 18, type: 'SA' },
      { label: 'D', name: 'Section D', startQ: 32, endQ: 35, count: 4, marksPerQ: 5, totalMarks: 20, type: 'LA' },
      { label: 'E', name: 'Section E', startQ: 36, endQ: 38, count: 3, marksPerQ: 4, totalMarks: 12, type: 'CASE_STUDY' }
    ]
  },
  JEE_MAIN_PAPER: {
    paperName: 'JEE Main Subject Paper',
    totalQuestions: 30,
    totalMarks: 100,
    sections: [
      { label: 'A', name: 'Section A (MCQ)', startQ: 1, endQ: 20, count: 20, marksPerQ: 4, totalMarks: 80, type: 'MCQ' },
      { label: 'B', name: 'Section B (Numerical)', startQ: 21, endQ: 30, count: 10, marksPerQ: 4, totalMarks: 20, type: 'NUMERICAL_INTEGER', attemptLimit: 5 }
    ]
  },
  NEET_SUBJECT_PAPER: {
    paperName: 'NEET Subject Paper',
    totalQuestions: 50,
    totalMarks: 180,
    sections: [
      { label: 'A', name: 'Section A', startQ: 1, endQ: 35, count: 35, marksPerQ: 4, totalMarks: 140, type: 'MCQ' },
      { label: 'B', name: 'Section B', startQ: 36, endQ: 50, count: 15, marksPerQ: 4, totalMarks: 40, type: 'MCQ', attemptLimit: 10 }
    ]
  }
};

/**
 * Resolves default paper profile for a given mode, track, subject, and grade
 */
function resolvePaperProfile({ mode = 'BOARD', track = 'CBSE', subject = 'Physics', grade = '12' }) {
  const normMode = String(mode).toUpperCase();
  const normTrack = String(track).toUpperCase();
  const sUpper = String(subject).toUpperCase();
  const gStr = String(grade);

  if (normMode === 'COMPETITIVE') {
    if (normTrack.startsWith('JEE')) return PAPER_PROFILES.JEE_MAIN_PAPER;
    if (normTrack === 'NEET') return PAPER_PROFILES.NEET_SUBJECT_PAPER;
  }

  // Board Mode
  if (gStr === '10') {
    if (sUpper.includes('MATH')) return PAPER_PROFILES.CBSE_CLASS_10_MATHEMATICS;
    return PAPER_PROFILES.CBSE_CLASS_10_SCIENCE;
  }

  if (sUpper.includes('PHYS')) return PAPER_PROFILES.CBSE_CLASS_12_PHYSICS;
  if (sUpper.includes('CHEM')) return PAPER_PROFILES.CBSE_CLASS_12_CHEMISTRY;
  if (sUpper.includes('MATH')) return PAPER_PROFILES.CBSE_CLASS_12_MATHEMATICS;
  if (sUpper.includes('BIO')) return PAPER_PROFILES.CBSE_CLASS_12_BIOLOGY;

  return PAPER_PROFILES.CBSE_CLASS_12_PHYSICS;
}

const WORDS_TO_NUM = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twelve: 12, sixteen: 16, eighteen: 18, twenty: 20
};

function parseNumberToken(token) {
  if (!token) return null;
  const num = parseInt(token, 10);
  if (!isNaN(num)) return num;
  return WORDS_TO_NUM[String(token).toLowerCase()] || null;
}

/**
 * Extracts declared manifest from paper instructions header
 * E.g. "This question paper contains 33 questions... Section A contains 16 questions of 1 mark each"
 */
function extractDeclaredManifest(rawText = '', context = {}) {
  const defaultProfile = resolvePaperProfile(context);
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      declaredTotalQuestions: null,
      declaredTotalMarks: null,
      sections: [],
      source: 'EMPTY_INPUT',
      isAdHocWorksheet: true,
      profileKey: `${context.track || 'BOARD'}_AD_HOC`
    };
  }

  // Match Maximum Marks
  let declaredMarks = null;
  const marksMatch = rawText.match(/(?:Maximum\s*Marks|Max\.?\s*Marks|MM|Total\s*Marks)\s*[:=\-–]?\s*(\d{2,3})/i);
  if (marksMatch) {
    declaredMarks = parseInt(marksMatch[1], 10);
  }

  // Match Total Questions
  let declaredQuestions = null;
  const qCountMatch = rawText.match(/(?:This\s+question\s+paper\s+contains|There\s+are|Total\s+questions?\s*[:=\-–]?)\s*(\d{1,3})\s*questions?/i);
  if (qCountMatch) {
    declaredQuestions = parseInt(qCountMatch[1], 10);
  }

  const declaredSectionsMap = new Map();

  // Pattern 1: Section with explicit ranges (e.g. "Section A comprises questions 1 to 16 of 1 mark each")
  const rangeRegex = /Section\s*([A-E])\s*(?:comprises|has|contains|consists of)?\s*(?:questions?|Q\.?)?\s*(\d{1,3})\s*(?:to|–|-)\s*(\d{1,3})[^\.\n]*?(\d{1,2})\s*marks?\s*each/gi;
  let secMatch;

  while ((secMatch = rangeRegex.exec(rawText)) !== null) {
    const label = secMatch[1].toUpperCase();
    const startQ = parseInt(secMatch[2], 10);
    const endQ = parseInt(secMatch[3], 10);
    const marksPerQ = parseInt(secMatch[4], 10);
    const count = (endQ - startQ) + 1;

    declaredSectionsMap.set(label, {
      label,
      name: `Section ${label}`,
      startQ,
      endQ,
      count,
      marksPerQ,
      totalMarks: count * marksPerQ
    });
  }

  // Pattern 2: Section with count and marks (e.g. "Section D contains two case study based questions of 4 marks each")
  const countRegex = /Section\s*([A-E])\s*(?:comprises|has|contains|consists of)?\s*([a-zA-Z]+|\d{1,2})\s*(?:[a-zA-Z\s-]+)?questions?\s*(?:of)?\s*(\d{1,2})\s*marks?\s*each/gi;
  let countMatch;

  while ((countMatch = countRegex.exec(rawText)) !== null) {
    const label = countMatch[1].toUpperCase();
    if (!declaredSectionsMap.has(label)) {
      const count = parseNumberToken(countMatch[2]);
      const marksPerQ = parseInt(countMatch[3], 10);

      // Check default profile for startQ/endQ hints
      const profSec = (defaultProfile.sections || []).find(s => s.label === label);
      if (count && marksPerQ) {
        declaredSectionsMap.set(label, {
          label,
          name: `Section ${label}`,
          startQ: profSec ? profSec.startQ : 1,
          endQ: profSec ? profSec.endQ : count,
          count: count,
          marksPerQ: marksPerQ,
          totalMarks: count * marksPerQ
        });
      }
    }
  }

  const hasExplicitInstructions = Boolean(
    qCountMatch ||
    /general\s+instructions?/i.test(rawText) ||
    declaredSectionsMap.size >= 2
  );

  // If there are no declared exam paper instructions and this is not flagged as a full paper,
  // treat this as an ad-hoc single/multi-question paste or worksheet snippet.
  if (!hasExplicitInstructions && !context.isFullPaper) {
    return {
      declaredTotalQuestions: null,
      declaredTotalMarks: declaredMarks || null,
      sections: Array.from(declaredSectionsMap.values()),
      source: 'AD_HOC_INPUT',
      isAdHocWorksheet: true,
      profileKey: `${context.track || 'BOARD'}_AD_HOC`
    };
  }

  // Reconcile missing sections against default profile for declared papers
  (defaultProfile.sections || []).forEach(pSec => {
    if (!declaredSectionsMap.has(pSec.label)) {
      declaredSectionsMap.set(pSec.label, pSec);
    }
  });

  const mergedSections = Array.from(declaredSectionsMap.values()).sort((a, b) => a.startQ - b.startQ);

  if (mergedSections.length >= 2) {
    const calculatedTotalQ = mergedSections.reduce((sum, s) => sum + s.count, 0);
    const calculatedTotalMarks = mergedSections.reduce((sum, s) => sum + s.totalMarks, 0);

    return {
      declaredTotalQuestions: declaredQuestions || calculatedTotalQ,
      declaredTotalMarks: declaredMarks || calculatedTotalMarks,
      sections: mergedSections,
      source: declaredSectionsMap.size === defaultProfile.sections?.length ? 'DECLARED_INSTRUCTIONS' : 'PROFILE_MERGED',
      profileKey: `${context.track || 'BOARD'}_DECLARED`
    };
  }

  return {
    declaredTotalQuestions: declaredQuestions || defaultProfile.totalQuestions,
    declaredTotalMarks: declaredMarks || defaultProfile.totalMarks,
    sections: defaultProfile.sections,
    source: declaredQuestions || declaredMarks ? 'PARTIALLY_DECLARED' : 'INFERRED_PROFILE',
    profileKey: defaultProfile.paperName
  };
}

module.exports = {
  PAPER_PROFILES,
  resolvePaperProfile,
  extractDeclaredManifest
};
