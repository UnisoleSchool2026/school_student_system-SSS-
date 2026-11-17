// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: QUESTION INJECTION SERVICE
// Faculty-Locked, Multimodal (Text/LaTeX, Image, PDF) Ingestion Pipeline
// Full Auto-Categorization: Automatically classifies Chapter, Marks, & Difficulty
// Grounded in NCERT, CBSE PYQs, Worked Examples & Exercises
// ============================================================================

try { require('dotenv').config(); } catch (_) {}
const dataPaths = require('../config/dataPaths');
const fs = require('fs');
const path = require('path');
const { inMemoryStore } = require('../config/database');
const { sanitizeLatexString, sanitizeOptionFormula, sanitizeQuestionPayload } = require('./llmQuestionEngine');
const { CURRICULUM_TAXONOMY } = require('./curriculumTaxonomy');
const examPatterns = require('./examPatternRegistry');
const { computeContentHash, validateQuestionInvariants, STATUS_LIFECYCLE } = require('./questionCanonicalSchema');

// Universal Web Standards Polyfills for Serverless Node (Vercel / AWS Lambda)
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(init) {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
      this.is2D = true;
      this.isIdentity = true;
      if (Array.isArray(init) && init.length === 6) {
        this.a = init[0]; this.b = init[1]; this.c = init[2]; this.d = init[3]; this.e = init[4]; this.f = init[5];
      }
    }
    multiply(other) { return this; }
    translate(x, y) { return this; }
    scale(x, y) { return this; }
    rotate(angle) { return this; }
    inverse() { return this; }
    transformPoint(point) { return point; }
  };
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D { };
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(w = 1, h = 1) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); }
  };
}

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
  const isG11 = String(grade) === '11';
  const isC10 = String(grade) === '10';

  // 1. PHYSICS
  if (sUpper.includes('PHYS')) {
    if (isG11) {
      // Class 11 Physics (14 Chapters)
      if (lower.includes('dimension') || lower.includes('significant figure') || lower.includes('error in measurement') || lower.includes('si unit') || lower.includes('vernier') || lower.includes('screw gauge')) return 'Units and Measurements';
      if (lower.includes('straight line') || lower.includes('free fall') || lower.includes('stopping distance') || lower.includes('instantaneous velocity') || lower.includes('acceleration due to gravity g')) return 'Motion in a Straight Line';
      if (lower.includes('projectile') || lower.includes('trajectory') || lower.includes('range of projectile') || lower.includes('centripetal') || lower.includes('horizontal range') || lower.includes('maximum height')) return 'Motion in a Plane';
      if (lower.includes('friction') || lower.includes('banking') || lower.includes('momentum') || lower.includes('tension') || lower.includes('free body') || lower.includes('newton')) return 'Laws of Motion';
      if (lower.includes('work done') || lower.includes('work-energy') || lower.includes('spring constant') || lower.includes('potential energy of a spring') || lower.includes('collision') || lower.includes('power in watt')) return 'Work, Energy and Power';
      if (lower.includes('moment of inertia') || lower.includes('rolling') || lower.includes('torque') || lower.includes('angular momentum') || lower.includes('center of mass') || lower.includes('radius of gyration') || lower.includes('solid cylinder') || lower.includes('solid sphere') || lower.includes('flywheel') || lower.includes('disc')) return 'System of Particles and Rotational Motion';
      if (lower.includes('gravitat') || lower.includes('kepler') || lower.includes('escape velocity') || lower.includes('orbital velocity') || lower.includes('satellite') || lower.includes('geostationary')) return 'Gravitation';
      if (lower.includes('young\'s modulus') || lower.includes('stress') || lower.includes('strain') || lower.includes('hooke') || lower.includes('bulk modulus') || lower.includes('shear modulus') || lower.includes('elastic potential')) return 'Mechanical Properties of Solids';
      if (lower.includes('bernoulli') || lower.includes('viscos') || lower.includes('surface tension') || lower.includes('terminal velocity') || lower.includes('poiseuille') || lower.includes('stokes') || lower.includes('capillary') || lower.includes('pascal') || lower.includes('hydraulic')) return 'Mechanical Properties of Fluids';
      if (lower.includes('thermal expansion') || lower.includes('calorimet') || lower.includes('latent heat') || lower.includes('conduction') || lower.includes('convection') || lower.includes('radiation') || lower.includes('thermal conductivity') || lower.includes('newton\'s law of cooling') || lower.includes('wien') || lower.includes('stefan')) return 'Thermal Properties of Matter';
      if (lower.includes('carnot') || lower.includes('entropy') || lower.includes('adiabatic') || lower.includes('isothermal') || lower.includes('first law of thermodynamics') || lower.includes('second law of thermodynamics') || lower.includes('mayer') || lower.includes('cp - cv')) return 'Thermodynamics';
      if (lower.includes('mean free path') || lower.includes('rms speed') || lower.includes('kinetic theory') || lower.includes('ideal gas') || lower.includes('equipartition') || lower.includes('degrees of freedom')) return 'Kinetic Theory';
      if (lower.includes('simple harmonic') || lower.includes('oscillation') || lower.includes('pendulum') || lower.includes('damped') || lower.includes('shm') || lower.includes('time period of oscillation')) return 'Oscillations';
      if (lower.includes('sound wave') || lower.includes('standing wave') || lower.includes('organ pipe') || lower.includes('beats') || lower.includes('doppler') || lower.includes('transverse wave') || lower.includes('longitudinal wave') || lower.includes('speed of sound')) return 'Waves';
      return 'System of Particles and Rotational Motion';
    }

    // Class 12 Physics (14 Chapters)
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
    // Fallback to Class 11 if generic mechanics keyword present
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
// Picks up an exam + year written in the question, e.g. "[CBSE 2023]", "(JEE Main 2024)", "NEET-2022".
function detectExamYearFromText(text = '') {
  const t = String(text).toUpperCase();
  const m = t.match(/(CBSE|HPBOSE|HP\s*BOARD|JEE\s*-?\s*ADVANCED|JEE\s*-?\s*MAIN|JEE|NEET|AIPMT)[^0-9\n]{0,15}((?:19|20)\d{2})/);
  if (m) {
    const exam = m[1].replace(/\s*-\s*|\s+/g, ' ').trim().replace('HPBOSE', 'HP BOARD').replace('JEE ADVANCED', 'JEE Advanced').replace('JEE MAIN', 'JEE Main').replace('HP BOARD', 'HP Board');
    return { exam, year: m[2] };
  }
  const y = t.match(/[\[(]\s*((?:19|20)\d{2})\s*[\])]/);
  return { exam: null, year: y ? y[1] : null };
}

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

  // Strip Markdown code fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return { questions: parsed };
    }
    return parsed;
  } catch (e) {
    // Try matching JSON array: [ ... ]
    const arrMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrMatch) {
      try {
        const arr = JSON.parse(arrMatch[0]);
        if (Array.isArray(arr)) return { questions: arr };
      } catch (eArr) { }
    }
    // Try matching JSON object: { ... }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) { }
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
  let answerKey = null; // only set when the teacher's text states it (never invented)
  let solutionText = '';

  const answerRegex = /^(?:answer|ans|correct(?:\s+(?:answer|option))?|key)\s*[:.\-)]\s*(?:option\s*)?\(?([A-D])\)?(?:\s|$|[.)])/i;
  // Anchored to the start of a line: the word "solution" inside a question ("molarity of a solution")
  // must not swallow the question as if it were the worked solution.
  const solutionRegex = /^(?:solution|sol|explanation|working|step\s*\d*)\s*[:.\-]\s*(.*)$/i;

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
  const optionRegex = /(?:\(([A-Da-d])\)|(?:\b|^)([A-Da-d])\))\s*([^(\n\r]+?)(?=\s*(?:\([A-Da-d]\)|(?:\b)[A-Da-d]\))|[\n\r]|$)/g;
  let optMatch;
  while ((optMatch = optionRegex.exec(promptBlock)) !== null) {
    const key = (optMatch[1] || optMatch[2]).toUpperCase();
    const val = optMatch[3].trim().replace(/\s+/g, ' ');
    if (val.length > 0 && !options.some(o => o.key === key) && !isAssertionReason) {
      options.push({
        key,
        latex: sanitizeOptionFormula(val),
        is_correct: key === answerKey,
        distractor_trap: null
      });
    }
  }
  // A real MCQ has exactly the options A-D (or A-B for true/false style); sub-parts such as
  // "(a) define ... (b) derive ..." in a subjective question are not options.
  const optionKeys = options.map(o => o.key).join('');
  if (!isAssertionReason && options.length && !['AB', 'ABC', 'ABCD'].includes(optionKeys)) options.length = 0;
  if (!isAssertionReason && options.length && options.some(o => o.latex.length > 160)) options.length = 0;

  // If Assertion-Reason question, populate official CBSE standard options
  if (isAssertionReason) {
    options.length = 0;
    options.push(
      { key: 'A', latex: 'Both Assertion (A) and Reason (R) are true and Reason (R) is the correct explanation of Assertion (A).', is_correct: false, distractor_trap: null },
      { key: 'B', latex: 'Both Assertion (A) and Reason (R) are true, but Reason (R) is NOT the correct explanation of Assertion (A).', is_correct: false, distractor_trap: 'Failed to verify independent reasoning linkage' },
      { key: 'C', latex: 'Assertion (A) is true, but Reason (R) is false.', is_correct: false, distractor_trap: 'Mismatched physical validity of premise' },
      { key: 'D', latex: 'Both Assertion (A) and Reason (R) are false.', is_correct: false, distractor_trap: 'Overgeneralized incorrect physical law' }
    );
  }

  // Isolate question prompt text before options
  if (options.length >= 2 && !isAssertionReason) {
    const firstOptIdx = promptBlock.search(/(?:\([A-Da-d]\)|(?:\b|^)[A-Da-d]\))\s*/);
    if (firstOptIdx !== -1) {
      questionPrompt = promptBlock.slice(0, firstOptIdx).trim();
    } else {
      questionPrompt = promptBlock;
    }
  } else {
    questionPrompt = promptBlock;
  }

  // Strip leading question number and trailing marks column digits, then normalize LaTeX
  questionPrompt = questionPrompt.replace(/^(?:Q(?:uestion)?\.?\s*)?\d+[\.:\)]\s*/i, '').trim();
  questionPrompt = sanitizeLatexString(questionPrompt);

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
  if (hasOptions && !text.match(/marks?\b/i)) detectedMarks = 1;
  const lowerText = text.toLowerCase();
  const questionFormat = isAssertionReason ? 'ASSERTION_REASON'
    : hasOptions ? 'MCQ_SINGLE'
    : /case[\s-]*(?:study|based)|read the (?:following )?(?:passage|paragraph)/.test(lowerText) ? 'CASE_STUDY'
    : detectedMarks <= 1 ? 'VERY_SHORT_ANSWER'
    : detectedMarks <= 3 ? 'SHORT_ANSWER'
    : 'LONG_ANSWER';

  if (hasOptions) {
    options.forEach(opt => {
      opt.is_correct = (opt.key === answerKey);
      if (opt.is_correct) opt.distractor_trap = null;
    });
  }

  // No answer key in the pasted text -> leave it empty; the teacher picks it in the preview.
  const correctOpt = hasOptions ? options.find(o => o.is_correct) || null : null;
  const correctAns = correctOpt ? correctOpt.latex : '';
  const examYear = detectExamYearFromText(text);

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
    correct_answer: correctOpt ? correctOpt.key : null,
    answer_key_missing: hasOptions && !correctOpt,
    solution_latex: solutionText,
    exam_tag: examYear.exam,
    pyq_year: examYear.year,
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

  // Pre-clean PUA characters, symbol fonts, wave symbols and scientific exponents across raw document
  const normalizedRaw = sanitizeLatexString(rawText);

  // 1. Check if document has numbered questions like 1. ... 2. ... (CBSE / State Board paper)
  const lines = normalizedRaw.split('\n');
  const questionsMap = new Map();
  let currentQ = null;
  let hasNumberedStructure = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Filter out header/footer/section boilerplate
    if (/^(?:SECTION\s+[A-E]|खण्ड\s+[क-ङ]|Questions?\s+\d+\s+to\s+\d+|General\s+Instructions|P\.?T\.?O\.?|Page\s+\d+|~\s*\d+[\/\d]*\s*~|नोट\s*NOTE|Time\s*Allowed|Maximum\s*Marks)/i.test(rawLine)) {
      continue;
    }

    // Detect question header e.g. "1. A particle...", "Q1. ...", "Question 1: ...", "1)", "1.\n"
    const qMatch = rawLine.match(/^(?:Q(?:uestion)?\.?\s*)?([0-9]{1,4})(?:[\.:\)]|\s+|$)\s*(.*)$/i);
    if (qMatch) {
      const qNum = parseInt(qMatch[1], 10);
      const rest = (qMatch[2] || '').trim();

      if (qNum >= 1 && qNum <= 1000) {
        currentQ = qNum;
        hasNumberedStructure = true;
        if (!questionsMap.has(currentQ)) {
          questionsMap.set(currentQ, []);
        }

        // Clean Devanagari Hindi text from header line if mixed
        const cleanRest = rest.replace(/[\u0900-\u097F]+/g, '').trim();
        if (cleanRest && (/[a-zA-Z]/.test(cleanRest) || /[\$\\\=\+\-\*\/\(\)]/.test(cleanRest))) {
          questionsMap.get(currentQ).push(cleanRest);
        }
        continue;
      }
    }

    if (currentQ) {
      // Ignore lines containing only Devanagari Hindi characters without English words
      const isDevanagariOnly = /[\u0900-\u097F]/.test(rawLine) && !/[a-zA-Z]{2,}/.test(rawLine);
      if (isDevanagariOnly) continue;

      // Filter out pure Devanagari prefixes in mixed lines, keeping English LaTeX, math & options
      const cleanLine = rawLine.replace(/[\u0900-\u097F]+/g, '').trim();
      if (cleanLine) {
        questionsMap.get(currentQ).push(cleanLine);
      }
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
 * Multimodal extraction using Google Gemini (photos of question papers, scanned PDFs).
 * Uses the best vision model this key can use (see services/geminiClient.js).
 * mediaList: one or more data URLs (several photos of the same paper are read together).
 */
async function callGeminiMultimodal({ apiKey, mediaData, mediaList, mimeType, promptText }) {
  const { generateJson, inlinePart } = require('./geminiClient');
  const list = (Array.isArray(mediaList) && mediaList.length ? mediaList : [mediaData]).filter(Boolean);
  const parts = [];
  list.forEach((m, i) => {
    if (list.length > 1) parts.push({ text: `Photo ${i + 1} of ${list.length}:` });
    parts.push(inlinePart(m, mimeType || 'image/jpeg'));
  });
  parts.push({ text: promptText });
  const { data, model } = await generateJson({ parts, kind: 'vision', temperature: 0.1, timeoutMs: 90000, key: apiKey });
  console.log(`[INJECTION SERVICE] Vision extraction answered by ${model}.`);
  return data;
}

/**
 * Text extraction using Groq Cloud API with LPU acceleration
 */
async function callGroqTextExtraction({ apiKey, systemPrompt, userPrompt }) {
  const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
  let lastError = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
          max_tokens: 3500
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errText}`);
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      return cleanAndParseJson(content);
    } catch (err) {
      lastError = err;
      console.warn(`[INJECTION SERVICE] Groq model ${model} failed: ${err.message}. Trying next...`);
    }
  }

  throw lastError || new Error('All Groq extraction models failed.');
}

// Extra rules for reading photos and scans: copy what is printed, never invent, and locate figures.
function VISION_RULES(photoCount) {
  return `Task: read the ${photoCount > 1 ? photoCount + ' attached photos (pages of the same paper, in order)' : 'attached photo'} of a question paper, worksheet or book page and extract EVERY question on it.
PHOTO RULES (these override the general rules above where they differ):
- Copy each question exactly as printed or handwritten, in the same order and with its printed number. Do not reword, shorten, summarise or "improve" it.
- The photo may be tilted, curved, shadowed, low-light or partly handwritten. Read carefully; if a word or symbol cannot be read, write [unclear] in its place. Never guess numbers or units.
- Write all mathematics, chemical formulae, units and symbols in KaTeX ($...$). Keep subscripts, superscripts, fractions, vectors, Greek letters and units exactly.
- Options: only if the question shows options. Copy them verbatim with their original letters (a/b/c/d or A/B/C/D, written as A-D). Do NOT invent options or distractor traps for questions that have none; use "options_latex": [] for those.
- Answers: mark is_correct / correct_answer_latex only if an answer key is printed on the page, or you have solved it and are certain. Otherwise leave is_correct false for every option and correct_answer_latex "".
- Marks: use the marks printed next to the question (e.g. "[2]", "(3 marks)") when visible.
- Sub-parts (a), (b), (i), (ii) belong to the same question unless they are numbered as separate questions.
- Ignore page headers, footers, watermarks, roll-number boxes and instructions that are not questions.
- FIGURES: if a question has a diagram, circuit, graph, table or figure, set "has_figure": true, describe it in one line in "figure_description", say which photo it is in with "figure_image_index" (1-based) and give its tight bounding box as "figure_box_2d": [ymin, xmin, ymax, xmax] on a 0-1000 scale of that photo. Do not include the question text in the box.
- If the photo contains no readable questions, return {"detected_question_count": 0, "questions": []}.
Return ONLY JSON matching the schema, with the extra keys has_figure, figure_description, figure_image_index, figure_box_2d where they apply.`;
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
  mediaList = [],
  mimeType = 'image/jpeg',
  targetSubject = 'Physics',
  grade = '12',
  category = 'CBSE_PYQ'
}) {
  const images = (Array.isArray(mediaList) ? mediaList : []).filter(m => typeof m === 'string' && m.startsWith('data:image/')).slice(0, 6);
  if (!images.length && mediaData && String(mediaData).startsWith('data:image/')) images.push(mediaData);
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();

  const categoryLabel = category === 'CBSE_PYQ' ? 'CBSE / Board PYQ (Previous Year Question)'
    : category === 'NCERT_EXAMPLE' ? 'NCERT Worked In-Text Example'
      : category === 'NCERT_EXERCISE' ? 'NCERT End-of-Chapter Exercise Question'
        : category === 'NCERT_EXEMPLAR' ? 'NCERT Exemplar Problem'
          : category === 'CBSE_SAMPLE_PATTERN' ? 'CBSE Sample Paper Pattern Question'
            : 'Competitive Examination (JEE / NEET) Practice';

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

      // Ensure worker file exists in dist/pdf-parse/cjs/
      try {
        const fs = require('fs');
        const path = require('path');
        let cjsWorker;
        try {
          const pdfParseRoot = path.dirname(require.resolve('pdf-parse/package.json'));
          cjsWorker = path.join(pdfParseRoot, 'dist/pdf-parse/cjs/pdf.worker.mjs');
        } catch (_) {
          cjsWorker = path.resolve(__dirname, '../../node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs');
        }
        if (cjsWorker && !fs.existsSync(cjsWorker)) {
          const workerModule = require('pdf-parse/worker');
          const data = typeof workerModule.getData === 'function' ? workerModule.getData() : null;
          if (data) {
            fs.mkdirSync(path.dirname(cjsWorker), { recursive: true });
            fs.writeFileSync(cjsWorker, data);
            console.log('[INJECTION SERVICE] Restored pdf.worker.mjs in cjs directory.');
          }
        }
      } catch (wErr) {
        // Continue if worker file creation fails
      }

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
  let lastMultimodalError = null;
  if (mode === 'image' && images.length && geminiKey) {
    try {
      console.log(`[INJECTION SERVICE] Processing multimodal IMAGE via Gemini Flash...`);
      const prompt = `${systemInstructions}\n\n${VISION_RULES(images.length)}`;
      const extracted = await callGeminiMultimodal({
        apiKey: geminiKey,
        mediaList: images,
        mimeType: mimeType || 'image/jpeg',
        promptText: prompt
      });
      if (extracted && (
        Array.isArray(extracted) ||
        (Array.isArray(extracted.questions) && extracted.questions.length > 0) ||
        (Array.isArray(extracted.items) && extracted.items.length > 0) ||
        extracted.question_latex ||
        extracted.question ||
        extracted.questionText
      )) {
        return normalizeExtractedPayload(extracted, targetSubject, grade, category);
      }
    } catch (err) {
      lastMultimodalError = err;
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
        if (groqResult && (
          Array.isArray(groqResult) ||
          (Array.isArray(groqResult.questions) && groqResult.questions.length > 0) ||
          (Array.isArray(groqResult.items) && groqResult.items.length > 0) ||
          groqResult.question_latex ||
          groqResult.question ||
          groqResult.questionText
        )) {
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
        const gData = gemResult?.data;
        if (gData && (
          Array.isArray(gData) ||
          (Array.isArray(gData.questions) && gData.questions.length > 0) ||
          (Array.isArray(gData.items) && gData.items.length > 0) ||
          gData.question_latex ||
          gData.question ||
          gData.questionText
        )) {
          return normalizeExtractedPayload(gData, targetSubject, grade, category);
        }
      } catch (err) {
        console.warn(`[INJECTION SERVICE] Gemini text processing failed: ${err.message}.`);
      }
    }
  }

  // Nothing readable: an image needs the vision model, and a scanned PDF has no text layer.
  // Say so instead of inventing a placeholder question.
  if (!rawText || !rawText.trim()) {
    const why = mode === 'image'
      ? (geminiKey ? `The AI vision service could not extract readable questions from this image${lastMultimodalError ? ` (${lastMultimodalError.message})` : ''}.` : 'Reading questions from an image needs the AI vision service (GEMINI_API_KEY), which is not configured on this server.')
      : mode === 'pdf'
        ? 'No text could be read from this PDF (it may be a scanned image).' + (geminiKey ? '' : ' Scanned PDFs need the AI vision service (GEMINI_API_KEY).')
        : 'No question text was provided.';
    const err = new Error(`${why} Please paste the question text in "Paste Text" mode instead.`);
    err.code = 'EXTRACTION_UNREADABLE';
    throw err;
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
  if (Array.isArray(data)) {
    rawList = data;
  } else if (Array.isArray(data.questions) && data.questions.length > 0) {
    rawList = data.questions;
  } else if (Array.isArray(data.items) && data.items.length > 0) {
    rawList = data.items;
  } else if (data.question_latex || data.questionText || data.question) {
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
    const keyedOpt = hasOpts ? opts.find(o => o.is_correct) : null;
    const correctAns = sanitized.correct_answer_latex || (keyedOpt ? keyedOpt.latex : '');
    const solLatex = sanitized.solution_latex || '';

    return {
      ...sanitized,
      question_number: sanitized.question_number || idx + 1,
      chapter_name: autoChapter,
      chapter: autoChapter,
      topic: sanitized.topic || autoChapter,
      marks_weightage: autoMarks,
      difficulty: autoDifficulty,
      question_format: sanitized.question_format || (hasOpts ? 'MCQ_SINGLE' : (autoMarks >= 4 ? 'LONG_ANSWER' : 'SHORT_ANSWER')),
      question_latex: finalLatex,
      options_latex: opts,
      correct_answer_latex: correctAns,
      correct_answer: sanitized.correct_answer || (keyedOpt ? keyedOpt.key : null),
      answer_key_missing: hasOpts && !(sanitized.correct_answer || keyedOpt),
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
// Source label stored with an injected question. A year is written only when the teacher's
// text or the preview supplied one, so the "Exam & Year" filter never shows an invented year.
function buildInjectedAppearance(category, q = {}, subjectUpper = '') {
  const year = q.pyq_year ? String(q.pyq_year) : '';
  const exam = q.exam_tag ? String(q.exam_tag) : '';
  switch (category) {
    case 'CBSE_PYQ': {
      const board = /HP/i.test(exam) ? 'HP Board' : 'CBSE Board';
      return year ? `${board} ${year} PYQ` : `${board} PYQ (year not tagged)`;
    }
    case 'NCERT_EXAMPLE': return 'NCERT Solved Example';
    case 'NCERT_EXERCISE': return 'NCERT Textbook Exercise';
    case 'NCERT_EXEMPLAR': return 'NCERT Exemplar';
    case 'CBSE_SAMPLE_PATTERN': return 'CBSE Sample Paper Pattern';
    case 'COMPETITIVE_OTHER': {
      const e = exam && /JEE|NEET|AIPMT/i.test(exam) ? exam : (subjectUpper.includes('BIO') ? 'NEET' : 'JEE Main');
      return year ? `${e} ${year}` : `${e} Practice`;
    }
    default: return 'Teacher Added';
  }
}

function commitQuestionToStore({ structuredQuestion, teacher, targetSubject, grade = '12', category = 'CBSE_PYQ', mode = 'text', examMode, examTrack, persistImmediately = true }) {
  const sUpper = (targetSubject || '').toUpperCase();
  const isC10 = String(grade) === '10';

  const normMode = String(examMode || structuredQuestion.mode || structuredQuestion.target_modes?.[0] || '').trim().toUpperCase();
  const normTrack = examPatterns.normalizeKey(examTrack || structuredQuestion.track || structuredQuestion.curriculum_board || structuredQuestion.board || structuredQuestion.stream || '');

  // Non-negotiable: Mode and track are strictly required. Never default silently.
  if (!normMode || !['BOARD', 'COMPETITIVE'].includes(normMode)) {
    const err = new Error('Ingestion Error: Mode ("BOARD" or "COMPETITIVE") is strictly required to commit question.');
    err.status = 400;
    err.code = 'MODE_REQUIRED';
    throw err;
  }
  if (!normTrack) {
    const err = new Error(`Ingestion Error: Track (board or stream) is strictly required for ${normMode} mode.`);
    err.status = 400;
    err.code = 'TRACK_REQUIRED';
    throw err;
  }

  let targetModes = [normMode];
  let boardTargets = [];
  let competitiveTargets = [];
  let targetExam = '';
  let curriculumBoard = normTrack;

  if (normMode === 'BOARD') {
    boardTargets = [normTrack];
    targetExam = isC10 ? `${normTrack}_CLASS_10` : `${normTrack}_BOARD`;
  } else if (normMode === 'COMPETITIVE') {
    const compTrack = normTrack.startsWith('JEE') ? 'JEE_MAIN' : (normTrack === 'NEET' ? 'NEET' : normTrack);
    competitiveTargets = [compTrack];
    targetExam = compTrack === 'NEET' ? 'NEET_UG' : 'JEE_MAIN';
  }

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
  const marks = normMode === 'BOARD' ? Number(structuredQuestion.marks_weightage || structuredQuestion.marks || 3) : null;
  const difficulty = structuredQuestion.difficulty || 'MEDIUM';

  // Compute deterministic content hash for idempotency and duplicate prevention
  const contentHash = computeContentHash({
    question_latex: structuredQuestion.question_latex,
    options_latex: structuredQuestion.options_latex || structuredQuestion.options,
    marks: marks || 0
  });

  // Deduplication check: Do not re-insert identical questions
  const existingQuestions = inMemoryStore.subjectBanks?.[bankKey] || [];
  const existingDup = existingQuestions.find(q => q && (q.contentHash === contentHash || q.content_hash === contentHash));
  if (existingDup) {
    console.log(`[INJECTION SERVICE] Duplicate question detected (hash: ${contentHash.slice(0, 12)}..., id: ${existingDup.id}). Skipping insertion.`);
    return {
      question: existingDup,
      duplicate: true,
      targetBank: bankKey,
      totalBankCount: existingQuestions.length
    };
  }

  const auditInfo = {
    faculty_id: teacher.id || 'fac_unknown',
    faculty_name: teacher.name || teacher.full_name || 'Faculty Member',
    faculty_phone: teacher.phone || '',
    faculty_subject: teacher.subject || teacher.subjectKey || targetSubject,
    department: teacher.department || teacher.subject || targetSubject,
    role: 'faculty',
    timestamp: new Date().toISOString()
  };

  const isSubjectiveFormat = ['SHORT_ANSWER', 'LONG_DERIVATION', 'CASE_BASED', 'NUMERICAL', 'SUBJECTIVE_DERIVATION']
    .some(f => (structuredQuestion.question_format || '').toUpperCase().includes(f));

  let finalOptions = Array.isArray(structuredQuestion.options_latex) && structuredQuestion.options_latex.length > 0
    ? structuredQuestion.options_latex.map(o => ({ ...o }))
    : [];

  if (isSubjectiveFormat) {
    finalOptions = [];
  } else if (finalOptions.length > 0 && finalOptions.length < 4) {
    const keys = ['A', 'B', 'C', 'D'];
    const usedKeys = new Set(finalOptions.map(o => (o.key || '').toUpperCase()));
    for (const k of keys) {
      if (finalOptions.length >= 4) break;
      if (!usedKeys.has(k)) {
        finalOptions.push({
          key: k,
          latex: `$\\text{None of the above}$`,
          is_correct: false,
          distractor_trap: null
        });
        usedKeys.add(k);
      }
    }
  }

  const rawQuestion = {
    id: uniqueId,
    contentHash: contentHash,
    status: structuredQuestion.status || STATUS_LIFECYCLE.APPROVED,
    grade: String(grade),
    subject: targetSubject,
    subjectKey: sUpper,
    stream: isC10 ? 'FOUNDATION' : (sUpper.includes('BIO') ? 'MEDICAL' : 'COMMON_SENIOR'),
    target_modes: targetModes,
    board_targets: boardTargets,
    competitive_targets: competitiveTargets,
    target_exam: targetExam,
    chapter_name: chapterName,
    chapter: chapterName,
    topic: structuredQuestion.topic || chapterName,
    subtopic: structuredQuestion.subtopic || 'Core Derivation',
    curriculum_board: curriculumBoard,
    source_category: category,
    question_source: category,
    pyq_appearance: buildInjectedAppearance(category, structuredQuestion, sUpper),
    difficulty: difficulty,
    question_format: isSubjectiveFormat ? (structuredQuestion.question_format || 'SHORT_ANSWER') : (finalOptions.length >= 2 ? 'MCQ_SINGLE' : 'SHORT_ANSWER'),
    benchmark_time_seconds: Number(structuredQuestion.benchmark_time_seconds) || (marks ? marks * 45 : 120),
    marks_weightage: marks,
    marks: marks,
    question_latex: structuredQuestion.question_latex,
    options_latex: finalOptions,
    options: finalOptions,
    correct_answer_latex: structuredQuestion.correct_answer_latex || (finalOptions.find(o => o.is_correct)?.latex) || '',
    correct_answer: (finalOptions.find(o => o.is_correct)?.key) || structuredQuestion.correct_answer || null,
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

  // Enforce canonical invariant validation
  validateQuestionInvariants(rawQuestion);

  const finalQuestion = sanitizeQuestionPayload(rawQuestion);

  if (!inMemoryStore.subjectBanks) inMemoryStore.subjectBanks = {};
  if (!inMemoryStore.subjectBanks[bankKey]) inMemoryStore.subjectBanks[bankKey] = [];
  inMemoryStore.subjectBanks[bankKey].unshift(finalQuestion);

  if (bankKey === 'class10_maths') {
    if (!inMemoryStore.subjectBanks.class10_math_pyq_ncert) inMemoryStore.subjectBanks.class10_math_pyq_ncert = [];
    inMemoryStore.subjectBanks.class10_math_pyq_ncert.unshift(finalQuestion);
  }

  if (!inMemoryStore.questions) inMemoryStore.questions = [];
  inMemoryStore.questions.unshift(finalQuestion);

  // Persist question to disk so it survives server restarts and lambda recycles
  if (persistImmediately) {
    try {
      savePersistedCustomQuestions([finalQuestion]);
    } catch (err) {
      console.warn('[QUESTION PERSISTENCE] Warning while saving question to disk:', err.message);
    }
  }

  return {
    question: finalQuestion,
    targetBank: bankKey,
    totalBankCount: inMemoryStore.subjectBanks[bankKey].length
  };
}

/**
 * Storage paths for permanent question persistence across restarts and serverless lambdas
 */
// Read order: runtime copy (backend/data), committed starting data, /tmp fallback.
// Writes go to the runtime copy only (/tmp if the data folder is read-only); the committed file is never changed.
function getCustomQuestionsStoragePaths() {
  return [
    dataPaths.runtimePath('custom_injected_questions.json'),
    path.join(__dirname, '..', 'database', 'custom_injected_questions.json'),
    '/tmp/custom_injected_questions.json'
  ];
}
function getCustomQuestionsWritePaths() {
  return [dataPaths.runtimePath('custom_injected_questions.json'), '/tmp/custom_injected_questions.json'];
}

/**
 * Reads all custom injected questions from persistent JSON file
 */
function loadPersistedCustomQuestions() {
  const paths = getCustomQuestionsStoragePaths();
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          return list.map(q => sanitizeQuestionPayload(q));
        }
      }
    } catch (e) {
      // Continue to next path
    }
  }
  return [];
}

/**
 * Writes custom injected questions to persistent JSON storage (with /tmp fallback)
 */
function savePersistedCustomQuestions(newQuestions = []) {
  if (!Array.isArray(newQuestions) || newQuestions.length === 0) return;
  const existing = loadPersistedCustomQuestions();
  const map = new Map();

  // Deduplicate by question id, keeping newest versions
  existing.forEach(q => { if (q && q.id) map.set(q.id, sanitizeQuestionPayload(q)); });
  newQuestions.forEach(q => { if (q && q.id) map.set(q.id, sanitizeQuestionPayload(q)); });

  const allQuestions = Array.from(map.values());
  // Store collection (saved to PostgreSQL by services/persistence.js when a database is configured).
  if (!Array.isArray(inMemoryStore.injectedQuestions)) inMemoryStore.injectedQuestions = [];
  newQuestions.forEach(q => {
    if (!q || !q.id) return;
    const clean = sanitizeQuestionPayload(q);
    const at = inMemoryStore.injectedQuestions.findIndex(x => x.id === clean.id);
    if (at === -1) inMemoryStore.injectedQuestions.push(clean); else inMemoryStore.injectedQuestions[at] = clean;
  });
  let saved = false;

  for (const p of getCustomQuestionsWritePaths()) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, JSON.stringify(allQuestions, null, 2), 'utf8');
      saved = true;
      break;
    } catch (e) {
      // Try the next path if the filesystem is read-only
    }
  }

  return saved;
}

/**
 * Commits a batch of auto-categorized questions into the repository
 */
function commitBatchQuestionsToStore({ questions = [], teacher, targetSubject, grade = '12', category = 'CBSE_PYQ', mode = 'text', examMode, examTrack }) {
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
      mode,
      examMode,
      examTrack,
      persistImmediately: false
    });
    committedQuestions[i] = res.question;
    primaryTargetBank = res.targetBank;
  }

  // Explicitly ensure the whole batch is written to disk in a single atomic pass
  try {
    savePersistedCustomQuestions(committedQuestions);
  } catch (e) { }

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
  getCustomQuestionsStoragePaths,
  loadPersistedCustomQuestions,
  savePersistedCustomQuestions,
  parseRawTextLocally
};
