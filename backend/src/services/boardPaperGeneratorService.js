// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: BOARD QUESTION PAPER GENERATOR & CUSTOMIZER
// Supports:
//   1. Full-Length CBSE Board Official Examination Pattern (Classes 10 & 12)
//   2. Full-Length HP Board (HPBOSE) Examination Pattern (Classes 10 & 12)
//   3. Interactive Teacher Customization:
//      - Swap / Change any question with matching bank PYQs
//      - Edit question in-place (text, options, marks, solution)
//      - Add teacher's own custom questions to any section
//      - Delete questions & auto-resequence
//      - Dual view: Student Exam Paper vs. Teacher Marking Scheme
// ============================================================================

const { inMemoryStore } = require('../config/database');

// 1. Official Blueprints for CBSE and HP Board
const BOARD_BLUEPRINTS = {
  // --------------------------------------------------------------------------
  // CBSE CLASS 10 SCIENCE (80 Marks, 39 Questions, 3 Hours)
  // --------------------------------------------------------------------------
  'CBSE_CLASS_10_SCIENCE': {
    blueprintId: 'CBSE_CLASS_10_SCIENCE',
    board: 'CBSE',
    grade: '10',
    subject: 'Science',
    title: 'CBSE Class X Science Board Examination',
    totalMarks: 80,
    timeAllowedHours: 3,
    sections: [
      {
        id: 'sec_a',
        name: 'SECTION A: OBJECTIVE TYPE & ASSERTION-REASON',
        description: 'Questions 1 to 20 carry 1 mark each. Q1-Q16 are Multiple Choice; Q17-Q20 are Assertion-Reason.',
        questionCount: 20,
        marksPerQuestion: 1,
        questionType: 'MCQ_SINGLE'
      },
      {
        id: 'sec_b',
        name: 'SECTION B: VERY SHORT ANSWER QUESTIONS',
        description: 'Questions 21 to 26 carry 2 marks each. Answers should be in 30 to 50 words.',
        questionCount: 6,
        marksPerQuestion: 2,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_c',
        name: 'SECTION C: SHORT ANSWER QUESTIONS',
        description: 'Questions 27 to 33 carry 3 marks each. Answers should be in 50 to 80 words.',
        questionCount: 7,
        marksPerQuestion: 3,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_d',
        name: 'SECTION D: LONG ANSWER QUESTIONS (WITH INTERNAL CHOICE)',
        description: 'Questions 34 to 36 carry 5 marks each. Detailed step-by-step scientific derivations and explanations.',
        questionCount: 3,
        marksPerQuestion: 5,
        questionType: 'SUBJECTIVE_LONG',
        hasInternalChoice: true
      },
      {
        id: 'sec_e',
        name: 'SECTION E: CASE-BASED / DATA-INTERPRETATION QUESTIONS',
        description: 'Questions 37 to 39 carry 4 marks each with sub-parts based on real-world experimental scenarios.',
        questionCount: 3,
        marksPerQuestion: 4,
        questionType: 'CASE_BASED'
      }
    ],
    instructions: [
      'The question paper comprises 39 questions in 5 sections: A, B, C, D, and E.',
      'All questions are compulsory. However, an internal choice is provided in some questions.',
      'Section A consists of 20 objective questions (Q1 to Q20) carrying 1 mark each.',
      'Section B consists of 6 Very Short Answer questions (Q21 to Q26) carrying 2 marks each.',
      'Section C consists of 7 Short Answer questions (Q27 to Q33) carrying 3 marks each.',
      'Section D consists of 3 Long Answer questions (Q34 to Q36) carrying 5 marks each.',
      'Section E consists of 3 Case-Based questions (Q37 to Q39) carrying 4 marks each with sub-parts.'
    ]
  },

  // --------------------------------------------------------------------------
  // CBSE CLASS 10 MATHEMATICS STANDARD (80 Marks, 38 Questions, 3 Hours)
  // --------------------------------------------------------------------------
  'CBSE_CLASS_10_MATHS': {
    blueprintId: 'CBSE_CLASS_10_MATHS',
    board: 'CBSE',
    grade: '10',
    subject: 'Mathematics',
    title: 'CBSE Class X Mathematics (Standard) Board Examination',
    totalMarks: 80,
    timeAllowedHours: 3,
    sections: [
      {
        id: 'sec_a',
        name: 'SECTION A: MULTIPLE CHOICE QUESTIONS & ASSERTION-REASON',
        description: 'Questions 1 to 20 carry 1 mark each (Q1–Q18 MCQs, Q19–Q20 Assertion-Reason).',
        questionCount: 20,
        marksPerQuestion: 1,
        questionType: 'MCQ_SINGLE'
      },
      {
        id: 'sec_b',
        name: 'SECTION B: VERY SHORT ANSWER QUESTIONS',
        description: 'Questions 21 to 25 carry 2 marks each.',
        questionCount: 5,
        marksPerQuestion: 2,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_c',
        name: 'SECTION C: SHORT ANSWER QUESTIONS',
        description: 'Questions 26 to 31 carry 3 marks each.',
        questionCount: 6,
        marksPerQuestion: 3,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_d',
        name: 'SECTION D: LONG ANSWER QUESTIONS (WITH INTERNAL CHOICE)',
        description: 'Questions 32 to 35 carry 5 marks each.',
        questionCount: 4,
        marksPerQuestion: 5,
        questionType: 'SUBJECTIVE_LONG',
        hasInternalChoice: true
      },
      {
        id: 'sec_e',
        name: 'SECTION E: CASE STUDY / INTEGRATED QUESTIONS',
        description: 'Questions 36 to 38 carry 4 marks each with sub-questions (1M + 1M + 2M).',
        questionCount: 3,
        marksPerQuestion: 4,
        questionType: 'CASE_BASED'
      }
    ],
    instructions: [
      'This question paper contains 38 questions in 5 sections: A, B, C, D and E.',
      'Section A comprises 20 Multiple Choice Questions (Q1-Q20) of 1 mark each.',
      'Section B comprises 5 Very Short Answer Questions (Q21-Q25) of 2 marks each.',
      'Section C comprises 6 Short Answer Questions (Q26-Q31) of 3 marks each.',
      'Section D comprises 4 Long Answer Questions (Q32-Q35) of 5 marks each with internal choice.',
      'Section E comprises 3 Case-Based integrated units of assessment (Q36-Q38) of 4 marks each.',
      'Use of calculators is strictly prohibited.'
    ]
  },

  // --------------------------------------------------------------------------
  // CBSE CLASS 12 PHYSICS (70 Marks, 33 Questions, 3 Hours)
  // --------------------------------------------------------------------------
  'CBSE_CLASS_12_PHYSICS': {
    blueprintId: 'CBSE_CLASS_12_PHYSICS',
    board: 'CBSE',
    grade: '12',
    subject: 'Physics',
    title: 'CBSE Class XII Physics (Theory) Board Examination',
    totalMarks: 70,
    timeAllowedHours: 3,
    sections: [
      {
        id: 'sec_a',
        name: 'SECTION A: MULTIPLE CHOICE & ASSERTION-REASON',
        description: 'Questions 1 to 16 carry 1 mark each. Q1-Q12 are MCQs, Q13-Q16 are Assertion-Reason.',
        questionCount: 16,
        marksPerQuestion: 1,
        questionType: 'MCQ_SINGLE'
      },
      {
        id: 'sec_b',
        name: 'SECTION B: VERY SHORT ANSWER QUESTIONS',
        description: 'Questions 17 to 21 carry 2 marks each.',
        questionCount: 5,
        marksPerQuestion: 2,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_c',
        name: 'SECTION C: SHORT ANSWER QUESTIONS',
        description: 'Questions 22 to 28 carry 3 marks each.',
        questionCount: 7,
        marksPerQuestion: 3,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_d',
        name: 'SECTION D: CASE STUDY QUESTIONS',
        description: 'Questions 29 and 30 carry 4 marks each with case data and sub-questions.',
        questionCount: 2,
        marksPerQuestion: 4,
        questionType: 'CASE_BASED'
      },
      {
        id: 'sec_e',
        name: 'SECTION E: LONG DERIVATIONS & PROBLEMS (WITH INTERNAL CHOICE)',
        description: 'Questions 31 to 33 carry 5 marks each with internal choice ("OR").',
        questionCount: 3,
        marksPerQuestion: 5,
        questionType: 'SUBJECTIVE_LONG',
        hasInternalChoice: true
      }
    ],
    instructions: [
      'The question paper contains 33 questions in 5 sections: A, B, C, D, and E.',
      'Section A contains 16 questions (12 MCQs and 4 Assertion-Reasoning) of 1 mark each.',
      'Section B contains 5 questions of 2 marks each.',
      'Section C contains 7 questions of 3 marks each.',
      'Section D contains 2 case study questions of 4 marks each.',
      'Section E contains 3 long answer questions of 5 marks each with internal choice.',
      'All calculations should maintain appropriate significant figures and SI units.'
    ]
  },

  // --------------------------------------------------------------------------
  // CBSE CLASS 12 CHEMISTRY (70 Marks, 33 Questions, 3 Hours)
  // --------------------------------------------------------------------------
  'CBSE_CLASS_12_CHEMISTRY': {
    blueprintId: 'CBSE_CLASS_12_CHEMISTRY',
    board: 'CBSE',
    grade: '12',
    subject: 'Chemistry',
    title: 'CBSE Class XII Chemistry (Theory) Board Examination',
    totalMarks: 70,
    timeAllowedHours: 3,
    sections: [
      { id: 'sec_a', name: 'SECTION A: MULTIPLE CHOICE & ASSERTION-REASON', questionCount: 16, marksPerQuestion: 1, questionType: 'MCQ_SINGLE' },
      { id: 'sec_b', name: 'SECTION B: VERY SHORT ANSWER QUESTIONS', questionCount: 5, marksPerQuestion: 2, questionType: 'SUBJECTIVE_SHORT' },
      { id: 'sec_c', name: 'SECTION C: SHORT ANSWER QUESTIONS', questionCount: 7, marksPerQuestion: 3, questionType: 'SUBJECTIVE_SHORT' },
      { id: 'sec_d', name: 'SECTION D: CASE STUDY / PASSAGE QUESTIONS', questionCount: 2, marksPerQuestion: 4, questionType: 'CASE_BASED' },
      { id: 'sec_e', name: 'SECTION E: LONG ANSWER / ORGANIC MECHANISMS (WITH INTERNAL CHOICE)', questionCount: 3, marksPerQuestion: 5, questionType: 'SUBJECTIVE_LONG', hasInternalChoice: true }
    ],
    instructions: [
      'The question paper consists of 33 questions divided into 5 sections: A, B, C, D and E.',
      'Section A: Q1 to Q16 (1 Mark each)',
      'Section B: Q17 to Q21 (2 Marks each)',
      'Section C: Q22 to Q28 (3 Marks each)',
      'Section D: Q29 to Q30 (4 Marks each)',
      'Section E: Q31 to Q33 (5 Marks each with internal choice)'
    ]
  },

  // --------------------------------------------------------------------------
  // HP BOARD (HPBOSE) CLASS 10 SCIENCE (70 Marks, 31 Questions, 3 Hours)
  // Bilingual: English & Hindi Headers
  // --------------------------------------------------------------------------
  'HP_BOARD_CLASS_10_SCIENCE': {
    blueprintId: 'HP_BOARD_CLASS_10_SCIENCE',
    board: 'HP_BOARD',
    grade: '10',
    subject: 'Science',
    title: 'HP Board (HPBOSE) Class X Science (विज्ञान) Annual Examination',
    totalMarks: 70,
    timeAllowedHours: 3,
    boardOrgName: 'HIMACHAL PRADESH BOARD OF SCHOOL EDUCATION, DHARAMSHALA (HPBOSE)',
    sections: [
      {
        id: 'sec_a',
        name: 'खण्ड-क / SECTION A: वस्तुनिष्ठ एवं बहुविकल्पीय प्रश्न (OBJECTIVE & MCQs)',
        description: 'प्रश्न 1 से 15 तक प्रत्येक प्रश्न 1 अंक का है। (Questions 1 to 15 carry 1 mark each.)',
        questionCount: 15,
        marksPerQuestion: 1,
        questionType: 'MCQ_SINGLE'
      },
      {
        id: 'sec_b',
        name: 'खण्ड-ख / SECTION B: लघु उत्तरीय प्रश्न-I (SHORT ANSWER TYPE-I)',
        description: 'प्रश्न 16 से 22 तक प्रत्येक प्रश्न 2 अंक का है। (Questions 16 to 22 carry 2 marks each.)',
        questionCount: 7,
        marksPerQuestion: 2,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_c',
        name: 'खण्ड-ग / SECTION C: लघु उत्तरीय प्रश्न-II एवं संख्यात्मक (SHORT ANSWER TYPE-II & NUMERICALS)',
        description: 'प्रश्न 23 से 28 तक प्रत्येक प्रश्न 3 अंक का है। (Questions 23 to 28 carry 3 marks each.)',
        questionCount: 6,
        marksPerQuestion: 3,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_d',
        name: 'खण्ड-घ / SECTION D: दीर्घ उत्तरीय प्रश्न - अथवा सहित (LONG ANSWER WITH INTERNAL CHOICE)',
        description: 'प्रश्न 29 से 31 तक प्रत्येक प्रश्न 5 अंक का है। आंतरिक विकल्प प्रदान किया गया है। (Questions 29 to 31 carry 5 marks each with internal choice "अथवा / OR".)',
        questionCount: 3,
        marksPerQuestion: 5,
        questionType: 'SUBJECTIVE_LONG',
        hasInternalChoice: true
      }
    ],
    instructions: [
      'सभी प्रश्न अनिवार्य हैं। (All questions are compulsory.)',
      'इस प्रश्न-पत्र में 4 खण्ड हैं: खण्ड-क, खण्ड-ख, खण्ड-ग और खण्ड-घ। (This question paper contains 4 sections: A, B, C and D.)',
      'खण्ड-क (Section A): प्रश्न संख्या 1 से 15 तक वस्तुनिष्ठ/बहुविकल्पीय हैं, प्रत्येक प्रश्न 1 अंक का है।',
      'खण्ड-ख (Section B): प्रश्न संख्या 16 से 22 तक लघु उत्तरीय प्रश्न हैं, प्रत्येक प्रश्न 2 अंक का है।',
      'खण्ड-ग (Section C): प्रश्न संख्या 23 से 28 तक लघु उत्तरीय प्रश्न हैं, प्रत्येक प्रश्न 3 अंक का है।',
      'खण्ड-घ (Section D): प्रश्न संख्या 29 से 31 तक दीर्घ उत्तरीय प्रश्न हैं, प्रत्येक प्रश्न 5 अंक का है तथा इनमें आंतरिक विकल्प (अथवा) दिया गया है।',
      'स्वच्छ एवं नामांकित रेखाचित्र बनाइए जहाँ आवश्यक हो। (Draw neat and labelled diagrams wherever necessary.)'
    ]
  },

  // --------------------------------------------------------------------------
  // HP BOARD (HPBOSE) CLASS 10 MATHEMATICS (80 Marks, 34 Questions, 3 Hours)
  // --------------------------------------------------------------------------
  'HP_BOARD_CLASS_10_MATHS': {
    blueprintId: 'HP_BOARD_CLASS_10_MATHS',
    board: 'HP_BOARD',
    grade: '10',
    subject: 'Mathematics',
    title: 'HP Board (HPBOSE) Class X Mathematics (गणित) Annual Examination',
    totalMarks: 80,
    timeAllowedHours: 3,
    boardOrgName: 'HIMACHAL PRADESH BOARD OF SCHOOL EDUCATION, DHARAMSHALA (HPBOSE)',
    sections: [
      {
        id: 'sec_a',
        name: 'खण्ड-क / SECTION A: बहुविकल्पीय प्रश्न (MCQs & OBJECTIVE)',
        description: 'प्रश्न संख्या 1 से 16 तक प्रत्येक प्रश्न 1 अंक का है। (Questions 1 to 16 carry 1 mark each.)',
        questionCount: 16,
        marksPerQuestion: 1,
        questionType: 'MCQ_SINGLE'
      },
      {
        id: 'sec_b',
        name: 'खण्ड-ख / SECTION B: लघु उत्तरीय प्रश्न-I (SHORT ANSWER TYPE-I)',
        description: 'प्रश्न संख्या 17 से 24 तक प्रत्येक प्रश्न 2 अंक का है। (Questions 17 to 24 carry 2 marks each.)',
        questionCount: 8,
        marksPerQuestion: 2,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_c',
        name: 'खण्ड-ग / SECTION C: लघु उत्तरीय प्रश्न-II (SHORT ANSWER TYPE-II)',
        description: 'प्रश्न संख्या 25 से 30 तक प्रत्येक प्रश्न 3 अंक का है। (Questions 25 to 30 carry 3 marks each.)',
        questionCount: 6,
        marksPerQuestion: 3,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_d',
        name: 'खण्ड-घ / SECTION D: दीर्घ उत्तरीय प्रश्न - अथवा सहित (LONG ANSWER / PROOFS WITH CHOICE)',
        description: 'प्रश्न संख्या 31 से 34 तक प्रत्येक प्रश्न 5 अंक का है। (Questions 31 to 34 carry 5 marks each with internal choice.)',
        questionCount: 4,
        marksPerQuestion: 5,
        questionType: 'SUBJECTIVE_LONG',
        hasInternalChoice: true
      }
    ],
    instructions: [
      'सभी प्रश्न अनिवार्य हैं। (All questions are compulsory.)',
      'खण्ड-क में 16 बहुविकल्पीय प्रश्न हैं, प्रत्येक 1 अंक का है। (Section A has 16 MCQs of 1 mark each.)',
      'खण्ड-ख में 8 प्रश्न हैं, प्रत्येक 2 अंक का है। (Section B has 8 questions of 2 marks each.)',
      'खण्ड-ग में 6 प्रश्न हैं, प्रत्येक 3 अंक का है। (Section C has 6 questions of 3 marks each.)',
      'खण्ड-घ में 4 दीर्घ उत्तरीय प्रश्न हैं, प्रत्येक 5 अंक का है तथा इनमें आंतरिक विकल्प दिया गया है।',
      'कैलकुलेटर का उपयोग वर्जित है। (Use of calculators is strictly prohibited.)'
    ]
  },

  // --------------------------------------------------------------------------
  // HP BOARD (HPBOSE) CLASS 12 PHYSICS (60 Marks Theory, 29 Questions, 3 Hours)
  // Official HP Board Pattern for Class 12 Physics Theory
  // --------------------------------------------------------------------------
  'HP_BOARD_CLASS_12_PHYSICS': {
    blueprintId: 'HP_BOARD_CLASS_12_PHYSICS',
    board: 'HP_BOARD',
    grade: '12',
    subject: 'Physics',
    title: 'HP Board (HPBOSE) Class XII Physics (भौतिक विज्ञान - सैद्धांतिक) Examination',
    totalMarks: 60,
    timeAllowedHours: 3,
    boardOrgName: 'HIMACHAL PRADESH BOARD OF SCHOOL EDUCATION, DHARAMSHALA (HPBOSE)',
    sections: [
      {
        id: 'sec_a',
        name: 'खण्ड-क / SECTION A: वस्तुनिष्ठ एवं बहुविकल्पीय प्रश्न (OBJECTIVE & MCQs)',
        description: 'प्रश्न 1 से 12 तक प्रत्येक प्रश्न 1 अंक का है। (Questions 1 to 12 carry 1 mark each.)',
        questionCount: 12,
        marksPerQuestion: 1,
        questionType: 'MCQ_SINGLE'
      },
      {
        id: 'sec_b',
        name: 'खण्ड-ख / SECTION B: लघु उत्तरीय प्रश्न-I (SHORT ANSWER TYPE-I)',
        description: 'प्रश्न 13 से 18 तक प्रत्येक प्रश्न 2 अंक का है। (Questions 13 to 18 carry 2 marks each.)',
        questionCount: 6,
        marksPerQuestion: 2,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_c',
        name: 'खण्ड-ग / SECTION C: लघु उत्तरीय प्रश्न-II एवं संख्यात्मक (SHORT ANSWER TYPE-II & NUMERICALS)',
        description: 'प्रश्न 19 से 25 तक प्रत्येक प्रश्न 3 अंक का है। (Questions 19 to 25 carry 3 marks each.)',
        questionCount: 7,
        marksPerQuestion: 3,
        questionType: 'SUBJECTIVE_SHORT'
      },
      {
        id: 'sec_d',
        name: 'खण्ड-घ / SECTION D: दीर्घ उत्तरीय प्रश्न - अथवा सहित (LONG DERIVATIONS WITH CHOICE)',
        description: 'प्रश्न 26 से 28 तक प्रत्येक प्रश्न 5 अंक का है। आंतरिक विकल्प ("अथवा / OR") दिया गया है।',
        questionCount: 3,
        marksPerQuestion: 5,
        questionType: 'SUBJECTIVE_LONG',
        hasInternalChoice: true
      }
    ],
    instructions: [
      'सभी प्रश्न अनिवार्य हैं। (All questions are compulsory.)',
      'इस प्रश्न-पत्र में कुल 28 प्रश्न हैं जो 4 खण्डों में विभाजित हैं। (There are 28 questions in 4 sections.)',
      'खण्ड-क (Section A): 12 वस्तुनिष्ठ प्रश्न (1 अंक प्रत्येक)।',
      'खण्ड-ख (Section B): 6 लघु उत्तरीय प्रश्न (2 अंक प्रत्येक)।',
      'खण्ड-ग (Section C): 7 लघु उत्तरीय प्रश्न/संख्यात्मक (3 अंक प्रत्येक)।',
      'खण्ड-घ (Section D): 3 दीर्घ उत्तरीय प्रश्न (5 अंक प्रत्येक, आंतरिक विकल्प सहित)।',
      'भौतिक नियतांक / Physical Constants: $c = 3 \\times 10^8\\,\\text{m/s}$, $h = 6.63 \\times 10^{-34}\\,\\text{J}\\cdot\\text{s}$, $e = 1.6 \\times 10^{-19}\\,\\text{C}$, $\\varepsilon_0 = 8.85 \\times 10^{-12}\\,\\text{C}^2/\\text{N}\\cdot\\text{m}^2$, $\\mu_0 = 4\\pi \\times 10^{-7}\\,\\text{T}\\cdot\\text{m/A}$'
    ]
  },

  // --------------------------------------------------------------------------
  // HP BOARD (HPBOSE) CLASS 12 CHEMISTRY (60 Marks Theory, 29 Questions, 3 Hours)
  // --------------------------------------------------------------------------
  'HP_BOARD_CLASS_12_CHEMISTRY': {
    blueprintId: 'HP_BOARD_CLASS_12_CHEMISTRY',
    board: 'HP_BOARD',
    grade: '12',
    subject: 'Chemistry',
    title: 'HP Board (HPBOSE) Class XII Chemistry (रसायन विज्ञान - सैद्धांतिक) Examination',
    totalMarks: 60,
    timeAllowedHours: 3,
    boardOrgName: 'HIMACHAL PRADESH BOARD OF SCHOOL EDUCATION, DHARAMSHALA (HPBOSE)',
    sections: [
      { id: 'sec_a', name: 'खण्ड-क / SECTION A: वस्तुनिष्ठ प्रश्न (MCQs & 1-MARK OBJECTIVE)', questionCount: 12, marksPerQuestion: 1, questionType: 'MCQ_SINGLE' },
      { id: 'sec_b', name: 'खण्ड-ख / SECTION B: लघु उत्तरीय प्रश्न-I (SHORT ANSWER TYPE-I)', questionCount: 8, marksPerQuestion: 2, questionType: 'SUBJECTIVE_SHORT' },
      { id: 'sec_c', name: 'खण्ड-ग / SECTION C: लघु उत्तरीय प्रश्न-II (SHORT ANSWER TYPE-II)', questionCount: 6, marksPerQuestion: 3, questionType: 'SUBJECTIVE_SHORT' },
      { id: 'sec_d', name: 'खण्ड-घ / SECTION D: दीर्घ उत्तरीय प्रश्न - अथवा सहित (LONG ANSWER WITH CHOICE)', questionCount: 3, marksPerQuestion: 5, questionType: 'SUBJECTIVE_LONG', hasInternalChoice: true }
    ],
    instructions: [
      'सभी प्रश्न अनिवार्य हैं। (All questions are compulsory.)',
      'खण्ड-क: 12 वस्तुनिष्ठ प्रश्न (1 अंक प्रत्येक)',
      'खण्ड-ख: 8 लघु उत्तरीय प्रश्न (2 अंक प्रत्येक)',
      'खण्ड-ग: 6 लघु उत्तरीय प्रश्न (3 अंक प्रत्येक)',
      'खण्ड-घ: 3 दीर्घ उत्तरीय प्रश्न (5 अंक प्रत्येक, आंतरिक विकल्प सहित)'
    ]
  }
};

