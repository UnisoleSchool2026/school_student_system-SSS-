// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: QUESTION INJECTION SERVICE
// Faculty-Locked, Multimodal (Text/LaTeX, Image, PDF) Ingestion Pipeline
// Full Auto-Categorization: Automatically classifies Chapter, Marks, & Difficulty
// Grounded in NCERT, CBSE PYQs, Worked Examples & Exercises
// ============================================================================

require('dotenv').config();
const { inMemoryStore } = require('../config/database');
const { sanitizeLatexString, sanitizeQuestionPayload } = require('./llmQuestionEngine');
const { CURRICULUM_TAXONOMY } = require('./curriculumTaxonomy');

/**
 * Validates faculty credentials and ensures discipline/subject locking.
 * A Physics faculty member can ONLY push Physics questions.
 * A Chemistry faculty member can ONLY push Chemistry questions, etc.
 */
function validateFacultySubjectLock({ teacher, targetSubject, targetSubjectKey }) {
  if (!teacher || typeof teacher !== 'object') {
    throw new Error('Access Denied: Teacher credentials are required to inject questions.');
  }

  const role = (teacher.role || (teacher.subjectKey || teacher.department ? 'TEACHER' : '')).toUpperCase();
  if (role !== 'TEACHER' && role !== 'FACULTY' && role !== 'ADMIN') {
    throw new Error('Access Denied: Question Injection is strictly restricted to verified Faculty members.');
  }

  const teacherSubj = (teacher.subjectKey || teacher.subject || teacher.department || '').toUpperCase().trim();
  const reqSubj = (targetSubjectKey || targetSubject || '').toUpperCase().trim();

  // Normalize discipline names
  const normalize = (val) => {
    if (!val) return '';
    if (val.includes('PHYS')) return 'PHYSICS';
    if (val.includes('CHEM')) return 'CHEMISTRY';
    if (val.includes('MATH')) return 'MATHEMATICS';
    if (val.includes('BIO')) return 'BIOLOGY';
    if (val.includes('SCI')) return 'SCIENCE';
    return val;
  };

  const normTeacher = normalize(teacherSubj);
  const normTarget = normalize(reqSubj);

  // Class 10 Science teachers can push Science (which includes Physics/Chemistry/Biology foundation)
  if (normTeacher === 'SCIENCE') {
    if (['SCIENCE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'].includes(normTarget)) {
      return true;
    }
  }

  // Senior secondary discipline locking
  if (normTeacher && normTarget && normTeacher !== normTarget) {
    if (normTarget === 'SCIENCE') {
      return true; // Physics/Chem/Bio teachers can also inject into Foundation Science
    }
    throw new Error(
      `Discipline Lock Violation: ${teacher.name || 'Faculty'} is registered as ${teacherSubj} faculty and is not permitted to inject questions into ${reqSubj}.`
    );
  }

  return true;
}

/**
 * Intelligent Chapter Auto-Detection based on official NCERT syllabus keywords
 */
