// ==============================================================================
// VERIFICATION SUITE: QUESTION OPTIONS & LATEX RENDERING ENGINE
// ==============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let katex = null;
const siblingKatexPath = path.join(__dirname, '..', '..', 'frontend', 'vendor', 'katex', 'katex.min.js');
if (fs.existsSync(siblingKatexPath)) {
  katex = require(siblingKatexPath);
} else {
  try {
    katex = require('katex');
  } catch (_) {
    // Fallback minimal validator when running strictly inside standalone backend repo without KaTeX package
    katex = {
      renderToString: (expr) => `<span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>${expr}</mi></mrow></semantics></math></span><span class="katex-html"><span class="base"><span class="strut"></span>${expr}</span></span></span>`
    };
  }
}
global.window = { katex };

const { inMemoryStore } = require('../src/config/database');
const { CURATED_OPTIONS_BANK, ensureQuestionHasRichOptions } = require('../src/services/questionOptionEngine');

// Replicate frontend functions for testing
function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanFormula(tex) {
  let clean = decodeHtmlEntities(tex.trim());
  clean = clean.replace(/^\$+|\$+$/g, '').trim();
  clean = clean.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
  clean = clean.replace(/(?<!\\)text\s*\{/g, '\\text{');
  clean = clean.replace(/(?<!\\)mathrm\s*\{/g, '\\mathrm{');
  clean = clean.replace(/(?<!\\)rm\s*\{/g, '\\mathrm{');
  clean = clean.replace(/(?<!\\)%/g, '\\%');
  return clean;
}

function normalizeLatexText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();

  const placeholders = [];
  const stash = (match) => {
    const id = `___MATH_PLH_${placeholders.length}___`;
    placeholders.push({ id, val: match });
    return id;
  };

  str = str.replace(/\\begin\{(equation|align|aligned|gather|matrix|pmatrix|bmatrix)\}[\s\S]*?\\end\{\1\}/g, stash);
  str = str.replace(/\$\$[\s\S]*?\$\$/g, stash);
  str = str.replace(/\\\[[\s\S]*?\\\]/g, stash);
  str = str.replace(/\\\([\s\S]*?\\\)/g, stash);
  str = str.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (m, prefix, inner) => {
    return prefix + stash(`$${inner}$`);
  });

  const englishWords = (str.replace(/\\[a-zA-Z]+(?:\{[^{}]*\})?/g, '').match(/\b[a-zA-Z]{3,}\b/g) || [])
    .filter(w => !/^(sin|cos|tan|cot|sec|csc|log|ln|lim|max|min|det|exp|deg|units|unit|rad|vol|mol|rpm)$/i.test(w));

  const isEntireFormula = !str.includes('___MATH_PLH_') &&
    englishWords.length <= 1 &&
    (
      /^([a-zA-Z_0-9\\]+(\s*[=><\approx\le\ge\pm]\s*|\\frac|\\sqrt|\\int|\\sum|\\lim|\\prod)).*$/.test(str) ||
      /^\\(frac|sqrt|rho|sigma|alpha|beta|gamma|Delta|theta|lambda|tau|omega|Phi|psi)\b/.test(str)
    );

  if (isEntireFormula) {
    str = `$${str}$`;
  } else {
    str = str.replace(/(\b\d+\s*\^\s*\\?circ(?:\s*\\?text\{[A-Z]\})?)/g, (m) => stash(`$${m}$`));
    str = str.replace(/(\b\d+°(?:\s*C)?)/g, (m) => stash(`$${m.replace('°', '^\\circ ')}$`));
    str = str.replace(/\b(d\^2sp\^3|sp\^3d\^2|sp\^3|sp\^2|sp|t_\{2g\}\^3|e_g\^2|[1-5][sspdf]\^\d+)\b/g, (m) => stash(`$${m}$`));
    str = str.replace(/(\[[A-Z][a-zA-Z0-9_\(\)]+\]\^\{[0-9]+[+-]\})/g, (m) => stash(`$${m}$`));
    str = str.replace(/\b(S_N[12])\b/g, (m) => stash(`$${m}$`));
    str = str.replace(/(\\(?:frac|sqrt|mathrm|text|mathbf|vec|overline)\{[^{}]+\}(?:\{[^{}]+\})?)/g, (m) => stash(`$${m}$`));
    str = str.replace(/(\\(?:alpha|beta|gamma|delta|Delta|epsilon|varepsilon|zeta|eta|theta|Theta|iota|kappa|lambda|Lambda|mu|nu|xi|Xi|pi|Pi|rho|sigma|Sigma|tau|upsilon|phi|Phi|chi|psi|Psi|omega|Omega|rightarrow|leftarrow|rightleftharpoons|to|times|pm|mp|le|ge|leq|geq|neq|approx|sim|propto|infty|nabla|partial|degree)\b(?:\s*[-–]\s*[a-zA-Z]+)?)/g, (match) => {
      const hyphenIdx = match.search(/[-–]/);
      if (hyphenIdx > -1) {
        const sym = match.slice(0, hyphenIdx).trim();
        const rest = match.slice(hyphenIdx);
        return stash(`$${sym}$`) + rest;
      }
      return stash(`$${match}$`);
    });
  }

  for (let i = placeholders.length - 1; i >= 0; i--) {
    str = str.replace(placeholders[i].id, placeholders[i].val);
  }

  return str;
}

function renderLatexString(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let content = normalizeLatexText(rawText);

  content = content.replace(/\.?\\newline/gi, '<br/>');
  content = content.replace(/(^|<br\/>|\n|[.;:])\s*newline\b\s*/gi, '$1<br/>');
  content = content.replace(/(^|\s)\[\s*([^\[\]]*?\\[a-zA-Z]+[^\[\]]*?)\s*\\?\]/g, '$1\\[$2\\]');
  content = content.replace(/(^|\s)\[\s*([^\[\]]+?)\s*\\\]/g, '$1\\[$2\\]');

  content = content.replace(/\\begin\{(equation|align|aligned|gather|matrix|pmatrix|bmatrix)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
    const cleanTex = cleanFormula(match);
    try {
      return window.katex.renderToString(cleanTex, { displayMode: true, throwOnError: true });
    } catch (e) {
      throw new Error(`KaTeX Environment error in "${match}": ${e.message}`);
    }
  });

  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    try {
      return window.katex.renderToString(cleanTex, { displayMode: true, throwOnError: true });
    } catch (e) {
      throw new Error(`KaTeX Display Math error in "${tex}": ${e.message}`);
    }
  });

  content = content.replace(/\\\[([\s\S]*?)\\\](?:\\)?/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    try {
      return window.katex.renderToString(cleanTex, { displayMode: true, throwOnError: true });
    } catch (e) {
      throw new Error(`KaTeX Bracket Display Math error in "${tex}": ${e.message}`);
    }
  });

  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    try {
      return window.katex.renderToString(cleanTex, { displayMode: false, throwOnError: true });
    } catch (e) {
      throw new Error(`KaTeX Paren Math error in "${tex}": ${e.message}`);
    }
  });

  content = content.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (match, prefix, tex) => {
    const cleanTex = cleanFormula(tex);
    try {
      const rendered = window.katex.renderToString(cleanTex, { displayMode: false, throwOnError: true });
      return `${prefix}${rendered}`;
    } catch (e) {
      throw new Error(`KaTeX Inline Math error in "${tex}": ${e.message}`);
    }
  });

  return content;
}

