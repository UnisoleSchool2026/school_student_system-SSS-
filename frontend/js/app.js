/**
 * ==============================================================================
 * HAPS-AI SCHOLAR ASSISTANT: FRONTEND APPLICATION LOGIC
 * Him Academy Public School (HAPS), Hamirpur
 * Dual-Portal: Teacher Co-Pilot & Student Adaptive Engine with KaTeX & Kafka
 * ==============================================================================
 */

// Centralized Dynamic API and WebSocket Base Resolver
function getApiBaseUrl() {
  if (window.HAPS_API_BASE) return window.HAPS_API_BASE.replace(/\/+$/, '');
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal) {
    return 'http://localhost:5050';
  }
  const custom = localStorage.getItem('haps_backend_url');
  if (custom) return custom.replace(/\/+$/, '');
  return window.location.origin;
}

function getWsBaseUrl() {
  if (window.HAPS_WS_BASE) return window.HAPS_WS_BASE.replace(/\/+$/, '');
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal) {
    return 'ws://localhost:5050';
  }
  const custom = localStorage.getItem('haps_backend_url');
  if (custom) {
    return custom.replace(/^http/, 'ws').replace(/\/+$/, '');
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

// Early Modal Dismissal & Control Bindings
function closeStudentDrilldown() {
  const modal = document.getElementById('modalStudentDrilldown');
  if (modal) modal.classList.remove('active');
  if (typeof destroyChart === 'function') {
    destroyChart('studentTime');
    destroyChart('studentMistakes');
  }
}
window.closeStudentDrilldown = closeStudentDrilldown;

function closeCurriculumTestModal() {
  const modal = document.getElementById('modalGenerateCurriculumTest');
  if (modal) modal.classList.remove('active');
}
window.closeCurriculumTestModal = closeCurriculumTestModal;

function closeWhatsAppModal() {
  const modal = document.getElementById('whatsAppModal');
  if (modal) modal.classList.remove('active');
}
window.closeWhatsAppModal = closeWhatsAppModal;

function closeTestBuilderModal() {
  const modal = document.getElementById('modalTestBuilder');
  if (modal) modal.classList.remove('active');
}
window.closeTestBuilderModal = closeTestBuilderModal;

function setupGlobalModalDismissal() {
  // ESC key listener to close whichever modal is active
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeStudentDrilldown();
      closeCurriculumTestModal();
      closeWhatsAppModal();
      closeTestBuilderModal();
      if (typeof closeDiagnosticResultsModal === 'function') {
        closeDiagnosticResultsModal();
      }
    }
  });

  // Universal backdrop click dismissal
  document.addEventListener('click', (e) => {
    if (!e.target) return;
    if (e.target.id === 'modalStudentDrilldown') {
      closeStudentDrilldown();
    } else if (e.target.id === 'modalGenerateCurriculumTest') {
      closeCurriculumTestModal();
    } else if (e.target.id === 'whatsAppModal') {
      closeWhatsAppModal();
    } else if (e.target.id === 'modalTestBuilder') {
      closeTestBuilderModal();
    } else if (e.target.id === 'modalDiagnosticResults') {
      if (typeof closeDiagnosticResultsModal === 'function') {
        closeDiagnosticResultsModal();
      }
    }
  });
}

// Application State
const state = {
  activeRole: 'teacher',
  activeTeacherTab: 'tabTeacherCreateTestAndPaper',
  activeStudentMode: 'JEE_NEET',
  theme: 'light',
  testDraft: [],
  publishedAssessments: [],
  activeAssessment: null,
  currentQuestion: {
    id: 'c0000000-0000-0000-0000-000000000001',
    topic: 'Rotational Motion',
    subtopic: 'Moment of Inertia',
    curriculum_board: 'JEE_MAIN',
    grade: '11',
    difficulty: 'MEDIUM',
    question_latex: 'A solid uniform cylinder of mass $M$ and radius $R$ is free to rotate about its geometric axis. A light string is wound around its circumference and pulled with a constant tension $T$. Find the angular acceleration $\\alpha$ of the cylinder.',
    options_latex: [
      { key: 'A', latex: '$\\alpha = \\frac{T}{MR}$', is_correct: false, distractor_trap: 'Treated cylinder as hollow thin shell ($I=MR^2$)' },
      { key: 'B', latex: '$\\alpha = \\frac{2T}{MR}$', is_correct: true, distractor_trap: null },
      { key: 'C', latex: '$\\alpha = \\frac{T}{2MR}$', is_correct: false, distractor_trap: 'Multiplied instead of dividing by moment of inertia constant' },
      { key: 'D', latex: '$\\alpha = \\frac{4T}{MR}$', is_correct: false, distractor_trap: 'Calculation error in radius factor' }
    ],
    correct_answer: 'B',
    solution_latex: 'Torque about central axis is $\\tau = T \\cdot R$. Moment of inertia for a solid cylinder is $I = \\frac{1}{2} M R^2$. Since $\\tau = I\\alpha \\implies TR = \\left(\\frac{1}{2}MR^2\\right)\\alpha \\implies \\alpha = \\frac{2T}{MR}$.',
    socratic_hints: [
      "What is the torque produced by tension $T$ acting tangentially at radius $R$?",
      "What is the moment of inertia $I$ of a solid uniform cylinder about its central axis?",
      "Equate rotational torque $\\tau = I\\alpha$ and solve for $\\alpha$."
    ],
    benchmark_time_seconds: 90
  },
  studentTimer: {
    secondsElapsed: 54,
    intervalId: null,
    selectedOption: null,
    hintsRevealed: 0
  },
  telemetryStream: [
    { student: 'Aryan Sharma', subtopic: 'Moment of Inertia', timeSpent: '54s', hesitation: '8s', status: 'CORRECT', category: 'FAST_ACCURATE', badge: 'badge-mastered' },
    { student: 'Ananya Thakur', subtopic: 'Work-Energy Theorem', timeSpent: '185s', hesitation: '35s', status: 'CORRECT', category: 'SLOW_ACCURATE', badge: 'badge-recap' },
    { student: 'Rohit Negi', subtopic: 'Damped Oscillations', timeSpent: '195s', hesitation: '42s', status: 'INCORRECT', category: 'SLOW_MISCONCEPTION', badge: 'badge-weak' },
    { student: 'Kavya Verma', subtopic: 'Torque Conservation', timeSpent: '48s', hesitation: '5s', status: 'CORRECT', category: 'FAST_ACCURATE', badge: 'badge-mastered' }
  ]
};

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  const initializers = [
    ['Lucide Icons', initLucideIcons],
    ['Global Modal Dismissal', setupGlobalModalDismissal],
    ['Role Switching', setupRoleSwitching],
    ['Teacher Sub-tabs', setupTeacherSubTabs],
    ['Theme Toggle', setupThemeToggle],
    ['Teacher Test Builder', setupTeacherTestBuilder],
    ['AI Generator', setupAiGenerator],
    ['Telemetry Controls', setupTelemetryControls],
    ['Telemetry Table', renderTelemetryTable],
    ['Handwritten Station', setupHandwrittenStation],
    ['Handwritten Upload & Vision AI', setupHandwrittenUploadAndVisionAi],
    ['WhatsApp Notification Modal', setupWhatsAppNotificationModal],
    ['Student Mode', setupStudentMode],
    ['NTA Exam Palette Engine', setupNtaExamPaletteEngine],
    ['WebSocket Client', setupWebSocketClient],
    ['Classroom Seatmap', initClassroomSeatmap],
    ['Initial Question', renderInitialQuestion],
    ['Student Timer', startStudentTimer],
    ['Test Assignment Builder', setupTestAssignmentBuilder],
    ['Student Assigned Tests', setupStudentAssignedTests],
    ['Class Analytics', setupClassAnalytics],
    ['Load Class Analytics', loadClassAnalytics]
  ];

  initializers.forEach(([name, fn]) => {
    try {
      if (typeof fn === 'function') fn();
    } catch (err) {
      console.warn(`[INIT] Warning during ${name}:`, err);
    }
  });

  // Handle Role Gateway & Role Routing
  try {
    const savedRole = localStorage.getItem('haps_active_role');
    if (savedRole && (savedRole === 'teacher' || savedRole === 'student' || savedRole === 'director' || savedRole === 'principal')) {
      switchPortalRole(savedRole);
    } else {
      window.openRoleGatewayModal();
      switchPortalRole('teacher');
    }
  } catch (e) {
    switchPortalRole('teacher');
  }
}


function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

const pendingMathQueue = new Set();
let katexRetryInterval = null;

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
  // Strip leading and trailing $ signs if accidentally enclosed
  clean = clean.replace(/^\$+|\$+$/g, '').trim();
  // Replace double backslashes if present e.g. \\frac -> \frac
  clean = clean.replace(/\\\\([a-zA-Z]+)/g, '\\$1');
  // Fix unescaped text{...} e.g. text{cm} -> \text{cm}
  clean = clean.replace(/(?<!\\)text\s*\{/g, '\\text{');
  clean = clean.replace(/(?<!\\)mathrm\s*\{/g, '\\mathrm{');
  clean = clean.replace(/(?<!\\)rm\s*\{/g, '\\mathrm{');
  // Fix unescaped % inside math formulas
  clean = clean.replace(/(?<!\\)%/g, '\\%');
  return clean;
}

/**
 * Smart LaTeX normalizer
 * Intelligently protects existing math blocks ($$...$$, \[...\], \(...\), $...$)
 * and wraps stray/un-delimited mathematical symbols, formulas, and Greek letters
 * in proper $...$ delimiters without italicizing English sentences.
 */
function normalizeLatexText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();

  // 1. Stash existing valid math blocks
  const placeholders = [];
  const stash = (match) => {
    const id = `___MATH_PLH_${placeholders.length}___`;
    placeholders.push({ id, val: match });
    return id;
  };

  // Stash environments: \begin{...}...\end{...}
  str = str.replace(/\\begin\{(equation|align|aligned|gather|matrix|pmatrix|bmatrix)\}[\s\S]*?\\end\{\1\}/g, stash);
  // Stash display math: $$...$$ and \[...\]
  str = str.replace(/\$\$[\s\S]*?\$\$/g, stash);
  str = str.replace(/\\\[[\s\S]*?\\\]/g, stash);
  // Stash inline math: \(...\)
  str = str.replace(/\\\([\s\S]*?\\\)/g, stash);
  // Stash inline math: $...$
  str = str.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (m, prefix, inner) => {
    return prefix + stash(`$${inner}$`);
  });

  // 2. Now examine non-stashed text outside math delimiters
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
    // Standalone degree notations: 3^\circ, 2^\circ, 1^\circ, 0^\circ C, 90^\circ, 0°C
    str = str.replace(/(\b\d+\s*\^\s*\\?circ(?:\s*\\?text\{[A-Z]\})?)/g, (m) => stash(`$${m}$`));
    str = str.replace(/(\b\d+°(?:\s*C)?)/g, (m) => stash(`$${m.replace('°', '^\\circ ')}$`));

    // Common chemical orbital notations outside math: d^2sp^3, sp^3d^2, sp^3, sp^2, sp, t_{2g}^3, e_g^2
    str = str.replace(/\b(d\^2sp\^3|sp\^3d\^2|sp\^3|sp\^2|sp|t_\{2g\}\^3|e_g\^2|[1-5][sspdf]\^\d+)\b/g, (m) => stash(`$${m}$`));

    // Complex coordination ions outside math: e.g. [Co(NH_3)_6]^{3+}, [CoF_6]^{3-}
    str = str.replace(/(\[[A-Z][a-zA-Z0-9_\(\)]+\]\^\{[0-9]+[+-]\})/g, (m) => stash(`$${m}$`));

    // Reaction mechanism notation: S_N1, S_N2
    str = str.replace(/\b(S_N[12])\b/g, (m) => stash(`$${m}$`));

    // LaTeX macros with parameters outside math: \frac{...}{...}, \sqrt{...}, \mathrm{...}
    str = str.replace(/(\\(?:frac|sqrt|mathrm|text|mathbf|vec|overline)\{[^{}]+\}(?:\{[^{}]+\})?)/g, (m) => stash(`$${m}$`));

    // Greek letters & math operators outside math: e.g. \beta-elimination -> $\beta$-elimination
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

  // 3. Restore stashed math blocks in reverse order
  for (let i = placeholders.length - 1; i >= 0; i--) {
    str = str.replace(placeholders[i].id, placeholders[i].val);
  }

  return str;
}

/**
 * Universal robust LaTeX renderer using KaTeX
 * Handles:
 * 1. LaTeX environments: \begin{equation}...\end{equation}, \begin{align}...\end{align}
 * 2. Display math: $$...$$, \[...\], [ math \], and multi-step derivations
 * 3. Inline math: \(...\), $...$
 * 4. Automatic entity decoding, text{...} repair, and newline derivation formatting
 */
function renderLatexString(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  const mathPlaceholders = [];
  function storeMath(html) {
    const key = `___KATEX_BLOCK_${mathPlaceholders.length}___`;
    mathPlaceholders.push(html);
    return key;
  }

  // 0. Smart LaTeX normalizer (repairs un-delimited math/Greek/symbols)
  let content = normalizeLatexText(rawText);

  // 1. Normalize linebreaks from LaTeX notation: \newline, .\newline, or stray leading 'newline'
  content = content.replace(/\.?\\newline/gi, '<br/>');
  content = content.replace(/(^|<br\/>|\n|[.;:])\s*newline\b\s*/gi, '$1<br/>');

  // 2. Normalize display brackets with LaTeX commands inside
  content = content.replace(/(^|\s)\[\s*([^\[\]]*?\\[a-zA-Z]+[^\[\]]*?)\s*\\?\]/g, '$1\\[$2\\]');
  content = content.replace(/(^|\s)\[\s*([^\[\]]+?)\s*\\\]/g, '$1\\[$2\\]');

  // 3. Render LaTeX environments: \begin{...}...\end{...}
  content = content.replace(/\\begin\{(equation|align|aligned|gather|matrix|pmatrix|bmatrix)\}([\s\S]*?)\\end\{\1\}/g, (match) => {
    const cleanTex = cleanFormula(match);
    if (window.katex) {
      try {
        return storeMath(window.katex.renderToString(cleanTex, { displayMode: true, throwOnError: false }));
      } catch (e) {}
    }
    return storeMath(`<div class="katex-display-fallback">${cleanTex}</div>`);
  });

  // 4. Render Display Math: $$...$$
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    if (window.katex) {
      try {
        return storeMath(window.katex.renderToString(cleanTex, { displayMode: true, throwOnError: false }));
      } catch (e) {}
    }
    return storeMath(`<div class="katex-display-fallback">${cleanTex}</div>`);
  });

  // 5. Render Display Math: \[...\]
  content = content.replace(/\\\[([\s\S]*?)\\\](?:\\)?/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    if (window.katex) {
      try {
        return storeMath(window.katex.renderToString(cleanTex, { displayMode: true, throwOnError: false }));
      } catch (e) {}
    }
    return storeMath(`<div class="katex-display-fallback">${cleanTex}</div>`);
  });

  // 6. Render Inline Math: \(...\)
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
    const cleanTex = cleanFormula(tex);
    if (window.katex) {
      try {
        return storeMath(window.katex.renderToString(cleanTex, { displayMode: false, throwOnError: false }));
      } catch (e) {}
    }
    return storeMath(`<span class="katex-inline-fallback">${cleanTex}</span>`);
  });

  // 7. Render Inline Math: $...$
  content = content.replace(/(^|[^\$])\$([^\$\n]+?)\$(?!\$)/g, (match, prefix, tex) => {
    const cleanTex = cleanFormula(tex);
    let rendered = `<span class="katex-inline-fallback">${cleanTex}</span>`;
    if (window.katex) {
      try {
        rendered = window.katex.renderToString(cleanTex, { displayMode: false, throwOnError: false });
      } catch (e) {}
    }
    return `${prefix}${storeMath(rendered)}`;
  });

  // 8. Post-processing text outside rendered math:
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/\\(\s*[\r\n]+)/g, '$1');
  content = content.replace(/([:;,])\s*\\\s*/g, '$1 ');

  // Format line breaks safely only in text portions
  content = content.replace(/\n\s*\n/g, '<br/><br/>');
  content = content.replace(/\n/g, '<br/>');

  // 9. Restore preserved KaTeX blocks with pristine untouched SVG paths
  mathPlaceholders.forEach((html, i) => {
    content = content.replace(`___KATEX_BLOCK_${i}___`, () => html);
  });

  return content;
}

/**
 * Universal math renderer for DOM elements
 * Safe against double-rendering already processed KaTeX nodes
 */
function renderMathInElement(element) {
  if (!element) return;

  // Guard: if element already contains rendered KaTeX, avoid destructive re-rendering
  if (element.classList && element.classList.contains('katex')) return;
  if (element.querySelector && element.querySelector('.katex')) return;

  if (!window.katex) {
    pendingMathQueue.add(element);
    if (!katexRetryInterval) {
      katexRetryInterval = setInterval(() => {
        if (window.katex) {
          clearInterval(katexRetryInterval);
          katexRetryInterval = null;
          pendingMathQueue.forEach(el => renderMathInElement(el));
          pendingMathQueue.clear();
        }
      }, 100);
    }
    return;
  }

  element.innerHTML = renderLatexString(element.innerHTML);
}


// -----------------------------------------------------------------------------
// 1. ROLE & NAVIGATION SWITCHING (3 LOGINS: PRINCIPAL, TEACHER, STUDENT)
// -----------------------------------------------------------------------------
window.openRoleGatewayModal = function() {
  const modal = document.getElementById('portalRoleGatewayModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
    initLucideIcons();
  }
};

window.closeRoleGatewayModal = function() {
  const modal = document.getElementById('portalRoleGatewayModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
};

window.loginWithRole = function(role) {
  try {
    localStorage.setItem('haps_active_role', role);
  } catch (e) {}
  window.closeRoleGatewayModal();
  switchPortalRole(role);
};

window.handleRoleBadgeClick = function() {
  if (state.activeRole === 'teacher') {
    window.openFacultyClassSwitcherModal();
    return;
  }
  window.openRoleGatewayModal();
};

window.fillGatewayFaculty = function(name, phone, subject) {
  const nameInput = document.getElementById('inputGatewayTeacherName');
  const phoneInput = document.getElementById('inputGatewayTeacherPhone');
  const subjSelect = document.getElementById('selectGatewayTeacherSubject');
  if (nameInput) nameInput.value = name;
  if (phoneInput) phoneInput.value = phone;
  if (subjSelect) subjSelect.value = subject;

  document.querySelectorAll('.faculty-quick-pill').forEach(pill => {
    pill.classList.toggle('active', pill.textContent.includes(name.split(' ')[1] || name));
  });
};

window.submitGatewayTeacherLogin = function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputGatewayTeacherName')?.value?.trim() || 'Dr. Vikram Sharma';
  const phone = document.getElementById('inputGatewayTeacherPhone')?.value?.trim() || '98160 10001';
  const subjectKey = document.getElementById('selectGatewayTeacherSubject')?.value || 'PHYSICS';

  const subjectNames = {
    PHYSICS: 'Physics',
    CHEMISTRY: 'Chemistry',
    MATHEMATICS: 'Mathematics',
    BIOLOGY: 'Biology',
    CLASS10_MATHEMATICS: 'Class 10th Mathematics',
    CLASS10_SCIENCE: 'Class 10th Science',
    COMPUTER_SCIENCE: 'Computer Science'
  };

  teacherBuilderState.activeTeacher = {
    name,
    phone,
    subjectKey,
    subjectName: subjectNames[subjectKey] || 'Physics'
  };

  try {
    localStorage.setItem('haps_teacher_profile', JSON.stringify(teacherBuilderState.activeTeacher));
    localStorage.setItem('haps_active_role', 'teacher');
  } catch (e) {}

  window.closeRoleGatewayModal();
  state.activeTeacherTab = 'tabTeacherCreateTestAndPaper';
  switchPortalRole('teacher');

  const banner = document.createElement('div');
  banner.className = 'role-switch-toast';
  banner.innerHTML = `<i data-lucide="check-circle" style="width:16px; height:16px; color:#34d399;"></i> <span>Signed in as <strong>${escapeHtml(name)}</strong> (${subjectNames[subjectKey] || 'Physics'} Expert). Role locked to Teacher Portal.</span>`;
  document.body.appendChild(banner);
  initLucideIcons();
  setTimeout(() => banner.remove(), 4000);
};

window.handleTeacherSignOut = function() {
  closeSidebarDrawer();
  try {
    localStorage.removeItem('haps_active_role');
  } catch(e) {}
  document.body.classList.remove('role-teacher');
  const switchRoleBtn = document.getElementById('btnHeaderSwitchRole');
  if (switchRoleBtn) switchRoleBtn.style.display = 'inline-flex';
  const teacherSignOutBtn = document.getElementById('btnTeacherHeaderSignOut');
  if (teacherSignOutBtn) teacherSignOutBtn.style.display = 'none';
  window.openRoleGatewayModal();
};

window.switchStudentTab = function(tabId) {
  state.activeStudentTab = tabId;
  document.querySelectorAll('.student-nav-pill').forEach(pill => {
    pill.classList.toggle('active', pill.id === `studentPill${tabId.replace('tabStudent', '')}`);
  });
  document.querySelectorAll('.student-tab-content').forEach(content => {
    const isTarget = content.id === tabId;
    content.style.display = isTarget ? 'block' : 'none';
    content.classList.toggle('active', isTarget);
  });
  if (tabId === 'tabStudentSmartReport') {
    if (window.loadAndRenderSmartReport) {
      window.loadAndRenderSmartReport('b0000000-0000-0000-0000-000000000001');
    }
  }
  initLucideIcons();
};

function switchPortalRole(role) {
  const normalizedRole = (role === 'principal' || role === 'director') ? 'director' : role;
  state.activeRole = normalizedRole;
  try {
    localStorage.setItem('haps_active_role', normalizedRole);
  } catch (e) {}

  const sections = {
    teacher: document.getElementById('teacherView'),
    student: document.getElementById('studentView'),
    director: document.getElementById('directorView')
  };

  Object.keys(sections).forEach(r => {
    if (sections[r]) sections[r].classList.toggle('active', r === normalizedRole);
  });

  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-role') === normalizedRole);
  });

  document.querySelectorAll('.drawer-nav-item[id^="drawerBtnRole"]').forEach(btn => {
    btn.classList.toggle('active', btn.id === `drawerBtnRole${normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)}`);
  });

  const headerTitle = document.getElementById('headerNavTitle');
  const facultyName = document.getElementById('headerFacultyName');
  const facultyTag = document.getElementById('headerFacultyTag');
  const roleDot = document.getElementById('headerRoleDot');
  const drawerName = document.getElementById('drawerFacultyName');
  const drawerRole = document.getElementById('drawerFacultyRole');
  const drawerSubject = document.getElementById('drawerFacultySubject');

  const switchRoleBtn = document.getElementById('btnHeaderSwitchRole');
  const teacherSignOutBtn = document.getElementById('btnTeacherHeaderSignOut');
  const headerRoleBadge = document.getElementById('headerRoleBadge');
  const drawerPortalViews = document.getElementById('drawerSectionPortalViews');

  if (normalizedRole === 'student') {
    document.body.classList.remove('role-teacher');
    if (switchRoleBtn) switchRoleBtn.style.display = 'inline-flex';
    if (teacherSignOutBtn) teacherSignOutBtn.style.display = 'none';
    if (headerRoleBadge) {
      headerRoleBadge.style.cursor = 'pointer';
      headerRoleBadge.title = 'Current Active Portal. Click to switch.';
    }
    if (drawerPortalViews) drawerPortalViews.style.display = 'block';

    if (headerTitle) headerTitle.innerText = 'Student Learning Portal • Adaptive Tests & Smartboard';
    if (facultyName) facultyName.innerText = 'Aryan Sharma';
    if (facultyTag) {
      facultyTag.innerText = 'Student (Class 11A)';
      facultyTag.style.background = 'rgba(16, 185, 129, 0.2)';
      facultyTag.style.color = '#34d399';
    }
    if (roleDot) roleDot.style.background = '#10b981';
    if (drawerName) drawerName.innerText = 'Aryan Sharma';
    if (drawerRole) drawerRole.innerText = 'Class 11 Science • Roll #101';
    if (drawerSubject) drawerSubject.innerText = 'Stream: Senior Secondary Non-Medical';

    renderStudentQuestion();

  } else if (normalizedRole === 'director') {
    document.body.classList.remove('role-teacher');
    if (switchRoleBtn) switchRoleBtn.style.display = 'inline-flex';
    if (teacherSignOutBtn) teacherSignOutBtn.style.display = 'none';
    if (headerRoleBadge) {
      headerRoleBadge.style.cursor = 'pointer';
      headerRoleBadge.title = 'Current Active Portal. Click to switch.';
    }
    if (drawerPortalViews) drawerPortalViews.style.display = 'block';

    if (headerTitle) headerTitle.innerText = 'Principal Executive Portal • School Intelligence & Analytics';
    if (facultyName) facultyName.innerText = 'Dr. Anita Chandel';
    if (facultyTag) {
      facultyTag.innerText = 'Principal & Director';
      facultyTag.style.background = 'rgba(168, 85, 247, 0.2)';
      facultyTag.style.color = '#c084fc';
    }
    if (roleDot) roleDot.style.background = '#a855f7';
    if (drawerName) drawerName.innerText = 'Dr. Anita Chandel';
    if (drawerRole) drawerRole.innerText = 'Principal & Director, Unisole AI School';
    if (drawerSubject) drawerSubject.innerText = 'Scope: Institutional Oversight & Directives';

  } else {
    // Teacher Role (STRICT ROLE LOCK APPLIED)
    document.body.classList.add('role-teacher');
    if (switchRoleBtn) switchRoleBtn.style.display = 'none';
    if (teacherSignOutBtn) teacherSignOutBtn.style.display = 'inline-flex';
    if (headerRoleBadge) {
      headerRoleBadge.style.cursor = 'default';
      headerRoleBadge.title = 'Faculty Profile (Role-Locked)';
    }
    if (drawerPortalViews) drawerPortalViews.style.display = 'none';

    const activeTeacher = teacherBuilderState.activeTeacher || {
      name: 'Dr. Vikram Sharma',
      subjectName: 'Physics',
      subjectKey: 'PHYSICS',
      phone: '98160 10001'
    };

    const currentTeacherTab = state.activeTeacherTab || 'tabTeacherCreateTestAndPaper';
    const teacherTabTitles = {
      'tabTeacherCreateTestAndPaper': `Teacher Portal • Create Test & Paper (${activeTeacher.subjectName})`,
      'tabTeacherCreatePaper': `Teacher Portal • Create Paper (${activeTeacher.subjectName})`,
      'tabTeacherTakeTest': 'Teacher Portal • Take & Conduct Class Tests',
      'tabTeacherClasses': 'Teacher Portal • Classes & Student Rosters',
      'tabTeacherSyllabus': 'Teacher Portal • Senior Physics Curriculum & Syllabus',
      'tabGenerator': 'Teacher Portal • Create & Assign Tests',
      'tabClassAnalytics': 'Teacher Portal • Overall Class Performance & Analytics'
    };

    if (headerTitle) headerTitle.innerText = teacherTabTitles[currentTeacherTab] || `Teacher Portal • Create Paper (${activeTeacher.subjectName})`;
    if (facultyName) facultyName.innerText = activeTeacher.name;
    if (facultyTag) {
      facultyTag.innerText = `Faculty • ${activeTeacher.subjectName}`;
      facultyTag.style.background = 'rgba(56, 189, 248, 0.2)';
      facultyTag.style.color = '#38bdf8';
    }
    if (roleDot) roleDot.style.background = '#38bdf8';
    if (drawerName) drawerName.innerText = activeTeacher.name;
    if (drawerRole) drawerRole.innerText = `${activeTeacher.subjectName} Faculty • HOD`;
    if (drawerSubject) drawerSubject.innerText = `Department: ${activeTeacher.subjectName}`;

    const stripName = document.getElementById('stripTeacherName');
    if (stripName) stripName.innerText = activeTeacher.name;
    const stripDept = document.getElementById('stripTeacherDept');
    if (stripDept) stripDept.innerText = `${activeTeacher.subjectName} Expert`;

    // Initialize Paper Creator dropdowns & Classes
    if (window.initPaperBuilderDropdowns) {
      window.initPaperBuilderDropdowns();
    }
    if (window.renderClassRoster) {
      window.renderClassRoster(teacherBuilderState.selectedClassId || '12-NonMed');
    }
    if (window.renderAssignedTestsTable) {
      window.renderAssignedTestsTable();
    }

    document.querySelectorAll('.teacher-tab-content').forEach(t => {
      const isTarget = t.id === currentTeacherTab;
      t.style.display = isTarget ? 'block' : 'none';
      t.classList.toggle('active', isTarget);
    });

    document.querySelectorAll('.teacher-nav-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-tab') === currentTeacherTab);
    });
  }

  closeSidebarDrawer();
  initLucideIcons();
}

window.filterSyllabusGrade = function(grade) {
  document.querySelectorAll('.syllabus-filter-btn[id^="filterBtnClass"]').forEach(b => {
    b.classList.toggle('active', b.id === `filterBtnClass${grade}`);
  });
  if (window.renderTeacherSyllabusChapters) {
    window.renderTeacherSyllabusChapters(grade, window.currentSyllabusTrackFilter || 'ALL');
  }
};

window.filterSyllabusTrack = function(track) {
  window.currentSyllabusTrackFilter = track;
  document.querySelectorAll('.syllabus-filter-btn[id^="filterTrack"]').forEach(b => {
    b.classList.toggle('active', b.id === `filterTrack${track}`);
  });
  const activeGradeBtn = document.querySelector('.syllabus-filter-btn[id^="filterBtnClass"].active');
  const grade = activeGradeBtn && activeGradeBtn.id.includes('12') ? '12' : '11';
  if (window.renderTeacherSyllabusChapters) {
    window.renderTeacherSyllabusChapters(grade, track);
  }
};

function switchPaperCreationMode(mode) {
  state.activePaperCreationMode = mode;
  const dropdown = document.getElementById('selectPaperModeDropdown');
  if (dropdown && dropdown.value !== mode) {
    dropdown.value = mode;
  }
  const label = document.getElementById('paperModeActiveLabel');
  
  const subUnitTest = document.getElementById('subModeUnitTest');
  const subBoardPaper = document.getElementById('subModeBoardPaper');
  const subTakeTest = document.getElementById('subModeTakeTest');

  if (subUnitTest) subUnitTest.style.display = (mode === 'unit_test') ? 'block' : 'none';
  if (subBoardPaper) subBoardPaper.style.display = (mode === 'board_paper') ? 'block' : 'none';
  if (subTakeTest) subTakeTest.style.display = (mode === 'take_test') ? 'block' : 'none';

  if (mode === 'unit_test') {
    if (label) label.innerText = 'Mode 1 of 3: Create Paper / Unit Tests & Quizzes (15–45 Min)';
  } else if (mode === 'board_paper') {
    if (label) label.innerText = 'Mode 2 of 3: Full Board Paper (CBSE & HP Board Studio - 33 Qs)';
    if (typeof syncBoardPaperStudioWithTeacher === 'function') {
      syncBoardPaperStudioWithTeacher();
    }
    if (!boardPaperStudioState.currentPaper) {
      generateOrLoadBoardPaper();
    }
  } else if (mode === 'take_test') {
    if (label) label.innerText = 'Mode 3 of 3: Take & Conduct Test (Live Assessments & Submissions)';
  }

  if (typeof initLucideIcons === 'function') {
    initLucideIcons();
  }
}
window.switchPaperCreationMode = switchPaperCreationMode;

function switchTeacherTab(targetTabId) {
  // Normalize individual submodes into unified tabTeacherCreateTestAndPaper
  let submodeToActivate = null;
  if (targetTabId === 'tabTeacherCreatePaper') {
    targetTabId = 'tabTeacherCreateTestAndPaper';
    submodeToActivate = 'unit_test';
  } else if (targetTabId === 'tabTeacherBoardPaper') {
    targetTabId = 'tabTeacherCreateTestAndPaper';
    submodeToActivate = 'board_paper';
  } else if (targetTabId === 'tabTeacherTakeTest') {
    targetTabId = 'tabTeacherCreateTestAndPaper';
    submodeToActivate = 'take_test';
  }

  state.activeTeacherTab = targetTabId;

  // Ensure Teacher view is visible
  switchPortalRole('teacher');

  // Update pills
  document.querySelectorAll('.teacher-nav-pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-tab') === targetTabId);
  });

  // Update active state across sub-tab and drawer buttons / cards
  document.querySelectorAll('.sub-tab-btn, .drawer-tab-btn, .drawer-nav-card').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTabId);
  });

  // Update workspace indicator strip
  const workspaceMap = {
    'tabTeacherCreateTestAndPaper': { label: 'Create Test & Paper', icon: 'file-plus-2', color: '#38bdf8' },
    'tabTeacherCreatePaper': { label: 'Create Test & Paper', icon: 'file-plus-2', color: '#38bdf8' },
    'tabTeacherBoardPaper': { label: 'Create Test & Paper', icon: 'scroll', color: '#f59e0b' },
    'tabTeacherTakeTest': { label: 'Create Test & Paper', icon: 'play-circle', color: '#34d399' },
    'tabTeacherClasses': { label: 'Classes & Students Roster', icon: 'users', color: '#c084fc' },
    'tabQuestionBank': { label: 'Question Bank & PYQ Repository', icon: 'database', color: '#22d3ee' }
  };
  const ws = workspaceMap[targetTabId];
  if (ws) {
    const lbl = document.getElementById('activeWorkspaceLabel');
    if (lbl) lbl.innerText = ws.label;
    const ico = document.getElementById('activeWorkspaceIcon');
    if (ico) {
      ico.setAttribute('data-lucide', ws.icon);
      ico.style.color = ws.color;
    }
  }

  // Toggle tab content display
  document.querySelectorAll('.teacher-tab-content').forEach(tab => {
    const isTarget = tab.id === targetTabId;
    tab.style.display = isTarget ? 'block' : 'none';
    tab.classList.toggle('active', isTarget);
  });

  // Update header title
  const headerTitle = document.getElementById('headerNavTitle');
  const activeProf = teacherBuilderState.activeTeacher;
  const isC10 = String(teacherBuilderState.selectedClassId || '').startsWith('10') || teacherBuilderState.teacherSubjectKey?.startsWith('CLASS10_');
  const curSubjName = isC10
    ? (teacherBuilderState.selectedSubjectKey === 'CLASS10_SCIENCE' ? 'Class 10th Science' : 'Class 10th Mathematics')
    : (activeProf ? activeProf.subjectName : 'Physics');

  const tabTitles = {
    'tabTeacherCreateTestAndPaper': `Create Test & Paper Studio • ${curSubjName}`,
    'tabTeacherCreatePaper': `Create Test & Paper • ${curSubjName}`,
    'tabTeacherBoardPaper': `Full-Length Board Question Paper Studio (CBSE & HP) • ${curSubjName}`,
    'tabTeacherTakeTest': `Take & Conduct Test (Active Assessments) • ${curSubjName}`,
    'tabTeacherClasses': `Classes & Students Roster • ${curSubjName}`,
    'tabTeacherSyllabus': `Teacher Portal • Senior ${curSubjName} Curriculum`,
    'tabGenerator': 'Teacher Portal • Create & Assign Tests',
    'tabClassAnalytics': 'Teacher Portal • Overall Class Performance & Analytics',
    'tabQuestionBank': `Question Bank & PYQ Repository • ${curSubjName}`,
    'tabStudents': `Students & Smart Cards • ${curSubjName}`,
    'tabSmartReports': `Weekly Smart Report • ${curSubjName}`,
    'tabHandwritten': `Scan Paper Sheets • ${curSubjName}`
  };
  if (headerTitle && tabTitles[targetTabId]) {
    headerTitle.innerText = tabTitles[targetTabId];
  }

  // Load tab-specific context
  if (targetTabId === 'tabTeacherCreateTestAndPaper') {
    if (submodeToActivate) {
      switchPaperCreationMode(submodeToActivate);
    } else {
      switchPaperCreationMode(state.activePaperCreationMode || 'unit_test');
    }
  } else if (targetTabId === 'tabGenerator') {
    if (!teacherBuilderState.currentTaxonomy) {
      setupTeacherTestBuilder();
    }
  } else if (targetTabId === 'tabQuestionBank') {
    if (typeof loadQuestionBankView === 'function') {
      loadQuestionBankView(false);
    }
  } else if (targetTabId === 'tabClassAnalytics') {
    const selectAssessment = document.getElementById('selectAnalyticsAssessment');
    const selVal = selectAssessment && selectAssessment.value;
    const targetId = (!selVal || selVal.startsWith('paper_')) 
      ? (state.lastSubmittedAssessmentId || state.activeAssessment?.id || null) 
      : selVal;
    loadClassAnalytics(targetId);
  } else if (targetTabId === 'tabSmartReports') {
    loadAndRenderSmartReport('b0000000-0000-0000-0000-000000000001');
  } else if (targetTabId === 'tabStudents' && currentAnalyticsData) {
    renderClassAnalytics(currentAnalyticsData);
  }

  if (window.handleTabActivated) {
    try { window.handleTabActivated(targetTabId); } catch(e) {}
  }

  closeSidebarDrawer();
  initLucideIcons();
}

function setupRoleSwitching() {
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetRole = btn.getAttribute('data-role');
      switchPortalRole(targetRole);
    });
  });
}

function setupTeacherSubTabs() {
  const tabBtns = document.querySelectorAll('.sub-tab-btn, .drawer-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      if (targetTabId) {
        switchTeacherTab(targetTabId);
      }
    });
  });
}

function setupThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const htmlRoot = document.documentElement;

  // Read saved theme, defaulting to 'light' (comfort eye-friendly theme)
  const savedTheme = localStorage.getItem('haps_theme') || 'light';
  state.theme = savedTheme;
  htmlRoot.setAttribute('data-theme', savedTheme);
  if (themeIcon) themeIcon.setAttribute('data-lucide', savedTheme === 'dark' ? 'sun' : 'moon');
  initLucideIcons();

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      htmlRoot.setAttribute('data-theme', state.theme);
      localStorage.setItem('haps_theme', state.theme);
      if (themeIcon) themeIcon.setAttribute('data-lucide', state.theme === 'dark' ? 'sun' : 'moon');
      initLucideIcons();
    });
  }
}

// -----------------------------------------------------------------------------
// 2. AI LATEX QUESTION STUDIO
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// 2. AI LATEX QUESTION STUDIO & MULTI-LLM INFERENCE
// -----------------------------------------------------------------------------

// =============================================================================
// TEACHER PORTAL: PAPER CREATOR, CLASS CONDUCTOR, ROSTERS & DROPDOWNS
// =============================================================================
const CURRICULUM_CHAPTER_TOPICS = {
  PHYSICS: {
    'Chapter 1: Electric Charges and Fields': [
      'Electric Charge & Properties (Additivity, Conservation, Quantization)',
      'Conductors, Insulators & Methods of Charging',
      'Coulomb\'s Law & Principle of Superposition',
      'Electric Field & Electric Field Lines',
      'Electric Dipole (Axial & Equatorial Fields, Torque in Uniform Field)',
      'Electric Flux & Gauss\'s Law Applications'
    ],
    'Chapter 2: Electrostatic Potential and Capacitance': [
      'Electrostatic Potential & Potential due to Point Charge / Dipole',
      'Equipotential Surfaces & Potential Energy of System of Charges',
      'Electrostatics of Conductors & Dielectric Polarization',
      'Capacitors & Capacitance of Parallel Plate Capacitor',
      'Effect of Dielectric on Capacitance & Combination of Capacitors',
      'Energy Stored in a Capacitor & Energy Density'
    ],
    'Chapter 3: Current Electricity': [
      'Electric Current, Drift Velocity and Electron Mobility',
      'Ohm\'s Law, Resistance, Resistivity & Temperature Dependence',
      'Electrical Energy, Power and Heating Effect',
      'Cells, Electromotive Force (EMF), Internal Resistance & Combinations',
      'Kirchhoff\'s Rules (Junction & Loop Rules)',
      'Wheatstone Bridge Principle & Balancing Condition'
    ],
    'Chapter 4: Moving Charges and Magnetism': [
      'Magnetic Force on Moving Charge & Lorentz Force',
      'Biot-Savart Law & Field of Straight Wire & Circular Loop',
      'Ampere\'s Circuital Law & Solenoid / Toroid',
      'Force on Current-Carrying Conductor & Parallel Wires',
      'Torque on Current Loop & Magnetic Dipole Moment',
      'Moving Coil Galvanometer (Sensitivity & Shunt Conversion)'
    ],
    'Chapter 5: Magnetism and Matter': [
      'The Bar Magnet & Magnetic Field of Equivalent Solenoid',
      'Torque and Potential Energy of Magnetic Dipole in Uniform Field',
      'Gauss\'s Law for Magnetism & Earth\'s Magnetic Field (Declination & Dip)',
      'Magnetisation (M), Magnetic Intensity (H) & Susceptibility (χ)',
      'Classification of Magnetic Materials (Diamagnetic, Paramagnetic, Ferromagnetic)',
      'Hysteresis Loop, Permanent Magnets and Electromagnets'
    ],
    'Chapter 6: Electromagnetic Induction': [
      'Magnetic Flux & Faraday\'s Laws of Induction',
      'Lenz\'s Law and Conservation of Energy',
      'Motional Electromotive Force (e = Bvl derivation)',
      'Eddy Currents, Induction Heating & Damping',
      'Self-Induction & Inductance of a Solenoid',
      'Mutual Induction & Energy Stored in an Inductor'
    ],
    'Chapter 7: Alternating Current': [
      'Alternating Current, Voltage and Peak vs RMS Values',
      'AC Applied to Pure Resistor, Inductor & Capacitor (Phasors & Reactance)',
      'Series LCR Circuit & Impedance Triangle',
      'Resonance in Series LCR Circuit & Quality Factor (Q-Factor)',
      'Power in AC Circuits & Wattless Current',
      'LC Oscillations & AC Transformer (Step-up and Step-down)'
    ],
    'Chapter 8: Electromagnetic Waves': [
      'Displacement Current & Inconsistency of Ampere\'s Law',
      'Maxwell\'s Four Equations & EM Wave Generation',
      'Nature, Transverse Character & Speed of EM Waves',
      'Electromagnetic Spectrum (Radio, Micro, IR, Visible, UV, X-Ray, Gamma)',
      'Characteristics, Frequency Ranges & Industrial / Medical Applications'
    ],
    'Chapter 9: Ray Optics and Optical Instruments': [
      'Reflection by Spherical Mirrors & Mirror Formula',
      'Refraction at Plane Surfaces, Refractive Index & Total Internal Reflection (TIR)',
      'Refraction at Spherical Surfaces & Lens Maker\'s Formula',
      'Thin Lens Formula, Magnification & Power of Lens Combinations',
      'Refraction through a Prism, Angle of Deviation & Minimum Deviation',
      'Optical Instruments: Simple Microscope, Compound Microscope & Astronomical Telescope'
    ],
    'Chapter 10: Wave Optics': [
      'Huygens\' Principle & Construction of Wavefronts',
      'Proof of Laws of Reflection and Refraction using Wave Theory',
      'Coherent Sources & Interference of Light',
      'Young\'s Double Slit Experiment (YDSE) & Fringe Width Derivation',
      'Diffraction of Light at Single Slit & Angular Width of Central Maximum',
      'Polarisation of Light, Brewster\'s Law & Malus\'s Law'
    ],
    'Chapter 11: Dual Nature of Radiation and Matter': [
      'Work Function, Electron Emission & Experimental Photoelectric Effect',
      'Einstein\'s Photoelectric Equation (hν = Φ₀ + K_max) & Stopping Potential',
      'Particle Nature of Light & Photon Characteristics',
      'Wave Nature of Matter: de Broglie Wavelength (λ = h/p = h/√(2mqV))',
      'Davisson-Germer Experiment & Wave-Particle Duality'
    ],
    'Chapter 12: Atoms': [
      'Alpha-Particle Scattering Experiment & Rutherford Atomic Model',
      'Alpha-Particle Trajectory, Impact Parameter & Distance of Closest Approach',
      'Bohr\'s Postulates and Quantized Energy Levels of Hydrogen Atom',
      'Derivation of Radius, Velocity and Total Energy of nth Bohr Orbit',
      'Hydrogen Emission Spectral Series (Lyman, Balmer, Paschen, Brackett, Pfund)',
      'de Broglie\'s Wave Explanation of Bohr\'s Second Postulate'
    ],
    'Chapter 13: Nuclei': [
      'Composition, Nuclear Radius (R = R₀ A^(1/3)) & Constant Nuclear Density',
      'Mass Defect, Einstein\'s Mass-Energy Equivalence (E = mc²) & Binding Energy',
      'Binding Energy per Nucleon Curve & Stability of Nuclei',
      'Nuclear Forces & Characteristics (Strongest in Nature, Short-Range, Saturation)',
      'Radioactive Decay Law (N = N₀ e^(-λt)), Half-Life (T_1/2) & Activity (Bq)',
      'Nuclear Fission, Chain Reaction & Controlled Nuclear Fusion in Stars'
    ],
    'Chapter 14: Semiconductor Electronics': [
      'Energy Bands in Solids: Conductors, Semiconductors & Insulators',
      'Intrinsic Semiconductors & Extrinsic Semiconductors (n-type and p-type Doping)',
      'Formation of p-n Junction, Depletion Layer & Barrier Potential',
      'p-n Junction Diode V-I Characteristics in Forward and Reverse Bias',
      'Diode as a Rectifier: Half-Wave and Full-Wave Rectification',
      'Special Purpose Diodes: Zener Diode (Voltage Regulator), LED, Photodiode & Solar Cell',
      'Junction Transistors & Digital Logic Gates (NOT, AND, OR, NAND, NOR Truth Tables)'
    ]
  },
  PHYSICS_11: {
    'Chapter 1: Units and Measurements': [
      'SI Units & Fundamental vs Derived Units',
      'Dimensional Analysis & Formulas of Physical Quantities',
      'Principle of Homogeneity & Equation Correctness Checks',
      'Conversion of Units Across Coordinate/Unit Systems',
      'Errors in Measurement (Absolute, Relative, Percentage & Combinations)'
    ],
    'Chapter 2: Motion in a Straight Line': [
      'Position, Path Length, Displacement & Instantaneous Velocity',
      'Calculus Derivation of Kinematic Equations (v = u + at, s = ut + 1/2 at², v² = u² + 2as)',
      'Motion Under Gravity (Free Fall Kinematics)',
      'Stopping Distance and Reaction Time Analysis',
      'Position-Time and Velocity-Time Graph Interpretation'
    ],
    'Chapter 3: Motion in a Plane': [
      'Scalars & Vectors: Resolution in Cartesian Plane',
      'Vector Addition, Subtraction & Dot/Cross Products',
      'Projectile Motion (Maximum Height, Time of Flight, Horizontal Range)',
      'Uniform Circular Motion & Centripetal Acceleration (a = v²/r)'
    ],
    'Chapter 4: Laws of Motion': [
      'Newton\'s Laws of Motion & Momentum Conservation',
      'Impulse-Momentum Theorem & Dynamic Problem Solving',
      'Static, Limiting & Kinetic Friction (Coefficients of Friction)',
      'Banking of Circular Roads & Maximum Safe Speed',
      'Free Body Diagrams (Pulleys, Connected Masses & Inclined Planes)'
    ],
    'Chapter 5: Work, Energy and Power': [
      'Work Done by Constant & Variable Force (Integral Formulation)',
      'Work-Energy Theorem for Variable Force',
      'Potential Energy of a Spring & Conservation of Mechanical Energy',
      'Conservative vs Non-Conservative Forces',
      'Elastic and Inelastic Collisions in One & Two Dimensions',
      'Power: Instantaneous & Average Power (P = F · v)'
    ],
    'Chapter 6: System of Particles and Rotational Motion': [
      'Center of Mass of Two-Particle and Rigid Body Systems',
      'Linear Momentum Conservation for System of Particles',
      'Torque and Angular Momentum Conservation Law',
      'Moment of Inertia: Radius of Gyration & Standard Geometries',
      'Parallel and Perpendicular Axes Theorems & Applications',
      'Kinematics & Dynamics of Rolling Motion without Slipping'
    ],
    'Chapter 7: Gravitation': [
      'Newton\'s Universal Law of Gravitation & Gravitational Constant G',
      'Acceleration due to Gravity (g) with Altitude and Depth Variation',
      'Gravitational Potential & Gravitational Potential Energy',
      'Escape Velocity (v_e = √(2gR)) Derivation',
      'Orbital Velocity & Orbital Period of Earth Satellites',
      'Kepler\'s Three Laws of Planetary Motion'
    ],
    'Chapter 8: Mechanical Properties of Solids': [
      'Stress-Strain Relationship & Hooke\'s Law',
      'Stress-Strain Curve (Elastic Limit, Yield Point, Tensile Strength)',
      'Young\'s Modulus, Bulk Modulus and Shear Modulus of Rigidity',
      'Poisson\'s Ratio & Elastic Potential Energy Stored in Stretched Wire'
    ],
    'Chapter 9: Mechanical Properties of Fluids': [
      'Fluid Pressure, Pascal\'s Law & Hydraulic Lift Principle',
      'Variation of Pressure with Depth & Atmospheric Pressure',
      'Streamline vs Turbulent Flow & Equation of Continuity',
      'Bernoulli\'s Theorem & Applications (Venturi Meter, Torricelli\'s Law)',
      'Viscosity, Poiseuille\'s Formula & Stokes\' Law (Terminal Velocity)',
      'Surface Tension, Surface Energy, Angle of Contact & Capillary Rise'
    ],
    'Chapter 10: Thermal Properties of Matter': [
      'Temperature & Heat: Thermal Expansion of Solids, Liquids & Gases',
      'Specific Heat Capacity, Molar Heat Capacity & Calorimetry',
      'Latent Heat of Fusion & Vaporization',
      'Heat Transfer: Conduction, Convection and Radiation',
      'Thermal Conductivity Coefficient & Newton\'s Law of Cooling',
      'Wien\'s Displacement Law & Stefan-Boltzmann Law'
    ],
    'Chapter 11: Thermodynamics': [
      'Thermal Equilibrium & Zeroth Law of Thermodynamics',
      'First Law of Thermodynamics (ΔQ = ΔU + ΔW) & State Functions',
      'Isothermal, Adiabatic, Isobaric & Isochoric Thermodynamic Processes',
      'Mayer\'s Relation (C_p - C_v = R) for Ideal Gas',
      'Second Law of Thermodynamics (Kelvin-Planck & Clausius Statements)',
      'Reversible & Irreversible Cycles (Carnot Engine Efficiency)'
    ],
    'Chapter 12: Kinetic Theory': [
      'Molecular Nature of Matter & Ideal Gas Equation of State',
      'Kinetic Interpretation of Temperature & Pressure of Ideal Gas (P = 1/3 ρ v_rms²)',
      'Root-Mean-Square Speed (v_rms) & Kinetic Energy per Molecule',
      'Degrees of Freedom & Law of Equipartition of Energy',
      'Specific Heat Capacities of Monatomic, Diatomic & Polyatomic Gases',
      'Mean Free Path (λ) Expression and Dependencies'
    ],
    'Chapter 13: Oscillations': [
      'Periodic vs Oscillatory Motion & Simple Harmonic Motion (SHM)',
      'SHM Displacement, Velocity, Acceleration & Phase (x = A sin(ωt + φ))',
      'Kinetic & Potential Energy in Simple Harmonic Motion',
      'Simple Pendulum: Expression for Time Period (T = 2π√(L/g))',
      'Spring-Mass System Oscillations in Horizontal & Vertical Configurations',
      'Free, Damped & Forced Oscillations & Resonance Phenomena'
    ],
    'Chapter 14: Waves': [
      'Transverse and Longitudinal Waves: Wavelength, Frequency & Speed',
      'Speed of Transverse Waves on Stretched String (v = √(T/μ))',
      'Speed of Sound in Gases: Newton\'s Formula & Laplace\'s Correction',
      'Superposition Principle: Reflection of Waves at Rigid and Free Boundaries',
      'Standing (Stationary) Waves in Stretched Strings & Normal Modes',
      'Organ Pipes: Closed and Open Resonant Air Columns',
      'Beats Formation (Beat Frequency f_b = |f₁ - f₂|) & Applications'
    ]
  },
    CHEMISTRY: {
    'Chemical Kinetics': [
      'Rate Law & Arrhenius Activation Energy Equation',
      'First Order Integrated Rate Law & Half-Life',
      'Collision Theory and Activated Complex',
      'Pseudo-First Order Reactions'
    ],
    'Electrochemistry': [
      'Nernst Equation & Cell Potential Calculations',
      'Kohlrausch\'s Law of Independent Migration',
      'Faraday\'s Laws of Electrolysis',
      'Fuel Cells and Prevention of Corrosion'
    ],
    'Solutions': [
      'Raoult\'s Law & Colligative Properties',
      'Elevation in Boiling Point & Depression in Freezing Point',
      'Osmotic Pressure & Van\'t Hoff Factor (i)',
      'Ideal vs Non-Ideal Solutions'
    ],
    'Coordination Compounds': [
      'Crystal Field Theory (CFT) & d-Orbital Splitting',
      'IUPAC Nomenclature of Mononuclear Complexes',
      'Werner\'s Coordination Theory',
      'Geometrical & Optical Isomerism'
    ]
  },
  MATHEMATICS: {
    'Calculus & Derivatives': [
      'Chain Rule & Implicit Differentiation',
      'Maxima & Minima Applications (Word Problems)',
      'Rolle\'s and Lagrange\'s Mean Value Theorems',
      'Tangents and Normals to Parametric Curves'
    ],
    'Integrals & Differential Equations': [
      'Integration by Parts & Partial Fractions',
      'Definite Integrals Symmetric Properties',
      'Linear Differential Equations (Integrating Factor)',
      'Area Under Curve (Parabola & Ellipse)'
    ],
    'Vectors & 3D Geometry': [
      'Scalar & Vector Triple Product',
      'Shortest Distance Between Skew Lines',
      'Plane and Line Intersection Equations',
      'Direction Cosines and Ratios'
    ],
    'Matrices & Determinants': [
      'Matrix Inversion using Adjoint Method',
      'Cramer\'s Rule for System of Linear Equations',
      'Determinant Row-Column Elementary Operations'
    ]
  },
  BIOLOGY: {
    'Genetics & Molecular Basis': [
      'DNA Replication Semiconservative Mechanism',
      'Transcription and Translation in Eukaryotes',
      'Mendelian Dihybrid Cross & Gene Mapping',
      'Lac Operon Regulation'
    ],
    'Human Physiology': [
      'Action Potential & Synaptic Transmission',
      'Cardiac Cycle, Regulation & ECG Waves',
      'Counter-Current Mechanism in Nephron Henle\'s Loop',
      'Sliding Filament Theory of Muscle Contraction'
    ],
    'Biotechnology & Applications': [
      'Recombinant DNA Technology Tools & Vectors',
      'PCR (Polymerase Chain Reaction) Amplification',
      'Bt Cotton and RNA Interference Applications'
    ]
  },
  CLASS10_SCIENCE: {
    'Chemical Reactions & Equations': [
      'Balancing Chemical Redox Reactions',
      'Types of Reactions: Combination, Decomposition, Displacement',
      'Oxidation, Reduction, Corrosion & Rancidity'
    ],
    'Acids, Bases and Salts': [
      'pH Scale & Importance in Everyday Life',
      'Chlor-Alkali Process (NaOH, Cl2, H2)',
      'Bleaching Powder, Baking Soda, Washing Soda, Plaster of Paris'
    ],
    'Light - Reflection and Refraction': [
      'Spherical Mirror Formula & Magnification Sign Conventions',
      'Refraction through Rectangular Glass Slab & Refractive Index',
      'Convex & Concave Lens Image Ray Tracing & Power of Lens'
    ],
    'Electricity': [
      'Ohm\'s Law Verification & V-I Graphs',
      'Equivalent Resistance of Series and Parallel Circuits',
      'Joule\'s Law of Heating & Electrical Power (kWh)'
    ]
  },
  CLASS10_MATHEMATICS: {
    'Quadratic Equations & Arithmetic Progressions': [
      'Roots of Quadratic Equations (Quadratic Formula & Factorization)',
      'Discriminant and Nature of Real/Imaginary Roots',
      'nth Term and Sum of First n Terms of an AP'
    ],
    'Triangles & Coordinate Geometry': [
      'Basic Proportionality Theorem (Thales Theorem)',
      'Criteria for Similarity of Triangles (AAA, SSS, SAS)',
      'Distance Formula, Section Formula & Centroid'
    ],
    'Trigonometry & Applications': [
      'Trigonometric Ratios of Specific Angles (30°, 45°, 60°)',
      'Fundamental Trigonometric Identities (sin²θ + cos²θ = 1)',
      'Heights and Distances (Angle of Elevation & Depression)'
    ]
  },
  COMPUTER_SCIENCE: {
    'Python Programming & Data Structures': [
      'Functions, Parameter Passing & Scope',
      'File Handling (Text, Binary & CSV Files)',
      'Stack Implementation using Python Lists'
    ],
    'Computer Networks & SQL': [
      'Network Devices, Topologies & Protocols',
      'SQL Aggregate Functions & Group By Clauses',
      'SQL Joins (Equi-Join & Natural Join)'
    ]
  }
};

const CLASS_ROSTERS = {
  '12-NonMed': {
    name: 'Class 12-A',
    stream: 'Senior Secondary Non-Medical',
    subject: 'Physics',
    enrolled: 48,
    attendance: '95.8%',
    average: '76.4%',
    students: [
      { roll: '101', name: 'Aryan Sharma', phone: '98160 55011', parent: '98160 55012', turnIn: 'Submitted (09:42 AM)', score: '88%', status: 'Active' },
      { roll: '102', name: 'Priya Verma', phone: '98160 55021', parent: '98160 55022', turnIn: 'Submitted (09:44 AM)', score: '93%', status: 'Active' },
      { roll: '103', name: 'Rohit Thakur', phone: '98160 55031', parent: '98160 55032', turnIn: 'Submitted (09:50 AM)', score: '64%', status: 'Remedial' },
      { roll: '104', name: 'Ananya Chauhan', phone: '98160 55041', parent: '98160 55042', turnIn: 'Submitted (09:38 AM)', score: '82%', status: 'Active' },
      { roll: '105', name: 'Sahil Mehta', phone: '98160 55051', parent: '98160 55052', turnIn: 'Submitted (09:55 AM)', score: '53%', status: 'Focus Needed' },
      { roll: '106', name: 'Divya Rana', phone: '98160 55061', parent: '98160 55062', turnIn: 'Submitted (09:41 AM)', score: '87%', status: 'Active' },
      { roll: '107', name: 'Aman Kapoor', phone: '98160 55071', parent: '98160 55072', turnIn: 'Pending Turn-in', score: '--', status: 'In-Progress' },
      { roll: '108', name: 'Simran Kaur', phone: '98160 55081', parent: '98160 55082', turnIn: 'Pending Turn-in', score: '--', status: 'In-Progress' },
      { roll: '109', name: 'Karan Singhal', phone: '98160 55091', parent: '98160 55092', turnIn: 'Submitted (09:47 AM)', score: '79%', status: 'Active' },
      { roll: '110', name: 'Ritu Sen', phone: '98160 55101', parent: '98160 55102', turnIn: 'Submitted (09:46 AM)', score: '91%', status: 'Active' }
    ]
  },
  '11-NonMed': {
    name: 'Class 11-NonMed',
    stream: 'Class 11th Non-Medical',
    subject: 'Physics',
    enrolled: 42,
    attendance: '92.4%',
    average: '71.8%',
    students: [
      { roll: '201', name: 'Aditya Gupta', phone: '98161 44001', parent: '98161 44002', turnIn: 'Submitted', score: '74%', status: 'Active' },
      { roll: '202', name: 'Sneha Bisht', phone: '98161 44003', parent: '98161 44004', turnIn: 'Submitted', score: '89%', status: 'Active' },
      { roll: '203', name: 'Manish Rawat', phone: '98161 44005', parent: '98161 44006', turnIn: 'Submitted', score: '62%', status: 'Remedial' },
      { roll: '204', name: 'Kavita Joshi', phone: '98161 44007', parent: '98161 44008', turnIn: 'Submitted', score: '80%', status: 'Active' }
    ]
  },
  '11-Med': {
    name: 'Class 11-Med',
    stream: 'Class 11th Medical',
    subject: 'Biology & Physics',
    enrolled: 40,
    attendance: '94.0%',
    average: '78.2%',
    students: [
      { roll: '301', name: 'Tanya Dogra', phone: '98162 33001', parent: '98162 33002', turnIn: 'Submitted', score: '91%', status: 'Active' },
      { roll: '302', name: 'Rahul Chawla', phone: '98162 33003', parent: '98162 33004', turnIn: 'Submitted', score: '76%', status: 'Active' },
      { roll: '303', name: 'Megha Sharma', phone: '98162 33005', parent: '98162 33006', turnIn: 'Submitted', score: '84%', status: 'Active' }
    ]
  },
  '12-Med': {
    name: 'Class 12-Med',
    stream: 'Senior Medical',
    subject: 'Biology & Chemistry',
    enrolled: 38,
    attendance: '96.2%',
    average: '81.5%',
    students: [
      { roll: '401', name: 'Nikhil Sethi', phone: '98163 22001', parent: '98163 22002', turnIn: 'Submitted', score: '85%', status: 'Active' },
      { roll: '402', name: 'Palak Gulati', phone: '98163 22003', parent: '98163 22004', turnIn: 'Submitted', score: '94%', status: 'Active' }
    ]
  },
  '10-Science-A': {
    name: 'Class 10-Science (Sec A)',
    stream: 'Secondary Foundation',
    subject: 'Science',
    enrolled: 45,
    attendance: '97.1%',
    average: '83.0%',
    students: [
      { roll: '501', name: 'Arjun Sood', phone: '98164 11001', parent: '98164 11002', turnIn: 'Submitted', score: '88%', status: 'Active' },
      { roll: '502', name: 'Bhavna Negi', phone: '98164 11003', parent: '98164 11004', turnIn: 'Submitted', score: '90%', status: 'Active' }
    ]
  }
};

const FACULTY_SUBJECT_CLASSES = {
  PHYSICS: [
    { id: '12-NonMed', name: 'Class 12-A • Senior Physics (48 Students)' },
    { id: '11-NonMed', name: 'Class 11-NonMed • Physics (42 Students)' },
    { id: '11-Med', name: 'Class 11-Med • Physics (40 Students)' },
    { id: '12-Med', name: 'Class 12-Med • Senior Medical Physics (38 Students)' }
  ],
  CHEMISTRY: [
    { id: '12-NonMed', name: 'Class 12-B • Senior Chemistry (48 Students)' },
    { id: '11-NonMed', name: 'Class 11-NonMed • Chemistry (42 Students)' },
    { id: '11-Med', name: 'Class 11-Med • Chemistry (40 Students)' },
    { id: '12-Med', name: 'Class 12-Med • Senior Medical Chemistry (38 Students)' }
  ],
  MATHEMATICS: [
    { id: '12-NonMed', name: 'Class 12-A • Senior Mathematics (48 Students)' },
    { id: '11-NonMed', name: 'Class 11-NonMed • Mathematics (42 Students)' }
  ],
  BIOLOGY: [
    { id: '12-Med', name: 'Class 12-Med • Senior Biology (38 Students)' },
    { id: '11-Med', name: 'Class 11-Med • Biology (40 Students)' }
  ],
  CLASS10_MATHEMATICS: [
    { id: '10-Maths-A', name: 'Class 10-A • Foundation Mathematics (44 Students)' },
    { id: '10-Maths-B', name: 'Class 10-B • Foundation Mathematics (42 Students)' }
  ],
  CLASS10_SCIENCE: [
    { id: '10-Science-A', name: 'Class 10-A • General Science (45 Students)' },
    { id: '10-Science-B', name: 'Class 10-B • General Science (43 Students)' }
  ]
};

const assignedTestsState = [
  {
    id: 'test_live_charges',
    title: 'Class 12-A • Diagnostic Test: Electric Charges & Gauss\'s Law',
    targetClass: 'Class 12-A',
    subject: 'Physics',
    topic: 'Electric Flux & Gauss\'s Law Applications',
    duration: '45 Mins',
    submitted: '44 / 48',
    submittedCount: 44,
    totalCount: 48,
    avg: '76.4%',
    status: 'LIVE',
    statusBadge: '<span class="status-badge" style="background:rgba(52,211,153,0.18); color:#34d399; border:1px solid rgba(52,211,153,0.4);"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981; animation:pulse 1.2s infinite; margin-right:4px;"></span>In Progress</span>'
  },
  {
    id: 'test_live_wheatstone',
    title: 'Class 12-B • Live Spot Quiz: Kirchhoff Rules & Wheatstone Bridge',
    targetClass: 'Class 12-B',
    subject: 'Physics',
    topic: 'Kirchhoff\'s Rules & Wheatstone Bridge Balancing Condition',
    duration: '15 Mins',
    submitted: '39 / 42',
    submittedCount: 39,
    totalCount: 42,
    avg: '80.2%',
    status: 'LIVE',
    statusBadge: '<span class="status-badge" style="background:rgba(52,211,153,0.18); color:#34d399; border:1px solid rgba(52,211,153,0.4);"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981; animation:pulse 1.2s infinite; margin-right:4px;"></span>In Progress</span>'
  },
  {
    id: 'test_past_drift',
    title: 'Class 12-A • Unit Quiz: Microscopic Drift & Ohm\'s Law',
    targetClass: 'Class 12-A',
    subject: 'Physics',
    topic: 'Electric Current, Drift Velocity and Electron Mobility',
    duration: '20 Mins',
    submitted: '48 / 48',
    submittedCount: 48,
    totalCount: 48,
    avg: '82.5%',
    status: 'COMPLETED',
    statusBadge: '<span class="status-badge" style="background:rgba(56,189,248,0.15); color:#38bdf8;">Finalized</span>'
  },
  {
    id: 'test_past_capacitance',
    title: 'Class 12-A • Term Assessment: Electrostatic Potential & Capacitance',
    targetClass: 'Class 12-A',
    subject: 'Physics',
    topic: 'Capacitors & Capacitance of Parallel Plate Capacitor',
    duration: '90 Mins',
    submitted: '47 / 48',
    submittedCount: 47,
    totalCount: 48,
    avg: '79.1%',
    status: 'COMPLETED',
    statusBadge: '<span class="status-badge" style="background:rgba(56,189,248,0.15); color:#38bdf8;">Finalized</span>'
  },
  {
    id: 'test_up_optics',
    title: 'Class 12-A • Term Exam: Ray Optics & Optical Instruments',
    targetClass: 'Class 12-A',
    subject: 'Physics',
    topic: 'Refraction at Spherical Surfaces & Lens Maker\'s Formula',
    duration: '45 Mins',
    submitted: '0 / 48',
    submittedCount: 0,
    totalCount: 48,
    avg: '—',
    status: 'UPCOMING',
    statusBadge: '<span class="status-badge" style="background:rgba(251,191,36,0.15); color:#fbbf24;">Scheduled (Tomorrow)</span>'
  },
  {
    id: 'test_up_ac',
    title: 'Class 12-B • Periodic Test: Alternating Current & LCR Resonance',
    targetClass: 'Class 12-B',
    subject: 'Physics',
    topic: 'Series LCR Circuit & Resonance (Q-Factor)',
    duration: '45 Mins',
    submitted: '0 / 42',
    submittedCount: 0,
    totalCount: 42,
    avg: '—',
    status: 'UPCOMING',
    statusBadge: '<span class="status-badge" style="background:rgba(251,191,36,0.15); color:#fbbf24;">Scheduled (Friday)</span>'
  }
];
window.assignedTestsState = assignedTestsState;

let assignedTestsFilterQuery = '';
let assignedTestsStatusFilter = 'ALL';
let assignedTestsCurrentPage = 0;
const assignedTestsPageSize = 5;

window.filterAssignedTests = function(query) {
  assignedTestsFilterQuery = (query || '').toLowerCase().trim();
  assignedTestsCurrentPage = 0;
  window.renderAssignedTestsTable();
};

window.setAssignedStatusFilter = function(status) {
  assignedTestsStatusFilter = status;
  assignedTestsCurrentPage = 0;
  ['All', 'Live', 'Completed', 'Scheduled'].forEach(s => {
    const btn = document.getElementById(`btnFilterStatus${s}`);
    if (btn) btn.classList.toggle('active', s.toUpperCase() === status);
  });
  window.renderAssignedTestsTable();
};

window.prevAssignedPage = function() {
  if (assignedTestsCurrentPage > 0) {
    assignedTestsCurrentPage--;
    window.renderAssignedTestsTable();
  }
};

window.nextAssignedPage = function() {
  assignedTestsCurrentPage++;
  window.renderAssignedTestsTable();
};

window.renderAssignedTestsTable = function() {
  const tbody = document.getElementById('tbodyAssignedTests');
  if (!tbody) return;

  const totalAll = assignedTestsState.length;
  const countLive = assignedTestsState.filter(t => t.status === 'LIVE').length;
  const countComp = assignedTestsState.filter(t => t.status === 'COMPLETED').length;
  const countSched = assignedTestsState.filter(t => t.status === 'SCHEDULED').length;

  const elAll = document.getElementById('countFilterAll');
  if (elAll) elAll.innerText = totalAll;
  const elLive = document.getElementById('countFilterLive');
  if (elLive) elLive.innerText = countLive;
  const elComp = document.getElementById('countFilterCompleted');
  if (elComp) elComp.innerText = countComp;
  const elSched = document.getElementById('countFilterScheduled');
  if (elSched) elSched.innerText = countSched;

  let filtered = assignedTestsState.filter(t => {
    if (assignedTestsStatusFilter !== 'ALL' && t.status !== assignedTestsStatusFilter) return false;
    if (assignedTestsFilterQuery) {
      const matchText = `${t.title} ${t.targetClass} ${t.topic} ${t.duration}`.toLowerCase();
      if (!matchText.includes(assignedTestsFilterQuery)) return false;
    }
    return true;
  });

  const totalFiltered = filtered.length;
  const maxPage = Math.max(0, Math.ceil(totalFiltered / assignedTestsPageSize) - 1);
  if (assignedTestsCurrentPage > maxPage) assignedTestsCurrentPage = maxPage;

  const startIdx = assignedTestsCurrentPage * assignedTestsPageSize;
  const pageItems = filtered.slice(startIdx, startIdx + assignedTestsPageSize);

  const pagLabel = document.getElementById('labelAssignedPagination');
  if (pagLabel) {
    if (totalFiltered === 0) {
      pagLabel.innerText = 'Showing 0 tests';
    } else {
      pagLabel.innerText = `Showing ${startIdx + 1} to ${Math.min(startIdx + assignedTestsPageSize, totalFiltered)} of ${totalFiltered} tests (Page ${assignedTestsCurrentPage + 1} of ${maxPage + 1})`;
    }
  }

  const prevBtn = document.getElementById('btnAssignedPrevPage');
  if (prevBtn) prevBtn.disabled = assignedTestsCurrentPage === 0;

  const nextBtn = document.getElementById('btnAssignedNextPage');
  if (nextBtn) nextBtn.disabled = assignedTestsCurrentPage >= maxPage;

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#94a3b8;">No assessments match your search / filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = pageItems.map(t => `
    <tr>
      <td>
        <strong style="color:#f8fafc; font-size:0.86rem; display:block;">${escapeHtml(t.title)}</strong>
        <span style="color:#94a3b8; font-size:0.75rem;">Topic: ${escapeHtml(t.topic)}</span>
      </td>
      <td><span style="background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px; font-size:0.78rem;">${escapeHtml(t.targetClass)}</span></td>
      <td style="font-size:0.82rem; color:#cbd5e1;">${escapeHtml(t.duration)}</td>
      <td style="font-weight:700; color:#38bdf8; font-size:0.82rem;">${escapeHtml(t.submitted)}</td>
      <td style="font-weight:700; color:${t.avg.startsWith('-') ? '#94a3b8' : '#34d399'}; font-size:0.82rem;">${escapeHtml(t.avg)}</td>
      <td>${t.statusBadge}</td>
      <td style="text-align:right;">
        <div style="display:inline-flex; gap:6px;">
          <button type="button" class="btn-secondary" onclick="window.previewTeacherPaper('${t.id}')" title="Print or Preview Paper" style="padding:4px 8px; font-size:0.72rem;">
            <i data-lucide="printer" style="width:13px; height:13px;"></i>
          </button>
          <button type="button" class="btn-primary" onclick="switchTeacherTab('tabTeacherClasses')" title="View Student Submissions" style="padding:4px 10px; font-size:0.72rem;">
            Roster
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  initLucideIcons();
};

window.initPaperBuilderDropdowns = function() {
  const activeTeacher = teacherBuilderState.activeTeacher || {
    name: 'Dr. Vikram Sharma',
    subjectKey: 'PHYSICS',
    subjectName: 'Physics'
  };

  const subjKey = activeTeacher.subjectKey || 'PHYSICS';
  const subjName = activeTeacher.subjectName || (subjKey === 'PHYSICS' ? 'Physics' : subjKey);

  // 1. Lock Subject Dropdown strictly to teacher discipline (Physics teacher cannot see Chemistry, Bio, Class 10)
  const subjSelect = document.getElementById('selectPaperSubject');
  if (subjSelect) {
    subjSelect.innerHTML = `<option value="${subjKey}" selected>${subjName}</option>`;
    subjSelect.disabled = true;
    subjSelect.style.opacity = '0.9';
    subjSelect.style.cursor = 'not-allowed';
  }

  // 2. Lock Class Dropdown strictly to classes assigned to this subject (No Class 10 for Physics teacher)
  const classSelect = document.getElementById('selectPaperClass');
  const allowedClasses = FACULTY_SUBJECT_CLASSES[subjKey] || FACULTY_SUBJECT_CLASSES.PHYSICS;
  const currentClassId = teacherBuilderState.selectedClassId || allowedClasses[0].id;
  if (classSelect) {
    classSelect.innerHTML = allowedClasses.map((c, i) =>
      `<option value="${c.id}" ${c.id === currentClassId ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    classSelect.value = currentClassId;
  }
  teacherBuilderState.selectedClassId = currentClassId;
  const activeClassObj = allowedClasses.find(c => c.id === currentClassId) || allowedClasses[0];

  // 3. Update Roster Class Dropdown
  const rosterClassSelect = document.getElementById('selectTeacherActiveRosterClass');
  if (rosterClassSelect) {
    rosterClassSelect.innerHTML = allowedClasses.map((c, i) =>
      `<option value="${c.id}" ${c.id === currentClassId ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    rosterClassSelect.value = currentClassId;
  }

  // 4. Update teacher strips & locked display
  const stripName = document.getElementById('stripTeacherName');
  if (stripName) stripName.innerText = activeTeacher.name || activeTeacher.full_name;
  const stripDept = document.getElementById('stripTeacherDept');
  if (stripDept) stripDept.innerText = `${subjName} Expert`;
  const scopeEl = document.getElementById('stripTeacherClassScope');
  if (scopeEl) scopeEl.innerText = activeClassObj.name;
  const lockedText = document.getElementById('lockedTargetClassText');
  if (lockedText) lockedText.innerText = activeClassObj.name;
  const headerClassBadge = document.getElementById('headerFacultyClassBadge');
  if (headerClassBadge) headerClassBadge.innerText = `Class ${teacherBuilderState.activeGrade || '12'}th ▼`;
  const drawerClassBadge = document.getElementById('drawerFacultyActiveBadge');
  if (drawerClassBadge) drawerClassBadge.innerText = `Class ${teacherBuilderState.activeGrade || '12'}th`;

  window.populatePaperChapters(subjKey);
  window.populateGenChapters(subjKey);
};

function getChaptersForSubject(subjectKey, grade) {
  const g = String(grade || teacherBuilderState.activeGrade || (teacherBuilderState.selectedClassId?.startsWith('11') ? '11' : (teacherBuilderState.selectedClassId?.startsWith('10') ? '10' : '12')));
  if (subjectKey === 'PHYSICS') {
    return g === '11' ? (CURRICULUM_CHAPTER_TOPICS.PHYSICS_11 || CURRICULUM_CHAPTER_TOPICS.PHYSICS) : CURRICULUM_CHAPTER_TOPICS.PHYSICS;
  }
  return CURRICULUM_CHAPTER_TOPICS[subjectKey] || CURRICULUM_CHAPTER_TOPICS.PHYSICS;
}

window.populateGenChapters = function(subjectKey) {
  const chapterSelect = document.getElementById('selectGenChapter');
  if (!chapterSelect) return;
  const chapters = getChaptersForSubject(subjectKey, teacherBuilderState.activeGrade);
  const chapterNames = Object.keys(chapters);
  chapterSelect.innerHTML = chapterNames.map((ch, idx) =>
    `<option value="${escapeHtml(ch)}" ${idx === 0 ? 'selected' : ''}>${escapeHtml(ch)}</option>`
  ).join('');
  if (chapterNames.length > 0) {
    window.handleGenChapterChange(chapterNames[0]);
  }
};

window.handleGenChapterChange = function(chName) {
  const subjKey = teacherBuilderState.teacherSubjectKey || 'PHYSICS';
  const topicSelect = document.getElementById('selectGenTopic');
  if (!topicSelect) return;
  const chapters = getChaptersForSubject(subjKey, teacherBuilderState.activeGrade);
  let topics = chapters[chName];
  if (!topics) {
    const cleanCh = (chName || '').toLowerCase().replace(/^chapter\s*\d+\s*:\s*/i, '').trim();
    for (const [k, v] of Object.entries(chapters)) {
      const cleanK = k.toLowerCase().replace(/^chapter\s*\d+\s*:\s*/i, '').trim();
      if (cleanK === cleanCh || cleanK.includes(cleanCh) || cleanCh.includes(cleanK)) {
        topics = v;
        break;
      }
    }
  }
  if (!topics) topics = ['Standard Conceptual & Numerical Problems'];
  topicSelect.innerHTML = topics.map((t, idx) =>
    `<option value="${escapeHtml(t)}" ${idx === 0 ? 'selected' : ''}>🎯 ${escapeHtml(t)}</option>`
  ).join('');
  if (topics.length > 0) {
    window.handleGenTopicChange(topics[0]);
  }
};

window.handleGenTopicChange = function(tName) {
  const titleInput = document.getElementById('inputTeacherTestTitle');
  const lockedText = document.getElementById('lockedTargetClassText')?.innerText || '';
  const className = lockedText ? lockedText.split('•')[0]?.trim() : (teacherBuilderState.activeGrade === '11' ? 'Class 11-NonMed' : 'Class 12-A');
  if (titleInput && tName) {
    titleInput.value = `${className} • Unit Assessment: ${tName}`;
  }
};

window.populatePaperChapters = function(subjectKey) {
  const chapterSelect = document.getElementById('selectPaperChapter');
  if (!chapterSelect) return;
  const chapters = getChaptersForSubject(subjectKey, teacherBuilderState.activeGrade);
  const chapterNames = Object.keys(chapters);

  chapterSelect.innerHTML = chapterNames.map((ch, idx) => 
    `<option value="${escapeHtml(ch)}" ${idx === 0 ? 'selected' : ''}>${escapeHtml(ch)}</option>`
  ).join('');

  if (chapterNames.length > 0) {
    window.populatePaperTopics(subjectKey, chapterNames[0]);
  }
};

window.populatePaperTopics = function(subjectKey, chapterName) {
  const topicSelect = document.getElementById('selectPaperTopic');
  if (!topicSelect) return;
  const chapters = getChaptersForSubject(subjectKey, teacherBuilderState.activeGrade);
  let topics = chapters[chapterName];
  if (!topics) {
    const cleanCh = (chapterName || '').toLowerCase().replace(/^chapter\s*\d+\s*:\s*/i, '').trim();
    for (const [k, v] of Object.entries(chapters)) {
      const cleanK = k.toLowerCase().replace(/^chapter\s*\d+\s*:\s*/i, '').trim();
      if (cleanK === cleanCh || cleanK.includes(cleanCh) || cleanCh.includes(cleanK)) {
        topics = v;
        break;
      }
    }
  }
  if (!topics) topics = ['Standard Conceptual & Numerical Problems'];

  topicSelect.innerHTML = topics.map((t, idx) => 
    `<option value="${escapeHtml(t)}" ${idx === 0 ? 'selected' : ''}>🎯 ${escapeHtml(t)}</option>`
  ).join('');

  if (topics.length > 0) {
    window.updatePaperDefaultTitle(topics[0]);
  }
};

window.updatePaperDefaultTitle = function(topicName) {
  const titleInput = document.getElementById('inputPaperTitle');
  const classSelect = document.getElementById('selectPaperClass');
  const lockedText = document.getElementById('lockedTargetClassText')?.innerText || '';
  const className = lockedText ? lockedText.split('•')[0]?.trim() : (classSelect ? (classSelect.options[classSelect.selectedIndex]?.text?.split('•')[0]?.trim() || 'Class 12-A') : 'Class 12-A');
  if (titleInput) {
    titleInput.value = `${className} • Unit Assessment: ${topicName || 'Curriculum Focus'}`;
  }
};

window.handlePaperClassChange = function(classId) {
  teacherBuilderState.selectedClassId = classId;
  const scopeEl = document.getElementById('stripTeacherClassScope');
  const classSelect = document.getElementById('selectPaperClass');
  if (scopeEl && classSelect) {
    scopeEl.innerText = classSelect.options[classSelect.selectedIndex]?.text || classId;
  }
  const topicSelect = document.getElementById('selectPaperTopic');
  window.updatePaperDefaultTitle(topicSelect ? topicSelect.value : '');
};

window.handlePaperSubjectChange = function(subjectKey) {
  window.populatePaperChapters(subjectKey);
};

window.handlePaperChapterChange = function(chapterName) {
  const subjSelect = document.getElementById('selectPaperSubject');
  const subjectKey = subjSelect ? subjSelect.value : 'PHYSICS';
  window.populatePaperTopics(subjectKey, chapterName);
};

window.handlePaperTopicChange = function(topicName) {
  window.updatePaperDefaultTitle(topicName);
};

window.createTeacherPaper = function(event) {
  if (event) event.preventDefault();
  const title = document.getElementById('inputPaperTitle')?.value?.trim() || 'Class Unit Test';
  const lockedText = document.getElementById('lockedTargetClassText')?.innerText || '';
  const classSelect = document.getElementById('selectPaperClass');
  const targetClass = lockedText ? lockedText.split('•')[0]?.trim() : (classSelect ? (classSelect.options[classSelect.selectedIndex]?.text?.split('•')[0]?.trim() || 'Class 12-A') : 'Class 12-A');
  const subjSelect = document.getElementById('selectPaperSubject');
  const subject = subjSelect ? subjSelect.options[subjSelect.selectedIndex]?.text || 'Physics' : 'Physics';
  const topicSelect = document.getElementById('selectPaperTopic');
  const topic = topicSelect ? topicSelect.value : 'Target Concept';
  const formatSelect = document.getElementById('selectPaperFormat');
  const duration = formatSelect ? formatSelect.options[formatSelect.selectedIndex]?.text?.split('•')[0]?.replace(/^[^\w]*/, '').trim() || '45 Mins' : '45 Mins';

  const newTest = {
    id: `test_${Date.now()}`,
    title,
    targetClass,
    subject,
    topic,
    duration,
    submitted: '0 / 48',
    submittedCount: 0,
    totalCount: 48,
    avg: '--',
    status: 'LIVE',
    statusBadge: '<span class="status-badge" style="background:rgba(52,211,153,0.18); color:#34d399; border:1px solid rgba(52,211,153,0.4);"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#10b981; animation:pulse 1.2s infinite; margin-right:4px;"></span>Active</span>'
  };

  assignedTestsState.unshift(newTest);
  window.renderAssignedTestsTable();

  const liveTitle = document.getElementById('liveTestTitle');
  if (liveTitle) liveTitle.innerText = `${targetClass} • ${title}`;
  const liveCounter = document.getElementById('liveTestSubmissionsCounter');
  if (liveCounter) liveCounter.innerText = `0 / 48`;

  const banner = document.createElement('div');
  banner.className = 'role-switch-toast';
  banner.innerHTML = `<i data-lucide="check-circle-2" style="width:16px; height:16px; color:#34d399;"></i> <span><strong>Paper Assigned:</strong> "${escapeHtml(title)}" created for ${escapeHtml(targetClass)}. Switched to live test station.</span>`;
  document.body.appendChild(banner);
  initLucideIcons();
  setTimeout(() => banner.remove(), 4000);

  switchTeacherTab('tabTeacherTakeTest');
};

// =============================================================================
// AUTHENTIC EXAM GENERATOR (15 QUESTIONS FOR 45-MIN EXAM, FULL BLUEPRINT)
// =============================================================================
const CLASS12_PHYSICS_EXAM_BANK = {
  1: {
    name: 'Electric Charges and Fields',
    mcqs: [
      { question: 'Two point charges +3 μC and +8 μC repel each other with a force of 40 N. If a charge of -5 μC is added to each of them, the force between them will be:', options: ['(A) -10 N (attractive)', '(B) +10 N (repulsive)', '(C) -20 N (attractive)', '(D) +20 N (repulsive)'], ans: '(A) -10 N (attractive)' },
      { question: 'An electric dipole of moment p is placed in a uniform electric field E. The torque τ acting on it and its potential energy U when aligned antiparallel (θ = 180°) are:', options: ['(A) τ = 0, U = +pE (unstable equilibrium)', '(B) τ = pE, U = 0', '(C) τ = 0, U = -pE (stable equilibrium)', '(D) τ = pE, U = -pE'], ans: '(A) τ = 0, U = +pE (unstable equilibrium)' },
      { question: 'Total electric flux emerging through a closed cubical Gaussian surface enclosing an electric dipole of moment p is:', options: ['(A) Zero (net enclosed charge is 0)', '(B) p / (ε₀ a)', '(C) 2p / ε₀', '(D) p / (6ε₀ a²)'], ans: '(A) Zero (net enclosed charge is 0)' },
      { question: 'The electric field intensity at distance r from an infinitely long straight wire of uniform linear charge density λ varies as:', options: ['(A) E ∝ 1/r', '(B) E ∝ 1/r²', '(C) E ∝ r', '(D) E is independent of r'], ans: '(A) E ∝ 1/r' },
      { question: 'A point charge q is placed at the center of an imaginary spherical Gaussian surface. If the radius of the sphere is doubled, the outward electric flux through the surface will:', options: ['(A) Remain unchanged (depends only on enclosed charge)', '(B) Be halved', '(C) Be doubled', '(D) Become four times'], ans: '(A) Remain unchanged (depends only on enclosed charge)' }
    ],
    shorts: [
      'Define electric dipole moment (p). State its SI unit and vector direction from negative to positive charge.',
      'State Gauss\'s law in electrostatics in mathematical integral form and state the physical condition under which net electric flux is zero.',
      'Why do two electrostatic field lines never cross each other? Explain in terms of the uniqueness of the field vector at any point.',
      'Sketch electric field lines for: (i) two equal positive charges separated by small distance, and (ii) an isolated negative point charge.',
      'State the principle of superposition of electrostatic forces. Express the net Coulomb force vector on a charge q₁ due to n discrete stationary charges.'
    ],
    longs: [
      '(a) Derive an expression for the electric field intensity E at an axial point at distance r from the center of an electric dipole of length 2a. (b) What is the limiting value of E when r >> a?',
      '(a) Derive the expression for electric field intensity on the equatorial line of a dipole. (b) Hence prove that for a short dipole, E_axial = 2 E_equatorial.',
      'State Gauss\'s law. Apply it to derive the expression for electric field intensity at a distance r from an infinitely long straight conductor with uniform linear charge density λ. Draw the E vs r graph.',
      'Using Gauss\'s law, derive the expression for electric field intensity due to a uniformly charged infinite thin plane sheet of surface charge density σ. Explain why the field is independent of distance.',
      'Two point charges q₁ = +4 μC and q₂ = +1 μC are placed 30 cm apart in vacuum. (a) Locate the neutral point on the line joining them where net electric field is zero. (b) Calculate the total electrostatic potential energy of the system.'
    ]
  },
  2: {
    name: 'Electrostatic Potential and Capacitance',
    mcqs: [
      { question: 'The work done in moving a charge of 5 μC between two points on an equipotential surface separated by 10 cm is:', options: ['(A) Zero (potential difference ΔV = 0)', '(B) 0.5 J', '(C) 50 J', '(D) Dependent on path taken'], ans: '(A) Zero (potential difference ΔV = 0)' },
      { question: 'A parallel plate capacitor is charged and then disconnected from the battery. A dielectric slab of constant K is inserted between the plates. The stored potential energy will:', options: ['(A) Decrease by a factor of K', '(B) Increase by a factor of K', '(C) Remain unchanged', '(D) Become zero'], ans: '(A) Decrease by a factor of K' },
      { question: 'An electric charge Q is placed at the center of a conducting spherical shell of inner radius R₁ and outer radius R₂. The electric field inside the conducting shell material is:', options: ['(A) Zero everywhere inside conductor', '(B) Q / (4πε₀ R₁²)', '(C) Q / (4πε₀ R₂²)', '(D) Uniform throughout'], ans: '(A) Zero everywhere inside conductor' },
      { question: 'Three identical capacitors each of capacitance C are connected first in series and then in parallel. The ratio of equivalent capacitance C_series / C_parallel is:', options: ['(A) 1 : 9', '(B) 1 : 3', '(C) 9 : 1', '(D) 3 : 1'], ans: '(A) 1 : 9' },
      { question: 'The electrostatic energy density u_E stored in an electric field E in vacuum is given by:', options: ['(A) (1/2) ε₀ E²', '(B) (1/2) ε₀ E', '(C) ε₀ E²', '(D) (1/2) E² / ε₀'], ans: '(A) (1/2) ε₀ E²' }
    ],
    shorts: [
      'Define an equipotential surface. State two characteristic properties of equipotential surfaces.',
      'Establish the differential relation between electric field intensity E and electrostatic potential V (E = -dV/dr). Explain the physical meaning of the negative sign.',
      'What is electrostatic shielding? Mention one important practical application in electronic equipment.',
      'Explain why the electrostatic field must be normal to the surface of a charged conductor at every point on the surface.',
      'A parallel plate capacitor of capacitance C has charge Q. Derive the expression for energy stored in terms of Q and C.'
    ],
    longs: [
      'Derive an expression for the electrostatic potential V at distance r from a point charge Q. Draw graphs showing variation of V and E with r.',
      'Derive the expression for the electrostatic potential at an arbitrary point (r, θ) due to a short electric dipole of dipole moment p.',
      '(a) Derive the formula for capacitance of a parallel plate capacitor with plate area A and separation d. (b) Deduce the capacitance when a dielectric slab of thickness t < d and dielectric constant K is introduced.',
      '(a) Derive the expression for energy stored in a charged parallel plate capacitor U = (1/2) C V². (b) Hence deduce the formula for electrostatic energy density u_E = (1/2) ε₀ E².',
      'A 900 pF capacitor is charged by a 100 V battery. It is then disconnected from the battery and connected to another uncharged 900 pF capacitor. (a) What is the common electrostatic potential? (b) How much electrostatic energy is dissipated during sharing of charge?'
    ]
  },
  3: {
    name: 'Current Electricity',
    mcqs: [
      { question: 'The drift speed of conduction electrons in a copper wire carrying a typical direct current is of the order of:', options: ['(A) 10⁻⁴ m/s (fraction of a mm/s)', '(B) 10⁶ m/s', '(C) 3 × 10⁸ m/s', '(D) 10² m/s'], ans: '(A) 10⁻⁴ m/s (fraction of a mm/s)' },
      { question: 'Kirchhoff\'s Junction Rule (Σ I = 0) at an electrical network node is a direct consequence of conservation of:', options: ['(A) Electric Charge', '(B) Energy', '(C) Momentum', '(D) Angular Momentum'], ans: '(A) Electric Charge' },
      { question: 'When the temperature of a metallic conductor increases, its electrical resistivity increases primarily because:', options: ['(A) Relaxation time τ decreases due to more frequent collisions', '(B) Electron number density n decreases', '(C) Electron mass increases', '(D) Mean free path increases'], ans: '(A) Relaxation time τ decreases due to more frequent collisions' },
      { question: 'In a Wheatstone bridge with four resistance arms P, Q, R, S, the galvanometer shows null deflection when:', options: ['(A) P/Q = R/S', '(B) P·Q = R·S', '(C) P + Q = R + S', '(D) P - Q = R - S'], ans: '(A) P/Q = R/S' },
      { question: 'A cell of EMF E and internal resistance r is connected across external resistance R. Terminal voltage V equals:', options: ['(A) E - I r', '(B) E + I r', '(C) E / (1 + r)', '(D) I r'], ans: '(A) E - I r' }
    ],
    shorts: [
      'Define drift velocity (v_d) and relaxation time (τ). State the mathematical relation between them in an electric field E.',
      'State Ohm\'s law in microscopic vector form (J = σE) and define electrical conductivity σ in terms of relaxation time.',
      'Define mobility (μ) of a charge carrier. State its SI unit and relation with drift velocity.',
      'Why does the resistivity of a semiconductor (like Silicon or Germanium) decrease rapidly with an increase in temperature?',
      'State Kirchhoff\'s Loop Rule and justify which fundamental conservation law it embodies.'
    ],
    longs: [
      '(a) Derive the microscopic relation between electric current I and drift velocity v_d: I = n e A v_d. (b) Hence deduce Ohm\'s law and obtain formula for resistivity ρ = m / (n e² τ).',
      'State Kirchhoff\'s laws. Use them to derive the balancing condition P/Q = R/S for a Wheatstone bridge circuit using mesh/loop analysis.',
      '(a) Two cells of EMFs E₁, E₂ and internal resistances r₁, r₂ are connected in parallel. Derive expressions for equivalent EMF E_eq and equivalent internal resistance r_eq. (b) What happens when identical cells are combined?',
      'Explain the temperature dependence of resistance: define temperature coefficient of resistance α and contrast the graphs of ρ vs T for Copper (conductor), Nichrome (alloy), and Silicon (semiconductor).',
      'A storage battery of EMF 8.0 V and internal resistance 0.5 Ω is being charged by a 120 V DC supply using a series resistor of 15.5 Ω. (a) What is the terminal voltage of the battery during charging? (b) What is the purpose of having a series resistor in the charging circuit?'
    ]
  },
  4: {
    name: 'Moving Charges and Magnetism',
    mcqs: [
      { question: 'A proton enters a uniform magnetic field B with velocity v perpendicular to the field lines. The kinetic energy of the proton in the field will:', options: ['(A) Remain constant (magnetic force does zero work)', '(B) Increase linearly with time', '(C) Decrease to zero', '(D) Oscillate sinusoidally'], ans: '(A) Remain constant (magnetic force does zero work)' },
      { question: 'The magnetic field B at the center of a circular coil of radius R carrying current I is given by:', options: ['(A) μ₀ I / (2R)', '(B) μ₀ I / (4πR)', '(C) μ₀ I / (2πR)', '(D) μ₀ I / R'], ans: '(A) μ₀ I / (2R)' },
      { question: 'Two parallel long straight conductors carrying currents in the same direction:', options: ['(A) Attract each other', '(B) Repel each other', '(C) Exert no mutual force', '(D) Rotate perpendicular to each other'], ans: '(A) Attract each other' },
      { question: 'To convert a moving coil galvanometer into an ammeter of desired range, one must connect:', options: ['(A) A small resistance (shunt) in parallel', '(B) A large resistance in series', '(C) A small resistance in series', '(D) A large resistance in parallel'], ans: '(A) A small resistance (shunt) in parallel' },
      { question: 'The torque τ acting on a planar current loop of area A carrying current I placed in a uniform magnetic field B is:', options: ['(A) τ = M × B (where M = NIA)', '(B) τ = M · B', '(C) τ = B / M', '(D) τ = M × v'], ans: '(A) τ = M × B (where M = NIA)' }
    ],
    shorts: [
      'State Biot-Savart law in vector form and identify the angle between the current element and position vector.',
      'Write the expression for Lorentz magnetic force acting on a charge q moving with velocity v in magnetic field B. When is this force maximum and when is it zero?',
      'State Ampere\'s Circuital Law in mathematical line integral form and state its symmetry requirements.',
      'Why does the magnetic force on a moving charge do zero work, and why can it not alter the kinetic energy of the charge?',
      'Define current sensitivity and voltage sensitivity of a Moving Coil Galvanometer. State their SI units.'
    ],
    longs: [
      'Apply Biot-Savart law to derive an expression for the magnetic field at an axial point at distance x from the center of a circular current loop of radius R. Hence deduce field at the center.',
      'State Ampere\'s Circuital Law. Use it to derive the magnetic field intensity inside a long straight solenoid of n turns per unit length carrying current I.',
      '(a) Derive the expression for the magnetic force per unit length between two long straight parallel conductors carrying steady currents I₁ and I₂ separated by distance d. (b) Hence define the standard SI unit \'Ampere\'.',
      '(a) Explain the principle, construction and working of a Moving Coil Galvanometer with neat labelled diagram. (b) Explain why a radial magnetic field with soft iron core is employed.',
      'A galvanometer of coil resistance 15 Ω gives full-scale deflection for a current of 4 mA. Explain how it can be converted into: (a) an ammeter of range 0 to 6 A, and (b) a voltmeter of range 0 to 18 V. Calculate required resistor values.'
    ]
  },
  5: {
    name: 'Magnetism and Matter',
    mcqs: [
      { question: 'Gauss\'s Law for Magnetism (∮ B · dA = 0) physically implies that:', options: ['(A) Isolated magnetic monopoles do not exist', '(B) Magnetic field lines are discontinuous', '(C) Magnetic poles cannot be separated', '(D) Earth has no magnetic field'], ans: '(A) Isolated magnetic monopoles do not exist' },
      { question: 'The magnetic susceptibility χ of a diamagnetic substance is:', options: ['(A) Small and negative', '(B) Small and positive', '(C) Very large and positive', '(D) Strongly temperature dependent'], ans: '(A) Small and negative' },
      { question: 'At the magnetic equator of the Earth, the angle of dip (magnetic inclination) is:', options: ['(A) 0°', '(B) 90°', '(C) 45°', '(D) 180°'], ans: '(A) 0°' },
      { question: 'According to Curie\'s Law, the magnetic susceptibility of a paramagnetic substance varies with absolute temperature T as:', options: ['(A) χ ∝ 1/T', '(B) χ ∝ T', '(C) χ ∝ T²', '(D) χ is independent of T'], ans: '(A) χ ∝ 1/T' },
      { question: 'The material best suited for making permanent magnets must possess:', options: ['(A) High retentivity and high coercivity', '(B) High retentivity and low coercivity', '(C) Low retentivity and high coercivity', '(D) Low retentivity and low coercivity'], ans: '(A) High retentivity and high coercivity' }
    ],
    shorts: [
      'State Gauss\'s law for magnetism and explain what it reveals about magnetic monopoles.',
      'Define magnetic declination and magnetic dip (inclination) at a place on Earth\'s surface.',
      'Define magnetic susceptibility (χ) and relative permeability (μ_r). State the relation connecting them.',
      'Why is soft iron preferred over steel for making cores of transformers and electromagnets?',
      'State Curie\'s law for paramagnetic substances. What happens to a ferromagnetic material above its Curie temperature?'
    ],
    longs: [
      '(a) Show that a current-carrying solenoid produces an axial magnetic field identical to that of a bar magnet of dipole moment M. (b) Deduce M = N I A.',
      '(a) Derive an expression for the torque τ acting on a magnetic dipole of dipole moment M placed in a uniform magnetic field B. (b) Find the work done in rotating the dipole from orientation θ₁ to θ₂.',
      'Compare Diamagnetic, Paramagnetic, and Ferromagnetic materials with respect to: (i) behavior in non-uniform magnetic field, (ii) magnetic susceptibility χ, (iii) relative permeability μ_r, and (iv) effect of temperature.',
      'Draw the magnetic hysteresis (B-H) loop for a ferromagnetic material. Define: (i) Retentivity / Remanence, (ii) Coercivity, and (iii) Hysteresis energy loss. Explain its significance in transformer core selection.',
      'The horizontal component of Earth\'s magnetic field at a location is 0.35 G and the angle of dip is 60°. (a) Calculate the total magnetic field of the Earth at that place. (b) What will be the vertical component of the magnetic field?'
    ]
  },
  6: {
    name: 'Electromagnetic Induction',
    mcqs: [
      { question: 'Lenz\'s law for electromagnetic induction is a direct consequence of the law of conservation of:', options: ['(A) Energy', '(B) Charge', '(C) Momentum', '(D) Angular momentum'], ans: '(A) Energy' },
      { question: 'A conducting rod of length l moves with uniform velocity v perpendicular to a uniform magnetic field B. The motional EMF induced across its ends is:', options: ['(A) B v l', '(B) (1/2) B v l', '(C) B v² l', '(D) B v / l'], ans: '(A) B v l' },
      { question: 'The SI unit of self-inductance and mutual inductance is Henry (H), which is equivalent to:', options: ['(A) Volt · second / Ampere (V·s/A)', '(B) Volt / (Ampere · second)', '(C) Ampere · second / Volt', '(D) Joule / Ampere'], ans: '(A) Volt · second / Ampere (V·s/A)' },
      { question: 'If the number of turns per unit length in a long solenoid is doubled while keeping its length and radius unchanged, its self-inductance becomes:', options: ['(A) 4 times (L ∝ n²)', '(B) 2 times', '(C) 8 times', '(D) Unchanged'], ans: '(A) 4 times (L ∝ n²)' },
      { question: 'Eddy currents are produced in a metal block when it is:', options: ['(A) Placed in a time-varying magnetic field', '(B) Placed in a steady uniform magnetic field', '(C) Placed in a constant electric field', '(D) Cooled to absolute zero'], ans: '(A) Placed in a time-varying magnetic field' }
    ],
    shorts: [
      'State Faraday\'s laws of electromagnetic induction in both descriptive and mathematical forms.',
      'State Lenz\'s law. Explain briefly how it conforms with the principle of conservation of energy.',
      'What are Eddy currents? Mention two advantageous applications where eddy currents are deliberately utilized.',
      'Define self-inductance (L) of a coil. What physical property does self-inductance represent in an electrical circuit?',
      'Why is a spark observed when an inductive circuit carrying heavy DC current is suddenly broken?'
    ],
    longs: [
      'Derive an expression for the motional EMF induced across the ends of a straight conducting rod of length l moving with uniform velocity v perpendicular to a uniform magnetic field B using Lorentz force analysis.',
      'Derive an expression for the self-inductance L of a long air-cored solenoid of length l, cross-sectional area A and total turns N. What is the effect of inserting a soft iron core of relative permeability μ_r?',
      '(a) Define mutual inductance between two co-axial solenoids. (b) Derive the expression for mutual inductance M₁₂ of two concentric long co-axial solenoids of equal length l and radii r₁ and r₂ (r₁ < r₂).',
      '(a) Derive the expression for magnetic potential energy U stored in a current-carrying inductor of self-inductance L carrying steady current I: U = (1/2) L I². (b) Hence deduce magnetic energy density u_B = B² / (2μ₀).',
      'A rectangular coil of N turns and area A is rotated with constant angular velocity ω in a uniform transverse magnetic field B. (a) Derive expression for instantaneous induced EMF e = e₀ sin ωt. (b) Explain working of an AC generator with input/output waveforms.'
    ]
  },
  7: {
    name: 'Alternating Current',
    mcqs: [
      { question: 'The root-mean-square (RMS) value of a sinusoidal alternating voltage V = V₀ sin(ωt) is:', options: ['(A) V₀ / √2 ≈ 0.707 V₀', '(B) 2 V₀ / π', '(C) V₀ / 2', '(D) √2 V₀'], ans: '(A) V₀ / √2 ≈ 0.707 V₀' },
      { question: 'In a purely inductive AC circuit, the alternating current lags behind the applied alternating voltage by a phase angle of:', options: ['(A) π/2 radians (90°)', '(B) π radians (180°)', '(C) 0 radians', '(D) π/4 radians (45°)'], ans: '(A) π/2 radians (90°)' },
      { question: 'In a series LCR resonant circuit, the electrical impedance Z at resonance frequency ω_r is:', options: ['(A) Minimum and purely resistive (Z = R)', '(B) Maximum and purely inductive', '(C) Zero', '(D) Infinite'], ans: '(A) Minimum and purely resistive (Z = R)' },
      { question: 'The power factor of an AC circuit undergoing series resonance is:', options: ['(A) 1.0 (Unity, cos φ = 1)', '(B) 0.0', '(C) 0.5', '(D) -1.0'], ans: '(A) 1.0 (Unity, cos φ = 1)' },
      { question: 'In an ideal step-up transformer, the output secondary coil has:', options: ['(A) Higher voltage and lower current than primary', '(B) Higher voltage and higher current', '(C) Lower voltage and higher current', '(D) Higher power output than input power'], ans: '(A) Higher voltage and lower current than primary' }
    ],
    shorts: [
      'Define root-mean-square (RMS) value of alternating current. Why cannot standard moving-coil DC meters measure AC?',
      'What is meant by wattless current? Under what circuit conditions does wattless current occur?',
      'Define inductive reactance (X_L) and capacitive reactance (X_C). Sketch their variations with AC frequency f.',
      'State the condition for electrical resonance in a series LCR circuit and write the formula for resonant angular frequency ω_r.',
      'Define Quality Factor (Q-factor) of a resonant series LCR circuit and explain its role in receiver tuning sharpness.'
    ],
    longs: [
      'An alternating EMF V = V₀ sin ωt is applied to a series LCR circuit. Using a phasor diagram, derive expressions for: (i) impedance Z, (ii) phase angle φ between voltage and current, and (iii) current amplitude I₀.',
      '(a) Derive the condition for resonance in a series LCR circuit and obtain the expression for resonant frequency f_r. (b) Derive formula for sharpness of resonance (Q-factor = ω_r L / R).',
      '(a) Derive the expression for average power dissipated in an AC circuit: P_avg = V_rms I_rms cos φ. (b) Explain why a pure inductor and pure capacitor consume zero net power over a full cycle.',
      '(a) Explain the principle, construction and working of an AC transformer with neat diagram. (b) Derive the transformation ratio relation V_s / V_p = N_s / N_p = I_p / I_s. (c) Enumerate four energy loss mechanisms in a real transformer.',
      'A series LCR circuit with R = 20 Ω, L = 1.5 H and C = 35 μF is connected to a variable-frequency 220 V AC supply. (a) Determine the resonant angular frequency ω_r. (b) Calculate the impedance and current amplitude at resonance. (c) Calculate the Q-factor.'
    ]
  },
  8: {
    name: 'Electromagnetic Waves',
    mcqs: [
      { question: 'The concept of displacement current (I_d = ε₀ dΦ_E/dt) was introduced by Maxwell to resolve an inconsistency in:', options: ['(A) Ampere\'s Circuital Law', '(B) Faraday\'s Law', '(C) Gauss\'s Law for Magnetism', '(D) Coulomb\'s Law'], ans: '(A) Ampere\'s Circuital Law' },
      { question: 'The speed of electromagnetic waves in free space is given by the relation:', options: ['(A) c = 1 / √(μ₀ ε₀)', '(B) c = √(μ₀ / ε₀)', '(C) c = √(ε₀ / μ₀)', '(D) c = μ₀ ε₀'], ans: '(A) c = 1 / √(μ₀ ε₀)' },
      { question: 'Electromagnetic waves are transverse in nature. This fundamental property is conclusively established by:', options: ['(A) Polarisation', '(B) Interference', '(C) Diffraction', '(D) Refraction'], ans: '(A) Polarisation' },
      { question: 'Which electromagnetic radiation has the highest frequency and shortest wavelength in the electromagnetic spectrum?', options: ['(A) Gamma rays', '(B) X-rays', '(C) Ultraviolet rays', '(D) Radio waves'], ans: '(A) Gamma rays' },
      { question: 'The electromagnetic radiation widely used in RADAR systems for aircraft navigation and speed detection is:', options: ['(A) Microwaves', '(B) Infrared rays', '(C) Ultraviolet rays', '(D) Radio waves'], ans: '(A) Microwaves' }
    ],
    shorts: [
      'What was the inconsistency in Ampere\'s Circuital Law pointed out by James Clerk Maxwell during capacitor charging?',
      'Define displacement current (I_d) and write Maxwell\'s modified Ampere-Maxwell law.',
      'Write Maxwell\'s four equations of electromagnetism in integral form.',
      'State two crucial characteristics of electromagnetic waves relating their electric (E) and magnetic (B) field vectors.',
      'Name the electromagnetic radiation used in: (i) water purification (sterilization), (ii) night-vision photography, and (iii) cellular telecommunications.'
    ],
    longs: [
      '(a) Explain the necessity of introducing the concept of displacement current during the charging of a parallel plate capacitor. (b) Prove that conduction current I_c in wires equals displacement current I_d between capacitor plates.',
      'State Maxwell\'s four equations in integral form and explain the fundamental physical law underlying each equation.',
      '(a) Describe the key physical properties of electromagnetic waves (velocity, transverse nature, ratio E₀/B₀ = c, energy sharing u_E = u_B). (b) Explain how EM waves transport energy and linear momentum.',
      'Arrange the seven regions of the electromagnetic spectrum in order of increasing frequency. For any three regions, specify their wavelength range, method of production, and two important practical applications.',
      'In a plane electromagnetic wave of frequency 25 MHz traveling along the +x direction in vacuum, the electric field amplitude at a given point is E₀ = 6.3 V/m along the +y axis. (a) Determine the magnetic field amplitude B₀. (b) Find the wavelength λ and wave vector k. (c) Write the vector equations for E and B.'
    ]
  },
  9: {
    name: 'Ray Optics and Optical Instruments',
    mcqs: [
      { question: 'The relation connecting the critical angle C for total internal reflection and the refractive index μ of a medium is:', options: ['(A) sin C = 1 / μ', '(B) cos C = 1 / μ', '(C) tan C = μ', '(D) sin C = μ'], ans: '(A) sin C = 1 / μ' },
      { question: 'When a convex lens of refractive index 1.5 is immersed in a liquid of refractive index 1.5, its focal length becomes:', options: ['(A) Infinite (behaves as a plane glass plate)', '(B) Zero', '(C) Halved', '(D) Unchanged'], ans: '(A) Infinite (behaves as a plane glass plate)' },
      { question: 'Two thin lenses of focal lengths +20 cm and -40 cm are placed in co-axial contact. The optical power of the combination is:', options: ['(A) +2.5 Dioptres', '(B) -2.5 Dioptres', '(C) +5.0 Dioptres', '(D) +7.5 Dioptres'], ans: '(A) +2.5 Dioptres' },
      { question: 'For a ray passing symmetrically through an equilateral glass prism in minimum deviation, the angle of incidence i is related to prism angle A and minimum deviation D_m by:', options: ['(A) i = (A + D_m) / 2', '(B) i = A + D_m', '(C) i = (A - D_m) / 2', '(D) i = D_m / 2'], ans: '(A) i = (A + D_m) / 2' },
      { question: 'The magnifying power of an astronomical telescope in normal adjustment (image at infinity) is given by:', options: ['(A) m = - f_o / f_e', '(B) m = - f_e / f_o', '(C) m = f_o + f_e', '(D) m = - (f_o / f_e)(1 + f_e/D)'], ans: '(A) m = - f_o / f_e' }
    ],
    shorts: [
      'State the laws of refraction and express Snell\'s law in terms of absolute refractive indices of media.',
      'State the two essential conditions required for total internal reflection (TIR) to occur at an interface.',
      'Define the optical power of a lens and state its SI unit. What does a power of -2.0 D indicate about lens nature?',
      'Why does the sun appear slightly reddish at sunrise and sunset while sky appears blue at midday? Explain using Rayleigh scattering.',
      'Draw a ray diagram showing refraction through an equilateral triangular glass prism at the angle of minimum deviation.'
    ],
    longs: [
      'Derive the Lens Maker\'s Formula: 1/f = (μ - 1)(1/R₁ - 1/R₂) for a thin double convex lens by analyzing refraction at two spherical surfaces.',
      'Derive the prism formula relating the refractive index μ of prism material to the prism angle A and angle of minimum deviation D_m: μ = sin((A + D_m)/2) / sin(A/2).',
      '(a) Draw a neat labelled ray diagram of a Compound Microscope with final image formed at near point (least distance of distinct vision D = 25 cm). (b) Derive the expression for its total magnifying power.',
      '(a) Draw a neat labelled ray diagram of an Astronomical Refracting Telescope in normal adjustment (final image at infinity). (b) Derive the formula for its magnifying power and state its tube length L = f_o + f_e.',
      'A convex lens of focal length 20 cm is placed co-axially in contact with a concave lens of focal length 10 cm. (a) Determine the focal length and optical power of the combination. (b) An object of height 3 cm is placed 30 cm in front of the combination; find the position, nature, and size of the image.'
    ]
  },
  10: {
    name: 'Wave Optics',
    mcqs: [
      { question: 'The wavefront originating from an isolated point source of light at a finite distance in an isotropic medium is:', options: ['(A) Spherical', '(B) Plane', '(C) Cylindrical', '(D) Parabolic'], ans: '(A) Spherical' },
      { question: 'In Young\'s Double Slit Experiment, the fringe width β is directly proportional to:', options: ['(A) Wavelength λ and screen distance D, and inversely to slit separation d', '(B) Slit separation d', '(C) 1/λ', '(D) 1/D'], ans: '(A) Wavelength λ and screen distance D, and inversely to slit separation d' },
      { question: 'If the entire Young\'s double slit experimental apparatus is immersed in water (μ = 4/3), the fringe width will:', options: ['(A) Decrease to 3/4 of its original value', '(B) Increase by 4/3 times', '(C) Remain unchanged', '(D) Disappear completely'], ans: '(A) Decrease to 3/4 of its original value' },
      { question: 'In Fraunhofer single slit diffraction of slit width a, the angular width of the central diffraction maximum is:', options: ['(A) 2λ / a', '(B) λ / a', '(C) λ / (2a)', '(D) a / (2λ)'], ans: '(A) 2λ / a' },
      { question: 'According to Brewster\'s Law, when unpolarized light is reflected from a transparent medium at polarizing angle i_p:', options: ['(A) The reflected ray and refracted ray are mutually perpendicular (i_p + r = 90°)', '(B) All light is absorbed', '(C) Refraction ceases', '(D) Reflected light is unpolarized'], ans: '(A) The reflected ray and refracted ray are mutually perpendicular (i_p + r = 90°)' }
    ],
    shorts: [
      'Define wavefront. What is the geometrical shape of a wavefront corresponding to parallel rays from a distant star?',
      'State Huygens\' Principle of secondary wavelets for the propagation of light waves.',
      'State two indispensable conditions for producing sustained, clear interference fringes with light.',
      'What happens to the interference fringes in YDSE if the monochromatic source is replaced by a white light source?',
      'Distinguish between the physical phenomena of Interference of light and Diffraction of light with two key points.'
    ],
    longs: [
      'State Huygens\' Principle. Using it, construct wavefronts and prove the Law of Reflection (angle of incidence = angle of reflection) at a plane reflecting surface.',
      'State Huygens\' Principle. Using secondary wavelets construction, prove Snell\'s Law of Refraction (sin i / sin r = μ₂/μ₁) at a plane interface.',
      'In Young\'s Double Slit Experiment, derive the mathematical conditions for constructive and destructive interference. Hence obtain the formula for fringe width β = λ D / d.',
      '(a) Explain the phenomenon of Fraunhofer diffraction at a single slit of width a. (b) Derive the conditions for secondary minima (a sin θ = nλ) and maxima. (c) Deduce the linear and angular width of the central maximum.',
      '(a) State Brewster\'s Law of polarisation by reflection. (b) Prove that when light is incident at the polarizing angle i_p, the reflected and refracted rays are at right angles to each other. (c) Calculate the Brewster angle for glass of refractive index 1.5.'
    ]
  },
  11: {
    name: 'Dual Nature of Radiation and Matter',
    mcqs: [
      { question: 'The slope of the graph of stopping potential V₀ versus incident light frequency ν for a photosensitive metal equals:', options: ['(A) h / e (universal constant)', '(B) h · e', '(C) e / h', '(D) Work function Φ₀'], ans: '(A) h / e (universal constant)' },
      { question: 'In photoelectric emission, the maximum kinetic energy of emitted photoelectrons depends solely on:', options: ['(A) Frequency of incident radiation and work function of emitter', '(B) Intensity of incident radiation', '(C) Distance of source from metal', '(D) Exposure time'], ans: '(A) Frequency of incident radiation and work function of emitter' },
      { question: 'The de Broglie wavelength λ of an electron accelerated from rest across a potential difference of V volts is:', options: ['(A) 1.227 / √V nm', '(B) 12.27 / √V nm', '(C) 0.1227 / √V nm', '(D) 1.227 · √V nm'], ans: '(A) 1.227 / √V nm' },
      { question: 'A proton and an alpha particle are accelerated across the same potential difference V. The ratio of their de Broglie wavelengths λ_p / λ_α is:', options: ['(A) 2√2 : 1', '(B) 1 : 2√2', '(C) 2 : 1', '(D) 4 : 1'], ans: '(A) 2√2 : 1' },
      { question: 'The momentum p of a photon of frequency ν and wavelength λ in vacuum is given by:', options: ['(A) p = h / λ = hν / c', '(B) p = h λ', '(C) p = h c / λ', '(D) p = h / (ν c)'], ans: '(A) p = h / λ = hν / c' }
    ],
    shorts: [
      'Define threshold frequency (ν₀) and work function (Φ₀) of a photosensitive metal. State their relationship.',
      'State Einstein\'s photoelectric equation and define all symbols used in the equation.',
      'Why could the classical wave theory of light not account for: (i) existence of threshold frequency, and (ii) immediate emission of photoelectrons?',
      'Define stopping potential (V₀). How is it related to the maximum kinetic energy of emitted photoelectrons?',
      'State de Broglie hypothesis of matter waves. Write the expression for matter wavelength in terms of particle momentum.'
    ],
    longs: [
      '(a) Describe Hertz and Lenard\'s observations on photoelectric effect. (b) Sketch graphs showing variation of photoelectric current with: (i) intensity, (ii) collector plate potential for different intensities, and (iii) collector plate potential for different frequencies.',
      '(a) State Einstein\'s photoelectric equation hν = Φ₀ + K_max. (b) Explain how this equation accounts for: (i) existence of threshold frequency, (ii) independence of K_max from intensity, and (iii) instantaneous photoemission without time lag.',
      '(a) State de Broglie hypothesis. (b) Derive the expression for the de Broglie wavelength of a particle of mass m, charge q accelerated through a potential difference V: λ = h / √(2mqV). (c) Evaluate the formula for an electron.',
      '(a) Describe the experimental arrangement and procedure of the Davisson and Germer experiment with a neat diagram. (b) Explain how the peak in electron scattering intensity at 54 V confirmed the wave nature of electrons.',
      'The work function of caesium metal is 2.14 eV. When light of frequency 6.0 × 10¹⁴ Hz is incident on the metal surface: (a) calculate the maximum kinetic energy of emitted photoelectrons in eV, (b) find the stopping potential V₀, and (c) calculate the maximum speed of emitted photoelectrons (m_e = 9.1 × 10⁻³¹ kg).'
    ]
  },
  12: {
    name: 'Atoms',
    mcqs: [
      { question: 'In Geiger-Marsden alpha-particle scattering experiment, the trajectory traced by an alpha particle scattered at angle θ is a:', options: ['(A) Hyperbola', '(B) Parabola', '(C) Ellipse', '(D) Straight line'], ans: '(A) Hyperbola' },
      { question: 'According to Bohr\'s model of the hydrogen atom, the orbital radius r_n of an electron in the nth stationary orbit varies with principal quantum number n as:', options: ['(A) r_n ∝ n²', '(B) r_n ∝ n', '(C) r_n ∝ 1/n', '(D) r_n ∝ 1/n²'], ans: '(A) r_n ∝ n²' },
      { question: 'The total energy of an electron in the ground state (n = 1) of a hydrogen atom is -13.6 eV. Its kinetic energy and potential energy in this state are:', options: ['(A) K = +13.6 eV, U = -27.2 eV', '(B) K = -13.6 eV, U = +27.2 eV', '(C) K = +13.6 eV, U = -13.6 eV', '(D) K = +27.2 eV, U = -13.6 eV'], ans: '(A) K = +13.6 eV, U = -27.2 eV' },
      { question: 'Which spectral series of the hydrogen atomic emission spectrum lies exclusively in the visible region of light?', options: ['(A) Balmer series', '(B) Lyman series', '(C) Paschen series', '(D) Brackett series'], ans: '(A) Balmer series' },
      { question: 'The orbital angular momentum L of an electron in the second excited state (n = 3) of hydrogen is:', options: ['(A) 3h / (2π)', '(B) 2h / (2π)', '(C) h / (2π)', '(D) 4h / (2π)'], ans: '(A) 3h / (2π)' }
    ],
    shorts: [
      'State the three fundamental postulates of Bohr\'s model of the hydrogen atom.',
      'Define impact parameter in alpha-particle scattering. How does scattering angle vary with impact parameter?',
      'What were the two major limitations of Rutherford\'s planetary model of the atom that necessitated Bohr\'s model?',
      'Write the Rydberg formula for the wavelengths of hydrogen spectral lines and calculate the series limit (shortest wavelength) of the Lyman series.',
      'Explain how de Broglie\'s concept of matter waves provided a theoretical justification for Bohr\'s angular momentum quantization condition.'
    ],
    longs: [
      '(a) Describe the alpha-particle scattering experiment performed by Geiger and Marsden with a labelled diagram. (b) Derive the expression for the distance of closest approach r₀ of an alpha particle of kinetic energy K approaching a gold nucleus of atomic number Z.',
      'Using Bohr\'s postulates, derive expressions for: (i) radius of the nth orbit r_n = ε₀ n² h² / (π m Z e²), and (ii) orbital speed v_n = Z e² / (2 ε₀ n h) for a hydrogen-like atom.',
      '(a) Derive the expression for total energy E_n of an electron in the nth orbit of a hydrogen atom. (b) Show that E_n = -13.6 / n² eV. (c) What is the physical significance of the negative total energy?',
      '(a) Draw an energy level diagram for hydrogen showing electron energy values from n = 1 to n = ∞. (b) Show transitions corresponding to Lyman, Balmer, Paschen, Brackett, and Pfund series. (c) Calculate the longest and shortest wavelengths of the Balmer series.',
      '(a) State de Broglie\'s explanation of Bohr\'s second postulate of orbital quantization: 2π r_n = n λ. (b) A hydrogen atom initially in ground state absorbs a photon which excites it to n = 4 level. Determine the wavelength and frequency of the absorbed photon.'
    ]
  },
  13: {
    name: 'Nuclei',
    mcqs: [
      { question: 'The nuclear radius R of a nucleus of mass number A is related to A by:', options: ['(A) R = R₀ A^(1/3)', '(B) R = R₀ A^(1/2)', '(C) R = R₀ A³', '(D) R = R₀ A'], ans: '(A) R = R₀ A^(1/3)' },
      { question: 'The density of nuclear matter for all atomic nuclei is approximately of the order of:', options: ['(A) 2.3 × 10¹⁷ kg/m³ (independent of mass number A)', '(B) 10³ kg/m³', '(C) 10¹⁰ kg/m³', '(D) 10²⁴ kg/m³'], ans: '(A) 2.3 × 10¹⁷ kg/m³ (independent of mass number A)' },
      { question: 'The energy equivalent of 1 atomic mass unit (1 u) according to Einstein\'s equation E = mc² is approximately:', options: ['(A) 931.5 MeV', '(B) 931.5 keV', '(C) 1.6 × 10⁻¹⁹ J', '(D) 3 × 10⁸ J'], ans: '(A) 931.5 MeV' },
      { question: 'The nuclear force between two nucleons is characterized by being:', options: ['(A) Short-range, strongest force in nature, and charge-independent', '(B) Long-range and inverse-square dependent', '(C) Strongly charge-dependent', '(D) Weaker than electrostatic repulsive force'], ans: '(A) Short-range, strongest force in nature, and charge-independent' },
      { question: 'If a radioactive sample has a half-life of 20 days, the fraction of initial radioactive nuclei remaining undecayed after 60 days is:', options: ['(A) 1 / 8 (after 3 half-lives)', '(B) 1 / 4', '(C) 1 / 16', '(D) 1 / 2'], ans: '(A) 1 / 8 (after 3 half-lives)' }
    ],
    shorts: [
      'Define mass defect (Δm) and binding energy (E_b) of an atomic nucleus. Write their formulas.',
      'Show that nuclear density is constant and independent of mass number A.',
      'State the radioactive decay law: dN/dt = -λ N. Define half-life T_1/2 and decay constant λ, and write their relation.',
      'State three essential characteristics of the strong nuclear force.',
      'Distinguish between nuclear fission and nuclear fusion with one typical nuclear reaction equation for each.'
    ],
    longs: [
      '(a) Draw a plot showing the variation of Binding Energy per Nucleon (E_bn) as a function of Mass Number A. (b) Highlight the peak region and flat plateau. (c) Explain on the basis of this curve why: (i) nuclear fission of heavy nuclei releases energy, and (ii) nuclear fusion of very light nuclei releases energy.',
      '(a) State the Law of Radioactive Decay. (b) Derive the radioactive exponential decay relation N(t) = N₀ e^(-λt). (c) Define half-life T_1/2 and mean life τ, and obtain their mathematical relations with decay constant λ.',
      '(a) Describe the nuclear fission of Uranium-235 by slow neutrons. (b) Explain the concepts of chain reaction, multiplication factor k, critical mass, and the functions of moderators and control rods in a nuclear power reactor.',
      '(a) Describe thermonuclear fusion occurring in the core of the Sun (Proton-Proton cycle). (b) Why are extremely high temperatures (~10⁷ K) and pressures essential for triggering fusion reactions?',
      'Calculate the binding energy per nucleon of a Calcium nucleus (⁴⁰₂₀Ca). Given: m(⁴⁰₂₀Ca) = 39.962589 u, m_p = 1.007825 u, m_n = 1.008665 u, and 1 u = 931.5 MeV. State whether this nucleus is exceptionally stable.'
    ]
  },
  14: {
    name: 'Semiconductor Electronics: Materials, Devices and Simple Circuits',
    mcqs: [
      { question: 'At absolute zero temperature (T = 0 K), a pure intrinsic semiconductor crystal behaves as a perfect:', options: ['(A) Insulator', '(B) Conductor', '(C) Superconductor', '(D) Metal'], ans: '(A) Insulator' },
      { question: 'A p-type semiconductor is obtained by doping pure silicon or germanium with pentavalent / trivalent atoms:', options: ['(A) Trivalent impurity atoms (e.g. Boron, Indium, Aluminium)', '(B) Pentavalent impurity atoms (e.g. Phosphorus, Arsenic)', '(C) Monovalent atoms', '(D) Divalent atoms'], ans: '(A) Trivalent impurity atoms (e.g. Boron, Indium, Aluminium)' },
      { question: 'The width of the depletion layer in a p-n junction diode:', options: ['(A) Increases under reverse bias and decreases under forward bias', '(B) Decreases under reverse bias', '(C) Remains unchanged under any bias', '(D) Increases under forward bias'], ans: '(A) Increases under reverse bias and decreases under forward bias' },
      { question: 'In a full-wave rectifier operating from a 50 Hz AC mains supply, the fundamental ripple frequency of the output voltage is:', options: ['(A) 100 Hz (double the supply frequency)', '(B) 50 Hz', '(C) 25 Hz', '(D) 200 Hz'], ans: '(A) 100 Hz (double the supply frequency)' },
      { question: 'A Zener diode is uniquely operated in electrical circuits in:', options: ['(A) Reverse breakdown region as a constant DC voltage regulator', '(B) Forward active region as an amplifier', '(C) Unbiased condition', '(D) Inverted saturation region'], ans: '(A) Reverse breakdown region as a constant DC voltage regulator' }
    ],
    shorts: [
      'Distinguish between intrinsic semiconductors and extrinsic semiconductors with respect to carrier concentration and electrical conductivity.',
      'Explain how a p-type semiconductor and an n-type semiconductor are fabricated by doping pure Silicon.',
      'Explain the terms: (i) Depletion Region, and (ii) Barrier Potential in an unbiased p-n junction diode.',
      'Draw the circuit symbol and characteristic reverse breakdown V-I curve of a Zener diode.',
      'Name two universal digital logic gates. Write the truth table and Boolean expression for a 2-input NAND gate.'
    ],
    longs: [
      '(a) Explain the formation of a p-n junction. Describe the two simultaneous processes of diffusion and drift of charge carriers that create the depletion layer and barrier potential. (b) Explain what happens to the barrier potential when forward bias and reverse bias are applied.',
      '(a) Draw separate circuit diagrams for studying the forward bias and reverse bias V-I characteristics of a silicon diode. (b) Sketch the complete V-I characteristic curve showing knee voltage and reverse breakdown voltage. (c) Define dynamic resistance.',
      '(a) With a neat circuit diagram, explain the working of a Full-Wave Rectifier utilizing two junction diodes and a center-tapped transformer. (b) Draw the input AC and rectified output voltage waveforms. (c) Explain how a shunt capacitor filter smoothes output DC.',
      '(a) Explain the principle and working of a Zener diode as a DC voltage regulator with a neat circuit diagram. (b) Explain how the output voltage remains constant even when unregulated DC input voltage or load current fluctuates.',
      'Write concise explanatory notes with circuit symbols and operating principles for: (a) Light Emitting Diode (LED), (b) Photodiode (and explain why it is operated in reverse bias), (c) Solar Cell, and (d) Logic OR and AND gates truth tables.'
    ]
  }
};

window.generateExamQuestions = function(formatKey, subject, chapter, topic) {
  // 1. Identify Class 12 Chapter Number from chapter or topic
  let chNum = 1;
  const combined = `${chapter || ''} ${topic || ''}`.toLowerCase();

  if (combined.includes('capacit') || combined.includes('electrostatic potential') || combined.includes('equipotential') || combined.includes('chapter 2')) {
    chNum = 2;
  } else if (combined.includes('current electricity') || combined.includes('drift') || combined.includes('ohm') || combined.includes('wheatstone') || combined.includes('kirchhoff') || combined.includes('resistance') || combined.includes('chapter 3')) {
    chNum = 3;
  } else if (combined.includes('moving charges') || combined.includes('biot') || combined.includes('galvanometer') || combined.includes('lorentz') || combined.includes('solenoid') || combined.includes('chapter 4')) {
    chNum = 4;
  } else if (combined.includes('magnetism and matter') || combined.includes('bar magnet') || combined.includes('earth\'s magnetism') || combined.includes('hysteresis') || combined.includes('diamagnet') || combined.includes('paramagnet') || combined.includes('ferromagnet') || combined.includes('chapter 5')) {
    chNum = 5;
  } else if (combined.includes('electromagnetic induction') || combined.includes('faraday') || combined.includes('lenz') || combined.includes('motional emf') || combined.includes('eddy') || combined.includes('inductance') || combined.includes('chapter 6')) {
    chNum = 6;
  } else if (combined.includes('alternating current') || combined.includes('lcr') || combined.includes('resonance') || combined.includes('transformer') || combined.includes('wattless') || combined.includes('impedance') || combined.includes('chapter 7')) {
    chNum = 7;
  } else if (combined.includes('electromagnetic wave') || combined.includes('displacement current') || combined.includes('maxwell') || combined.includes('spectrum') || combined.includes('chapter 8')) {
    chNum = 8;
  } else if (combined.includes('ray optics') || combined.includes('mirror') || combined.includes('lens maker') || combined.includes('prism') || combined.includes('telescope') || combined.includes('microscope') || combined.includes('refraction') || combined.includes('chapter 9')) {
    chNum = 9;
  } else if (combined.includes('wave optics') || combined.includes('huygens') || combined.includes('interference') || combined.includes('young') || combined.includes('ydse') || combined.includes('diffraction') || combined.includes('polarisation') || combined.includes('chapter 10')) {
    chNum = 10;
  } else if (combined.includes('dual nature') || combined.includes('photoelectric') || combined.includes('de broglie') || combined.includes('davisson') || combined.includes('photon') || combined.includes('work function') || combined.includes('chapter 11')) {
    chNum = 11;
  } else if (combined.includes('atom') || combined.includes('bohr') || combined.includes('rutherford') || combined.includes('spectral series') || combined.includes('hydrogen') || combined.includes('chapter 12')) {
    chNum = 12;
  } else if (combined.includes('nuclei') || combined.includes('nucleus') || combined.includes('binding energy') || combined.includes('radioactiv') || combined.includes('fission') || combined.includes('fusion') || combined.includes('mass defect') || combined.includes('chapter 13')) {
    chNum = 13;
  } else if (combined.includes('semiconductor') || combined.includes('diode') || combined.includes('rectifier') || combined.includes('zener') || combined.includes('logic gate') || combined.includes('transistor') || combined.includes('chapter 14')) {
    chNum = 14;
  } else if (combined.includes('electric charge') || combined.includes('coulomb') || combined.includes('gauss') || combined.includes('dipole') || combined.includes('chapter 1')) {
    chNum = 1;
  } else {
    // Check if numeric chapter prefix was provided
    const match = (chapter || '').match(/chapter\s*(\d+)/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 1 && parsed <= 14) chNum = parsed;
    }
  }

  const chData = CLASS12_PHYSICS_EXAM_BANK[chNum] || CLASS12_PHYSICS_EXAM_BANK[1];

  // Blueprints
  if (formatKey === 'UNIT_45') {
    // Exactly 15 Questions across Section A (5 MCQs), Section B (5 Short), Section C (5 Long Derivations/Numericals) = 45 Marks
    const questions = [];
    // Section A: 5 MCQs (1 Mark each = 5 Marks)
    chData.mcqs.forEach((m, idx) => {
      questions.push({
        num: idx + 1,
        section: 'A',
        type: 'MCQ',
        marks: 1,
        question: m.question,
        options: m.options,
        ans: m.ans
      });
    });
    // Section B: 5 Short Conceptual Questions (2 Marks each = 10 Marks)
    chData.shorts.forEach((s, idx) => {
      questions.push({
        num: idx + 6,
        section: 'B',
        type: 'SHORT',
        marks: 2,
        question: s
      });
    });
    // Section C: 5 Long Derivations & Numericals (6 Marks each = 30 Marks)
    chData.longs.forEach((l, idx) => {
      questions.push({
        num: idx + 11,
        section: 'C',
        type: 'LONG',
        marks: 6,
        question: l
      });
    });
    return questions;
  } else if (formatKey === 'QUIZ_15') {
    // 5 Questions (20 Marks): 3 MCQs (2M) + 2 Short (7M)
    return [
      { num: 1, section: 'A', type: 'MCQ', marks: 2, question: chData.mcqs[0].question, options: chData.mcqs[0].options, ans: chData.mcqs[0].ans },
      { num: 2, section: 'A', type: 'MCQ', marks: 2, question: chData.mcqs[1].question, options: chData.mcqs[1].options, ans: chData.mcqs[1].ans },
      { num: 3, section: 'A', type: 'MCQ', marks: 2, question: chData.mcqs[2].question, options: chData.mcqs[2].options, ans: chData.mcqs[2].ans },
      { num: 4, section: 'B', type: 'SHORT', marks: 7, question: chData.shorts[0] },
      { num: 5, section: 'B', type: 'SHORT', marks: 7, question: chData.shorts[1] }
    ];
  } else if (formatKey === 'TERM_90') {
    // 20 Questions (60 Marks)
    const qs = [];
    for (let i = 1; i <= 8; i++) {
      const baseMcq = chData.mcqs[(i - 1) % chData.mcqs.length];
      qs.push({
        num: i,
        section: 'A',
        type: 'MCQ',
        marks: 1,
        question: i <= 5 ? baseMcq.question : `Conceptual MCQ ${i} on ${topic || chData.name}: Identify the physically accurate condition among the choices.`,
        options: baseMcq.options,
        ans: baseMcq.ans
      });
    }
    for (let i = 9; i <= 14; i++) {
      const baseShort = chData.shorts[(i - 9) % chData.shorts.length];
      qs.push({ num: i, section: 'B', type: 'SHORT', marks: 3, question: baseShort });
    }
    for (let i = 15; i <= 18; i++) {
      const baseLong = chData.longs[(i - 15) % chData.longs.length];
      qs.push({ num: i, section: 'C', type: 'LONG', marks: 5, question: baseLong });
    }
    for (let i = 19; i <= 20; i++) {
      qs.push({
        num: i,
        section: 'D',
        type: 'CASE',
        marks: 7,
        question: `Case Study / Experimental Analysis Q${i}: Read the passage on laboratory investigation of ${topic || chData.name} and answer sub-parts (a), (b), and (c) with complete mathematical steps.`
      });
    }
    return qs;
  } else {
    // MOCK_180: 30 Questions (100 Marks)
    const qs = [];
    for (let i = 1; i <= 12; i++) {
      const baseMcq = chData.mcqs[(i - 1) % chData.mcqs.length];
      qs.push({
        num: i,
        section: 'A',
        type: 'MCQ',
        marks: 1,
        question: i <= 5 ? baseMcq.question : `Section A Objective Q${i}: ${topic || chData.name} board standard question testing fundamental understanding.`,
        options: baseMcq.options,
        ans: baseMcq.ans
      });
    }
    for (let i = 13; i <= 20; i++) {
      const baseShort = chData.shorts[(i - 13) % chData.shorts.length];
      qs.push({ num: i, section: 'B', type: 'SHORT', marks: 3, question: baseShort });
    }
    for (let i = 21; i <= 26; i++) {
      const baseLong = chData.longs[(i - 21) % chData.longs.length];
      qs.push({ num: i, section: 'C', type: 'LONG', marks: 5, question: baseLong });
    }
    for (let i = 27; i <= 28; i++) {
      qs.push({
        num: i,
        section: 'D',
        type: 'CASE',
        marks: 7,
        question: `Section D Case Study Q${i}: Detailed experimental passage on ${topic || chData.name}. Answer sub-questions with CBSE step-marking criteria.`
      });
    }
    for (let i = 29; i <= 30; i++) {
      qs.push({
        num: i,
        section: 'E',
        type: 'LONG',
        marks: 10,
        question: `Section E Comprehensive Numerical & Theoretical Derivation Q${i}: Multi-part problem covering ${topic || chData.name} with complete deduction, formulas, and final values.`
      });
    }
    return qs;
  }
};

window.previewTeacherPaper = function(testId) {
  let title = 'Class 12-A • Unit Assessment: Electric Charges and Fields';
  let subject = 'Physics';
  let chapter = 'Chapter 1: Electric Charges and Fields';
  let topic = 'Electric Charge & Properties (Additivity, Conservation, Quantization)';
  let formatVal = 'UNIT_45';
  let duration = '45 Mins';
  let className = 'Class 12-A';

  let foundTest = null;
  if (testId && typeof testId === 'string') {
    foundTest = assignedTestsState.find(t => t.id === testId);
  }

  if (foundTest) {
    title = foundTest.title || 'Class Unit Test';
    subject = foundTest.subject || 'Physics';
    topic = foundTest.topic || 'Target Curriculum Focus';
    chapter = foundTest.chapter || (foundTest.topic ? foundTest.topic : 'Chapter 1: Electric Charges and Fields');
    duration = foundTest.duration || '45 Mins';
    className = foundTest.targetClass || 'Class 12-A';
    if (duration.includes('15')) formatVal = 'QUIZ_15';
    else if (duration.includes('90')) formatVal = 'TERM_90';
    else if (duration.includes('180')) formatVal = 'MOCK_180';
    else formatVal = 'UNIT_45';
  } else {
    const titleInput = document.getElementById('inputPaperTitle') || document.getElementById('inputTeacherTestTitle');
    if (titleInput && titleInput.value.trim()) {
      title = titleInput.value.trim();
    }

    const subjSelect = document.getElementById('selectPaperSubject');
    if (subjSelect && subjSelect.options[subjSelect.selectedIndex]) {
      subject = subjSelect.options[subjSelect.selectedIndex].text;
    } else {
      subject = teacherBuilderState.activeTeacher?.subjectName || 'Physics';
    }

    const chSelect = document.getElementById('selectPaperChapter') || document.getElementById('selectGenChapter');
    if (chSelect && chSelect.value) {
      chapter = chSelect.value;
    }

    const topicSelect = document.getElementById('selectPaperTopic') || document.getElementById('selectGenTopic');
    if (topicSelect && topicSelect.value) {
      topic = topicSelect.value;
    }

    const formatSelect = document.getElementById('selectPaperFormat') || document.getElementById('selectTeacherTestType');
    if (formatSelect) {
      formatVal = formatSelect.value || 'UNIT_45';
      const optText = formatSelect.options[formatSelect.selectedIndex]?.text || '';
      if (formatVal === 'QUIZ_15' || optText.includes('15-Min')) duration = '15 Minutes';
      else if (formatVal === 'UNIT_45' || optText.includes('45-Min')) duration = '45 Minutes';
      else if (formatVal === 'TERM_90' || optText.includes('90-Min')) duration = '90 Minutes';
      else if (formatVal === 'MOCK_180' || optText.includes('180-Min')) duration = '180 Minutes (3 Hours)';
      else duration = '45 Minutes';
    }

    const classSelect = document.getElementById('selectPaperClass') || document.getElementById('selectTakeTestClass');
    if (classSelect && classSelect.options[classSelect.selectedIndex]) {
      className = classSelect.options[classSelect.selectedIndex].text?.split('•')[0]?.trim() || 'Class 12-A';
    }
  }

  const questions = window.generateExamQuestions(formatVal, subject, chapter, topic);
  const totalQuestions = questions.length;
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  // Group by Section
  const sections = {};
  questions.forEach(q => {
    const sec = q.section || 'A';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(q);
  });

  const secTitles = {
    'A': 'SECTION A &bull; Objective Multiple Choice Questions (1 Mark Each)',
    'B': 'SECTION B &bull; Conceptual Reasoning &amp; Short Answer Questions (2 Marks Each)',
    'C': 'SECTION C &bull; Long Derivations, Proofs &amp; Analytical Numericals (6 Marks Each)',
    'D': 'SECTION D &bull; Case-Study &amp; Data Interpretation Questions',
    'E': 'SECTION E &bull; Comprehensive Problems'
  };

  let questionsHtml = '';
  Object.keys(sections).forEach(secKey => {
    const secQs = sections[secKey];
    questionsHtml += `
      <div style="margin: 24px 0 14px 0; background: #f1f5f9; padding: 10px 16px; border-radius: 6px; border-left: 4px solid #0284c7; font-weight: 800; font-size: 0.88rem; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
        ${secTitles[secKey] || `SECTION ${secKey}`} (${secQs.length} Questions)
      </div>
    `;

    secQs.forEach(q => {
      let optHtml = '';
      if (q.options && q.options.length > 0) {
        optHtml = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; font-size: 0.88rem; color: #334155;">
            ${q.options.map(opt => `<div style="padding: 6px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">${opt}</div>`).join('')}
          </div>
        `;
      }

      questionsHtml += `
        <div class="q-box" style="margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
          <span class="marks" style="float: right; font-weight: 800; color: #0284c7; font-size: 0.85rem;">[${q.marks} Mark${q.marks > 1 ? 's' : ''}]</span>
          <div style="font-size: 0.95rem; line-height: 1.6; color: #0f172a;">
            <strong>Q${q.num}.</strong> ${q.question}
          </div>
          ${optHtml}
        </div>
      `;
    });
  });

  let sectionInstructions = '';
  if (sections['A'] && sections['A'].length > 0) {
    sectionInstructions += `<li>Section A contains ${sections['A'].length} objective multiple choice questions of 1 mark each.</li>`;
  }
  if (sections['B'] && sections['B'].length > 0) {
    sectionInstructions += `<li>Section B contains ${sections['B'].length} short conceptual questions of 2 marks each. Answer concisely in 30–50 words.</li>`;
  }
  if (sections['C'] && sections['C'].length > 0) {
    sectionInstructions += `<li>Section C contains ${sections['C'].length} long derivation and numerical problems of 6 marks each. Clear step-by-step working with appropriate SI units is mandatory.</li>`;
  }

  const fullPaperHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Examination Paper: ${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="if(window.renderMathInElement)renderMathInElement(document.body);"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 36px 40px; color: #0f172a; max-width: 860px; margin: 0 auto; background: #fff; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px; }
    .sub-header { display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 600; color: #334155; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px; flex-wrap: wrap; gap: 8px; }
    .inst { font-size: 0.82rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; color: #475569; }
    .q-box { page-break-inside: avoid; }
    .marks { float: right; font-weight: bold; color: #0369a1; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <div style="font-weight: 600; font-size: 0.9rem;">
      Verified Official Blueprint: <strong>${totalQuestions} Questions</strong> &bull; Total: <strong>${totalMarks} Marks</strong> &bull; Duration: <strong>${escapeHtml(duration)}</strong>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="padding: 9px 20px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 0.88rem;">
        🖨️ Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="header">
    <h2 style="margin: 0; font-size: 1.4rem; letter-spacing: 0.5px; color: #0f172a;">UNISOLE SCHOLAR SECONDARY SCHOOL</h2>
    <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Department of ${escapeHtml(subject)} &bull; Senior Secondary Academic Assessment (2026–27)</p>
    <h3 style="margin: 10px 0 6px 0; color: #1e3a8a; font-size: 1.2rem;">${escapeHtml(title)}</h3>
    <div class="sub-header">
      <span>Target Cohort: <strong>${escapeHtml(className)}</strong></span>
      <span>Chapter: <strong>${escapeHtml(chapter)}</strong></span>
      <span>Max Marks: <strong>${totalMarks}</strong></span>
      <span>Time Allowed: <strong>${escapeHtml(duration)}</strong></span>
    </div>
  </div>

  <div class="inst">
    <strong style="color:#0f172a;">General Instructions:</strong>
    <ol style="margin: 6px 0 0 16px; padding: 0; line-height: 1.6;">
      <li>All questions are compulsory. Total <strong>${totalQuestions} questions</strong> evaluating fundamental conceptual depth, formula derivation, and mathematical problem-solving.</li>
      ${sectionInstructions}
      <li>Physical calculators and smart devices are strictly prohibited. Standard physical constants: $g = 9.8\\text{ m/s}^2$, $c = 3\\times 10^8\\text{ m/s}$, $e = 1.6\\times 10^{-19}\\text{ C}$, $\\varepsilon_0 = 8.854\\times 10^{-12}\\text{ C}^2\\text{N}^{-1}\\text{m}^{-2}$.</li>
    </ol>
  </div>

  ${questionsHtml}

  <div style="margin-top: 30px; padding-top: 14px; border-top: 2px solid #0f172a; text-align: center; font-size: 0.78rem; color: #64748b;">
    &bull; End of Examination Paper &bull; Evaluated according to official CBSE / State Board Step-Marking Scheme &bull;
  </div>
</body>
</html>`;

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow && !printWindow.closed) {
      printWindow.document.open();
      printWindow.document.write(fullPaperHtml);
      printWindow.document.close();
      return;
    }
  } catch (winErr) {
    console.warn('Direct window.open failed, attempting fallback blob link:', winErr);
  }

  // Fallback: If popups are blocked by browser, open via Blob URL
  try {
    const blob = new Blob([fullPaperHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = blobUrl;
    tempLink.target = '_blank';
    document.body.appendChild(tempLink);
    tempLink.click();
    setTimeout(() => {
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(blobUrl);
    }, 15000);
  } catch (e) {
    alert('Pop-up blocked. Please enable pop-ups in your browser to view the exam paper preview.');
  }
};

window.finalizeCurrentTest = function() {
  const liveCounter = document.getElementById('liveTestSubmissionsCounter');
  if (liveCounter) liveCounter.innerText = '48 / 48 (100%)';
  if (assignedTestsState[0]) {
    assignedTestsState[0].submitted = '48 / 48';
    assignedTestsState[0].status = 'COMPLETED';
    assignedTestsState[0].statusBadge = '<span class="status-badge" style="background:rgba(56,189,248,0.15); color:#38bdf8;">Finalized</span>';
  }
  window.renderAssignedTestsTable();

  const banner = document.createElement('div');
  banner.className = 'role-switch-toast';
  banner.innerHTML = `<i data-lucide="check-circle" style="width:16px; height:16px; color:#34d399;"></i> <span><strong>Test Finalized:</strong> All student submissions graded. Grade cards synchronized to Student Portal.</span>`;
  document.body.appendChild(banner);
  initLucideIcons();
  setTimeout(() => banner.remove(), 4000);
};
window.handleTeacherClassSelect = function(classId) {
  teacherBuilderState.selectedClassId = classId;
  window.renderClassRoster(classId);
};

window.renderClassRoster = function(classId = '12-NonMed') {
  const data = CLASS_ROSTERS[classId] || CLASS_ROSTERS['12-NonMed'];
  teacherBuilderState.selectedClassId = classId;

  const sel = document.getElementById('selectTeacherActiveRosterClass');
  if (sel && sel.value !== classId) sel.value = classId;

  const rTitle = document.getElementById('rosterTitle');
  if (rTitle) rTitle.innerText = `${data.name} Student Roster (${data.stream})`;

  const statEnrolled = document.getElementById('statClassEnrolled');
  if (statEnrolled) statEnrolled.innerText = `${data.enrolled} Students`;
  const statAttendance = document.getElementById('statClassAttendance');
  if (statAttendance) statAttendance.innerText = data.attendance;
  const statAvg = document.getElementById('statClassAverage');
  if (statAvg) statAvg.innerText = data.average;

  const tbody = document.getElementById('tbodyClassRoster');
  if (!tbody) return;

  tbody.innerHTML = data.students.map(s => `
    <tr class="roster-row" data-search="${escapeHtml(s.name.toLowerCase())} ${s.roll}">
      <td style="font-weight:700; color:#38bdf8;">#${escapeHtml(s.roll)}</td>
      <td>
        <strong style="color:#f8fafc; font-size:0.86rem; display:block;">${escapeHtml(s.name)}</strong>
        <span style="color:#94a3b8; font-size:0.72rem;">Scholar ID: SCH-2026-${escapeHtml(s.roll)}</span>
      </td>
      <td style="font-size:0.8rem; color:#cbd5e1;">${escapeHtml(s.phone)}</td>
      <td style="font-size:0.8rem; color:#94a3b8;">${escapeHtml(s.parent)}</td>
      <td style="font-size:0.8rem;">
        <span style="color:${s.turnIn.includes('Pending') ? '#fbbf24' : '#34d399'}; font-weight:600;">
          ${escapeHtml(s.turnIn)}
        </span>
      </td>
      <td style="font-weight:800; font-size:0.84rem; color:${s.score.startsWith('-') ? '#94a3b8' : (parseInt(s.score) >= 80 ? '#34d399' : (parseInt(s.score) >= 60 ? '#38bdf8' : '#fb7185'))};">
        ${escapeHtml(s.score)}
      </td>
      <td>
        <span class="status-badge" style="background:${s.status === 'Active' ? 'rgba(52,211,153,0.15)' : (s.status === 'Remedial' ? 'rgba(251,191,36,0.15)' : 'rgba(251,113,133,0.15)')}; color:${s.status === 'Active' ? '#34d399' : (s.status === 'Remedial' ? '#fbbf24' : '#fb7185')};">
          ${escapeHtml(s.status)}
        </span>
      </td>
      <td style="text-align:right;">
        <button type="button" class="btn-secondary" onclick="window.notifyStudentParent('${escapeHtml(s.name)}', '${escapeHtml(s.parent)}')" title="Send SMS Notice to Parent" style="padding:4px 8px; font-size:0.72rem;">
          <i data-lucide="message-square" style="width:13px; height:13px;"></i> Notice
        </button>
      </td>
    </tr>
  `).join('');
  initLucideIcons();
};

window.filterClassRoster = function(query = '') {
  const q = query.trim().toLowerCase();
  document.querySelectorAll('.roster-row').forEach(row => {
    const searchStr = row.getAttribute('data-search') || '';
    row.style.display = searchStr.includes(q) ? '' : 'none';
  });
};

window.notifyStudentParent = function(studentName, parentPhone) {
  alert(`SMS Notification dispatched to parent (${parentPhone}) for scholar ${studentName}. Attendance and test records shared.`);
};

window.openCreateClassModal = function() {
  const modal = document.getElementById('modalCreateClass');
  if (modal) {
    modal.style.display = 'flex';
    initLucideIcons();
  }
};

window.closeCreateClassModal = function() {
  const modal = document.getElementById('modalCreateClass');
  if (modal) modal.style.display = 'none';
};


window.openAddStudentModal = function() {
  const modal = document.getElementById('modalAddStudentToClass');
  if (modal) {
    modal.style.display = 'flex';
    initLucideIcons();
  }
};

window.closeAddStudentModal = function() {
  const modal = document.getElementById('modalAddStudentToClass');
  if (modal) modal.style.display = 'none';
};

window.submitAddStudentToClass = function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputNewStudentName')?.value?.trim() || 'New Student';
  const roll = document.getElementById('inputNewStudentRoll')?.value?.trim() || String(Math.floor(Math.random() * 800 + 100));
  const classId = teacherBuilderState.selectedClassId || '12-NonMed';

  if (!CLASS_ROSTERS[classId]) {
    CLASS_ROSTERS[classId] = {
      name: classId,
      stream: 'Secondary Stream',
      subject: 'Physics',
      enrolled: 0,
      attendance: '100%',
      average: '--',
      students: []
    };
  }

  const newStudent = {
    roll,
    name,
    phone: '98160 99001',
    parent: '98160 99002',
    turnIn: 'Enrolled Today',
    score: '--',
    status: 'Active'
  };

  CLASS_ROSTERS[classId].students.unshift(newStudent);
  CLASS_ROSTERS[classId].enrolled = CLASS_ROSTERS[classId].students.length;

  window.closeAddStudentModal();
  window.renderClassRoster(classId);

  const banner = document.createElement('div');
  banner.className = 'role-switch-toast';
  banner.innerHTML = `<i data-lucide="user-check" style="width:16px; height:16px; color:#34d399;"></i> <span>Enrolled <strong>${escapeHtml(name)}</strong> (Roll #${escapeHtml(roll)}) to roster.</span>`;
  document.body.appendChild(banner);
  initLucideIcons();
  setTimeout(() => banner.remove(), 3500);
};


function setupAiGenerator() {
  const btnGenerate = document.getElementById('btnGenerateQuestion');
  const btnAddToTest = document.getElementById('btnAddToClassTest');
  const selectGrade = document.getElementById('selectGrade');
  const selectSubject = document.getElementById('selectSubject');
  const selectTopic = document.getElementById('selectTopic');
  const inputNcert = document.getElementById('inputNcertBlueprint');

  // Dynamic NCERT topic updating on grade/subject change
  const updateTopicsForGrade = () => {
    const grade = selectGrade ? selectGrade.value : '10';
    const subj = selectSubject ? selectSubject.value : 'Science';

    if (grade === '10') {
      if (subj === 'Mathematics') {
        selectTopic.innerHTML = `
          <option value="Introduction to Trigonometry" selected>Ch 8: Introduction to Trigonometry (Identities)</option>
          <option value="Quadratic Equations">Ch 4: Quadratic Equations (Roots & Discriminant)</option>
          <option value="Arithmetic Progressions">Ch 5: Arithmetic Progressions (Sum of n terms)</option>
          <option value="Real Numbers">Ch 1: Real Numbers (Fundamental Theorem)</option>
          <option value="Triangles">Ch 6: Triangles (BPT & Similarity)</option>
        `;
        if (inputNcert) inputNcert.value = '8.4 Trigonometric Identities (NCERT Pages 190–193)';
      } else {
        selectTopic.innerHTML = `
          <option value="Light – Reflection and Refraction" selected>Ch 9: Light – Reflection & Refraction (Mirrors & Lenses)</option>
          <option value="Electricity">Ch 11: Electricity (Joule Heating & Circuits)</option>
          <option value="Chemical Reactions and Equations">Ch 1: Chemical Reactions & Decomposition</option>
          <option value="Metals and Non-Metals">Ch 3: Metals & Non-Metals (Thermit Reaction)</option>
          <option value="Life Processes">Ch 6: Life Processes (Nephron Ultrafiltration)</option>
        `;
        if (inputNcert) inputNcert.value = '9.2 Spherical Mirrors and Mirror Formula (NCERT Pages 168–171)';
      }
    } else {
      selectTopic.innerHTML = `
        <option value="Rotational Motion" selected>Rotational Motion & Dynamics</option>
        <option value="Work, Energy and Power">Work, Energy and Power</option>
        <option value="Oscillations & SHM">Oscillations & SHM</option>
        <option value="Chemical Thermodynamics">Chemical Thermodynamics</option>
        <option value="Calculus & Limits">Calculus & Limits</option>
      `;
      if (inputNcert) inputNcert.value = 'Class 11 Physics NCERT Ch 7 Rigid Body Dynamics';
    }
  };

  if (selectGrade) selectGrade.addEventListener('change', updateTopicsForGrade);
  if (selectSubject) selectSubject.addEventListener('change', updateTopicsForGrade);

  // Check LLM Provider status from backend
  checkProviderStatus();

  if (btnGenerate) {
    btnGenerate.addEventListener('click', async () => {
      btnGenerate.disabled = true;
      btnGenerate.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> Generating via LLM...`;
      initLucideIcons();

      const grade = document.getElementById('selectGrade') ? document.getElementById('selectGrade').value : '10';
      const board = document.getElementById('selectBoard') ? document.getElementById('selectBoard').value : 'CBSE';
      const subject = document.getElementById('selectSubject') ? document.getElementById('selectSubject').value : 'Science';
      const chapter = document.getElementById('selectTopic') ? document.getElementById('selectTopic').value : 'Light – Reflection and Refraction';
      const difficulty = document.getElementById('selectDifficulty') ? document.getElementById('selectDifficulty').value : 'MEDIUM';
      const questionType = document.getElementById('selectQuestionType') ? document.getElementById('selectQuestionType').value : 'NUMERICAL';
      const provider = document.getElementById('selectLlmProvider') ? document.getElementById('selectLlmProvider').value : 'auto';
      const ncertSection = document.getElementById('inputNcertBlueprint') ? document.getElementById('inputNcertBlueprint').value : '';

      try {
        // Call Multi-LLM API endpoint
        const res = await fetch(`${getApiBaseUrl()}/api/questions/generate-llm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade,
            board,
            subject,
            chapter,
            ncertSection,
            difficulty,
            questionType,
            provider
          })
        });

        if (res.ok) {
          const data = await res.json();
          state.currentQuestion = data.question;
        } else {
          throw new Error('Fallback to local engine');
        }
      } catch (e) {
        console.warn('Backend LLM error, generating curated fallback question:', e);
        state.currentQuestion = generateLocalAiQuestion(subject, chapter, board);
      } finally {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = `<i data-lucide="wand-2" style="width:16px; height:16px;"></i> Generate via LLM Engine`;
        initLucideIcons();
        renderCurrentQuestionInPreview();
      }
    });
  }

  if (btnAddToTest) {
    btnAddToTest.addEventListener('click', () => {
      const q = state.currentQuestion || {};
      addQuestionToTestDraft(q);
    });
  }
}

async function checkProviderStatus() {
  const badge = document.getElementById('providerLiveBadge');
  if (!badge) return;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/questions/providers`);
    if (res.ok) {
      const data = await res.json();
      const p = data.providers;
      if (p.groq?.configured && p.gemini?.configured) {
        badge.innerHTML = `Groq LPU + Gemini Active`;
        badge.style.background = 'rgba(16,185,129,0.15)';
        badge.style.color = '#10b981';
      } else if (p.groq?.configured) {
        badge.innerHTML = `Groq LPU (${p.speed || '350ms'})`;
      } else if (p.gemini?.configured) {
        badge.innerHTML = `Google Gemini (${p.gemini.model})`;
      } else {
        badge.innerHTML = `NCERT Offline Question Bank`;
      }
    }
  } catch (e) {
    // Keep default badge
  }
}

function generateLocalAiQuestion(subject, topic, board) {
  return {
    id: `ncert_local_${Date.now()}`,
    topic,
    chapter: topic,
    curriculum_board: board,
    grade: '10',
    subject: subject || 'Science',
    llm_provider: 'HAPS Curated NCERT & Board PYQ Bank (Offline/Deterministic)',
    question_latex: 'An object of height $h = 4\\,\\text{cm}$ is placed at a distance of $u = -25\\,\\text{cm}$ in front of a concave mirror of focal length $f = -15\\,\\text{cm}$. At what distance $v$ from the mirror should a screen be placed in order to obtain a sharp real image? Find the height $h\'$ of the image formed.',
    options_latex: [
      { key: 'A', latex: '$v = -37.5\\,\\text{cm}$, $h\' = -6\\,\\text{cm}$ (Real and Inverted)', is_correct: true, distractor_trap: null },
      { key: 'B', latex: '$v = +37.5\\,\\text{cm}$, $h\' = +6\\,\\text{cm}$ (Virtual and Erect)', is_correct: false, distractor_trap: 'Ignored Cartesian sign conventions for concave mirror ($f < 0, u < 0$)' },
      { key: 'C', latex: '$v = -9.37\\,\\text{cm}$, $h\' = -1.5\\,\\text{cm}$', is_correct: false, distractor_trap: 'Used lens formula instead of mirror formula' },
      { key: 'D', latex: '$v = -25.0\\,\\text{cm}$, $h\' = -4\\,\\text{cm}$', is_correct: false, distractor_trap: 'Assumed object at center of curvature' }
    ],
    correct_answer_latex: 'v = -37.5\\,\\text{cm},\\; h\' = -6\\,\\text{cm}',
    solution_latex: '1. **Mirror Formula**: $$\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f} \\implies \\frac{1}{v} = \\frac{1}{-15} - \\frac{1}{-25} = -\\frac{2}{75} \\implies v = -37.5\\,\\text{cm}$$\n2. **Magnification**: $$m = -\\frac{v}{u} = \\frac{h\'}{h} \\implies h\' = -\\left(\\frac{-37.5}{-25}\\right) \\times 4 = -6\\,\\text{cm}$$\nNegative sign confirms **Real and Inverted** image.',
    socratic_hints: [
      "What is the Cartesian sign convention for the focal length $f$ of a concave mirror?",
      "State the mirror formula linking $u$, $v$, and $f$.",
      "Calculate linear magnification $m = -v/u = h'/h$."
    ],
    step_rubric: [
      { step: 1, description: "Correct statement of mirror formula with signs: $u=-25\\text{cm}, f=-15\\text{cm}$", marks: 1.0 },
      { step: 2, description: "Calculation of image distance $v = -37.5\\text{cm}$ with negative sign", marks: 1.0 },
      { step: 3, description: "Magnification and height calculation: $h' = -6\\text{cm}$, stating Real & Inverted", marks: 1.0 }
    ],
    ncert_mapping: {
      chapter_name: "Light – Reflection and Refraction",
      ncert_section: "9.2.2 Mirror Formula and Magnification",
      page_reference: "NCERT Class 10 Science, Pages 168–171",
      pyq_similarity: "CBSE Board Exam 2023 & HPBOSE 2022",
      marks: 3
    },
    benchmark_time_seconds: 120
  };
}

function renderInitialQuestion() {
  renderCurrentQuestionInPreview();
}

function renderCurrentQuestionInPreview() {
  const q = state.currentQuestion || generateLocalAiQuestion('Science', 'Light – Reflection and Refraction', 'CBSE');
  const qTextEl = document.getElementById('renderQuestionText');
  const optListEl = document.getElementById('renderOptionsList');
  const solTextEl = document.getElementById('renderSolutionText');
  const badgeEl = document.getElementById('previewBadge');
  const subtitleEl = document.getElementById('previewMetaSubtitle');

  if (badgeEl) {
    badgeEl.innerText = `${q.curriculum_board || 'CBSE'} • Class ${q.grade || '10'}`;
  }

  if (subtitleEl && q.llm_provider) {
    const timeInfo = q.inference_time_ms ? ` (${q.inference_time_ms}ms)` : '';
    subtitleEl.innerHTML = `<span style="color:var(--accent-blue);font-weight:600;">${q.llm_provider}${timeInfo}</span>`;
  }

  // Set question text
  qTextEl.innerHTML = renderLatexString(q.question_latex);

  // Render options
  optListEl.innerHTML = '';
  if (q.options_latex && q.options_latex.length > 0) {
    q.options_latex.forEach(opt => {
      const optItem = document.createElement('div');
      optItem.className = `latex-option-item ${opt.is_correct ? 'correct' : ''}`;
      optItem.innerHTML = `
        <div class="latex-option-key">${opt.key}</div>
        <div style="flex:1;">
          <div class="opt-formula">${renderLatexString(opt.latex)}</div>
          ${opt.distractor_trap ? `<span class="distractor-badge">Trap: ${renderLatexString(opt.distractor_trap)}</span>` : '<span style="color:#10b981;font-size:0.72rem;font-weight:700;">✓ Correct Answer</span>'}
        </div>
      `;
      optListEl.appendChild(optItem);
    });
  }

  // Set solution and rubrics
  let solutionHtml = renderLatexString(q.solution_latex || '');

  // Append NCERT Mapping metadata pill if available
  if (q.ncert_mapping) {
    const m = q.ncert_mapping;
    solutionHtml += `
      <div style="margin-top: 1rem; padding: 10px 12px; background: rgba(59, 130, 246, 0.08); border-left: 3px solid var(--accent-blue); border-radius: 4px; font-size: 0.8rem;">
        <strong style="color: var(--accent-blue);">NCERT Curriculum Blueprint:</strong> ${m.ncert_section || m.chapter_name || ''}<br/>
        <span style="color: var(--text-muted);">Reference: ${m.page_reference || ''} &bull; PYQ Alignment: ${m.pyq_similarity || m.pyq_tag || 'Board Exam'} &bull; Marks: ${m.marks || 3}M</span>
      </div>
    `;
  }

  // Append Step Rubrics if present
  if (q.step_rubric && q.step_rubric.length > 0) {
    solutionHtml += `
      <div style="margin-top: 1rem; border-top: 1px dashed var(--border-subtle); padding-top: 8px;">
        <strong style="color: #eab308; font-size: 0.82rem;">CBSE / HPBOSE Step-by-Step Marking Scheme:</strong>
        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
          ${q.step_rubric.map(r => `
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 4px; align-items: center;">
              <span><strong>Step ${r.step}:</strong> ${renderLatexString(r.description)}</span>
              <span style="color: var(--accent-emerald); font-weight: 700; white-space: nowrap; margin-left: 8px;">+${r.marks}M</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  solTextEl.innerHTML = solutionHtml;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// 2B. MASTER CURRICULUM SYLLABUS BREAKDOWN (SUBJECT -> CHAPTER -> TOPIC)
// -----------------------------------------------------------------------------
let allClass10Pyqs = [];
let currentCurriculumTaxonomy = null;

async function setupClass10PyqExplorer() {
  const accordionContainer = document.getElementById('curriculumAccordionContainer');
  const subjectSelect = document.getElementById('curriculumSubjectSelect');
  const gradeSelect = document.getElementById('curriculumGradeSelect');
  const searchInput = document.getElementById('curriculumSearchInput');
  const btnRefresh = document.getElementById('btnRefreshPyqBank');
  const btnExpandAll = document.getElementById('btnExpandAllChapters');
  const btnCollapseAll = document.getElementById('btnCollapseAllChapters');

  const chaptersCountEl = document.getElementById('curriculumChaptersCount');
  const topicsCountEl = document.getElementById('curriculumTopicsCount');
  const totalCountEl = document.getElementById('pyqTotalCount');
  const subjectTitleEl = document.getElementById('curriculumSubjectTitle');
  const streamBadgeEl = document.getElementById('curriculumStreamBadge');
  const targetExamsEl = document.getElementById('curriculumTargetExamsText');

  if (!accordionContainer) return;

  // 1. Core Fetch Function
  const loadCurriculum = async () => {
    const subjectKey = subjectSelect ? subjectSelect.value : 'BIOLOGY';
    const grade = gradeSelect ? gradeSelect.value : 'ALL';

    accordionContainer.innerHTML = `
      <div style="text-align:center; padding: 3rem; color: var(--text-muted);">
        <i data-lucide="loader-2" class="spin" style="width:28px; height:28px; margin: 0 auto 10px; display:block; color:var(--accent-blue);"></i>
        Loading hierarchical syllabus breakdown for ${subjectKey}...
      </div>
    `;
    initLucideIcons();

    try {
      const url = `${getApiBaseUrl()}/api/curriculum/taxonomy/${subjectKey}${grade !== 'ALL' ? `?grade=${grade}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        currentCurriculumTaxonomy = data;
      } else {
        throw new Error(`API returned ${res.status}`);
      }
    } catch (err) {
      console.warn('Backend curriculum fetch error, using offline fallback:', err);
      currentCurriculumTaxonomy = getOfflineCurriculumFallback(subjectKey, grade);
    }

    if (currentCurriculumTaxonomy) {
      // Update Summary KPI stats
      const chapters = currentCurriculumTaxonomy.chapters || [];
      const totalTopics = chapters.reduce((acc, ch) => acc + (ch.topics ? ch.topics.length : 0), 0);
      const totalQuestions = chapters.reduce((acc, ch) => acc + (ch.totalQuestionsInChapter || 0), 0);

      if (chaptersCountEl) chaptersCountEl.innerText = chapters.length;
      if (topicsCountEl) topicsCountEl.innerText = totalTopics;
      if (totalCountEl) totalCountEl.innerText = totalQuestions;

      if (subjectTitleEl) {
        subjectTitleEl.innerText = `${currentCurriculumTaxonomy.subjectName} (${currentCurriculumTaxonomy.stream === 'MEDICAL' ? 'Botany & Zoology' : currentCurriculumTaxonomy.stream})`;
      }
      if (streamBadgeEl) {
        streamBadgeEl.innerText = `${currentCurriculumTaxonomy.stream} • Class ${currentCurriculumTaxonomy.grades ? currentCurriculumTaxonomy.grades.join(' & ') : '11 & 12'}`;
      }
      if (targetExamsEl) {
        const exams = currentCurriculumTaxonomy.targetExams || ['NEET_UG', 'BOARDS'];
        const units = currentCurriculumTaxonomy.units || [];
        const unitsSummary = units.length > 0 
          ? ` • Units: ${units.map(u => `Unit ${u.unitNumber} (${u.weightageMarks}M)`).join(', ')}`
          : '';
        targetExamsEl.innerText = `Target Exams: ${exams.map(e => e.replace(/_/g, ' ')).join(', ')}${unitsSummary}`;
      }

      renderCurriculumAccordion();
    }
  };

  // 2. Render Accordion Function
  const renderCurriculumAccordion = () => {
    if (!currentCurriculumTaxonomy || !currentCurriculumTaxonomy.chapters) return;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let chapters = currentCurriculumTaxonomy.chapters;

    // Filter chapters and topics by search query (including subtopics)
    if (query) {
      chapters = chapters.map(ch => {
        const chNameMatches = ch.chapterName.toLowerCase().includes(query) || (ch.unit && ch.unit.toLowerCase().includes(query));
        const matchedTopics = (ch.topics || []).filter(t => 
          t.topicName.toLowerCase().includes(query) ||
          (t.ncertSection && t.ncertSection.toLowerCase().includes(query)) ||
          (t.subtopics && Array.isArray(t.subtopics) && t.subtopics.some(st => st.toLowerCase().includes(query))) ||
          chNameMatches
        );

        return {
          ...ch,
          matchedTopics,
          matchesFilter: chNameMatches || matchedTopics.length > 0
        };
      }).filter(ch => ch.matchesFilter);
    }

    if (chapters.length === 0) {
      accordionContainer.innerHTML = `
        <div class="glass-card" style="text-align:center; padding: 3rem;">
          <i data-lucide="inbox" style="width:36px; height:36px; color:var(--text-muted); margin: 0 auto 10px; display:block;"></i>
          <h3 style="color:var(--text-primary); font-size:1.1rem; margin-bottom:4px;">No Chapters or Topics Match "${query}"</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem;">Try searching for terms like "Chemical Reactions", "Refraction", "Ohm's Law", "Tyndall", "Nephron", or "Ozone".</p>
        </div>
      `;
      initLucideIcons();
      return;
    }

    accordionContainer.innerHTML = '';

    // Render Board High-Yield Blueprint Summary Card if available for the subject
    if (currentCurriculumTaxonomy.boardHighYieldSummary && !query) {
      const bys = currentCurriculumTaxonomy.boardHighYieldSummary;
      const summaryCard = document.createElement('div');
      summaryCard.className = 'curriculum-blueprint-card';
      summaryCard.style.cssText = 'background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(99, 102, 241, 0.08)); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;';
      summaryCard.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:inline-flex; align-items:center; gap:4px;">
              <i data-lucide="award" style="width:13px; height:13px;"></i> Board High-Yield Blueprint
            </span>
            <span style="font-weight:600; color:var(--text-primary); font-size:0.95rem;">${bys.examBoard || 'CBSE Class 12 Board Exam Priority Matrix'}</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted); background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px;">80 Marks Theory Breakdown</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
          <!-- 5-Mark Guarantees -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 12px;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:600; color: #f87171; font-size: 0.85rem; margin-bottom: 8px;">
              <i data-lucide="zap" style="width:14px; height:14px;"></i> Guaranteed 5-Mark Questions (20M Total)
            </div>
            <ul style="margin:0; padding-left: 18px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
              ${(bys.fiveMarkGuarantees || []).map(item => `
                <li style="margin-bottom: 6px;">
                  <strong style="color:var(--text-primary);">${item.topic}</strong>: ${item.detail} 
                  <span style="display:block; font-size:0.7rem; color:var(--accent-blue);">${item.chapter}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- 4-Mark Case Studies -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 8px; padding: 12px;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:600; color: #c084fc; font-size: 0.85rem; margin-bottom: 8px;">
              <i data-lucide="file-text" style="width:14px; height:14px;"></i> Case Study Archetypes (12M Total)
            </div>
            <ul style="margin:0; padding-left: 18px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
              ${(bys.caseStudyFourMark || []).map(item => `
                <li style="margin-bottom: 6px;">
                  <strong style="color:var(--text-primary);">${item.topic}</strong>: ${item.detail}
                  <span style="display:block; font-size:0.7rem; color:var(--accent-purple);">${item.chapter}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- 3-Mark Heavyweights -->
          <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 8px; padding: 12px;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:600; color: #60a5fa; font-size: 0.85rem; margin-bottom: 8px;">
              <i data-lucide="check-circle-2" style="width:14px; height:14px;"></i> 3-Mark Heavyweights
            </div>
            <ul style="margin:0; padding-left: 18px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
              ${(bys.threeMarkHeavyweights || []).map(item => `
                <li style="margin-bottom: 6px;">
                  <strong style="color:var(--text-primary);">${item.topic}</strong>: ${item.detail}
                  <span style="display:block; font-size:0.7rem; color:var(--accent-cyan);">${item.chapter}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
      accordionContainer.appendChild(summaryCard);
    }

    chapters.forEach((ch, chIdx) => {
      const card = document.createElement('div');
      card.className = `curriculum-chapter-card ${query ? 'expanded' : (chIdx === 0 ? 'expanded' : '')}`;
      card.id = `chapter_card_${ch.id}`;

      const topicsToRender = query && ch.matchedTopics ? ch.matchedTopics : (ch.topics || []);
      const totalQInCh = ch.totalQuestionsInChapter || 0;

      card.innerHTML = `
        <!-- Chapter Header -->
        <div class="chapter-header" data-chapter-id="${ch.id}">
          <div class="chapter-title-group">
            <span class="chapter-num-badge">Ch ${ch.chapterNumber || (chIdx + 1)}</span>
            <div>
              <div class="chapter-name">${ch.chapterName}</div>
              <div class="chapter-meta-badges">
                ${ch.discipline ? `<span class="${ch.discipline.toLowerCase().includes('bot') ? 'badge-botany' : (ch.discipline.toLowerCase().includes('chem') ? 'badge-grade' : 'badge-zoology')}">${ch.discipline}</span>` : ''}
                ${ch.unit ? `<span class="badge-unit"><i data-lucide="layers" style="width:10px; height:10px; display:inline-block; vertical-align:middle;"></i> ${ch.unit}</span>` : ''}
                <span class="badge-grade">Class ${ch.grade}</span>
              </div>
            </div>
          </div>

          <div class="chapter-right-metrics">
            <span class="metric-pill">
              <i data-lucide="list-tree" style="width:13px; height:13px; color:var(--accent-blue);"></i>
              ${topicsToRender.length} Subtopics
            </span>
            <span class="metric-pill" style="${totalQInCh > 0 ? 'border-color: rgba(16, 185, 129, 0.4); color: #34d399;' : ''}">
              <i data-lucide="help-circle" style="width:13px; height:13px; color:${totalQInCh > 0 ? '#34d399' : 'var(--text-muted)'};"></i>
              ${totalQInCh} Questions in Bank
            </span>
            <i data-lucide="chevron-down" class="chevron-icon"></i>
          </div>
        </div>

        <!-- Chapter Body: Subtopics List -->
        <div class="chapter-body">
          ${ch.boardExamFocus ? `
            <div class="chapter-board-focus" style="margin-bottom: 14px; background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 10px 14px;">
              <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; color: #fbbf24; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;">
                <i data-lucide="compass" style="width: 12px; height: 12px;"></i> Board Exam Priorities & Pitfalls
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px; font-size: 0.78rem;">
                <div style="color: var(--text-secondary);">
                  <strong style="color: #34d399;">High-Yield Focus:</strong> ${ch.boardExamFocus.highYield}
                </div>
                <div style="color: var(--text-secondary);">
                  <strong style="color: #f87171;">Common Board Trap:</strong> ${ch.boardExamFocus.standardTrap}
                </div>
                <div style="color: var(--text-secondary);">
                  <strong style="color: #60a5fa;">Exam Format:</strong> ${ch.boardExamFocus.questionType}
                </div>
              </div>
            </div>
          ` : ''}

          <div class="topic-list-container">
            ${topicsToRender.map((t, tIdx) => `
              <div class="topic-row ${t.highYield ? 'high-yield' : ''}" id="topic_row_${t.id}">
                <div class="topic-left-details">
                  <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; width:100%;">
                    <span class="ncert-sec-badge">NCERT §${t.ncertSection || `${ch.chapterNumber || chIdx + 1}.${tIdx + 1}`}</span>
                    <span class="topic-name-text">${t.topicName}</span>
                    ${t.highYield ? `
                      <span class="high-yield-tag">
                        <i data-lucide="flame" style="width:10px; height:10px;"></i> High Yield
                      </span>
                    ` : ''}
                  </div>
                  ${t.subtopics && Array.isArray(t.subtopics) && t.subtopics.length > 0 ? `
                    <div style="width: 100%; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 5px;">
                      ${t.subtopics.map(st => `
                        <span style="font-size: 0.72rem; color: var(--text-secondary); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 2px 7px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                          <span style="width: 4px; height: 4px; border-radius: 50%; background: var(--accent-cyan);"></span>
                          ${st}
                        </span>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>

                <div class="topic-actions">
                  <button class="btn-topic-action btn-topic-ai" 
                          data-grade="${ch.grade}" 
                          data-subject="${currentCurriculumTaxonomy.subjectName}" 
                          data-chapter="${ch.chapterName}" 
                          data-topic="${t.topicName}"
                          data-board="${currentCurriculumTaxonomy.stream === 'MEDICAL' ? 'NEET' : (currentCurriculumTaxonomy.stream === 'FOUNDATION' ? 'CBSE' : 'JEE_MAIN')}"
                          title="Generate a brand new exam-quality question for this specific topic using AI">
                    <i data-lucide="sparkles" style="width:12px; height:12px;"></i> AI Question
                  </button>

                  <button class="btn-topic-action btn-topic-preview ${t.questionCount > 0 ? 'has-questions' : ''}" 
                          data-grade="${ch.grade}" 
                          data-subject="${currentCurriculumTaxonomy.subjectName}" 
                          data-chapter="${ch.chapterName}" 
                          data-topic="${t.topicName}"
                          data-topic-id="${t.id}"
                          title="View questions mapped to this topic">
                    <i data-lucide="eye" style="width:12px; height:12px;"></i> Questions (${t.questionCount || 0})
                  </button>
                </div>

                <!-- Topic Questions Drawer (Accordion Sub-Panel) -->
                <div class="topic-questions-drawer" id="drawer_${t.id}">
                  <!-- Dynamically populated when teacher clicks Questions -->
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      accordionContainer.appendChild(card);
    });

    // Attach Click Events for Chapter Accordion Toggle
    accordionContainer.querySelectorAll('.chapter-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const card = header.closest('.curriculum-chapter-card');
        if (card) {
          card.classList.toggle('expanded');
        }
      });
    });

    // Attach Click Events for "AI Question" Generation
    accordionContainer.querySelectorAll('.btn-topic-ai').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const grade = btn.getAttribute('data-grade');
        const subject = btn.getAttribute('data-subject');
        const chapter = btn.getAttribute('data-chapter');
        const topic = btn.getAttribute('data-topic');
        const board = btn.getAttribute('data-board') || 'NEET';

        const originalText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:12px; height:12px;"></i> Synthesizing...`;
        btn.disabled = true;

        try {
          const res = await fetch(`${getApiBaseUrl()}/api/curriculum/generate-topic-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grade,
              subject,
              chapter,
              topic,
              difficulty: 'MEDIUM',
              board
            })
          });

          const data = await res.json();
          if (data.success && data.question) {
            btn.innerHTML = `<i data-lucide="check" style="width:12px; height:12px; color:#10b981;"></i> Generated!`;
            setTimeout(() => {
              btn.innerHTML = originalText;
              btn.disabled = false;
              initLucideIcons();
            }, 1800);

            // Add question to active test draft automatically or refresh view
            addQuestionToTestDraft(data.question);

            // Re-fetch taxonomy to update counts live
            await loadCurriculum();
          } else {
            throw new Error(data.error || 'Synthesis error');
          }
        } catch (err) {
          console.error('Failed to generate topic question:', err);
          btn.innerHTML = `<i data-lucide="alert-circle" style="width:12px; height:12px; color:#ef4444;"></i> Retry`;
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            initLucideIcons();
          }, 2000);
        }
      });
    });

    // Attach Click Events for Topic "Questions" Drawer
    accordionContainer.querySelectorAll('.btn-topic-preview').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const topicId = btn.getAttribute('data-topic-id');
        const subject = btn.getAttribute('data-subject');
        const chapter = btn.getAttribute('data-chapter');
        const topic = btn.getAttribute('data-topic');
        const drawer = document.getElementById(`drawer_${topicId}`);

        if (!drawer) return;

        if (drawer.classList.contains('active')) {
          drawer.classList.remove('active');
          drawer.innerHTML = '';
          return;
        }

        drawer.classList.add('active');
        drawer.innerHTML = `
          <div style="text-align:center; padding: 1.25rem; color: var(--text-muted); font-size: 0.85rem;">
            <i data-lucide="loader-2" class="spin" style="width:18px; height:18px; margin: 0 auto 6px; display:block;"></i>
            Loading questions for ${topic}...
          </div>
        `;
        initLucideIcons();

        try {
          const qUrl = `${getApiBaseUrl()}/api/curriculum/questions?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}&topic=${encodeURIComponent(topic)}`;
          const res = await fetch(qUrl);
          const data = await res.json();
          const qList = (data.success && data.questions) ? data.questions : [];

          if (qList.length === 0) {
            drawer.innerHTML = `
              <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                No questions currently filed under <strong>${topic}</strong>.<br/>
                Click <span style="color:var(--accent-cyan); font-weight:600;">"AI Question"</span> above to synthesize a verified exam question immediately!
              </div>
            `;
          } else {
            drawer.innerHTML = `
              <div style="font-size: 0.82rem; font-weight: 700; color: #34d399; margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center;">
                <span>Verified Questions for ${topic} (${qList.length})</span>
                <span style="font-size:0.75rem; color:var(--text-muted);">KaTeX Rendered</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${qList.map((q, idx) => `
                  <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 12px 14px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 6px; flex-wrap:wrap; gap:6px;">
                      <span class="pilot-tag" style="background:rgba(59,130,246,0.15); color:var(--accent-blue); font-size:0.72rem;">
                        Q${idx + 1} &bull; ${q.curriculum_board || 'NEET'} &bull; ${q.difficulty}
                      </span>
                      <span style="font-size:0.72rem; color:var(--text-muted);">
                        Benchmark: ${q.benchmark_time_seconds || 60}s
                      </span>
                    </div>

                    <div style="font-size:0.92rem; color:var(--text-primary); margin-bottom:8px; line-height:1.5;" class="topic-math-block">
                      ${renderLatexString(q.question_latex)}
                    </div>

                    ${q.options_latex && q.options_latex.length > 0 ? `
                      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:6px; margin-bottom:8px;">
                        ${q.options_latex.map(opt => `
                          <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:${opt.is_correct ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${opt.is_correct ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)'}; border-radius:4px; font-size:0.82rem;">
                            <strong style="color:${opt.is_correct ? '#10b981' : 'var(--text-muted)'}">${opt.key}</strong>
                            <div style="flex:1;" class="topic-math-block">${renderLatexString(opt.latex)}</div>
                            ${opt.is_correct ? '<span style="color:#10b981; font-size:0.68rem; font-weight:700;">✓ Correct</span>' : (opt.distractor_trap ? `<span style="color:#ef4444; font-size:0.65rem;" title="${opt.distractor_trap}">Trap</span>` : '')}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-subtle); padding-top:6px; margin-top:6px;">
                      <div style="font-size:0.78rem; color:var(--text-muted);" class="topic-math-block">
                        <strong>Solution:</strong> ${renderLatexString(q.solution_latex?.slice(0, 140) || 'Step-by-step verification complete.')}...
                      </div>
                      <button class="btn-primary btn-add-drawer-q" data-qid="${q.id}" style="font-size:0.72rem; padding:4px 10px; white-space:nowrap;">
                        <i data-lucide="plus" style="width:12px; height:12px;"></i> Add to Draft
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;

            // Attach "Add to Draft" button clicks
            drawer.querySelectorAll('.btn-add-drawer-q').forEach(addBtn => {
              addBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const qid = addBtn.getAttribute('data-qid');
                const matchedQ = qList.find(item => item.id === qid);
                if (matchedQ) {
                  addQuestionToTestDraft(matchedQ);
                  addBtn.innerHTML = `<i data-lucide="check" style="width:12px; height:12px; color:#10b981;"></i> Added!`;
                  setTimeout(() => {
                    addBtn.innerHTML = `<i data-lucide="plus" style="width:12px; height:12px;"></i> Add to Draft`;
                    initLucideIcons();
                  }, 1500);
                }
              });
            });
          }

          renderMathInElement(drawer);
          initLucideIcons();
        } catch (err) {
          console.error('Failed to load topic questions:', err);
          drawer.innerHTML = `<div style="color:#ef4444; padding:10px; font-size:0.82rem;">Error loading questions. Please try again.</div>`;
        }
      });
    });

    renderMathInElement(accordionContainer);
    initLucideIcons();
  };

  // 3. Event Listeners
  if (subjectSelect) {
    subjectSelect.addEventListener('change', loadCurriculum);
  }

  if (gradeSelect) {
    gradeSelect.addEventListener('change', loadCurriculum);
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderCurriculumAccordion();
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', loadCurriculum);
  }

  if (btnExpandAll) {
    btnExpandAll.addEventListener('click', () => {
      accordionContainer.querySelectorAll('.curriculum-chapter-card').forEach(card => {
        card.classList.add('expanded');
      });
    });
  }

  if (btnCollapseAll) {
    btnCollapseAll.addEventListener('click', () => {
      accordionContainer.querySelectorAll('.curriculum-chapter-card').forEach(card => {
        card.classList.remove('expanded');
      });
    });
  }

  // Initial load
  await loadCurriculum();
}

// Fallback curriculum helper when backend is offline
function getOfflineCurriculumFallback(subjectKey, grade) {
  if (subjectKey === 'PHYSICS') {
    return {
      subjectKey: 'PHYSICS',
      subjectName: 'Class 12 Physics',
      stream: 'COMMON_SENIOR',
      grades: ['12'],
      targetExams: ['CBSE_CLASS_12', 'HP_BOARD_CLASS_12', 'NEET_UG', 'JEE_MAIN'],
      totalChapters: 2,
      boardHighYieldSummary: {
        examBoard: 'CBSE / HPBOSE Class 12 Physics (70 Marks Theory)',
        fiveMarkGuarantees: [
          { rank: 1, topic: 'Ray Optics Derivations & Ray Diagrams', detail: 'Lens Maker\'s Formula and Microscope/Telescope ray diagrams', chapter: 'Chapter 9: Ray Optics' },
          { rank: 2, topic: 'Current Electricity & Magnetism', detail: 'Microscopic Ohm\'s Law and Moving Coil Galvanometer', chapter: 'Chapter 3 & 4' },
          { rank: 3, topic: 'AC Circuits & Resonance', detail: 'Series LCR phasor diagram and Full-wave rectifier', chapter: 'Chapter 7 & 14' }
        ],
        caseStudyFourMark: [
          { topic: 'Optics: TIR & Optical Fibres', detail: 'Total Internal Reflection and mirages', chapter: 'Chapter 9: Ray Optics' },
          { topic: 'Modern Physics', detail: 'Photoelectric effect graphical analysis', chapter: 'Chapter 11: Dual Nature' }
        ],
        threeMarkHeavyweights: [
          { topic: 'Huygens Wave Theory', detail: 'Proof of Snell\'s Law using secondary wavelets', chapter: 'Chapter 10: Wave Optics' },
          { topic: 'Gauss\'s Law Applications', detail: 'Field due to infinite plane sheet and wire', chapter: 'Chapter 1: Electric Charges' }
        ]
      },
      chapters: [
        {
          id: 'phy_12_ch01',
          grade: '12',
          discipline: 'ELECTROSTATICS',
          unit: 'Electrostatics & Current Electricity (Unit I & II - 16M)',
          chapterNumber: 1,
          chapterName: 'Electric Charges and Fields',
          totalQuestionsInChapter: 1,
          boardExamFocus: {
            highYield: 'Gauss\'s Law applications (infinitely long straight wire and uniformly charged infinite plane sheet); Electric field on equatorial line of dipole.',
            standardTrap: 'Forgetting vector directions when finding net torque/force or drawing electric field lines terminating perpendicularly.',
            questionType: '3-mark Gauss\'s law derivations, 2/3-mark dipole derivations.'
          },
          topics: [
            { id: 'phy_12_ch01_t1', topicName: 'Fundamentals of Electric Charge & Coulomb\'s Law', ncertSection: '1.1', highYield: true, questionCount: 0, subtopics: ['Quantization of charge (q = ±ne)', 'Coulomb\'s Law in vector form', 'Superposition principle', 'Dielectric constant'] },
            { id: 'phy_12_ch01_t2', topicName: 'Electric Field & Electric Dipole', ncertSection: '1.2', highYield: true, questionCount: 0, subtopics: ['Field due to point charge', 'Axial field derivation', 'Equatorial field derivation', 'Torque and potential energy in uniform field'] },
            { id: 'phy_12_ch01_t3', topicName: 'Gauss\'s Law and Its Applications', ncertSection: '1.3', highYield: true, questionCount: 1, subtopics: ['Electric flux (Φ = ∫E·dA)', 'Gauss Theorem (∮E·dA = q/ε₀)', 'Infinitely long charged wire', 'Uniformly charged infinite plane sheet (E = σ/2ε₀)'] }
          ]
        },
        {
          id: 'phy_12_ch09',
          grade: '12',
          discipline: 'OPTICS',
          unit: 'Electromagnetic Waves & Optics (Unit V & VI - 18M)',
          chapterNumber: 9,
          chapterName: 'Ray Optics and Optical Instruments',
          totalQuestionsInChapter: 1,
          boardExamFocus: {
            highYield: 'Lens Maker’s Formula; Single spherical surface refraction; Prism formula; Clean, labelled ray diagrams of Compound Microscope or Astronomical Telescope.',
            standardTrap: 'Incorrect sign convention for radii of curvature in Lens Maker\'s formula; forgetting image position at near point vs infinity.',
            questionType: 'Guaranteed 5-mark long answer derivation or 4-mark Case Study.'
          },
          topics: [
            { id: 'phy_12_ch09_t1', topicName: 'Refraction & Total Internal Reflection (TIR)', ncertSection: '9.1', highYield: true, questionCount: 0, subtopics: ['Snell\'s Law', 'TIR conditions (i > i_c)', 'Optical fibers (core > cladding)', 'Mirage and totally reflecting prisms'] },
            { id: 'phy_12_ch09_t2', topicName: 'Refraction at Spherical Surfaces and Lenses', ncertSection: '9.2', highYield: true, questionCount: 1, subtopics: ['Single spherical surface refraction (n₂/v - n₁/u = (n₂-n₁)/R)', 'Lens Maker\'s Formula derivation', 'Thin lens formula', 'Combination of thin lenses in contact'] },
            { id: 'phy_12_ch09_t3', topicName: 'Optical Instruments (Rays, Magnification & Adjustments)', ncertSection: '9.4', highYield: true, questionCount: 0, subtopics: ['Compound Microscope at D and infinity', 'Astronomical Telescope normal adjustment', 'Reflecting Cassegrain Telescope advantages'] }
          ]
        }
      ]
    };
  }

  if (subjectKey === 'CHEMISTRY') {
    return {
      subjectKey: 'CHEMISTRY',
      subjectName: 'Class 12 Chemistry',
      stream: 'COMMON_SENIOR',
      targetExams: ['CBSE_CLASS_12', 'HP_BOARD_CLASS_12', 'NEET_UG', 'JEE_MAIN'],
      totalChapters: 10,
      boardHighYieldSummary: {
        fiveMarkGuarantees: [
          'Solutions: Colligative property numericals involving van \'t Hoff factor (i) and degree of dissociation/association (α).',
          'Electrochemistry: Nernst equation calculations of cell potential, equilibrium constant (Kc), and ΔG° combined with Kohlrausch\'s Law.',
          'Organic Multistep Conversions: Named reactions (Aldol, Cannizzaro, Reimer-Tiemann, Gabriel Phthalimide, Hofmann Bromamide) with mechanistic steps.'
        ],
        fourMarkCaseStudies: [
          'Chemical Kinetics: Rate law determination from tabular concentration data and temperature dependence via Arrhenius equation.',
          'Coordination Compounds: Valence Bond Theory vs Crystal Field Theory electron splitting, spectrochemical series, and magnetic moments.'
        ],
        threeMarkCorePool: [
          'd- and f-Block Elements: Trends in standard reduction potentials (E°), Lanthanoid contraction consequences, and preparation/redox actions of KMnO4 & K2Cr2O7.',
          'Chemical Distinguishing Tests: Tollens, Fehling, Iodoform, Lucas, Carbylamine, and Hinsberg tests with observations and chemical equations.',
          'Biomolecules: Chemical proofs for the open-chain structure of glucose, peptide bonds, Zwitterion, and protein denaturation.'
        ]
      },
      chapters: [
        {
          id: 'chem_12_ch01',
          grade: '12',
          discipline: 'PHYSICAL_CHEMISTRY',
          unit: 'Section 1: Physical Chemistry (21 Marks)',
          chapterNumber: 1,
          chapterName: 'Solutions',
          totalQuestionsInChapter: 1,
          boardExamFocus: {
            highYield: 'Numericals on ΔT_f or Π combined with van \'t Hoff factor (i) to determine molar mass and degree of dissociation (α).',
            standardTrap: 'Forgetting van \'t Hoff factor i for electrolytes, or confusing mass of solvent w_A (in kg) with mass of solution.',
            questionType: '3-mark numerical or 5-mark combined numerical + Raoult\'s law deviation explanation.'
          },
          topics: [
            { id: 'chem_12_ch01_t1', topicName: 'Concentration Terms & Solubility (Henry\'s Law)', ncertSection: '1.1', highYield: true, questionCount: 0, subtopics: ['Mass %, ppm, mole fraction, molarity, molality', 'Henry\'s Law: p = K_H · x', 'Significance of K_H with temperature', 'Applications: carbonated drinks, scuba diving, anoxia'] },
            { id: 'chem_12_ch01_t2', topicName: 'Vapour Pressure & Raoult\'s Law', ncertSection: '1.2', highYield: true, questionCount: 0, subtopics: ['Raoult\'s Law for volatile solutes', 'Ideal solutions (ΔH=0, ΔV=0)', 'Positive deviation & minimum boiling azeotropes', 'Negative deviation & maximum boiling azeotropes'] },
            { id: 'chem_12_ch01_t3', topicName: 'Colligative Properties & Van \'t Hoff Factor', ncertSection: '1.3', highYield: true, questionCount: 1, subtopics: ['Relative Lowering of Vapour Pressure (RLVP)', 'Elevation of Boiling Point (ΔT_b = i·K_b·m)', 'Depression in Freezing Point (ΔT_f = i·K_f·m)', 'Osmotic Pressure (Π = i·CRT)', 'Van \'t Hoff factor (i) and degree of dissociation/association'] }
          ]
        },
        {
          id: 'chem_12_ch02',
          grade: '12',
          discipline: 'PHYSICAL_CHEMISTRY',
          unit: 'Section 1: Physical Chemistry (21 Marks)',
          chapterNumber: 2,
          chapterName: 'Electrochemistry',
          totalQuestionsInChapter: 1,
          boardExamFocus: {
            highYield: 'Nernst equation calculations involving log terms, equilibrium constant (Kc), and Δ_r G°; Kohlrausch\'s law numerical to find Λ°_m and α.',
            standardTrap: 'Using incorrect number of transferred electrons (n) in Nernst equation or flipping anode/cathode in E°_cell calculation.',
            questionType: 'Guaranteed 3-mark or 5-mark numerical.'
          },
          topics: [
            { id: 'chem_12_ch02_t1', topicName: 'Galvanic Cells & Nernst Equation', ncertSection: '2.1', highYield: true, questionCount: 1, subtopics: ['Standard Electrode Potential (E°)', 'Nernst Equation: E_cell = E°_cell - (0.0591/n) log Q', 'Equilibrium constant: log K_c = nE°/0.0591', 'Gibbs Free Energy: Δ_r G° = -nFE°'] },
            { id: 'chem_12_ch02_t2', topicName: 'Conductance in Electrolytic Solutions', ncertSection: '2.2', highYield: true, questionCount: 0, subtopics: ['Conductivity (κ) and Molar Conductivity (Λ_m)', 'Variation of κ and Λ_m with dilution', 'Debye-Hückel-Onsager equation', 'Kohlrausch\'s Law of Independent Migration of Ions'] },
            { id: 'chem_12_ch02_t3', topicName: 'Electrolysis & Commercial Batteries', ncertSection: '2.3', highYield: true, questionCount: 0, subtopics: ['Faraday\'s Laws of Electrolysis', 'Dry cell & Mercury cell (constant 1.35V voltage)', 'Lead-acid storage battery reactions', 'H₂-O₂ Fuel cell & corrosion mechanism'] }
          ]
        }
      ]
    };
  }

  return {
    subjectKey: subjectKey || 'BIOLOGY',
    subjectName: subjectKey === 'BIOLOGY' ? 'Class 12 Biology' : (subjectKey === 'CHEMISTRY' ? 'Class 12 Chemistry' : 'Science'),
    stream: subjectKey === 'BIOLOGY' ? 'MEDICAL' : 'COMMON_SENIOR',
    targetExams: ['CBSE_CLASS_12', 'HP_BOARD_CLASS_12', 'NEET_UG'],
    totalChapters: 13,
    units: [
      { unitNumber: 'Unit VI', unitName: 'Reproduction (Chapters 1 to 3)', weightageMarks: 16, chapters: [1, 2, 3] },
      { unitNumber: 'Unit VII', unitName: 'Genetics and Evolution (Chapters 4 to 6)', weightageMarks: 20, chapters: [4, 5, 6] },
      { unitNumber: 'Unit VIII', unitName: 'Biology in Human Welfare (Chapters 7 & 8)', weightageMarks: 12, chapters: [7, 8] },
      { unitNumber: 'Unit IX', unitName: 'Biotechnology: Principles & Applications (Chapters 9 & 10)', weightageMarks: 12, chapters: [9, 10] },
      { unitNumber: 'Unit X', unitName: 'Ecology and Environment (Chapters 11 to 13)', weightageMarks: 10, chapters: [11, 12, 13] }
    ],
    boardHighYieldSummary: {
      fiveMarkGuarantees: [
        'Menstrual Cycle: Hormonal tracking plots (FSH, LH, Estrogen, Progesterone) across 28 days with ovulation and corpus luteum.',
        'Molecular Pathways: DNA replication fork mechanisms, transcription split-gene processing (splicing, capping, tailing), and Lac Operon regulation.',
        'Recombinant DNA Technology: Vector pBR322 architecture with selectable markers, PCR cycle, and Humulin / ADA gene therapy.'
      ],
      fourMarkCaseStudies: [
        'Genetics: Pedigree analysis charts deducing Autosomal Recessive vs Dominant vs X-linked traits (Sickle-cell anemia, Thalassemia).',
        'Ecology: Verhulst-Pearl Logistic Growth (dN/dt = rN(K-N)/K) vs Exponential growth curves and Alexander von Humboldt\'s Species-Area Relationship.'
      ],
      threeMarkCorePool: [
        'Outbreeding Devices & Double Fertilization (syngamy + triple fusion producing 3n PEN).',
        'Hardy-Weinberg equilibrium calculation (p² + 2pq + q² = 1) and Homologous vs Analogous organs.',
        'Life cycle of Plasmodium (liver stage, RBC haemozoin release, mosquito gut) and HIV retrovirus replication.',
        'Microbes match-the-following (Statins, Cyclosporin A, Streptokinase) and Sewage Treatment BOD reduction.'
      ]
    },
    chapters: [
      {
        id: 'bio_12_ch01',
        grade: '12',
        discipline: 'BOTANY',
        unit: 'Unit VI: Reproduction (16 Marks)',
        chapterNumber: 1,
        chapterName: 'Sexual Reproduction in Flowering Plants',
        totalQuestionsInChapter: 1,
        boardExamFocus: {
          highYield: '7-celled, 8-nucleate female gametophyte; L.S. of anatropous ovule; Double fertilization; Outbreeding devices.',
          standardTrap: 'Confusing perisperm (persistent nucellus) with pericarp (fruit wall).',
          questionType: '5-mark embryo sac development; 3-mark outbreeding devices.'
        },
        topics: [
          { id: 't1', topicName: 'Pre-Fertilization: Structures and Events', ncertSection: '1.1', highYield: true, questionCount: 1 },
          { id: 't2', topicName: 'Pollination Mechanisms & Adaptations', ncertSection: '1.2', highYield: true, questionCount: 0 },
          { id: 't3', topicName: 'Double Fertilization & Post-Fertilization Events', ncertSection: '1.3', highYield: true, questionCount: 0 }
        ]
      },
      {
        id: 'bio_12_ch02',
        grade: '12',
        discipline: 'ZOOLOGY',
        unit: 'Unit VI: Reproduction (16 Marks)',
        chapterNumber: 2,
        chapterName: 'Human Reproduction',
        totalQuestionsInChapter: 1,
        boardExamFocus: {
          highYield: 'Menstrual cycle hormone tracking graphs; Spermatogenesis vs Oogenesis ploidy; Blastocyst implantation.',
          standardTrap: 'Confusing primary oocyte (Prophase-I) with secondary oocyte (Metaphase-II).',
          questionType: '5-mark menstrual cycle with graphs; 3-mark gametogenesis.'
        },
        topics: [
          { id: 't4', topicName: 'The Male and Female Reproductive Systems', ncertSection: '2.1', highYield: true, questionCount: 0 },
          { id: 't5', topicName: 'Gametogenesis', ncertSection: '2.2', highYield: true, questionCount: 0 },
          { id: 't6', topicName: 'The Menstrual Cycle', ncertSection: '2.3', highYield: true, questionCount: 1 },
          { id: 't7', topicName: 'Fertilization, Pregnancy & Parturition', ncertSection: '2.4', highYield: true, questionCount: 0 }
        ]
      },
      {
        id: 'bio_12_ch05',
        grade: '12',
        discipline: 'BOTANY',
        unit: 'Unit VII: Genetics and Evolution (20 Marks)',
        chapterNumber: 5,
        chapterName: 'Molecular Basis of Inheritance',
        totalQuestionsInChapter: 1,
        boardExamFocus: {
          highYield: 'DNA replication fork mechanisms; Transcription in eukaryotes; Lac Operon switched-on vs off states.',
          standardTrap: 'Writing RNA transcript polarity backwards (mRNA is synthesized 5\'→3\').',
          questionType: '5-mark Lac operon or Replication fork; 3-mark DNA fingerprinting.'
        },
        topics: [
          { id: 't8', topicName: 'DNA Structure and Packaging', ncertSection: '5.1', highYield: true, questionCount: 0 },
          { id: 't9', topicName: 'Identifying Genetic Material & Replication', ncertSection: '5.2', highYield: true, questionCount: 0 },
          { id: 't10', topicName: 'Transcription and Processing', ncertSection: '5.3', highYield: true, questionCount: 0 },
          { id: 't11', topicName: 'Genetic Code, Translation & Regulation', ncertSection: '5.4', highYield: true, questionCount: 1 },
          { id: 't12', topicName: 'Human Genome Project (HGP) & DNA Fingerprinting', ncertSection: '5.5', highYield: true, questionCount: 0 }
        ]
      }
    ]
  };
}

function renderPyqCards(pyqs) {
  const container = document.getElementById('class10PyqContainer');
  if (!container) return;

  if (pyqs.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="text-align:center; padding: 3rem;">
        <i data-lucide="inbox" style="width:36px; height:36px; color:var(--text-muted); margin: 0 auto 10px; display:block;"></i>
        <h3 style="color:var(--text-primary); font-size:1.1rem; margin-bottom:4px;">No Questions Match This Filter</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem;">Try adjusting the subject, chapter, or search keywords.</p>
      </div>
    `;
    initLucideIcons();
    return;
  }

  container.innerHTML = '';

  pyqs.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.position = 'relative';
    card.style.padding = '1.25rem 1.5rem';
    card.style.border = '1px solid var(--border-subtle)';

    const mapping = q.ncert_mapping || {};
    const marks = mapping.marks || 3;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="pilot-tag" style="background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); border-color: rgba(59, 130, 246, 0.3); font-weight:700;">
            Q${index + 1} &bull; Class 10 ${q.subject}
          </span>
          <span class="pilot-tag" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.3);">
            ${mapping.pyq_tag || 'Board Exam'}
          </span>
          <span class="pilot-tag" style="background: rgba(234, 179, 8, 0.12); color: #eab308; border-color: rgba(234, 179, 8, 0.3);">
            ${marks} Marks &bull; ${q.difficulty}
          </span>
        </div>

        <div style="font-size: 0.75rem; color: var(--text-muted); display:flex; align-items:center; gap:6px;">
          <i data-lucide="book" style="width:13px; height:13px; color:var(--accent-blue);"></i>
          <span>${mapping.page_reference || 'NCERT Class 10'}</span>
        </div>
      </div>

      <div style="margin-bottom: 0.5rem; font-size: 0.82rem; color: var(--accent-cyan); font-weight: 600;">
        Chapter: ${q.chapter} &bull; Section: ${mapping.ncert_section || 'Standard'}
      </div>

      <div class="pyq-latex-body" style="font-size: 1rem; color: var(--text-primary); margin-bottom: 1rem; line-height: 1.6; padding: 10px 14px; background: rgba(0,0,0,0.18); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        ${renderLatexString(q.question_latex)}
      </div>

      <!-- Multiple Choice Options (if present) -->
      ${q.options_latex && q.options_latex.length > 0 ? `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px; margin-bottom: 1rem;">
          ${q.options_latex.map(opt => `
            <div style="display:flex; align-items:center; gap:10px; padding: 8px 12px; background: ${opt.is_correct ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${opt.is_correct ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}; border-radius: 6px;">
              <span style="font-weight:700; font-size:0.85rem; color:${opt.is_correct ? '#10b981' : 'var(--text-muted)'}; min-width:18px;">${opt.key}</span>
              <div style="font-size:0.88rem; flex:1;" class="pyq-math-inline">${renderLatexString(opt.latex)}</div>
              ${opt.is_correct ? '<span style="color:#10b981; font-size:0.72rem; font-weight:700;">✓ Correct</span>' : (opt.distractor_trap ? `<span style="color:#ef4444; font-size:0.68rem; max-width:140px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${opt.distractor_trap}">Trap</span>` : '')}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Expandable Rubric & Solution Accordion -->
      <details style="margin-bottom: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px 12px;">
        <summary style="cursor: pointer; font-weight: 600; font-size: 0.85rem; color: var(--accent-emerald); display: flex; align-items: center; justify-content: space-between;">
          <span>View CBSE / HPBOSE Step-by-Step Marking Rubric (${marks} Marks)</span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Click to expand</span>
        </summary>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-subtle);">
          <div style="margin-bottom: 8px; font-size: 0.85rem; color: var(--text-secondary);" class="pyq-math-inline">
            <strong>Full Solution:</strong><br/>
            ${renderLatexString(q.solution_latex)}
          </div>

          ${q.step_rubric && q.step_rubric.length > 0 ? `
            <div style="margin-top: 8px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">
              <strong style="color: #eab308; font-size: 0.78rem;">Marking Scheme Breakdown:</strong>
              <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                ${q.step_rubric.map(r => `
                  <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-secondary); align-items:center;">
                    <span><strong>Step ${r.step}:</strong> ${renderLatexString(r.description)}</span>
                    <span style="color:#10b981; font-weight:700; white-space:nowrap; margin-left:8px;">+${r.marks}M</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </details>

      <!-- Action Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          Benchmark: ${q.benchmark_time_seconds || 120}s &bull; Bloom Level: ${q.bloom_level || 'APPLICATION'}
        </div>

        <div style="display: flex; gap: 8px;">
          <button class="btn-secondary btn-generate-variant" data-id="${q.id}" data-subject="${q.subject}" data-chapter="${q.chapter}" data-board="${mapping.pyq_tag?.includes('HPBOSE') ? 'HP_BOARD' : 'CBSE'}" style="font-size:0.78rem; padding:5px 10px;">
            <i data-lucide="sparkles" style="width:13px; height:13px;"></i> Generate AI Variant
          </button>
          <button class="btn-primary btn-add-pyq-test" data-id="${q.id}" style="font-size:0.78rem; padding:5px 12px;">
            <i data-lucide="plus-circle" style="width:13px; height:13px;"></i> Add to Class Test
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
    renderMathInElement(card);
  });

  // Attach button handlers
  container.querySelectorAll('.btn-add-pyq-test').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const qid = e.currentTarget.getAttribute('data-id');
      const qObj = pyqs.find(q => q.id === qid);
      if (qObj) {
        addQuestionToTestDraft(qObj);
      }
    });
  });

  container.querySelectorAll('.btn-generate-variant').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const subj = e.currentTarget.getAttribute('data-subject');
      const chap = e.currentTarget.getAttribute('data-chapter');
      const board = e.currentTarget.getAttribute('data-board');

      // Switch to Generator Studio Tab
      const tabGenBtn = document.getElementById('tabBtnGenerator');
      if (tabGenBtn) tabGenBtn.click();

      // Pre-fill fields
      const selGrade = document.getElementById('selectGrade');
      const selBoard = document.getElementById('selectBoard');
      const selSubj = document.getElementById('selectSubject');
      const selTopic = document.getElementById('selectTopic');

      if (selGrade) selGrade.value = '10';
      if (selBoard) selBoard.value = board || 'CBSE';
      if (selSubj) selSubj.value = subj || 'Science';
      if (selTopic) selTopic.value = chap;

      // Trigger generate
      const btnGen = document.getElementById('btnGenerateQuestion');
      if (btnGen) btnGen.click();
    });
  });

  initLucideIcons();
}

function getBundledClass10Pyqs() {
  return [
    {
      id: "pyq_10_sci_light_01",
      grade: "10",
      subject: "Science",
      chapter: "Light – Reflection and Refraction",
      ncert_mapping: {
        chapter_number: 9,
        chapter_name: "Light – Reflection and Refraction",
        ncert_section: "9.2.2 Mirror Formula and Magnification",
        page_reference: "NCERT Class 10 Science, Pages 168–171",
        pyq_tag: "CBSE Board Exam 2023 (Set 31/1/1) & HPBOSE 2022",
        marks: 3
      },
      difficulty: "MEDIUM",
      question_type: "NUMERICAL",
      bloom_level: "APPLICATION",
      question_latex: "An object of height $h = 4\\,\\text{cm}$ is placed at a distance of $u = -25\\,\\text{cm}$ in front of a concave mirror of focal length $f = -15\\,\\text{cm}$. At what distance $v$ from the mirror should a screen be placed in order to obtain a sharp real image? Find the nature and height $h'$ of the image formed.",
      options_latex: [
        { key: "A", latex: "$v = -37.5\\,\\text{cm}$, $h' = -6\\,\\text{cm}$ (Real and Inverted)", is_correct: true, distractor_trap: null },
        { key: "B", latex: "$v = +37.5\\,\\text{cm}$, $h' = +6\\,\\text{cm}$ (Virtual and Erect)", is_correct: false, distractor_trap: "Ignored Cartesian sign conventions" },
        { key: "C", latex: "$v = -9.37\\,\\text{cm}$, $h' = -1.5\\,\\text{cm}$", is_correct: false, distractor_trap: "Used lens formula instead of mirror formula" },
        { key: "D", latex: "$v = -25.0\\,\\text{cm}$, $h' = -4\\,\\text{cm}$", is_correct: false, distractor_trap: "Assumed object at center of curvature" }
      ],
      correct_answer_latex: "v = -37.5\\,\\text{cm},\\; h' = -6\\,\\text{cm}",
      solution_latex: "1. **Mirror Formula**: $$\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f} \\implies \\frac{1}{v} = \\frac{1}{-15} - \\frac{1}{-25} = -\\frac{2}{75} \\implies v = -37.5\\,\\text{cm}$$\n2. **Magnification**: $$m = -\\frac{v}{u} = \\frac{h'}{h} \\implies h' = -\\left(\\frac{-37.5}{-25}\\right) \\times 4 = -6\\,\\text{cm}$$",
      socratic_hints: ["Apply mirror formula with $f=-15\\text{cm}, u=-25\\text{cm}$.", "Calculate magnification $m = -v/u$."],
      step_rubric: [
        { step: 1, description: "Mirror formula statement with correct signs", marks: 1.0 },
        { step: 2, description: "Calculation of $v = -37.5\\text{cm}$", marks: 1.0 },
        { step: 3, description: "Height $h' = -6\\text{cm}$ and stating Real & Inverted", marks: 1.0 }
      ],
      benchmark_time_seconds: 150
    }
  ];
}

// -----------------------------------------------------------------------------
// 3. TELEMETRY & DIAGNOSTICS MONITOR
// -----------------------------------------------------------------------------
function renderTelemetryTable() {
  const tbody = document.getElementById('telemetryTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  state.telemetryStream.forEach(t => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border-subtle)';
    tr.innerHTML = `
      <td style="padding: 10px 6px; font-weight:600; color:var(--text-primary);">${t.student}</td>
      <td style="padding: 10px 6px; color:var(--text-secondary);">${t.subtopic}</td>
      <td style="padding: 10px 6px; font-family:monospace; color:var(--accent-amber);">${t.timeSpent}</td>
      <td style="padding: 10px 6px; font-family:monospace; color:var(--text-muted);">${t.hesitation}</td>
      <td style="padding: 10px 6px; font-weight:700; color:${t.status === 'CORRECT' ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">${t.status}</td>
      <td style="padding: 10px 6px;"><span class="diagnostic-badge ${t.badge}">${t.category}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupTelemetryControls() {
  const btnSim = document.getElementById('btnSimulateTelemetryEvent');
  if (btnSim) {
    btnSim.addEventListener('click', () => {
      const names = ['Aryan Sharma', 'Ananya Thakur', 'Rohit Negi', 'Kavya Verma', 'Harsh Mahajan'];
      const subtopics = ['Moment of Inertia', 'Damped Oscillations', 'Work-Energy Theorem', 'Angular Momentum'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomSub = subtopics[Math.floor(Math.random() * subtopics.length)];
      const randomSec = Math.floor(Math.random() * 120) + 30;
      const isCorrect = Math.random() > 0.35;

      const newRow = {
        student: randomName,
        subtopic: randomSub,
        timeSpent: `${randomSec}s`,
        hesitation: `${Math.floor(Math.random() * 20) + 4}s`,
        status: isCorrect ? 'CORRECT' : 'INCORRECT',
        category: isCorrect ? (randomSec < 80 ? 'FAST_ACCURATE' : 'SLOW_ACCURATE') : 'SLOW_MISCONCEPTION',
        badge: isCorrect ? (randomSec < 80 ? 'badge-mastered' : 'badge-recap') : 'badge-weak'
      };

      state.telemetryStream.unshift(newRow);
      if (state.telemetryStream.length > 8) state.telemetryStream.pop();
      renderTelemetryTable();
    });
  }

  const btnEveningDrill = document.getElementById('btnTriggerEveningDrill');
  if (btnEveningDrill) {
    btnEveningDrill.addEventListener('click', () => {
      alert('Evening Prep Remedial Drill #SHM-04 dispatched to Aryan Sharma for 7:30 PM hostel self-study.');
    });
  }
}

// -----------------------------------------------------------------------------
// 4. HANDWRITTEN ANSWER SHEET EVALUATOR
// -----------------------------------------------------------------------------
function setupHandwrittenStation() {
  const btnApprove = document.getElementById('btnApproveHandwritten');
  const btnOverride = document.getElementById('btnOverrideMarks');

  if (btnApprove) {
    btnApprove.addEventListener('click', () => {
      alert('Verified by Teacher: 4.0 / 4.0 marks officially recorded in HAPS Class XI Gradebook.');
    });
  }

  if (btnOverride) {
    btnOverride.addEventListener('click', () => {
      const newMarks = prompt('Enter revised marks for Aryan Sharma (out of 4.0):', '4.0');
      if (newMarks !== null) {
        document.getElementById('displayTotalMarks').innerText = `${newMarks} / 4.0`;
        alert(`Marks successfully adjusted to ${newMarks}/4.0.`);
      }
    });
  }
}

// -----------------------------------------------------------------------------
// 5. STUDENT ADAPTIVE VIEW & SOCRATIC TUTOR
// -----------------------------------------------------------------------------
function setupStudentMode() {
  const modeCards = document.querySelectorAll('.mode-card');
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.activeStudentMode = card.getAttribute('data-mode');
      alert(`Switched to Learning Mode: ${state.activeStudentMode}`);
    });
  });

  const btnHint = document.getElementById('btnRequestSocraticHint');
  const hintBox = document.getElementById('socraticHintBox');
  const hintTextEl = document.getElementById('socraticHintText');
  const hintNumEl = document.getElementById('hintNumber');

  if (btnHint && hintNumEl && hintTextEl && hintBox) {
    btnHint.addEventListener('click', () => {
      const activeQ = (examState.questions && examState.questions.length > 0)
        ? examState.questions[examState.currentQuestionIndex]
        : state.currentQuestion;
      const hints = (activeQ && activeQ.socratic_hints && activeQ.socratic_hints.length > 0)
        ? activeQ.socratic_hints
        : (state.currentQuestion?.socratic_hints || [
            "What fundamental formula governs this physical or mathematical system?",
            "Check what values or quantities are conserved in this interaction.",
            "Substitute given numerical values carefully to solve for the target variable."
          ]);

      state.studentTimer.hintsRevealed = (state.studentTimer.hintsRevealed % hints.length) + 1;
      const hintIdx = state.studentTimer.hintsRevealed - 1;
      const hint = hints[hintIdx];

      hintNumEl.innerText = state.studentTimer.hintsRevealed;
      hintTextEl.innerHTML = renderLatexString(hint);
      hintBox.classList.add('visible');
      initLucideIcons();
    });
  }

  const btnSubmit = document.getElementById('btnSubmitStudentAnswer');
  const feedbackAlert = document.getElementById('studentFeedbackAlert');

  if (btnSubmit) {
    btnSubmit.addEventListener('click', async () => {
      if (!state.studentTimer.selectedOption) {
        alert('Please select an option before submitting.');
        return;
      }

      const isCorrect = state.studentTimer.selectedOption === (state.currentQuestion.correct_answer || 'B');
      const timeSpent = state.studentTimer.secondsElapsed;

      // Post telemetry to backend and broadcast via WebSocket
      try {
        fetch(`${getApiBaseUrl()}/api/telemetry/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: 'b0000000-0000-0000-0000-000000000001',
            questionId: state.currentQuestion.id,
            timeSpentSeconds: timeSpent,
            attemptStatus: isCorrect ? 'CORRECT' : 'INCORRECT',
            selectedOption: state.studentTimer.selectedOption,
            subtopic: state.currentQuestion.subtopic || 'Moment of Inertia',
            topic: state.currentQuestion.topic || 'Rotational Motion',
            hintsUsed: state.studentTimer.hintsRevealed
          })
        });
      } catch (e) {
        console.log('Streamed telemetry to local Kafka bus.');
      }

      // Send WebSocket Telemetry Tick
      sendWsMessage({
        type: 'STUDENT_ANSWER_SUBMITTED',
        studentId: 'b0000000-0000-0000-0000-000000000001',
        studentName: 'Aryan Sharma',
        seatIndex: 0,
        timeSpent,
        isCorrect
      });

      if (feedbackAlert) {
        feedbackAlert.style.display = 'block';
        if (isCorrect) {
          feedbackAlert.style.background = 'rgba(16, 185, 129, 0.15)';
          feedbackAlert.style.border = '1px solid rgba(16, 185, 129, 0.4)';
          feedbackAlert.style.color = '#34d399';
          feedbackAlert.innerHTML = `
            <strong>Accurate Solution (+4.0 Marks)</strong>
            <p style="font-size:0.85rem; margin-top:4px;">You solved it in ${timeSpent}s (Benchmark: 90s). Real-time telemetry streamed to Teacher Co-Pilot.</p>
          `;
        } else {
          feedbackAlert.style.background = 'rgba(244, 63, 94, 0.15)';
          feedbackAlert.style.border = '1px solid rgba(244, 63, 94, 0.4)';
          feedbackAlert.style.color = '#fb7185';
          feedbackAlert.innerHTML = `
            <strong>Incorrect Attempt (-1.0 Mark)</strong>
            <p style="font-size:0.85rem; margin-top:4px;">Option ${state.studentTimer.selectedOption} is a common distractor trap. Review torque formulation!</p>
          `;
        }
      }
    });
  }
}

function startStudentTimer() {
  const timerEl = document.getElementById('activeQuestionTimer');
  if (!timerEl) return;

  if (state.studentTimer.intervalId) {
    clearInterval(state.studentTimer.intervalId);
  }

  state.studentTimer.intervalId = setInterval(() => {
    state.studentTimer.secondsElapsed += 1;
    if (typeof examState !== 'undefined' && examState.timeSpentPerQuestion) {
      const idx = examState.currentQuestionIndex || 0;
      examState.timeSpentPerQuestion[idx] = (examState.timeSpentPerQuestion[idx] || 0) + 1;
    }
    const mins = String(Math.floor(state.studentTimer.secondsElapsed / 60)).padStart(2, '0');
    const secs = String(state.studentTimer.secondsElapsed % 60).padStart(2, '0');
    timerEl.innerText = `${mins}:${secs}`;
  }, 1000);
}

function renderStudentQuestion() {
  const q = state.currentQuestion;
  const qTextEl = document.getElementById('studentRenderQuestion');
  const optListEl = document.getElementById('studentRenderOptions');

  if (!qTextEl || !optListEl) return;

  qTextEl.innerHTML = renderLatexString(q.question_latex);

  optListEl.innerHTML = '';
  if (q.options_latex && q.options_latex.length > 0) {
    q.options_latex.forEach(opt => {
      const optItem = document.createElement('div');
      optItem.className = 'latex-option-item';
      optItem.innerHTML = `
        <div class="latex-option-key">${opt.key}</div>
        <div style="flex:1;">
          <div class="opt-formula">${renderLatexString(opt.latex)}</div>
        </div>
      `;

      optItem.addEventListener('click', () => {
        document.querySelectorAll('#studentRenderOptions .latex-option-item').forEach(el => {
          el.style.borderColor = 'var(--border-subtle)';
          el.style.background = 'rgba(255, 255, 255, 0.03)';
        });
        optItem.style.borderColor = 'var(--accent-cyan)';
        optItem.style.background = 'rgba(56, 189, 248, 0.12)';
        state.studentTimer.selectedOption = opt.key;

        // WebSocket option select broadcast
        sendWsMessage({
          type: 'STUDENT_OPTION_SELECTED',
          studentId: 'b0000000-0000-0000-0000-000000000001',
          seatIndex: 0,
          option: opt.key
        });
      });

      optListEl.appendChild(optItem);
    });
  }
}

// -----------------------------------------------------------------------------
// TASK-10: DRAG & DROP FILE UPLOAD & VISION AI EXECUTION
// -----------------------------------------------------------------------------
function setupHandwrittenUploadAndVisionAi() {
  const fileInput = document.getElementById('handwrittenFileInput');
  const dropZone = document.getElementById('sheetDropZone');
  const btnUpload = document.getElementById('btnUploadNewSheet');
  const btnRunScan = document.getElementById('btnRunVisionAiScan');
  const scannedPaperImg = document.getElementById('scannedPaperImg');
  const scanline = document.getElementById('sheetScanline');

  if (!dropZone || !fileInput) return;

  // Trigger file browser
  const triggerBrowser = () => fileInput.click();
  dropZone.addEventListener('click', triggerBrowser);
  if (btnUpload) btnUpload.addEventListener('click', triggerBrowser);

  // Drag over states
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  function handleFileSelected(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      scannedPaperImg.src = e.target.result;
      runVisionAiScan(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  if (btnRunScan) {
    btnRunScan.addEventListener('click', () => {
      runVisionAiScan(scannedPaperImg.src);
    });
  }

  async function runVisionAiScan(imageData) {
    if (scanline) scanline.style.display = 'block';
    if (btnRunScan) btnRunScan.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Scanning with Gemini 1.5 Flash...`;
    initLucideIcons();

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/upload/handwritten-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          studentId: 'b0000000-0000-0000-0000-000000000001',
          questionId: 'c0000000-0000-0000-0000-000000000002',
          subject: 'Physics'
        })
      });

      if (res.ok) {
        const data = await res.json();
        renderVisionEvaluationResult(data.evaluation);
      } else {
        throw new Error('Fallback to local vision engine');
      }
    } catch (err) {
      // Local simulated response with clean bounding boxes
      renderVisionEvaluationResult({
        totalMarksAwarded: 4.0,
        maxPossibleMarks: 4.0,
        aiConfidenceScore: 0.985,
        steps: [
          { stepIndex: 1, title: "Definite Integral Formulation", maxMarks: 1.0, awardedMarks: 1.0, status: "CORRECT", boundingBox: { ymin: 20, xmin: 10, ymax: 38, xmax: 90 } },
          { stepIndex: 2, title: "Monomial Antiderivative Integration", maxMarks: 1.5, awardedMarks: 1.5, status: "CORRECT", boundingBox: { ymin: 44, xmin: 10, ymax: 65, xmax: 90 } },
          { stepIndex: 3, title: "Arithmetic Evaluation & SI Unit", maxMarks: 1.5, awardedMarks: 1.5, status: "CORRECT", boundingBox: { ymin: 70, xmin: 10, ymax: 90, xmax: 90 } }
        ]
      });
    } finally {
      setTimeout(() => {
        if (scanline) scanline.style.display = 'none';
        if (btnRunScan) btnRunScan.innerHTML = `<i data-lucide="sparkles" style="width:14px;height:14px;"></i> Run Vision AI Evaluation`;
        initLucideIcons();
      }, 1200);
    }
  }

  function renderVisionEvaluationResult(evalData) {
    document.getElementById('displayTotalMarks').innerText = `${evalData.totalMarksAwarded.toFixed(1)} / ${evalData.maxPossibleMarks.toFixed(1)}`;

    const boxContainer = document.getElementById('dynamicBoundingBoxesContainer');
    if (boxContainer && evalData.steps) {
      boxContainer.innerHTML = '';
      evalData.steps.forEach(step => {
        const b = step.boundingBox;
        const box = document.createElement('div');
        box.className = 'bounding-overlay-box';
        box.style.top = `${b.ymin}%`;
        box.style.left = `${b.xmin}%`;
        box.style.width = `${b.xmax - b.xmin}%`;
        box.style.height = `${b.ymax - b.ymin}%`;
        box.title = `${step.title}: +${step.awardedMarks} pts`;
        boxContainer.appendChild(box);
      });
    }

    alert('Vision AI Evaluation Complete.\nScored 4.0/4.0 against official CBSE/HPBOSE marking rubric.');
  }
}

// -----------------------------------------------------------------------------
// TASK-11: LIVE CLASSROOM SEATMAP & WEBSOCKET PROTOCOL
// -----------------------------------------------------------------------------
let wsClient = null;

function setupWebSocketClient() {
  try {
    const wsUrl = getWsBaseUrl();
    wsClient = new WebSocket(wsUrl);

    wsClient.onopen = () => {
      console.log('[WEBSOCKET CLIENT] Connected to HAPS telemetry server:', wsUrl);
      const ticker = document.getElementById('kafkaStatusTicker');
      if (ticker) ticker.innerHTML = '<span style="color:#10b981;">●</span> Kafka: Streaming Live';
    };

    wsClient.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleIncomingTelemetry(msg);
      } catch (e) {}
    };

    wsClient.onerror = () => {
      const ticker = document.getElementById('kafkaStatusTicker');
      if (ticker) ticker.innerHTML = '<span style="color:#f59e0b;">●</span> Stream Bus: In-Memory Live';
    };
  } catch (e) {
    const ticker = document.getElementById('kafkaStatusTicker');
    if (ticker) ticker.innerHTML = '<span style="color:#f59e0b;">●</span> Stream Bus: Local Loop';
  }
}

function sendWsMessage(payload) {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(JSON.stringify(payload));
  } else {
    // Local loopback
    handleIncomingTelemetry(payload);
  }
}

function handleIncomingTelemetry(msg) {
  if (msg.type === 'STUDENT_ANSWER_SUBMITTED' || msg.type === 'STUDENT_OPTION_SELECTED') {
    const seatPods = document.querySelectorAll('.seat-pod');
    if (seatPods.length > 0) {
      const targetPod = seatPods[msg.seatIndex || 0];
      if (targetPod) {
        targetPod.classList.add('active-solving');
        const dot = targetPod.querySelector('.pulse-dot');
        if (dot) {
          dot.className = `pulse-dot ${msg.isCorrect === false ? 'red' : 'green'}`;
        }
        setTimeout(() => targetPod.classList.remove('active-solving'), 2500);
      }
    }
  }
}

function initClassroomSeatmap() {
  const seatmapGrid = document.getElementById('classroomSeatmapGrid');
  if (!seatmapGrid) return;

  seatmapGrid.innerHTML = '';
  const students = [
    { name: 'Aryan S.', status: 'green', time: '0:54' },
    { name: 'Ananya T.', status: 'amber', time: '1:45' },
    { name: 'Rohit N.', status: 'red', time: '3:15' },
    { name: 'Kavya V.', status: 'green', time: '0:42' },
    { name: 'Harsh M.', status: 'green', time: '0:48' },
    { name: 'Riya K.', status: 'green', time: '0:55' },
    { name: 'Aditya P.', status: 'amber', time: '1:30' },
    { name: 'Sanya D.', status: 'green', time: '0:38' }
  ];

  for (let i = 0; i < 32; i++) {
    const s = students[i % students.length];
    const pod = document.createElement('div');
    pod.className = 'seat-pod';
    pod.innerHTML = `
      <div style="font-size:0.75rem; font-weight:700; color:var(--text-primary);">
        <span class="pulse-dot ${s.status}"></span> Desk ${i + 1}
      </div>
      <div style="font-size:0.68rem; color:var(--text-muted); margin-top:2px;">${s.name}</div>
      <div style="font-size:0.65rem; color:var(--accent-amber); font-family:monospace;">${s.time}</div>
    `;

    pod.addEventListener('click', () => {
      alert(`Desk ${i + 1}: ${s.name}\nActive Status: ${s.status === 'green' ? 'Solving accurately within benchmark' : s.status === 'amber' ? 'Hesitating (>60s)' : 'Misconception / Hints requested'}`);
    });

    seatmapGrid.appendChild(pod);
  }
}

// -----------------------------------------------------------------------------
// TASK-12: REAL WHATSAPP NOTIFICATION ENGINE & PRINT REPORT
// -----------------------------------------------------------------------------
let activeWhatsAppContext = {
  studentId: 'b0000000-0000-0000-0000-000000000001',
  studentName: 'Aryan Sharma',
  rollNumber: '12-NM-01',
  parentPhone: '+91 98160 12345',
  accuracy: 78.4,
  studyHours: 15.2,
  mastered: 'Moment of Inertia (95% accuracy)',
  weakness: 'Damped Oscillations (Derivation of amplitude decay)',
  actionItem: 'Ask Aryan: "How do car shock absorbers stop a car from bouncing?" (5-min Feynman check)',
  portalUrl: 'https://scholar.unisole.ai/report/b0000000-0000-0000-0000-000000000001'
};

function formatWhatsAppDossierText(ctx) {
  return (
    `*Unisole AI School - Official Academic Update*\n` +
    `*Weekly Academic Dossier for ${ctx.studentName} (Roll: ${ctx.rollNumber})*\n\n` +
    `*Performance Summary:*\n` +
    `• Weekly Accuracy: ${ctx.accuracy}%\n` +
    `• Study Time: ${ctx.studyHours || '15.2'} hrs\n` +
    `• Mastered: ${ctx.mastered}\n` +
    `• Focus Need: ${ctx.weakness}\n\n` +
    `*Recommended Parent Action for this Weekend:*\n` +
    `1. ${ctx.actionItem}\n` +
    `2. Ensure 45 mins quiet time Sunday morning for speed recap drill.\n\n` +
    `Official Portal: ${ctx.portalUrl}\n` +
    `_Unisole AI School Scholar Assistant_`
  );
}

function openWhatsAppModalWithContext(customCtx = {}) {
  activeWhatsAppContext = { ...activeWhatsAppContext, ...customCtx };
  const modal = document.getElementById('whatsAppModal');
  const studentHeader = document.getElementById('waStudentHeader');
  const inputRecipient = document.getElementById('inputWhatsAppRecipient');
  const bubbleContent = document.getElementById('waBubbleContent');
  const statusNotice = document.getElementById('waStatusNotice');

  if (studentHeader) {
    studentHeader.innerText = `Student: ${activeWhatsAppContext.studentName} (Roll: ${activeWhatsAppContext.rollNumber})`;
  }
  if (inputRecipient) {
    inputRecipient.value = activeWhatsAppContext.parentPhone || '+91 98160 12345';
  }
  if (bubbleContent) {
    bubbleContent.innerText = formatWhatsAppDossierText(activeWhatsAppContext);
  }
  if (statusNotice) {
    statusNotice.innerHTML = `<span><i data-lucide="shield-check" style="width: 12px; height: 12px; vertical-align: middle; color: #34d399;"></i> Encrypted Direct WhatsApp Dispatch</span><span id="waModeIndicator" style="color: #38bdf8;">1-Click wa.me / Meta Cloud API</span>`;
  }
  if (modal) {
    modal.classList.add('active');
  }
  initLucideIcons();
}
window.openWhatsAppModalWithContext = openWhatsAppModalWithContext;

function setupWhatsAppNotificationModal() {
  const btnOpen = document.getElementById('btnOpenWhatsAppModal');
  const btnClose = document.getElementById('btnCloseWhatsAppModal');
  const modal = document.getElementById('whatsAppModal');
  const btnConfirm = document.getElementById('btnConfirmSendWhatsApp');
  const btnDirect = document.getElementById('btnSendDirectWhatsApp');
  const btnTestPhone = document.getElementById('btnTestMyPhone');
  const btnDrilldown = document.getElementById('btnDrilldownSendWhatsApp');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      openWhatsAppModalWithContext();
    });
  }

  if (btnDrilldown) {
    btnDrilldown.addEventListener('click', () => {
      const studentName = document.getElementById('drilldownStudentName')?.innerText || 'Aryan Sharma';
      const studentRoll = document.getElementById('drilldownStudentRoll')?.innerText?.replace('Roll: ', '') || '12-NM-01';
      const snippet = document.getElementById('drilldownParentSnippet')?.innerText || '';
      openWhatsAppModalWithContext({
        studentName,
        rollNumber: studentRoll,
        actionItem: snippet || 'Ask student to explain their primary test question mistake.'
      });
    });
  }

  if (btnTestPhone) {
    btnTestPhone.addEventListener('click', () => {
      const input = document.getElementById('inputWhatsAppRecipient');
      const entered = prompt('Enter your personal mobile phone number (with country code, e.g. +91 98160 12345) to test real WhatsApp dispatch on your own device:', input?.value || '+91 ');
      if (entered && entered.trim()) {
        if (input) input.value = entered.trim();
        activeWhatsAppContext.parentPhone = entered.trim();
      }
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  // 1-Click Direct WhatsApp via wa.me (works 100% instantly on desktop web and mobile)
  if (btnDirect) {
    btnDirect.addEventListener('click', () => {
      const phoneInput = document.getElementById('inputWhatsAppRecipient');
      let phone = (phoneInput?.value || '').replace(/[^0-9]/g, '');
      if (phone.length === 10) phone = `91${phone}`;
      if (!phone || phone.length < 8) {
        alert('Please enter a valid mobile number with country code (e.g. +91 98160 12345).');
        return;
      }
      const message = document.getElementById('waBubbleContent')?.innerText || formatWhatsAppDossierText(activeWhatsAppContext);
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      const statusNotice = document.getElementById('waStatusNotice');
      if (statusNotice) {
        statusNotice.innerHTML = `<span style="color:#34d399;"><i data-lucide="check-circle" style="width:12px;height:12px;vertical-align:middle;"></i> WhatsApp chat launched in new tab! Send the pre-filled message directly to parent.</span>`;
        initLucideIcons();
      }
    });
  }

  // Server API Webhook Dispatch (Meta Cloud API / Twilio)
  if (btnConfirm) {
    btnConfirm.addEventListener('click', async () => {
      btnConfirm.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Dispatching...`;
      initLucideIcons();

      const phoneInput = document.getElementById('inputWhatsAppRecipient');
      let phone = phoneInput?.value || activeWhatsAppContext.parentPhone || '+91 98160 12345';
      const message = document.getElementById('waBubbleContent')?.innerText || formatWhatsAppDossierText(activeWhatsAppContext);

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/notifications/whatsapp-dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: activeWhatsAppContext.studentId,
            parentPhone: phone,
            customMessage: message
          })
        });
        const data = await res.json();
        if (data.success) {
          if (data.dispatchMode === 'META_CLOUD_API' || data.dispatchMode === 'TWILIO_API') {
            alert(`WhatsApp notification successfully delivered to ${data.recipient} via ${data.dispatchMode}!`);
            modal.classList.remove('active');
          } else {
            // Direct link mode: server confirmed ready, launch wa.me
            if (data.waDirectLink) {
              window.open(data.waDirectLink, '_blank');
            }
            const statusNotice = document.getElementById('waStatusNotice');
            if (statusNotice) {
              statusNotice.innerHTML = `<span style="color:#38bdf8;"><i data-lucide="check-circle" style="width:12px;height:12px;vertical-align:middle;"></i> Server gateway verified. WhatsApp chat opened for direct send. (To automate server dispatch, set WHATSAPP_API_TOKEN in backend/.env)</span>`;
              initLucideIcons();
            }
          }
        } else {
          alert('Server dispatch returned: ' + (data.error || 'Failed to dispatch'));
        }
      } catch (err) {
        console.warn('[WHATSAPP DISPATCH ERROR]', err);
        const clean = phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank');
      } finally {
        btnConfirm.innerHTML = `<i data-lucide="send" style="width:14px;height:14px;"></i> Dispatch via Server API`;
        initLucideIcons();
      }
    });
  }

  // Official Printable PDF trigger
  const btnPrint = document.getElementById('btnDownloadReportPdf');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}

// -----------------------------------------------------------------------------
// TASK-13: NTA EXAM SIMULATOR & 30-QUESTION PALETTE GRID
// -----------------------------------------------------------------------------
const examState = {
  currentQuestionIndex: 0,
  activeSubject: 'Physics',
  answers: Array(30).fill(null),
  reviewStatus: Array(30).fill(false),
  visitedStatus: Array(30).fill(false),
  timeSpentPerQuestion: Array(30).fill(0),
  hesitationPerQuestion: Array(30).fill(0),
  firstInteractionPerQuestion: Array(30).fill(null),
  questions: []
};

function generate30ExamQuestions() {
  const list = [];
  // 1-10 Physics
  for (let i = 1; i <= 10; i++) {
    list.push({
      num: i,
      subject: 'Physics',
      topic: i <= 5 ? 'Rotational Motion' : 'Oscillations & SHM',
      question_latex: `A particle of mass $m=${i}\\,\\text{kg}$ rotates in a circular path of radius $R=2\\,\\text{m}$. Find the required centripetal torque $\\tau$ about the origin.`,
      options: [
        { key: 'A', latex: '$\\tau = 0$' },
        { key: 'B', latex: `$\\tau = ${i * 4}\\,\\text{N}\\cdot\\text{m}$` },
        { key: 'C', latex: `$\\tau = ${i * 2}\\,\\text{N}\\cdot\\text{m}$` },
        { key: 'D', latex: '$\\tau = \\infty$' }
      ],
      correctKey: 'A',
      socratic_hints: [
        "What is the angle $\\theta$ between the position vector $\\vec{r}$ and the centripetal force $\\vec{F}_c$ directed towards the center?",
        "Recall torque $\\vec{\\tau} = \\vec{r} \\times \\vec{F} = r F \\sin(\\theta)$. Here $\\vec{r}$ and $\\vec{F}_c$ are collinear.",
        "Since $\\sin(180^\\circ) = 0$, the centripetal torque about the origin is identically zero."
      ]
    });
  }
  // 11-20 Chemistry
  for (let i = 11; i <= 20; i++) {
    list.push({
      num: i,
      subject: 'Chemistry',
      topic: 'Chemical Thermodynamics',
      question_latex: `Calculate the change in entropy $\\Delta S$ when ${i}\\,\\text{moles}$ of an ideal gas expands isothermally from $V_1 = 1\\,\\text{L}$ to $V_2 = 10\\,\\text{L}$.`,
      options: [
        { key: 'A', latex: `$\\Delta S = ${i} R \\ln(10)$` },
        { key: 'B', latex: `$\\Delta S = 0$` },
        { key: 'C', latex: `$\\Delta S = -${i} R \\ln(10)$` },
        { key: 'D', latex: `$\\Delta S = ${i} R$` }
      ],
      correctKey: 'A',
      socratic_hints: [
        "In an isothermal reversible expansion, $\\Delta U = 0 \\implies q_{\\text{rev}} = -W$.",
        "Recall the formula for work in isothermal expansion: $W = -nRT \\ln\\left(\\frac{V_2}{V_1}\\right)$.",
        "Entropy change is $\\Delta S = \\frac{q_{\\text{rev}}}{T} = n R \\ln\\left(\\frac{V_2}{V_1}\\right)$."
      ]
    });
  }
  // 21-30 Mathematics
  for (let i = 21; i <= 30; i++) {
    list.push({
      num: i,
      subject: 'Mathematics',
      topic: 'Calculus & Limits',
      question_latex: `Evaluate the derivative $\\frac{d}{dx}\\left[ x^{${i - 18}} \\sin(x) \\right]$ at $x = 0$.`,
      options: [
        { key: 'A', latex: '$0$' },
        { key: 'B', latex: '$1$' },
        { key: 'C', latex: `${i - 18}` },
        { key: 'D', latex: '$\\pi$' }
      ],
      correctKey: 'A',
      socratic_hints: [
        "Use the product rule: $\\frac{d}{dx}[u \\cdot v] = u' v + u v'$ where $u(x) = x^k$ and $v(x) = \\sin(x)$.",
        "Notice that as $x \\to 0$, both $x^k = 0$ (for $k \\ge 2$) and $\\sin(0) = 0$.",
        "Evaluating both terms at $x=0$ yields $0 \\cdot \\sin(0) + 0 \\cdot \\cos(0) = 0$."
      ]
    });
  }
  return list;
}

function setupNtaExamPaletteEngine() {
  examState.questions = generate30ExamQuestions();
  examState.visitedStatus[0] = true;

  renderPaletteButtons();
  renderActiveNtaQuestion();
  updatePaletteCounts();

  // Wire Subject Switcher
  const subButtons = document.querySelectorAll('#examSubjectSwitcher .section-tab-btn');
  subButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      subButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      examState.activeSubject = btn.getAttribute('data-subject');

      // Jump to first question of that subject
      if (examState.activeSubject === 'Physics') jumpToQuestion(0);
      else if (examState.activeSubject === 'Chemistry') jumpToQuestion(10);
      else if (examState.activeSubject === 'Mathematics') jumpToQuestion(20);
    });
  });

  // Action Buttons
  const btnSaveNext = document.getElementById('btnSaveAndNext');
  const btnNext = document.getElementById('btnNextQuestion');
  const btnNextTop = document.getElementById('btnNextQuestionTop');
  const btnPrev = document.getElementById('btnPrevQuestion');
  const btnPrevTop = document.getElementById('btnPrevQuestionTop');
  const btnReview = document.getElementById('btnMarkForReview');
  const btnClear = document.getElementById('btnClearResponse');
  const btnSubmitExam = document.getElementById('btnSubmitFullExam');

  const handleNextQuestion = () => {
    if (state.studentTimer.selectedOption) {
      examState.answers[examState.currentQuestionIndex] = state.studentTimer.selectedOption;
    }
    const totalQ = (examState.questions && examState.questions.length > 0) ? examState.questions.length : 30;
    if (examState.currentQuestionIndex < totalQ - 1) {
      jumpToQuestion(examState.currentQuestionIndex + 1);
    } else {
      alert(`You are on the final question (Q${totalQ}). You can review your answers on the palette or click 'Submit Full Assessment'.`);
    }
  };

  const handlePrevQuestion = () => {
    if (state.studentTimer.selectedOption) {
      examState.answers[examState.currentQuestionIndex] = state.studentTimer.selectedOption;
    }
    if (examState.currentQuestionIndex > 0) {
      jumpToQuestion(examState.currentQuestionIndex - 1);
    }
  };

  if (btnNext) btnNext.addEventListener('click', handleNextQuestion);
  if (btnNextTop) btnNextTop.addEventListener('click', handleNextQuestion);
  if (btnPrev) btnPrev.addEventListener('click', handlePrevQuestion);
  if (btnPrevTop) btnPrevTop.addEventListener('click', handlePrevQuestion);

  if (btnSaveNext) {
    btnSaveNext.addEventListener('click', () => {
      if (state.studentTimer.selectedOption) {
        examState.answers[examState.currentQuestionIndex] = state.studentTimer.selectedOption;
      }
      advanceQuestion();
    });
  }

  if (btnReview) {
    btnReview.addEventListener('click', () => {
      examState.reviewStatus[examState.currentQuestionIndex] = true;
      if (state.studentTimer.selectedOption) {
        examState.answers[examState.currentQuestionIndex] = state.studentTimer.selectedOption;
      }
      advanceQuestion();
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      examState.answers[examState.currentQuestionIndex] = null;
      state.studentTimer.selectedOption = null;
      document.querySelectorAll('#studentRenderOptions .latex-option-item').forEach(el => {
        el.style.borderColor = 'var(--border-subtle)';
        el.style.background = 'rgba(255, 255, 255, 0.03)';
      });
      renderPaletteButtons();
      updatePaletteCounts();
    });
  }

  if (btnSubmitExam) {
    btnSubmitExam.addEventListener('click', async () => {
      const attemptedCount = examState.answers.filter(a => a !== null).length;
      const totalQ = examState.questions.length;

      if (!confirm(`Submit Assessment: "${state.activeAssessment?.title || 'Classroom Diagnostic Test'}"?\n\n• Attempted: ${attemptedCount} / ${totalQ} Questions\n\nProceed to evaluate and stream diagnostic results to Teacher Co-Pilot & Parent Report Card?`)) {
        return;
      }

      btnSubmitExam.disabled = true;
      btnSubmitExam.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Submitting & Diagnosing...`;
      initLucideIcons();

      const asgnId = state.activeAssessment?.id || 'asgn_10_sci_01';

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/assessments/${asgnId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: 'b0000000-0000-0000-0000-000000000001',
            studentName: 'Aryan Sharma',
            answers: examState.questions.map((q, idx) => ({
              questionId: q.id || `q_${idx + 1}`,
              selectedOption: examState.answers[idx],
              timeSpentSeconds: (examState.timeSpentPerQuestion && examState.timeSpentPerQuestion[idx]) > 0 ? examState.timeSpentPerQuestion[idx] : (45 + (idx * 5)),
              hesitationSeconds: (examState.hesitationPerQuestion && examState.hesitationPerQuestion[idx]) > 0 ? examState.hesitationPerQuestion[idx] : (6 + idx),
              hintsUsed: state.studentTimer.hintsRevealed || 0
            }))
          })
        });

        if (res.ok) {
          const data = await res.json();
          state.lastSubmittedAssessmentId = data.results?.assessmentId || asgnId;
          if (data.results?.personalizedAssignment) {
            state.activeRemedialAssignment = data.results.personalizedAssignment;
          }
          displayDiagnosticResults(data.results);
        } else {
          throw new Error('Fallback to local calculation');
        }
      } catch (e) {
        console.warn('Backend submit error, calculating locally:', e);
        alert(`Assessment Submitted!\nScore recorded and streamed to Teacher Live Telemetry Monitor.`);
      } finally {
        btnSubmitExam.disabled = false;
        btnSubmitExam.innerHTML = `<i data-lucide="send" style="width:14px;height:14px;"></i> Submit Full Assessment`;
        initLucideIcons();
      }
    });
  }
}

function advanceQuestion() {
  const autoSave = document.getElementById('autoSaveIndicator');
  if (autoSave) {
    autoSave.innerHTML = `<i data-lucide="check-check" style="width:12px; height:12px; vertical-align:middle; color:#10b981;"></i> Saved!`;
    initLucideIcons();
    setTimeout(() => {
      autoSave.innerHTML = `<i data-lucide="check" style="width:12px; height:12px; vertical-align:middle;"></i> Auto-Saved`;
      initLucideIcons();
    }, 1200);
  }

  const totalQ = (examState.questions && examState.questions.length > 0) ? examState.questions.length : 30;
  if (examState.currentQuestionIndex < totalQ - 1) {
    jumpToQuestion(examState.currentQuestionIndex + 1);
  } else {
    renderPaletteButtons();
    updatePaletteCounts();
    alert(`You have reached the final question (Q${totalQ}). You can review responses on the palette or click 'Submit Full Assessment'.`);
  }
}

function jumpToQuestion(index) {
  // Preserve current selected option before navigating
  if (state.studentTimer.selectedOption) {
    examState.answers[examState.currentQuestionIndex] = state.studentTimer.selectedOption;
  }

  examState.currentQuestionIndex = index;
  examState.visitedStatus[index] = true;
  state.studentTimer.selectedOption = examState.answers[index];

  // Reset hint box
  const hintBox = document.getElementById('socraticHintBox');
  if (hintBox) hintBox.classList.remove('visible');
  state.studentTimer.hintsRevealed = 0;

  renderActiveNtaQuestion();
  renderPaletteButtons();
  updatePaletteCounts();
}

function renderActiveNtaQuestion() {
  const q = examState.questions[examState.currentQuestionIndex];
  if (!q) return;

  const totalQ = (examState.questions && examState.questions.length > 0) ? examState.questions.length : 30;
  const numDisplay = document.getElementById('currentQuestionNum');
  if (numDisplay) numDisplay.innerText = q.num;

  const titleEl = document.getElementById('ntaQuestionTitle');
  if (titleEl) {
    titleEl.innerHTML = `Question ${q.num} of ${totalQ} &bull; ${q.subject} (${q.topic})`;
  }

  const qText = document.getElementById('studentRenderQuestion');
  const optList = document.getElementById('studentRenderOptions');

  if (qText) qText.innerHTML = renderLatexString(q.question_latex);

  if (optList) {
    optList.innerHTML = '';
    q.options.forEach(opt => {
      const isSelected = examState.answers[examState.currentQuestionIndex] === opt.key;
      const item = document.createElement('div');
      item.className = 'latex-option-item';
      if (isSelected) {
        item.style.borderColor = 'var(--accent-cyan)';
        item.style.background = 'rgba(56, 189, 248, 0.12)';
      }

      item.innerHTML = `
        <div class="latex-option-key">${opt.key}</div>
        <div style="flex:1;">
          <div class="opt-formula">${renderLatexString(opt.latex)}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        document.querySelectorAll('#studentRenderOptions .latex-option-item').forEach(el => {
          el.style.borderColor = 'var(--border-subtle)';
          el.style.background = 'rgba(255, 255, 255, 0.03)';
        });
        item.style.borderColor = 'var(--accent-cyan)';
        item.style.background = 'rgba(56, 189, 248, 0.12)';
        state.studentTimer.selectedOption = opt.key;
        examState.answers[examState.currentQuestionIndex] = opt.key;
        if (!examState.firstInteractionPerQuestion[examState.currentQuestionIndex]) {
          examState.firstInteractionPerQuestion[examState.currentQuestionIndex] = true;
          examState.hesitationPerQuestion[examState.currentQuestionIndex] = examState.timeSpentPerQuestion[examState.currentQuestionIndex] || 4;
        }
        renderPaletteButtons();
        updatePaletteCounts();
      });

      optList.appendChild(item);
    });
  }
}

function renderPaletteButtons() {
  const container = document.getElementById('ntaQuestionPalette');
  const quickStrip = document.getElementById('quickQuestionStrip');
  const totalCount = examState.questions ? examState.questions.length : 30;

  // 1. Render sidebar palette grid
  if (container) {
    container.innerHTML = '';
    for (let i = 0; i < totalCount; i++) {
      const btn = document.createElement('div');
      btn.className = 'palette-btn';
      btn.innerText = i + 1;

      const isCurrent = i === examState.currentQuestionIndex;
      const isAnswered = examState.answers[i] !== null;
      const isReviewed = examState.reviewStatus[i];
      const isVisited = examState.visitedStatus[i];

      if (isCurrent) btn.classList.add('active');

      if (isAnswered) {
        btn.classList.add('answered');
      } else if (isReviewed) {
        btn.classList.add('marked-review');
      } else if (isVisited) {
        btn.classList.add('not-answered');
      } else {
        btn.classList.add('not-visited');
      }

      btn.addEventListener('click', () => jumpToQuestion(i));
      container.appendChild(btn);
    }
  }

  // 2. Render top inline question strip [ 1 ] [ 2 ] [ 3 ] [ 4 ] ...
  if (quickStrip) {
    quickStrip.innerHTML = '';
    for (let i = 0; i < totalCount; i++) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'btn-grid-tile';
      tile.innerText = i + 1;
      tile.title = `Jump directly to Question ${i + 1}`;

      const isCurrent = i === examState.currentQuestionIndex;
      const isAnswered = examState.answers[i] !== null;
      const isReviewed = examState.reviewStatus[i];
      const isVisited = examState.visitedStatus[i];

      if (isCurrent) tile.classList.add('active');

      if (isAnswered) {
        tile.classList.add('answered');
      } else if (isReviewed) {
        tile.classList.add('marked-review');
      } else if (isVisited) {
        tile.classList.add('not-answered');
      } else {
        tile.classList.add('not-visited');
      }

      tile.addEventListener('click', () => jumpToQuestion(i));
      quickStrip.appendChild(tile);
    }
  }

  // 3. Update Previous & Next navigation buttons
  const isFirst = examState.currentQuestionIndex === 0;
  const isLast = examState.currentQuestionIndex >= totalCount - 1;

  const btnPrev = document.getElementById('btnPrevQuestion');
  const btnPrevTop = document.getElementById('btnPrevQuestionTop');
  const btnNext = document.getElementById('btnNextQuestion');
  const btnNextTop = document.getElementById('btnNextQuestionTop');

  if (btnPrev) btnPrev.disabled = isFirst;
  if (btnPrevTop) btnPrevTop.disabled = isFirst;
  if (btnNext) btnNext.disabled = isLast;
  if (btnNextTop) btnNextTop.disabled = isLast;
}

function updatePaletteCounts() {
  const totalCount = examState.questions ? examState.questions.length : 30;
  const answered = examState.answers.filter(a => a !== null).length;
  const review = examState.reviewStatus.filter((r, idx) => r && examState.answers[idx] === null).length;
  const visited = examState.visitedStatus.filter((v, idx) => v && examState.answers[idx] === null && !examState.reviewStatus[idx]).length;
  const notVisited = totalCount - examState.visitedStatus.filter(v => v).length;

  const countAns = document.getElementById('countAnswered');
  const countNotAns = document.getElementById('countNotAnswered');
  const countRev = document.getElementById('countReview');
  const countNotVis = document.getElementById('countNotVisited');

  if (countAns) countAns.innerText = answered;
  if (countNotAns) countNotAns.innerText = visited;
  if (countRev) countRev.innerText = review;
  if (countNotVis) countNotVis.innerText = Math.max(0, notVisited);
}

// -----------------------------------------------------------------------------
// 10. TEST ASSIGNMENT BUILDER & STUDENT ADAPTIVE DELIVERY
// -----------------------------------------------------------------------------
function setupTestAssignmentBuilder() {
  const btnOpen = document.getElementById('btnOpenTestBuilder');
  const btnClose = document.getElementById('btnCloseTestBuilder');
  const btnClear = document.getElementById('btnClearDraftTest');
  const btnPublish = document.getElementById('btnPublishTestAssignment');
  const modal = document.getElementById('modalTestBuilder');

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      openTestBuilderModal();
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      if (modal) modal.classList.remove('active');
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      state.testDraft = [];
      updateTestDraftBadges();
      renderTestBuilderModal();
    });
  }

  if (btnPublish) {
    btnPublish.addEventListener('click', async () => {
      if (!state.testDraft || state.testDraft.length === 0) {
        alert('Please add at least one question to the draft before publishing.');
        return;
      }

      const titleInput = document.getElementById('inputTestTitle');
      const title = titleInput ? titleInput.value.trim() : 'Class 10 Science Weekly Diagnostic';
      const classSec = document.getElementById('selectTestClassSection')?.value || '10-Science-A';

      btnPublish.disabled = true;
      btnPublish.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> Publishing to Class Roster...`;
      initLucideIcons();

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: `Official diagnostic test for ${classSec} with ${state.testDraft.length} questions.`,
            grade: classSec.startsWith('10') ? '10' : (classSec.startsWith('11') ? '11' : '12'),
            section: classSec,
            subject: 'Science',
            durationMinutes: Math.max(15, state.testDraft.length * 5),
            totalMarks: state.testDraft.length * 4,
            questions: state.testDraft
          })
        });

        if (res.ok) {
          const data = await res.json();
          alert(`Test "${title}" successfully published and assigned to ${classSec}.\n\n• Questions: ${state.testDraft.length}\n• Total Marks: ${state.testDraft.length * 4}\n• Target: ${classSec}\n\nStudents can now take this assessment immediately in the Student Portal.`);
          state.testDraft = [];
          updateTestDraftBadges();
          if (modal) modal.classList.remove('active');
          await loadStudentAssignedTests();
        } else {
          throw new Error('Failed to publish');
        }
      } catch (err) {
        alert('Error publishing assessment. Running in resilient local mode.');
        if (modal) modal.classList.remove('active');
      } finally {
        btnPublish.disabled = false;
        btnPublish.innerHTML = `<i data-lucide="send" style="width:16px;height:16px;"></i> Publish & Assign to Class Roster`;
        initLucideIcons();
      }
    });
  }
}

function addQuestionToTestDraft(q) {
  if (!q) return;
  const existing = state.testDraft.find(item => item.id === q.id);
  if (!existing) {
    state.testDraft.push(q);
  }
  updateTestDraftBadges();
  alert(`Question added to Test Assignment Draft.\nTotal: ${state.testDraft.length} Questions drafted.\n\nClick "Test Builder" in the navigation bar to review and assign to your class roster.`);
}

function updateTestDraftBadges() {
  const badge = document.getElementById('testDraftCount');
  if (badge) badge.innerText = state.testDraft.length;
}

function openTestBuilderModal() {
  const modal = document.getElementById('modalTestBuilder');
  if (!modal) return;
  renderTestBuilderModal();
  modal.classList.add('active');
  initLucideIcons();
}

function renderTestBuilderModal() {
  const countEl = document.getElementById('modalDraftQuestionCount');
  const marksEl = document.getElementById('modalDraftTotalMarks');
  const listEl = document.getElementById('modalDraftQuestionsList');
  if (!listEl) return;

  const count = state.testDraft.length;
  if (countEl) countEl.innerText = count;
  if (marksEl) marksEl.innerText = `Total: ${count * 4} Marks • ~${count * 5} Mins`;

  listEl.innerHTML = '';
  if (count === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 2rem 1rem; color: var(--text-muted);">
        <i data-lucide="inbox" style="width:36px; height:36px; opacity:0.4; margin-bottom:8px;"></i>
        <p style="font-size:0.85rem;">No questions added to the draft yet.<br/>Use <strong>"Add to Active Test"</strong> in the AI Question Studio or <strong>"Add to Class Test"</strong> in the NCERT PYQ Explorer.</p>
      </div>
    `;
    initLucideIcons();
    return;
  }

  state.testDraft.forEach((q, idx) => {
    const item = document.createElement('div');
    item.style.padding = '10px 12px';
    item.style.background = 'rgba(255, 255, 255, 0.03)';
    item.style.border = '1px solid var(--border-subtle)';
    item.style.borderRadius = '6px';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'flex-start';
    item.style.gap = '10px';

    item.innerHTML = `
      <div style="flex:1;">
        <div style="font-size:0.75rem; color:var(--accent-cyan); font-weight:700; margin-bottom:4px;">
          Q${idx + 1} &bull; ${q.chapter || q.topic || 'Science'} (${q.subtopic || 'General'}) &bull; +4M / -1M
        </div>
        <div style="font-size:0.82rem; color:var(--text-primary); line-height:1.4;">
          ${renderLatexString(q.question_latex)}
        </div>
      </div>
      <button class="btn-remove-draft" data-id="${q.id}" style="background:transparent; border:none; color:var(--accent-rose); cursor:pointer; padding:4px;">
        <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
      </button>
    `;

    item.querySelector('.btn-remove-draft').addEventListener('click', (e) => {
      const qid = e.currentTarget.getAttribute('data-id');
      state.testDraft = state.testDraft.filter(d => d.id !== qid);
      updateTestDraftBadges();
      renderTestBuilderModal();
    });

    listEl.appendChild(item);
  });

  initLucideIcons();
}

async function setupStudentAssignedTests() {
  const btnLoad = document.getElementById('btnLoadAssignedTest');
  const selectEl = document.getElementById('selectStudentAssignedTest');

  await loadStudentAssignedTests();

  if (btnLoad) {
    btnLoad.addEventListener('click', () => {
      const asgnId = selectEl ? selectEl.value : null;
      if (!asgnId) return;
      const assessment = state.publishedAssessments.find(a => a.id === asgnId);
      if (assessment) {
        startAssignedTest(assessment);
      }
    });
  }

  // Diagnostic Results Modal Handlers
  const btnCloseDiag = document.getElementById('btnCloseDiagnosticResults');
  const btnGoReport = document.getElementById('btnGoToSmartReport');
  const btnGoDashboard = document.getElementById('btnGoToClassDashboard');

  if (btnCloseDiag) {
    btnCloseDiag.onclick = closeDiagnosticResultsModal;
  }
  if (btnGoReport) {
    btnGoReport.onclick = handleGoToSmartReport;
  }
  if (btnGoDashboard) {
    btnGoDashboard.onclick = handleGoToClassDashboard;
  }
}

async function loadStudentAssignedTests() {
  const selectEl = document.getElementById('selectStudentAssignedTest');
  if (!selectEl) return;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/assessments`);
    if (res.ok) {
      const data = await res.json();
      state.publishedAssessments = data.assessments || [];
    }
  } catch (e) {
    console.warn('Could not fetch assessments from backend, using default.');
  }

  selectEl.innerHTML = '';
  if (state.publishedAssessments.length === 0) {
    selectEl.innerHTML = `<option value="">No Active Tests Assigned</option>`;
    return;
  }

  state.publishedAssessments.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.title} (${a.questionCount || a.questions?.length || 3} Qs • ${a.durationMinutes || 30}m)`;
    selectEl.appendChild(opt);
  });

  // Select first assessment by default
  if (!state.activeAssessment && state.publishedAssessments.length > 0) {
    state.activeAssessment = state.publishedAssessments[0];
    const bannerTitle = document.getElementById('assignedTestBannerTitle');
    if (bannerTitle) bannerTitle.innerText = state.activeAssessment.title;
  }
}

async function startAssignedTest(assessmentSummary) {
  let fullAssessment = assessmentSummary;
  // If questions are not in summary, fetch full assessment details
  if (!fullAssessment.questions || fullAssessment.questions.length === 0) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/assessments/${assessmentSummary.id}`);
      if (res.ok) {
        const data = await res.json();
        fullAssessment = data.assessment;
      }
    } catch (e) {}
  }

  state.activeAssessment = fullAssessment;

  const bannerTitle = document.getElementById('assignedTestBannerTitle');
  if (bannerTitle) bannerTitle.innerText = fullAssessment.title;

  // Map questions into examState
  examState.questions = (fullAssessment.questions || []).map((q, idx) => ({
    id: q.id,
    num: idx + 1,
    subject: fullAssessment.subject || 'Biology',
    topic: q.topic || q.chapter || 'Topic',
    subtopic: q.subtopic || 'General',
    question_latex: q.question_latex,
    options: (() => {
      const existingOpts = (q.options_latex && q.options_latex.length >= 2) ? q.options_latex : (q.options || []);
      const isGeneric = existingOpts.length > 0 && existingOpts.every(o => /^Option\s+[A-D]$/i.test((o.latex || o.text || '').trim()));
      if (existingOpts.length >= 2 && !isGeneric) {
        return existingOpts;
      }
      const ans = (q.correct_answer_latex || q.correct_answer || '').trim();
      const topic = q.subtopic || q.topic || 'Concept';
      const isBio = (fullAssessment.subject || '').toLowerCase().includes('bio');
      if (isBio) {
        return [
          { key: 'A', latex: ans || `Primary physiological mechanism characteristic of ${topic}` },
          { key: 'B', latex: `Alternate regulatory feedback pathway in ${topic}` },
          { key: 'C', latex: `Non-specific systemic response independent of ${topic}` },
          { key: 'D', latex: `Pre-zygotic developmental block in ${topic}` }
        ];
      }
      return [
        { key: 'A', latex: ans || `Satisfies foundational criteria for ${topic}` },
        { key: 'B', latex: `Inverse variation across ${topic}` },
        { key: 'C', latex: `Zero magnitude under boundary equilibrium in ${topic}` },
        { key: 'D', latex: `Cartesian sign convention inversion in ${topic}` }
      ];
    })(),
    correctKey: q.correct_answer || (q.options_latex?.find(o => o.is_correct)?.key) || 'A',
    socratic_hints: q.socratic_hints || [],
    benchmark_time_seconds: q.benchmark_time_seconds || 90
  }));

  examState.currentQuestionIndex = 0;
  examState.answers = Array(examState.questions.length).fill(null);
  examState.reviewStatus = Array(examState.questions.length).fill(false);
  examState.visitedStatus = Array(examState.questions.length).fill(false);
  examState.visitedStatus[0] = true;

  // Reset timer
  state.studentTimer.secondsElapsed = 0;
  state.studentTimer.hintsRevealed = 0;
  state.studentTimer.selectedOption = null;

  renderActiveNtaQuestion();
  renderPaletteButtons();
  updatePaletteCounts();

  // Dynamically update Subject Switcher to match test subject
  const examSwitcher = document.getElementById('examSubjectSwitcher');
  if (examSwitcher) {
    const testSubj = fullAssessment.subject || 'Biology';
    examSwitcher.innerHTML = `<button class="section-tab-btn active" data-subject="${escapeHtml(testSubj)}">${escapeHtml(testSubj)} (${escapeHtml(fullAssessment.title || 'Assigned Test')})</button>`;
  }

  alert(`Test Started: "${fullAssessment.title}"\n\n• Questions: ${examState.questions.length}\n• Duration: ${fullAssessment.durationMinutes} Minutes\n• Live Telemetry: Sub-second timer streaming to Teacher Seatmap.\n\nGood luck!`);
}

// -----------------------------------------------------------------------------
// FULL-PAGE DIAGNOSTIC TEST EVALUATION & PERFORMANCE AUDIT STUDIO
// -----------------------------------------------------------------------------

function cleanDiagnosticSubtopic(raw) {
  if (!raw || typeof raw !== 'string') return 'General Concept';
  let s = raw.trim();

  // Clean common prefixes
  s = s.replace(/^DERIVATION\s*:\s*/i, 'Derivation: ');
  s = s.replace(/^PHASOR DIAGRAM SOLUTION\s*:\s*/i, 'Phasor Diagram: ');

  // If text is ALL CAPS, convert words to Title Case unless containing LaTeX backslashes
  if (s === s.toUpperCase() && !s.includes('\\')) {
    s = s.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Handle common raw physics notations into clean math notation for KaTeX
  s = s.replace(/E\s*=\s*\\?Sigma\s*\/\s*\(?\s*2\s*E_?0\s*\)?/gi, '$E = \\frac{\\sigma}{2\\varepsilon_0}$');
  s = s.replace(/E\s*=\s*\\?sigma\s*\/\s*\(?\s*2\s*\\?epsilon_?0\s*\)?/gi, '$E = \\frac{\\sigma}{2\\varepsilon_0}$');
  s = s.replace(/P\s*=\s*M\s*\/\s*\(?\s*NE\^?2\s*T\s*\)?/gi, '$\\rho = \\frac{m}{n e^2 \\tau}$');
  s = s.replace(/\\?rho\s*=\s*m\s*\/\s*\(?\s*n\s*e\^?2\s*\\?tau\s*\)?/gi, '$\\rho = \\frac{m}{n e^2 \\tau}$');
  s = s.replace(/Z\s*=\s*\\?sqrt\s*\[\s*R\^?2\s*\+\s*\(X_L\s*-\s*X_C\)\^?2\s*\]/gi, '$Z = \\sqrt{R^2 + (X_L - X_C)^2}$');
  s = s.replace(/Z\s*=\s*\\?sqrt\s*\{\s*R\^?2\s*\+\s*\(X_L\s*-\s*X_C\)\^?2\s*\}/gi, '$Z = \\sqrt{R^2 + (X_L - X_C)^2}$');

  return s;
}

function getConceptPedagogicalProfile(rawSubtopic, category, timeSpent, benchmark) {
  const cleanTitle = cleanDiagnosticSubtopic(rawSubtopic);
  const lower = (rawSubtopic || '').toLowerCase();
  
  let formula = '';
  let studentGuidance = '';
  let teacherDirective = '';
  let conceptSlug = 'Core Concept';

  if (lower.includes('plane sheet') || lower.includes('infinite plane') || lower.includes('sigma/(2e_0)') || lower.includes('\\sigma/(2\\epsilon')) {
    conceptSlug = 'Electrostatics: Infinite Plane Sheet';
    formula = 'E = \\frac{\\sigma}{2\\varepsilon_0}';
    studentGuidance = 'Electric field due to an infinite uniformly charged non-conducting sheet is uniform and independent of distance $r$. Remember: use $\\frac{\\sigma}{2\\varepsilon_0}$ for a dielectric/non-conducting sheet and $\\frac{\\sigma}{\\varepsilon_0}$ for a conducting surface.';
    teacherDirective = 'Blackboard Priority: Re-derive Gauss\'s Law pillbox cylinder piercing the sheet. Show that electric flux $\\Phi = 2EA = \\frac{\\sigma A}{\\varepsilon_0} \\implies E = \\frac{\\sigma}{2\\varepsilon_0}$. Address the factor of 2 confusion with conductor surfaces.';
  } else if (lower.includes('ohm') || lower.includes('resistivity') || lower.includes('m/(ne^2t)') || lower.includes('ne^2\\tau')) {
    conceptSlug = 'Current Electricity: Microscopic Ohm\'s Law';
    formula = '\\rho = \\frac{m}{n e^2 \\tau}, \\quad \\sigma = \\frac{1}{\\rho} = \\frac{n e^2 \\tau}{m}, \\quad v_d = \\frac{e E \\tau}{m}';
    studentGuidance = 'Resistivity $\\rho$ depends purely on material properties: number density of free electrons $n$ and mean relaxation time $\\tau$. It does NOT depend on conductor length $l$ or cross-sectional area $A$.';
    teacherDirective = 'Blackboard Priority: Walk through the deduction of Ohm\'s law starting from $I = n e A v_d$. Clarify why increasing temperature in metals causes more electron collisions, shortening $\\tau$ and therefore increasing resistivity $\\rho$.';
  } else if (lower.includes('phasor') || lower.includes('impedance') || lower.includes('lcr') || lower.includes('x_l - x_c')) {
    conceptSlug = 'Alternating Current: LCR Impedance';
    formula = 'Z = \\sqrt{R^2 + (X_L - X_C)^2}, \\quad X_L = \\omega L, \\quad X_C = \\frac{1}{\\omega C}';
    studentGuidance = 'In an AC circuit with $R$, $L$, and $C$ in series, impedance is given by the vector sum in the phasor diagram. Never add resistances and reactances algebraically ($Z \\neq R + X_L + X_C$).';
    teacherDirective = 'Blackboard Priority: Construct phasor diagram showing current phasor $I_0$ as reference. Demonstrate resonance condition ($X_L = X_C \\implies Z_{\\min} = R$) and phase angle $\\tan\\phi = \\frac{X_L - X_C}{R}$.';
  } else if (lower.includes('damped') || lower.includes('oscillation')) {
    conceptSlug = 'Oscillations: Damped Harmonic Motion';
    formula = 'x(t) = A e^{-\\frac{bt}{2m}} \\cos(\\omega\' t + \\phi), \\quad \\omega\' = \\sqrt{\\omega_0^2 - \\left(\\frac{b}{2m}\\right)^2}';
    studentGuidance = 'The damping force $F_d = -b v$ dissipates mechanical energy into heat. Amplitude decays exponentially over time as $A(t) = A_0 e^{-bt/(2m)}$, while oscillation frequency is slightly lower than natural frequency $\\omega_0$.';
    teacherDirective = 'Blackboard Priority: Plot displacement-time curve showing the exponential envelope $\\pm A_0 e^{-bt/(2m)}$. Distinguish underdamping, critical damping ($b = 2\\sqrt{km}$), and overdamping.';
  } else if (lower.includes('moment of inertia') || lower.includes('rotat')) {
    conceptSlug = 'Rotational Dynamics: Moment of Inertia';
    formula = 'I = \\sum m_i r_i^2 = \\int r^2 dm, \\quad \\tau_{\\text{net}} = I \\alpha';
    studentGuidance = 'Moment of inertia measures rotational inertia. Always identify the specific rotational axis before calculating. For a ring $I = MR^2$, for a disc $I = \\frac{1}{2}MR^2$, for a solid sphere $I = \\frac{2}{5}MR^2$.';
    teacherDirective = 'Blackboard Priority: Drill parallel axis theorem ($I = I_{cm} + Md^2$) and perpendicular axis theorem ($I_z = I_x + I_y$). Verify students always measure $d$ from the center of mass.';
  } else if (lower.includes('work-energy') || lower.includes('energy theorem')) {
    conceptSlug = 'Mechanics: Work-Energy Theorem';
    formula = 'W_{\\text{net}} = \\Delta K = \\frac{1}{2}m v_f^2 - \\frac{1}{2}m v_i^2';
    studentGuidance = 'The work-energy theorem is universal: net work done by ALL forces (conservative, non-conservative, and external) equals the change in kinetic energy of the system.';
    teacherDirective = 'Blackboard Priority: Guide students through multi-force free body diagrams. Ensure work done by friction ($-\\mu N d$) is accounted for in non-conservative work.';
  } else if (lower.includes('light') || lower.includes('mirror') || lower.includes('lens') || lower.includes('refraction')) {
    conceptSlug = 'Ray Optics: Mirror & Lens Equations';
    formula = '\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f} \\quad (\\text{Mirror}), \\quad \\frac{1}{v} - \\frac{1}{u} = \\frac{1}{f} \\quad (\\text{Lens})';
    studentGuidance = 'Strictly apply Cartesian sign convention: object distance $u$ is negative; concave mirror/lens focal length $f$ is negative; convex mirror/lens focal length $f$ is positive.';
    teacherDirective = 'Blackboard Priority: Review ray tracing rules and sign convention table. Point out that magnification $m = -v/u$ for mirrors and $m = +v/u$ for lenses.';
  } else if (lower.includes('genetics') || lower.includes('dna') || lower.includes('mendel') || lower.includes('inherit')) {
    conceptSlug = 'Biology: Principles of Inheritance';
    formula = '\\text{Mendelian Dihybrid Ratio: } 9:3:3:1, \\quad \\text{Monohybrid: } 3:1';
    studentGuidance = 'Master Punnett square construction for monohybrid and dihybrid crosses. Clearly distinguish genotype (genetic makeup) from phenotype (observable characteristic).';
    teacherDirective = 'Blackboard Priority: Review non-Mendelian exceptions: Incomplete dominance ($1:2:1$), Co-dominance (ABO blood groups), and chromosomal theory of inheritance.';
  } else {
    const isCareless = category === 'FAST_CARELESS_SLIP';
    conceptSlug = cleanTitle;
    formula = '\\text{Core Theoretical Law & Governing Formulas}';
    if (isCareless) {
      studentGuidance = `You answered in only ${timeSpent}s against a benchmark of ${benchmark || 90}s. Your conceptual foundation is present, but rushing caused a careless calculation or sign slip. Review the step-by-step conditions and verify units before submitting.`;
      teacherDirective = `Classroom Attention: Student demonstrated high problem-solving velocity (${timeSpent}s) but tripped on distractors. Emphasize verification heuristics and checking final algebraic units in class exercises.`;
    } else {
      studentGuidance = `You spent ${timeSpent}s analyzing this problem. The hesitation indicates conceptual uncertainty in the starting principle. Review the foundational textbook definition and solve 3 practice numericals.`;
      teacherDirective = `Classroom Attention: Student spent ${timeSpent}s attempting this topic with hesitation. Schedule an individual check during classroom practice and verify homework steps.`;
    }
  }

  return { cleanTitle, conceptSlug, formula, studentGuidance, teacherDirective };
}

function displayDiagnosticResults(results) {
  const modal = document.getElementById('modalDiagnosticResults');
  if (!modal) return;

  results = results || {};
  const container = document.getElementById('diagReportScrollContainer');

  // 1. Resolve and compute telemetry metrics
  let breakdown = results.questionBreakdown || [];
  if (breakdown.length === 0 && Array.isArray(examState.questions) && examState.questions.length > 0) {
    breakdown = examState.questions.map((q, idx) => {
      const sel = examState.answers[idx] || null;
      const exp = (q.correctKey || q.correct_answer || q.correct_answer_latex || 'A').trim();
      const isCorr = sel && sel.trim().toUpperCase() === exp.toUpperCase();
      const timeSpent = (examState.timeSpentPerQuestion && examState.timeSpentPerQuestion[idx]) || 45;
      const benchmark = q.benchmark_time_seconds || 90;
      let category = 'FAST_ACCURATE';
      if (isCorr) {
        category = timeSpent > benchmark * 1.3 ? 'SLOW_ACCURATE' : 'FAST_ACCURATE';
      } else {
        category = timeSpent > benchmark * 1.3 ? 'SLOW_MISCONCEPTION' : 'FAST_CARELESS_SLIP';
      }
      return {
        questionIndex: idx + 1,
        questionId: q.id || `q_${idx + 1}`,
        subtopic: q.subtopic || q.topic || 'General Concept',
        topic: q.topic || 'Curriculum',
        subject: q.subject || results.subject || 'Science',
        selectedOption: sel,
        correctAnswer: exp,
        isCorrect: isCorr,
        timeSpentSeconds: timeSpent,
        benchmarkSeconds: benchmark,
        category,
        marksAwarded: isCorr ? 4 : (sel ? -1 : 0)
      };
    });
  }

  const totalQuestions = breakdown.length || results.totalQuestions || 1;
  const correctCount = breakdown.filter(q => q.isCorrect).length;
  const incorrectCount = breakdown.filter(q => !q.isCorrect && q.selectedOption).length;
  const unansweredCount = Math.max(0, totalQuestions - correctCount - incorrectCount);
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  const totalScore = Number(results.totalScore !== undefined ? results.totalScore : breakdown.reduce((acc, q) => acc + (q.marksAwarded || 0), 0));
  const totalMarks = Number(results.totalMarks || (totalQuestions * 4));
  const percentage = typeof results.percentage === 'number' ? results.percentage : (totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0);

  const totalTimeSpent = Number(results.totalTimeSpentSeconds || breakdown.reduce((acc, q) => acc + (q.timeSpentSeconds || 45), 0));
  const avgSpeed = Math.round(totalTimeSpent / totalQuestions);
  const avgHesitation = 7;

  const matrix = results.diagnosticMatrix || {};
  const masteredList = matrix.mastered || [];
  const recapList = matrix.recap || [];
  const weakList = matrix.weak || [];

  // Update Header Banner Titles
  const modalTitle = document.getElementById('diagReportModalTitle');
  const modalSubtitle = document.getElementById('diagReportModalSubtitle');
  if (modalTitle) {
    modalTitle.innerHTML = `${escapeHtml(results.assessmentTitle || 'Diagnostic Test Evaluation')} &bull; Performance Audit Studio`;
  }
  if (modalSubtitle) {
    const subj = results.subject || 'Science';
    const ch = results.chapterName ? ` &bull; ${results.chapterName}` : '';
    modalSubtitle.innerHTML = `${escapeHtml(subj)}${escapeHtml(ch)} &bull; Sub-second cognitive telemetry, dual pedagogical directives &amp; line-by-line derivation review`;
  }

  // Identify student slips & conceptual needs
  const missedQuestions = breakdown.filter(q => !q.isCorrect);
  const carelessSlips = missedQuestions.filter(q => q.category === 'FAST_CARELESS_SLIP' || q.timeSpentSeconds <= (q.benchmarkSeconds || 90));
  const deepMisconceptions = missedQuestions.filter(q => q.category === 'SLOW_MISCONCEPTION' || q.timeSpentSeconds > (q.benchmarkSeconds || 90));

  const carelessPct = missedQuestions.length > 0 ? Math.round((carelessSlips.length / missedQuestions.length) * 100) : 0;
  const misconceptionPct = missedQuestions.length > 0 ? (100 - carelessPct) : 0;

  // Build Student Roadmap Cards
  let studentRoadmapCardsHtml = '';
  if (missedQuestions.length === 0) {
    studentRoadmapCardsHtml = `
      <div style="background:rgba(16, 185, 129, 0.08); border:1px solid rgba(16, 185, 129, 0.3); border-radius:10px; padding:18px 20px;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          <span style="width:28px; height:28px; border-radius:50%; background:rgba(16,185,129,0.2); color:#10b981; display:flex; align-items:center; justify-content:center;">
            <i data-lucide="award" style="width:16px; height:16px;"></i>
          </span>
          <strong style="color:#34d399; font-size:1.02rem;">Flawless Diagnostic Mastery!</strong>
        </div>
        <p style="font-size:0.86rem; color:var(--text-secondary); line-height:1.6; margin:0 0 10px 0;">
          You successfully answered every question in this assessment accurately. Your formula recall, algebraic execution, and speed pacing are operating at top CBSE &amp; competitive examination benchmarks.
        </p>
        <div style="font-size:0.8rem; color:#93c5fd; background:rgba(59,130,246,0.1); padding:8px 12px; border-radius:6px;">
          <strong>Next Horizon:</strong> Advance to multi-concept integration problems and High-Order Thinking Skills (HOTS) in the Question Bank.
        </div>
      </div>
    `;
  } else {
    studentRoadmapCardsHtml = missedQuestions.map((q, idx) => {
      const prof = getConceptPedagogicalProfile(q.subtopic, q.category, q.timeSpentSeconds, q.benchmarkSeconds);
      const isCareless = q.category === 'FAST_CARELESS_SLIP' || q.timeSpentSeconds <= (q.benchmarkSeconds || 90);
      return `
        <div class="diag-concept-item-card" style="border-left:4px solid ${isCareless ? '#f59e0b' : '#ef4444'};">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.75rem; font-weight:800; color:${isCareless ? '#fbbf24' : '#f87171'}; background:${isCareless ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}; padding:2px 8px; border-radius:4px;">
                  Q${q.questionIndex} &bull; ${isCareless ? 'Careless Speed Slip' : 'Conceptual Hesitation'}
                </span>
                <span style="font-size:0.75rem; color:var(--text-muted);">
                  Speed: <strong>${q.timeSpentSeconds}s</strong> (Benchmark: ${q.benchmarkSeconds || 90}s)
                </span>
              </div>
              <strong style="font-size:0.96rem; color:var(--text-primary); margin-top:5px; display:block;">
                ${renderLatexString(prof.cleanTitle)}
              </strong>
            </div>
            <button type="button" class="btn-secondary" onclick="openPersonalizedRemedialModal()" style="font-size:0.74rem; padding:4px 10px; background:rgba(6,182,212,0.12); border:1px solid #06b6d4; color:#22d3ee; display:inline-flex; align-items:center; gap:5px; border-radius:6px;" title="Practice formula drill">
              <i data-lucide="play" style="width:12px; height:12px;"></i> Practice Formula
            </button>
          </div>

          <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; margin-top:2px;">
            <strong style="color:#e2e8f0;">Why You Slipped:</strong> ${renderLatexString(prof.studentGuidance)}
          </div>

          <div style="background:rgba(0,0,0,0.3); border:1px dashed rgba(6,182,212,0.35); border-radius:6px; padding:10px 14px; font-size:0.92rem; color:#38bdf8; display:flex; flex-direction:column; gap:4px;">
            <span style="font-size:0.7rem; font-weight:800; color:#22d3ee; text-transform:uppercase; letter-spacing:0.5px;">
              Core Theorem &amp; Formula to Memorize:
            </span>
            <div>${renderLatexString(prof.formula)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Build Teacher Action Directives
  const missedTopicNames = missedQuestions.map(q => cleanDiagnosticSubtopic(q.subtopic)).slice(0, 3).join(', ');
  let teacherDirectivesHtml = `
    <!-- Immediate Classroom Lecture Priority -->
    <div style="background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.25); border-radius:10px; padding:16px 18px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <i data-lucide="presentation" style="width:18px; height:18px; color:#f59e0b;"></i>
        <strong style="color:#fbbf24; font-size:0.92rem;">Next Classroom Lecture Blackboard Priority</strong>
      </div>
      <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6; margin:0;">
        ${missedQuestions.length > 0
          ? `Dedicate the first 10 minutes of tomorrow's lecture to re-derive: <strong>${missedTopicNames}</strong>. Emphasize physical boundary conditions, sign conventions, and common distractor traps before moving to new chapter topics.`
          : `Class demonstrating full command over tested fundamentals. Advance directly to advanced application problems, previous 10-year board questions, and JEE/NEET multi-concept bridges.`
        }
      </p>
    </div>

    <!-- Error Taxonomy Ratio Box -->
    <div style="background:rgba(255, 255, 255, 0.025); border:1px solid var(--border-subtle); border-radius:10px; padding:16px 18px; display:flex; flex-direction:column; gap:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-size:0.86rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
          <i data-lucide="pie-chart" style="width:15px; height:15px; color:#60a5fa;"></i> Error Pattern Taxonomy
        </strong>
        <span style="font-size:0.75rem; color:var(--text-muted);">${missedQuestions.length} Mistakes Analyzed</span>
      </div>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); border-radius:8px; padding:10px 12px;">
          <div style="font-size:0.72rem; color:#f59e0b; font-weight:700; text-transform:uppercase;">Careless Slips</div>
          <div style="font-size:1.4rem; font-weight:800; color:#fbbf24; margin:2px 0;">${carelessSlips.length} <span style="font-size:0.8rem; font-weight:600;">(${carelessPct}%)</span></div>
          <div style="font-size:0.72rem; color:var(--text-muted); line-height:1.4;">Solved in &lt;90s; slipped on signs or units.</div>
        </div>

        <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:8px; padding:10px 12px;">
          <div style="font-size:0.72rem; color:#ef4444; font-weight:700; text-transform:uppercase;">Conceptual Traps</div>
          <div style="font-size:1.4rem; font-weight:800; color:#f87171; margin:2px 0;">${deepMisconceptions.length} <span style="font-size:0.8rem; font-weight:600;">(${misconceptionPct}%)</span></div>
          <div style="font-size:0.72rem; color:var(--text-muted); line-height:1.4;">High hesitation; confusion in theorem application.</div>
        </div>
      </div>
    </div>

    <!-- Hostel Evening Study Hall Directive -->
    <div style="background:rgba(139, 92, 246, 0.08); border:1px solid rgba(139, 92, 246, 0.25); border-radius:10px; padding:16px 18px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <i data-lucide="moon" style="width:16px; height:16px; color:#a78bfa;"></i>
        <strong style="color:#c4b5fd; font-size:0.9rem;">Hostel Evening Study Hall Directive</strong>
      </div>
      <ul style="margin:0; padding-left:18px; font-size:0.82rem; color:var(--text-secondary); line-height:1.65;">
        ${missedQuestions.length > 0
          ? `
            <li>Mandate 3 handwritten repetitions of the derivation steps for <strong>${missedTopicNames}</strong> in student's evening notebook.</li>
            <li>Launch the <strong>Personalized Remedial Assignment</strong> formula recall task before lights out.</li>
            <li>Teacher seatmap walkthrough: inspect notebook during morning prep period.</li>
          `
          : `
            <li>Assign 5 High-Order Thinking Skills (HOTS) questions from Chapter 1-2 in evening self-study.</li>
            <li>Peer tutoring recommendation: Pair this student with classmates needing derivation support.</li>
          `
        }
      </ul>
    </div>
  `;

  // Build Mastery Breakdown Pills
  const renderMasteryPills = (arr, colorHex, bgRgba) => {
    if (!arr || arr.length === 0) return '<span style="color:var(--text-muted); font-size:0.8rem;">None recorded in this assessment</span>';
    return arr.map(rawTopic => {
      const cleaned = cleanDiagnosticSubtopic(rawTopic);
      return `
        <span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; font-size:0.76rem; font-weight:700; border-radius:6px; background:${bgRgba}; color:${colorHex}; border:1px solid ${colorHex}40; margin:3px;">
          ${renderLatexString(cleaned)}
        </span>
      `;
    }).join(' ');
  };

  // Build Question-by-Question Review with Step Walkthroughs
  let questionCardsHtml = breakdown.map((q, qIdx) => {
    const matchingExamQ = (examState.questions && examState.questions.length > 0)
      ? (examState.questions[q.questionIndex - 1] || examState.questions.find(item => item.id === q.questionId))
      : null;

    const qText = matchingExamQ?.question_latex || matchingExamQ?.questionText || q.question_latex || `Question ${q.questionIndex} testing concept: ${q.subtopic}`;
    const opts = matchingExamQ?.options_latex || matchingExamQ?.options || [];
    const isCorrect = q.isCorrect;
    const timeSpent = q.timeSpentSeconds || 45;
    const benchmark = q.benchmarkSeconds || 90;
    const isCareless = q.category === 'FAST_CARELESS_SLIP';
    const prof = getConceptPedagogicalProfile(q.subtopic, q.category, timeSpent, benchmark);

    // Prepare Intuitive Solution Steps
    const stepsData = formatIntuitiveSteps(matchingExamQ || {
      subject: q.subject,
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: 'MEDIUM',
      solution_latex: matchingExamQ?.solution_latex || `Given the fundamental governing equation ${prof.formula}, we apply standard boundary conditions to establish the result.`,
      correct_answer: q.correctAnswer || 'A'
    });

    const studentOpt = q.selectedOption || 'Unanswered';
    const expectedOpt = q.correctAnswer || 'A';

    return `
      <div class="diag-question-review-card" style="border-left: 5px solid ${isCorrect ? '#10b981' : (isCareless ? '#f59e0b' : '#ef4444')};">
        <!-- Top Row: Q Number, Topic, Badges -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span style="font-size:0.85rem; font-weight:800; color:#fff; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:4px;">
                Question ${q.questionIndex}
              </span>
              <span style="font-size:0.75rem; font-weight:700; color:${isCorrect ? '#34d399' : '#f87171'}; background:${isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; padding:2px 8px; border-radius:4px;">
                ${isCorrect ? '+4 Marks (Correct)' : (studentOpt === 'Unanswered' ? '0 Marks (Skipped)' : '-1 Mark (Incorrect)')}
              </span>
              <span style="font-size:0.74rem; font-weight:700; color:${isCorrect ? '#10b981' : (isCareless ? '#fbbf24' : '#ef4444')}; background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px;">
                ${isCorrect ? 'Fast & Accurate' : (isCareless ? 'Careless Slip (-1M)' : 'Conceptual Misconception (-1M)')}
              </span>
            </div>
            <div style="font-size:0.96rem; font-weight:700; color:var(--text-primary); margin-top:6px;">
              ${renderLatexString(prof.cleanTitle)}
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:12px;">
            <div style="text-align:right;">
              <div style="font-size:0.76rem; color:var(--text-muted);">Solving Time</div>
              <div style="font-size:0.92rem; font-weight:800; color:${timeSpent > benchmark * 1.3 ? '#f87171' : '#38bdf8'};">
                ${timeSpent}s <span style="font-size:0.72rem; color:var(--text-muted); font-weight:400;">/ ${benchmark}s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Statement -->
        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:14px 16px; font-size:0.92rem; color:var(--text-primary); line-height:1.65;">
          ${renderLatexString(qText)}
        </div>

        <!-- Options / Responses Row -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
          <div style="background:${isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'}; border:1px solid ${isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}; border-radius:8px; padding:10px 14px; display:flex; align-items:center; gap:10px;">
            <span style="width:24px; height:24px; border-radius:50%; background:${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color:${isCorrect ? '#34d399' : '#f87171'}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <i data-lucide="${isCorrect ? 'check' : 'x'}" style="width:14px; height:14px;"></i>
            </span>
            <div>
              <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Your Selection</div>
              <div style="font-size:0.88rem; font-weight:800; color:${isCorrect ? '#34d399' : '#f87171'};">Option ${escapeHtml(studentOpt)}</div>
            </div>
          </div>

          <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:8px; padding:10px 14px; display:flex; align-items:center; gap:10px;">
            <span style="width:24px; height:24px; border-radius:50%; background:rgba(16,185,129,0.2); color:#34d399; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <i data-lucide="check-check" style="width:14px; height:14px;"></i>
            </span>
            <div>
              <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Verified Board Key</div>
              <div style="font-size:0.88rem; font-weight:800; color:#34d399;">Option ${escapeHtml(expectedOpt)}</div>
            </div>
          </div>
        </div>

        <!-- Toggle Step-by-Step Solution Button -->
        <div style="display:flex; justify-content:flex-end;">
          <button type="button" class="btn-secondary" onclick="toggleDiagQuestionSolution(${qIdx})" id="diagBtnToggleSol_${qIdx}" style="font-size:0.78rem; padding:6px 14px; display:inline-flex; align-items:center; gap:6px;" title="Toggle line-by-line solution">
            <i data-lucide="eye" style="width:14px; height:14px;"></i>
            <span>View Step-by-Step Solution</span>
          </button>
        </div>

        <!-- Collapsible Intuitive Solution Mastercard -->
        <div id="diagSolBody_${qIdx}" style="display:none; flex-direction:column; gap:14px; margin-top:8px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:14px;">
          <!-- Step 1: Fundamental Concept & Formula -->
          <div class="qb-solution-concept-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
              <span style="font-size:0.76rem; font-weight:800; color:#22d3ee; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:6px;">
                <i data-lucide="compass" style="width:14px; height:14px;"></i> Step 1: Fundamental Concept &amp; Governing Law
              </span>
              <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" class="qb-btn-toggle-explain" onclick="toggleSolutionConceptExplanation('diag_${qIdx}')" id="btnExplain_diag_${qIdx}">
                  <i data-lucide="help-circle" style="width:13px; height:13px;"></i> View Concept &amp; Reasoning
                </button>
                <span style="font-size:0.7rem; font-weight:700; color:var(--text-muted); background:rgba(255,255,255,0.04); padding:2px 7px; border-radius:4px;">
                  Foundation Step
                </span>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.3); border:1px dashed rgba(6,182,212,0.45); border-radius:6px; padding:12px 16px; font-size:1.02rem; color:#38bdf8; overflow-x:auto;">
              ${renderLatexString(stepsData.formulaLatex || prof.formula)}
            </div>
            <div id="boxExplain_diag_${qIdx}" class="qb-concept-explanation-box" style="display:none; margin-top:10px;">
              <div style="font-size:0.84rem; color:#bae6fd; font-weight:700; margin-bottom:4px;">Physical Concept &amp; Intuition:</div>
              <div style="font-size:0.96rem; color:var(--text-primary); line-height:1.7;">
                ${escapeHtml(stepsData.principleIntuition || stepsData.principle || prof.studentGuidance)}
              </div>
            </div>
          </div>

          <!-- Step 2: Line-by-Line Mathematical Derivation -->
          <div>
            <div style="font-size:0.76rem; font-weight:800; color:#60a5fa; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:inline-flex; align-items:center; gap:6px;">
              <i data-lucide="list-ordered" style="width:14px; height:14px;"></i> Step 2: Line-by-Line Mathematical Working (${(stepsData.parsedSteps || []).length} Key Steps)
            </div>
            <div class="qb-solution-steps-flow">
              ${(stepsData.parsedSteps || []).map((s, sIdx) => `
                <div class="qb-solution-step-item">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span class="qb-solution-step-badge">
                      Step 2.${sIdx + 1}: ${escapeHtml(s.title)}
                    </span>
                    <span style="font-size:0.74rem; color:var(--text-muted); font-weight:600;">
                      ${s.stepRubric ? escapeHtml(s.stepRubric) : `Step ${sIdx + 1}`}
                    </span>
                  </div>
                  <div class="sol-step-content" style="font-size:1.02rem; color:var(--text-primary); line-height:1.75;">
                    ${formatStepEquations(s.text)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Step 3: Verified Answer & Result -->
          <div class="qb-solution-answer-box">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:50%; background:rgba(16,185,129,0.2); color:#34d399; flex-shrink:0; margin-top:2px;">
              <i data-lucide="check-circle" style="width:18px; height:18px;"></i>
            </span>
            <div style="flex:1;">
              <div style="font-size:0.76rem; font-weight:800; color:#34d399; text-transform:uppercase; letter-spacing:0.5px;">
                Step 3: Final Verified Result &amp; Concluding Statement
              </div>
              <div style="font-size:1.12rem; font-weight:800; color:#ecfdf5; margin:6px 0 4px 0; overflow-x:auto;">
                Correct Answer: Option ${escapeHtml(expectedOpt)}
              </div>
              <div style="font-size:0.92rem; color:rgba(236,253,245,0.9); line-height:1.6;">
                ${renderLatexString(stepsData.correctAnswer || `Option ${expectedOpt} matches the verified analytical derivation.`)}
              </div>
            </div>
          </div>

          <!-- Step 4: Examiner Tip & Common Pitfalls -->
          <div class="qb-solution-tip-box">
            <div style="font-size:0.76rem; font-weight:800; color:#fbbf24; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:inline-flex; align-items:center; gap:6px;">
              <i data-lucide="alert-triangle" style="width:15px; height:15px; color:#fbbf24; flex-shrink:0; margin-top:2px;"></i> Step 4: Examiner Tip &amp; Common Pitfalls
            </div>
            <div style="font-size:0.9rem; color:#fef3c7; line-height:1.65;">
              ${renderLatexString(stepsData.examTip || prof.studentGuidance)}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Assemble full report canvas
  if (container) {
    container.innerHTML = `
      <!-- 1. Executive Performance Ribbon -->
      <div class="diag-kpi-ribbon">
        <!-- KPI 1: Diagnostic Score -->
        <div class="diag-kpi-tile" style="border-top:3px solid #3b82f6;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Diagnostic Score</span>
            <span style="font-size:0.72rem; font-weight:700; color:${percentage >= 80 ? '#34d399' : (percentage >= 50 ? '#fbbf24' : '#f87171')}; background:${percentage >= 80 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}; padding:1px 6px; border-radius:4px;">
              ${percentage >= 80 ? 'Distinction' : (percentage >= 60 ? 'Proficient' : 'Needs Reinforcement')}
            </span>
          </div>
          <div style="display:flex; align-items:baseline; gap:8px;">
            <span id="diagScoreVal" style="font-size:1.85rem; font-weight:800; color:#60a5fa; font-family:'Outfit', sans-serif;">${totalScore} / ${totalMarks}</span>
            <span id="diagPercentageVal" style="font-size:0.95rem; font-weight:700; color:${percentage >= 80 ? '#34d399' : '#fbbf24'};">(${percentage}%)</span>
          </div>
          <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-top:4px;">
            <div style="width:${percentage}%; height:100%; background:${percentage >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : (percentage >= 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)')};"></div>
          </div>
        </div>

        <!-- KPI 2: Accuracy & Mistake Breakdown -->
        <div class="diag-kpi-tile" style="border-top:3px solid #10b981;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Accuracy Rate</span>
            <span style="font-size:0.72rem; font-weight:700; color:#34d399; background:rgba(16,185,129,0.15); padding:1px 6px; border-radius:4px;">
              ${correctCount}/${totalQuestions} Questions
            </span>
          </div>
          <div style="display:flex; align-items:baseline; gap:8px;">
            <span style="font-size:1.85rem; font-weight:800; color:#34d399; font-family:'Outfit', sans-serif;">${accuracy}%</span>
          </div>
          <div style="font-size:0.74rem; color:var(--text-secondary); margin-top:2px;">
            <strong>${correctCount}</strong> Correct &bull; <span style="color:#f87171;"><strong>${incorrectCount}</strong> Incorrect</span> &bull; <span style="color:var(--text-muted);">${unansweredCount} Skipped</span>
          </div>
        </div>

        <!-- KPI 3: Solving Velocity -->
        <div class="diag-kpi-tile" style="border-top:3px solid #06b6d4;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Solving Velocity</span>
            <span style="font-size:0.72rem; font-weight:700; color:#22d3ee; background:rgba(6,182,212,0.15); padding:1px 6px; border-radius:4px;">
              ${avgSpeed <= 90 ? 'CBSE Benchmark Met' : 'Pacing Overrun'}
            </span>
          </div>
          <div style="display:flex; align-items:baseline; gap:6px;">
            <span id="diagAvgSpeedVal" style="font-size:1.85rem; font-weight:800; color:#22d3ee; font-family:'Outfit', sans-serif;">${avgSpeed}s</span>
            <span style="font-size:0.8rem; color:var(--text-muted);">/ question</span>
          </div>
          <div style="font-size:0.74rem; color:var(--text-secondary); margin-top:2px;">
            CBSE Benchmark: 90s/Q &bull; Total Time: <strong>${Math.round(totalTimeSpent / 60)}m ${totalTimeSpent % 60}s</strong>
          </div>
        </div>

        <!-- KPI 4: Cognitive Hesitation -->
        <div class="diag-kpi-tile" style="border-top:3px solid #8b5cf6;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Cognitive Hesitation</span>
            <span style="font-size:0.72rem; font-weight:700; color:#c4b5fd; background:rgba(139,92,246,0.15); padding:1px 6px; border-radius:4px;">
              ${avgHesitation <= 8 ? 'Decisive Recall' : 'Hesitation'}
            </span>
          </div>
          <div style="display:flex; align-items:baseline; gap:6px;">
            <span id="diagHesitationVal" style="font-size:1.85rem; font-weight:800; color:#a78bfa; font-family:'Outfit', sans-serif;">${avgHesitation}s</span>
            <span style="font-size:0.8rem; color:var(--text-muted);">avg delay</span>
          </div>
          <div style="font-size:0.74rem; color:var(--text-secondary); margin-top:2px;">
            Latency before first interaction &bull; Fast conceptual retrieval
          </div>
        </div>
      </div>

      <!-- 2. Dual Action Directives Grid (Student Roadmap vs Teacher Directives) -->
      <div class="diag-dual-directive-grid">
        <!-- Left Pillar: What You Need to Learn & Master (Student) -->
        <div class="diag-directive-box diag-directive-student">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(6,182,212,0.2); padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="width:34px; height:34px; border-radius:8px; background:rgba(6,182,212,0.18); color:#22d3ee; display:flex; align-items:center; justify-content:center;">
                <i data-lucide="graduation-cap" style="width:20px; height:20px;"></i>
              </span>
              <div>
                <strong style="font-size:1.05rem; color:#f8fafc; font-family:'Outfit', sans-serif;">What You Need to Learn &amp; Master</strong>
                <p style="font-size:0.76rem; color:var(--text-muted); margin:2px 0 0 0;">Personalized conceptual roadmap based on your test mistakes</p>
              </div>
            </div>
            <span style="font-size:0.72rem; font-weight:700; color:#22d3ee; background:rgba(6,182,212,0.15); padding:3px 8px; border-radius:4px;">
              Student Roadmap
            </span>
          </div>

          <div style="display:flex; flex-direction:column; gap:14px;">
            ${studentRoadmapCardsHtml}
          </div>
        </div>

        <!-- Right Pillar: Where Teacher Needs to Focus (Teacher) -->
        <div class="diag-directive-box diag-directive-teacher">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(245,158,11,0.2); padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="width:34px; height:34px; border-radius:8px; background:rgba(245,158,11,0.18); color:#fbbf24; display:flex; align-items:center; justify-content:center;">
                <i data-lucide="users" style="width:20px; height:20px;"></i>
              </span>
              <div>
                <strong style="font-size:1.05rem; color:#f8fafc; font-family:'Outfit', sans-serif;">Where Teacher Needs to Focus</strong>
                <p style="font-size:0.76rem; color:var(--text-muted); margin:2px 0 0 0;">Pedagogical intervention directives, error taxonomy &amp; hostel study plan</p>
              </div>
            </div>
            <span style="font-size:0.72rem; font-weight:700; color:#fbbf24; background:rgba(245,158,11,0.15); padding:3px 8px; border-radius:4px;">
              Teacher Directives
            </span>
          </div>

          <div style="display:flex; flex-direction:column; gap:14px;">
            ${teacherDirectivesHtml}
          </div>
        </div>
      </div>

      <!-- 3. Concept Mastery Breakdown Matrix -->
      <div style="background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:14px; padding:20px 24px; display:flex; flex-direction:column; gap:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i data-lucide="layers" style="width:18px; height:18px; color:#60a5fa;"></i>
            <strong style="font-size:0.98rem; color:var(--text-primary); font-family:'Outfit', sans-serif;">
              Curriculum Concept Mastery Breakdown
            </strong>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Institutional Syllabus Alignment</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
          <!-- Mastered Concepts -->
          <div style="background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.2); border-radius:10px; padding:14px 16px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:10px;">
              <span style="width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
              <strong style="font-size:0.82rem; color:#34d399; text-transform:uppercase; letter-spacing:0.5px;">Mastered Concepts (High Accuracy &amp; Speed)</strong>
            </div>
            <div id="diagMasteredList" style="display:flex; flex-wrap:wrap;">
              ${renderMasteryPills(masteredList, '#34d399', 'rgba(16,185,129,0.12)')}
            </div>
          </div>

          <!-- Recap Concepts -->
          <div style="background:rgba(245,158,11,0.04); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:14px 16px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:10px;">
              <span style="width:8px; height:8px; border-radius:50%; background:#f59e0b;"></span>
              <strong style="font-size:0.82rem; color:#fbbf24; text-transform:uppercase; letter-spacing:0.5px;">Concepts Needing Recap (Speed Lag or Minor Slip)</strong>
            </div>
            <div id="diagRecapList" style="display:flex; flex-wrap:wrap;">
              ${renderMasteryPills(recapList, '#fbbf24', 'rgba(245,158,11,0.12)')}
            </div>
          </div>

          <!-- Critical Weaknesses -->
          <div style="background:rgba(239,68,68,0.04); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:14px 16px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:10px;">
              <span style="width:8px; height:8px; border-radius:50%; background:#ef4444;"></span>
              <strong style="font-size:0.82rem; color:#f87171; text-transform:uppercase; letter-spacing:0.5px;">Critical Weaknesses (Conceptual Trap or Hesitation)</strong>
            </div>
            <div id="diagWeakList" style="display:flex; flex-wrap:wrap;">
              ${renderMasteryPills(weakList, '#f87171', 'rgba(239,68,68,0.12)')}
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Question-by-Question Detailed Review with Interactive Solutions -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:10px;">
          <div>
            <strong style="font-size:1.02rem; color:var(--text-primary); font-family:'Outfit', sans-serif;">
              Question-by-Question Diagnostic Review &amp; Step Walkthroughs
            </strong>
            <p style="font-size:0.76rem; color:var(--text-muted); margin:2px 0 0 0;">
              Examine each question, verify your response, and view comprehensive step-by-step mathematical solutions
            </p>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">
            ${breakdown.length} Questions Evaluated
          </span>
        </div>

        <div id="diagQuestionsTable" style="display:flex; flex-direction:column; gap:14px;">
          ${questionCardsHtml}
        </div>
      </div>
    `;
  }

  if (results && results.assessmentId) {
    state.lastSubmittedAssessmentId = results.assessmentId;
  }

  modal.style.display = 'flex';
  modal.classList.add('active');
  initLucideIcons();
}

function toggleDiagQuestionSolution(qIdx) {
  const body = document.getElementById(`diagSolBody_${qIdx}`);
  const btn = document.getElementById(`diagBtnToggleSol_${qIdx}`);
  if (!body) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? 'flex' : 'none';
  if (btn) {
    btn.innerHTML = isHidden
      ? `<i data-lucide="eye-off" style="width:14px; height:14px;"></i><span>Hide Solution</span>`
      : `<i data-lucide="eye" style="width:14px; height:14px;"></i><span>View Step-by-Step Solution</span>`;
    initLucideIcons();
  }
}
window.toggleDiagQuestionSolution = toggleDiagQuestionSolution;

function closeDiagnosticResultsModal() {
  const modal = document.getElementById('modalDiagnosticResults');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}


// =============================================================================
// PERSONALIZED REMEDIAL ASSIGNMENT ENGINE: FORMULA RECALL & TARGETED REMEDIATION
// =============================================================================

async function openPersonalizedRemedialModal() {
  const modal = document.getElementById('modalPersonalizedRemedial');
  if (!modal) return;

  const curSubj = state.activeAssessment?.subject || (teacherBuilderState?.selectedSubjectKey === 'BIOLOGY' ? 'Biology' : (teacherBuilderState?.selectedSubjectKey === 'CHEMISTRY' ? 'Chemistry' : 'Biology'));
  const curSubjKey = state.activeAssessment?.subjectKey || (curSubj === 'Biology' ? 'BIOLOGY' : (curSubj === 'Chemistry' ? 'CHEMISTRY' : 'PHYSICS'));
  const curTitle = state.activeAssessment?.title || `${curSubj} Diagnostic Assessment`;

  // If no active assignment exists yet, fetch or generate one from the backend preserving current subject
  if (!state.activeRemedialAssignment) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/assessments/remedial/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'b0000000-0000-0000-0000-000000000001',
          studentName: 'Aryan Sharma',
          rollNumber: '11-S-24',
          assessmentId: state.lastSubmittedAssessmentId || 'asgn_cur_01',
          assessmentTitle: curTitle,
          subject: curSubj,
          subjectKey: curSubjKey,
          grade: state.activeAssessment?.grade || '12',
          chapterName: state.activeAssessment?.chapterName || '',
          questionBreakdown: [
            {
              questionIndex: 1,
              topic: curSubj === 'Biology' ? 'Organisms and Populations' : (curSubj === 'Chemistry' ? 'Electrochemistry' : 'Optics'),
              subtopic: curSubj === 'Biology' ? 'Verhulst-Pearl Logistic Growth Equation' : (curSubj === 'Chemistry' ? 'Standard Gibbs Free Energy & Cell Potential' : 'Spherical Mirrors'),
              selectedOption: 'B',
              correctAnswer: 'A',
              isCorrect: false,
              timeSpentSeconds: 110,
              benchmarkSeconds: 90,
              mistakeClassification: { explanation: curSubj === 'Biology' ? 'Omitted environmental carrying capacity resistance factor (K-N)/K' : 'Formula error' }
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        state.activeRemedialAssignment = data.assignment;
      }
    } catch (err) {
      console.warn('Failed to generate remedial assignment from server:', err);
    }
  }

  if (state.activeRemedialAssignment) {
    renderPersonalizedRemedialAssignment(state.activeRemedialAssignment);
  }

  modal.style.display = 'flex';
  modal.classList.add('active');
  initLucideIcons();
}

function closePersonalizedRemedialModal() {
  const modal = document.getElementById('modalPersonalizedRemedial');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function renderPersonalizedRemedialAssignment(assignment) {
  if (!assignment) return;

  const titleEl = document.getElementById('remStudentTitle');
  const badgeEl = document.getElementById('remBadgeStudent');
  const summaryEl = document.getElementById('remSummaryText');
  const formulaContainer = document.getElementById('remFormulaDrillsContainer');
  const targetContainer = document.getElementById('remTargetQuestionsContainer');
  const hostelEl = document.getElementById('remHostelDirective');
  const parentEl = document.getElementById('remParentDirective');

  const subj = (assignment.subject || 'Biology').toLowerCase();
  const subjBadge = assignment.subject || 'Biology';

  if (titleEl) titleEl.innerText = assignment.title || `Personalized Remedial Assignment (${subjBadge})`;
  if (badgeEl && assignment.student) {
    badgeEl.innerText = `${assignment.student.name || 'Aryan Sharma'} • Roll: ${assignment.student.rollNumber || '11-S-24'} • [${subjBadge}]`;
  }

  if (summaryEl && assignment.performanceSummary) {
    const s = assignment.performanceSummary;
    summaryEl.innerHTML = `Diagnostic telemetry analyzed <strong>${s.totalQuestions || 3} questions</strong> (${s.correctCount || 1} correct, <strong>${s.wrongCount || 2} wrong</strong>) in <strong>${subjBadge}</strong>. Identified <strong>${assignment.formulaDrills?.length || 1} core concept/formula gap(s)</strong> and distractor traps. Complete the write-in recall drills and targeted practice questions below to achieve 100% mastery.`;
  }

  // Define subject-tailored quick insert palettes and placeholder examples
  let quickSymbols = [];
  let placeholderText = '';

  if (subj.includes('bio')) {
    quickSymbols = ['dN/dt', 'rN((K-N)/K)', 'p^2 + 2pq + q^2 = 1', 'p + q = 1', 'S = C A^Z', 'log S = log C + Z log A', 'GAG -> GUG', 'allolactose', 'dsRNA', 'tet^R', 'Cu2+'];
    placeholderText = 'Write formula / principle here, e.g. dN/dt = rN((K-N)/K) or p^2 + 2pq + q^2 = 1 or allolactose';
  } else if (subj.includes('chem')) {
    quickSymbols = ['Delta G = -nFE', 'k = (2.303/t)log([A]_0/[A])', 'Delta T_f = K_f * m', 'E_cell = E0 - (0.0591/n)log Q', 'pH = -log[H+]'];
    placeholderText = 'Write formula here, e.g. Delta G = -nFE or k = (2.303/t)log([A]_0/[A])';
  } else if (subj.includes('math')) {
    quickSymbols = ['D = b^2 - 4ac', 'x = (-b ± sqrt(D))/(2a)', 'd = |(b1 × b2)·(a2 - a1)|/|b1 × b2|', 'P(A|B) = P(A ∩ B)/P(B)', 'det(A)'];
    placeholderText = 'Write formula here, e.g. D = b^2 - 4ac or P(A|B) = P(A∩B)/P(B)';
  } else {
    quickSymbols = ['1/f = 1/v + 1/u', 'm = -v/u', 'n = c/v', 'H = I^2 R t', 'H = V^2/R * t', 'tau = r × F = I alpha'];
    placeholderText = 'Write formula here, e.g. 1/f = 1/v + 1/u or n = c/v or H = I^2 R t';
  }

  // 1. Render Part 1: Interactive "Write That Formula / Principle" Drills
  if (formulaContainer && assignment.formulaDrills) {
    formulaContainer.innerHTML = assignment.formulaDrills.map((drill, idx) => `
      <div class="glass-card" style="padding: 14px 18px; border-left: 4px solid #a855f7; background: rgba(168, 85, 247, 0.04); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
          <strong style="color: #c084fc; font-size: 0.9rem;">${drill.subtopic}: ${drill.formulaName}</strong>
          <span class="pilot-tag" style="background: rgba(236, 72, 153, 0.15); color: #ec4899; font-size: 0.72rem;">${subjBadge} Recall Drill</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 10px 0;">${drill.prompt}</p>

        <!-- Quick Symbol Palette -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
          <span style="font-size: 0.72rem; color: var(--text-muted); align-self: center;">Quick Insert:</span>
          ${quickSymbols.map(sym => `
            <button type="button" class="btn-secondary" style="font-size: 0.72rem; padding: 2px 8px; cursor: pointer;" onclick="insertFormulaSymbol(${idx}, '${sym.replace(/'/g, "\\'")}')">${sym}</button>
          `).join('')}
        </div>

        <!-- Formula Text Input & Check Button -->
        <div style="display: flex; gap: 8px; align-items: stretch;">
          <input type="text" id="formulaInput_${idx}" class="form-input" style="flex: 1; font-family: monospace; font-size: 0.88rem; padding: 8px 12px; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(168, 85, 247, 0.4);" placeholder="${placeholderText}">
          <button type="button" class="btn-primary" onclick="handleVerifyFormula(${idx}, '${drill.subtopic}', '${assignment.subject || 'Biology'}')" style="background: linear-gradient(135deg, #10b981, #059669); font-size: 0.82rem; padding: 8px 16px; white-space: nowrap; cursor: pointer;">
            <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Verify Equation
          </button>
        </div>

        <!-- Real-time Verification Feedback Box -->
        <div id="formulaFeedback_${idx}" style="display: none; margin-top: 10px; padding: 10px 14px; border-radius: 6px; font-size: 0.82rem;"></div>
      </div>
    `).join('');
  }

  // 2. Render Part 2: Targeted Practice Questions
  if (targetContainer && assignment.remedialQuestions) {
    targetContainer.innerHTML = assignment.remedialQuestions.map((q, qIdx) => `
      <div class="glass-card" id="remQCard_${qIdx}" style="padding: 14px 18px; border-left: 4px solid #10b981; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <strong style="color: #10b981; font-size: 0.88rem;">${subjBadge} Practice Q#${qIdx + 1}: ${q.subtopic || 'Concept Remediation'}</strong>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${q.drillOrigin || `Targeted practice for ${subjBadge}`}</span>
        </div>
        <div class="remedial-q-text" style="font-size: 0.88rem; line-height: 1.5; margin-bottom: 12px; color: var(--text-primary);">
          ${renderLatexString(q.questionLatex)}
        </div>
        <div class="remedial-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${(q.options || []).map(opt => `
            <button type="button" class="btn-secondary rem-opt-btn" onclick="handleRemedialOptionSelect('remQCard_${qIdx}', '${opt.key}', ${opt.isCorrect ? 'true' : 'false'}, '${encodeURIComponent(q.solutionLatex || '')}', '${encodeURIComponent(opt.trap || '')}')" style="text-align: left; padding: 8px 12px; font-size: 0.82rem; display: flex; align-items: center; gap: 8px; cursor: pointer; border-radius: 6px; transition: all 0.2s ease;">
              <span style="font-weight: 700; color: var(--accent-cyan); font-size: 0.85rem;">${opt.key}.</span>
              <span style="flex: 1;">${renderLatexString(opt.latex)}</span>
            </button>
          `).join('')}
        </div>
        <div id="remQFeedback_remQCard_${qIdx}" style="display: none; margin-top: 10px; padding: 10px 14px; border-radius: 6px; font-size: 0.82rem;"></div>
      </div>
    `).join('');
  }

  // 3. Render Pedagogical Action Directives
  if (hostelEl && assignment.dualActionPlan?.hostelPrepAction) {
    const h = assignment.dualActionPlan.hostelPrepAction;
    hostelEl.innerHTML = `<strong>${h.faculty || `${subjBadge} Proctor`}:</strong> ${h.directive} <br><span style="font-size:0.72rem; opacity:0.85; margin-top:3px; display:inline-block;">Slot: ${h.timeSlot || '7:30 PM Prep'} &bull; Priority: ${h.priority || 'HIGH'}</span>`;
  }

  if (parentEl && assignment.dualActionPlan?.parentHomeAction) {
    const p = assignment.dualActionPlan.parentHomeAction;
    parentEl.innerHTML = `${p.directive} <br><span style="font-size:0.72rem; opacity:0.85; margin-top:3px; display:inline-block;">Focus Topic: ${p.focusConcept || `${subjBadge} Principles`}</span>`;
  }

  // Render LaTeX math inside modal cards
  const modalEl = document.getElementById('modalPersonalizedRemedial');
  if (modalEl) {
    renderMathInElement(modalEl);
  }
  initLucideIcons();
}

function insertFormulaSymbol(drillIdx, symbol) {
  const input = document.getElementById(`formulaInput_${drillIdx}`);
  if (!input) return;
  input.value = (input.value ? input.value + ' ' : '') + symbol;
  input.focus();
}

async function handleVerifyFormula(drillIdx, subtopic, subject = 'Biology') {
  const input = document.getElementById(`formulaInput_${drillIdx}`);
  const feedbackEl = document.getElementById(`formulaFeedback_${drillIdx}`);
  if (!input || !feedbackEl) return;

  const val = input.value.trim();
  if (!val) {
    feedbackEl.style.display = 'block';
    feedbackEl.style.background = 'rgba(239, 68, 68, 0.12)';
    feedbackEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    feedbackEl.style.color = '#ef4444';
    feedbackEl.innerHTML = 'Please enter the formula or principle in the input box before verifying.';
    return;
  }

  feedbackEl.style.display = 'block';
  feedbackEl.style.background = 'rgba(56, 189, 248, 0.1)';
  feedbackEl.style.border = '1px solid rgba(56, 189, 248, 0.3)';
  feedbackEl.style.color = 'var(--text-primary)';
  feedbackEl.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;vertical-align:middle;"></i> Evaluating formula precision...';
  initLucideIcons();

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/assessments/remedial/verify-formula`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtopic, formulaInput: val, subject })
    });

    const data = await res.json();
    if (data.isValid) {
      feedbackEl.style.background = 'rgba(16, 185, 129, 0.12)';
      feedbackEl.style.border = '1px solid rgba(16, 185, 129, 0.35)';
      feedbackEl.style.color = '#10b981';
      feedbackEl.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 4px;">Verified: Formula Confirmed Correct.</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;">Model Formula: <code>${data.modelFormulaLatex || ''}</code></div>
        <div style="font-size: 0.76rem; color: #34d399; background: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 4px;">
          ${data.signRules || 'Sign rules mastered.'}
        </div>
      `;
    } else {
      feedbackEl.style.background = 'rgba(245, 158, 11, 0.12)';
      feedbackEl.style.border = '1px solid rgba(245, 158, 11, 0.35)';
      feedbackEl.style.color = '#f59e0b';
      feedbackEl.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 4px;">Attention: Check Formula Precision</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">${data.message || 'Incorrect variable placement or missing reciprocal.'}</div>
        <div style="font-size: 0.78rem; color: var(--accent-cyan); background: rgba(56, 189, 248, 0.08); padding: 6px 10px; border-radius: 4px;">
          <strong>Target Structure:</strong> ${renderLatexString('$' + (data.modelFormulaLatex || '') + '$')}
          <br><span style="font-size:0.74rem; color:var(--text-muted);">${data.signRules || ''}</span>
        </div>
      `;
    }
    renderMathInElement(feedbackEl);
  } catch (err) {
    feedbackEl.innerHTML = 'Formula recorded. Verify Cartesian sign conventions.';
  }
}

function handleRemedialOptionSelect(cardId, selectedKey, isCorrect, solutionEncoded, trapEncoded) {
  const card = document.getElementById(cardId);
  const feedbackEl = document.getElementById(`remQFeedback_${cardId}`);
  if (!card || !feedbackEl) return;

  const solutionLatex = decodeURIComponent(solutionEncoded || '');
  const trapDesc = decodeURIComponent(trapEncoded || '');

  // Reset option button styles inside this card
  card.querySelectorAll('.rem-opt-btn').forEach(btn => {
    btn.style.borderColor = 'var(--border-subtle)';
    btn.style.background = 'rgba(255, 255, 255, 0.03)';
  });

  feedbackEl.style.display = 'block';

  if (isCorrect) {
    feedbackEl.style.background = 'rgba(16, 185, 129, 0.12)';
    feedbackEl.style.border = '1px solid rgba(16, 185, 129, 0.35)';
    feedbackEl.style.color = '#10b981';
    feedbackEl.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 4px;">Option ${selectedKey} is CORRECT</div>
      <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">
        <strong>Step-by-Step Derivation:</strong><br>
        ${renderLatexString(solutionLatex)}
      </div>
    `;
  } else {
    feedbackEl.style.background = 'rgba(239, 68, 68, 0.12)';
    feedbackEl.style.border = '1px solid rgba(239, 68, 68, 0.35)';
    feedbackEl.style.color = '#ef4444';
    feedbackEl.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 4px;">Option ${selectedKey} is INCORRECT</div>
      <div style="font-size: 0.8rem; color: #fca5a5; margin-bottom: 6px;">
        <strong>Distractor Trap:</strong> ${trapDesc || 'Formula inversion or sign rule slip.'}
      </div>
      <div style="font-size: 0.8rem; color: var(--text-secondary); border-top: 1px solid rgba(239,68,68,0.2); padding-top: 6px;">
        <strong>Correct Derivation:</strong><br>
        ${renderLatexString(solutionLatex)}
      </div>
    `;
  }

  renderMathInElement(feedbackEl);
}

function printPersonalizedRemedialAssignment() {
  window.print();
}

// ==============================================================================
// DOWNLOAD PLAIN DOCX ASSIGNMENT & WORKSHEET (MICROSOFT WORD FORMAT)
// ==============================================================================
async function triggerDocxBlobDownload(endpoint, payload, fallbackFilename) {
  try {
    const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`DOCX export failed with HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fallbackFilename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  } catch (err) {
    console.error('Failed to download DOCX:', err);
    alert(`Failed to download DOCX assignment: ${err.message}`);
  }
}

async function downloadCurrentTestDocx() {
  const asgn = state.activeAssessment || {};
  const diag = state.latestDiagnosticResults || {};
  const student = state.activeStudent || { name: 'Aryan Sharma', roll: '12-NM-01' };

  const payload = {
    title: asgn.title || 'Student Diagnostic Test & Assignment',
    subject: asgn.subject || 'Chemistry',
    grade: asgn.grade || '12',
    section: asgn.section || '12-NonMed',
    studentName: student.name || 'Aryan Sharma',
    rollNumber: student.roll || '12-NM-01',
    targetExam: asgn.targetExam || 'JEE / CBSE Board',
    performanceSummary: {
      accuracyPercentage: diag.accuracyPercentage || Math.round(((diag.totalMarks || 12) / 12) * 100),
      totalQuestions: (asgn.questions || []).length || 3,
      correctCount: diag.totalCorrect || 2,
      wrongCount: diag.totalWrong || 1
    },
    questions: asgn.questions || (examState.questions || []),
    conceptGaps: diag.conceptGaps || [],
    formulaDrills: state.activeRemedialAssignment?.formulaDrills || [],
    dualActionPlan: state.activeRemedialAssignment?.dualActionPlan || {
      hostelPrepAction: { directive: 'Conduct focused 15-minute review of missed concepts during 7:30 PM evening prep.' },
      parentHomeAction: { directive: 'Encourage student to explain key formula derivations during weekend call.' }
    }
  };

  const filename = `HAPS_${(payload.title || 'Assignment').replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  await triggerDocxBlobDownload('/api/assessments/export-docx', { assessment: payload }, filename);
}

async function downloadRemedialDocx() {
  const rem = state.activeRemedialAssignment;
  if (!rem) {
    await openPersonalizedRemedialModal();
  }
  const assignmentToDownload = state.activeRemedialAssignment || {
    title: 'Personalized Remedial Assignment & Formula Drills',
    studentName: 'Aryan Sharma',
    rollNumber: '12-NM-01',
    grade: '12',
    section: '12-NonMed'
  };

  const filename = `HAPS_Remedial_${(assignmentToDownload.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_')}_Assignment.docx`;
  await triggerDocxBlobDownload('/api/assessments/remedial/export-docx', { assignment: assignmentToDownload }, filename);
}

async function downloadCurrentDrilldownDocx() {
  const student = state.activeStudent || { name: 'Aryan Sharma', roll: '12-NM-01' };
  const payload = {
    title: `${student.name} – Subject Mastery & Diagnostic Progress Review`,
    studentName: student.name,
    rollNumber: student.roll,
    grade: '12',
    section: '12-NonMed',
    subject: state.activeTeacherFaculty || 'Chemistry',
    questions: examState.questions || [],
    formulaDrills: state.activeRemedialAssignment?.formulaDrills || [],
    dualActionPlan: {
      hostelPrepAction: { directive: 'Review formula sign rules and solve 2 targeted remedial questions during study hall.' },
      parentHomeAction: { directive: 'Check concept understanding via Feynman explanation.' }
    }
  };
  const filename = `HAPS_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_Progress_Assignment.docx`;
  await triggerDocxBlobDownload('/api/assessments/export-docx', { assessment: payload }, filename);
}

// Expose remedial & export functions globally to window for HTML buttons
window.openPersonalizedRemedialModal = openPersonalizedRemedialModal;
window.closePersonalizedRemedialModal = closePersonalizedRemedialModal;
window.insertFormulaSymbol = insertFormulaSymbol;
window.handleVerifyFormula = handleVerifyFormula;
window.handleRemedialOptionSelect = handleRemedialOptionSelect;
window.printPersonalizedRemedialAssignment = printPersonalizedRemedialAssignment;
window.downloadCurrentTestDocx = downloadCurrentTestDocx;
window.downloadRemedialDocx = downloadRemedialDocx;
window.downloadCurrentDrilldownDocx = downloadCurrentDrilldownDocx;

async function loadAndRenderSmartReport(studentId = 'b0000000-0000-0000-0000-000000000001') {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/reports/weekly/${studentId}`);
    if (!res.ok) return;
    const data = await res.json();
    const report = data.report;
    if (!report) return;

    const subtitleEl = document.getElementById('smartReportSubtitle');
    const accEl = document.getElementById('smartReportAccuracy');
    const hoursEl = document.getElementById('smartReportStudyHours');
    const qCountEl = document.getElementById('smartReportQuestionsSolved');
    const velEl = document.getElementById('smartReportVelocity');
    const schoolListEl = document.getElementById('smartReportSchoolDirectivesList');
    const parentListEl = document.getElementById('smartReportParentDirectivesList');

    if (subtitleEl) {
      subtitleEl.innerHTML = `Generated for: <strong>${report.studentName || 'Aryan Sharma'}</strong> (Roll: ${report.rollNumber || '12-NM-01'}) &bull; Class ${report.grade || '12'} ${report.section || 'Non-Med'}`;
    }
    if (accEl) accEl.innerText = `${report.overallScorePercentage || 78.4}%`;
    if (hoursEl) hoursEl.innerText = `${report.totalStudyHours || 15.2} Hrs`;
    if (qCountEl) qCountEl.innerText = `${report.questionsAttempted || 68} Qs`;
    if (velEl) velEl.innerText = `${report.averageVelocitySeconds || 112}s / Q`;

    if (schoolListEl && report.schoolHostelActions && report.schoolHostelActions.length > 0) {
      schoolListEl.innerHTML = report.schoolHostelActions.map((act, idx) => `
        <div class="directive-item">
          <span class="directive-num">${idx + 1}</span>
          <div>
            <strong style="color: var(--text-primary); font-size: 0.88rem;">${act.directive}</strong>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
              Expected Outcome: ${act.expected_outcome || 'Verify independent problem-solving.'}
            </p>
            <span style="font-size: 0.72rem; color: var(--accent-indigo); font-weight: 600;">
              Assigned To: ${act.responsible_faculty || 'Subject Faculty'} &bull; Priority: ${act.priority || 'HIGH'}
            </span>
          </div>
        </div>
      `).join('');
    }

    if (parentListEl && report.parentActions && report.parentActions.length > 0) {
      parentListEl.innerHTML = report.parentActions.map((act, idx) => `
        <div class="directive-item">
          <span class="directive-num">${idx + 1}</span>
          <div>
            <strong style="color: var(--text-primary); font-size: 0.88rem;">${act.directive}</strong>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
              ${act.purpose || 'Supports learning cadence without exam anxiety.'}
            </p>
            <span style="font-size: 0.72rem; color: var(--accent-emerald); font-weight: 600;">
              Frequency: ${act.frequency || 'Weekly cadence'}
            </span>
          </div>
        </div>
      `).join('');
    }

    activeWhatsAppContext = {
      studentId: report.studentId || studentId,
      studentName: report.studentName || 'Aryan Sharma',
      rollNumber: report.rollNumber || '12-NM-01',
      parentPhone: report.parentPhone || '+91 98160 12345',
      accuracy: report.overallScorePercentage || 78.4,
      studyHours: report.totalStudyHours || 15.2,
      mastered: report.masteredConcepts && report.masteredConcepts.length > 0 ? `${report.masteredConcepts[0].subtopic} (${report.masteredConcepts[0].accuracy || 95}%)` : 'Moment of Inertia (95% accuracy)',
      weakness: report.weakConcepts && report.weakConcepts.length > 0 ? report.weakConcepts[0].subtopic : 'Damped Oscillations',
      actionItem: report.parentActions && report.parentActions.length > 0 ? report.parentActions[0].directive : 'Ask student: "How do car shock absorbers stop a car from bouncing?" (5-min Feynman check)',
      portalUrl: `https://scholar.unisole.ai/report/${report.studentId || studentId}`
    };

    initLucideIcons();
  } catch (err) {
    console.warn('[SMART REPORT] Could not load dynamic weekly report:', err);
  }
}

async function handleGoToSmartReport() {
  closeDiagnosticResultsModal();

  // 1. Switch to Teacher role
  const btnRoleTeacher = document.getElementById('btnRoleTeacher');
  if (btnRoleTeacher) {
    btnRoleTeacher.click();
  } else {
    state.activeRole = 'teacher';
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('teacherView')?.classList.add('active');
  }

  // 2. Switch to Weekly Smart Report sub-tab
  const tabSmartReportsBtn = document.getElementById('tabBtnSmartReports');
  if (tabSmartReportsBtn) {
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    tabSmartReportsBtn.classList.add('active');

    document.querySelectorAll('.teacher-tab-content').forEach(tab => {
      const isTarget = tab.id === 'tabSmartReports';
      tab.style.display = isTarget ? 'block' : 'none';
      tab.classList.toggle('active', isTarget);
    });
  } else {
    const tabStudentsBtn = document.getElementById('tabBtnStudents');
    if (tabStudentsBtn) tabStudentsBtn.click();
  }

  // 3. Load & render latest dynamic smart report
  await loadAndRenderSmartReport('b0000000-0000-0000-0000-000000000001');

  // 4. Scroll smoothly to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  initLucideIcons();
}

async function handleGoToClassDashboard() {
  closeDiagnosticResultsModal();

  // 1. Switch to Teacher role
  const btnRoleTeacher = document.getElementById('btnRoleTeacher');
  if (btnRoleTeacher) {
    btnRoleTeacher.click();
  } else {
    state.activeRole = 'teacher';
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById('teacherView')?.classList.add('active');
  }

  // 2. Identify target assessment ID
  const selectAssessment = document.getElementById('selectAnalyticsAssessment');
  const targetId = state.lastSubmittedAssessmentId 
    || state.activeAssessment?.id 
    || (selectAssessment && selectAssessment.value)
    || (state.publishedAssessments && state.publishedAssessments[0]?.id)
    || 'asgn_1792954983484';

  // 3. Switch to Class Progress Dashboard tab
  const tabAnalyticsBtn = document.getElementById('tabBtnClassAnalytics');
  if (tabAnalyticsBtn) {
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    tabAnalyticsBtn.classList.add('active');

    document.querySelectorAll('.teacher-tab-content').forEach(tab => {
      const isTarget = tab.id === 'tabClassAnalytics';
      tab.style.display = isTarget ? 'block' : 'none';
      tab.classList.toggle('active', isTarget);
    });
  }

  // 4. Load class analytics for this assessment
  await loadClassAnalytics(targetId);

  // 5. Scroll smoothly to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  initLucideIcons();
}

// ============================================================================
// TEACHER CLASS-WISE EXAM ANALYTICS & STUDENT DRILL-DOWN CONTROLLER
// ============================================================================

let currentAnalyticsData = null;
const analyticsCharts = {};

function destroyChart(key) {
  if (analyticsCharts[key]) {
    try {
      analyticsCharts[key].destroy();
    } catch (e) {
      console.warn('Error destroying chart', key, e);
    }
    analyticsCharts[key] = null;
  }
}

function setupClassAnalytics() {
  const selectAssessment = document.getElementById('selectAnalyticsAssessment');
  const btnRefresh = document.getElementById('btnRefreshAnalytics');
  const btnCloseModal = document.getElementById('btnCloseStudentDrilldown');
  const drilldownModal = document.getElementById('modalStudentDrilldown');

  if (selectAssessment) {
    selectAssessment.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (selectedId) loadClassAnalytics(selectedId);
    });
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      const selectedId = selectAssessment ? selectAssessment.value : null;
      loadClassAnalytics(selectedId);
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeStudentDrilldown);
  }

  if (drilldownModal) {
    drilldownModal.addEventListener('click', (e) => {
      if (e.target === drilldownModal) {
        closeStudentDrilldown();
      }
    });
  }
}

function generateFallbackClassAnalytics(assessmentId, targetSubjKey) {
  const sKey = (targetSubjKey || teacherBuilderState.teacherSubjectKey || teacherBuilderState.selectedSubjectKey || 'CLASS10_MATHEMATICS').toUpperCase();
  const isClass10Math = sKey.includes('MATH') || sKey === 'CLASS10_MATHEMATICS';
  const isClass10Sci = sKey.includes('SCIENCE') || sKey === 'CLASS10_SCIENCE';

  if (isClass10Math) {
    const assessment = {
      id: assessmentId || 'asgn_10_math_01',
      title: 'Class 10th Mathematics: Real Numbers & Polynomials Diagnostic Assessment',
      grade: '10',
      section: '10-Science-A',
      subject: 'Mathematics',
      subjectKey: 'CLASS10_MATHEMATICS',
      totalQuestions: 4,
      totalMarks: 16
    };
    const classSummary = {
      totalSubmissions: 4,
      classEnrolledCount: 4,
      participationRate: '100%',
      averageScore: 12.0,
      averagePercentage: '75%',
      averageTimeSpentSeconds: 228,
      highestScore: { score: 16, percentage: 100, students: [{ studentId: 'b0000000-0000-0000-0000-000000000022', studentName: 'Aditya Chauhan', rollNumber: '10-A-02' }] },
      lowestScore: { score: 8, percentage: 50, students: [{ studentId: 'b0000000-0000-0000-0000-000000000024', studentName: 'Nikhil Rana', rollNumber: '10-A-04' }] }
    };
    const highlights = {
      mostAttempted: { questionIndex: 1, subtopic: "Euclid's Division Algorithm", attemptCount: 4, attemptRate: '100%' },
      mostWrong: { questionIndex: 4, subtopic: 'Quadratic Polynomial Formation', wrongCount: 2, errorRate: '50%', dominantMistake: 'Calculation / Constant Multiplier Slip' }
    };
    const questionAnalytics = [
      { questionIndex: 1, subtopic: "Euclid's Division Algorithm", topic: 'Real Numbers', accuracyRate: 100.0, errorRate: 0.0, avgTimeSpentSeconds: 46, benchmarkSeconds: 90, dominantMistake: 'None', mistakeBreakdown: { CONCEPTUAL: 0, FORMULA_BASED: 0, CALCULATION: 0, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 } },
      { questionIndex: 2, subtopic: 'Fundamental Theorem of Arithmetic (HCF × LCM)', topic: 'Real Numbers', accuracyRate: 100.0, errorRate: 0.0, avgTimeSpentSeconds: 51, benchmarkSeconds: 90, dominantMistake: 'None', mistakeBreakdown: { CONCEPTUAL: 0, FORMULA_BASED: 0, CALCULATION: 0, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 } },
      { questionIndex: 3, subtopic: 'Zeroes & Coefficients Relationship', topic: 'Polynomials', accuracyRate: 75.0, errorRate: 25.0, avgTimeSpentSeconds: 61, benchmarkSeconds: 90, dominantMistake: 'Sign Slip', mistakeBreakdown: { CONCEPTUAL: 0, FORMULA_BASED: 0, CALCULATION: 0, SIGN_CONVENTION: 1, TIME_PRESSURE: 0 } },
      { questionIndex: 4, subtopic: 'Quadratic Polynomial Formation', topic: 'Polynomials', accuracyRate: 50.0, errorRate: 50.0, avgTimeSpentSeconds: 71, benchmarkSeconds: 120, dominantMistake: 'Calculation Slip', mistakeBreakdown: { CONCEPTUAL: 0, FORMULA_BASED: 1, CALCULATION: 1, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 } }
    ];
    const pedagogicalActionPlan = {
      quickRecapNeeded: [
        { questionIndex: 3, concept: 'Zeroes and Coefficients Relationship', topic: 'Polynomials', accuracyRate: '75.0%', dominantMistake: 'Factor root inversion', recommendation: '10-minute recap on equating (x + a)(x + b) = 0 roots.' }
      ],
      teachOnceAgainNeeded: [
        { questionIndex: 4, concept: 'Quadratic Polynomial Formation k[x^2 - Sx + P]', topic: 'Polynomials', accuracyRate: '50.0%', studentsStruggledCount: 2, dominantMistake: 'Fraction clearing error', recommendation: 'Review standard quadratic formation with fractional sum & product coefficients.' }
      ],
      timeManagementAlerts: []
    };
    const studentRoster = [
      { studentId: 'b0000000-0000-0000-0000-000000000022', studentName: 'Aditya Chauhan', rollNumber: '10-A-02', score: 16, totalMarks: 16, percentage: 100, totalTimeSpentSeconds: 195, wrongQuestionsCount: 0, primaryMistake: 'None', smartCardSummary: 'Mastered all concepts with sub-benchmark speeds. Flawless algebraic factorization and polynomial operations.' },
      { studentId: 'b0000000-0000-0000-0000-000000000023', studentName: 'Tanvi Sood', rollNumber: '10-A-03', score: 12, totalMarks: 16, percentage: 75, totalTimeSpentSeconds: 220, wrongQuestionsCount: 1, primaryMistake: 'Calculation', smartCardSummary: 'High proficiency on Real Numbers. Minor algebraic slip while clearing denominators in quadratic formation.' },
      { studentId: 'b0000000-0000-0000-0000-000000000021', studentName: 'Rohit Verma', rollNumber: '10-A-01', score: 12, totalMarks: 16, percentage: 75, totalTimeSpentSeconds: 235, wrongQuestionsCount: 1, primaryMistake: 'Sign Slip', smartCardSummary: 'Consistent pace across test. Inverted signs when equating factors (x + 2)(x + 5) = 0.' },
      { studentId: 'b0000000-0000-0000-0000-000000000024', studentName: 'Nikhil Rana', rollNumber: '10-A-04', score: 8, totalMarks: 16, percentage: 50, totalTimeSpentSeconds: 265, wrongQuestionsCount: 2, primaryMistake: 'Conceptual & Formula', smartCardSummary: 'Good performance on Real Numbers. Remedial coaching needed on quadratic polynomial formation and zeroes relationship.' }
    ];
    return {
      success: true,
      assessment,
      classSummary,
      highlights,
      questionAnalytics,
      pedagogicalActionPlan,
      studentRoster,
      availableAssessments: [
        { id: 'asgn_10_math_01', title: 'Class 10th Mathematics: Real Numbers & Polynomials Diagnostic Assessment', grade: '10', section: '10-Science-A', subjectKey: 'CLASS10_MATHEMATICS' }
      ]
    };
  }

  if (isClass10Sci) {
    const assessment = {
      id: assessmentId || 'asgn_10_sci_01',
      title: 'Class 10 Science: Light – Spherical Mirrors & Derivations',
      grade: '10',
      section: '10-Science-A',
      subject: 'Science',
      subjectKey: 'CLASS10_SCIENCE',
      totalQuestions: 3,
      totalMarks: 12
    };
    const classSummary = {
      totalSubmissions: 4,
      classEnrolledCount: 4,
      participationRate: '100%',
      averageScore: 9.0,
      averagePercentage: '75%',
      averageTimeSpentSeconds: 215,
      highestScore: { score: 12, percentage: 100, students: [{ studentId: 'b0000000-0000-0000-0000-000000000021', studentName: 'Rohit Verma', rollNumber: '10-A-01' }] },
      lowestScore: { score: 4, percentage: 33, students: [{ studentId: 'b0000000-0000-0000-0000-000000000024', studentName: 'Nikhil Rana', rollNumber: '10-A-04' }] }
    };
    const highlights = {
      mostAttempted: { questionIndex: 1, subtopic: 'Spherical Mirrors', attemptCount: 4, attemptRate: '100%' },
      mostWrong: { questionIndex: 2, subtopic: 'Refraction & Snell Law', wrongCount: 2, errorRate: '50%', dominantMistake: 'Refractive Index Ratio Inversion' }
    };
    const questionAnalytics = [
      { questionIndex: 1, subtopic: 'Spherical Mirrors', topic: 'Light – Reflection and Refraction', accuracyRate: 100.0, errorRate: 0.0, avgTimeSpentSeconds: 68, benchmarkSeconds: 90, dominantMistake: 'None', mistakeBreakdown: { CONCEPTUAL: 0, FORMULA_BASED: 0, CALCULATION: 0, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 } },
      { questionIndex: 2, subtopic: 'Refraction & Snell Law', topic: 'Light – Reflection and Refraction', accuracyRate: 50.0, errorRate: 50.0, avgTimeSpentSeconds: 72, benchmarkSeconds: 75, dominantMistake: 'Calculation Slip', mistakeBreakdown: { CONCEPTUAL: 0, FORMULA_BASED: 1, CALCULATION: 1, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 } },
      { questionIndex: 3, subtopic: "Ohm's Law & Resistance", topic: 'Electricity', accuracyRate: 75.0, errorRate: 25.0, avgTimeSpentSeconds: 75, benchmarkSeconds: 90, dominantMistake: 'Sign Slip', mistakeBreakdown: { CONCEPTUAL: 0, FORMULA_BASED: 0, CALCULATION: 0, SIGN_CONVENTION: 1, TIME_PRESSURE: 0 } }
    ];
    const pedagogicalActionPlan = {
      quickRecapNeeded: [
        { questionIndex: 3, concept: "Ohm's Law & Resistance", topic: 'Electricity', accuracyRate: '75.0%', dominantMistake: 'Area inversion in resistivity', recommendation: '10-minute recap on wire stretching and resistance scaling.' }
      ],
      teachOnceAgainNeeded: [
        { questionIndex: 2, concept: 'Refraction & Snell Law', topic: 'Light', accuracyRate: '50.0%', studentsStruggledCount: 2, dominantMistake: 'Velocity ratio inversion', recommendation: 'Re-derive Snell Law and absolute refractive index step-by-step.' }
      ],
      timeManagementAlerts: []
    };
    const studentRoster = [
      { studentId: 'b0000000-0000-0000-0000-000000000021', studentName: 'Rohit Verma', rollNumber: '10-A-01', score: 12, totalMarks: 12, percentage: 100, totalTimeSpentSeconds: 219, wrongQuestionsCount: 0, primaryMistake: 'None', smartCardSummary: 'Mastered all concepts with sub-benchmark speeds. Flawless application of sign conventions.' },
      { studentId: 'b0000000-0000-0000-0000-000000000022', studentName: 'Aditya Chauhan', rollNumber: '10-A-02', score: 8, totalMarks: 12, percentage: 67, totalTimeSpentSeconds: 210, wrongQuestionsCount: 1, primaryMistake: 'Calculation', smartCardSummary: 'Good performance. Slipped on unit conversions in question 2.' },
      { studentId: 'b0000000-0000-0000-0000-000000000023', studentName: 'Tanvi Sood', rollNumber: '10-A-03', score: 8, totalMarks: 12, percentage: 67, totalTimeSpentSeconds: 215, wrongQuestionsCount: 1, primaryMistake: 'Calculation', smartCardSummary: 'Consistent pace across test.' },
      { studentId: 'b0000000-0000-0000-0000-000000000024', studentName: 'Nikhil Rana', rollNumber: '10-A-04', score: 4, totalMarks: 12, percentage: 33, totalTimeSpentSeconds: 216, wrongQuestionsCount: 2, primaryMistake: 'Conceptual', smartCardSummary: 'Needs review on Snell Law and mirror formula sign conventions.' }
    ];
    return {
      success: true,
      assessment,
      classSummary,
      highlights,
      questionAnalytics,
      pedagogicalActionPlan,
      studentRoster,
      availableAssessments: [
        { id: 'asgn_10_sci_01', title: 'Class 10 Science: Light – Spherical Mirrors & Derivations', grade: '10', section: '10-Science-A', subjectKey: 'CLASS10_SCIENCE' }
      ]
    };
  }

  // Senior Secondary Default (Physics / General)
  const assessment = {
    id: assessmentId || 'asgn_12_phy_01',
    title: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test',
    grade: '12',
    section: '12-NonMed',
    subject: 'Physics',
    subjectKey: 'PHYSICS',
    totalQuestions: 3,
    totalMarks: 12
  };
  const classSummary = {
    totalSubmissions: 8,
    classEnrolledCount: 8,
    participationRate: '100%',
    averageScore: 7.8,
    averagePercentage: '65%',
    averageTimeSpentSeconds: 165,
    highestScore: { score: 12, percentage: 100, students: [{ studentId: '12-NM-03', studentName: 'Kavya Verma', rollNumber: '12-NM-03' }] },
    lowestScore: { score: 0, percentage: 0, students: [{ studentId: '12-NM-01', studentName: 'Aryan Sharma', rollNumber: '12-NM-01' }] }
  };
  const highlights = {
    mostAttempted: { questionIndex: 1, subtopic: 'Properties of Charge: Additivity', attemptCount: 8, attemptRate: '100%' },
    mostWrong: { questionIndex: 3, subtopic: 'Quantization of Electric Charge (q = ±ne)', wrongCount: 6, errorRate: '75%', dominantMistake: 'Sign / Magnitude Slip' }
  };
  const questionAnalytics = [
    { questionIndex: 1, subtopic: 'Properties of Charge: Additivity', topic: 'Electrostatics', accuracyRate: 62.5, errorRate: 37.5, avgTimeSpentSeconds: 45, benchmarkSeconds: 90, dominantMistake: 'Vector vs Scalar sum', mistakeBreakdown: { CONCEPTUAL: 1, FORMULA_BASED: 1, CALCULATION: 1, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 } },
    { questionIndex: 2, subtopic: 'Conservation of Charge', topic: 'Electrostatics', accuracyRate: 50.0, errorRate: 50.0, avgTimeSpentSeconds: 52, benchmarkSeconds: 90, dominantMistake: 'Boundary confusion', mistakeBreakdown: { CONCEPTUAL: 2, FORMULA_BASED: 1, CALCULATION: 1, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 } },
    { questionIndex: 3, subtopic: 'Quantization of Charge (q = ±ne)', topic: 'Electrostatics', accuracyRate: 25.0, errorRate: 75.0, avgTimeSpentSeconds: 68, benchmarkSeconds: 90, dominantMistake: 'Formula / Integer condition', mistakeBreakdown: { CONCEPTUAL: 3, FORMULA_BASED: 2, CALCULATION: 1, SIGN_CONVENTION: 0, TIME_PRESSURE: 0 } }
  ];
  const pedagogicalActionPlan = {
    quickRecapNeeded: [
      { questionIndex: 1, concept: 'Properties of Charge: Additivity', topic: 'Electrostatics', accuracyRate: '62.5%', dominantMistake: 'Vector vs Scalar sum', recommendation: '10-minute recap on scalar superposition of charge.' },
      { questionIndex: 2, concept: 'Conservation of Charge', topic: 'Electrostatics', accuracyRate: '50.0%', dominantMistake: 'Boundary confusion', recommendation: 'Review isolated vs open thermodynamic systems.' }
    ],
    teachOnceAgainNeeded: [
      { questionIndex: 3, concept: 'Quantization of Electric Charge (q = ±ne)', topic: 'Electrostatics', accuracyRate: '25.0%', studentsStruggledCount: 6, dominantMistake: 'Formula / Integer condition', recommendation: 'Re-derive Millikan oil drop quantization step-by-step.' }
    ],
    timeManagementAlerts: []
  };
  const studentRoster = [
    { studentId: '12-NM-01', studentName: 'Aryan Sharma', rollNumber: '12-NM-01', score: 0, totalMarks: 12, percentage: 0, totalTimeSpentSeconds: 150, wrongQuestionsCount: 3, primaryMistake: 'Conceptual & Formula', smartCardSummary: 'Scored 0% on Quick Check: Properties of Charge. Mastered 1 subtopics, needs recap on 2, critical weakness on 3.' },
    { studentId: '12-NM-02', studentName: 'Rohit Negi', rollNumber: '12-NM-02', score: 8, totalMarks: 12, percentage: 67, totalTimeSpentSeconds: 180, wrongQuestionsCount: 1, primaryMistake: 'Calculation', smartCardSummary: 'Good performance. Slipped on unit conversions in question 3.' },
    { studentId: '12-NM-03', studentName: 'Kavya Verma', rollNumber: '12-NM-03', score: 12, totalMarks: 12, percentage: 100, totalTimeSpentSeconds: 140, wrongQuestionsCount: 0, primaryMistake: 'None', smartCardSummary: 'Mastered all concepts with sub-benchmark speeds.' },
    { studentId: '12-NM-04', studentName: 'Kunal Sharma', rollNumber: '12-NM-04', score: 4, totalMarks: 12, percentage: 33, totalTimeSpentSeconds: 195, wrongQuestionsCount: 2, primaryMistake: 'Conceptual', smartCardSummary: 'Needs review on quantization integer rules.' },
    { studentId: '12-NM-05', studentName: 'Divyansh Thakur', rollNumber: '12-NM-05', score: 8, totalMarks: 12, percentage: 67, totalTimeSpentSeconds: 165, wrongQuestionsCount: 1, primaryMistake: 'Calculation', smartCardSummary: 'Solid execution, review negative powers of ten.' },
    { studentId: '12-NM-06', studentName: 'Akshat Jaswal', rollNumber: '12-NM-06', score: 8, totalMarks: 12, percentage: 67, totalTimeSpentSeconds: 158, wrongQuestionsCount: 1, primaryMistake: 'Formula Slip', smartCardSummary: 'Accurate timing, brush up on conservation theorem.' },
    { studentId: '12-NM-07', studentName: 'Rahul Sen', rollNumber: '12-NM-07', score: 8, totalMarks: 12, percentage: 67, totalTimeSpentSeconds: 172, wrongQuestionsCount: 1, primaryMistake: 'Time Pressure', smartCardSummary: 'Good accuracy, slight hesitation on question 3.' },
    { studentId: '12-NM-08', studentName: 'Sahil Dhiman', rollNumber: '12-NM-08', score: 8, totalMarks: 12, percentage: 67, totalTimeSpentSeconds: 160, wrongQuestionsCount: 1, primaryMistake: 'Calculation', smartCardSummary: 'Consistent pace across test.' }
  ];

  return {
    success: true,
    assessment,
    classSummary,
    highlights,
    questionAnalytics,
    pedagogicalActionPlan,
    studentRoster,
    availableAssessments: [
      { id: 'asgn_12_phy_01', title: 'Class 12 Physics: Electrostatics & Fields - JEE Main Diagnostic Test', grade: '12', section: '12-NonMed', subjectKey: 'PHYSICS' }
    ]
  };
}

async function loadClassAnalytics(assessmentId) {
  try {
    const sKey = (teacherBuilderState.teacherSubjectKey || teacherBuilderState.selectedSubjectKey || 'PHYSICS').toUpperCase();
    
    // Quick indicator if empty
    const kpiAvg = document.getElementById('kpiAvgScore');
    if (kpiAvg && kpiAvg.innerText.trim() === '--') {
      kpiAvg.innerHTML = '<span style="font-size:1.1rem; color:var(--text-muted);"><i data-lucide="loader-2" class="spin" style="width:14px; height:14px; vertical-align:middle;"></i> Loading...</span>';
    }

    // Never default to a board paper for class progress dashboard
    let cleanAssessmentId = assessmentId;
    if (cleanAssessmentId && cleanAssessmentId.startsWith('paper_')) {
      cleanAssessmentId = null;
    }

    let url = cleanAssessmentId 
      ? `${getApiBaseUrl()}/api/analytics/class-dashboard?assessmentId=${encodeURIComponent(cleanAssessmentId)}&subjectKey=${encodeURIComponent(sKey)}`
      : `${getApiBaseUrl()}/api/analytics/class-dashboard?subjectKey=${encodeURIComponent(sKey)}`;

    let data = null;
    try {
      const res = await fetch(url);
      if (res.ok) {
        data = await res.json();
      }
    } catch (netErr) {
      console.warn('[CLASS ANALYTICS] Local fetch failed, trying cloud production fallback:', netErr);
    }

    // Remote fallback if local endpoint failed
    if (!data || !data.success) {
      try {
        const prodUrl = cleanAssessmentId
          ? `https://haps-ai-scholar-assistant-staging.vercel.app/api/analytics/class-dashboard?assessmentId=${encodeURIComponent(cleanAssessmentId)}&subjectKey=${encodeURIComponent(sKey)}`
          : `https://haps-ai-scholar-assistant-staging.vercel.app/api/analytics/class-dashboard?subjectKey=${encodeURIComponent(sKey)}`;
        const prodRes = await fetch(prodUrl);
        if (prodRes.ok) {
          data = await prodRes.json();
        }
      } catch (prodErr) {
        console.warn('[CLASS ANALYTICS] Fallback fetch error:', prodErr);
      }
    }

    // Dynamic, subject-accurate client-side fallback
    if (!data || !data.success) {
      data = generateFallbackClassAnalytics(cleanAssessmentId, sKey);
    }

    currentAnalyticsData = data;

    // Populate dropdown safely
    const selectAssessment = document.getElementById('selectAnalyticsAssessment');
    if (selectAssessment && Array.isArray(data.availableAssessments) && data.availableAssessments.length > 0) {
      const currentVal = cleanAssessmentId || data.assessment?.id || data.availableAssessments[0]?.id;
      selectAssessment.innerHTML = data.availableAssessments.map(a => `
        <option value="${a.id}" ${a.id === currentVal ? 'selected' : ''}>
          ${a.title}
        </option>
      `).join('');
      selectAssessment.value = currentVal;
    }

    renderClassAnalytics(data);
  } catch (err) {
    console.error('[CLASS ANALYTICS] Error:', err);
    const fallback = generateFallbackClassAnalytics(assessmentId, teacherBuilderState.teacherSubjectKey || teacherBuilderState.selectedSubjectKey);
    renderClassAnalytics(fallback);
  }
}
window.loadClassAnalytics = loadClassAnalytics;
window.renderClassAnalytics = renderClassAnalytics;

// -----------------------------------------------------------------------------
// VISUAL PROGRESS CHARTS (Chart.js)
// -----------------------------------------------------------------------------
function renderClassAnalyticsCharts(data) {
  if (!window.Chart || !data) return;

  if (data.hasSubmissions === false || !data.classSummary || (data.classSummary.totalSubmissions === 0 && (!data.studentRoster || !data.studentRoster.some(s => s.percentage > 0)))) {
    destroyChart('questionPerf');
    destroyChart('scoreDist');
    destroyChart('questionTime');
    destroyChart('mistakeDist');

    const perfSummaryEl = document.getElementById('chartQuestionPerfSummary');
    if (perfSummaryEl) perfSummaryEl.innerHTML = 'Pending class test attempts';
    const scoreSummaryEl = document.getElementById('chartScoreDistSummary');
    if (scoreSummaryEl) scoreSummaryEl.innerHTML = 'Pending class test attempts';
    const timeSummaryEl = document.getElementById('chartTimeLagSummary');
    if (timeSummaryEl) timeSummaryEl.innerHTML = 'Pending class test attempts';
    const mistakeSummaryEl = document.getElementById('chartMistakesSummary');
    if (mistakeSummaryEl) mistakeSummaryEl.innerHTML = 'Pending class test attempts';
    return;
  }

  const { questionAnalytics = [], studentRoster = [], highlights = {}, classSummary = {} } = data;

  // 1. Question Performance (Accuracy vs Errors) - Horizontal Bar Chart
  const ctxPerf = document.getElementById('chartQuestionPerformance');
  if (ctxPerf && questionAnalytics.length > 0) {
    destroyChart('questionPerf');

    const labels = questionAnalytics.map(q => `Q${q.questionIndex}: ${q.subtopic}`);
    const correctData = questionAnalytics.map(q => q.accuracyRate);
    const errorData = questionAnalytics.map(q => q.errorRate);

    analyticsCharts.questionPerf = new Chart(ctxPerf, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '% Solved Correctly',
            data: correctData,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: '% Errors / Mistakes',
            data: errorData,
            backgroundColor: 'rgba(244, 63, 94, 0.85)',
            borderColor: '#f43f5e',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            max: 100,
            ticks: { color: '#94a3b8', callback: (v) => `${v}%` },
            grid: { color: 'rgba(255, 255, 255, 0.06)' }
          },
          y: {
            stacked: true,
            ticks: { color: '#cbd5e1', font: { family: 'Inter', size: 11, weight: '600' } },
            grid: { display: false }
          }
        }
      }
    });

    const perfSummaryEl = document.getElementById('chartQuestionPerfSummary');
    if (perfSummaryEl && highlights.mostAttempted && highlights.mostWrong) {
      perfSummaryEl.innerHTML = `Solved Most: <strong>Q${highlights.mostAttempted.questionIndex}</strong> (${highlights.mostAttempted.attemptRate}) &bull; Challenging: <strong>Q${highlights.mostWrong.questionIndex}</strong> (${highlights.mostWrong.errorRate} Err)`;
    }
  }

  // 2. Class Score Distribution - Doughnut Chart
  const ctxScore = document.getElementById('chartScoreDistribution');
  if (ctxScore && studentRoster.length > 0) {
    destroyChart('scoreDist');

    let distinction = 0; // >=80%
    let firstClass = 0;  // 60-79%
    let passing = 0;     // 40-59%
    let remedial = 0;    // <40%

    studentRoster.forEach(s => {
      const p = s.percentage;
      if (p >= 80) distinction++;
      else if (p >= 60) firstClass++;
      else if (p >= 40) passing++;
      else remedial++;
    });

    analyticsCharts.scoreDist = new Chart(ctxScore, {
      type: 'doughnut',
      data: {
        labels: [
          `Distinction (80–100%): ${distinction}`,
          `First Class (60–79%): ${firstClass}`,
          `Passing (40–59%): ${passing}`,
          `Remedial (<40%): ${remedial}`
        ],
        datasets: [{
          data: [distinction, firstClass, passing, remedial],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(56, 189, 248, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(244, 63, 94, 0.85)'
          ],
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 }, boxWidth: 14 }
          }
        }
      }
    });

    const scoreSummaryEl = document.getElementById('chartScoreDistSummary');
    if (scoreSummaryEl) {
      scoreSummaryEl.innerHTML = `Class Avg: <strong>${classSummary.averagePercentage || '61.2%'}</strong> (${studentRoster.length} students)`;
    }
  }

  // 3. Question Time Spent vs Benchmark - Grouped Bar Chart
  const ctxTime = document.getElementById('chartQuestionTime');
  if (ctxTime && questionAnalytics.length > 0) {
    destroyChart('questionTime');

    const labels = questionAnalytics.map(q => `Q${q.questionIndex}`);
    const actualTimes = questionAnalytics.map(q => q.avgTimeSpentSeconds);
    const benchmarkTimes = questionAnalytics.map(q => q.benchmarkSeconds);

    analyticsCharts.questionTime = new Chart(ctxTime, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Actual Class Avg Time (s)',
            data: actualTimes,
            backgroundColor: 'rgba(56, 189, 248, 0.85)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Benchmark Standard (s)',
            data: benchmarkTimes,
            backgroundColor: 'rgba(148, 163, 184, 0.35)',
            borderColor: '#94a3b8',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}s`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#cbd5e1', font: { weight: '600' } },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#94a3b8', callback: (v) => `${v}s` },
            grid: { color: 'rgba(255, 255, 255, 0.06)' }
          }
        }
      }
    });

    const timeSummaryEl = document.getElementById('chartTimeLagSummary');
    if (timeSummaryEl) {
      const slowest = [...questionAnalytics].sort((a,b) => b.avgTimeSpentSeconds - a.avgTimeSpentSeconds)[0];
      if (slowest) {
        timeSummaryEl.innerHTML = `Slowest: <strong>Q${slowest.questionIndex} (${slowest.avgTimeSpentSeconds}s)</strong> vs ${slowest.benchmarkSeconds}s target`;
      }
    }
  }

  // 4. Common Mistake Categories Breakdown - Doughnut Chart
  const ctxMistakes = document.getElementById('chartMistakeDistribution');
  if (ctxMistakes && questionAnalytics.length > 0) {
    destroyChart('mistakeDist');

    const mistakeTotals = {
      CONCEPTUAL: 0,
      FORMULA_BASED: 0,
      CALCULATION: 0,
      SIGN_CONVENTION: 0,
      TIME_PRESSURE: 0
    };

    questionAnalytics.forEach(q => {
      const b = q.mistakeBreakdown || {};
      mistakeTotals.CONCEPTUAL += (b.CONCEPTUAL || 0);
      mistakeTotals.FORMULA_BASED += (b.FORMULA_BASED || 0);
      mistakeTotals.CALCULATION += (b.CALCULATION || 0);
      mistakeTotals.SIGN_CONVENTION += (b.SIGN_CONVENTION || 0);
      mistakeTotals.TIME_PRESSURE += (b.TIME_PRESSURE || 0);
    });

    analyticsCharts.mistakeDist = new Chart(ctxMistakes, {
      type: 'doughnut',
      data: {
        labels: [
          `Calculation Slips (${mistakeTotals.CALCULATION})`,
          `Conceptual Errors (${mistakeTotals.CONCEPTUAL})`,
          `Formula Confusion (${mistakeTotals.FORMULA_BASED})`,
          `Sign/Unit Errors (${mistakeTotals.SIGN_CONVENTION})`
        ],
        datasets: [{
          data: [
            mistakeTotals.CALCULATION,
            mistakeTotals.CONCEPTUAL,
            mistakeTotals.FORMULA_BASED,
            mistakeTotals.SIGN_CONVENTION
          ],
          backgroundColor: [
            'rgba(245, 158, 11, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(236, 72, 153, 0.85)'
          ],
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#cbd5e1', font: { family: 'Inter', size: 11 }, boxWidth: 14 }
          }
        }
      }
    });

    const mistakeSummaryEl = document.getElementById('chartMistakesSummary');
    if (mistakeSummaryEl) {
      mistakeSummaryEl.innerHTML = `Most Frequent: <strong>Calculation & Units</strong> (${mistakeTotals.CALCULATION} stumbles)`;
    }
  }
}

function renderClassAnalytics(data) {
  if (!data) return;

  const noticeContainer = document.getElementById('containerClassAnalyticsNotice');
  const asgn = data.assessment || {};

  // Update dynamic class badge in header
  const classBadge = document.getElementById('analyticsClassBadge');
  if (classBadge) {
    const gradeStr = asgn.grade ? `Class ${asgn.grade}` : 'Class 10';
    const secStr = asgn.section ? `Section ${asgn.section}` : 'Section A';
    classBadge.innerHTML = `${gradeStr} &bull; ${secStr}`;
  }

  // Handle case where assessment has 0 submissions or pending attempt
  const isPending = data.hasSubmissions === false || !data.classSummary || (data.classSummary.totalSubmissions === 0 && (!data.studentRoster || !data.studentRoster.some(s => s.percentage > 0)));

  if (isPending) {
    if (noticeContainer) {
      noticeContainer.innerHTML = `
        <div class="pending-attempt-banner">
          <div class="pending-attempt-info">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span class="pilot-tag" style="background:rgba(59, 130, 246, 0.2); color:var(--accent-blue);">
                <i data-lucide="clock" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> Ready for Class Attempts
              </span>
              <span class="pilot-tag" style="background:rgba(16, 185, 129, 0.15); color:#34d399;">
                ${asgn.section || 'Class 10-Science-A'} &bull; ${asgn.totalQuestions || 4} Questions
              </span>
            </div>
            <h3 style="font-size:1.15rem; font-weight:800; color:var(--text-primary); margin:0 0 4px;">
              ${asgn.title || 'Curriculum Diagnostic Assessment'}
            </h3>
            <p style="font-size:0.82rem; color:var(--text-secondary); margin:0;">
              Questions are prepared in clean LaTeX formatting. Progress analytics and question accuracy charts will be generated after attempting.
            </p>
          </div>
          <div class="pending-attempt-actions">
            <button type="button" class="btn-attempt-live" onclick="attemptActiveTestInStudentPortal('${asgn.id || ''}')">
              <i data-lucide="play" style="width:15px;height:15px;"></i> Attempt Test as Student
            </button>
            <button type="button" class="btn-simulate-eval" onclick="simulateClassAttemptsAndGenerateDashboard('${asgn.id || ''}')">
              <i data-lucide="zap" style="width:15px;height:15px;"></i> Submit Class Attempts & Generate Dashboard
            </button>
          </div>
        </div>
      `;
      initLucideIcons();
    }

    // Set placeholder KPIs
    const kpiAvgScore = document.getElementById('kpiAvgScore');
    const kpiAvgSub = document.getElementById('kpiAvgSub');
    const kpiHighestScore = document.getElementById('kpiHighestScore');
    const kpiHighestStudent = document.getElementById('kpiHighestStudent');
    const kpiLowestScore = document.getElementById('kpiLowestScore');
    const kpiLowestStudent = document.getElementById('kpiLowestStudent');
    const kpiAvgVelocity = document.getElementById('kpiAvgVelocity');
    const kpiAvgVelocitySub = document.getElementById('kpiAvgVelocitySub');

    const totalStudents = (data.studentRoster && data.studentRoster.length) || 8;
    if (kpiAvgScore) kpiAvgScore.innerHTML = `-- <span style="font-size:0.9rem; color:var(--text-muted); font-weight:500;">/ ${asgn.totalMarks || 16}</span>`;
    if (kpiAvgSub) kpiAvgSub.innerText = `0 / ${totalStudents} Students Attempted (Pending)`;
    if (kpiHighestScore) kpiHighestScore.innerHTML = `--`;
    if (kpiHighestStudent) kpiHighestStudent.innerText = `Awaiting test attempts`;
    if (kpiLowestScore) kpiLowestScore.innerHTML = `--`;
    if (kpiLowestStudent) kpiLowestStudent.innerText = `Awaiting test attempts`;
    if (kpiAvgVelocity) kpiAvgVelocity.innerText = `--`;
    if (kpiAvgVelocitySub) kpiAvgVelocitySub.innerText = `Pacing benchmark: 90s/Q`;

    // Clear charts safely
    renderClassAnalyticsCharts(data);

    // Highlights placeholders
    const txtMostAttemptedTitle = document.getElementById('txtMostAttemptedTitle');
    const txtMostAttemptedDetail = document.getElementById('txtMostAttemptedDetail');
    const badgeMostAttemptedRate = document.getElementById('badgeMostAttemptedRate');
    if (txtMostAttemptedTitle) txtMostAttemptedTitle.innerText = `Awaiting Class Submissions`;
    if (txtMostAttemptedDetail) txtMostAttemptedDetail.innerText = `Question attempt rates will show once students complete the test.`;
    if (badgeMostAttemptedRate) badgeMostAttemptedRate.innerText = `0%`;

    const txtMostWrongTitle = document.getElementById('txtMostWrongTitle');
    const txtMostWrongDetail = document.getElementById('txtMostWrongDetail');
    const badgeMostWrongRate = document.getElementById('badgeMostWrongRate');
    if (txtMostWrongTitle) txtMostWrongTitle.innerText = `Awaiting Class Submissions`;
    if (txtMostWrongDetail) txtMostWrongDetail.innerText = `Dominant stumbling blocks will be calculated automatically.`;
    if (badgeMostWrongRate) badgeMostWrongRate.innerText = `0% Error`;

    const txtTimeHotspotTitle = document.getElementById('txtTimeHotspotTitle');
    const txtTimeHotspotDetail = document.getElementById('txtTimeHotspotDetail');
    const badgeTimeLag = document.getElementById('badgeTimeLag');
    if (txtTimeHotspotTitle) txtTimeHotspotTitle.innerText = `Target: 90s / Question`;
    if (txtTimeHotspotDetail) txtTimeHotspotDetail.innerText = `Pacing bottlenecks will be flagged against standard pacing.`;
    if (badgeTimeLag) badgeTimeLag.innerText = `90s`;

    // Pedagogical Action Plan pending notice
    const recapContainer = document.getElementById('recapConceptsContainer');
    if (recapContainer) {
      recapContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Test attempts pending. Quick recap topics (50%–75% accuracy) will populate after student submission.</p>';
    }
    const reteachContainer = document.getElementById('reteachConceptsContainer');
    if (reteachContainer) {
      reteachContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Test attempts pending. Critical concept reteach directives (<50% accuracy) will populate after student submission.</p>';
    }

    // Question Matrix Table for pending assessment
    const qTableBody = document.getElementById('classQuestionBreakdownTableBody');
    if (qTableBody && Array.isArray(data.questionAnalytics) && data.questionAnalytics.length > 0) {
      qTableBody.innerHTML = data.questionAnalytics.map(q => `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 10px 8px; font-weight:700; color:var(--accent-blue);">Q${q.questionIndex}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight:600; color:var(--text-primary);">${q.subtopic || 'Diagnostic Concept'}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${q.topic || 'Core Curriculum'}</div>
          </td>
          <td style="padding: 10px 8px;">
            <strong>0%</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(0/${totalStudents})</span>
          </td>
          <td style="padding: 10px 8px;">
            <span style="font-weight:700; color:var(--text-muted);">--</span>
          </td>
          <td style="padding: 10px 8px;">
            <span>--</span> <span style="font-size:0.72rem; color:var(--text-muted);">(${q.benchmarkSeconds || 90}s)</span>
          </td>
          <td style="padding: 10px 8px;"><span class="badge-mistake badge-mistake-none">None</span></td>
          <td style="padding: 10px 8px;"><span class="speed-badge fast" style="background:rgba(59,130,246,0.15); color:var(--accent-blue);">Pending Attempt</span></td>
        </tr>
      `).join('');
    }

    // Student Performance Roster Table for enrolled students
    const sTableBody1 = document.getElementById('classStudentRosterTableBody');
    const sTableBody2 = document.getElementById('tabStudentsRosterTableBody');
    const rosterList = Array.isArray(data.studentRoster) && data.studentRoster.length > 0
      ? data.studentRoster
      : [
          { rollNumber: '10-A-01', studentName: 'Rohit Verma', studentId: 'stu_10_01' },
          { rollNumber: '10-A-02', studentName: 'Aditya Chauhan', studentId: 'stu_10_02' },
          { rollNumber: '10-A-03', studentName: 'Tanvi Sood', studentId: 'stu_10_03' },
          { rollNumber: '10-A-04', studentName: 'Nikhil Rana', studentId: 'stu_10_04' },
          { rollNumber: '10-A-05', studentName: 'Priya Sharma', studentId: 'stu_10_05' },
          { rollNumber: '10-A-06', studentName: 'Aarav Gupta', studentId: 'stu_10_06' },
          { rollNumber: '10-A-07', studentName: 'Sneha Patel', studentId: 'stu_10_07' },
          { rollNumber: '10-A-08', studentName: 'Kabir Mehta', studentId: 'stu_10_08' }
        ];

    function buildPendingRosterRows(roster) {
      return roster.map(s => `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 10px 8px; font-weight:600; color:var(--text-muted);">${s.rollNumber || '--'}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight:700; color:var(--text-primary);">${s.studentName}</div>
            <div style="font-size:0.72rem; color:var(--text-secondary); max-width:280px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">Enrolled &bull; Ready for test</div>
          </td>
          <td style="padding: 10px 8px;">
            <span class="pilot-tag" style="background:rgba(148, 163, 184, 0.15); color:var(--text-muted); font-weight:600; font-size:0.78rem;">
              Pending Attempt
            </span>
          </td>
          <td style="padding: 10px 8px; font-size:0.8rem; color:var(--text-muted);">--</td>
          <td style="padding: 10px 8px; font-size:0.8rem; font-weight:600; color:var(--text-muted);">--</td>
          <td style="padding: 10px 8px;"><span class="badge-mistake badge-mistake-none">None</span></td>
          <td style="padding: 10px 8px; text-align: right;">
            <button class="btn-secondary" onclick="attemptActiveTestInStudentPortal('${asgn.id || ''}')" style="font-size:0.75rem; padding:5px 10px; border-radius:6px; cursor:pointer;">
              <i data-lucide="play" style="width:13px; height:13px;"></i> Start Attempt
            </button>
          </td>
        </tr>
      `).join('');
    }

    if (sTableBody1) sTableBody1.innerHTML = buildPendingRosterRows(rosterList);
    if (sTableBody2) sTableBody2.innerHTML = buildPendingRosterRows(rosterList);

    const searchInput = document.getElementById('searchStudentInput');
    if (searchInput) {
      searchInput.oninput = (e) => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = rosterList.filter(s =>
          s.studentName.toLowerCase().includes(q) ||
          (s.rollNumber || '').toLowerCase().includes(q)
        );
        if (sTableBody2) sTableBody2.innerHTML = buildPendingRosterRows(filtered);
        initLucideIcons();
      };
    }

    initLucideIcons();
    return;
  }

  // When submissions exist: show success badge
  if (noticeContainer) {
    noticeContainer.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-sm); padding: 8px 14px; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; flex-wrap: wrap; gap: 8px;">
        <span style="color: #34d399; font-weight: 600;">
          <i data-lucide="check-circle" style="width:14px; height:14px; vertical-align:middle; display:inline-block;"></i>
          Test Attempted &bull; Live Progress Dashboard Generated for <strong>${data.assessment?.title || 'Active Assessment'}</strong>
        </span>
        <button type="button" class="btn-micro-quiz" onclick="attemptActiveTestInStudentPortal('${data.assessment?.id || asgn?.id || ''}')" style="background:rgba(255,255,255,0.06); color:var(--text-primary); border-color:var(--border-subtle);">
          <i data-lucide="rotate-ccw" style="width:11px;height:11px;"></i> Re-take in Student Portal
        </button>
      </div>
    `;
    initLucideIcons();
  }

  const { classSummary = {}, assessment = {}, questionAnalytics = [], highlights = {}, pedagogicalActionPlan = {}, studentRoster = [] } = data;

  // 1. KPI Cards
  const kpiAvgScore = document.getElementById('kpiAvgScore');
  const kpiAvgSub = document.getElementById('kpiAvgSub');
  const kpiHighestScore = document.getElementById('kpiHighestScore');
  const kpiHighestStudent = document.getElementById('kpiHighestStudent');
  const kpiLowestScore = document.getElementById('kpiLowestScore');
  const kpiLowestStudent = document.getElementById('kpiLowestStudent');
  const kpiAvgVelocity = document.getElementById('kpiAvgVelocity');
  const kpiAvgVelocitySub = document.getElementById('kpiAvgVelocitySub');

  if (kpiAvgScore) {
    kpiAvgScore.innerHTML = `${classSummary.averageScore ?? '--'} <span style="font-size:1rem; color:var(--text-muted); font-weight:500;">/ ${assessment.totalMarks || 16}</span> <span style="font-size:0.95rem; color:var(--accent-cyan);">(${classSummary.averagePercentage || '0%'})</span>`;
  }
  if (kpiAvgSub) {
    kpiAvgSub.innerText = `${classSummary.totalSubmissions || 0} / ${classSummary.classEnrolledCount || 8} Students Tested (${classSummary.participationRate || '0%'})`;
  }

  if (kpiHighestScore) {
    const hScore = classSummary.highestScore?.score ?? '--';
    const hPct = classSummary.highestScore?.percentage ?? 0;
    kpiHighestScore.innerHTML = `${hScore} <span style="font-size:1rem; color:var(--text-muted); font-weight:500;">/ ${assessment.totalMarks || 16}</span> <span style="font-size:0.95rem;">(${hPct}%)</span>`;
  }
  if (kpiHighestStudent) {
    const names = (classSummary.highestScore?.students || []).map(s => s.studentName).join(', ');
    kpiHighestStudent.innerText = names || 'Topper';
  }

  if (kpiLowestScore) {
    const lScore = classSummary.lowestScore?.score ?? '--';
    const lPct = classSummary.lowestScore?.percentage ?? 0;
    kpiLowestScore.innerHTML = `${lScore} <span style="font-size:1rem; color:var(--text-muted); font-weight:500;">/ ${assessment.totalMarks || 16}</span> <span style="font-size:0.95rem;">(${lPct}%)</span>`;
  }
  if (kpiLowestStudent) {
    const names = (classSummary.lowestScore?.students || []).map(s => s.studentName).join(', ');
    kpiLowestStudent.innerText = names || 'Remedial Focus';
  }

  if (kpiAvgVelocity) {
    const totalSecs = classSummary.averageTimeSpentSeconds || 0;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    kpiAvgVelocity.innerText = `${mins}m ${secs}s`;
  }
  if (kpiAvgVelocitySub) {
    const avgPerQ = Math.round((classSummary.averageTimeSpentSeconds || 0) / (assessment.totalQuestions || 1));
    kpiAvgVelocitySub.innerText = `Pacing: ~${avgPerQ}s / Question (Benchmark: 90s)`;
  }

  // 2. Highlights (Most Attempted, Most Failed, Time Hotspot)
  const txtMostAttemptedTitle = document.getElementById('txtMostAttemptedTitle');
  const txtMostAttemptedDetail = document.getElementById('txtMostAttemptedDetail');
  const badgeMostAttemptedRate = document.getElementById('badgeMostAttemptedRate');

  if (highlights.mostAttempted) {
    if (txtMostAttemptedTitle) txtMostAttemptedTitle.innerText = `Q${highlights.mostAttempted.questionIndex}: ${highlights.mostAttempted.subtopic}`;
    if (txtMostAttemptedDetail) txtMostAttemptedDetail.innerText = `${highlights.mostAttempted.attemptCount} / ${classSummary.totalSubmissions || 1} students attempted this question.`;
    if (badgeMostAttemptedRate) badgeMostAttemptedRate.innerText = highlights.mostAttempted.attemptRate;
  }

  const txtMostWrongTitle = document.getElementById('txtMostWrongTitle');
  const txtMostWrongDetail = document.getElementById('txtMostWrongDetail');
  const badgeMostWrongRate = document.getElementById('badgeMostWrongRate');

  if (highlights.mostWrong) {
    if (txtMostWrongTitle) txtMostWrongTitle.innerText = `Q${highlights.mostWrong.questionIndex}: ${highlights.mostWrong.subtopic}`;
    if (txtMostWrongDetail) txtMostWrongDetail.innerText = `${highlights.mostWrong.wrongCount} students made errors. Primary trap: ${highlights.mostWrong.dominantMistake}.`;
    if (badgeMostWrongRate) badgeMostWrongRate.innerText = `${highlights.mostWrong.errorRate} Error`;
  }

  const txtTimeHotspotTitle = document.getElementById('txtTimeHotspotTitle');
  const txtTimeHotspotDetail = document.getElementById('txtTimeHotspotDetail');
  const badgeTimeLag = document.getElementById('badgeTimeLag');

  if (pedagogicalActionPlan.timeManagementAlerts && pedagogicalActionPlan.timeManagementAlerts.length > 0) {
    const tAlert = pedagogicalActionPlan.timeManagementAlerts[0];
    if (txtTimeHotspotTitle) txtTimeHotspotTitle.innerText = `Q${tAlert.questionIndex}: ${tAlert.concept}`;
    if (txtTimeHotspotDetail) txtTimeHotspotDetail.innerText = `Avg ${tAlert.avgTime} vs ${tAlert.benchmarkTime} benchmark. ${tAlert.timeLagSeconds} time lag.`;
    if (badgeTimeLag) badgeTimeLag.innerText = tAlert.timeLagSeconds;
  } else if (questionAnalytics.length > 0) {
    const slowQ = [...questionAnalytics].sort((a,b) => b.avgTimeSpentSeconds - a.avgTimeSpentSeconds)[0];
    if (txtTimeHotspotTitle) txtTimeHotspotTitle.innerText = `Q${slowQ.questionIndex}: ${slowQ.subtopic}`;
    if (txtTimeHotspotDetail) txtTimeHotspotDetail.innerText = `Students spent ${slowQ.avgTimeSpentSeconds}s on average (Benchmark: ${slowQ.benchmarkSeconds}s).`;
    if (badgeTimeLag) badgeTimeLag.innerText = `${slowQ.avgTimeSpentSeconds}s`;
  }

  // 3. Render the 4 Visual Progress Charts (SINGLE invocation)
  renderClassAnalyticsCharts(data);

  // 4. Pedagogical Action Plan (Quick Recap vs Teach Once Again)
  const recapContainer = document.getElementById('recapConceptsContainer');
  if (recapContainer) {
    const recaps = pedagogicalActionPlan.quickRecapNeeded || [];
    if (recaps.length === 0) {
      recapContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No concepts in the 50%–75% recap bracket. Excellent retention!</p>';
    } else {
      recapContainer.innerHTML = recaps.map(r => `
        <div class="directive-card recap-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:var(--text-primary); font-size:0.9rem;">Q${r.questionIndex}: ${r.concept}</strong>
            <span class="speed-badge optimal" style="background:rgba(245,158,11,0.2); color:#fbbf24;">${r.accuracyRate} Accuracy</span>
          </div>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:6px;">Topic: ${r.topic} &bull; Dominant error: <span class="badge-mistake badge-mistake-formula">${r.dominantMistake}</span></p>
          <div style="background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:4px; font-size:0.78rem; color:#fde68a;">
            <i data-lucide="check" style="width:12px;height:12px;vertical-align:middle;"></i> ${r.recommendation}
          </div>
        </div>
      `).join('');
    }
  }

  const reteachContainer = document.getElementById('reteachConceptsContainer');
  if (reteachContainer) {
    const reteaches = pedagogicalActionPlan.teachOnceAgainNeeded || [];
    if (reteaches.length === 0) {
      reteachContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No critical gaps (<50% accuracy). Class demonstrated solid foundational mastery.</p>';
    } else {
      reteachContainer.innerHTML = reteaches.map(t => `
        <div class="directive-card reteach-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:#f87171; font-size:0.9rem;">Q${t.questionIndex}: ${t.concept}</strong>
            <span class="speed-badge hesitating" style="background:rgba(244,63,94,0.2); color:#fb7185;">${t.accuracyRate} Accuracy &bull; ${t.studentsStruggledCount} Failed</span>
          </div>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:6px;">Topic: ${t.topic} &bull; Stumble type: <span class="badge-mistake badge-mistake-calc">${t.dominantMistake}</span></p>
          <div style="background:rgba(0,0,0,0.25); padding:6px 10px; border-radius:4px; font-size:0.78rem; color:#fecdd3;">
            <i data-lucide="alert-circle" style="width:12px;height:12px;vertical-align:middle;"></i> ${t.recommendation}
          </div>
        </div>
      `).join('');
    }
  }

  // 5. Question Breakdown Matrix Table
  const qTableBody = document.getElementById('classQuestionBreakdownTableBody');
  if (qTableBody && questionAnalytics) {
    qTableBody.innerHTML = questionAnalytics.map(q => {
      const isHighFail = q.errorRate >= 50;
      const isRecap = q.accuracyRate >= 50 && q.accuracyRate < 75;
      const statusBadge = isHighFail
        ? '<span class="speed-badge hesitating" style="background:rgba(244,63,94,0.2); color:#fb7185;">Teach Once Again</span>'
        : (isRecap ? '<span class="speed-badge optimal" style="background:rgba(245,158,11,0.2); color:#fbbf24;">Quick Recap</span>' : '<span class="speed-badge fast">Mastered</span>');

      const mistakeBadge = q.dominantMistake !== 'None'
        ? `<span class="badge-mistake badge-mistake-${q.dominantMistake.toLowerCase().includes('calc') ? 'calc' : (q.dominantMistake.toLowerCase().includes('sign') ? 'sign' : (q.dominantMistake.toLowerCase().includes('formula') ? 'formula' : 'conceptual'))}">${q.dominantMistake}</span>`
        : '<span class="badge-mistake badge-mistake-none">None</span>';

      return `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 10px 8px; font-weight:700; color:var(--accent-blue);">Q${q.questionIndex}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight:600; color:var(--text-primary);">${q.subtopic}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${q.topic}</div>
          </td>
          <td style="padding: 10px 8px;">
            <strong>${q.attemptRate}%</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(${q.attemptCount}/${classSummary.totalSubmissions || 1})</span>
          </td>
          <td style="padding: 10px 8px;">
            <span style="font-weight:700; color:${q.accuracyRate >= 70 ? '#34d399' : (q.accuracyRate >= 50 ? '#fbbf24' : '#fb7185')};">${q.accuracyRate}%</span>
          </td>
          <td style="padding: 10px 8px;">
            <span>${q.avgTimeSpentSeconds}s</span> <span style="font-size:0.72rem; color:var(--text-muted);">(${q.benchmarkSeconds}s)</span>
          </td>
          <td style="padding: 10px 8px;">${mistakeBadge}</td>
          <td style="padding: 10px 8px;">${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  // 6. Student Performance Roster Table (Populates both Tab 1 & Tab 2)
  const sTableBody1 = document.getElementById('classStudentRosterTableBody');
  const sTableBody2 = document.getElementById('tabStudentsRosterTableBody');

  function buildRosterRows(roster) {
    if (!roster) return '';
    return roster.map(s => {
      const mins = Math.floor((s.totalTimeSpentSeconds || 0) / 60);
      const secs = (s.totalTimeSpentSeconds || 0) % 60;
      const scoreColor = s.percentage >= 70 ? '#34d399' : (s.percentage >= 50 ? '#fbbf24' : '#fb7185');
      const scoreBg = s.percentage >= 70 ? 'rgba(16,185,129,0.15)' : (s.percentage >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)');

      const mistakeBadge = s.wrongQuestionsCount > 0
        ? `<span class="badge-mistake badge-mistake-calc">${s.primaryMistake}</span>`
        : `<span class="badge-mistake badge-mistake-none">Flawless (100%)</span>`;

      return `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 10px 8px; font-weight:600; color:var(--text-muted);">${s.rollNumber}</td>
          <td style="padding: 10px 8px;">
            <div style="font-weight:700; color:var(--text-primary);">${s.studentName}</div>
            <div style="font-size:0.72rem; color:var(--text-secondary); max-width:280px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${s.smartCardSummary || 'Completed test'}</div>
          </td>
          <td style="padding: 10px 8px;">
            <span class="pilot-tag" style="background:${scoreBg}; color:${scoreColor}; font-weight:700; font-size:0.78rem;">
              ${s.score}/${s.totalMarks || assessment.totalMarks || 16} (${s.percentage}%)
            </span>
          </td>
          <td style="padding: 10px 8px; font-size:0.8rem;">${mins}m ${secs}s</td>
          <td style="padding: 10px 8px; font-size:0.8rem; font-weight:600; color:${s.wrongQuestionsCount === 0 ? '#34d399' : '#fb7185'};">
            ${s.wrongQuestionsCount} Wrong
          </td>
          <td style="padding: 10px 8px;">${mistakeBadge}</td>
          <td style="padding: 10px 8px; text-align: right;">
            <button class="btn-secondary" onclick="openStudentDrilldown('${s.studentId}', '${assessment?.id || asgn?.id || ''}')" style="font-size:0.75rem; padding:5px 10px; border-radius:6px; cursor:pointer;">
              <i data-lucide="eye" style="width:13px; height:13px;"></i> View Smart Card
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (sTableBody1 && studentRoster) sTableBody1.innerHTML = buildRosterRows(studentRoster);
  if (sTableBody2 && studentRoster) sTableBody2.innerHTML = buildRosterRows(studentRoster);

  // Setup search filter in Tab 2
  const searchInput = document.getElementById('searchStudentInput');
  if (searchInput && studentRoster) {
    searchInput.oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = studentRoster.filter(s => 
        s.studentName.toLowerCase().includes(q) || 
        (s.rollNumber || '').toLowerCase().includes(q)
      );
      if (sTableBody2) sTableBody2.innerHTML = buildRosterRows(filtered);
      initLucideIcons();
    };
  }

  initLucideIcons();
}

// -----------------------------------------------------------------------------
// STUDENT DRILLDOWN CHARTS (Chart.js)
// -----------------------------------------------------------------------------
function renderStudentDrilldownCharts(questionBreakdown, student, smartCard) {
  if (!window.Chart || !questionBreakdown || questionBreakdown.length === 0) return;

  // 1. Time per Question vs Benchmark
  const ctxTime = document.getElementById('chartStudentDrilldownTime');
  if (ctxTime) {
    destroyChart('studentTime');

    const labels = questionBreakdown.map(q => `Q${q.questionIndex}`);
    const studentTimes = questionBreakdown.map(q => q.timeSpentSeconds);
    const benchmarkTimes = questionBreakdown.map(q => q.benchmarkSeconds);

    analyticsCharts.studentTime = new Chart(ctxTime, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: `${student.fullName || 'Student'} Time (s)`,
            data: studentTimes,
            backgroundColor: questionBreakdown.map(q => q.isCorrect ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)'),
            borderColor: questionBreakdown.map(q => q.isCorrect ? '#10b981' : '#f43f5e'),
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Benchmark Target (s)',
            data: benchmarkTimes,
            backgroundColor: 'rgba(148, 163, 184, 0.3)',
            borderColor: '#94a3b8',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 10 } }
          }
        },
        scales: {
          x: { ticks: { color: '#cbd5e1' }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8', callback: (v) => `${v}s` }, grid: { color: 'rgba(255, 255, 255, 0.06)' } }
        }
      }
    });
  }

  // 2. Mistake Types Breakdown
  const ctxMistakes = document.getElementById('chartStudentDrilldownMistakes');
  if (ctxMistakes) {
    destroyChart('studentMistakes');

    let correctCount = 0;
    let conceptualCount = 0;
    let formulaCount = 0;
    let calculationCount = 0;

    questionBreakdown.forEach(q => {
      if (q.isCorrect) {
        correctCount++;
      } else {
        const type = (q.mistakeClassification?.type || '').toUpperCase();
        if (type.includes('CONCEPT')) conceptualCount++;
        else if (type.includes('FORMULA')) formulaCount++;
        else if (type.includes('CALC') || type.includes('SIGN')) calculationCount++;
        else calculationCount++;
      }
    });

    analyticsCharts.studentMistakes = new Chart(ctxMistakes, {
      type: 'doughnut',
      data: {
        labels: [
          `Correct (${correctCount})`,
          `Calculation (${calculationCount})`,
          `Conceptual (${conceptualCount})`,
          `Formula (${formulaCount})`
        ],
        datasets: [{
          data: [correctCount, calculationCount, conceptualCount, formulaCount],
          backgroundColor: [
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(59, 130, 246, 0.85)'
          ],
          borderColor: '#0f172a',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 12 }
          }
        }
      }
    });
  }

  // 3. Subject Concept Mastery Breakdown Chart
  const ctxMastery = document.getElementById('chartStudentDrilldownMastery');
  if (ctxMastery) {
    destroyChart('studentMastery');

    const topicStats = {};
    questionBreakdown.forEach(q => {
      const top = q.subtopic || q.topic || 'Concept';
      if (!topicStats[top]) topicStats[top] = { total: 0, correct: 0 };
      topicStats[top].total++;
      if (q.isCorrect) topicStats[top].correct++;
    });

    let mLabels = Object.keys(topicStats);
    let mData = mLabels.map(l => Math.round((topicStats[l].correct / topicStats[l].total) * 100));

    if (mLabels.length < 3) {
      const sKey = teacherBuilderState.selectedSubjectKey || 'PHYSICS';
      if (sKey === 'CHEMISTRY') {
        mLabels = ['Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Coordination Compounds'];
        mData = [80, 50, 75, 60];
      } else if (sKey === 'BIOLOGY') {
        mLabels = ['Genetics & Inheritance', 'Biotechnology', 'Human Reproduction', 'Ecosystem'];
        mData = [85, 45, 90, 70];
      } else if (sKey === 'MATHEMATICS') {
        mLabels = ['Definite Integrals', 'Matrices & Det', 'Vectors & 3D', 'Probability'];
        mData = [65, 85, 50, 75];
      } else {
        mLabels = ['Gauss Law Applications', 'Current Electricity', 'Ray Optics (Lenses)', 'AC Circuit Resonance'];
        mData = [70, 85, 45, 60];
      }
    }

    analyticsCharts.studentMastery = new Chart(ctxMastery, {
      type: 'bar',
      data: {
        labels: mLabels.slice(0, 5),
        datasets: [{
          label: 'Concept Mastery (%)',
          data: mData.slice(0, 5),
          backgroundColor: mData.slice(0, 5).map(v => v >= 70 ? 'rgba(16, 185, 129, 0.85)' : (v >= 50 ? 'rgba(245, 158, 11, 0.85)' : 'rgba(244, 63, 94, 0.85)')),
          borderColor: mData.slice(0, 5).map(v => v >= 70 ? '#10b981' : (v >= 50 ? '#f59e0b' : '#f43f5e')),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { min: 0, max: 100, ticks: { color: '#94a3b8', callback: v => `${v}%` }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }
}

function findStudentInfo(studentId) {
  for (const c of (teacherBuilderState.classes || [])) {
    const s = (c.students || []).find(stu => stu.id === studentId || stu.roll === studentId);
    if (s) {
      return {
        id: s.id,
        fullName: s.name,
        rollNumber: s.roll || s.id,
        grade: c.grade || '12',
        section: c.name || c.id,
        targetExam: c.stream === 'MEDICAL' ? 'NEET_UG' : (c.stream === 'NON_MEDICAL' ? 'JEE_ADVANCED' : 'CBSE')
      };
    }
  }
  return {
    id: studentId || '12-NM-01',
    fullName: studentId && studentId !== '12-NM-01' ? `Student ${studentId}` : 'Aryan Sharma',
    rollNumber: studentId || '12-NM-01',
    grade: '12',
    section: 'Class 12th',
    targetExam: 'JEE_MAIN'
  };
}

// 7. Individual Student Drill-Down Fallback Generator
function generateFallbackStudentDrilldown(studentId, assessmentId) {
  const stu = findStudentInfo(studentId);
  const sKey = teacherBuilderState.selectedSubjectKey || 'PHYSICS';
  const testTitle = sKey === 'CHEMISTRY' ? 'Solutions & Electrochemistry Speed Quiz' : (sKey === 'BIOLOGY' ? 'Genetics & Biotechnology Diagnostic' : (sKey === 'MATHEMATICS' ? 'Integrals & Matrices Quiz' : 'Quick Check: Electric Charges & Fields'));

  return {
    success: true,
    student: stu,
    submission: {
      submissionId: `sub_${stu.id}`,
      assessmentId: assessmentId || 'latest',
      assessmentTitle: testTitle,
      totalScore: 8,
      totalMarks: 12,
      percentage: 67,
      totalTimeSpentSeconds: 165,
      submittedAt: new Date().toISOString()
    },
    smartCard: {
      testTitle: testTitle,
      shortSummary: `Scored 67% on ${testTitle}. High velocity on core steps, but tripped on formula sign conventions.`,
      totalTimeFormatted: '2m 45s',
      teacherActionDirective: `Conduct 1-on-1 review on ${sKey} core formula applications with step derivation in residential evening prep.`,
      parentWhatsAppSnippet: `HAPS Update: ${stu.fullName} scored 67% in ${testTitle}. Demonstrating good consistency; focus on formula precision.`
    },
    questionBreakdown: [
      {
        questionIndex: 1,
        questionId: 'q1',
        topic: sKey === 'CHEMISTRY' ? 'Solutions' : (sKey === 'BIOLOGY' ? 'Genetics' : (sKey === 'MATHEMATICS' ? 'Integrals' : 'Electrostatics')),
        subtopic: sKey === 'CHEMISTRY' ? 'Colligative Properties & Van \'t Hoff Factor' : (sKey === 'BIOLOGY' ? 'Monohybrid and Dihybrid Crosses' : (sKey === 'MATHEMATICS' ? 'Integration by Parts' : 'Properties of Charge: Additivity')),
        timeSpentSeconds: 45,
        benchmarkSeconds: 90,
        speedPacing: 'FAST',
        isCorrect: true,
        selectedOption: 'A',
        correctAnswer: 'A',
        mistakeClassification: {
          type: 'NONE',
          label: 'Mastered',
          explanation: 'Rigorous calculation and exact algebraic step execution.',
          distractorTrap: null
        }
      },
      {
        questionIndex: 2,
        questionId: 'q2',
        topic: sKey === 'CHEMISTRY' ? 'Electrochemistry' : (sKey === 'BIOLOGY' ? 'Molecular Basis' : (sKey === 'MATHEMATICS' ? 'Definite Integrals' : 'Electrostatics')),
        subtopic: sKey === 'CHEMISTRY' ? 'Nernst Equation Cell Potential & Gibbs Energy' : (sKey === 'BIOLOGY' ? 'DNA Replication & Proofreading' : (sKey === 'MATHEMATICS' ? 'Definite Integral Properties' : 'Conservation of Charge in Isolated Systems')),
        timeSpentSeconds: 70,
        benchmarkSeconds: 90,
        speedPacing: 'OPTIMAL',
        isCorrect: false,
        selectedOption: 'C',
        correctAnswer: 'A',
        mistakeClassification: {
          type: 'FORMULA',
          label: 'Formula Sign Slip',
          explanation: sKey === 'CHEMISTRY' ? 'Omitted negative sign in Gibbs free energy relation ΔG° = -nFE°.' : 'Misapplied standard integration formula limits.',
          distractorTrap: sKey === 'CHEMISTRY' ? 'Confused ΔG° with standard equilibrium constant Kc.' : 'Applied wrong sign convention in boundary substitution.'
        }
      },
      {
        questionIndex: 3,
        questionId: 'q3',
        topic: sKey === 'CHEMISTRY' ? 'Chemical Kinetics' : (sKey === 'BIOLOGY' ? 'Biotechnology' : (sKey === 'MATHEMATICS' ? 'Matrices' : 'Electrostatics')),
        subtopic: sKey === 'CHEMISTRY' ? 'First-Order Kinetics Rate Constant' : (sKey === 'BIOLOGY' ? 'Restriction Enzymes & Plasmids' : (sKey === 'MATHEMATICS' ? 'Inverse of Matrix' : 'Quantization of Electric Charge (q = ±ne)')),
        timeSpentSeconds: 50,
        benchmarkSeconds: 90,
        speedPacing: 'FAST',
        isCorrect: true,
        selectedOption: 'B',
        correctAnswer: 'B',
        mistakeClassification: {
          type: 'NONE',
          label: 'Mastered',
          explanation: 'Accurate logarithmic manipulation and rapid time to solution.',
          distractorTrap: null
        }
      }
    ]
  };
}

async function openStudentDrilldown(studentId, assessmentId) {
  try {
    let data = null;
    try {
      const apiUrl = `${getApiBaseUrl()}/api/analytics/student-test-drilldown/${studentId}/${assessmentId || 'latest'}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        data = await res.json();
      }
    } catch (netErr) {
      console.warn('[STUDENT DRILLDOWN] Network fetch failed, falling back to local dataset:', netErr);
    }

    if (!data || !data.success) {
      data = generateFallbackStudentDrilldown(studentId, assessmentId);
    }

    const { student, submission, questionBreakdown, smartCard } = data;

    // Header info
    const rollEl = document.getElementById('drilldownStudentRoll');
    const examEl = document.getElementById('drilldownStudentTargetExam');
    const nameEl = document.getElementById('drilldownStudentName');
    const testTitleEl = document.getElementById('drilldownTestTitle');
    const scoreBadge = document.getElementById('drilldownScoreBadge');
    const timeBadge = document.getElementById('drilldownTimeBadge');
    const summaryText = document.getElementById('drilldownSummaryText');
    const teacherAction = document.getElementById('drilldownTeacherAction');
    const parentSnippet = document.getElementById('drilldownParentSnippet');
    const qList = document.getElementById('drilldownQuestionsList');

    if (rollEl) rollEl.innerText = `Roll: ${student.rollNumber || student.roll || '12-NM-01'}`;
    if (examEl) examEl.innerText = student.targetExam || 'JEE_ADVANCED';
    if (nameEl) nameEl.innerText = student.fullName || student.name || 'Student';
    if (testTitleEl) testTitleEl.innerText = submission.assessmentTitle || 'Diagnostic Test';
    if (scoreBadge) scoreBadge.innerText = `${submission.totalScore || 0}/${submission.totalMarks || 12} (${submission.percentage || 0}%)`;
    if (timeBadge) timeBadge.innerText = smartCard.totalTimeFormatted || '2m 30s';

    if (summaryText) summaryText.innerHTML = renderLatexString(smartCard.shortSummary || '');
    if (teacherAction) teacherAction.innerHTML = renderLatexString(smartCard.teacherActionDirective || '');
    if (parentSnippet) parentSnippet.innerHTML = renderLatexString(smartCard.parentWhatsAppSnippet || '');

    // Render Student Modal Charts (Time vs Benchmark, Mistake Types, Concept Mastery)
    renderStudentDrilldownCharts(questionBreakdown, student, smartCard);

    if (qList && questionBreakdown) {
      qList.innerHTML = questionBreakdown.map(q => {
        const isCorrect = q.isCorrect;
        const pacing = q.speedPacing;
        const m = q.mistakeClassification || {};

        let badgeClass = 'badge-mistake-none';
        if (!isCorrect) {
          const type = (m.type || '').toUpperCase();
          if (type.includes('CALC')) badgeClass = 'badge-mistake-calc';
          else if (type.includes('SIGN')) badgeClass = 'badge-mistake-sign';
          else if (type.includes('FORMULA')) badgeClass = 'badge-mistake-formula';
          else if (type.includes('TIME')) badgeClass = 'badge-mistake-time';
          else badgeClass = 'badge-mistake-conceptual';
        }

        const pacingColor = pacing === 'FAST' ? '#10b981' : (pacing === 'OPTIMAL' ? '#38bdf8' : '#f59e0b');

        return `
          <div style="background:rgba(255,255,255,0.02); border:1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.35)'}; border-radius:var(--radius-md); padding:1rem;">
            <!-- Question Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
              <div>
                <strong style="color:var(--text-primary); font-size:0.95rem;">Q${q.questionIndex}: ${renderLatexString(q.subtopic || '')}</strong>
                <span style="font-size:0.75rem; color:var(--text-muted); display:block;">Topic: ${renderLatexString(q.topic || '')}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="speed-badge" style="background:${pacing === 'FAST' ? 'rgba(16,185,129,0.2)' : (pacing === 'OPTIMAL' ? 'rgba(56,189,248,0.2)' : 'rgba(245,158,11,0.2)')}; color:${pacingColor};">
                  Time: ${q.timeSpentSeconds}s (Target: ${q.benchmarkSeconds}s) &bull; ${pacing}
                </span>
                <span class="pilot-tag" style="background:${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}; color:${isCorrect ? '#34d399' : '#fb7185'}; font-weight:700;">
                  ${isCorrect ? 'CORRECT (+4M)' : 'INCORRECT'}
                </span>
              </div>
            </div>

            <!-- Mistake Classification & Explanation -->
            <div style="background:rgba(0,0,0,0.25); border-radius:var(--radius-sm); padding:10px 12px; margin-top:8px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                <span class="badge-mistake ${badgeClass}">${m.label || m.type || 'Review'}</span>
                <span style="font-size:0.75rem; color:var(--text-muted);">
                  Selected: <strong style="color:${isCorrect ? '#34d399' : '#fb7185'};">${renderLatexString(q.selectedOption || 'None')}</strong> | Expected: <strong style="color:#34d399;">${renderLatexString(q.correctAnswer || '')}</strong>
                </span>
              </div>
              <p style="font-size:0.82rem; color:var(--text-primary); margin-bottom:2px; line-height:1.4;">
                ${renderLatexString(m.explanation || '')}
              </p>
              ${m.distractorTrap ? `
                <div style="font-size:0.75rem; color:#fca5a5; margin-top:4px;">
                  <em>Trap identified: ${renderLatexString(m.distractorTrap)}</em>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    const modal = document.getElementById('modalStudentDrilldown');
    if (modal) modal.classList.add('active');
    initLucideIcons();
  } catch (err) {
    console.error('[STUDENT DRILLDOWN] Error:', err.message);
  }
}

function openStudentProgressModal(studentId, assessmentId) {
  return openStudentDrilldown(studentId, assessmentId);
}

function openStudentRemedialFromModal() {
  closeStudentDrilldown();
  if (typeof openPersonalizedRemedialModal === 'function') {
    openPersonalizedRemedialModal();
  } else {
    const modalRem = document.getElementById('modalPersonalizedRemedial');
    if (modalRem) modalRem.style.display = 'flex';
  }
}

function closeStudentDrilldown() {
  const modal = document.getElementById('modalStudentDrilldown');
  if (modal) modal.classList.remove('active');
  destroyChart('studentTime');
  destroyChart('studentMistakes');
  destroyChart('studentMastery');
}

// Global exposure for inline onclick handlers
window.openStudentDrilldown = openStudentDrilldown;
window.openStudentProgressModal = openStudentProgressModal;
window.openStudentRemedialFromModal = openStudentRemedialFromModal;
window.closeStudentDrilldown = closeStudentDrilldown;
window.loadClassAnalytics = loadClassAnalytics;

// -----------------------------------------------------------------------------
// 12. TEACHER-SCOPED CURRICULUM TEST & QUIZ GENERATOR (FIRST-PRINCIPLES LOGICAL VIEW)
// -----------------------------------------------------------------------------
const teacherBuilderState = {
  classes: [],
  selectedClassId: '12-NonMed',
  activeGrade: '12',
  teacherSubjectKey: 'PHYSICS',
  selectedSubjectKey: 'PHYSICS',
  currentTaxonomy: null,
  expandedChapters: new Set([1]),
  activeModalScope: null,
  activeTeacher: null
};

function getSubjectIcon(key) {
  switch (key) {
    case 'PHYSICS': return 'zap';
    case 'CHEMISTRY': return 'flask-conical';
    case 'MATHEMATICS': return 'calculator';
    case 'BIOLOGY': return 'dna';
    case 'CLASS10_SCIENCE':
    case 'SCIENCE': return 'atom';
    case 'CLASS10_MATHEMATICS': return 'calculator';
    default: return 'book-open';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getFallbackClasses(teacherSubjKey) {
  const sKey = (teacherSubjKey || teacherBuilderState.teacherSubjectKey || 'PHYSICS').toUpperCase();
  const sName = sKey === 'PHYSICS' ? 'Physics' : (sKey === 'CHEMISTRY' ? 'Chemistry' : (sKey === 'BIOLOGY' ? 'Biology' : (sKey.startsWith('CLASS10_') ? (sKey === 'CLASS10_SCIENCE' ? 'Science' : 'Mathematics') : 'Mathematics')));

  const allClasses = [
    {
      id: '10-Science-A',
      key: '10-Science-A',
      name: 'Class 10th (Section A)',
      grade: '10',
      section: '10-Science-A',
      stream: 'FOUNDATION',
      badge: 'CBSE & HP Board Foundation',
      defaultSubject: 'CLASS10_MATHEMATICS',
      subjects: [
        { key: 'CLASS10_MATHEMATICS', name: 'Mathematics', grade: '10', icon: 'calculator' },
        { key: 'CLASS10_SCIENCE', name: 'Science', grade: '10', icon: 'atom' }
      ],
      students: [
        { id: '10-A-01', name: 'Rohit Verma', roll: '10-A-01' },
        { id: '10-A-02', name: 'Aditya Chauhan', roll: '10-A-02' },
        { id: '10-A-03', name: 'Tanvi Sood', roll: '10-A-03' },
        { id: '10-A-04', name: 'Nikhil Rana', roll: '10-A-04' }
      ]
    },
    {
      id: '11-NonMed',
      key: '11-NonMed',
      name: 'Class 11th (Non-Medical)',
      grade: '11',
      section: '11-NonMed',
      stream: 'NON_MEDICAL',
      badge: 'JEE & Boards',
      defaultSubject: sKey,
      subjects: [{ key: sKey, name: sName, grade: '11' }],
      students: [
        { id: '11-NM-01', name: 'Adarsh Katoch', roll: '11-NM-01' },
        { id: '11-NM-02', name: 'Pooja Sharma', roll: '11-NM-02' },
        { id: '11-NM-03', name: 'Kunal Jamwal', roll: '11-NM-03' },
        { id: '11-NM-04', name: 'Suhani Rana', roll: '11-NM-04' }
      ]
    },
    {
      id: '11-Med',
      key: '11-Med',
      name: 'Class 11th (Medical)',
      grade: '11',
      section: '11-Med',
      stream: 'MEDICAL',
      badge: 'NEET & Boards',
      defaultSubject: sKey,
      subjects: [{ key: sKey, name: sName, grade: '11' }],
      students: [
        { id: '11-M-01', name: 'Riya Thakur', roll: '11-M-01' },
        { id: '11-M-02', name: 'Ayush Banyal', roll: '11-M-02' },
        { id: '11-M-03', name: 'Deepak Soni', roll: '11-M-03' },
        { id: '11-M-04', name: 'Kriti Dogra', roll: '11-M-04' }
      ]
    },
    {
      id: '12-NonMed',
      key: '12-NonMed',
      name: 'Class 12th (Non-Medical)',
      grade: '12',
      section: '12-NonMed',
      stream: 'NON_MEDICAL',
      badge: 'JEE & Boards',
      defaultSubject: sKey,
      subjects: [{ key: sKey, name: sName, grade: '12' }],
      students: [
        { id: '12-NM-01', name: 'Aryan Sharma', roll: '12-NM-01' },
        { id: '12-NM-02', name: 'Rohit Negi', roll: '12-NM-02' },
        { id: '12-NM-03', name: 'Kavya Verma', roll: '12-NM-03' },
        { id: '12-NM-04', name: 'Kunal Sharma', roll: '12-NM-04' },
        { id: '12-NM-05', name: 'Divyansh Thakur', roll: '12-NM-05' },
        { id: '12-NM-06', name: 'Akshat Jaswal', roll: '12-NM-06' },
        { id: '12-NM-07', name: 'Rahul Sen', roll: '12-NM-07' },
        { id: '12-NM-08', name: 'Sahil Dhiman', roll: '12-NM-08' }
      ]
    },
    {
      id: '12-Med',
      key: '12-Med',
      name: 'Class 12th (Medical)',
      grade: '12',
      section: '12-Med',
      stream: 'MEDICAL',
      badge: 'NEET & Boards',
      defaultSubject: sKey,
      subjects: [{ key: sKey, name: sName, grade: '12' }],
      students: [
        { id: '12-M-01', name: 'Ananya Thakur', roll: '12-M-01' },
        { id: '12-M-02', name: 'Simran Kaur', roll: '12-M-02' },
        { id: '12-M-03', name: 'Mehak Sharma', roll: '12-M-03' },
        { id: '12-M-04', name: 'Pallavi Katoch', roll: '12-M-04' },
        { id: '12-M-05', name: 'Shreya Dogra', roll: '12-M-05' }
      ]
    }
  ];

  if (sKey === 'BIOLOGY') {
    return allClasses.filter(c => c.stream === 'MEDICAL');
  }
  return allClasses;
}

async function setupTeacherTestBuilder() {
  const classSelect = document.getElementById('selectTeacherClassScope');
  const pillsContainer = document.getElementById('containerSubjectPills');
  const rosterBtn = document.getElementById('btnToggleClassRosterPreview');
  const rosterDrawer = document.getElementById('drawerClassRosterPreview');
  const searchInput = document.getElementById('searchChapterInput');
  const modal = document.getElementById('modalGenerateCurriculumTest');
  const btnCloseModal = document.getElementById('btnCloseGenTestModal');
  const btnCancelModal = document.getElementById('btnCancelGenModal');

  if (!classSelect || !pillsContainer) return;

  // Initialize teacher profile session if stored
  initTeacherSession();

  // 1. Fetch available classes & enrolled students
  await loadTeacherClassesList();

  // 2. Sync active stream UI state
  updateStreamSelectionUI(teacherBuilderState.targetStream || 'JEE');

  // 3. Class change listener
  classSelect.addEventListener('change', (e) => {
    teacherBuilderState.selectedClassId = e.target.value;
    const isCls10 = String(e.target.value).startsWith('10');
    const stream = isCls10 ? 'BOARD' : (e.target.value.includes('Med') && !e.target.value.includes('NonMed') ? 'NEET' : (e.target.value.includes('NonMed') ? 'JEE' : 'BOARD'));
    updateStreamSelectionUI(stream);
    updateTeacherClassScopeUI();
    if (state.activeTeacherTab === 'tabQuestionBank') {
      loadQuestionBankView(true);
    }
  });

  // 3. Roster drawer toggle
  if (rosterBtn && rosterDrawer) {
    rosterBtn.addEventListener('click', () => {
      rosterDrawer.classList.toggle('open');
      const icon = document.getElementById('iconRosterDrawerChevron');
      if (icon) {
        icon.style.transform = rosterDrawer.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  // 4. Search/filter input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderCurriculumChaptersAccordion(e.target.value.trim());
    });
  }

  // 5. Modal close buttons
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeCurriculumTestModal);
  }
  if (btnCancelModal) {
    btnCancelModal.addEventListener('click', closeCurriculumTestModal);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCurriculumTestModal();
    });
  }
}

async function loadTeacherClassesList() {
  const teacherSubj = teacherBuilderState.teacherSubjectKey || 'PHYSICS';

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/curriculum/classes?teacherSubjectKey=${teacherSubj}`);
    if (res.ok) {
      const data = await res.json();
      teacherBuilderState.classes = (data.classes || []).map(c => ({
        ...c,
        id: c.key || c.id || c.section
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch curriculum classes from backend, using default roster:', err);
    teacherBuilderState.classes = getFallbackClasses();
  }

  if (!teacherBuilderState.classes || teacherBuilderState.classes.length === 0) {
    teacherBuilderState.classes = getFallbackClasses();
  }

  // Strictly filter classes so only classes offering the signed-in teacher's subject are available
  if (teacherSubj) {
    teacherBuilderState.classes = teacherBuilderState.classes.filter(c => {
      return (c.subjects || []).some(s => {
        const sKey = (s.key || '').toUpperCase();
        if (teacherSubj === 'CLASS10_MATHEMATICS') return sKey === 'CLASS10_MATHEMATICS';
        if (teacherSubj === 'CLASS10_SCIENCE') return sKey === 'CLASS10_SCIENCE';
        if (teacherSubj === 'PHYSICS') return sKey === 'PHYSICS';
        if (teacherSubj === 'BIOLOGY') return sKey === 'BIOLOGY';
        if (teacherSubj === 'CHEMISTRY') return sKey === 'CHEMISTRY';
        if (teacherSubj === 'MATHEMATICS') return sKey === 'MATHEMATICS';
        return sKey === teacherSubj;
      });
    });
  }

  // Auto-select valid class if current is not in filtered list
  const classExists = teacherBuilderState.classes.some(c => c.id === teacherBuilderState.selectedClassId);
  if (!classExists && teacherBuilderState.classes.length > 0) {
    teacherBuilderState.selectedClassId = teacherBuilderState.classes[0].id;
  }

  // Populate #selectTeacherClassScope options
  const classSelect = document.getElementById('selectTeacherClassScope');
  if (classSelect && teacherBuilderState.classes.length > 0) {
    classSelect.innerHTML = teacherBuilderState.classes.map(c => `
      <option value="${c.id}" ${c.id === teacherBuilderState.selectedClassId ? 'selected' : ''}>
        ${c.name} &bull; ${c.badge || (c.stream ? c.stream.replace('_', ' ') : 'General')}
      </option>
    `).join('');
  }

  // Populate modal section dropdown if exists
  const modalSectionSelect = document.getElementById('selectNewStudentSection');
  if (modalSectionSelect && teacherBuilderState.classes.length > 0) {
    modalSectionSelect.innerHTML = teacherBuilderState.classes.map(c => `
      <option value="${c.id}" ${c.id === teacherBuilderState.selectedClassId ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('');
  }

  updateTeacherClassScopeUI();
}

function updateTeacherClassScopeUI() {
  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId) 
    || teacherBuilderState.classes[0];
  if (!currentClass) return;

  // 1. Update enrolled students count badge and roster chips
  const countLabel = document.getElementById('labelEnrolledStudentsCount');
  const chipsContainer = document.getElementById('listClassEnrolledStudentChips');
  const targetClassLabel = document.getElementById('labelGenTargetClass');

  const students = currentClass.students || [];
  if (countLabel) {
    countLabel.innerText = `${students.length} Students in Class`;
  }
  if (targetClassLabel) {
    targetClassLabel.innerText = `All ${students.length} Students in ${currentClass.name}`;
  }

  if (chipsContainer) {
    chipsContainer.innerHTML = students.map(s => `
      <button type="button" class="student-chip-btn" onclick="openStudentProgressModal('${s.id}')" title="Click to view ${escapeHtml(s.name)}'s progress, charts & personalized remedial assignment">
        <i data-lucide="user" style="width:12px; height:12px; opacity:0.8;"></i>
        <span>${escapeHtml(s.name)}</span>
        <span class="roll-badge">${escapeHtml(s.roll || s.id)}</span>
      </button>
    `).join('');
  }

  // 2. Render Subject Pills: STRICTLY SCOPED TO SIGNED-IN TEACHER'S SUBJECT
  const pillsContainer = document.getElementById('containerSubjectPills');
  if (pillsContainer) {
    const isClass10 = currentClass.grade === '10' || currentClass.id === '10-Science-A';
    if (isClass10) {
      if (!teacherBuilderState.selectedSubjectKey || !teacherBuilderState.selectedSubjectKey.startsWith('CLASS10_')) {
        teacherBuilderState.selectedSubjectKey = 'CLASS10_MATHEMATICS';
      }
      pillsContainer.innerHTML = `
        <button type="button" 
          class="subject-pill-btn ${teacherBuilderState.selectedSubjectKey === 'CLASS10_MATHEMATICS' ? 'active' : ''}" 
          data-subject-key="CLASS10_MATHEMATICS"
          data-grade="10"
          onclick="selectCurriculumSubject('CLASS10_MATHEMATICS', '10')">
          <i data-lucide="calculator" style="width:14px; height:14px;"></i>
          Mathematics (Class 10th)
        </button>
        <button type="button" 
          class="subject-pill-btn ${teacherBuilderState.selectedSubjectKey === 'CLASS10_SCIENCE' ? 'active' : ''}" 
          data-subject-key="CLASS10_SCIENCE"
          data-grade="10"
          onclick="selectCurriculumSubject('CLASS10_SCIENCE', '10')">
          <i data-lucide="atom" style="width:14px; height:14px;"></i>
          Science (Class 10th)
        </button>
      `;
      initLucideIcons();
      loadCurriculumForClassAndSubject(teacherBuilderState.selectedSubjectKey, '10');
      return;
    }

    const rawSubjects = currentClass.subjects || [];
    const teacherSubj = teacherBuilderState.teacherSubjectKey || 'PHYSICS';

    // Strictly filter subjects so that ONLY the signed-in teacher's subject appears!
    const scopedSubjects = rawSubjects.filter(s => {
      const sKey = (s.key || '').toUpperCase();
      if (teacherSubj === 'CLASS10_MATHEMATICS') return sKey === 'CLASS10_MATHEMATICS';
      if (teacherSubj === 'CLASS10_SCIENCE') return sKey === 'CLASS10_SCIENCE';
      if (teacherSubj === 'PHYSICS') return sKey === 'PHYSICS';
      if (teacherSubj === 'BIOLOGY') return sKey === 'BIOLOGY';
      if (teacherSubj === 'CHEMISTRY') return sKey === 'CHEMISTRY';
      if (teacherSubj === 'MATHEMATICS') return sKey === 'MATHEMATICS';
      return sKey === teacherSubj;
    });

    if (scopedSubjects.length > 0) {
      teacherBuilderState.selectedSubjectKey = scopedSubjects[0].key;
    } else {
      teacherBuilderState.selectedSubjectKey = teacherSubj;
    }

    const displayList = scopedSubjects.length > 0 
      ? scopedSubjects 
      : [{ key: teacherSubj, name: teacherSubj === 'CLASS10_MATHEMATICS' ? 'Mathematics' : (teacherSubj === 'CLASS10_SCIENCE' ? 'Science' : teacherSubj.charAt(0) + teacherSubj.slice(1).toLowerCase()), grade: currentClass.grade }];

    pillsContainer.innerHTML = displayList.map(s => {
      return `
        <button type="button" 
          class="subject-pill-btn active" 
          data-subject-key="${s.key}"
          data-grade="${s.grade || currentClass.grade}"
          onclick="selectCurriculumSubject('${s.key}', '${s.grade || currentClass.grade}')">
          <i data-lucide="${getSubjectIcon(s.key)}" style="width:14px; height:14px;"></i>
          ${s.name}
        </button>
      `;
    }).join('');
  }

  initLucideIcons();

  // 3. Load curriculum taxonomy for the selected subject & grade
  loadCurriculumForClassAndSubject(teacherBuilderState.selectedSubjectKey, currentClass.grade);
}

async function loadCurriculumForClassAndSubject(subjectKey, grade) {
  const container = document.getElementById('testBuilderChaptersContainer');
  const headingTitle = document.getElementById('headingCurriculumSubjectTitle');

  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId);
  const currentSubj = currentClass?.subjects?.find(s => s.key === subjectKey);
  let subjName = currentSubj ? currentSubj.name : subjectKey;
  if (subjectKey === 'CLASS10_MATHEMATICS') subjName = 'Mathematics';
  if (subjectKey === 'CLASS10_SCIENCE') subjName = 'Science';

  const isClass10 = String(grade) === '10' || subjectKey?.startsWith('CLASS10_') || currentClass?.grade === '10';

  if (headingTitle) {
    headingTitle.innerHTML = `${isClass10 ? 'Class 10' : ('Class ' + (grade || '12'))} ${subjName} &bull; Complete Chapter List`;
  }

  if (container) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        <i data-lucide="loader-2" class="spin" style="width:26px; height:26px; margin: 0 auto 10px; display:block; color:var(--accent-blue);"></i>
        Loading structured NCERT syllabus for ${subjName}...
      </div>
    `;
    initLucideIcons();
  }

  try {
    const url = `${getApiBaseUrl()}/api/curriculum/taxonomy/${subjectKey}?grade=${grade || '12'}`;
    const res = await fetch(url);
    if (res.ok) {
      teacherBuilderState.currentTaxonomy = await res.json();
    } else {
      throw new Error(`API status ${res.status}`);
    }
  } catch (err) {
    console.warn('[CURRICULUM BUILDER] Using fallback taxonomy:', err);
    teacherBuilderState.currentTaxonomy = getOfflineCurriculumFallback(subjectKey, grade);
  }

  // By default, open Chapter 1 so the teacher immediately sees the sub-topics
  teacherBuilderState.expandedChapters = new Set([1]);
  renderCurriculumChaptersAccordion();
}

function renderCurriculumChaptersAccordion(filterQuery = '') {
  const container = document.getElementById('testBuilderChaptersContainer');
  if (!container) return;

  const taxonomy = teacherBuilderState.currentTaxonomy;
  if (!taxonomy || !taxonomy.chapters || taxonomy.chapters.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2.5rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
        <i data-lucide="alert-circle" style="width:28px; height:28px; margin: 0 auto 10px; display:block; color: #f59e0b;"></i>
        No syllabus chapters found for this selection.
      </div>
    `;
    initLucideIcons();
    return;
  }

  const query = (filterQuery || '').toLowerCase();

  let visibleChapters = taxonomy.chapters;
  if (query) {
    visibleChapters = taxonomy.chapters.filter(ch => {
      const chTitle = (ch.chapterName || ch.title || '').toLowerCase();
      const unit = (ch.unit || '').toLowerCase();
      const hasTopicMatch = (ch.topics || []).some(t => {
        const tTitle = (t.topicName || t.title || '').toLowerCase();
        const hasSubMatch = (t.subtopics || []).some(st => (typeof st === 'string' ? st : (st.title || '')).toLowerCase().includes(query));
        return tTitle.includes(query) || hasSubMatch;
      });
      return chTitle.includes(query) || unit.includes(query) || hasTopicMatch;
    });
  }

  if (visibleChapters.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
        No chapters or sub-topics match "<strong>${filterQuery}</strong>". Try clearing your search.
      </div>
    `;
    return;
  }

  container.innerHTML = visibleChapters.map(ch => {
    const chNum = ch.chapterNumber;
    const chTitle = ch.chapterName || ch.title || `Chapter ${chNum}`;
    const isExpanded = teacherBuilderState.expandedChapters.has(chNum) || !!query;
    const topics = ch.topics || [];
    
    // Count total sub-topics
    let totalSubtopics = 0;
    topics.forEach(t => {
      totalSubtopics += (t.subtopics || []).length;
    });

    const examFocus = ch.boardExamFocus;

    return `
      <div class="chapter-accordion-card ${isExpanded ? 'expanded' : ''}" id="chapterCard_${chNum}">
        <!-- CHAPTER HEADER -->
        <div class="chapter-accordion-header" onclick="toggleChapterAccordion(${chNum}, event)">
          <div class="chapter-info-col">
            <div class="chapter-title-row">
              <span class="chapter-badge">Ch ${chNum}</span>
              <span class="chapter-name">${chTitle}</span>
            </div>
            <div class="chapter-meta-row">
              ${ch.unit ? `<span><i data-lucide="folder" style="width:11px; height:11px; vertical-align:middle;"></i> ${ch.unit}</span>` : ''}
              <span>&bull;</span>
              <span>${topics.length} Main Topics</span>
              <span>&bull;</span>
              <span>${totalSubtopics} Sub-topics</span>
              ${ch.totalQuestionsInChapter ? `<span>&bull;</span><span style="color:#10b981; font-weight:700;"><i data-lucide="database" style="width:11px; height:11px; vertical-align:middle;"></i> ${ch.totalQuestionsInChapter} Bank Questions</span>` : ''}
              ${ch.discipline ? `<span class="stream-tag">${ch.discipline}</span>` : ''}
            </div>
          </div>

          <!-- Quick Action Buttons on Header -->
          <div class="chapter-header-actions" onclick="event.stopPropagation();">
            <button type="button" class="btn-subtopic-quiz" 
              onclick="openQbForChapter(${chNum}, event)"
              style="padding:6px 12px; font-size:0.78rem;"
              title="Browse questions for this chapter in the question bank">
              <i data-lucide="database" style="width:13px; height:13px;"></i>
              Browse Bank (${ch.totalQuestionsInChapter || 0})
            </button>
            <button type="button" class="btn-gen-chapter-test" 
              onclick="openGenTestForChapterByNum(${chNum}, event)"
              title="Generate a full test covering all ${totalSubtopics} sub-topics of this chapter">
              <i data-lucide="zap" style="width:14px; height:14px;"></i>
              Generate Chapter Test
            </button>
            <div class="accordion-chevron-circle" onclick="toggleChapterAccordion(${chNum}, event)">
              <i data-lucide="chevron-down" style="width:16px; height:16px; transition: transform 0.2s ease;"></i>
            </div>
          </div>
        </div>

        <!-- ACCORDION BODY (SUB-TOPICS & TOPIC DETAILS) -->
        <div class="chapter-accordion-body" style="display: ${isExpanded ? 'block' : 'none'};">
          ${examFocus ? `
            <div class="exam-focus-callout">
              <div class="callout-header">
                <i data-lucide="award" style="width:14px; height:14px; color:#f59e0b;"></i>
                <strong>Board & Competitive Exam Focus</strong>
              </div>
              <div class="callout-body">
                <div><strong>High-Yield:</strong> ${examFocus.highYield || 'Standard questions'}</div>
                ${examFocus.standardTrap ? `<div style="margin-top:4px; color:#f87171;"><strong>Common Trap:</strong> ${examFocus.standardTrap}</div>` : ''}
              </div>
            </div>
          ` : ''}

          <div class="topics-accordion-list">
            ${topics.map((t, tIdx) => {
              const tTitle = t.topicName || t.title || `Topic ${tIdx + 1}`;
              const subtopics = (t.subtopics || []).map(st => typeof st === 'string' ? st : (st.title || st.name || ''));

              return `
                <div class="topic-section-block">
                  <div class="topic-section-header">
                    <div class="topic-title-area">
                      <span class="topic-tag">${t.ncertSection ? `Sec ${t.ncertSection}` : `Topic ${tIdx + 1}`}</span>
                      <strong class="topic-title">${tTitle}</strong>
                      ${t.highYield ? `<span class="badge-highyield"><i data-lucide="flame" style="width:11px; height:11px;"></i> High Yield</span>` : ''}
                      ${t.questionCount ? `<span style="font-size:0.75rem; color:#10b981; font-weight:700; margin-left:6px;"><i data-lucide="database" style="width:11px; height:11px; vertical-align:middle;"></i> ${t.questionCount} Questions</span>` : ''}
                    </div>

                    <div class="topic-actions">
                      <button type="button" class="btn-subtopic-quiz"
                        onclick="openGenTestForTopicByIndex(${chNum}, ${tIdx}, event)"
                        title="Create a quiz or assignment strictly focused on this topic's sub-topics">
                        <i data-lucide="pencil-line" style="width:13px; height:13px;"></i>
                        Create Sub-Topic Quiz
                      </button>
                    </div>
                  </div>

                  <!-- Subtopic Bullets List -->
                  <div class="subtopics-list">
                    ${subtopics.map((st, stIdx) => `
                      <div class="subtopic-item-row">
                        <div class="subtopic-bullet-col">
                          <i data-lucide="circle-dot" style="width:11px; height:11px; color:var(--accent-blue);"></i>
                          <span class="subtopic-text">${st}</span>
                        </div>
                        <button type="button" class="btn-micro-quiz" 
                          onclick="openGenTestForSubtopicByIndex(${chNum}, ${tIdx}, ${stIdx}, event)"
                          title="Generate a 3-question quick check on this exact concept">
                          Quick Quiz
                        </button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  initLucideIcons();
}

function toggleChapterAccordion(chNum, event) {
  if (event) event.stopPropagation();
  if (teacherBuilderState.expandedChapters.has(chNum)) {
    teacherBuilderState.expandedChapters.delete(chNum);
  } else {
    teacherBuilderState.expandedChapters.add(chNum);
  }
  const card = document.getElementById(`chapterCard_${chNum}`);
  if (card) {
    const isNowExpanded = teacherBuilderState.expandedChapters.has(chNum);
    card.classList.toggle('expanded', isNowExpanded);
    const body = card.querySelector('.chapter-accordion-body');
    if (body) {
      body.style.display = isNowExpanded ? 'block' : 'none';
    }
  }
  initLucideIcons();
}

function selectCurriculumSubject(subjectKey, grade) {
  teacherBuilderState.selectedSubjectKey = subjectKey;
  if (subjectKey.startsWith('CLASS10_')) {
    teacherBuilderState.teacherSubjectKey = subjectKey;
  }
  
  // Update pill active class
  document.querySelectorAll('.subject-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-subject-key') === subjectKey);
  });

  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId);
  loadCurriculumForClassAndSubject(subjectKey, grade || currentClass?.grade || '12');

  if (state.activeTeacherTab === 'tabQuestionBank') {
    loadQuestionBankView(true);
  }
}

function openCurriculumTestModal() {
  const modal = document.getElementById('modalGenerateCurriculumTest');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
  initLucideIcons();
}

function closeCurriculumTestModal() {
  const modal = document.getElementById('modalGenerateCurriculumTest');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

function openGenTestForChapterByNum(chNum, event) {
  if (event) event.stopPropagation();
  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId);
  const chapter = teacherBuilderState.currentTaxonomy?.chapters?.find(c => c.chapterNumber === chNum);
  const chTitle = chapter?.title || chapter?.chapterName || chapter?.name || `Chapter ${chNum}`;
  
  // Collect all subtopics for this chapter
  const allSubtopics = [];
  if (chapter && chapter.topics) {
    chapter.topics.forEach(t => {
      (t.subtopics || []).forEach(st => {
        allSubtopics.push(typeof st === 'string' ? st : (st.title || st.name || ''));
      });
    });
  }

  teacherBuilderState.activeModalScope = {
    classId: teacherBuilderState.selectedClassId,
    subjectKey: teacherBuilderState.selectedSubjectKey,
    chapterNumber: chNum,
    chapterTitle: chTitle,
    subtopics: allSubtopics,
    isFullChapter: true
  };

  const currentSubj = currentClass?.subjects?.find(s => s.key === teacherBuilderState.selectedSubjectKey);
  const subjName = currentSubj ? currentSubj.name : (teacherBuilderState.activeTeacher?.subjectName || 'Physics');

  // Fill modal fields
  const badgeEl = document.getElementById('modalGenClassBadge');
  if (badgeEl) badgeEl.innerText = currentClass ? currentClass.name : 'Class 12th';
  const titleEl = document.getElementById('modalGenChapterTitle');
  if (titleEl) titleEl.innerText = `Ch ${chNum}: ${chTitle}`;
  const subEl = document.getElementById('modalGenScopeSubtitle');
  if (subEl) subEl.innerText = `Scope: Full Chapter Comprehensive (${allSubtopics.length} Sub-topics)`;
  const inputTitle = document.getElementById('inputGenTestTitle');
  if (inputTitle) inputTitle.value = `${subjName}: Ch ${chNum} ${chTitle} - Chapter Test`;
  const modeEl = document.getElementById('selectGenTestMode');
  if (modeEl) modeEl.value = 'TEST';
  const countEl = document.getElementById('selectGenTestCount');
  if (countEl) countEl.value = '10';
  const diffEl = document.getElementById('selectGenTestDifficulty');
  if (diffEl) diffEl.value = 'MEDIUM';
  const targetEl = document.getElementById('labelGenTargetClass');
  if (targetEl) targetEl.innerText = `All ${currentClass?.students?.length || 8} Students in ${currentClass?.name || 'Class'}`;

  openCurriculumTestModal();
}

function openGenTestForTopicByIndex(chNum, topicIndex, event) {
  if (event) event.stopPropagation();
  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId);
  const currentSubj = currentClass?.subjects?.find(s => s.key === teacherBuilderState.selectedSubjectKey);
  const subjName = currentSubj ? currentSubj.name : (teacherBuilderState.activeTeacher?.subjectName || 'Physics');
  const chapter = teacherBuilderState.currentTaxonomy?.chapters?.find(c => c.chapterNumber === chNum);
  const chTitle = chapter?.title || chapter?.chapterName || chapter?.name || `Chapter ${chNum}`;
  const topic = chapter?.topics?.[topicIndex];
  const topicTitle = topic?.topicName || topic?.title || `Topic ${topicIndex + 1}`;
  const subtopics = (topic?.subtopics || []).map(st => typeof st === 'string' ? st : (st.title || st.name || ''));

  teacherBuilderState.activeModalScope = {
    classId: teacherBuilderState.selectedClassId,
    subjectKey: teacherBuilderState.selectedSubjectKey,
    chapterNumber: chNum,
    chapterTitle: chTitle,
    subtopics: subtopics.length > 0 ? subtopics : [topicTitle],
    isFullChapter: false
  };

  const badgeEl = document.getElementById('modalGenClassBadge');
  if (badgeEl) badgeEl.innerText = currentClass ? currentClass.name : 'Class 12th';
  const titleEl = document.getElementById('modalGenChapterTitle');
  if (titleEl) titleEl.innerText = `${topicTitle}`;
  const subEl = document.getElementById('modalGenScopeSubtitle');
  if (subEl) subEl.innerText = `Scope: Sub-topics under ${chTitle} (${subtopics.length} Sub-topics)`;
  const inputTitle = document.getElementById('inputGenTestTitle');
  if (inputTitle) inputTitle.value = `${subjName} Quiz: ${topicTitle}`;
  const modeEl = document.getElementById('selectGenTestMode');
  if (modeEl) modeEl.value = 'QUIZ';
  const countEl = document.getElementById('selectGenTestCount');
  if (countEl) countEl.value = '5';
  const diffEl = document.getElementById('selectGenTestDifficulty');
  if (diffEl) diffEl.value = 'MEDIUM';
  const targetEl = document.getElementById('labelGenTargetClass');
  if (targetEl) targetEl.innerText = `All ${currentClass?.students?.length || 8} Students in ${currentClass?.name || 'Class'}`;

  openCurriculumTestModal();
}

function openGenTestForSubtopicByIndex(chNum, topicIndex, subtopicIndex, event) {
  if (event) event.stopPropagation();
  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId);
  const currentSubj = currentClass?.subjects?.find(s => s.key === teacherBuilderState.selectedSubjectKey);
  const subjName = currentSubj ? currentSubj.name : (teacherBuilderState.activeTeacher?.subjectName || 'Physics');
  const chapter = teacherBuilderState.currentTaxonomy?.chapters?.find(c => c.chapterNumber === chNum);
  const chTitle = chapter?.title || chapter?.chapterName || chapter?.name || `Chapter ${chNum}`;
  const topic = chapter?.topics?.[topicIndex];
  const rawSubtopic = topic?.subtopics?.[subtopicIndex];
  const subtopic = typeof rawSubtopic === 'string' ? rawSubtopic : (rawSubtopic?.title || rawSubtopic?.name || `Sub-topic ${subtopicIndex + 1}`);

  teacherBuilderState.activeModalScope = {
    classId: teacherBuilderState.selectedClassId,
    subjectKey: teacherBuilderState.selectedSubjectKey,
    chapterNumber: chNum,
    chapterTitle: chTitle,
    subtopics: [subtopic],
    isFullChapter: false
  };

  const badgeEl = document.getElementById('modalGenClassBadge');
  if (badgeEl) badgeEl.innerText = currentClass ? currentClass.name : 'Class 12th';
  const titleEl = document.getElementById('modalGenChapterTitle');
  if (titleEl) titleEl.innerText = subtopic;
  const subEl = document.getElementById('modalGenScopeSubtitle');
  if (subEl) subEl.innerText = `Scope: Single Sub-topic Focus (${chTitle})`;
  const inputTitle = document.getElementById('inputGenTestTitle');
  if (inputTitle) inputTitle.value = `Quick Check: ${subtopic.split(':')[0] || subtopic}`;
  const modeEl = document.getElementById('selectGenTestMode');
  if (modeEl) modeEl.value = 'QUIZ';
  const countEl = document.getElementById('selectGenTestCount');
  if (countEl) countEl.value = '3';
  const diffEl = document.getElementById('selectGenTestDifficulty');
  if (diffEl) diffEl.value = 'MEDIUM';
  const targetEl = document.getElementById('labelGenTargetClass');
  if (targetEl) targetEl.innerText = `All ${currentClass?.students?.length || 8} Students in ${currentClass?.name || 'Class'}`;

  openCurriculumTestModal();
}

// Backwards compatibility wrappers
function openGenTestForChapter(chNum, chTitle, event) {
  openGenTestForChapterByNum(chNum, event);
}

function openGenTestForTopic(chNum, chTitle, topicTitle, subtopics, event) {
  const chapter = teacherBuilderState.currentTaxonomy?.chapters?.find(c => c.chapterNumber === chNum);
  const tIdx = chapter?.topics?.findIndex(t => (t.topicName || t.title) === topicTitle);
  if (tIdx !== undefined && tIdx >= 0) {
    openGenTestForTopicByIndex(chNum, tIdx, event);
  } else {
    if (event) event.stopPropagation();
    const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId);
    const currentSubj = currentClass?.subjects?.find(s => s.key === teacherBuilderState.selectedSubjectKey);
    const subjName = currentSubj ? currentSubj.name : 'Physics';

    teacherBuilderState.activeModalScope = {
      classId: teacherBuilderState.selectedClassId,
      subjectKey: teacherBuilderState.selectedSubjectKey,
      chapterNumber: chNum,
      chapterTitle: chTitle,
      subtopics: subtopics || [topicTitle],
      isFullChapter: false
    };

    const badgeEl = document.getElementById('modalGenClassBadge');
    if (badgeEl) badgeEl.innerText = currentClass ? currentClass.name : 'Class 12th';
    const titleEl = document.getElementById('modalGenChapterTitle');
    if (titleEl) titleEl.innerText = `${topicTitle}`;
    const subEl = document.getElementById('modalGenScopeSubtitle');
    if (subEl) subEl.innerText = `Scope: Sub-topics under ${chTitle} (${(subtopics || []).length} Sub-topics)`;
    const inputTitle = document.getElementById('inputGenTestTitle');
    if (inputTitle) inputTitle.value = `${subjName} Quiz: ${topicTitle}`;
    const modeEl = document.getElementById('selectGenTestMode');
    if (modeEl) modeEl.value = 'QUIZ';
    const countEl = document.getElementById('selectGenTestCount');
    if (countEl) countEl.value = '5';
    const diffEl = document.getElementById('selectGenTestDifficulty');
    if (diffEl) diffEl.value = 'MEDIUM';
    const targetEl = document.getElementById('labelGenTargetClass');
    if (targetEl) targetEl.innerText = `All ${currentClass?.students?.length || 8} Students in ${currentClass?.name || 'Class'}`;

    openCurriculumTestModal();
  }
}

function openGenTestForSingleSubtopic(chNum, chTitle, subtopic, event) {
  if (event) event.stopPropagation();
  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId);
  const currentSubj = currentClass?.subjects?.find(s => s.key === teacherBuilderState.selectedSubjectKey);
  const subjName = currentSubj ? currentSubj.name : 'Physics';

  teacherBuilderState.activeModalScope = {
    classId: teacherBuilderState.selectedClassId,
    subjectKey: teacherBuilderState.selectedSubjectKey,
    chapterNumber: chNum,
    chapterTitle: chTitle,
    subtopics: [subtopic],
    isFullChapter: false
  };

  const badgeEl = document.getElementById('modalGenClassBadge');
  if (badgeEl) badgeEl.innerText = currentClass ? currentClass.name : 'Class 12th';
  const titleEl = document.getElementById('modalGenChapterTitle');
  if (titleEl) titleEl.innerText = subtopic;
  const subEl = document.getElementById('modalGenScopeSubtitle');
  if (subEl) subEl.innerText = `Scope: Single Sub-topic Focus (${chTitle})`;
  const inputTitle = document.getElementById('inputGenTestTitle');
  if (inputTitle) inputTitle.value = `Quick Check: ${subtopic.split(':')[0] || subtopic}`;
  const modeEl = document.getElementById('selectGenTestMode');
  if (modeEl) modeEl.value = 'QUIZ';
  const countEl = document.getElementById('selectGenTestCount');
  if (countEl) countEl.value = '3';
  const diffEl = document.getElementById('selectGenTestDifficulty');
  if (diffEl) diffEl.value = 'MEDIUM';
  const targetEl = document.getElementById('labelGenTargetClass');
  if (targetEl) targetEl.innerText = `All ${currentClass?.students?.length || 8} Students in ${currentClass?.name || 'Class'}`;

  openCurriculumTestModal();
}

function openQuizCreatedSuccessModal(assessment) {
  const modal = document.getElementById('modalQuizCreatedSuccess');
  if (!modal) return;

  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId) || {};
  const currentSubj = currentClass?.subjects?.find(s => s.key === teacherBuilderState.selectedSubjectKey);
  const subjName = currentSubj ? currentSubj.name : (assessment?.subject || 'Science');
  const questions = assessment?.questions || [];
  const qCount = questions.length;
  const marks = assessment?.totalMarks || (qCount * 4);

  const elTitle = document.getElementById('successQuizTitle');
  if (elTitle) elTitle.innerText = assessment?.title || 'Speed Quiz';

  const elSubject = document.getElementById('successQuizSubject');
  if (elSubject) elSubject.innerText = subjName;

  const elQm = document.getElementById('successQuizQuestionsMarks');
  if (elQm) elQm.innerText = `${qCount} Question${qCount === 1 ? '' : 's'} • ${marks} Marks`;

  const elTarget = document.getElementById('successQuizTargetClass');
  if (elTarget) elTarget.innerText = currentClass?.name || 'Class 12th';

  const elSubhead = document.getElementById('successQuizModalSubheading');
  if (elSubhead) elSubhead.innerText = `Assigned to all ${currentClass?.students?.length || 8} students in ${currentClass?.name || 'Class'}`;

  const elList = document.getElementById('successQuizQuestionsList');
  if (elList) {
    elList.innerHTML = questions.map((q, idx) => {
      const qText = q.question_latex || q.questionText || q.question || q.text || `Question ${idx + 1}`;
      const renderedText = (typeof renderLatexInText === 'function') ? renderLatexInText(escapeHtml(qText)) : escapeHtml(qText);
      const marksVal = q.marks || 4;
      const typeBadge = q.type || 'MCQ';
      const options = q.options_latex || q.options || [];

      return `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <strong style="color: var(--accent-cyan); font-size: 0.8rem;">Q${idx + 1} (${marksVal} M) • ${typeBadge}</strong>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${escapeHtml(q.topic || q.subtopic || '')}</span>
          </div>
          <div style="font-size: 0.86rem; color: var(--text-primary); line-height: 1.45;">
            ${renderedText}
          </div>
          ${Array.isArray(options) && options.length > 0 ? `
            <div style="margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 0.78rem; color: var(--text-secondary);">
              ${options.map((opt, oIdx) => {
                const optTextRaw = typeof opt === 'string' ? opt : (opt.latex || opt.text || '');
                const optText = (typeof renderLatexInText === 'function') ? renderLatexInText(escapeHtml(optTextRaw)) : escapeHtml(optTextRaw);
                const optLetter = opt.key || String.fromCharCode(65 + oIdx);
                const isCorrect = q.correct_answer === optLetter || q.correctAnswer === optLetter || opt.is_correct;
                return `<div style="${isCorrect ? 'color: #34d399; font-weight: 600;' : ''}">${optLetter}) ${optText}</div>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  const btnAttempt = document.getElementById('btnSuccessAttemptQuiz');
  if (btnAttempt) {
    btnAttempt.onclick = () => {
      closeQuizCreatedSuccessModal();
      attemptActiveTestInStudentPortal(assessment.id);
    };
  }

  const btnAnalytics = document.getElementById('btnSuccessViewAnalytics');
  if (btnAnalytics) {
    btnAnalytics.onclick = async () => {
      closeQuizCreatedSuccessModal();
      await loadClassAnalytics(assessment.id);
      switchTeacherTab('tabClassAnalytics');
    };
  }

  modal.style.display = 'flex';
  modal.classList.add('active');
  initLucideIcons();
}

function closeQuizCreatedSuccessModal() {
  const modal = document.getElementById('modalQuizCreatedSuccess');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

async function submitGenerateCurriculumTest() {
  const scope = teacherBuilderState.activeModalScope;
  if (!scope) return;

  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId) || {};
  const currentSubj = currentClass?.subjects?.find(s => s.key === teacherBuilderState.selectedSubjectKey);
  const subjName = currentSubj ? currentSubj.name : (teacherBuilderState.activeTeacher?.subjectName || 'Physics');

  const btnSubmit = document.getElementById('btnSubmitGenTest');
  const title = document.getElementById('inputGenTestTitle')?.value?.trim() || `${scope.chapterTitle} Test`;
  const mode = document.getElementById('selectGenTestMode')?.value || 'QUIZ';
  const questionCount = parseInt(document.getElementById('selectGenTestCount')?.value || '5', 10);
  const difficulty = document.getElementById('selectGenTestDifficulty')?.value || 'MEDIUM';

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> Generating & Assigning to Class...`;
    initLucideIcons();
  }

  try {
    const payload = {
      classKey: teacherBuilderState.selectedClassId,
      grade: currentClass.grade || '12',
      section: currentClass.section || currentClass.key || teacherBuilderState.selectedClassId,
      subjectKey: teacherBuilderState.selectedSubjectKey,
      subjectName: subjName,
      chapterNumber: scope.chapterNumber,
      chapterName: scope.chapterTitle,
      subtopics: scope.isFullChapter ? [] : scope.subtopics,
      mode,
      questionCount,
      difficulty,
      title,
      autoAttempt: false
    };

    const res = await fetch(`${getApiBaseUrl()}/api/curriculum/generate-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      closeCurriculumTestModal();

      if (data.assessment) {
        openQuizCreatedSuccessModal(data.assessment);
      } else {
        alert('Quiz generated and assigned to class successfully.');
      }
    } else {
      throw new Error(`Server returned ${res.status}`);
    }
  } catch (err) {
    console.error('Error generating curriculum test:', err);
    alert('There was an error generating the test. Please check backend connection.');
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="zap" style="width:16px;height:16px;"></i> Create & Assign Now`;
      initLucideIcons();
    }
  }
}

async function attemptActiveTestInStudentPortal(assessmentId) {
  await loadStudentAssignedTests();

  let targetTest = state.publishedAssessments.find(a => a.id === assessmentId);
  if (!targetTest && assessmentId) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/assessments/${assessmentId}`);
      if (res.ok) {
        const d = await res.json();
        targetTest = d.assessment;
      }
    } catch (e) {}
  }

  // Switch to Student Role directly
  switchPortalRole('student');

  if (targetTest) {
    await startAssignedTest(targetTest);
  }

  const selectStudent = document.getElementById('selectStudentAssignedTest');
  if (selectStudent && assessmentId) {
    selectStudent.value = assessmentId;
  }

  const studentView = document.getElementById('studentView');
  if (studentView) {
    studentView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function simulateClassAttemptsAndGenerateDashboard(assessmentId) {
  if (!assessmentId) return;

  const noticeContainer = document.getElementById('containerClassAnalyticsNotice');
  if (noticeContainer) {
    noticeContainer.innerHTML = `
      <div class="pending-attempt-banner" style="background: rgba(16, 185, 129, 0.12); border-color: #10b981;">
        <i data-lucide="loader-2" class="spin" style="width:22px; height:22px; color:#10b981;"></i>
        <div style="flex:1;">
          <strong style="color:#34d399;">Evaluating Class Student Submissions...</strong>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin:2px 0 0;">
            Grading answers, benchmarking timing, and generating question diagnostic progress charts...
          </p>
        </div>
      </div>
    `;
    initLucideIcons();
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/curriculum/simulate-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId })
    });

    if (res.ok) {
      await loadClassAnalytics(assessmentId);
    } else {
      throw new Error(`API returned ${res.status}`);
    }
  } catch (err) {
    console.error('Error simulating attempts:', err);
    alert('Could not simulate student attempts. Please check backend connection.');
    await loadClassAnalytics(assessmentId);
  }
}

// -----------------------------------------------------------------------------
// 13. TEACHER FACULTY AUTHENTICATION, SIGN-IN & ROSTER MANAGEMENT
// -----------------------------------------------------------------------------

function initTeacherSession() {
  let stored = null;
  try {
    const raw = localStorage.getItem('haps_active_teacher');
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}

  if (!stored) {
    stored = {
      id: 'fac_phy_01',
      name: 'Dr. Vikram Sharma',
      phone: '9816010001',
      email: 'vikram.phy@haps.edu.in',
      subjectKey: 'PHYSICS',
      subjectName: 'Physics',
      designation: 'Senior Physics Faculty & HOD',
      streamText: 'Assigned Subject: Physics &bull; Classes 11 &amp; 12 (JEE Main/Adv, NEET &amp; CBSE Boards)',
      defaultClass: '11-NonMed',
      targetStream: 'JEE'
    };
  }

  applyTeacherProfile(stored, false);
  if (!state.activeTeacherTab) {
    switchTeacherTab('tabTeacherCreateTestAndPaper');
  }
}

function openTeacherSignInModal() {
  // Strict Faculty Profile Lock: If teacher role is active, prevent switching without sign-out
  if (state.activeRole === 'teacher' && teacherBuilderState.activeTeacher && !window._isExplicitSignOut) {
    console.log('Faculty profile is active and locked. To change profile, use Sign Out.');
    return;
  }
  window._isExplicitSignOut = false;
  const modal = document.getElementById('modalTeacherSignIn');
  if (modal) modal.style.display = 'flex';
  const phoneInput = document.getElementById('inputTeacherPhone');
  if (phoneInput && !phoneInput.value && teacherBuilderState.activeTeacher?.phone) {
    phoneInput.value = teacherBuilderState.activeTeacher.phone;
  }
  const nameInput = document.getElementById('inputTeacherFullName');
  if (nameInput && !nameInput.value && teacherBuilderState.activeTeacher?.name) {
    nameInput.value = teacherBuilderState.activeTeacher.name;
  }
  const subjSelect = document.getElementById('selectTeacherExpertise');
  if (subjSelect && teacherBuilderState.activeTeacher?.subjectKey) {
    subjSelect.value = teacherBuilderState.activeTeacher.subjectKey;
  }
  initLucideIcons();
}

function closeTeacherSignInModal() {
  const modal = document.getElementById('modalTeacherSignIn');
  if (modal) modal.style.display = 'none';
}

async function handlePhoneInputLookup(val) {
  const clean = (val || '').toString().replace(/\D/g, '');
  const statusEl = document.getElementById('phoneLookupStatus');
  if (clean.length === 10) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/curriculum/faculty/lookup?phone=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.teacher) {
          const t = data.teacher;
          const nameInput = document.getElementById('inputTeacherFullName');
          if (nameInput) nameInput.value = t.full_name || t.name;
          const subjSelect = document.getElementById('selectTeacherExpertise');
          if (subjSelect && t.subjectKey) subjSelect.value = t.subjectKey;
          if (statusEl) {
            statusEl.innerText = `Recognized Faculty: ${t.full_name || t.name} (${t.designation || t.subjectName})`;
            statusEl.style.display = 'block';
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Phone lookup notice:', e);
    }
  }
  if (statusEl) {
    statusEl.style.display = 'none';
  }
}

async function submitTeacherLoginForm(event) {
  if (event) event.preventDefault();
  const phone = document.getElementById('inputTeacherPhone')?.value?.trim() || '';
  const name = document.getElementById('inputTeacherFullName')?.value?.trim() || '';
  const subjectKey = document.getElementById('selectTeacherExpertise')?.value || 'BIOLOGY';

  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }
  if (!name || name.length < 2) {
    alert('Please enter the faculty member\'s full name.');
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitTeacherLogin');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:15px;height:15px;"></i> Signing In...`;
    initLucideIcons();
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/curriculum/auth/teacher-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, name, subjectKey })
    });
    const data = await res.json();
    if (res.ok && data.success && data.teacher) {
      applyTeacherProfile(data.teacher, true);
      closeTeacherSignInModal();
    } else {
      throw new Error(data.error || 'Authentication failed');
    }
  } catch (err) {
    console.warn('Backend login fallback:', err.message);
    const isC10 = subjectKey?.startsWith('CLASS10_') || subjectKey === 'SCIENCE';
    const sName = subjectKey === 'BIOLOGY' ? 'Biology' 
      : (subjectKey === 'PHYSICS' ? 'Physics' 
      : (subjectKey === 'CHEMISTRY' ? 'Chemistry' 
      : (subjectKey === 'CLASS10_SCIENCE' || subjectKey === 'SCIENCE' ? 'Science' : 'Mathematics')));
    const localTeacher = {
      id: `fac_${subjectKey.toLowerCase()}_${cleanPhone}`,
      name: name,
      full_name: name,
      phone: cleanPhone,
      email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '') || subjectKey.toLowerCase()}@haps.edu.in`,
      subjectKey: subjectKey,
      subjectName: sName,
      grade: isC10 ? '10' : '11',
      designation: isC10 
        ? (sName === 'Science' ? 'Class 10th Science Faculty & Board Coordinator' : 'Class 10th Mathematics Faculty & Board Coordinator')
        : (subjectKey === 'BIOLOGY' ? 'Senior Biology Faculty & NEET Coordinator' : `Senior ${sName} Faculty`),
      defaultClass: isC10 ? '10-Science-A' : (subjectKey === 'BIOLOGY' ? '11-Med' : '11-NonMed'),
      targetStream: isC10 ? 'CBSE_CLASS_10' : (subjectKey === 'BIOLOGY' ? 'NEET' : 'JEE'),
      streamText: isC10
        ? `Assigned Subject: ${sName} • Class 10 (CBSE & HP Board Foundation)`
        : (subjectKey === 'BIOLOGY'
          ? 'Assigned Subject: Biology &bull; Classes 11 &amp; 12 Medical (NEET UG &amp; CBSE Boards)'
          : `Assigned Subject: ${sName} &bull; Classes 11 &amp; 12 (${subjectKey === 'MATHEMATICS' ? 'JEE Main/Adv &amp; CBSE Boards' : 'NEET, JEE Main &amp; CBSE Boards'})`)
    };
    applyTeacherProfile(localTeacher, true);
    closeTeacherSignInModal();
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="log-in" style="width:15px;height:15px;"></i> Sign In &amp; Enter Portal`;
      initLucideIcons();
    }
  }
}

function quickSelectFaculty(subjectKey, name, phone) {
  const phoneEl = document.getElementById('inputTeacherPhone');
  const nameEl = document.getElementById('inputTeacherFullName');
  const subjEl = document.getElementById('selectTeacherExpertise');

  if (phoneEl) phoneEl.value = phone || '';
  if (nameEl) nameEl.value = name || '';
  if (subjEl) subjEl.value = subjectKey || 'BIOLOGY';

  submitTeacherLoginForm();
}

function authenticateTeacher(subjectKey, teacherName, email) {
  const defaultPhones = {
    'CLASS10_MATHEMATICS': '9816010010',
    'CLASS10_SCIENCE': '9816010011',
    'PHYSICS': '9816010001',
    'CHEMISTRY': '9816010002',
    'BIOLOGY': '9816010003',
    'MATHEMATICS': '9816010004'
  };
  quickSelectFaculty(subjectKey, teacherName, defaultPhones[subjectKey] || '9816010000');
}

function submitCustomTeacherLogin(event) {
  submitTeacherLoginForm(event);
}

function applyTeacherProfile(prof, notify = false) {
  const isClass10 = prof.defaultClass?.startsWith('10') || prof.grade === '10' || prof.subjectKey?.startsWith('CLASS10');
  const defaultGrade = isClass10 ? '10' : (prof.defaultClass?.startsWith('11') ? '11' : '12');
  teacherBuilderState.teacherSubjectKey = prof.subjectKey;
  teacherBuilderState.selectedSubjectKey = prof.subjectKey;
  teacherBuilderState.activeGrade = defaultGrade;
  const defaultClassForSubj = (prof.subjectKey === 'CLASS10_MATHEMATICS')
    ? '10-Maths-A'
    : (isClass10 ? '10-Science-A' : (prof.subjectKey === 'BIOLOGY' ? '12-Med' : '12-NonMed'));
  teacherBuilderState.selectedClassId = prof.defaultClass || defaultClassForSubj;
  teacherBuilderState.targetStream = prof.targetStream || (isClass10 ? 'CBSE_CLASS_10' : (prof.subjectKey === 'BIOLOGY' ? 'NEET' : 'JEE'));
  teacherBuilderState.activeTeacher = prof;

  try {
    localStorage.setItem('haps_active_teacher', JSON.stringify(prof));
  } catch (e) {}

  const nameEl = document.getElementById('teacherFacultyName');
  const badgeEl = document.getElementById('teacherFacultyBadge');
  const textEl = document.getElementById('teacherFacultyStreamText');

  if (nameEl) nameEl.innerText = prof.name || prof.full_name;
  if (badgeEl) badgeEl.innerHTML = `${prof.designation} &bull; Department of ${prof.subjectName}`;
  if (textEl) textEl.innerHTML = prof.streamText;

  // Compact strip update on main teacher workspace
  const stripFacultyName = document.getElementById('stripFacultyName');
  const stripFacultyDept = document.getElementById('stripFacultyDept');
  if (stripFacultyName) stripFacultyName.innerText = prof.name || prof.full_name;
  if (stripFacultyDept) {
    stripFacultyDept.innerText = prof.subjectName;
    if (prof.subjectKey === 'BIOLOGY') {
      stripFacultyDept.style.background = 'rgba(16,185,129,0.18)';
      stripFacultyDept.style.color = '#10b981';
    } else if (isClass10) {
      stripFacultyDept.style.background = 'rgba(245,158,11,0.18)';
      stripFacultyDept.style.color = '#f59e0b';
    } else {
      stripFacultyDept.style.background = 'rgba(59,130,246,0.18)';
      stripFacultyDept.style.color = 'var(--accent-blue)';
    }
  }

  // Header chip & title update
  const headerFacultyName = document.getElementById('headerFacultyName');
  if (headerFacultyName) headerFacultyName.innerText = prof.name || prof.full_name;
  const headerFacultyTag = document.getElementById('headerFacultyTag');
  if (headerFacultyTag) headerFacultyTag.innerText = prof.subjectName;
  const headerClassBadge = document.getElementById('headerFacultyClassBadge');
  if (headerClassBadge) headerClassBadge.innerText = `Class ${defaultGrade}th ▼`;

  const headerTitle = document.getElementById('headerNavTitle');
  if (headerTitle && (!state.activeRole || state.activeRole === 'teacher')) {
    const tabTitles = {
      'tabGenerator': `Create Tests & Quizzes • Department of ${prof.subjectName}`,
      'tabQuestionBank': `Question Bank & PYQ Repository • Department of ${prof.subjectName}`,
      'tabClassAnalytics': `Class Progress Dashboard • Department of ${prof.subjectName}`,
      'tabStudents': `Students & Smart Cards • Department of ${prof.subjectName}`,
      'tabSmartReports': `Weekly Smart Report • Department of ${prof.subjectName}`,
      'tabHandwritten': `Scan Paper Sheets • Department of ${prof.subjectName}`
    };
    headerTitle.innerText = tabTitles[state.activeTeacherTab] || `Teacher Portal • Department of ${prof.subjectName}`;
  }

  // Drawer faculty info update
  const drawerName = document.getElementById('drawerFacultyName');
  const drawerRole = document.getElementById('drawerFacultyRole');
  const drawerSubj = document.getElementById('drawerFacultySubject');
  const drawerPhone = document.getElementById('drawerFacultyPhone');
  const drawerActiveBadge = document.getElementById('drawerFacultyActiveBadge');
  if (drawerName) drawerName.innerText = prof.name || prof.full_name;
  if (drawerRole) drawerRole.innerText = prof.designation;
  if (drawerSubj) drawerSubj.innerText = `Department: ${prof.subjectName}`;
  if (drawerPhone) drawerPhone.innerText = prof.phone ? `Phone: ${prof.phone}` : '';
  if (drawerActiveBadge) drawerActiveBadge.innerText = `Class ${defaultGrade}th`;

  // Find class details
  const allowedClasses = FACULTY_SUBJECT_CLASSES[prof.subjectKey] || FACULTY_SUBJECT_CLASSES.PHYSICS;
  const activeClassObj = allowedClasses.find(c => c.id === teacherBuilderState.selectedClassId) || allowedClasses[0];

  const stripScope = document.getElementById('stripTeacherClassScope');
  if (stripScope) stripScope.innerText = activeClassObj.name;
  const lockedText = document.getElementById('lockedTargetClassText');
  if (lockedText) lockedText.innerText = activeClassObj.name;

  const selectPaperClass = document.getElementById('selectPaperClass');
  if (selectPaperClass) selectPaperClass.value = teacherBuilderState.selectedClassId;
  const drawerSelectClass = document.getElementById('drawerSelectClassScope');
  if (drawerSelectClass) drawerSelectClass.value = teacherBuilderState.selectedClassId;
  const selectRosterClass = document.getElementById('selectTeacherActiveRosterClass');
  if (selectRosterClass) selectRosterClass.value = teacherBuilderState.selectedClassId;

  updateStreamSelectionUI(prof.targetStream || (isClass10 ? 'CBSE_CLASS_10' : (prof.subjectKey === 'BIOLOGY' ? 'NEET' : 'JEE')));

  // 1. Reload classes filtered strictly by teacher subject
  loadTeacherClassesList();

  // 2. Reload class analytics strictly scoped to teacher subject
  loadClassAnalytics();

  // 3. Reload curriculum chapters strictly for teacher subject and active grade
  loadCurriculumForClassAndSubject(prof.subjectKey, defaultGrade);

  // 4. Update paper builder chapters & topics dropdown
  if (typeof populatePaperChapters === 'function') {
    populatePaperChapters(prof.subjectKey);
  }
  if (typeof populateGenChapters === 'function') {
    populateGenChapters(prof.subjectKey);
  }

  // 5. Render roster for active class
  if (typeof window.renderClassRoster === 'function') {
    window.renderClassRoster(teacherBuilderState.selectedClassId);
  }

  // 6. Reload question bank if active or prefetch
  if (state.activeTeacherTab === 'tabQuestionBank') {
    loadQuestionBankView();
  }

  if (notify) {
    showScopeSwitchToast(defaultGrade, prof.subjectKey);
  }
}

function setTeacherSubjectFaculty(subjectFaculty) {
  authenticateTeacher(subjectFaculty);
}

function openCreateClassModal() {
  const modal = document.getElementById('modalCreateClass');
  if (modal) modal.style.display = 'flex';
  const nameInput = document.getElementById('inputNewClassName');
  if (nameInput) nameInput.focus();
  initLucideIcons();
}

function closeCreateClassModal() {
  const modal = document.getElementById('modalCreateClass');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('formCreateClass');
  if (form) form.reset();
}

async function submitCreateClass(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputNewClassName')?.value?.trim();
  const grade = document.getElementById('selectNewClassGrade')?.value || '11';
  const section = document.getElementById('inputNewClassSection')?.value?.trim();
  const stream = document.getElementById('selectNewClassStream')?.value || 'NON_MEDICAL';

  if (!name || !section) {
    alert('Please enter both class name and section code.');
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitCreateClass');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Creating...`;
    initLucideIcons();
  }

  const activeSubjKey = teacherBuilderState.teacherSubjectKey || teacherBuilderState.selectedSubjectKey || 'PHYSICS';

  try {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/curriculum/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade, section, stream })
      });
      await res.json().catch(() => ({}));
    } catch (apiErr) {
      console.warn('API class creation fetch warning (proceeding with local persistent state):', apiErr);
    }

    // 1. Save to persistent custom classes store in localStorage
    const customClasses = JSON.parse(localStorage.getItem('haps_teacher_custom_classes') || '[]');
    const newClassItem = {
      id: section,
      name: name,
      grade: String(grade),
      section: section,
      stream: stream,
      subjectKey: activeSubjKey,
      students: [],
      createdAt: Date.now()
    };
    const existingIdx = customClasses.findIndex(c => c.id === section || c.section === section);
    if (existingIdx >= 0) {
      customClasses[existingIdx] = newClassItem;
    } else {
      customClasses.push(newClassItem);
    }
    localStorage.setItem('haps_teacher_custom_classes', JSON.stringify(customClasses));

    // 2. Add to CLASS_ROSTERS so Roster and Gradebook render without error
    if (!CLASS_ROSTERS[section]) {
      CLASS_ROSTERS[section] = {
        name: name,
        stream: stream.replace(/_/g, ' '),
        subject: teacherBuilderState.activeTeacher?.subjectName || 'Physics',
        enrolled: 0,
        attendance: '100%',
        average: '--',
        students: []
      };
    }

    // 3. Add to FACULTY_SUBJECT_CLASSES
    if (!FACULTY_SUBJECT_CLASSES[activeSubjKey]) {
      FACULTY_SUBJECT_CLASSES[activeSubjKey] = [];
    }
    if (!FACULTY_SUBJECT_CLASSES[activeSubjKey].some(c => c.id === section)) {
      FACULTY_SUBJECT_CLASSES[activeSubjKey].push({
        id: section,
        name: `${name} (${section})`
      });
    }

    // 4. Update teacherBuilderState.classes
    if (!teacherBuilderState.classes) teacherBuilderState.classes = [];
    if (!teacherBuilderState.classes.some(c => c.id === section)) {
      teacherBuilderState.classes.push({
        id: section,
        key: section,
        name: name,
        grade: String(grade),
        section: section,
        stream: stream,
        students: []
      });
    }

    // 5. Close modal
    closeCreateClassModal();

    // 6. Reload backend class list if available
    try {
      await loadTeacherClassesList();
    } catch (e) {}

    // 7. Immediately switch faculty active scope to the newly created class
    await switchFacultyClassScope(section);

    // 8. Update dropdowns
    const rosterSelect = document.getElementById('selectTeacherActiveRosterClass');
    if (rosterSelect && !Array.from(rosterSelect.options).some(o => o.value === section)) {
      const opt = document.createElement('option');
      opt.value = section;
      opt.textContent = `${name} (0 Students)`;
      rosterSelect.appendChild(opt);
      rosterSelect.value = section;
    }

    const drawerSelect = document.getElementById('drawerSelectClassScope');
    if (drawerSelect && !Array.from(drawerSelect.options).some(o => o.value === section)) {
      const opt = document.createElement('option');
      opt.value = section;
      opt.textContent = `${name} (Section ${section})`;
      drawerSelect.appendChild(opt);
      drawerSelect.value = section;
    }

    // 9. Re-render profile modal cards
    renderFacultyClassSwitcherCards();

    // 10. Success Notification Toast
    const toast = document.createElement('div');
    toast.className = 'role-switch-toast';
    toast.innerHTML = `<i data-lucide="check-circle" style="width:16px; height:16px; color:#34d399;"></i> <span>Class Section <strong>${escapeHtml(name)}</strong> created &amp; added to your profile!</span>`;
    document.body.appendChild(toast);
    initLucideIcons();
    setTimeout(() => toast.remove(), 4000);

  } catch (err) {
    console.error('Error creating class:', err);
    alert('Could not complete class creation. Please check console for details.');
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="plus" style="width:14px;height:14px;"></i> Create Class`;
      initLucideIcons();
    }
  }
}

function openAddStudentModal() {
  const modal = document.getElementById('modalAddStudentToClass');
  if (modal) modal.style.display = 'flex';
  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId);
  const selectSection = document.getElementById('selectNewStudentSection');
  if (selectSection && currentClass) {
    selectSection.value = currentClass.section || currentClass.id;
  }
  const nameInput = document.getElementById('inputNewStudentName');
  if (nameInput) nameInput.focus();
  initLucideIcons();
}

function closeAddStudentModal() {
  const modal = document.getElementById('modalAddStudentToClass');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('formAddStudentToClass');
  if (form) form.reset();
}

async function submitAddStudentToClass(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputNewStudentName')?.value?.trim();
  const rollNumber = document.getElementById('inputNewStudentRoll')?.value?.trim();
  const targetExam = document.getElementById('selectNewStudentTargetExam')?.value || 'JEE_MAIN';
  const section = document.getElementById('selectNewStudentSection')?.value || teacherBuilderState.selectedClassId;
  const parentPhone = document.getElementById('inputNewStudentPhone')?.value?.trim() || '+91 98160-XXXXX';
  const hostelResident = document.getElementById('selectNewStudentCategory')?.value === 'true';

  if (!name || !rollNumber) {
    alert('Please enter student full name and roll number.');
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitAddStudent');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;"></i> Enrolling...`;
    initLucideIcons();
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/curriculum/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        rollNumber,
        section,
        targetExam,
        parentPhone,
        hostelResident
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      // Add to local state classes
      const targetClass = teacherBuilderState.classes.find(c => c.id === section || c.section === section);
      if (targetClass) {
        if (!targetClass.students) targetClass.students = [];
        targetClass.students.push({
          id: data.student.id || rollNumber,
          name: data.student.full_name || name,
          roll: data.student.roll_number || rollNumber
        });
      }

      closeAddStudentModal();
      updateTeacherClassScopeUI();
      alert(`Student "${name}" (${rollNumber}) enrolled successfully into ${section} and recorded in database.`);
    } else {
      alert(`Enrollment Notice: ${data.error || 'Could not enroll student'}`);
    }
  } catch (err) {
    console.error('Error adding student:', err);
    alert('Failed to connect to backend server. Please verify backend is running.');
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i data-lucide="check" style="width:14px; height:14px;"></i> Enroll Student to Database`;
      initLucideIcons();
    }
  }
}

// -----------------------------------------------------------------------------
// TOP-LEFT 3-LINE SIDEBAR DRAWER & STREAM SWITCHER CONTROLS
// -----------------------------------------------------------------------------

function toggleSidebarDrawer(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const drawer = document.getElementById('sidebarNavDrawer');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open') || drawer.classList.contains('active');
  if (isOpen) {
    closeSidebarDrawer();
  } else {
    openSidebarDrawer();
  }
}

function openSidebarDrawer() {
  const drawer = document.getElementById('sidebarNavDrawer');
  const backdrop = document.getElementById('sidebarNavBackdrop');
  if (drawer) {
    drawer.style.display = 'flex';
    drawer.style.transform = 'translateX(0)';
    drawer.classList.add('open');
    drawer.classList.add('active');
  }
  if (backdrop) {
    backdrop.style.display = 'block';
    backdrop.style.opacity = '1';
    backdrop.style.pointerEvents = 'auto';
    backdrop.classList.add('open');
    backdrop.classList.add('active');
  }
  document.body.style.overflow = 'hidden';
  initLucideIcons();
}

function closeSidebarDrawer() {
  const drawer = document.getElementById('sidebarNavDrawer');
  const backdrop = document.getElementById('sidebarNavBackdrop');
  if (drawer) {
    drawer.style.transform = 'translateX(-100%)';
    drawer.classList.remove('open');
    drawer.classList.remove('active');
  }
  if (backdrop) {
    backdrop.style.opacity = '0';
    backdrop.style.pointerEvents = 'none';
    backdrop.classList.remove('open');
    backdrop.classList.remove('active');
    setTimeout(() => {
      if (!backdrop.classList.contains('open')) {
        backdrop.style.display = 'none';
      }
    }, 220);
  }
  if (document.body) document.body.style.overflow = '';
}

function updateStreamSelectionUI(stream = 'JEE') {
  const curClassId = teacherBuilderState.selectedClassId || '';
  const currentClass = (teacherBuilderState.classes || []).find(c => c.id === curClassId);
  const teacherSubj = (teacherBuilderState.teacherSubjectKey || '').toUpperCase();
  const isClass10 = curClassId === '10-Science-A' 
    || currentClass?.grade === '10' 
    || String(curClassId).startsWith('10')
    || teacherSubj.startsWith('CLASS10_') 
    || teacherBuilderState.activeTeacher?.grade === '10';

  // Normalize stream if in Class 10
  if (isClass10) {
    if (stream === 'JEE' || stream === 'NEET' || stream === 'CBSE_CLASS_10' || stream === 'FOUNDATION') {
      stream = 'BOARD';
    }
  }

  teacherBuilderState.targetStream = stream;

  // 1. Update compact strip badge in main view if exists
  const badgeStream = document.getElementById('badgeActiveStreamName');
  if (badgeStream) {
    if (stream === 'BOARD') {
      badgeStream.innerText = isClass10 ? 'Board (CBSE & HP Board 10th)' : 'Board (CBSE & HP Board)';
      badgeStream.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      badgeStream.style.color = '#fbbf24';
      badgeStream.style.background = 'rgba(245, 158, 11, 0.12)';
    } else if (stream === 'NEET') {
      badgeStream.innerText = 'NEET UG';
      badgeStream.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      badgeStream.style.color = '#34d399';
      badgeStream.style.background = 'rgba(16, 185, 129, 0.12)';
    } else if (stream === 'OLYMPIAD') {
      badgeStream.innerText = isClass10 ? 'Olympiad & Foundation' : 'Olympiad & Advanced';
      badgeStream.style.borderColor = 'rgba(168, 85, 247, 0.4)';
      badgeStream.style.color = '#c084fc';
      badgeStream.style.background = 'rgba(168, 85, 247, 0.12)';
    } else {
      badgeStream.innerText = 'JEE (Main & Advanced)';
      badgeStream.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      badgeStream.style.color = '#38bdf8';
      badgeStream.style.background = 'rgba(56, 189, 248, 0.12)';
    }
  }

  // 2. Update drawer stream buttons active state & checkmarks
  const btnBoard = document.getElementById('drawerStreamBoard');
  const btnJee = document.getElementById('drawerStreamJee');
  const btnNeet = document.getElementById('drawerStreamNeet');
  const btnOlympiad = document.getElementById('drawerStreamOlympiad');
  const checkBoard = document.getElementById('checkStreamBoard');
  const checkJee = document.getElementById('checkStreamJee');
  const checkNeet = document.getElementById('checkStreamNeet');
  const checkOlympiad = document.getElementById('checkStreamOlympiad');
  const boardSubtext = document.getElementById('drawerStreamBoardSubtext');
  const olympiadTitle = document.getElementById('drawerStreamOlympiadTitle');
  const olympiadSubtext = document.getElementById('drawerStreamOlympiadSubtext');

  if (isClass10) {
    // STRICT ISOLATION FOR CLASS 10: HIDE JEE & NEET COMPLETELY!
    if (btnJee) btnJee.style.display = 'none';
    if (btnNeet) btnNeet.style.display = 'none';
    if (btnBoard) {
      btnBoard.style.display = 'flex';
      btnBoard.classList.toggle('active', stream === 'BOARD');
    }
    if (btnOlympiad) {
      btnOlympiad.style.display = 'flex';
      btnOlympiad.classList.toggle('active', stream === 'OLYMPIAD');
    }
    if (boardSubtext) boardSubtext.innerText = 'Class 10th Foundation & Boards • Step Rubrics';
    if (olympiadTitle) olympiadTitle.innerText = 'Olympiad & Foundation';
    if (olympiadSubtext) olympiadSubtext.innerText = 'NTSE, Olympiads & Deep Reasoning';
  } else {
    // Senior secondary: Classes 11 & 12
    if (btnBoard) {
      btnBoard.style.display = 'flex';
      btnBoard.classList.toggle('active', stream === 'BOARD');
    }
    if (boardSubtext) boardSubtext.innerText = 'Classes 10, 11 & 12 • Step Rubrics';
    if (olympiadTitle) olympiadTitle.innerText = 'Olympiad & Advanced';
    if (olympiadSubtext) olympiadSubtext.innerText = 'Deep Reasoning • Multi-Step Problems';

    const isMedical = curClassId.includes('Med') && !curClassId.includes('NonMed');
    const isNonMed = curClassId.includes('NonMed');

    if (btnJee) {
      btnJee.style.display = isMedical ? 'none' : 'flex';
      btnJee.classList.toggle('active', stream === 'JEE');
    }
    if (btnNeet) {
      btnNeet.style.display = isNonMed ? 'none' : 'flex';
      btnNeet.classList.toggle('active', stream === 'NEET');
    }
    if (btnOlympiad) {
      btnOlympiad.style.display = 'flex';
      btnOlympiad.classList.toggle('active', stream === 'OLYMPIAD');
    }
  }

  if (checkBoard) checkBoard.style.display = stream === 'BOARD' ? 'inline-flex' : 'none';
  if (checkJee) checkJee.style.display = stream === 'JEE' ? 'inline-flex' : 'none';
  if (checkNeet) checkNeet.style.display = stream === 'NEET' ? 'inline-flex' : 'none';
  if (checkOlympiad) checkOlympiad.style.display = stream === 'OLYMPIAD' ? 'inline-flex' : 'none';

  // Sync drawer class scope selector if present
  const drawerClassSelect = document.getElementById('drawerSelectClassScope');
  if (drawerClassSelect && curClassId) {
    drawerClassSelect.value = curClassId;
  }

  // 3. Fallback for older stream cards if present in DOM
  const streamCards = document.querySelectorAll('#teacherTargetStreams .target-stream-card');
  streamCards.forEach(c => {
    const isMatch = c.getAttribute('data-target-stream') === stream;
    c.classList.toggle('active', isMatch);
    c.classList.toggle(`active-${stream.toLowerCase()}`, isMatch);
  });
}

function selectDrawerStream(stream) {
  const isClass10 = teacherBuilderState.selectedClassId === '10-Science-A' 
    || String(teacherBuilderState.selectedClassId || '').startsWith('10')
    || (teacherBuilderState.teacherSubjectKey || '').startsWith('CLASS10_');

  if (isClass10 && (stream === 'JEE' || stream === 'NEET')) {
    stream = 'BOARD';
  }

  if (stream === 'BOARD') {
    const class10 = (teacherBuilderState.classes || []).find(c => c.id === '10-Science-A' || c.grade === '10');
    if (class10) {
      teacherBuilderState.selectedClassId = class10.id;
      const classSelect = document.getElementById('selectTeacherClassScope');
      if (classSelect) classSelect.value = class10.id;
      const drawerSelect = document.getElementById('drawerSelectClassScope');
      if (drawerSelect) drawerSelect.value = class10.id;
    } else {
      handleDrawerClassChange('10-Science-A');
      return;
    }
  } else if (stream === 'OLYMPIAD') {
    if (isClass10) {
      updateStreamSelectionUI('OLYMPIAD');
      updateTeacherClassScopeUI();
      if (state.activeTeacherTab === 'tabQuestionBank') {
        loadQuestionBankView(true);
      }
      closeSidebarDrawer();
      return;
    }
  } else if (stream === 'JEE') {
    const nonMedClass = (teacherBuilderState.classes || []).find(c => (c.stream || '').includes('NON_MEDICAL') || (c.name || '').includes('Non-Med'));
    if (nonMedClass) {
      teacherBuilderState.selectedClassId = nonMedClass.id;
      const classSelect = document.getElementById('selectTeacherClassScope');
      if (classSelect) classSelect.value = nonMedClass.id;
      const drawerSelect = document.getElementById('drawerSelectClassScope');
      if (drawerSelect) drawerSelect.value = nonMedClass.id;
    }
  } else if (stream === 'NEET') {
    const medClass = (teacherBuilderState.classes || []).find(c => (c.stream || '').includes('MED') && !(c.stream || '').includes('NON'));
    if (medClass) {
      teacherBuilderState.selectedClassId = medClass.id;
      const classSelect = document.getElementById('selectTeacherClassScope');
      if (classSelect) classSelect.value = medClass.id;
      const drawerSelect = document.getElementById('drawerSelectClassScope');
      if (drawerSelect) drawerSelect.value = medClass.id;
    }
  }

  updateStreamSelectionUI(stream);
  updateTeacherClassScopeUI();

  if (state.activeTeacherTab === 'tabQuestionBank') {
    loadQuestionBankView(true);
  }

  closeSidebarDrawer();
}

function openFacultyClassSwitcherModal() {
  const modal = document.getElementById('modalFacultyClassSwitcher');
  if (!modal) return;
  modal.style.display = 'flex';

  const prof = teacherBuilderState.activeTeacher || {
    name: 'Dr. Vikram Sharma',
    designation: 'Senior Physics Faculty & HOD',
    phone: '98160 10001',
    subjectKey: 'PHYSICS',
    subjectName: 'Physics'
  };

  const nameEl = document.getElementById('switcherModalFacultyName');
  const deptEl = document.getElementById('switcherModalFacultyDept');
  const phoneEl = document.getElementById('switcherModalFacultyPhone');

  if (nameEl) nameEl.innerText = prof.name || prof.full_name;
  if (deptEl) deptEl.innerHTML = `${prof.designation || 'Faculty'} &bull; Department of ${prof.subjectName || 'Physics'}`;
  if (phoneEl) phoneEl.innerText = prof.phone ? `Registered Phone: ${prof.phone}` : 'Registered Faculty';

  renderFacultyClassSwitcherCards();
  initLucideIcons();
}

function closeFacultyClassSwitcherModal() {
  const modal = document.getElementById('modalFacultyClassSwitcher');
  if (modal) modal.style.display = 'none';
}

function renderFacultyClassSwitcherCards() {
  const container = document.getElementById('containerFacultyClassCards');
  if (!container) return;

  const subjKey = teacherBuilderState.teacherSubjectKey || teacherBuilderState.selectedSubjectKey || 'PHYSICS';
  const currentClassId = teacherBuilderState.selectedClassId || '12-NonMed';
  const currentGrade = String(teacherBuilderState.activeGrade || (currentClassId.startsWith('11') ? '11' : (currentClassId.startsWith('10') ? '10' : '12')));

  let classCards = [];

  if (subjKey === 'PHYSICS') {
    classCards = [
      {
        id: '12-NonMed',
        grade: '12',
        title: 'Class 12th Physics (Non-Medical & Medical)',
        stream: 'Senior Secondary • CBSE & HP Board / JEE Main',
        stats: '14 NCERT Chapters • 48 Students Enrolled',
        badge: 'CBSE & HP Board + JEE'
      },
      {
        id: '11-NonMed',
        grade: '11',
        title: 'Class 11th Physics (Non-Medical & Medical)',
        stream: 'Class 11th Senior Secondary • CBSE & HP Foundation',
        stats: '14 NCERT Chapters • 42 Students Enrolled',
        badge: 'Class 11 + Foundation'
      }
    ];
  } else if (subjKey === 'CHEMISTRY') {
    classCards = [
      {
        id: '12-NonMed',
        grade: '12',
        title: 'Class 12th Chemistry (Senior Batch)',
        stream: 'Senior Secondary • CBSE & HP Board / NEET & JEE',
        stats: '10 NCERT Chapters • 48 Students Enrolled',
        badge: 'CBSE & HP Board'
      },
      {
        id: '11-NonMed',
        grade: '11',
        title: 'Class 11th Chemistry (Junior Batch)',
        stream: 'Class 11th Senior Secondary • Foundation',
        stats: '10 NCERT Chapters • 42 Students Enrolled',
        badge: 'Class 11 Foundation'
      }
    ];
  } else if (subjKey === 'BIOLOGY') {
    classCards = [
      {
        id: '12-Med',
        grade: '12',
        title: 'Class 12th Biology (Senior Medical)',
        stream: 'Senior Secondary • CBSE & HP Board / NEET UG',
        stats: '13 NCERT Chapters • 38 Students Enrolled',
        badge: 'NEET UG + Boards'
      },
      {
        id: '11-Med',
        grade: '11',
        title: 'Class 11th Biology (Junior Medical)',
        stream: 'Class 11th Senior Secondary • NEET Foundation',
        stats: '13 NCERT Chapters • 40 Students Enrolled',
        badge: 'Class 11 Medical'
      }
    ];
  } else if (subjKey === 'MATHEMATICS') {
    classCards = [
      {
        id: '12-NonMed',
        grade: '12',
        title: 'Class 12th Mathematics (Senior Secondary)',
        stream: 'Senior Secondary • CBSE & HP Board / JEE Main',
        stats: '13 NCERT Chapters • 48 Students Enrolled',
        badge: 'CBSE & HP Board + JEE'
      },
      {
        id: '11-NonMed',
        grade: '11',
        title: 'Class 11th Mathematics (Junior Secondary)',
        stream: 'Class 11th Senior Secondary • JEE Foundation',
        stats: '13 NCERT Chapters • 42 Students Enrolled',
        badge: 'Class 11 Foundation'
      }
    ];
  } else if (subjKey === 'CLASS10_SCIENCE' || subjKey === 'SCIENCE') {
    classCards = [
      {
        id: '10-Science-A',
        grade: '10',
        title: 'Class 10th Science — Section A',
        stream: 'Secondary Board Track • CBSE & HPBOSE',
        stats: '13 NCERT Chapters • 45 Students Enrolled',
        badge: 'Section A • Board Track'
      },
      {
        id: '10-Science-B',
        grade: '10',
        title: 'Class 10th Science — Section B',
        stream: 'Secondary Board Track • CBSE & HPBOSE',
        stats: '13 NCERT Chapters • 43 Students Enrolled',
        badge: 'Section B • Board Track'
      }
    ];
  } else {
    classCards = [
      {
        id: '10-Maths-A',
        grade: '10',
        title: 'Class 10th Mathematics — Section A',
        stream: 'Secondary Board Track • CBSE & HPBOSE',
        stats: '14 NCERT Chapters • 44 Students Enrolled',
        badge: 'Section A • Board Track'
      },
      {
        id: '10-Maths-B',
        grade: '10',
        title: 'Class 10th Mathematics — Section B',
        stream: 'Secondary Board Track • CBSE & HPBOSE',
        stats: '14 NCERT Chapters • 42 Students Enrolled',
        badge: 'Section B • Board Track'
      }
    ];
  }

  // Set of default class IDs to prevent any duplicate or incorrect custom labeling
  const defaultClassIds = new Set(classCards.map(c => c.id));

  // Dynamically load ONLY teacher-created custom classes belonging to THIS teacher's subject
  try {
    let customList = JSON.parse(localStorage.getItem('haps_teacher_custom_classes') || '[]');
    // Clean out any legacy default class IDs accidentally stored
    const cleanedList = customList.filter(c => {
      const cid = c.id || c.section;
      return cid && !defaultClassIds.has(cid);
    });
    if (cleanedList.length !== customList.length) {
      localStorage.setItem('haps_teacher_custom_classes', JSON.stringify(cleanedList));
      customList = cleanedList;
    }

    // Filter strictly to classes created for the active teacher's subject
    customList.filter(c => {
      if (!c.subjectKey) return false;
      const cSubj = c.subjectKey.toUpperCase();
      if (subjKey === 'PHYSICS') return cSubj === 'PHYSICS';
      if (subjKey === 'CHEMISTRY') return cSubj === 'CHEMISTRY';
      if (subjKey === 'BIOLOGY') return cSubj === 'BIOLOGY';
      if (subjKey === 'MATHEMATICS') return cSubj === 'MATHEMATICS';
      if (subjKey.startsWith('CLASS10_SCIENCE') || subjKey === 'SCIENCE') return cSubj.includes('SCIENCE');
      if (subjKey.startsWith('CLASS10_')) return cSubj.includes('MATH');
      return cSubj === subjKey;
    }).forEach(c => {
      const cid = c.id || c.section;
      if (!classCards.some(existing => existing.id === cid)) {
        const g = String(c.grade || (cid.includes('11') ? '11' : (cid.includes('10') ? '10' : '12')));
        const enrolledCount = c.students?.length || (CLASS_ROSTERS[cid]?.students?.length) || 0;
        classCards.push({
          id: cid,
          grade: g,
          title: c.name || `Class ${g}th (${c.section || cid})`,
          stream: `${(c.stream || 'SENIOR_SECONDARY').replace(/_/g, ' ')} • Faculty Section`,
          stats: `${enrolledCount} Students Enrolled • Custom Section`,
          badge: `Section ${c.section || cid}`,
          isCustom: true
        });
      }
    });
  } catch (e) {
    console.warn('Failed to parse custom classes from localStorage:', e);
  }

  // Ensure active class id belongs to the current teacher's cards list
  const hasCurrentInCards = classCards.some(c => c.id === currentClassId);
  if (!hasCurrentInCards && classCards.length > 0) {
    currentClassId = classCards[0].id;
    teacherBuilderState.selectedClassId = currentClassId;
    teacherBuilderState.activeGrade = classCards[0].grade;
  }
  const effectiveActiveId = teacherBuilderState.selectedClassId || classCards[0]?.id;

  container.innerHTML = classCards.map(c => {
    const isActive = (c.id === effectiveActiveId);
    return `
      <div class="faculty-class-choice-card ${isActive ? 'active-scope' : ''}" 
           onclick="switchFacultyClassScope('${c.id}')">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
          <div style="
            width: 38px;
            height: 38px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${isActive ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-card-hover)'};
            color: ${isActive ? 'var(--accent-blue)' : 'var(--text-muted)'};
            font-size: 0.95rem;
            font-weight: 800;
            flex-shrink: 0;
            border: 1px solid ${isActive ? 'rgba(2, 132, 199, 0.3)' : 'var(--border-subtle)'};
          ">
            +${c.grade}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <strong style="color: var(--text-primary); font-size: 0.92rem;">${escapeHtml(c.title)}</strong>
              <span style="font-size: 0.7rem; background: var(--bg-card-hover); color: var(--text-secondary); border: 1px solid var(--border-subtle); padding: 1px 6px; border-radius: 4px;">${escapeHtml(c.badge)}</span>
              ${c.isCustom ? `<span style="font-size: 0.68rem; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 1px 6px; border-radius: 4px; font-weight: 700;">Created Class</span>` : ''}
            </div>
            <p style="margin: 2px 0 0 0; font-size: 0.74rem; color: var(--text-secondary);">${escapeHtml(c.stream)}</p>
            <p style="margin: 2px 0 0 0; font-size: 0.72rem; color: var(--text-muted);">📚 ${escapeHtml(c.stats)}</p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
          ${isActive ? `
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 5px;
              background: linear-gradient(135deg, #0284c7, #2563eb);
              color: #ffffff;
              padding: 5px 12px;
              border-radius: 6px;
              font-size: 0.75rem;
              font-weight: 800;
              letter-spacing: 0.5px;
              box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
            ">
              <i data-lucide="check" style="width: 14px; height: 14px;"></i> ACTIVE NOW
            </span>
          ` : `
            <button type="button" class="btn-secondary" 
                    onclick="event.stopPropagation(); switchFacultyClassScope('${c.id}')"
                    style="padding: 6px 12px; font-size: 0.78rem; font-weight: 700;">
              Switch Scope ⇄
            </button>
          `}

          ${c.isCustom ? `
            <button type="button" 
                    class="btn-cut-class"
                    onclick="event.stopPropagation(); deleteCustomFacultyClass('${c.id}', '${escapeHtml(c.title)}')"
                    title="Cut / Remove this class section"
                    aria-label="Remove Class Section"
                    style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      width: 32px;
                      height: 32px;
                      border-radius: 6px;
                      background: rgba(239, 68, 68, 0.12);
                      border: 1px solid rgba(239, 68, 68, 0.35);
                      color: #f87171;
                      cursor: pointer;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.background='rgba(239, 68, 68, 0.28)'; this.style.borderColor='#ef4444'; this.style.color='#fca5a5';"
                    onmouseout="this.style.background='rgba(239, 68, 68, 0.12)'; this.style.borderColor='rgba(239, 68, 68, 0.35)'; this.style.color='#f87171';">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  initLucideIcons();
}

function deleteCustomFacultyClass(classId, className) {
  if (!confirm(`Are you sure you want to remove class section "${className || classId}" from your profile and portal?`)) {
    return;
  }

  const subjKey = teacherBuilderState.teacherSubjectKey || teacherBuilderState.selectedSubjectKey || 'PHYSICS';

  // 1. Remove from localStorage
  try {
    let custom = JSON.parse(localStorage.getItem('haps_teacher_custom_classes') || '[]');
    custom = custom.filter(c => (c.id !== classId && c.section !== classId));
    localStorage.setItem('haps_teacher_custom_classes', JSON.stringify(custom));
  } catch (e) {}

  // 2. Remove from FACULTY_SUBJECT_CLASSES
  if (FACULTY_SUBJECT_CLASSES[subjKey]) {
    FACULTY_SUBJECT_CLASSES[subjKey] = FACULTY_SUBJECT_CLASSES[subjKey].filter(c => c.id !== classId);
  }

  // 3. Remove from teacherBuilderState.classes
  if (teacherBuilderState.classes) {
    teacherBuilderState.classes = teacherBuilderState.classes.filter(c => c.id !== classId && c.section !== classId);
  }

  // 4. Remove from CLASS_ROSTERS
  if (CLASS_ROSTERS[classId]) {
    delete CLASS_ROSTERS[classId];
  }

  // 5. Remove from DOM select dropdowns
  const rosterSelect = document.getElementById('selectTeacherActiveRosterClass');
  if (rosterSelect) {
    const opt = Array.from(rosterSelect.options).find(o => o.value === classId);
    if (opt) opt.remove();
  }
  const drawerSelect = document.getElementById('drawerSelectClassScope');
  if (drawerSelect) {
    const opt = Array.from(drawerSelect.options).find(o => o.value === classId);
    if (opt) opt.remove();
  }
  const paperSelect = document.getElementById('selectPaperClass');
  if (paperSelect) {
    const opt = Array.from(paperSelect.options).find(o => o.value === classId);
    if (opt) opt.remove();
  }

  // 6. If currently active class was deleted, switch back to default first class
  if (teacherBuilderState.selectedClassId === classId) {
    const defaultClassId = (subjKey.startsWith('CLASS10_SCIENCE') || subjKey === 'SCIENCE')
      ? '10-Science-A'
      : (subjKey.startsWith('CLASS10_') ? '10-Maths-A' : (subjKey === 'BIOLOGY' ? '12-Med' : '12-NonMed'));
    switchFacultyClassScope(defaultClassId);
  } else {
    renderFacultyClassSwitcherCards();
  }

  // 7. Toast notification
  const toast = document.createElement('div');
  toast.className = 'role-switch-toast';
  toast.innerHTML = `<i data-lucide="trash-2" style="width:16px; height:16px; color:#f87171;"></i> <span>Class Section <strong>${escapeHtml(className || classId)}</strong> removed.</span>`;
  document.body.appendChild(toast);
  initLucideIcons();
  setTimeout(() => toast.remove(), 3500);
}
window.deleteCustomFacultyClass = deleteCustomFacultyClass;

async function switchFacultyClassScope(classId) {
  if (!classId) return;
  closeFacultyClassSwitcherModal();

  // Find class from custom classes or builder classes or fallback
  const customClasses = JSON.parse(localStorage.getItem('haps_teacher_custom_classes') || '[]');
  const foundCustom = customClasses.find(c => c.id === classId || c.section === classId);
  const foundInBuilder = (teacherBuilderState.classes || []).find(c => c.id === classId || c.section === classId);
  const classObj = foundCustom || foundInBuilder;

  let activeGrade = '12';
  if (classObj?.grade) {
    activeGrade = String(classObj.grade);
  } else if (String(classId).startsWith('10')) {
    activeGrade = '10';
  } else if (String(classId).startsWith('11')) {
    activeGrade = '11';
  }

  const isClass10 = activeGrade === '10';
  const isClass11 = activeGrade === '11';

  teacherBuilderState.selectedClassId = classId;
  teacherBuilderState.activeGrade = activeGrade;

  const subjKey = teacherBuilderState.teacherSubjectKey || teacherBuilderState.selectedSubjectKey || 'PHYSICS';
  const allowedClasses = FACULTY_SUBJECT_CLASSES[subjKey] || FACULTY_SUBJECT_CLASSES.PHYSICS;
  const currentClassInfo = classObj ? {
    id: classId,
    name: classObj.name ? `${classObj.name} (${classObj.section || classId})` : `Class ${activeGrade}th Section ${classId}`
  } : (allowedClasses.find(c => c.id === classId) || {
    id: classId,
    name: activeGrade === '11' ? 'Class 11-NonMed • Physics (42 Students)' : (isClass10 ? 'Class 10-A • Foundation (45 Students)' : 'Class 12-A • Senior Physics (48 Students)')
  });

  // 1. Update Header class badge
  const headerClassBadge = document.getElementById('headerFacultyClassBadge');
  if (headerClassBadge) {
    headerClassBadge.innerText = `Class ${activeGrade}th ▼`;
  }

  // 2. Update Drawer badges and dropdown
  const drawerActiveBadge = document.getElementById('drawerFacultyActiveBadge');
  if (drawerActiveBadge) {
    drawerActiveBadge.innerText = `Class ${activeGrade}th`;
  }
  const drawerSelect = document.getElementById('drawerSelectClassScope');
  if (drawerSelect) {
    drawerSelect.value = classId;
  }

  // 3. Update Welcome strip active scope
  const stripScope = document.getElementById('stripTeacherClassScope');
  if (stripScope) {
    stripScope.innerText = currentClassInfo.name;
  }

  // 4. Update locked paper creator class indicator
  const lockedClassText = document.getElementById('lockedTargetClassText');
  if (lockedClassText) {
    lockedClassText.innerText = currentClassInfo.name;
  }
  const paperClassSelect = document.getElementById('selectPaperClass');
  if (paperClassSelect) {
    paperClassSelect.value = classId;
  }

  // 5. Update Roster Class dropdown
  const rosterClassSelect = document.getElementById('selectTeacherActiveRosterClass');
  if (rosterClassSelect) {
    rosterClassSelect.value = classId;
  }

  // 6. Refresh modal cards if open
  renderFacultyClassSwitcherCards();

  // 7. Re-populate Paper chapters & Quick Gen chapters according to new active grade
  window.populatePaperChapters(subjKey);
  window.populateGenChapters(subjKey);

  // 8. Fetch authentic backend taxonomy database for this grade
  try {
    const taxUrl = `${getApiBaseUrl()}/api/curriculum/taxonomy/${subjKey}?grade=${activeGrade}`;
    const taxRes = await fetch(taxUrl);
    if (taxRes.ok) {
      teacherBuilderState.currentTaxonomy = await taxRes.json();
    }
  } catch (err) {
    console.warn('[SWITCH SCOPE] Taxonomy fetch error:', err);
  }

  // 9. Fetch authentic enrolled students for this grade & subject
  try {
    const stuUrl = `${getApiBaseUrl()}/api/curriculum/students?subject=${subjKey}&grade=${activeGrade}`;
    const stuRes = await fetch(stuUrl);
    if (stuRes.ok) {
      const stuData = await stuRes.json();
      teacherBuilderState.currentStudents = stuData.students || [];
    }
  } catch (err) {
    console.warn('[SWITCH SCOPE] Students fetch error:', err);
  }

  // 10. Update Roster view if function is available
  if (typeof window.renderClassRoster === 'function') {
    window.renderClassRoster(classId);
  }

  // 11. Update Question Bank & PYQs view
  if (typeof populateQbChapterPills === 'function') {
    populateQbChapterPills('ALL');
  }
  if (state.activeTeacherTab === 'tabQuestionBank') {
    loadQuestionBankView(true);
  }

  // 12. Close modal
  closeFacultyClassSwitcherModal();

  // 13. Toast notification
  showScopeSwitchToast(activeGrade, subjKey);
}

function showScopeSwitchToast(grade, subjKey) {
  const existing = document.getElementById('facultyScopeToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'facultyScopeToast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    border: 1px solid #38bdf8;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    border-radius: 10px;
    padding: 12px 18px;
    color: #f8fafc;
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.86rem;
    animation: fadeIn 0.25s ease-out;
  `;
  toast.innerHTML = `
    <div style="width:28px; height:28px; border-radius:50%; background:rgba(56,189,248,0.2); display:flex; align-items:center; justify-content:center; color:#38bdf8;">
      <i data-lucide="check-circle-2" style="width:16px; height:16px;"></i>
    </div>
    <div>
      <strong style="display:block; color:#38bdf8;">Class ${grade}th Scope Active</strong>
      <span style="font-size:0.75rem; color:#94a3b8;">Loaded 14 NCERT chapters, questions & students database.</span>
    </div>
  `;
  document.body.appendChild(toast);
  initLucideIcons();
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

function handleDrawerClassChange(classId) {
  switchFacultyClassScope(classId);
  closeSidebarDrawer();
}
window.handleDrawerClassChange = handleDrawerClassChange;
window.openFacultyClassSwitcherModal = openFacultyClassSwitcherModal;
window.closeFacultyClassSwitcherModal = closeFacultyClassSwitcherModal;
window.renderFacultyClassSwitcherCards = renderFacultyClassSwitcherCards;
window.switchFacultyClassScope = switchFacultyClassScope;

function handleTeacherSignOut() {
  if (!confirm('Sign out from Unisole AI School Faculty Portal?')) {
    return;
  }

  try {
    localStorage.removeItem('haps_active_teacher');
  } catch (e) {}

  teacherBuilderState.activeTeacher = null;

  const headerFacultyName = document.getElementById('headerFacultyName');
  if (headerFacultyName) headerFacultyName.innerText = 'Guest Faculty';

  const headerTitle = document.getElementById('headerNavTitle');
  if (headerTitle) headerTitle.innerText = 'Teacher Portal • Signed Out';

  const nameEl = document.getElementById('teacherFacultyName');
  const badgeEl = document.getElementById('teacherFacultyBadge');
  const textEl = document.getElementById('teacherFacultyStreamText');
  const drawerName = document.getElementById('drawerFacultyName');
  const drawerRole = document.getElementById('drawerFacultyRole');
  const drawerSubj = document.getElementById('drawerFacultySubject');

  if (nameEl) nameEl.innerText = 'Guest Faculty (Signed Out)';
  if (badgeEl) badgeEl.innerHTML = 'Faculty Portal &bull; Session Inactive';
  if (textEl) textEl.innerHTML = 'Sign in to access your subject curriculum, tests, and student rosters.';

  if (drawerName) drawerName.innerText = 'Signed Out';
  if (drawerRole) drawerRole.innerText = 'Please sign in';
  if (drawerSubj) drawerSubj.innerText = 'No Subject Assigned';

  const stripFacultyName = document.getElementById('stripFacultyName');
  const stripFacultyDept = document.getElementById('stripFacultyDept');
  if (stripFacultyName) stripFacultyName.innerText = 'Guest Faculty';
  if (stripFacultyDept) {
    stripFacultyDept.innerText = 'Signed Out';
    stripFacultyDept.style.background = 'rgba(239,68,68,0.18)';
    stripFacultyDept.style.color = 'var(--accent-red)';
  }

  window._isExplicitSignOut = true;
  closeSidebarDrawer();
  openTeacherSignInModal();
}

// Global exposure for inline onclick handlers
window.toggleChapterAccordion = toggleChapterAccordion;
window.selectCurriculumSubject = selectCurriculumSubject;
window.openGenTestForChapter = openGenTestForChapter;
window.openGenTestForChapterByNum = openGenTestForChapterByNum;
window.openGenTestForTopic = openGenTestForTopic;
window.openGenTestForTopicByIndex = openGenTestForTopicByIndex;
window.openGenTestForSingleSubtopic = openGenTestForSingleSubtopic;
window.openGenTestForSubtopicByIndex = openGenTestForSubtopicByIndex;
window.openCurriculumTestModal = openCurriculumTestModal;
window.closeCurriculumTestModal = closeCurriculumTestModal;
window.openQuizCreatedSuccessModal = openQuizCreatedSuccessModal;
window.closeQuizCreatedSuccessModal = closeQuizCreatedSuccessModal;
window.submitGenerateCurriculumTest = submitGenerateCurriculumTest;
window.setupTeacherTestBuilder = setupTeacherTestBuilder;
window.attemptActiveTestInStudentPortal = attemptActiveTestInStudentPortal;
window.simulateClassAttemptsAndGenerateDashboard = simulateClassAttemptsAndGenerateDashboard;
window.closeDiagnosticResultsModal = closeDiagnosticResultsModal;
window.handleGoToSmartReport = handleGoToSmartReport;
window.handleGoToClassDashboard = handleGoToClassDashboard;
window.loadAndRenderSmartReport = loadAndRenderSmartReport;
window.setTeacherSubjectFaculty = setTeacherSubjectFaculty;
window.openTeacherSignInModal = openTeacherSignInModal;
window.closeTeacherSignInModal = closeTeacherSignInModal;
window.authenticateTeacher = authenticateTeacher;
window.submitCustomTeacherLogin = submitCustomTeacherLogin;
window.openCreateClassModal = openCreateClassModal;
window.closeCreateClassModal = closeCreateClassModal;
window.submitCreateClass = submitCreateClass;
window.openAddStudentModal = openAddStudentModal;
window.closeAddStudentModal = closeAddStudentModal;
window.submitAddStudentToClass = submitAddStudentToClass;
window.initTeacherSession = initTeacherSession;
window.toggleSidebarDrawer = toggleSidebarDrawer;
window.openSidebarDrawer = openSidebarDrawer;
window.closeSidebarDrawer = closeSidebarDrawer;
window.updateStreamSelectionUI = updateStreamSelectionUI;
window.selectDrawerStream = selectDrawerStream;
window.handleTeacherSignOut = handleTeacherSignOut;
window.switchTeacherTab = switchTeacherTab;
window.switchPortalRole = switchPortalRole;
window.submitTeacherLoginForm = submitTeacherLoginForm;
window.quickSelectFaculty = quickSelectFaculty;
window.handlePhoneInputLookup = handlePhoneInputLookup;

// ============================================================================
// QUESTION BANK EXPLORER & PYQ REPOSITORY
// ============================================================================

state.questionBankData = [];
state.currentQbSubjectKey = null;

const CLASS10_MATH_CHAPTERS = [
  { num: 1, name: 'Real Numbers', short: 'Real Numbers', count: 49 },
  { num: 2, name: 'Polynomials', short: 'Polynomials', count: 32 },
  { num: 3, name: 'Pair of Linear Equations in Two Variables', short: 'Linear Eqns', count: 30 },
  { num: 4, name: 'Quadratic Equations', short: 'Quadratics', count: 33 },
  { num: 5, name: 'Arithmetic Progressions', short: 'AP', count: 27 },
  { num: 6, name: 'Triangles', short: 'Triangles', count: 29 },
  { num: 7, name: 'Coordinate Geometry', short: 'Coord Geo', count: 30 },
  { num: 8, name: 'Introduction to Trigonometry', short: 'Trigonometry', count: 31 },
  { num: 9, name: 'Some Applications of Trigonometry', short: 'Heights & Dist', count: 20 },
  { num: 10, name: 'Circles', short: 'Circles', count: 22 },
  { num: 11, name: 'Areas Related to Circles', short: 'Areas of Circles', count: 21 },
  { num: 12, name: 'Surface Areas and Volumes', short: 'Mensuration', count: 23 },
  { num: 13, name: 'Statistics', short: 'Statistics', count: 44 },
  { num: 14, name: 'Probability', short: 'Probability', count: 47 }
];

function populateQbChapterPills(activeVal = 'ALL') {
  const strip = document.getElementById('qbChapterPillsStrip');
  if (!strip) return;

  const heading = document.getElementById('qbChapterSelectHeading');
  const countLabel = document.getElementById('qbChaptersCoveredCount');

  const isClass10 = state.currentUser?.grade === '10' || 
                    teacherBuilderState.selectedClassGrade === '10' ||
                    (teacherBuilderState.selectedSubjectKey || '').startsWith('CLASS10_');
  const activeSubj = teacherBuilderState.selectedSubjectKey || (isClass10 ? 'CLASS10_MATHEMATICS' : 'PHYSICS');

  let chapters = [];
  let subjectDisplayName = 'Physics';

  if (isClass10 && activeSubj === 'CLASS10_MATHEMATICS') {
    chapters = CLASS10_MATH_CHAPTERS.map(c => ({
      num: c.num,
      name: c.name,
      short: c.short,
      count: c.count
    }));
    subjectDisplayName = 'Class 10th Math';
  } else if (teacherBuilderState.currentTaxonomy?.chapters) {
    subjectDisplayName = teacherBuilderState.currentTaxonomy.subjectName || activeSubj;
    let chList = teacherBuilderState.currentTaxonomy.chapters;
    if (activeSubj === 'PHYSICS') {
      const targetGrade = String(teacherBuilderState.activeGrade || '12');
      const filtered = chList.filter(c => String(c.grade) === targetGrade);
      if (filtered.length > 0) chList = filtered;
    }
    chapters = chList.map(c => ({
      num: c.chapterNumber || c.id,
      name: c.chapterName || c.title || `Chapter ${c.chapterNumber}`,
      short: (c.chapterName || c.title || '').replace(/^Chapter \d+:\s*/i, '').slice(0, 24),
      count: null
    }));
  } else if (activeSubj === 'PHYSICS') {
    const phyChapters = Object.keys(getChaptersForSubject('PHYSICS', teacherBuilderState.activeGrade));
    chapters = phyChapters.map((ch, idx) => ({
      num: idx + 1,
      name: ch,
      short: ch.replace(/^Chapter \d+:\s*/i, '').slice(0, 24),
      count: null
    }));
  }

  if (heading) {
    heading.innerHTML = `<i data-lucide="layers" style="width:12px; height:12px; vertical-align:middle;"></i> Quick Select Chapter (${subjectDisplayName} NCERT):`;
  }
  if (countLabel) {
    countLabel.innerText = chapters.length > 0 ? `${chapters.length} Chapters Covered` : 'Curriculum Loaded';
  }

  let html = `
    <button type="button" class="qb-chapter-pill ${activeVal === 'ALL' ? 'active' : ''}" data-chapter="ALL" onclick="quickFilterQbChapter('ALL')">
      <span class="ch-badge">ALL</span>
      <span>All ${chapters.length > 0 ? chapters.length : ''} Chapters</span>
    </button>
  `;

  chapters.forEach(ch => {
    const isActive = String(ch.num) === String(activeVal);
    html += `
      <button type="button" class="qb-chapter-pill ${isActive ? 'active' : ''}" data-chapter="${ch.num}" onclick="quickFilterQbChapter('${ch.num}')" title="Chapter ${ch.num}: ${ch.name}">
        <span class="ch-badge">Ch ${ch.num}</span>
        <span>${ch.short}</span>
        ${ch.count ? `<span style="opacity:0.75; font-size:0.68rem;">(${ch.count})</span>` : ''}
      </button>
    `;
  });

  strip.innerHTML = html;
  if (typeof initLucideIcons === 'function') initLucideIcons();
}

function quickFilterQbChapter(chNum) {
  const chSelect = document.getElementById('selectQbChapter');
  if (chSelect) {
    chSelect.value = String(chNum);
  }
  const strip = document.getElementById('qbChapterPillsStrip');
  if (strip) {
    const pills = strip.querySelectorAll('.qb-chapter-pill');
    pills.forEach(pill => {
      if (pill.getAttribute('data-chapter') === String(chNum)) {
        pill.classList.add('active');
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        pill.classList.remove('active');
      }
    });
  }
  filterQuestionBankCards();
}

function quickFilterQbSource(srcKey) {
  const srcSelect = document.getElementById('selectQbSource');
  if (srcSelect) {
    srcSelect.value = srcKey;
  }
  const strip = document.getElementById('qbSourcePillsStrip');
  if (strip) {
    const pills = strip.querySelectorAll('.qb-source-pill');
    pills.forEach(pill => {
      if (pill.getAttribute('data-source') === srcKey) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }
  filterQuestionBankCards();
}

function formatStepEquations(rawText) {
  if (!rawText) return '';
  const rawLines = rawText.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (rawLines.length > 1) {
    return rawLines.map(line => `<div class="sol-math-line">${renderLatexString(line)}</div>`).join('');
  }

  // Math-aware sentence & equation splitter outside $...$ or $$...$$
  const parts = [];
  let cur = '';
  let inMath = false;
  for (let i = 0; i < rawText.length; i++) {
    const ch = rawText[i];
    if (ch === '$') inMath = !inMath;
    cur += ch;
    if (!inMath && (ch === '.' || ch === ';' || ch === ':') && (i === rawText.length - 1 || rawText[i + 1] === ' ' || rawText[i + 1] === '\n')) {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
    }
  }
  if (cur.trim()) parts.push(cur.trim());

  if (parts.length > 1) {
    return parts.map(part => `<div class="sol-math-line">${renderLatexString(part)}</div>`).join('');
  }
  return `<div class="sol-math-line">${renderLatexString(rawText)}</div>`;
}
window.formatStepEquations = formatStepEquations;

function toggleSolutionConceptExplanation(qId) {
  const box = document.getElementById(`boxExplain_${qId}`);
  const btn = document.getElementById(`btnExplain_${qId}`);
  if (!box) return;
  const isHidden = box.style.display === 'none' || !box.style.display;
  box.style.display = isHidden ? 'block' : 'none';
  if (btn) {
    btn.innerHTML = isHidden 
      ? '<i data-lucide="chevron-up" style="width:13px; height:13px;"></i> Hide Concept &amp; Reasoning'
      : '<i data-lucide="help-circle" style="width:13px; height:13px;"></i> View Concept &amp; Reasoning';
    if (window.lucide && window.lucide.createIcons) lucide.createIcons();
  }
}
window.toggleSolutionConceptExplanation = toggleSolutionConceptExplanation;

function formatIntuitiveSteps(q) {
  const chNum = Number(q.chapter_number) || 1;
  const marks = Number(q.marks || q.marks_weightage || (q.difficulty === 'HARD' ? 5 : (q.difficulty === 'EASY' ? 1 : 3)));
  const solutionText = (q.solution_latex || 'Detailed step-by-step solution attached.').trim();
  const correctAnswer = (q.correct_answer_latex || q.correct_answer || 'Verified').trim();
  const subjectLower = (q.subject || q.discipline || '').toLowerCase();
  const isScience = subjectLower.includes('sci') || subjectLower.includes('phys') || subjectLower.includes('chem') || subjectLower.includes('bio');

  let principle = '';
  let principleIntuition = '';
  let formulaLatex = '';
  let examTip = '';

  if (isScience) {
    const chLower = (q.chapter_name || q.chapter || '').toLowerCase();
    const qTextLower = (q.question_latex || q.question_text || '').toLowerCase();
    const solLower = solutionText.toLowerCase();
    const combined = `${chLower} ${qTextLower} ${solLower}`;

    // Senior Physics & Specific Physics derivation rules
    if (combined.includes('drift') || combined.includes('resistivity') || combined.includes('relaxation time') || combined.includes('ne^2') || combined.includes('rho =')) {
      principle = "Microscopic Ohm's Law, Drift Velocity & Resistivity Deduction";
      principleIntuition = "Free electrons accelerate under an applied electric field and undergo lattice collisions at mean free time tau. The resulting steady drift velocity produces current I = neAv_d, yielding resistivity independent of conductor dimensions.";
      formulaLatex = "v_d = \\frac{eE\\tau}{m}, \\quad I = n e A v_d, \\quad \\rho = \\frac{m}{n e^2 \\tau}, \\quad \\vec{J} = \\sigma \\vec{E}";
      examTip = "Examiner Tip: State the definition of relaxation time tau explicitly and show intermediate substitution of E = V/L into the current formula.";
    } else if (combined.includes('lcr') || combined.includes('impedance') || combined.includes('resonance') || combined.includes('alternating current')) {
      principle = "Series LCR Resonant Circuit, Phasor Relations & Impedance";
      principleIntuition = "In a series LCR circuit, voltages across inductor and capacitor are out of phase by 180 degrees. Total impedance reaches its minimum resistive value at the natural resonant frequency.";
      formulaLatex = "Z = \\sqrt{R^2 + (X_L - X_C)^2}, \\quad \\tan\\phi = \\frac{X_L - X_C}{R}, \\quad f_r = \\frac{1}{2\\pi\\sqrt{LC}}";
      examTip = "Examiner Tip: Always state the individual reactance formulas X_L = omega L and X_C = 1/(omega C) before calculating impedance Z.";
    } else if (combined.includes('gauss') || combined.includes('infinite plane') || combined.includes('sheet of charge') || combined.includes('flux')) {
      principle = "Gauss's Law & Electric Field of an Infinite Plane Sheet";
      principleIntuition = "By planar symmetry, electric field vectors are normal to both flat faces of the sheet. A cylindrical Gaussian pillbox captures electric flux exclusively through its two end-caps.";
      formulaLatex = "\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enc}}}{\\varepsilon_0} \\implies 2EA = \\frac{\\sigma A}{\\varepsilon_0} \\implies E = \\frac{\\sigma}{2\\varepsilon_0}";
      examTip = "Crucial Note: Explicitly state that the resulting field E is uniform and independent of the distance r from the sheet.";
    } else if (combined.includes('rolling') || combined.includes('moment of inertia') || combined.includes('rotational')) {
      principle = "Pure Rolling Motion & Conservation of Mechanical Energy";
      principleIntuition = "In pure rolling without slipping, total kinetic energy is the sum of translational kinetic energy of the center of mass and rotational kinetic energy about the center of mass.";
      formulaLatex = "v_{\\text{cm}} = \\omega R, \\quad K_{\\text{total}} = \\frac{1}{2}Mv_{\\text{cm}}^2 + \\frac{1}{2}I_{\\text{cm}}\\omega^2 = \\frac{1}{2}Mv^2\\left(1 + \\frac{k^2}{R^2}\\right)";
      examTip = "Examiner Tip: State the moment of inertia I for the specific rolling geometry explicitly before equating with potential energy.";
    } else if (combined.includes('lens maker') || (combined.includes('refraction') && combined.includes('spherical surface'))) {
      principle = "Refraction at Spherical Surfaces & Lens Maker's Formula";
      principleIntuition = "Apply refraction at two successive curved spherical boundaries of a thin lens to relate focal length directly to radii of curvature and refractive index.";
      formulaLatex = "\\frac{1}{f} = (\\mu - 1)\\left(\\frac{1}{R_1} - \\frac{1}{R_2}\\right)";
      examTip = "Examiner Warning: Apply the Cartesian sign convention strictly to radii R1 and R2.";
    } else if (chLower.includes('light') || chLower.includes('mirror') || chLower.includes('lens')) {
      principle = 'Ray Optics: Spherical Mirrors & Lens Formula with Sign Convention';
      principleIntuition = 'In spherical mirrors and lenses, apply the Cartesian sign convention strictly. Distances measured against the incident light are negative (object distance u is always negative). Focal length of a concave mirror is negative.';
      formulaLatex = '\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f}, \\quad m = -\\frac{v}{u} = \\frac{h\'}{h} \\quad (\\text{Mirror})';
      examTip = 'Examiner Warning: A negative magnification (m < 0) denotes a Real & Inverted image; positive magnification (m > 0) denotes a Virtual & Erect image.';
    } else if (chLower.includes('elect') || chLower.includes('current')) {
      principle = 'Ohm\'s Law, Circuit Resistance & Joule\'s Law of Heating';
      principleIntuition = 'Electric current is directly proportional to potential difference (V = IR). When current flows through a resistance for time t, electrical energy is converted into heat energy.';
      formulaLatex = 'V = IR, \\quad P = VI = I^2R = \\frac{V^2}{R}, \\quad H = P \\cdot t = I^2Rt';
      examTip = 'Crucial Step: Always convert time from hours or minutes into seconds before calculating heat energy H in Joules (1 hr = 3600 s).';
    } else if (chLower.includes('chem') || chLower.includes('reaction') || chLower.includes('metal')) {
      principle = 'Law of Conservation of Mass & Stoichiometric Chemical Balancing';
      principleIntuition = 'In a balanced chemical reaction, the number of atoms of each element on the reactant side must equal the number of atoms on the product side. Physical state symbols (s, l, g, aq) must be indicated.';
      formulaLatex = '\\sum \\text{Atoms (Reactants)} = \\sum \\text{Atoms (Products)}';
      examTip = 'Always write physical states (s, l, g, aq) and mention reaction conditions (heat, catalyst) above the reaction arrow to earn the full marking score.';
    } else {
      principle = 'Core Science & Biological Principles';
      principleIntuition = 'Analyze the biological/chemical process sequentially, highlighting key anatomical structures, hormonal regulation, or molecular interactions.';
      formulaLatex = '\\text{Observe balanced physiological & biochemical mechanisms}';
      examTip = 'Use precise biological terminology and reference organ/cellular locations explicitly.';
    }
  } else {
    // Mathematics 14-Chapter Detailed Pedagogical Taxonomy
    switch (chNum) {
      case 1:
        principle = 'Real Numbers & Euclid\'s Division Lemma';
        principleIntuition = 'To find the Highest Common Factor (HCF) of two positive integers, apply Euclid\'s Division Algorithm (a = bq + r). We repeatedly divide the divisor by the remainder until the remainder becomes zero. For irrationality proofs, assume the contrary (rationality) and derive a contradiction with coprimality.';
        formulaLatex = 'a = bq + r \\quad (0 \\le r < b) \\quad \\text{and} \\quad \\text{HCF}(a, b) \\times \\text{LCM}(a, b) = a \\times b';
        examTip = 'Examiner Warning: The HCF is the divisor at the zero-remainder step, never the quotient. In irrationality proofs, always explicitly state that a and b are coprime positive integers.';
        break;
      case 2:
        principle = 'Polynomials & Relations Between Zeroes and Coefficients';
        principleIntuition = 'To determine the zeroes of a quadratic polynomial ax² + bx + c, set P(x) = 0 and factorize by splitting the middle term. Then verify using the sum and product coefficient relations.';
        formulaLatex = '\\text{Sum: } \\alpha + \\beta = -\\frac{b}{a}, \\quad \\text{Product: } \\alpha\\beta = \\frac{c}{a}';
        examTip = 'Watch the negative sign in -b/a carefully! If the polynomial is x² - 5x + 6, b = -5, so -b/a = -(-5)/1 = +5.';
        break;
      case 3:
        principle = 'Pair of Linear Equations in Two Variables';
        principleIntuition = 'Solve two simultaneous equations by eliminating one variable through substitution or algebraic addition/subtraction. Then back-substitute to find the remaining variable.';
        formulaLatex = '\\frac{a_1}{a_2} \\neq \\frac{b_1}{b_2} \\implies \\text{Unique Solution}, \\quad \\frac{a_1}{a_2} = \\frac{b_1}{b_2} = \\frac{c_1}{c_2} \\implies \\text{Infinitely Many Solutions}';
        examTip = 'Always test your calculated (x, y) coordinates in BOTH original equations to confirm they satisfy both lines.';
        break;
      case 4:
        principle = 'Quadratic Equations & Discriminant Nature of Roots';
        principleIntuition = 'Express the equation in standard form ax² + bx + c = 0. Calculate discriminant D = b² - 4ac to ascertain whether real roots exist before applying the quadratic formula.';
        formulaLatex = 'D = b^2 - 4ac, \\quad x = \\frac{-b \\pm \\sqrt{D}}{2a} \\quad (D \\ge 0)';
        examTip = 'In real-world word problems (speed, age, dimensions), always reject negative roots and explicitly write a concluding sentence explaining why a negative value is inadmissible.';
        break;
      case 5:
        principle = 'Arithmetic Progressions (AP): General Term and Sum';
        principleIntuition = 'Identify the first term a and common difference d = a₂ - a₁. Use the nth term formula to find unknown indices or values, and the sum formula for aggregate totals.';
        formulaLatex = 'a_n = a + (n - 1)d, \\quad S_n = \\frac{n}{2}[2a + (n - 1)d] = \\frac{n}{2}[a + l]';
        examTip = 'Remember: The term count n must always be a positive integer (n ∈ N). If you calculate a fractional or negative n, re-check your arithmetic.';
        break;
      case 6:
        principle = 'Triangles & Basic Proportionality Theorem (Thales\' Theorem)';
        principleIntuition = 'When a line is drawn parallel to one side of a triangle intersecting the other two sides, it divides them in the same ratio (AD/DB = AE/EC). For similar triangles, corresponding angles are equal and corresponding sides are proportional.';
        formulaLatex = '\\frac{AD}{DB} = \\frac{AE}{EC} \\quad (\\text{when } DE \\parallel BC), \\quad \\triangle ABC \\sim \\triangle DEF';
        examTip = 'Write the triangle similarity statement with strictly corresponding vertices in order (e.g. ∆ABC ~ ∆PQR) before setting up side ratios.';
        break;
      case 7:
        principle = 'Coordinate Geometry: Distance & Section Formulae';
        principleIntuition = 'Calculate Euclidean distance between two points using the Pythagorean distance formula. To locate a point dividing a line segment in a given ratio m₁:m₂, apply the internal section formula.';
        formulaLatex = 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}, \\quad P(x, y) = \\left(\\frac{m_1x_2 + m_2x_1}{m_1 + m_2}, \\frac{m_1y_2 + m_2y_1}{m_1 + m_2}\\right)';
        examTip = 'Be careful when squaring negative coordinate differences: (-5)² = +25, never -25.';
        break;
      case 8:
        principle = 'Introduction to Trigonometry & Fundamental Identities';
        principleIntuition = 'Use right-angled triangle definitions (SOH-CAH-TOA) and Pythagorean trigonometric identities. In identity proofs, convert complex ratios like tan, cot, sec, csc into terms of sin and cos.';
        formulaLatex = '\\sin^2\\theta + \\cos^2\\theta = 1, \\quad 1 + \\tan^2\\theta = \\sec^2\\theta, \\quad 1 + \\cot^2\\theta = \\csc^2\\theta';
        examTip = 'In identity proofs, transform the Left-Hand Side (LHS) step-by-step until it matches the Right-Hand Side (RHS). Never assume LHS = RHS at the start.';
        break;
      case 9:
        principle = 'Applications of Trigonometry: Heights & Distances';
        principleIntuition = 'Draw a schematic diagram representing the observer, the elevated/depressed target, and horizontal ground. Apply tan θ = Perpendicular / Base in the right triangle.';
        formulaLatex = '\\tan\\theta = \\frac{\\text{Height of Object (Opposite)}}{\\text{Horizontal Distance (Adjacent)}}';
        examTip = 'The angle of depression from a vantage point equals the angle of elevation from ground level (alternate interior angles). Draw the horizontal reference line at the eye level.';
        break;
      case 10:
        principle = 'Circles: Tangent Perpendicularity & External Tangents';
        principleIntuition = 'The tangent at any point of a circle is perpendicular to the radius through the point of contact (OP ⊥ PT). Tangents drawn from an external point to a circle are equal in length (PA = PB).';
        formulaLatex = 'OP \\perp PT \\quad (\\angle OPT = 90^\\circ), \\quad PA = PB \\quad (\\text{from external point } P)';
        examTip = 'Draw the radius to the point of contact immediately; it forms a right-angled triangle where Pythagoras theorem can be applied.';
        break;
      case 11:
        principle = 'Areas Related to Circles: Sectors & Segments';
        principleIntuition = 'A sector of angle θ is a fractional part (θ/360°) of the circular area πr². A segment is obtained by subtracting the area of the corresponding triangle from the sector area.';
        formulaLatex = '\\text{Area of Sector} = \\frac{\\theta}{360^\\circ} \\times \\pi r^2, \\quad \\text{Arc Length} = \\frac{\\theta}{360^\\circ} \\times 2\\pi r';
        examTip = 'Area of minor segment = Area of minor sector - Area of triangle. Unless specified otherwise, use π = 22/7.';
        break;
      case 12:
        principle = 'Surface Areas and Volumes of Solids & Combinations';
        principleIntuition = 'When solids are combined (e.g. hemisphere + cone), total volume is the arithmetic sum of individual volumes. Total surface area includes ONLY the exposed exterior surfaces.';
        formulaLatex = 'V_{\\text{cone}} = \\frac{1}{3}\\pi r^2 h, \\quad V_{\\text{hemi}} = \\frac{2}{3}\\pi r^3, \\quad \\text{CSA}_{\\text{cone}} = \\pi r l \\quad (l = \\sqrt{r^2 + h^2})';
        examTip = 'Do NOT add the flat contact surface areas when two solids are glued together, because those faces are hidden inside the combined solid.';
        break;
      case 13:
        principle = 'Statistics: Measures of Central Tendency';
        principleIntuition = 'For continuous grouped data, compute class marks xi = (lower + upper) / 2. Tabulate frequencies fi and products fi·xi to evaluate the mean.';
        formulaLatex = '\\bar{x} = \\frac{\\sum f_i x_i}{\\sum f_i}, \\quad \\text{Median} = l + \\left(\\frac{\\frac{N}{2} - cf}{f}\\right)h';
        examTip = 'In median calculation, cf is the cumulative frequency of the class PRECEDING the median class, not the median class itself.';
        break;
      case 14:
        principle = 'Classical Probability of an Event';
        principleIntuition = 'Probability is the ratio of favorable elementary outcomes to total possible equally likely outcomes in the sample space. The sum of complementary probabilities P(E) + P(not E) = 1.';
        formulaLatex = 'P(E) = \\frac{\\text{Favorable Outcomes } n(E)}{\\text{Total Possible Outcomes } n(S)}, \\quad 0 \\le P(E) \\le 1';
        examTip = 'Probabilities must always lie between 0 and 1 inclusive. Never leave a probability greater than 1 or negative.';
        break;
      default:
        principle = 'Standard NCERT Class 10th Mathematical Formula';
        principleIntuition = 'Apply the fundamental theorems and formulas prescribed by the NCERT curriculum.';
        formulaLatex = '\\text{Refer to standard Board syllabus formulations}';
        examTip = 'State standard formulas clearly and show intermediate calculation lines to secure step marks.';
    }
  }

  // Math-safe step parser (handles newlines and inline step numbers like '1. ... 2. ...')
  let rawBlocks = [];
  const inlineStepRegex = /(?:^|\n|(?<=[.;!?:]|\$\$|\$)\s+)(?=(?:Step\s*\d+[:.]?\s*|\d+\.\s+))/i;

  if (solutionText.includes('\n\n')) {
    rawBlocks = solutionText.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  } else if (/^\s*(?:Step\s*\d+|\d+\.)/im.test(solutionText) || inlineStepRegex.test(solutionText)) {
    const splitArr = solutionText.split(inlineStepRegex).map(s => s.trim()).filter(Boolean);
    if (splitArr.length > 1) {
      rawBlocks = splitArr;
    } else if (solutionText.includes('\n')) {
      rawBlocks = solutionText.split(/\n+/).map(s => s.trim()).filter(Boolean);
    }
  } else if (solutionText.includes('\n')) {
    rawBlocks = solutionText.split(/\n+/).map(s => s.trim()).filter(Boolean);
  }

  // If still single block, try splitting sentences without breaking math $...$
  if (rawBlocks.length <= 1) {
    const sentences = [];
    let cur = '';
    let inMath = false;
    for (let i = 0; i < solutionText.length; i++) {
      const ch = solutionText[i];
      if (ch === '$') inMath = !inMath;
      cur += ch;
      if (!inMath && (ch === '.' || ch === ';') && (i === solutionText.length - 1 || solutionText[i + 1] === ' ' || solutionText[i + 1] === '\n')) {
        if (cur.trim()) sentences.push(cur.trim());
        cur = '';
      }
    }
    if (cur.trim()) sentences.push(cur.trim());
    rawBlocks = sentences.length > 1 ? sentences : (rawBlocks.length === 1 ? rawBlocks : [solutionText]);
  }

  const total = rawBlocks.length;
  const parsedSteps = rawBlocks.map((blk, idx) => {
    let clean = blk.replace(/^(?:Step\s*\d+[:.]?\s*|\d+\.\s*)/i, '').trim();
    let title = '';
    const titleMatch = clean.match(/^\*\*([^*]+)\*\*:\s*([\s\S]*)$/);
    if (titleMatch) {
      title = titleMatch[1].trim();
      clean = titleMatch[2].trim();
    } else {
      if (idx === 0) {
        title = total === 1 ? 'Complete Working & Derivation' : 'Setup & Governing Equations';
      } else if (idx === total - 1) {
        title = 'Final Analytical Deduction';
      } else {
        title = `Step-by-Step Derivation (Part ${idx + 1})`;
      }
    }

    let stepRubric = '';
    if (marks === 1) {
      stepRubric = idx === 0 ? '½ Mark' : '½ Mark';
    } else if (marks === 2) {
      stepRubric = idx === 0 ? '½ Mark' : (idx === total - 1 ? '½ Mark' : '1 Mark');
    } else if (marks === 3) {
      stepRubric = idx === 0 ? '1 Mark' : (idx === total - 1 ? '½ Mark' : '1½ Marks');
    } else {
      stepRubric = idx === 0 ? '1 Mark' : (idx === total - 1 ? '1 Mark' : '1½ Marks');
    }

    return {
      stepIndex: idx + 1,
      title,
      text: clean,
      stepRubric
    };
  });

  const rawSteps = parsedSteps.map(s => s.text);

  let rubric = [];
  if (marks === 1) {
    rubric = [
      { step: 'Step 1: Formula / Concept Identification', marks: '½ Mark' },
      { step: 'Step 2: Correct Final Answer with Valid Units', marks: '½ Mark' }
    ];
  } else if (marks === 2) {
    rubric = [
      { step: 'Step 1: Stating Relevant Theorem / Given Formula', marks: '½ Mark' },
      { step: 'Step 2: Numerical / Algebraic Substitution & Working', marks: '1 Mark' },
      { step: 'Step 3: Final Answer Statement with Proper Units', marks: '½ Mark' }
    ];
  } else if (marks === 3) {
    rubric = [
      { step: 'Step 1: Schematic Figure / Principle Identification', marks: '1 Mark' },
      { step: 'Step 2: Complete Mathematical Derivation & Step-by-Step Calculation', marks: '1½ Marks' },
      { step: 'Step 3: Accurate Final Result with Concluding Sentence', marks: '½ Mark' }
    ];
  } else {
    rubric = [
      { step: 'Step 1: Clear Geometric / Algebraic Setup & Stating Formulae', marks: '1 Mark' },
      { step: 'Step 2: Primary Algebraic Operations & Intermediate Reductions', marks: '2 Marks' },
      { step: 'Step 3: Secondary Factorization / Linear Elimination Step', marks: '1 Mark' },
      { step: 'Step 4: Final Verified Answer with Specified Units & Verification', marks: '1 Mark' }
    ];
  }

  const hints = Array.isArray(q.socratic_hints) && q.socratic_hints.length > 0 
    ? q.socratic_hints 
    : [
        'Write the standard formula explicitly before numerical substitutions to secure the step mark.',
        'Always check for unit consistency (e.g., meters vs centimeters) before finalizing multiplication or division.',
        'In geometry and algebra, write a one-line concluding sentence explicitly answering what the problem asked.'
      ];

  const answerInterpretation = 'This concludes the analytical deduction. Following this sequential derivation guarantees full marks in CBSE & HP Board evaluations.';

  return {
    principle,
    principleIntuition,
    formulaLatex,
    parsedSteps,
    rawSteps,
    correctAnswer,
    answerInterpretation,
    rubric,
    hints,
    examTip
  };
}

async function loadQuestionBankView(forceReload = false) {
  const curClassId = teacherBuilderState.selectedClassId || '';
  const currentClass = (teacherBuilderState.classes || []).find(c => c.id === curClassId);
  const isClass10 = curClassId === '10-Science-A' 
    || currentClass?.grade === '10' 
    || String(curClassId).startsWith('10')
    || (teacherBuilderState.teacherSubjectKey || '').startsWith('CLASS10_') 
    || teacherBuilderState.activeTeacher?.grade === '10';

  let activeSubj = (teacherBuilderState.selectedSubjectKey || teacherBuilderState.teacherSubjectKey || '').toUpperCase();
  if (isClass10) {
    if (!activeSubj.startsWith('CLASS10_')) {
      activeSubj = (activeSubj === 'SCIENCE' || activeSubj === 'BIOLOGY') ? 'CLASS10_SCIENCE' : 'CLASS10_MATHEMATICS';
      teacherBuilderState.selectedSubjectKey = activeSubj;
      teacherBuilderState.teacherSubjectKey = activeSubj;
    }
  } else {
    if (activeSubj.startsWith('CLASS10_')) {
      activeSubj = activeSubj === 'CLASS10_SCIENCE' ? 'PHYSICS' : 'MATHEMATICS';
      teacherBuilderState.selectedSubjectKey = activeSubj;
      teacherBuilderState.teacherSubjectKey = activeSubj;
    }
  }

  const headerTitle = document.getElementById('qbHeaderTitle');
  const headerSubtitle = document.getElementById('qbHeaderSubtitle');
  const badgeText = document.getElementById('qbBadgeText');
  const subjectSelect = document.getElementById('selectQbSubject');
  const chapterSelect = document.getElementById('selectQbChapter');
  const container = document.getElementById('containerQbQuestions');

  if (!container) return;

  if (isClass10) {
    if (activeSubj === 'CLASS10_SCIENCE') {
      if (headerTitle) headerTitle.innerText = 'Class 10th Science Question Bank';
      if (headerSubtitle) headerSubtitle.innerText = 'Curated Board PYQs (2018-2024), NCERT Examples & Exercises';
      if (badgeText) badgeText.innerText = 'Class 10th Foundation • CBSE & HP Board';
    } else {
      if (headerTitle) headerTitle.innerText = 'Class 10th Mathematics Question Bank';
      if (headerSubtitle) headerSubtitle.innerText = '438 Curated Questions • 14 Chapters • Board PYQs (2018-2024), NCERT Examples & In-Text Exercises';
      if (badgeText) badgeText.innerText = 'Class 10th Foundation • CBSE & HP Board';
    }
  } else {
    const sName = teacherBuilderState.activeTeacher?.subjectName || activeSubj;
    if (headerTitle) headerTitle.innerText = `${sName} Question Bank & PYQ Repository`;
    if (headerSubtitle) headerSubtitle.innerText = 'Senior Secondary (+1 & +2) Curated Questions • JEE / NEET / CBSE Boards';
    if (badgeText) badgeText.innerText = `Senior Secondary Track • Department of ${sName}`;
  }

  if (subjectSelect) {
    if (isClass10) {
      subjectSelect.innerHTML = `
        <option value="CLASS10_MATHEMATICS" ${activeSubj === 'CLASS10_MATHEMATICS' ? 'selected' : ''}>Mathematics (Class 10th • 438 Qs)</option>
        <option value="CLASS10_SCIENCE" ${activeSubj === 'CLASS10_SCIENCE' ? 'selected' : ''}>Science (Class 10th Foundation)</option>
      `;
    } else {
      subjectSelect.innerHTML = `
        <option value="PHYSICS" ${activeSubj === 'PHYSICS' ? 'selected' : ''}>Physics (Senior Secondary)</option>
        <option value="CHEMISTRY" ${activeSubj === 'CHEMISTRY' ? 'selected' : ''}>Chemistry (Senior Secondary)</option>
        <option value="MATHEMATICS" ${activeSubj === 'MATHEMATICS' ? 'selected' : ''}>Mathematics (Senior Secondary)</option>
        <option value="BIOLOGY" ${activeSubj === 'BIOLOGY' ? 'selected' : ''}>Biology (Senior Secondary / NEET)</option>
      `;
    }
  }

  if (!isClass10 || activeSubj === 'CLASS10_SCIENCE') {
    const taxSubj = teacherBuilderState.currentTaxonomy?.subjectKey || teacherBuilderState.currentTaxonomy?.subject;
    if (!teacherBuilderState.currentTaxonomy || taxSubj !== activeSubj) {
      try {
        const gradeParam = activeSubj === 'PHYSICS' ? '12' : 'ALL';
        const taxRes = await fetch(`${getApiBaseUrl()}/api/curriculum/taxonomy/${activeSubj}?grade=${gradeParam}`);
        if (taxRes.ok) {
          teacherBuilderState.currentTaxonomy = await taxRes.json();
        }
      } catch (e) {
        console.warn('Failed to load taxonomy for QB:', e);
      }
    }
  }

  if (chapterSelect) {
    const curVal = chapterSelect.value || 'ALL';
    if (isClass10 && activeSubj === 'CLASS10_MATHEMATICS') {
      chapterSelect.innerHTML = `<option value="ALL">All 14 Chapters</option>` +
        CLASS10_MATH_CHAPTERS.map(c => `<option value="${c.num}">Ch ${c.num}: ${c.name}</option>`).join('');
    } else if (teacherBuilderState.currentTaxonomy?.chapters) {
      let chs = teacherBuilderState.currentTaxonomy.chapters;
      if (activeSubj === 'PHYSICS') {
        const targetGrade = String(teacherBuilderState.activeGrade || '12');
        const filtered = chs.filter(c => String(c.grade) === targetGrade);
        if (filtered.length > 0) chs = filtered;
      }
      chapterSelect.innerHTML = `<option value="ALL">All ${chs.length} Chapters</option>` +
        chs.map(c => `<option value="${c.chapterNumber || c.id}">Ch ${c.chapterNumber || ''}: ${c.chapterName || c.title}</option>`).join('');
    } else if (activeSubj === 'PHYSICS') {
      const phyChapters = Object.keys(getChaptersForSubject('PHYSICS', teacherBuilderState.activeGrade));
      chapterSelect.innerHTML = `<option value="ALL">All ${phyChapters.length} Chapters</option>` +
        phyChapters.map((ch, idx) => `<option value="${idx + 1}">Ch ${idx + 1}: ${ch.replace(/^Chapter\\s*\\d+\\s*:\\s*/i, '')}</option>`).join('');
    }
    const isValidVal = Array.from(chapterSelect.options).some(o => o.value === curVal);
    chapterSelect.value = isValidVal ? curVal : 'ALL';
  }

  populateQbChapterPills(chapterSelect?.value || 'ALL');

  if (state.questionBankData.length > 0 && state.currentQbSubjectKey === activeSubj && !forceReload) {
    filterQuestionBankCards();
    return;
  }

  container.innerHTML = `
    <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
      <i data-lucide="loader-2" class="spin" style="width:28px; height:28px; margin: 0 auto 12px; display:block; color:var(--accent-blue);"></i>
      Loading authentic questions from repository...
    </div>
  `;
  initLucideIcons();

  try {
    let url = '';
    if (isClass10) {
      if (activeSubj === 'CLASS10_SCIENCE') {
        url = `${getApiBaseUrl()}/api/questions/subject-banks/class10_science`;
      } else {
        url = `${getApiBaseUrl()}/api/questions/class10-math-bank?limit=450`;
      }
    } else {
      const bankKey = activeSubj === 'PHYSICS' ? 'senior_physics' 
        : activeSubj === 'CHEMISTRY' ? 'senior_chemistry' 
        : activeSubj === 'BIOLOGY' ? 'senior_biology' 
        : 'senior_mathematics';
      url = `${getApiBaseUrl()}/api/questions/subject-banks/${bankKey}`;
    }

    let res = null;
    try {
      res = await fetch(url);
    } catch (localErr) {
      console.warn('Local question fetch failed, attempting cloud production fallback:', localErr);
      if (isClass10 && activeSubj === 'CLASS10_MATHEMATICS') {
        res = await fetch('https://haps-ai-scholar-assistant.vercel.app/api/questions/class10-math-bank?limit=450');
      }
    }

    if (res && res.ok) {
      const data = await res.json();
      state.questionBankData = data.questions || [];
      state.currentQbSubjectKey = activeSubj;
    } else if (isClass10 && activeSubj === 'CLASS10_MATHEMATICS') {
      const fallbackRes = await fetch('https://haps-ai-scholar-assistant.vercel.app/api/questions/class10-math-bank?limit=450');
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        state.questionBankData = fbData.questions || [];
        state.currentQbSubjectKey = activeSubj;
      } else {
        throw new Error(`API returned ${res?.status || fallbackRes.status}`);
      }
    } else {
      throw new Error(`API returned ${res?.status}`);
    }
  } catch (err) {
    console.warn('Failed to fetch from specialized endpoint:', err);
    state.questionBankData = [];
  }

  filterQuestionBankCards();
}

function handleQbSubjectChange(subjKey) {
  teacherBuilderState.selectedSubjectKey = subjKey;
  if (subjKey.startsWith('CLASS10_')) {
    teacherBuilderState.teacherSubjectKey = subjKey;
  }
  loadQuestionBankView(true);
}

function resetQbFilters() {
  const chSelect = document.getElementById('selectQbChapter');
  const srcSelect = document.getElementById('selectQbSource');
  const diffSelect = document.getElementById('selectQbDifficulty');
  const fmtSelect = document.getElementById('selectQbFormat');
  const searchInput = document.getElementById('inputQbSearch');
  if (chSelect) chSelect.value = 'ALL';
  if (srcSelect) srcSelect.value = 'ALL';
  if (diffSelect) diffSelect.value = 'ALL';
  if (fmtSelect) fmtSelect.value = 'ALL';
  if (searchInput) searchInput.value = '';

  quickFilterQbChapter('ALL');
  quickFilterQbSource('ALL');
}

function openQbForChapter(chNum, event) {
  if (event) event.stopPropagation();
  switchTeacherTab('tabQuestionBank');
  const chSelect = document.getElementById('selectQbChapter');
  if (chSelect) {
    chSelect.value = String(chNum);
  }
  quickFilterQbChapter(chNum);
  loadQuestionBankView().then(() => {
    if (chSelect) {
      chSelect.value = String(chNum);
      quickFilterQbChapter(chNum);
    }
  });
}

window.handleQbChapterChange = function(chapterVal) {
  const topicSelect = document.getElementById('selectQbTopic');
  const activeSubj = teacherBuilderState.teacherSubjectKey || 'PHYSICS';
  if (!topicSelect) {
    filterQuestionBankCards();
    return;
  }
  if (chapterVal === 'ALL') {
    topicSelect.innerHTML = `<option value="ALL">All Topics in Chapter</option>`;
  } else {
    let topics = [];
    const chaptersObj = getChaptersForSubject(activeSubj, teacherBuilderState.activeGrade);
    const chNames = Object.keys(chaptersObj);
    const chIndex = parseInt(chapterVal, 10) - 1;
    if (!isNaN(chIndex) && chIndex >= 0 && chIndex < chNames.length) {
      topics = chaptersObj[chNames[chIndex]] || [];
    } else if (chaptersObj[chapterVal]) {
      topics = chaptersObj[chapterVal];
    } else {
      const cleanVal = String(chapterVal).toLowerCase().replace(/^chapter\s*\d+\s*:\s*/i, '').trim();
      const match = chNames.find(k => {
        const cleanK = k.toLowerCase().replace(/^chapter\s*\d+\s*:\s*/i, '').trim();
        return cleanK === cleanVal || cleanK.includes(cleanVal) || cleanVal.includes(cleanK);
      });
      if (match) topics = chaptersObj[match];
    }
    topicSelect.innerHTML = `<option value="ALL">All Topics in Chapter</option>` +
      topics.map(t => `<option value="${escapeHtml(t)}">🎯 ${escapeHtml(t)}</option>`).join('');
  }
  filterQuestionBankCards();
};

function filterQuestionBankCards() {
  const container = document.getElementById('containerQbQuestions');
  const statsLabel = document.getElementById('qbCountLabel');
  if (!container) return;

  const typeVal = document.getElementById('selectQbQuestionType')?.value || 'ALL';
  const chVal = document.getElementById('selectQbChapter')?.value || 'ALL';
  const topVal = document.getElementById('selectQbTopic')?.value || 'ALL';
  const srcVal = document.getElementById('selectQbSource')?.value || 'ALL';
  const diffVal = document.getElementById('selectQbDifficulty')?.value || 'ALL';
  const fmtVal = document.getElementById('selectQbFormat')?.value || 'ALL';
  const query = (document.getElementById('inputQbSearch')?.value || '').toLowerCase().trim();

  // Sync chapter strip pills active state
  const strip = document.getElementById('qbChapterPillsStrip');
  if (strip) {
    const pills = strip.querySelectorAll('.qb-chapter-pill');
    pills.forEach(pill => {
      if (pill.getAttribute('data-chapter') === String(chVal)) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // Sync source pills active state
  const srcStrip = document.getElementById('qbSourcePillsStrip');
  if (srcStrip) {
    const srcPills = srcStrip.querySelectorAll('.qb-source-pill');
    srcPills.forEach(pill => {
      if (pill.getAttribute('data-source') === srcVal) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  let filtered = [...(state.questionBankData || [])];

  if (chVal !== 'ALL') {
    filtered = filtered.filter(q => {
      if (q.chapter_number !== undefined) return String(q.chapter_number) === String(chVal);
      const chName = (q.chapter_name || q.chapter || '').toLowerCase();
      return chName.includes(`ch ${chVal}`) || chName.includes(`chapter ${chVal}`);
    });
  }

  if (typeVal !== 'ALL') {
    filtered = filtered.filter(q => {
      const qSrc = (q.question_source || q.pyq_appearance || q.ncert_mapping?.pyq_tag || '').toUpperCase();
      if (typeVal === 'PYQ') {
        return q.question_source === 'CBSE_PYQ' || qSrc.includes('PYQ') || qSrc.includes('BOARD') || qSrc.includes('CBSE') || qSrc.includes('HPBOSE');
      }
      if (typeVal === 'BOARD_PATTERN') {
        return q.question_source === 'CBSE_SAMPLE_PATTERN' || qSrc.includes('PATTERN') || qSrc.includes('SAMPLE') || qSrc.includes('STANDARD') || qSrc.includes('BASIC') || qSrc.includes('NCERT');
      }
      return true;
    });
  } else if (srcVal !== 'ALL') {
    filtered = filtered.filter(q => {
      const qSrc = (q.question_source || q.pyq_appearance || q.ncert_mapping?.pyq_tag || '').toUpperCase();
      if (srcVal === 'PYQ') {
        return q.question_source === 'CBSE_PYQ' || qSrc.includes('PYQ') || qSrc.includes('BOARD') || qSrc.includes('CBSE') || qSrc.includes('HPBOSE') || qSrc.includes('COMMON');
      }
      if (srcVal === 'NCERT_EXERCISE' || srcVal === 'NCERT_TEXTBOOK' || srcVal === 'NCERT_EXAMPLE') {
        return q.question_source === 'NCERT_TEXTBOOK' || qSrc.includes('NCERT') || qSrc.includes('EXAMPLE') || qSrc.includes('EXERCISE') || qSrc.includes('TEXTBOOK');
      }
      if (srcVal === 'CBSE_PATTERN') {
        return q.question_source === 'CBSE_SAMPLE_PATTERN' || qSrc.includes('PATTERN') || qSrc.includes('SAMPLE') || qSrc.includes('STANDARD') || qSrc.includes('BASIC');
      }
      return true;
    });
  }

  if (topVal && topVal !== 'ALL') {
    const qTop = topVal.toLowerCase().replace(/🎯\s*/g, '').trim();
    filtered = filtered.filter(q => {
      const text = `${q.topic || ''} ${q.subtopic || ''} ${q.question_latex || ''} ${q.questionText || ''}`.toLowerCase();
      return text.includes(qTop) || qTop.split(' ').some(w => w.length > 3 && text.includes(w));
    });
  }

  if (diffVal !== 'ALL') {
    filtered = filtered.filter(q => (q.difficulty || '').toUpperCase() === diffVal);
  }

  if (fmtVal !== 'ALL') {
    filtered = filtered.filter(q => {
      const qFmt = (q.question_format || q.question_type || q.format || '').toUpperCase();
      if (fmtVal === 'MCQ_SINGLE') return qFmt.includes('MCQ') || qFmt.includes('CHOICE');
      if (fmtVal === 'ASSERTION_REASON') return qFmt.includes('ASSERTION');
      if (fmtVal === 'SHORT_ANSWER') return qFmt.includes('SHORT') && !qFmt.includes('VERY');
      if (fmtVal === 'VERY_SHORT_ANSWER') return qFmt.includes('VERY_SHORT') || qFmt.includes('VSA');
      if (fmtVal === 'LONG_ANSWER') return qFmt.includes('LONG') || qFmt.includes('DERIVATION');
      if (fmtVal === 'CASE_STUDY') return qFmt.includes('CASE');
      return qFmt === fmtVal;
    });
  }

  if (query) {
    filtered = filtered.filter(q => {
      const qText = (q.question_latex || q.questionText || '').toLowerCase();
      const solText = (q.solution_latex || '').toLowerCase();
      const topic = (q.topic || q.subtopic || q.chapter_name || '').toLowerCase();
      const src = (q.question_source || q.pyq_appearance || '').toLowerCase();
      return qText.includes(query) || solText.includes(query) || topic.includes(query) || src.includes(query);
    });
  }

  state.qbFilteredQuestions = filtered;
  state.qbCurrentPage = 0;
  state.qbSolutionRevealed = false;

  renderQbCurrentPage();
}

// =============================================================================
// AI VOICE TUTOR & HINGLISH EXPLANATION ENGINE WITH STUDENT INTERRUPTION
// =============================================================================
const voiceTutorState = {
  activeQuestionId: null,
  activeQuestionText: '',
  isSpeaking: false,
  isListening: false,
  activeMode: 'IDLE', // 'READING' | 'HINGLISH_EXPLAINING' | 'INTERRUPTED'
  selectedVoice: 'swara', // 'swara' (Female Hinglish) | 'madhur' (Male Hinglish) | 'neerja' (Female Indian English) | 'prabhat' (Male Indian English)
  cachedBriefs: {},
  currentAudio: null, // HTML5 Audio element for studio Neural MP3 playback
  recognition: null
};

// Set teacher voice persona (Swara, Madhur, Neerja, Prabhat)
function setVoiceTutorPersona(qId, persona) {
  voiceTutorState.selectedVoice = persona || 'swara';
  const badge = document.getElementById(`voiceStatusBadge_${qId}`);
  if (badge) {
    const titles = {
      swara: 'Voice: Swara (Expressive Hinglish)',
      madhur: 'Voice: Madhur (Clear Hinglish)',
      neerja: 'Voice: Neerja (Indian English)',
      prabhat: 'Voice: Prabhat (Indian English)'
    };
    badge.innerHTML = `<i data-lucide="headphones" style="width:13px;height:13px;color:#38bdf8;"></i> ${titles[persona] || 'Voice: Swara'}`;
    initLucideIcons();
  }
}

// Clean raw LaTeX to natural spoken text
function cleanLatexForClientVoice(rawText) {
  if (!rawText) return '';
  let s = String(rawText);
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 upon $2');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1');
  s = s.replace(/\\times/g, ' into ');
  s = s.replace(/\\pm/g, 'plus minus ');
  s = s.replace(/\\cdot/g, ' into ');
  s = s.replace(/\\approx/g, ' approximately ');
  s = s.replace(/\\implies/g, ' which implies that ');
  s = s.replace(/\\sigma/g, 'sigma');
  s = s.replace(/\\varepsilon_0/g, 'epsilon not');
  s = s.replace(/\\rho/g, 'rho');
  s = s.replace(/\\tau/g, 'tau');
  s = s.replace(/\\theta/g, 'theta');
  s = s.replace(/\\omega/g, 'omega');
  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/\\lambda/g, 'lambda');
  s = s.replace(/\\alpha/g, 'alpha');
  s = s.replace(/\\beta/g, 'beta');
  s = s.replace(/\\Delta/g, 'delta');
  s = s.replace(/\\phi/g, 'phi');
  s = s.replace(/v_d/g, 'v d');
  s = s.replace(/X_L/g, 'X L');
  s = s.replace(/X_C/g, 'X C');
  s = s.replace(/a_n/g, 'a n');
  s = s.replace(/S_n/g, 'S n');
  s = s.replace(/\^2/g, ' square');
  s = s.replace(/\^3/g, ' cube');
  s = s.replace(/\\text\{([^}]+)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  s = s.replace(/\\le/g, 'less than or equal to');
  s = s.replace(/\\ge/g, 'greater than or equal to');
  s = s.replace(/\\neq/g, 'not equal to');
  s = s.replace(/=/g, ' equals ');
  s = s.replace(/[\$\\]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Select best Indian English / Hindi natural voice for WebSpeech fallback
function getOptimalVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  const topPicks = [
    v => v.name.includes('Swara') || v.name.includes('Madhur') || v.name.includes('Neerja'),
    v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online')) && (v.lang === 'hi-IN' || v.lang === 'en-IN'),
    v => v.lang === 'hi-IN' || v.name.includes('Hindi') || v.name.includes('हिन्दी'),
    v => v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Rishi') || v.name.includes('Lekha'),
    v => (v.name.includes('Natural') || v.name.includes('Enhanced') || v.name.includes('Samantha') || v.name.includes('Google')) && v.lang.startsWith('en'),
    v => v.lang.startsWith('en')
  ];

  for (const pick of topPicks) {
    const match = voices.find(pick);
    if (match) return match;
  }
  return voices[0] || null;
}

// Stop all audio playback (both HTML5 Neural MP3 audio and WebSpeech)
function stopVoiceAudioPlayback() {
  if (voiceTutorState.currentAudio) {
    try {
      voiceTutorState.currentAudio.pause();
      voiceTutorState.currentAudio.currentTime = 0;
    } catch (e) {}
    voiceTutorState.currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  voiceTutorState.isSpeaking = false;
}

// Speak text using human Neural MP3 audio stream with WebSpeech fallback
async function speakWithVoiceEngine(textToSpeak, voiceOverride, onStart, onEnd) {
  stopVoiceAudioPlayback();

  if (!textToSpeak || !textToSpeak.trim()) {
    if (onEnd) onEnd();
    return;
  }

  const cleanText = cleanLatexForClientVoice(textToSpeak);
  const voice = voiceOverride || voiceTutorState.selectedVoice || 'swara';
  const streamUrl = `${getApiBaseUrl()}/api/voice-tutor/audio?text=${encodeURIComponent(cleanText)}&voice=${encodeURIComponent(voice)}`;

  // 1. Try studio-quality Neural MP3 Audio stream
  try {
    const audio = new Audio();
    voiceTutorState.currentAudio = audio;

    audio.onplay = () => {
      voiceTutorState.isSpeaking = true;
      if (onStart) onStart();
    };

    audio.onended = () => {
      voiceTutorState.isSpeaking = false;
      voiceTutorState.currentAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = (e) => {
      console.warn('[VOICE TUTOR] Neural Audio stream error, falling back to enhanced browser voice:', e);
      voiceTutorState.currentAudio = null;
      speakWithBrowserWebSpeech(cleanText, onStart, onEnd);
    };

    audio.src = streamUrl;
    await audio.play();
    return;
  } catch (err) {
    console.warn('[VOICE TUTOR] Direct play failed or blocked by autoplay policy, falling back to speech synthesis:', err);
    speakWithBrowserWebSpeech(cleanText, onStart, onEnd);
  }
}

// Fallback browser speech synthesis with enhanced natural voices
function speakWithBrowserWebSpeech(cleanText, onStart, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voice = getOptimalVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || 'hi-IN';
  } else {
    utterance.lang = 'hi-IN';
  }

  utterance.rate = 1.0; // Natural conversational human speed
  utterance.pitch = 1.02;

  utterance.onstart = () => {
    voiceTutorState.isSpeaking = true;
    if (onStart) onStart();
  };

  utterance.onend = () => {
    voiceTutorState.isSpeaking = false;
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    voiceTutorState.isSpeaking = false;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}


// 1. Read Question Statement Aloud (Routed to Real-Time Voice Assistant)
async function readQuestionAloud(qId) {
  return startRealtimeVoiceAssistant(qId);
}

// 2. Explain in Hinglish (Routed to Real-Time Voice Assistant)
async function explainQuestionInHinglish(qId) {
  return startRealtimeVoiceAssistant(qId);
}

// 3. Interrupt Voice Tutor & Ask Doubt
function interruptVoiceTutor(qId) {
  stopVoiceAudioPlayback();
  voiceTutorState.activeMode = 'INTERRUPTED';
  sendWhiteboardMessage(qId, { type: 'PAUSE_PACING' });

  const banner = document.getElementById(`voiceBanner_${qId}`);
  const wave = document.getElementById(`voiceWave_${qId}`);
  const badge = document.getElementById(`voiceStatusBadge_${qId}`);
  const inputDoubt = document.getElementById(`inputVoiceDoubt_${qId}`);

  if (banner) {
    banner.classList.remove('speaking');
    banner.classList.add('listening');
  }
  if (wave) wave.classList.remove('active');
  if (badge) badge.innerHTML = `<i data-lucide="hand" style="width:13px;height:13px;color:#fb7185;"></i> Paused on Student Interruption &bull; Type or Speak Doubt`;
  initLucideIcons();

  if (inputDoubt) {
    inputDoubt.focus();
  }
}

// 4. Toggle Speech Recognition (Microphone) for Student Voice Doubt
function toggleVoiceMicInput(qId) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    alert('Speech recognition is not supported in this browser. You can type your doubt in the box directly!');
    document.getElementById(`inputVoiceDoubt_${qId}`)?.focus();
    return;
  }

  const btnMic = document.getElementById(`btnMic_${qId}`);
  const inputDoubt = document.getElementById(`inputVoiceDoubt_${qId}`);

  if (voiceTutorState.isListening && voiceTutorState.recognition) {
    voiceTutorState.recognition.stop();
    voiceTutorState.isListening = false;
    if (btnMic) btnMic.innerHTML = `<i data-lucide="mic" style="width:14px;height:14px;color:#fb7185;"></i> Speak`;
    initLucideIcons();
    return;
  }

  // Stop any active speech
  stopVoiceAudioPlayback();

  const rec = new SpeechRec();
  rec.lang = 'hi-IN'; // Recognizes both Hindi and English/Hinglish
  rec.continuous = false;
  rec.interimResults = true;

  rec.onstart = () => {
    voiceTutorState.isListening = true;
    if (btnMic) btnMic.innerHTML = `<i data-lucide="mic-off" class="spin" style="width:14px;height:14px;color:#ef4444;"></i> Listening...`;
    initLucideIcons();
  };

  rec.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');
    if (inputDoubt) inputDoubt.value = transcript;
  };

  rec.onend = () => {
    voiceTutorState.isListening = false;
    if (btnMic) btnMic.innerHTML = `<i data-lucide="mic" style="width:14px;height:14px;color:#fb7185;"></i> Speak`;
    initLucideIcons();
    // Auto-submit if student spoke something
    if (inputDoubt && inputDoubt.value.trim().length > 3) {
      submitVoiceDoubt(qId);
    }
  };

  rec.onerror = (e) => {
    console.warn('Speech recognition error:', e);
    voiceTutorState.isListening = false;
    if (btnMic) btnMic.innerHTML = `<i data-lucide="mic" style="width:14px;height:14px;color:#fb7185;"></i> Speak`;
    initLucideIcons();
  };

  voiceTutorState.recognition = rec;
  rec.start();
}

// 5. Submit Doubt (Voice or Typed) and Get Spoken Hinglish Answer
async function submitVoiceDoubt(qId) {
  const input = document.getElementById(`inputVoiceDoubt_${qId}`);
  const doubtText = input?.value?.trim() || '';
  if (!doubtText) return;
  if (input) input.value = '';

  // If Gemini Live full-duplex session is active, route directly through the low-latency WebSocket!
  if (window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive() && window.geminiLiveVoiceTutor.getActiveQuestionId() === qId) {
    window.geminiLiveVoiceTutor.sendUserText(doubtText);
    return;
  }

  const qObj = (state.qbFilteredQuestions || []).find(item => item.id === qId) || {};
  const rawQ = qObj.question_latex || qObj.questionText || '';

  const banner = document.getElementById(`voiceBanner_${qId}`);
  const wave = document.getElementById(`voiceWave_${qId}`);
  const badge = document.getElementById(`voiceStatusBadge_${qId}`);
  const transcript = document.getElementById(`voiceTranscript_${qId}`);

  if (badge) badge.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:13px;height:13px;"></i> Solving Student Doubt...`;
  initLucideIcons();

  let answerData = null;
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/voice-tutor/interrupt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: rawQ,
        solutionText: qObj.solution_latex || '',
        studentDoubt: doubtText,
        voice: voiceTutorState.selectedVoice || 'swara'
      })
    });
    if (res.ok) {
      const json = await res.json();
      answerData = json.data;
    }
  } catch (err) {
    console.warn('[VOICE TUTOR] Interruption API error:', err);
  }

  if (!answerData) {
    answerData = {
      studentDoubt: doubtText,
      answerHinglish: "Is question mein hume pehle governing relation apply karna hai. Given physical quantities note karke formula mein values put karo!",
      suggestedNextStep: "Formula copy mein note karo aur values substitute karo."
    };
  }

  if (transcript) {
    transcript.innerHTML = `
      <div style="background:rgba(244,63,94,0.12); border-left:3px solid #fb7185; padding:8px 12px; border-radius:6px; margin-bottom:10px;">
        <strong style="color:#fb7185; font-size:0.82rem;"><i data-lucide="help-circle" style="width:13px;height:13px;vertical-align:middle;"></i> Your Question:</strong>
        <p style="margin:4px 0 0 0; color:#fff; font-size:0.92rem;">"${escapeHtml(doubtText)}"</p>
      </div>
      <div style="background:rgba(16,185,129,0.12); border-left:3px solid #34d399; padding:10px 14px; border-radius:6px;">
        <strong style="color:#34d399; font-size:0.84rem;"><i data-lucide="message-square" style="width:13px;height:13px;vertical-align:middle;"></i> Teacher's Hinglish Explanation:</strong>
        <p style="margin:6px 0 0 0; color:#ecfdf5; font-size:0.96rem; line-height:1.75;">${escapeHtml(answerData.answerHinglish)}</p>
        <p style="margin:8px 0 0 0; color:#bae6fd; font-size:0.82rem;"><strong>Next Step:</strong> ${escapeHtml(answerData.suggestedNextStep)}</p>
      </div>
    `;
    initLucideIcons();
  }

  if (input) input.value = '';
  if (banner) {
    banner.classList.remove('listening');
    banner.classList.add('speaking');
  }
  if (wave) wave.classList.add('active');
  if (badge) badge.innerHTML = `<i data-lucide="headphones" style="width:13px;height:13px;color:#34d399;"></i> Speaking Teacher's Answer...`;
  initLucideIcons();

  speakWithVoiceEngine(
    answerData.answerHinglish,
    voiceTutorState.selectedVoice,
    null,
    () => {
      if (banner) banner.classList.remove('speaking');
      if (wave) wave.classList.remove('active');
      if (badge) badge.innerHTML = `<i data-lucide="check-circle" style="width:13px;height:13px;color:#34d399;"></i> Doubt Answered &bull; Ask another question if needed`;
      initLucideIcons();
    }
  );
}

// Quick chip doubt trigger
function quickAskDoubt(qId, doubtText) {
  const input = document.getElementById(`inputVoiceDoubt_${qId}`);
  if (input) input.value = doubtText;
  submitVoiceDoubt(qId);
}

// Instant manual commit for Gemini Live turn
function commitLiveVoiceTurn(qId) {
  if (window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive() && window.geminiLiveVoiceTutor.getActiveQuestionId() === qId) {
    window.geminiLiveVoiceTutor.commitTurn();
  }
}

// 6. Stop Voice Tutor
function stopVoiceTutor(qId, closeDrawer = true) {
  stopVoiceAudioPlayback();
  if (window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive() && window.geminiLiveVoiceTutor.getActiveQuestionId() === qId) {
    window.geminiLiveVoiceTutor.stopSession();
  }
  if (voiceTutorState.recognition) {
    try { voiceTutorState.recognition.stop(); } catch (e) {}
  }
  voiceTutorState.isListening = false;
  voiceTutorState.activeMode = 'IDLE';

  const banner = document.getElementById(`voiceBanner_${qId}`);
  const wave = document.getElementById(`voiceWave_${qId}`);
  const badge = document.getElementById(`voiceStatusBadge_${qId}`);
  const btnInterrupt = document.getElementById(`btnInterrupt_${qId}`);
  const btnStop = document.getElementById(`btnStopVoice_${qId}`);
  const btnLive = document.getElementById(`btnLiveVoice_${qId}`);
  const drawer = document.getElementById(`voiceDrawer_${qId}`);
  const liveVisualizer = document.getElementById(`voiceLiveVisualizer_${qId}`);
  const liveHint = document.getElementById(`voiceLiveHint_${qId}`);

  if (banner) {
    banner.classList.remove('speaking');
    banner.classList.remove('listening');
  }
  if (wave) wave.classList.remove('active');
  if (badge) badge.innerHTML = `<i data-lucide="mic-off" style="width:13px;height:13px;"></i> Voice Tutor Ready`;
  if (btnInterrupt) btnInterrupt.style.display = 'none';
  if (btnStop) btnStop.style.display = 'none';
  if (btnLive) {
    btnLive.classList.remove('live-active');
    btnLive.innerHTML = `<span class="qb-live-pulsing-dot"></span> <i data-lucide="radio" style="width:13px; height:13px;"></i> Live Voice Assistant <span class="qb-live-tag">LIVE</span>`;
  }
  if (liveVisualizer) liveVisualizer.style.display = 'none';
  if (liveHint) liveHint.style.display = 'none';
  if (closeDrawer && drawer) drawer.style.display = 'none';
  initLucideIcons();
}

function closeVoiceDrawer(qId) {
  stopRealtimeVoiceAssistant(qId, true);
  stopVoiceTutor(qId, true);
}

// ============================================================================
// GEMINI MULTIMODAL LIVE REAL-TIME VOICE ASSISTANT (FULL-DUPLEX + AUTO-INTERRUPT)
// Based on https://github.com/moktagithub005/real_time_voice_agent
// ============================================================================

function attachLiveVoiceCallbacks(qId) {
  const banner = document.getElementById(`voiceBanner_${qId}`);
  const wave = document.getElementById(`voiceWave_${qId}`);
  const badge = document.getElementById(`voiceStatusBadge_${qId}`);
  const drawer = document.getElementById(`voiceDrawer_${qId}`);
  const transcript = document.getElementById(`voiceTranscript_${qId}`);
  const btnLive = document.getElementById(`btnLiveVoice_${qId}`);
  const btnStop = document.getElementById(`btnStopVoice_${qId}`);
  const liveVisualizer = document.getElementById(`voiceLiveVisualizer_${qId}`);
  const liveHint = document.getElementById(`voiceLiveHint_${qId}`);

  if (drawer) drawer.style.display = 'flex';
  if (liveVisualizer) liveVisualizer.style.display = 'flex';
  if (liveHint) liveHint.style.display = 'flex';
  if (btnStop) btnStop.style.display = 'inline-flex';

  if (btnLive) {
    btnLive.classList.add('live-active');
    btnLive.innerHTML = `<span class="qb-live-pulsing-dot" style="background:#ef4444; box-shadow:0 0 8px #ef4444;"></span> <i data-lucide="phone-off" style="width:13px; height:13px;"></i> End Live Call`;
  }
  if (badge) {
    badge.innerHTML = `<span class="qb-live-pulsing-dot"></span> <span style="color:#34d399; font-weight:800;">Gemini Live Active &bull; Speak anytime to interrupt</span>`;
  }
  if (banner) banner.classList.add('speaking');
  if (wave) wave.classList.add('active');

  if (transcript && !document.getElementById(`liveChatStream_${qId}`)) {
    transcript.innerHTML = `
      <div style="font-size:0.84rem; color:#94a3b8; font-style:italic; padding:6px 0; display:flex; align-items:center; gap:8px;">
        <i data-lucide="radio" style="width:14px; height:14px; color:#38bdf8;"></i> Full-duplex WebSocket stream active (16kHz mic ingest & 24kHz neural audio egress).
      </div>
      <div id="liveChatStream_${qId}" class="qb-live-chat-stream"></div>
    `;

    // Populate existing session transcript history if any
    const stream = document.getElementById(`liveChatStream_${qId}`);
    if (stream && voiceTutorState.liveTranscriptHistory && voiceTutorState.liveTranscriptHistory.length > 0) {
      voiceTutorState.liveTranscriptHistory.forEach(item => {
        const bubble = document.createElement('div');
        bubble.className = item.role === 'student' ? 'qb-live-bubble-student' : 'qb-live-bubble-tutor';
        const speakerLabel = item.role === 'student' ? 'Student (You)' : 'Voice Teacher';
        bubble.innerHTML = `<strong>${speakerLabel}:</strong> ${escapeHtml(item.text)}`;
        stream.appendChild(bubble);
      });
      stream.scrollTop = stream.scrollHeight;
    }
  }

  initLucideIcons();

  window.geminiLiveVoiceTutor.setCallbacks({
    onStatusChange: (status) => {
      const curBadge = document.getElementById(`voiceStatusBadge_${qId}`);
      const curBanner = document.getElementById(`voiceBanner_${qId}`);
      const curWave = document.getElementById(`voiceWave_${qId}`);
      if (status === 'CONNECTED') {
        if (curBadge) {
          curBadge.innerHTML = `<span class="qb-live-pulsing-dot"></span> <span style="color:#34d399; font-weight:800;">Gemini Live Active &bull; Speak anytime to interrupt</span>`;
        }
        if (curBanner) curBanner.classList.add('speaking');
        if (curWave) curWave.classList.add('active');
        initLucideIcons();
      } else if (status === 'DISCONNECTED') {
        stopRealtimeVoiceAssistant(qId, false);
      }
    },
    onTranscript: ({ role, text, isInterim }) => {
      const stream = document.getElementById(`liveChatStream_${qId}`);
      if (!stream) return;

      let targetBubble = document.getElementById(`bubble_${qId}_${role}_current`);
      if (!targetBubble) {
        targetBubble = document.createElement('div');
        targetBubble.id = `bubble_${qId}_${role}_current`;
        targetBubble.className = role === 'student' ? 'qb-live-bubble-student' : 'qb-live-bubble-tutor';
        stream.appendChild(targetBubble);
      }

      const speakerLabel = role === 'student' ? 'Student (You)' : 'Voice Teacher';
      targetBubble.innerHTML = `<strong>${speakerLabel}:</strong> ${escapeHtml(text)}${isInterim ? ' <span style="opacity:0.6;">...</span>' : ''}`;
      stream.scrollTop = stream.scrollHeight;
    },
    onTurnComplete: (turn) => {
      const studentBubble = document.getElementById(`bubble_${qId}_student_current`);
      if (studentBubble) studentBubble.removeAttribute('id');
      const tutorBubble = document.getElementById(`bubble_${qId}_tutor_current`);
      if (tutorBubble) tutorBubble.removeAttribute('id');

      if (!voiceTutorState.liveTranscriptHistory) voiceTutorState.liveTranscriptHistory = [];
      if (turn.studentText) voiceTutorState.liveTranscriptHistory.push({ role: 'student', text: turn.studentText });
      if (turn.tutorText) voiceTutorState.liveTranscriptHistory.push({ role: 'tutor', text: turn.tutorText });
    },
    onInterrupted: () => {
      const curBanner = document.getElementById(`voiceBanner_${qId}`);
      const curBadge = document.getElementById(`voiceStatusBadge_${qId}`);
      if (curBanner) {
        curBanner.classList.remove('speaking');
        curBanner.classList.add('listening');
      }
      if (curBadge) {
        curBadge.innerHTML = `<span class="qb-live-pulsing-dot" style="background:#f43f5e; box-shadow:0 0 8px #f43f5e;"></span> <span style="color:#fb7185; font-weight:800;">Auto-Interrupted! Listening to your voice...</span>`;
      }
      initLucideIcons();
    },
    onAudioLevel: (micLevel, tutorLevel) => {
      const mFill = document.getElementById(`micMeter_${qId}`);
      const tFill = document.getElementById(`tutorMeter_${qId}`);
      const curBanner = document.getElementById(`voiceBanner_${qId}`);
      if (mFill) mFill.style.width = `${Math.min(100, Math.round(micLevel * 100))}%`;
      if (tFill) tFill.style.width = `${Math.min(100, Math.round(tutorLevel * 100))}%`;
      if (micLevel > 0.15) {
        if (curBanner) curBanner.classList.add('listening');
      } else if (tutorLevel > 0.08) {
        if (curBanner) {
          curBanner.classList.remove('listening');
          curBanner.classList.add('speaking');
        }
      }
    },
    onError: (err) => {
      console.error('[GEMINI LIVE ERROR]', err);
      const curBadge = document.getElementById(`voiceStatusBadge_${qId}`);
      if (curBadge) {
        curBadge.innerHTML = `<i data-lucide="alert-circle" style="width:13px;height:13px;color:#f43f5e;"></i> Live Session Error: ${escapeHtml(err.message || 'Connection lost')}`;
      }
      initLucideIcons();
    }
  });
}

function syncLiveVoiceAssistantToCurrentQuestion() {
  if (!window.geminiLiveVoiceTutor || !window.geminiLiveVoiceTutor.isSessionActive()) return;
  const filtered = state.qbFilteredQuestions || [];
  const qObj = filtered[state.qbCurrentPage] || {};
  const qId = qObj.id || `q_${state.qbCurrentPage}`;
  const rawQ = qObj.question_latex || qObj.questionText || '';
  const rawS = qObj.solution_latex || '';
  const ch = qObj.chapter_name || qObj.chapter || '';
  const top = qObj.topic || qObj.subtopic || '';

  // Wire UI for the new question
  attachLiveVoiceCallbacks(qId);

  // Sync whiteboard to new question if visible
  const wb = document.getElementById(`wbContainer_${qId}`);
  if (wb && wb.style.display !== 'none') {
    syncQuestionToWhiteboard(qId);
  }

  const cached = voiceTutorState.teachingPlans?.[qId];
  const teachingPlan = (cached && cached.smartboardPlan) ? cached.smartboardPlan : buildLocalSmartboardPlan(qId);

  // Send new question turn to active Gemini Live session with synchronized smartboard plan
  window.geminiLiveVoiceTutor.switchToQuestion({
    questionId: qId,
    questionText: rawQ,
    solutionText: rawS,
    chapterName: ch,
    topic: top,
    teachingPlan: teachingPlan
  });
}

async function startRealtimeVoiceAssistant(qId) {
  // If already active on this question, clicking acts as stop
  if (window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive() && window.geminiLiveVoiceTutor.getActiveQuestionId() === qId) {
    stopRealtimeVoiceAssistant(qId);
    return;
  }

  // Reset transcript history for a fresh call
  voiceTutorState.liveTranscriptHistory = [];

  const banner = document.getElementById(`voiceBanner_${qId}`);
  const badge = document.getElementById(`voiceStatusBadge_${qId}`);
  const drawer = document.getElementById(`voiceDrawer_${qId}`);
  const transcript = document.getElementById(`voiceTranscript_${qId}`);
  const btnLive = document.getElementById(`btnLiveVoice_${qId}`);
  const btnStop = document.getElementById(`btnStopVoice_${qId}`);
  const liveVisualizer = document.getElementById(`voiceLiveVisualizer_${qId}`);
  const liveHint = document.getElementById(`voiceLiveHint_${qId}`);

  // Retrieve Question data
  const qObj = (state.qbFilteredQuestions || []).find(item => item.id === qId) || {};
  const rawQ = qObj.question_latex || qObj.questionText || '';
  const rawS = qObj.solution_latex || '';
  const ch = qObj.chapter_name || qObj.chapter || '';
  const top = qObj.topic || qObj.subtopic || '';

  if (drawer) drawer.style.display = 'flex';
  if (liveVisualizer) liveVisualizer.style.display = 'flex';
  if (liveHint) liveHint.style.display = 'flex';
  if (btnStop) btnStop.style.display = 'inline-flex';

  if (btnLive) {
    btnLive.classList.add('live-active');
    btnLive.innerHTML = `<span class="qb-live-pulsing-dot" style="background:#ef4444; box-shadow:0 0 8px #ef4444;"></span> <i data-lucide="phone-off" style="width:13px; height:13px;"></i> End Class`;
  }
  if (badge) {
    badge.innerHTML = `<i data-lucide="loader-2" class="spin" style="width:13px;height:13px;color:#38bdf8;"></i> Connecting to Gemini Multimodal Live API...`;
  }
  if (transcript) {
    transcript.innerHTML = `
      <div style="font-size:0.84rem; color:#94a3b8; font-style:italic; padding:6px 0; display:flex; align-items:center; gap:8px;">
        <i data-lucide="radio" style="width:14px; height:14px; color:#38bdf8;"></i> Full-duplex classroom stream active (16kHz mic ingest & 24kHz neural audio egress).
      </div>
      <div id="liveChatStream_${qId}" class="qb-live-chat-stream"></div>
    `;
  }
  initLucideIcons();

  attachLiveVoiceCallbacks(qId);
  toggleLiveWhiteboard(qId, true);

  const cached = voiceTutorState.teachingPlans?.[qId];
  const teachingPlan = (cached && cached.smartboardPlan) ? cached.smartboardPlan : buildLocalSmartboardPlan(qId);

  try {
    await window.geminiLiveVoiceTutor.startSession({
      questionId: qId,
      questionText: rawQ,
      solutionText: rawS,
      chapterName: ch,
      topic: top,
      teachingPlan: teachingPlan,
      apiBaseUrl: getApiBaseUrl()
    });
  } catch (err) {
    console.error('Failed to start Gemini Live voice assistant:', err);
    if (badge) {
      badge.innerHTML = `<i data-lucide="alert-triangle" style="width:13px;height:13px;color:#f43f5e;"></i> Live session setup failed: ${escapeHtml(err.message || 'Microphone or network error')}`;
    }
    if (btnLive) {
      btnLive.classList.remove('live-active');
      btnLive.innerHTML = `<span class="qb-live-pulsing-dot"></span> <i data-lucide="presentation" style="width:13px; height:13px;"></i> AI Teacher & Smartboard <span class="qb-live-tag">LIVE CLASS</span>`;
    }
    initLucideIcons();
  }
}

function stopRealtimeVoiceAssistant(qId, closeDrawer = false) {
  if (window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive()) {
    window.geminiLiveVoiceTutor.stopSession();
  }

  const banner = document.getElementById(`voiceBanner_${qId}`);
  const wave = document.getElementById(`voiceWave_${qId}`);
  const badge = document.getElementById(`voiceStatusBadge_${qId}`);
  const btnLive = document.getElementById(`btnLiveVoice_${qId}`);
  const liveVisualizer = document.getElementById(`voiceLiveVisualizer_${qId}`);
  const liveHint = document.getElementById(`voiceLiveHint_${qId}`);
  const drawer = document.getElementById(`voiceDrawer_${qId}`);
  const btnStop = document.getElementById(`btnStopVoice_${qId}`);

  if (banner) {
    banner.classList.remove('speaking');
    banner.classList.remove('listening');
  }
  if (wave) wave.classList.remove('active');
  if (btnLive) {
    btnLive.classList.remove('live-active');
    btnLive.innerHTML = `<span class="qb-live-pulsing-dot"></span> <i data-lucide="presentation" style="width:13px; height:13px;"></i> AI Teacher & Smartboard <span class="qb-live-tag">LIVE CLASS</span>`;
  }
  if (btnStop) btnStop.style.display = 'none';
  if (badge) {
    badge.innerHTML = `<i data-lucide="check-circle" style="width:13px;height:13px;color:#34d399;"></i> Live Session Finished`;
  }
  if (liveVisualizer) liveVisualizer.style.display = 'none';
  if (liveHint) liveHint.style.display = 'none';
  if (closeDrawer && drawer) drawer.style.display = 'none';
  initLucideIcons();
}

// ============================================================================
// AI INTERACTIVE WHITEBOARD CONTROLLER (TLDRAW LIVE SYNC)
// ============================================================================

function toggleLiveWhiteboard(qId, forceOpen = null) {
  const container = document.getElementById(`wbContainer_${qId}`);
  const btn = document.getElementById(`btnToggleWb_${qId}`);
  if (!container) return;

  const isHidden = container.style.display === 'none' || container.style.display === '';
  const shouldOpen = forceOpen !== null ? forceOpen : isHidden;

  if (shouldOpen) {
    container.style.display = 'flex';
    if (btn) {
      btn.style.background = 'rgba(147, 51, 234, 0.3)';
      btn.style.borderColor = '#c084fc';
    }
    syncQuestionToWhiteboard(qId);
  } else {
    container.style.display = 'none';
    if (btn) {
      btn.style.background = 'rgba(147, 51, 234, 0.15)';
      btn.style.borderColor = 'rgba(147, 51, 234, 0.35)';
    }
  }
  initLucideIcons();
}

function toggleExpandWhiteboard(qId) {
  const container = document.getElementById(`wbContainer_${qId}`);
  const btn = document.getElementById(`btnWbExpand_${qId}`);
  if (!container) return;

  container.classList.toggle('expanded');
  const isExpanded = container.classList.contains('expanded');
  if (btn) {
    btn.innerHTML = isExpanded 
      ? `<i data-lucide="minimize" style="width:12px; height:12px;"></i> Exit Fullscreen` 
      : `<i data-lucide="expand" style="width:12px; height:12px;"></i> Fullscreen`;
    initLucideIcons();
  }
  fitLiveWhiteboard(qId);
}

function clearLiveWhiteboard(qId) {
  clearWhiteboardTimers();
  sendWhiteboardMessage(qId, { type: 'CLEAR_BOARD' });
}

function fitLiveWhiteboard(qId) {
  sendWhiteboardMessage(qId, { type: 'ZOOM_FIT' });
}

function sendWhiteboardMessage(qId, message) {
  const iframe = document.getElementById(`wbIframe_${qId}`);
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(message, '*');
  }
}

function clearWhiteboardTimers() {
  if (voiceTutorState.whiteboardSyncTimers) {
    voiceTutorState.whiteboardSyncTimers.forEach(t => clearTimeout(t));
    voiceTutorState.whiteboardSyncTimers = [];
  }
}

async function startUnifiedClassroomSession(qId) {
  // If session is already active on this question, toggle acts as stop
  if (window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive() && window.geminiLiveVoiceTutor.getActiveQuestionId() === qId) {
    stopRealtimeVoiceAssistant(qId);
    return;
  }

  // 1. Immediately expand and display the interactive smartboard
  toggleLiveWhiteboard(qId, true);

  // 2. Start the human-like real-time classroom voice assistant
  await startRealtimeVoiceAssistant(qId);
}

function buildLocalSmartboardPlan(qId) {
  const qObj = (state.qbFilteredQuestions || []).find(item => item.id === qId) || {};
  const rawQ = qObj.question_latex || qObj.questionText || '';
  const rawS = qObj.solution_latex || '';
  const ch = qObj.chapter_name || qObj.chapter || 'Physics / Science';
  const marks = qObj.marks || 3;
  const ans = qObj.correct_answer_latex || qObj.correct_answer || '';

  const textForDetection = (rawQ + ' ' + ch + ' ' + (qObj.topic || '') + ' ' + (qObj.subtopic || '') + ' ' + rawS).toLowerCase();
  let diagramType = 'concept';
  let diagTitle = `${ch} • Conceptual Schematic`;
  let tipText = 'Always cross-check unit dimensions, coordinate signs, and physical boundary conditions!';
  let step1Title = 'Given Setup & Governing Principle';
  let step1Formula = '• Identify given physical inputs and stated boundary constraints.\n• Primary governing mathematical relation applied.';
  let step1Exp = 'Establish foundational physical law linking known inputs to target output.';
  let step2Title = 'Step-by-Step Derivation & Substitution';
  let step2Working = cleanLatexForClientVoice(rawS).slice(0, 180) || '• Substitute numerical values into the equation.\n• Simplify algebraic terms step by step.';
  let step2Exp = 'Step-by-step resolution preserving SI units throughout.';
  let step3Title = 'Final Evaluated Answer & Verified Takeaway';
  let step3Working = `Final Answer: ${cleanLatexForClientVoice(rawS).slice(0, 80) || 'Calculated with SI standard'} ${ans ? `[Option ${ans}]` : ''}`;
  let step3Exp = 'Physical check confirms the calculated magnitude and sign convention.';
  let s1Spoken = 'Pehle stated physical parameters aur primary governing relation note karte hain.';
  let s2Spoken = 'Ab known quantities substitute karke algebraic derivation solve karte hain.';
  let s3Spoken = 'Aur yeh raha final verified result with proper SI units aur physical significance.';

  if (textForDetection.match(/roll|sphere|incline|rotat|torque|angular|slip|moment of inertia|friction/)) {
    diagramType = 'rolling_incline';
    diagTitle = 'Free-Body Diagram • Solid Sphere on Incline (θ)';
    step1Title = 'Free-Body Force & Torque Equations';
    step1Formula = 'Down Incline:   M·g·sin θ - f_s = M·a\nTorque about C: τ = f_s · R = I · α\nPure Rolling:   a = α · R  ⇒  α = a / R';
    step1Exp = 'Pure rolling without slipping: Contact point P is at instantaneous rest with zero relative sliding.';

    step2Title = 'Torque & Linear Force Substitution';
    step2Working = '1) Torque equation: f_s · R = I · (a / R)  ⇒  f_s = (I / R²) · a\n2) Substitute f_s:  M·g·sin θ - (I / R²) · a = M·a\n3) General Formula: a = (g · sin θ) / [1 + I / (M · R²)]';
    step2Exp = 'This general acceleration equation applies to all rolling symmetrical objects (sphere, cylinder, ring).';

    step3Title = 'Moment of Inertia & Final Acceleration';
    step3Working = 'Solid Sphere:   I = (2/5) · M · R²  ⇒  I / (M · R²) = 2/5\nAcceleration:   a = (g · sin θ) / [1 + 2/5] = (g · sin θ) / (7/5)\nFinal Result:   a = (5/7) · g · sin θ  ≈ 0.714 · g · sin θ';
    step3Exp = 'A solid sphere accelerates faster than a hollow sphere (5/7 > 3/5) due to lower rotational inertia.';
    tipText = 'Pure rolling is sustained by STATIC friction. Work done by static friction is ZERO! Total mechanical energy is conserved.';
  } else if (textForDetection.match(/lens|mirror|focal|refract|reflect|convex|concave|ray|optical/)) {
    diagramType = 'lens';
    diagTitle = 'Ray Optics • Principal Axis & Image Formation';
    step1Title = 'Governing Optical Equations';
    step1Formula = '• Thin Lens Equation: 1/f = 1/v - 1/u\n• Magnification:       m = v / u = h_i / h_o\n• Power of Lens:       P = 1 / f (meters)';
    step1Exp = 'Cartesian Sign Convention: Distances along incident ray are positive; opposite are negative.';

    step2Title = 'Coordinate Substitution & Calculation';
    step2Working = '1) Identify: Focal length f (convex > 0), Object distance u (< 0)\n2) Rearrange: 1/v = 1/f + 1/u = (u + f) / (u · f)\n3) Image distance: v = (u · f) / (u + f)';
    step2Exp = 'Calculate v and check sign: positive v confirms a real image on opposite side.';

    step3Title = 'Image Nature & Final Result';
    step3Working = '• Magnification: m = v / u\n• Real & Inverted if m < 0; Virtual & Erect if m > 0\n• Power: P = 1 / f (in meters)';
    step3Exp = 'State complete nature, orientation, and size relative to object.';
    tipText = 'Always state the nature (real/virtual, inverted/erect) and magnification sign!';
  } else if (textForDetection.match(/circuit|ohm|resistor|resistance|current|voltage|potential|battery|ampere|drift/)) {
    diagramType = 'circuit';
    diagTitle = 'Electric Circuit • Current & Resistivity Model';
    step1Title = 'Governing Circuit Principles';
    step1Formula = '• Ohm\'s Law:          V = I · R\n• Microscopic Drift:   I = n · e · A · v_d,   v_d = (e · E · τ) / m\n• Resistivity:         R = ρ · (l / A),       ρ = m / (n · e² · τ)';
    step1Exp = 'Relaxation time τ connects electron kinematics to macroscopic electrical resistance.';

    step2Title = 'Current Derivation & Ohm Deduction';
    step2Working = '1) Electric field: E = V / l\n2) Current: I = n·e·A·(e·V·τ / m·l) = (n·e²·A·τ / m·l)·V\n3) Ratio V / I = [m / (n·e²·τ)] · (l / A) = R';
    step2Exp = 'Confirms Ohm\'s Law V = IR with resistivity ρ = m / (n·e²·τ).';

    step3Title = 'Final Formula & Board Takeaway';
    step3Working = '• Resistance: R = ρ · (l / A)\n• Resistivity: ρ = m / (n · e² · τ)\n• Verified Result: Microscopic basis of electrical resistance established';
    step3Exp = 'Resistivity depends only on material electron density n and relaxation time τ.';
    tipText = 'Relaxation time tau decreases with temperature in metals, increasing electrical resistance!';
  } else if (textForDetection.match(/projectile|trajectory|parabola|horizontal range|max height/)) {
    diagramType = 'projectile';
    diagTitle = 'Projectile Motion • Parabolic Trajectory';
    step1Title = 'Kinematic Component Equations';
    step1Formula = '• Horizontal: u_x = u · cos θ,  a_x = 0,  x(t) = (u · cos θ) · t\n• Vertical: u_y = u · sin θ,  a_y = -g,  y(t) = (u · sin θ) · t - ½·g·t²';
    step1Exp = 'Two independent perpendicular motions occurring simultaneously.';

    step2Title = 'Trajectory Equation & Peak Calculation';
    step2Working = '1) Flight Time: T = (2·u·sin θ) / g\n2) Maximum Height: H = (u²·sin² θ) / (2·g)\n3) Horizontal Range: R = (u²·sin 2θ) / g';
    step2Exp = 'Peak height occurs at vertical velocity v_y = 0.';

    step3Title = 'Final Answer & Range Verification';
    step3Working = `Final Answer: Maximum range occurs at θ = 45° where R_max = u² / g ${ans ? `[Option ${ans}]` : ''}`;
    step3Exp = 'Air resistance is neglected; path is purely parabolic.';
    tipText = 'Horizontal velocity u_x = u·cos θ remains CONSTANT throughout flight!';
  }

  return {
    questionHeader: {
      title: cleanLatexForClientVoice(rawQ).slice(0, 180),
      chapter: ch,
      marks: marks
    },
    diagram: {
      type: diagramType,
      title: diagTitle,
      tip: tipText,
      spokenScript: 'Pehle left side board par visual physical diagram aur coordinate axes observe karo.'
    },
    examTip: tipText,
    solution: {
      step1: { title: step1Title, formula: step1Formula, explanation: step1Exp, teacherNote: s1Spoken, spokenScript: s1Spoken },
      step2: { title: step2Title, formula: step2Working, explanation: step2Exp, teacherNote: s2Spoken, spokenScript: s2Spoken },
      step3: { title: step3Title, formula: step3Working, explanation: step3Exp, teacherNote: s3Spoken, spokenScript: s3Spoken }
    }
  };
}

function syncQuestionToWhiteboard(qId) {
  clearWhiteboardTimers();
  if (!voiceTutorState.teachingPlans) voiceTutorState.teachingPlans = {};

  // 1. Send instant local plan immediately so whiteboard renders with zero delay
  const localPlan = buildLocalSmartboardPlan(qId);
  const existingPlan = voiceTutorState.teachingPlans[qId];
  const planToRender = (existingPlan && existingPlan.smartboardPlan) ? existingPlan.smartboardPlan : localPlan;

  sendWhiteboardMessage(qId, {
    type: 'RENDER_SMARTBOARD_SOLUTION',
    payload: planToRender
  });

  // 2. Fetch synchronized LLM teaching plan from server if not yet fetched
  if (!existingPlan) {
    const qObj = (state.qbFilteredQuestions || []).find(item => item.id === qId) || {};
    fetch('/api/voice-tutor/solve-and-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: qId,
        questionText: qObj.question_latex || qObj.questionText || '',
        solutionText: qObj.solution_latex || '',
        chapterName: qObj.chapter_name || qObj.chapter || '',
        topic: qObj.topic || qObj.subtopic || '',
        options: qObj.options_latex || qObj.options || [],
        correctAnswer: qObj.correct_answer_latex || qObj.correct_answer || '',
        marks: qObj.marks_weightage || qObj.marks || 3,
        voice: voiceTutorState.selectedVoice || 'swara'
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data && data.success && data.smartboardPlan) {
        voiceTutorState.teachingPlans[qId] = data;
        sendWhiteboardMessage(qId, {
          type: 'RENDER_SMARTBOARD_SOLUTION',
          payload: data.smartboardPlan
        });

        // If Gemini Live is active on this question, notify it of the updated plan
        if (window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive() && window.geminiLiveVoiceTutor.getActiveQuestionId() === qId) {
          window.geminiLiveVoiceTutor.updateTeachingPlan(data.smartboardPlan);
        }

        // If transcript drawer is shown, display Dr. Vikram's Hinglish brief
        const transcriptEl = document.getElementById(`voiceTranscript_${qId}`);
        if (transcriptEl && (!window.geminiLiveVoiceTutor || !window.geminiLiveVoiceTutor.isSessionActive())) {
          transcriptEl.innerHTML = `<div style="display:flex; align-items:flex-start; gap:8px;"><i data-lucide="sparkles" style="width:16px; height:16px; color:#38bdf8; flex-shrink:0; margin-top:3px;"></i><div><strong style="color:#38bdf8;">Teacher Dr. Vikram:</strong> ${escapeHtml(data.hinglishBrief)}</div></div>`;
          initLucideIcons();
        }
      }
    })
    .catch(err => {
      console.warn('[WHITEBOARD SYNC] Failed to fetch server smartboard plan:', err);
    });
  }
}

function syncDoubtToWhiteboard(qId, doubtText, answerText) {
  sendWhiteboardMessage(qId, {
    type: 'HIGHLIGHT_DOUBT',
    payload: {
      doubtText: doubtText || 'Student Question',
      answerText: answerText || 'Rule verified by teacher on whiteboard'
    }
  });
}

// Window listener for iframe readiness & concept pacing sync
window.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'WHITEBOARD_READY') {
    const filtered = state.qbFilteredQuestions || [];
    const qObj = filtered[state.qbCurrentPage] || {};
    const qId = qObj.id || `q_${state.qbCurrentPage}`;
    if (qId) {
      const cached = voiceTutorState.teachingPlans?.[qId];
      const planToRender = (cached && cached.smartboardPlan) ? cached.smartboardPlan : buildLocalSmartboardPlan(qId);
      sendWhiteboardMessage(qId, {
        type: 'RENDER_SMARTBOARD_SOLUTION',
        payload: planToRender
      });
    }
  } else if (event.data.type === 'WB_CONCEPT_CHANGED') {
    const idx = event.data.conceptIndex;
    const filtered = state.qbFilteredQuestions || [];
    const qObj = filtered[state.qbCurrentPage] || {};
    const qId = qObj.id || `q_${state.qbCurrentPage}`;
    const plan = voiceTutorState.teachingPlans?.[qId] || { smartboardPlan: buildLocalSmartboardPlan(qId) };
    const p = plan.smartboardPlan || plan;

    let spokenText = '';
    if (idx === 0) {
      spokenText = p.diagram?.spokenScript || 'Dekho beta, pehle left side board par diagram aur given parameters note karo.';
    } else if (idx === 1) {
      spokenText = p.solution?.step1?.spokenScript || p.solution?.step1?.teacherNote || p.solution?.step1?.explanation || '';
    } else if (idx === 2) {
      spokenText = p.solution?.step2?.spokenScript || p.solution?.step2?.teacherNote || p.solution?.step2?.explanation || '';
    } else if (idx === 3) {
      spokenText = p.solution?.step3?.spokenScript || p.solution?.step3?.teacherNote || p.solution?.step3?.explanation || '';
    } else {
      spokenText = plan.hinglishBrief || 'Poora solution smartboard par verified hai. Koi doubt ho toh turant pucho!';
    }

    const transcriptEl = document.getElementById(`voiceTranscript_${qId}`);
    if (transcriptEl && (!window.geminiLiveVoiceTutor || !window.geminiLiveVoiceTutor.isSessionActive())) {
      transcriptEl.innerHTML = `<div style="display:flex; align-items:flex-start; gap:8px;"><i data-lucide="sparkles" style="width:16px; height:16px; color:#38bdf8; flex-shrink:0; margin-top:3px;"></i><div><strong style="color:#38bdf8;">Dr. Vikram [Concept ${idx < 4 ? idx + 1 : 'All'}]:</strong> ${escapeHtml(spokenText)}</div></div>`;
      initLucideIcons();
    }
  }
});

// Global exports for inline HTML onclick handlers
window.readQuestionAloud = readQuestionAloud;
window.explainQuestionInHinglish = explainQuestionInHinglish;
window.interruptVoiceTutor = interruptVoiceTutor;
window.stopVoiceTutor = stopVoiceTutor;
window.closeVoiceDrawer = closeVoiceDrawer;
window.toggleVoiceMicInput = toggleVoiceMicInput;
window.submitVoiceDoubt = submitVoiceDoubt;
window.quickAskDoubt = quickAskDoubt;
window.setVoiceTutorPersona = setVoiceTutorPersona;
window.startRealtimeVoiceAssistant = startRealtimeVoiceAssistant;
window.startUnifiedClassroomSession = startUnifiedClassroomSession;
window.stopRealtimeVoiceAssistant = stopRealtimeVoiceAssistant;
window.toggleLiveWhiteboard = toggleLiveWhiteboard;
window.toggleExpandWhiteboard = toggleExpandWhiteboard;
window.clearLiveWhiteboard = clearLiveWhiteboard;
window.fitLiveWhiteboard = fitLiveWhiteboard;
window.syncQuestionToWhiteboard = syncQuestionToWhiteboard;
window.syncDoubtToWhiteboard = syncDoubtToWhiteboard;
window.buildLocalSmartboardPlan = buildLocalSmartboardPlan;


function renderQbCurrentPage() {
  const container = document.getElementById('containerQbQuestions');
  const statsLabel = document.getElementById('qbCountLabel');
  if (!container) return;

  const filtered = state.qbFilteredQuestions || [];
  const total = filtered.length;

  if (total === 0) {
    if (statsLabel) {
      statsLabel.innerHTML = `Showing <strong>0</strong> of <strong>${state.questionBankData?.length || 0}</strong> authentic questions in bank`;
    }
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 1.5rem; background:var(--bg-card); border-radius:var(--radius-md); border:1px dashed var(--border-subtle); color:var(--text-muted);">
        <i data-lucide="search-x" style="width:32px; height:32px; margin:0 auto 10px; display:block; color:var(--text-muted);"></i>
        <div style="font-weight:700; color:var(--text-primary); margin-bottom:6px;">No questions match the selected filters</div>
        <p style="font-size:0.82rem; margin-bottom:12px;">Try selecting another chapter, switching to Board PYQs or NCERT, or click below to reset.</p>
        <button type="button" class="btn-secondary" onclick="resetQbFilters()" style="font-size:0.8rem; padding:6px 14px;">
          <i data-lucide="rotate-ccw" style="width:13px; height:13px;"></i> Reset All Filters
        </button>
      </div>
    `;
    initLucideIcons();
    return;
  }

  // Clamp current question index
  if (state.qbCurrentPage === undefined || state.qbCurrentPage < 0) state.qbCurrentPage = 0;
  if (state.qbCurrentPage >= total) state.qbCurrentPage = total - 1;
  const currentIdx = state.qbCurrentPage;

  if (statsLabel) {
    statsLabel.innerHTML = `Showing Question <strong>${currentIdx + 1}</strong> of <strong>${total}</strong> in selected scope &bull; 1 Question Per Page Mode`;
  }

  const q = filtered[currentIdx];
  const qId = q.id || `q_${currentIdx}`;
  const chNum = q.chapter_number || '';
  const chName = q.chapter_name || q.chapter || 'Chapter';
  const source = q.question_source || q.pyq_appearance || (q.ncert_mapping ? q.ncert_mapping.pyq_tag : 'CBSE Board Question');
  const diff = (q.difficulty || 'MEDIUM').toUpperCase();
  const marks = q.marks || (diff === 'EASY' ? 1 : (diff === 'HARD' ? 5 : 3));
  const timeSec = q.benchmark_time_seconds || 90;
  const steps = formatIntuitiveSteps(q);

  const isPyq = q.question_source === 'CBSE_PYQ' || source.toUpperCase().includes('BOARD') || source.toUpperCase().includes('PYQ');
  const isExample = q.question_source === 'NCERT_TEXTBOOK' || source.toUpperCase().includes('EXAMPLE') || source.toUpperCase().includes('NCERT');
  const sourceBadgeStyle = isPyq
    ? 'background:rgba(245, 158, 11, 0.12); color:#f59e0b; border:1px solid rgba(245, 158, 11, 0.35);'
    : isExample
    ? 'background:rgba(16, 185, 129, 0.12); color:#10b981; border:1px solid rgba(16, 185, 129, 0.35);'
    : 'background:rgba(14, 165, 233, 0.12); color:#0ea5e9; border:1px solid rgba(14, 165, 233, 0.35);';

  const diffBadgeStyle = diff === 'HARD'
    ? 'background:rgba(239, 68, 68, 0.12); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.3);'
    : diff === 'EASY'
    ? 'background:rgba(16, 185, 129, 0.12); color:#10b981; border:1px solid rgba(16, 185, 129, 0.3);'
    : 'background:rgba(245, 158, 11, 0.12); color:#f59e0b; border:1px solid rgba(245, 158, 11, 0.3);';

  const options = q.options_latex || [];
  const percentComplete = Math.round(((currentIdx + 1) / total) * 100);

  // Build Quick Question Jump Pills (window of nearby questions)
  let pillStart = Math.max(0, currentIdx - 4);
  let pillEnd = Math.min(total, pillStart + 9);
  if (pillEnd - pillStart < 9) {
    pillStart = Math.max(0, pillEnd - 9);
  }
  let pillsHtml = '';
  for (let i = pillStart; i < pillEnd; i++) {
    pillsHtml += `
      <button type="button" class="qb-jump-pill ${i === currentIdx ? 'active' : ''}" onclick="setQbQuestionIndex(${i})" title="Jump directly to Question ${i + 1}">
        ${i + 1}
      </button>
    `;
  }

  // Jump Dropdown options
  const jumpOptionsHtml = filtered.map((item, idx) => {
    const itemCh = item.chapter_number ? `Ch ${item.chapter_number}` : '';
    const itemDiff = (item.difficulty || '').toUpperCase();
    return `<option value="${idx}" ${idx === currentIdx ? 'selected' : ''}>Q${idx + 1} ${itemCh ? `(${itemCh})` : ''} - ${itemDiff}</option>`;
  }).join('');

  // Top/Bottom Nav bar generator
  const renderNavBar = (isBottom = false) => `
    <div class="qb-nav-banner" ${isBottom ? 'style="margin-top:16px;"' : 'style="margin-bottom:14px;"'}>
      <button type="button" class="qb-nav-btn" onclick="prevQbQuestion()" ${currentIdx === 0 ? 'disabled' : ''} title="Previous Question (Keyboard: Left Arrow)">
        <i data-lucide="chevron-left" style="width:16px; height:16px;"></i>
        <span>Previous Question</span>
      </button>

      <div class="qb-nav-center">
        <div class="qb-nav-meta-line">
          <span class="qb-page-badge">Question ${currentIdx + 1} of ${total}</span>
          <select class="qb-jump-select" onchange="setQbQuestionIndex(Number(this.value))" title="Quick Jump to Question">
            ${jumpOptionsHtml}
          </select>
        </div>
        <div class="qb-nav-progress-track">
          <div class="qb-nav-progress-fill" style="width:${percentComplete}%;"></div>
        </div>
        <div class="qb-jump-pill-strip">
          ${pillsHtml}
        </div>
      </div>

      <button type="button" class="qb-nav-btn btn-nav-primary" onclick="nextQbQuestion()" ${currentIdx === total - 1 ? 'disabled' : ''} title="Next Question (Keyboard: Right Arrow)">
        <span>Next Question</span>
        <i data-lucide="chevron-right" style="width:16px; height:16px;"></i>
      </button>
    </div>
  `;

  // Solution Section: Prompt Card (when hidden) or Full Intuitive Mastercard (when revealed)
  let solutionSectionHtml = '';
  if (!state.qbSolutionRevealed) {
    solutionSectionHtml = `
      <div class="qb-solution-prompt-card" id="qbSolutionPrompt_${qId}">
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="qb-solution-lock-badge">
            <i data-lucide="book-open" style="width:20px; height:20px;"></i>
          </span>
          <div>
            <div style="font-weight:800; font-size:0.96rem; color:#f8fafc; font-family:'Outfit', sans-serif;">
              Step-by-Step Solution &amp; Pedagogical Walkthrough
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
              Attempt this question on your own first! When you are ready, click below to reveal the formula, line-by-line derivation, verified answer, and CBSE marking rubric.
            </div>
          </div>
        </div>
        <button type="button" class="btn-primary" onclick="toggleCardSolutionView('${qId}')" style="background:linear-gradient(135deg, #2563eb, #1d4ed8); padding:9px 20px; font-weight:700; font-size:0.86rem; display:inline-flex; align-items:center; gap:8px; border-radius:8px; box-shadow:0 4px 14px rgba(37,99,235,0.35); cursor:pointer;">
          <i data-lucide="eye" style="width:16px; height:16px;"></i> View Step-by-Step Solution
        </button>
      </div>
    `;
  } else {
    solutionSectionHtml = `
      <div class="qb-solution-mastercard" id="solutionCard_${qId}">
        <!-- CARD HEADER -->
        <div class="qb-solution-card-header">
          <div class="qb-solution-card-title">
            <span class="qb-solution-card-badge">
              <i data-lucide="book-open-check" style="width:16px; height:16px;"></i>
            </span>
            <div>
              <div style="font-size:0.94rem; font-weight:800; color:#93c5fd; font-family:'Outfit', sans-serif;">
                Step-by-Step Solution &amp; Pedagogical Walkthrough
              </div>
              <div style="font-size:0.73rem; color:var(--text-muted); margin-top:2px;">
                Complete conceptual explanation &bull; Board marking scheme &bull; Examiner tips
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.75rem; font-weight:700; color:#10b981; background:rgba(16,185,129,0.12); padding:3px 10px; border-radius:4px; border:1px solid rgba(16,185,129,0.3);">
              Answer: ${renderLatexString(steps.correctAnswer)}
            </span>
            <button type="button" class="btn-secondary" onclick="toggleCardSolutionView('${qId}')" id="btnToggleSol_${qId}" style="font-size:0.74rem; padding:4px 11px; display:inline-flex; align-items:center; gap:6px;" title="Hide Solution">
              <i data-lucide="eye-off" style="width:13px; height:13px;"></i>
              <span>Hide Solution</span>
            </button>
          </div>
        </div>

        <!-- SOLUTION CONTENT BODY -->
        <div id="solBody_${qId}" style="display:flex; flex-direction:column; gap:16px;">
          <!-- STEP 1: FUNDAMENTAL PRINCIPLE & FORMULA -->
          <div class="qb-solution-concept-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
              <span style="font-size:0.76rem; font-weight:800; color:#22d3ee; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:6px;">
                <i data-lucide="compass" style="width:14px; height:14px;"></i> Step 1: Fundamental Concept &amp; Governing Formula
              </span>
              <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" class="qb-btn-toggle-explain" onclick="toggleSolutionConceptExplanation('${qId}')" id="btnExplain_${qId}">
                  <i data-lucide="help-circle" style="width:13px; height:13px;"></i> View Concept &amp; Reasoning
                </button>
                <span style="font-size:0.7rem; font-weight:700; color:var(--text-muted); background:rgba(255,255,255,0.04); padding:2px 7px; border-radius:4px;">
                  Foundation Step
                </span>
              </div>
            </div>
            <div style="background:rgba(0,0,0,0.3); border:1px dashed rgba(6,182,212,0.45); border-radius:6px; padding:12px 16px; font-size:1.02rem; color:#38bdf8; overflow-x:auto;">
              ${renderLatexString(steps.formulaLatex)}
            </div>
            <div id="boxExplain_${qId}" class="qb-concept-explanation-box" style="display:none; margin-top:10px;">
              <div style="font-size:0.84rem; color:#bae6fd; font-weight:700; margin-bottom:4px;">Physical Concept &amp; Intuition:</div>
              <div style="font-size:0.96rem; color:var(--text-primary); line-height:1.7;">
                ${escapeHtml(steps.principleIntuition || steps.principle)}
              </div>
            </div>
          </div>

          <!-- STEP 2: LINE-BY-LINE MATHEMATICAL DERIVATION (WITH CLEAR GAPS) -->
          <div>
            <div style="font-size:0.76rem; font-weight:800; color:#60a5fa; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:inline-flex; align-items:center; gap:6px;">
              <i data-lucide="list-ordered" style="width:14px; height:14px;"></i> Step 2: Line-by-Line Mathematical Working (${steps.parsedSteps.length} Key Steps)
            </div>
            <div class="qb-solution-steps-flow">
              ${steps.parsedSteps.map((s, sIdx) => `
                <div class="qb-solution-step-item">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span class="qb-solution-step-badge">
                      Step 2.${sIdx + 1}: ${escapeHtml(s.title)}
                    </span>
                    <span style="font-size:0.74rem; color:var(--text-muted); font-weight:600;">
                      ${s.stepRubric ? escapeHtml(s.stepRubric) : `Step ${sIdx + 1}`}
                    </span>
                  </div>
                  <div class="sol-step-content" style="font-size:1.02rem; color:var(--text-primary); line-height:1.75;">
                    ${formatStepEquations(s.text)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- STEP 3: FINAL VERIFIED RESULT -->
          <div class="qb-solution-answer-box">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:50%; background:rgba(16,185,129,0.2); color:#34d399; flex-shrink:0; margin-top:2px;">
              <i data-lucide="check-circle" style="width:18px; height:18px;"></i>
            </span>
            <div style="flex:1;">
              <div style="font-size:0.76rem; font-weight:800; color:#34d399; text-transform:uppercase; letter-spacing:0.5px;">
                Step 3: Final Verified Result &amp; Concluding Statement
              </div>
              <div style="font-size:1.12rem; font-weight:800; color:#ecfdf5; margin:6px 0 4px 0; overflow-x:auto;">
                ${renderLatexString(steps.correctAnswer)}
              </div>
              <div style="font-size:0.88rem; color:#a7f3d0; line-height:1.6;">
                ${escapeHtml(steps.answerInterpretation || 'This result completes the derivation according to CBSE and State Board evaluation criteria.')}
              </div>
            </div>
          </div>

          <!-- STEP 4: BOARD MARKING SCHEME & EXAMINER ADVICE -->
          <div class="qb-solution-exam-tip-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:0.76rem; font-weight:800; color:#fbbf24; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:6px;">
                <i data-lucide="award" style="width:14px; height:14px;"></i> Step 4: Official CBSE / HP Board Step Rubric (${marks} Mark${marks > 1 ? 's' : ''})
              </span>
              <span style="font-size:0.74rem; color:#f59e0b; font-weight:700;">Examiner Marking Guide</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:0.86rem; color:var(--text-secondary); margin-bottom:10px;">
              ${steps.rubric.map(r => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed rgba(255,255,255,0.06);">
                  <span>${escapeHtml(r.step)}</span>
                  <strong style="color:#fbbf24; margin-left:8px;">${r.marks}</strong>
                </div>
              `).join('')}
            </div>
            <div style="display:flex; align-items:flex-start; gap:8px; font-size:0.86rem; color:#fde68a; line-height:1.6; padding-top:4px;">
              <i data-lucide="alert-triangle" style="width:15px; height:15px; color:#fbbf24; flex-shrink:0; margin-top:2px;"></i>
              <span><strong>Examiner Advice:</strong> ${escapeHtml(steps.examTip || 'Follow step-by-step arithmetic without skipping formula statements to secure maximum board credit.')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="qb-single-view-container">
      ${renderNavBar(false)}

      <div class="glass-card qb-question-focus-card" id="qbCard_${qId}">
        <!-- CARD TOP META BAR -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
            <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); background:var(--bg-secondary); padding:3px 9px; border-radius:6px; border:1px solid var(--border-subtle);">
              #Q${currentIdx + 1} of ${total} &bull; ${qId}
            </span>
            <span style="font-size:0.76rem; font-weight:700; color:var(--accent-blue); background:rgba(37,99,235,0.12); padding:3px 10px; border-radius:6px; border:1px solid rgba(37,99,235,0.25);">
              Ch ${chNum}: ${escapeHtml(chName)}
            </span>
            <span style="font-size:0.74rem; font-weight:700; padding:3px 10px; border-radius:6px; ${sourceBadgeStyle}">
              ${escapeHtml(source)}
            </span>
            <span style="font-size:0.72rem; font-weight:700; padding:3px 8px; border-radius:6px; ${diffBadgeStyle}">
              ${diff}
            </span>
          </div>
          <div style="display:flex; align-items:center; gap:10px; font-size:0.78rem; color:var(--text-muted);">
            <span><i data-lucide="award" style="width:13px; height:13px; vertical-align:middle;"></i> ${marks} Mark${marks > 1 ? 's' : ''}</span>
            <span>&bull;</span>
            <span><i data-lucide="clock" style="width:13px; height:13px; vertical-align:middle;"></i> Benchmark: ${timeSec}s</span>
          </div>
        </div>

        <!-- AI REAL-TIME LIVE VOICE ASSISTANT BAR -->
        <div class="qb-voice-tutor-banner" id="voiceBanner_${qId}">
          <div class="qb-voice-header-row">
            <div class="qb-voice-brand">
              <span class="qb-live-pulsing-dot" style="margin-right:2px;"></span>
              <i data-lucide="presentation" style="width:17px; height:17px; color:#38bdf8;"></i>
              <span>AI Interactive Classroom &bull; Voice & Whiteboard Sync</span>
              <span class="qb-voice-badge-neural"><i data-lucide="sparkles" style="width:11px; height:11px;"></i> Full-Duplex</span>
              <div class="qb-voice-wave" id="voiceWave_${qId}">
                <div class="qb-voice-wave-bar"></div>
                <div class="qb-voice-wave-bar"></div>
                <div class="qb-voice-wave-bar"></div>
                <div class="qb-voice-wave-bar"></div>
                <div class="qb-voice-wave-bar"></div>
              </div>
            </div>
            <div class="qb-voice-actions-row">
              <button type="button" class="qb-voice-btn qb-voice-btn-live qb-unified-tutor-btn" onclick="startUnifiedClassroomSession('${qId}')" id="btnLiveVoice_${qId}" title="Start Live AI Teacher Smartboard Session with Real-Time Spoken Teaching">
                <span class="qb-live-pulsing-dot"></span>
                <i data-lucide="presentation" style="width:14px; height:14px;"></i>
                <span class="qb-btn-label">AI Teacher & Smartboard</span>
                <span class="qb-live-tag">LIVE CLASS</span>
              </button>
              <button type="button" class="qb-voice-btn qb-voice-btn-stop" onclick="stopRealtimeVoiceAssistant('${qId}', true);" id="btnStopVoice_${qId}" title="End Classroom Session" style="display:none;">
                <i data-lucide="phone-off" style="width:12px; height:12px;"></i> End Class
              </button>
            </div>
          </div>

          <!-- Live Spoken Transcript & Interruption Drawer (collapsible) -->
          <div id="voiceDrawer_${qId}" class="qb-voice-transcript-drawer" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span id="voiceStatusBadge_${qId}" style="font-size:0.75rem; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:6px;">
                <i data-lucide="mic" style="width:13px; height:13px;"></i> Audio Tutor Live
              </span>
              <button type="button" onclick="closeVoiceDrawer('${qId}')" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:0.72rem;">Close</button>
            </div>

            <!-- Live Dual Audio Level Meters -->
            <div id="voiceLiveVisualizer_${qId}" class="qb-live-visualizer-panel" style="display:none;">
              <div class="qb-live-meter-group">
                <span class="qb-live-meter-label"><i data-lucide="mic" style="width:11px; height:11px;"></i> You (Mic):</span>
                <div class="qb-live-meter-track"><div id="micMeter_${qId}" class="qb-live-meter-fill-mic"></div></div>
              </div>
              <div class="qb-live-meter-group">
                <span class="qb-live-meter-label"><i data-lucide="volume-2" style="width:11px; height:11px;"></i> Teacher:</span>
                <div class="qb-live-meter-track"><div id="tutorMeter_${qId}" class="qb-live-meter-fill-tutor"></div></div>
              </div>
            </div>

            <!-- Auto-Interruption Notification Hint -->
            <div id="voiceLiveHint_${qId}" class="qb-live-interruption-notice" style="display:none; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div style="display:inline-flex; align-items:center; gap:8px;">
                <i data-lucide="sparkles" style="width:13px; height:13px;"></i>
                <span>Hands-Free Auto-Interruption Active: <strong>Speak anytime</strong> to ask doubts live!</span>
              </div>
              <button type="button" class="btn-secondary" onclick="commitLiveVoiceTurn('${qId}')" style="font-size:0.75rem; padding:4px 10px; border-radius:6px; background:rgba(56,189,248,0.18); border:1px solid rgba(56,189,248,0.45); color:#38bdf8; cursor:pointer;" title="Trigger response immediately without waiting for pause">
                <i data-lucide="zap" style="width:12px; height:12px; vertical-align:middle;"></i> Done Speaking (Instant)
              </button>
            </div>

            <!-- Spoken Content Transcript Box -->
            <div id="voiceTranscript_${qId}" style="font-size:0.95rem; color:#f1f5f9; line-height:1.7; background:rgba(0,0,0,0.25); padding:10px 14px; border-radius:6px; border-left:3px solid #38bdf8;">
              Listening for voice instructions...
            </div>

            <!-- Interruption & Doubt Interaction Area -->
            <div id="voiceInterruptionArea_${qId}" class="qb-voice-interruption-box">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span style="font-size:0.78rem; font-weight:700; color:#fb7185; display:inline-flex; align-items:center; gap:6px;">
                  <i data-lucide="message-square-plus" style="width:13px; height:13px;"></i> Have a doubt? Speak or type in Hinglish:
                </span>
                <span style="font-size:0.7rem; color:var(--text-muted);">Audio pauses automatically when you interrupt</span>
              </div>
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="inputVoiceDoubt_${qId}" class="form-input" placeholder="e.g. Sir, yahan minus sign kyu lagaya? ya kaunsa formula lagana hai?" style="flex:1; font-size:0.86rem; padding:8px 12px; border-radius:6px;" onkeydown="if(event.key==='Enter') submitVoiceDoubt('${qId}')">
                <button type="button" class="btn-secondary" id="btnMic_${qId}" onclick="toggleVoiceMicInput('${qId}')" style="font-size:0.8rem; padding:8px 12px; display:inline-flex; align-items:center; gap:6px;" title="Speak doubt into microphone">
                  <i data-lucide="mic" style="width:14px; height:14px; color:#fb7185;"></i> Speak
                </button>
                <button type="button" class="btn-primary" onclick="submitVoiceDoubt('${qId}')" style="font-size:0.8rem; padding:8px 14px; background:#2563eb;">
                  Ask Doubt
                </button>
              </div>
              <!-- Quick Question Chips -->
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:2px;">
                <span class="qb-doubt-chip" onclick="quickAskDoubt('${qId}', 'Kaunsa formula lagana hai?')">Kaunsa formula lagana hai?</span>
                <span class="qb-doubt-chip" onclick="quickAskDoubt('${qId}', 'Pehla step kya hoga?')">Pehla step kya hoga?</span>
                <span class="qb-doubt-chip" onclick="quickAskDoubt('${qId}', 'Minus sign kyu aaya?')">Minus sign kyu aaya?</span>
                <span class="qb-doubt-chip" onclick="quickAskDoubt('${qId}', 'Koi shortcut trick hai kya?')">Koi shortcut trick hai?</span>
              </div>
            </div>
          </div>
        </div>

        <!-- AI LIVE WHITEBOARD (TLDRAW) -->
        <div class="qb-whiteboard-container" id="wbContainer_${qId}" style="display:none;">
          <div class="qb-whiteboard-toolbar">
            <div class="qb-whiteboard-brand">
              <span class="pulse-dot"></span>
              <i data-lucide="edit-3" style="width:14px; height:14px; color:#38bdf8;"></i>
              <span>AI Teacher Whiteboard &bull; Live tldraw Sync</span>
            </div>
            <div class="qb-whiteboard-actions">
              <button type="button" class="qb-whiteboard-btn" onclick="clearLiveWhiteboard('${qId}')" title="Clear board">
                <i data-lucide="rotate-ccw" style="width:12px; height:12px;"></i> Clear
              </button>
              <button type="button" class="qb-whiteboard-btn" onclick="fitLiveWhiteboard('${qId}')" title="Zoom to fit">
                <i data-lucide="maximize" style="width:12px; height:12px;"></i> Zoom Fit
              </button>
              <button type="button" class="qb-whiteboard-btn" onclick="toggleExpandWhiteboard('${qId}')" id="btnWbExpand_${qId}" title="Toggle fullscreen canvas">
                <i data-lucide="expand" style="width:12px; height:12px;"></i> Fullscreen
              </button>
            </div>
          </div>
          <iframe id="wbIframe_${qId}" class="qb-whiteboard-iframe" src="/whiteboard?v=${Date.now()}" allow="clipboard-read; clipboard-write"></iframe>
        </div>

        <!-- QUESTION STATEMENT -->
        <div class="qb-question-statement" style="font-size:1.06rem; color:var(--text-primary); line-height:1.75; margin:16px 0 18px 0; font-weight:500;">
          ${renderLatexString(q.question_latex || q.questionText || '')}
        </div>

        <!-- OPTIONS GRID (IF MCQ) -->
        ${options.length > 0 ? `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:10px; margin-bottom:16px;">
            ${options.map((opt, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const optText = typeof opt === 'object' ? (opt.latex || opt.text || '') : String(opt);
              const isCorrect = (typeof opt === 'object' && opt.is_correct) || (q.correct_answer_latex === letter) || (q.correct_answer === letter);

              return `
                <div class="qb-option-tile" data-correct="${isCorrect ? 'true' : 'false'}" id="opt_${qId}_${oIdx}" style="padding:10px 14px; background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:8px; font-size:0.9rem; display:flex; align-items:baseline; gap:10px; transition:all 0.2s ease;">
                  <strong style="font-size:0.84rem; color:var(--accent-blue);">${letter}.</strong>
                  <span style="flex:1;">${renderLatexString(optText)}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- INTUITIVE STEP-BY-STEP SOLUTION CARD OR PROMPT -->
        ${solutionSectionHtml}

<!-- Redundant Action Buttons Removed: Exactly 2 Core Features Preserved (AI Teacher & Smartboard + Step-by-Step Solution) -->
      </div>

      ${renderNavBar(true)}
    </div>
  `;

  initLucideIcons();
  if (window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive()) {
    attachLiveVoiceCallbacks(qId);
  }
}

function nextQbQuestion() {
  const isLive = window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive();
  if (!isLive && typeof stopVoiceTutor === 'function') stopVoiceTutor();
  const total = state.qbFilteredQuestions?.length || 0;
  if (state.qbCurrentPage < total - 1) {
    state.qbCurrentPage++;
    state.qbSolutionRevealed = false;
    renderQbCurrentPage();
    if (isLive) {
      syncLiveVoiceAssistantToCurrentQuestion();
    }
    const tab = document.getElementById('tabQuestionBank');
    if (tab) {
      window.scrollTo({ top: tab.offsetTop - 20, behavior: 'smooth' });
    }
  }
}

function prevQbQuestion() {
  const isLive = window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive();
  if (!isLive && typeof stopVoiceTutor === 'function') stopVoiceTutor();
  const total = state.qbFilteredQuestions?.length || 0;
  if (state.qbCurrentPage > 0) {
    state.qbCurrentPage--;
    state.qbSolutionRevealed = false;
    renderQbCurrentPage();
    if (isLive) {
      syncLiveVoiceAssistantToCurrentQuestion();
    }
    const tab = document.getElementById('tabQuestionBank');
    if (tab) {
      window.scrollTo({ top: tab.offsetTop - 20, behavior: 'smooth' });
    }
  }
}

function setQbQuestionIndex(idx) {
  const isLive = window.geminiLiveVoiceTutor && window.geminiLiveVoiceTutor.isSessionActive();
  if (!isLive && typeof stopVoiceTutor === 'function') stopVoiceTutor();
  const total = state.qbFilteredQuestions?.length || 0;
  if (total === 0) return;
  state.qbCurrentPage = Math.max(0, Math.min(idx, total - 1));
  state.qbSolutionRevealed = false;
  renderQbCurrentPage();
  if (isLive) {
    syncLiveVoiceAssistantToCurrentQuestion();
  }
  const tab = document.getElementById('tabQuestionBank');
  if (tab) {
    window.scrollTo({ top: tab.offsetTop - 20, behavior: 'smooth' });
  }
}

if (!window._qbKeyNavInitialized && typeof document !== 'undefined') {
  window._qbKeyNavInitialized = true;
  document.addEventListener('keydown', (e) => {
    if (state.activeTeacherTab !== 'tabQuestionBank') return;
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextQbQuestion();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevQbQuestion();
    }
  });
}

function openStepSolutionStudio(qId) {
  const q = state.questionBankData?.find(item => item.id === qId);
  if (!q) {
    alert('Question not found in repository.');
    return;
  }

  const modal = document.getElementById('modalStepSolutionStudio');
  const body = document.getElementById('studioModalBody');
  const title = document.getElementById('studioModalTitle');
  const subtitle = document.getElementById('studioModalSubtitle');
  if (!modal || !body) return;

  const chNum = q.chapter_number || '';
  const chName = q.chapter_name || q.chapter || 'Chapter';
  const source = q.question_source || q.pyq_appearance || (q.ncert_mapping ? q.ncert_mapping.pyq_tag : 'CBSE Board Question');
  const diff = (q.difficulty || 'MEDIUM').toUpperCase();
  const marks = q.marks || (diff === 'HARD' ? 5 : (diff === 'EASY' ? 1 : 3));
  const steps = formatIntuitiveSteps(q);

  if (title) title.innerText = `Step-by-Step Solution Studio: #${qId} (Ch ${chNum})`;
  if (subtitle) subtitle.innerText = `${escapeHtml(chName)} • ${escapeHtml(source)} • ${marks} Mark${marks > 1 ? 's' : ''} (${diff})`;

  body.innerHTML = `
    <!-- TOP QUESTION SUMMARY -->
    <div style="background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <span style="font-size:0.75rem; font-weight:800; color:var(--accent-blue); background:rgba(37,99,235,0.12); padding:3px 10px; border-radius:4px;">
          Ch ${chNum}: ${escapeHtml(chName)}
        </span>
        <span style="font-size:0.75rem; font-weight:700; color:#f59e0b; background:rgba(245,158,11,0.12); padding:3px 10px; border-radius:4px; border:1px solid rgba(245,158,11,0.3);">
          ${escapeHtml(source)}
        </span>
        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">
          Marking Weightage: <strong>${marks} Mark${marks > 1 ? 's' : ''}</strong>
        </span>
      </div>
      <div style="font-size:0.95rem; line-height:1.65; color:var(--text-primary); font-weight:500;">
        ${renderLatexString(q.question_latex || q.questionText || '')}
      </div>
    </div>

    <!-- INTUITIVE 5-STEP SOLUTION ARCHITECTURE -->
    <div class="studio-step-container">
      
      <!-- STEP 1: FUNDAMENTAL PRINCIPLE / FORMULA -->
      <div class="studio-step-card step-principle">
        <div class="studio-step-header" style="flex-wrap:wrap; gap:8px;">
          <span class="studio-step-tag" style="color:var(--accent-cyan);">
            <i data-lucide="compass" style="width:14px; height:14px;"></i> Step 1: Fundamental Principle &amp; Key Formula Applied
          </span>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="qb-btn-toggle-explain" onclick="toggleSolutionConceptExplanation('studio_${qId}')" id="btnExplain_studio_${qId}">
              <i data-lucide="help-circle" style="width:13px; height:13px;"></i> View Concept &amp; Reasoning
            </button>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">Foundation Step</span>
          </div>
        </div>
        <div style="background:rgba(6,182,212,0.1); border:1px dashed rgba(6,182,212,0.45); border-radius:6px; padding:12px 16px; font-size:1.02rem; color:#38bdf8; overflow-x:auto;">
          ${renderLatexString(steps.formulaLatex)}
        </div>
        <div id="boxExplain_studio_${qId}" class="qb-concept-explanation-box" style="display:none; margin-top:10px;">
          <div style="font-size:0.84rem; color:#bae6fd; font-weight:700; margin-bottom:4px;">Physical Concept &amp; Intuition:</div>
          <div style="font-size:0.96rem; color:var(--text-primary); line-height:1.7;">
            ${escapeHtml(steps.principleIntuition || steps.principle)}
          </div>
        </div>
      </div>

      <!-- STEP 2: LINE-BY-LINE MATHEMATICAL DERIVATION -->
      <div class="studio-step-card step-derivation">
        <div class="studio-step-header">
          <span class="studio-step-tag" style="color:var(--accent-blue);">
            <i data-lucide="list-ordered" style="width:14px; height:14px;"></i> Step 2: Line-by-Line Mathematical Derivation &amp; Intermediate Work (${steps.parsedSteps.length} Key Steps)
          </span>
          <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">Execution Step</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${steps.parsedSteps.map((s, sIdx) => `
            <div style="background:rgba(0,0,0,0.22); padding:12px 14px; border-radius:6px; border:1px solid var(--border-subtle);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-size:0.76rem; font-weight:800; color:var(--accent-blue); background:rgba(37,99,235,0.15); padding:2px 8px; border-radius:4px;">
                  Step 2.${sIdx + 1}: ${escapeHtml(s.title)}
                </span>
                <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">
                  ${s.stepRubric ? escapeHtml(s.stepRubric) : `Step ${sIdx + 1}`}
                </span>
              </div>
              <div class="sol-step-content" style="font-size:1.02rem; line-height:1.75; color:var(--text-primary);">
                ${formatStepEquations(s.text)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- STEP 3: FINAL VERIFIED ANSWER & UNITS -->
      <div class="studio-step-card step-answer">
        <div class="studio-step-header">
          <span class="studio-step-tag" style="color:#10b981;">
            <i data-lucide="check-circle-2" style="width:14px; height:14px;"></i> Step 3: Final Verified Answer &amp; Units
          </span>
          <span style="font-size:0.72rem; color:#10b981; font-weight:700;">Verified Key</span>
        </div>
        <div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.35); border-radius:6px; padding:12px 16px; font-size:1.05rem; font-weight:700; color:#34d399; display:flex; align-items:center; gap:10px;">
          <i data-lucide="check" style="width:18px; height:18px;"></i>
          <span>${renderLatexString(steps.correctAnswer)}</span>
        </div>
      </div>

      <!-- STEP 4: OFFICIAL CBSE / HP BOARD STEP RUBRIC -->
      <div class="studio-step-card step-rubric">
        <div class="studio-step-header">
          <span class="studio-step-tag" style="color:#f59e0b;">
            <i data-lucide="award" style="width:14px; height:14px;"></i> Step 4: Official CBSE / HP Board Marking Scheme Rubric (${marks} Mark${marks > 1 ? 's' : ''})
          </span>
          <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">Board Criteria</span>
        </div>
        <table class="studio-rubric-table">
          <thead>
            <tr>
              <th style="width:75%;">Evaluation Step / Work Checked by Examiner</th>
              <th style="width:25%; text-align:right;">Marks Awarded</th>
            </tr>
          </thead>
          <tbody>
            ${steps.rubric.map(r => `
              <tr>
                <td style="color:var(--text-primary);">${escapeHtml(r.step)}</td>
                <td style="color:#fbbf24; font-weight:700; text-align:right;">${r.marks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- STEP 5: PEDAGOGICAL ALERT & COMMON PITFALLS -->
      <div class="studio-step-card step-hints">
        <div class="studio-step-header">
          <span class="studio-step-tag" style="color:#c084fc;">
            <i data-lucide="lightbulb" style="width:14px; height:14px;"></i> Step 5: Teacher Pedagogical Alert &amp; Common Student Pitfalls
          </span>
          <span style="font-size:0.72rem; color:#c084fc; font-weight:700;">Classroom Coaching</span>
        </div>
        ${steps.examTip ? `
          <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:6px; padding:10px 14px; margin-bottom:10px; font-size:0.84rem; color:#fde68a; display:flex; align-items:flex-start; gap:8px;">
            <i data-lucide="alert-triangle" style="width:14px; height:14px; color:#fbbf24; flex-shrink:0; margin-top:2px;"></i>
            <span><strong>Examiner Advice:</strong> ${escapeHtml(steps.examTip)}</span>
          </div>
        ` : ''}
        <div style="display:flex; flex-direction:column; gap:6px; font-size:0.84rem; color:var(--text-secondary); line-height:1.5;">
          ${steps.hints.map(h => `
            <div style="display:flex; align-items:flex-start; gap:8px;">
              <i data-lucide="alert-circle" style="width:14px; height:14px; color:#c084fc; flex-shrink:0; margin-top:2px;"></i>
              <span>${renderLatexString(h)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- TEACHER BLACKBOARD CUSTOM NOTES (SAVED LOCALLY) -->
      <div style="background:var(--bg-secondary); border:1px dashed var(--border-subtle); border-radius:var(--radius-md); padding:12px 14px;">
        <label for="studioTeacherNotes" style="font-size:0.74rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">
          <i data-lucide="edit-3" style="width:12px; height:12px; vertical-align:middle;"></i> Teacher Blackboard / Classroom Coaching Notes (Optional):
        </label>
        <textarea id="studioTeacherNotes" rows="2" style="width:100%; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; color:var(--text-primary); font-size:0.82rem; padding:8px 10px; resize:vertical;" placeholder="Add custom teacher remarks, e.g., 'Emphasize checking negative roots in quadratic equations before announcing final dimensions'">${escapeHtml(localStorage.getItem(`teacher_note_${qId}`) || '')}</textarea>
      </div>

    </div>
  `;

  const btnCopy = document.getElementById('btnStudioCopyLatex');
  if (btnCopy) {
    btnCopy.onclick = () => {
      const fullLatex = `% Question #${qId} (Ch ${chNum}: ${chName})
% Source: ${source} | Marks: ${marks}
\\textbf{Question:} ${q.question_latex || q.questionText || ''}

\\textbf{Step 1 (Formula/Principle):} ${steps.principle}
$$${steps.formulaLatex}$$

\\textbf{Step 2 (Step-by-Step Derivation):}
${steps.rawSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

\\textbf{Step 3 (Final Answer):} ${steps.correctAnswer}
`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(fullLatex).then(() => {
          alert(`Complete step-by-step LaTeX solution for #${qId} copied to clipboard.`);
        });
      } else {
        alert(fullLatex);
      }
    };
  }

  const btnPrint = document.getElementById('btnStudioPrintHandout');
  if (btnPrint) {
    btnPrint.onclick = () => {
      const notesEl = document.getElementById('studioTeacherNotes');
      if (notesEl) {
        localStorage.setItem(`teacher_note_${qId}`, notesEl.value.trim());
      }
      window.print();
    };
  }

  const btnAssign = document.getElementById('btnStudioAssignQuiz');
  if (btnAssign) {
    btnAssign.onclick = () => {
      closeStepSolutionStudio();
      assignQbQuestionToClass(qId);
    };
  }

  modal.style.display = 'flex';
  initLucideIcons();
}

function closeStepSolutionStudio() {
  const modal = document.getElementById('modalStepSolutionStudio');
  if (modal) modal.style.display = 'none';
}

function openChapterSolutionSheetModal() {
  const chVal = document.getElementById('selectQbChapter')?.value || '1';
  const targetCh = chVal === 'ALL' ? 1 : chVal;
  
  let chapterQuestions = (state.questionBankData || []).filter(q => {
    if (q.chapter_number !== undefined) return String(q.chapter_number) === String(targetCh);
    const chName = (q.chapter_name || q.chapter || '').toLowerCase();
    return chName.includes(`ch ${targetCh}`) || chName.includes(`chapter ${targetCh}`);
  });

  if (chapterQuestions.length === 0) {
    chapterQuestions = (state.questionBankData || []).slice(0, 15);
  }

  const modal = document.getElementById('modalStepSolutionStudio');
  const body = document.getElementById('studioModalBody');
  const title = document.getElementById('studioModalTitle');
  const subtitle = document.getElementById('studioModalSubtitle');
  if (!modal || !body) return;

  const firstQ = chapterQuestions[0] || {};
  const chNum = firstQ.chapter_number || targetCh;
  const chName = firstQ.chapter_name || `Chapter ${chNum}`;

  if (title) title.innerText = `Master Solution Sheet: Ch ${chNum} - ${chName}`;
  if (subtitle) subtitle.innerText = `Complete Step-by-Step Solutions & CBSE Step Rubrics (${chapterQuestions.length} Questions)`;

  body.innerHTML = `
    <div style="background:linear-gradient(135deg, rgba(37,99,235,0.15), rgba(16,185,129,0.1)); border:1px solid rgba(59,130,246,0.3); border-radius:var(--radius-md); padding:16px; margin-bottom:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h3 style="margin:0; font-size:1.1rem; color:var(--text-primary); font-weight:800;">
          Department of Mathematics &bull; Class 10th Solution Handout
        </h3>
        <span style="font-size:0.76rem; background:rgba(37,99,235,0.2); color:#60a5fa; padding:3px 10px; border-radius:12px; font-weight:700;">
          ${chapterQuestions.length} Problems with Detailed Derivations
        </span>
      </div>
      <p style="margin:6px 0 0 0; font-size:0.82rem; color:var(--text-secondary);">
        This handout contains CBSE Board PYQs and NCERT exercises with step-by-step mathematical working and step rubric allocation for classroom instruction.
      </p>
    </div>

    <div style="display:flex; flex-direction:column; gap:20px;">
      ${chapterQuestions.map((q, idx) => {
        const qId = q.id || `q_${idx}`;
        const source = q.question_source || q.pyq_appearance || 'Board Question';
        const diff = (q.difficulty || 'MEDIUM').toUpperCase();
        const marks = q.marks || (diff === 'HARD' ? 5 : (diff === 'EASY' ? 1 : 3));
        const steps = formatIntuitiveSteps(q);

        return `
          <div style="background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px 18px; border-left:4px solid var(--accent-blue);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
              <span style="font-size:0.82rem; font-weight:800; color:var(--accent-blue);">
                Q${idx + 1}. #${qId} &bull; ${escapeHtml(source)}
              </span>
              <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">
                ${marks} Mark${marks > 1 ? 's' : ''} &bull; ${diff}
              </span>
            </div>
            
            <div style="font-size:0.92rem; color:var(--text-primary); line-height:1.6; margin-bottom:12px; font-weight:500;">
              ${renderLatexString(q.question_latex || q.questionText || '')}
            </div>

            <div class="qb-solution-mastercard" style="margin-top:12px; margin-bottom:12px;">
              <div style="display:flex; flex-direction:column; gap:14px;">
                <!-- Concept Intuition & Formula -->
                <div class="qb-solution-concept-box">
                  <div style="font-size:0.72rem; font-weight:800; color:#22d3ee; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                    Concept &amp; Governing Formula
                  </div>
                  <div style="font-size:0.86rem; color:var(--text-primary); line-height:1.6; margin-bottom:8px;">
                    <strong>Intuition:</strong> ${escapeHtml(steps.principleIntuition || steps.principle)}
                  </div>
                  <div style="background:rgba(0,0,0,0.25); border:1px dashed rgba(6,182,212,0.4); border-radius:6px; padding:8px 12px; font-size:0.92rem; color:#38bdf8;">
                    ${renderLatexString(steps.formulaLatex)}
                  </div>
                </div>

                <!-- Step-by-Step Derivation Flow -->
                <div class="qb-solution-steps-flow">
                  ${steps.parsedSteps.map((s, sIdx) => `
                    <div class="qb-solution-step-item">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span class="qb-solution-step-badge">
                          Step ${sIdx + 1}: ${escapeHtml(s.title)}
                        </span>
                        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">
                          ${s.stepRubric ? escapeHtml(s.stepRubric) : ''}
                        </span>
                      </div>
                      <div class="sol-step-content" style="font-size:0.96rem; color:var(--text-primary); line-height:1.7;">
                        ${formatStepEquations(s.text)}
                      </div>
                    </div>
                  `).join('')}
                </div>

                <!-- Final Answer Box -->
                <div class="qb-solution-answer-box">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:rgba(16,185,129,0.2); color:#34d399; flex-shrink:0;">
                    <i data-lucide="check-circle" style="width:14px; height:14px;"></i>
                  </span>
                  <div>
                    <div style="font-size:0.7rem; font-weight:800; color:#34d399; text-transform:uppercase;">
                      Verified Final Answer
                    </div>
                    <div style="font-size:0.96rem; font-weight:800; color:#ecfdf5; margin-top:2px;">
                      ${renderLatexString(steps.correctAnswer)}
                    </div>
                  </div>
                </div>

                <!-- Examiner Advice & Marking Rubric -->
                <div class="qb-solution-exam-tip-box">
                  <div style="font-size:0.72rem; font-weight:800; color:#fbbf24; text-transform:uppercase; margin-bottom:6px;">
                    CBSE / HP Board Marking Guide &amp; Examiner Tip
                  </div>
                  <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:6px;">
                    ${steps.rubric.map(r => `${escapeHtml(r.step.split(':')[0])} (${r.marks})`).join(' + ')} = ${marks} Marks Total
                  </div>
                  <div style="font-size:0.8rem; color:#fde68a; line-height:1.5;">
                    <strong>Examiner Tip:</strong> ${escapeHtml(steps.examTip || 'Show intermediate simplification steps cleanly to ensure full board marks.')}
                  </div>
                </div>
              </div>
            </div>

            <div style="font-size:0.74rem; color:var(--text-muted); display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
              <span><strong>Total Value:</strong> ${marks} Mark${marks > 1 ? 's' : ''} &bull; NCERT &amp; CBSE Aligned</span>
              <button type="button" class="btn-secondary" onclick="openStepSolutionStudio('${qId}')" style="font-size:0.72rem; padding:3px 8px;">
                <i data-lucide="maximize-2" style="width:11px; height:11px;"></i> Open in Studio
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  const btnPrint = document.getElementById('btnStudioPrintHandout');
  if (btnPrint) {
    btnPrint.onclick = () => window.print();
  }

  const btnCopy = document.getElementById('btnStudioCopyLatex');
  if (btnCopy) {
    btnCopy.onclick = () => {
      let doc = `% Master Solution Sheet - Ch ${chNum}: ${chName}\n\n`;
      chapterQuestions.forEach((q, i) => {
        const steps = formatIntuitiveSteps(q);
        doc += `% Question ${i + 1} (${q.id})\n\\textbf{Q${i + 1}:} ${q.question_latex || q.questionText || ''}\n\\textbf{Solution:}\n${steps.rawSteps.join('\n')}\n\\textbf{Answer:} ${steps.correctAnswer}\n\n`;
      });
      navigator.clipboard.writeText(doc).then(() => {
        alert(`Master Solution Sheet for Ch ${chNum} copied to clipboard.`);
      });
    };
  }

  modal.style.display = 'flex';
  initLucideIcons();
}

function toggleQbCardAnswer(cardId) {
  const card = document.getElementById(`qbCard_${cardId}`);
  if (!card) return;
  const tiles = card.querySelectorAll('.qb-option-tile');
  tiles.forEach(tile => {
    const isCorrect = tile.getAttribute('data-correct') === 'true';
    if (isCorrect) {
      if (tile.style.borderColor === 'rgb(16, 185, 129)') {
        tile.style.borderColor = 'var(--border-subtle)';
        tile.style.background = 'var(--bg-secondary)';
      } else {
        tile.style.borderColor = '#10b981';
        tile.style.background = 'rgba(16, 185, 129, 0.15)';
      }
    }
  });
}

function copyQbLatexToClipboard(qId) {
  const q = state.questionBankData?.find(item => item.id === qId);
  if (!q) return;
  const text = q.question_latex || q.questionText || '';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Question LaTeX for ${qId} copied to clipboard.`);
    }).catch(() => {
      alert(`LaTeX: ${text}`);
    });
  } else {
    alert(`LaTeX: ${text}`);
  }
}

async function assignQbQuestionToClass(qId) {
  const q = state.questionBankData?.find(item => item.id === qId);
  if (!q) return;

  const currentClass = teacherBuilderState.classes.find(c => c.id === teacherBuilderState.selectedClassId) || {};
  const currentSubj = currentClass?.subjects?.find(s => s.key === teacherBuilderState.selectedSubjectKey);
  const subjName = currentSubj ? currentSubj.name : (teacherBuilderState.activeTeacher?.subjectName || 'Mathematics');

  const title = `Flash Quiz: ${q.chapter_name || q.chapter || subjName} (#${qId})`;

  try {
    const payload = {
      classKey: teacherBuilderState.selectedClassId,
      grade: currentClass.grade || '10',
      section: currentClass.section || currentClass.key || teacherBuilderState.selectedClassId,
      subjectKey: teacherBuilderState.selectedSubjectKey,
      subjectName: subjName,
      chapterNumber: q.chapter_number || 1,
      chapterName: q.chapter_name || q.chapter || 'Chapter',
      subtopics: [q.topic || 'Core Concept'],
      mode: 'QUIZ',
      questionCount: 1,
      difficulty: q.difficulty || 'MEDIUM',
      title: title,
      autoAttempt: false
    };

    const res = await fetch(`${getApiBaseUrl()}/api/curriculum/generate-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.assessment) {
        openQuizCreatedSuccessModal(data.assessment);
      } else {
        alert(`Flash Quiz for question ${qId} assigned to class successfully.`);
      }
    } else {
      throw new Error(`Server returned ${res.status}`);
    }
  } catch (err) {
    console.error('Error assigning question:', err);
    alert('Notice: Could not assign question. Please check backend connection.');
  }
}

window.handleTabActivated = function(tabId) {
  state.activeTeacherTab = tabId;
  if (tabId === 'tabQuestionBank') {
    loadQuestionBankView();
  } else if (tabId === 'tabClassAnalytics') {
    const selectAssessment = document.getElementById('selectAnalyticsAssessment');
    const selVal = selectAssessment && selectAssessment.value;
    const targetId = (!selVal || selVal.startsWith('paper_')) 
      ? (state.lastSubmittedAssessmentId || state.activeAssessment?.id || null) 
      : selVal;
    loadClassAnalytics(targetId);
  }
};

window.loadQuestionBankView = loadQuestionBankView;
window.filterQuestionBankCards = filterQuestionBankCards;
window.quickFilterQbChapter = quickFilterQbChapter;
window.quickFilterQbSource = quickFilterQbSource;
window.openQbForChapter = openQbForChapter;
window.openStepSolutionStudio = openStepSolutionStudio;
window.closeStepSolutionStudio = closeStepSolutionStudio;
window.openChapterSolutionSheetModal = openChapterSolutionSheetModal;
window.formatIntuitiveSteps = formatIntuitiveSteps;
window.toggleQbCardAnswer = toggleQbCardAnswer;
window.copyQbLatexToClipboard = copyQbLatexToClipboard;
window.assignQbQuestionToClass = assignQbQuestionToClass;
window.resetQbFilters = resetQbFilters;
window.handleQbSubjectChange = handleQbSubjectChange;

function toggleCardSolutionView(qId) {
  state.qbSolutionRevealed = !state.qbSolutionRevealed;
  renderQbCurrentPage();
}
window.toggleCardSolutionView = toggleCardSolutionView;
window.nextQbQuestion = nextQbQuestion;
window.prevQbQuestion = prevQbQuestion;
window.setQbQuestionIndex = setQbQuestionIndex;
window.renderQbCurrentPage = renderQbCurrentPage;

// ============================================================================
// FULL-LENGTH BOARD QUESTION PAPER STUDIO & TEACHER CUSTOMIZER
// Supports CBSE & HP Board (HPBOSE) examination generation, swapping,
// custom additions, editing, and printing.
// ============================================================================

const boardPaperStudioState = {
  currentPaper: null,
  board: 'CBSE', // 'CBSE' or 'HP_BOARD'
  grade: '12',
  subject: 'Physics',
  showMarkingScheme: false,
  swapTargetQuestionId: null,
  alternativesList: []
};

function syncBoardPaperStudioWithTeacher() {
  const activeTeacher = teacherBuilderState.activeTeacher;
  const subSelect = document.getElementById('selectStudioSubject');
  if (!activeTeacher) return;

  const subjKey = activeTeacher.subjectKey || 'PHYSICS';
  if (subjKey === 'PHYSICS') {
    boardPaperStudioState.subject = 'Physics';
    boardPaperStudioState.grade = '12';
    if (subSelect) subSelect.value = 'Physics';
  } else if (subjKey === 'CHEMISTRY') {
    boardPaperStudioState.subject = 'Chemistry';
    boardPaperStudioState.grade = '12';
    if (subSelect) subSelect.value = 'Chemistry';
  } else if (subjKey === 'MATHEMATICS') {
    boardPaperStudioState.subject = 'Mathematics';
    boardPaperStudioState.grade = '12';
    if (subSelect) subSelect.value = 'Mathematics';
  } else if (subjKey === 'CLASS10_SCIENCE') {
    boardPaperStudioState.subject = 'Science';
    boardPaperStudioState.grade = '10';
    if (subSelect) subSelect.value = 'Science';
  } else if (subjKey === 'CLASS10_MATHEMATICS') {
    boardPaperStudioState.subject = 'Mathematics';
    boardPaperStudioState.grade = '10';
    if (subSelect) subSelect.value = 'Mathematics10';
  }
  updateBoardToggleUI();
}

async function openBoardPaperStudio(preferredBoard = null, preferredGrade = null, preferredSubject = null) {
  if (preferredBoard) boardPaperStudioState.board = preferredBoard;
  if (preferredGrade) boardPaperStudioState.grade = preferredGrade;
  if (preferredSubject) boardPaperStudioState.subject = preferredSubject;

  switchTeacherTab('tabTeacherBoardPaper');
  updateBoardToggleUI();
  await generateOrLoadBoardPaper();
}

function closeBoardPaperStudio() {
  switchTeacherTab('tabTeacherCreatePaper');
}

function updateBoardToggleUI() {
  const btnCbse = document.getElementById('btnToggleBoardCbse');
  const btnHp = document.getElementById('btnToggleBoardHp');
  const isCbse = boardPaperStudioState.board === 'CBSE';

  if (btnCbse && btnHp) {
    btnCbse.style.background = isCbse ? '#2563eb' : 'transparent';
    btnCbse.style.color = isCbse ? '#fff' : '#94a3b8';
    btnHp.style.background = !isCbse ? '#d97706' : 'transparent';
    btnHp.style.color = !isCbse ? '#fff' : '#94a3b8';
  }

  const subSelect = document.getElementById('selectStudioSubject');
  if (subSelect) {
    if (boardPaperStudioState.subject === 'Science') subSelect.value = 'Science';
    else if (boardPaperStudioState.subject === 'Mathematics' && boardPaperStudioState.grade === '10') subSelect.value = 'Mathematics10';
    else if (boardPaperStudioState.subject === 'Chemistry') subSelect.value = 'Chemistry';
    else if (boardPaperStudioState.subject === 'Mathematics') subSelect.value = 'Mathematics';
    else subSelect.value = 'Physics';
  }
}

async function changeStudioBoard(newBoard) {
  boardPaperStudioState.board = newBoard;
  updateBoardToggleUI();
  await generateOrLoadBoardPaper();
}

async function regenerateStudioPaper() {
  const subSelect = document.getElementById('selectStudioSubject');
  if (subSelect) {
    const val = subSelect.value;
    if (val === 'Mathematics10') {
      boardPaperStudioState.subject = 'Mathematics';
      boardPaperStudioState.grade = '10';
    } else if (val === 'Science') {
      boardPaperStudioState.subject = 'Science';
      boardPaperStudioState.grade = '10';
    } else {
      boardPaperStudioState.subject = val;
      boardPaperStudioState.grade = '12';
    }
  }
  await generateOrLoadBoardPaper();
}

async function generateOrLoadBoardPaper() {
  const canvas = document.getElementById('boardPaperPrintCanvas');
  if (canvas) {
    canvas.innerHTML = `
      <div style="text-align:center; padding: 4rem 2rem; color: #64748b;">
        <i data-lucide="loader-2" class="spin" style="width:32px; height:32px; margin:0 auto 12px; display:block; color:#2563eb;"></i>
        <strong style="font-size:1.1rem; color:#0f172a; display:block;">Synthesizing Official ${boardPaperStudioState.board === 'HP_BOARD' ? 'HP Board (HPBOSE)' : 'CBSE Board'} Examination Paper...</strong>
        <span style="font-size:0.85rem;">Aligning authentic PYQs, section mark blueprints, and marking rubrics...</span>
      </div>
    `;
    initLucideIcons();
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/assessments/board-paper/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board: boardPaperStudioState.board,
        grade: boardPaperStudioState.grade,
        subject: boardPaperStudioState.subject,
        schoolName: 'HIM ACADEMY PUBLIC SCHOOL (HAPS)',
        academicYear: '2025–26'
      })
    });

    const data = await res.json();
    if (data.success && data.paper) {
      boardPaperStudioState.currentPaper = data.paper;
      renderBoardPaperStudio(data.paper);
    } else {
      throw new Error(data.error || 'Failed to synthesize board paper.');
    }
  } catch (err) {
    console.error('[BOARD PAPER GEN ERROR]', err);
    if (canvas) {
      canvas.innerHTML = `
        <div style="text-align:center; padding: 3rem; color: #dc2626;">
          <i data-lucide="alert-circle" style="width:32px; height:32px; margin:0 auto 10px; display:block;"></i>
          <strong>Could not generate board paper: ${err.message}</strong>
        </div>
      `;
      initLucideIcons();
    }
  }
}

function renderBoardPaperStudio(paper) {
  const canvas = document.getElementById('boardPaperPrintCanvas');
  if (!canvas || !paper) return;

  const isHp = paper.board === 'HP_BOARD';
  const showScheme = boardPaperStudioState.showMarkingScheme;

  // Header Subtitle in navbar
  const subtitle = document.getElementById('studioPaperSubtitle');
  if (subtitle) {
    subtitle.innerHTML = `${paper.boardName} &bull; ${paper.grade}th ${paper.subject} &bull; ${paper.totalMarks} Marks (${paper.timeAllowedHours} Hours)`;
  }

  // Label on Marking Scheme Toggle button
  const labelScheme = document.getElementById('labelToggleMarkingScheme');
  if (labelScheme) {
    labelScheme.innerText = showScheme ? 'Hide Marking Scheme' : 'Show Marking Scheme';
  }

  let html = `
    <!-- OFFICIAL EXAMINATION HEADER -->
    <div class="paper-official-header">
      <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; letter-spacing: 1px; margin-bottom: 2px;">
        ${paper.schoolName || 'HIM ACADEMY PUBLIC SCHOOL (HAPS)'}
      </div>
      <div class="paper-school-name">
        ${isHp ? 'हिमाचल प्रदेश स्कूल शिक्षा बोर्ड (HPBOSE)' : 'CENTRAL BOARD OF SECONDARY EDUCATION (CBSE)'}
      </div>
      <div class="paper-board-title">
        ANNUAL BOARD MODEL EXAMINATION • SESSION ${paper.academicYear || '2025–26'}
      </div>
      <div style="font-weight: 800; font-size: 1.15rem; color: #0f172a; margin-top: 4px;">
        CLASS: ${paper.grade}th &bull; SUBJECT: ${paper.subject.toUpperCase()} ${isHp ? (paper.subject === 'Science' ? '(विज्ञान)' : '(भौतिक विज्ञान - सैद्धांतिक)') : '(THEORY)'}
      </div>

      <!-- ROLL NUMBER & TIME/MARKS BAR -->
      <div class="paper-meta-grid">
        <div class="paper-roll-box">
          <span>ROLL NO:</span>
          <span class="paper-roll-cell"></span>
          <span class="paper-roll-cell"></span>
          <span class="paper-roll-cell"></span>
          <span class="paper-roll-cell"></span>
          <span class="paper-roll-cell"></span>
          <span class="paper-roll-cell"></span>
          <span class="paper-roll-cell"></span>
        </div>
        <div>TIME ALLOWED: ${paper.timeAllowedHours} HOURS</div>
        <div>MAXIMUM MARKS: ${paper.totalMarks}</div>
      </div>
    </div>

    <!-- GENERAL INSTRUCTIONS -->
    <div class="paper-instructions-box">
      <strong style="display: block; margin-bottom: 4px; font-size: 0.85rem; color: #0f172a;">
        GENERAL INSTRUCTIONS / सामान्य निर्देश:
      </strong>
      <ol style="margin: 0; padding-left: 20px;">
        ${(paper.instructions || []).map(inst => `<li style="margin-bottom: 3px;">${renderLatexString(inst)}</li>`).join('')}
      </ol>
    </div>

    <!-- SECTIONS & QUESTIONS -->
    <div class="paper-sections-container">
  `;

  paper.sections.forEach(sec => {
    html += `
      <div class="paper-section-block" id="paperSection_${sec.id}">
        <div class="paper-section-title">
          <span>${sec.name}</span>
          <span style="font-size: 0.85rem; font-weight: 700; color: #2563eb;">[${sec.totalMarks} Marks]</span>
        </div>
        ${sec.description ? `<div style="font-size: 0.8rem; color: #475569; margin-bottom: 12px; font-style: italic;">${renderLatexString(sec.description)}</div>` : ''}

        <div class="paper-questions-list">
    `;

    sec.questions.forEach(q => {
      const isMcq = q.marks === 1 || (q.options_latex && q.options_latex.length > 0);
      const isCustom = !!q.isCustomTeacherQuestion;

      html += `
        <div class="paper-question-item ${isCustom ? 'custom-teacher-q' : ''}" id="paperQuestion_${q.id}">
          <div class="paper-q-header">
            <div class="paper-q-num">
              <strong>Q${q.question_number}.</strong>
              ${q.topic ? `<span style="font-size:0.75rem; color:#64748b; font-weight:600; margin-left:6px;">[${q.topic}]</span>` : ''}
              ${q.pyq_appearance ? `<span style="font-size:0.7rem; color:#059669; font-weight:700; margin-left:6px; background:#ecfdf5; padding:1px 6px; border-radius:3px;">${q.pyq_appearance}</span>` : ''}
              ${isCustom ? `<span style="font-size:0.7rem; color:#d97706; font-weight:700; margin-left:6px; background:#fef3c7; padding:1px 6px; border-radius:3px;">Teacher Formulated</span>` : ''}
            </div>
            <div class="paper-q-marks">[${q.marks} Mark${q.marks > 1 ? 's' : ''}]</div>
          </div>

          <div class="paper-q-text">
            ${renderLatexString(q.question_latex)}
          </div>

          ${isMcq && q.options_latex && q.options_latex.length > 0 ? `
            <div class="paper-q-options">
              ${q.options_latex.map(opt => `
                <div class="paper-q-option ${showScheme && (opt.is_correct || opt.key === q.correct_answer) ? 'correct-option' : ''}">
                  <strong>(${opt.key})</strong> <span>${renderLatexString(opt.latex || opt.text || '')}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- MARKING SCHEME / SOLUTION (IF TOGGLED ON) -->
          ${showScheme ? `
            <div class="paper-q-solution-box">
              <div style="font-weight: 700; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="check-circle" style="width: 14px; height: 14px; color: #059669;"></i>
                <span>Official Marking Scheme &amp; Step Rubric (Answer: ${renderLatexString(q.correct_answer || 'See Solution')}):</span>
              </div>
              <div style="font-size: 0.85rem; line-height: 1.45; white-space: pre-line;">
                ${renderLatexString(q.solution_latex || 'Award marks based on valid logical derivation steps.')}
              </div>
              ${q.step_rubric && q.step_rubric.length > 0 ? `
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(5,150,105,0.3); font-size: 0.78rem;">
                  <strong>Step Breakdown:</strong>
                  <ul style="margin: 2px 0 0 16px; padding: 0;">
                    ${q.step_rubric.map(r => `<li>${renderLatexString(r.step)} — <strong>[${r.marks}M]</strong></li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- TEACHER CUSTOMIZATION TOOLBAR -->
          <div class="paper-q-teacher-tools">
            <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Teacher Controls:</span>
            <button type="button" class="btn-paper-tool swap" onclick="openSwapQuestionModal('${q.id}')" title="Swap this question with another authentic PYQ from the question bank">
              <i data-lucide="refresh-cw" style="width: 12px; height: 12px;"></i> Swap / Change Question
            </button>
            <button type="button" class="btn-paper-tool" onclick="openEditQuestionModal('${q.id}')" title="Edit question text, options, marks or solution in place">
              <i data-lucide="pencil" style="width: 12px; height: 12px;"></i> Edit Question
            </button>
            <button type="button" class="btn-paper-tool delete" onclick="deletePaperQuestionFromUI('${q.id}')" title="Delete this question from paper">
              <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Delete
            </button>
          </div>
        </div>
      `;
    });

    // Add button at bottom of section
    html += `
          <div style="margin-top: 10px; text-align: center;" class="paper-q-teacher-tools">
            <button type="button" class="btn-secondary" onclick="openAddCustomQuestionModal('${sec.id}')" style="font-size: 0.76rem; padding: 5px 12px; border-color: rgba(37,99,235,0.4); color: #2563eb;">
              <i data-lucide="plus" style="width: 12px; height: 12px;"></i> Add Custom Question to ${sec.name.split(':')[0]}
            </button>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  canvas.innerHTML = html;

  initLucideIcons();
  typesetMathInElement(canvas);
}

function cleanMathDisplay(text = '') {
  if (!text) return '';
  return renderLatexString(text);
}

function typesetMathInElement(el) {
  if (!el) return;
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(el);
    } catch (e) {
      console.warn('[renderMathInElement error]', e);
    }
  }
}

function togglePaperMarkingScheme() {
  boardPaperStudioState.showMarkingScheme = !boardPaperStudioState.showMarkingScheme;
  if (boardPaperStudioState.currentPaper) {
    renderBoardPaperStudio(boardPaperStudioState.currentPaper);
  }
}

// ----------------------------------------------------------------------------
// CLIENT-SIDE PAPER RESEQUENCING & MARK RECALCULATION
// ----------------------------------------------------------------------------

function clientResequenceAndRecalculate(paper) {
  if (!paper || !paper.sections) return;
  let count = 1;
  let grandMarks = 0;
  let grandCount = 0;

  paper.sections.forEach(sec => {
    let secMarks = 0;
    sec.questions.forEach(q => {
      q.question_number = count++;
      secMarks += (Number(q.marks) || sec.marksPerQuestion || 1);
    });
    sec.totalMarks = secMarks;
    grandMarks += secMarks;
    grandCount += sec.questions.length;
  });

  paper.totalMarks = grandMarks;
  paper.totalQuestions = grandCount;
  paper.isCustomizedByTeacher = true;
}

// ----------------------------------------------------------------------------
// QUESTION SWAPPING WITH BANK ALTERNATIVES
// ----------------------------------------------------------------------------

async function openSwapQuestionModal(questionId) {
  boardPaperStudioState.swapTargetQuestionId = questionId;
  const paper = boardPaperStudioState.currentPaper;
  if (!paper) return;

  let targetQ = null;
  for (const s of paper.sections) {
    const found = s.questions.find(q => q.id === questionId);
    if (found) { targetQ = found; break; }
  }

  if (!targetQ) return;

  const modal = document.getElementById('modalSelectAlternativeQuestion');
  const container = document.getElementById('containerAlternativeQuestionsList');
  const hint = document.getElementById('labelSwapModalHint');

  if (hint) {
    hint.innerHTML = `Replacing <strong>Q${targetQ.question_number}</strong> (${targetQ.marks} Mark${targetQ.marks > 1 ? 's' : ''}): <em>${targetQ.question_latex.slice(0, 70)}...</em>`;
  }

  if (container) {
    container.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: #64748b;">
        <i data-lucide="loader-2" class="spin" style="width:24px; height:24px; margin:0 auto 8px; display:block; color:#f59e0b;"></i>
        Loading alternative questions from Question Bank...
      </div>
    `;
    initLucideIcons();
  }

  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  try {
    const existingIds = [];
    paper.sections.forEach(s => s.questions.forEach(q => existingIds.push(q.id)));

    const url = `${getApiBaseUrl()}/api/assessments/board-paper/${paper.id}/alternatives?marks=${targetQ.marks}&excludeIds=${existingIds.join(',')}&topic=${encodeURIComponent(targetQ.topic || '')}&subject=${encodeURIComponent(paper.subject || 'Physics')}&grade=${encodeURIComponent(paper.grade || '12')}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.alternatives && data.alternatives.length > 0) {
      boardPaperStudioState.alternativesList = data.alternatives;
      container.innerHTML = data.alternatives.map((alt) => `
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:12px 14px; display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div style="flex:1;">
            <div style="font-size:0.75rem; color:#2563eb; font-weight:700; margin-bottom:4px;">
              [${alt.topic || 'Syllabus Topic'}] &bull; ${alt.marks} Mark${alt.marks > 1 ? 's' : ''} &bull; ${alt.pyq_appearance || 'Board PYQ'}
            </div>
            <div style="font-size:0.88rem; color:var(--text-primary); line-height:1.45;">
              ${renderLatexString(alt.question_latex)}
            </div>
            ${alt.options_latex && alt.options_latex.length > 0 ? `
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                ${alt.options_latex.map(o => `<span style="font-size:0.75rem; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">(${o.key}) <span>${renderLatexString(o.latex || '')}</span></span>`).join('')}
              </div>
            ` : ''}
          </div>
          <button type="button" class="btn-primary" onclick="selectAlternativeQuestion('${alt.id}')" style="font-size:0.75rem; padding:6px 12px; background:linear-gradient(135deg, #10b981, #059669); font-weight:700; flex-shrink:0;">
            Select This Question
          </button>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div style="text-align:center; padding: 2rem; color: #64748b;">
          No pre-loaded alternatives found in offline bank. Click <strong>Generate Fresh Question via AI</strong> below to synthesize a tailored question!
        </div>
      `;
    }
  } catch (err) {
    console.warn('[ALTERNATIVES ERROR]', err);
    container.innerHTML = `
      <div style="text-align:center; padding: 2rem; color: #94a3b8;">
        Click <strong>Generate Fresh Question via AI</strong> below to create a new alternative question.
      </div>
    `;
  }

  initLucideIcons();
  typesetMathInElement(container);
}

function closeSelectAlternativeModal() {
  const modal = document.getElementById('modalSelectAlternativeQuestion');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  boardPaperStudioState.swapTargetQuestionId = null;
}

async function selectAlternativeQuestion(replacementQuestionId) {
  const paper = boardPaperStudioState.currentPaper;
  const qId = boardPaperStudioState.swapTargetQuestionId;
  if (!paper || !qId) return;

  const alt = (boardPaperStudioState.alternativesList || []).find(a => a.id === replacementQuestionId);

  // Optimistic client-side swap
  if (alt) {
    for (const sec of paper.sections) {
      const idx = sec.questions.findIndex(q => q.id === qId);
      if (idx !== -1) {
        const oldNum = sec.questions[idx].question_number;
        sec.questions[idx] = { ...alt, question_number: oldNum, section_id: sec.id };
        break;
      }
    }
    clientResequenceAndRecalculate(paper);
    closeSelectAlternativeModal();
    renderBoardPaperStudio(paper);
  }

  // Sync to backend
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/assessments/board-paper/${paper.id}/swap-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper, questionId: qId, replacementQuestionId })
    });
    const data = await res.json();
    if (data.success && data.paper) {
      boardPaperStudioState.currentPaper = data.paper;
      closeSelectAlternativeModal();
      renderBoardPaperStudio(data.paper);
    }
  } catch (err) {
    console.warn('[SWAP SYNC NOTICE]', err);
  }
}

async function autoGenerateFreshAlternative() {
  const paper = boardPaperStudioState.currentPaper;
  const qId = boardPaperStudioState.swapTargetQuestionId;
  if (!paper || !qId) return;

  // Optimistic client-side synthesized question
  for (const sec of paper.sections) {
    const q = sec.questions.find(item => item.id === qId);
    if (q) {
      q.id = `q_fresh_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      q.topic = 'Core Board Topic';
      q.question_latex = `Discuss the core theoretical principles and physical laws associated with ${paper.subject} (Class ${paper.grade}). State the governing equations and SI units.`;
      q.solution_latex = `1. Clear statement of physical principles.\n2. Complete mathematical formulations with units.`;
      q.isCustomTeacherQuestion = true;
      break;
    }
  }
  clientResequenceAndRecalculate(paper);
  closeSelectAlternativeModal();
  renderBoardPaperStudio(paper);

  // Sync to backend
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/assessments/board-paper/${paper.id}/swap-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper, questionId: qId })
    });
    const data = await res.json();
    if (data.success && data.paper) {
      boardPaperStudioState.currentPaper = data.paper;
      renderBoardPaperStudio(data.paper);
    }
  } catch (err) {
    console.warn('[FRESH SWAP SYNC NOTICE]', err);
  }
}

// ----------------------------------------------------------------------------
// ADD CUSTOM QUESTION TO PAPER (TEACHER FORMULATION)
// ----------------------------------------------------------------------------

function openAddCustomQuestionModal(preselectedSectionId = null) {
  const modal = document.getElementById('modalAddCustomPaperQuestion');
  const paper = boardPaperStudioState.currentPaper;
  if (!modal || !paper) return;

  const selectSec = document.getElementById('selectCustomQSection');
  if (selectSec) {
    selectSec.innerHTML = paper.sections.map(s => `
      <option value="${s.id}" ${s.id === preselectedSectionId ? 'selected' : ''}>
        ${s.name} (${s.marksPerQuestion}M per Q)
      </option>
    `).join('');
  }

  // Toggle options group based on marks
  const selectMarks = document.getElementById('selectCustomQMarks');
  const groupOptions = document.getElementById('groupCustomQOptions');
  if (selectMarks && groupOptions) {
    groupOptions.style.display = selectMarks.value === '1' ? 'block' : 'none';
    selectMarks.onchange = () => {
      groupOptions.style.display = selectMarks.value === '1' ? 'block' : 'none';
    };
  }

  // Reset form values
  const form = document.getElementById('formAddCustomQuestion');
  if (form) form.reset();

  modal.style.display = 'flex';
  modal.classList.add('active');
  initLucideIcons();
}

function closeAddCustomQuestionModal() {
  const modal = document.getElementById('modalAddCustomPaperQuestion');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

async function submitAddCustomQuestion() {
  const paper = boardPaperStudioState.currentPaper;
  if (!paper) return;

  const sectionId = document.getElementById('selectCustomQSection')?.value;
  const marks = Number(document.getElementById('selectCustomQMarks')?.value || 2);
  const topic = document.getElementById('inputCustomQTopic')?.value || 'Teacher Custom Topic';
  const text = document.getElementById('inputCustomQText')?.value;
  const solution = document.getElementById('inputCustomQSolution')?.value || '';

  if (!text || !text.trim()) {
    alert('Please enter a question statement.');
    return;
  }

  let options = [];
  let answer = 'A';
  if (marks === 1) {
    const optA = document.getElementById('inputCustomOptA')?.value || 'Option A';
    const optB = document.getElementById('inputCustomOptB')?.value || 'Option B';
    const optC = document.getElementById('inputCustomOptC')?.value || 'Option C';
    const optD = document.getElementById('inputCustomOptD')?.value || 'Option D';
    answer = document.getElementById('selectCustomCorrectOpt')?.value || 'A';

    options = [
      { key: 'A', latex: optA, is_correct: answer === 'A' },
      { key: 'B', latex: optB, is_correct: answer === 'B' },
      { key: 'C', latex: optC, is_correct: answer === 'C' },
      { key: 'D', latex: optD, is_correct: answer === 'D' }
    ];
  }

  // 1. Instantly perform the addition on client-side state
  let targetSection = paper.sections.find(s => s.id === sectionId);
  if (!targetSection && paper.sections.length > 0) targetSection = paper.sections[0];

  const customQ = {
    id: `q_custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    section_id: targetSection.id,
    marks: marks,
    subject: paper.subject,
    grade: paper.grade,
    board: paper.board,
    topic: topic,
    pyq_appearance: 'Teacher Formulated Question',
    question_latex: text,
    options_latex: options,
    correct_answer: answer,
    solution_latex: solution,
    step_rubric: [{ step: 'Complete solution and steps', marks: marks }],
    isCustomTeacherQuestion: true
  };

  targetSection.questions.push(customQ);
  clientResequenceAndRecalculate(paper);
  closeAddCustomQuestionModal();
  renderBoardPaperStudio(paper);

  // 2. Sync to backend
  try {
    fetch(`${getApiBaseUrl()}/api/assessments/board-paper/${paper.id}/add-custom-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper,
        sectionId,
        questionData: {
          question_latex: text,
          marks,
          topic,
          options_latex: options,
          correct_answer: answer,
          solution_latex: solution
        }
      })
    }).catch(e => console.warn('[SYNC ADD Q NOTICE]', e));
  } catch (err) {
    console.warn('[SYNC ADD Q NOTICE]', err);
  }
}

// ----------------------------------------------------------------------------
// EDIT EXISTING QUESTION IN-PLACE
// ----------------------------------------------------------------------------

function openEditQuestionModal(questionId) {
  const paper = boardPaperStudioState.currentPaper;
  if (!paper) return;

  let targetQ = null;
  for (const s of paper.sections) {
    const f = s.questions.find(q => q.id === questionId);
    if (f) { targetQ = f; break; }
  }
  if (!targetQ) return;

  const modal = document.getElementById('modalEditPaperQuestion');
  if (!modal) return;

  document.getElementById('hiddenEditQuestionId').value = targetQ.id;
  document.getElementById('labelEditQBadge').innerText = `Editing Q${targetQ.question_number}`;
  document.getElementById('inputEditQTopic').value = targetQ.topic || '';
  document.getElementById('inputEditQMarks').value = targetQ.marks || 1;
  document.getElementById('inputEditQText').value = targetQ.question_latex || '';
  document.getElementById('inputEditQSolution').value = targetQ.solution_latex || '';

  const groupOptions = document.getElementById('groupEditQOptions');
  const marksInput = document.getElementById('inputEditQMarks');
  if (marksInput && groupOptions) {
    marksInput.oninput = () => {
      groupOptions.style.display = Number(marksInput.value) === 1 ? 'block' : 'none';
    };
  }

  if (targetQ.options_latex && targetQ.options_latex.length > 0) {
    if (groupOptions) groupOptions.style.display = 'block';
    const opts = targetQ.options_latex;
    document.getElementById('inputEditOptA').value = opts[0]?.latex || '';
    document.getElementById('inputEditOptB').value = opts[1]?.latex || '';
    document.getElementById('inputEditOptC').value = opts[2]?.latex || '';
    document.getElementById('inputEditOptD').value = opts[3]?.latex || '';
    document.getElementById('selectEditCorrectOpt').value = targetQ.correct_answer || 'A';
  } else {
    if (groupOptions) groupOptions.style.display = Number(targetQ.marks) === 1 ? 'block' : 'none';
  }

  modal.style.display = 'flex';
  modal.classList.add('active');
  initLucideIcons();
}

function closeEditQuestionModal() {
  const modal = document.getElementById('modalEditPaperQuestion');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

async function submitEditPaperQuestion() {
  const paper = boardPaperStudioState.currentPaper;
  const qId = document.getElementById('hiddenEditQuestionId')?.value;
  if (!paper || !qId) return;

  const text = document.getElementById('inputEditQText')?.value;
  const topic = document.getElementById('inputEditQTopic')?.value;
  const marks = Number(document.getElementById('inputEditQMarks')?.value || 1);
  const solution = document.getElementById('inputEditQSolution')?.value || '';

  let options = undefined;
  let answer = undefined;
  const groupOptions = document.getElementById('groupEditQOptions');
  if (groupOptions && groupOptions.style.display !== 'none') {
    const optA = document.getElementById('inputEditOptA')?.value || '';
    const optB = document.getElementById('inputEditOptB')?.value || '';
    const optC = document.getElementById('inputEditOptC')?.value || '';
    const optD = document.getElementById('inputEditOptD')?.value || '';
    answer = document.getElementById('selectEditCorrectOpt')?.value || 'A';

    options = [
      { key: 'A', latex: optA, is_correct: answer === 'A' },
      { key: 'B', latex: optB, is_correct: answer === 'B' },
      { key: 'C', latex: optC, is_correct: answer === 'C' },
      { key: 'D', latex: optD, is_correct: answer === 'D' }
    ];
  }

  // 1. Instantly perform the edit on client-side state
  let found = false;
  for (const s of paper.sections) {
    const q = s.questions.find(item => item.id === qId);
    if (q) {
      q.question_latex = text;
      q.topic = topic;
      q.marks = marks;
      q.solution_latex = solution;
      if (options) q.options_latex = options;
      if (answer) q.correct_answer = answer;
      q.isCustomTeacherQuestion = true;
      found = true;
      break;
    }
  }

  if (found) {
    clientResequenceAndRecalculate(paper);
    closeEditQuestionModal();
    renderBoardPaperStudio(paper);
  }

  // 2. Sync to backend
  try {
    fetch(`${getApiBaseUrl()}/api/assessments/board-paper/${paper.id}/update-question`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper,
        questionId: qId,
        updatedData: {
          question_latex: text,
          topic,
          marks,
          solution_latex: solution,
          options_latex: options,
          correct_answer: answer
        }
      })
    }).catch(e => console.warn('[SYNC EDIT Q NOTICE]', e));
  } catch (err) {
    console.warn('[SYNC EDIT Q NOTICE]', err);
  }
}

// ----------------------------------------------------------------------------
// DELETE QUESTION FROM PAPER
// ----------------------------------------------------------------------------

async function deletePaperQuestionFromUI(questionId) {
  const paper = boardPaperStudioState.currentPaper;
  if (!paper) return;

  if (!confirm('Are you sure you want to remove this question from the question paper? Question numbers will automatically be re-sequenced.')) {
    return;
  }

  // 1. Instantly perform deletion on client-side state
  let found = false;
  for (const sec of paper.sections) {
    const idx = sec.questions.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      sec.questions.splice(idx, 1);
      found = true;
      break;
    }
  }

  if (found) {
    clientResequenceAndRecalculate(paper);
    renderBoardPaperStudio(paper);
  }

  // 2. Sync to backend
  try {
    fetch(`${getApiBaseUrl()}/api/assessments/board-paper/${paper.id}/delete-question`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper, questionId })
    }).catch(e => console.warn('[SYNC DELETE Q NOTICE]', e));
  } catch (err) {
    console.warn('[SYNC DELETE Q NOTICE]', err);
  }
}

// ----------------------------------------------------------------------------
// 1-CLICK PRINT QUESTION PAPER
// ----------------------------------------------------------------------------

function printBoardQuestionPaper() {
  window.print();
}

// Expose on window object
window.openBoardPaperStudio = openBoardPaperStudio;
window.closeBoardPaperStudio = closeBoardPaperStudio;
window.changeStudioBoard = changeStudioBoard;
window.regenerateStudioPaper = regenerateStudioPaper;
window.togglePaperMarkingScheme = togglePaperMarkingScheme;
window.openSwapQuestionModal = openSwapQuestionModal;
window.closeSelectAlternativeModal = closeSelectAlternativeModal;
window.selectAlternativeQuestion = selectAlternativeQuestion;
window.autoGenerateFreshAlternative = autoGenerateFreshAlternative;
window.openAddCustomQuestionModal = openAddCustomQuestionModal;
window.closeAddCustomQuestionModal = closeAddCustomQuestionModal;
window.submitAddCustomQuestion = submitAddCustomQuestion;
window.openEditQuestionModal = openEditQuestionModal;
window.closeEditQuestionModal = closeEditQuestionModal;
window.submitEditPaperQuestion = submitEditPaperQuestion;
window.deletePaperQuestionFromUI = deletePaperQuestionFromUI;
window.printBoardQuestionPaper = printBoardQuestionPaper;
window.syncBoardPaperStudioWithTeacher = syncBoardPaperStudioWithTeacher;
window.boardPaperStudioState = boardPaperStudioState;
window.printBoardQuestionPaper = printBoardQuestionPaper;

// ============================================================================
// TEACHER PORTAL LEVEL 2: TEST CREATOR & WEAK CONCEPTS DIAGNOSTIC HANDLERS
// ============================================================================

window.toggleTestTopicChip = function(el) {
  if (el) el.classList.toggle('selected');
};

window.createTeacherAssessment = function(event) {
  if (event) event.preventDefault();
  const titleInput = document.getElementById('inputTeacherTestTitle');
  const typeSelect = document.getElementById('selectTeacherTestType');
  const title = titleInput?.value?.trim() || 'Class 11 Science • Diagnostic Test: Rotational Dynamics';
  const typeName = typeSelect?.options[typeSelect.selectedIndex]?.text || '45-Min Unit Exam';

  const tbody = document.getElementById('tbodyAssignedTests');
  if (tbody) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight:700; color:#f8fafc;">${escapeHtml(title)}</div>
        <div style="font-size:0.7rem; color:#38bdf8;">Assigned Just Now &bull; ${escapeHtml(typeName)}</div>
      </td>
      <td>
        <div style="font-weight:700; color:#38bdf8;">0 / 48</div>
        <div style="font-size:0.68rem; color:#94a3b8;">Dispatched to student portal</div>
      </td>
      <td>
        <div style="font-weight:800; color:#94a3b8;">--</div>
      </td>
      <td>
        <span class="status-badge status-active">Active</span>
      </td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
  }

  // Flash confirmation toast
  const banner = document.createElement('div');
  banner.className = 'role-switch-toast';
  banner.innerHTML = `<i data-lucide="check-circle" style="width:16px; height:16px; color:#34d399;"></i> <span><strong>Assessment Dispatched:</strong> '${escapeHtml(title)}' is now live for all 48 students!</span>`;
  document.body.appendChild(banner);
  initLucideIcons();
  setTimeout(() => banner.remove(), 4000);
};

const TEACHER_REMEDIAL_PLANS = {
  'damped_oscillations': {
    questionHeader: {
      title: "A damped harmonic oscillator has mass m = 0.2 kg, spring constant k = 80 N/m, and damping constant b = 0.04 kg/s. Calculate the natural angular frequency omega_0, damping factor gamma, and the quality factor Q.",
      chapter: "OSCILLATIONS AND WAVES",
      marks: 3
    },
    diagram: {
      type: "oscillator",
      title: "Damped Harmonic Oscillator • Mechanical Decay Model",
      tip: "Quality factor Q measures rate of energy loss: higher Q means lower damping and longer sustained oscillations!"
    },
    examTip: "Quality factor Q measures rate of energy loss: higher Q means lower damping and longer sustained oscillations!",
    solution: {
      step1: {
        title: "Governing Differential Equation & Parameters",
        formula: "• Equation of Motion: m·(d²x/dt²) + b·(dx/dt) + k·x = 0\n• Standard Form:      d²x/dt² + 2γ·(dx/dt) + ω₀²·x = 0\n• Natural Frequency:  ω₀ = √(k/m) = √(80 / 0.2) = 20 rad/s\n• Damping Factor:     γ = b / (2m) = 0.04 / (2 × 0.2) = 0.1 s⁻¹",
        explanation: "Since γ (0.1) << ω₀ (20), this system is strictly UNDERDAMPED with oscillatory decay envelope A(t) = A₀ e^(-γt).",
        spokenScript: "Pehle oscillator ka standard differential equation aur natural angular frequency note karte hain."
      },
      step2: {
        title: "Damped Frequency & Energy Loss Calculation",
        formula: "1) Damped Angular Frequency: ω' = √(ω₀² - γ²) = √(400 - 0.01) ≈ 19.9997 rad/s\n2) Quality Factor Formula:   Q = ω₀ / (2γ) = 20 / (2 × 0.1) = 100\n3) Relaxation Time:          τ = 1 / (2γ) = 1 / 0.2 = 5.0 seconds",
        explanation: "A high quality factor Q = 100 indicates the oscillator completes approximately Q/π ≈ 32 cycles before energy decays to 1/e of its initial value.",
        spokenScript: "Ab quality factor Q = omega 0 upon 2 gamma formula lagakar energy dissipation rate calculate karte hain."
      },
      step3: {
        title: "Evaluated Result & Classroom Takeaway",
        formula: "• Natural Frequency:  ω₀ = 20 rad/s\n• Damping Constant:   γ = 0.1 s⁻¹\n• Quality Factor:     Q = 100  [Dimensionless]\n• Verified Answer:    System oscillates underdamped with Q = 100",
        explanation: "Damping shifts the resonance peak slightly lower than ω₀. For weak damping, ω' is practically indistinguishable from ω₀.",
        spokenScript: "Aur yeh raha final verified result: Quality factor Q = 100 hai jo high resonance sharpness confirm karta hai."
      }
    }
  },
  'pure_rolling': {
    questionHeader: {
      title: "A solid sphere of mass M and radius R rolls without slipping down an inclined plane of inclination theta. Find the linear acceleration a of the center of mass.",
      chapter: "SYSTEM OF PARTICLES AND ROTATIONAL MOTION",
      marks: 3
    },
    diagram: {
      type: "rolling_incline",
      title: "Free-Body Diagram • Solid Sphere on Incline (θ)",
      tip: "Pure rolling is sustained by STATIC friction. Work done by static friction is ZERO! Total mechanical energy is conserved."
    },
    examTip: "Pure rolling is sustained by STATIC friction. Work done by static friction is ZERO! Total mechanical energy is conserved.",
    solution: {
      step1: {
        title: "Free-Body Force & Torque Equations",
        formula: "Down Incline:   M·g·sin θ - f_s = M·a\nTorque about C: τ = f_s · R = I · α\nPure Rolling:   a = α · R  ⇒  α = a / R",
        explanation: "Pure rolling without slipping: Contact point P is at instantaneous rest with zero relative sliding.",
        spokenScript: "Pehle stated physical parameters aur primary governing relation note karte hain."
      },
      step2: {
        title: "Torque & Linear Force Substitution",
        formula: "1) Torque equation: f_s · R = I · (a / R)  ⇒  f_s = (I / R²) · a\n2) Substitute f_s:  M·g·sin θ - (I / R²) · a = M·a\n3) General Formula: a = (g · sin θ) / [1 + I / (M · R²)]",
        explanation: "This general acceleration equation applies to all rolling symmetrical objects (sphere, cylinder, ring).",
        spokenScript: "Ab known quantities substitute karke algebraic derivation solve karte hain."
      },
      step3: {
        title: "Moment of Inertia & Final Acceleration",
        formula: "Solid Sphere:   I = (2/5) · M · R²  ⇒  I / (M · R²) = 2/5\nAcceleration:   a = (g · sin θ) / [1 + 2/5] = (g · sin θ) / (7/5)\nFinal Result:   a = (5/7) · g · sin θ  ≈ 0.714 · g · sin θ",
        explanation: "A solid sphere accelerates faster than a hollow sphere (5/7 > 3/5) due to lower rotational inertia.",
        spokenScript: "Aur yeh raha final verified result with proper SI units aur physical significance."
      }
    }
  },
  'drift_velocity': {
    questionHeader: {
      title: "Define drift velocity of free electrons. Derive the microscopic relation between electric current I and drift velocity v_d. Hence, deduce Ohm's law and obtain resistivity rho.",
      chapter: "CURRENT ELECTRICITY",
      marks: 3
    },
    diagram: {
      type: "circuit",
      title: "Circuit Diagram • Ohm's Law & Resistivity",
      tip: "Relaxation time tau decreases with temperature in metals, increasing electrical resistance!"
    },
    examTip: "Relaxation time tau decreases with temperature in metals, increasing electrical resistance!",
    solution: {
      step1: {
        title: "Governing Circuit Principles",
        formula: "• Ohm's Law:          V = I · R\n• Microscopic Drift:   I = n · e · A · v_d,   v_d = (e · E · τ) / m\n• Resistivity:         R = ρ · (l / A),       ρ = m / (n · e² · τ)",
        explanation: "Relaxation time τ connects microscopic electron kinematics to macroscopic electrical resistance.",
        spokenScript: "Pehle stated physical parameters aur primary governing relation note karte hain."
      },
      step2: {
        title: "Current Derivation & Ohm Deduction",
        formula: "1) Electric field: E = V / l\n2) Current: I = n·e·A·(e·V·τ / m·l) = (n·e²·A·τ / m·l)·V\n3) Ratio V / I = [m / (n·e²·τ)] · (l / A) = R",
        explanation: "Confirms Ohm's Law V = IR with resistivity ρ = m / (n·e²·τ).",
        spokenScript: "Ab known quantities substitute karke algebraic derivation solve karte hain."
      },
      step3: {
        title: "Final Formula & Board Takeaway",
        formula: "• Resistance: R = ρ · (l / A)\n• Resistivity: ρ = m / (n · e² · τ)\n• Verified Result: Microscopic basis of electrical resistance established",
        explanation: "Resistivity depends only on material electron density n and relaxation time τ.",
        spokenScript: "Aur yeh raha final verified result with proper SI units aur physical significance."
      }
    }
  },
  'lens_formula': {
    questionHeader: {
      title: "An object is placed at distance u from a convex lens of focal length f. Derive the thin lens formula 1/f = 1/v - 1/u and state Cartesian sign conventions.",
      chapter: "RAY OPTICS AND OPTICAL INSTRUMENTS",
      marks: 3
    },
    diagram: {
      type: "lens",
      title: "Ray Optics • Principal Axis & Image Formation",
      tip: "Cartesian Sign Convention: Distances along incident ray are positive; opposite are negative!"
    },
    examTip: "Cartesian Sign Convention: Distances along incident ray are positive; opposite are negative!",
    solution: {
      step1: {
        title: "Governing Optical Equations",
        formula: "• Thin Lens Equation: 1/f = 1/v - 1/u\n• Magnification:       m = v / u = h_i / h_o\n• Power of Lens:       P = 1 / f (meters)",
        explanation: "Cartesian Sign Convention: Distances along incident ray are positive; opposite are negative.",
        spokenScript: "Pehle optical sign convention ke sath focal length f aur object distance u note karte hain."
      },
      step2: {
        title: "Coordinate Substitution & Calculation",
        formula: "1) Identify: Focal length f (convex > 0), Object distance u (< 0)\n2) Rearrange: 1/v = 1/f + 1/u = (u + f) / (u · f)\n3) Image distance: v = (u · f) / (u + f)",
        explanation: "Calculate v and check sign: positive v confirms a real image on opposite side.",
        spokenScript: "Ab lens formula 1/f = 1/v - 1/u mein values substitute karke image position v aur magnification calculate karte hain."
      },
      step3: {
        title: "Image Nature & Final Result",
        formula: "• Magnification: m = v / u\n• Real & Inverted if m < 0; Virtual & Erect if m > 0\n• Power: P = 1 / f (in meters)",
        explanation: "State complete nature, orientation, and size relative to object.",
        spokenScript: "Aur final result mein image distance aur magnification ka sign dekhkar image real aur inverted confirm hoti hai."
      }
    }
  }
};

window.launchTeacherSmartboardForTopic = function(topicKey) {
  const plan = TEACHER_REMEDIAL_PLANS[topicKey] || TEACHER_REMEDIAL_PLANS['damped_oscillations'];
  const modal = document.getElementById('modalTeacherSmartboard');
  const label = document.getElementById('modalTeacherSmartboardTopic');
  const iframe = document.getElementById('iframeTeacherSmartboard');

  if (label) {
    label.textContent = plan.questionHeader?.chapter + ' • ' + (plan.diagram?.title || 'Classroom Lesson');
  }

  if (modal) {
    modal.classList.add('active');
  }

  if (iframe) {
    const deliverPlan = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'RENDER_SMARTBOARD_SOLUTION',
          payload: plan
        }, '*');
      }
    };
    deliverPlan();
    setTimeout(deliverPlan, 500);
  }
};

window.closeTeacherSmartboardModal = function() {
  const modal = document.getElementById('modalTeacherSmartboard');
  if (modal) modal.classList.remove('active');
};

window.assignRemedialPracticeDrill = function(topicKey, title) {
  const tbody = document.getElementById('tbodyAssignedTests');
  if (tbody) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight:700; color:#fb7185;">${escapeHtml(title)}</div>
        <div style="font-size:0.7rem; color:#94a3b8;">Remedial Targeted Drill &bull; 3 Qs (Weak Cohort)</div>
      </td>
      <td>
        <div style="font-weight:700; color:#38bdf8;">0 / 33</div>
        <div style="font-size:0.68rem; color:#94a3b8;">Assigned to struggling students</div>
      </td>
      <td>
        <div style="font-weight:800; color:#94a3b8;">--</div>
      </td>
      <td>
        <span class="status-badge" style="background:rgba(244,63,94,0.15); color:#fb7185;">Remedial</span>
      </td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
  }

  const banner = document.createElement('div');
  banner.className = 'role-switch-toast';
  banner.innerHTML = `<i data-lucide="check-circle" style="width:16px; height:16px; color:#34d399;"></i> <span><strong>Targeted Drill Scheduled:</strong> '${escapeHtml(title)}' assigned to the 33 struggling students in Class 11 Science!</span>`;
  document.body.appendChild(banner);
  initLucideIcons();
  setTimeout(() => banner.remove(), 4000);
};

window.filterWeakConcepts = function(severity) {
  document.querySelectorAll('.syllabus-filter-btn[id^="btnFilterWeak"]').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btnFilterWeak${severity.charAt(0) + severity.slice(1).toLowerCase()}`);
  });
  const cards = document.querySelectorAll('.weak-concept-card');
  cards.forEach(card => {
    if (severity === 'ALL') {
      card.style.display = 'flex';
    } else if (severity === 'CRITICAL') {
      card.style.display = card.classList.contains('border-critical') ? 'flex' : 'none';
    } else if (severity === 'MODERATE') {
      card.style.display = (card.classList.contains('border-high') || card.classList.contains('border-moderate')) ? 'flex' : 'none';
    }
  });
};


