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

// Smartboard 2-Column Teaching Layout Geometry (Zero Overlap Guaranteed)
const BOARD_LAYOUT = {
  // Left Column: Problem & Visual Physics
  COL_LEFT_X: 50,
  COL_LEFT_W: 550,
  HEADER_Y: 50,
  HEADER_H: 175,
  DIAGRAM_Y: 250,
  DIAGRAM_H: 390,
  TIP_Y: 665,
  TIP_H: 125,

  // Right Column: Step-by-Step Mathematical Derivation
  COL_RIGHT_X: 630,
  COL_RIGHT_W: 620,
  STEP1_Y: 50,
  STEP1_H: 175,
  STEP2_Y: 250,
  STEP2_H: 185,
  STEP3_Y: 455,
  STEP3_H: 190,
  FINAL_Y: 665,
  FINAL_H: 125,
  DOUBT_Y: 810,
  DOUBT_H: 130
};

const WhiteboardController = {
  isReady() {
    return !!editorInstance;
  },

  clear() {
    logTelemetry('WHITEBOARD_ACTION_CLEAR');
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

  zoomFit() {
    logTelemetry('WHITEBOARD_ACTION_ZOOM_FIT');
    if (!editorInstance) return;
    try {
      editorInstance.zoomToFit({ duration: 400, padding: 35 });
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

  addStepFormula({ stepNum = 1, title = 'Governing Law', formula = '', explanation = '' }) {
    logTelemetry('WHITEBOARD_ACTION_ADD_STEP', { stepNum, title, formula });
    if (!editorInstance) {
      if (window.drawFallbackStep) window.drawFallbackStep(stepNum, title, formula, explanation);
      return;
    }
    const cleanFormula = formatMathForWhiteboard(formula || '');
    const cleanExp = formatMathForWhiteboard(explanation || '');

    let yPos = BOARD_LAYOUT.STEP1_Y;
    let hVal = BOARD_LAYOUT.STEP1_H;
    let cardColor = 'yellow';

    if (stepNum === 1) {
      yPos = BOARD_LAYOUT.STEP1_Y;
      hVal = BOARD_LAYOUT.STEP1_H;
      cardColor = 'yellow';
    } else if (stepNum === 2) {
      yPos = BOARD_LAYOUT.STEP2_Y;
      hVal = BOARD_LAYOUT.STEP2_H;
      cardColor = 'light-blue';
    } else if (stepNum === 3) {
      yPos = BOARD_LAYOUT.STEP3_Y;
      hVal = BOARD_LAYOUT.STEP3_H;
      cardColor = 'violet';
    } else {
      yPos = BOARD_LAYOUT.STEP3_Y + (stepNum - 2) * 195;
      hVal = 185;
      cardColor = 'light-blue';
    }

    safeCreateShape({
      type: 'geo',
      x: BOARD_LAYOUT.COL_RIGHT_X,
      y: yPos,
      props: {
        geo: 'rectangle',
        w: BOARD_LAYOUT.COL_RIGHT_W,
        h: hVal,
        color: cardColor,
        fill: 'semi',
        size: 's',
        richText: toRichText(`Step ${stepNum}: ${title}\n\n${cleanFormula}\n\n${cleanExp}`)
      }
    });
    this.zoomFit();
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
      // Title Header inside Diagram Card
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

      // 1. Inclined Plane Wedge
      // Horizontal ground line
      safeCreateShape({
        type: 'line',
        x: lx + 40,
        y: dy + 310,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 440, y: 0 }
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
            a2: { id: 'a2', index: 'a2', x: 0, y: 200 }
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
            a2: { id: 'a2', index: 'a2', x: 440, y: 200 }
          },
          color: 'blue',
          size: 'm',
          dash: 'draw'
        }
      });

      // Angle theta indicator at bottom corner
      safeCreateShape({
        type: 'text',
        x: lx + 420,
        y: dy + 285,
        props: { richText: toRichText('θ (Angle)'), size: 's', color: 'orange' }
      });

      // 2. Rolling Solid Sphere (Positioned cleanly on incline slope)
      // Sphere center: (lx + 263, dy + 149)
      safeCreateShape({
        type: 'geo',
        x: lx + 227,
        y: dy + 113,
        props: {
          geo: 'ellipse',
          w: 72,
          h: 72,
          color: 'orange',
          fill: 'semi',
          richText: toRichText('')
        }
      });

      // Center of mass indicator dot
      safeCreateShape({
        type: 'geo',
        x: lx + 260,
        y: dy + 146,
        props: {
          geo: 'ellipse',
          w: 6,
          h: 6,
          color: 'orange',
          fill: 'solid',
          richText: toRichText('')
        }
      });

      // External label for sphere placed ABOVE to prevent word clipping
      safeCreateShape({
        type: 'text',
        x: lx + 120,
        y: dy + 65,
        props: {
          richText: toRichText('Solid Sphere (Mass M, Radius R, I = ⅖ MR²)'),
          size: 's',
          color: 'orange'
        }
      });

      // Angular rotation direction inside sphere
      safeCreateShape({
        type: 'text',
        x: lx + 242,
        y: dy + 138,
        props: {
          richText: toRichText('↻ α'),
          size: 's',
          color: 'orange'
        }
      });

      // 3. Force Vectors from Center of Mass
      // Gravity Mg (straight down)
      safeCreateShape({
        type: 'arrow',
        x: lx + 263,
        y: dy + 149,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 0, y: 68 },
          color: 'grey'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 268,
        y: dy + 218,
        props: { richText: toRichText('M·g'), size: 's', color: 'grey' }
      });

      // Normal reaction N (perpendicular away from plane)
      safeCreateShape({
        type: 'arrow',
        x: lx + 263,
        y: dy + 149,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 22, y: -48 },
          color: 'blue'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 288,
        y: dy + 95,
        props: { richText: toRichText('N (Normal)'), size: 's', color: 'blue' }
      });

      // Down-plane gravity component: Mg sin θ
      safeCreateShape({
        type: 'arrow',
        x: lx + 263,
        y: dy + 149,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 50, y: 23 },
          color: 'green'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 318,
        y: dy + 172,
        props: { richText: toRichText('M·g·sin θ'), size: 's', color: 'green' }
      });

      // Perpendicular gravity component: Mg cos θ
      safeCreateShape({
        type: 'arrow',
        x: lx + 263,
        y: dy + 149,
        props: {
          start: { x: 0, y: 0 },
          end: { x: -18, y: 40 },
          color: 'grey',
          dash: 'dashed'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 175,
        y: dy + 190,
        props: { richText: toRichText('M·g·cos θ'), size: 's', color: 'grey' }
      });

      // 4. Static Friction Force fs (at contact point P, pointing UP the incline)
      safeCreateShape({
        type: 'arrow',
        x: lx + 248,
        y: dy + 182,
        props: {
          start: { x: 0, y: 0 },
          end: { x: -46, y: -21 },
          color: 'red'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 120,
        y: dy + 155,
        props: { richText: toRichText('f_s (Static Friction)'), size: 's', color: 'red' }
      });

      // 5. Linear Acceleration a vector (parallel to incline)
      safeCreateShape({
        type: 'arrow',
        x: lx + 325,
        y: dy + 130,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 55, y: 25 },
          color: 'green'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 325,
        y: dy + 105,
        props: { richText: toRichText('a = (5/7)·g·sin θ'), size: 's', color: 'green' }
      });

      // 6. Summary Footer note inside Diagram Card
      safeCreateShape({
        type: 'text',
        x: lx + 25,
        y: dy + 348,
        props: {
          richText: toRichText('Pure Rolling Condition: v = ω·R  and  a = α·R  |  Contact point P is at instantaneous rest'),
          size: 's',
          color: 'yellow'
        }
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