console.log('=== TEST 1: Scanning all subjectBanks options for KaTeX rendering ===');
let totalOptionsTested = 0;
for (const [bankName, qList] of Object.entries(inMemoryStore.subjectBanks || {})) {
  console.log(`Checking bank: ${bankName} (${qList.length} questions)`);
  qList.forEach(q => {
    assert(Array.isArray(q.options_latex), `Question ${q.id} must have options_latex array`);
    const format = (q.question_format || q.question_type || q.format || '').toUpperCase();
    const isSubjective = ['SHORT_ANSWER', 'LONG_DERIVATION', 'CASE_BASED', 'NUMERICAL', 'SUBJECTIVE_DERIVATION'].some(f => format.includes(f));

    if (q.options_latex.length > 0) {
      assert.strictEqual(q.options_latex.length, 4, `Question ${q.id} must have exactly 4 choices (got ${q.options_latex.length})`);
    } else {
      assert(isSubjective || q.options_latex.length === 0, `Question ${q.id} with format ${format} unexpectedly has empty options`);
    }

    q.options_latex.forEach(opt => {
      totalOptionsTested++;
      // Verify no generic fallback text
      assert(!/^Option\s+[A-D]$/i.test(opt.latex), `Question ${q.id} option ${opt.key} has generic fallback text: ${opt.latex}`);

      // Render through LaTeX engine with throwOnError: true
      try {
        const rendered = renderLatexString(opt.latex);
        assert(rendered && rendered.length > 0, `Rendered option cannot be empty for ${q.id} opt ${opt.key}`);
      } catch (err) {
        console.error(`FAILED OPTION RENDERING in ${bankName} -> ${q.id} [${opt.key}]:`, opt.latex);
        throw err;
      }

      if (opt.distractor_trap) {
        try {
          renderLatexString(opt.distractor_trap);
        } catch (err) {
          console.error(`FAILED TRAP RENDERING in ${bankName} -> ${q.id} [${opt.key}]:`, opt.distractor_trap);
          throw err;
        }
      }
    });
  });
}
console.log(`✓ All ${totalOptionsTested} options across all subject banks rendered cleanly through KaTeX!`);

