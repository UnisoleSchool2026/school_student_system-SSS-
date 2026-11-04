import React, { Component, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Tldraw, toRichText } from 'tldraw';

const TLDRAW_LICENSE_KEY = 'tldraw-2027-02-08/WyJVUTc3RFF3ViIsWyIqIl0sMTYsIjIwMjctMDItMDgiXQ.W95pPYmfqD1hlaYOY7dQoVq/E5phnss0Q1a46kpkTrDjMH4qMeJZxCqJ8NLpIvyGlqoIWQNZUaPL9I1h/sKzKA';

let editorInstance = null;
let shapeYOffset = 60;
const queuedEvents = [];

function logTelemetry(event, data = {}) {
  try {
    const entry = {
      event,
      data,
      timestamp: new Date().toISOString()
    };
    if (window.appendDiagnosticLog) {
      window.appendDiagnosticLog(event, data);
    }
    console.log(`[WHITEBOARD TELEMETRY] ${event}:`, data);
    fetch('/api/voice-tutor/whiteboard-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }).catch(() => {});
  } catch (e) {}
}

async function purgeCorruptStorage() {
  logTelemetry('PURGE_STORAGE_START');
  try {
    if (typeof window !== 'undefined' && window.indexedDB) {
      if (window.indexedDB.databases) {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (db.name && (db.name.includes('TLDRAW') || db.name.includes('tldraw'))) {
            logTelemetry('PURGE_DB', { dbName: db.name });
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      } else {
        window.indexedDB.deleteDatabase('TLDRAW_DOCUMENT_v2');
        window.indexedDB.deleteDatabase('TLDRAW_DOCUMENT_v2undefined');
      }
    }
    if (typeof localStorage !== 'undefined') {
      for (const k of Object.keys(localStorage)) {
        if (k.toLowerCase().includes('tldraw')) {
          localStorage.removeItem(k);
        }
      }
    }
    logTelemetry('PURGE_STORAGE_SUCCESS');
  } catch (err) {
    logTelemetry('PURGE_STORAGE_ERROR', { message: err?.message, stack: err?.stack });
  }
}

function hideLoader() {
  const loader = document.getElementById('whiteboard-loading');
  if (loader && loader.style.display !== 'none') {
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 200);
  }
}

function safeCreateShape(shapeData) {
  if (!editorInstance) {
    logTelemetry('SAFE_CREATE_SHAPE_SKIPPED_NO_EDITOR', { type: shapeData?.type });
    return null;
  }
  try {
    const created = editorInstance.createShape(shapeData);
    logTelemetry('SAFE_CREATE_SHAPE_SUCCESS', { type: shapeData?.type, geo: shapeData.props?.geo });
    return created;
  } catch (err) {
    console.error('[TLDRAW CREATE SHAPE ERROR]:', err, shapeData);
    logTelemetry('SAFE_CREATE_SHAPE_ERROR', {
      error: err?.message,
      stack: err?.stack,
      shapeType: shapeData?.type,
      props: shapeData?.props
    });
    return null;
  }
}

// Custom Error Fallback component replacing tldraw's default crash modal
const CustomErrorFallback = ({ error }) => {
  useEffect(() => {
    logTelemetry('TLDRAW_ERROR_FALLBACK_TRIGGERED', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null
    });
    purgeCorruptStorage();
    hideLoader();
    if (window.initFallbackCanvas) {
      window.initFallbackCanvas();
    }
    // Flush queued events into fallback canvas
    while (queuedEvents.length > 0) {
      const evt = queuedEvents.shift();
      processWhiteboardEvent(evt);
    }
  }, [error]);

  return null;
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    logTelemetry('REACT_ERROR_BOUNDARY_CAUGHT', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      componentStack: errorInfo?.componentStack
    });
    purgeCorruptStorage();
    hideLoader();
    if (window.initFallbackCanvas) {
      window.initFallbackCanvas();
    }
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

// Format any raw LaTeX or formula into crystal-clear Unicode mathematical notation
function formatMathForWhiteboard(input) {
  if (!input) return '';
  let str = String(input);

  // 1. Remove enclosing LaTeX delimiters ($...$, $$...$$, \(...\), \[...\])
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, '$1')
           .replace(/\$([^$]+)\$/g, '$1')
           .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
           .replace(/\\\[([\s\S]*?)\\\]/g, '$1');

  // 2. Multi-pass recursive fraction conversion: \frac{num}{den} -> (num)/(den) or num/den
  let prev;
  let passes = 0;
  do {
    prev = str;
    str = str.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (match, num, den) => {
      const cleanNum = num.trim();
      const cleanDen = den.trim();
      if (/^\d+$/.test(cleanNum) && /^\d+$/.test(cleanDen)) {
        return `${cleanNum}/${cleanDen}`;
      }
      return `(${cleanNum}) / (${cleanDen})`;
    });
    passes++;
  } while (str !== prev && passes < 5);

  // 3. Square roots
  str = str.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // 4. Common Greek Letters & Physics Symbols
  const symbolMap = {
    '\\theta': 'θ',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\Delta': 'Δ',
    '\\omega': 'ω',
    '\\Omega': 'Ω',
    '\\tau': 'τ',
    '\\rho': 'ρ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\sigma': 'σ',
    '\\Sigma': 'Σ',
    '\\phi': 'φ',
    '\\pi': 'π',
    '\\epsilon': 'ε',
    '\\implies': '⇒',
    '\\rightarrow': '→',
    '\\to': '→',
    '\\leftarrow': '←',
    '\\leftrightarrow': '↔',
    '\\iff': '⇔',
    '\\cdot': '·',
    '\\times': '×',
    '\\div': '÷',
    '\\pm': '±',
    '\\mp': '∓',
    '\\approx': '≈',
    '\\neq': '≠',
    '\\le': '≤',
    '\\leq': '≤',
    '\\ge': '≥',
    '\\geq': '≥',
    '\\infty': '∞',
    '\\partial': '∂',
    '\\circ': '°'
  };

  for (const [tex, unicode] of Object.entries(symbolMap)) {
    const regex = new RegExp(tex.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
    str = str.replace(regex, unicode);
  }

  // 5. Trig & common math operators
  str = str.replace(/\\sin(?![a-zA-Z])/g, 'sin ')
           .replace(/\\cos(?![a-zA-Z])/g, 'cos ')
           .replace(/\\tan(?![a-zA-Z])/g, 'tan ')
           .replace(/\\cot(?![a-zA-Z])/g, 'cot ')
           .replace(/\\sec(?![a-zA-Z])/g, 'sec ')
           .replace(/\\csc(?![a-zA-Z])/g, 'csc ')
           .replace(/\\ln(?![a-zA-Z])/g, 'ln ')
           .replace(/\\log(?![a-zA-Z])/g, 'log ');

  // 6. Formatting tags & spaces
  str = str.replace(/\\text\{([^{}]+)\}/g, '$1')
           .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
           .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
           .replace(/\\mathit\{([^{}]+)\}/g, '$1')
           .replace(/\\quad/g, '   |   ')
           .replace(/\\qquad/g, '      |      ')
           .replace(/\\,/g, ' ')
           .replace(/\\;/g, ' ')
           .replace(/\\!/g, '')
           .replace(/\\\\/g, '\n');

  // 7. Superscripts & Subscripts
  str = str.replace(/\^2(?![0-9])/g, '²')
           .replace(/\^3(?![0-9])/g, '³')
           .replace(/\^4(?![0-9])/g, '⁴')
           .replace(/\^0(?![0-9])/g, '⁰')
           .replace(/\^1(?![0-9])/g, '¹')
           .replace(/_1(?![0-9])/g, '₁')
           .replace(/_2(?![0-9])/g, '₂')
           .replace(/_3(?![0-9])/g, '₃')
           .replace(/_0(?![0-9])/g, '₀')
           .replace(/_s(?![a-zA-Z0-9])/g, '_s');

  // 8. Clean leftover braces, loose backslashes, and redundant spaces
  str = str.replace(/[{}]/g, '')
           .replace(/\\([a-zA-Z]+)/g, '$1')
           .replace(/[ \t]{2,}/g, ' ')
           .trim();

  return str;
}

