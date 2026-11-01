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
  HEADER_H: 175,
  DIAGRAM_Y: 245,
  DIAGRAM_H: 495,
  TIP_Y: 755,
  TIP_H: 115,

  // Right Column: Step-by-Step Mathematical Derivation & Concept Focus
  COL_RIGHT_X: 760,
  COL_RIGHT_W: 800,
  STEP1_Y: 50,
  STEP1_H: 175,
  STEP2_Y: 245,
  STEP2_H: 185,
  STEP3_Y: 450,
  STEP3_H: 185,
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

    const rx = BOARD_LAYOUT.COL_RIGHT_X;
    const rw = BOARD_LAYOUT.COL_RIGHT_W;

    const roadmapShape = safeCreateShape({
      type: 'geo',
      x: rx,
      y: 50,
      props: {
        geo: 'rectangle',
        w: rw,
        h: 745,
        color: 'blue',
        fill: 'semi',
        size: 's',
        richText: toRichText(`AI CLASSROOM SMARTBOARD • PEDAGOGICAL ROADMAP\n\nChapter: ${(qHeader.chapter || 'Senior Physics').toUpperCase()}\n\n1. Visual Physical System (Left Smartboard):\n• Detailed Free-Body Diagram with incline angle θ and sphere mass M, radius R\n• Gravitational components: Downhill M·g·sin θ and Normal M·g·cos θ\n• Static friction f_s acts uphill at contact point P, providing pure roll\n• Instantaneous center of rotation: Point P is at rest (zero relative sliding)\n\n2. Progressive Derivation Roadmap:\n• Step 1: Formulate linear motion & torque governing equations\n• Step 2: Apply pure rolling condition (a = α·R) & substitute friction force\n• Step 3: Insert specific moment of inertia (I = ⅖ MR²) & calculate linear acceleration\n• Step 4: Final Answer & Key Exam Takeaway\n\nClassroom Status: Teacher Dr. Vikram is starting the lesson...`)
      }
    });

    rightColumnStepShapeIds.roadmap = roadmapShape ? roadmapShape.id : null;
    rightColumnStepShapeIds.step1 = null;
    rightColumnStepShapeIds.step2 = null;
    rightColumnStepShapeIds.step3 = null;
    rightColumnStepShapeIds.final = null;

    if (window.updateUIProgress) {
      window.updateUIProgress(0, 'Voice Tutor Teaching: 1. Visual Diagram');
    }

    this.zoomFit();
  },

  renderStepProgressive(targetStep = 1, plan = null) {
    logTelemetry('WHITEBOARD_ACTION_STEP_PROGRESSIVE', { targetStep });
    if (plan) currentPlanCache = plan;
    const p = currentPlanCache || {};
    currentStepNumber = targetStep;

    const rx = BOARD_LAYOUT.COL_RIGHT_X;
    const rw = BOARD_LAYOUT.COL_RIGHT_W;

    if (!editorInstance) {
      if (window.setFallbackStepMode) window.setFallbackStepMode({ stepNum: targetStep, plan: p });
      return;
    }

    // If initial roadmap card is still on right board, delete it so steps can write cleanly
    if (rightColumnStepShapeIds.roadmap) {
      try {
        editorInstance.deleteShapes([rightColumnStepShapeIds.roadmap]);
      } catch (e) {}
      rightColumnStepShapeIds.roadmap = null;
    }

    // Helper: Ensure Step 1 is rendered (Kept on board!)
    const ensureStep1 = () => {
      if (rightColumnStepShapeIds.step1) return;
      const s1 = p.step1 || {
        title: 'Governing Principles & Equations',
        formula: '• Linear Motion (down incline):  M·g·sin θ - f_s = M·a\n• Torque equation about center: τ = f_s · R = I · α\n• Pure Rolling Constraint:       a = α · R  ⇒  α = a / R',
        explanation: 'Pure rolling without slipping: Contact point P is at instantaneous rest with zero relative sliding.'
      };
      const cleanFormula = formatMathForWhiteboard(s1.formula || '');
      const cleanExp = formatMathForWhiteboard(s1.explanation || '');
      const shape = safeCreateShape({
        type: 'geo',
        x: rx,
        y: BOARD_LAYOUT.STEP1_Y,
        props: {
          geo: 'rectangle',
          w: rw,
          h: BOARD_LAYOUT.STEP1_H,
          color: 'yellow',
          fill: 'semi',
          size: 's',
          richText: toRichText(`1. ${(s1.title || 'Governing Equations').toUpperCase()}\n\n${cleanFormula}\n\n• ${cleanExp}`)
        }
      });
      if (shape) rightColumnStepShapeIds.step1 = shape.id;
    };

    // Helper: Ensure Step 2 is rendered (Kept on board!)
    const ensureStep2 = () => {
      if (rightColumnStepShapeIds.step2) return;
      const s2 = p.step2 || {
        title: 'Mathematical Substitution & Working',
        formula: '1) Torque equation: f_s · R = I · (a / R)  ⇒  f_s = (I / R²) · a\n2) Substitute f_s:  M·g·sin θ - (I / R²) · a = M·a\n3) General Formula: a = (g · sin θ) / [1 + I / (M · R²)]',
        explanation: 'This general acceleration equation applies to all rolling symmetrical objects.'
      };
      const cleanFormula = formatMathForWhiteboard(s2.formula || '');
      const cleanExp = formatMathForWhiteboard(s2.explanation || '');
      const shape = safeCreateShape({
        type: 'geo',
        x: rx,
        y: BOARD_LAYOUT.STEP2_Y,
        props: {
          geo: 'rectangle',
          w: rw,
          h: BOARD_LAYOUT.STEP2_H,
          color: 'light-blue',
          fill: 'semi',
          size: 's',
          richText: toRichText(`2. ${(s2.title || 'Substitution & Working').toUpperCase()}\n\n${cleanFormula}\n\n• ${cleanExp}`)
        }
      });
      if (shape) rightColumnStepShapeIds.step2 = shape.id;
    };

    // Helper: Ensure Step 3 is rendered (Kept on board!)
    const ensureStep3 = () => {
      if (rightColumnStepShapeIds.step3) return;
      const s3 = p.step3 || {
        title: 'Moment of Inertia & Exact Derivation',
        formula: '• For Solid Sphere:  I = (2/5) · M · R²  ⇒  I / (M · R²) = 2/5\n• Acceleration:      a = (g · sin θ) / [1 + 2/5] = (g · sin θ) / (7/5)\n• Final Expression:  a = (5/7) · g · sin θ  ≈ 0.714 · g · sin θ',
        explanation: 'Solid sphere accelerates faster than hollow sphere due to lower rotational inertia.'
      };
      const cleanFormula = formatMathForWhiteboard(s3.formula || '');
      const cleanExp = formatMathForWhiteboard(s3.explanation || '');
      const shape = safeCreateShape({
        type: 'geo',
        x: rx,
        y: BOARD_LAYOUT.STEP3_Y,
        props: {
          geo: 'rectangle',
          w: rw,
          h: BOARD_LAYOUT.STEP3_H,
          color: 'violet',
          fill: 'semi',
          size: 's',
          richText: toRichText(`3. ${(s3.title || 'Moment of Inertia & Calculation').toUpperCase()}\n\n${cleanFormula}\n\n• ${cleanExp}`)
        }
      });
      if (shape) rightColumnStepShapeIds.step3 = shape.id;
    };

    // Helper: Ensure Final Answer is rendered (Kept on board!)
    const ensureFinal = () => {
      if (rightColumnStepShapeIds.final) return;
      const finalAns = p.final || {
        answer: 'Linear Acceleration: a = (5/7) · g · sin θ  [Option B]',
        keyInsight: 'Pure rolling is sustained by STATIC friction. Work done by static friction is ZERO! Mechanical energy is conserved.'
      };
      const cleanAns = formatMathForWhiteboard(finalAns.answer || '');
      const cleanInsight = formatMathForWhiteboard(finalAns.keyInsight || '');
      const shape = safeCreateShape({
        type: 'geo',
        x: rx,
        y: BOARD_LAYOUT.FINAL_Y,
        props: {
          geo: 'rectangle',
          w: rw,
          h: BOARD_LAYOUT.FINAL_H,
          color: 'green',
          fill: 'semi',
          size: 's',
          richText: toRichText(`FINAL ANSWER & VERIFIED TAKEAWAY:\n\n${cleanAns}\n\nExam Key: ${cleanInsight}`)
        }
      });
      if (shape) rightColumnStepShapeIds.final = shape.id;
    };

    // Progressively accumulate steps: NEVER erase earlier steps!
    if (targetStep === 1) {
      ensureStep1();
    } else if (targetStep === 2) {
      ensureStep1();
      ensureStep2();
    } else if (targetStep === 3) {
      ensureStep1();
      ensureStep2();
      ensureStep3();
    } else if (targetStep >= 4) {
      ensureStep1();
      ensureStep2();
      ensureStep3();
      ensureFinal();
    }

    if (window.updateUIProgress) {
      window.updateUIProgress(targetStep);
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

  drawPhysicsDiagram(type = 'lens', params = {}) {
    logTelemetry('WHITEBOARD_ACTION_DRAW_DIAGRAM', { type, params });
    if (!editorInstance) {
      if (window.drawFallbackDiagram) window.drawFallbackDiagram(type, params);
      return;
    }

    const lx = BOARD_LAYOUT.COL_LEFT_X;
    const dy = BOARD_LAYOUT.DIAGRAM_Y;

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
        x: lx + 30,
        y: dy + 395,
        props: {
          richText: toRichText('CONTACT POINT P: Instantaneous Center of Zero Velocity (v_p = 0)\nPure Rolling Constraint: a_cm = α·R  |  Work done by static friction W_fs = 0'),
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

      const cy = dy + 190;
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

      const cy = dy + 180;
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

    } else {
      safeCreateShape({
        type: 'text',
        x: lx + 20,
        y: dy + 15,
        props: {
          richText: toRichText(`VISUAL CONCEPT FRAMEWORK • ${params.label || 'Physics Principles'}`),
          size: 's',
          color: 'blue'
        }
      });

      safeCreateShape({
        type: 'geo',
        x: lx + 40,
        y: dy + 70,
        props: {
          geo: 'rectangle',
          w: 470,
          h: 120,
          color: 'violet',
          fill: 'semi',
          size: 's',
          richText: toRichText('GOVERNING PHYSICAL LAWS & BOUNDARY CONDITIONS\n• Identify all given independent variables and state constraints.\n• Choose coordinate axes aligned with acceleration direction.\n• Apply conservation theorems (Energy, Linear Momentum, Angular Momentum).')
        }
      });

      safeCreateShape({
        type: 'text',
        x: lx + 25,
        y: dy + 348,
        props: {
          richText: toRichText('Sign Convention & SI Unit Integrity: Essential for full marks in CBSE/JEE exams'),
          size: 's',
          color: 'yellow'
        }
      });
    }

    // Teacher Exam Tip Box placed at bottom of Left Column (Zero Overlap with diagram)
    safeCreateShape({
      type: 'geo',
      x: lx,
      y: BOARD_LAYOUT.TIP_Y,
      props: {
        geo: 'rectangle',
        w: BOARD_LAYOUT.COL_LEFT_W,
        h: BOARD_LAYOUT.TIP_H,
        color: 'yellow',
        fill: 'semi',
        size: 's',
        richText: toRichText(`TEACHER EXAM TIP & COMMON PITFALL:\n${formatMathForWhiteboard(params.tip || 'Pure rolling requires STATIC friction. Work done by static friction is zero! Total mechanical energy is conserved.')}`)
      }
    });

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