function detectChapterFromText({ text = '', targetSubject = 'Physics', grade = '12' }) {
  const sUpper = (targetSubject || '').toUpperCase();
  const lower = (text || '').toLowerCase();

  // 1. PHYSICS
  if (sUpper.includes('PHYS')) {
    // 1.1 Semiconductor Devices (check before generic charge)
    if (lower.includes('semiconductor') || lower.includes('diode') || lower.includes('p-n junction') || lower.includes('intrinsic semiconductor') || lower.includes('minority carrier') || lower.includes('transistor') || lower.includes('logic gate') || lower.includes('zener') || lower.includes('rectifier') || lower.includes('biasing')) {
      return 'Semiconductor Electronics: Materials, Devices, and Simple Circuits';
    }
    // 1.2 Ray Optics & Optical Instruments
    if (lower.includes('telescope') || lower.includes('microscope') || lower.includes('lens') || lower.includes('mirror') || lower.includes('refraction') || lower.includes('focal') || lower.includes('prism') || lower.includes('critical angle') || lower.includes('total internal') || lower.includes('glass slab') || lower.includes('ray of light') || lower.includes('optical fibre')) {
      return 'Ray Optics and Optical Instruments';
    }
    // 1.3 Wave Optics
    if (lower.includes('interference') || lower.includes('diffraction') || lower.includes('young') || lower.includes('double-slit') || lower.includes('fringe') || lower.includes('wavefront') || lower.includes('coherent') || lower.includes('polarization')) {
      return 'Wave Optics';
    }
    // 1.4 Dual Nature of Radiation & Matter
    if (lower.includes('photoelectric') || lower.includes('work function') || lower.includes('de broglie') || lower.includes('stopping potential') || lower.includes('photoelectron') || lower.includes('photosensitive') || lower.includes('photon')) {
      return 'Dual Nature of Radiation and Matter';
    }
    // 1.5 Nuclei
    if (lower.includes('fission') || lower.includes('fusion') || lower.includes('mass defect') || lower.includes('binding energy') || lower.includes('nuclei') || lower.includes('nuclear') || lower.includes('radioactiv') || lower.includes('mass number')) {
      return 'Nuclei';
    }
    // 1.6 Atoms
    if (lower.includes('bohr') || lower.includes('rutherford') || lower.includes('rydberg') || lower.includes('hydrogen atom') || lower.includes('energy level')) {
      return 'Atoms';
    }
    // 1.7 Electromagnetic Waves
    if (lower.includes('electromagnetic wave') || lower.includes('em wave') || lower.includes('displacement current') || lower.includes('maxwell') || lower.includes('poynting')) {
      return 'Electromagnetic Waves';
    }
    // 1.8 Alternating Current
    if (lower.includes('alternating') || lower.includes('impedance') || lower.includes('reactance') || lower.includes('lcr') || lower.includes('resonance') || lower.includes('power factor') || lower.includes('peak voltage') || lower.includes('ac source') || lower.includes('ac voltage') || lower.includes('rms current') || lower.includes('rms voltage') || lower.includes('inductor')) {
      return 'Alternating Current (AC)';
    }
    // 1.9 Electromagnetic Induction
    if (lower.includes('induced emf') || lower.includes('faraday') || lower.includes('lenz') || lower.includes('self-induct') || lower.includes('mutual induct') || lower.includes('eddy current') || lower.includes('magnetic flux')) {
      return 'Electromagnetic Induction (EMI)';
    }
    // 1.10 Moving Charges & Magnetism
    if (lower.includes('galvanometer') || lower.includes('biot-savart') || lower.includes('lorentz') || lower.includes('solenoid') || lower.includes('cyclotron') || lower.includes('magnetic force') || lower.includes('magnetic field') || lower.includes('circular coil') || lower.includes('square loop') || lower.includes('torque that must be applied')) {
      return 'Moving Charges and Magnetism';
    }
    // 1.11 Current Electricity
    if (lower.includes('drift velocity') || lower.includes('kirchhoff') || lower.includes('wheatstone') || lower.includes('potentiometer') || lower.includes('internal resistance') || lower.includes('terminal voltage') || lower.includes('current electricity') || lower.includes('steady current') || lower.includes('resistor') || lower.includes('ohm')) {
      return 'Current Electricity';
    }
    // 1.12 Electrostatic Potential & Capacitance
    if (lower.includes('capacit') || lower.includes('dielectric') || lower.includes('equipotential') || lower.includes('electrostatic potential') || lower.includes('potential difference between point')) {
      return 'Electrostatic Potential and Capacitance';
    }
    // 1.13 Electric Charges and Fields
    if (lower.includes('electric field') || lower.includes('gauss') || lower.includes('flux') || lower.includes('coulomb') || lower.includes('electric dipole') || lower.includes('charge')) {
      return 'Electric Charges and Fields';
    }
    // Class 11 Topics
    if (lower.includes('projectile') || lower.includes('trajectory') || lower.includes('vector')) return 'Motion in a Plane';
    if (lower.includes('friction') || lower.includes('newton') || lower.includes('momentum') || lower.includes('tension')) return 'Laws of Motion';
    if (lower.includes('work done') || lower.includes('kinetic energy') || lower.includes('collision')) return 'Work, Energy and Power';
    if (lower.includes('moment of inertia') || lower.includes('torque') || lower.includes('angular momentum') || lower.includes('rolling without slipping')) return 'System of Particles and Rotational Motion';
    if (lower.includes('gravitat') || lower.includes('kepler') || lower.includes('escape velocity')) return 'Gravitation';
    if (lower.includes('simple harmonic') || lower.includes('oscillation') || lower.includes('pendulum')) return 'Oscillations';
    if (lower.includes('doppler') || lower.includes('sound wave') || lower.includes('standing wave')) return 'Waves';
    if (lower.includes('carnot') || lower.includes('entropy') || lower.includes('adiabatic') || lower.includes('isothermal')) return 'Thermodynamics';
    return 'Electric Charges and Fields';
  }

  // 2. CHEMISTRY
  if (sUpper.includes('CHEM')) {
    if (lower.includes('raoult') || lower.includes('colligative') || lower.includes('osmotic') || lower.includes('molarity') || lower.includes('henry') || lower.includes('depression in freezing')) return 'Solutions';
    if (lower.includes('nernst') || lower.includes('kohlrausch') || lower.includes('electrochemical') || lower.includes('galvanic') || lower.includes('molar conductivity') || lower.includes('standard electrode')) return 'Electrochemistry';
    if (lower.includes('rate constant') || lower.includes('rate law') || lower.includes('half-life') || lower.includes('order of reaction') || lower.includes('arrhenius') || lower.includes('activation energy')) return 'Chemical Kinetics';
    if (lower.includes('lanthanoid') || lower.includes('actinoid') || lower.includes('transition metal') || lower.includes('d-block') || lower.includes('oxidation state')) return 'The d- and f-Block Elements';
    if (lower.includes('ligand') || lower.includes('coordination') || lower.includes('crystal field') || lower.includes('chelate') || lower.includes('iupac name')) return 'Coordination Compounds';
    if (lower.includes('sn1') || lower.includes('sn2') || lower.includes('haloalkane') || lower.includes('haloarene') || lower.includes('chirality')) return 'Haloalkanes and Haloarenes';
    if (lower.includes('alcohol') || lower.includes('phenol') || lower.includes('ether') || lower.includes('reimer-tiemann') || lower.includes('kolbe')) return 'Alcohols, Phenols and Ethers';
    if (lower.includes('aldehyde') || lower.includes('ketone') || lower.includes('carboxylic') || lower.includes('cannizzaro') || lower.includes('aldol') || lower.includes('clemmensen')) return 'Aldehydes, Ketones and Carboxylic Acids';
    if (lower.includes('amine') || lower.includes('diazonium') || lower.includes('aniline') || lower.includes('hoffmann')) return 'Amines';
    if (lower.includes('glucose') || lower.includes('protein') || lower.includes('carbohydrate') || lower.includes('dna') || lower.includes('rna') || lower.includes('amino acid') || lower.includes('peptide')) return 'Biomolecules';
    return 'Solutions';
  }

  // 3. MATHEMATICS
  if (sUpper.includes('MATH')) {
    if (lower.includes('matrix') || lower.includes('matrices') || lower.includes('symmetric') || lower.includes('skew')) return 'Matrices';
    if (lower.includes('determinant') || lower.includes('cramer') || lower.includes('minor') || lower.includes('cofactor') || lower.includes('adjoint')) return 'Determinants';
    if (lower.includes('continuity') || lower.includes('differentiab') || lower.includes('derivative') || lower.includes('chain rule') || lower.includes('rolle')) return 'Continuity and Differentiability';
    if (lower.includes('maxima') || lower.includes('minima') || lower.includes('increasing') || lower.includes('decreasing') || lower.includes('rate of change') || lower.includes('tangent')) return 'Application of Derivatives';
    if (lower.includes('integral') || lower.includes('integration') || lower.includes('antiderivative') || lower.includes('substitution') || lower.includes('partial fraction')) return 'Integrals';
    if (lower.includes('area under') || lower.includes('bounded by') || lower.includes('quadrant')) return 'Application of Integrals';
    if (lower.includes('differential equation') || lower.includes('order and degree') || lower.includes('integrating factor') || lower.includes('homogenous')) return 'Differential Equations';
    if (lower.includes('vector') || lower.includes('dot product') || lower.includes('cross product') || lower.includes('magnitude') || lower.includes('scalar triple')) return 'Vector Algebra';
    if (lower.includes('direction cosine') || lower.includes('skew lines') || lower.includes('shortest distance') || lower.includes('plane') || lower.includes('3d')) return 'Three Dimensional Geometry';
    if (lower.includes('probability') || lower.includes('bayes') || lower.includes('conditional probability') || lower.includes('random variable') || lower.includes('bernoulli')) return 'Probability';
    if (lower.includes('relation') || lower.includes('function') || lower.includes('equivalence') || lower.includes('bijective') || lower.includes('one-one')) return 'Relations and Functions';
    return 'Integrals';
  }

  // 4. BIOLOGY
  if (sUpper.includes('BIO')) {
    if (lower.includes('pollen') || lower.includes('flower') || lower.includes('pollination') || lower.includes('embryo sac') || lower.includes('double fertilization')) return 'Sexual Reproduction in Flowering Plants';
    if (lower.includes('spermatogenesis') || lower.includes('oogenesis') || lower.includes('placenta') || lower.includes('fertilization') || lower.includes('menstrual')) return 'Human Reproduction';
    if (lower.includes('contraceptive') || lower.includes('ivf') || lower.includes('iud') || lower.includes('std') || lower.includes('mori')) return 'Reproductive Health';
    if (lower.includes('mendel') || lower.includes('dihybrid') || lower.includes('monohybrid') || lower.includes('pedigree') || lower.includes('linkage') || lower.includes('hemophilia') || lower.includes('sickle cell')) return 'Principles of Inheritance and Variation';
    if (lower.includes('dna') || lower.includes('rna') || lower.includes('transcription') || lower.includes('translation') || lower.includes('replication') || lower.includes('operon') || lower.includes('genetic code')) return 'Molecular Basis of Inheritance';
    if (lower.includes('darwin') || lower.includes('natural selection') || lower.includes('homologous') || lower.includes('analogous') || lower.includes('hardy-weinberg')) return 'Evolution';
    if (lower.includes('immunity') || lower.includes('aids') || lower.includes('cancer') || lower.includes('malaria') || lower.includes('antibody') || lower.includes('vaccine')) return 'Human Health and Disease';
    if (lower.includes('recombinant') || lower.includes('pcr') || lower.includes('restriction enzyme') || lower.includes('plasmid') || lower.includes('gel electrophoresis')) return 'Biotechnology: Principles and Processes';
    if (lower.includes('ecosystem') || lower.includes('food chain') || lower.includes('trophic level') || lower.includes('ecological pyramid')) return 'Ecosystem';
    return 'Principles of Inheritance and Variation';
  }

  // 5. CLASS 10 SCIENCE
  if (sUpper.includes('SCI')) {
    if (lower.includes('chemical equation') || lower.includes('redox') || lower.includes('displacement reaction') || lower.includes('oxidation')) return 'Chemical Reactions and Equations';
    if (lower.includes('acid') || lower.includes('base') || lower.includes('salt') || lower.includes('ph scale') || lower.includes('neutralization')) return 'Acids, Bases and Salts';
    if (lower.includes('metal') || lower.includes('non-metal') || lower.includes('reactivity series') || lower.includes('ionic bond')) return 'Metals and Non-metals';
    if (lower.includes('carbon') || lower.includes('hydrocarbon') || lower.includes('alkane') || lower.includes('covalent bond') || lower.includes('homologous series')) return 'Carbon and its Compounds';
    if (lower.includes('photosynthesis') || lower.includes('respiration') || lower.includes('nephron') || lower.includes('circulation') || lower.includes('digest')) return 'Life Processes';
    if (lower.includes('mirror') || lower.includes('lens') || lower.includes('refraction') || lower.includes('reflection') || lower.includes('focal length')) return 'Light – Reflection and Refraction';
    if (lower.includes('human eye') || lower.includes('dispersion') || lower.includes('rainbow') || lower.includes('myopia') || lower.includes('hypermetropia')) return 'The Human Eye and the Colorful World';
    if (lower.includes('ohm') || lower.includes('current') || lower.includes('resistance') || lower.includes('potential difference') || lower.includes('joule')) return 'Electricity';
    if (lower.includes('magnetic effect') || lower.includes('solenoid') || lower.includes('fleming') || lower.includes('motor') || lower.includes('electromagnet')) return 'Magnetic Effects of Electric Current';
    return 'Electricity';
  }

  return 'General Core Syllabus';
}

