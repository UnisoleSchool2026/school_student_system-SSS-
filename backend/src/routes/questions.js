const express = require('express');
const router = express.Router();
const { inMemoryStore } = require('../config/database');
const { generateAiQuestion } = require('../services/aiPromptEngine');
const { generateLlmQuestion, sanitizeQuestionPayload } = require('../services/llmQuestionEngine');
const { getAllClass10Questions, getCuratedClass10Question } = require('../services/class10PyqBank');
const {
  validateFacultySubjectLock,
  processQuestionExtraction,
  commitQuestionToStore,
  commitBatchQuestionsToStore,
  loadPersistedCustomQuestions,
  savePersistedCustomQuestions
} = require('../services/questionInjectionService');

// GET all questions from bank (queries inMemoryStore.questions and all subjectBanks)
router.get('/', (req, res) => {
  const { subject, topic, board, grade, difficulty, search, limit, offset } = req.query;
  const banks = inMemoryStore.subjectBanks || {};
  const bankQuestions = Object.values(banks).flat();

  // Deduplicate by question id
  const seenIds = new Set();
  const allPool = [];
  [...(inMemoryStore.questions || []), ...bankQuestions].forEach(q => {
    if (q && q.id && !seenIds.has(q.id)) {
      seenIds.add(q.id);
      allPool.push(q);
    }
  });

  let results = allPool;

  if (subject && subject !== 'ALL') {
    const sLower = subject.toLowerCase();
    results = results.filter(q => 
      (q.subject && q.subject.toLowerCase().includes(sLower)) ||
      (q.subjectKey && q.subjectKey.toLowerCase().includes(sLower)) ||
      (q.discipline && q.discipline.toLowerCase().includes(sLower)) ||
      (q.topic && q.topic.toLowerCase().includes(sLower))
    );
  }
  if (grade && grade !== 'ALL') {
    results = results.filter(q => String(q.grade) === String(grade));
  }
  if (board && board !== 'ALL') {
    const bLower = board.toLowerCase();
    results = results.filter(q => 
      (q.curriculum_board && q.curriculum_board.toLowerCase().includes(bLower)) ||
      (q.target_exam && q.target_exam.toLowerCase().includes(bLower))
    );
  }
  if (topic && topic !== 'ALL') {
    const tLower = topic.toLowerCase();
    results = results.filter(q => 
      (q.topic && q.topic.toLowerCase().includes(tLower)) ||
      (q.chapter && q.chapter.toLowerCase().includes(tLower)) ||
      (q.chapter_name && q.chapter_name.toLowerCase().includes(tLower))
    );
  }
  if (difficulty && difficulty !== 'ALL') {
    const dUpper = difficulty.toUpperCase();
    results = results.filter(q => (q.difficulty || '').toUpperCase() === dUpper);
  }
  if (search && search.trim()) {
    const sTerm = search.toLowerCase();
    results = results.filter(q => 
      (q.question_latex && q.question_latex.toLowerCase().includes(sTerm)) ||
      (q.topic && q.topic.toLowerCase().includes(sTerm)) ||
      (q.chapter_name && q.chapter_name.toLowerCase().includes(sTerm)) ||
      (q.subtopic && q.subtopic.toLowerCase().includes(sTerm))
    );
  }

  const hasPagination = limit !== undefined || offset !== undefined;
  const parsedLimit = Math.max(1, Math.min(1000, Number(limit) || 50));
  const parsedOffset = Math.max(0, Number(offset) || 0);
  const paginated = hasPagination ? results.slice(parsedOffset, parsedOffset + parsedLimit) : results;

  res.json({
    success: true,
    totalCount: results.length,
    count: paginated.length,
    questions: paginated.map(q => sanitizeQuestionPayload(q))
  });
});