/**
 * 2. Collect questions pool for a given grade and subject
 */
function getSubjectQuestionsPool(subject = 'Physics', grade = '12') {
  const normSub = (subject || '').toLowerCase().trim();
  const pool = [];

  // Check inMemoryStore.subjectBanks
  if (inMemoryStore.subjectBanks) {
    if (normSub.includes('math')) {
      if (inMemoryStore.subjectBanks.class10_maths) pool.push(...inMemoryStore.subjectBanks.class10_maths);
      if (inMemoryStore.subjectBanks.senior_mathematics) pool.push(...inMemoryStore.subjectBanks.senior_mathematics);
    } else if (normSub.includes('sci')) {
      if (inMemoryStore.subjectBanks.class10_science) pool.push(...inMemoryStore.subjectBanks.class10_science);
      if (inMemoryStore.subjectBanks.senior_physics) pool.push(...inMemoryStore.subjectBanks.senior_physics);
      if (inMemoryStore.subjectBanks.senior_chemistry) pool.push(...inMemoryStore.subjectBanks.senior_chemistry);
    } else if (normSub.includes('phy')) {
      if (inMemoryStore.subjectBanks.senior_physics) pool.push(...inMemoryStore.subjectBanks.senior_physics);
      if (inMemoryStore.subjectBanks.class10_science) {
        pool.push(...inMemoryStore.subjectBanks.class10_science.filter(q => (q.discipline || '').toUpperCase() === 'PHYSICS' || (q.chapter_name || '').toLowerCase().includes('light') || (q.chapter_name || '').toLowerCase().includes('elec')));
      }
    } else if (normSub.includes('chem')) {
      if (inMemoryStore.subjectBanks.senior_chemistry) pool.push(...inMemoryStore.subjectBanks.senior_chemistry);
      if (inMemoryStore.subjectBanks.class10_science) {
        pool.push(...inMemoryStore.subjectBanks.class10_science.filter(q => (q.discipline || '').toUpperCase() === 'CHEMISTRY'));
      }
    } else if (normSub.includes('bio')) {
      if (inMemoryStore.subjectBanks.senior_biology) pool.push(...inMemoryStore.subjectBanks.senior_biology);
      if (inMemoryStore.subjectBanks.class10_science) {
        pool.push(...inMemoryStore.subjectBanks.class10_science.filter(q => (q.discipline || '').toUpperCase() === 'BIOLOGY'));
      }
    }
  }

  // Also check inMemoryStore.questions
  if (inMemoryStore.questions && inMemoryStore.questions.length > 0) {
    const matching = inMemoryStore.questions.filter(q => {
      const qSub = (q.subject || q.discipline || '').toLowerCase();
      return qSub.includes(normSub) || normSub.includes(qSub);
    });
    pool.push(...matching);
  }

  return pool;
}

