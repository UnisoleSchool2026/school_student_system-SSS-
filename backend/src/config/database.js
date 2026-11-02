// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: POSTGRESQL DATABASE CLIENT
// Dual Mode: Live PostgreSQL Pool with Graceful In-Memory Fallback for Dev
// ============================================================================

let Pool = null;
try {
  Pool = require('pg').Pool;
} catch (e) {
  // pg module not yet installed locally; in-memory store active
}

let class10MathQuestions = [];
try {
  class10MathQuestions = require('../services/class10MathQuestionBank').class10MathQuestions;
} catch (e) {
  console.warn('[DATABASE] Failed to load class10MathQuestionBank:', e.message);
}

let class10PyqQuestions = [];
try {
  class10PyqQuestions = require('../services/class10PyqBank').class10Questions || [];
} catch (e) {
  console.warn('[DATABASE] Failed to load class10PyqBank:', e.message);
}

let pool = null;
let isConnected = false;

// Mock in-memory store for instant offline development & test suites
const inMemoryStore = {
  users: [
    // Class 12th Non-Medical (Physics, Chemistry, Maths -> JEE / Boards)
    { id: 'b0000000-0000-0000-0000-000000000001', full_name: 'Aryan Sharma', roll_number: '12-NM-01', grade: '12', section: '12-NonMed', board: 'CBSE', target_exam: 'JEE_ADVANCED', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000002', full_name: 'Rohit Negi', roll_number: '12-NM-02', grade: '12', section: '12-NonMed', board: 'HP_BOARD', target_exam: 'JEE_MAIN', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000003', full_name: 'Kavya Verma', roll_number: '12-NM-03', grade: '12', section: '12-NonMed', board: 'CBSE', target_exam: 'JEE_ADVANCED', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000004', full_name: 'Kunal Sharma', roll_number: '12-NM-04', grade: '12', section: '12-NonMed', board: 'CBSE', target_exam: 'JEE_MAIN', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000005', full_name: 'Divyansh Thakur', roll_number: '12-NM-05', grade: '12', section: '12-NonMed', board: 'HP_BOARD', target_exam: 'CBSE', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000006', full_name: 'Akshat Jaswal', roll_number: '12-NM-06', grade: '12', section: '12-NonMed', board: 'CBSE', target_exam: 'JEE_MAIN', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000007', full_name: 'Rahul Sen', roll_number: '12-NM-07', grade: '12', section: '12-NonMed', board: 'CBSE', target_exam: 'JEE_ADVANCED', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000008', full_name: 'Sahil Dhiman', roll_number: '12-NM-08', grade: '12', section: '12-NonMed', board: 'HP_BOARD', target_exam: 'HP_BOARD', role: 'STUDENT' },

    // Class 12th Medical (Physics, Chemistry, Biology -> NEET / Boards)
    { id: 'b0000000-0000-0000-0000-000000000011', full_name: 'Ananya Thakur', roll_number: '12-M-01', grade: '12', section: '12-Med', board: 'HP_BOARD', target_exam: 'NEET_UG', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000012', full_name: 'Simran Kaur', roll_number: '12-M-02', grade: '12', section: '12-Med', board: 'CBSE', target_exam: 'NEET_UG', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000013', full_name: 'Mehak Sharma', roll_number: '12-M-03', grade: '12', section: '12-Med', board: 'CBSE', target_exam: 'NEET_UG', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000014', full_name: 'Pallavi Katoch', roll_number: '12-M-04', grade: '12', section: '12-Med', board: 'HP_BOARD', target_exam: 'NEET_UG', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000015', full_name: 'Shreya Dogra', roll_number: '12-M-05', grade: '12', section: '12-Med', board: 'CBSE', target_exam: 'NEET_UG', role: 'STUDENT' },

    // Class 10th (Secondary Foundation)
    { id: 'b0000000-0000-0000-0000-000000000021', full_name: 'Rohit Verma', roll_number: '10-A-01', grade: '10', section: '10-Science-A', board: 'CBSE', target_exam: 'JEE_MAIN', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000022', full_name: 'Aditya Chauhan', roll_number: '10-A-02', grade: '10', section: '10-Science-A', board: 'CBSE', target_exam: 'JEE_MAIN', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000023', full_name: 'Tanvi Sood', roll_number: '10-A-03', grade: '10', section: '10-Science-A', board: 'CBSE', target_exam: 'CBSE', role: 'STUDENT' },
    { id: 'b0000000-0000-0000-0000-000000000024', full_name: 'Nikhil Rana', roll_number: '10-A-04', grade: '10', section: '10-Science-A', board: 'HP_BOARD', target_exam: 'HP_BOARD', role: 'STUDENT' },

    // Class 11th Non-Medical (Physics, Chemistry, Maths -> JEE / Boards)
    { id: 'b0000000-0000-0000-0000-000000000031', full_name: 'Adarsh Katoch', roll_number: '11-NM-01', grade: '11', section: '11-NonMed', board: 'CBSE', target_exam: 'JEE_MAIN', role: 'STUDENT', hostel_resident: true },
    { id: 'b0000000-0000-0000-0000-000000000032', full_name: 'Pooja Sharma', roll_number: '11-NM-02', grade: '11', section: '11-NonMed', board: 'HP_BOARD', target_exam: 'JEE_MAIN', role: 'STUDENT', hostel_resident: false },
    { id: 'b0000000-0000-0000-0000-000000000033', full_name: 'Kunal Jamwal', roll_number: '11-NM-03', grade: '11', section: '11-NonMed', board: 'CBSE', target_exam: 'JEE_ADVANCED', role: 'STUDENT', hostel_resident: true },
    { id: 'b0000000-0000-0000-0000-000000000034', full_name: 'Suhani Rana', roll_number: '11-NM-04', grade: '11', section: '11-NonMed', board: 'HP_BOARD', target_exam: 'HP_BOARD', role: 'STUDENT', hostel_resident: false },

    // Class 11th Medical (Physics, Chemistry, Biology -> NEET / Boards)
    { id: 'b0000000-0000-0000-0000-000000000041', full_name: 'Riya Thakur', roll_number: '11-M-01', grade: '11', section: '11-Med', board: 'CBSE', target_exam: 'NEET_UG', role: 'STUDENT', hostel_resident: true },
    { id: 'b0000000-0000-0000-0000-000000000042', full_name: 'Ayush Banyal', roll_number: '11-M-02', grade: '11', section: '11-Med', board: 'HP_BOARD', target_exam: 'NEET_UG', role: 'STUDENT', hostel_resident: true },
    { id: 'b0000000-0000-0000-0000-000000000043', full_name: 'Deepak Soni', roll_number: '11-M-03', grade: '11', section: '11-Med', board: 'CBSE', target_exam: 'NEET_UG', role: 'STUDENT', hostel_resident: false },
    { id: 'b0000000-0000-0000-0000-000000000044', full_name: 'Kriti Dogra', roll_number: '11-M-04', grade: '11', section: '11-Med', board: 'HP_BOARD', target_exam: 'NEET_UG', role: 'STUDENT', hostel_resident: true },

    // Departmental Faculty (HAPS Senior Faculty Profiles)
    { id: 'fac_phy_01', full_name: 'Dr. Vikram Sharma', role: 'TEACHER', phone: '9816010001', email: 'vikram.phy@haps.edu.in', subject: 'Physics', subjectKey: 'PHYSICS', department: 'PHYSICS', designation: 'Senior Physics Faculty & HOD', defaultClass: '11-NonMed', targetStream: 'JEE' },
    { id: 'fac_chem_01', full_name: 'Prof. Sunita Rao', role: 'TEACHER', phone: '9816010002', email: 'sunita.chem@haps.edu.in', subject: 'Chemistry', subjectKey: 'CHEMISTRY', department: 'CHEMISTRY', designation: 'Senior Chemistry Faculty', defaultClass: '11-NonMed', targetStream: 'JEE' },
    { id: 'fac_bio_01', full_name: 'Dr. Ananya Mukherjee', role: 'TEACHER', phone: '9816010003', email: 'ananya.bio@haps.edu.in', subject: 'Biology', subjectKey: 'BIOLOGY', department: 'BIOLOGY', designation: 'Senior Biology Faculty & NEET Coordinator', defaultClass: '11-Med', targetStream: 'NEET' },
    { id: 'fac_math_01', full_name: 'Er. Rajesh Gupta', role: 'TEACHER', phone: '9816010004', email: 'rajesh.math@haps.edu.in', subject: 'Mathematics', subjectKey: 'MATHEMATICS', department: 'MATHEMATICS', designation: 'Senior Mathematics Faculty', defaultClass: '11-NonMed', targetStream: 'JEE' },

    // Class 10th Secondary Foundation Faculty (Maths & Science)
    { id: 'fac_c10_math_01', full_name: 'Mrs. Meenakshi Sharma', role: 'TEACHER', phone: '9816010010', email: 'meenakshi.math10@haps.edu.in', subject: 'Mathematics', subjectKey: 'CLASS10_MATHEMATICS', department: 'MATHEMATICS', designation: 'Class 10th Mathematics Faculty & Board Coordinator', grade: '10', defaultClass: '10-Science-A', targetStream: 'CBSE_CLASS_10', streamText: 'Assigned Subject: Mathematics • Class 10 (CBSE & HP Board Foundation)' },
    { id: 'fac_c10_sci_01', full_name: 'Er. Rakesh Thakur', role: 'TEACHER', phone: '9816010011', email: 'rakesh.sci10@haps.edu.in', subject: 'Science', subjectKey: 'CLASS10_SCIENCE', department: 'SCIENCE', designation: 'Class 10th Science Faculty & Board Coordinator', grade: '10', defaultClass: '10-Science-A', targetStream: 'CBSE_CLASS_10', streamText: 'Assigned Subject: Science • Class 10 (CBSE & HP Board Foundation)' }
  ],
  // Standard Institutional Classes
  classes: [
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
  ],
  // Subject-Wise Specialized Question Banks for:
  // - Class 10 Foundation (Maths, Science)
  // - Class 11 & 12 Non-Medical (Physics, Chemistry, Maths -> JEE Main / Adv / Boards)
  // - Class 11 & 12 Medical (Physics, Chemistry, Biology -> NEET / Boards)
  subjectBanks: {
    class10_maths: (class10MathQuestions && class10MathQuestions.length > 0) ? class10MathQuestions : [],
    class10_math_pyq_ncert: (class10MathQuestions && class10MathQuestions.length > 0) ? class10MathQuestions : [],
    class10_science: [
      {
        id: 'c10_s_01',
        grade: '10',
        stream: 'FOUNDATION',
        subject: 'Science',
        discipline: 'PHYSICS',
        chapter_number: 10,
        chapter_name: 'Light – Reflection and Refraction',
        topic: 'Spherical Mirrors',
        subtopic: 'Mirror Formula & Magnification',
        curriculum_board: 'CBSE_CLASS_10',
        pyq_appearance: 'CBSE 2024 & HPBOSE 2023',
        difficulty: 'MEDIUM',
        question_format: 'MCQ_SINGLE',
        benchmark_time_seconds: 90,
        marks_weightage: 1,
        question_latex: 'A concave mirror has a focal length of $15\\,\\text{cm}$. If an object is placed at $30\\,\\text{cm}$ in front of the mirror, the image is formed at:',
        options_latex: [
          { key: 'A', latex: '$-30\\,\\text{cm}$ in front of the mirror', is_correct: true, distractor_trap: null },
          { key: 'B', latex: '$+30\\,\\text{cm}$ behind the mirror', is_correct: false, distractor_trap: 'Failed to apply Cartesian sign convention' },
          { key: 'C', latex: '$-15\\,\\text{cm}$ at the focus', is_correct: false, distractor_trap: 'Confused center of curvature with focus' },
          { key: 'D', latex: 'Infinity', is_correct: false, distractor_trap: 'Assumed object was at the focus' }
        ],
        correct_answer_latex: 'A',
        solution_latex: 'Object is at $u = -30\\,\\text{cm} = 2f$. When an object is at the Center of Curvature $C$, a real and inverted image of the same size is formed at $C$, so $v = -30\\,\\text{cm}$.',
        socratic_hints: ["Calculate $2f$ for $f = 15\\,\\text{cm}$.", "What is the image position when object is at $C$ ($u = 2f$)?"]
      },
      ...class10PyqQuestions
        .filter(q => q.subject === 'Science')
        .map(q => ({
          id: q.id,
          grade: '10',
          stream: 'FOUNDATION',
          subject: 'Science',
          discipline: (q.chapter || '').toLowerCase().includes('light') || (q.chapter || '').toLowerCase().includes('elec') ? 'PHYSICS' : ((q.chapter || '').toLowerCase().includes('chem') || (q.chapter || '').toLowerCase().includes('metal') ? 'CHEMISTRY' : 'BIOLOGY'),
          chapter_number: (q.ncert_mapping && q.ncert_mapping.chapter_number) || 10,
          chapter_name: q.chapter,
          topic: (q.ncert_mapping && q.ncert_mapping.chapter_name) || q.chapter,
          subtopic: (q.ncert_mapping && q.ncert_mapping.ncert_section) || 'General',
          curriculum_board: 'CBSE_CLASS_10',
          pyq_appearance: (q.ncert_mapping && q.ncert_mapping.pyq_tag) || 'CBSE Board Exam',
          difficulty: q.difficulty || 'MEDIUM',
          question_format: q.question_type || 'MCQ_SINGLE',
          benchmark_time_seconds: q.benchmark_time_seconds || 120,
          marks_weightage: (q.ncert_mapping && q.ncert_mapping.marks) || 3,
          question_latex: q.question_latex,
          options_latex: q.options_latex || [],
          correct_answer_latex: q.correct_answer_latex,
          solution_latex: q.solution_latex,
          socratic_hints: q.socratic_hints || [],
          step_rubric: q.step_rubric || []
        }))
    ],
    senior_physics: [
      {
        id: 'snr_p_01',
        grade: '11',
        stream: 'COMMON_SENIOR',
        target_exam: 'JEE_MAIN',
        subject: 'Physics',
        chapter_number: 7,
        chapter_name: 'System of Particles and Rotational Motion',
        topic: 'Moment of Inertia & Torque',
        subtopic: 'Rolling Without Slipping',
        curriculum_board: 'JEE_MAIN',
        pyq_appearance: 'JEE Main 2024 (27 Jan Shift-1) & HPBOSE 2023',
        difficulty: 'HARD',
        question_format: 'MCQ_SINGLE',
        benchmark_time_seconds: 120,
        marks_weightage: 4,
        question_latex: 'A solid sphere of mass $M$ and radius $R$ rolls without slipping down an inclined plane of inclination $\\theta$. Find the linear acceleration $a$ of the center of mass.',
        options_latex: [
          { key: 'A', latex: '$a = \\frac{5}{7} g \\sin\\theta$', is_correct: true, distractor_trap: null },
          { key: 'B', latex: '$a = \\frac{2}{3} g \\sin\\theta$', is_correct: false, distractor_trap: 'Treated sphere as hollow sphere ($I = \\frac{2}{3}MR^2$)' },
          { key: 'C', latex: '$a = \\frac{1}{2} g \\sin\\theta$', is_correct: false, distractor_trap: 'Treated sphere as disc ($I = \\frac{1}{2}MR^2$)' },
          { key: 'D', latex: '$a = g \\sin\\theta$', is_correct: false, distractor_trap: 'Ignored rotational kinetic energy / friction torque' }
        ],
        correct_answer_latex: 'A',
        solution_latex: 'For pure rolling down an incline, acceleration $a = \\frac{g\\sin\\theta}{1 + \\frac{I}{MR^2}}$. For a solid sphere, $I = \\frac{2}{5}MR^2$. Therefore, $$a = \\frac{g\\sin\\theta}{1 + 2/5} = \\frac{5}{7}g\\sin\\theta$$.',
        socratic_hints: [
          "Recall the standard formula for linear acceleration in rolling without slipping: $a = \\frac{g\\sin\\theta}{1 + I/(MR^2)}$.",
          "What is the moment of inertia $I$ of a solid uniform sphere about its diameter?",
          "Substitute $I = \\frac{2}{5}MR^2$ and simplify the fraction."
        ]
      },
      {
        id: 'snr_p_02',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 9,
        chapter_name: 'Ray Optics and Optical Instruments',
        topic: 'Refraction at Spherical Surfaces and Lenses',
        subtopic: 'Derivation: Lens Maker\'s Formula: 1/f = (n₂/n₁ - 1)(1/R₁ - 1/R₂)',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & 2022 (5-Mark Guaranteed)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 360,
        marks_weightage: 5,
        question_latex: 'Derive the Lens Maker\'s formula for a thin double convex lens of radii of curvature $R_1$ and $R_2$ and refractive index $n_2$ placed in a medium of refractive index $n_1$: $$\\frac{1}{f} = \\left(\\frac{n_2}{n_1} - 1\\right)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)$$ A convex lens of focal length $20\\,\\text{cm}$ in air is immersed in water ($n_w = 4/3$). Calculate its new focal length in water ($n_g = 3/2$).',
        options_latex: [],
        correct_answer_latex: '$f_{\\text{water}} = 80\\,\\text{cm}$',
        solution_latex: '1. Refraction at first surface of radius $R_1$: $\\frac{n_2}{v_1} - \\frac{n_1}{u} = \\frac{n_2 - n_1}{R_1}$. 2. Refraction at second surface of radius $R_2$ where $v_1$ acts as virtual object: $\\frac{n_1}{v} - \\frac{n_2}{v_1} = \\frac{n_1 - n_2}{R_2} = -\\frac{n_2 - n_1}{R_2}$. 3. Adding the two surface equations: $\\frac{n_1}{v} - \\frac{n_1}{u} = (n_2 - n_1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right) \\implies \\frac{1}{v} - \\frac{1}{u} = \\left(\\frac{n_2}{n_1} - 1\\right)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)$. For $u = \\infty, v = f$, this gives $\\frac{1}{f} = \\left(\\frac{n_2}{n_1} - 1\\right)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)$. In air: $\\frac{1}{20} = (1.5 - 1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right) \\implies \\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right) = \\frac{1}{10}$. In water: $\\frac{1}{f_w} = \\left(\\frac{1.5}{4/3} - 1\\right)\\left(\\frac{1}{10}\\right) = \\left(\\frac{9}{8} - 1\\right)\\frac{1}{10} = \\frac{1}{80} \\implies f_w = 80\\,\\text{cm}$.',
        socratic_hints: [
          "Apply the single spherical surface refraction formula $\\frac{n_2}{v} - \\frac{n_1}{u} = \\frac{n_2 - n_1}{R}$ successively across both surfaces.",
          "Add the two surface refraction equations to eliminate the intermediate image distance $v_1$.",
          "Find the value of $(1/R_1 - 1/R_2)$ from the air focal length, then substitute the relative index $n_g/n_w$ for immersion in water."
        ]
      },
      {
        id: 'snr_p_03',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 3,
        chapter_name: 'Current Electricity',
        topic: 'Conduction Mechanism & Ohm\'s Law',
        subtopic: 'Derivation: Deduction of Ohm\'s law and resistivity: ρ = m/(ne²τ)',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2020 (5-Mark / 3-Mark)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 300,
        marks_weightage: 5,
        question_latex: 'Define drift velocity of free electrons. Derive the microscopic relation between electric current $I$ and drift velocity $v_d$. Hence, deduce Ohm\'s law and obtain the expression for resistivity $\\rho$ in terms of number density $n$ and relaxation time $\\tau$.',
        options_latex: [],
        correct_answer_latex: '$\\rho = \\frac{m}{n e^2 \\tau}$',
        solution_latex: '1. Drift Velocity Definition & Acceleration:\nDrift velocity $v_d$ is the average velocity acquired by free electrons under an applied electric field $E$.\nAcceleration of electron: $a = \\frac{eE}{m}$\nDrift velocity expression: $v_d = a\\tau = \\frac{eE}{m}\\tau\n\n2. Relation Between Current and Drift Velocity:\nDistance traveled in time $\\Delta t$: $L = v_d \\Delta t$\nTotal electrons in volume $A L$: $N = n A v_d \\Delta t$\nTotal charge transported: $\\Delta Q = N e = n e A v_d \\Delta t$\nElectric current: $I = \\frac{\\Delta Q}{\\Delta t} = n e A v_d\n\n3. Deduction of Ohm\'s Law and Resistivity:\nSubstitute $v_d = \\frac{eE}{m}\\tau$ and $E = \\frac{V}{L}$:\n$$I = n e A \\left(\\frac{e V}{m L}\\tau\\right) = \\left(\\frac{n e^2 \\tau A}{m L}\\right) V$$\n$$\\implies V = \\left(\\frac{m}{n e^2 \\tau}\\frac{L}{A}\\right) I$$\nComparing with macroscopic Ohm\'s law $V = R I$ where $R = \\rho \\frac{L}{A}$:\n$$\\rho = \\frac{m}{n e^2 \\tau}$$',
        socratic_hints: [
          "What is the average acceleration experienced by an electron of mass $m$ and charge $e$ in electric field $E$?",
          "How many free electrons pass through cross-section area $A$ in time interval $\\Delta t$?",
          "Express electric field $E$ in terms of potential difference $V$ and wire length $L$."
        ]
      },
      {
        id: 'snr_p_04',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 7,
        chapter_name: 'Alternating Current (AC)',
        topic: 'Series LCR Circuit',
        subtopic: 'Phasor Diagram Solution: Impedance Z = √[R² + (X_L - X_C)²]',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & 2023 (5-Mark Guaranteed)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 360,
        marks_weightage: 5,
        question_latex: 'An alternating voltage $V = V_0 \\sin \\omega t$ is applied across a series combination of a resistor $R$, an inductor $L$, and a capacitor $C$. Using a phasor diagram, derive the expression for the impedance $Z$ and phase angle $\\phi$. State the condition under which electrical resonance occurs and find the resonant frequency.',
        options_latex: [],
        correct_answer_latex: '$Z = \\sqrt{R^2 + (\\omega L - 1/(\\omega C))^2}$, $f_0 = \\frac{1}{2\\pi\\sqrt{LC}}$',
        solution_latex: '1. Series Circuit Voltage Phasors:\nLet series circuit current be $I = I_0 \\sin(\\omega t - \\phi)$.\nResistor voltage: $V_R = I_0 R$ (in phase with $I$)\nInductor voltage: $V_L = I_0 X_L$ (leads $I$ by $\\pi/2$)\nCapacitor voltage: $V_C = I_0 X_C$ (lags $I$ by $\\pi/2$)\n\n2. Phasor Vector Sum & Net Voltage:\nNet reactive voltage along vertical axis: $(V_L - V_C)$\nFrom the phasor right-triangle:\n$$V_0^2 = V_R^2 + (V_L - V_C)^2$$\n$$V_0^2 = I_0^2 [R^2 + (X_L - X_C)^2]$$\n\n3. Circuit Impedance Expression:\n$$Z = \\frac{V_0}{I_0} = \\sqrt{R^2 + (X_L - X_C)^2}$$\nSubstituting reactances $X_L = \\omega L$ and $X_C = \\frac{1}{\\omega C}$:\n$$Z = \\sqrt{R^2 + \\left(\\omega L - \\frac{1}{\\omega C}\\right)^2}$$\n\n4. Phase Angle & Resonance Condition:\nPhase angle: $\\tan\\phi = \\frac{V_L - V_C}{V_R} = \\frac{X_L - X_C}{R}$\nResonance occurs when $X_L = X_C$:\n$$\\omega L = \\frac{1}{\\omega C} \\implies \\omega_0 = \\frac{1}{\\sqrt{LC}} \\implies f_0 = \\frac{1}{2\\pi\\sqrt{LC}}$$\nAt resonance, $Z_{\\text{min}} = R$ and current is maximum.',
        socratic_hints: [
          "Draw the phasors for $V_R, V_L, V_C$ relative to the reference current phasor $I$.",
          "Combine the opposing vertical phasors $V_L$ and $V_C$ into $(V_L - V_C)$.",
          "Apply the Pythagorean theorem to find the net voltage phasor $V_0$."
        ]
      },
      {
        id: 'snr_p_05',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 11,
        chapter_name: 'Dual Nature of Radiation and Matter',
        topic: 'Einstein’s Photoelectric Equation',
        subtopic: 'Graphical Analysis: Stopping potential (V₀) vs Frequency (ν)',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 (4-Mark Case-Study)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 240,
        marks_weightage: 4,
        question_latex: 'In an experiment on photoelectric effect, the slope of the cut-off voltage $V_0$ versus frequency $\\nu$ of incident light was found to be $4.12 \\times 10^{-15}\\,\\text{V}\\cdot\\text{s}$. Given $e = 1.6 \\times 10^{-19}\\,\\text{C}$: (a) Calculate the value of Planck\'s constant $h$. (b) If the intercept on the frequency axis is $5.0 \\times 10^{14}\\,\\text{Hz}$, find the work function $\\Phi_0$ of the metal in $\\text{eV}$.',
        options_latex: [],
        correct_answer_latex: '(a) $h = 6.592 \\times 10^{-34}\\,\\text{J}\\cdot\\text{s}$, (b) $\\Phi_0 = 2.06\\,\\text{eV}$',
        solution_latex: 'From Einstein\'s photoelectric equation: $e V_0 = h\\nu - \\Phi_0 \\implies V_0 = \\left(\\frac{h}{e}\\right)\\nu - \\frac{\\Phi_0}{e}$. (a) Comparing with $y = mx + c$, the slope is $m = \\frac{h}{e}$. Given slope $= 4.12 \\times 10^{-15}\\,\\text{V}\\cdot\\text{s}$. Therefore, $h = \\text{slope} \\times e = (4.12 \\times 10^{-15}) \\times (1.6 \\times 10^{-19}) = 6.592 \\times 10^{-34}\\,\\text{J}\\cdot\\text{s}$. (b) The intercept on the frequency axis is the threshold frequency $\\nu_0 = 5.0 \\times 10^{14}\\,\\text{Hz}$. Work function $\\Phi_0 = h\\nu_0 = (6.592 \\times 10^{-34}) \\times (5.0 \\times 10^{14}) = 3.296 \\times 10^{-19}\\,\\text{J}$. In $\\text{eV}$: $\\Phi_0 = \\frac{3.296 \\times 10^{-19}}{1.6 \\times 10^{-19}} = 2.06\\,\\text{eV}$.',
        socratic_hints: [
          "Rearrange Einstein's equation $eV_0 = h\\nu - \\Phi_0$ in the linear slope-intercept form $V_0 = m\\nu + c$.",
          "Equate the given slope to $h/e$ to solve for Planck's constant $h$.",
          "Multiply the threshold frequency by $h$ and divide by $e$ to find $\\Phi_0$ in electron-volts."
        ]
      },
      {
        id: 'snr_p_06',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 14,
        chapter_name: 'Semiconductor Electronics: Materials, Devices, and Simple Circuits',
        topic: 'Diode as a Rectifier',
        subtopic: 'Full-Wave Rectifier (Center-Tapped): Circuit diagram with two diodes and center-tapped transformer',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2020 (5-Mark Guaranteed)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 300,
        marks_weightage: 5,
        question_latex: 'With the help of a neat circuit diagram, explain the working principle of a full-wave rectifier using a center-tapped transformer and two p-n junction diodes. Draw the input and output waveforms. What is the role of a capacitor filter connected in parallel across the load resistance?',
        options_latex: [],
        correct_answer_latex: 'Full-wave rectification working, bidirectional to unidirectional load current, efficiency ≈ 81.2%',
        solution_latex: '1. Principle: A p-n junction diode conducts current when forward biased (low resistance) and blocks current when reverse biased (high resistance). 2. Operation: During the positive half-cycle of AC input, terminal A of secondary is positive and terminal B is negative with respect to center tap. Diode $D_1$ is forward biased and conducts, while $D_2$ is reverse biased and off. Current flows through load $R_L$ from X to Y. During the negative half-cycle, terminal A is negative and terminal B is positive. Diode $D_2$ is forward biased and conducts, while $D_1$ is off. Current flows through load $R_L$ in the same direction from X to Y. 3. Waveforms: Output voltage is pulsating DC with double the AC frequency ($f_{\\text{out}} = 2f_{\\text{in}}$). 4. Capacitor Filter: The capacitor charges to peak voltage during conduction and discharges slowly through $R_L$ when rectified voltage falls, significantly smoothing out ripples to provide near-steady DC.',
        socratic_hints: [
          "State which diode is forward biased during the positive vs negative input AC half-cycle.",
          "Trace the direction of current through the load resistance $R_L$ in both half-cycles.",
          "Explain how the charge-discharge mechanism of a shunt capacitor eliminates ripples."
        ]
      },
      {
        id: 'snr_p_07',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 10,
        chapter_name: 'Wave Optics',
        topic: 'Huygens’ Principle',
        subtopic: 'Derivation: Proof of the Law of Refraction (Snell\'s Law: sin i / sin r = v₁/v₂ = n₂/n₁) using Huygens\' construction',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2022 (3-Mark Standard)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 240,
        marks_weightage: 3,
        question_latex: 'State Huygens\' principle of secondary wavelets. Using this principle, draw a diagram showing refraction of a plane wavefront at a plane refracting surface separating two media, and prove Snell\'s law of refraction: $$\\frac{\\sin i}{\\sin r} = \\frac{n_2}{n_1}$$',
        options_latex: [],
        correct_answer_latex: 'Snell\'s law proven via Huygens construction',
        solution_latex: '1. Huygens Principle: Every point on a primary wavefront acts as a source of secondary spherical wavelets spreading in all directions at wave speed. The forward envelope tangent to these secondary wavelets forms the new wavefront. 2. Construction: Let plane wavefront $AB$ be incident at angle $i$ on interface. In time $\\tau$, wavefront point $B$ travels distance $BC = v_1 \\tau$ in medium 1, while secondary wavelet from $A$ travels distance $AE = v_2 \\tau$ in medium 2. Tangent plane $CE$ represents the refracted wavefront at angle $r$. 3. Proof: In right-angled $\\Delta ABC$: $\\sin i = \\frac{BC}{AC} = \\frac{v_1 \\tau}{AC}$. In right-angled $\\Delta AEC$: $\\sin r = \\frac{AE}{AC} = \\frac{v_2 \\tau}{AC}$. Dividing the two: $$\\frac{\\sin i}{\\sin r} = \\frac{v_1 \\tau / AC}{v_2 \\tau / AC} = \\frac{v_1}{v_2}$$. Since refractive index $n = c/v$, $v_1/v_2 = n_2/n_1$. Hence, $\\frac{\\sin i}{\\sin r} = \\frac{n_2}{n_1}$, which is Snell\'s law of refraction.',
        socratic_hints: [
          "State the two fundamental postulates of Huygens wave theory.",
          "Identify the common hypotenuse $AC$ for the incident triangle $\\Delta ABC$ and refracted triangle $\\Delta AEC$.",
          "Express $\\sin i$ and $\\sin r$ in terms of speeds $v_1, v_2$ and time $\\tau$."
        ]
      },
      {
        id: 'snr_p_08',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 1,
        chapter_name: 'Electric Charges and Fields',
        topic: 'Gauss\'s Law and Its Applications',
        subtopic: 'Derivation: Field due to a uniformly charged infinite plane sheet: E = σ/(2ε₀)',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2021 (3-Mark Standard)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 200,
        marks_weightage: 3,
        question_latex: 'State Gauss\'s theorem in electrostatics. Using this theorem, derive an expression for the electric field intensity at a distance $r$ from an infinitely large, uniformly charged thin plane sheet with uniform surface charge density $\\sigma$. Show that the field is independent of distance $r$.',
        options_latex: [],
        correct_answer_latex: '$E = \\frac{\\sigma}{2\\varepsilon_0}$',
        solution_latex: '1. Gauss\'s Theorem Statement:\nThe total electric flux through any closed Gaussian surface in free space equals $1/\\varepsilon_0$ times the net enclosed charge:\n$$\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$$\n\n2. Gaussian Pillbox Surface Selection:\nChoose a cylindrical Gaussian pillbox of cross-sectional area $A$ piercing perpendicularly through the sheet.\nBy planar symmetry, electric field $\\vec{E}$ is directed normally outward from both circular flat end-caps.\n\n3. Total Flux Evaluation:\nFlux through cylindrical curved wall: $\\int \\vec{E} \\cdot d\\vec{A} = 0$ (since $\\vec{E} \\perp d\\vec{A}$)\nFlux through both flat circular end-faces: $\\Phi = E A + E A = 2 E A$\n\n4. Enclosed Charge & Deduction:\nEnclosed charge in area $A$: $q_{\\text{enclosed}} = \\sigma A$\nApplying Gauss\'s Law:\n$$2 E A = \\frac{\\sigma A}{\\varepsilon_0} \\implies E = \\frac{\\sigma}{2\\varepsilon_0}$$\nDistance $r$ does not appear in the result, proving $E$ is uniform and independent of distance $r$.',
        socratic_hints: [
          "Choose a cylindrical Gaussian pillbox piercing symmetrically through the charged sheet.",
          "Why is the electric flux through the curved surface of the cylinder zero?",
          "Equate the total flux $2EA$ to $q_{\\text{enclosed}}/\\varepsilon_0 = \\sigma A/\\varepsilon_0$."
        ]
      },
      {
        id: 'snr_p_09',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 2,
        chapter_name: 'Electrostatic Potential and Capacitance',
        topic: 'Capacitance of Parallel Plate Capacitor',
        subtopic: 'Effect of Dielectric Slab of thickness t on Capacitance',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & HPBOSE 2023 (3-Mark)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 200,
        marks_weightage: 3,
        question_latex: 'A parallel plate capacitor with air between the plates has capacitance $C_0 = \\frac{\\varepsilon_0 A}{d}$. A dielectric slab of dielectric constant $K$ and thickness $t < d$ is introduced between the plates. Derive the expression for the new capacitance $C$. What happens when $t = d$?',
        options_latex: [],
        correct_answer_latex: '$C = \\frac{\\varepsilon_0 A}{d - t(1 - 1/K)}$, and $C = K C_0$ when $t = d$',
        solution_latex: '1. Electric Field Setup:\nIn the absence of dielectric, field is $E_0 = \\frac{\\sigma}{\\varepsilon_0}$. Inside dielectric of thickness $t$, field reduces to $E = \\frac{E_0}{K}$. In remaining air gap of thickness $(d - t)$, field remains $E_0$.\n\n2. Potential Difference:\n$$V = E_0(d - t) + E t = E_0(d - t) + \\frac{E_0}{K} t = E_0\\left[(d - t) + \\frac{t}{K}\\right] = \\frac{Q}{\\varepsilon_0 A}\\left[d - t\\left(1 - \\frac{1}{K}\\right)\\right]$$\n\n3. New Capacitance:\n$$C = \\frac{Q}{V} = \\frac{\\varepsilon_0 A}{d - t(1 - 1/K)}$$\nWhen $t = d$ (slab fills space completely):\n$$C = \\frac{\\varepsilon_0 A}{d - d + d/K} = \\frac{K \\varepsilon_0 A}{d} = K C_0$$.',
        socratic_hints: [
          "Divide the total plate separation $d$ into dielectric region $t$ and air region $(d - t)$.",
          "What is the electric field inside a dielectric medium of relative permittivity $K$?",
          "Integrate electric field across the gap to find potential difference $V = E_0(d - t) + (E_0/K)t$."
        ]
      },
      {
        id: 'snr_p_10',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 4,
        chapter_name: 'Moving Charges and Magnetism',
        topic: 'Magnetic Field due to Current Element',
        subtopic: 'Biot-Savart Law & Axial Field of a Circular Current Loop',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2021 (5-Mark Guaranteed)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 300,
        marks_weightage: 5,
        question_latex: 'State Biot-Savart law. Using this law, derive an expression for the magnetic field $\\vec{B}$ at an axial point at distance $x$ from the center of a circular loop of radius $R$ carrying steady current $I$. Hence find the magnetic field at the center of the coil.',
        options_latex: [],
        correct_answer_latex: '$B = \\frac{\\mu_0 I R^2}{2(R^2 + x^2)^{3/2}}$, at center ($x=0$): $B_0 = \\frac{\\mu_0 I}{2R}$',
        solution_latex: '1. Biot-Savart Law:\nThe magnetic field $d\\vec{B}$ due to a current element $I d\\vec{l}$ at position $\\vec{r}$ is:\n$$d\\vec{B} = \\frac{\\mu_0}{4\\pi} \\frac{I (d\\vec{l} \\times \\hat{r})}{r^2}$$\n\n2. Loop Geometry & Resolution:\nDistance to axial point $P$ is $r = \\sqrt{R^2 + x^2}$. Since $d\\vec{l} \\perp \\vec{r}$, $d B = \\frac{\\mu_0}{4\\pi} \\frac{I dl}{R^2 + x^2}$. Resolving $d\\vec{B}$ into components:\n- Perpendicular components $dB \\cos\\theta$ cancel out by diametrically opposite elements.\n- Axial components $dB \\sin\\theta$ add up.\n\n3. Integration:\n$$B = \\oint dB \\sin\\theta = \\oint \\frac{\\mu_0 I dl}{4\\pi (R^2 + x^2)} \\frac{R}{\\sqrt{R^2 + x^2}} = \\frac{\\mu_0 I R}{4\\pi (R^2 + x^2)^{3/2}} \\oint dl$$\nSince $\\oint dl = 2\\pi R$:\n$$B = \\frac{\\mu_0 I R^2}{2(R^2 + x^2)^{3/2}}$$\n\n4. Field at Center ($x = 0$):\n$$B_{\\text{center}} = \\frac{\\mu_0 I R^2}{2 R^3} = \\frac{\\mu_0 I}{2R}$$.',
        socratic_hints: [
          "State Biot-Savart law in vector form.",
          "Why do the components of magnetic field perpendicular to the loop axis cancel?",
          "Substitute $\\sin\\theta = R/\\sqrt{R^2 + x^2}$ into the axial component integral."
        ]
      },
      {
        id: 'snr_p_11',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 5,
        chapter_name: 'Magnetism and Matter',
        topic: 'Magnetic Properties of Materials',
        subtopic: 'Comparison between Diamagnetic, Paramagnetic, and Ferromagnetic substances',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & HPBOSE 2022 (3-Mark Standard)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 180,
        marks_weightage: 3,
        question_latex: 'Distinguish between diamagnetic, paramagnetic, and ferromagnetic substances on the basis of: (a) Magnetic susceptibility $\\chi$, (b) Relative magnetic permeability $\\mu_r$, and (c) Behavior in a non-uniform external magnetic field.',
        options_latex: [],
        correct_answer_latex: 'Comprehensive tabular distinction on susceptibility, permeability, and field interaction',
        solution_latex: '1. Magnetic Susceptibility $\\chi$:\n- Diamagnetic: Small and negative ($-1 \\le \\chi < 0$), independent of temperature.\n- Paramagnetic: Small and positive ($0 < \\chi < \\varepsilon$), inversely proportional to temperature ($\\chi \\propto 1/T$, Curie\'s Law).\n- Ferromagnetic: Very large and positive ($\\chi \\gg 10^3$), temperature dependent, drops above Curie temperature $T_c$.\n\n2. Relative Permeability $\\mu_r$:\n- Diamagnetic: Slightly less than 1 ($0 \\le \\mu_r < 1$).\n- Paramagnetic: Slightly greater than 1 ($1 < \\mu_r < 1 + \\varepsilon$).\n- Ferromagnetic: Much greater than 1 ($\\mu_r \\gg 1000$).\n\n3. Behavior in Non-Uniform Magnetic Field:\n- Diamagnetic: Feebly repelled; moves from stronger to weaker parts of the field.\n- Paramagnetic: Feebly attracted; moves from weaker to stronger parts of the field.\n- Ferromagnetic: Strongly attracted; moves vigorously towards the strongest field region.',
        socratic_hints: [
          "Recall the sign and order of magnitude of susceptibility $\\chi$ for each class.",
          "How does relative permeability $\\mu_r = 1 + \\chi$ relate to $\\chi$?",
          "Contrast how magnetic field lines interact with superconductors (Meissner effect) vs ferromagnets."
        ]
      },
      {
        id: 'snr_p_12',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 6,
        chapter_name: 'Electromagnetic Induction',
        topic: 'Lenz\'s Law and Conservation of Energy',
        subtopic: 'Motional EMF Derivation: e = B l v',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2022 (3-Mark Standard)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 210,
        marks_weightage: 3,
        question_latex: 'State Lenz\'s law of electromagnetic induction and show that it is a direct consequence of the principle of conservation of energy. Hence, derive an expression for the motional EMF induced across the ends of a conducting rod of length $l$ moving with uniform velocity $v$ perpendicular to a uniform magnetic field $B$.',
        options_latex: [],
        correct_answer_latex: '$\\varepsilon = B l v$, mechanical power expended equals rate of Joule heat dissipation $P = \\frac{B^2 l^2 v^2}{R}$',
        solution_latex: '1. Lenz\'s Law Statement:\nThe polarity of the induced EMF is such that it tends to produce a current which opposes the change in magnetic flux that produces it.\n\n2. Conservation of Energy Justification:\nIf the induced current aided the change, a small initial push would cause an ever-increasing flux and current without external work, violating energy conservation. Instead, an opposing Lorentz force $F = I l B$ acts on the rod, requiring mechanical work at rate $P_{\\text{mech}} = F v = (I l B) v$. This mechanical work is exactly converted into electrical Joule heat: $P_{\\text{heat}} = I^2 R = \\left(\\frac{B l v}{R}\\right)^2 R = \\frac{B^2 l^2 v^2}{R} = P_{\\text{mech}}$.\n\n3. Motional EMF Derivation:\nConsider rectangular conducting loop in uniform perpendicular field $\\vec{B}$. As rod moves distance $dx$ in time $dt$, area increases by $dA = l dx = l v dt$. Change in flux $d\\Phi_B = B dA = B l v dt$. By Faraday\'s Law:\n$$\\varepsilon = -\\frac{d\\Phi_B}{dt} = -B l v$$\nMagnitude of induced EMF is $\\varepsilon = B l v$.',
        socratic_hints: [
          "State Faraday's law of induction relating induced EMF to rate of change of flux.",
          "Calculate the rate at which area is swept out by the moving rod: $dA/dt = l v$.",
          "Demonstrate energy conservation by equating mechanical power $Fv$ to electrical power $I^2R$."
        ]
      },
      {
        id: 'snr_p_13',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 8,
        chapter_name: 'Electromagnetic Waves',
        topic: 'Displacement Current & Maxwell’s Equations',
        subtopic: 'Ampere-Maxwell Law during Capacitor Charging',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & 2023 (2-Mark Standard)',
        difficulty: 'EASY',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 150,
        marks_weightage: 2,
        question_latex: 'Why did Maxwell find Ampere’s circuital law inconsistent during the charging of a capacitor? Write the modified Ampere-Maxwell law and express displacement current $I_d$ in terms of rate of change of electric flux $\\Phi_E$.',
        options_latex: [],
        correct_answer_latex: '$I_d = \\varepsilon_0 \\frac{d\\Phi_E}{dt}$, $\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 (I_c + \\varepsilon_0 \\frac{d\\Phi_E}{dt})$',
        solution_latex: '1. Inconsistency in Ampere\'s Law:\nDuring charging of a capacitor, conduction current $I_c$ flows through the connecting wires, but no conduction current flows across the insulating gap between plates. Applying Ampere\'s law $\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I$ to a flat surface gives $\\mu_0 I_c$, but to a pot-like surface passing through the plate gap gives zero, creating a logical contradiction.\n\n2. Maxwell\'s Resolution & Displacement Current:\nMaxwell postulated that a time-varying electric field in the capacitor gap produces an equivalent displacement current:\n$$I_d = \\varepsilon_0 \\frac{d\\Phi_E}{dt}$$\nInside the gap: $E = \\frac{Q}{\\varepsilon_0 A} \\implies \\Phi_E = E A = \\frac{Q}{\\varepsilon_0} \\implies I_d = \\varepsilon_0 \\frac{d}{dt}\\left(\\frac{Q}{\\varepsilon_0}\\right) = \\frac{dQ}{dt} = I_c$.\n\n3. Modified Ampere-Maxwell Law:\n$$\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 (I_c + I_d) = \\mu_0 \\left(I_c + \\varepsilon_0 \\frac{d\\Phi_E}{dt}\\right)$$.',
        socratic_hints: [
          "What is the conduction current in the space between capacitor plates while charging?",
          "How does electric flux between the plates change with time as charge accumulates?",
          "Write the total generalized current as $I_{\\text{total}} = I_c + I_d$."
        ]
      },
      {
        id: 'snr_p_14',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 12,
        chapter_name: 'Atoms',
        topic: 'Bohr Model of the Hydrogen Atom',
        subtopic: 'Derivation of Radius and Total Energy of Electron in nth Orbit',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & HPBOSE 2023 (3-Mark)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 240,
        marks_weightage: 3,
        question_latex: 'State Bohr\'s two fundamental postulates for the hydrogen atom. Using these postulates, derive an expression for the total energy $E_n$ of the electron orbiting in the $n$-th stationary orbit. Explain the physical significance of the negative sign of total energy.',
        options_latex: [],
        correct_answer_latex: '$E_n = -\\frac{13.6}{n^2}\\,\\text{eV}$, negative sign signifies electron is bound to nucleus',
        solution_latex: '1. Bohr\'s Postulates:\n(i) Quantization condition: Angular momentum of orbiting electron is an integral multiple of $h/(2\\pi)$:\n$$m v r = \\frac{n h}{2\\pi}$$\n(ii) Frequency condition: Radiation occurs only during transition between stationary states:\n$$h \\nu = E_i - E_f$$\n\n2. Orbit Radius & Velocity:\nCentripetal force is provided by Coulomb electrostatic attraction:\n$$\\frac{m v^2}{r} = \\frac{1}{4\\pi\\varepsilon_0} \\frac{e^2}{r^2} \\implies m v^2 r = \\frac{e^2}{4\\pi\\varepsilon_0}$$\nFrom quantization: $v = \\frac{n h}{2\\pi m r}$. Substituting gives radius:\n$$r_n = \\frac{\\varepsilon_0 n^2 h^2}{\\pi m e^2} = n^2 r_1 \\quad (r_1 = 0.529\\,\\text{Å})$$\n\n3. Total Energy Derivation:\nKinetic Energy: $K = \\frac{1}{2} m v^2 = \\frac{e^2}{8\\pi\\varepsilon_0 r}$\nPotential Energy: $U = -\\frac{e^2}{4\\pi\\varepsilon_0 r}$\nTotal Energy:\n$$E_n = K + U = -\\frac{e^2}{8\\pi\\varepsilon_0 r_n} = -\\frac{m e^4}{8 \\varepsilon_0^2 h^2 n^2} = -\\frac{13.6}{n^2}\\,\\text{eV}$$\n\n4. Physical Significance of Negative Sign:\nThe negative sign signifies that the electron is electrostatically bound to the nucleus. Work must be done by an external agency to remove the electron to infinity ($E = 0$).',
        socratic_hints: [
          "Equate centripetal force $m v^2 / r$ to Coulomb electrostatic force $e^2 / (4\\pi\\varepsilon_0 r^2)$.",
          "Apply Bohr's orbital angular momentum quantization $L = mvr = nh/(2\\pi)$.",
          "Combine kinetic energy $K = \\frac{1}{2}|U|$ and potential energy $U$ to deduce $E = -K$."
        ]
      },
      {
        id: 'snr_p_15',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Physics',
        chapter_number: 13,
        chapter_name: 'Nuclei',
        topic: 'Nuclear Binding Energy & Stability',
        subtopic: 'Binding Energy per Nucleon Curve and Nuclear Fission/Fusion',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & HPBOSE 2024 (3-Mark)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 210,
        marks_weightage: 3,
        question_latex: 'Draw a plot showing the variation of binding energy per nucleon $(E_{bn})$ as a function of mass number $A$. Highlight two main features of this curve. Using this curve, explain why energy is released in both: (a) nuclear fission of heavy nuclei ($A \\approx 240$), and (b) nuclear fusion of very light nuclei ($A \\le 10$).',
        options_latex: [],
        correct_answer_latex: '$E_{bn}$ maximum ≈ 8.75 MeV/nucleon for ⁵⁶Fe; fission & fusion increase BE/nucleon, releasing Q > 0',
        solution_latex: '1. Features of $E_{bn}$ Curve:\n(i) Broad constancy: For intermediate mass numbers ($30 \\le A \\le 170$), binding energy per nucleon is nearly constant at $\\approx 8.5\\,\\text{MeV/nucleon}$, peaking at $8.75\\,\\text{MeV/nucleon}$ for $^{56}_{26}\\text{Fe}$. This proves nuclear forces are saturated short-range forces.\n(ii) Drop at extremes: $E_{bn}$ drops sharply for very light nuclei ($A < 30$) and gradually drops for heavy nuclei ($A > 170$), reaching $\\approx 7.6\\,\\text{MeV/nucleon}$ for $^{238}\\text{U}$.\n\n2. Nuclear Fission:\nA heavy nucleus (e.g., $^{235}\\text{U}$ with $E_{bn} \\approx 7.6\\,\\text{MeV}$) splits into two medium nuclei ($A \\approx 120$ with $E_{bn} \\approx 8.5\\,\\text{MeV}$). The binding energy per nucleon increases by $\\approx 0.9\\,\\text{MeV}$. For 235 nucleons, total released energy is $Q \\approx 235 \\times 0.9 \\approx 200\\,\\text{MeV}$.\n\n3. Nuclear Fusion:\nTwo very light nuclei (e.g., $^{2}_1\\text{H}$ with $E_{bn} \\approx 1.1\\,\\text{MeV}$) fuse to form a heavier tightly-bound nucleus (e.g., $^{4}_2\\text{He}$ with $E_{bn} \\approx 7.1\\,\\text{MeV}$). The enormous increase in $E_{bn}$ produces huge positive $Q$-value.',
        socratic_hints: [
          "What is the peak value of binding energy per nucleon, and for which isotope does it occur?",
          "How does an increase in binding energy per nucleon correspond to energy release?",
          "Calculate the approximate energy yield per nucleon in fission vs fusion."
        ]
      }
    ],
    senior_chemistry: [
      {
        id: 'snr_c_01',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'PHYSICAL',
        chapter_number: 2,
        chapter_name: 'Electrochemistry',
        topic: 'Galvanic Cells & Nernst Equation',
        subtopic: 'Cell Potential & Gibbs Free Energy',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & NEET 2022',
        difficulty: 'MEDIUM',
        question_format: 'MCQ_SINGLE',
        benchmark_time_seconds: 75,
        marks_weightage: 4,
        question_latex: 'For the cell reaction $\\text{Zn}(s) + \\text{Cu}^{2+}(aq) \\rightleftharpoons \\text{Zn}^{2+}(aq) + \\text{Cu}(s)$, the standard cell potential $E^\\circ_{\\text{cell}}$ is $1.10\\,\\text{V}$. What is $\\Delta G^\\circ$ for the reaction? (Take $F = 96500\\,\\text{C/mol}$)',
        options_latex: [
          { key: 'A', latex: '$-212.3\\,\\text{kJ/mol}$', is_correct: true, distractor_trap: null },
          { key: 'B', latex: '$+212.3\\,\\text{kJ/mol}$', is_correct: false, distractor_trap: 'Forgot negative sign in $\\Delta G^\\circ = -nFE^\\circ$' },
          { key: 'C', latex: '$-106.15\\,\\text{kJ/mol}$', is_correct: false, distractor_trap: 'Used $n = 1$ instead of $n = 2$ electrons transferred' },
          { key: 'D', latex: '$-424.6\\,\\text{kJ/mol}$', is_correct: false, distractor_trap: 'Multiplied by 4 instead of 2' }
        ],
        correct_answer_latex: 'A',
        solution_latex: '$$\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}}$$. Here $n = 2$ electrons. $\\Delta G^\\circ = -2 \\times 96500 \\times 1.10 = -212300\\,\\text{J/mol} = -212.3\\,\\text{kJ/mol}$.',
        socratic_hints: ["How many electrons are transferred in $\\text{Zn} \\to \\text{Zn}^{2+}$?", "Recall the thermodynamic relation $\\Delta G^\\circ = -nFE^\\circ$."]
      },
      {
        id: 'snr_c_02',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'PHYSICAL',
        chapter_number: 1,
        chapter_name: 'Solutions',
        topic: 'Colligative Properties & Van \'t Hoff Factor',
        subtopic: 'Depression in Freezing Point & Molar Mass Determination',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2022 & 2019 (3-Mark Numerical)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_SHORT',
        benchmark_time_seconds: 240,
        marks_weightage: 3,
        question_latex: 'A $5\\%$ solution (by mass) of cane sugar ($M = 342\\,\\text{g/mol}$) in water has a freezing point of $271\\,\\text{K}$. Calculate the freezing point of a $5\\%$ solution (by mass) of glucose ($M = 180\\,\\text{g/mol}$) in water. Freezing point of pure water is $273.15\\,\\text{K}$.',
        options_latex: [],
        correct_answer_latex: '$269.07\\,\\text{K}$',
        solution_latex: '$$\\Delta T_f = K_f \\cdot m$$. For cane sugar: $\\Delta T_f = 273.15 - 271 = 2.15\\,\\text{K}$. Molality $m_1 = \\frac{5 / 342}{95 / 1000} = \\frac{5000}{342 \\times 95} = 0.154\\,\\text{mol/kg}$. Thus $K_f = \\frac{\\Delta T_f}{m_1} = \\frac{2.15}{0.154} = 13.96\\,\\text{K kg/mol}$. For glucose: $m_2 = \\frac{5 / 180}{95 / 1000} = \\frac{5000}{180 \\times 95} = 0.292\\,\\text{mol/kg}$. $\\Delta T_f(\\text{glucose}) = K_f \\times m_2 = 13.96 \\times 0.292 = 4.08\\,\\text{K}$. Freezing point of glucose solution $= 273.15 - 4.08 = 269.07\\,\\text{K}$.',
        socratic_hints: [
          "Recall the formula $\\Delta T_f = K_f \\cdot m$ where $m$ is molality.",
          "Use the sugar solution data to compute $K_f$ for water.",
          "Use $K_f$ to find $\\Delta T_f$ for glucose and subtract from $273.15\\,\\text{K}$."
        ]
      },
      {
        id: 'snr_c_03',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'PHYSICAL',
        chapter_number: 3,
        chapter_name: 'Chemical Kinetics',
        topic: 'Integrated Rate Equations & Half-Life',
        subtopic: 'First-Order Kinetics Rate Constant & Half-Life Calculation',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2020',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_SHORT',
        benchmark_time_seconds: 210,
        marks_weightage: 3,
        question_latex: 'A first-order reaction takes $40\\,\\text{min}$ for $30\\%$ decomposition. Calculate its half-life period $t_{1/2}$. (Given: $\\log 10 = 1$, $\\log 7 = 0.8450$, $\\log 2 = 0.3010$).',
        options_latex: [],
        correct_answer_latex: '$77.78\\,\\text{min}$',
        solution_latex: 'For a first-order reaction, $$k = \\frac{2.303}{t}\\log\\left(\\frac{[R]_0}{[R]}\\right)$$. At $t = 40\\,\\text{min}$, $[R] = [R]_0 - 0.30[R]_0 = 0.70[R]_0$. $$k = \\frac{2.303}{40}\\log\\left(\\frac{1}{0.7}\\right) = \\frac{2.303}{40}\\log\\left(\\frac{10}{7}\\right) = \\frac{2.303}{40}(1 - 0.8450) = \\frac{2.303 \\times 0.1550}{40} = 8.924 \\times 10^{-3}\\,\\text{min}^{-1}$$. Half-life: $$t_{1/2} = \\frac{0.693}{k} = \\frac{0.693}{8.924 \\times 10^{-3}} \\approx 77.78\\,\\text{min}$$.',
        socratic_hints: [
          "What fraction of reactant remains when 30% has decomposed?",
          "Use the first-order integrated equation $k = \\frac{2.303}{t}\\log([R]_0/[R])$.",
          "Relate rate constant to half-life using $t_{1/2} = \\frac{0.693}{k}$."
        ]
      },
      {
        id: 'snr_c_04',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'INORGANIC',
        chapter_number: 4,
        chapter_name: 'The d- and f-Block Elements',
        topic: 'General Trends of 3d-Transition Series',
        subtopic: 'Standard Reduction Potentials & Lanthanoid Contraction',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & 2021 (3-Mark Conceptual)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_SHORT',
        benchmark_time_seconds: 240,
        marks_weightage: 3,
        question_latex: 'Assign reasons for the following observations: (i) The $E^\\circ_{M^{2+}/M}$ value for copper is positive ($+0.34\\,\\text{V}$), unlike other first row transition elements. (ii) $Cr^{2+}$ is a strong reducing agent whereas $Mn^{3+}$ is a strong oxidizing agent, although both possess $d^4$ configuration. (iii) Zirconium ($Zr$) and Hafnium ($Hf$) exhibit almost identical atomic and ionic radii.',
        options_latex: [],
        correct_answer_latex: 'Detailed inorganic justification based on hydration enthalpy, d-orbital CFSE stability, and 4f shielding.',
        solution_latex: '(i) The high sum of enthalpy of atomization and first & second ionization enthalpies of copper is not compensated by its hydration enthalpy, resulting in positive $E^\\circ_{Cu^{2+}/Cu}$. (ii) $Cr^{2+}$ oxidizes to $Cr^{3+}$ which achieves stable half-filled $t_{2g}^3$ configuration in aqueous solution, making it strongly reducing; $Mn^{3+}$ reduces to $Mn^{2+}$ which acquires stable half-filled $3d^5$ configuration, making it strongly oxidizing. (iii) Due to Lanthanoid Contraction (imperfect shielding of nuclear charge by $4f$ electrons across the 14 lanthanoids before Hafnium), $Zr$ (4d) and $Hf$ (5d) have nearly identical atomic radii ($160\\,\\text{pm}$ vs $159\\,\\text{pm}$).',
        socratic_hints: [
          "For $Cu$, examine the balance between enthalpy of atomization/ionization and hydration enthalpy.",
          "Examine the electronic configurations of $Cr^{3+}$ ($t_{2g}^3$) vs $Mn^{2+}$ ($d^5$).",
          "What causes the similarity in size between second and third transition series elements?"
        ]
      },
      {
        id: 'snr_c_05',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'INORGANIC',
        chapter_number: 5,
        chapter_name: 'Coordination Compounds',
        topic: 'Bonding Theories',
        subtopic: 'Valence Bond Theory: Hybridization, Geometry & Magnetic Behavior',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2020',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_SHORT',
        benchmark_time_seconds: 240,
        marks_weightage: 3,
        question_latex: 'Using Valence Bond Theory (VBT), compare $[Co(NH_3)_6]^{3+}$ and $[CoF_6]^{3-}$ in terms of: (i) Oxidation state of Cobalt, (ii) Hybridization of Cobalt, (iii) Inner or outer orbital complex, (iv) Magnetic behavior (paramagnetic or diamagnetic). [Atomic number of $Co = 27$]',
        options_latex: [],
        correct_answer_latex: '$[Co(NH_3)_6]^{3+}$: $d^2sp^3$, inner orbital, diamagnetic; $[CoF_6]^{3-}$: $sp^3d^2$, outer orbital, paramagnetic.',
        solution_latex: 'Co ($Z=27$): $[Ar] 3d^7 4s^2$. In both complexes, $Co$ is in $+3$ oxidation state: $Co^{3+} = [Ar] 3d^6 4s^0$. (A) In $[Co(NH_3)_6]^{3+}$: $NH_3$ is a strong field ligand causing pairing of all 6 electrons into 3 orbitals of $3d$ ($t_{2g}^6$), leaving two empty $3d$ orbitals. Hybridization is $d^2sp^3$ (Inner orbital octahedral complex). Magnetic character: Diamagnetic (0 unpaired electrons). (B) In $[CoF_6]^{3-}$: $F^-$ is a weak field ligand unable to cause pairing. The four unpaired electrons remain in $3d$, and cobalt utilizes outer $4d$ orbitals. Hybridization is $sp^3d^2$ (Outer orbital octahedral complex). Magnetic character: Paramagnetic ($n=4$ unpaired electrons, $\\mu = \\sqrt{4(6)} = 4.90\\,\\text{BM}$).',
        socratic_hints: [
          "Determine the oxidation state of Cobalt in both complexes.",
          "Identify whether $NH_3$ and $F^-$ are strong or weak field ligands.",
          "Check whether inner ($3d$) or outer ($4d$) orbitals are utilized for hybridization."
        ]
      },
      {
        id: 'snr_c_06',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'ORGANIC',
        chapter_number: 6,
        chapter_name: 'Haloalkanes and Haloarenes',
        topic: 'Nucleophilic Substitution Mechanisms (SN1 vs SN2)',
        subtopic: 'Kinetics, Stereochemistry & Reactivity Factors',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2019',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_SHORT',
        benchmark_time_seconds: 210,
        marks_weightage: 3,
        question_latex: '(a) Which compound in each of the following pairs will react faster in an $S_N2$ reaction with $OH^-$ and why? (i) $CH_3Br$ or $CH_3I$ (ii) $(CH_3)_3CCl$ or $CH_3Cl$. (b) Give two reasons why chlorobenzene is extremely less reactive towards nucleophilic substitution reactions than chloroethane.',
        options_latex: [],
        correct_answer_latex: '(a)(i) $CH_3I$, (ii) $CH_3Cl$; (b) Resonance partial double bond & $sp^2$ carbon electronegativity.',
        solution_latex: '(a)(i) $CH_3I$ reacts faster because iodide ($I^-$) is a better leaving group than bromide ($Br^-$) due to larger size and weaker $C-I$ bond. (ii) $CH_3Cl$ reacts faster because $S_N2$ proceeds via backside nucleophilic attack, which is heavily hindered by bulky methyl groups in tertiary $(CH_3)_3CCl$ (order: $1^\\circ > 2^\\circ > 3^\\circ$). (b) Chlorobenzene is less reactive due to: 1. Resonance stabilization giving $C-Cl$ bond partial double bond character, which is shorter and harder to break than single $C-Cl$ bond. 2. $sp^2$ hybridized carbon of chlorobenzene is more electronegative than $sp^3$ carbon in chloroethane, holding the electron pair of $C-Cl$ more tightly.',
        socratic_hints: [
          "What factors control leaving group ability down the halogen group?",
          "How does steric crowding affect $S_N2$ transition state formation?",
          "Consider resonance delocalization of lone pairs on chlorine into the aromatic $\\pi$-ring."
        ]
      },
      {
        id: 'snr_c_07',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'ORGANIC',
        chapter_number: 7,
        chapter_name: 'Alcohols, Phenols and Ethers',
        topic: 'Ethers: Synthesis & Cleavage',
        subtopic: 'Williamson Ether Synthesis Limitations & Ether Cleavage by HI',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & 2022',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_SHORT',
        benchmark_time_seconds: 240,
        marks_weightage: 3,
        question_latex: '(a) Why is the synthesis of tert-butyl ethyl ether carried out by reacting sodium tert-butoxide with ethyl bromide, rather than sodium ethoxide with tert-butyl bromide? (b) Write the chemical equation and mechanism for the reaction of anisole ($C_6H_5OCH_3$) with $HI$.',
        options_latex: [],
        correct_answer_latex: '(a) $3^\\circ$ alkyl halide undergoes elimination yielding 2-methylpropene; (b) Forms phenol and iodomethane.',
        solution_latex: '(a) Williamson synthesis is an $S_N2$ displacement. Alkoxides are strong bases as well as nucleophiles. When a $3^\\circ$ halide like tert-butyl bromide reacts with sodium ethoxide, $\\beta$-elimination dominates over substitution due to steric hindrance, yielding exclusively 2-methylpropene (isobutylene) instead of an ether. Therefore, a primary halide (ethyl bromide) must be reacted with the $3^\\circ$ alkoxide. (b) $$C_6H_5-O-CH_3 + HI \\xrightarrow{\\Delta} C_6H_5OH + CH_3I$$. Mechanism: Protonation of anisole gives $C_6H_5-\\overset{+}{O}(H)-CH_3$. The $C_6H_5-O$ bond has partial double bond character due to resonance and cannot be attacked. Iodide ion ($I^-$) attacks the less sterically hindered methyl carbon via $S_N2$, yielding phenol and methyl iodide.',
        socratic_hints: [
          "What competing reaction occurs when a tertiary alkyl halide encounters a strong alkoxide base?",
          "Can the aromatic $C-O$ bond break in anisole under acidic conditions?"
        ]
      },
      {
        id: 'snr_c_08',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'ORGANIC',
        chapter_number: 8,
        chapter_name: 'Aldehydes, Ketones and Carboxylic Acids',
        topic: 'Distinguishing Tests & Carbonyl Named Reactions',
        subtopic: 'Aldol Condensation Mechanism & Chemical Distinction Tests',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2021 (5-Mark Guaranteed)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 360,
        marks_weightage: 5,
        question_latex: '(a) Give simple chemical tests to distinguish between: (i) Ethanal and Propanal, (ii) Acetophenone and Benzophenone, (iii) Benzoic acid and Phenol. (b) Write the chemical equation and step-by-step mechanism for the Aldol condensation of ethanal ($CH_3CHO$) in presence of dilute $NaOH$ followed by heating.',
        options_latex: [],
        correct_answer_latex: 'Iodoform test, Tollens/Iodoform test, NaHCO3 test, and Aldol mechanism.',
        solution_latex: '(a)(i) Ethanal gives yellow precipitate of $CHI_3$ on warming with $I_2/NaOH$ (Iodoform test) because it contains $CH_3C=O$ group, whereas propanal does not. (ii) Acetophenone gives yellow precipitate of $CHI_3$ with $I_2/NaOH$ (methyl ketone), whereas benzophenone gives no reaction. (iii) Benzoic acid gives brisk effervescence of $CO_2$ with aqueous $NaHCO_3$, whereas phenol does not react. (b) Equation: $$2CH_3CHO \\xrightarrow{\\text{dil. } NaOH} CH_3-CH(OH)-CH_2-CHO \\xrightarrow{\\Delta, -H_2O} CH_3-CH=CH-CHO\\,\\text{(But-2-enal)}$$. Mechanism: Step 1: Hydroxide ion abstracts an $\\alpha$-hydrogen from ethanal to form resonance-stabilized enolate anion: $$CH_3CHO + OH^- \\rightleftharpoons ^-:CH_2-CHO + H_2O$$. Step 2: Nucleophilic attack of enolate on the electrophilic carbonyl carbon of a second ethanal molecule: $$CH_3CHO + ^-:CH_2CHO \\to CH_3-CH(O^-)-CH_2-CHO$$. Step 3: Proton transfer from water to yield aldol (3-hydroxybutanal): $$CH_3-CH(O^-)-CH_2CHO + H_2O \\to CH_3-CH(OH)-CH_2CHO + OH^-$$. Step 4: Dehydration on heating forms conjugated but-2-enal.',
        socratic_hints: [
          "Which functional group structure is required for a positive Iodoform test?",
          "How does $NaHCO_3$ distinguish between carboxylic acids and phenols?",
          "What is the role of dilute $NaOH$ in generating the enolate nucleophile in aldol condensation?"
        ]
      },
      {
        id: 'snr_c_09',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'ORGANIC',
        chapter_number: 9,
        chapter_name: 'Amines',
        topic: 'Basicity of Amines & Distinguishing Tests',
        subtopic: 'Aqueous Basicity Anomalies & Hinsberg Test',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & 2022',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_SHORT',
        benchmark_time_seconds: 240,
        marks_weightage: 3,
        question_latex: '(a) Arrange the following in decreasing order of basic strength in aqueous solution and justify: $(C_2H_5)_2NH$, $(C_2H_5)_3N$, $C_2H_5NH_2$, $NH_3$. (b) How can Hinsberg\'s reagent (benzenesulphonyl chloride) distinguish between $1^\\circ$, $2^\\circ$, and $3^\\circ$ ethylamines?',
        options_latex: [],
        correct_answer_latex: '(a) $(C_2H_5)_2NH > (C_2H_5)_3N > C_2H_5NH_2 > NH_3$; (b) Primary gives alkali-soluble sulfonamide, secondary gives alkali-insoluble sulfonamide, tertiary does not react.',
        solution_latex: '(a) Order: $$(C_2H_5)_2NH > (C_2H_5)_3N > C_2H_5NH_2 > NH_3$$. Justification: In aqueous medium, basic strength is governed by three combined factors: inductive ($+I$) effect, hydration energy of conjugate ammonium cations (H-bonding with water), and steric hindrance of alkyl groups. For ethyl groups, the balance of these forces makes $2^\\circ > 3^\\circ > 1^\\circ > NH_3$. (b) Hinsberg reagent ($C_6H_5SO_2Cl$): 1. Primary amine ($C_2H_5NH_2$) reacts to form $N$-ethylbenzenesulphonamide, which has an acidic hydrogen attached to nitrogen and is soluble in aqueous $KOH$. 2. Secondary amine ($(C_2H_5)_2NH$) forms $N,N$-diethylbenzenesulphonamide, which has no acidic hydrogen on nitrogen and is insoluble in $KOH$. 3. Tertiary amine ($(C_2H_5)_3N$) has no replaceable hydrogen on nitrogen and does not react at all.',
        socratic_hints: [
          "Why doesn't basicity in aqueous medium strictly follow $+I$ order $3^\\circ > 2^\\circ > 1^\\circ$?",
          "What makes the sulfonamide formed from a primary amine soluble in alkali?"
        ]
      },
      {
        id: 'snr_c_10',
        grade: '12',
        stream: 'COMMON_SENIOR',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Chemistry',
        branch: 'ORGANIC',
        chapter_number: 10,
        chapter_name: 'Biomolecules',
        topic: 'Carbohydrates: Monosaccharides & Glucose Structure',
        subtopic: 'Glucose Structure Elucidation Reactions & Protein Denaturation',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2020 (5-Mark Guaranteed)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 300,
        marks_weightage: 5,
        question_latex: '(a) State the chemical reactions of D-glucose with reagents that prove: (i) It contains a continuous chain of 6 carbon atoms. (ii) It contains a carbonyl group. (iii) The carbonyl group is present as an aldehyde ($-CHO$). (iv) It contains five hydroxyl ($-OH$) groups. (b) Explain what is meant by: (i) Zwitterion structure of an amino acid, (ii) Denaturation of proteins.',
        options_latex: [],
        correct_answer_latex: 'HI heating, NH2OH/HCN addition, Br2 water oxidation, acetic anhydride acetylation; Zwitterion and denaturation explanations.',
        solution_latex: '(a)(i) Prolonged heating with $HI$ reduces glucose to $n$-hexane: $$\\text{Glucose} \\xrightarrow{HI, \\Delta} CH_3-(CH_2)_4-CH_3$$, proving a straight chain of 6 carbons. (ii) Reaction with hydroxylamine ($NH_2OH$) forms an oxime, and reaction with $HCN$ forms a cyanohydrin, proving the presence of a carbonyl group ($>C=O$). (iii) Mild oxidation with bromine water ($Br_2/H_2O$) converts glucose into gluconic acid (a monocarboxylic acid), proving that the carbonyl group is an aldehyde. (iv) Acetylation with acetic anhydride gives glucose pentaacetate, proving the presence of 5 distinct $-OH$ groups on different carbons. (b)(i) In aqueous solution, the carboxyl group loses a proton and amino group gains a proton, forming a dipolar neutral ion called a Zwitterion ($H_3N^+-CH(R)-COO^-$). (ii) Denaturation: When a protein is subjected to physical changes (temperature) or chemical changes ($pH$), hydrogen bonds are broken, secondary and tertiary structures unfold, and biological activity is lost, while primary structure remains intact (e.g., coagulation of egg white on boiling).',
        socratic_hints: [
          "What alkane is formed when glucose is heated with red phosphorus and $HI$?",
          "Why is bromine water preferred over $HNO_3$ to identify an aldehyde group specifically?",
          "Which level of protein structure survives denaturation?"
        ]
      }
    ],
    senior_mathematics: [
      {
        id: 'snr_m_01',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'JEE_MAIN',
        subject: 'Mathematics',
        math_branch: 'CALCULUS',
        chapter_number: 7,
        chapter_name: 'Integrals',
        topic: 'Definite Integrals',
        subtopic: 'King Property of Definite Integrals',
        curriculum_board: 'JEE_MAIN',
        pyq_appearance: 'JEE Main 2024 (Shift-1)',
        difficulty: 'HARD',
        question_format: 'NUMERICAL_INTEGER',
        benchmark_time_seconds: 150,
        marks_weightage: 4,
        question_latex: 'Evaluate the definite integral $I = \\int_{0}^{\\pi/2} \\frac{\\sin^{2026} x}{\\sin^{2026} x + \\cos^{2026} x}\\,dx$. If $I = \\frac{\\pi}{k}$, what is the integer value of $k$?',
        options_latex: [],
        correct_answer_latex: '4',
        solution_latex: 'Applying the King property $\\int_a^b f(x) dx = \\int_a^b f(a+b-x) dx$: $$I = \\int_0^{\\pi/2} \\frac{\\cos^{2026} x}{\\cos^{2026} x + \\sin^{2026} x} dx$$. Adding the two expressions: $$2I = \\int_0^{\\pi/2} 1\\,dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}$$. Therefore, $k = 4$.',
        socratic_hints: [
          "Apply the identity $\\int_0^a f(x)dx = \\int_0^a f(a-x)dx$.",
          "What is $\\sin(\\frac{\\pi}{2} - x)$ and $\\cos(\\frac{\\pi}{2} - x)$?",
          "Add the original integral and transformed integral."
        ]
      },
      {
        id: 'snr_m_02',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'ALGEBRA',
        chapter_number: 4,
        chapter_name: 'Determinants',
        topic: 'Applications of Determinants & Matrices',
        subtopic: 'Solving linear systems by Matrix Method: AX = B ⇒ X = A⁻¹B',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2020 (5-Mark Guaranteed)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 360,
        marks_weightage: 5,
        question_latex: 'Solve the following system of linear equations using the matrix inversion method: $$2x + 3y + 3z = 5$$ $$x - 2y + z = -4$$ $$3x - y - 2z = 3$$',
        options_latex: [],
        correct_answer_latex: '$x = 1, y = 2, z = -1$',
        solution_latex: 'Write in matrix form $AX = B$ where $A = \\begin{bmatrix} 2 & 3 & 3 \\\\ 1 & -2 & 1 \\\\ 3 & -1 & -2 \\end{bmatrix}$, $X = \\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix}$, $B = \\begin{bmatrix} 5 \\\\ -4 \\\\ 3 \\end{bmatrix}$. First, compute $|A| = 2(4+1) - 3(-2-3) + 3(-1+6) = 10 + 15 + 15 = 40 \\neq 0$. Next, calculate cofactors to obtain $\\text{adj}(A) = \\begin{bmatrix} 5 & 3 & 9 \\\\ 5 & -13 & 1 \\\\ 5 & 11 & -7 \\end{bmatrix}$. Finally, $X = A^{-1}B = \\frac{1}{40}\\text{adj}(A)B = \\begin{bmatrix} 1 \\\\ 2 \\\\ -1 \\end{bmatrix}$. Hence, $x = 1, y = 2, z = -1$.',
        socratic_hints: [
          "Express the system in the matrix form $AX = B$.",
          "Calculate the determinant $|A|$ to verify that the matrix is non-singular.",
          "Find the adjoint matrix by computing cofactors and transposing.",
          "Multiply $A^{-1} = \\frac{1}{|A|}\\text{adj}(A)$ with $B$ to obtain $X$."
        ]
      },
      {
        id: 'snr_m_03',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'VECTORS_3D',
        chapter_number: 11,
        chapter_name: 'Three-Dimensional Geometry (3D)',
        topic: 'Shortest Distance Between Lines',
        subtopic: 'Skew lines definition and shortest distance',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & 2022 (5-Mark Guaranteed)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 300,
        marks_weightage: 5,
        question_latex: 'Find the shortest distance between the skew lines: $$\\vec{r} = (\\hat{i} + 2\\hat{j} + 3\\hat{k}) + \\lambda(\\hat{i} - 3\\hat{j} + 2\\hat{k})$$ $$\\vec{r} = (4\\hat{i} + 5\\hat{j} + 6\\hat{k}) + \\mu(2\\hat{i} + 3\\hat{j} + \\hat{k})$$',
        options_latex: [],
        correct_answer_latex: '$d = \\frac{3\\sqrt{19}}{sqrt{19}} = \\frac{3}{\\sqrt{19}} \\text{ or } \\frac{3\\sqrt{19}}{19}$ units',
        solution_latex: 'Identify points and direction vectors: $\\vec{a}_1 = \\hat{i}+2\\hat{j}+3\\hat{k}$, $\\vec{b}_1 = \\hat{i}-3\\hat{j}+2\\hat{k}$; $\\vec{a}_2 = 4\\hat{i}+5\\hat{j}+6\\hat{k}$, $\\vec{b}_2 = 2\\hat{i}+3\\hat{j}+\\hat{k}$. Then $\\vec{a}_2 - \\vec{a}_1 = 3\\hat{i}+3\\hat{j}+3\\hat{k}$. Vector cross product: $\\vec{b}_1 \\times \\vec{b}_2 = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ 1 & -3 & 2 \\\\ 2 & 3 & 1 \\end{vmatrix} = -9\\hat{i} + 3\\hat{j} + 9\\hat{k}$. Its magnitude is $|\\vec{b}_1 \\times \\vec{b}_2| = \\sqrt{(-9)^2 + 3^2 + 9^2} = \\sqrt{171} = 3\\sqrt{19}$. Scalar triple product $(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2) = 3(-9) + 3(3) + 3(9) = -27 + 9 + 27 = 9$. Shortest distance $d = \\left|\\frac{9}{3\\sqrt{19}}\\right| = \\frac{3}{\\sqrt{19}}$ units.',
        socratic_hints: [
          "Identify $\\vec{a}_1, \\vec{b}_1$ from the first line and $\\vec{a}_2, \\vec{b}_2$ from the second line.",
          "Compute $\\vec{a}_2 - \\vec{a}_1$ and $\\vec{b}_1 \\times \\vec{b}_2$.",
          "Apply the formula $d = \\left|\\frac{(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2)}{|\\vec{b}_1 \\times \\vec{b}_2|}\\right|$."
        ]
      },
      {
        id: 'snr_m_04',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'LINEAR_PROGRAMMING',
        chapter_number: 12,
        chapter_name: 'Linear Programming (LPP)',
        topic: 'Corner Point Method',
        subtopic: 'Bounded region: Evaluating Z at all corner points for max/min',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 (5-Mark Guaranteed)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 240,
        marks_weightage: 5,
        question_latex: 'Solve the following linear programming problem graphically: Maximize $Z = 4x + y$ subject to the constraints: $$x + y \\leq 50$$ $$3x + y \\leq 90$$ $$x \\geq 0, y \\geq 0$$',
        options_latex: [],
        correct_answer_latex: 'Maximum $Z = 120$ at $(30, 0)$',
        solution_latex: '1. Plot boundary lines $x + y = 50$ (intercepts $(50,0), (0,50)$) and $3x + y = 90$ (intercepts $(30,0), (0,90)$). 2. Testing $(0,0)$ confirms origin lies in both half-planes. 3. Find intersection of boundary lines: $(3x+y) - (x+y) = 90 - 50 \\implies 2x = 40 \\implies x = 20, y = 30$. 4. Feasible corner points are $O(0, 0)$, $A(30, 0)$, $B(20, 30)$, $C(0, 50)$. 5. Evaluate $Z$: $Z(0,0)=0$, $Z(30,0)=4(30)+0=120$, $Z(20,30)=4(20)+30=110$, $Z(0,50)=0+50=50$. Hence, Maximum $Z = 120$ occurs at $(30, 0)$.',
        socratic_hints: [
          "Convert inequalities to equations and find the $x$ and $y$ intercepts.",
          "Shade the region towards the origin since $(0,0)$ satisfies both inequalities.",
          "Find the intersection coordinates of $x + y = 50$ and $3x + y = 90$.",
          "Evaluate $Z$ at each vertex of the polygon."
        ]
      },
      {
        id: 'snr_m_05',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'CALCULUS',
        chapter_number: 6,
        chapter_name: 'Applications of Derivatives (AOD)',
        topic: 'Maxima and Minima',
        subtopic: 'Applied geometric optimization word problems',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2019 (5-Mark / Case-Study)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 300,
        marks_weightage: 5,
        question_latex: 'An open box with a square base is to be constructed out of a given quantity of cardboard of area $c^2$. Show that the maximum volume of the box is $\\frac{c^3}{6\\sqrt{3}}$.',
        options_latex: [],
        correct_answer_latex: '$V_{max} = \\frac{c^3}{6\\sqrt{3}}$',
        solution_latex: 'Let length of base be $x$ and height be $h$. Total surface area of open box: $S = x^2 + 4xh = c^2 \\implies h = \\frac{c^2 - x^2}{4x}$. Volume $V = x^2 h = x^2 \\left(\\frac{c^2 - x^2}{4x}\\right) = \\frac{1}{4}(c^2 x - x^3)$. Differentiating with respect to $x$: $\\frac{dV}{dx} = \\frac{1}{4}(c^2 - 3x^2)$. Setting $\\frac{dV}{dx} = 0 \\implies x = \\frac{c}{\\sqrt{3}}$. Second derivative test: $\\frac{d^2V}{dx^2} = -\\frac{6x}{4} < 0$ at $x = \\frac{c}{\\sqrt{3}}$, confirming a maximum. Substituting $x = \\frac{c}{\\sqrt{3}}$: $V_{max} = \\frac{1}{4}\\left(c^2 \\cdot \\frac{c}{\\sqrt{3}} - \\frac{c^3}{3\\sqrt{3}}\\right) = \\frac{1}{4} \\cdot \\frac{2c^3}{3\\sqrt{3}} = \\frac{c^3}{6\\sqrt{3}}$.',
        socratic_hints: [
          "Express the surface area of the open box (bottom + 4 sides) in terms of $x$ and $h$.",
          "Solve for $h$ in terms of $x$ and substitute into $V = x^2 h$.",
          "Differentiate $V$ with respect to $x$ and equate to zero.",
          "Check the second derivative to establish that $V$ is indeed maximized."
        ]
      },
      {
        id: 'snr_m_06',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'PROBABILITY',
        chapter_number: 13,
        chapter_name: 'Probability',
        topic: 'Bayes\' Theorem',
        subtopic: 'Cause-and-effect reversal problems (machine defects, medical diagnostic tests, truth/lie)',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 (4-Mark Case-Study)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 240,
        marks_weightage: 4,
        question_latex: 'In a factory, three machines $E_1, E_2, E_3$ produce $50\\%, 30\\%, 20\\%$ of the total output. Of their output, $2\\%, 2\\%, 3\\%$ are defective bolts respectively. A bolt is chosen at random and found to be defective. What is the probability that it was produced by machine $E_2$?',
        options_latex: [],
        correct_answer_latex: '$P(E_2|A) = \\frac{3}{11}$',
        solution_latex: 'Let $A$ be the event that the bolt is defective. Probabilities: $P(E_1) = 0.5, P(E_2) = 0.3, P(E_3) = 0.2$. Conditional probabilities: $P(A|E_1) = 0.02, P(A|E_2) = 0.02, P(A|E_3) = 0.03$. Total probability $P(A) = (0.5)(0.02) + (0.3)(0.02) + (0.2)(0.03) = 0.010 + 0.006 + 0.006 = 0.022$. By Bayes\' Theorem: $$P(E_2|A) = \\frac{P(E_2)P(A|E_2)}{P(A)} = \\frac{0.3 \\times 0.02}{0.022} = \\frac{0.006}{0.022} = \\frac{6}{22} = \\frac{3}{11}$$.',
        socratic_hints: [
          "Define the partition events $E_1, E_2, E_3$ and the observed event $A$ (defective bolt).",
          "Compute the total probability $P(A) = \\sum P(E_i)P(A|E_i)$.",
          "Apply Bayes Theorem formula for $P(E_2|A)$."
        ]
      },
      {
        id: 'snr_m_07',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'RELATIONS_FUNCTIONS',
        chapter_number: 1,
        chapter_name: 'Relations and Functions',
        topic: 'Types of Relations',
        subtopic: 'Equivalence Relations & Equivalence Classes [a]',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 (3-Mark Standard)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 180,
        marks_weightage: 3,
        question_latex: 'Let $\\mathbb{Z}$ be the set of all integers and $R$ be the relation on $\\mathbb{Z} \\times \\mathbb{Z}$ defined by $((a, b), (c, d)) \\in R \\iff a + d = b + c$. Prove that $R$ is an equivalence relation.',
        options_latex: [],
        correct_answer_latex: 'Equivalence relation proven (Reflexive, Symmetric, Transitive)',
        solution_latex: '1. Reflexivity: For all $(a, b) \\in \\mathbb{Z} \\times \\mathbb{Z}$, $a + b = b + a \\implies ((a, b), (a, b)) \\in R$. Hence $R$ is reflexive. 2. Symmetry: Let $((a, b), (c, d)) \\in R \\implies a + d = b + c \\implies c + b = d + a \\implies c + b = a + d \\implies ((c, d), (a, b)) \\in R$. Hence $R$ is symmetric. 3. Transitivity: Let $((a, b), (c, d)) \\in R$ and $((c, d), (e, f)) \\in R$. Then $a + d = b + c$ and $c + f = d + e$. Adding the two equations: $(a + d) + (c + f) = (b + c) + (d + e) \\implies a + f = b + e \\implies ((a, b), (e, f)) \\in R$. Hence $R$ is transitive. Since $R$ is reflexive, symmetric, and transitive, it is an equivalence relation.',
        socratic_hints: [
          "Check reflexivity by substituting $(c, d) = (a, b)$. Does $a + b = b + a$ hold?",
          "Check symmetry: Does $a + d = b + c$ imply $c + b = d + a$?",
          "For transitivity, add the two equations $a + d = b + c$ and $c + f = d + e$ together and cancel common terms."
        ]
      }
    ],
    senior_biology: [
      {
            "id": "snr_b_01",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "BOTANY",
            "chapter_number": 1,
            "chapter_name": "Sexual Reproduction in Flowering Plants",
            "chapter": "Sexual Reproduction in Flowering Plants",
            "topic": "Pre-Fertilization: Structures and Events",
            "subtopic": "Filiform Apparatus & Sporopollenin in Exine",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2023 & NEET 2022",
            "difficulty": "MEDIUM",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 180,
            "marks_weightage": 3,
            "question_latex": "(a) What is the function of the filiform apparatus present in the synergids of the angiosperm embryo sac? (b) Name the organic material composing the exine of pollen grains. Why can no known enzyme degrade it?",
            "options_latex": [],
            "correct_answer_latex": "(a) Guides pollen tube entry into synergid; (b) Sporopollenin withstands high temperatures, strong acids/alkali, and enzymatic breakdown.",
            "solution_latex": "(a) The filiform apparatus consists of special cellular finger-like thickenings at the micropylar tip of the synergids that play an essential role in guiding the entry of the pollen tube into the embryo sac. (b) The exine is made of sporopollenin, one of the most resistant biological materials known. It can withstand high temperatures, strong acids, and alkali. No enzyme capable of degrading sporopollenin has been discovered to date, which also accounts for the excellent preservation of pollen grains as fossils.",
            "socratic_hints": [
                  "Where is the filiform apparatus located in the 7-celled embryo sac?",
                  "Which component of the pollen wall protects male gametes during harsh abiotic transit?"
            ]
      },
      {
            "id": "snr_b_02",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "ZOOLOGY",
            "chapter_number": 2,
            "chapter_name": "Human Reproduction",
            "chapter": "Human Reproduction",
            "topic": "The Menstrual Cycle",
            "subtopic": "Ovarian & Pituitary Hormones during Menstrual Cycle",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2024 & 2020 (5-Mark Guaranteed)",
            "difficulty": "HARD",
            "question_format": "SUBJECTIVE_LONG",
            "benchmark_time_seconds": 300,
            "marks_weightage": 5,
            "question_latex": "Explain the hormonal regulation of the human menstrual cycle: (i) What induces the LH surge and what is its consequence on Day 14? (ii) Which structure secretes progesterone during the luteal phase, and what is its role? (iii) What causes the breakdown of the endometrium leading to menstruation in the absence of fertilization?",
            "options_latex": [],
            "correct_answer_latex": "(i) Rising estrogen triggers LH surge causing ovulation; (ii) Corpus luteum secretes progesterone to maintain endometrium; (iii) Degeneration of corpus luteum and progesterone withdrawal.",
            "solution_latex": "(i) During the follicular phase, developing ovarian follicles secrete estrogen. High levels of estrogen exert positive feedback on the anterior pituitary, leading to a rapid surge in LH (LH surge) around day 14. This induces rupture of the mature Graafian follicle and releases the secondary oocyte (ovulation). (ii) Following ovulation, the remaining ruptured Graafian follicle transforms into the Corpus Luteum, which secretes large amounts of progesterone. Progesterone is essential for maintaining the vascular endometrium in a secretory state for blastocyst implantation. (iii) If fertilization does not occur, the corpus luteum degenerates into corpus albicans. This causes a steep drop in progesterone and estrogen levels, leading to disintegration of the endometrial lining, rupture of blood vessels, and the onset of menstrual flow.",
            "socratic_hints": [
                  "Which hormone peaks right before day 14 to stimulate the LH surge?",
                  "What happens to the ruptured Graafian follicle after ovulation?",
                  "Why does withdrawal of progesterone lead to menstruation?"
            ]
      },
      {
            "id": "snr_b_03",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "ZOOLOGY",
            "chapter_number": 3,
            "chapter_name": "Reproductive Health",
            "chapter": "Reproductive Health",
            "topic": "Population Explosion and Contraceptive Methods",
            "subtopic": "Intrauterine Devices (IUDs) Classification and Action",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2023 & NEET 2021",
            "difficulty": "MEDIUM",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 210,
            "marks_weightage": 3,
            "question_latex": "(a) Classify Intrauterine Devices (IUDs) into three categories with one clinical example for each. (b) Explain how copper-releasing IUDs (e.g. $\\text{CuT}$) prevent conception in females.",
            "options_latex": [],
            "correct_answer_latex": "(a) Non-medicated (Lippes loop), Copper-releasing (CuT, Multiload 375), Hormone-releasing (LNG-20); (b) Cu2+ ions suppress sperm motility and fertilizing capacity.",
            "solution_latex": "(a) 1. Non-medicated IUDs: Lippes loop (increases phagocytosis of sperms within the uterus). 2. Copper-releasing IUDs: CuT, Cu7, Multiload 375. 3. Hormone-releasing IUDs: Progestasert, LNG-20. (b) Copper-releasing IUDs continuously release free $Cu^{2+}$ ions into the uterine cavity. These copper ions suppress sperm motility, impair sperm metabolic enzymes, and reduce sperm fertilizing capacity. Simultaneously, the physical presence of the IUD stimulates a mild inflammatory response promoting phagocytosis of sperms by macrophages.",
            "socratic_hints": [
                  "List the three categories of IUDs recognized by NCERT.",
                  "What is the specific physiological effect of copper ions on sperm kinetics?"
            ]
      },
      {
            "id": "snr_b_04",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "BOTANY",
            "chapter_number": 4,
            "chapter_name": "Principles of Inheritance and Variation",
            "chapter": "Principles of Inheritance and Variation",
            "topic": "Genetic Disorders and Pedigree Analysis",
            "subtopic": "Sickle-cell Anemia vs Thalassemia",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2024 & NEET 2023",
            "difficulty": "HARD",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 240,
            "marks_weightage": 3,
            "question_latex": "(a) State the precise molecular change in the $\\beta$-globin gene that causes sickle-cell anaemia. (b) Differentiate between sickle-cell anaemia and thalassemia on the basis of their underlying genetic defects.",
            "options_latex": [],
            "correct_answer_latex": "(a) GAG to GUG transversion at codon 6 (Glutamic acid to Valine); (b) Sickle-cell is qualitative, Thalassemia is quantitative.",
            "solution_latex": "(a) Sickle-cell anaemia is caused by a point mutation (transversion) replacing Adenine with Thymine at the 6th codon of the $\\beta$-globin gene ($GAG \\to GUG$). This alters mRNA transcription and leads to the substitution of Glutamic acid (hydrophilic) by Valine (hydrophobic) at the 6th position of the $\\beta$-globin peptide chain, causing polymerisation under low $O_2$ tension. (b) Sickle-cell anaemia is a *qualitative* problem where an abnormal, malfunctioning haemoglobin (HbS) molecule is synthesized. In contrast, Thalassemia is a *quantitative* problem where reduced or absent synthesis of either $\\alpha$ or $\\beta$ globin polypeptide chains occurs, leading to an imbalance in globin subunits.",
            "socratic_hints": [
                  "Which amino acid replaces glutamic acid at the 6th position of the beta chain?",
                  "Is thalassemia characterized by defective globin structure or reduced chain quantity?"
            ]
      },
      {
            "id": "snr_b_05",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "BOTANY",
            "chapter_number": 5,
            "chapter_name": "Molecular Basis of Inheritance",
            "chapter": "Molecular Basis of Inheritance",
            "topic": "Genetic Code, Translation & Regulation",
            "subtopic": "Lac Operon Induction & Regulatory Mechanism",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2023 & 2021 (5-Mark Guaranteed)",
            "difficulty": "HARD",
            "question_format": "SUBJECTIVE_LONG",
            "benchmark_time_seconds": 360,
            "marks_weightage": 5,
            "question_latex": "(a) Explain the operon concept with reference to the Lac operon of $E. coli$ in the: (i) Absence of lactose, (ii) Presence of lactose. (b) Name the three structural genes and state the specific enzymatic function of each product. (c) Why is the regulation of the lac operon termed negative regulation?",
            "options_latex": [],
            "correct_answer_latex": "i-gene repressor binds operator in absence of lactose; allolactose inactivates repressor; z, y, a genes encode beta-galactosidase, permease, transacetylase; negative regulation.",
            "solution_latex": "(a)(i) In the absence of lactose: The regulatory $i$ gene constitutively transcribes and translates an active repressor protein. The repressor binds specifically to the operator ($o$) region, physically blocking RNA polymerase from transcribing the structural genes (Switched 'OFF'). (ii) In the presence of lactose: Lactose (allolactose) acts as an inducer and binds to the repressor protein. This induces an allosteric conformational change that inactivates the repressor, releasing it from the operator. RNA polymerase can now access the promoter and transcribe the structural genes (Switched 'ON'). (b) Structural genes: 1. $z$ gene: encodes $\\beta$-galactosidase (hydrolyzes lactose into glucose and galactose). 2. $y$ gene: encodes Permease (increases cell permeability to $\\beta$-galactosides). 3. $a$ gene: encodes Transacetylase (transfers acetyl group from acetyl-CoA to $\\beta$-galactosides). (c) It is termed negative regulation because the operon is normally kept switched off by the binding of a repressor protein.",
            "socratic_hints": [
                  "Which gene produces the repressor that blocks the operator?",
                  "What role does allolactose play in freeing the operator?",
                  "List the three structural genes $z, y, a$ and their corresponding enzymes."
            ]
      },
      {
            "id": "snr_b_06",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "ZOOLOGY",
            "chapter_number": 6,
            "chapter_name": "Evolution",
            "chapter": "Evolution",
            "topic": "Biological Evolution & Hardy-Weinberg Principle",
            "subtopic": "Hardy-Weinberg Frequency Calculation",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2022 & NEET 2023",
            "difficulty": "MEDIUM",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 180,
            "marks_weightage": 3,
            "question_latex": "In a randomly mating population at Hardy-Weinberg equilibrium, the frequency of an autosomal recessive allele ($a$) is $0.2$. Calculate: (i) The frequency of the dominant allele ($A$), (ii) The percentage of homozygous dominant individuals ($AA$), (iii) The percentage of heterozygous carriers ($Aa$) in this population.",
            "options_latex": [],
            "correct_answer_latex": "(i) p = 0.8, (ii) AA = 64%, (iii) Aa = 32%",
            "solution_latex": "Hardy-Weinberg equilibrium states: $p + q = 1$ and $p^2 + 2pq + q^2 = 1$. Given frequency of recessive allele $q = 0.2$. (i) Dominant allele frequency $p = 1 - q = 1 - 0.2 = 0.8$. (ii) Frequency of homozygous dominant ($AA$) $= p^2 = (0.8)^2 = 0.64 \\implies 64\\%$. (iii) Frequency of heterozygous carriers ($Aa$) $= 2pq = 2 \\times 0.8 \\times 0.2 = 0.32 \\implies 32\\%$.",
            "socratic_hints": [
                  "Recall the Hardy-Weinberg equations $p + q = 1$ and $p^2 + 2pq + q^2 = 1$.",
                  "Which term represents the heterozygous carrier frequency?"
            ]
      },
      {
            "id": "snr_b_07",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "ZOOLOGY",
            "chapter_number": 7,
            "chapter_name": "Human Health and Diseases",
            "chapter": "Human Health and Diseases",
            "topic": "Pathogens and Common Infectious Diseases",
            "subtopic": "Plasmodium Life Cycle and Pathogenesis",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2024 & 2019 (5-Mark Guaranteed)",
            "difficulty": "MEDIUM",
            "question_format": "SUBJECTIVE_LONG",
            "benchmark_time_seconds": 300,
            "marks_weightage": 5,
            "question_latex": "(a) Trace the life cycle of $Plasmodium$ in the human host from the entry of sporozoites to the release of haemozoin. (b) Where does the sexual stage (fertilization and development) of $Plasmodium$ take place, and in which organ of the mosquito are mature sporozoites stored?",
            "options_latex": [],
            "correct_answer_latex": "(a) Sporozoites infect liver cells, reproduce asexually, attack RBCs, burst releasing haemozoin; (b) Fertilization in mosquito gut, sporozoites stored in salivary glands.",
            "solution_latex": "(a) Life cycle in human host: 1. Female $Anopheles$ mosquito bites a human, injecting infectious sporozoites into the blood. 2. Sporozoites migrate to liver cells through circulation, where they reproduce asexually, eventually bursting the hepatocytes. 3. Parasites (merozoites) invade red blood cells (erythrocytes) and multiply asexually. 4. RBCs rupture, releasing more merozoites and a toxic chemical called Haemozoin. Haemozoin is responsible for recurring chills and high fever every 3–4 days. 5. Some erythrocytic parasites differentiate into sexual stages (male and female gametocytes) in human blood. (b) When another mosquito takes a blood meal, gametocytes enter the mosquito body. Fertilization and zygote development occur within the mosquito's stomach/gut. The resulting sporozoites bore through the gut wall and migrate to the mosquito's salivary glands, where they are stored until injected into a new human host.",
            "socratic_hints": [
                  "What is the infectious stage of Plasmodium injected into humans?",
                  "Which toxin causes the recurring chills and fevers of malaria?",
                  "Where does fertilization of gametocytes occur in the mosquito?"
            ]
      },
      {
            "id": "snr_b_08",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "BOTANY",
            "chapter_number": 8,
            "chapter_name": "Microbes in Human Welfare",
            "chapter": "Microbes in Human Welfare",
            "topic": "Microbes in Household, Industrial & Energy Production",
            "subtopic": "Bioactive Molecules & Organic Acids from Microbes",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2023 & NEET 2022",
            "difficulty": "EASY",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 180,
            "marks_weightage": 3,
            "question_latex": "Name the source microorganism and state the clinical / industrial application of each of the following: (i) Statins, (ii) Cyclosporin A, (iii) Streptokinase.",
            "options_latex": [],
            "correct_answer_latex": "(i) Monascus purpureus - blood cholesterol lowering; (ii) Trichoderma polysporum - immunosuppressant; (iii) Streptococcus - clot buster.",
            "solution_latex": "(i) Statins: Produced by the yeast $Monascus\\,purpureus$. Clinical role: Acts as a blood-cholesterol lowering agent by competitively inhibiting the enzyme responsible for cholesterol synthesis. (ii) Cyclosporin A: Produced by the fungus $Trichoderma\\,polysporum$. Clinical role: Acts as an immunosuppressive agent used to prevent graft rejection in organ transplant patients. (iii) Streptokinase: Produced by the bacterium $Streptococcus$ (modified by genetic engineering). Clinical role: Used as a \"clot buster\" for removing blood clots from blood vessels of patients suffering from myocardial infarction.",
            "socratic_hints": [
                  "Which yeast produces statins?",
                  "Which fungus produces Cyclosporin A used in organ transplantation?",
                  "What is the medical function of streptokinase?"
            ]
      },
      {
            "id": "snr_b_09",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "BOTANY",
            "chapter_number": 9,
            "chapter_name": "Biotechnology: Principles and Processes",
            "chapter": "Biotechnology: Principles and Processes",
            "topic": "Core Principles and Tools",
            "subtopic": "Insertional Inactivation in pBR322 Vector",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2024 & NEET 2024",
            "difficulty": "HARD",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 240,
            "marks_weightage": 3,
            "question_latex": "(a) A foreign gene is inserted at the $Bam\\text{HI}$ restriction site located within the tetracycline resistance gene ($tet^R$) of plasmid $\\text{pBR322}$. Explain the phenomenon of insertional inactivation. (b) How can recombinants be distinguished from non-recombinants using replica plating on antibiotic media?",
            "options_latex": [],
            "correct_answer_latex": "Insertion disrupts tetR gene causing loss of tetracycline resistance; recombinants grow on ampicillin but die on tetracycline.",
            "solution_latex": "(a) Insertional inactivation refers to the disruption and loss of function of a selectable marker gene (here, $tet^R$) due to the insertion of a foreign DNA fragment within its coding sequence. As a result, the recombinant plasmid can no longer produce the protein conferring tetracycline resistance. (b) Screening process: 1. Transformants are first plated on ampicillin-containing agar. All cells carrying intact plasmid (recombinants and non-recombinants) will grow because $amp^R$ is unaffected. 2. A replica of these colonies is transferred onto tetracycline-containing agar. Non-recombinants survive on tetracycline, whereas recombinants fail to grow and die on tetracycline. Comparing the two plates identifies the recombinant colonies.",
            "socratic_hints": [
                  "What happens to the $tet^R$ gene when foreign DNA is spliced into the $Bam\\text{HI}$ site?",
                  "How do recombinants behave on ampicillin versus tetracycline plates?"
            ]
      },
      {
            "id": "snr_b_10",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "BOTANY",
            "chapter_number": 10,
            "chapter_name": "Biotechnology and its Applications",
            "chapter": "Biotechnology and its Applications",
            "topic": "Applications in Agriculture",
            "subtopic": "RNA Interference (RNAi) in Pest-Resistant Plants",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2023 & 2021",
            "difficulty": "HARD",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 240,
            "marks_weightage": 3,
            "question_latex": "Explain how the process of RNA interference (RNAi) was implemented to protect tobacco roots against infestation by the nematode $Meloidogyne\\,incognita$. Name the vector used and explain the role of double-stranded RNA (dsRNA).",
            "options_latex": [],
            "correct_answer_latex": "Agrobacterium vector introduces nematode-specific genes producing sense & anti-sense RNA; dsRNA silences nematode mRNA via RNAi.",
            "solution_latex": "1. Nematode-specific genes were introduced into the host tobacco plant using $Agrobacterium\\,tumefaciens$ vectors. 2. The introduced DNA was engineered so that it produced both sense and anti-sense RNA in the host plant cells. 3. Because these two RNA strands were complementary to each other, they hybridized to form a double-stranded RNA (dsRNA). 4. This dsRNA triggered the cellular defense mechanism called RNA interference (RNAi). 5. When the nematode feeds on the transgenic plant, the dsRNA silences the specific mRNA of the nematode, preventing protein synthesis. As a result, the nematode cannot survive in the transgenic host.",
            "socratic_hints": [
                  "Which vector transfers the nematode-specific genes into the host plant?",
                  "What does the hybridization of sense and anti-sense RNA create?",
                  "How does dsRNA prevent nematode survival?"
            ]
      },
      {
            "id": "snr_b_11",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "ZOOLOGY",
            "chapter_number": 11,
            "chapter_name": "Organisms and Populations",
            "chapter": "Organisms and Populations",
            "topic": "Population Attributes & Growth Models",
            "subtopic": "Verhulst-Pearl Logistic Growth Equation",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2023 & 2019",
            "difficulty": "MEDIUM",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 210,
            "marks_weightage": 3,
            "question_latex": "(a) Write the differential equation for Verhulst-Pearl Logistic Growth of a population and identify each parameter ($N, r, K$). (b) What is the shape of the growth curve obtained, and why is this model considered more realistic than exponential growth?",
            "options_latex": [],
            "correct_answer_latex": "dN/dt = rN((K-N)/K); Sigmoid S-shaped curve; resources are limited in nature.",
            "solution_latex": "(a) Differential equation: $$\\frac{dN}{dt} = rN\\left(\\frac{K - N}{K}\\right)$$ where $N = \\text{Population density at time } t$, $r = \\text{Intrinsic rate of natural increase}$, $K = \\text{Carrying capacity of the environment}$. (b) The curve is a Sigmoid (S-shaped) curve showing lag phase, acceleration, deceleration, and reaching an asymptote when $N = K$. It is more realistic than exponential growth because in nature, resources (food, space, breeding grounds) are finite and limiting; no population can sustain exponential growth indefinitely without reaching carrying capacity.",
            "socratic_hints": [
                  "What does carrying capacity (K) represent in an ecosystem?",
                  "What is the mathematical fraction that reflects environmental resistance?"
            ]
      },
      {
            "id": "snr_b_12",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "BOTANY",
            "chapter_number": 12,
            "chapter_name": "Ecosystem",
            "chapter": "Ecosystem",
            "topic": "Ecological Pyramids",
            "subtopic": "Inverted Biomass Pyramid in Ocean vs Always Upright Energy Pyramid",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2024 & 2022",
            "difficulty": "MEDIUM",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 210,
            "marks_weightage": 3,
            "question_latex": "(a) Why is the pyramid of biomass in a marine (sea / lake) ecosystem inverted? (b) State the fundamental reason why the pyramid of energy can never be inverted in any natural ecosystem.",
            "options_latex": [],
            "correct_answer_latex": "(a) Biomass of short-lived phytoplankton is smaller than long-lived fishes; (b) Second law of thermodynamics and 10% law energy loss.",
            "solution_latex": "(a) In marine and lake ecosystems, the primary producers are tiny phytoplankton with rapid turnover rates and short life spans. At any given moment, the standing crop biomass of phytoplankton is very small compared to the much larger, longer-lived biomass of zooplankton and predatory fishes that feed on them, yielding an inverted pyramid of biomass. (b) The pyramid of energy is always upright without exception because energy flow is strictly unidirectional and governed by the laws of thermodynamics. According to Lindeman's 10% law, only about 10% of the energy is transferred from one trophic level to the next; 90% is dissipated as metabolic heat, meaning higher trophic levels inevitably possess less energy.",
            "socratic_hints": [
                  "Compare the lifespans and standing biomass of phytoplankton vs carnivorous fish.",
                  "What proportion of energy is lost as heat at each trophic step?"
            ]
      },
      {
            "id": "snr_b_13",
            "grade": "12",
            "stream": "MEDICAL",
            "target_exam": "CBSE_CLASS_12",
            "subject": "Biology",
            "branch": "BOTANY",
            "chapter_number": 13,
            "chapter_name": "Biodiversity and Conservation",
            "chapter": "Biodiversity and Conservation",
            "topic": "Biodiversity Patterns and Loss",
            "subtopic": "Species-Area Relationship & Z-value Significance",
            "curriculum_board": "CBSE_BOARD",
            "pyq_appearance": "CBSE Class 12 Board 2023 & 2020",
            "difficulty": "MEDIUM",
            "question_format": "SUBJECTIVE_SHORT",
            "benchmark_time_seconds": 210,
            "marks_weightage": 3,
            "question_latex": "(a) State the mathematical equation for Alexander von Humboldt's Species-Area Relationship on: (i) Normal rectangular hyperbola scale, (ii) Logarithmic scale. (b) What is the typical range of slope $Z$ for local regions, and how does $Z$ change when analyzing entire continents?",
            "options_latex": [],
            "correct_answer_latex": "(a) S = C A^Z and log S = log C + Z log A; (b) Z = 0.1 to 0.2 for regions, Z = 0.6 to 1.2 for continents.",
            "solution_latex": "(a)(i) On a normal rectangular hyperbola scale: $$S = C A^Z$$. (ii) On a logarithmic scale: $$\\log S = \\log C + Z \\log A$$ where $S = \\text{Species richness}$, $A = \\text{Area}$, $C = \\text{Y-intercept}$, and $Z = \\text{Slope of the line / regression coefficient}$. (b) For small to medium local regions (e.g. plants in Britain, birds in California), the value of $Z$ consistently lies in the range of $0.1$ to $0.2$, regardless of taxonomic group. However, when species-area relationships are analyzed across massive areas like entire continents, the regression line is much steeper with $Z$ values ranging between $0.6$ and $1.2$ (e.g. for frugivorous birds and mammals in tropical forests of continents, $Z = 1.15$).",
            "socratic_hints": [
                  "What is the logarithmic form of the species-area power equation?",
                  "Why does the regression slope become steeper when analyzing continental scales?"
            ]
      }
],
    senior_mathematics: [
      {
        id: 'snr_m_01',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'JEE_MAIN',
        subject: 'Mathematics',
        math_branch: 'CALCULUS',
        chapter_number: 7,
        chapter_name: 'Integrals',
        topic: 'Definite Integrals',
        subtopic: 'King Property of Definite Integrals',
        curriculum_board: 'JEE_MAIN',
        pyq_appearance: 'JEE Main 2024 (Shift-1)',
        difficulty: 'HARD',
        question_format: 'NUMERICAL_INTEGER',
        benchmark_time_seconds: 150,
        marks_weightage: 4,
        question_latex: 'Evaluate the definite integral $I = \\int_{0}^{\\pi/2} \\frac{\\sin^{2026} x}{\\sin^{2026} x + \\cos^{2026} x}\\,dx$. If $I = \\frac{\\pi}{k}$, what is the integer value of $k$?',
        options_latex: [],
        correct_answer_latex: '4',
        solution_latex: 'Applying the King property $\\int_a^b f(x) dx = \\int_a^b f(a+b-x) dx$: $$I = \\int_0^{\\pi/2} \\frac{\\cos^{2026} x}{\\cos^{2026} x + \\sin^{2026} x} dx$$. Adding the two expressions: $$2I = \\int_0^{\\pi/2} 1\\,dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}$$. Therefore, $k = 4$.',
        socratic_hints: [
          "Apply the identity $\\int_0^a f(x)dx = \\int_0^a f(a-x)dx$.",
          "What is $\\sin(\\frac{\\pi}{2} - x)$ and $\\cos(\\frac{\\pi}{2} - x)$?",
          "Add the original integral and transformed integral."
        ]
      },
      {
        id: 'snr_m_02',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'ALGEBRA',
        chapter_number: 4,
        chapter_name: 'Determinants',
        topic: 'Applications of Determinants & Matrices',
        subtopic: 'Solving linear systems by Matrix Method: AX = B ⇒ X = A⁻¹B',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2020 (5-Mark Guaranteed)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 360,
        marks_weightage: 5,
        question_latex: 'Solve the following system of linear equations using the matrix inversion method: $$2x + 3y + 3z = 5$$ $$x - 2y + z = -4$$ $$3x - y - 2z = 3$$',
        options_latex: [],
        correct_answer_latex: '$x = 1, y = 2, z = -1$',
        solution_latex: 'Write in matrix form $AX = B$ where $A = \\begin{bmatrix} 2 & 3 & 3 \\\\ 1 & -2 & 1 \\\\ 3 & -1 & -2 \\end{bmatrix}$, $X = \\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix}$, $B = \\begin{bmatrix} 5 \\\\ -4 \\\\ 3 \\end{bmatrix}$. First, compute $|A| = 2(4+1) - 3(-2-3) + 3(-1+6) = 10 + 15 + 15 = 40 \\neq 0$. Next, calculate cofactors to obtain $\\text{adj}(A) = \\begin{bmatrix} 5 & 3 & 9 \\\\ 5 & -13 & 1 \\\\ 5 & 11 & -7 \\end{bmatrix}$. Finally, $X = A^{-1}B = \\frac{1}{40}\\text{adj}(A)B = \\begin{bmatrix} 1 \\\\ 2 \\\\ -1 \\end{bmatrix}$. Hence, $x = 1, y = 2, z = -1$.',
        socratic_hints: [
          "Express the system in the matrix form $AX = B$.",
          "Calculate the determinant $|A|$ to verify that the matrix is non-singular.",
          "Find the adjoint matrix by computing cofactors and transposing.",
          "Multiply $A^{-1} = \\frac{1}{|A|}\\text{adj}(A)$ with $B$ to obtain $X$."
        ]
      },
      {
        id: 'snr_m_03',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'VECTORS_3D',
        chapter_number: 11,
        chapter_name: 'Three-Dimensional Geometry (3D)',
        topic: 'Shortest Distance Between Lines',
        subtopic: 'Skew lines definition and shortest distance',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 & 2022 (5-Mark Guaranteed)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 300,
        marks_weightage: 5,
        question_latex: 'Find the shortest distance between the skew lines: $$\\vec{r} = (\\hat{i} + 2\\hat{j} + 3\\hat{k}) + \\lambda(\\hat{i} - 3\\hat{j} + 2\\hat{k})$$ $$\\vec{r} = (4\\hat{i} + 5\\hat{j} + 6\\hat{k}) + \\mu(2\\hat{i} + 3\\hat{j} + \\hat{k})$$',
        options_latex: [],
        correct_answer_latex: '$d = \\frac{3\\sqrt{19}}{sqrt{19}} = \\frac{3}{\\sqrt{19}} \\text{ or } \\frac{3\\sqrt{19}}{19}$ units',
        solution_latex: 'Identify points and direction vectors: $\\vec{a}_1 = \\hat{i}+2\\hat{j}+3\\hat{k}$, $\\vec{b}_1 = \\hat{i}-3\\hat{j}+2\\hat{k}$; $\\vec{a}_2 = 4\\hat{i}+5\\hat{j}+6\\hat{k}$, $\\vec{b}_2 = 2\\hat{i}+3\\hat{j}+\\hat{k}$. Then $\\vec{a}_2 - \\vec{a}_1 = 3\\hat{i}+3\\hat{j}+3\\hat{k}$. Vector cross product: $\\vec{b}_1 \\times \\vec{b}_2 = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ 1 & -3 & 2 \\\\ 2 & 3 & 1 \\end{vmatrix} = -9\\hat{i} + 3\\hat{j} + 9\\hat{k}$. Its magnitude is $|\\vec{b}_1 \\times \\vec{b}_2| = \\sqrt{(-9)^2 + 3^2 + 9^2} = \\sqrt{171} = 3\\sqrt{19}$. Scalar triple product $(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2) = 3(-9) + 3(3) + 3(9) = -27 + 9 + 27 = 9$. Shortest distance $d = \\left|\\frac{9}{3\\sqrt{19}}\\right| = \\frac{3}{\\sqrt{19}}$ units.',
        socratic_hints: [
          "Identify $\\vec{a}_1, \\vec{b}_1$ from the first line and $\\vec{a}_2, \\vec{b}_2$ from the second line.",
          "Compute $\\vec{a}_2 - \\vec{a}_1$ and $\\vec{b}_1 \\times \\vec{b}_2$.",
          "Apply the formula $d = \\left|\\frac{(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2)}{|\\vec{b}_1 \\times \\vec{b}_2|}\\right|$."
        ]
      },
      {
        id: 'snr_m_04',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'LINEAR_PROGRAMMING',
        chapter_number: 12,
        chapter_name: 'Linear Programming (LPP)',
        topic: 'Corner Point Method',
        subtopic: 'Bounded region: Evaluating Z at all corner points for max/min',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 (5-Mark Guaranteed)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 240,
        marks_weightage: 5,
        question_latex: 'Solve the following linear programming problem graphically: Maximize $Z = 4x + y$ subject to the constraints: $$x + y \\leq 50$$ $$3x + y \\leq 90$$ $$x \\geq 0, y \\geq 0$$',
        options_latex: [],
        correct_answer_latex: 'Maximum $Z = 120$ at $(30, 0)$',
        solution_latex: '1. Plot boundary lines $x + y = 50$ (intercepts $(50,0), (0,50)$) and $3x + y = 90$ (intercepts $(30,0), (0,90)$). 2. Testing $(0,0)$ confirms origin lies in both half-planes. 3. Find intersection of boundary lines: $(3x+y) - (x+y) = 90 - 50 \\implies 2x = 40 \\implies x = 20, y = 30$. 4. Feasible corner points are $O(0, 0)$, $A(30, 0)$, $B(20, 30)$, $C(0, 50)$. 5. Evaluate $Z$: $Z(0,0)=0$, $Z(30,0)=4(30)+0=120$, $Z(20,30)=4(20)+30=110$, $Z(0,50)=0+50=50$. Hence, Maximum $Z = 120$ occurs at $(30, 0)$.',
        socratic_hints: [
          "Convert inequalities to equations and find the $x$ and $y$ intercepts.",
          "Shade the region towards the origin since $(0,0)$ satisfies both inequalities.",
          "Find the intersection coordinates of $x + y = 50$ and $3x + y = 90$.",
          "Evaluate $Z$ at each vertex of the polygon."
        ]
      },
      {
        id: 'snr_m_05',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'CALCULUS',
        chapter_number: 6,
        chapter_name: 'Applications of Derivatives (AOD)',
        topic: 'Maxima and Minima',
        subtopic: 'Applied geometric optimization word problems',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 & 2019 (5-Mark / Case-Study)',
        difficulty: 'HARD',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 300,
        marks_weightage: 5,
        question_latex: 'An open box with a square base is to be constructed out of a given quantity of cardboard of area $c^2$. Show that the maximum volume of the box is $\\frac{c^3}{6\\sqrt{3}}$.',
        options_latex: [],
        correct_answer_latex: '$V_{max} = \\frac{c^3}{6\\sqrt{3}}$',
        solution_latex: 'Let length of base be $x$ and height be $h$. Total surface area of open box: $S = x^2 + 4xh = c^2 \\implies h = \\frac{c^2 - x^2}{4x}$. Volume $V = x^2 h = x^2 \\left(\\frac{c^2 - x^2}{4x}\\right) = \\frac{1}{4}(c^2 x - x^3)$. Differentiating with respect to $x$: $\\frac{dV}{dx} = \\frac{1}{4}(c^2 - 3x^2)$. Setting $\\frac{dV}{dx} = 0 \\implies x = \\frac{c}{\\sqrt{3}}$. Second derivative test: $\\frac{d^2V}{dx^2} = -\\frac{6x}{4} < 0$ at $x = \\frac{c}{\\sqrt{3}}$, confirming a maximum. Substituting $x = \\frac{c}{\\sqrt{3}}$: $V_{max} = \\frac{1}{4}\\left(c^2 \\cdot \\frac{c}{\\sqrt{3}} - \\frac{c^3}{3\\sqrt{3}}\\right) = \\frac{1}{4} \\cdot \\frac{2c^3}{3\\sqrt{3}} = \\frac{c^3}{6\\sqrt{3}}$.',
        socratic_hints: [
          "Express the surface area of the open box (bottom + 4 sides) in terms of $x$ and $h$.",
          "Solve for $h$ in terms of $x$ and substitute into $V = x^2 h$.",
          "Differentiate $V$ with respect to $x$ and equate to zero.",
          "Check the second derivative to establish that $V$ is indeed maximized."
        ]
      },
      {
        id: 'snr_m_06',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'PROBABILITY',
        chapter_number: 13,
        chapter_name: 'Probability',
        topic: 'Bayes\' Theorem',
        subtopic: 'Cause-and-effect reversal problems (machine defects, medical diagnostic tests, truth/lie)',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2024 (4-Mark Case-Study)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 240,
        marks_weightage: 4,
        question_latex: 'In a factory, three machines $E_1, E_2, E_3$ produce $50\\%, 30\\%, 20\\%$ of the total output. Of their output, $2\\%, 2\\%, 3\\%$ are defective bolts respectively. A bolt is chosen at random and found to be defective. What is the probability that it was produced by machine $E_2$?',
        options_latex: [],
        correct_answer_latex: '$P(E_2|A) = \\frac{3}{11}$',
        solution_latex: 'Let $A$ be the event that the bolt is defective. Probabilities: $P(E_1) = 0.5, P(E_2) = 0.3, P(E_3) = 0.2$. Conditional probabilities: $P(A|E_1) = 0.02, P(A|E_2) = 0.02, P(A|E_3) = 0.03$. Total probability $P(A) = (0.5)(0.02) + (0.3)(0.02) + (0.2)(0.03) = 0.010 + 0.006 + 0.006 = 0.022$. By Bayes\' Theorem: $$P(E_2|A) = \\frac{P(E_2)P(A|E_2)}{P(A)} = \\frac{0.3 \\times 0.02}{0.022} = \\frac{0.006}{0.022} = \\frac{6}{22} = \\frac{3}{11}$$.',
        socratic_hints: [
          "Define the partition events $E_1, E_2, E_3$ and the observed event $A$ (defective bolt).",
          "Compute the total probability $P(A) = \\sum P(E_i)P(A|E_i)$.",
          "Apply Bayes Theorem formula for $P(E_2|A)$."
        ]
      },
      {
        id: 'snr_m_07',
        grade: '12',
        stream: 'NON_MEDICAL',
        target_exam: 'CBSE_CLASS_12',
        subject: 'Mathematics',
        math_branch: 'RELATIONS_FUNCTIONS',
        chapter_number: 1,
        chapter_name: 'Relations and Functions',
        topic: 'Types of Relations',
        subtopic: 'Equivalence Relations & Equivalence Classes [a]',
        curriculum_board: 'CBSE_BOARD',
        pyq_appearance: 'CBSE Class 12 Board 2023 (3-Mark Standard)',
        difficulty: 'MEDIUM',
        question_format: 'SUBJECTIVE_LONG',
        benchmark_time_seconds: 180,
        marks_weightage: 3,
        question_latex: 'Let $\\mathbb{Z}$ be the set of all integers and $R$ be the relation on $\\mathbb{Z} \\times \\mathbb{Z}$ defined by $((a, b), (c, d)) \\in R \\iff a + d = b + c$. Prove that $R$ is an equivalence relation.',
        options_latex: [],
        correct_answer_latex: 'Equivalence relation proven (Reflexive, Symmetric, Transitive)',
        solution_latex: '1. Reflexivity: For all $(a, b) \\in \\mathbb{Z} \\times \\mathbb{Z}$, $a + b = b + a \\implies ((a, b), (a, b)) \\in R$. Hence $R$ is reflexive. 2. Symmetry: Let $((a, b), (c, d)) \\in R \\implies a + d = b + c \\implies c + b = d + a \\implies c + b = a + d \\implies ((c, d), (a, b)) \\in R$. Hence $R$ is symmetric. 3. Transitivity: Let $((a, b), (c, d)) \\in R$ and $((c, d), (e, f)) \\in R$. Then $a + d = b + c$ and $c + f = d + e$. Adding the two equations: $(a + d) + (c + f) = (b + c) + (d + e) \\implies a + f = b + e \\implies ((a, b), (e, f)) \\in R$. Hence $R$ is transitive. Since $R$ is reflexive, symmetric, and transitive, it is an equivalence relation.',
        socratic_hints: [
          "Check reflexivity by substituting $(c, d) = (a, b)$. Does $a + b = b + a$ hold?",
          "Check symmetry: Does $a + d = b + c$ imply $c + b = d + a$?",
          "For transitivity, add the two equations $a + d = b + c$ and $c + f = d + e$ together and cancel common terms."
        ]
      }
    ]
  },
  questions: [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      topic: 'Rotational Motion',
      subtopic: 'Moment of Inertia',
      curriculum_board: 'JEE_MAIN',
      grade: '11',
      question_type: 'MCQ_SINGLE',
      difficulty: 'MEDIUM',
      question_latex: 'A solid uniform cylinder of mass $M$ and radius $R$ is free to rotate about its geometric axis. A light string is wound around its circumference and pulled with a constant tension $T$. Find the angular acceleration $\\alpha$ of the cylinder.',
      options_latex: [
        { key: 'A', latex: '$\\alpha = \\frac{T}{MR}$', is_correct: false, distractor_trap: 'Treated cylinder as hollow thin shell ($I=MR^2$)' },
        { key: 'B', latex: '$\\alpha = \\frac{2T}{MR}$', is_correct: true, distractor_trap: null },
        { key: 'C', latex: '$\\alpha = \\frac{T}{2MR}$', is_correct: false, distractor_trap: 'Multiplied instead of dividing by moment of inertia constant' },
        { key: 'D', latex: '$\\alpha = \\frac{4T}{MR}$', is_correct: false, distractor_trap: 'Calculation error in radius factor' }
      ],
      correct_answer_latex: 'B',
      solution_latex: 'Torque about central axis is $\\tau = T \\cdot R$. Moment of inertia for solid cylinder is $I = \\frac{1}{2} M R^2$. Since $\\tau = I\\alpha \\implies TR = (\\frac{1}{2}MR^2)\\alpha \\implies \\alpha = \\frac{2T}{MR}$.',
      socratic_hints: [
        "What is the torque produced by tension $T$ acting at radius $R$?",
        "What is the moment of inertia $I$ of a solid cylinder?",
        "Equate torque $\\tau = I\\alpha$ to solve for angular acceleration."
      ],
      benchmark_time_seconds: 90
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      topic: 'Work, Energy and Power',
      subtopic: 'Work-Energy Theorem',
      curriculum_board: 'CBSE',
      grade: '11',
      question_type: 'NUMERICAL',
      difficulty: 'MEDIUM',
      question_latex: 'A variable force $F(x) = (3x^2 - 2x + 5)\\,\\text{N}$ acts on a particle of mass $m = 2\\,\\text{kg}$ moving along the $x$-axis. Calculate the net work done by this force in moving the particle from $x = 1\\,\\text{m}$ to $x = 3\\,\\text{m}$.',
      options_latex: [],
      correct_answer_latex: '28 J',
      solution_latex: '$$W = \\int_{1}^{3} (3x^2 - 2x + 5)\\,dx = \\left[ x^3 - x^2 + 5x \\right]_1^3 = (27 - 9 + 15) - (1 - 1 + 5) = 33 - 5 = 28\\,\\text{J}$$',
      socratic_hints: [
        "Recall that work done by a variable force is $W = \\int F(x) dx$.",
        "Integrate each polynomial term separately.",
        "Subtract the lower limit value from the upper limit value."
      ],
      benchmark_time_seconds: 120
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      topic: 'Oscillations & SHM',
      subtopic: 'Damped Oscillations',
      curriculum_board: 'JEE_ADVANCED',
      grade: '11',
      question_type: 'MCQ_SINGLE',
      difficulty: 'HARD',
      question_latex: 'An oscillator of mass $m$ undergoes damped harmonic oscillations with damping coefficient $b$. If the mechanical energy of the oscillator decays to $\\frac{1}{e}$ of its initial value in time $t_0$, what is $t_0$?',
      options_latex: [
        { key: 'A', latex: '$t_0 = \\frac{m}{b}$', is_correct: true, distractor_trap: null },
        { key: 'B', latex: '$t_0 = \\frac{2m}{b}$', is_correct: false, distractor_trap: 'Confused amplitude decay time with total energy decay time' },
        { key: 'C', latex: '$t_0 = \\frac{m}{2b}$', is_correct: false, distractor_trap: 'Inverted damping factor coefficient' },
        { key: 'D', latex: '$t_0 = \\frac{b}{m}$', is_correct: false, distractor_trap: 'Dimensional mismatch' }
      ],
      correct_answer_latex: 'A',
      solution_latex: 'Mechanical energy decays as $E(t) = E_0 e^{-\\frac{b}{m}t}$. Setting $E(t_0) = E_0 e^{-1} \\implies \\frac{b}{m}t_0 = 1 \\implies t_0 = \\frac{m}{b}$.',
      socratic_hints: [
        "How is energy related to amplitude in simple harmonic motion?",
        "Recall that $E \\propto A^2$. If $A(t) = A_0 e^{-bt/(2m)}$, what is $E(t)$?",
        "Equate the power of the exponential to $-1$."
      ],
      benchmark_time_seconds: 180
    }
  ],
  telemetry: [],
  conceptMastery: [
    { student_id: 'b0000000-0000-0000-0000-000000000001', topic: 'Rotational Motion', subtopic: 'Moment of Inertia', mastery_status: 'MASTERED', mastery_score: 92.5, accuracy: 95.0, avg_time_sec: 54, attempts: 18 },
    { student_id: 'b0000000-0000-0000-0000-000000000001', topic: 'Work, Energy & Power', subtopic: 'Work-Energy Theorem', mastery_status: 'NEEDS_RECAP', mastery_score: 68.0, accuracy: 75.0, avg_time_sec: 185, attempts: 12 },
    { student_id: 'b0000000-0000-0000-0000-000000000001', topic: 'Oscillations', subtopic: 'Damped Oscillations', mastery_status: 'CRITICAL_WEAKNESS', mastery_score: 34.0, accuracy: 30.0, avg_time_sec: 220, attempts: 8 }
  ],
  handwrittenSubmissions: [
    {
      id: '10000000-0000-0000-0000-000000000001',
      student_id: 'b0000000-0000-0000-0000-000000000001',
      student_name: 'Aryan Sharma',
      question_id: 'c0000000-0000-0000-0000-000000000002',
      sheet_image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      ocr_transcription_latex: 'Step 1: $W = \\int_{1}^{3} (3x^2 - 2x + 5) dx$\nStep 2: $[x^3 - x^2 + 5x]_{1}^{3}$\nStep 3: $(27 - 9 + 15) - (1 - 1 + 5) = 33 - 5 = 28\\text{ Joules}$',
      step_evaluations: [
        { step: 1, description: 'Formulation of Definite Integral', formula_latex: 'W = \\int_{1}^{3} F(x) dx', marks_awarded: 1.0, max_marks: 1.0, status: 'CORRECT' },
        { step: 2, description: 'Correct Antiderivative Polynomial', formula_latex: '[x^3 - x^2 + 5x]_{1}^{3}', marks_awarded: 1.5, max_marks: 1.5, status: 'CORRECT' },
        { step: 3, description: 'Boundary Arithmetic & SI Units', formula_latex: '33 - 5 = 28\\text{ J}', marks_awarded: 1.5, max_marks: 1.5, status: 'CORRECT' }
      ],
      total_marks_awarded: 4.0,
      max_marks: 4.0,
      error_type: 'NONE',
      ai_confidence_score: 0.98,
      teacher_verified: true,
      teacher_comments: 'Clear presentation. Integral bounds clearly indicated.'
    }
  ],
  weeklyReports: [
    {
      id: '20000000-0000-0000-0000-000000000001',
      student_id: 'b0000000-0000-0000-0000-000000000001',
      student_name: 'Aryan Sharma',
      week_range: '18 Oct 2026 - 24 Oct 2026',
      overall_score_percentage: 76.5,
      total_study_hours: 14.5,
      questions_attempted: 64,
      average_velocity_seconds: 115,
      mastered_concepts: [
        { topic: 'Rotational Motion', subtopic: 'Moment of Inertia', accuracy: 92, status: 'MASTERED' }
      ],
      recap_concepts: [
        { topic: 'Work-Energy', subtopic: 'Work-Energy Theorem', accuracy: 75, status: 'NEEDS_RECAP', reason: 'Takes 180s vs 120s benchmark; extra algebraic hesitation.' }
      ],
      weak_concepts: [
        { topic: 'Oscillations', subtopic: 'Damped Oscillations', accuracy: 30, status: 'CRITICAL_WEAKNESS', reason: 'Confusing energy decay constant (b/m) with amplitude (b/2m).' }
      ],
      school_hostel_actions: [
        { directive: 'Conduct a 15-minute 1-on-1 derivation during 7:30 PM residential evening study on damped oscillation equations.', faculty: 'Er. Rajesh Kumar', priority: 'HIGH' },
        { directive: 'Assign Targeted Practice Drill #SHM-04 (5 numericals with frictional damping).', faculty: 'Physics Dept', priority: 'MEDIUM' }
      ],
      parent_actions: [
        { directive: 'Ask Aryan to explain the principle of car shock absorbers (Feynman technique) for 5 minutes during your Sunday phone call.', purpose: 'Solidifies intuitive physical grasp.' },
        { directive: 'Ensure 45 minutes of quiet study on Sunday morning for the short recap quiz.', purpose: 'Reinforces retention before Monday classes.' }
      ]
    }
  ],
  assessments: [
    {
      id: 'asgn_10_sci_01',
      title: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
      description: 'CBSE & HP Board standard diagnostic assessment covering mirror formula, sign conventions, and image formation.',
      teacherName: 'Er. Rajesh Kumar',
      grade: '10',
      section: 'Science-A',
      board: 'CBSE',
      subject: 'Science',
      durationMinutes: 30,
      totalMarks: 12,
      questions: [
        {
          id: 'q_asgn_01',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Spherical Mirrors',
          grade: '10',
          board: 'CBSE',
          question_type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 90,
          question_latex: 'An object is placed at a distance of $30\\,\\text{cm}$ in front of a concave mirror of focal length $15\\,\\text{cm}$. The distance of the image from the mirror is:',
          options_latex: [
            { key: 'A', latex: '$v = -15\\,\\text{cm}$', is_correct: false, distractor_trap: 'Substituted focal length as image distance' },
            { key: 'B', latex: '$v = -30\\,\\text{cm}$', is_correct: true, distractor_trap: null },
            { key: 'C', latex: '$v = +30\\,\\text{cm}$', is_correct: false, distractor_trap: 'Sign convention error: took real image as positive' },
            { key: 'D', latex: '$v = -60\\,\\text{cm}$', is_correct: false, distractor_trap: 'Multiplied denominator factor incorrectly' }
          ],
          correct_answer: 'B',
          solution_latex: 'For a concave mirror, $f = -15\\,\\text{cm}$ and $u = -30\\,\\text{cm}$. Using mirror formula: $$\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u} \\implies \\frac{1}{v} = \\frac{1}{-15} - \\frac{1}{-30} = -\\frac{1}{30} \\implies v = -30\\,\\text{cm}$$',
          socratic_hints: [
            "Write the mirror formula $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$.",
            "Apply the New Cartesian sign convention: both $f$ and $u$ are negative for a concave mirror.",
            "Solve for $v$ by isolating $\\frac{1}{v}$."
          ]
        },
        {
          id: 'q_asgn_02',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Refraction & Snell Law',
          grade: '10',
          board: 'CBSE',
          question_type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 75,
          question_latex: 'Light enters from air into water of refractive index $n = \\frac{4}{3}$. What is the speed of light in water if the speed of light in vacuum is $c = 3.0 \\times 10^8\\,\\text{m/s}$?',
          options_latex: [
            { key: 'A', latex: '$v = 2.25 \\times 10^8\\,\\text{m/s}$', is_correct: true, distractor_trap: null },
            { key: 'B', latex: '$v = 4.0 \\times 10^8\\,\\text{m/s}$', is_correct: false, distractor_trap: 'Multiplied by refractive index instead of dividing' },
            { key: 'C', latex: '$v = 1.5 \\times 10^8\\,\\text{m/s}$', is_correct: false, distractor_trap: 'Used glass refractive index (1.5) instead of water (1.33)' },
            { key: 'D', latex: '$v = 2.0 \\times 10^8\\,\\text{m/s}$', is_correct: false, distractor_trap: 'Calculation error in fraction inversion' }
          ],
          correct_answer: 'A',
          solution_latex: 'Refractive index is defined as $n = \\frac{c}{v}$. Therefore, $$v = \\frac{c}{n} = \\frac{3.0 \\times 10^8}{4/3} = 3.0 \\times 10^8 \\times \\frac{3}{4} = 2.25 \\times 10^8\\,\\text{m/s}$$',
          socratic_hints: [
            "What is the definition of absolute refractive index $n$ in terms of speeds of light?",
            "Use $n = \\frac{c}{v}$ where $c$ is speed in vacuum and $v$ is speed in the medium.",
            "Substitute $n = \\frac{4}{3}$ and calculate."
          ]
        },
        {
          id: 'q_asgn_03',
          topic: 'Electricity',
          subtopic: 'Joule Heating & Resistance',
          grade: '10',
          board: 'CBSE',
          question_type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 90,
          question_latex: 'An electric heater of resistance $R = 50\\,\\Omega$ is connected to a $220\\,\\text{V}$ line for $2\\,\\text{hours}$. Calculate the heat energy produced in joules.',
          options_latex: [
            { key: 'A', latex: '$H = 6.97 \\times 10^6\\,\\text{J}$', is_correct: true, distractor_trap: null },
            { key: 'B', latex: '$H = 1.94 \\times 10^3\\,\\text{J}$', is_correct: false, distractor_trap: 'Forgot to convert hours to seconds ($3600\\,\\text{s}$)' },
            { key: 'C', latex: '$H = 3.48 \\times 10^6\\,\\text{J}$', is_correct: false, distractor_trap: 'Used 1 hour instead of 2 hours' },
            { key: 'D', latex: '$H = 1.39 \\times 10^7\\,\\text{J}$', is_correct: false, distractor_trap: 'Doubled the power formula factor' }
          ],
          correct_answer: 'A',
          solution_latex: 'Power is $P = \\frac{V^2}{R} = \\frac{(220)^2}{50} = \\frac{48400}{50} = 968\\,\\text{W}$. Time is $t = 2 \\times 3600 = 7200\\,\\text{s}$. Total heat energy: $$H = P \\times t = 968 \\times 7200 = 6.9696 \\times 10^6\\,\\text{J} \\approx 6.97 \\times 10^6\\,\\text{J}$$',
          socratic_hints: [
            "Calculate power dissipated using $P = \\frac{V^2}{R}$.",
            "Convert time from hours to seconds: $2\\,\\text{h} = 2 \\times 3600\\,\\text{s}$.",
            "Calculate heat energy $H = P \\times t$."
          ]
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'asgn_11_bio_01',
      title: 'Class 11 Medical Biology: Cell Biology & Biomolecules - NEET Diagnostic Test',
      description: 'NEET UG and CBSE Board diagnostic assessment covering Cell Theory, Organelles, and Enzyme Kinetics.',
      teacherName: 'Dr. Ananya Mukherjee',
      grade: '11',
      section: '11-Med',
      board: 'NEET',
      subject: 'Biology',
      subjectKey: 'BIOLOGY',
      durationMinutes: 20,
      totalMarks: 16,
      questions: [
        {
          id: 'q_bio_01',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Mitochondria & Chloroplast Semi-Autonomy',
          grade: '11',
          board: 'NEET',
          subject: 'Biology',
          subjectKey: 'BIOLOGY',
          question_type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 45,
          question_latex: 'Which of the following cellular organelles is semi-autonomous and possesses its own circular dsDNA and $70\\text{S}$ ribosomes?',
          options_latex: [
            { key: 'A', latex: 'Mitochondria', is_correct: true, distractor_trap: null },
            { key: 'B', latex: 'Golgi Apparatus', is_correct: false, distractor_trap: 'Golgi lacks autonomous DNA and protein translation apparatus.' },
            { key: 'C', latex: 'Lysosome', is_correct: false, distractor_trap: 'Lysosomes are single-membrane hydrolytic vesicles.' },
            { key: 'D', latex: 'Endoplasmic Reticulum', is_correct: false, distractor_trap: 'Lacks circular extranuclear genome.' }
          ],
          correct_answer: 'A',
          solution_latex: 'Mitochondria and chloroplasts are semi-autonomous organelles originating from endosymbiotic prokaryotes. They possess their own circular double-stranded DNA, RNA molecules, and $70\\text{S}$ ribosomes.',
          socratic_hints: [
            "Consider the endosymbiotic theory of eukaryotic organelle origin.",
            "Recall which organelles synthesize a fraction of their own respiratory enzymes."
          ]
        },
        {
          id: 'q_bio_02',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Fluid Mosaic Model & Membrane Dynamics',
          grade: '11',
          board: 'NEET',
          subject: 'Biology',
          subjectKey: 'BIOLOGY',
          question_type: 'MCQ_SINGLE',
          difficulty: 'EASY',
          benchmark_time_seconds: 40,
          question_latex: 'In the fluid mosaic model proposed by Singer and Nicolson, the quasi-fluid nature of lipids enables lateral movement of proteins within the overall bilayer. This ability to move within the membrane is measured as its:',
          options_latex: [
            { key: 'A', latex: 'Fluidity', is_correct: true, distractor_trap: null },
            { key: 'B', latex: 'Permeability', is_correct: false, distractor_trap: 'Permeability describes solute transit across the bilayer, not lateral protein mobility.' },
            { key: 'C', latex: 'Elasticity', is_correct: false, distractor_trap: 'Elasticity refers to mechanical deformation resistance.' },
            { key: 'D', latex: 'Viscosity', is_correct: false, distractor_trap: 'Viscosity is resistance to shear, inversely proportional to fluidity.' }
          ],
          correct_answer: 'A',
          solution_latex: 'According to NCERT Chapter 8, the quasi-fluid nature of lipid enables lateral movement of proteins within the overall bilayer. This ability to move within the membrane is measured as its fluidity.',
          socratic_hints: [
            "What term is directly used in NCERT for the ease of lateral motion in biological membranes?",
            "Singer and Nicolson emphasized the quasi-fluid dynamic state of the lipid bilayer."
          ]
        },
        {
          id: 'q_bio_03',
          topic: 'Cell Cycle and Cell Division',
          subtopic: 'Meiotic Prophase I & Crossing Over',
          grade: '11',
          board: 'NEET',
          subject: 'Biology',
          subjectKey: 'BIOLOGY',
          question_type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 50,
          question_latex: 'During which specific substage of prophase I in meiosis does crossing over between non-sister chromatids of homologous chromosomes take place via recombinase?',
          options_latex: [
            { key: 'A', latex: 'Pachytene', is_correct: true, distractor_trap: null },
            { key: 'B', latex: 'Zygotene', is_correct: false, distractor_trap: 'Zygotene is characterized by synapsis and synaptonemal complex assembly.' },
            { key: 'C', latex: 'Diplotene', is_correct: false, distractor_trap: 'Diplotene is dissolution of synaptonemal complex and chiasmata visibility.' },
            { key: 'D', latex: 'Leptotene', is_correct: false, distractor_trap: 'Leptotene features chromatin compaction into visible threads.' }
          ],
          correct_answer: 'A',
          solution_latex: 'Crossing over is an enzyme-mediated process catalyzed by recombinase, occurring specifically in Pachytene stage between non-sister chromatids of homologous chromosomes.',
          socratic_hints: [
            "Synapsis occurs in zygotene; what follows immediately?",
            "Recombination nodules appear and cross-over takes place during pachytene."
          ]
        },
        {
          id: 'q_bio_04',
          topic: 'Biomolecules',
          subtopic: 'Enzyme Kinetics & Competitive Inhibition',
          grade: '11',
          board: 'NEET',
          subject: 'Biology',
          subjectKey: 'BIOLOGY',
          question_type: 'MCQ_SINGLE',
          difficulty: 'HARD',
          benchmark_time_seconds: 60,
          question_latex: 'Competitive inhibitors of enzymes resemble the substrate in chemical structure and compete for the catalytic active site. Which molecule serves as the classic competitive inhibitor of succinate dehydrogenase?',
          options_latex: [
            { key: 'A', latex: 'Malonate', is_correct: true, distractor_trap: null },
            { key: 'B', latex: 'Oxaloacetate', is_correct: false, distractor_trap: 'Oxaloacetate is an intermediate in Krebs cycle, not the classic inhibitor textbook example.' },
            { key: 'C', latex: 'Malate', is_correct: false, distractor_trap: 'Malate is hydrated fumarate product.' },
            { key: 'D', latex: 'Citrate', is_correct: false, distractor_trap: 'Citrate is an allosteric regulator of phosphofructokinase.' }
          ],
          correct_answer: 'A',
          solution_latex: 'Malonate closely resembles succinate in chemical structure and inhibits succinate dehydrogenase competitively, leading to an increase in Km with unchanged Vmax.',
          socratic_hints: [
            "Which dicarboxylic acid competitor closely resembles succinic acid?",
            "Recall the classic competitive inhibition example in NCERT Biomolecules chapter."
          ]
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'asgn_12_phy_01',
      title: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      description: 'JEE Main and CBSE Board diagnostic assessment covering Coulombs Law, Gauss Law, and Electric Dipoles.',
      teacherName: 'Dr. Vikram Sharma',
      grade: '12',
      section: '12-NonMed',
      board: 'JEE_MAIN',
      subject: 'Physics',
      subjectKey: 'PHYSICS',
      durationMinutes: 25,
      totalMarks: 16,
      questions: [
        {
          id: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          grade: '12',
          board: 'JEE_MAIN',
          subject: 'Physics',
          subjectKey: 'PHYSICS',
          question_type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 75,
          question_latex: 'A point charge $q$ is placed at the center of an imaginary cube of edge length $a$. The electric flux emerging through one face of the cube is:',
          options_latex: [
            { key: 'A', latex: '$\\Phi = \\frac{q}{6\\varepsilon_0}$', is_correct: true, distractor_trap: null },
            { key: 'B', latex: '$\\Phi = \\frac{q}{\\varepsilon_0}$', is_correct: false, distractor_trap: 'Gave total flux through all 6 faces instead of one face.' },
            { key: 'C', latex: '$\\Phi = \\frac{q}{24\\varepsilon_0}$', is_correct: false, distractor_trap: 'Confused with charge placed at corner.' },
            { key: 'D', latex: '$\\Phi = 0$', is_correct: false, distractor_trap: 'Zero flux only applies if net enclosed charge is zero.' }
          ],
          correct_answer: 'A',
          solution_latex: 'By Gauss Law, total flux through the closed cube is $\\Phi_{\\text{total}} = \\frac{q}{\\varepsilon_0}$. By cubic symmetry, each of the 6 identical faces receives an equal share: $\\Phi_{\\text{face}} = \\frac{q}{6\\varepsilon_0}$.',
          socratic_hints: [
            "What is the total electric flux through the entire closed Gaussian cube?",
            "Divide by the number of symmetrical square faces."
          ]
        },
        {
          id: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          grade: '12',
          board: 'JEE_MAIN',
          subject: 'Physics',
          subjectKey: 'PHYSICS',
          question_type: 'MCQ_SINGLE',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 60,
          question_latex: 'An electric dipole of dipole moment $\\vec{p}$ is placed in a uniform electric field $\\vec{E}$. The torque $\\vec{\\tau}$ acting on the dipole and its potential energy $U$ are given by:',
          options_latex: [
            { key: 'A', latex: '$\\vec{\\tau} = \\vec{p} \\times \\vec{E}, \\quad U = -\\vec{p} \\cdot \\vec{E}$', is_correct: true, distractor_trap: null },
            { key: 'B', latex: '$\\vec{\\tau} = \\vec{p} \\cdot \\vec{E}, \\quad U = \\vec{p} \\times \\vec{E}$', is_correct: false, distractor_trap: 'Swapped vector cross product and scalar dot product.' },
            { key: 'C', latex: '$\\vec{\\tau} = \\vec{E} \\times \\vec{p}, \\quad U = -\\vec{p} \\cdot \\vec{E}$', is_correct: false, distractor_trap: 'Reversed cross product vector order.' },
            { key: 'D', latex: '$\\vec{\\tau} = \\vec{p} \\times \\vec{E}, \\quad U = \\vec{p} \\cdot \\vec{E}$', is_correct: false, distractor_trap: 'Omitted negative sign in potential energy.' }
          ],
          correct_answer: 'A',
          solution_latex: 'The torque on a dipole in a uniform electric field is $\\vec{\\tau} = \\vec{p} \\times \\vec{E}$, and its electrostatic potential energy is $U = -\\vec{p} \\cdot \\vec{E} = -pE\\cos\\theta$.',
          socratic_hints: [
            "Recall whether torque is a vector cross product or a scalar dot product.",
            "Remember that dipole is in stable equilibrium at theta = 0 where potential energy is minimum (-pE)."
          ]
        },
        {
          id: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          grade: '12',
          board: 'JEE_MAIN',
          subject: 'Physics',
          subjectKey: 'PHYSICS',
          question_type: 'MCQ_SINGLE',
          difficulty: 'HARD',
          benchmark_time_seconds: 90,
          question_latex: 'For a short electric dipole, what is the ratio of electric field intensity at a distance $r$ on the axial line to that at the same distance $r$ on the equatorial line ($E_{\\text{axial}} : E_{\\text{equatorial}}$)?',
          options_latex: [
            { key: 'A', latex: '$2 : 1$', is_correct: true, distractor_trap: null },
            { key: 'B', latex: '$1 : 2$', is_correct: false, distractor_trap: 'Inverted axial and equatorial formulas.' },
            { key: 'C', latex: '$4 : 1$', is_correct: false, distractor_trap: 'Squared the factor of 2.' },
            { key: 'D', latex: '$1 : 1$', is_correct: false, distractor_trap: 'Assumed spherical symmetry like point charge.' }
          ],
          correct_answer: 'A',
          solution_latex: 'For a short dipole ($r \\gg 2a$), $E_{\\text{axial}} = \\frac{2kp}{r^3}$ and $E_{\\text{equatorial}} = \\frac{kp}{r^3}$. Hence, the ratio is $E_{\\text{axial}} : E_{\\text{equatorial}} = 2 : 1$.',
          socratic_hints: [
            "Write the formulas for E_axial and E_equatorial for a short dipole.",
            "Compare the numerical prefactors while holding distance r constant."
          ]
        },
        {
          id: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          grade: '12',
          board: 'JEE_MAIN',
          subject: 'Physics',
          subjectKey: 'PHYSICS',
          question_type: 'MCQ_SINGLE',
          difficulty: 'HARD',
          benchmark_time_seconds: 90,
          question_latex: 'A parallel plate capacitor of capacitance $C_0$ is charged to potential $V_0$ and then disconnected from the battery. A dielectric slab of dielectric constant $K = 4$ is now inserted to completely fill the space between the plates. The new electrostatic energy stored in the capacitor is:',
          options_latex: [
            { key: 'A', latex: '$U = \\frac{U_0}{4}$', is_correct: true, distractor_trap: null },
            { key: 'B', latex: '$U = 4U_0$', is_correct: false, distractor_trap: 'Assumed battery remained connected (V constant instead of Q constant).' },
            { key: 'C', latex: '$U = 16U_0$', is_correct: false, distractor_trap: 'Applied squared factor with incorrect formula.' },
            { key: 'D', latex: '$U = U_0$', is_correct: false, distractor_trap: 'Assumed energy is conserved.' }
          ],
          correct_answer: 'A',
          solution_latex: 'Since the battery is disconnected, charge $Q$ remains constant ($Q = Q_0$). The capacitance increases to $C = KC_0 = 4C_0$. Stored energy $U = \\frac{Q^2}{2C} = \\frac{Q_0^2}{2(4C_0)} = \\frac{U_0}{4}$.',
          socratic_hints: [
            "When the battery is disconnected, which quantity remains constant: charge Q or voltage V?",
            "Use the energy formula in terms of constant Q: U = Q^2 / (2C)."
          ]
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'asgn_10_math_01',
      title: 'Class 10th Mathematics: Real Numbers & Polynomials Diagnostic Assessment',
      description: 'CBSE & HP Board standard diagnostic covering Fundamental Theorem of Arithmetic, Euclid division algorithm, and zeroes of quadratic polynomials.',
      teacherName: 'Mrs. Meenakshi Sharma',
      grade: '10',
      section: '10-Science-A',
      board: 'CBSE',
      subject: 'Mathematics',
      subjectKey: 'CLASS10_MATHEMATICS',
      durationMinutes: 25,
      totalMarks: 16,
      questions: [
        {
          id: 'c10_m_pyq_001',
          topic: 'Real Numbers',
          subtopic: "Euclid's Division Algorithm",
          grade: '10',
          board: 'CBSE',
          question_type: 'SHORT_ANSWER',
          difficulty: 'EASY',
          benchmark_time_seconds: 90,
          question_latex: 'Find the HCF of 135 and 225 using Euclid’s Division Algorithm.',
          options_latex: [
            { key: 'A', latex: '45', is_correct: true },
            { key: 'B', latex: '15', is_correct: false },
            { key: 'C', latex: '90', is_correct: false },
            { key: 'D', latex: '5', is_correct: false }
          ],
          correct_answer: 'A',
          solution_latex: 'By Euclid division lemma: $225 = 135 \\times 1 + 90$; $135 = 90 \\times 1 + 45$; $90 = 45 \\times 2 + 0$. Remainder is 0, divisor is 45. Hence $\\text{HCF}(135, 225) = 45$.',
          socratic_hints: [
            "Write the dividend in terms of divisor and remainder: $a = bq + r$.",
            "Repeat the division until remainder is 0.",
            "The divisor at the final step is the required HCF."
          ]
        },
        {
          id: 'c10_m_pyq_002',
          topic: 'Real Numbers',
          subtopic: 'Fundamental Theorem of Arithmetic',
          grade: '10',
          board: 'CBSE',
          question_type: 'SHORT_ANSWER',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 90,
          question_latex: 'Given that $\\text{HCF}(306, 657) = 9$, find $\\text{LCM}(306, 657)$.',
          options_latex: [
            { key: 'A', latex: '22338', is_correct: true },
            { key: 'B', latex: '22383', is_correct: false },
            { key: 'C', latex: '23238', is_correct: false },
            { key: 'D', latex: '21338', is_correct: false }
          ],
          correct_answer: 'A',
          solution_latex: 'Use relation $\\text{LCM}(a, b) = \\frac{a \\times b}{\\text{HCF}(a, b)} = \\frac{306 \\times 657}{9} = 34 \\times 657 = 22338$.',
          socratic_hints: [
            "Recall: $\\text{HCF}(a, b) \\times \\text{LCM}(a, b) = a \\times b$.",
            "Substitute $a = 306, b = 657$ and $\\text{HCF} = 9$."
          ]
        },
        {
          id: 'c10_m_pyq_050',
          topic: 'Polynomials',
          subtopic: 'Zeroes and Coefficients Relationship',
          grade: '10',
          board: 'CBSE',
          question_type: 'SHORT_ANSWER',
          difficulty: 'MEDIUM',
          benchmark_time_seconds: 90,
          question_latex: 'Find the zeroes of the quadratic polynomial $x^2 + 7x + 10$ and verify the relationship between zeroes and coefficients.',
          options_latex: [
            { key: 'A', latex: '$-2$ and $-5$', is_correct: true },
            { key: 'B', latex: '$2$ and $5$', is_correct: false },
            { key: 'C', latex: '$-2$ and $5$', is_correct: false },
            { key: 'D', latex: '$2$ and $-5$', is_correct: false }
          ],
          correct_answer: 'A',
          solution_latex: 'Factorize: $x^2 + 7x + 10 = (x + 2)(x + 5) = 0 \\implies x = -2, -5$. Sum $= -7 = -b/a$; Product $= 10 = c/a$.',
          socratic_hints: [
            "Find two numbers whose product is 10 and sum is 7.",
            "Compare zeroes with $-b/a$ and $c/a$."
          ]
        },
        {
          id: 'c10_m_pyq_051',
          topic: 'Polynomials',
          subtopic: 'Quadratic Polynomial Formation',
          grade: '10',
          board: 'CBSE',
          question_type: 'SHORT_ANSWER',
          difficulty: 'HARD',
          benchmark_time_seconds: 120,
          question_latex: 'Find a quadratic polynomial whose sum and product of zeroes are $\\frac{1}{4}$ and $-1$ respectively.',
          options_latex: [
            { key: 'A', latex: '$4x^2 - x - 4$', is_correct: true },
            { key: 'B', latex: '$4x^2 + x - 4$', is_correct: false },
            { key: 'C', latex: '$x^2 - 4x - 1$', is_correct: false },
            { key: 'D', latex: '$4x^2 - x + 4$', is_correct: false }
          ],
          correct_answer: 'A',
          solution_latex: 'General formula: $P(x) = k[x^2 - (\\alpha + \\beta)x + \\alpha\\beta] = k[x^2 - \\frac{1}{4}x - 1]$. For $k = 4$, $P(x) = 4x^2 - x - 4$.',
          socratic_hints: [
            "Use the standard equation $k[x^2 - S x + P]$.",
            "Substitute $S = \\frac{1}{4}$ and $P = -1$, clear denominators."
          ]
        }
      ],
      createdAt: new Date().toISOString()
    }
  ],
  submissions: [
    {
      submissionId: 'sub_10_math_01_aditya',
      assessmentId: 'asgn_10_math_01',
      assessmentTitle: 'Class 10th Mathematics: Real Numbers & Polynomials Diagnostic Assessment',
      studentId: 'b0000000-0000-0000-0000-000000000022',
      studentName: 'Aditya Chauhan',
      rollNumber: '10-A-02',
      grade: '10',
      section: '10-Science-A',
      totalScore: 16,
      totalMarks: 16,
      percentage: 100,
      totalTimeSpentSeconds: 195,
      smartCardSummary: 'Mastered all concepts with sub-benchmark speeds. Flawless algebraic factorization and polynomial operations.',
      questionBreakdown: [
        { questionIndex: 1, questionId: 'c10_m_pyq_001', topic: 'Real Numbers', subtopic: "Euclid's Division Algorithm", timeSpentSeconds: 40, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate Euclidean division steps.' } },
        { questionIndex: 2, questionId: 'c10_m_pyq_002', topic: 'Real Numbers', subtopic: 'Fundamental Theorem of Arithmetic', timeSpentSeconds: 45, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct LCM product substitution.' } },
        { questionIndex: 3, questionId: 'c10_m_pyq_050', topic: 'Polynomials', subtopic: 'Zeroes and Coefficients Relationship', timeSpentSeconds: 50, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate quadratic zeroes factorization.' } },
        { questionIndex: 4, questionId: 'c10_m_pyq_051', topic: 'Polynomials', subtopic: 'Quadratic Polynomial Formation', timeSpentSeconds: 60, benchmarkSeconds: 120, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correctly formed quadratic equation.' } }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      submissionId: 'sub_10_math_01_tanvi',
      assessmentId: 'asgn_10_math_01',
      assessmentTitle: 'Class 10th Mathematics: Real Numbers & Polynomials Diagnostic Assessment',
      studentId: 'b0000000-0000-0000-0000-000000000023',
      studentName: 'Tanvi Sood',
      rollNumber: '10-A-03',
      grade: '10',
      section: '10-Science-A',
      totalScore: 12,
      totalMarks: 16,
      percentage: 75,
      totalTimeSpentSeconds: 220,
      smartCardSummary: 'High proficiency on Real Numbers. Minor algebraic slip while clearing denominators in quadratic formation.',
      questionBreakdown: [
        { questionIndex: 1, questionId: 'c10_m_pyq_001', topic: 'Real Numbers', subtopic: "Euclid's Division Algorithm", timeSpentSeconds: 45, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate lemma.' } },
        { questionIndex: 2, questionId: 'c10_m_pyq_002', topic: 'Real Numbers', subtopic: 'Fundamental Theorem of Arithmetic', timeSpentSeconds: 50, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate LCM calculation.' } },
        { questionIndex: 3, questionId: 'c10_m_pyq_050', topic: 'Polynomials', subtopic: 'Zeroes and Coefficients Relationship', timeSpentSeconds: 55, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct zeroes.' } },
        { questionIndex: 4, questionId: 'c10_m_pyq_051', topic: 'Polynomials', subtopic: 'Quadratic Polynomial Formation', timeSpentSeconds: 70, benchmarkSeconds: 120, isCorrect: false, selectedOption: 'B', correctAnswer: 'A', mistakeClassification: { type: 'CALCULATION', label: 'Calculation Slip', explanation: 'Sign error when multiplying through by common denominator 4.' } }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
    },
    {
      submissionId: 'sub_10_math_01_rohit',
      assessmentId: 'asgn_10_math_01',
      assessmentTitle: 'Class 10th Mathematics: Real Numbers & Polynomials Diagnostic Assessment',
      studentId: 'b0000000-0000-0000-0000-000000000021',
      studentName: 'Rohit Verma',
      rollNumber: '10-A-01',
      grade: '10',
      section: '10-Science-A',
      totalScore: 12,
      totalMarks: 16,
      percentage: 75,
      totalTimeSpentSeconds: 235,
      smartCardSummary: 'Consistent pace across test. Inverted signs when equating factors $(x + 2)(x + 5) = 0$.',
      questionBreakdown: [
        { questionIndex: 1, questionId: 'c10_m_pyq_001', topic: 'Real Numbers', subtopic: "Euclid's Division Algorithm", timeSpentSeconds: 48, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate HCF.' } },
        { questionIndex: 2, questionId: 'c10_m_pyq_002', topic: 'Real Numbers', subtopic: 'Fundamental Theorem of Arithmetic', timeSpentSeconds: 52, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate LCM.' } },
        { questionIndex: 3, questionId: 'c10_m_pyq_050', topic: 'Polynomials', subtopic: 'Zeroes and Coefficients Relationship', timeSpentSeconds: 65, benchmarkSeconds: 90, isCorrect: false, selectedOption: 'B', correctAnswer: 'A', mistakeClassification: { type: 'SIGN_CONVENTION', label: 'Sign Slip', explanation: 'Selected positive roots 2 and 5 instead of -2 and -5.' } },
        { questionIndex: 4, questionId: 'c10_m_pyq_051', topic: 'Polynomials', subtopic: 'Quadratic Polynomial Formation', timeSpentSeconds: 70, benchmarkSeconds: 120, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct polynomial.' } }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      submissionId: 'sub_10_math_01_nikhil',
      assessmentId: 'asgn_10_math_01',
      assessmentTitle: 'Class 10th Mathematics: Real Numbers & Polynomials Diagnostic Assessment',
      studentId: 'b0000000-0000-0000-0000-000000000024',
      studentName: 'Nikhil Rana',
      rollNumber: '10-A-04',
      grade: '10',
      section: '10-Science-A',
      totalScore: 8,
      totalMarks: 16,
      percentage: 50,
      totalTimeSpentSeconds: 265,
      smartCardSummary: 'Good performance on Real Numbers. Remedial coaching needed on quadratic polynomial formation and zeroes relationship.',
      questionBreakdown: [
        { questionIndex: 1, questionId: 'c10_m_pyq_001', topic: 'Real Numbers', subtopic: "Euclid's Division Algorithm", timeSpentSeconds: 50, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate HCF.' } },
        { questionIndex: 2, questionId: 'c10_m_pyq_002', topic: 'Real Numbers', subtopic: 'Fundamental Theorem of Arithmetic', timeSpentSeconds: 55, benchmarkSeconds: 90, isCorrect: true, selectedOption: 'A', correctAnswer: 'A', mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate LCM.' } },
        { questionIndex: 3, questionId: 'c10_m_pyq_050', topic: 'Polynomials', subtopic: 'Zeroes and Coefficients Relationship', timeSpentSeconds: 75, benchmarkSeconds: 90, isCorrect: false, selectedOption: 'C', correctAnswer: 'A', mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Gap', explanation: 'Inconsistent factors in quadratic zeroes.' } },
        { questionIndex: 4, questionId: 'c10_m_pyq_051', topic: 'Polynomials', subtopic: 'Quadratic Polynomial Formation', timeSpentSeconds: 85, benchmarkSeconds: 120, isCorrect: false, selectedOption: 'C', correctAnswer: 'A', mistakeClassification: { type: 'FORMULA_BASED', label: 'Formula Confusion', explanation: 'Omitted constant multiplier k and reversed sum coefficient.' } }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 3.5).toISOString()
    },
    {
      submissionId: 'sub_10_sci_01_aryan',
      assessmentId: 'asgn_10_sci_01',
      assessmentTitle: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
      studentId: 'b0000000-0000-0000-0000-000000000001',
      studentName: 'Aryan Sharma',
      rollNumber: '11-S-24',
      grade: '10',
      section: 'Science-A',
      totalScore: 12,
      totalMarks: 12,
      percentage: 100,
      totalTimeSpentSeconds: 219,
      smartCardSummary: 'Mastered all 3 topics with sub-benchmark speeds. Flawless application of sign conventions and electrical units.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_asgn_01',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Spherical Mirrors',
          timeSpentSeconds: 68,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'B',
          correctAnswer: 'B',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Applied mirror formula with correct sign conventions.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_asgn_02',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Refraction & Snell Law',
          timeSpentSeconds: 61,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correctly solved v = c/n for water.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_asgn_03',
          topic: 'Electricity',
          subtopic: 'Joule Heating & Resistance',
          timeSpentSeconds: 90,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Converted 2 hours into 7200 seconds accurately.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      submissionId: 'sub_10_sci_01_ananya',
      assessmentId: 'asgn_10_sci_01',
      assessmentTitle: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
      studentId: 'b0000000-0000-0000-0000-000000000002',
      studentName: 'Ananya Thakur',
      rollNumber: '11-S-25',
      grade: '10',
      section: 'Science-A',
      totalScore: 8,
      totalMarks: 12,
      percentage: 67,
      totalTimeSpentSeconds: 285,
      smartCardSummary: 'Strong optics comprehension. Stumbled on time-unit conversion (2 hours to seconds) in Joule heating.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_asgn_01',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Spherical Mirrors',
          timeSpentSeconds: 82,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'B',
          correctAnswer: 'B',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Accurate mirror formula calculation.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_asgn_02',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Refraction & Snell Law',
          timeSpentSeconds: 68,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Quick Snell law speed ratio computation.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_asgn_03',
          topic: 'Electricity',
          subtopic: 'Joule Heating & Resistance',
          timeSpentSeconds: 135,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: {
            type: 'CALCULATION',
            label: 'Unit Conversion Failure',
            explanation: 'Forgot to convert 2 hours into 7200 seconds ($2 \\times 3600\\,\\text{s}$).',
            distractorTrap: 'Selected option computed without multiplying time by 3600.'
          }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
    },
    {
      submissionId: 'sub_10_sci_01_rohit',
      assessmentId: 'asgn_10_sci_01',
      assessmentTitle: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
      studentId: 'b0000000-0000-0000-0000-000000000003',
      studentName: 'Rohit Verma',
      rollNumber: '11-S-26',
      grade: '10',
      section: 'Science-A',
      totalScore: 4,
      totalMarks: 12,
      percentage: 33,
      totalTimeSpentSeconds: 340,
      smartCardSummary: 'Critical hesitation in Cartesian sign conventions and formula inversion in Snell law. Needs 1-on-1 re-teaching.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_asgn_01',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Spherical Mirrors',
          timeSpentSeconds: 145,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'C',
          correctAnswer: 'B',
          mistakeClassification: {
            type: 'SIGN_CONVENTION',
            label: 'Sign Convention Failure',
            explanation: 'Assumed positive sign for real image distance (+30cm instead of -30cm).',
            distractorTrap: 'Violated Cartesian sign convention where real image in front of mirror has negative distance.'
          }
        },
        {
          questionIndex: 2,
          questionId: 'q_asgn_02',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Refraction & Snell Law',
          timeSpentSeconds: 95,
          benchmarkSeconds: 75,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: {
            type: 'FORMULA_BASED',
            label: 'Formula Inversion Error',
            explanation: 'Multiplied speed of light by refractive index ($c \\times n$) instead of dividing ($c / n$).',
            distractorTrap: 'Speed of light in any material medium cannot exceed c ($3 \\times 10^8$ m/s).'
          }
        },
        {
          questionIndex: 3,
          questionId: 'q_asgn_03',
          topic: 'Electricity',
          subtopic: 'Joule Heating & Resistance',
          timeSpentSeconds: 100,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Correctly evaluated H = P * t.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      submissionId: 'sub_10_sci_01_simran',
      assessmentId: 'asgn_10_sci_01',
      assessmentTitle: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
      studentId: 'b0000000-0000-0000-0000-000000000004',
      studentName: 'Simran Kaur',
      rollNumber: '11-S-27',
      grade: '10',
      section: 'Science-A',
      totalScore: 8,
      totalMarks: 12,
      percentage: 67,
      totalTimeSpentSeconds: 270,
      smartCardSummary: 'High procedural accuracy in optics. Lost marks on Q3 due to parameter extraction error ($t=1\\text{h}$ instead of $2\\text{h}$).',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_asgn_01',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Spherical Mirrors',
          timeSpentSeconds: 75,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'B',
          correctAnswer: 'B',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Accurate mirror formula application.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_asgn_02',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Refraction & Snell Law',
          timeSpentSeconds: 70,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Correctly calculated 3e8 * 3/4.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_asgn_03',
          topic: 'Electricity',
          subtopic: 'Joule Heating & Resistance',
          timeSpentSeconds: 125,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'C',
          correctAnswer: 'A',
          mistakeClassification: {
            type: 'CALCULATION',
            label: 'Parameter Extraction Mistake',
            explanation: 'Substituted time $t = 1\\,\\text{hour}$ instead of given $2\\,\\text{hours}$.',
            distractorTrap: 'Selected option yielded exactly half the total energy.'
          }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 3.5).toISOString()
    },
    {
      submissionId: 'sub_10_sci_01_aditya',
      assessmentId: 'asgn_10_sci_01',
      assessmentTitle: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
      studentId: 'b0000000-0000-0000-0000-000000000005',
      studentName: 'Aditya Chauhan',
      rollNumber: '11-S-28',
      grade: '10',
      section: 'Science-A',
      totalScore: 4,
      totalMarks: 12,
      percentage: 33,
      totalTimeSpentSeconds: 360,
      smartCardSummary: 'Significant time overrun on spherical mirrors (160s vs 90s). Needs concept re-teaching on mirror ray geometries.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_asgn_01',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Spherical Mirrors',
          timeSpentSeconds: 160,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'A',
          correctAnswer: 'B',
          mistakeClassification: {
            type: 'CONCEPTUAL',
            label: 'Ray Geometry Confusion',
            explanation: 'Substituted focal length $f$ as the image distance $v$ without applying equation.',
            distractorTrap: 'Confused object placement at $2f$ with focus.'
          }
        },
        {
          questionIndex: 2,
          questionId: 'q_asgn_02',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Refraction & Snell Law',
          timeSpentSeconds: 85,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Snell law calculated accurately.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_asgn_03',
          topic: 'Electricity',
          subtopic: 'Joule Heating & Resistance',
          timeSpentSeconds: 115,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: {
            type: 'CALCULATION',
            label: 'Unit Conversion Failure',
            explanation: 'Substituted raw hours into Joule formula without converting to SI seconds.',
            distractorTrap: 'Selected option missing $3600\\text{s}$ factor.'
          }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      submissionId: 'sub_10_sci_01_mehak',
      assessmentId: 'asgn_10_sci_01',
      assessmentTitle: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
      studentId: 'b0000000-0000-0000-0000-000000000006',
      studentName: 'Mehak Sharma',
      rollNumber: '11-S-29',
      grade: '10',
      section: 'Science-A',
      totalScore: 8,
      totalMarks: 12,
      percentage: 67,
      totalTimeSpentSeconds: 245,
      smartCardSummary: 'Swift problem solver (sub-benchmark on Q1 & Q3). Quick recap suggested on refractive index constants.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_asgn_01',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Spherical Mirrors',
          timeSpentSeconds: 80,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'B',
          correctAnswer: 'B',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Proper mirror equation solved.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_asgn_02',
          topic: 'Light – Reflection and Refraction',
          subtopic: 'Refraction & Snell Law',
          timeSpentSeconds: 110,
          benchmarkSeconds: 75,
          isCorrect: false,
          selectedOption: 'C',
          correctAnswer: 'A',
          mistakeClassification: {
            type: 'CONCEPTUAL',
            label: 'Material Constant Confusion',
            explanation: 'Used glass refractive index ($1.5$) instead of water ($4/3$).',
            distractorTrap: 'Confused refractive indices of dense flint glass and water.'
          }
        },
        {
          questionIndex: 3,
          questionId: 'q_asgn_03',
          topic: 'Electricity',
          subtopic: 'Joule Heating & Resistance',
          timeSpentSeconds: 55,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Rapid and accurate calculation.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 4.5).toISOString()
    },
    {
      submissionId: 'sub_bio_01_riya',
      assessmentId: 'asgn_11_bio_01',
      assessmentTitle: 'Class 11 Medical Biology: Cell Biology & Biomolecules - NEET Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000041',
      studentName: 'Riya Thakur',
      rollNumber: '11-M-01',
      grade: '11',
      section: '11-Med',
      totalScore: 16,
      totalMarks: 16,
      percentage: 100,
      totalTimeSpentSeconds: 140,
      smartCardSummary: 'Mastered cell biology and biomolecules at NEET speed. Flawless knowledge of organelle autonomy and meiotic crossing over.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_bio_01',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Mitochondria & Chloroplast Semi-Autonomy',
          timeSpentSeconds: 32,
          benchmarkSeconds: 45,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurately recognized circular dsDNA in mitochondria.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_bio_02',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Fluid Mosaic Model & Membrane Dynamics',
          timeSpentSeconds: 28,
          benchmarkSeconds: 40,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correctly identified membrane fluidity parameter.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_bio_03',
          topic: 'Cell Cycle and Cell Division',
          subtopic: 'Meiotic Prophase I & Crossing Over',
          timeSpentSeconds: 38,
          benchmarkSeconds: 50,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correctly identified pachytene recombinase action.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_bio_04',
          topic: 'Biomolecules',
          subtopic: 'Enzyme Kinetics & Competitive Inhibition',
          timeSpentSeconds: 42,
          benchmarkSeconds: 60,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Identified malonate competitive inhibition.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
    },
    {
      submissionId: 'sub_bio_01_ayush',
      assessmentId: 'asgn_11_bio_01',
      assessmentTitle: 'Class 11 Medical Biology: Cell Biology & Biomolecules - NEET Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000042',
      studentName: 'Ayush Banyal',
      rollNumber: '11-M-02',
      grade: '11',
      section: '11-Med',
      totalScore: 12,
      totalMarks: 16,
      percentage: 75,
      totalTimeSpentSeconds: 175,
      smartCardSummary: 'Strong cell biology recall. Confused malonate competitive inhibitor with oxaloacetate Krebs intermediate.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_bio_01',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Mitochondria & Chloroplast Semi-Autonomy',
          timeSpentSeconds: 40,
          benchmarkSeconds: 45,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Accurate organelle identification.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_bio_02',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Fluid Mosaic Model & Membrane Dynamics',
          timeSpentSeconds: 35,
          benchmarkSeconds: 40,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Correct membrane fluidity.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_bio_03',
          topic: 'Cell Cycle and Cell Division',
          subtopic: 'Meiotic Prophase I & Crossing Over',
          timeSpentSeconds: 45,
          benchmarkSeconds: 50,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Identified pachytene crossing over.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_bio_04',
          topic: 'Biomolecules',
          subtopic: 'Enzyme Kinetics & Competitive Inhibition',
          timeSpentSeconds: 55,
          benchmarkSeconds: 60,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Error', explanation: 'Selected oxaloacetate instead of textbook competitive inhibitor malonate.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 2.2).toISOString()
    },
    {
      submissionId: 'sub_bio_01_deepak',
      assessmentId: 'asgn_11_bio_01',
      assessmentTitle: 'Class 11 Medical Biology: Cell Biology & Biomolecules - NEET Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000043',
      studentName: 'Deepak Soni',
      rollNumber: '11-M-03',
      grade: '11',
      section: '11-Med',
      totalScore: 8,
      totalMarks: 16,
      percentage: 50,
      totalTimeSpentSeconds: 210,
      smartCardSummary: 'Needs conceptual reinforcement on meiotic prophase stages and enzyme kinetic inhibitors.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_bio_01',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Mitochondria & Chloroplast Semi-Autonomy',
          timeSpentSeconds: 44,
          benchmarkSeconds: 45,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Accurate organelle identification.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_bio_02',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Fluid Mosaic Model & Membrane Dynamics',
          timeSpentSeconds: 38,
          benchmarkSeconds: 40,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Correctly chose fluidity.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_bio_03',
          topic: 'Cell Cycle and Cell Division',
          subtopic: 'Meiotic Prophase I & Crossing Over',
          timeSpentSeconds: 62,
          benchmarkSeconds: 50,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Error', explanation: 'Confused zygotene synapsis with pachytene crossing over.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_bio_04',
          topic: 'Biomolecules',
          subtopic: 'Enzyme Kinetics & Competitive Inhibition',
          timeSpentSeconds: 66,
          benchmarkSeconds: 60,
          isCorrect: false,
          selectedOption: 'C',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Error', explanation: 'Confused product malate with inhibitor malonate.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 3.1).toISOString()
    },
    {
      submissionId: 'sub_bio_01_kriti',
      assessmentId: 'asgn_11_bio_01',
      assessmentTitle: 'Class 11 Medical Biology: Cell Biology & Biomolecules - NEET Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000044',
      studentName: 'Kriti Dogra',
      rollNumber: '11-M-04',
      grade: '11',
      section: '11-Med',
      totalScore: 12,
      totalMarks: 16,
      percentage: 75,
      totalTimeSpentSeconds: 160,
      smartCardSummary: 'Quick and accurate recall in cell structures and enzymes. Stumbled on prophase I meiotic substages.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_bio_01',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Mitochondria & Chloroplast Semi-Autonomy',
          timeSpentSeconds: 30,
          benchmarkSeconds: 45,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Accurate organelle choice.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_bio_02',
          topic: 'Cell: The Unit of Life',
          subtopic: 'Fluid Mosaic Model & Membrane Dynamics',
          timeSpentSeconds: 32,
          benchmarkSeconds: 40,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Accurate membrane dynamics.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_bio_03',
          topic: 'Cell Cycle and Cell Division',
          subtopic: 'Meiotic Prophase I & Crossing Over',
          timeSpentSeconds: 52,
          benchmarkSeconds: 50,
          isCorrect: false,
          selectedOption: 'C',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Error', explanation: 'Confused diplotene chiasmata with pachytene crossing over.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_bio_04',
          topic: 'Biomolecules',
          subtopic: 'Enzyme Kinetics & Competitive Inhibition',
          timeSpentSeconds: 46,
          benchmarkSeconds: 60,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Correct', explanation: 'Correctly identified malonate.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 2.8).toISOString()
    },
    {
      submissionId: 'sub_phy_01_aryan',
      assessmentId: 'asgn_12_phy_01',
      assessmentTitle: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000001',
      studentName: 'Aryan Sharma',
      rollNumber: '12-NM-01',
      grade: '12',
      section: '12-NonMed',
      totalScore: 16,
      totalMarks: 16,
      percentage: 100,
      totalTimeSpentSeconds: 210,
      smartCardSummary: 'Mastered all 4 topics with sub-benchmark speeds. Flawless application of Gauss law symmetry, dipole torque cross-products, and capacitor dielectrics.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          timeSpentSeconds: 45,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Applied 6-face cubic symmetry instantly.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          timeSpentSeconds: 38,
          benchmarkSeconds: 60,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct vector cross product and negative potential energy.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          timeSpentSeconds: 55,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate 2:1 axial-to-equatorial field ratio.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          timeSpentSeconds: 72,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Recognized Q = constant with battery disconnected and energy scaled by 1/K.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      submissionId: 'sub_phy_01_kavya',
      assessmentId: 'asgn_12_phy_01',
      assessmentTitle: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000003',
      studentName: 'Kavya Verma',
      rollNumber: '12-NM-03',
      grade: '12',
      section: '12-NonMed',
      totalScore: 12,
      totalMarks: 16,
      percentage: 75,
      totalTimeSpentSeconds: 235,
      smartCardSummary: 'High proficiency across electrostatics. Minor hesitation on capacitor energy scaling with disconnected battery.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          timeSpentSeconds: 52,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct Gaussian flux.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          timeSpentSeconds: 42,
          benchmarkSeconds: 60,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct dipole formulation.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          timeSpentSeconds: 61,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct axial ratio.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          timeSpentSeconds: 80,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Slip', explanation: 'Assumed battery remained connected (V = constant instead of Q = constant).' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 4.2).toISOString()
    },
    {
      submissionId: 'sub_phy_01_rohit',
      assessmentId: 'asgn_12_phy_01',
      assessmentTitle: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000002',
      studentName: 'Rohit Negi',
      rollNumber: '12-NM-02',
      grade: '12',
      section: '12-NonMed',
      totalScore: 12,
      totalMarks: 16,
      percentage: 75,
      totalTimeSpentSeconds: 245,
      smartCardSummary: 'Solid conceptual understanding. Inverted axial/equatorial field ratio due to formula confusion.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          timeSpentSeconds: 58,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct flux through cube face.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          timeSpentSeconds: 48,
          benchmarkSeconds: 60,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct torque cross product.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          timeSpentSeconds: 72,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'FORMULA_BASED', label: 'Formula Confusion', explanation: 'Inverted axial and equatorial formulas (chose 1:2 instead of 2:1).' }
        },
        {
          questionIndex: 4,
          questionId: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          timeSpentSeconds: 67,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct dielectric scaling.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 3.8).toISOString()
    },
    {
      submissionId: 'sub_phy_01_divyansh',
      assessmentId: 'asgn_12_phy_01',
      assessmentTitle: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000005',
      studentName: 'Divyansh Thakur',
      rollNumber: '12-NM-05',
      grade: '12',
      section: '12-NonMed',
      totalScore: 12,
      totalMarks: 16,
      percentage: 75,
      totalTimeSpentSeconds: 240,
      smartCardSummary: 'Consistent problem solver. Stumbled on dielectric energy change when capacitor is disconnected.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          timeSpentSeconds: 50,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate Gaussian symmetry.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          timeSpentSeconds: 45,
          benchmarkSeconds: 60,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate dipole relations.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          timeSpentSeconds: 65,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate axial field.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          timeSpentSeconds: 80,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Error', explanation: 'Confused charge conservation with voltage conservation.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 3.2).toISOString()
    },
    {
      submissionId: 'sub_phy_01_kunal',
      assessmentId: 'asgn_12_phy_01',
      assessmentTitle: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000004',
      studentName: 'Kunal Sharma',
      rollNumber: '12-NM-04',
      grade: '12',
      section: '12-NonMed',
      totalScore: 8,
      totalMarks: 16,
      percentage: 50,
      totalTimeSpentSeconds: 270,
      smartCardSummary: 'Good grasp of Gauss law. Needs review on dipole axial field formulation and capacitor dielectric energy.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          timeSpentSeconds: 65,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct flux calculation.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          timeSpentSeconds: 52,
          benchmarkSeconds: 60,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct torque relation.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          timeSpentSeconds: 75,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'C',
          correctAnswer: 'A',
          mistakeClassification: { type: 'FORMULA_BASED', label: 'Formula Slip', explanation: 'Applied squared factor.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          timeSpentSeconds: 78,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Error', explanation: 'Assumed V constant instead of Q constant.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 2.5).toISOString()
    },
    {
      submissionId: 'sub_phy_01_akshat',
      assessmentId: 'asgn_12_phy_01',
      assessmentTitle: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000006',
      studentName: 'Akshat Jaswal',
      rollNumber: '12-NM-06',
      grade: '12',
      section: '12-NonMed',
      totalScore: 8,
      totalMarks: 16,
      percentage: 50,
      totalTimeSpentSeconds: 260,
      smartCardSummary: 'Moderate pace. Lost marks on dipole torque sign convention and capacitor dielectric energy.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          timeSpentSeconds: 55,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct symmetry.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          timeSpentSeconds: 58,
          benchmarkSeconds: 60,
          isCorrect: false,
          selectedOption: 'D',
          correctAnswer: 'A',
          mistakeClassification: { type: 'SIGN_CONVENTION', label: 'Sign Convention Slip', explanation: 'Omitted minus sign in potential energy U = -p.E.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          timeSpentSeconds: 68,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Accurate ratio.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          timeSpentSeconds: 79,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'C',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CALCULATION', label: 'Calculation Error', explanation: 'Multiplied by K^2.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      submissionId: 'sub_phy_01_rahul',
      assessmentId: 'asgn_12_phy_01',
      assessmentTitle: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000007',
      studentName: 'Rahul Sen',
      rollNumber: '12-NM-07',
      grade: '12',
      section: '12-NonMed',
      totalScore: 8,
      totalMarks: 16,
      percentage: 50,
      totalTimeSpentSeconds: 275,
      smartCardSummary: 'Consistent effort. Remedial focus suggested on dipole torque cross product and capacitor dielectrics.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          timeSpentSeconds: 62,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct Gaussian flux.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          timeSpentSeconds: 65,
          benchmarkSeconds: 60,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Vector Operation Slip', explanation: 'Swapped cross product and dot product.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          timeSpentSeconds: 68,
          benchmarkSeconds: 90,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correct ratio.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          timeSpentSeconds: 80,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Slip', explanation: 'Assumed V constant.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
    },
    {
      submissionId: 'sub_phy_01_sahil',
      assessmentId: 'asgn_12_phy_01',
      assessmentTitle: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
      studentId: 'b0000000-0000-0000-0000-000000000008',
      studentName: 'Sahil Dhiman',
      rollNumber: '12-NM-08',
      grade: '12',
      section: '12-NonMed',
      totalScore: 4,
      totalMarks: 16,
      percentage: 25,
      totalTimeSpentSeconds: 310,
      smartCardSummary: 'Significant hesitation across electrostatics. Remedial 1-on-1 coaching needed on dipole torque and capacitor dielectric physics.',
      questionBreakdown: [
        {
          questionIndex: 1,
          questionId: 'q_phy_01',
          topic: 'Electric Charges and Fields',
          subtopic: 'Gauss Law & Symmetric Field Calculations',
          timeSpentSeconds: 80,
          benchmarkSeconds: 75,
          isCorrect: true,
          selectedOption: 'A',
          correctAnswer: 'A',
          mistakeClassification: { type: 'NONE', label: 'Flawless Execution', explanation: 'Correctly found flux.' }
        },
        {
          questionIndex: 2,
          questionId: 'q_phy_02',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Dipole in Uniform Field & Torque',
          timeSpentSeconds: 70,
          benchmarkSeconds: 60,
          isCorrect: false,
          selectedOption: 'C',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Reversed Cross Product', explanation: 'Reversed vector order.' }
        },
        {
          questionIndex: 3,
          questionId: 'q_phy_03',
          topic: 'Electric Charges and Fields',
          subtopic: 'Electric Field of Dipole: Axial vs Equatorial',
          timeSpentSeconds: 80,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'FORMULA_BASED', label: 'Formula Inversion', explanation: 'Inverted ratio.' }
        },
        {
          questionIndex: 4,
          questionId: 'q_phy_04',
          topic: 'Electrostatic Potential and Capacitance',
          subtopic: 'Parallel Plate Capacitor with Dielectric Slab',
          timeSpentSeconds: 80,
          benchmarkSeconds: 90,
          isCorrect: false,
          selectedOption: 'B',
          correctAnswer: 'A',
          mistakeClassification: { type: 'CONCEPTUAL', label: 'Conceptual Error', explanation: 'Assumed V constant.' }
        }
      ],
      submittedAt: new Date(Date.now() - 3600000 * 1).toISOString()
    }
  ]
};

function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('[DATABASE] No DATABASE_URL set. Initializing high-speed in-memory store for HAPS-AI Assistant.');
    return;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('connect', () => {
      isConnected = true;
      console.log('[DATABASE] Connected to PostgreSQL 16 successfully.');
    });

    pool.on('error', (err) => {
      console.warn('[DATABASE] PostgreSQL pool warning:', err.message);
      isConnected = false;
    });
  } catch (err) {
    console.warn('[DATABASE] Failed to instantiate PG Pool. Using in-memory fallback.', err.message);
  }
}

async function query(text, params = []) {
  if (pool && isConnected) {
    try {
      const start = Date.now();
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`[DATABASE QUERY] ${text.slice(0, 40)}... took ${duration}ms, rows: ${res.rowCount}`);
      return res;
    } catch (err) {
      console.warn('[DATABASE QUERY ERROR] Falling back to in-memory store:', err.message);
    }
  }

  // In-memory simulation fallback
  return { rows: [], rowCount: 0 };
}

// Ensure 100% of pre-seeded questions have rich, scientifically accurate options (No "Option A, Option B" dummy text)
try {
  const { ensureQuestionHasRichOptions } = require('../services/questionOptionEngine');
  if (inMemoryStore.subjectBanks) {
    Object.values(inMemoryStore.subjectBanks).forEach(bank => {
      if (Array.isArray(bank)) {
        bank.forEach(q => ensureQuestionHasRichOptions(q));
      }
    });
  }
  if (Array.isArray(inMemoryStore.questions)) {
    inMemoryStore.questions.forEach(q => ensureQuestionHasRichOptions(q));
  }
  if (Array.isArray(inMemoryStore.assessments)) {
    inMemoryStore.assessments.forEach(asgn => {
      if (Array.isArray(asgn.questions)) {
        asgn.questions.forEach(q => ensureQuestionHasRichOptions(q));
      }
    });
  }
} catch (e) {
  console.warn('[DATABASE] Options enrichment notice:', e.message);
}

module.exports = {
  initDatabase,
  query,
  inMemoryStore
};
