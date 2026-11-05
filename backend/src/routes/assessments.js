// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: ASSESSMENTS & TEST SUBMISSION API ROUTER
// Manages teacher assignment creation, student test delivery, sub-second telemetry
// evaluation, dynamic concept mastery breakdown, and automated weekly report updates.
// ============================================================================

const express = require('express');
const router = express.Router();
const { inMemoryStore } = require('../config/database');
const { emitEvent } = require('../kafka/producer');
const { processTelemetryEvent } = require('../kafka/consumer');
const { generateWeeklyReport } = require('../services/smartReportService');
const { getAllClass10Questions } = require('../services/class10PyqBank');
const { generateLlmQuestion } = require('../services/llmQuestionEngine');
const { EXAM_BLUEPRINTS, analyzeBankCoverage, generatePatternMatchedExam } = require('../services/examPatternAnalyzer');
const { generatePersonalizedRemedialAssignment, verifyStudentFormula } = require('../services/remedialAssignmentService');
const { generateAssignmentDocxBuffer } = require('../services/docxExportService');
const { ensureQuestionHasRichOptions } = require('../services/questionOptionEngine');
const { quizTool, testTool, assignmentTool } = require('../services/pipelineTools');
const {
  BOARD_BLUEPRINTS,
  generateBoardQuestionPaper,
  swapPaperQuestion,
  getAlternativeQuestions,
  addCustomQuestionToPaper,
  updatePaperQuestion,
  deletePaperQuestion
} = require('../services/boardPaperGeneratorService');