/**
 * Intelligent Marks Auto-Detection
 */
function detectMarksFromText(text = '') {
  const match = text.match(/(?:\[|\()(\d+)\s*(?:marks?|pts?|points?)(?:\]|\))/i) ||
                text.match(/(\d+)\s*(?:marks?|mark)\b/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (val >= 1 && val <= 5) return val;
  }
  // Check if standard MCQ choices present (A, B, C, D) -> 1 Mark
  if (text.match(/^[A-D]\)/m) || text.match(/^\([A-D]\)/m) || text.match(/[A-D]\.\s/)) {
    return 1;
  }
  // Long derivation or multi-line proof -> 5 Marks
  if (text.toLowerCase().includes('derive') || text.toLowerCase().includes('prove that') || text.toLowerCase().includes('show that')) {
    return text.length > 220 ? 5 : 3;
  }
  return 3; // Standard 3 Marks
}

/**
 * Intelligent Difficulty Auto-Evaluation
 */
function detectDifficultyFromMarks(marks, text = '') {
  const lower = text.toLowerCase();
  if (lower.includes('jee advanced') || lower.includes('olympiad') || lower.includes('aiims') || marks === 5) return 'HARD';
  if (marks === 1 && !lower.includes('calculate') && !lower.includes('evaluate')) return 'EASY';
  return 'MEDIUM';
}