/**
 * 3. Synthesize a structured question for missing slots
 * Provides diverse, syllabus-authentic board questions with pristine LaTeX math formatting
 */
function createSyntheticBoardQuestion({
  subject,
  grade,
  board,
  sectionId,
  marks,
  questionNumber,
  topicHint
}) {
  const isHp = (board || '').toUpperCase().includes('HP');
  const normSub = (subject || '').toLowerCase().trim();

  // --------------------------------------------------------------------------
  // A. PHYSICS QUESTION POOLS (CLASS 11 & 12)
  // --------------------------------------------------------------------------
  const physicsMCQs = [
    {
      topic: 'Electrostatics & Dipole',
      q: 'An electric dipole of dipole moment $\\vec{p}$ is placed in a uniform electric field $\\vec{E}$. The torque $\\vec{\\tau}$ acting on the dipole is:',
      opts: [
        { key: 'A', latex: '$\\vec{\\tau} = \\vec{p} \\times \\vec{E}$', is_correct: true },
        { key: 'B', latex: '$\\vec{\\tau} = \\vec{p} \\cdot \\vec{E}$', is_correct: false },
        { key: 'C', latex: '$\\vec{\\tau} = \\vec{E} \\times \\vec{p}$', is_correct: false },
        { key: 'D', latex: '$\\vec{\\tau} = 0$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Torque on an electric dipole in uniform field is given by $\\vec{\\tau} = \\vec{p} \\times \\vec{E}$. Magnitude is $\\tau = pE\\sin\\theta$.',
      rubric: [{ step: 'Correct vector formula statement $\\vec{\\tau} = \\vec{p} \\times \\vec{E}$', marks: 1 }]
    },
    {
      topic: 'Capacitance & Dielectrics',
      q: 'A parallel plate capacitor with air between the plates has capacitance $C_0$. If a dielectric slab of dielectric constant $K$ completely fills the space between the plates, the new capacitance $C$ is:',
      opts: [
        { key: 'A', latex: '$C = K C_0$', is_correct: true },
        { key: 'B', latex: '$C = C_0 / K$', is_correct: false },
        { key: 'C', latex: '$C = K^2 C_0$', is_correct: false },
        { key: 'D', latex: '$C = C_0$', is_correct: false }
      ],
      ans: 'A',
      sol: 'The capacitance of a parallel plate capacitor increases by factor $K$: $C = \\frac{K \\varepsilon_0 A}{d} = K C_0$.',
      rubric: [{ step: 'Dielectric relation $C = K C_0$', marks: 1 }]
    },
    {
      topic: 'Current Electricity & Drift',
      q: 'The relation between electric current $I$ and drift velocity $v_d$ of conduction electrons in a conductor of cross-sectional area $A$ is:',
      opts: [
        { key: 'A', latex: '$I = n e A v_d$', is_correct: true },
        { key: 'B', latex: '$I = \\frac{n e A}{v_d}$', is_correct: false },
        { key: 'C', latex: '$I = n e^2 A v_d$', is_correct: false },
        { key: 'D', latex: '$I = \\frac{n e}{A v_d}$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Current through conductor of free electron density $n$ is $I = n e A v_d$.',
      rubric: [{ step: 'Drift velocity relation $I = n e A v_d$', marks: 1 }]
    },
    {
      topic: 'Magnetic Effects of Current',
      q: 'A charged particle carrying charge $q$ moves with velocity $\\vec{v}$ in a uniform magnetic field $\\vec{B}$. The Lorentz magnetic force $\\vec{F}_m$ acting on it is:',
      opts: [
        { key: 'A', latex: '$\\vec{F}_m = q(\\vec{v} \\times \\vec{B})$', is_correct: true },
        { key: 'B', latex: '$\\vec{F}_m = q(\\vec{v} \\cdot \\vec{B})$', is_correct: false },
        { key: 'C', latex: '$\\vec{F}_m = q(\\vec{B} \\times \\vec{v})$', is_correct: false },
        { key: 'D', latex: '$\\vec{F}_m = \\frac{\\vec{v} \\times \\vec{B}}{q}$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Magnetic Lorentz force is $\\vec{F}_m = q(\\vec{v} \\times \\vec{B})$ with magnitude $F = q v B \\sin\\theta$.',
      rubric: [{ step: 'Lorentz force formula', marks: 1 }]
    },
    {
      topic: 'Alternating Current (AC)',
      q: 'In a series $LCR$ circuit, the resonant angular frequency $\\omega_0$ is given by:',
      opts: [
        { key: 'A', latex: '$\\omega_0 = \\frac{1}{\\sqrt{LC}}$', is_correct: true },
        { key: 'B', latex: '$\\omega_0 = \\sqrt{LC}$', is_correct: false },
        { key: 'C', latex: '$\\omega_0 = \\frac{1}{LC}$', is_correct: false },
        { key: 'D', latex: '$\\omega_0 = \\frac{L}{C}$', is_correct: false }
      ],
      ans: 'A',
      sol: 'At resonance, $X_L = X_C \\implies \\omega_0 L = \\frac{1}{\\omega_0 C} \\implies \\omega_0 = \\frac{1}{\\sqrt{LC}}$.',
      rubric: [{ step: 'Resonance angular frequency $\\omega_0 = 1/\\sqrt{LC}$', marks: 1 }]
    },
    {
      topic: 'Electromagnetic Waves',
      q: 'The speed of electromagnetic waves in vacuum in terms of permittivity $\\varepsilon_0$ and permeability $\\mu_0$ is:',
      opts: [
        { key: 'A', latex: '$c = \\frac{1}{\\sqrt{\\mu_0 \\varepsilon_0}}$', is_correct: true },
        { key: 'B', latex: '$c = \\sqrt{\\mu_0 \\varepsilon_0}$', is_correct: false },
        { key: 'C', latex: '$c = \\frac{1}{\\mu_0 \\varepsilon_0}$', is_correct: false },
        { key: 'D', latex: '$c = \\frac{\\mu_0}{\\varepsilon_0}$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Maxwell relation gives the speed of light in vacuum as $c = \\frac{1}{\\sqrt{\\mu_0 \\varepsilon_0}} \\approx 3 \\times 10^8\\,\\text{m/s}$.',
      rubric: [{ step: 'Speed of EM wave expression', marks: 1 }]
    },
    {
      topic: 'Ray Optics',
      q: 'A ray of light is incident at Brewster angle $i_p$ on a glass slab of refractive index $\\mu$. Brewster\'s law states that:',
      opts: [
        { key: 'A', latex: '$\\tan i_p = \\mu$', is_correct: true },
        { key: 'B', latex: '$\\sin i_p = \\mu$', is_correct: false },
        { key: 'C', latex: '$\\cos i_p = \\mu$', is_correct: false },
        { key: 'D', latex: '$\\cot i_p = \\mu$', is_correct: false }
      ],
      ans: 'A',
      sol: 'From Brewster\'s law, the reflected ray is completely plane polarized when $\\tan i_p = \\mu$.',
      rubric: [{ step: 'Brewster relation $\\tan i_p = \\mu$', marks: 1 }]
    },
    {
      topic: 'Dual Nature of Matter',
      q: 'The de Broglie wavelength $\\lambda$ associated with a particle of mass $m$ and kinetic energy $K$ is:',
      opts: [
        { key: 'A', latex: '$\\lambda = \\frac{h}{\\sqrt{2mK}}$', is_correct: true },
        { key: 'B', latex: '$\\lambda = \\frac{h}{2mK}$', is_correct: false },
        { key: 'C', latex: '$\\lambda = \\frac{\\sqrt{2mK}}{h}$', is_correct: false },
        { key: 'D', latex: '$\\lambda = \\frac{h}{\\sqrt{mK}}$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Momentum $p = \\sqrt{2mK}$. Hence $\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2mK}}$.',
      rubric: [{ step: 'de Broglie wavelength formula', marks: 1 }]
    },
    {
      topic: 'Atoms & Bohr Model',
      q: 'The radius $r_n$ of the $n^{\\text{th}}$ stationary orbit of Hydrogen atom according to Bohr model is proportional to:',
      opts: [
        { key: 'A', latex: '$r_n \\propto n^2$', is_correct: true },
        { key: 'B', latex: '$r_n \\propto n$', is_correct: false },
        { key: 'C', latex: '$r_n \\propto 1/n$', is_correct: false },
        { key: 'D', latex: '$r_n \\propto 1/n^2$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Bohr radius is $r_n = \\frac{n^2 h^2 \\varepsilon_0}{\\pi m e^2} \\propto n^2$. For ground state $n=1$, $r_1 \\approx 0.529\\,\\text{\\AA}$.',
      rubric: [{ step: 'Orbit radius dependency $r_n \\propto n^2$', marks: 1 }]
    },
    {
      topic: 'Semiconductor Electronics',
      q: 'In an unbiased p-n junction diode, the thickness of the depletion layer is of the order of:',
      opts: [
        { key: 'A', latex: '$1\\,\\mu\\text{m} = 10^{-6}\\,\\text{m}$', is_correct: true },
        { key: 'B', latex: '$1\\,\\text{mm} = 10^{-3}\\,\\text{m}$', is_correct: false },
        { key: 'C', latex: '$1\\,\\text{cm} = 10^{-2}\\,\\text{m}$', is_correct: false },
        { key: 'D', latex: '$1\\,\\text{\\AA} = 10^{-10}\\,\\text{m}$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Depletion layer thickness in an unbiased p-n junction is typically around $0.5$ to $1\\,\\mu\\text{m}$ ($10^{-6}\\,\\text{m}$).',
      rubric: [{ step: 'Depletion region width order of magnitude', marks: 1 }]
    },
    {
      topic: 'Assertion & Reason: Electrostatics',
      q: 'Assertion (A): Electric field lines never intersect each other.\nReason (R): At the point of intersection, there would be two tangents indicating two directions of electric field, which is impossible.',
      opts: [
        { key: 'A', latex: 'Both (A) and (R) are true and (R) is correct explanation of (A)', is_correct: true },
        { key: 'B', latex: 'Both (A) and (R) are true but (R) is NOT correct explanation of (A)', is_correct: false },
        { key: 'C', latex: '(A) is true but (R) is false', is_correct: false },
        { key: 'D', latex: '(A) is false but (R) is true', is_correct: false }
      ],
      ans: 'A',
      sol: 'Electric field is unique at any point. Two intersecting lines would give two different directions of force, which is physically impossible.',
      rubric: [{ step: 'Assertion-Reason analysis', marks: 1 }]
    },
    {
      topic: 'Assertion & Reason: AC Circuits',
      q: 'Assertion (A): In a series $LCR$ circuit at resonance, the power factor is unity ($\\cos\\phi = 1$).\nReason (R): At resonance, inductive reactance equals capacitive reactance ($X_L = X_C$), making impedance purely resistive ($Z = R$).',
      opts: [
        { key: 'A', latex: 'Both (A) and (R) are true and (R) is correct explanation of (A)', is_correct: true },
        { key: 'B', latex: 'Both (A) and (R) are true but (R) is NOT correct explanation of (A)', is_correct: false },
        { key: 'C', latex: '(A) is true but (R) is false', is_correct: false },
        { key: 'D', latex: '(A) is false but (R) is true', is_correct: false }
      ],
      ans: 'A',
      sol: 'At resonance, $Z = \\sqrt{R^2 + (X_L - X_C)^2} = R$. Phase angle $\\phi = 0 \\implies \\cos\\phi = R/Z = 1$. Both statements are true and Reason explains Assertion.',
      rubric: [{ step: 'Assertion-Reason evaluation', marks: 1 }]
    }
  ];

  const physics2M = [
    {
      topic: 'Current Electricity: Kirchhoff Rules',
      q: 'State Kirchhoff\'s rules of electrical networks. Which fundamental physical conservation laws do they represent?',
      sol: '1. **Kirchhoff\'s Current Law (Junction Rule)**: The algebraic sum of currents meeting at any electrical junction is zero: $$\\sum I = 0$$. It represents the **Conservation of Electric Charge**.\n2. **Kirchhoff\'s Voltage Law (Loop Rule)**: The algebraic sum of changes in potential around any closed mesh is zero: $$\\sum \\Delta V = 0$$. It represents the **Conservation of Energy**.',
      rubric: [
        { step: 'Statement of Junction rule and conservation of charge', marks: 1 },
        { step: 'Statement of Loop rule and conservation of energy', marks: 1 }
      ]
    },
    {
      topic: 'Electrostatics: Gauss Theorem',
      q: 'State Gauss\'s Law in electrostatics. Write its integral mathematical expression for a closed Gaussian surface enclosing charge $q_{\\text{encl}}$ in free space.',
      sol: 'Gauss\'s Law states that the total electric flux $\\Phi_E$ through any closed surface is equal to $\\frac{1}{\\varepsilon_0}$ times the total net charge enclosed: $$\\Phi_E = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{encl}}}{\\varepsilon_0}$$.',
      rubric: [
        { step: 'Definition and verbal statement of Gauss Law', marks: 1 },
        { step: 'Mathematical formula $\\oint \\vec{E} \\cdot d\\vec{A} = q_{\\text{encl}}/\\varepsilon_0$', marks: 1 }
      ]
    },
    {
      topic: 'Ray Optics: Prism Formula',
      q: 'An equilateral glass prism ($A = 60^\\circ$) has a refractive index $\\mu = \\sqrt{3}$. Calculate the angle of minimum deviation $D_m$ produced by this prism.',
      sol: 'Prism formula: $$\\mu = \\frac{\\sin\\left(\\frac{A + D_m}{2}\\right)}{\\sin\\left(\\frac{A}{2}\\right)}$$.\nGiven $A = 60^\\circ$, $\\mu = \\sqrt{3}$:\n$$\\sqrt{3} = \\frac{\\sin\\left(\\frac{60^\\circ + D_m}{2}\\right)}{\\sin 30^\\circ} = \\frac{\\sin\\left(\\frac{60^\\circ + D_m}{2}\\right)}{0.5} \\implies \\sin\\left(\\frac{60^\\circ + D_m}{2}\\right) = \\frac{\\sqrt{3}}{2}$$.\n$$\\frac{60^\\circ + D_m}{2} = 60^\\circ \\implies 60^\\circ + D_m = 120^\\circ \\implies D_m = 60^\\circ$$.',
      rubric: [
        { step: 'Prism formula substitution', marks: 1 },
        { step: 'Correct computation of minimum deviation $D_m = 60^\\circ$', marks: 1 }
      ]
    },
    {
      topic: 'Current Electricity: Drift Mobility',
      q: 'Define mobility $\\mu$ of charge carriers in a conductor. Deduce its relationship with average relaxation time $\\tau$: $$\\mu = \\frac{e\\tau}{m}$$.',
      sol: 'Mobility $\\mu$ is defined as the magnitude of drift velocity per unit applied electric field: $$\\mu = \\frac{v_d}{E}$$.\nSince drift velocity is $v_d = \\frac{e E \\tau}{m}$, substituting gives: $$\\mu = \\frac{e E \\tau / m}{E} = \\frac{e\\tau}{m}$$. SI unit is $\\text{m}^2/(\\text{V}\\cdot\\text{s})$.',
      rubric: [
        { step: 'Definition $\\mu = v_d / E$', marks: 1 },
        { step: 'Derivation of $\\mu = e\\tau / m$', marks: 1 }
      ]
    },
    {
      topic: 'Dual Nature: Photoelectric Effect',
      q: 'The work function of cesium metal is $\\Phi_0 = 2.14\\,\\text{eV}$. Find its threshold frequency $\\nu_0$. (Take Planck\'s constant $h = 6.63 \\times 10^{-34}\\,\\text{J}\\cdot\\text{s}$)',
      sol: 'Work function $\\Phi_0 = h \\nu_0$.\n$$\\Phi_0 = 2.14 \\times 1.6 \\times 10^{-19}\\,\\text{J} = 3.424 \\times 10^{-19}\\,\\text{J}$$.\n$$\\nu_0 = \\frac{\\Phi_0}{h} = \\frac{3.424 \\times 10^{-19}}{6.63 \\times 10^{-34}} \\approx 5.16 \\times 10^{14}\\,\\text{Hz}$$.',
      rubric: [
        { step: 'Conversion of work function from eV to Joules', marks: 1 },
        { step: 'Calculation of threshold frequency $\\nu_0 = 5.16 \\times 10^{14}\\,\\text{Hz}$', marks: 1 }
      ]
    },
    {
      topic: 'Semiconductors: Energy Bands',
      q: 'Draw the energy band diagrams of an n-type semiconductor and a p-type semiconductor at temperature $T > 0\\,\\text{K}$, showing the donor and acceptor energy levels relative to the conduction and valence bands.',
      sol: '1. **n-type semiconductor**: Donor energy level $E_d$ lies just below the conduction band edge $E_c$ by $\\Delta E \\approx 0.01\\,\\text{eV}$ (Germanium) or $0.05\\,\\text{eV}$ (Silicon).\n2. **p-type semiconductor**: Acceptor energy level $E_a$ lies just above the valence band edge $E_v$ by a small energy separation $\\Delta E$.',
      rubric: [
        { step: 'n-type diagram with donor level near conduction band', marks: 1 },
        { step: 'p-type diagram with acceptor level near valence band', marks: 1 }
      ]
    }
  ];

  const physics3M = [
    {
      topic: 'Magnetism: Biot-Savart Law',
      q: 'Deduce the expression for the magnetic field $\\vec{B}$ at the center of a circular current-carrying loop of radius $R$ carrying steady current $I$, using Biot-Savart Law. State the rule for its direction.',
      sol: 'According to Biot-Savart Law, field due to current element $d\\vec{l}$ at the center is: $$dB = \\frac{\\mu_0}{4\\pi} \\frac{I dl \\sin 90^\\circ}{R^2} = \\frac{\\mu_0 I}{4\\pi R^2} dl$$.\nIntegrating around the circumference of the loop: $$B = \\oint dB = \\frac{\\mu_0 I}{4\\pi R^2} \\oint dl = \\frac{\\mu_0 I}{4\\pi R^2} (2\\pi R) = \\frac{\\mu_0 I}{2R}$$.\nDirection is perpendicular to the plane of the loop, given by Right-Hand Thumb Rule.',
      rubric: [
        { step: 'Biot-Savart Law formulation with $\\theta = 90^\\circ$', marks: 1 },
        { step: 'Integration over circular perimeter $\\oint dl = 2\\pi R$', marks: 1 },
        { step: 'Final formula $B = \\frac{\\mu_0 I}{2R}$ and direction rule', marks: 1 }
      ]
    },
    {
      topic: 'Semiconductors: Full-Wave Rectifier',
      q: 'Explain the working of a full-wave rectifier using two p-n junction diodes with a center-tapped transformer. Draw the circuit diagram and input/output voltage waveforms.',
      sol: '1. **Circuit Setup**: Center-tapped secondary coil connected to anodes of diodes $D_1$ and $D_2$. Load resistor $R_L$ is connected between the center tap and common cathode junction.\n2. **Positive Half-Cycle**: Anode of $D_1$ is positive with respect to center tap (forward biased, conducts). Anode of $D_2$ is negative (reverse biased, blocks). Current flows through $R_L$ from $X$ to $Y$.\n3. **Negative Half-Cycle**: Anode of $D_2$ becomes positive (forward biased, conducts) while $D_1$ is reverse biased. Current again flows through $R_L$ in the same direction from $X$ to $Y$.\n4. **Result**: Unidirectional pulsating DC output with ripple frequency $f_{\\text{out}} = 2 f_{\\text{in}}$.',
      rubric: [
        { step: 'Neat labeled circuit diagram with center-tapped transformer', marks: 1 },
        { step: 'Working explanation for both half-cycles', marks: 1 },
        { step: 'Input and rectified output voltage waveforms', marks: 1 }
      ]
    },
    {
      topic: 'Alternating Current: LCR Resonance',
      q: 'A series $LCR$ circuit with $R = 20\\,\\Omega$, $L = 1.5\\,\\text{H}$, and $C = 35\\,\\mu\\text{F}$ is connected to a variable frequency $220\\,\\text{V}$ AC source.\n(a) Determine the resonant angular frequency $\\omega_r$.\n(b) Calculate the impedance $Z$ and current amplitude $I_0$ at resonance.',
      sol: '(a) Resonant angular frequency: $$\\omega_r = \\frac{1}{\\sqrt{LC}} = \\frac{1}{\\sqrt{1.5 \\times 35 \\times 10^{-6}}} = \\frac{1}{\\sqrt{5.25 \\times 10^{-5}}} = \\frac{1}{7.246 \\times 10^{-3}} \\approx 138\\,\\text{rad/s}$$.\n(b) At resonance, $X_L = X_C \\implies Z = R = 20\\,\\Omega$.\nPeak source voltage: $V_0 = \\sqrt{2} V_{\\text{rms}} = \\sqrt{2} \\times 220 \\approx 311.1\\,\\text{V}$.\nCurrent amplitude at resonance: $$I_0 = \\frac{V_0}{Z} = \\frac{311.1}{20} = 15.55\\,\\text{A}$$.',
      rubric: [
        { step: 'Resonant angular frequency calculation $\\omega_r = 138\\,\\text{rad/s}$', marks: 1.5 },
        { step: 'Impedance $Z = 20\\,\\Omega$ and current amplitude $I_0 = 15.55\\,\\text{A}$', marks: 1.5 }
      ]
    },
    {
      topic: 'Current Electricity: Wheatstone Bridge',
      q: 'Derive the condition for balance of a Wheatstone bridge: $$\\frac{P}{Q} = \\frac{R}{S}$$ using Kirchhoff\'s loop rules.',
      sol: 'In a Wheatstone bridge with four resistance arms $AB (P)$, $BC (Q)$, $AD (R)$, and $DC (S)$ and galvanometer $BD (G)$:\nAt balance, no current flows through galvanometer ($I_g = 0$), so $V_B = V_D$.\nApplying KVL to closed loop $ABDA$:\n$$-I_1 P - I_g G + I_2 R = 0 \\implies I_1 P = I_2 R \\quad \\text{--- (1)}$$\nApplying KVL to closed loop $BCDB$:\n$$-(I_1 - I_g) Q + (I_2 + I_g) S + I_g G = 0$$\nSetting $I_g = 0$ gives: $$I_1 Q = I_2 S \\quad \\text{--- (2)}$$\nDividing equation (1) by equation (2): $$\\frac{I_1 P}{I_1 Q} = \\frac{I_2 R}{I_2 S} \\implies \\frac{P}{Q} = \\frac{R}{S}$$.',
      rubric: [
        { step: 'Circuit diagram and balance condition $I_g = 0$', marks: 1 },
        { step: 'KVL equations for both loops', marks: 1 },
        { step: 'Division and derivation of $P/Q = R/S$', marks: 1 }
      ]
    }
  ];

  const physics4MCase = [
    {
      topic: 'Case Study: Electrical Transformer & Transmission',
      q: `CASE STUDY: An electrical engineer at a generating station designs a step-up transformer to transmit electric power across high-voltage transmission lines. The primary winding has $N_p = 200\\,\\text{turns}$ and the secondary winding has $N_s = 4000\\,\\text{turns}$. An alternating voltage of $V_p = 220\\,\\text{V}$ is applied across the primary coil.\n(i) Calculate the output voltage $V_s$ across the secondary winding. [1M]\n(ii) If the primary current is $I_p = 10\\,\\text{A}$, find the secondary current $I_s$ assuming $100\\%$ efficiency. [1M]\n(iii) Mention two main causes of energy loss in practical power transformers and explain how laminating the core reduces eddy current losses. [2M]`,
      sol: `(i) Transformer turns ratio equation: $$\\frac{V_s}{V_p} = \\frac{N_s}{N_p} \\implies V_s = 220 \\times \\left(\\frac{4000}{200}\\right) = 220 \\times 20 = 4400\\,\\text{V}$$.\n(ii) For ideal transformer: $$P_{\\text{in}} = P_{\\text{out}} \\implies V_p I_p = V_s I_s \\implies I_s = \\frac{220 \\times 10}{4400} = 0.5\\,\\text{A}$$.\n(iii) 1. **Eddy Current Losses**: Induced circulating currents in iron core cause heating. Using thin insulated laminated sheets increases resistance of eddy paths, drastically reducing eddy currents ($P_{\\text{eddy}} \\propto d^2$).\n2. **Joule Copper Loss**: $I^2 R$ heat dissipated in copper windings, minimized by using thick wire for high-current windings.`,
      rubric: [
        { step: 'Secondary voltage computation $V_s = 4400\\,\\text{V}$', marks: 1 },
        { step: 'Secondary current computation $I_s = 0.5\\,\\text{A}$', marks: 1 },
        { step: 'Transformer losses and lamination explanation', marks: 2 }
      ]
    },
    {
      topic: 'Case Study: Photoelectric Effect & Quantum Physics',
      q: `CASE STUDY: In an experiment on the photoelectric effect, monochromatic radiation of wavelength $\\lambda = 400\\,\\text{nm}$ illuminates a cesium photocathode surface of work function $\\Phi_0 = 2.14\\,\\text{eV}$.\n(i) Calculate the energy of the incident photon in electron-volts ($\\text{eV}$). [1M]\n(ii) Determine the maximum kinetic energy $K_{\\max}$ of emitted photoelectrons. [1M]\n(iii) What is the stopping potential $V_0$ required to reduce the photocurrent to zero? What happens to $V_0$ if the intensity of incident light is doubled while keeping frequency constant? [2M]`,
      sol: `(i) Photon energy: $$E = \\frac{hc}{\\lambda} = \\frac{6.63 \\times 10^{-34} \\times 3 \\times 10^8}{400 \\times 10^{-9}\\,\\text{J}} = \\frac{1.989 \\times 10^{-19}}{1.6 \\times 10^{-19}}\\,\\text{eV} \\approx 3.108\\,\\text{eV}$$.\n(ii) Einstein photoelectric equation: $$K_{\\max} = E - \\Phi_0 = 3.108\\,\\text{eV} - 2.14\\,\\text{eV} = 0.968\\,\\text{eV}$$.\n(iii) Stopping potential: $$e V_0 = K_{\\max} \\implies V_0 = 0.968\\,\\text{V}$$.\nStopping potential depends solely on the incident light frequency and work function, not intensity. Doubling intensity increases photocurrent, but stopping potential remains **completely unchanged**.`,
      rubric: [
        { step: 'Photon energy calculation $E \\approx 3.11\\,\\text{eV}$', marks: 1 },
        { step: 'Maximum kinetic energy $K_{\\max} = 0.968\\,\\text{eV}$', marks: 1 },
        { step: 'Stopping potential $V_0 = 0.968\\,\\text{V}$ and intensity independence', marks: 2 }
      ]
    }
  ];

  const physics5MLong = [
    {
      topic: 'Wave Optics vs Lens Maker Formula',
      q: `(a) State Huygens' principle of wave optics. Using it, prove the laws of reflection of a plane wave at a plane reflecting surface: $$\\angle i = \\angle r$$.\n(b) In Young's double slit experiment, monochromatic light of wavelength $\\lambda = 600\\,\\text{nm}$ illuminates slits separated by $d = 0.2\\,\\text{mm}$. The fringe pattern is observed on a screen placed $D = 1\\,\\text{m}$ away. Calculate the fringe width $\\beta$.\n\nOR / अथवा\n\n(a) Derive Lens Maker's formula for a thin double convex lens having radii of curvature $R_1$ and $R_2$ and refractive index $n_2$ placed in a medium of refractive index $n_1$:\n$$\\frac{1}{f} = \\left(\\frac{n_2}{n_1} - 1\\right)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)$$\n(b) A convex lens of focal length $20\\,\\text{cm}$ in air ($n_1 = 1$) is immersed in water ($n = 4/3$). Calculate its new focal length in water.`,
      sol: `Part (a): Huygens principle states each point on wavefront acts as source of secondary spherical wavelets. Incident wavefront $AB$ meets reflector at $A$. When wavelet from $B$ reaches $C$, wavelet from $A$ spreads to $D$ with $AD = BC = v t$. Right triangles $\\triangle ABC$ and $\\triangle ADC$ share hypotenuse $AC$ and $AD = BC$. By RHS Congruence, $\\angle BAC = \\angle DCA \\implies \\angle i = \\angle r$.\nPart (b): Fringe width formula: $$\\beta = \\frac{\\lambda D}{d} = \\frac{600 \\times 10^{-9} \\times 1}{0.2 \\times 10^{-3}} = 3.0 \\times 10^{-3}\\,\\text{m} = 3.0\\,\\text{mm}$$.\n\nOR Option:\nLens maker formula: In air, $\\frac{1}{f_{\\text{air}}} = (1.5 - 1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right) = 0.5 K$.\nIn water, $\\frac{1}{f_{\\text{water}}} = \\left(\\frac{1.5}{4/3} - 1\\right) K = \\left(\\frac{9}{8} - 1\\right) K = \\frac{1}{8} K$.\nDividing gives: $$\\frac{f_{\\text{water}}}{f_{\\text{air}}} = \\frac{0.5}{1/8} = 4 \\implies f_{\\text{water}} = 4 \\times 20 = 80\\,\\text{cm}$$.`,
      rubric: [
        { step: 'Wavefront diagram and proof of $\\angle i = \\angle r$', marks: 3 },
        { step: 'Young fringe width calculation $\\beta = 3.0\\,\\text{mm}$', marks: 2 }
      ]
    },
    {
      topic: 'Gauss Law Line Charge vs Dielectric Capacitor',
      q: `(a) State Gauss's Theorem in electrostatics. Using it, deduce an expression for the electric field due to an infinitely long straight uniformly charged wire of linear charge density $\\lambda$: $$E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}$$.\n(b) An infinite line charge produces an electric field of $9 \\times 10^4\\,\\text{N/C}$ at a distance of $2\\,\\text{cm}$. Calculate the linear charge density $\\lambda$.\n\nOR / अथवा\n\n(a) Derive an expression for the capacitance of a parallel plate capacitor of plate area $A$ and separation $d$ when a dielectric slab of thickness $t < d$ and dielectric constant $K$ is introduced between the plates: $$C = \\frac{\\varepsilon_0 A}{d - t(1 - 1/K)}$$.\n(b) A $600\\,\\text{pF}$ capacitor is charged by a $200\\,\\text{V}$ supply. It is then disconnected and connected to an uncharged $600\\,\\text{pF}$ capacitor. How much electrostatic energy is lost in the process?`,
      sol: `Part (a): Cylindrical Gaussian surface of radius $r$ and length $l$ co-axial with wire. Flux through end faces is zero ($\\vec{E} \\perp d\\vec{A}$). Flux through curved surface: $$\\oint \\vec{E} \\cdot d\\vec{A} = E (2\\pi r l) = \\frac{\\lambda l}{\\varepsilon_0} \\implies E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}$$.\nPart (b): $$\\lambda = 2\\pi\\varepsilon_0 r E = \\frac{r E}{2 k} = \\frac{0.02 \\times 9 \\times 10^4}{2 \\times 9 \\times 10^9} = 10^{-7}\\,\\text{C/m} = 0.1\\,\\mu\\text{C/m}$$.\n\nOR Option: Initial energy: $$U_i = \\frac{1}{2} C V^2 = \\frac{1}{2}(600 \\times 10^{-12})(200)^2 = 1.2 \\times 10^{-5}\\,\\text{J}$$.\nCommon potential on parallel sharing: $$V\' = \\frac{C V}{C + C} = 100\\,\\text{V}$$.\nFinal energy: $$U_f = \\frac{1}{2}(2C)(V\')^2 = (600 \\times 10^{-12})(100)^2 = 0.6 \\times 10^{-5}\\,\\text{J}$$.\nEnergy lost: $$\\Delta U = U_i - U_f = 0.6 \\times 10^{-5}\\,\\text{J} = 6\\,\\mu\\text{J}$$.`,
      rubric: [
        { step: 'Gauss law cylinder derivation for infinite line charge', marks: 3 },
        { step: 'Numerical substitution $\\lambda = 0.1\\,\\mu\\text{C/m}$', marks: 2 }
      ]
    }
  ];

  // --------------------------------------------------------------------------
  // B. MATHEMATICS QUESTION POOLS (CLASS 10 & 12)
  // --------------------------------------------------------------------------
  const mathsMCQs = [
    {
      topic: 'Quadratic Equations',
      q: 'If $\\alpha$ and $\\beta$ are the zeroes of the quadratic polynomial $p(x) = x^2 - 5x + 6$, then the value of $\\alpha^2 + \\beta^2$ is:',
      opts: [
        { key: 'A', latex: '$13$', is_correct: true },
        { key: 'B', latex: '$25$', is_correct: false },
        { key: 'C', latex: '$19$', is_correct: false },
        { key: 'D', latex: '$12$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Sum $\\alpha + \\beta = 5$, Product $\\alpha\\beta = 6$. Then $\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta = 25 - 12 = 13$.',
      rubric: [{ step: 'Identity calculation', marks: 1 }]
    },
    {
      topic: 'Arithmetic Progressions',
      q: 'The $10^{\\text{th}}$ term of the AP: $2, 7, 12, \\dots$ is:',
      opts: [
        { key: 'A', latex: '$47$', is_correct: true },
        { key: 'B', latex: '$42$', is_correct: false },
        { key: 'C', latex: '$52$', is_correct: false },
        { key: 'D', latex: '$57$', is_correct: false }
      ],
      ans: 'A',
      sol: '$a = 2, d = 5$. The $10^{\\text{th}}$ term is $a_{10} = a + 9d = 2 + 9(5) = 47$.',
      rubric: [{ step: 'AP term calculation', marks: 1 }]
    },
    {
      topic: 'Coordinate Geometry',
      q: 'The distance between the points $P(2, 3)$ and $Q(4, 1)$ is:',
      opts: [
        { key: 'A', latex: '$2\\sqrt{2}$', is_correct: true },
        { key: 'B', latex: '$2$', is_correct: false },
        { key: 'C', latex: '$4$', is_correct: false },
        { key: 'D', latex: '$8$', is_correct: false }
      ],
      ans: 'A',
      sol: '$d = \\sqrt{(4-2)^2 + (1-3)^2} = \\sqrt{4 + 4} = \\sqrt{8} = 2\\sqrt{2}$.',
      rubric: [{ step: 'Distance formula', marks: 1 }]
    },
    {
      topic: 'Trigonometry',
      q: 'If $\\sin\\theta = \\frac{1}{2}$, then the value of $3\\cos\\theta - 4\\cos^3\\theta$ is:',
      opts: [
        { key: 'A', latex: '$0$', is_correct: true },
        { key: 'B', latex: '$1$', is_correct: false },
        { key: 'C', latex: '$\\frac{1}{2}$', is_correct: false },
        { key: 'D', latex: '$\\frac{\\sqrt{3}}{2}$', is_correct: false }
      ],
      ans: 'A',
      sol: '$\\sin\\theta = 1/2 \\implies \\theta = 30^\\circ$. $\\cos 30^\\circ = \\frac{\\sqrt{3}}{2}$. Then $3(\\sqrt{3}/2) - 4(3\\sqrt{3}/8) = \\frac{3\\sqrt{3}}{2} - \\frac{3\\sqrt{3}}{2} = 0$. (Notice $-\\cos 3\\theta = -\\cos 90^\\circ = 0$).',
      rubric: [{ step: 'Trig substitution and identity', marks: 1 }]
    }
  ];

  // --------------------------------------------------------------------------
  // C. SCIENCE QUESTION POOLS (CLASS 10)
  // --------------------------------------------------------------------------
  const scienceMCQs = [
    {
      topic: 'Acids, Bases and Salts',
      q: 'Which of the following chemical compounds turns red litmus blue and gives carbon dioxide on reaction with dilute hydrochloric acid?',
      opts: [
        { key: 'A', latex: 'Sodium Hydrogen Carbonate ($\\text{NaHCO}_3$)', is_correct: true },
        { key: 'B', latex: 'Calcium Hydroxide ($\\text{Ca(OH)}_2$)', is_correct: false },
        { key: 'C', latex: 'Sodium Chloride ($\\text{NaCl}$)', is_correct: false },
        { key: 'D', latex: 'Hydrochloric Acid ($\\text{HCl}$)', is_correct: false }
      ],
      ans: 'A',
      sol: '$\\text{NaHCO}_3$ is a basic salt that turns red litmus blue and reacts with acid releasing effervescence of $\\text{CO}_2$: $$\\text{NaHCO}_3 + \\text{HCl} \\rightarrow \\text{NaCl} + \\text{H}_2\\text{O} + \\text{CO}_2\\uparrow$$.',
      rubric: [{ step: 'Salt property identification', marks: 1 }]
    },
    {
      topic: 'Light: Reflection & Refraction',
      q: 'An object is placed at a distance of $10\\,\\text{cm}$ in front of a concave mirror of focal length $15\\,\\text{cm}$. The nature of the image formed is:',
      opts: [
        { key: 'A', latex: 'Virtual, erect and magnified', is_correct: true },
        { key: 'B', latex: 'Real, inverted and magnified', is_correct: false },
        { key: 'C', latex: 'Real, inverted and diminished', is_correct: false },
        { key: 'D', latex: 'Virtual, erect and diminished', is_correct: false }
      ],
      ans: 'A',
      sol: 'When object is placed between pole $P$ and focus $F$ of a concave mirror ($u < f$), rays diverge after reflection, forming a virtual, erect, and magnified image behind the mirror.',
      rubric: [{ step: 'Ray optics image characterization', marks: 1 }]
    },
    {
      topic: 'Electricity: Ohm\'s Law',
      q: 'A cylindrical wire of length $l$ and uniform cross-sectional area $A$ has resistance $R$. Another wire of the same material having length $2l$ and area $A/2$ has resistance:',
      opts: [
        { key: 'A', latex: '$4R$', is_correct: true },
        { key: 'B', latex: '$2R$', is_correct: false },
        { key: 'C', latex: '$R/2$', is_correct: false },
        { key: 'D', latex: '$R/4$', is_correct: false }
      ],
      ans: 'A',
      sol: 'Resistance $R = \\rho \\frac{l}{A}$. New resistance: $$R\' = \\rho \\frac{2l}{A/2} = 4 \\rho \\frac{l}{A} = 4R$$.',
      rubric: [{ step: 'Resistance geometry relation', marks: 1 }]
    }
  ];

  // --------------------------------------------------------------------------
  // Selection Logic by Marks & Subject
  // --------------------------------------------------------------------------
  let chosen = null;

  if (normSub.includes('phy')) {
    if (marks === 1) {
      chosen = physicsMCQs[(questionNumber - 1) % physicsMCQs.length];
    } else if (marks === 2) {
      chosen = physics2M[(questionNumber - 1) % physics2M.length];
    } else if (marks === 3) {
      chosen = physics3M[(questionNumber - 1) % physics3M.length];
    } else if (marks === 4) {
      chosen = physics4MCase[(questionNumber - 1) % physics4MCase.length];
    } else {
      chosen = physics5MLong[(questionNumber - 1) % physics5MLong.length];
    }
  } else if (normSub.includes('math')) {
    if (marks === 1) {
      chosen = mathsMCQs[(questionNumber - 1) % mathsMCQs.length];
    } else if (marks === 2) {
      chosen = {
        topic: 'Arithmetic Progressions',
        q: 'Find the $20^{\\text{th}}$ term from the last term of the AP: $3, 8, 13, \\dots, 253$.',
        sol: 'Reversing the AP: $a = 253, d = -5$. The $20^{\\text{th}}$ term is: $$a_{20} = a + 19d = 253 + 19(-5) = 253 - 95 = 158$$.',
        rubric: [{ step: 'Reversed AP identification and formula', marks: 1 }, { step: 'Calculation $a_{20} = 158$', marks: 1 }]
      };
    } else if (marks === 3) {
      chosen = {
        topic: 'Circles & Tangents',
        q: 'Prove that the lengths of tangents drawn from an external point to a circle are equal.',
        sol: 'Given circle with center $O$ and external point $P$ with tangents $PQ$ and $PR$.\nIn $\\triangle OQP$ and $\\triangle ORP$:\n1. $OQ = OR$ (radii of same circle)\n2. $\\angle OQP = \\angle ORP = 90^\\circ$ (radius is perpendicular to tangent at point of contact)\n3. $OP = OP$ (common hypotenuse)\nBy RHS Congruence criterion, $\\triangle OQP \\cong \\triangle ORP \\implies PQ = PR$ by CPCT.',
        rubric: [{ step: 'Neat diagram and given/to prove statement', marks: 1 }, { step: 'RHS Congruency proof', marks: 1.5 }, { step: 'CPCT conclusion $PQ = PR$', marks: 0.5 }]
      };
    } else if (marks === 4) {
      chosen = {
        topic: 'Case Study: Parabolic Bridge',
        q: `CASE STUDY: A suspension bridge arch follows the parabolic quadratic polynomial $y = -x^2 + 8x - 12$, where $x$ is horizontal distance in meters and $y$ is height above ground level in meters.\n(i) Find the zeroes of the polynomial representing points where the arch touches the ground. [1M]\n(ii) Find the maximum height reached by the arch bridge. [2M]\n(iii) What is the total horizontal span (width) of the bridge arch? [1M]`,
        sol: `(i) Factoring $-x^2 + 8x - 12 = -(x-2)(x-6) = 0 \\implies x = 2\\,\\text{m}, x = 6\\,\\text{m}$.\n(ii) Vertex occurs at $x = -b/(2a) = -8/(-2) = 4\\,\\text{m}$. Maximum height is $y(4) = -(4)^2 + 8(4) - 12 = -16 + 32 - 12 = 4\\,\\text{m}$.\n(iii) Span width: $6 - 2 = 4\\,\\text{m}$.`,
        rubric: [{ step: 'Zeroes calculation', marks: 1 }, { step: 'Max height vertex computation', marks: 2 }, { step: 'Span determination', marks: 1 }]
      };
    } else {
      chosen = {
        topic: 'Triangles: Basic Proportionality Theorem',
        q: `(a) State and prove Basic Proportionality Theorem (Thales Theorem).\n(b) Using the theorem, in $\\triangle ABC$, if $DE \\parallel BC$ intersects $AB$ at $D$ and $AC$ at $E$ such that $AD = 2.4\\,\\text{cm}, DB = 3.6\\,\\text{cm}, AE = 2.0\\,\\text{cm}$, find $EC$.\n\nOR / अथवा\n\n(a) Solve the following system of linear equations using matrix method:\n$$x - y + 2z = 7$$\n$$3x + 4y - 5z = -5$$\n$$2x - y + 3z = 12$$`,
        sol: `(a) Thales Theorem proof: Construction of altitudes and median connectors. Ratios of triangle areas give $\\frac{\\text{ar}(ADE)}{\\text{ar}(BDE)} = \\frac{AD}{DB}$ and $\\frac{\\text{ar}(ADE)}{\\text{ar}(CDE)} = \\frac{AE}{EC}$. Since $\\text{ar}(BDE) = \\text{ar}(CDE)$ on common base $DE$ between parallels, $\\frac{AD}{DB} = \\frac{AE}{EC}$.\n(b) $$\\frac{2.4}{3.6} = \\frac{2.0}{EC} \\implies EC = \\frac{3.6 \\times 2.0}{2.4} = 3.0\\,\\text{cm}$$.`,
        rubric: [{ step: 'Thales theorem theorem proof with diagram', marks: 3.5 }, { step: 'Numerical substitution $EC = 3.0\\,\\text{cm}$', marks: 1.5 }]
      };
    }
  } else {
    // General Science (Class 10)
    if (marks === 1) {
      chosen = scienceMCQs[(questionNumber - 1) % scienceMCQs.length];
    } else if (marks === 2) {
      chosen = {
        topic: 'Chemical Reactions: Exothermic Process',
        q: 'Why is cellular respiration considered an exothermic reaction? Write the balanced chemical equation representing the complete breakdown of glucose.',
        sol: 'Respiration combines glucose with oxygen inside cells, releasing energy in the form of ATP: $$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\rightarrow 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{Energy (ATP)}$$. Because heat/chemical energy is liberated during the reaction, it is classified as exothermic.',
        rubric: [{ step: 'Explanation of exothermic nature', marks: 1 }, { step: 'Balanced equation with energy term', marks: 1 }]
      };
    } else if (marks === 3) {
      chosen = {
        topic: 'Life Processes: Human Digestion',
        q: '(a) What is the dual function of bile juice secreted by the liver in human digestion? Why does it not contain any digestive enzymes?\n(b) How are fatty acids and glycerol absorbed in the small intestine?',
        sol: '(a) Bile juice: 1. Makes the acidic chyme alkaline for pancreatic enzymes to function. 2. Emulsifies large fat globules into tiny micelles, increasing the surface area for lipase action. Even without enzymes, emulsification is essential.\n(b) Digested fats are absorbed into lacteals (lymphatic capillaries) inside the intestinal villi, which empty into the blood circulatory system.',
        rubric: [{ step: 'Dual role of bile: alkalinity and fat emulsification', marks: 1.5 }, { step: 'Lacteal absorption in intestinal villi', marks: 1.5 }]
      };
    } else if (marks === 4) {
      chosen = {
        topic: 'Case Study: Electric Circuit & Domestic Heating',
        q: `CASE STUDY: An electric geyser is rated $2000\\,\\text{W}$, $220\\,\\text{V}$. It is connected to a standard $220\\,\\text{V}$ domestic power supply.\n(i) Calculate the electric current $I$ drawn by the geyser. [1M]\n(ii) Find the electrical resistance $R$ of the heating element of the geyser. [1M]\n(iii) Calculate the electrical energy consumed in commercial units ($\\text{kWh}$) if the geyser operates for $3\\,\\text{hours}$ daily for $30\\,\\text{days}$. [2M]`,
        sol: `(i) Current: $$I = \\frac{P}{V} = \\frac{2000}{220} = \\frac{100}{11} \\approx 9.09\\,\\text{A}$$.\n(ii) Resistance: $$R = \\frac{V^2}{P} = \\frac{(220)^2}{2000} = \\frac{48400}{2000} = 24.2\\,\\Omega$$.\n(iii) Energy: $$E = P \\times t = 2\\,\\text{kW} \\times (3 \\times 30\\,\\text{h}) = 2 \\times 90 = 180\\,\\text{kWh}$$.`,
        rubric: [{ step: 'Current calculation $I = 9.09\\,\\text{A}$', marks: 1 }, { step: 'Resistance calculation $R = 24.2\\,\\Omega$', marks: 1 }, { step: 'Commercial energy consumption $180\\,\\text{kWh}$', marks: 2 }]
      };
    } else {
      chosen = {
        topic: 'Human Excretory System vs Metal Refining',
        q: `(a) Draw a neat labeled diagram of a human nephron showing Bowman's capsule, Glomerulus, Henle's loop, and Collecting duct.\n(b) Explain the three successive physiological stages of urine formation in kidneys.\n\nOR / अथवा\n\n(a) Explain the electrolytic refining of blister copper with a neat labeled diagram.\n(b) Write the chemical reactions occurring at the anode and the cathode during the electrolysis process.`,
        sol: `(a) Nephron structure showing glomerulus filter, proximal convoluted tubule, Henle loop, and collecting duct.\n(b) 1. **Ultrafiltration**: Blood filtered under high pressure in glomerulus.\n2. **Selective Reabsorption**: Glucose, amino acids, salts, and water reabsorbed into peritubular capillaries.\n3. **Tubular Secretion**: Excess potassium, hydrogen, and ammonia secreted into lumen to form urine.\n\nOR Option:\nAt Anode: $$\\text{Cu(s)} \\rightarrow \\text{Cu}^{2+}\\text{(aq)} + 2e^-$$\nAt Cathode: $$\\text{Cu}^{2+}\\text{(aq)} + 2e^- \\rightarrow \\text{Cu(s)}$$\nImpurities settle as anode mud containing gold, silver, and platinum.`,
        rubric: [{ step: 'Neat labeled nephron diagram', marks: 2 }, { step: 'Detailed explanation of 3 urine formation stages', marks: 3 }]
      };
    }
  }

  return {
    id: `q_bgen_${Date.now()}_${questionNumber}_${Math.random().toString(36).substr(2, 5)}`,
    question_number: questionNumber,
    section_id: sectionId,
    marks: marks,
    subject: subject,
    grade: grade,
    board: board,
    topic: chosen.topic || topicHint || 'Core Syllabus',
    pyq_appearance: isHp ? 'HP Board Model Examination & HPBOSE PYQ' : 'CBSE Board Examination (2024 / 2023)',
    question_latex: chosen.q,
    options_latex: chosen.opts || [],
    correct_answer: chosen.ans || 'A',
    solution_latex: chosen.sol || '',
    step_rubric: chosen.rubric || [{ step: 'Correct working according to board rubric', marks: marks }]
  };
}

/**
 * 4. Generate Full-Length Board Question Paper
 */
function generateBoardQuestionPaper({
  board = 'CBSE',
  grade = '12',
  subject = 'Physics',
  schoolName = 'HIM ACADEMY PUBLIC SCHOOL (HAPS)',
  academicYear = '2025–26',
  customTitle = null
}) {
  const normBoard = board.toUpperCase().includes('HP') ? 'HP_BOARD' : 'CBSE';
  const normSub = subject.toLowerCase().includes('math') ? 'MATHS' : (subject.toLowerCase().includes('sci') ? 'SCIENCE' : subject.toUpperCase());
  const blueprintKey = `${normBoard}_CLASS_${grade}_${normSub}`;
  
  const blueprint = BOARD_BLUEPRINTS[blueprintKey] || (normBoard === 'HP_BOARD' ? BOARD_BLUEPRINTS['HP_BOARD_CLASS_12_PHYSICS'] : BOARD_BLUEPRINTS['CBSE_CLASS_12_PHYSICS']);

  console.log(`[BOARD PAPER GEN] Generating ${blueprint.title} for ${schoolName}...`);

  const pool = getSubjectQuestionsPool(blueprint.subject, blueprint.grade);
  const usedIds = new Set();
  let globalQNum = 1;

  const generatedSections = blueprint.sections.map(secSpec => {
    const secQuestions = [];
    const targetCount = secSpec.questionCount;
    const marks = secSpec.marksPerQuestion;

    // 1. Pick matching questions from existing curated bank
    for (const q of pool) {
      if (secQuestions.length >= targetCount) break;
      if (usedIds.has(q.id)) continue;

      const qMarks = Number(q.marks_weightage || q.marks || (marks === 1 ? 1 : (marks === 5 ? 5 : 2)));
      const isFormatMatch = marks === 1 ? (q.question_format === 'MCQ_SINGLE' || (q.options_latex && q.options_latex.length > 0)) : (marks === 5 ? (q.marks_weightage === 5 || q.question_format === 'SUBJECTIVE_LONG') : true);

      if (qMarks === marks || (marks > 1 && qMarks >= 2 && qMarks <= 4 && !isFormatMatch)) {
        usedIds.add(q.id);
        secQuestions.push({
          id: q.id,
          question_number: globalQNum++,
          section_id: secSpec.id,
          marks: marks,
          subject: blueprint.subject,
          grade: blueprint.grade,
          board: blueprint.board,
          topic: q.chapter_name || q.topic || q.chapter || 'Core Syllabus',
          pyq_appearance: q.pyq_appearance || (normBoard === 'HP_BOARD' ? 'HP Board Model Exam' : 'CBSE Board Examination'),
          question_latex: q.question_latex,
          options_latex: q.options_latex || [],
          correct_answer: q.correct_answer || q.correct_answer_latex || 'A',
          solution_latex: q.solution_latex || '',
          step_rubric: q.step_rubric || [{ step: 'Correct working according to board rubric', marks: marks }]
        });
      }
    }

    // 2. If questions are still needed to reach full official count, synthesize authentic board questions
    while (secQuestions.length < targetCount) {
      const synQ = createSyntheticBoardQuestion({
        subject: blueprint.subject,
        grade: blueprint.grade,
        board: blueprint.board,
        sectionId: secSpec.id,
        marks: marks,
        questionNumber: globalQNum++
      });
      secQuestions.push(synQ);
    }

    const secTotalMarks = secQuestions.reduce((acc, q) => acc + (q.marks || marks), 0);

    return {
      id: secSpec.id,
      name: secSpec.name,
      description: secSpec.description || `${secQuestions.length} Questions carrying ${marks} mark(s) each.`,
      marksPerQuestion: marks,
      totalMarks: secTotalMarks,
      hasInternalChoice: !!secSpec.hasInternalChoice,
      questions: secQuestions
    };
  });

  const totalQuestions = generatedSections.reduce((acc, s) => acc + s.questions.length, 0);
  const totalCalculatedMarks = generatedSections.reduce((acc, s) => acc + s.totalMarks, 0);

  const paperId = `paper_${normBoard.toLowerCase()}_${blueprint.grade}_${blueprint.subject.toLowerCase()}_${Date.now()}`;

  const paper = {
    id: paperId,
    title: customTitle || `${schoolName} • ${blueprint.title}`,
    board: blueprint.board,
    boardName: blueprint.boardOrgName || (blueprint.board === 'HP_BOARD' ? 'Himachal Pradesh Board of School Education (HPBOSE)' : 'Central Board of Secondary Education (CBSE)'),
    schoolName: schoolName,
    academicYear: academicYear,
    grade: blueprint.grade,
    subject: blueprint.subject,
    timeAllowedMinutes: blueprint.timeAllowedHours * 60,
    timeAllowedHours: blueprint.timeAllowedHours,
    totalMarks: totalCalculatedMarks || blueprint.totalMarks,
    totalQuestions: totalQuestions,
    instructions: blueprint.instructions,
    sections: generatedSections,
    createdAt: new Date().toISOString(),
    isCustomizedByTeacher: false
  };

  return paper;
}

/**
 * 5. Swap / Replace an existing question with an alternative from the bank
 */
function swapPaperQuestion({ paper, questionId, replacementQuestionId = null, customQuestion = null }) {
  if (!paper || !paper.sections) throw new Error('Invalid question paper structure.');

  let targetSection = null;
  let targetIndex = -1;
  let targetQuestion = null;

  for (const sec of paper.sections) {
    const idx = sec.questions.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      targetSection = sec;
      targetIndex = idx;
      targetQuestion = sec.questions[idx];
      break;
    }
  }

  if (!targetQuestion) throw new Error(`Question with ID ${questionId} not found in this paper.`);

  let newQuestion = null;

  if (customQuestion) {
    newQuestion = {
      ...customQuestion,
      id: customQuestion.id || `q_custom_${Date.now()}`,
      question_number: targetQuestion.question_number,
      section_id: targetSection.id,
      marks: targetQuestion.marks
    };
  } else if (replacementQuestionId) {
    const pool = getSubjectQuestionsPool(paper.subject, paper.grade);
    const found = pool.find(q => q.id === replacementQuestionId);
    if (found) {
      newQuestion = {
        ...found,
        id: found.id,
        question_number: targetQuestion.question_number,
        section_id: targetSection.id,
        marks: targetQuestion.marks
      };
    }
  }

  // If no specific replacement provided, automatically find an alternative matching question from bank
  if (!newQuestion) {
    const pool = getSubjectQuestionsPool(paper.subject, paper.grade);
    const existingIds = new Set();
    paper.sections.forEach(s => s.questions.forEach(q => existingIds.add(q.id)));

    const candidate = pool.find(q => 
      !existingIds.has(q.id) &&
      (Number(q.marks_weightage || q.marks || 1) === targetQuestion.marks || targetQuestion.marks === 1)
    );

    if (candidate) {
      newQuestion = {
        ...candidate,
        id: candidate.id,
        question_number: targetQuestion.question_number,
        section_id: targetSection.id,
        marks: targetQuestion.marks
      };
    } else {
      // Synthesize fresh alternative question
      newQuestion = createSyntheticBoardQuestion({
        subject: paper.subject,
        grade: paper.grade,
        board: paper.board,
        sectionId: targetSection.id,
        marks: targetQuestion.marks,
        questionNumber: targetQuestion.question_number,
        topicHint: targetQuestion.topic
      });
    }
  }

  targetSection.questions[targetIndex] = newQuestion;
  paper.isCustomizedByTeacher = true;

  return { paper, replacedQuestion: targetQuestion, newQuestion };
}

/**
 * 6. Get alternative questions from bank for teacher to choose from
 */
function getAlternativeQuestions({ subject = 'Physics', grade = '12', marks = 1, excludeIds = [], topic = null }) {
  const pool = getSubjectQuestionsPool(subject, grade);
  const excludeSet = new Set(excludeIds || []);

  const candidates = pool.filter(q => {
    if (excludeSet.has(q.id)) return false;
    const qMarks = Number(q.marks_weightage || q.marks || 1);
    return marks === 1 ? (qMarks === 1 || q.options_latex?.length > 0) : (qMarks === marks || (marks >= 2 && qMarks >= 2));
  });

  return candidates.slice(0, 5).map((q, idx) => ({
    id: q.id,
    question_latex: q.question_latex,
    options_latex: q.options_latex || [],
    correct_answer: q.correct_answer || q.correct_answer_latex || 'A',
    solution_latex: q.solution_latex || '',
    marks: marks,
    topic: q.chapter_name || q.topic || q.chapter || 'Curriculum Syllabus',
    pyq_appearance: q.pyq_appearance || 'Board Exam Pattern'
  }));
}

/**
 * 7. Add teacher's own custom question into paper
 */
function addCustomQuestionToPaper({
  paper,
  sectionId = 'sec_b',
  questionData = {}
}) {
  if (!paper || !paper.sections) throw new Error('Invalid question paper structure.');

  let targetSection = paper.sections.find(s => s.id === sectionId);
  if (!targetSection) targetSection = paper.sections[0];

  const marks = Number(questionData.marks || targetSection.marksPerQuestion || 2);

  const customQ = {
    id: `q_custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    section_id: targetSection.id,
    marks: marks,
    subject: paper.subject,
    grade: paper.grade,
    board: paper.board,
    topic: questionData.topic || 'Teacher Custom Question',
    pyq_appearance: questionData.pyq_appearance || 'Teacher Formulated Question',
    question_latex: questionData.question_latex || 'Write question statement here...',
    options_latex: questionData.options_latex || [],
    correct_answer: questionData.correct_answer || 'A',
    solution_latex: questionData.solution_latex || '',
    step_rubric: questionData.step_rubric || [{ step: 'Complete solution and steps', marks: marks }],
    isCustomTeacherQuestion: true
  };

  targetSection.questions.push(customQ);

  // Re-sequence all question numbers across all sections
  resequencePaper(paper);
  paper.isCustomizedByTeacher = true;

  return { paper, addedQuestion: customQ };
}

/**
 * 8. Update / Edit question details in place
 */
function updatePaperQuestion({ paper, questionId, updatedData }) {
  if (!paper || !paper.sections) throw new Error('Invalid question paper structure.');

  let found = false;
  for (const sec of paper.sections) {
    const q = sec.questions.find(item => item.id === questionId);
    if (q) {
      if (updatedData.question_latex !== undefined) q.question_latex = updatedData.question_latex;
      if (updatedData.options_latex !== undefined) q.options_latex = updatedData.options_latex;
      if (updatedData.correct_answer !== undefined) q.correct_answer = updatedData.correct_answer;
      if (updatedData.solution_latex !== undefined) q.solution_latex = updatedData.solution_latex;
      if (updatedData.topic !== undefined) q.topic = updatedData.topic;
      if (updatedData.marks !== undefined) q.marks = Number(updatedData.marks);
      if (updatedData.step_rubric !== undefined) q.step_rubric = updatedData.step_rubric;
      q.isCustomTeacherQuestion = true;
      found = true;
      break;
    }
  }

  if (!found) throw new Error(`Question ${questionId} not found.`);

  recalculateMarks(paper);
  paper.isCustomizedByTeacher = true;
  return paper;
}

/**
 * 9. Delete a question from the paper
 */
function deletePaperQuestion({ paper, questionId }) {
  if (!paper || !paper.sections) throw new Error('Invalid question paper structure.');

  let found = false;
  for (const sec of paper.sections) {
    const idx = sec.questions.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      sec.questions.splice(idx, 1);
      found = true;
      break;
    }
  }

  if (!found) throw new Error(`Question ${questionId} not found.`);

  resequencePaper(paper);
  paper.isCustomizedByTeacher = true;
  return paper;
}

function resequencePaper(paper) {
  let count = 1;
  paper.sections.forEach(sec => {
    sec.questions.forEach(q => {
      q.question_number = count++;
    });
  });
  recalculateMarks(paper);
}

function recalculateMarks(paper) {
  let grandMarks = 0;
  let grandCount = 0;

  paper.sections.forEach(sec => {
    const secMarks = sec.questions.reduce((acc, q) => acc + (Number(q.marks) || sec.marksPerQuestion || 1), 0);
    sec.totalMarks = secMarks;
    grandMarks += secMarks;
    grandCount += sec.questions.length;
  });

  paper.totalMarks = grandMarks;
  paper.totalQuestions = grandCount;
}

module.exports = {
  BOARD_BLUEPRINTS,
  generateBoardQuestionPaper,
  swapPaperQuestion,
  getAlternativeQuestions,
  addCustomQuestionToPaper,
  updatePaperQuestion,
  deletePaperQuestion
};