// GET LLM Providers configuration status
router.get('/providers', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
  const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 5);

  res.json({
    success: true,
    providers: {
      groq: {
        configured: hasGroq,
        model: 'llama-3.3-70b-versatile',
        engine: 'Groq LPU Inference Engine',
        speed: '~350ms'
      },
      gemini: {
        configured: hasGemini,
        model: 'gemini-1.5-flash',
        engine: 'Google Gemini 1.5 Flash',
        speed: '~1200ms'
      },
      ncert_pyq: {
        configured: true,
        model: 'NCERT & Board PYQ Database (2020-2024)',
        engine: 'Class 10 CBSE & HPBOSE Curated Bank',
        speed: '<10ms'
      }
    }
  });
});

// GET Class 10 NCERT Mapped Previous Year Question Bank
router.get('/class10-pyq', (req, res) => {
  const { subject, chapter, board, search } = req.query;
  let results = getAllClass10Questions();

  if (subject && subject !== 'ALL') {
    results = results.filter(q => q.subject.toLowerCase() === subject.toLowerCase());
  }
  if (chapter && chapter !== 'ALL') {
    results = results.filter(q => q.chapter.toLowerCase().includes(chapter.toLowerCase()));
  }
  if (board && board !== 'ALL') {
    results = results.filter(q => q.ncert_mapping && q.ncert_mapping.pyq_tag.toLowerCase().includes(board.toLowerCase()));
  }
  if (search) {
    const term = search.toLowerCase();
    results = results.filter(q => 
      q.chapter.toLowerCase().includes(term) ||
      q.question_latex.toLowerCase().includes(term) ||
      (q.ncert_mapping && q.ncert_mapping.ncert_section.toLowerCase().includes(term)) ||
      (q.ncert_mapping && q.ncert_mapping.pyq_tag.toLowerCase().includes(term))
    );
  }

  res.json({
    success: true,
    count: results.length,
    grade: "10",
    curriculum: "NCERT & State Boards (CBSE & HPBOSE)",
    questions: results
  });
});