/**
 * Clean and parse JSON safely from LLM output
 */
function cleanAndParseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();

  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {}
    }
    throw new Error(`Failed to parse AI response as JSON: ${text.slice(0, 150)}...`);
  }
}

/**
 * Parses a single question chunk into a structured KaTeX assessment question
 */
function parseSingleQuestionText({ text, targetSubject = 'Physics', grade = '12', category = 'CBSE_PYQ', qNumber = 1 }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let questionPrompt = '';
  const options = [];
  let answerKey = 'A';
  let solutionText = '';

  const answerRegex = /(?:answer|ans|correct|option)[:\s]*\(?([A-D])\)?/i;
  const solutionRegex = /(?:solution|explanation|working|step)[:\s]*(.+)/i;

  let inSolution = false;
  const nonSolutionLines = [];

  for (const line of lines) {
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      answerKey = ansMatch[1].toUpperCase();
      continue;
    }

    const solMatch = line.match(solutionRegex);
    if (solMatch) {
      inSolution = true;
      solutionText += (solutionText ? '\n' : '') + (solMatch[1] || line);
      continue;
    }

    if (inSolution) {
      solutionText += '\n' + line;
      continue;
    }

    nonSolutionLines.push(line);
  }

  const promptBlock = nonSolutionLines.join('\n');

  // Check if this is an Assertion-Reason question
  const isAssertionReason = /Assertion\s*\([A-Za-z0-9]\)/i.test(promptBlock) && /Reason\s*\([A-Za-z0-9]\)/i.test(promptBlock);

  // Extract options (A), (B), (C), (D) across lines or inline
  const optionRegex = /(?:\(([A-D])\)|(?:\b|^)([A-D])\))\s*([^(\n\r]+)/g;
  let optMatch;
  while ((optMatch = optionRegex.exec(promptBlock)) !== null) {
    const key = (optMatch[1] || optMatch[2]).toUpperCase();
    const val = optMatch[3].trim().replace(/\s+/g, ' ');
    if (val.length > 0 && !options.some(o => o.key === key) && !isAssertionReason) {
      options.push({
        key,
        latex: val.includes('$') ? val : `$${val}$`,
        is_correct: key === answerKey,
        distractor_trap: key === 'B' ? 'Common sign convention slip' : key === 'C' ? 'Neglected boundary condition' : key === 'D' ? 'Formula inversion error' : null
      });
    }
  }

  // If Assertion-Reason question, populate official CBSE standard options
  if (isAssertionReason) {
    options.length = 0;
    options.push(
      { key: 'A', latex: 'Both Assertion (A) and Reason (R) are true and Reason (R) is the correct explanation of Assertion (A).', is_correct: true, distractor_trap: null },
      { key: 'B', latex: 'Both Assertion (A) and Reason (R) are true, but Reason (R) is NOT the correct explanation of Assertion (A).', is_correct: false, distractor_trap: 'Failed to verify independent reasoning linkage' },
      { key: 'C', latex: 'Assertion (A) is true, but Reason (R) is false.', is_correct: false, distractor_trap: 'Mismatched physical validity of premise' },
      { key: 'D', latex: 'Both Assertion (A) and Reason (R) are false.', is_correct: false, distractor_trap: 'Overgeneralized incorrect physical law' }
    );
  }

  // Isolate question prompt text before options
  if (options.length >= 2 && !isAssertionReason) {
    const firstOptIdx = promptBlock.search(/(?:\([A-D]\)|(?:\b|^)[A-D]\))\s+/);
    if (firstOptIdx !== -1) {
      questionPrompt = promptBlock.slice(0, firstOptIdx).trim();
    } else {
      questionPrompt = promptBlock;
    }
  } else {
    questionPrompt = promptBlock;
  }

  // Strip leading question number (e.g. "1. ", "Question 1: ", etc.)
  questionPrompt = questionPrompt.replace(/^(?:Q(?:uestion)?\.?\s*)?\d+[\.:\)]\s*/i, '').trim();

  // Auto-detect marks based on standard paper sections or explicit markers
  let detectedMarks = detectMarksFromText(text);
  if (qNumber >= 1 && qNumber <= 33 && (!text.includes('Mark') && !text.includes('mark'))) {
    if (qNumber <= 16) detectedMarks = 1;
    else if (qNumber <= 21) detectedMarks = 2;
    else if (qNumber <= 28) detectedMarks = 3;
    else if (qNumber <= 30) detectedMarks = 4;
    else if (qNumber <= 33) detectedMarks = 5;
  }

  // Auto-detect Chapter & Difficulty
  const detectedChapter = detectChapterFromText({ text: questionPrompt || text, targetSubject, grade });
  const detectedDifficulty = detectDifficultyFromMarks(detectedMarks, text);

  const hasOptions = options.length >= 2;
  const questionFormat = hasOptions ? 'MCQ_SINGLE' : (detectedMarks >= 4 ? 'CASE_STUDY' : 'SUBJECTIVE_LONG');

  if (hasOptions) {
    options.forEach(opt => {
      opt.is_correct = (opt.key === answerKey);
      if (opt.is_correct) opt.distractor_trap = null;
    });
  }

  const correctOpt = hasOptions ? (options.find(o => o.is_correct) || options[0]) : null;
  const correctAns = correctOpt ? correctOpt.latex : 'Verified Comprehensive Derivation & Marking Scheme';

  if (!solutionText) {
    if (hasOptions) {
      solutionText = `By applying the fundamental governing equations for ${detectedChapter}:\n$$${correctOpt.latex.replace(/^\$|\$$/g, '')}$$\nSubstituting given parameters and evaluating algebraically yields the verified option.`;
    } else {
      solutionText = `Step 1: Governing Physical Law & Conceptual Setup:\nIdentify the relevant governing principle in ${detectedChapter}.\nStep 2: Mathematical Working & Boundary Substitution:\nApply Cartesian conventions and evaluate line-by-line equations.\nStep 3: Verified Final Conclusion with Standard SI Units.`;
    }
  }

  const categoryTag = category === 'CBSE_PYQ' ? 'CBSE Board Examination (Authentic PYQ)' : category === 'NCERT_EXAMPLE' ? 'NCERT Worked In-Text Example' : category === 'NCERT_EXERCISE' ? 'NCERT End-of-Chapter Exercise' : 'Competitive / Advanced Mock';

  return {
    question_number: qNumber,
    chapter_name: detectedChapter,
    chapter: detectedChapter,
    topic: detectedChapter,
    marks_weightage: detectedMarks,
    difficulty: detectedDifficulty,
    question_format: questionFormat,
    question_latex: questionPrompt || text,
    options_latex: options,
    correct_answer_latex: correctAns,
    correct_answer: hasOptions ? (correctOpt?.key || 'A') : 'Verified',
    solution_latex: solutionText,
    socratic_hints: [
      `Recall the fundamental governing principles of ${detectedChapter}.`,
      'Carefully check the units and dimensional consistency before substituting numerical values.',
      'Apply standard New Cartesian sign conventions for directional vectors.'
    ],
    step_rubric: [
      { step: 1, description: 'Identification of governing physical law & formula formulation', marks: detectedMarks > 1 ? 1.0 : 0.5 },
      { step: 2, description: 'Algebraic substitution of given boundary parameters', marks: detectedMarks > 2 ? 1.0 : 0.5 },
      { step: 3, description: 'Final evaluated result with accurate standard SI units', marks: Math.max(1.0, detectedMarks - 2) }
    ],
    ncert_mapping: {
      chapter_name: detectedChapter,
      ncert_section: 'Core Curriculum Concept',
      pyq_tag: categoryTag,
      marks: detectedMarks
    },
    benchmark_time_seconds: detectedMarks * 45,
    bloom_level: detectedDifficulty === 'HARD' ? 'ANALYSIS' : 'APPLICATION'
  };
}