// Smartboard 2-Column Teaching Layout Geometry (Full Board Utilization & Zero Overlap)
const BOARD_LAYOUT = {
  // Left Column: Question Header & High-Definition Visual Physics / Math Diagram
  COL_LEFT_X: 50,
  COL_LEFT_W: 680,
  HEADER_Y: 50,
  HEADER_H: 150,
  DIAGRAM_Y: 220,
  DIAGRAM_H: 570,
  TIP_Y: 800,
  TIP_H: 0,

  // Right Column: Step-by-Step Mathematical Derivation & Concept Focus
  COL_RIGHT_X: 760,
  COL_RIGHT_W: 800,
  STEP1_Y: 50,
  STEP1_H: 220,
  STEP2_Y: 290,
  STEP2_H: 240,
  STEP3_Y: 550,
  STEP3_H: 240,
  FINAL_Y: 655,
  FINAL_H: 130,
  DOUBT_Y: 805,
  DOUBT_H: 130
};

let currentPlanCache = null;
let currentStepNumber = 0;
const rightColumnStepShapeIds = {
  roadmap: null,
  step1: null,
  step2: null,
  step3: null,
  final: null
};

let currentSpotlightShapeIds = [];

function clearSpotlight() {
  if (!editorInstance) return;
  if (currentSpotlightShapeIds.length > 0) {
    try {
      editorInstance.deleteShapes(currentSpotlightShapeIds);
    } catch (e) {}
    currentSpotlightShapeIds = [];
  }
}

function applySpotlight(conceptIndex) {
  clearSpotlight();
  if (!editorInstance) return;
  if (typeof conceptIndex !== 'number' || conceptIndex < 0 || conceptIndex > 3) return;

  const teacherTag = currentPlanCache?.teacherName || 'Faculty Mentor';
  const configs = [
    {
      x: 44, y: 239, w: 692, h: 507,
      color: 'light-blue',
      label: `👨‍🏫 ${teacherTag}: Visual Concept Model & Setup`,
      labelX: 50, labelY: 205
    },
    {
      x: 754, y: 44, w: 812, h: 237,
      color: 'yellow',
      label: `👨‍🏫 ${teacherTag}: Governing Principles & Primary Law`,
      labelX: 760, labelY: 12
    },
    {
      x: 754, y: 289, w: 812, h: 297,
      color: 'light-blue',
      label: `👨‍🏫 ${teacherTag}: Derivation & Step-by-Step Working`,
      labelX: 760, labelY: 257
    },
    {
      x: 754, y: 594, w: 812, h: 272,
      color: 'green',
      label: `👨‍🏫 ${teacherTag}: Evaluated Result & Exam Takeaway`,
      labelX: 760, labelY: 562
    }
  ];

  const cfg = configs[conceptIndex];
  if (!cfg) return;

  const box = safeCreateShape({
    type: 'geo',
    x: cfg.x,
    y: cfg.y,
    props: {
      geo: 'rectangle',
      w: cfg.w,
      h: cfg.h,
      color: cfg.color,
      fill: 'none',
      dash: 'dashed',
      size: 'm'
    }
  });
  if (box && box.id) currentSpotlightShapeIds.push(box.id);

  const tag = safeCreateShape({
    type: 'text',
    x: cfg.labelX,
    y: cfg.labelY,
    props: {
      richText: toRichText(cfg.label),
      size: 's',
      color: cfg.color
    }
  });
  if (tag && tag.id) currentSpotlightShapeIds.push(tag.id);
}

