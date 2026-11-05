// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: CURRICULUM TAXONOMY & TOPIC EXPLORER ROUTER
// Hierarchical Navigation: Subject -> Chapter -> Topic / Subtopic
// ============================================================================

const express = require('express');
const router = express.Router();
const { inMemoryStore } = require('../config/database');
const { CURRICULUM_TAXONOMY, getSubjectTaxonomy, listAvailableSubjects } = require('../services/curriculumTaxonomy');
const { generateLlmQuestion } = require('../services/llmQuestionEngine');
const { ensureQuestionHasRichOptions } = require('../services/questionOptionEngine');

// 1. GET /api/curriculum/subjects - List all available subject syllabi
router.get('/subjects', (req, res) => {
  try {
    const list = listAvailableSubjects();
    res.json({
      success: true,
      count: list.length,
      subjects: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/curriculum/taxonomy/:subjectKey - Full Chapter & Topic breakdown with question counts
router.get('/taxonomy/:subjectKey', (req, res) => {
  try {
    const { subjectKey } = req.params;
    const { grade } = req.query;

    let targetSubjectKey = subjectKey;
    const normKey = (subjectKey || '').toUpperCase().trim();
    if (String(grade) === '10' || normKey === 'CLASS10_MATHEMATICS' || normKey === 'CLASS10_SCIENCE') {
      if (normKey === 'MATHEMATICS' || normKey === 'MATHS' || normKey === 'CLASS10_MATHEMATICS') {
        targetSubjectKey = 'CLASS10_MATHEMATICS';
      } else if (normKey === 'SCIENCE' || normKey === 'CLASS10_SCIENCE') {
        targetSubjectKey = 'CLASS10_SCIENCE';
      }
    }

    const taxonomy = getSubjectTaxonomy(targetSubjectKey);
    if (!taxonomy) {
      return res.status(404).json({
        success: false,
        error: `Subject "${subjectKey}" not found. Valid subjects: BIOLOGY, PHYSICS, CHEMISTRY, MATHEMATICS, CLASS10_SCIENCE, CLASS10_MATHEMATICS.`
      });
    }

    // Filter chapters by grade if specified
    let chapters = taxonomy.chapters;
    if (grade && grade !== 'ALL' && String(grade) !== '10') {
      const byGrade = chapters.filter(ch => String(ch.grade) === String(grade));
      if (byGrade.length > 0) {
        chapters = byGrade;
      }
    }

    // Gather questions strictly for this subject from inMemoryStore
    const banks = inMemoryStore.subjectBanks || {};
    const sKeyUpper = (targetSubjectKey || subjectKey || '').toUpperCase().trim();
    let relevantBank = [];
    if (sKeyUpper === 'CHEMISTRY') relevantBank = banks.senior_chemistry || [];
    else if (sKeyUpper === 'BIOLOGY') relevantBank = banks.senior_biology || [];
    else if (sKeyUpper === 'MATHEMATICS') {
      if (String(grade) === '10') relevantBank = banks.class10_math_pyq_ncert || banks.class10_maths || [];
      else relevantBank = banks.senior_mathematics || [];
    }
    else if (sKeyUpper === 'PHYSICS') relevantBank = banks.senior_physics || [];
    else if (sKeyUpper === 'CLASS10_MATHEMATICS') relevantBank = banks.class10_math_pyq_ncert || banks.class10_maths || [];
    else if (sKeyUpper === 'CLASS10_SCIENCE') relevantBank = banks.class10_science || [];
    else relevantBank = Object.values(banks).flat();

    const allQuestions = [
      ...relevantBank,
      ...(inMemoryStore.questions || []).filter(q => {
        const qKey = (q.subjectKey || '').toUpperCase();
        const qSub = (q.subject || '').toUpperCase();
        return qKey === sKeyUpper || qSub === sKeyUpper || (sKeyUpper === 'CHEMISTRY' && qSub.includes('CHEM'));
      })
    ];

    // Enrich each chapter and topic with live question count
    const enrichedChapters = chapters.map(ch => {
      const chapterQuestions = allQuestions.filter(q => {
        const qChap = (q.chapter || q.chapter_name || '').toLowerCase().trim();
        const tChap = ch.chapterName.toLowerCase().trim();
        if (!qChap) return false;
        return qChap === tChap || qChap.includes(tChap) || tChap.includes(qChap);
      });

      const enrichedTopics = ch.topics.map((t, idx) => {
        const tLower = t.topicName.toLowerCase();
        let topicQuestions = chapterQuestions.filter(q => {
          const qTopic = (q.topic || '').toLowerCase();
          const qSubtopic = (q.subtopic || '').toLowerCase();
          const qText = `${qTopic} ${qSubtopic}`.toLowerCase();
          
          if (qTopic && (qText.includes(tLower) || tLower.includes(qTopic))) return true;
          if (qSubtopic && tLower.includes(qSubtopic)) return true;
          if (t.ncertSection && q.ncert_mapping?.ncert_section?.includes(t.ncertSection)) return true;

          // Keyword matches for specific high-yield syllabus topics
          if (tLower.includes('lac operon') && qText.includes('lac operon')) return true;
          if (tLower.includes('replication') && qText.includes('replication')) return true;
          if (tLower.includes('dihybrid cross') && qText.includes('dihybrid cross')) return true;
          if (tLower.includes('counter-current') && qText.includes('counter-current')) return true;
          if (tLower.includes('pbr322') && qText.includes('pbr322')) return true;
          if (tLower.includes('fluid mosaic') && qText.includes('fluid mosaic')) return true;
          if (tLower.includes('mirror') && qText.includes('mirror')) return true;
          if (tLower.includes('nernst') && qText.includes('nernst')) return true;
          if (tLower.includes('rotational') && qText.includes('rotational')) return true;
          if (tLower.includes('ether') && qText.includes('ether')) return true;
          if (tLower.includes('glucose') && (qText.includes('glucose') || qText.includes('carbohydrate'))) return true;

          // Check subtopics list
          if (t.subtopics && Array.isArray(t.subtopics)) {
            const matchesSubtopic = t.subtopics.some(st => {
              const stLower = st.toLowerCase();
              return qText.includes(stLower) || stLower.includes(qTopic) || (qSubtopic && stLower.includes(qSubtopic));
            });
            if (matchesSubtopic) return true;
          }

          return false;
        });

        // If a topic has 0 questions but chapter has questions that weren't caught due to slight wording variation
        if (topicQuestions.length === 0 && chapterQuestions.length > 0) {
          const unassigned = chapterQuestions.filter(q => {
            const qTopic = (q.topic || '').toLowerCase();
            return !ch.topics.some(ot => ot.id !== t.id && (ot.topicName.toLowerCase().includes(qTopic) || qTopic.includes(ot.topicName.toLowerCase())));
          });
          if (unassigned.length > 0 && idx === 0) {
            topicQuestions = unassigned;
          }
        }

        return {
          ...t,
          questionCount: topicQuestions.length,
          sampleQuestions: topicQuestions.slice(0, 3).map(sq => ({
            id: sq.id,
            question_latex: sq.question_latex,
            difficulty: sq.difficulty,
            benchmark_time_seconds: sq.benchmark_time_seconds,
            pyq_tag: sq.pyq_appearance || (sq.ncert_mapping ? sq.ncert_mapping.pyq_tag : 'Practice Question')
          }))
        };
      });

      const totalQInChapter = enrichedTopics.reduce((acc, t) => acc + t.questionCount, 0);

      return {
        ...ch,
        totalTopics: ch.topics.length,
        totalQuestionsInChapter: totalQInChapter,
        topics: enrichedTopics
      };
    });

    res.json({
      success: true,
      subjectKey: subjectKey.toUpperCase(),
      subjectName: taxonomy.subjectName,
      stream: taxonomy.stream,
      targetExams: taxonomy.targetExams,
      units: taxonomy.units || [],
      boardHighYieldSummary: taxonomy.boardHighYieldSummary || null,
      totalChapters: enrichedChapters.length,
      chapters: enrichedChapters
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/curriculum/questions - Fetch questions under a specific chapter or topic
router.get('/questions', (req, res) => {
  try {
    const { subject, chapter, topic, grade, subjectKey, teacherSubjectKey } = req.query;
    const sKeyUpper = (subjectKey || teacherSubjectKey || subject || '').toUpperCase().trim();

    const banks = inMemoryStore.subjectBanks || {};
    let relevantBank = [];

    if (sKeyUpper === 'CLASS10_SCIENCE' || sKeyUpper === 'SCIENCE' || sKeyUpper.includes('SCI')) {
      relevantBank = banks.class10_science || [];
    } else if (sKeyUpper === 'CLASS10_MATHEMATICS' || (sKeyUpper.includes('MATH') && String(grade) === '10')) {
      relevantBank = banks.class10_math_pyq_ncert || banks.class10_maths || [];
    } else if (sKeyUpper === 'BIOLOGY' || sKeyUpper.includes('BIO')) {
      relevantBank = banks.senior_biology || [];
    } else if (sKeyUpper === 'PHYSICS' || sKeyUpper.includes('PHYS')) {
      relevantBank = banks.senior_physics || [];
    } else if (sKeyUpper === 'CHEMISTRY' || sKeyUpper.includes('CHEM')) {
      relevantBank = banks.senior_chemistry || [];
    } else if (sKeyUpper === 'MATHEMATICS' || sKeyUpper.includes('MATH')) {
      relevantBank = banks.senior_mathematics || [];
    } else {
      relevantBank = Object.values(banks).flat();
    }

    const allQuestions = [
      ...relevantBank,
      ...(inMemoryStore.questions || []).filter(q => {
        if (!sKeyUpper) return true;
        const qKey = (q.subjectKey || '').toUpperCase();
        const qSub = (q.subject || '').toUpperCase();
        return qKey === sKeyUpper || qSub === sKeyUpper || qSub.includes(sKeyUpper);
      })
    ];

    // Deduplicate
    const seen = new Set();
    const uniquePool = [];
    allQuestions.forEach(q => {
      const key = q.id || q.question_latex?.slice(0, 40);
      if (!seen.has(key)) {
        seen.add(key);
        uniquePool.push(q);
      }
    });

    let filtered = uniquePool;

    if (grade && grade !== 'ALL') {
      filtered = filtered.filter(q => String(q.grade) === String(grade));
    }

    if (subject && subject !== 'ALL') {
      filtered = filtered.filter(q => 
        (q.subject && q.subject.toLowerCase().includes(subject.toLowerCase())) ||
        (q.discipline && q.discipline.toLowerCase().includes(subject.toLowerCase()))
      );
    }

    if (chapter && chapter !== 'ALL') {
      filtered = filtered.filter(q => {
        const qChap = (q.chapter || q.chapter_name || q.topic || '').toLowerCase();
        return qChap.includes(chapter.toLowerCase());
      });
    }

    if (topic && topic !== 'ALL') {
      filtered = filtered.filter(q => {
        const qTop = (q.subtopic || q.topic || '').toLowerCase();
        return qTop.includes(topic.toLowerCase());
      });
    }

    res.json({
      success: true,
      count: filtered.length,
      questions: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/curriculum/generate-topic-question - Generate question for a specific chapter/topic
router.post('/generate-topic-question', async (req, res) => {
  try {
    const grade = req.body.grade || '12';
    const subject = req.body.subject || 'Chemistry';
    const chapter = req.body.chapter || req.body.chapterName || 'Electrochemistry';
    const topic = req.body.topic || req.body.topicName || 'Galvanic Cells & Nernst Equation';
    const difficulty = req.body.difficulty || 'MEDIUM';
    const board = req.body.board || req.body.curriculumBoard || 'CBSE';

    console.log(`[CURRICULUM AI] Synthesizing question for ${subject} -> ${chapter} -> ${topic} (${board})...`);

    const freshQ = await generateLlmQuestion({
      grade: String(grade),
      subject,
      chapter: `${chapter} – ${topic}`,
      board,
      difficulty,
      questionType: board.includes('JEE') ? 'NUMERICAL' : 'MCQ_SINGLE',
      provider: 'auto'
    });

    const cleanQ = {
      ...freshQ,
      id: `q_tax_${Date.now()}`,
      grade: String(grade),
      subject,
      chapter,
      chapter_name: chapter,
      topic,
      subtopic: topic,
      curriculum_board: board,
      pyq_appearance: `${board} Syllabus Grounded Question (Generated by HAPS-AI)`
    };

    // Save into inMemoryStore so it appears in the taxonomy tree
    inMemoryStore.questions.push(cleanQ);

    res.status(201).json({
      success: true,
      message: `Generated targeted question for ${subject} -> ${chapter} -> ${topic}.`,
      question: cleanQ
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/curriculum/classes - Get list of classes, streams, permitted subjects, and enrolled students
router.get('/classes', (req, res) => {
  try {
    const { teacherSubject, teacherSubjectKey } = req.query;
    const reqSubjKey = (teacherSubjectKey || teacherSubject || '').toUpperCase().trim();

    const users = inMemoryStore.users || [];
    const getStudents = (grade, sec) => users.filter(u => u.role === 'STUDENT' && String(u.grade) === String(grade) && (u.section === sec || u.section?.toLowerCase() === sec?.toLowerCase()));

    // Base institutional classes
    let rawClasses = inMemoryStore.classes;
    if (!rawClasses || rawClasses.length === 0) {
      rawClasses = [
        {
          key: '11-NonMed',
          id: '11-NonMed',
          name: 'Class 11th (Non-Medical)',
          grade: '11',
          section: '11-NonMed',
          stream: 'NON_MEDICAL',
          defaultSubject: 'PHYSICS',
          subjects: [
            { key: 'PHYSICS', name: 'Physics', totalChapters: 14, icon: 'zap' },
            { key: 'CHEMISTRY', name: 'Chemistry', totalChapters: 10, icon: 'flask-conical' },
            { key: 'MATHEMATICS', name: 'Mathematics', totalChapters: 13, icon: 'calculator' }
          ]
        },
        {
          key: '11-Med',
          id: '11-Med',
          name: 'Class 11th (Medical)',
          grade: '11',
          section: '11-Med',
          stream: 'MEDICAL',
          defaultSubject: 'BIOLOGY',
          subjects: [
            { key: 'PHYSICS', name: 'Physics', totalChapters: 14, icon: 'zap' },
            { key: 'CHEMISTRY', name: 'Chemistry', totalChapters: 10, icon: 'flask-conical' },
            { key: 'BIOLOGY', name: 'Biology', totalChapters: 13, icon: 'dna' }
          ]
        },
        {
          key: '12-NonMed',
          id: '12-NonMed',
          name: 'Class 12th (Non-Medical)',
          grade: '12',
          section: '12-NonMed',
          stream: 'NON_MEDICAL',
          defaultSubject: 'PHYSICS',
          subjects: [
            { key: 'PHYSICS', name: 'Physics', totalChapters: 14, icon: 'zap' },
            { key: 'CHEMISTRY', name: 'Chemistry', totalChapters: 10, icon: 'flask-conical' },
            { key: 'MATHEMATICS', name: 'Mathematics', totalChapters: 13, icon: 'calculator' }
          ]
        },
        {
          key: '12-Med',
          id: '12-Med',
          name: 'Class 12th (Medical)',
          grade: '12',
          section: '12-Med',
          stream: 'MEDICAL',
          defaultSubject: 'BIOLOGY',
          subjects: [
            { key: 'PHYSICS', name: 'Physics', totalChapters: 14, icon: 'zap' },
            { key: 'CHEMISTRY', name: 'Chemistry', totalChapters: 10, icon: 'flask-conical' },
            { key: 'BIOLOGY', name: 'Biology', totalChapters: 13, icon: 'dna' }
          ]
        },
        {
          key: '10-Science-A',
          id: '10-Science-A',
          name: 'Class 10th (Section A)',
          grade: '10',
          section: '10-Science-A',
          stream: 'FOUNDATION',
          defaultSubject: 'CLASS10_SCIENCE',
          subjects: [
            { key: 'CLASS10_SCIENCE', name: 'Science', totalChapters: 13, icon: 'atom' },
            { key: 'CLASS10_MATHEMATICS', name: 'Mathematics', totalChapters: 14, icon: 'calculator' }
          ]
        }
      ];
      inMemoryStore.classes = rawClasses;
    }

    // Attach real-time enrolled students from inMemoryStore.users
    let enrichedClasses = rawClasses.map(cls => ({
      ...cls,
      students: getStudents(cls.grade, cls.section || cls.key)
    }));

    // If a teacher's subject is specified (e.g. PHYSICS, BIOLOGY, CHEMISTRY, MATHEMATICS),
    // strictly scope each class's subjects to ONLY that subject, and omit classes that don't teach it!
    if (reqSubjKey) {
      enrichedClasses = enrichedClasses
        .filter(cls => cls.subjects && cls.subjects.some(s => {
          const sKey = (s.key || s.name || s || '').toString().toUpperCase();
          if (reqSubjKey === 'CLASS10_MATHEMATICS') return sKey === 'CLASS10_MATHEMATICS';
          if (reqSubjKey === 'CLASS10_SCIENCE') return sKey === 'CLASS10_SCIENCE';
          return sKey === reqSubjKey || (reqSubjKey === 'PHYSICS' && sKey === 'PHYSICS') || (reqSubjKey === 'CHEMISTRY' && sKey === 'CHEMISTRY') || (reqSubjKey === 'BIOLOGY' && sKey === 'BIOLOGY') || (reqSubjKey === 'MATHEMATICS' && sKey === 'MATHEMATICS');
        }))
        .map(cls => {
          const scopedSubjects = cls.subjects
            .filter(s => {
              const sKey = (s.key || s.name || s || '').toString().toUpperCase();
              if (reqSubjKey === 'CLASS10_MATHEMATICS') return sKey === 'CLASS10_MATHEMATICS';
              if (reqSubjKey === 'CLASS10_SCIENCE') return sKey === 'CLASS10_SCIENCE';
              return sKey === reqSubjKey;
            })
            .map(s => {
              if (typeof s === 'string') {
                const sU = s.toUpperCase();
                return {
                  key: sU,
                  name: sU === 'PHYSICS' ? 'Physics' : sU === 'CHEMISTRY' ? 'Chemistry' : sU === 'BIOLOGY' ? 'Biology' : sU === 'CLASS10_SCIENCE' ? 'Science' : 'Mathematics',
                  totalChapters: sU === 'PHYSICS' ? 14 : sU === 'CHEMISTRY' ? 10 : sU === 'BIOLOGY' ? 13 : sU === 'CLASS10_SCIENCE' ? 13 : 14,
                  icon: sU === 'PHYSICS' ? 'zap' : sU === 'CHEMISTRY' ? 'flask-conical' : sU === 'BIOLOGY' ? 'dna' : sU === 'CLASS10_SCIENCE' ? 'atom' : 'calculator'
                };
              }
              return s;
            });

          return {
            ...cls,
            defaultSubject: scopedSubjects[0]?.key || reqSubjKey,
            subjects: scopedSubjects
          };
        });
    }

    res.json({ success: true, count: enrichedClasses.length, classes: enrichedClasses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5b. POST /api/curriculum/classes - Dynamically create/add a new class
router.post('/classes', (req, res) => {
  try {
    const { name, grade, section, stream = 'NON_MEDICAL', subjects = [] } = req.body;
    if (!name || !section) {
      return res.status(400).json({ success: false, error: 'Class name and section code are required.' });
    }

    if (!inMemoryStore.classes) inMemoryStore.classes = [];
    const secTrimmed = section.trim();

    const existing = inMemoryStore.classes.find(c => c.section === secTrimmed || c.key === secTrimmed);
    if (existing) {
      return res.status(400).json({ success: false, error: `Class with section "${secTrimmed}" already exists.` });
    }

    // Determine subjects list
    let classSubjects = [];
    if (Array.isArray(subjects) && subjects.length > 0) {
      classSubjects = subjects.map(s => {
        if (typeof s === 'object') return s;
        const sUpper = String(s).toUpperCase();
        if (sUpper === 'PHYSICS') return { key: 'PHYSICS', name: 'Physics', totalChapters: 14, icon: 'zap' };
        if (sUpper === 'CHEMISTRY') return { key: 'CHEMISTRY', name: 'Chemistry', totalChapters: 10, icon: 'flask-conical' };
        if (sUpper === 'BIOLOGY') return { key: 'BIOLOGY', name: 'Biology', totalChapters: 13, icon: 'dna' };
        if (sUpper === 'MATHEMATICS') return { key: 'MATHEMATICS', name: 'Mathematics', totalChapters: 13, icon: 'calculator' };
        return { key: sUpper, name: s, totalChapters: 10, icon: 'book' };
      });
    } else {
      // Default based on stream
      if (stream === 'MEDICAL') {
        classSubjects = [
          { key: 'PHYSICS', name: 'Physics', totalChapters: 14, icon: 'zap' },
          { key: 'CHEMISTRY', name: 'Chemistry', totalChapters: 10, icon: 'flask-conical' },
          { key: 'BIOLOGY', name: 'Biology', totalChapters: 13, icon: 'dna' }
        ];
      } else {
        classSubjects = [
          { key: 'PHYSICS', name: 'Physics', totalChapters: 14, icon: 'zap' },
          { key: 'CHEMISTRY', name: 'Chemistry', totalChapters: 10, icon: 'flask-conical' },
          { key: 'MATHEMATICS', name: 'Mathematics', totalChapters: 13, icon: 'calculator' }
        ];
      }
    }

    const classId = req.body.id || secTrimmed;
    const newClass = {
      key: classId,
      id: classId,
      name: name.trim(),
      grade: String(grade || (classId.includes('11') ? '11' : (classId.includes('10') ? '10' : '12'))),
      section: secTrimmed,
      stream: stream,
      defaultSubject: classSubjects[0]?.key || 'PHYSICS',
      subjects: classSubjects,
      students: []
    };

    inMemoryStore.classes.push(newClass);

    res.status(201).json({
      success: true,
      class: newClass,
      message: `Class "${newClass.name}" (${newClass.section}) created successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5c. GET /api/curriculum/faculty - List all institutional departmental faculty profiles
router.get('/faculty', (req, res) => {
  try {
    const faculty = (inMemoryStore.users || []).filter(u => u.role === 'TEACHER');
    res.json({ success: true, count: faculty.length, faculty });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5d. POST /api/curriculum/faculty/login & POST /api/curriculum/auth/teacher-login
// Authenticates or registers teacher session with phone number, full name, and subject expertise
function handleTeacherLogin(req, res) {
  try {
    const { phone, name, subjectKey, facultyId, email, grade } = req.body;
    const users = inMemoryStore.users || [];

    // Sanitize phone (extract digits)
    const rawPhone = (phone || '').toString().trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    let sKeyUpper = (subjectKey || 'BIOLOGY').toString().toUpperCase().trim();

    let teacher = null;

    // 1. Look up by phone if provided
    if (cleanPhone) {
      teacher = users.find(u => u.role === 'TEACHER' && (u.phone === cleanPhone || (u.phone && u.phone.replace(/\D/g, '') === cleanPhone)));
    }

    // 2. Look up by facultyId
    if (!teacher && facultyId) {
      teacher = users.find(u => u.role === 'TEACHER' && u.id === facultyId);
    }

    // 3. Look up by email
    if (!teacher && email) {
      teacher = users.find(u => u.role === 'TEACHER' && u.email?.toLowerCase() === email.toLowerCase());
    }

    // 4. Look up by subject if no phone specified
    if (!teacher && !cleanPhone && subjectKey) {
      teacher = users.find(u => u.role === 'TEACHER' && (u.subjectKey === sKeyUpper || u.department === sKeyUpper));
    }

    // If teacher already exists and request did not explicitly provide subjectKey, preserve their existing subjectKey
    if (teacher && !subjectKey) {
      sKeyUpper = (teacher.subjectKey || teacher.department || sKeyUpper).toUpperCase();
    }

    // Determine if Class 10 scope applies
    const isClass10 = String(grade) === '10' 
      || sKeyUpper.startsWith('CLASS10_')
      || (teacher && (String(teacher.grade) === '10' || teacher.defaultClass === '10-Science-A' || teacher.subjectKey?.startsWith('CLASS10_')));

    let sName = 'Physics';
    let sKey = sKeyUpper;
    let sDesignation = '';
    let sDefaultClass = '11-NonMed';
    let sTargetStream = 'JEE';
    let sStreamText = '';

    if (isClass10) {
      if (sKeyUpper === 'CLASS10_SCIENCE' || sKeyUpper === 'SCIENCE' || sKeyUpper === 'PHYSICS' || sKeyUpper === 'CHEMISTRY') {
        sKey = 'CLASS10_SCIENCE';
        sName = 'Science';
        sDesignation = 'Class 10th Science Faculty & Board Coordinator';
        sDefaultClass = '10-Science-A';
        sTargetStream = 'CBSE_CLASS_10';
        sStreamText = 'Assigned Subject: Science • Class 10 (CBSE & HP Board Foundation)';
      } else {
        sKey = 'CLASS10_MATHEMATICS';
        sName = 'Mathematics';
        sDesignation = 'Class 10th Mathematics Faculty & Board Coordinator';
        sDefaultClass = '10-Science-A';
        sTargetStream = 'CBSE_CLASS_10';
        sStreamText = 'Assigned Subject: Mathematics • Class 10 (CBSE & HP Board Foundation)';
      }
    } else {
      if (sKeyUpper === 'PHYSICS') {
        sName = 'Physics';
        sDesignation = 'Senior Physics Faculty & HOD';
        sDefaultClass = '12-NonMed';
        sTargetStream = 'JEE';
        sStreamText = 'Assigned Subject: Physics • Classes 11 & 12 (NEET, JEE Main & CBSE Boards)';
      } else if (sKeyUpper === 'CHEMISTRY') {
        sName = 'Chemistry';
        sDesignation = 'Senior Chemistry Faculty & HOD';
        sDefaultClass = '12-NonMed';
        sTargetStream = 'JEE';
        sStreamText = 'Assigned Subject: Chemistry • Classes 11 & 12 (NEET, JEE Main & CBSE Boards)';
      } else if (sKeyUpper === 'BIOLOGY') {
        sName = 'Biology';
        sDesignation = 'Senior Biology Faculty & NEET Coordinator';
        sDefaultClass = '12-Med';
        sTargetStream = 'NEET';
        sStreamText = 'Assigned Subject: Biology • Classes 11 & 12 Medical (NEET UG & CBSE Boards)';
      } else {
        sKey = 'MATHEMATICS';
        sName = 'Mathematics';
        sDesignation = 'Senior Mathematics Faculty & HOD';
        sDefaultClass = '12-NonMed';
        sTargetStream = 'JEE';
        sStreamText = 'Assigned Subject: Mathematics • Classes 11 & 12 (JEE Main/Adv & CBSE Boards)';
      }
    }

    const cleanName = (name && name.trim()) ? name.trim() : (teacher?.full_name || teacher?.name || (isClass10 ? `Faculty (${sName} Class 10)` : `Faculty (${sName})`));

    if (teacher) {
      // Update details if supplied
      if (name && name.trim()) {
        teacher.full_name = cleanName;
        teacher.name = cleanName;
      }
      if (cleanPhone) {
        teacher.phone = cleanPhone;
      }
      teacher.subjectKey = sKey;
      teacher.subject = sName;
      teacher.subjectName = sName;
      teacher.department = isClass10 ? (sKey === 'CLASS10_SCIENCE' ? 'SCIENCE' : 'MATHEMATICS') : sKeyUpper;
      teacher.grade = isClass10 ? '10' : (teacher.grade || '11');
      teacher.defaultClass = sDefaultClass;
      teacher.targetStream = sTargetStream;
      teacher.designation = teacher.designation || sDesignation;
      teacher.streamText = sStreamText;
    } else {
      // Create new teacher profile
      teacher = {
        id: `fac_${sKey.toLowerCase()}_${cleanPhone || Date.now()}`,
        full_name: cleanName,
        name: cleanName,
        role: 'TEACHER',
        phone: cleanPhone || '9816010000',
        email: email || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || sKey.toLowerCase()}@haps.edu.in`,
        subject: sName,
        subjectName: sName,
        subjectKey: sKey,
        department: isClass10 ? (sKey === 'CLASS10_SCIENCE' ? 'SCIENCE' : 'MATHEMATICS') : sKeyUpper,
        designation: sDesignation,
        grade: isClass10 ? '10' : '11',
        defaultClass: sDefaultClass,
        targetStream: sTargetStream,
        streamText: sStreamText
      };
      inMemoryStore.users.push(teacher);
    }

    if (!inMemoryStore.teachers) inMemoryStore.teachers = {};
    if (teacher.phone) inMemoryStore.teachers[teacher.phone] = teacher;
    inMemoryStore.teachers[teacher.id] = teacher;

    res.json({
      success: true,
      teacher,
      faculty: teacher,
      message: `Signed in as ${teacher.full_name} (${teacher.designation}). Scoped strictly to Department of ${teacher.subjectName}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.post('/faculty/login', handleTeacherLogin);
router.post('/auth/teacher-login', handleTeacherLogin);

// 5d-2. GET /api/curriculum/faculty/lookup - Quick lookup by mobile number
router.get('/faculty/lookup', (req, res) => {
  try {
    const { phone } = req.query;
    const cleanPhone = (phone || '').toString().replace(/\D/g, '');
    if (!cleanPhone) {
      return res.status(400).json({ success: false, error: 'Phone number is required.' });
    }
    const users = inMemoryStore.users || [];
    const teacher = users.find(u => u.role === 'TEACHER' && (u.phone === cleanPhone || (u.phone && u.phone.replace(/\D/g, '') === cleanPhone)));
    if (teacher) {
      return res.json({ success: true, exists: true, teacher, faculty: teacher });
    }
    return res.json({ success: true, exists: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5d-3. GET /api/curriculum/students - List enrolled students filtered by teacher subject & stream
router.get('/students', (req, res) => {
  try {
    const { subjectKey, teacherSubjectKey, grade, section } = req.query;
    const sKey = (subjectKey || teacherSubjectKey || '').toUpperCase().trim();
    let students = (inMemoryStore.users || []).filter(u => u.role === 'STUDENT');

    if (grade && grade !== 'ALL') {
      students = students.filter(s => String(s.grade) === String(grade));
    }

    if (section && section !== 'ALL') {
      students = students.filter(s => s.section === section || s.section?.toLowerCase() === section.toLowerCase());
    }

    if (sKey) {
      if (sKey === 'BIOLOGY') {
        // Only students in Medical classes taking Biology
        students = students.filter(s => (s.section || '').includes('Med') && !(s.section || '').includes('NonMed'));
      } else if (sKey === 'MATHEMATICS') {
        // Only students in Non-Medical or Foundation classes taking Mathematics
        students = students.filter(s => (s.section || '').includes('NonMed') || (s.section || '').includes('Science-A'));
      } else if (sKey === 'CLASS10_MATHEMATICS' || sKey === 'CLASS10_SCIENCE') {
        // Strictly Class 10 Foundation students
        students = students.filter(s => String(s.grade) === '10' || (s.section || '').includes('Science-A'));
      }
    }

    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5e. POST /api/curriculum/students - Add/enroll a new student into class roster
router.post('/students', (req, res) => {
  try {
    const name = req.body.name || req.body.fullName;
    const rollNumber = req.body.rollNumber || req.body.roll_number;
    const section = req.body.section || req.body.classId || '11-NonMed';
    const grade = req.body.grade;
    const targetExam = req.body.targetExam || req.body.target_exam || 'JEE_MAIN';
    const parentPhone = req.body.parentPhone || req.body.parent_phone || '+91 98160-XXXXX';
    const board = req.body.board || 'CBSE';
    const hostelResident = req.body.hostelResident !== undefined ? req.body.hostelResident : (req.body.hostel_resident !== undefined ? req.body.hostel_resident : true);

    if (!name || !rollNumber) {
      return res.status(400).json({ success: false, error: 'Student full name and roll number are required.' });
    }

    if (!inMemoryStore.users) inMemoryStore.users = [];

    const existing = inMemoryStore.users.find(u => u.roll_number?.toLowerCase() === rollNumber.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `A student with roll number "${rollNumber.trim()}" already exists (${existing.full_name}).`
      });
    }

    // Auto-infer grade if not explicitly supplied
    let inferredGrade = grade;
    if (!inferredGrade) {
      if (section.includes('11')) inferredGrade = '11';
      else if (section.includes('10')) inferredGrade = '10';
      else inferredGrade = '12';
    }

    const newStudent = {
      id: `stu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      full_name: name.trim(),
      roll_number: rollNumber.trim(),
      grade: String(inferredGrade),
      section: section,
      board: board,
      target_exam: targetExam,
      parent_phone: parentPhone,
      hostel_resident: Boolean(hostelResident),
      role: 'STUDENT',
      created_at: new Date().toISOString()
    };

    inMemoryStore.users.push(newStudent);

    // Get updated total students in this section
    const currentClassStudents = inMemoryStore.users.filter(u => u.role === 'STUDENT' && u.section === section);

    res.status(201).json({
      success: true,
      student: newStudent,
      enrolledCount: currentClassStudents.length,
      totalStudentsInClass: currentClassStudents.length,
      classStudents: currentClassStudents.map(s => ({ id: s.id, name: s.full_name, roll: s.roll_number })),
      message: `Enrolled student ${newStudent.full_name} (${newStudent.roll_number}) into ${section} successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/curriculum/generate-test - Generate test/quiz/assignment chapter-wise or subtopic-wise with STRICT subject isolation
router.post('/generate-test', async (req, res) => {
  try {
    const {
      classKey = '12-NonMed',
      grade = '12',
      section = '12-NonMed',
      subjectKey = 'PHYSICS',
      subjectName = 'Physics',
      chapterNumber = 1,
      chapterName = 'Electric Charges and Fields',
      subtopics = [],
      mode = 'QUIZ',
      questionCount = 5,
      difficulty = 'MEDIUM',
      title = null,
      autoAttempt = false
    } = req.body;

    const count = Math.min(25, Math.max(1, Number(questionCount) || 5));
    const banks = inMemoryStore.subjectBanks || {};

    // 1. Strict Canonical Subject Determination
    const sName = (subjectName || '').toLowerCase().trim();
    const sKey = (subjectKey || '').toUpperCase().trim();
    let targetBank = [];
    let canonicalSubject = 'Physics';
    let resolvedSubjectKey = 'PHYSICS';

    if (sName.includes('chem') || sKey.includes('CHEM')) {
      targetBank = banks.senior_chemistry || [];
      canonicalSubject = 'Chemistry';
      resolvedSubjectKey = 'CHEMISTRY';
    } else if (sName.includes('bio') || sKey.includes('BIO')) {
      targetBank = banks.senior_biology || [];
      canonicalSubject = 'Biology';
      resolvedSubjectKey = 'BIOLOGY';
    } else if (sName.includes('math') || sKey.includes('MATH')) {
      const isC10 = String(grade) === '10' || sKey === 'CLASS10_MATHEMATICS';
      targetBank = isC10 ? (banks.class10_math_pyq_ncert || banks.class10_maths || []) : (banks.senior_mathematics || []);
      canonicalSubject = 'Mathematics';
      resolvedSubjectKey = isC10 ? 'CLASS10_MATHEMATICS' : 'MATHEMATICS';
    } else if (sName.includes('phys') || sKey.includes('PHYS')) {
      targetBank = banks.senior_physics || [];
      canonicalSubject = 'Physics';
      resolvedSubjectKey = 'PHYSICS';
    } else if ((String(grade) === '10' || sKey === 'CLASS10_SCIENCE') && (sName.includes('sci') || sKey.includes('SCI'))) {
      targetBank = banks.class10_science || [];
      canonicalSubject = 'Science';
      resolvedSubjectKey = 'CLASS10_SCIENCE';
    } else {
      targetBank = banks.senior_physics || [];
      canonicalSubject = subjectName || 'Physics';
      resolvedSubjectKey = subjectKey || 'PHYSICS';
    }

    // 2. Build strictly isolated question pool for this subject only
    const subjectQuestions = [
      ...targetBank,
      ...(inMemoryStore.questions || []).filter(q => {
        const qSub = (q.subject || '').toLowerCase();
        const qKey = (q.subjectKey || '').toUpperCase();
        return qSub === canonicalSubject.toLowerCase() || qKey === resolvedSubjectKey;
      })
    ];

    // 3. Filter questions for matching chapter & subtopics
    const targetChap = (chapterName || '').toLowerCase().trim();
    let matchingQuestions = subjectQuestions.filter(q => {
      const qChap = (q.chapter || q.chapter_name || '').toLowerCase().trim();
      if (!qChap || !targetChap) return false;
      return qChap === targetChap || qChap.includes(targetChap) || targetChap.includes(qChap);
    });

    if (subtopics && subtopics.length > 0 && matchingQuestions.length > 0) {
      const subtopicMatches = matchingQuestions.filter(q => {
        const qTopic = (q.subtopic || q.topic || '').toLowerCase();
        return subtopics.some(sub => qTopic.includes(sub.toLowerCase()) || sub.toLowerCase().includes(qTopic));
      });
      if (subtopicMatches.length > 0) {
        matchingQuestions = subtopicMatches;
      }
    }

    // If chapter name didn't match pre-seeded questions, pick from the SAME subject pool (never cross subject!)
    if (matchingQuestions.length === 0) {
      console.log(`[TEST GENERATOR] Using general ${canonicalSubject} pool for chapter: ${chapterName}`);
      matchingQuestions = subjectQuestions;
    }

    // Deduplicate
    const seen = new Set();
    const curatedQuestions = [];
    matchingQuestions.forEach(q => {
      const key = q.question_latex || q.questionText || q.id;
      if (!seen.has(key)) {
        seen.add(key);
        curatedQuestions.push(q);
      }
    });

    const selectedQuestions = curatedQuestions.sort(() => 0.5 - Math.random()).slice(0, count);

    // If more questions needed, fill from other verified questions in this subject bank first
    if (selectedQuestions.length < count && subjectQuestions.length > selectedQuestions.length) {
      const remainingPool = subjectQuestions.filter(q => {
        const key = q.question_latex || q.questionText || q.id;
        return !seen.has(key);
      });
      while (selectedQuestions.length < count && remainingPool.length > 0) {
        const picked = remainingPool.splice(Math.floor(Math.random() * remainingPool.length), 1)[0];
        seen.add(picked.question_latex || picked.questionText || picked.id);
        selectedQuestions.push(picked);
      }
    }

    // 4. If more questions needed, generate with AI engine strictly scoped to canonical subject
    if (selectedQuestions.length < count) {
      const needed = count - selectedQuestions.length;
      console.log(`[TEST GENERATOR] Synthesizing ${needed} supplementary questions for ${canonicalSubject} -> ${chapterName}...`);
      const targetSub = (subtopics && subtopics.length > 0) ? subtopics[0] : 'Fundamental Application';
      for (let i = 0; i < needed; i++) {
        try {
          const fresh = await generateLlmQuestion({
            grade: String(grade),
            subject: canonicalSubject,
            chapter: `${chapterName} – ${targetSub}`,
            ncertSection: `${chapterNumber}.${i + 1}`,
            board: section.includes('NonMed') ? 'JEE_MAIN' : (section.includes('Med') ? 'NEET' : 'CBSE'),
            difficulty,
            questionType: 'MCQ_SINGLE',
            provider: 'auto'
          });
          if (fresh && fresh.question_latex) {
            const cleanQ = {
              ...fresh,
              id: `q_gen_${Date.now()}_${i}`,
              grade: String(grade),
              subject: canonicalSubject,
              subjectKey: resolvedSubjectKey,
              chapter: chapterName,
              chapter_name: chapterName,
              topic: targetSub,
              subtopic: targetSub,
              benchmark_time_seconds: 90
            };
            selectedQuestions.push(cleanQ);
            inMemoryStore.questions.push(cleanQ);
          }
        } catch (e) {
          console.warn('[TEST GENERATOR] Supplementary question fallback:', e.message);
        }
      }
    }

    const modeLabel = mode === 'QUIZ' ? 'Speed Quiz' : (mode === 'ASSIGNMENT' ? 'Homework Assignment' : 'Diagnostic Test');
    const finalTitle = title || `Class ${grade} (${section.replace('12-', '').replace('10-', '')}) ${canonicalSubject}: ${chapterName} ${modeLabel}`;
    const durationMinutes = mode === 'QUIZ' ? count * 2 : (mode === 'ASSIGNMENT' ? count * 4 : count * 3);
    const totalMarks = count * 4;
    // Ensure 100% of questions in the test have authentic, scientifically rich options (Never generic Option A/B)
    selectedQuestions.forEach(q => {
      q.subject = canonicalSubject;
      q.subjectKey = resolvedSubjectKey;
      ensureQuestionHasRichOptions(q);
    });

    const newAssessment = {
      id: `asgn_${Date.now()}`,
      title: finalTitle,
      description: `${modeLabel} assigned to ${section} covering ${chapterName}. Total ${selectedQuestions.length} questions.`,
      grade: String(grade),
      section: section,
      subject: canonicalSubject,
      subjectKey: resolvedSubjectKey,
      chapterName: chapterName,
      subtopics: subtopics,
      mode: mode,
      durationMinutes,
      totalMarks,
      totalQuestions: selectedQuestions.length,
      questions: selectedQuestions,
      createdAt: new Date().toISOString()
    };

    if (!inMemoryStore.assessments) inMemoryStore.assessments = [];
    inMemoryStore.assessments.unshift(newAssessment);

    const classStudents = (inMemoryStore.users || []).filter(u => u.role === 'STUDENT' && u.grade === String(grade) && u.section === section);
    if (!inMemoryStore.submissions) inMemoryStore.submissions = [];

    // Only seed submissions if autoAttempt is true
    if (autoAttempt) {
      classStudents.slice(0, 6).forEach((stu, idx) => {
        const correctCount = Math.max(1, count - (idx % 3));
        const score = correctCount * 4;
        const subRecord = {
          id: `sub_${newAssessment.id}_${stu.id.slice(0, 8)}`,
          submissionId: `sub_${newAssessment.id}_${stu.id.slice(0, 8)}`,
          assessmentId: newAssessment.id,
          assessmentTitle: finalTitle,
          subject: canonicalSubject,
          subjectKey: resolvedSubjectKey,
          chapterName: chapterName,
          studentId: stu.id,
          studentName: stu.full_name,
          rollNumber: stu.roll_number,
          totalScore: score,
          score: score,
          totalMarks: totalMarks,
          percentage: Math.round((score / totalMarks) * 100),
          totalTimeSpentSeconds: Math.round(durationMinutes * 60 * (0.6 + (idx * 0.08))),
          submittedAt: new Date(Date.now() - idx * 600000).toISOString(),
          answers: selectedQuestions.map((q, qIdx) => ({
            questionIndex: qIdx + 1,
            questionId: q.id,
            selectedOption: qIdx < correctCount ? (q.correct_answer_latex || q.correct_answer || 'A') : 'C',
            isCorrect: qIdx < correctCount,
            timeSpentSeconds: 65 + (idx * 12) + (qIdx * 10)
          })),
          questionBreakdown: selectedQuestions.map((q, qIdx) => ({
            questionIndex: qIdx + 1,
            questionId: q.id,
            subtopic: q.subtopic || q.topic || 'General',
            selectedOption: qIdx < correctCount ? (q.correct_answer_latex || q.correct_answer || 'A') : 'C',
            correctAnswer: (q.correct_answer_latex || q.correct_answer || 'A'),
            isCorrect: qIdx < correctCount,
            timeSpentSeconds: 65 + (idx * 12) + (qIdx * 10),
            benchmarkSeconds: q.benchmark_time_seconds || 90,
            mistakeClassification: {
              type: qIdx < correctCount ? 'NONE' : (qIdx % 2 === 0 ? 'CONCEPTUAL' : 'CALCULATION'),
              label: qIdx < correctCount ? 'Mastered' : (qIdx % 2 === 0 ? 'Conceptual Misconception' : 'Calculation Slip'),
              explanation: qIdx < correctCount ? 'Correct solution.' : 'Minor arithmetic error or misconception.'
            }
          }))
        };
        inMemoryStore.submissions.unshift(subRecord);
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully created and assigned ${modeLabel} to ${classStudents.length} students in ${section}!`,
      assessment: newAssessment,
      enrolledStudentsCount: classStudents.length,
      assignedStudentsCount: classStudents.length,
      assignedStudents: classStudents.map(s => ({ id: s.id, name: s.full_name, roll: s.roll_number })),
      status: autoAttempt ? 'EVALUATED' : 'READY_FOR_ATTEMPT'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. POST /api/curriculum/simulate-attempts - Attempt & evaluate test for class students, generating progress dashboard
router.post('/simulate-attempts', (req, res) => {
  try {
    const { assessmentId } = req.body;
    if (!assessmentId) {
      return res.status(400).json({ success: false, error: 'assessmentId is required' });
    }

    const assessment = (inMemoryStore.assessments || []).find(a => a.id === assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, error: `Assessment "${assessmentId}" not found.` });
    }

    const grade = String(assessment.grade || '12');
    const section = assessment.section || '12-NonMed';
    let classStudents = (inMemoryStore.users || []).filter(u => u.role === 'STUDENT' && u.grade === grade && u.section === section);

    if (classStudents.length === 0) {
      if (grade === '10') {
        classStudents = [
          { id: 'stu_10_01', full_name: 'Rohit Verma', roll_number: '10-A-01' },
          { id: 'stu_10_02', full_name: 'Aditya Chauhan', roll_number: '10-A-02' },
          { id: 'stu_10_03', full_name: 'Tanvi Sood', roll_number: '10-A-03' },
          { id: 'stu_10_04', full_name: 'Nikhil Rana', roll_number: '10-A-04' },
          { id: 'stu_10_05', full_name: 'Priya Sharma', roll_number: '10-A-05' },
          { id: 'stu_10_06', full_name: 'Aarav Gupta', roll_number: '10-A-06' },
          { id: 'stu_10_07', full_name: 'Sneha Patel', roll_number: '10-A-07' },
          { id: 'stu_10_08', full_name: 'Kabir Mehta', roll_number: '10-A-08' }
        ];
      } else {
        classStudents = [
          { id: 'b0000000-0000-0000-0000-000000000001', full_name: 'Aryan Sharma', roll_number: '12-NM-01' },
          { id: 'b0000000-0000-0000-0000-000000000002', full_name: 'Rohit Negi', roll_number: '12-NM-02' },
          { id: 'b0000000-0000-0000-0000-000000000003', full_name: 'Kavya Verma', roll_number: '12-NM-03' },
          { id: 'b0000000-0000-0000-0000-000000000004', full_name: 'Kunal Sharma', roll_number: '12-NM-04' },
          { id: 'b0000000-0000-0000-0000-000000000005', full_name: 'Divyansh Thakur', roll_number: '12-NM-05' },
          { id: 'b0000000-0000-0000-0000-000000000006', full_name: 'Akshat Jaswal', roll_number: '12-NM-06' },
          { id: 'b0000000-0000-0000-0000-000000000007', full_name: 'Rahul Sen', roll_number: '12-NM-07' },
          { id: 'b0000000-0000-0000-0000-000000000008', full_name: 'Sahil Dhiman', roll_number: '12-NM-08' }
        ];
      }
    }

    if (!inMemoryStore.submissions) inMemoryStore.submissions = [];
    inMemoryStore.submissions = inMemoryStore.submissions.filter(s => s.assessmentId !== assessment.id);

    const qCount = assessment.questions.length;
    const totalMarks = assessment.totalMarks || (qCount * 4);

    classStudents.forEach((stu, idx) => {
      let correctRatio = 0.8;
      if (idx === 0 || idx === 2) correctRatio = 1.0;
      else if (idx === 1) correctRatio = 0.6;
      else if (idx === 3) correctRatio = 0.4;
      else if (idx === 4) correctRatio = 0.75;
      else if (idx === 5) correctRatio = 0.5;
      else correctRatio = 0.65;

      const correctCount = Math.max(1, Math.round(qCount * correctRatio));
      const score = Math.min(totalMarks, Math.max(0, correctCount * 4 - (qCount - correctCount)));
      const pct = Math.round((score / totalMarks) * 100);

      const qBreakdown = assessment.questions.map((q, qIdx) => {
        const isCorrect = qIdx < correctCount;
        const correctOpt = (q.correct_answer_latex || q.correct_answer || 'B').trim();
        const wrongOpts = (q.options_latex || []).map(o => o.key).filter(k => k !== correctOpt);
        const selectedOpt = isCorrect ? correctOpt : (wrongOpts[idx % Math.max(1, wrongOpts.length)] || 'C');

        const benchmark = q.benchmark_time_seconds || 90;
        const timeSpent = Math.round(benchmark * (0.65 + (idx * 0.1) + (qIdx * 0.08)));

        let mistakeType = 'NONE';
        let mistakeExplanation = 'Accurate conceptual reasoning & calculation.';
        if (!isCorrect) {
          if (qIdx % 3 === 0) {
            mistakeType = 'CONCEPTUAL';
            mistakeExplanation = 'Misapplied core theorem or misinterpreted physical boundary conditions.';
          } else if (qIdx % 3 === 1) {
            mistakeType = 'FORMULA_BASED';
            mistakeExplanation = 'Formula confusion: wrong proportionality factor or power of distance.';
          } else {
            mistakeType = 'CALCULATION';
            mistakeExplanation = 'Sign convention slip or arithmetic error in powers of ten.';
          }
        }

        return {
          questionIndex: qIdx + 1,
          questionId: q.id,
          subtopic: q.subtopic || q.topic || 'General',
          selectedOption: selectedOpt,
          correctAnswer: correctOpt,
          isCorrect,
          timeSpentSeconds: timeSpent,
          benchmarkSeconds: benchmark,
          mistakeClassification: {
            type: mistakeType,
            label: isCorrect ? 'Mastered' : (mistakeType === 'CONCEPTUAL' ? 'Conceptual Misconception' : (mistakeType === 'FORMULA_BASED' ? 'Formula Confusion' : 'Calculation Slip')),
            explanation: mistakeExplanation
          }
        };
      });

      const totalTime = qBreakdown.reduce((sum, item) => sum + item.timeSpentSeconds, 0);

      const subRecord = {
        submissionId: `sub_${assessment.id}_${stu.id || idx}_${Date.now()}`,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        subject: assessment.subject || 'Biology',
        subjectKey: assessment.subjectKey || 'BIOLOGY',
        chapterName: assessment.chapterName || '',
        studentId: stu.id,
        studentName: stu.full_name || stu.name,
        rollNumber: stu.roll_number || stu.roll || `12-NM-0${idx + 1}`,
        grade: assessment.grade,
        section: assessment.section,
        totalScore: score,
        score: score,
        totalMarks: totalMarks,
        percentage: pct,
        totalTimeSpentSeconds: totalTime,
        submittedAt: new Date(Date.now() - (idx * 180000)).toISOString(),
        smartCardSummary: `Scored ${pct}% on ${assessment.title}. Solved ${correctCount}/${qCount} correctly with avg pacing of ${Math.round(totalTime / qCount)}s/Q.`,
        questionBreakdown: qBreakdown
      };

      inMemoryStore.submissions.unshift(subRecord);
    });

    res.json({
      success: true,
      message: `Successfully evaluated ${classStudents.length} student attempts for ${assessment.title}. Progress dashboard is now ready!`,
      assessmentId: assessment.id,
      submissionsCount: classStudents.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