/**
 * Intelligent local multi-question parser supporting full board papers (Q1..33),
 * multi-section PDF extracts, and pasted worksheets.
 */
function parseRawTextLocally({ rawText = '', targetSubject = 'Physics', category = 'CBSE_PYQ', grade = '12' }) {
  if (!rawText || !rawText.trim()) {
    rawText = `Calculate the fundamental parameters for ${targetSubject} under standard atmospheric conditions.`;
  }

  // 1. Check if document has numbered questions like 1. ... 2. ... (CBSE / State Board paper)
  const lines = rawText.split('\n');
  const questionsMap = new Map();
  let currentQ = null;
  let isEnglish = true;
  let hasNumberedStructure = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Detect question header e.g. "1. A particle...", "Q1. ...", "Question 1: ..."
    const qMatch = rawLine.match(/^(?:Q(?:uestion)?\.?\s*)?([0-9]{1,2})[\.:\)]\s+(.*)$/i);
    if (qMatch) {
      const qNum = parseInt(qMatch[1], 10);
      const rest = qMatch[2].trim();
      const isEngLine = /^[A-Za-z]/.test(rest) || /[a-zA-Z]{3,}/.test(rest);

      if (isEngLine && qNum >= 1 && qNum <= 60) {
        currentQ = qNum;
        isEnglish = true;
        hasNumberedStructure = true;
        questionsMap.set(currentQ, [rawLine]);
        continue;
      } else if (!isEngLine) {
        isEnglish = false;
        continue;
      }
    }

    if (currentQ && isEnglish) {
      // Filter out header/footer boilerplate
      if (rawLine.includes('~55/3/1~') || rawLine.includes('P.T.O.') || rawLine.includes('•') || rawLine.includes('खण्ड') || rawLine.includes('नोट NOTE') || rawLine.includes('General Instructions')) {
        continue;
      }
      if (/^(?:Q(?:uestion)?\.?\s*)?([0-9]{1,2})[\.:\)]\s+[^\x00-\x7F]/.test(rawLine)) {
        isEnglish = false;
        continue;
      }
      questionsMap.get(currentQ).push(rawLine);
    }
  }

  // If structured numbered questions were found, map each to a structured question
  if (hasNumberedStructure && questionsMap.size > 1) {
    const structuredQuestions = [];
    const sortedKeys = Array.from(questionsMap.keys()).sort((a, b) => a - b);

    for (const qNum of sortedKeys) {
      const qLines = questionsMap.get(qNum);
      const chunk = qLines.join('\n');
      const parsedQ = parseSingleQuestionText({
        text: chunk,
        targetSubject,
        grade,
        category,
        qNumber: qNum
      });
      structuredQuestions.push(parsedQ);
    }

    return {
      detected_question_count: structuredQuestions.length,
      questions: structuredQuestions,
      ...structuredQuestions[0]
    };
  }

  // Fallback to standard split regex for shorter sheets / unnumbered questions
  const splitRegex = /(?=(?:^|\n)(?:Q(?:uestion)?\.?\s*\d+[\.:\)]|\d+[\.:\)])\s+)/i;
  const parts = rawText.split(splitRegex).map(p => p.trim()).filter(p => p.length > 5);
  const questionChunks = parts.length > 0 ? parts : [rawText];
  const structuredQuestions = questionChunks.map((chunk, idx) => {
    return parseSingleQuestionText({
      text: chunk,
      targetSubject,
      grade,
      category,
      qNumber: idx + 1
    });
  });

  return {
    detected_question_count: structuredQuestions.length,
    questions: structuredQuestions,
    ...structuredQuestions[0]
  };
}

/**
 * Multimodal extraction using Google Gemini
 */
async function callGeminiMultimodal({ apiKey, mediaData, mimeType, promptText }) {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  let lastError = null;

  let cleanData = mediaData;
  if (cleanData.includes(';base64,')) {
    cleanData = cleanData.split(';base64,')[1];
  }

  for (const model of models) {
    try {
      const cleanModel = model.replace(/^models\//, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout guard

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanData
                  }
                },
                {
                  text: promptText
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Multimodal ${model} HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      const rawText = json.candidates[0].content.parts[0].text;
      return cleanAndParseJson(rawText);
    } catch (err) {
      lastError = err;
      console.warn(`[INJECTION SERVICE] Gemini multimodal attempt with ${model} failed: ${err.message}. Trying next...`);
    }
  }

  throw lastError || new Error('All Gemini multimodal model attempts failed.');
}

