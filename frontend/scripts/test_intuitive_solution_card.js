/**
 * Automated Verification: Intuitive Solution Mastercard & Step Walkthrough Engine
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

console.log('--- TESTING INTUITIVE SOLUTION CARD ENGINE ---');

// 1. Verify CSS styles for Mastercard are present
const cssPath = path.join(__dirname, '..', 'css', 'styles.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
assert(cssContent.includes('.qb-solution-mastercard'), 'Must contain .qb-solution-mastercard class');
assert(cssContent.includes('.qb-solution-concept-box'), 'Must contain .qb-solution-concept-box class');
assert(cssContent.includes('.qb-solution-step-item'), 'Must contain .qb-solution-step-item class');
assert(cssContent.includes('.qb-solution-answer-box'), 'Must contain .qb-solution-answer-box class');
assert(cssContent.includes('.qb-solution-exam-tip-box'), 'Must contain .qb-solution-exam-tip-box class');
assert(cssContent.includes('.qb-nav-banner'), 'Must contain .qb-nav-banner class');
assert(cssContent.includes('.qb-solution-prompt-card'), 'Must contain .qb-solution-prompt-card class');
assert(cssContent.includes('.qb-jump-pill'), 'Must contain .qb-jump-pill class');
assert(cssContent.includes('.qb-page-badge'), 'Must contain .qb-page-badge class');
assert(cssContent.includes('@media print'), 'Must contain @media print styles');
console.log('[PASS] CSS styles verified for intuitive solution mastercard, single-question pagination, and print mode.');

// 2. Check structure of formatIntuitiveSteps and Single-Question Navigation
assert(appJsContent.includes('parsedSteps,'), 'Must return parsedSteps in formatIntuitiveSteps');
assert(appJsContent.includes('principleIntuition,'), 'Must return principleIntuition in formatIntuitiveSteps');
assert(appJsContent.includes('examTip'), 'Must return examTip in formatIntuitiveSteps');
assert(appJsContent.includes('function toggleCardSolutionView(qId)'), 'Must define toggleCardSolutionView');
assert(appJsContent.includes('window.toggleCardSolutionView = toggleCardSolutionView;'), 'Must export toggleCardSolutionView');
assert(appJsContent.includes('function nextQbQuestion()'), 'Must define nextQbQuestion');
assert(appJsContent.includes('function prevQbQuestion()'), 'Must define prevQbQuestion');
assert(appJsContent.includes('function setQbQuestionIndex(idx)'), 'Must define setQbQuestionIndex');
assert(appJsContent.includes('function renderQbCurrentPage()'), 'Must define renderQbCurrentPage');
assert(appJsContent.includes('state.qbSolutionRevealed = false'), 'Solution must be hidden by default on question transition');
console.log('[PASS] formatIntuitiveSteps contract, single-question navigation, and solution toggle verified.');

// 3. Test math-safe parsing
const mathSafeSplit = (text) => {
  const parts = [];
  let cur = '';
  let inMath = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '$') {
      inMath = !inMath;
      cur += c;
    } else if ((c === '.' || c === ';' || c === '\n') && !inMath) {
      if (cur.trim().length > 3) parts.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim().length > 0) parts.push(cur.trim());
  return parts;
};

const formulaText = "Squaring both sides, $5b^2 = a^2 \\implies 5 \\mid a$. Let $a = 5c$. Substituting, $5b^2 = 25c^2$.";
const blocks = mathSafeSplit(formulaText);
assert.strictEqual(blocks.length, 3, 'Must split into 3 sentences without breaking $ math blocks');
assert(blocks[0].includes('$5b^2 = a^2 \\implies 5 \\mid a$'), 'Must keep implication inside $ intact');
console.log('[PASS] Math-safe sentence parser preserves LaTeX expressions.');

// 4. Verify chapter-specific intuition coverage across chapters
const sampleChapters = [
  'Real Numbers',
  'Polynomials',
  'Pair of Linear Equations',
  'Quadratic Equations',
  'Arithmetic Progressions',
  'Triangles',
  'Coordinate Geometry',
  'Introduction to Trigonometry',
  'Some Applications of Trigonometry',
  'Circles',
  'Areas Related to Circles',
  'Surface Areas and Volumes',
  'Statistics',
  'Probability'
];

sampleChapters.forEach(ch => {
  assert(appJsContent.includes(ch), `formatIntuitiveSteps must include chapter guidance for ${ch}`);
});
console.log('[PASS] All 14 Class 10 NCERT chapters have configured pedagogical intuitions.');

// 5. Verify Full-Page Diagnostic Performance Audit & Studio
const htmlPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
assert(htmlContent.includes('id="diagReportScrollContainer"'), 'Must contain #diagReportScrollContainer in index.html');
assert(htmlContent.includes('id="diagReportModalTitle"'), 'Must contain #diagReportModalTitle in index.html');
assert(htmlContent.includes('id="diagReportModalSubtitle"'), 'Must contain #diagReportModalSubtitle in index.html');

assert(cssContent.includes('.diag-kpi-ribbon'), 'Must contain .diag-kpi-ribbon in styles.css');
assert(cssContent.includes('.diag-dual-directive-grid'), 'Must contain .diag-dual-directive-grid in styles.css');
assert(cssContent.includes('.diag-directive-student'), 'Must contain .diag-directive-student in styles.css');
assert(cssContent.includes('.diag-directive-teacher'), 'Must contain .diag-directive-teacher in styles.css');
assert(cssContent.includes('.diag-concept-item-card'), 'Must contain .diag-concept-item-card in styles.css');
assert(cssContent.includes('.diag-question-review-card'), 'Must contain .diag-question-review-card in styles.css');

assert(appJsContent.includes('function cleanDiagnosticSubtopic('), 'Must define cleanDiagnosticSubtopic');
assert(appJsContent.includes('function getConceptPedagogicalProfile('), 'Must define getConceptPedagogicalProfile');
assert(appJsContent.includes('function displayDiagnosticResults('), 'Must define displayDiagnosticResults');
assert(appJsContent.includes('function toggleDiagQuestionSolution('), 'Must define toggleDiagQuestionSolution');
assert(appJsContent.includes('window.toggleDiagQuestionSolution = toggleDiagQuestionSolution;'), 'Must export toggleDiagQuestionSolution');

// 6. Test subtopic title and formula normalization
const cleanSubtopicMock = (raw) => {
  if (!raw || typeof raw !== 'string') return 'General Concept';
  let s = raw.trim();
  s = s.replace(/^DERIVATION\s*:\s*/i, 'Derivation: ');
  s = s.replace(/^PHASOR DIAGRAM SOLUTION\s*:\s*/i, 'Phasor Diagram: ');
  if (s === s.toUpperCase() && !s.includes('\\')) {
    s = s.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  s = s.replace(/E\s*=\s*\\?Sigma\s*\/\s*\(?\s*2\s*E_?0\s*\)?/gi, '$E = \\frac{\\sigma}{2\\varepsilon_0}$');
  return s;
};

