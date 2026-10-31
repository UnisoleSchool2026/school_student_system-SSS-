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

// Smartboard 2-Column Teaching Layout Geometry
const BOARD_LAYOUT = {
  // Left Column: Problem & Visual Physics
  COL_LEFT_X: 50,
  COL_LEFT_W: 520,
  HEADER_Y: 50,
  HEADER_H: 130,
  DIAGRAM_Y: 200,
  DIAGRAM_H: 240,
  TIP_Y: 460,
  TIP_H: 105,

  // Right Column: Step-by-Step Mathematical Derivation
  COL_RIGHT_X: 600,
  COL_RIGHT_W: 640,
  STEP1_Y: 50,
  STEP1_H: 130,
  STEP2_Y: 200,
  STEP2_H: 145,
  FINAL_Y: 365,
  FINAL_H: 130,
  DOUBT_Y: 515,
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
    const cleanTitle = (title || '')
      .replace(/\$+/g, '')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
      .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
      .trim();

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
        size: 'm',
        richText: toRichText(`QUESTION STATEMENT (${marks ? `${marks}M` : '3 Marks'})\n${chapter ? chapter.toUpperCase() + '\n' : ''}${cleanTitle.slice(0, 150)}${cleanTitle.length > 150 ? '...' : ''}`)
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
    const cleanFormula = (formula || '').replace(/\$+/g, '').trim();
    const cleanExp = (explanation || '').replace(/\$+/g, '').trim();

    if (stepNum === 1) {
      safeCreateShape({
        type: 'geo',
        x: BOARD_LAYOUT.COL_RIGHT_X,
        y: BOARD_LAYOUT.STEP1_Y,
        props: {
          geo: 'rectangle',
          w: BOARD_LAYOUT.COL_RIGHT_W,
          h: BOARD_LAYOUT.STEP1_H,
          color: 'yellow',
          fill: 'semi',
          size: 'm',
          richText: toRichText(`Step 1: ${title}\nFormula: ${cleanFormula}\n${cleanExp ? cleanExp.slice(0, 110) : ''}`)
        }
      });
    } else {
      safeCreateShape({
        type: 'geo',
        x: BOARD_LAYOUT.COL_RIGHT_X,
        y: BOARD_LAYOUT.STEP2_Y,
        props: {
          geo: 'rectangle',
          w: BOARD_LAYOUT.COL_RIGHT_W,
          h: BOARD_LAYOUT.STEP2_H,
          color: 'light-blue',
          fill: 'semi',
          size: 'm',
          richText: toRichText(`Step 2: ${title}\nWorking: ${cleanFormula}\n${cleanExp ? cleanExp.slice(0, 120) : ''}`)
        }
      });
    }
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

    if (type === 'rolling_incline' || type === 'rotational' || type === 'rolling') {
      // 1. Incline Plane Wedge
      safeCreateShape({
        type: 'line',
        x: lx,
        y: dy + 180,
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
      safeCreateShape({
        type: 'line',
        x: lx,
        y: dy + 30,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 440, y: 150 }
          },
          color: 'blue',
          size: 'm',
          dash: 'draw'
        }
      });
      safeCreateShape({
        type: 'line',
        x: lx,
        y: dy + 30,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 0, y: 150 }
          },
          color: 'grey',
          size: 's'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 370,
        y: dy + 155,
        props: { richText: toRichText('θ (Angle)'), size: 's', color: 'orange' }
      });

      // 2. Rolling Solid Sphere
      safeCreateShape({
        type: 'geo',
        x: lx + 160,
        y: dy + 45,
        props: {
          geo: 'ellipse',
          w: 72,
          h: 72,
          color: 'orange',
          fill: 'semi',
          richText: toRichText('Sphere\n(M, R)')
        }
      });

      // 3. Acceleration & Rotation Vectors
      safeCreateShape({
        type: 'arrow',
        x: lx + 205,
        y: dy + 80,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 80, y: 28 },
          color: 'green'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 285,
        y: dy + 90,
        props: { richText: toRichText('a = g sin θ / (1 + I/MR²)'), size: 's', color: 'green' }
      });

      // 4. Static Friction Arrow up the incline
      safeCreateShape({
        type: 'arrow',
        x: lx + 185,
        y: dy + 110,
        props: {
          start: { x: 0, y: 0 },
          end: { x: -50, y: -17 },
          color: 'red'
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 90,
        y: dy + 85,
        props: { richText: toRichText('fs (Friction)'), size: 's', color: 'red' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 120,
        y: dy + 195,
        props: { richText: toRichText('Pure Rolling: v = ωR,  I_sphere = (2/5)MR²'), size: 's', color: 'yellow' }
      });

    } else if (type === 'lens' || type === 'optics') {
      const cy = dy + 110;
      safeCreateShape({
        type: 'line',
        x: lx,
        y: cy,
        props: {
          points: {
            a1: { id: 'a1', index: 'a1', x: 0, y: 0 },
            a2: { id: 'a2', index: 'a2', x: 500, y: 0 }
          },
          color: 'grey',
          size: 's',
          dash: 'dashed'
        }
      });
      safeCreateShape({
        type: 'geo',
        x: lx + 240,
        y: cy - 80,
        props: {
          geo: 'ellipse',
          w: 36,
          h: 160,
          color: 'light-blue',
          fill: 'semi',
          richText: toRichText('Lens')
        }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 120,
        y: cy + 10,
        props: { richText: toRichText('F1 (Focus)'), size: 's', color: 'orange' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 360,
        y: cy + 10,
        props: { richText: toRichText('F2 (Focus)'), size: 's', color: 'orange' }
      });
      safeCreateShape({
        type: 'arrow',
        x: lx + 60,
        y: cy,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: -60 }, color: 'red' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 40,
        y: cy - 80,
        props: { richText: toRichText('Object (h)'), size: 's', color: 'red' }
      });
      safeCreateShape({
        type: 'arrow',
        x: lx + 440,
        y: cy,
        props: { start: { x: 0, y: 0 }, end: { x: 0, y: 65 }, color: 'green' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 410,
        y: cy + 75,
        props: { richText: toRichText('Image (Real, Inverted)'), size: 's', color: 'green' }
      });

    } else if (type === 'circuit' || type === 'electricity') {
      const cy = dy + 100;
      safeCreateShape({
        type: 'geo',
        x: lx + 30,
        y: cy - 65,
        props: {
          geo: 'rectangle',
          w: 440,
          h: 130,
          color: 'grey',
          fill: 'none',
          richText: toRichText('')
        }
      });
      safeCreateShape({
        type: 'geo',
        x: lx + 170,
        y: cy - 80,
        props: {
          geo: 'rectangle',
          w: 160,
          h: 36,
          color: 'orange',
          fill: 'semi',
          richText: toRichText('Resistor (R = V/I)')
        }
      });
      safeCreateShape({
        type: 'geo',
        x: lx + 190,
        y: cy + 50,
        props: {
          geo: 'rectangle',
          w: 120,
          h: 32,
          color: 'green',
          fill: 'semi',
          richText: toRichText('Battery (V)')
        }
      });
      safeCreateShape({
        type: 'arrow',
        x: lx + 80,
        y: cy,
        props: { start: { x: 0, y: 20 }, end: { x: 0, y: -20 }, color: 'yellow' }
      });
      safeCreateShape({
        type: 'text',
        x: lx + 50,
        y: cy - 10,
        props: { richText: toRichText('I (Current)'), size: 's', color: 'yellow' }
      });

    } else {
      // General Visual Concept Framework
      safeCreateShape({
        type: 'geo',
        x: lx,
        y: dy,
        props: {
          geo: 'rectangle',
          w: BOARD_LAYOUT.COL_LEFT_W,
          h: 125,
          color: 'violet',
          fill: 'semi',
          richText: toRichText(`VISUAL CONCEPT FRAMEWORK\n${params.label || 'Physical Governing Relation'}\nIdentify given variables & fundamental law.`)
        }
      });
      safeCreateShape({
        type: 'geo',
        x: lx,
        y: dy + 135,
        props: {
          geo: 'rectangle',
          w: BOARD_LAYOUT.COL_LEFT_W,
          h: 80,
          color: 'light-blue',
          fill: 'semi',
          richText: toRichText('Sign Convention & SI Unit Integrity: Crucial for CBSE/JEE Standard')
        }
      });
    }

    // Teacher Exam Tip Box placed at bottom of Left Column
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
        richText: toRichText(`TEACHER EXAM TIP & PITFALL:\n${params.tip || 'Pure rolling requires static friction. Always verify angular & linear motion coordinates before computing!'}`)
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

    safeCreateShape({
      type: 'note',
      x: BOARD_LAYOUT.COL_RIGHT_X,
      y: BOARD_LAYOUT.DOUBT_Y,
      props: {
        color: 'red',
        richText: toRichText(`Student Doubt: "${doubtText}"\n\nTeacher: ${answerText}`)
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
    const cleanAnswer = (answer || '').replace(/\$+/g, '').trim();

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
        size: 'm',
        richText: toRichText(`FINAL ANSWER:\n${cleanAnswer}\n(${keyInsight || 'Verified by CBSE Standard'})`)
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