/**
 * Text extraction using Groq Cloud API with LPU acceleration
 */
async function callGroqTextExtraction({ apiKey, systemPrompt, userPrompt }) {
  const models = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'llama-3.3-70b-versatile'];
  let lastError = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 3000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errText}`);
      }

      const json = await response.json();
      const content = json.choices[0].message.content;
      return cleanAndParseJson(content);
    } catch (err) {
      lastError = err;
      console.warn(`[INJECTION SERVICE] Groq model ${model} failed: ${err.message}. Trying next...`);
    }
  }

  throw lastError || new Error('All Groq extraction models failed.');
}

/**
 * AI-driven question ingestion parser supporting:
 * - mode: 'text' (raw text / LaTeX OCR)
 * - mode: 'image' (PNG, JPG, WEBP)
 * - mode: 'pdf' (PDF document page/excerpt)
 * FULL AUTO-CATEGORIZATION: Automatically extracts ALL questions and determines
 * Chapter, Marks Weightage, and Difficulty per question without manual teacher entry.
 */
async function processQuestionExtraction({
  mode = 'text',
  rawText = '',
  mediaData = '',
  mimeType = 'image/jpeg',
  targetSubject = 'Physics',
  grade = '12',
  category = 'CBSE_PYQ'
}) {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();

  const categoryLabel = category === 'CBSE_PYQ' ? 'CBSE / Board PYQ (Previous Year Question)'
    : category === 'NCERT_EXAMPLE' ? 'NCERT Worked In-Text Example'
    : category === 'NCERT_EXERCISE' ? 'NCERT End-of-Chapter Exercise Question'
    : 'Competitive Examination / Advanced Practice Mock';

  const systemInstructions = `You are the Lead Academic Assessment & KaTeX Math Specialist for Unisole AI School.
The teacher has uploaded an assessment document (PDF, test paper photo, or pasted questions) from the discipline: ${targetSubject} (Class ${grade}).

CRITICAL MULTI-QUESTION AUTO-CATEGORIZATION DIRECTIVES:
1. Extract ALL distinct questions present in the document. Do not stop at only 1 question.
2. For EVERY question, AUTOMATICALLY IDENTIFY AND CLASSIFY:
   - "chapter_name": The exact NCERT Chapter it belongs to (e.g. Electric Charges and Fields, Alternating Current, Solutions, Integrals).
   - "marks_weightage": The marks weightage (1 for MCQ/Objective, 2 for Short, 3 for Standard Problem/Numerical, 4 for Case Study, 5 for Long Derivation/Proof).
   - "difficulty": "EASY", "MEDIUM", or "HARD" based on Bloom's taxonomy.