const WhiteboardController = {
  isReady() {
    return !!editorInstance;
  },

  clear() {
    logTelemetry('WHITEBOARD_ACTION_CLEAR');
    rightColumnStepShapeIds.roadmap = null;
    rightColumnStepShapeIds.step1 = null;
    rightColumnStepShapeIds.step2 = null;
    rightColumnStepShapeIds.step3 = null;
    rightColumnStepShapeIds.final = null;
    if (!editorInstance) {
      if (window.clearFallbackCanvas) window.clearFallbackCanvas();
      return;
    }
    try {
      const allShapeIds = Array.from(editorInstance.getCurrentPageShapeIds());
      if (allShapeIds.length > 0) {
        editorInstance.deleteShapes(allShapeIds);
      }
    } catch (e) {
      logTelemetry('CLEAR_SHAPES_ERROR', { message: e?.message });
    }
  },

  clearRightBoard() {
    logTelemetry('WHITEBOARD_ACTION_CLEAR_RIGHT');
    rightColumnStepShapeIds.roadmap = null;
    rightColumnStepShapeIds.step1 = null;
    rightColumnStepShapeIds.step2 = null;
    rightColumnStepShapeIds.step3 = null;
    rightColumnStepShapeIds.final = null;
    if (!editorInstance) {
      if (window.clearFallbackRight) window.clearFallbackRight();
      return;
    }
    try {
      const allShapes = Array.from(editorInstance.getCurrentPageShapes?.() || []);
      const rightShapeIds = allShapes
        .filter(s => (s.x || 0) >= (BOARD_LAYOUT.COL_RIGHT_X - 30))
        .map(s => s.id);
      if (rightShapeIds.length > 0) {
        editorInstance.deleteShapes(rightShapeIds);
      }
    } catch (e) {
      logTelemetry('CLEAR_RIGHT_ERROR', { message: e?.message });
    }
  },

  zoomFit() {
    logTelemetry('WHITEBOARD_ACTION_ZOOM_FIT');
    if (!editorInstance) return;
    try {
      editorInstance.zoomToFit({ duration: 350, padding: 40 });
    } catch (e) {
      logTelemetry('ZOOM_FIT_ERROR', { message: e?.message });
    }
  },

  addQuestionHeader({ title, chapter, marks }) {
    logTelemetry('WHITEBOARD_ACTION_ADD_HEADER', { title: title?.slice(0, 40), chapter, marks });
    if (!editorInstance) {
      if (window.drawFallbackHeader) window.drawFallbackHeader(title, chapter, marks);
      return;
    }
    const cleanTitle = formatMathForWhiteboard(title || '');

    safeCreateShape({
      type: 'geo',
      x: BOARD_LAYOUT.COL_LEFT_X,
      y: BOARD_LAYOUT.HEADER_Y,
      props: {
        geo: 'rectangle',
        w: BOARD_LAYOUT.COL_LEFT_W,
        h: BOARD_LAYOUT.HEADER_H,
        color: 'blue',
        fill: 'semi',
        size: 's',
        richText: toRichText(`QUESTION STATEMENT • ${marks ? `${marks} MARKS` : '3 MARKS'}\nChapter: ${(chapter || 'Physics / Science').toUpperCase()}\n\n${cleanTitle}`)
      }
    });
    this.zoomFit();
  },

  renderOrientationSetup(plan = {}) {
    logTelemetry('WHITEBOARD_ACTION_ORIENTATION_SETUP');
    currentPlanCache = plan;
    currentStepNumber = 0;
    this.clear();

    const qHeader = plan.questionHeader || {
      title: plan.title || 'Pure Rolling Motion of Solid Sphere',
      chapter: plan.chapter || 'System of Particles & Rotational Motion',
      marks: plan.marks || 4
    };
    this.addQuestionHeader(qHeader);

    const diag = plan.diagram || { type: 'rolling_incline', label: 'Rolling Sphere on Incline' };
    this.drawPhysicsDiagram(diag.type || 'rolling_incline', diag);

    this.clearRightBoard();

    if (window.updateUIProgress) {
      window.updateUIProgress(0, 'Voice Tutor Teaching: Interactive Whiteboard');
    }

    this.zoomFit();
  },

  renderStepProgressive(targetStep = 1, plan = null) {
    logTelemetry('WHITEBOARD_ACTION_STEP_PROGRESSIVE', { targetStep });
    if (plan) currentPlanCache = plan;
    currentStepNumber = targetStep;

    // Keep right board clear of automated step boxes per classroom pedagogical preferences
    this.clearRightBoard();

    if (window.updateUIProgress) {
      window.updateUIProgress(targetStep, 'Voice Tutor Teaching: Interactive Whiteboard');
    }

    this.zoomFit();
  },

  setStepMode(payload = {}) {
    const stepNum = typeof payload.stepNum === 'number' ? payload.stepNum : (payload.step || 0);
    const plan = payload.plan || currentPlanCache || payload;
    if (stepNum === 0) {
      this.renderOrientationSetup(plan);
    } else {
      this.renderStepProgressive(stepNum, plan);
    }
  },

  renderFullBoardSummary(plan = null) {
    this.renderStepProgressive(4, plan);
  },

  addStepFormula({ stepNum = 1, title = 'Governing Law', formula = '', explanation = '' }) {
    if (currentPlanCache) {
      currentPlanCache[`step${stepNum}`] = { title, formula, explanation };
    }
    this.renderStepProgressive(stepNum, currentPlanCache);
  },

  spotlightConcept(conceptIndex) {
    logTelemetry('WHITEBOARD_ACTION_SPOTLIGHT_CONCEPT', { conceptIndex });
    applySpotlight(conceptIndex);
    const teacherTag = currentPlanCache?.teacherName || 'Faculty Mentor';
    const titles = [
      'Visual Concept Model & Setup',
      'Governing Principles & Primary Law',
      'Derivation & Step-by-Step Working',
      'Evaluated Solution & Takeaway',
      'Full Board Complete'
    ];
    const lbl = titles[conceptIndex] || 'Synchronized Classroom Smartboard';
    if (window.updateUIProgress) {
      window.updateUIProgress(conceptIndex, `👨‍🏫 ${teacherTag} Teaching: ${lbl}`);
    }
    try {
      window.parent.postMessage({ type: 'WB_CONCEPT_CHANGED', conceptIndex, title: lbl }, '*');
    } catch (e) {}
  },

  renderSmartboardSolution(payload = {}) {
    logTelemetry('WHITEBOARD_ACTION_RENDER_SMARTBOARD_SOLUTION');
    currentPlanCache = payload;
    this.clear();

    const qHeader = payload.questionHeader || {
      title: 'Question Statement & Analysis',
      chapter: payload.subject || 'Senior Secondary STEM',
      marks: 3
    };
    this.addQuestionHeader(qHeader);

    const diag = payload.diagram || { type: 'concept', title: 'System Model & Visual Analysis' };
    this.drawPhysicsDiagram(diag.type || 'concept', {
      ...diag,
      label: diag.title,
      tip: payload.examTip || diag.tip
    });

    const sol = payload.solution || {};
    const rx = BOARD_LAYOUT.COL_RIGHT_X;
    const rw = BOARD_LAYOUT.COL_RIGHT_W;

    // Helper to format clean, non-numbered headers without forcing physics labels on other subjects
    const cleanSectionTitle = (t, fallback) => (t || fallback)
      .replace(/^(step\s*\d+[\s.:-]*|\d+[\s.:-]*)/i, '')
      .trim().toUpperCase();

    // 1. Governing Principles / Equations (Top Card - Clean Math / Chemistry / Physics)
    const s1 = sol.step1 || {
      title: 'Governing Principles & Setup',
      formula: '• Identify given inputs and constraints\n• Apply foundational governing law or formula'
    };
    const s1CleanF = formatMathForWhiteboard(s1.formula || '');
    const s1Text = [
      cleanSectionTitle(s1.title, 'GOVERNING PRINCIPLES & SETUP'),
      '',
      s1CleanF
    ].filter(Boolean).join('\n');

    safeCreateShape({
      type: 'geo',
      x: rx,
      y: 50,
      props: {
        geo: 'rectangle',
        w: rw,
        h: 220,
        color: 'yellow',
        fill: 'semi',
        size: 's',
        richText: toRichText(s1Text)
      }
    });

    // 2. Mathematical / Chemical Derivation & Substitution (Middle Card)
    const s2 = sol.step2 || {
      title: 'Derivation & Step-by-Step Working',
      formula: '1) Substitute known parameters into equation\n2) Simplify algebraic / stoichiometric relations step-by-step'
    };
    const s2CleanF = formatMathForWhiteboard(s2.formula || '');
    const s2Text = [
      cleanSectionTitle(s2.title, 'DERIVATION & WORKING'),
      '',
      s2CleanF
    ].filter(Boolean).join('\n');

    safeCreateShape({
      type: 'geo',
      x: rx,
      y: 290,
      props: {
        geo: 'rectangle',
        w: rw,
        h: 240,
        color: 'light-blue',
        fill: 'semi',
        size: 's',
        richText: toRichText(s2Text)
      }
    });

    // 3. Evaluated Result & Final Answer (Bottom Card)
    const s3 = sol.step3 || {
      title: 'Final Evaluated Answer & Verified Takeaway',
      formula: '• Final verified result evaluated with standard SI units\n• Sanity check confirms theoretical consistency'
    };
    const s3CleanF = formatMathForWhiteboard(s3.formula || '');
    const s3Text = [
      cleanSectionTitle(s3.title, 'FINAL EVALUATED RESULT'),
      '',
      s3CleanF
    ].filter(Boolean).join('\n');

    safeCreateShape({
      type: 'geo',
      x: rx,
      y: 550,
      props: {
        geo: 'rectangle',
        w: rw,
        h: 240,
        color: 'green',
        fill: 'semi',
        size: 's',
        richText: toRichText(s3Text)
      }
    });

    // Initial orientation spotlight on Left Visual Diagram
    this.spotlightConcept(0);
    this.zoomFit();

    // Trigger paced concept reveal in UI
    if (window.startPacedConceptTeaching) {
      window.startPacedConceptTeaching();
    }
  },

  drawPhysicsDiagram(type = 'lens', params = {}) {
    logTelemetry('WHITEBOARD_ACTION_DRAW_DIAGRAM', { type, params });
    if (!editorInstance) {
      if (window.drawFallbackDiagram) window.drawFallbackDiagram(type, params);
      return;
    }

    const lx = BOARD_LAYOUT.COL_LEFT_X;
    const dy = BOARD_LAYOUT.DIAGRAM_Y;
    let cy = dy + 180;

    // Outer Diagram Container Card (Ensures visual clarity and zero overlap with other sections)
    safeCreateShape({
      type: 'geo',
      x: lx,
      y: dy,
      props: {
        geo: 'rectangle',
        w: BOARD_LAYOUT.COL_LEFT_W,
        h: BOARD_LAYOUT.DIAGRAM_H,
        color: 'blue',
        fill: 'semi',
        size: 's',
        richText: toRichText('')
      }
    });

    if (type === 'rolling_incline' || type === 'rotational' || type === 'rolling') {
      // 1. Diagram Title Header
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('FREE-BODY DIAGRAM (FBD) • SOLID SPHERE ON INCLINE (θ)'),
          size: 's',
          color: 'blue'
        }
      });

      // 2. Inclined Plane Wedge
      // Horizontal ground line
      safeCreateShape({
        type: 'line',
        x: lx + 40,
        y: dy + 370,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 580, y: 0 }
          },
          color: 'grey',
          size: 's',
          dash: 'dashed'
        }
      });

      // Vertical back height line
      safeCreateShape({
        type: 'line',
        x: lx + 40,
        y: dy + 110,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 0, y: 260 }
          },
          color: 'grey',
          size: 's'
        }
      });

      // Incline plane slope line
      safeCreateShape({
        type: 'line',
        x: lx + 40,
        y: dy + 110,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 580, y: 260 }
          },
          color: 'blue',
          size: 'm',
          dash: 'draw'
        }
      });

      // Angle θ arc and label at bottom corner
      safeCreateShape({
        type: 'text',
        x: lx + 530,
        y: dy + 340,
        props: { richText: toRichText('θ (Incline Angle)'), size: 's', color: 'orange' }
      });

      // 3. Rolling Solid Sphere (Positioned with geometric precision on incline)
      // Sphere center: (lx + 320, dy + 195)
      safeCreateShape({
        type: 'geo',
        x: lx + 275,
        y: dy + 150,
        props: {
          geo: 'ellipse',
          w: 90,
          h: 90,
          color: 'orange',
          fill: 'semi',
          richText: toRichText('')
        }
      });

      // Center of mass dot
      safeCreateShape({
        type: 'geo',
        x: lx + 316,
        y: dy + 191,
        props: {
          geo: 'ellipse',
          w: 8,
          h: 8,
          color: 'orange',
          fill: 'solid',
          richText: toRichText('')
        }
      });

      // Sphere Descriptor Label Above
      safeCreateShape({
        type: 'text',
        x: lx + 160,
        y: dy + 85,
        props: {
          richText: toRichText('Solid Sphere (Mass M, Radius R, I_cm = ⅖ MR²)'),
          size: 's',
          color: 'orange'
        }
      });

      // Angular rotation direction inside sphere
      safeCreateShape({
        type: 'text',
        x: lx + 295,
        y: dy + 180,
        props: {
          richText: toRichText('↻ α (Torque τ = f_s·R)'),
          size: 's',
          color: 'orange'
        }
      });

      // 4. Force Vectors from Center of Mass
      // Gravity Mg (straight down)
      safeCreateShape({
        type: 'arrow',
        x: lx + 320,
        y: dy + 195,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 0, y: 85 },
          color: 'grey'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 328,
        y: dy + 280,
        props: { richText: toRichText('M·g (Weight)'), size: 's', color: 'grey' }
      });

      // Normal reaction N (perpendicular away from plane)
      safeCreateShape({
        type: 'arrow',
        x: lx + 320,
        y: dy + 195,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 28, y: -62 },
          color: 'blue'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 355,
        y: dy + 125,
        props: { richText: toRichText('N (Normal Reaction)'), size: 's', color: 'blue' }
      });

      // Down-plane gravity driving component: Mg sin θ
      safeCreateShape({
        type: 'arrow',
        x: lx + 320,
        y: dy + 195,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 68, y: 31 },
          color: 'green'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 395,
        y: dy + 215,
        props: { richText: toRichText('M·g·sin θ (Downhill Force)'), size: 's', color: 'green' }
      });

      // Perpendicular gravity balance component: Mg cos θ
      safeCreateShape({
        type: 'arrow',
        x: lx + 320,
        y: dy + 195,
        props: {
          start: { x: 0, y: 0 },
          end: { x: -25, y: 56 },
          color: 'grey',
          dash: 'dashed'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 210,
        y: dy + 250,
        props: { richText: toRichText('M·g·cos θ (= N)'), size: 's', color: 'grey' }
      });

      // 5. Static Friction Force fs (at contact point P, pointing UP the incline)
      safeCreateShape({
        type: 'arrow',
        x: lx + 301,
        y: dy + 236,
        props: {
          start: { x: 0, y: 0 },
          end: { x: -62, y: -28 },
          color: 'red'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 130,
        y: dy + 195,
        props: { richText: toRichText('f_s (Static Friction, Uphill)'), size: 's', color: 'red' }
      });

      // 6. Point of Contact Callout Badge
      safeCreateShape({
        type: 'geo',
        x: lx + 296,
        y: dy + 231,
        props: {
          geo: 'ellipse',
          w: 10,
          h: 10,
          color: 'red',
          fill: 'solid',
          richText: toRichText('')
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 270,
        y: dy + 250,
        props: {
          richText: toRichText('Contact P (v = 0)'),
          size: 's',
          color: 'yellow'
        }
      });

      // 7. Linear Acceleration Vector (Parallel to Incline)
      safeCreateShape({
        type: 'arrow',
        x: lx + 410,
        y: dy + 160,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 70, y: 31 },
          color: 'green'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 410,
        y: dy + 130,
        props: { richText: toRichText('a_cm = (5/7)·g·sin θ'), size: 's', color: 'green' }
      });

    } else if (type === 'lens' || type === 'optics') {
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('OPTICS DIAGRAM • CONVEX LENS RAY FORMATION'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 190;
      // Optical Axis
      safeCreateShape({
        type: 'line',
        x: lx + 40,
        y: cy,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 470, y: 0 }
          },
          color: 'grey',
          size: 's',
          dash: 'dashed'
        }
      });

      // Lens
      safeCreateShape({
        type: 'geo',
        x: lx + 260,
        y: cy - 90,
        props: {
          geo: 'ellipse',
          w: 30,
          h: 180,
          color: 'light-blue',
          fill: 'semi',
          richText: toRichText('')
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 252,
        y: cy - 120,
        props: { richText: toRichText('Convex Lens'), size: 's', color: 'light-blue' }
      });

      // Foci
      safeCreateShape({
        type: 'text',
        x: lx + 150,
        y: cy + 10,
        props: { richText: toRichText('F₁ (Focus)'), size: 's', color: 'orange' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 380,
        y: cy + 10,
        props: { richText: toRichText('F₂ (Focus)'), size: 's', color: 'orange' }
      });

      // Object
      safeCreateShape({
        type: 'arrow',
        x: lx + 90,
        y: cy,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: -70 }, color: 'red' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 70,
        y: cy - 95,
        props: { richText: toRichText('Object (h)'), size: 's', color: 'red' }
      });

      // Real Inverted Image
      safeCreateShape({
        type: 'arrow',
        x: lx + 450,
        y: cy,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: 75 }, color: 'green' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 390,
        y: cy + 85,
        props: { richText: toRichText('Image (Real, Inverted)'), size: 's', color: 'green' }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 25,
        y: dy + 348,
        props: {
          richText: toRichText('Lens Formula: 1/f = 1/v - 1/u  |  Linear Magnification: m = v/u = h_i / h_o'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'circuit' || type === 'electricity') {
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('CIRCUIT DIAGRAM • OHM\'S LAW & RESISTIVITY'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 180;
      // Circuit rectangle loop
      safeCreateShape({
        type: 'geo',
        x: lx + 60,
        y: cy - 80,
        props: {
          geo: 'rectangle',
          w: 420,
          h: 160,
          color: 'grey',
          fill: 'none',
          richText: toRichText('')
        }
      });

      // Resistor
      safeCreateShape({
        type: 'geo',
        x: lx + 180,
        y: cy - 95,
        props: {
          geo: 'rectangle',
          w: 180,
          h: 32,
          color: 'orange',
          fill: 'semi',
          richText: toRichText('Resistor R = ρ·(l/A)')
        }
      });

      // Battery
      safeCreateShape({
        type: 'geo',
        x: lx + 210,
        y: cy + 65,
        props: {
          geo: 'rectangle',
          w: 120,
          h: 30,
          color: 'green',
          fill: 'semi',
          richText: toRichText('DC Source (V)')
        }
      });

      // Current arrow
      safeCreateShape({
        type: 'arrow',
        x: lx + 90,
        y: cy + 30,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: -60 }, color: 'yellow' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 65,
        y: cy - 5,
        props: { richText: toRichText('I (Current)'), size: 's', color: 'yellow' }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 25,
        y: dy + 348,
        props: {
          richText: toRichText('Ohm\'s Law: V = I · R  |  Microscopic: I = n·e·A·v_d  |  ρ = m / (n·e²·τ)'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'projectile') {
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText(`PROJECTILE TRAJECTORY • 2D KINEMATICS (${params.title || 'Parabolic Path'})`),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 180;
      // Ground horizontal line
      safeCreateShape({
        type: 'line',
        x: lx + 40,
        y: cy + 120,
        props: {
          points: { a1: { id: 'a1', index: 'a1', x: 0, y: 0 }, a2: { id: 'a2', index: 'a2', x: 580, y: 0 } },
          color: 'grey',
          size: 's'
        }
      });

      // Launch vector arrow v0
      safeCreateShape({
        type: 'arrow',
        x: lx + 50,
        y: cy + 120,
        props: { start: { x: 0, y: 0 }, end: { x: 90, y: -70 }, color: 'green' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 65,
        y: cy + 30,
        props: { richText: toRichText('v_0 (Launch Velocity)'), size: 's', color: 'green' }
      });

      // Angle theta arc
      safeCreateShape({
        type: 'text',
        x: lx + 90,
        y: cy + 90,
        props: { richText: toRichText('θ (Launch Angle)'), size: 's', color: 'orange' }
      });

      // Peak max height indicator
      safeCreateShape({
        type: 'arrow',
        x: lx + 330,
        y: cy + 120,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: -130 }, color: 'blue' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 340,
        y: cy + 20,
        props: { richText: toRichText('H_max = (v_0²·sin²θ) / 2g'), size: 's', color: 'blue' }
      });

      // Range callout
      safeCreateShape({
        type: 'text',
        x: lx + 220,
        y: cy + 135,
        props: { richText: toRichText('Horizontal Range R = (v_0²·sin 2θ) / g'), size: 's', color: 'yellow' }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 25,
        y: dy + 348,
        props: {
          richText: toRichText('Kinematics: a_x = 0 (Constant velocity)  |  a_y = -g (Uniform acceleration)'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'fbd' || type === 'mechanics') {
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText(`FREE-BODY DIAGRAM (FBD) • ${params.title || 'FORCE RESOLUTION'}`),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 180;
      // Surface line
      safeCreateShape({
        type: 'line',
        x: lx + 50,
        y: cy + 60,
        props: { points: { a1: { id: 'a1', index: 'a1', x: 0, y: 0 }, a2: { id: 'a2', index: 'a2', x: 500, y: 0 } }, color: 'grey', size: 's' }
      });

      // Mass block
      safeCreateShape({
        type: 'geo',
        x: lx + 230,
        y: cy - 30,
        props: { geo: 'rectangle', w: 140, h: 90, color: 'orange', fill: 'semi', richText: toRichText('Mass (M)') }
      });

      // Normal Reaction N upward
      safeCreateShape({
        type: 'arrow',
        x: lx + 300,
        y: cy - 30,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: -70 }, color: 'blue' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 310,
        y: cy - 90,
        props: { richText: toRichText('N (Normal Reaction)'), size: 's', color: 'blue' }
      });

      // Gravity mg downward
      safeCreateShape({
        type: 'arrow',
        x: lx + 300,
        y: cy + 60,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: 70 }, color: 'grey' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 310,
        y: cy + 100,
        props: { richText: toRichText('M·g (Weight)'), size: 's', color: 'grey' }
      });

      // Applied force F rightward
      safeCreateShape({
        type: 'arrow',
        x: lx + 370,
        y: cy + 15,
        props: { start: { x: 0, y: 0 }, end: { x: 80, y: 0 }, color: 'green' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 410,
        y: cy - 10,
        props: { richText: toRichText('F (Applied)'), size: 's', color: 'green' }
      });

      // Friction f_s leftward
      safeCreateShape({
        type: 'arrow',
        x: lx + 230,
        y: cy + 55,
        props: { start: { x: 0, y: 0 }, end: { x: -70, y: 0 }, color: 'red' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 120,
        y: cy + 40,
        props: { richText: toRichText('f_s (Friction)'), size: 's', color: 'red' }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 25,
        y: dy + 348,
        props: {
          richText: toRichText('Newton\'s 2nd Law: Σ F_x = M·a_x  |  Σ F_y = N - M·g = 0  ⇒  N = M·g'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'oscillator' || type === 'shm') {
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText(`HARMONIC OSCILLATOR (SHM) • ${params.title || 'RESTORING DYNAMICS'}`),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 180;
      // Fixed wall line
      safeCreateShape({
        type: 'line',
        x: lx + 60,
        y: cy - 80,
        props: { points: { a1: { id: 'a1', index: 'a1', x: 0, y: 0 }, a2: { id: 'a2', index: 'a2', x: 0, y: 160 } }, color: 'grey', size: 'm' }
      });

      // Spring coil box
      safeCreateShape({
        type: 'geo',
        x: lx + 70,
        y: cy - 25,
        props: { geo: 'rectangle', w: 180, h: 50, color: 'grey', fill: 'none', richText: toRichText('Spring k (Coil)') }
      });

      // Attached mass
      safeCreateShape({
        type: 'geo',
        x: lx + 260,
        y: cy - 40,
        props: { geo: 'rectangle', w: 100, h: 80, color: 'violet', fill: 'semi', richText: toRichText('Mass (m)') }
      });

      // Equilibrium dashed line
      safeCreateShape({
        type: 'line',
        x: lx + 310,
        y: cy - 70,
        props: { points: { a1: { id: 'a1', index: 'a1', x: 0, y: 0 }, a2: { id: 'a2', index: 'a2', x: 0, y: 140 } }, color: 'blue', size: 's', dash: 'dashed' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 285,
        y: cy + 85,
        props: { richText: toRichText('x = 0 (Mean Position)'), size: 's', color: 'blue' }
      });

      // Restoring force arrow
      safeCreateShape({
        type: 'arrow',
        x: lx + 360,
        y: cy,
        props: { start: { x: 0, y: 0 }, end: { x: -60, y: 0 }, color: 'red' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 375,
        y: cy - 15,
        props: { richText: toRichText('F = -k·x'), size: 's', color: 'red' }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 25,
        y: dy + 348,
        props: {
          richText: toRichText('Equation of Motion: m·(d²x/dt²) + k·x = 0  ⇒  ω = √(k/m),  T = 2π√(m/k)'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'chemistry_cell' || type === 'electrochem') {
      // GALVANIC ELECTROCHEMICAL CELL DIAGRAM
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('GALVANIC CELL • ZINC-COPPER ELECTROCHEMICAL EQUILIBRIUM'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 110;

      // Anode Beaker (Left - Zn Half-Cell)
      safeCreateShape({
        type: 'geo',
        x: lx + 50,
        y: cy + 40,
        props: {
          geo: 'rectangle',
          w: 220,
          h: 170,
          color: 'light-blue',
          fill: 'semi',
          size: 's',
          richText: toRichText('ANODE HALF-CELL (-)\n\nZnSO₄ (aq) Solution\nZn(s) → Zn²⁺ + 2e⁻')
        }
      });

      // Anode Zinc Electrode Bar
      safeCreateShape({
        type: 'geo',
        x: lx + 120,
        y: cy,
        props: {
          geo: 'rectangle',
          w: 40,
          h: 140,
          color: 'grey',
          fill: 'solid',
          size: 's',
          richText: toRichText('Zn\n(-)')
        }
      });

      // Cathode Beaker (Right - Cu Half-Cell)
      safeCreateShape({
        type: 'geo',
        x: lx + 370,
        y: cy + 40,
        props: {
          geo: 'rectangle',
          w: 220,
          h: 170,
          color: 'orange',
          fill: 'semi',
          size: 's',
          richText: toRichText('CATHODE HALF-CELL (+)\n\nCuSO₄ (aq) Solution\nCu²⁺ + 2e⁻ → Cu(s)')
        }
      });

      // Cathode Copper Electrode Bar
      safeCreateShape({
        type: 'geo',
        x: lx + 470,
        y: cy,
        props: {
          geo: 'rectangle',
          w: 40,
          h: 140,
          color: 'red',
          fill: 'solid',
          size: 's',
          richText: toRichText('Cu\n(+)')
        }
      });

      // Salt Bridge Tube connecting both beakers
      safeCreateShape({
        type: 'geo',
        x: lx + 230,
        y: cy + 20,
        props: {
          geo: 'rectangle',
          w: 180,
          h: 55,
          color: 'yellow',
          fill: 'semi',
          size: 's',
          richText: toRichText('Salt Bridge (KNO₃ / Agar)')
        }
      });

      // Voltmeter Indicator Circle
      safeCreateShape({
        type: 'geo',
        x: lx + 285,
        y: cy - 65,
        props: {
          geo: 'ellipse',
          w: 70,
          h: 70,
          color: 'green',
          fill: 'solid',
          size: 's',
          richText: toRichText('V\n+1.10V')
        }
      });

      // Connecting Wire Lines from Anode to Cathode
      safeCreateShape({
        type: 'line',
        x: lx + 140,
        y: cy - 30,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 30 },
            a2: { id: 'a2', index: 'a2', x: 0, y: 0 },
            a3: { id: 'a3', index: 'a3', x: 145, y: 0 }
          },
          color: 'green',
          size: 'm'
        }
      });
      safeCreateShape({
        type: 'line',
        x: lx + 355,
        y: cy - 30,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 135, y: 0 },
            a3: { id: 'a3', index: 'a3', x: 135, y: 30 }
          },
          color: 'green',
          size: 'm'
        }
      });

      // Electron flow arrow
      safeCreateShape({
        type: 'arrow',
        x: lx + 210,
        y: cy - 45,
        props: { start: { x: 0, y: 0 }, end: { x: 50, y: 0 }, color: 'yellow' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 215,
        y: cy - 65,
        props: { richText: toRichText('e⁻ flow →'), size: 's', color: 'yellow' }
      });

      // Bottom Electrochemical Governing Law Summary
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 348,
        props: {
          richText: toRichText('Governing Cell Law: ΔG° = -n·F·E°_cell  |  E_cell = E° - (0.059/n)·log Q  |  n = 2 electrons'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'chemistry_reaction' || type === 'chemistry_kinetics' || type === 'reaction_profile') {
      // CHEMICAL KINETICS & ARRHENIUS ENERGY PROFILE
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('REACTION KINETICS & ARRHENIUS ACTIVATION ENERGY (Ea) PROFILE'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 100;
      // Potential Energy Y-Axis
      safeCreateShape({
        type: 'arrow',
        x: lx + 60,
        y: cy + 220,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: -200 }, color: 'grey' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 25,
        y: cy + 10,
        props: { richText: toRichText('Potential\nEnergy (kJ)'), size: 's', color: 'grey' }
      });

      // Reaction Coordinate X-Axis
      safeCreateShape({
        type: 'arrow',
        x: lx + 60,
        y: cy + 220,
        props: { start: { x: 0, y: 0 }, end: { x: 530, y: 0 }, color: 'grey' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 440,
        y: cy + 225,
        props: { richText: toRichText('Reaction Progress →'), size: 's', color: 'grey' }
      });

      // Reactants Plateau
      safeCreateShape({
        type: 'geo',
        x: lx + 90,
        y: cy + 120,
        props: { geo: 'rectangle', w: 120, h: 45, color: 'blue', fill: 'semi', size: 's', richText: toRichText('Reactants [R]') }
      });

      // Transition State Peak
      safeCreateShape({
        type: 'geo',
        x: lx + 270,
        y: cy + 15,
        props: { geo: 'rectangle', w: 120, h: 45, color: 'red', fill: 'semi', size: 's', richText: toRichText('Transition [X‡]') }
      });

      // Products Plateau
      safeCreateShape({
        type: 'geo',
        x: lx + 450,
        y: cy + 150,
        props: { geo: 'rectangle', w: 120, h: 45, color: 'green', fill: 'semi', size: 's', richText: toRichText('Products [P]') }
      });

      // Activation Energy Arrow (Ea)
      safeCreateShape({
        type: 'arrow',
        x: lx + 215,
        y: cy + 120,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: -90 }, color: 'yellow' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 225,
        y: cy + 70,
        props: { richText: toRichText('E_a (Forward)'), size: 's', color: 'yellow' }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 348,
        props: {
          richText: toRichText('Integrated Rate Law: k = (2.303/t)·log([R]₀/[R])  |  Half-Life: t_½ = 0.693/k  |  k = A·e^(-Ea/RT)'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'chemistry_solutions' || type === 'solutions') {
      // SOLUTIONS & COLLIGATIVE PROPERTIES DIAGRAM
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('SOLUTIONS • PHASE EQUILIBRIUM & COLLIGATIVE DEPRESSION'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 95;
      // Solvent vs Solution Beaker Comparison
      safeCreateShape({
        type: 'geo',
        x: lx + 50,
        y: cy + 20,
        props: {
          geo: 'rectangle',
          w: 240,
          h: 180,
          color: 'light-blue',
          fill: 'semi',
          size: 's',
          richText: toRichText('PURE SOLVENT (H₂O)\n\n• High Vapor Pressure P°\n• Freezing Point T°_f = 273.15 K\n• Normal Boiling Point = 373.15 K')
        }
      });

      safeCreateShape({
        type: 'geo',
        x: lx + 350,
        y: cy + 20,
        props: {
          geo: 'rectangle',
          w: 240,
          h: 180,
          color: 'orange',
          fill: 'semi',
          size: 's',
          richText: toRichText('DILUTE SOLUTION (Solvent + Solute)\n\n• Lowered Vapor Pressure (Raoult\'s)\n• Freezing Depression: ΔT_f = K_f · m\n• Boiling Elevation: ΔT_b = K_b · m')
        }
      });

      // Transfer arrow between states
      safeCreateShape({
        type: 'arrow',
        x: lx + 295,
        y: cy + 110,
        props: { start: { x: 0, y: 0 }, end: { x: 50, y: 0 }, color: 'yellow' }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 348,
        props: {
          richText: toRichText('Colligative Principles: ΔT_f = i·K_f·m  |  m = (w₂/M₂) / (w₁/1000)  |  T_f = T°_f - ΔT_f'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'chemistry_organic' || type === 'organic') {
      // ORGANIC MECHANISM PATHWAY
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('ORGANIC REACTION MECHANISM & REGIOCHEMICAL PATHWAY'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 100;
      safeCreateShape({
        type: 'geo',
        x: lx + 40,
        y: cy + 30,
        props: { geo: 'rectangle', w: 160, h: 90, color: 'blue', fill: 'semi', size: 's', richText: toRichText('SUBSTRATE\nR-LG + Nu⁻\n(Substrate)') }
      });

      safeCreateShape({
        type: 'arrow',
        x: lx + 205,
        y: cy + 75,
        props: { start: { x: 0, y: 0 }, end: { x: 45, y: 0 }, color: 'yellow' }
      });

      safeCreateShape({
        type: 'geo',
        x: lx + 255,
        y: cy + 30,
        props: { geo: 'rectangle', w: 170, h: 90, color: 'red', fill: 'semi', size: 's', richText: toRichText('INTERMEDIATE\nCarbocation (3°>2°>1°)\nPlanar Transition State') }
      });

      safeCreateShape({
        type: 'arrow',
        x: lx + 430,
        y: cy + 75,
        props: { start: { x: 0, y: 0 }, end: { x: 45, y: 0 }, color: 'yellow' }
      });

      safeCreateShape({
        type: 'geo',
        x: lx + 480,
        y: cy + 30,
        props: { geo: 'rectangle', w: 150, h: 90, color: 'green', fill: 'semi', size: 's', richText: toRichText('MAJOR PRODUCT\nMarkovnikov / Saytzeff\nTarget Product') }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 348,
        props: {
          richText: toRichText('Mechanism Rules: S_N2 → Inversion of Configuration  |  S_N1 → Carbocation Rearrangement & Racemization'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'math_calculus' || type === 'calculus') {
      // CALCULUS & CURVE ANALYSIS
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('CALCULUS • FUNCTION GRAPH, TANGENT & DEFINITE INTEGRAL'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 100;
      // Coordinate axes
      safeCreateShape({
        type: 'line',
        x: lx + 60,
        y: cy + 220,
        props: { points: { a1: { id: 'a1', index: 'a1', x: 0, y: 0 }, a2: { id: 'a2', index: 'a2', x: 0, y: -200 } }, color: 'grey', size: 's' }
      });
      safeCreateShape({
        type: 'line',
        x: lx + 60,
        y: cy + 220,
        props: { points: { a1: { id: 'a1', index: 'a1', x: 0, y: 0 }, a2: { id: 'a2', index: 'a2', x: 520, y: 0 } }, color: 'grey', size: 's' }
      });

      // Function curve box representation
      safeCreateShape({
        type: 'geo',
        x: lx + 120,
        y: cy + 50,
        props: { geo: 'rectangle', w: 420, h: 120, color: 'light-blue', fill: 'semi', size: 's', richText: toRichText('Function Curve y = f(x)\n\n• Tangent Slope at (x₀, y₀): m = dy/dx = f\'(x₀)\n• Definite Area Under Curve: A = ∫ₐᵇ f(x) dx = F(b) - F(a)') }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 348,
        props: {
          richText: toRichText('Calculus Principles: Integration by Parts ∫u·dv = u·v - ∫v·du  |  Derivative Chain Rule d/dx[f(g(x))] = f\'(g(x))·g\'(x)'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'math_matrix' || type === 'matrix') {
      // MATRIX ALGEBRA & DETERMINANTS
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('MATRIX ALGEBRA • DETERMINANT EXPANSION & INVERSION'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 95;
      safeCreateShape({
        type: 'geo',
        x: lx + 80,
        y: cy + 25,
        props: {
          geo: 'rectangle',
          w: 480,
          h: 170,
          color: 'violet',
          fill: 'semi',
          size: 's',
          richText: toRichText('MATRIX REPRESENTATION: A · X = B\n\n• Determinant Expansion: |A| = a₁₁(a₂₂a₃₃ - a₂₃a₃₂) - a₁₂(a₂₁a₃₃ - ...) + ...\n• Matrix Inverse: A⁻¹ = (1 / |A|) · adj(A),  where |A| ≠ 0\n• Cramer\'s Solution: x = |A_x| / |A|,  y = |A_y| / |A|,  z = |A_z| / |A|')
        }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 348,
        props: {
          richText: toRichText('Theorem: A is invertible iff det(A) ≠ 0. If det(A) = 0 and (adj A)·B ≠ 0, system has NO solution.'),
          size: 's',
          color: 'yellow'
        }
      });

    } else if (type === 'bio_genetics' || type === 'genetics') {
      // GENETICS & PUNNETT SQUARE
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText('MENDELIAN GENETICS • PUNNETT SQUARE INHERITANCE'),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 95;
      safeCreateShape({
        type: 'geo',
        x: lx + 80,
        y: cy + 20,
        props: {
          geo: 'rectangle',
          w: 480,
          h: 180,
          color: 'green',
          fill: 'semi',
          size: 's',
          richText: toRichText('PUNNETT CROSS GRID: Tt × Tt (Monohybrid)\n\n          T (50%)          t (50%)\nT (50%)   TT (Tall, 25%)   Tt (Tall, 25%)\nt (50%)   Tt (Tall, 25%)   tt (Dwarf, 25%)\n\n• Phenotypic Ratio: 3 Tall : 1 Dwarf (3:1)\n• Genotypic Ratio: 1 TT : 2 Tt : 1 tt (1:2:1)')
        }
      });

      // Bottom Note
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 348,
        props: {
          richText: toRichText('Law of Segregation: Alleles separate during gamete formation. Each gamete carries only one allele.'),
          size: 's',
          color: 'yellow'
        }
      });
      // General Visual Concept Framework (Universal for all subjects & concepts)
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText(`VISUAL CONCEPT FRAMEWORK • ${(params.title || params.label || 'SYSTEM SCHEMATIC').toUpperCase()}`),
          size: 's',
          color: 'blue'
        }
      });

      cy = dy + 120;
      // Block A: Stated Given Parameters
      safeCreateShape({
        type: 'geo',
        x: lx + 40,
        y: cy,
        props: {
          geo: 'rectangle',
          w: 240,
          h: 90,
          color: 'orange',
          fill: 'semi',
          size: 's',
          richText: toRichText(`1. GIVEN PARAMETERS\n• Physical Inputs Identified\n• Units Converted to SI standard`)
        }
      });

      // Transfer arrow
      safeCreateShape({
        type: 'arrow',
        x: lx + 290,
        y: cy + 45,
        props: { start: { x: 0, y: 0 }, end: { x: 60, y: 0 }, color: 'yellow' }
      });

      // Block B: Target Solution
      safeCreateShape({
        type: 'geo',
        x: lx + 360,
        y: cy,
        props: {
          geo: 'rectangle',
          w: 240,
          h: 90,
          color: 'green',
          fill: 'semi',
          size: 's',
          richText: toRichText(`2. TARGET OUTPUT\n• Calculated Variable\n• Verified Result with Units`)
        }
      });

      // Central Governing Framework card
      safeCreateShape({
        type: 'geo',
        x: lx + 40,
        y: cy + 115,
        props: {
          geo: 'rectangle',
          w: 560,
          h: 90,
          color: 'violet',
          fill: 'semi',
          size: 's',
          richText: toRichText(`CORE GOVERNING LAW & MATHEMATICAL RELATION\n• Establish direct mathematical formulation linking given inputs to output.\n• Check physical boundary conditions and coordinate sign conventions.`)
        }
      });

    }

    this.zoomFit();
  },

  highlightDoubt({ doubtText, answerText }) {
    logTelemetry('WHITEBOARD_ACTION_HIGHLIGHT_DOUBT', { doubtText, answerText });
    if (!editorInstance) {
      if (window.drawFallbackDoubt) window.drawFallbackDoubt(doubtText, answerText);
      return;
    }
    const cleanDoubt = formatMathForWhiteboard(doubtText || '');
    const cleanAnswer = formatMathForWhiteboard(answerText || '');

    safeCreateShape({
      type: 'note',
      x: BOARD_LAYOUT.COL_RIGHT_X,
      y: BOARD_LAYOUT.DOUBT_Y,
      props: {
        color: 'red',
        richText: toRichText(`Student Doubt: "${cleanDoubt}"\n\nTeacher: ${cleanAnswer}`)
      }
    });

    safeCreateShape({
      type: 'arrow',
      x: BOARD_LAYOUT.COL_RIGHT_X - 45,
      y: BOARD_LAYOUT.DOUBT_Y + 35,
      props: {
        start: { x: 0, y: 0 },
        end: { x: 40, y: 0 },
        color: 'red'
      }
    });

    this.zoomFit();
  },

  addFinalAnswer({ answer, keyInsight }) {
    logTelemetry('WHITEBOARD_ACTION_FINAL_ANSWER', { answer, keyInsight });
    if (!editorInstance) {
      if (window.drawFallbackFinal) window.drawFallbackFinal(answer, keyInsight);
      return;
    }
    const cleanAnswer = formatMathForWhiteboard(answer || '');
    const cleanInsight = formatMathForWhiteboard(keyInsight || 'Verified by CBSE Standard');

    safeCreateShape({
      type: 'geo',
      x: BOARD_LAYOUT.COL_RIGHT_X,
      y: BOARD_LAYOUT.FINAL_Y,
      props: {
        geo: 'rectangle',
        w: BOARD_LAYOUT.COL_RIGHT_W,
        h: BOARD_LAYOUT.FINAL_H,
        color: 'green',
        fill: 'semi',
        size: 's',
        richText: toRichText(`FINAL ANSWER:\n\n${cleanAnswer}\n\nKey Takeaway: ${cleanInsight}`)
      }
    });

    this.zoomFit();
  }
};

window.whiteboardController = WhiteboardController;

function processWhiteboardEvent(data) {
  if (!data || !data.type) return;
  logTelemetry('DISPATCH_WHITEBOARD_EVENT', { type: data.type, payload: data.payload });

  if (!editorInstance) {
    queuedEvents.push(data);
    if (window.drawFallbackHeader && data.type === 'INIT_QUESTION') {
      window.clearFallbackCanvas && window.clearFallbackCanvas();
      window.drawFallbackHeader(data.payload?.title, data.payload?.chapter, data.payload?.marks);
    } else if (data.type === 'SET_STEP_MODE' && window.setFallbackStepMode) {
      window.setFallbackStepMode(data.payload);
    } else if (data.type === 'RENDER_FULL_SUMMARY' && window.drawFallbackFullSummary) {
      window.drawFallbackFullSummary(data.payload);
    } else if (window.drawFallbackDiagram && data.type === 'DRAW_DIAGRAM') {
      window.drawFallbackDiagram(data.payload?.diagramType, data.payload || {});
    } else if (window.drawFallbackStep && data.type === 'WRITE_STEP') {
      window.drawFallbackStep(data.payload?.stepNum, data.payload?.title, data.payload?.formula, data.payload?.explanation);
    } else if (window.drawFallbackDoubt && data.type === 'HIGHLIGHT_DOUBT') {
      window.drawFallbackDoubt(data.payload?.doubtText, data.payload?.answerText);
    } else if (window.drawFallbackFinal && data.type === 'FINAL_ANSWER') {
      window.drawFallbackFinal(data.payload?.answer, data.payload?.keyInsight);
    } else if (data.type === 'RENDER_SMARTBOARD_SOLUTION' && window.drawFallbackSmartboardSolution) {
      window.drawFallbackSmartboardSolution(data.payload);
    } else if (window.clearFallbackCanvas && data.type === 'CLEAR_BOARD') {
      window.clearFallbackCanvas();
    }
    return;
  }

  switch (data.type) {
    case 'INIT_QUESTION':
      WhiteboardController.clear();
      WhiteboardController.addQuestionHeader(data.payload || {});
      break;

    case 'SET_STEP_MODE':
      WhiteboardController.setStepMode(data.payload || {});
      break;

    case 'RENDER_ORIENTATION':
      WhiteboardController.renderOrientationSetup(data.payload || {});
      break;

    case 'RENDER_STEP_1':
      WhiteboardController.setStepMode({ stepNum: 1, plan: data.payload });
      break;

    case 'RENDER_STEP_2':
      WhiteboardController.setStepMode({ stepNum: 2, plan: data.payload });
      break;

    case 'RENDER_STEP_3':
      WhiteboardController.setStepMode({ stepNum: 3, plan: data.payload });
      break;

    case 'RENDER_SMARTBOARD_SOLUTION':
      WhiteboardController.renderSmartboardSolution(data.payload || {});
      break;

    case 'SPOTLIGHT_CONCEPT':
      WhiteboardController.spotlightConcept(typeof data.payload?.conceptIndex === 'number' ? data.payload.conceptIndex : (typeof data.payload === 'number' ? data.payload : 0));
      break;

    case 'RENDER_FULL_SUMMARY':
      WhiteboardController.renderFullBoardSummary(data.payload);
      break;

    case 'DRAW_DIAGRAM':
      WhiteboardController.drawPhysicsDiagram(data.payload?.diagramType, data.payload || {});
      break;

    case 'WRITE_STEP':
      WhiteboardController.addStepFormula(data.payload || {});
      break;

    case 'HIGHLIGHT_DOUBT':
      WhiteboardController.highlightDoubt(data.payload || {});
      break;

    case 'FINAL_ANSWER':
      WhiteboardController.addFinalAnswer(data.payload || {});
      break;

    case 'CLEAR_BOARD':
      WhiteboardController.clear();
      break;

    case 'CLEAR_RIGHT':
      WhiteboardController.clearRightBoard();
      break;

    case 'ZOOM_FIT':
      WhiteboardController.zoomFit();
      break;
  }
}

function WhiteboardApp() {
  useEffect(() => {
    const timer = setTimeout(() => {
      hideLoader();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleMount = (editor) => {
    editorInstance = editor;
    logTelemetry('TLDRAW_EDITOR_MOUNTED_SUCCESSFULLY');
    hideLoader();

    while (queuedEvents.length > 0) {
      const evt = queuedEvents.shift();
      processWhiteboardEvent(evt);
    }

    window.parent.postMessage({ type: 'WHITEBOARD_READY' }, '*');
  };

  return React.createElement(
    'div',
    { style: { position: 'fixed', inset: 0, width: '100%', height: '100%' } },
    React.createElement(
      ErrorBoundary,
      null,
      React.createElement(Tldraw, {
        licenseKey: TLDRAW_LICENSE_KEY,
        onMount: handleMount,
        autoFocus: false,
        inferDarkMode: true,
        components: {
          ErrorFallback: CustomErrorFallback
        }
      })
    )
  );
}

async function init() {
  logTelemetry('WHITEBOARD_CLIENT_INIT_CALLED');
  await purgeCorruptStorage();

  const rootEl = document.getElementById('root');
  if (rootEl) {
    try {
      const root = createRoot(rootEl);
      root.render(React.createElement(WhiteboardApp));
      logTelemetry('REACT_ROOT_RENDER_CALLED');
    } catch (e) {
      logTelemetry('REACT_ROOT_RENDER_FAILED', { message: e?.message, stack: e?.stack });
    }
  } else {
    logTelemetry('ROOT_ELEMENT_NOT_FOUND');
  }

  document.getElementById('btnWbClear')?.addEventListener('click', () => {
    WhiteboardController.clear();
  });
  document.getElementById('btnWbFit')?.addEventListener('click', () => {
    WhiteboardController.zoomFit();
  });

  window.addEventListener('message', (event) => {
    processWhiteboardEvent(event.data);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