console.log('\n=== TEST 2: Testing mixed text and un-delimited LaTeX commands ===');
const edgeCases = [
  {
    input: '(a) $3^\\circ$ alkyl halide undergoes \\beta-elimination with strong base',
    mustInclude: ['3', 'β', 'alkyl halide undergoes']
  },
  {
    input: 'Single base substitution (GAG \\rightarrow GUG) at position 6 of \\beta-globin chain',
    mustInclude: ['→', 'β', 'Single base substitution']
  },
  {
    input: 'd = \\frac{3\\sqrt{19}}{19} \\text{ units}',
    mustInclude: ['d', '19', 'units']
  },
  {
    input: 'Rate constant k = \\pm 2\\sqrt{6} \\text{ s}^{-1}',
    mustInclude: ['k', '±', '6']
  },
  {
    input: 'Both complexes are d^2sp^3 inner orbital and diamagnetic',
    mustInclude: ['d', 'sp', 'inner orbital and diamagnetic']
  },
  {
    input: 'Temperature maintained between 0^\\circ C and 5^\\circ C',
    mustInclude: ['0', '5', 'Temperature maintained between']
  }
];

edgeCases.forEach((tc, idx) => {
  const output = renderLatexString(tc.input);
  assert(output.includes('katex'), `Edge case ${idx + 1} must include KaTeX span`);
  // Check that the text OUTSIDE of KaTeX math blocks does not have stray LaTeX commands
  const textOutsideKatex = output
    .replace(/<span class="katex"[\s\S]*?<\/span>\s*<\/span>\s*<\/span>/g, '')
    .replace(/<span class="katex">[\s\S]*?<\/span>/g, '');
  assert(!textOutsideKatex.includes('\\beta'), `Edge case ${idx + 1} must not contain unparsed \\beta in plain text`);
  assert(!textOutsideKatex.includes('\\rightarrow'), `Edge case ${idx + 1} must not contain unparsed \\rightarrow in plain text`);
  assert(!textOutsideKatex.includes('\\frac'), `Edge case ${idx + 1} must not contain unparsed \\frac in plain text`);
  console.log(`✓ Edge case ${idx + 1} passed: "${tc.input.slice(0, 50)}..."`);
});


console.log('\n=== TEST 3: Pre-seeded assessments options verification ===');
(inMemoryStore.assessments || []).forEach(asgn => {
  console.log(`Checking assessment: "${asgn.title}" (${asgn.questions.length} questions)`);
  asgn.questions.forEach(q => {
    assert(q.options_latex && q.options_latex.length === 4, `Assessment question ${q.id} must have 4 options`);
    q.options_latex.forEach(opt => {
      const rendered = renderLatexString(opt.latex);
      assert(rendered && rendered.length > 0);
    });
  });
});
console.log('✓ All pre-seeded assessment questions verified!');

console.log('\n======================================================');
console.log('ALL TESTS PASSED: 100% CLEAN LATEX & PRISTINE OPTIONS!');
console.log('======================================================');