// 1. GET /api/assessments - List all test assignments
router.get('/', (req, res) => {
  try {
    let list = inMemoryStore.assessments || [];
    const { subject, subjectKey, section, classId, status } = req.query;
    const sKey = (subjectKey || subject || '').toUpperCase().trim();
    if (sKey) {
      list = list.filter(a => {
        const aKey = (a.subjectKey || '').toUpperCase();
        const aSub = (a.subject || '').toUpperCase();
        return aKey === sKey || aSub === sKey || aSub.includes(sKey);
      });
    }

    const secFilter = (section || classId || '').trim().toLowerCase();
    if (secFilter) {
      list = list.filter(a => {
        const aSec = (a.section || a.targetClass || '').trim().toLowerCase();
        return aSec === secFilter || aSec.includes(secFilter) || secFilter.includes(aSec);
      });
    }

    const statusFilter = (status || '').toUpperCase().trim();
    if (statusFilter) {
      list = list.filter(a => {
        const aStatus = (a.status || 'PUBLISHED').toUpperCase().trim();
        return aStatus === statusFilter;
      });
    }

    res.json({
      success: true,
      count: list.length,
      assessments: list.map(a => ({
        id: a.id,
        code: a.code || `Test ${a.id.slice(-2)}`,
        title: a.title,
        description: a.description,
        teacherName: a.teacherName,
        grade: a.grade,
        section: a.section || a.targetClass,
        targetClass: a.targetClass || a.section,
        board: a.board,
        subject: a.subject,
        chapter: a.chapter,
        topic: a.topic,
        duration: a.duration || `${a.durationMinutes || 45} Mins`,
        durationMinutes: a.durationMinutes || 45,
        totalMarks: a.totalMarks,
        questionCount: a.questions ? a.questions.length : (a.totalQuestions || 0),
        status: a.status || 'PUBLISHED',
        createdAt: a.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/assessments/:id - Fetch full assessment with questions
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const assessment = (inMemoryStore.assessments || []).find(a => a.id === id);

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    res.json({ success: true, assessment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/assessments - Teacher publishes a new test assignment
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description = '',
      teacherName = 'Er. Rajesh Kumar',
      grade = '10',
      section = 'Science-A',
      board = 'CBSE',
      subject = 'Science',
      durationMinutes = 30,
      totalMarks = 20,
      questions = []
    } = req.body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Assessment title and at least one question are required.'
      });
    }

    const newAssessment = {
      id: `asgn_${Date.now()}`,
      title,
      description,
      teacherName,
      grade,
      section,
      board,
      subject,
      durationMinutes: Number(durationMinutes) || 30,
      totalMarks: Number(totalMarks) || (questions.length * 4),
      questions: questions.map((rawQ, idx) => {
        const q = ensureQuestionHasRichOptions({ ...rawQ });
        return {
          id: q.id || `q_asgn_${Date.now()}_${idx + 1}`,
          topic: q.topic || q.chapter || 'Science Core',
          subtopic: q.subtopic || (q.ncert_mapping ? q.ncert_mapping.ncert_section : 'General'),
          grade: q.grade || grade,
          board: q.curriculum_board || board,
          question_type: q.question_type || 'MCQ_SINGLE',
          difficulty: q.difficulty || 'MEDIUM',
          benchmark_time_seconds: Number(q.benchmark_time_seconds) || 90,
          question_latex: q.question_latex,
          options_latex: q.options_latex || [],
          correct_answer: q.correct_answer || q.correct_answer_latex || 'A',
          solution_latex: q.solution_latex || '',
          socratic_hints: q.socratic_hints || [],
          ncert_mapping: q.ncert_mapping || null,
          step_rubric: q.step_rubric || []
        };
      }),
      createdAt: new Date().toISOString()
    };

    if (!inMemoryStore.assessments) inMemoryStore.assessments = [];
    inMemoryStore.assessments.unshift(newAssessment);

    // Emit event to Kafka stream
    await emitEvent('assessment.published', newAssessment.id, {
      title: newAssessment.title,
      grade: newAssessment.grade,
      teacher: newAssessment.teacherName,
      questionCount: newAssessment.questions.length
    });

    res.status(201).json({
      success: true,
      message: 'Assessment published successfully to class roster.',
      assessment: newAssessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/assessments/:id/submit - Student submits test, generates telemetry & diagnostics
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      studentId = 'b0000000-0000-0000-0000-000000000001',
      studentName = 'Aryan Sharma',
      answers = []
    } = req.body;

    const assessment = (inMemoryStore.assessments || []).find(a => a.id === id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    let totalScore = 0;
    const totalMarks = assessment.totalMarks || (assessment.questions.length * 4);
    const questionBreakdown = [];
    let totalTimeSpent = 0;

    let normalizedAnswers = [];
    if (Array.isArray(answers)) {
      normalizedAnswers = answers;
    } else if (answers && typeof answers === 'object') {
      normalizedAnswers = Object.entries(answers).map(([k, v]) => {
        if (typeof v === 'object' && v !== null) return { questionIndex: Number(k), ...v };
        return { questionIndex: Number(k), selectedOption: String(v) };
      });
    }

    // Evaluate each question
    for (let i = 0; i < assessment.questions.length; i++) {
      const q = assessment.questions[i];
      const studentAns = normalizedAnswers.find(a => a.questionId === q.id || a.questionIndex === (i + 1)) || normalizedAnswers[i] || {};
      const selected = studentAns.selectedOption || null;
      const timeSpent = Number(studentAns.timeSpentSeconds) || 45;
      const hesitation = Number(studentAns.hesitationSeconds) || 8;
      const hintsUsed = Number(studentAns.hintsUsed) || 0;
      totalTimeSpent += timeSpent;

      const expectedAnswer = (q.correct_answer || q.correct_answer_latex || 'B').trim();
      const isCorrect = selected && selected.trim() === expectedAnswer;

      const marksForQ = isCorrect ? 4.0 : (selected ? -1.0 : 0.0);
      totalScore = Math.max(0, totalScore + marksForQ);

      const benchmark = q.benchmark_time_seconds || 90;
      let category = 'FAST_ACCURATE';
      if (isCorrect) {
        category = timeSpent > (benchmark * 1.3) ? 'SLOW_ACCURATE' : 'FAST_ACCURATE';
      } else {
        category = timeSpent > (benchmark * 1.3) ? 'SLOW_MISCONCEPTION' : 'FAST_CARELESS_SLIP';
      }

      // Record Telemetry Event
      const telemetryPayload = {
        action: 'QuestionTelemetryRecorded',
        studentId,
        questionId: q.id,
        assessmentId: id,
        timeSpentSeconds: timeSpent,
        hesitationSeconds: hesitation,
        attemptStatus: isCorrect ? 'CORRECT' : 'INCORRECT',
        selectedOption: selected,
        topic: q.topic || 'Science',
        subtopic: q.subtopic || 'General',
        benchmarkSeconds: benchmark,
        hintsUsed,
        category
      };

      // Emit to Kafka & update local concept mastery
      const event = await emitEvent('telemetry.question-timer', studentId, telemetryPayload);
      processTelemetryEvent(event);

      inMemoryStore.telemetry.push({
        id: `tel_${Date.now()}_${i}`,
        ...telemetryPayload,
        recordedAt: new Date().toISOString()
      });

      questionBreakdown.push({
        questionIndex: i + 1,
        questionId: q.id,
        subtopic: q.subtopic || q.topic || assessment.chapterName || 'General',
        topic: q.topic || assessment.chapterName || assessment.subject || 'General',
        subject: assessment.subject || 'Biology',
        selectedOption: selected,
        correctAnswer: expectedAnswer,
        isCorrect,
        timeSpentSeconds: timeSpent,
        benchmarkSeconds: benchmark,
        category,
        marksAwarded: marksForQ
      });
    }

    const percentage = Math.round((totalScore / totalMarks) * 100);

    // Dynamic Concept Classification for this student
    const studentMastery = inMemoryStore.conceptMastery.filter(m => m.student_id === studentId);
    const mastered = studentMastery.filter(m => m.mastery_status === 'MASTERED');
    const recap = studentMastery.filter(m => m.mastery_status === 'NEEDS_RECAP');
    const weak = studentMastery.filter(m => m.mastery_status === 'CRITICAL_WEAKNESS');

    // Automatically regenerate Weekly Smart Report with fresh diagnostic data
    const updatedReport = await generateWeeklyReport(studentId);
    inMemoryStore.weeklyReports.unshift(updatedReport);

    // Save to inMemoryStore.submissions for real-time teacher classroom analytics
    if (!inMemoryStore.submissions) inMemoryStore.submissions = [];
    const studentUser = (inMemoryStore.users || []).find(u => u.id === studentId);
    const submissionRecord = {
      submissionId: `sub_${id}_${studentId}_${Date.now()}`,
      assessmentId: id,
      assessmentTitle: assessment.title,
      subject: assessment.subject || 'Biology',
      subjectKey: assessment.subjectKey || 'BIOLOGY',
      chapterName: assessment.chapterName || '',
      studentId,
      studentName: studentName || studentUser?.full_name || ((assessment.subjectKey === 'BIOLOGY' || assessment.subject === 'Biology') ? 'Ananya Thakur' : 'Aryan Sharma'),
      rollNumber: studentUser?.roll_number || ((assessment.subjectKey === 'BIOLOGY' || assessment.subject === 'Biology') ? '12-M-01' : '12-NM-01'),
      grade: assessment.grade || '12',
      section: assessment.section || ((assessment.subjectKey === 'BIOLOGY' || assessment.subject === 'Biology') ? '12-Med' : '12-NonMed'),
      totalScore,
      totalMarks,
      percentage,
      totalTimeSpentSeconds: totalTimeSpent,
      smartCardSummary: `Scored ${percentage}% on ${assessment.title} (${assessment.subject || 'Science'}). Mastered ${mastered.length} subtopics, needs recap on ${recap.length}, critical weakness on ${weak.length}.`,
      questionBreakdown: questionBreakdown.map(qb => {
        let errorType = 'NONE';
        if (!qb.isCorrect) {
          errorType = qb.timeSpentSeconds > (qb.benchmarkSeconds * 1.5) ? 'TIME_PRESSURE' : 'CONCEPTUAL';
        }
        return {
          ...qb,
          mistakeClassification: {
            type: errorType,
            label: qb.isCorrect ? 'Correct Execution' : (errorType === 'TIME_PRESSURE' ? 'Time Pressure Hesitation' : 'Conceptual Error'),
            explanation: qb.isCorrect ? 'Accurate problem solution.' : 'Error in formula or concept execution.'
          }
        };
      }),
      submittedAt: new Date().toISOString()
    };
    inMemoryStore.submissions.unshift(submissionRecord);

    // 4. Generate Personalized Remedial Assignment based on exact questions missed & formulas
    // STRICT CONTEXT: Preserves subject, subjectKey, grade, and chapterName!
    const personalizedAssignment = generatePersonalizedRemedialAssignment({
      studentId,
      studentName: studentName || studentUser?.full_name || ((assessment.subjectKey === 'BIOLOGY' || assessment.subject === 'Biology') ? 'Ananya Thakur' : 'Aryan Sharma'),
      rollNumber: studentUser?.roll_number || ((assessment.subjectKey === 'BIOLOGY' || assessment.subject === 'Biology') ? '12-M-01' : '11-S-24'),
      assessmentId: id,
      assessmentTitle: assessment.title,
      subject: assessment.subject || 'Biology',
      subjectKey: assessment.subjectKey || 'BIOLOGY',
      grade: assessment.grade || '12',
      chapterName: assessment.chapterName || '',
      questionBreakdown
    });

    if (!inMemoryStore.remedialAssignments) inMemoryStore.remedialAssignments = [];
    inMemoryStore.remedialAssignments.unshift(personalizedAssignment);

    res.json({
      success: true,
      message: 'Test submitted and evaluated with sub-second diagnostic classification.',
      results: {
        assessmentId: id,
        assessmentTitle: assessment.title,
        subject: assessment.subject || 'Biology',
        subjectKey: assessment.subjectKey || 'BIOLOGY',
        chapterName: assessment.chapterName || '',
        studentId,
        studentName,
        totalQuestions: assessment.questions.length,
        totalScore,
        totalMarks,
        percentage,
        totalTimeSpentSeconds: totalTimeSpent,
        questionBreakdown,
        diagnosticMatrix: {
          masteredCount: mastered.length,
          recapCount: recap.length,
          weakCount: weak.length,
          mastered: mastered.map(m => m.subtopic),
          recap: recap.map(m => m.subtopic),
          weak: weak.map(m => m.subtopic)
        },
        weeklyReportId: updatedReport.id,
        personalizedAssignment
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4a. GET /api/assessments/remedial/:id - Fetch personalized remedial assignment
router.get('/remedial/:id', (req, res) => {
  try {
    const { id } = req.params;
    const assignments = inMemoryStore.remedialAssignments || [];
    const found = assignments.find(a => a.assignmentId === id);
    if (!found) {
      if (assignments.length > 0) return res.json({ success: true, assignment: assignments[0] });
      return res.status(404).json({ success: false, error: 'Remedial assignment not found' });
    }
    res.json({ success: true, assignment: found });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4b. POST /api/assessments/remedial/verify-formula - Verify student formula input with LaTeX feedback
router.post('/remedial/verify-formula', (req, res) => {
  try {
    const { subtopic = 'Verhulst-Pearl Logistic Growth Equation', formulaInput, studentInput, subject = 'Biology' } = req.body;
    const input = formulaInput || studentInput || '';
    const evaluation = verifyStudentFormula(subtopic, input, subject);
    res.json({ success: true, ...evaluation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4c. POST /api/assessments/remedial/generate - Generate on-demand personalized remedial assignment
router.post('/remedial/generate', (req, res) => {
  try {
    const {
      studentId = 'b0000000-0000-0000-0000-000000000001',
      studentName = 'Aryan Sharma',
      rollNumber = '11-S-24',
      assessmentId = 'asgn_01',
      assessmentTitle = 'Classroom Assessment',
      subject = 'Biology',
      subjectKey = 'BIOLOGY',
      grade = '12',
      chapterName = '',
      questionBreakdown = []
    } = req.body;

    const assignment = generatePersonalizedRemedialAssignment({
      studentId,
      studentName,
      rollNumber,
      assessmentId,
      assessmentTitle,
      subject,
      subjectKey,
      grade,
      chapterName,
      questionBreakdown
    });

    if (!inMemoryStore.remedialAssignments) inMemoryStore.remedialAssignments = [];
    inMemoryStore.remedialAssignments.unshift(assignment);

    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4c-1. Pipeline Tool Endpoints: quizTool, testTool, assignmentTool
router.post('/tools/quiz', async (req, res) => {
  try {
    const quiz = await quizTool.createQuiz(req.body);
    res.status(201).json({ success: true, tool: 'quizTool', quiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tools/test', async (req, res) => {
  try {
    const test = await testTool.createTest(req.body);
    res.status(201).json({ success: true, tool: 'testTool', test });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/tools/remedial', (req, res) => {
  try {
    const remedial = assignmentTool.generateRemedialAssignment(req.body);
    if (!inMemoryStore.remedialAssignments) inMemoryStore.remedialAssignments = [];
    inMemoryStore.remedialAssignments.unshift(remedial);
    res.status(201).json({ success: true, tool: 'assignmentTool', remedial });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4d. POST /api/assessments/remedial/export-docx - Export personalized remedial assignment as plain Microsoft Word (.docx)
router.post('/remedial/export-docx', async (req, res) => {
  try {
    const payload = req.body.assignment || req.body;
    const studentName = payload.studentName || 'Student';
    const filename = `HAPS_Remedial_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`;
    const docxBuffer = await generateAssignmentDocxBuffer(payload);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', docxBuffer.length);
    res.send(docxBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4e. POST /api/assessments/export-docx - Export any test / quiz / worksheet as plain Microsoft Word (.docx)
router.post('/export-docx', async (req, res) => {
  try {
    const payload = req.body.assessment || req.body;
    const title = payload.title || 'Assignment';
    const filename = `HAPS_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`;
    const docxBuffer = await generateAssignmentDocxBuffer(payload);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', docxBuffer.length);
    res.send(docxBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4f. GET /api/assessments/:id/export-docx - Download test / remedial assignment by ID as Word document (.docx)
router.get('/:id/export-docx', async (req, res) => {
  try {
    const { id } = req.params;
    const all = [
      ...(inMemoryStore.assessments || []),
      ...(inMemoryStore.remedialAssignments || [])
    ];
    const found = all.find(a => a.id === id || a.assignmentId === id);
    if (!found) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }
    const title = found.title || 'Assignment';
    const filename = `HAPS_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`;
    const docxBuffer = await generateAssignmentDocxBuffer(found);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', docxBuffer.length);
    res.send(docxBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/assessments/auto-generate - 1-Click Auto-Generate Competitive Exam / Board Quiz
router.post('/auto-generate', async (req, res) => {
  try {
    const {
      examType = 'JEE_MAIN',
      grade = '10',
      subject = 'Science',
      questionCount = 5,
      targetSection = '10-Science-A',
      title = null
    } = req.body;

    const count = Math.min(30, Math.max(1, Number(questionCount) || 5));
    const selectedQuestions = [];

    // 1. Gather matching questions from NCERT PYQ bank & in-memory store
    const pyqs = getAllClass10Questions().filter(q => 
      q.subject.toLowerCase() === subject.toLowerCase() || subject === 'ALL'
    );
    const storeQuestions = (inMemoryStore.questions || []).filter(q =>
      (String(q.grade) === String(grade) || !q.grade) &&
      (q.subject?.toLowerCase() === subject.toLowerCase() || q.topic?.toLowerCase().includes(subject.toLowerCase()))
    );

    const combinedPool = [...pyqs, ...storeQuestions];
    
    // Deduplicate by question_latex
    const seen = new Set();
    const uniquePool = [];
    combinedPool.forEach(q => {
      if (!seen.has(q.question_latex)) {
        seen.add(q.question_latex);
        uniquePool.push(q);
      }
    });

    // Shuffle pool
    const shuffled = uniquePool.sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      selectedQuestions.push(shuffled[i]);
    }

    // 2. If more questions needed, generate dynamically via LLM Engine
    if (selectedQuestions.length < count) {
      const remaining = count - selectedQuestions.length;
      console.log(`[ASSESSMENT AUTO-GEN] Generating ${remaining} supplementary questions via LLM Engine...`);
      for (let j = 0; j < remaining; j++) {
        try {
          const freshQ = await generateLlmQuestion({
            grade,
            subject,
            chapter: j % 2 === 0 ? 'Light – Reflection and Refraction' : 'Electricity',
            board: examType === 'HP_BOARDS' ? 'HP_BOARD' : (examType === 'CBSE_BOARDS' ? 'CBSE' : 'JEE_MAIN'),
            difficulty: examType === 'OLYMPIAD' ? 'OLYMPIAD_LEVEL' : (examType.includes('JEE') ? 'HARD' : 'MEDIUM'),
            questionType: examType.includes('JEE') || examType.includes('NEET') ? 'MCQ_SINGLE' : 'NUMERICAL',
            provider: 'auto'
          });
          if (freshQ && freshQ.question_latex) {
            selectedQuestions.push(freshQ);
          }
        } catch (e) {
          console.warn('[ASSESSMENT AUTO-GEN] LLM supplementary generation fallback:', e.message);
        }
      }
    }

    const testTitle = title || `${grade === '10' ? 'Class 10' : 'Class 11'} ${subject} ${examType.replace(/_/g, ' ')} Auto-Diagnostic Quiz`;
    const durationMinutes = Math.max(15, count * 3);
    const totalMarks = count * 4;

    const newAssessment = {
      id: `asgn_auto_${Date.now()}`,
      title: testTitle,
      description: `Auto-generated ${examType} competitive assessment with ${selectedQuestions.length} curated questions.`,
      teacherName: 'HAPS-AI Auto-Examiner',
      grade: String(grade),
      section: targetSection,
      board: examType,
      subject,
      durationMinutes,
      totalMarks,
      questions: selectedQuestions.map((rawQ, idx) => {
        const q = ensureQuestionHasRichOptions({ ...rawQ });
        return {
          id: q.id || `q_auto_${Date.now()}_${idx + 1}`,
          topic: q.topic || q.chapter || 'Science Core',
          subtopic: q.subtopic || (q.ncert_mapping ? q.ncert_mapping.ncert_section : 'Standard'),
          grade: q.grade || grade,
          board: q.curriculum_board || examType,
          question_type: q.question_type || 'MCQ_SINGLE',
          difficulty: q.difficulty || 'MEDIUM',
          benchmark_time_seconds: Number(q.benchmark_time_seconds) || 90,
          question_latex: q.question_latex,
          options_latex: q.options_latex || [],
          correct_answer: q.correct_answer || q.correct_answer_latex || 'A',
          solution_latex: q.solution_latex || '',
          socratic_hints: q.socratic_hints || [],
          ncert_mapping: q.ncert_mapping || null,
          step_rubric: q.step_rubric || []
        };
      }),
      createdAt: new Date().toISOString()
    };

    if (!inMemoryStore.assessments) inMemoryStore.assessments = [];
    inMemoryStore.assessments.unshift(newAssessment);

    // Emit event to Kafka stream
    await emitEvent('assessment.published', newAssessment.id, {
      title: newAssessment.title,
      examType,
      grade: newAssessment.grade,
      questionCount: newAssessment.questions.length
    });

    res.status(201).json({
      success: true,
      message: `Auto-generated ${examType} test paper with ${newAssessment.questions.length} questions.`,
      assessment: newAssessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 5B. TEACHER UNIT TEST CREATOR: MARKS-DISTRIBUTED DRAFT GENERATOR & CUSTOMIZER
// ============================================================================

// POST /api/assessments/unit-test/generate-draft - Assemble draft test with marks breakdown
router.post('/unit-test/generate-draft', (req, res) => {
  try {
    const {
      title,
      subject = 'Physics',
      grade = '12',
      section = '12-NonMed',
      chapter,
      topic,
      durationMinutes = 45,
      marksBreakdown = {},
      teacherName = 'Dr. Vikram Sharma'
    } = req.body;

    const count1M = Math.max(0, parseInt(marksBreakdown.count1M ?? 5, 10));
    const count2M = Math.max(0, parseInt(marksBreakdown.count2M ?? 3, 10));
    const count3M = Math.max(0, parseInt(marksBreakdown.count3M ?? 3, 10));
    const count5M = Math.max(0, parseInt(marksBreakdown.count5M ?? 1, 10));

    const totalQuestions = count1M + count2M + count3M + count5M;
    const totalMarks = (count1M * 1) + (count2M * 2) + (count3M * 3) + (count5M * 5);

    if (totalQuestions === 0) {
      return res.status(400).json({ success: false, error: 'Please specify at least 1 question across marks breakdown.' });
    }

    const sUpper = (subject || '').toUpperCase();
    const isC10 = String(grade) === '10';
    let bankKey = 'senior_physics';
    if (isC10) {
      bankKey = sUpper.includes('MATH') ? 'class10_maths' : 'class10_science';
    } else {
      if (sUpper.includes('PHYS')) bankKey = 'senior_physics';
      else if (sUpper.includes('CHEM')) bankKey = 'senior_chemistry';
      else if (sUpper.includes('BIO')) bankKey = 'senior_biology';
      else if (sUpper.includes('MATH')) bankKey = 'senior_mathematics';
    }

    const allBankQuestions = (inMemoryStore.subjectBanks && inMemoryStore.subjectBanks[bankKey]) ? inMemoryStore.subjectBanks[bankKey] : [];

    let candidatePool = allBankQuestions;
    if (chapter) {
      const chClean = chapter.toLowerCase().replace(/chapter\s*[0-9]+:?/i, '').trim();
      const chapterMatches = allBankQuestions.filter(q => {
        const qCh = (q.chapter_name || q.chapter || '').toLowerCase();
        return qCh.includes(chClean) || chClean.includes(qCh);
      });
      if (chapterMatches.length > 0) {
        candidatePool = chapterMatches;
      }
    }

    const selectedQuestions = [];
    const usedIds = new Set();

    const pickQuestionsForMarks = (targetMarks, neededCount, typeLabel) => {
      if (neededCount <= 0) return;
      const exact = candidatePool.filter(q => !usedIds.has(q.id) && Number(q.marks_weightage || q.marks || 1) === targetMarks);
      for (const q of exact) {
        if (selectedQuestions.length >= totalQuestions) break;
        usedIds.add(q.id);
        selectedQuestions.push({
          ...q,
          marks: targetMarks,
          marks_weightage: targetMarks,
          typeLabel
        });
        if (selectedQuestions.filter(sq => sq.marks === targetMarks).length >= neededCount) break;
      }

      const currentOfThisMark = selectedQuestions.filter(sq => sq.marks === targetMarks).length;
      if (currentOfThisMark < neededCount) {
        const remaining = candidatePool.filter(q => !usedIds.has(q.id));
        for (const q of remaining) {
          usedIds.add(q.id);
          selectedQuestions.push({
            ...q,
            marks: targetMarks,
            marks_weightage: targetMarks,
            typeLabel
          });
          if (selectedQuestions.filter(sq => sq.marks === targetMarks).length >= neededCount) break;
        }
      }
    };

    pickQuestionsForMarks(1, count1M, '1 Mark (Objective/MCQ)');
    pickQuestionsForMarks(2, count2M, '2 Marks (Short Conceptual)');
    pickQuestionsForMarks(3, count3M, '3 Marks (Numerical/Reasoning)');
    pickQuestionsForMarks(5, count5M, '5 Marks (Long Derivation/Problem)');

    const formattedQuestions = selectedQuestions.map((q, idx) => ({
      id: q.id || `q_test_${Date.now()}_${idx + 1}`,
      questionIndex: idx + 1,
      marks: q.marks || 1,
      marks_weightage: q.marks || 1,
      typeLabel: q.typeLabel || `${q.marks} Mark${q.marks > 1 ? 's' : ''}`,
      topic: q.topic || topic || chapter || 'Curriculum Focus',
      subtopic: q.subtopic || 'Core Concept',
      chapter_name: q.chapter_name || chapter || 'Main Chapter',
      question_latex: q.question_latex || q.questionText || `Question ${idx + 1}`,
      options_latex: q.options_latex || q.options || [],
      correct_answer: q.correct_answer || q.correct_answer_latex || 'A',
      correct_answer_latex: q.correct_answer_latex || q.correct_answer || 'A',
      solution_latex: q.solution_latex || '',
      socratic_hints: q.socratic_hints || []
    }));

    const testId = `test_unit_${Date.now()}`;
    const testCode = `Test ${String((inMemoryStore.assessments || []).length + 1).padStart(2, '0')}`;
    const finalTitle = title || `${chapter || subject} Assessment (${totalMarks} Marks)`;

    const newAssessment = {
      id: testId,
      code: testCode,
      title: finalTitle,
      chapter: chapter || 'Unit Assessment',
      topic: topic || chapter || 'Core Syllabus',
      targetClass: section,
      grade: String(grade),
      section: section,
      subject: subject,
      subjectKey: bankKey,
      duration: `${durationMinutes} Mins`,
      durationMinutes: Number(durationMinutes),
      totalMarks: totalMarks,
      totalQuestions: formattedQuestions.length,
      marksBreakdown: { count1M, count2M, count3M, count5M },
      status: 'DRAFT', // Unpublished by default!
      teacherName: teacherName,
      questions: formattedQuestions,
      createdAt: new Date().toISOString()
    };

    if (!inMemoryStore.assessments) inMemoryStore.assessments = [];
    inMemoryStore.assessments.unshift(newAssessment);

    res.status(201).json({
      success: true,
      message: 'Draft assessment assembled. Ready for teacher preview & custom question edits.',
      assessment: newAssessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments/:id/publish - Set status to PUBLISHED so class students can see and take test
router.post('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = (inMemoryStore.assessments || []).find(a => a.id === id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: `Assessment "${id}" not found.` });
    }

    assessment.status = 'PUBLISHED';
    assessment.publishedAt = new Date().toISOString();

    // Emit event to Kafka/Telemetry
    try {
      await emitEvent('assessment.published', assessment.id, {
        title: assessment.title,
        grade: assessment.grade,
        section: assessment.section || assessment.targetClass,
        questionCount: assessment.questions ? assessment.questions.length : 0
      });
    } catch (e) {}

    res.json({
      success: true,
      message: `Test "${assessment.title}" is now published to ${assessment.section || assessment.targetClass}!`,
      assessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments/:id/swap-question - Swap question in assessment
router.post('/:id/swap-question', (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex, newQuestionId } = req.body;
    const assessment = (inMemoryStore.assessments || []).find(a => a.id === id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: `Assessment "${id}" not found.` });
    }

    const qIdx = parseInt(questionIndex, 10) - 1;
    if (qIdx < 0 || qIdx >= (assessment.questions || []).length) {
      return res.status(400).json({ success: false, error: 'Invalid questionIndex.' });
    }

    const currentQ = assessment.questions[qIdx];
    const targetMarks = Number(currentQ.marks || 1);
    const bankKey = assessment.subjectKey || 'senior_physics';
    const bankPool = (inMemoryStore.subjectBanks && inMemoryStore.subjectBanks[bankKey]) ? inMemoryStore.subjectBanks[bankKey] : [];

    const existingIds = new Set((assessment.questions || []).map(q => q.id));

    let replacement = null;
    if (newQuestionId) {
      replacement = bankPool.find(q => q.id === newQuestionId);
    }
    if (!replacement) {
      // Find candidate with same marks
      replacement = bankPool.find(q => !existingIds.has(q.id) && Number(q.marks_weightage || q.marks || 1) === targetMarks);
    }
    if (!replacement) {
      replacement = bankPool.find(q => !existingIds.has(q.id));
    }

    if (!replacement) {
      return res.status(400).json({ success: false, error: 'No alternative questions available to swap.' });
    }

    const swapped = {
      ...replacement,
      id: replacement.id || `q_swap_${Date.now()}`,
      questionIndex: qIdx + 1,
      marks: targetMarks,
      marks_weightage: targetMarks,
      typeLabel: currentQ.typeLabel || `${targetMarks} Marks`,
      question_latex: replacement.question_latex,
      options_latex: replacement.options_latex || [],
      correct_answer: replacement.correct_answer || replacement.correct_answer_latex || 'A',
      correct_answer_latex: replacement.correct_answer_latex || replacement.correct_answer || 'A',
      solution_latex: replacement.solution_latex || ''
    };

    assessment.questions[qIdx] = swapped;

    res.json({
      success: true,
      message: `Question ${qIdx + 1} swapped successfully.`,
      swappedQuestion: swapped,
      assessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments/:id/delete-question - Delete question from assessment
router.post('/:id/delete-question', (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex } = req.body;
    const assessment = (inMemoryStore.assessments || []).find(a => a.id === id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: `Assessment "${id}" not found.` });
    }

    const qIdx = parseInt(questionIndex, 10) - 1;
    if (qIdx < 0 || qIdx >= (assessment.questions || []).length) {
      return res.status(400).json({ success: false, error: 'Invalid questionIndex.' });
    }

    if (assessment.questions.length <= 1) {
      return res.status(400).json({ success: false, error: 'Assessment must contain at least 1 question.' });
    }

    const deletedQ = assessment.questions.splice(qIdx, 1)[0];
    assessment.questions.forEach((q, idx) => { q.questionIndex = idx + 1; });
    assessment.totalQuestions = assessment.questions.length;
    assessment.totalMarks = assessment.questions.reduce((sum, q) => sum + Number(q.marks || 1), 0);

    res.json({
      success: true,
      message: `Question ${qIdx + 1} deleted.`,
      deletedQuestion: deletedQ,
      assessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments/:id/add-question - Add question to assessment
router.post('/:id/add-question', (req, res) => {
  try {
    const { id } = req.params;
    const { marks = 2, customQuestion } = req.body;
    const assessment = (inMemoryStore.assessments || []).find(a => a.id === id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: `Assessment "${id}" not found.` });
    }

    let addedQ = null;
    const targetMarks = Number(marks || 2);
    if (customQuestion && customQuestion.question_latex) {
      addedQ = {
        id: `q_custom_${Date.now()}`,
        questionIndex: assessment.questions.length + 1,
        marks: targetMarks,
        marks_weightage: targetMarks,
        typeLabel: `${targetMarks} Mark${targetMarks > 1 ? 's' : ''}`,
        topic: customQuestion.topic || assessment.topic,
        chapter_name: customQuestion.chapter_name || assessment.chapter,
        question_latex: customQuestion.question_latex,
        options_latex: customQuestion.options_latex || [],
        correct_answer: customQuestion.correct_answer || 'A',
        correct_answer_latex: customQuestion.correct_answer || 'A',
        solution_latex: customQuestion.solution_latex || ''
      };
    } else {
      const bankKey = assessment.subjectKey || 'senior_physics';
      const bankPool = (inMemoryStore.subjectBanks && inMemoryStore.subjectBanks[bankKey]) ? inMemoryStore.subjectBanks[bankKey] : [];
      const existingIds = new Set((assessment.questions || []).map(q => q.id));
      const candidate = bankPool.find(q => !existingIds.has(q.id) && Number(q.marks_weightage || q.marks || 1) === targetMarks) || bankPool.find(q => !existingIds.has(q.id));

      if (!candidate) {
        return res.status(400).json({ success: false, error: 'No available question found to add.' });
      }

      addedQ = {
        ...candidate,
        id: candidate.id || `q_add_${Date.now()}`,
        questionIndex: assessment.questions.length + 1,
        marks: targetMarks,
        marks_weightage: targetMarks,
        typeLabel: `${targetMarks} Mark${targetMarks > 1 ? 's' : ''}`,
        question_latex: candidate.question_latex,
        options_latex: candidate.options_latex || [],
        correct_answer: candidate.correct_answer || candidate.correct_answer_latex || 'A',
        correct_answer_latex: candidate.correct_answer_latex || candidate.correct_answer || 'A',
        solution_latex: candidate.solution_latex || ''
      };
    }

    assessment.questions.push(addedQ);
    assessment.totalQuestions = assessment.questions.length;
    assessment.totalMarks = assessment.questions.reduce((sum, q) => sum + Number(q.marks || 1), 0);

    res.json({
      success: true,
      message: `Question added (${targetMarks} Marks).`,
      addedQuestion: addedQ,
      assessment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 6. AI PATTERN-MATCHED EXAM GENERATION (JEE MAIN, NEET, CBSE & HP BOARD)
// ============================================================================

// GET /api/assessments/pattern-exam/blueprints - List official exam blueprints
router.get('/pattern-exam/blueprints', (req, res) => {
  try {
    const list = Object.keys(EXAM_BLUEPRINTS).map(k => ({
      id: k,
      name: EXAM_BLUEPRINTS[k].name,
      grade: EXAM_BLUEPRINTS[k].grade,
      stream: EXAM_BLUEPRINTS[k].stream,
      subjects: EXAM_BLUEPRINTS[k].subjects,
      markingScheme: EXAM_BLUEPRINTS[k].markingScheme,
      defaultBenchmarkSeconds: EXAM_BLUEPRINTS[k].defaultBenchmarkSeconds,
      sections: EXAM_BLUEPRINTS[k].sections,
      highYieldTopics: EXAM_BLUEPRINTS[k].highYieldTopics
    }));
    res.json({ success: true, count: list.length, blueprints: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments/pattern-exam/analyze - AI Pattern Analysis of question bank
router.post('/pattern-exam/analyze', (req, res) => {
  try {
    const { blueprintId = 'JEE_MAIN_NON_MED' } = req.body;
    const blueprint = EXAM_BLUEPRINTS[blueprintId];
    if (!blueprint) {
      return res.status(404).json({
        success: false,
        error: `Unknown blueprint "${blueprintId}". Available: ${Object.keys(EXAM_BLUEPRINTS).join(', ')}`
      });
    }

    const banks = inMemoryStore.subjectBanks || {};
    const allQuestions = [];
    Object.values(banks).forEach(arr => {
      if (Array.isArray(arr)) allQuestions.push(...arr);
    });

    const analysis = analyzeBankCoverage(blueprintId, allQuestions);
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/assessments/pattern-exam/generate - 1-Click AI Pattern Exam Paper Generator
router.post('/pattern-exam/generate', async (req, res) => {
  try {
    const {
      blueprintId = 'JEE_MAIN_NON_MED',
      mode = 'QUICK_DIAGNOSTIC', // 'QUICK_DIAGNOSTIC' (6-12 Qs) or 'FULL_MOCK' (30-90 Qs)
      targetSection = '11-Science-A',
      title = null
    } = req.body;

    const blueprint = EXAM_BLUEPRINTS[blueprintId];
    if (!blueprint) {
      return res.status(404).json({
        success: false,
        error: `Invalid blueprintId. Choose from: ${Object.keys(EXAM_BLUEPRINTS).join(', ')}`
      });
    }

    const generatedExam = await generatePatternMatchedExam({
      blueprintId,
      mode,
      subjectBank: inMemoryStore.subjectBanks || {},
      title,
      targetSection
    });

    if (!inMemoryStore.assessments) inMemoryStore.assessments = [];
    inMemoryStore.assessments.unshift(generatedExam);

    // Emit event to telemetry / event stream
    await emitEvent('assessment.published', generatedExam.id, {
      title: generatedExam.title,
      examType: blueprintId,
      stream: generatedExam.stream,
      grade: generatedExam.grade,
      questionCount: generatedExam.questions.length,
      totalMarks: generatedExam.totalMarks
    });

    res.status(201).json({
      success: true,
      message: `Successfully synthesized ${blueprint.name} test paper matching the official exam pattern.`,
      exam: generatedExam
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// BOARD QUESTION PAPER GENERATOR & TEACHER CUSTOMIZER API ENDPOINTS
// ============================================================================

// Global cache for live board paper customization sessions
if (!inMemoryStore.generatedBoardPapers) {
  inMemoryStore.generatedBoardPapers = {};
}

// 1. GET /api/assessments/board-paper/blueprints - List available CBSE & HP Board blueprints
router.get('/board-paper/blueprints', (req, res) => {
  try {
    const list = Object.values(BOARD_BLUEPRINTS).map(b => ({
      blueprintId: b.blueprintId,
      board: b.board,
      grade: b.grade,
      subject: b.subject,
      title: b.title,
      totalMarks: b.totalMarks,
      timeAllowedHours: b.timeAllowedHours,
      sectionsCount: b.sections.length
    }));
    res.json({ success: true, blueprints: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/assessments/board-paper/generate - Generate full-length board paper
router.post('/board-paper/generate', async (req, res) => {
  try {
    const {
      board = 'CBSE',
      grade = '12',
      subject = 'Physics',
      schoolName = 'HIM ACADEMY PUBLIC SCHOOL (HAPS)',
      academicYear = '2025–26',
      customTitle = null
    } = req.body;

    const paper = generateBoardQuestionPaper({
      board,
      grade,
      subject,
      schoolName,
      academicYear,
      customTitle
    });

    inMemoryStore.generatedBoardPapers[paper.id] = paper;

    // Also register into general assessments pool for student access
    if (!inMemoryStore.assessments) inMemoryStore.assessments = [];
    const allQuestionsFlat = [];
    paper.sections.forEach(s => allQuestionsFlat.push(...s.questions));
    inMemoryStore.assessments.unshift({
      id: paper.id,
      title: paper.title,
      description: `Official ${paper.board} Board Examination (${paper.totalMarks} Marks, ${paper.timeAllowedHours} Hours)`,
      teacherName: 'HAPS Senior Board Faculty',
      grade: paper.grade,
      section: `${paper.grade}-Board-Prep`,
      board: paper.board,
      subject: paper.subject,
      durationMinutes: paper.timeAllowedMinutes,
      totalMarks: paper.totalMarks,
      questions: allQuestionsFlat,
      paperStructure: paper,
      createdAt: paper.createdAt
    });

    res.status(201).json({
      success: true,
      message: `Generated full-length ${paper.board} Board Question Paper for ${paper.subject} (${paper.totalMarks} Marks, ${paper.totalQuestions} Questions).`,
      paper
    });
  } catch (err) {
    console.error('[BOARD PAPER GENERATE ERROR]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/assessments/board-paper/:id - Fetch generated paper with full sections
router.get('/board-paper/:id', (req, res) => {
  try {
    const { id } = req.params;
    let paper = inMemoryStore.generatedBoardPapers[id];

    if (!paper) {
      const asgn = (inMemoryStore.assessments || []).find(a => a.id === id);
      if (asgn && asgn.paperStructure) paper = asgn.paperStructure;
    }

    if (!paper) {
      return res.status(404).json({ success: false, error: 'Question paper not found.' });
    }

    res.json({ success: true, paper });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/assessments/board-paper/:id/swap-question - Teacher swaps a question with an alternative
router.post('/board-paper/:id/swap-question', (req, res) => {
  try {
    const { id } = req.params;
    const questionId = req.body.questionId || req.body.targetQuestionId;
    const replacementQuestionId = req.body.replacementQuestionId || req.body.newQuestionId || null;
    const customQuestion = req.body.customQuestion || null;

    let paper = inMemoryStore.generatedBoardPapers[id];
    if (!paper && req.body.paper) {
      paper = req.body.paper;
    }
    if (!paper) {
      const asgn = (inMemoryStore.assessments || []).find(a => a.id === id);
      if (asgn && asgn.paperStructure) paper = asgn.paperStructure;
    }

    if (!paper) return res.status(404).json({ success: false, error: 'Question paper not found.' });

    const result = swapPaperQuestion({
      paper,
      questionId,
      replacementQuestionId,
      customQuestion
    });

    inMemoryStore.generatedBoardPapers[id] = result.paper;
    res.json({
      success: true,
      message: 'Question swapped successfully.',
      paper: result.paper,
      replacedQuestion: result.replacedQuestion,
      newQuestion: result.newQuestion
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/assessments/board-paper/:id/alternatives - Fetch 3-5 alternative matching questions
router.get('/board-paper/:id/alternatives', (req, res) => {
  try {
    const { id } = req.params;
    const { marks = 1, excludeIds = '', topic = null, subject: querySubject, grade: queryGrade } = req.query;

    let paper = inMemoryStore.generatedBoardPapers[id];
    if (!paper) {
      const asgn = (inMemoryStore.assessments || []).find(a => a.id === id);
      if (asgn && asgn.paperStructure) paper = asgn.paperStructure;
    }

    const subject = querySubject || (paper ? paper.subject : 'Physics');
    const grade = queryGrade || (paper ? paper.grade : '12');
    const excludeArr = excludeIds ? excludeIds.split(',') : [];

    const alternatives = getAlternativeQuestions({
      subject,
      grade,
      marks: Number(marks),
      excludeIds: excludeArr,
      topic
    });

    res.json({ success: true, alternatives });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/assessments/board-paper/:id/add-custom-question - Teacher adds their own question
router.post('/board-paper/:id/add-custom-question', (req, res) => {
  try {
    const { id } = req.params;
    const { sectionId, questionData } = req.body;

    let paper = inMemoryStore.generatedBoardPapers[id];
    if (!paper && req.body.paper) {
      paper = req.body.paper;
    }
    if (!paper) {
      const asgn = (inMemoryStore.assessments || []).find(a => a.id === id);
      if (asgn && asgn.paperStructure) paper = asgn.paperStructure;
    }

    if (!paper) return res.status(404).json({ success: false, error: 'Question paper not found.' });

    const result = addCustomQuestionToPaper({
      paper,
      sectionId,
      questionData
    });

    inMemoryStore.generatedBoardPapers[id] = result.paper;
    res.status(201).json({
      success: true,
      message: 'Custom question added successfully to question paper.',
      paper: result.paper,
      addedQuestion: result.addedQuestion
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. PUT /api/assessments/board-paper/:id/update-question - Teacher edits question in-place
router.put('/board-paper/:id/update-question', (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, updatedData } = req.body;

    let paper = inMemoryStore.generatedBoardPapers[id];
    if (!paper && req.body.paper) {
      paper = req.body.paper;
    }
    if (!paper) {
      const asgn = (inMemoryStore.assessments || []).find(a => a.id === id);
      if (asgn && asgn.paperStructure) paper = asgn.paperStructure;
    }

    if (!paper) return res.status(404).json({ success: false, error: 'Question paper not found.' });

    const updatedPaper = updatePaperQuestion({
      paper,
      questionId,
      updatedData
    });

    inMemoryStore.generatedBoardPapers[id] = updatedPaper;
    res.json({
      success: true,
      message: 'Question updated successfully.',
      paper: updatedPaper
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. DELETE /api/assessments/board-paper/:id/delete-question - Teacher removes a question
router.delete('/board-paper/:id/delete-question', (req, res) => {
  try {
    const { id } = req.params;
    const { questionId } = req.body;

    let paper = inMemoryStore.generatedBoardPapers[id];
    if (!paper && req.body.paper) {
      paper = req.body.paper;
    }
    if (!paper) {
      const asgn = (inMemoryStore.assessments || []).find(a => a.id === id);
      if (asgn && asgn.paperStructure) paper = asgn.paperStructure;
    }

    if (!paper) return res.status(404).json({ success: false, error: 'Question paper not found.' });

    const updatedPaper = deletePaperQuestion({
      paper,
      questionId
    });

    inMemoryStore.generatedBoardPapers[id] = updatedPaper;
    res.json({
      success: true,
      message: 'Question removed from paper and numbers re-sequenced.',
      paper: updatedPaper
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


