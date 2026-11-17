// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: TEACHER CLASS-WISE & INDIVIDUAL DIAGNOSTIC ANALYTICS
// Provides:
//   1. Class-wise aggregate intelligence:
//      - Average score, Highest score, Lowest score
//      - Most attempted question & Most wrong / failed question
//      - Time management hotspots (where students need to spend more time / lag benchmark)
//      - Pedagogical action matrix: Concepts needing "Quick Recap" vs "Teach Once Again"
//   2. Individual student test drilldown:
//      - Question-by-question time taken vs benchmark
//      - Mistake classification: Conceptual, Formula-based, Calculation, Sign-convention, Time-pressure
//      - Short summary of the test for the student's Smart Card & parent reporting
// ============================================================================

const express = require('express');
const router = express.Router();
const subjectScope = require('../services/subjectScope');
const { inMemoryStore } = require('../config/database');

// ============================================================================
// 1. GET /api/analytics/class-dashboard - Comprehensive Class-Wise Analytics
// ============================================================================
router.get('/class-dashboard', (req, res) => {
  try {
    const { assessmentId, grade, section, subjectKey, teacherSubjectKey, subject } = req.query;
    const reqSubjKey = (subjectKey || teacherSubjectKey || subject || '').toUpperCase().trim();

    const assessmentsList = inMemoryStore.assessments || [];
    if (assessmentsList.length === 0) {
      return res.status(404).json({ success: false, error: 'No assessments found.' });
    }

    // Filter assessments by teacher's subject if provided
    let relevantAssessments = assessmentsList;
    const scoped = Boolean(reqSubjKey) && subjectScope.isKnownSubject(reqSubjKey);
    if (scoped) {
      // Subject isolation: never fall back to other subjects' tests.
      relevantAssessments = assessmentsList.filter(a => subjectScope.assessmentInScope(reqSubjKey, a));
      if (section) relevantAssessments = relevantAssessments.filter(a => String(a.section || a.targetClass || '').toLowerCase() === String(section).toLowerCase());
    }

    // Filter submissions for this assessment
    const allSubmissions = inMemoryStore.submissions || [];

    // Default to specified assessment, or prefer first with submissions for this teacher's subject
    let assessment = null;
    if (assessmentId) {
      assessment = assessmentsList.find(a => a.id === assessmentId);
      if (assessment && scoped && !subjectScope.assessmentInScope(reqSubjKey, assessment)) {
        return res.status(403).json({ success: false, error: `Subject isolation: this test is outside the ${reqSubjKey} scope.` });
      }
    }
    if (!assessment && scoped) {
      assessment = relevantAssessments.find(a => !a.id.startsWith('paper_') && allSubmissions.some(s => s.assessmentId === a.id))
        || relevantAssessments.find(a => !a.id.startsWith('paper_'))
        || null;
      if (!assessment) {
        return res.json({ success: true, hasSubmissions: false, assessment: null, classSummary: null, questionAnalytics: [], studentRoster: [], availableAssessments: [], message: 'No tests have been published for this subject and class yet.' });
      }
    }
    if (!assessment) {
      assessment = relevantAssessments.find(a => !a.id.startsWith('paper_') && allSubmissions.some(s => s.assessmentId === a.id)) 
        || relevantAssessments.find(a => allSubmissions.some(s => s.assessmentId === a.id))
        || assessmentsList.find(a => !a.id.startsWith('paper_') && allSubmissions.some(s => s.assessmentId === a.id))
        || relevantAssessments.find(a => !a.id.startsWith('paper_'))
        || relevantAssessments[0] 
        || assessmentsList[0];
    }

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'No assessment available for this class.' });
    }

    const submissions = allSubmissions.filter(s => s.assessmentId === assessment.id);
    // Real class size: students enrolled in the test's class (never a hardcoded number).
    const enrolledInSection = (inMemoryStore.users || []).filter(u => u.role === 'STUDENT' && assessment.section && String(u.section || '').toLowerCase() === String(assessment.section).toLowerCase()).length;
    const enrolledForAssessment = Math.max(enrolledInSection, new Set(submissions.map(s => s.studentId)).size);

    // Helper to format available assessments sorted by submission count
    const getAvailableAssessmentsList = () => {
      const pool = scoped ? relevantAssessments : [...relevantAssessments, ...assessmentsList.filter(a => !relevantAssessments.some(r => r.id === a.id))];
      return pool
        .filter(a => !a.id.startsWith('paper_') || (assessment && a.id === assessment.id))
        .sort((a, b) => {
          const countA = allSubmissions.filter(s => s.assessmentId === a.id).length;
          const countB = allSubmissions.filter(s => s.assessmentId === b.id).length;
          return countB - countA;
        })
        .map(a => {
          const count = allSubmissions.filter(s => s.assessmentId === a.id).length;
          return {
            id: a.id,
            title: `${a.title}${count > 0 ? ` (${count} Submissions)` : ' (Pending Attempt)'}`,
            rawTitle: a.title,
            grade: a.grade,
            section: a.section,
            subject: a.subject,
            subjectKey: a.subjectKey,
            submissionCount: count
          };
        });
    };

    if (submissions.length === 0) {
      let classStudents = (inMemoryStore.users || []).filter(u => u.role === 'STUDENT' && (u.section === assessment.section || (!assessment.section && u.grade === assessment.grade)));
      if (classStudents.length === 0) {
        const gradeStr = String(assessment.grade || '12');
        classStudents = (inMemoryStore.users || []).filter(u => u.role === 'STUDENT' && String(u.grade) === gradeStr);
      }
      if (classStudents.length === 0) {
        if (String(assessment.grade) === '10') {
          classStudents = [
            { id: 'stu_10_01', full_name: 'Rohit Verma', roll_number: '10-A-01' },
            { id: 'stu_10_02', full_name: 'Aditya Chauhan', roll_number: '10-A-02' },
            { id: 'stu_10_03', full_name: 'Tanvi Sood', roll_number: '10-A-03' },
            { id: 'stu_10_04', full_name: 'Nikhil Rana', roll_number: '10-A-04' }
          ];
        } else {
          classStudents = [
            { id: 'b0000000-0000-0000-0000-000000000001', full_name: 'Aryan Sharma', roll_number: '12-NM-01' },
            { id: 'b0000000-0000-0000-0000-000000000002', full_name: 'Rohit Negi', roll_number: '12-NM-02' },
            { id: 'b0000000-0000-0000-0000-000000000003', full_name: 'Kavya Verma', roll_number: '12-NM-03' },
            { id: 'b0000000-0000-0000-0000-000000000004', full_name: 'Kunal Sharma', roll_number: '12-NM-04' }
          ];
        }
      }

      const questionsMeta = assessment.questions || [];
      const totalMarks = assessment.totalMarks || (questionsMeta.length * 4) || 16;
      const durationMins = assessment.durationMinutes || 25;

      const studentRoster = classStudents.map(s => ({
        studentId: s.id,
        studentName: s.full_name,
        rollNumber: s.roll_number,
        score: 0,
        totalMarks: totalMarks,
        percentage: 0,
        totalTimeSpentSeconds: 0,
        wrongQuestionsCount: 0,
        primaryMistake: 'Pending Attempt',
        smartCardSummary: `Awaiting student completion for ${assessment.title}`
      }));

      const questionAnalytics = questionsMeta.map((q, idx) => ({
        questionIndex: idx + 1,
        questionId: q.id || `q_${idx + 1}`,
        topic: q.topic || 'Curriculum Concept',
        subtopic: q.subtopic || 'Core Formulation',
        questionLatex: q.question_latex || '',
        benchmarkSeconds: q.benchmark_time_seconds || 90,
        attemptCount: 0,
        attemptRate: 0,
        correctCount: 0,
        wrongCount: 0,
        accuracyRate: 0,
        errorRate: 0,
        avgTimeSpentSeconds: 0,
        timeDeltaSeconds: 0,
        needsMoreTime: false,
        mistakeBreakdown: { CONCEPTUAL: 0, FORMULA_BASED: 0, CALCULATION: 0, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 },
        dominantMistake: 'None',
        isMostAttempted: false,
        isMostWrong: false
      }));

      return res.json({
        success: true,
        message: 'No student submissions recorded for this test yet.',
        assessment: {
          id: assessment.id,
          title: assessment.title,
          grade: assessment.grade,
          section: assessment.section,
          subject: assessment.subject,
          subjectKey: assessment.subjectKey,
          totalQuestions: questionsMeta.length,
          totalMarks: totalMarks,
          durationMinutes: durationMins
        },
        hasSubmissions: false,
        classSummary: {
          totalSubmissions: 0,
          classEnrolledCount: classStudents.length || 4,
          participationRate: '0%',
          averageScore: 0,
          averagePercentage: '0%',
          highestScore: { score: 0, percentage: 0, students: [] },
          lowestScore: { score: 0, percentage: 0, students: [] },
          averageTimeSpentSeconds: 0,
          expectedDurationSeconds: durationMins * 60
        },
        highlights: {
          mostAttempted: null,
          mostWrong: null
        },
        questionAnalytics,
        pedagogicalActionPlan: {
          quickRecapNeeded: [],
          teachOnceAgainNeeded: [],
          timeManagementAlerts: []
        },
        studentRoster,
        availableAssessments: getAvailableAssessmentsList()
      });
    }

    // 1. Class Performance Metrics
    const scores = submissions.map(s => s.totalScore);
    const percentages = submissions.map(s => s.percentage);
    const times = submissions.map(s => s.totalTimeSpentSeconds);

    const highestScoreVal = Math.max(...scores);
    const lowestScoreVal = Math.min(...scores);
    const avgScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
    const avgPercentage = Number((percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1));
    const avgTimeSeconds = Math.round(times.reduce((a, b) => a + b, 0) / times.length);

    const topScorers = submissions
      .filter(s => s.totalScore === highestScoreVal)
      .map(s => ({ studentId: s.studentId, studentName: s.studentName, rollNumber: s.rollNumber, score: s.totalScore, percentage: s.percentage }));

    const lowestScorers = submissions
      .filter(s => s.totalScore === lowestScoreVal)
      .map(s => ({ studentId: s.studentId, studentName: s.studentName, rollNumber: s.rollNumber, score: s.totalScore, percentage: s.percentage }));

    // 2. Question-Level Analytics
    const questionsMeta = assessment.questions || [];
    const questionAnalytics = questionsMeta.map((q, idx) => {
      const qIndex = idx + 1;
      let attemptCount = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let totalTimeOnQ = 0;
      const mistakeTypeCounts = {
        CONCEPTUAL: 0,
        FORMULA_BASED: 0,
        CALCULATION: 0,
        SIGN_CONVENTION: 0,
        TIME_PRESSURE: 0
      };

      submissions.forEach(sub => {
        const item = (sub.questionBreakdown || []).find(qb => qb.questionId === q.id || qb.questionIndex === qIndex);
        if (item) {
          attemptCount++;
          totalTimeOnQ += (item.timeSpentSeconds || 0);
          if (item.isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
            const mType = item.mistakeClassification?.type || 'CONCEPTUAL';
            if (mistakeTypeCounts[mType] !== undefined) {
              mistakeTypeCounts[mType]++;
            } else {
              mistakeTypeCounts.CONCEPTUAL++;
            }
          }
        }
      });

      const attemptRate = submissions.length > 0 ? Math.round((attemptCount / submissions.length) * 100) : 0;
      const accuracyRate = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0;
      const errorRate = attemptCount > 0 ? Math.round((wrongCount / attemptCount) * 100) : 0;
      const avgTime = attemptCount > 0 ? Math.round(totalTimeOnQ / attemptCount) : (q.benchmark_time_seconds || 90);
      const benchmark = q.benchmark_time_seconds || 90;
      const timeDelta = avgTime - benchmark;
      const needsMoreTime = avgTime > benchmark * 1.15; // >15% over benchmark indicates hesitation

      // Dominant mistake
      let dominantMistake = 'None';
      let maxMistakeCount = 0;
      Object.keys(mistakeTypeCounts).forEach(type => {
        if (mistakeTypeCounts[type] > maxMistakeCount) {
          maxMistakeCount = mistakeTypeCounts[type];
          dominantMistake = type;
        }
      });

      return {
        questionIndex: qIndex,
        questionId: q.id,
        topic: q.topic || 'Core Science',
        subtopic: q.subtopic || 'General Principle',
        questionLatex: q.question_latex,
        correctAnswer: q.correct_answer || q.correct_answer_latex,
        benchmarkSeconds: benchmark,
        attemptCount,
        attemptRate,
        correctCount,
        wrongCount,
        accuracyRate,
        errorRate,
        avgTimeSpentSeconds: avgTime,
        timeDeltaSeconds: timeDelta,
        needsMoreTime,
        mistakeBreakdown: mistakeTypeCounts,
        dominantMistake,
        isMostAttempted: false,
        isMostWrong: false
      };
    });

    // Mark Most Attempted and Most Wrong
    let maxAttempts = -1;
    let maxWrongs = -1;
    questionAnalytics.forEach(qa => {
      if (qa.attemptCount > maxAttempts) maxAttempts = qa.attemptCount;
      if (qa.wrongCount > maxWrongs) maxWrongs = qa.wrongCount;
    });

    questionAnalytics.forEach(qa => {
      if (qa.attemptCount === maxAttempts && maxAttempts > 0) qa.isMostAttempted = true;
      if (qa.wrongCount === maxWrongs && maxWrongs > 0) qa.isMostWrong = true;
    });

    const mostAttemptedQ = questionAnalytics.find(q => q.isMostAttempted);
    const mostWrongQ = questionAnalytics.find(q => q.isMostWrong);

    // 3. Curricular Action Matrix (Teacher Pedagogical Directives)
    const quickRecapConcepts = [];
    const teachOnceAgainConcepts = [];
    const timeManagementAlerts = [];

    questionAnalytics.forEach(qa => {
      // Teach Once Again: Accuracy < 50% or error rate >= 50%
      if (qa.accuracyRate < 50 || qa.errorRate >= 50) {
        teachOnceAgainConcepts.push({
          questionIndex: qa.questionIndex,
          concept: qa.subtopic,
          topic: qa.topic,
          accuracyRate: `${qa.accuracyRate}%`,
          studentsStruggledCount: qa.wrongCount,
          dominantMistake: qa.dominantMistake,
          severity: 'CRITICAL',
          recommendation: `Conduct a structured 20-minute re-teaching session during hostel residential prep with focused derivations on ${qa.subtopic}.`
        });
      } 
      // Quick Recap: Accuracy between 50% and 75%
      else if (qa.accuracyRate >= 50 && qa.accuracyRate <= 75) {
        quickRecapConcepts.push({
          questionIndex: qa.questionIndex,
          concept: qa.subtopic,
          topic: qa.topic,
          accuracyRate: `${qa.accuracyRate}%`,
          dominantMistake: qa.dominantMistake,
          estimatedMinutes: 10,
          recommendation: `Spend 5–10 minutes reviewing key formula definitions, Cartesian sign rules, or parameter extractions for ${qa.subtopic}.`
        });
      }

      // Time Management Hotspots
      if (qa.needsMoreTime) {
        timeManagementAlerts.push({
          questionIndex: qa.questionIndex,
          topic: qa.topic,
          concept: qa.subtopic,
          avgTime: `${qa.avgTimeSpentSeconds}s`,
          benchmarkTime: `${qa.benchmarkSeconds}s`,
          timeLagSeconds: `+${qa.timeDeltaSeconds}s`,
          analysis: `Students are exceeding target benchmark time by ${Math.round((qa.timeDeltaSeconds / qa.benchmarkSeconds) * 100)}%. Indicates algebraic hesitation or unit conversion friction.`
        });
      }
    });

    // 4. Student Roster Summary
    let rosterSubmissions = submissions;
    if (subjectKey === 'BIOLOGY' || teacherSubjectKey === 'BIOLOGY' || assessment.subjectKey === 'BIOLOGY' || assessment.subject === 'Biology') {
      const medOnly = submissions.filter(s => {
        const roll = s.rollNumber || '';
        const sec = s.section || '';
        return roll.startsWith('11-M') || roll.startsWith('12-M') || (sec.includes('Med') && !sec.includes('NonMed'));
      });
      if (medOnly.length > 0) {
        rosterSubmissions = medOnly;
      }
    }

    const studentRoster = rosterSubmissions.map(s => {
      const wrongItems = (s.questionBreakdown || []).filter(qb => !qb.isCorrect);
      let primaryMistake = 'None';
      if (wrongItems.length > 0) {
        primaryMistake = wrongItems[0].mistakeClassification?.label || wrongItems[0].mistakeClassification?.type || 'Calculation Error';
      }

      return {
        studentId: s.studentId,
        studentName: s.studentName,
        rollNumber: s.rollNumber,
        score: s.totalScore,
        totalMarks: s.totalMarks,
        percentage: s.percentage,
        totalTimeSpentSeconds: s.totalTimeSpentSeconds,
        wrongQuestionsCount: wrongItems.length,
        primaryMistake,
        smartCardSummary: s.smartCardSummary,
        submittedAt: s.submittedAt
      };
    });

    res.json({
      success: true,
      hasSubmissions: true,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        grade: assessment.grade,
        section: assessment.section,
        subject: assessment.subject,
        subjectKey: assessment.subjectKey,
        totalQuestions: assessment.questions.length,
        totalMarks: assessment.totalMarks,
        durationMinutes: assessment.durationMinutes
      },
      classSummary: {
        totalSubmissions: submissions.length,
        classEnrolledCount: enrolledForAssessment,
        participationRate: `${Math.round((submissions.length / Math.max(1, enrolledForAssessment)) * 100)}%`,
        averageScore: avgScore,
        averagePercentage: `${avgPercentage}%`,
        highestScore: {
          score: highestScoreVal,
          percentage: Math.round((highestScoreVal / assessment.totalMarks) * 100),
          students: topScorers
        },
        lowestScore: {
          score: lowestScoreVal,
          percentage: Math.round((lowestScoreVal / assessment.totalMarks) * 100),
          students: lowestScorers
        },
        averageTimeSpentSeconds: avgTimeSeconds,
        expectedDurationSeconds: assessment.durationMinutes * 60
      },
      questionAnalytics,
      highlights: {
        mostAttempted: mostAttemptedQ ? {
          questionIndex: mostAttemptedQ.questionIndex,
          subtopic: mostAttemptedQ.subtopic,
          attemptRate: `${mostAttemptedQ.attemptRate}%`,
          attemptCount: mostAttemptedQ.attemptCount
        } : null,
        mostWrong: mostWrongQ ? {
          questionIndex: mostWrongQ.questionIndex,
          subtopic: mostWrongQ.subtopic,
          errorRate: `${mostWrongQ.errorRate}%`,
          wrongCount: mostWrongQ.wrongCount,
          dominantMistake: mostWrongQ.dominantMistake
        } : null
      },
      pedagogicalActionPlan: {
        quickRecapNeeded: quickRecapConcepts,
        teachOnceAgainNeeded: teachOnceAgainConcepts,
        timeManagementAlerts
      },
      studentRoster,
      availableAssessments: getAvailableAssessmentsList()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 2. GET /api/analytics/student-test-drilldown/:studentId/:assessmentId
// Individual Student Question Timing, Mistake Types & Smart Card Summary
// ============================================================================
router.get('/student-test-drilldown/:studentId/:assessmentId', (req, res) => {
  try {
    const { studentId, assessmentId } = req.params;

    const allSubmissions = inMemoryStore.submissions || [];
    let submission = allSubmissions.find(s => 
      s.studentId === studentId && (s.assessmentId === assessmentId || assessmentId === 'latest')
    );

    // Fallback: If not matched, pick first submission for this student
    if (!submission) {
      submission = allSubmissions.find(s => s.studentId === studentId) || allSubmissions[0];
    }

    if (!submission) {
      return res.status(404).json({ success: false, error: 'No test submission found for this student.' });
    }

    const studentUser = inMemoryStore.users.find(u => u.id === submission.studentId) || {
      full_name: submission.studentName,
      roll_number: submission.rollNumber,
      grade: submission.grade,
      section: submission.section
    };

    // Enrich each question in breakdown
    const detailedQuestions = (submission.questionBreakdown || []).map(q => {
      const benchmark = q.benchmarkSeconds || 90;
      const timeSpent = q.timeSpentSeconds || 0;
      const timeRatio = Number((timeSpent / benchmark).toFixed(2));
      let speedPacing = 'OPTIMAL';
      if (timeSpent < benchmark * 0.7) speedPacing = 'FAST';
      else if (timeSpent > benchmark * 1.3) speedPacing = 'HESITATING';

      const mistake = q.mistakeClassification || {
        type: q.isCorrect ? 'NONE' : 'CONCEPTUAL',
        label: q.isCorrect ? 'Correct Execution' : 'Conceptual Error',
        explanation: q.isCorrect ? 'Accurately solved.' : 'Stumbled on question principle.'
      };

      return {
        questionIndex: q.questionIndex,
        questionId: q.questionId,
        topic: q.topic || 'Science',
        subtopic: q.subtopic || 'General Concept',
        timeSpentSeconds: timeSpent,
        benchmarkSeconds: benchmark,
        timeRatio,
        speedPacing,
        isCorrect: q.isCorrect,
        selectedOption: q.selectedOption,
        correctAnswer: q.correctAnswer,
        mistakeClassification: {
          type: mistake.type,
          label: mistake.label,
          explanation: mistake.explanation,
          distractorTrap: mistake.distractorTrap || null
        }
      };
    });

    // Generate Smart Card Short Summary
    const correctCount = detailedQuestions.filter(q => q.isCorrect).length;
    const totalCount = detailedQuestions.length;
    const mistakesFound = detailedQuestions.filter(q => !q.isCorrect);

    let mistakeTypeSummary = 'No mistakes recorded.';
    if (mistakesFound.length > 0) {
      const types = mistakesFound.map(m => m.mistakeClassification.label);
      mistakeTypeSummary = types.join(', ');
    }

    const smartCard = {
      testTitle: submission.assessmentTitle,
      shortSummary: submission.smartCardSummary || `Scored ${submission.percentage}% (${submission.totalScore}/${submission.totalMarks}) in ${Math.round(submission.totalTimeSpentSeconds / 60)} minutes.`,
      accuracyBadge: `${correctCount}/${totalCount} Questions Correct (${submission.percentage}%)`,
      totalTimeFormatted: `${Math.floor(submission.totalTimeSpentSeconds / 60)}m ${submission.totalTimeSpentSeconds % 60}s`,
      dominantErrorArea: mistakesFound.length > 0 ? mistakesFound[0].subtopic : 'None (Full Mastery)',
      mistakeTypesSummary: mistakeTypeSummary,
      teacherActionDirective: mistakesFound.length > 0
        ? `Review ${mistakesFound[0].subtopic} with 1-on-1 step derivation during residential hostel evening prep.`
        : 'Assign advanced Olympiad / JEE challenge drill.',
      parentWhatsAppSnippet: `HAPS Update: ${studentUser.full_name} scored ${submission.percentage}% in ${submission.assessmentTitle}. Strong grasp of fundamentals; focus on ${mistakesFound.length > 0 ? mistakesFound[0].subtopic : 'maintaining speed velocity'}.`
    };

    res.json({
      success: true,
      student: {
        id: studentUser.id || submission.studentId,
        fullName: studentUser.full_name,
        rollNumber: studentUser.roll_number,
        grade: studentUser.grade,
        section: studentUser.section,
        targetExam: studentUser.target_exam || 'CBSE'
      },
      submission: {
        submissionId: submission.submissionId,
        assessmentId: submission.assessmentId,
        assessmentTitle: submission.assessmentTitle,
        totalScore: submission.totalScore,
        totalMarks: submission.totalMarks,
        percentage: submission.percentage,
        totalTimeSpentSeconds: submission.totalTimeSpentSeconds,
        submittedAt: submission.submittedAt
      },
      questionBreakdown: detailedQuestions,
      smartCard
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 3. GET /api/analytics/student/:id (Overall Concept Mastery)
// ============================================================================
// GET /api/analytics/student/:id/submissions - The student's own submitted tests (newest first).
// Only tests assigned to the student's own class are returned (student content isolation).
router.get('/student/:id/submissions', (req, res) => {
  try {
    const student = (inMemoryStore.users || []).find(u => u.id === req.params.id);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    const assessments = inMemoryStore.assessments || [];
    const list = (inMemoryStore.submissions || [])
      .filter(s => s.studentId === student.id)
      .map(s => ({ s, a: assessments.find(a => a.id === s.assessmentId) }))
      .filter(({ a }) => a && String(a.section || a.targetClass || '').toLowerCase() === String(student.section || '').toLowerCase())
      .map(({ s, a }) => ({
        submissionId: s.submissionId || s.id,
        assessmentId: a.id,
        title: a.title,
        subject: a.subject,
        chapter: a.chapterName || a.chapter || '',
        questionCount: (a.questions || []).length,
        totalScore: s.totalScore,
        totalMarks: s.totalMarks || a.totalMarks,
        percentage: s.percentage,
        totalTimeSpentSeconds: s.totalTimeSpentSeconds || 0,
        submittedAt: s.submittedAt || null,
        questionBreakdown: (s.questionBreakdown || []).map(q => ({
          questionIndex: q.questionIndex,
          topic: q.topic,
          subtopic: q.subtopic,
          isCorrect: q.isCorrect,
          selectedOption: q.selectedOption,
          correctAnswer: q.correctAnswer
        }))
      }))
      .sort((x, y) => String(y.submittedAt || '').localeCompare(String(x.submittedAt || '')));
    res.json({ success: true, student: { id: student.id, name: student.full_name, section: student.section }, count: list.length, submissions: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/student/:id', (req, res) => {
  const studentId = req.params.id || 'b0000000-0000-0000-0000-000000000001';
  const student = inMemoryStore.users.find(u => u.id === studentId) || {
    full_name: 'Aryan Sharma',
    roll_number: '11-S-24',
    grade: '10',
    section: 'Science-A',
    board: 'CBSE',
    target_exam: 'JEE_ADVANCED'
  };

  const masteryList = inMemoryStore.conceptMastery.filter(m => m.student_id === studentId);
  const mastered = masteryList.filter(m => m.mastery_status === 'MASTERED');
  const recap = masteryList.filter(m => m.mastery_status === 'NEEDS_RECAP');
  const weak = masteryList.filter(m => m.mastery_status === 'CRITICAL_WEAKNESS');

  const totalAttempts = masteryList.reduce((acc, curr) => acc + (curr.attempts || 0), 0);
  const avgAccuracy = masteryList.length > 0 
    ? Math.round(masteryList.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / masteryList.length)
    : 78;

  res.json({
    success: true,
    student,
    summary: {
      totalConceptsEvaluated: masteryList.length,
      masteredCount: mastered.length,
      recapCount: recap.length,
      weakCount: weak.length,
      avgAccuracy,
      totalAttempts
    },
    breakdown: { mastered, recap, weak }
  });
});

// ============================================================================
// 4. GET /api/analytics/pilot-overview
// ============================================================================
// ============================================================================
// GET /api/analytics/principal-overview - School-wide live telemetry (read-only)
// Everything is computed from the live store (students, faculty, classes,
// published tests, submissions, teacher DPPs). Nothing is hardcoded.
// ============================================================================
function pct(n, d) { return d ? Math.round((n / d) * 1000) / 10 : 0; }
function avg(list) { return list.length ? Math.round((list.reduce((s, v) => s + v, 0) / list.length) * 10) / 10 : null; }

function buildPrincipalOverview() {
  const users = inMemoryStore.users || [];
  const students = users.filter(u => u.role === 'STUDENT');
  const teachers = users.filter(u => u.role === 'TEACHER');
  const classes = inMemoryStore.classes || [];
  const tests = (inMemoryStore.assessments || []).filter(a => a && a.id && !String(a.id).startsWith('paper_'));
  const subs = inMemoryStore.submissions || [];
  const dpps = inMemoryStore.teacherDpps || [];
  const dppAttempts = inMemoryStore.teacherDppAttempts || [];
  const sectionOf = v => String(v || '').toLowerCase();
  const studentsIn = section => students.filter(s => sectionOf(s.section) === sectionOf(section));
  const teacherFor = test => teachers.find(t => subjectScope.assessmentInScope(t.subjectKey, test)) || null;

  // Per test
  const testRows = tests.map(t => {
    const tSubs = subs.filter(s => s.assessmentId === t.id);
    const enrolled = studentsIn(t.section).length || new Set(tSubs.map(s => s.studentId)).size;
    const teacher = teacherFor(t);
    const submittedIds = new Set(tSubs.map(s => s.studentId));
    return {
      id: t.id,
      title: t.title,
      subject: t.subject || '',
      section: t.section || '',
      grade: String(t.grade || ''),
      teacherName: teacher ? teacher.full_name : (t.teacherName || ''),
      teacherId: teacher ? teacher.id : null,
      createdAt: t.createdAt || t.created_at || null,
      questions: (t.questions || []).length,
      submitted: submittedIds.size,
      enrolled,
      participation: pct(submittedIds.size, enrolled),
      avgPercent: avg(tSubs.map(s => Number(s.percentage) || 0)),
      lowestPercent: tSubs.length ? Math.min(...tSubs.map(s => Number(s.percentage) || 0)) : null,
      highestPercent: tSubs.length ? Math.max(...tSubs.map(s => Number(s.percentage) || 0)) : null
    };
  }).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  // Per class
  const classRows = classes.map(c => {
    const section = c.section || c.id;
    const cStudents = studentsIn(section);
    const cTests = testRows.filter(t => sectionOf(t.section) === sectionOf(section));
    const cSubs = subs.filter(s => sectionOf(s.section) === sectionOf(section));
    const expected = cTests.reduce((s, t) => s + t.enrolled, 0);
    const submitted = cTests.reduce((s, t) => s + t.submitted, 0);
    const subjectNames = (c.subjects || []).map(s => (typeof s === 'string' ? s : (s.name || s.key)));
    return {
      section,
      name: c.name || section,
      grade: String(c.grade || ''),
      students: cStudents.length,
      subjects: subjectNames,
      tests: cTests.length,
      participation: pct(submitted, expected),
      avgPercent: avg(cSubs.map(s => Number(s.percentage) || 0)),
      dpps: dpps.filter(d => sectionOf(d.section) === sectionOf(section)).length
    };
  }).sort((a, b) => Number(b.grade) - Number(a.grade) || a.name.localeCompare(b.name));

  // Per teacher
  const teacherRows = teachers.map(t => {
    const tTests = testRows.filter(r => r.teacherId === t.id);
    const tSubs = subs.filter(s => tTests.some(r => r.id === s.assessmentId));
    const tDpps = dpps.filter(d => d.teacherId === t.id || (!d.teacherId && d.subjectKey === t.subjectKey));
    const dppSubs = dppAttempts.filter(a => tDpps.some(d => d.id === a.dppId));
    const lastActivity = [...tTests.map(r => r.createdAt), ...tDpps.map(d => d.createdAt)].filter(Boolean).sort().pop() || null;
    return {
      id: t.id,
      name: t.full_name,
      subject: t.subject,
      subjectKey: t.subjectKey,
      designation: t.designation || '',
      classes: subjectScope.allowedClasses(t.subjectKey).map(c => c.section || c.id),
      testsPublished: tTests.length,
      submissionsReceived: tSubs.length,
      avgPercent: avg(tSubs.map(s => Number(s.percentage) || 0)),
      dppsCreated: tDpps.length,
      dppAttempts: dppSubs.length,
      lastActivity
    };
  }).sort((a, b) => (b.testsPublished + b.dppsCreated) - (a.testsPublished + a.dppsCreated) || a.name.localeCompare(b.name));

  // Topics: accuracy from every answered question across all submissions
  const topicMap = new Map();
  subs.forEach(s => (s.questionBreakdown || []).forEach(q => {
    const topic = q.subtopic || q.topic;
    if (!topic) return;
    const test = tests.find(t => t.id === s.assessmentId) || {};
    const key = `${topic}||${test.subject || ''}`;
    if (!topicMap.has(key)) topicMap.set(key, { topic, chapter: q.topic || '', subject: test.subject || '', attempts: 0, correct: 0, sections: new Set() });
    const m = topicMap.get(key);
    m.attempts += 1;
    if (q.isCorrect) m.correct += 1;
    if (s.section) m.sections.add(s.section);
  }));
  const topics = Array.from(topicMap.values()).map(m => ({
    topic: m.topic, chapter: m.chapter, subject: m.subject, attempts: m.attempts,
    accuracy: pct(m.correct, m.attempts), sections: Array.from(m.sections)
  }));
  const weakTopics = topics.filter(t => t.attempts >= 3).sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts).slice(0, 8);
  const strongTopics = topics.filter(t => t.attempts >= 3).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);

  // Students needing support: low average, or several published tests not submitted
  const studentRows = students.map(st => {
    const sSubs = subs.filter(s => s.studentId === st.id);
    const expectedTests = testRows.filter(t => sectionOf(t.section) === sectionOf(st.section));
    const missed = expectedTests.filter(t => !sSubs.some(s => s.assessmentId === t.id)).length;
    return {
      id: st.id, name: st.full_name, roll: st.roll_number, section: st.section, grade: String(st.grade || ''),
      testsTaken: sSubs.length, testsExpected: expectedTests.length, missed,
      avgPercent: avg(sSubs.map(s => Number(s.percentage) || 0))
    };
  });
  const needsSupport = studentRows
    .filter(s => (s.avgPercent !== null && s.avgPercent < 50) || (s.testsExpected > 0 && s.missed > 0))
    .sort((a, b) => (a.avgPercent === null ? 101 : a.avgPercent) - (b.avgPercent === null ? 101 : b.avgPercent) || b.missed - a.missed)
    .slice(0, 12);
  const topStudents = studentRows.filter(s => s.avgPercent !== null).sort((a, b) => b.avgPercent - a.avgPercent).slice(0, 5);

  const expectedAll = testRows.reduce((s, t) => s + t.enrolled, 0);
  const submittedAll = testRows.reduce((s, t) => s + t.submitted, 0);
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      students: students.length,
      teachers: teachers.length,
      classes: classes.length,
      testsPublished: testRows.length,
      submissions: subs.length,
      participation: pct(submittedAll, expectedAll),
      avgPercent: avg(subs.map(s => Number(s.percentage) || 0)),
      dppsCreated: dpps.length,
      dppAttempts: dppAttempts.length,
      studentsNeedingSupport: needsSupport.length
    },
    classes: classRows,
    teachers: teacherRows,
    tests: testRows,
    weakTopics,
    strongTopics,
    needsSupport,
    topStudents
  };
}

router.get('/principal-overview', (req, res) => {
  try {
    res.json(Object.assign({ success: true }, buildPrincipalOverview()));
  } catch (err) {
    console.error('[PRINCIPAL OVERVIEW ERROR]', err);
    res.status(500).json({ success: false, error: 'Could not build the school overview.' });
  }
});

router.get('/pilot-overview', (req, res) => {
  res.json({
    success: true,
    pilotSchool: 'Unisole AI School - Smart Academic Campus',
    pilotClass: 'Class X & XI Science',
    studentsEnrolled: 32,
    activeParticipationRate: '94.2%',
    diagnosticSummary: {
      totalAssessmentsCompleted: 148,
      avgSpeedImprovement: '+26% speed gain in numerical derivations',
      teacherTimeSavedHours: '18.5 hours saved this week on manual marking & grading',
      topWeaknessArea: 'Joule Heating & Resistance Unit Conversions',
      topMasteredArea: 'Spherical Mirrors & Law of Reflection'
    }
  });
});

module.exports = router;