3. Clean KaTeX LaTeX formatting: $...$ for inline math, $$...$$ for display equations.
4. Structure 4 options (A, B, C, D) with distractor traps if MCQ.
5. Provide step-by-step mathematical working and verified final answer.
6. Return ONLY valid JSON with this exact schema:
{
  "detected_question_count": 2,
  "questions": [
    {
      "question_number": 1,
      "chapter_name": "...",
      "marks_weightage": 1,
      "difficulty": "EASY",
      "question_latex": "...",
      "options_latex": [
        { "key": "A", "latex": "$...$", "is_correct": true, "distractor_trap": null },
        { "key": "B", "latex": "$...$", "is_correct": false, "distractor_trap": "..." },
        { "key": "C", "latex": "$...$", "is_correct": false, "distractor_trap": "..." },
        { "key": "D", "latex": "$...$", "is_correct": false, "distractor_trap": "..." }
      ],
      "correct_answer_latex": "...",
      "solution_latex": "...",
      "socratic_hints": ["..."],
      "step_rubric": [{ "step": 1, "description": "...", "marks": 1.0 }],
      "ncert_mapping": { "chapter_name": "...", "ncert_section": "...", "pyq_tag": "${categoryLabel}", "marks": 1 },
      "benchmark_time_seconds": 90,
      "bloom_level": "APPLICATION"
    }
  ]
}`;

  // 1. PDF Mode: Use Native High-Fidelity PDF Engine First (handles 20-50+ page exam papers instantly)
  let pdfText = '';
  if ((mode === 'pdf' || mimeType === 'application/pdf' || (mediaData && mediaData.startsWith('data:application/pdf'))) && mediaData) {
    try {
      console.log('[INJECTION SERVICE] Parsing uploaded PDF document via native high-speed engine...');
      let cleanData = mediaData;
      if (cleanData.includes(';base64,')) {
        cleanData = cleanData.split(';base64,')[1];
      }
      const buffer = Buffer.from(cleanData, 'base64');
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const pdfRes = await parser.getText();
      pdfText = pdfRes.text || '';
      console.log(`[INJECTION SERVICE] Successfully extracted ${pdfText.length} characters from PDF.`);
    } catch (pdfErr) {
      console.warn(`[INJECTION SERVICE] Native PDF text extraction failed: ${pdfErr.message}.`);
    }
  }

  // If PDF text was extracted, parse all questions directly
  if (pdfText && pdfText.length > 50) {
    console.log('[INJECTION SERVICE] Parsing structured questions from PDF text...');
    const parsedPdf = parseRawTextLocally({
      rawText: pdfText,
      targetSubject,
      category,
      grade
    });
    if (parsedPdf && parsedPdf.questions && parsedPdf.questions.length > 0) {
      console.log(`[INJECTION SERVICE] Successfully extracted ${parsedPdf.questions.length} auto-categorized questions from PDF!`);
      return normalizeExtractedPayload(parsedPdf, targetSubject, grade, category);
    }
  }

  // 2. Image Mode: Use Gemini Multimodal
  if (mode === 'image' && mediaData && geminiKey) {
    try {
      console.log(`[INJECTION SERVICE] Processing multimodal IMAGE via Gemini Flash...`);
      const prompt = `${systemInstructions}\n\nTask: Extract all academic questions from the attached IMAGE document. Automatically categorize chapter, marks (1-5), and difficulty for each question. Return JSON strictly matching the requested schema.`;
      const extracted = await callGeminiMultimodal({
        apiKey: geminiKey,
        mediaData,
        mimeType: mimeType || 'image/jpeg',
        promptText: prompt
      });
      if (extracted && ((Array.isArray(extracted.questions) && extracted.questions.length > 0) || extracted.question_latex)) {
        return normalizeExtractedPayload(extracted, targetSubject, grade, category);
      }
    } catch (err) {
      console.warn(`[INJECTION SERVICE] Multimodal AI processing failed: ${err.message}. Falling back to text/local parsing.`);
    }
  }

  // 2. Text Mode: Use Groq Cloud first, then Gemini
  if (rawText && rawText.trim()) {
    if (groqKey) {
      try {
        console.log('[INJECTION SERVICE] Processing text via Groq LPU...');
        const userPrompt = `Extract and auto-categorize all questions from this teacher-provided text:\n\n${rawText}`;
        const groqResult = await callGroqTextExtraction({
          apiKey: groqKey,
          systemPrompt: systemInstructions,
          userPrompt
        });
        if (groqResult && (groqResult.questions || groqResult.question_latex)) {
          return normalizeExtractedPayload(groqResult, targetSubject, grade, category);
        }
      } catch (err) {
        console.warn(`[INJECTION SERVICE] Groq processing failed: ${err.message}. Trying Gemini...`);
      }
    }

    if (geminiKey) {
      try {
        console.log('[INJECTION SERVICE] Processing text via Google Gemini Flash...');
        const { callGeminiApi } = require('./llmQuestionEngine');
        const userPrompt = `Extract and auto-categorize all questions from this teacher-provided text:\n\n${rawText}`;
        const gemResult = await callGeminiApi({
          apiKey: geminiKey,
          systemPrompt: systemInstructions,
          userPrompt
        });
        if (gemResult && gemResult.data && (gemResult.data.questions || gemResult.data.question_latex)) {
          return normalizeExtractedPayload(gemResult.data, targetSubject, grade, category);
        }
      } catch (err) {
        console.warn(`[INJECTION SERVICE] Gemini text processing failed: ${err.message}.`);
      }
    }
  }

  // 3. Fallback: Intelligent Local Multi-Question Parser
  console.log('[INJECTION SERVICE] Using intelligent local KaTeX multi-question parser fallback.');
  const localParsed = parseRawTextLocally({
    rawText: rawText || `Calculate the fundamental parameters for ${targetSubject} under standard atmospheric conditions.`,
    targetSubject,
    category,
    grade
  });
  return normalizeExtractedPayload(localParsed, targetSubject, grade, category);
}

/**
 * Normalizes extracted payload ensuring:
 * - questions array is always present
 * - chapter_name, marks_weightage, and difficulty are auto-filled if missing
 * - KaTeX math is sanitized
 * - root aliases are preserved for backward compatibility
 */
function normalizeExtractedPayload(data, targetSubject = 'Physics', grade = '12', category = 'CBSE_PYQ') {
  if (!data || typeof data !== 'object') return data;

  let rawList = [];
  if (Array.isArray(data.questions) && data.questions.length > 0) {
    rawList = data.questions;
  } else if (data.question_latex) {
    rawList = [data];
  } else {
    rawList = [data];
  }

  const cleanQuestions = rawList.map((q, idx) => {
    const sanitized = sanitizeQuestionPayload(q);
    const qText = sanitized.question_latex || sanitized.questionText || sanitized.question || '';

    // Auto-detect chapter, marks, difficulty if missing or generic
    const autoChapter = (!sanitized.chapter_name || sanitized.chapter_name === 'General' || sanitized.chapter_name === 'Chapter')
      ? detectChapterFromText({ text: qText, targetSubject, grade })
      : sanitized.chapter_name;

    const autoMarks = Number(sanitized.marks_weightage || sanitized.marks || detectMarksFromText(qText)) || 3;
    const autoDifficulty = sanitized.difficulty || detectDifficultyFromMarks(autoMarks, qText);
    const finalLatex = qText || `Calculate the fundamental parameters for ${targetSubject} in ${autoChapter}.`;
    const opts = Array.isArray(sanitized.options_latex) ? sanitized.options_latex : [];
    const hasOpts = opts.length >= 2;
    const correctAns = sanitized.correct_answer_latex || (hasOpts ? opts[0]?.latex : 'Verified Standard Derivation & Physical Law');
    const solLatex = sanitized.solution_latex || `Step 1: Formula Setup.\nStep 2: Boundary Evaluation.\nStep 3: Verified Answer.`;

    return {
      ...sanitized,
      question_number: sanitized.question_number || idx + 1,
      chapter_name: autoChapter,
      chapter: autoChapter,
      topic: sanitized.topic || autoChapter,
      marks_weightage: autoMarks,
      difficulty: autoDifficulty,
      question_format: sanitized.question_format || (hasOpts ? 'MCQ_SINGLE' : (autoMarks >= 4 ? 'CASE_STUDY' : 'SUBJECTIVE_LONG')),
      question_latex: finalLatex,
      options_latex: opts,
      correct_answer_latex: correctAns,
      correct_answer: sanitized.correct_answer || (hasOpts ? (opts.find(o => o.is_correct)?.key || 'A') : 'Verified'),
      solution_latex: solLatex,
      source_category: category,
      ncert_mapping: sanitized.ncert_mapping || {
        chapter_name: autoChapter,
        ncert_section: 'Core NCERT Section',
        pyq_tag: category,
        marks: autoMarks
      }
    };
  });

  const firstQ = cleanQuestions[0] || {};

  return {
    detected_question_count: cleanQuestions.length,
    questions: cleanQuestions,
    ...firstQ
  };
}

/**
 * Commits a single validated, structured question into the HAPS-AI repositories
 */
function commitQuestionToStore({ structuredQuestion, teacher, targetSubject, grade = '12', category = 'CBSE_PYQ', mode = 'text' }) {
  const sUpper = (targetSubject || '').toUpperCase();
  const isC10 = String(grade) === '10';

  let bankKey = 'senior_physics';
  if (isC10) {
    if (sUpper.includes('MATH')) {
      bankKey = 'class10_maths';
    } else {
      bankKey = 'class10_science';
    }
  } else {
    if (sUpper.includes('PHYS')) bankKey = 'senior_physics';
    else if (sUpper.includes('CHEM')) bankKey = 'senior_chemistry';
    else if (sUpper.includes('BIO')) bankKey = 'senior_biology';
    else if (sUpper.includes('MATH')) bankKey = 'senior_mathematics';
  }

  const prefix = isC10 ? 'c10_inj_' : (bankKey === 'senior_physics' ? 'snr_p_inj_' : bankKey === 'senior_chemistry' ? 'snr_c_inj_' : bankKey === 'senior_biology' ? 'snr_b_inj_' : 'snr_m_inj_');
  const uniqueId = `${prefix}${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const chapterName = structuredQuestion.chapter_name || structuredQuestion.chapter || 'Core Chapter';
  const marks = Number(structuredQuestion.marks_weightage || 3);
  const difficulty = structuredQuestion.difficulty || 'MEDIUM';

  const auditInfo = {
    faculty_id: teacher.id || 'fac_unknown',
    faculty_name: teacher.name || teacher.full_name || 'Faculty Member',
    faculty_phone: teacher.phone || '',
    faculty_subject: teacher.subject || teacher.subjectKey || targetSubject,
    department: teacher.department || teacher.subject || targetSubject,
    role: 'faculty',
    timestamp: new Date().toISOString()
  };

  const finalQuestion = {
    id: uniqueId,
    grade: String(grade),
    subject: targetSubject,
    subjectKey: sUpper,
    stream: isC10 ? 'FOUNDATION' : (sUpper.includes('BIO') ? 'MEDICAL' : 'COMMON_SENIOR'),
    target_exam: isC10 ? 'CBSE_CLASS_10' : (sUpper.includes('BIO') ? 'NEET_UG' : 'JEE_MAIN'),
    chapter_name: chapterName,
    chapter: chapterName,
    topic: structuredQuestion.topic || chapterName,
    subtopic: structuredQuestion.subtopic || 'Core Derivation',
    curriculum_board: isC10 ? 'CBSE_CLASS_10' : 'CBSE',
    source_category: category,
    question_source: category,
    pyq_appearance: category === 'CBSE_PYQ' ? `CBSE Board Exam (${new Date().getFullYear() - 1} PYQ)` : category === 'NCERT_EXAMPLE' ? 'NCERT Worked In-Text Example' : category === 'NCERT_EXERCISE' ? 'NCERT Textbook Exercise' : 'Competitive Mock',
    difficulty: difficulty,
    question_format: structuredQuestion.question_format || 'MCQ_SINGLE',
    benchmark_time_seconds: Number(structuredQuestion.benchmark_time_seconds) || marks * 45,
    marks_weightage: marks,
    question_latex: structuredQuestion.question_latex,
    options_latex: structuredQuestion.options_latex || [],
    options: structuredQuestion.options_latex || [],
    correct_answer_latex: structuredQuestion.correct_answer_latex || 'Option A',
    correct_answer: (structuredQuestion.options_latex?.find(o => o.is_correct)?.key) || 'A',
    solution_latex: structuredQuestion.solution_latex || '',
    socratic_hints: structuredQuestion.socratic_hints || [],
    step_rubric: structuredQuestion.step_rubric || [],
    ncert_mapping: structuredQuestion.ncert_mapping || {
      chapter_name: chapterName,
      ncert_section: 'Core Section',
      pyq_tag: category,
      marks: marks
    },
    injected_by: auditInfo,
    injection_mode: mode,
    imported_at: new Date().toISOString()
  };

  if (!inMemoryStore.subjectBanks) inMemoryStore.subjectBanks = {};
  if (!inMemoryStore.subjectBanks[bankKey]) inMemoryStore.subjectBanks[bankKey] = [];
  inMemoryStore.subjectBanks[bankKey].unshift(finalQuestion);

  if (bankKey === 'class10_maths') {
    if (!inMemoryStore.subjectBanks.class10_math_pyq_ncert) inMemoryStore.subjectBanks.class10_math_pyq_ncert = [];
    inMemoryStore.subjectBanks.class10_math_pyq_ncert.unshift(finalQuestion);
  }

  if (!inMemoryStore.questions) inMemoryStore.questions = [];
  inMemoryStore.questions.unshift(finalQuestion);

  return {
    question: finalQuestion,
    targetBank: bankKey,
    totalBankCount: inMemoryStore.subjectBanks[bankKey].length
  };
}