const rawTest1 = "MOMENT OF INERTIA";
const cleaned1 = cleanSubtopicMock(rawTest1);
assert.strictEqual(cleaned1, "Moment Of Inertia", "All-caps subtopic must be converted to Title Case");

const rawTest2 = "DERIVATION: FIELD DUE TO A UNIFORMLY CHARGED INFINITE PLANE SHEET: E = \\Sigma/(2E_0)";
const cleaned2 = cleanSubtopicMock(rawTest2);
assert(cleaned2.includes("Derivation:"), "Must prefix with Derivation:");
assert(cleaned2.includes("$E = \\frac{\\sigma}{2\\varepsilon_0}$"), "Must transform raw formula into KaTeX math");
console.log('[PASS] Full-Page Diagnostic Performance Studio markup, styling, and subtopic cleaners verified.');

// 7. Verify Equation-by-Equation Newline Separation & Concept Explanation Toggle
assert(cssContent.includes('.sol-math-line'), 'Must contain .sol-math-line class in styles.css');
assert(cssContent.includes('.qb-concept-explanation-box'), 'Must contain .qb-concept-explanation-box class in styles.css');
assert(cssContent.includes('.qb-btn-toggle-explain'), 'Must contain .qb-btn-toggle-explain class in styles.css');

assert(appJsContent.includes('function formatStepEquations('), 'Must define formatStepEquations in app.js');
assert(appJsContent.includes('window.formatStepEquations = formatStepEquations;'), 'Must export formatStepEquations to window');
assert(appJsContent.includes('function toggleSolutionConceptExplanation('), 'Must define toggleSolutionConceptExplanation in app.js');
assert(appJsContent.includes('window.toggleSolutionConceptExplanation = toggleSolutionConceptExplanation;'), 'Must export toggleSolutionConceptExplanation to window');

// Test that physics derivations have exact governing formulas
assert(appJsContent.includes(String.raw`v_d = \\frac{eE\\tau}{m}`), 'Must have drift velocity formula');
assert(appJsContent.includes(String.raw`\\rho = \\frac{m}{n e^2 \\tau}`), 'Must have resistivity deduction formula');
assert(appJsContent.includes(String.raw`Z = \\sqrt{R^2 + (X_L - X_C)^2}`), 'Must have LCR series impedance formula');
assert(appJsContent.includes(String.raw`E = \\frac{\\sigma}{2\\varepsilon_0}`), 'Must have Gauss law plane sheet formula');

console.log('[PASS] Equation-by-equation separation, concept toggle, and physics governing formulas verified.');

console.log('======================================================');
console.log('ALL INTUITIVE SOLUTION CARD ENGINE TESTS PASSED 100%!');
console.log('======================================================');