// POST generate new AI question in clean LaTeX (Legacy Engine)
router.post('/generate-ai', async (req, res) => {
  try {
    const { grade, subject, topic, subtopic, board, difficulty, questionType } = req.body;
    const newQuestion = await generateAiQuestion({
      grade,
      subject,
      topic,
      subtopic,
      board,
      difficulty,
      questionType
    });

    // Add to in-memory question bank
    inMemoryStore.questions.push(newQuestion);

    res.status(201).json({
      success: true,
      message: 'AI question generated in clean LaTeX format.',
      question: newQuestion
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST generate new question using Multi-LLM Engine (Gemini 1.5 / Groq Llama-3.3 / Auto NCERT)
router.post('/generate-llm', async (req, res) => {
  try {
    const {
      grade = '10',
      subject = 'Science',
      chapter = 'Light – Reflection and Refraction',
      ncertSection = '9.2 Spherical Mirrors and Mirror Formula',
      board = 'CBSE',
      difficulty = 'MEDIUM',
      questionType = 'NUMERICAL',
      provider = 'auto'
    } = req.body;

    const newQuestion = await generateLlmQuestion({
      grade,
      subject,
      chapter,
      ncertSection,
      board,
      difficulty,
      questionType,
      provider
    });

    // Store generated question in the question bank for classroom tests
    inMemoryStore.questions.push({
      id: newQuestion.id,
      topic: `${newQuestion.subject || subject} - ${newQuestion.chapter || chapter}`,
      difficulty: newQuestion.difficulty || difficulty || 'MEDIUM',
      curriculum_board: newQuestion.curriculum_board || board || 'CBSE',
      question_latex: newQuestion.question_latex,
      options_latex: newQuestion.options_latex,
      correct_answer_latex: newQuestion.correct_answer_latex,
      solution_latex: newQuestion.solution_latex,
      socratic_hints: newQuestion.socratic_hints,
      step_rubric: newQuestion.step_rubric,
      ncert_mapping: newQuestion.ncert_mapping,
      llm_provider: newQuestion.llm_provider,
      inference_time_ms: newQuestion.inference_time_ms,
      benchmark_time_seconds: newQuestion.benchmark_time_seconds || 120
    });

    res.status(201).json({
      success: true,
      message: `Generated question successfully using ${newQuestion.llm_provider}`,
      question: newQuestion
    });
  } catch (err) {
    console.error('[API QUESTIONS GENERATE-LLM ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions/inject/preview - AI extraction & auto-categorization for review before committing
router.post('/inject/preview', async (req, res) => {
  try {
    const {
      teacher,
      targetSubject,
      targetSubjectKey,
      mode = 'text',
      rawText = '',
      mediaData = '',
      mimeType = 'image/jpeg',
      grade = '12',
      category = 'CBSE_PYQ'
    } = req.body;

    // Strict Faculty Subject Lock verification
    validateFacultySubjectLock({ teacher, targetSubject, targetSubjectKey });

    const extracted = await processQuestionExtraction({
      mode,
      rawText,
      mediaData,
      mimeType,
      targetSubject: targetSubject || teacher.subject || 'Physics',
      grade,
      category
    });

    const questionList = Array.isArray(extracted.questions) && extracted.questions.length > 0
      ? extracted.questions
      : [extracted];

    res.json({
      success: true,
      message: `Extracted and auto-categorized ${questionList.length} question(s) successfully.`,
      detectedCount: questionList.length,
      questions: questionList,
      previewQuestion: questionList[0],
      subjectLockedTo: teacher.subject || teacher.subjectKey
    });
  } catch (err) {
    console.error('[API INJECT PREVIEW ERROR]', err.message);
    const statusCode = err.message.includes('Discipline Lock') || err.message.includes('Access Denied') ? 403 : 500;
    res.status(statusCode).json({ success: false, error: err.message });
  }
});

// POST /api/questions/inject - Commit single or batch questions into backend Question Bank with audit trail
router.post('/inject', async (req, res) => {
  try {
    const {
      teacher,
      targetSubject,
      targetSubjectKey,
      mode = 'text',
      rawText = '',
      mediaData = '',
      mimeType = 'image/jpeg',
      grade = '12',
      category = 'CBSE_PYQ',
      structuredQuestion = null,
      questions = null
    } = req.body;

    // Strict Faculty Subject Lock verification
    validateFacultySubjectLock({ teacher, targetSubject, targetSubjectKey });

    const questionsToCommit = Array.isArray(questions) && questions.length > 0
      ? questions
      : (structuredQuestion ? [structuredQuestion] : null);

    if (questionsToCommit && questionsToCommit.length > 0) {
      const batchResult = commitBatchQuestionsToStore({
        questions: questionsToCommit,
        teacher,
        targetSubject: targetSubject || teacher.subject || 'Physics',
        grade,
        category,
        mode
      });

      return res.status(201).json({
        success: true,
        message: `Successfully pushed ${batchResult.count} auto-categorized question(s) into ${batchResult.targetBank} (Total in bank: ${batchResult.totalBankCount}).`,
        count: batchResult.count,
        questions: batchResult.questions,
        question: batchResult.questions[0],
        targetBank: batchResult.targetBank,
        totalBankCount: batchResult.totalBankCount,
        audit: batchResult.questions[0]?.injected_by
      });
    }

    // Single extraction fallback
    const extracted = await processQuestionExtraction({
      mode,
      rawText,
      mediaData,
      mimeType,
      targetSubject: targetSubject || teacher.subject || 'Physics',
      grade,
      category
    });

    const singleQ = extracted.questions?.[0] || extracted;
    const result = commitQuestionToStore({
      structuredQuestion: singleQ,
      teacher,
      targetSubject: targetSubject || teacher.subject || 'Physics',
      grade,
      category,
      mode
    });

    res.status(201).json({
      success: true,
      message: `Successfully pushed question into ${result.targetBank} (Total in bank: ${result.totalBankCount}).`,
      count: 1,
      questions: [result.question],
      question: result.question,
      targetBank: result.targetBank,
      totalBankCount: result.totalBankCount,
      audit: result.question.injected_by
    });
  } catch (err) {
    console.error('[API INJECT COMMIT ERROR]', err.message);
    const statusCode = err.message.includes('Discipline Lock') || err.message.includes('Access Denied') ? 403 : 500;
    res.status(statusCode).json({ success: false, error: err.message });
  }
});

// GET /api/questions/injected-questions - Retrieve all custom injected questions from persistent disk storage
router.get('/injected-questions', (req, res) => {
  try {
    const list = loadPersistedCustomQuestions();
    res.json({
      success: true,
      count: list.length,
      questions: list.map(q => sanitizeQuestionPayload(q))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions/sync-injected-cache - Synchronize and write injected questions into backend storage
router.post('/sync-injected-cache', (req, res) => {
  try {
    const { questions = [] } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const cleanList = questions.map(q => sanitizeQuestionPayload(q));

    // Hydrate into inMemoryStore
    cleanList.forEach(q => {
      if (!q || !q.id) return;
      const sUpper = (q.subjectKey || q.subject || '').toUpperCase();
      const isC10 = String(q.grade) === '10';

      let bankKey = 'senior_physics';
      if (isC10) {
        if (sUpper.includes('MATH')) bankKey = 'class10_maths';
        else bankKey = 'class10_science';
      } else {
        if (sUpper.includes('PHYS')) bankKey = 'senior_physics';
        else if (sUpper.includes('CHEM')) bankKey = 'senior_chemistry';
        else if (sUpper.includes('BIO')) bankKey = 'senior_biology';
        else if (sUpper.includes('MATH')) bankKey = 'senior_mathematics';
      }

      if (!inMemoryStore.subjectBanks) inMemoryStore.subjectBanks = {};
      if (!inMemoryStore.subjectBanks[bankKey]) inMemoryStore.subjectBanks[bankKey] = [];
      if (!inMemoryStore.subjectBanks[bankKey].some(item => item.id === q.id)) {
        inMemoryStore.subjectBanks[bankKey].unshift(q);
      }
    });

    savePersistedCustomQuestions(cleanList);

    res.json({
      success: true,
      syncedCount: cleanList.length,
      message: `Persisted and hydrated ${cleanList.length} questions into backend storage.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions/import-batch - Bulk import PYQs, NCERT exercise questions, and competitive mock banks
router.post('/import-batch', (req, res) => {
  try {
    const { questions = [], source = 'Teacher Import' } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Expected an array of question objects under "questions".'
      });
    }

    const imported = [];
    const skipped = [];

    questions.forEach((q, idx) => {
      if (!q.question_latex) {
        skipped.push({ index: idx, reason: 'Missing question_latex' });
        return;
      }

      const cleanQ = {
        id: q.id || `pyq_imp_${Date.now()}_${idx + 1}`,
        grade: String(q.grade || '10'),
        subject: q.subject || 'Science',
        chapter: q.chapter || q.topic || 'General Science',
        topic: q.topic || q.chapter || 'Core',
        subtopic: q.subtopic || (q.ncert_mapping ? q.ncert_mapping.ncert_section : 'General'),
        curriculum_board: q.curriculum_board || q.board || 'CBSE',
        difficulty: q.difficulty || 'MEDIUM',
        question_type: q.question_type || 'MCQ_SINGLE',
        bloom_level: q.bloom_level || 'APPLICATION',
        question_latex: q.question_latex,
        options_latex: q.options_latex || [],
        correct_answer_latex: q.correct_answer_latex || q.correct_answer || 'B',
        solution_latex: q.solution_latex || '',
        socratic_hints: q.socratic_hints || [],
        step_rubric: q.step_rubric || [],
        ncert_mapping: q.ncert_mapping || {
          chapter_name: q.chapter || 'Chapter',
          ncert_section: q.subtopic || 'General',
          pyq_tag: q.pyq_tag || source,
          marks: q.marks || 3
        },
        benchmark_time_seconds: Number(q.benchmark_time_seconds) || 90,
        imported_at: new Date().toISOString()
      };

      inMemoryStore.questions.push(cleanQ);
      imported.push(cleanQ);
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${imported.length} questions into the HAPS-AI Question Bank.`,
      importedCount: imported.length,
      skippedCount: skipped.length,
      skipped,
      sampleQuestionId: imported[0]?.id
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// SUBJECT-WISE SPECIALIZED TABLES: CLASS 10, +1, +2 (MED & NON-MED)
// ============================================================================

// GET /api/questions/subject-banks & /api/questions/subject-banks/overview/stats - Overview of all subject tables
router.get(['/subject-banks', '/subject-banks/overview/stats'], (req, res) => {
  try {
    const banks = inMemoryStore.subjectBanks || {};
    const stats = {
      timestamp: new Date().toISOString(),
      streams: {
        FOUNDATION_CLASS_10: {
          class10_maths: {
            table: 'bank_class10_mathematics',
            name: 'Class 10 Mathematics',
            totalQuestions: (banks.class10_maths || []).length,
            targetExam: 'CBSE / HPBOSE 10th Board'
          },
          class10_math_pyq_ncert: {
            table: 'bank_class10_math_pyq_ncert',
            name: 'Class 10 Mathematics (Board PYQs + NCERT Solved Examples & Exercises + CBSE Pattern)',
            totalQuestions: (banks.class10_math_pyq_ncert || []).length,
            targetExam: 'CBSE / HPBOSE 10th Board'
          },
          class10_science: {
            table: 'bank_class10_science',
            name: 'Class 10 Science (Physics, Chemistry, Biology)',
            totalQuestions: (banks.class10_science || []).length,
            targetExam: 'CBSE / HPBOSE 10th Board'
          }
        },
        NON_MEDICAL_STREAM: {
          senior_physics: {
            table: 'bank_senior_physics',
            name: 'Senior Physics (+1 & +2)',
            totalQuestions: (banks.senior_physics || []).length,
            targetExam: 'JEE Main / Advanced / CBSE 12th'
          },
          senior_chemistry: {
            table: 'bank_senior_chemistry',
            name: 'Senior Chemistry (+1 & +2)',
            totalQuestions: (banks.senior_chemistry || []).length,
            targetExam: 'JEE Main / Advanced / CBSE 12th'
          },
          senior_mathematics: {
            table: 'bank_senior_mathematics',
            name: 'Senior Mathematics (+1 & +2)',
            totalQuestions: (banks.senior_mathematics || []).length,
            targetExam: 'JEE Main / Advanced / CBSE 12th'
          }
        },
        MEDICAL_STREAM: {
          senior_physics: {
            table: 'bank_senior_physics',
            name: 'Senior Physics (+1 & +2)',
            totalQuestions: (banks.senior_physics || []).length,
            targetExam: 'NEET UG / CBSE 12th'
          },
          senior_chemistry: {
            table: 'bank_senior_chemistry',
            name: 'Senior Chemistry (+1 & +2)',
            totalQuestions: (banks.senior_chemistry || []).length,
            targetExam: 'NEET UG / CBSE 12th'
          },
          senior_biology: {
            table: 'bank_senior_biology',
            name: 'Senior Biology: Botany & Zoology (+1 & +2)',
            totalQuestions: (banks.senior_biology || []).length,
            targetExam: 'NEET UG / CBSE 12th'
          }
        }
      },
      supportedTables: [
        'class10_maths',
        'class10_math_pyq_ncert',
        'class10_science',
        'senior_physics',
        'senior_chemistry',
        'senior_mathematics',
        'senior_biology'
      ]
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/questions/class10-math-bank - Specialized query endpoint for Class 10 Math PYQ & NCERT
router.get('/class10-math-bank', (req, res) => {
  try {
    let mathService = null;
    try {
      mathService = require('../services/class10MathQuestionBank');
    } catch (e) {
      // fallback
    }

    const banks = inMemoryStore.subjectBanks || {};
    const bank = (mathService && mathService.class10MathQuestions) || banks.class10_math_pyq_ncert || banks.class10_maths || [];
    const { chapter, source, format, difficulty, search, limit = 50, offset = 0 } = req.query;

    let filtered = [...bank];

    if (chapter) {
      if (!isNaN(chapter)) {
        const chNum = Number(chapter);
        filtered = filtered.filter(q => q.chapter_number === chNum);
      } else {
        const chLower = chapter.toLowerCase();
        filtered = filtered.filter(q => (q.chapter_name || '').toLowerCase().includes(chLower));
      }
    }

    if (source) {
      const srcUpper = source.toUpperCase();
      filtered = filtered.filter(q => (q.question_source || '').toUpperCase().includes(srcUpper) || (q.pyq_appearance || '').toUpperCase().includes(srcUpper));
    }

    if (format) {
      const fmtUpper = format.toUpperCase();
      filtered = filtered.filter(q => (q.question_format || '').toUpperCase() === fmtUpper);
    }

    if (difficulty) {
      const diffUpper = difficulty.toUpperCase();
      filtered = filtered.filter(q => (q.difficulty || '').toUpperCase() === diffUpper);
    }

    if (search && search.trim()) {
      const sLower = search.toLowerCase();
      filtered = filtered.filter(q =>
        (q.question_latex || '').toLowerCase().includes(sLower) ||
        (q.topic || '').toLowerCase().includes(sLower) ||
        (q.subtopic || '').toLowerCase().includes(sLower) ||
        (q.solution_latex || '').toLowerCase().includes(sLower)
      );
    }

    const parsedLimit = Math.max(1, Math.min(500, Number(limit) || 50));
    const parsedOffset = Math.max(0, Number(offset) || 0);
    const paginated = filtered.slice(parsedOffset, parsedOffset + parsedLimit);

    const summary = mathService && mathService.getBankSummary ? mathService.getBankSummary() : { totalQuestions: bank.length };

    res.json({
      success: true,
      totalQuestions: bank.length,
      totalBankQuestions: bank.length,
      filteredCount: filtered.length,
      limit: parsedLimit,
      offset: parsedOffset,
      summary,
      questions: paginated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/questions/subject-banks/:subjectKey - Fetch questions from specific subject table
router.get('/subject-banks/:subjectKey', (req, res) => {
  try {
    const { subjectKey } = req.params;
    const banks = inMemoryStore.subjectBanks || {};

    const aliasMap = {
      'PHYSICS': 'senior_physics',
      'SENIOR_PHYSICS': 'senior_physics',
      'CHEMISTRY': 'senior_chemistry',
      'SENIOR_CHEMISTRY': 'senior_chemistry',
      'BIOLOGY': 'senior_biology',
      'SENIOR_BIOLOGY': 'senior_biology',
      'MATHEMATICS': 'senior_mathematics',
      'SENIOR_MATHEMATICS': 'senior_mathematics',
      'CLASS10_MATHEMATICS': 'class10_math_pyq_ncert',
      'CLASS10_MATHS': 'class10_math_pyq_ncert',
      'CLASS10_SCIENCE': 'class10_science'
    };

    const targetKey = aliasMap[(subjectKey || '').toUpperCase()] || subjectKey;
    const tableData = banks[targetKey];

    if (!tableData) {
      return res.status(404).json({
        success: false,
        error: `Subject bank "${subjectKey}" not found. Valid keys: PHYSICS, CHEMISTRY, BIOLOGY, MATHEMATICS, CLASS10_MATHEMATICS, CLASS10_SCIENCE, senior_physics, senior_chemistry, senior_mathematics, senior_biology, class10_science, class10_math_pyq_ncert.`
      });
    }

    const { chapter, difficulty, targetExam, grade } = req.query;
    let filtered = [...tableData];

    if (grade && grade !== 'ALL') {
      filtered = filtered.filter(q => String(q.grade) === String(grade));
    }
    if (chapter && chapter !== 'ALL') {
      filtered = filtered.filter(q => {
        if (q.chapter_number !== undefined && String(q.chapter_number) === String(chapter)) return true;
        if (q.chapter && String(q.chapter) === String(chapter)) return true;
        if (q.chapter_name && q.chapter_name.toLowerCase().includes(String(chapter).toLowerCase())) return true;
        return false;
      });
    }
    if (difficulty && difficulty !== 'ALL') {
      filtered = filtered.filter(q => q.difficulty?.toUpperCase() === difficulty.toUpperCase());
    }
    if (targetExam && targetExam !== 'ALL') {
      filtered = filtered.filter(q => 
        (q.target_exam && q.target_exam.toLowerCase().includes(targetExam.toLowerCase())) ||
        (q.curriculum_board && q.curriculum_board.toLowerCase().includes(targetExam.toLowerCase()))
      );
    }

    res.json({
      success: true,
      subjectKey,
      tableKey: targetKey,
      count: filtered.length,
      questions: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions/subject-banks/:subjectKey/import - Import questions into specific subject table
router.post('/subject-banks/:subjectKey/import', (req, res) => {
  try {
    const { subjectKey } = req.params;
    const { questions = [], source = 'Teacher Bank Upload' } = req.body;

    const banks = inMemoryStore.subjectBanks || {};
    if (!banks[subjectKey]) {
      banks[subjectKey] = [];
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Expected non-empty "questions" array in request body.'
      });
    }

    const imported = [];
    const skipped = [];

    questions.forEach((q, idx) => {
      if (!q.question_latex) {
        skipped.push({ index: idx, reason: 'Missing question_latex' });
        return;
      }

      const cleanQ = {
        id: q.id || `${subjectKey}_${Date.now()}_${idx + 1}`,
        grade: String(q.grade || (subjectKey.startsWith('class10') ? '10' : '11')),
        stream: q.stream || (subjectKey.includes('maths') && !subjectKey.startsWith('class10') ? 'NON_MEDICAL' : (subjectKey.includes('biology') ? 'MEDICAL' : 'COMMON_SENIOR')),
        subject: q.subject || (subjectKey.includes('math') ? 'Mathematics' : (subjectKey.includes('physics') ? 'Physics' : (subjectKey.includes('chemistry') ? 'Chemistry' : (subjectKey.includes('biology') ? 'Biology' : 'Science')))),
        chapter_number: Number(q.chapter_number) || 1,
        chapter_name: q.chapter_name || q.chapter || 'Chapter Standard',
        topic: q.topic || 'Core Concept',
        subtopic: q.subtopic || 'Concept Detail',
        curriculum_board: q.curriculum_board || q.target_exam || 'CBSE',
        target_exam: q.target_exam || (subjectKey.includes('biology') ? 'NEET_UG' : (subjectKey.includes('math') && !subjectKey.startsWith('class10') ? 'JEE_MAIN' : 'CBSE')),
        difficulty: (q.difficulty || 'MEDIUM').toUpperCase(),
        question_format: q.question_format || q.question_type || 'MCQ_SINGLE',
        benchmark_time_seconds: Number(q.benchmark_time_seconds) || (subjectKey.includes('biology') ? 45 : 90),
        marks_weightage: Number(q.marks_weightage) || (subjectKey.startsWith('class10') ? 1 : 4),
        question_latex: q.question_latex,
        options_latex: q.options_latex || [],
        correct_answer_latex: q.correct_answer_latex || q.correct_answer || 'A',
        solution_latex: q.solution_latex || '',
        step_rubric: q.step_rubric || [],
        socratic_hints: q.socratic_hints || [],
        pyq_appearance: q.pyq_appearance || q.pyq_tag || source,
        imported_at: new Date().toISOString()
      };

      banks[subjectKey].push(cleanQ);
      // Also register in main store for cross-searching
      inMemoryStore.questions.push(cleanQ);
      imported.push(cleanQ);
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${imported.length} questions into "${subjectKey}" table.`,
      subjectKey,
      totalInBankNow: banks[subjectKey].length,
      importedCount: imported.length,
      skippedCount: skipped.length,
      skipped
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