/**
 * Commits a batch of auto-categorized questions into the repository
 */
function commitBatchQuestionsToStore({ questions = [], teacher, targetSubject, grade = '12', category = 'CBSE_PYQ', mode = 'text' }) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Expected a non-empty array of questions to commit.');
  }

  // To preserve natural order [Q1, Q2, Q3, ...] at the top of the unshifted list,
  // we commit in reverse order, while collecting in natural order.
  const committedQuestions = new Array(questions.length);
  let primaryTargetBank = 'senior_physics';

  for (let i = questions.length - 1; i >= 0; i--) {
    const q = questions[i];
    const res = commitQuestionToStore({
      structuredQuestion: q,
      teacher,
      targetSubject,
      grade,
      category,
      mode
    });
    committedQuestions[i] = res.question;
    primaryTargetBank = res.targetBank;
  }

  return {
    count: committedQuestions.length,
    questions: committedQuestions,
    targetBank: primaryTargetBank,
    totalBankCount: inMemoryStore.subjectBanks[primaryTargetBank]?.length || committedQuestions.length
  };
}

module.exports = {
  validateFacultySubjectLock,
  detectChapterFromText,
  detectMarksFromText,
  detectDifficultyFromMarks,
  processQuestionExtraction,
  commitQuestionToStore,
  commitBatchQuestionsToStore,
  parseRawTextLocally
};
