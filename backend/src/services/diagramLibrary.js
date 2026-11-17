// ============================================================================
// Board diagrams: specification, checking and topic library
// ----------------------------------------------------------------------------
// A diagram is a small JSON object ("spec") that the frontend renderer
// (frontend/js/boardDiagrams.js) draws on the Study Board, step by step.
// Specs come from two places:
//   1. diagramsForTopic(): a fixed library that picks a fitting diagram for a
//      syllabus topic, so every lesson has a picture even without AI;
//   2. the AI tutor (lesson writer, doubt solver, live voice tutor), checked
//      by sanitizeDiagram() before it reaches the browser.
// The same type list and fields are described to the AI in DIAGRAM_GUIDE.
// ============================================================================

const TYPES = ['charges', 'capacitor', 'circuit', 'rays', 'refraction', 'vectors', 'forces', 'wave', 'projectile',
  'graph', 'energy_profile', 'atom', 'flow', 'labelled', 'compare', 'concept_map', 'geometry', 'custom'];

// Short description of every diagram type, given to the AI so it can ask for good diagrams.
const DIAGRAM_GUIDE = `DIAGRAMS: a diagram is a JSON object {"type": ..., "title": "short title", "caption": "one line saying what to notice", ...fields}. Pick the type that fits:
- charges: point charges and their field lines. {"charges":[{"x":-0.5,"y":0,"q":1,"label":"+q"},{"x":0.5,"y":0,"q":-1,"label":"-q"}], "surface":{"x":0,"y":0,"r":0.4,"label":"Gaussian surface"} (optional), "showForces":true}  x,y between -1 and 1; q is the charge sign and size (-3..3).
- capacitor: parallel-plate capacitor. {"dielectric":false, "labels":{"plus":"+Q","minus":"-Q","gap":"d"}}
- circuit: a loop circuit. {"source":{"kind":"battery","label":"6 V"}, "series":[{"kind":"resistor","label":"2 Ω"}], "parallel":[{"kind":"resistor","label":"4 Ω"},{"kind":"resistor","label":"4 Ω"}], "current":"I"}  kinds: resistor, bulb, capacitor, inductor, switch, ammeter, voltmeter, diode, battery, ac.
- rays: ray diagram for a lens or mirror, computed exactly. {"element":"convex_lens"|"concave_lens"|"concave_mirror"|"convex_mirror", "f":20, "u":30, "h":4}  f and u in cm, positive numbers.
- refraction: light going from one medium into another. {"n1":1, "n2":1.5, "angle":40, "labels":{"top":"Air","bottom":"Glass"}}  angle of incidence in degrees.
- vectors: arrows from the origin. {"vectors":[{"x":3,"y":2,"label":"A"},{"x":1,"y":3,"label":"B"}], "resultant":true, "components":false}
- forces: free-body diagram. {"body":"block", "incline":30 (degrees, optional), "forces":[{"angle":90,"size":1,"label":"N"},{"angle":270,"size":1,"label":"mg"}]}  angle in degrees measured anticlockwise from the +x axis.
- wave: a transverse wave. {"cycles":2, "labels":{"wavelength":"λ","amplitude":"A"}, "second":{"phase":90,"label":"B","perpendicular":false} (optional; perpendicular true draws it at right angles, e.g. the B field of an EM wave)}
- projectile: {"angle":45, "labels":{"u":"u","range":"R","height":"H"}}
- graph: curves y = f(x). {"x":{"min":-5,"max":5,"label":"x"}, "y":{"min":-5,"max":5,"label":"y"}, "curves":[{"fn":"x^2-2*x-3","label":"y = x² − 2x − 3"}], "points":[{"x":3,"y":0,"label":"(3, 0)"}], "shade":{"fn":"x^2","from":0,"to":2} (optional), "tangent":{"fn":"x^2","at":1} (optional)}  fn uses x, + - * / ^, sin cos tan sqrt abs exp ln log, pi, e.
- energy_profile: reaction energy diagram. {"reactants":"A + B","products":"C","ea":"Eₐ","dh":"ΔH","exothermic":true,"catalyst":false}
- atom: Bohr model. {"symbol":"Na","shells":[2,8,1]}
- flow: steps of a process, in order. {"nodes":["Light absorbed","Water split","ATP made"], "cycle":false}
- labelled: a central object with named parts around it. {"shape":"cell"|"circle"|"box", "center":"Animal cell", "parts":[{"name":"Nucleus","note":"controls the cell"}]}
- compare: two things side by side. {"left":{"title":"Mitosis","points":["..."]},"right":{"title":"Meiosis","points":["..."]}}
- concept_map: one idea and its branches. {"center":"Ohm's law","branches":[{"label":"V = IR","children":["V: voltage"]}]}
- geometry: points and lines on a grid. {"points":[{"name":"A","x":0,"y":0},{"name":"B","x":4,"y":0},{"name":"C","x":0,"y":3}], "segments":[["A","B"],["B","C"],["C","A"]], "angles":[{"at":"A","label":"90°"}], "labels":[{"between":["A","B"],"text":"4 cm"}]}
- custom: only if nothing above fits. {"items":[{"shape":"line"|"arrow"|"circle"|"rect"|"text","x1":..,"y1":..,"x2":..,"y2":..,"cx":..,"cy":..,"r":..,"x":..,"y":..,"w":..,"h":..,"text":"..","color":"blue"|"red"|"black"|"green"}]} on a 0-100 grid (x right, y down).
Labels must be short (1-4 words). Use real values from the question when there are any.`;

function str(v, max = 60) {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : (typeof v === 'number' ? String(v) : '');
}
function num(v, min, max, dflt) {
  const n = Number(v);
  if (!isFinite(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}
function arr(v, max) {
  return Array.isArray(v) ? v.slice(0, max) : [];
}
const COLORS = ['blue', 'red', 'black', 'green'];
const COMPONENTS = ['resistor', 'bulb', 'capacitor', 'inductor', 'switch', 'ammeter', 'voltmeter', 'diode', 'battery', 'ac'];

// Returns a clean copy of a diagram spec, or null when it is not usable.
const FN_WORDS = new Set(['x', 'sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'ln', 'log', 'asin', 'acos', 'atan', 'pi', 'e']);

function sanitizeDiagram(spec) {
  if (!spec || typeof spec !== 'object') return null;
  const type = String(spec.type || '').toLowerCase();
  if (TYPES.indexOf(type) === -1) return null;
  const out = { type, title: str(spec.title, 80), caption: str(spec.caption, 200) };
  switch (type) {
    case 'charges':
      out.charges = arr(spec.charges, 6).map(c => ({ x: num(c && c.x, -1, 1, 0), y: num(c && c.y, -1, 1, 0), q: num(c && c.q, -3, 3, 1) || 1, label: str(c && c.label, 12) }));
      if (!out.charges.length) return null;
      if (spec.surface && typeof spec.surface === 'object') out.surface = { x: num(spec.surface.x, -1, 1, 0), y: num(spec.surface.y, -1, 1, 0), r: num(spec.surface.r, 0.1, 1.2, 0.4), label: str(spec.surface.label, 30) };
      out.showForces = Boolean(spec.showForces);
      break;
    case 'capacitor':
      out.dielectric = Boolean(spec.dielectric);
      out.labels = { plus: str((spec.labels || {}).plus, 10) || '+Q', minus: str((spec.labels || {}).minus, 10) || '−Q', gap: str((spec.labels || {}).gap, 10) || 'd' };
      break;
    case 'circuit': {
      const part = p => (p && COMPONENTS.indexOf(String(p.kind || '').toLowerCase()) !== -1 ? { kind: String(p.kind).toLowerCase(), label: str(p.label, 14) } : null);
      out.source = part(spec.source) || { kind: 'battery', label: '' };
      out.series = arr(spec.series, 4).map(part).filter(Boolean);
      out.parallel = arr(spec.parallel, 4).map(part).filter(Boolean);
      out.current = str(spec.current, 6);
      break;
    }
    case 'rays':
      out.element = ['convex_lens', 'concave_lens', 'concave_mirror', 'convex_mirror'].indexOf(spec.element) !== -1 ? spec.element : 'convex_lens';
      out.f = num(Math.abs(spec.f), 2, 500, 20);
      out.u = num(Math.abs(spec.u), 1, 2000, 30);
      out.h = num(Math.abs(spec.h), 0.5, 100, 4);
      break;
    case 'refraction':
      out.n1 = num(spec.n1, 1, 3, 1);
      out.n2 = num(spec.n2, 1, 3, 1.5);
      out.angle = num(spec.angle, 0, 89, 40);
      out.labels = { top: str((spec.labels || {}).top, 16) || 'Medium 1', bottom: str((spec.labels || {}).bottom, 16) || 'Medium 2' };
      break;
    case 'vectors':
      out.vectors = arr(spec.vectors, 5).map(v => ({ x: num(v && v.x, -20, 20, 1), y: num(v && v.y, -20, 20, 1), label: str(v && v.label, 8), color: COLORS.indexOf(v && v.color) !== -1 ? v.color : '' }));
      if (!out.vectors.length) return null;
      out.resultant = Boolean(spec.resultant);
      out.components = Boolean(spec.components);
      break;
    case 'forces':
      out.body = spec.body === 'ball' ? 'ball' : 'block';
      out.incline = spec.incline === undefined || spec.incline === null ? 0 : num(spec.incline, 0, 75, 0);
      out.forces = arr(spec.forces, 6).map(f => ({ angle: num(f && f.angle, -360, 360, 0), size: num(f && f.size, 0.2, 2, 1), label: str(f && f.label, 10) }));
      if (!out.forces.length) return null;
      break;
    case 'wave':
      out.cycles = num(spec.cycles, 1, 4, 2);
      out.labels = { wavelength: str((spec.labels || {}).wavelength, 8) || 'λ', amplitude: str((spec.labels || {}).amplitude, 8) || 'A' };
      if (spec.second && typeof spec.second === 'object') out.second = { phase: num(spec.second.phase, -360, 360, 90), label: str(spec.second.label, 12), perpendicular: Boolean(spec.second.perpendicular) };
      break;
    case 'projectile':
      out.angle = num(spec.angle, 5, 85, 45);
      out.labels = { u: str((spec.labels || {}).u, 8) || 'u', range: str((spec.labels || {}).range, 8) || 'R', height: str((spec.labels || {}).height, 8) || 'H' };
      break;
    case 'graph': {
      const axis = (a, d) => ({ min: num(a && a.min, -1e6, 1e6, d[0]), max: num(a && a.max, -1e6, 1e6, d[1]), label: str(a && a.label, 20) });
      out.x = axis(spec.x, [-5, 5]);
      out.y = axis(spec.y, [-5, 5]);
      if (out.x.max <= out.x.min) out.x.max = out.x.min + 10;
      if (out.y.max <= out.y.min) out.y.max = out.y.min + 10;
      // Only numbers, x, operators and the maths functions the board's own safe parser knows.
      const fnOk = f => typeof f === 'string' && f.length <= 80 && /^[0-9x+\-*/^().,\s a-z]*$/i.test(f)
        && (f.toLowerCase().match(/[a-z]+/g) || []).every(w => FN_WORDS.has(w) || /^x+$/.test(w) || /^(pi|e)x$|^x(pi|e)$/.test(w));
      out.curves = arr(spec.curves, 4).filter(c => c && fnOk(c.fn)).map(c => ({ fn: c.fn, label: str(c.label, 30), dashed: Boolean(c.dashed) }));
      out.points = arr(spec.points, 6).map(p => ({ x: num(p && p.x, -1e6, 1e6, 0), y: num(p && p.y, -1e6, 1e6, 0), label: str(p && p.label, 20) }));
      if (spec.shade && fnOk(spec.shade.fn)) out.shade = { fn: spec.shade.fn, from: num(spec.shade.from, -1e6, 1e6, 0), to: num(spec.shade.to, -1e6, 1e6, 1) };
      if (spec.tangent && fnOk(spec.tangent.fn)) out.tangent = { fn: spec.tangent.fn, at: num(spec.tangent.at, -1e6, 1e6, 0) };
      if (!out.curves.length && !out.points.length) return null;
      break;
    }
    case 'energy_profile':
      out.reactants = str(spec.reactants, 24) || 'Reactants';
      out.products = str(spec.products, 24) || 'Products';
      out.ea = str(spec.ea, 10) || 'Eₐ';
      out.dh = str(spec.dh, 10) || 'ΔH';
      out.exothermic = spec.exothermic !== false;
      out.catalyst = Boolean(spec.catalyst);
      break;
    case 'atom':
      out.symbol = str(spec.symbol, 4) || 'X';
      out.shells = arr(spec.shells, 5).map(n => Math.round(num(n, 0, 32, 0))).filter(n => n > 0);
      if (!out.shells.length) return null;
      break;
    case 'flow':
      out.nodes = arr(spec.nodes, 8).map(n => str(typeof n === 'object' && n ? n.label : n, 40)).filter(Boolean);
      out.cycle = Boolean(spec.cycle);
      if (out.nodes.length < 2) return null;
      break;
    case 'labelled':
      out.shape = ['cell', 'circle', 'box'].indexOf(spec.shape) !== -1 ? spec.shape : 'circle';
      out.center = str(spec.center, 30);
      out.parts = arr(spec.parts, 8).map(p => ({ name: str(p && (p.name || p.label), 24), note: str(p && p.note, 40) })).filter(p => p.name);
      if (!out.parts.length) return null;
      break;
    case 'compare': {
      const side = s => ({ title: str(s && s.title, 30), points: arr(s && s.points, 6).map(p => str(p, 60)).filter(Boolean) });
      out.left = side(spec.left);
      out.right = side(spec.right);
      if (!out.left.points.length && !out.right.points.length) return null;
      break;
    }
    case 'concept_map':
      out.center = str(spec.center, 34) || out.title || 'Topic';
      out.branches = arr(spec.branches, 6).map(b => ({ label: str(b && (b.label || b.name), 34), children: arr(b && b.children, 3).map(c => str(c, 34)).filter(Boolean) })).filter(b => b.label);
      if (!out.branches.length) return null;
      break;
    case 'geometry': {
      out.points = arr(spec.points, 10).map(p => ({ name: str(p && p.name, 4), x: num(p && p.x, -100, 100, 0), y: num(p && p.y, -100, 100, 0) })).filter(p => p.name);
      const names = out.points.map(p => p.name);
      out.segments = arr(spec.segments, 15).filter(s => Array.isArray(s) && names.indexOf(s[0]) !== -1 && names.indexOf(s[1]) !== -1).map(s => [s[0], s[1]]);
      out.angles = arr(spec.angles, 6).filter(a => a && names.indexOf(a.at) !== -1).map(a => ({ at: a.at, label: str(a.label, 10) }));
      out.labels = arr(spec.labels, 8).filter(l => l && Array.isArray(l.between) && names.indexOf(l.between[0]) !== -1 && names.indexOf(l.between[1]) !== -1).map(l => ({ between: [l.between[0], l.between[1]], text: str(l.text, 12) }));
      if (out.points.length < 2) return null;
      break;
    }
    case 'custom':
      out.items = arr(spec.items, 40).map(it => {
        if (!it || typeof it !== 'object') return null;
        const shape = ['line', 'arrow', 'circle', 'rect', 'text'].indexOf(it.shape) !== -1 ? it.shape : null;
        if (!shape) return null;
        const o = { shape, color: COLORS.indexOf(it.color) !== -1 ? it.color : 'black' };
        ['x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'x', 'y', 'w', 'h'].forEach(k => { if (it[k] !== undefined) o[k] = num(it[k], -10, 110, 0); });
        if (it.text) o.text = str(it.text, 40);
        if (it.dashed) o.dashed = true;
        return o;
      }).filter(Boolean);
      if (!out.items.length) return null;
      break;
    default:
      return null;
  }
  return out;
}

// ------------------------------------------------------------ topic library --
// Each rule: [pattern, make(text)]. A rule that returns null means "no fixed picture fits; use a concept map".
const RULES = [
  [/scattering|direction cosine|three.dimensional|\b3d\b|escape velocity|satellite|circular motion/i, () => null],
  [/magnet(?!ic waves)|induction|electromagnetic induction/i, hay => (/electromagnetic waves|em wave/i.test(hay) ? ({ type: 'wave', title: 'An electromagnetic wave', caption: 'Electric and magnetic fields oscillate at right angles to each other and to the direction of travel.', cycles: 2, second: { phase: 0, label: 'B field', perpendicular: true }, labels: { wavelength: 'λ', amplitude: 'E₀' } }) : null)],
  [/terminal velocity|viscosity|stokes/i, () => ({ type: 'forces', title: 'Ball falling through a liquid', caption: 'At terminal velocity the upward viscous force and buoyancy balance the weight.', body: 'ball', forces: [{ angle: 270, size: 1.2, label: 'mg' }, { angle: 90, size: 0.8, label: 'F viscous' }, { angle: 90, size: 0.45, label: 'buoyancy' }] })],
  [/electrostatic potential|equipotential|potential energy/i, () => ({ type: 'charges', title: 'Field of a point charge', caption: 'Field lines point straight out from +q; the potential is the same at every point on a circle around it.', charges: [{ x: 0, y: 0, q: 1, label: '+q' }], surface: { x: 0, y: 0, r: 0.45, label: 'Equipotential' } })],
  [/dipole/i, () => ({ type: 'charges', title: 'Electric dipole', caption: 'Field lines leave +q and end on −q; they are closest (field strongest) near the charges.', charges: [{ x: -0.35, y: 0, q: 1, label: '+q' }, { x: 0.35, y: 0, q: -1, label: '−q' }] })],
  [/gauss|flux/i, () => ({ type: 'charges', title: 'Gauss\'s law', caption: 'Every field line from +q crosses the closed surface once, so the flux depends only on the charge inside.', charges: [{ x: 0, y: 0, q: 1, label: '+q' }], surface: { x: 0, y: 0, r: 0.45, label: 'Closed surface' } })],
  [/coulomb|electric charge|point charge|superposition|electric field|field lines/i, () => ({ type: 'charges', title: 'Two charges and the force between them', caption: 'Unlike charges attract: field lines run from +q to −q, and the forces on them are equal and opposite.', charges: [{ x: -0.45, y: 0, q: 1, label: '+q₁' }, { x: 0.45, y: 0, q: -1, label: '−q₂' }], showForces: true })],
  [/capacit|dielectric/i, hay => ({ type: 'capacitor', title: 'Parallel-plate capacitor', caption: 'Equal and opposite charges on the plates; the field between them is uniform and points from + to −.', dielectric: /dielectric/i.test(hay) })],
  [/potentiometer|wheatstone|kirchhoff|resistor|ohm|current electricity|electric current|cells|emf|drift/i, () => ({ type: 'circuit', title: 'A simple circuit', caption: 'Current leaves the + terminal, passes through the 2 Ω resistor, then splits between the two 4 Ω resistors.', source: { kind: 'battery', label: 'E' }, series: [{ kind: 'resistor', label: 'R₁' }], parallel: [{ kind: 'resistor', label: 'R₂' }, { kind: 'resistor', label: 'R₃' }], current: 'I' })],
  [/alternating|\bac\b|lcr|reactance|impedance|transformer/i, () => ({ type: 'graph', title: 'Voltage and current in an AC circuit', caption: 'In a pure inductor the current (dashed) lags the voltage by a quarter cycle (90°).', x: { min: 0, max: 12.6, label: 'time (ωt)' }, y: { min: -1.5, max: 1.5, label: 'value' }, curves: [{ fn: 'sin(x)', label: 'V' }, { fn: 'sin(x-pi/2)', label: 'I', dashed: true }] })],
  [/lens|lenses|power of a lens|optical instrument|microscope|telescope/i, () => ({ type: 'rays', title: 'Ray diagram: convex lens', caption: 'Object beyond F: the rays meet on the other side, giving a real, inverted image.', element: 'convex_lens', f: 15, u: 25, h: 4 })],
  [/refraction|snell|total internal|prism|refractive/i, () => ({ type: 'refraction', title: 'Refraction at a surface', caption: 'Going into a denser medium the ray bends towards the normal (r < i).', n1: 1, n2: 1.5, angle: 45, labels: { top: 'Air', bottom: 'Glass' } })],
  [/mirror|reflection/i, () => ({ type: 'rays', title: 'Ray diagram: concave mirror', caption: 'Object between F and C: the image forms beyond C, real, inverted and larger.', element: 'concave_mirror', f: 15, u: 22, h: 4 })],
  [/projectile|motion in a plane|two dimension/i, () => ({ type: 'projectile', title: 'Projectile motion', caption: 'Horizontal velocity stays the same; vertical velocity becomes zero at the top (height H).', angle: 45 })],
  [/newton|laws of motion|friction|free.body|inclined|equilibrium of a particle|tension/i, () => ({ type: 'forces', title: 'Forces on a block on a slope', caption: 'Weight mg acts down; the normal force N is at right angles to the slope; friction f acts up the slope.', body: 'block', incline: 30, forces: [{ angle: 270, size: 1.2, label: 'mg' }, { angle: 120, size: 1, label: 'N' }, { angle: 30, size: 0.7, label: 'f' }] })],
  [/vector|resolution|scalar/i, () => ({ type: 'vectors', title: 'Adding two vectors', caption: 'Place B at the head of A: the resultant R goes from the tail of A to the head of B.', vectors: [{ x: 4, y: 1, label: 'A' }, { x: 1, y: 3, label: 'B' }], resultant: true })],
  [/oscillat|simple harmonic|shm|wave|sound|interference|diffraction|superposition of waves/i, () => ({ type: 'wave', title: 'A wave', caption: 'Wavelength λ is the distance between two crests; amplitude A is the height of a crest.', cycles: 2 })],
  [/motion in a straight line|kinematic|uniformly accelerated/i, () => ({ type: 'graph', title: 'Velocity-time graph', caption: 'For uniform acceleration the v-t graph is a straight line; its slope is the acceleration and the area under it is the distance.', x: { min: 0, max: 10, label: 't (s)' }, y: { min: 0, max: 30, label: 'v (m/s)' }, curves: [{ fn: '5+2*x', label: 'v = u + at' }], shade: { fn: '5+2*x', from: 0, to: 8 }, points: [{ x: 0, y: 5, label: 'u' }] })],
  [/photoelectric|dual nature|photon/i, () => ({ type: 'graph', title: 'Photoelectric effect', caption: 'No electrons below the threshold frequency ν₀; above it, the maximum kinetic energy rises in a straight line.', x: { min: 0, max: 10, label: 'frequency ν' }, y: { min: 0, max: 10, label: 'K max' }, curves: [{ fn: '1.4*(x-3)', label: 'K = hν − φ' }], points: [{ x: 3, y: 0, label: 'ν₀' }] })],
  [/radioactiv|decay|half.life/i, hay => (/kinetic|reaction|order|rate/i.test(hay)
    ? ({ type: 'graph', title: 'First-order reaction', caption: 'The concentration halves after every half-life, whatever the starting amount.', x: { min: 0, max: 4, label: 'time (half-lives)' }, y: { min: 0, max: 110, label: '[A] (%)' }, curves: [{ fn: '100*exp(-0.693*x)', label: '[A] = [A]₀e^(−kt)' }], points: [{ x: 1, y: 50, label: '50%' }, { x: 2, y: 25, label: '25%' }] })
    : ({ type: 'graph', title: 'Radioactive decay', caption: 'After every half-life, half of the remaining nuclei decay.', x: { min: 0, max: 4, label: 'time (half-lives)' }, y: { min: 0, max: 110, label: 'N (%)' }, curves: [{ fn: '100*exp(-0.693*x)', label: 'N = N₀e^(−λt)' }], points: [{ x: 1, y: 50, label: '50%' }, { x: 2, y: 25, label: '25%' }] }))],
  [/bohr|structure of atom|electronic configuration|atomic model|hydrogen|atoms/i, hay => (/hydrogen|bohr/i.test(hay)
    ? ({ type: 'atom', title: 'Bohr model of hydrogen', caption: 'The single electron moves in fixed orbits; jumping down an orbit gives out light of one colour.', symbol: 'H', shells: [1] })
    : ({ type: 'atom', title: 'Bohr model of sodium', caption: 'Electrons fill shells from the inside: 2, then 8, then the rest.', symbol: 'Na', shells: [2, 8, 1] }))],
  [/chemical kinetics|rate of (a )?reaction|rate law|activation|catalys|collision theory/i, () => ({ type: 'energy_profile', title: 'Energy during a reaction', caption: 'Molecules must climb over the activation energy Eₐ; a catalyst lowers this hill.', reactants: 'Reactants', products: 'Products', exothermic: true, catalyst: true })],
  [/enthalpy|exothermic|endothermic|thermochemi|hess/i, () => ({ type: 'energy_profile', title: 'Exothermic reaction', caption: 'Products have less energy than reactants, so the difference ΔH is given out as heat.', exothermic: true })],
  [/photosynthesis/i, () => ({ type: 'flow', title: 'Photosynthesis in steps', caption: 'Light energy is stored as chemical energy in glucose.', nodes: ['Sunlight absorbed by chlorophyll', 'Water split, O₂ released', 'ATP and NADPH made', 'CO₂ fixed (Calvin cycle)', 'Glucose formed'] })],
  [/respiration|krebs|glycolysis|calvin/i, () => ({ type: 'flow', title: 'Cellular respiration', caption: 'Glucose is broken down step by step to release energy as ATP.', nodes: ['Glucose', 'Glycolysis → pyruvate', 'Krebs cycle', 'Electron transport', 'ATP + CO₂ + H₂O'] })],
  [/dna|replication|transcription|translation|central dogma|molecular basis/i, () => ({ type: 'flow', title: 'From gene to protein', caption: 'DNA is copied into mRNA, and the mRNA code is read to build a protein.', nodes: ['DNA', 'Transcription', 'mRNA', 'Translation (ribosome)', 'Protein'] })],
  [/\bcell\b|cell structure|organelle|cell: the unit/i, () => ({ type: 'labelled', title: 'An animal cell', caption: 'Each part of the cell has its own job.', shape: 'cell', center: 'Animal cell', parts: [{ name: 'Nucleus', note: 'holds DNA, controls the cell' }, { name: 'Mitochondria', note: 'makes energy (ATP)' }, { name: 'Cell membrane', note: 'lets things in and out' }, { name: 'Ribosomes', note: 'make proteins' }, { name: 'Golgi body', note: 'packs and sends proteins' }, { name: 'ER', note: 'transport channels' }] })],
  [/quadratic|polynomial|zeroes/i, () => ({ type: 'graph', title: 'A quadratic polynomial', caption: 'The zeroes are where the curve cuts the x-axis.', x: { min: -3, max: 5, label: 'x' }, y: { min: -5, max: 6, label: 'y' }, curves: [{ fn: 'x^2-2*x-3', label: 'y = x² − 2x − 3' }], points: [{ x: -1, y: 0, label: 'x = −1' }, { x: 3, y: 0, label: 'x = 3' }, { x: 1, y: -4, label: 'vertex' }] })],
  [/trigonometr|\bsine\b|cosine/i, () => ({ type: 'graph', title: 'sin x and cos x', caption: 'Both repeat every 2π; cos x is sin x shifted left by π/2.', x: { min: 0, max: 6.3, label: 'x (radians)' }, y: { min: -1.5, max: 1.5, label: 'y' }, curves: [{ fn: 'sin(x)', label: 'sin x' }, { fn: 'cos(x)', label: 'cos x', dashed: true }] })],
  [/exponential|logarithm/i, () => ({ type: 'graph', title: 'eˣ and ln x', caption: 'ln x is the mirror image of eˣ in the line y = x.', x: { min: -3, max: 4, label: 'x' }, y: { min: -3, max: 6, label: 'y' }, curves: [{ fn: 'exp(x)', label: 'y = eˣ' }, { fn: 'ln(x)', label: 'y = ln x' }, { fn: 'x', label: 'y = x', dashed: true }] })],
  [/integra|area under|definite/i, () => ({ type: 'graph', title: 'Area under a curve', caption: 'The definite integral from 0 to 2 is the shaded area.', x: { min: -0.5, max: 3, label: 'x' }, y: { min: -0.5, max: 5, label: 'y' }, curves: [{ fn: 'x^2', label: 'y = x²' }], shade: { fn: 'x^2', from: 0, to: 2 } })],
  [/circle|tangent to a circle/i, () => ({ type: 'geometry', title: 'Tangent to a circle', caption: 'The tangent at P is at right angles to the radius OP.', points: [{ name: 'O', x: 0, y: 0 }, { name: 'P', x: 0, y: 3 }, { name: 'T', x: 4, y: 3 }], segments: [['O', 'P'], ['P', 'T']], angles: [{ at: 'P', label: '90°' }], labels: [{ between: ['O', 'P'], text: 'r' }] })],
  [/differentia|derivative|continuity|rate of change|maxima|minima|increasing|decreasing|differential equation/i, () => ({ type: 'graph', title: 'Slope of a curve', caption: 'The derivative at x = 1 is the slope of the tangent line there.', x: { min: -2, max: 3, label: 'x' }, y: { min: -1, max: 6, label: 'y' }, curves: [{ fn: 'x^2', label: 'y = x²' }], tangent: { fn: 'x^2', at: 1 }, points: [{ x: 1, y: 1, label: '(1, 1)' }] })],
  [/triangle|pythagoras|similar|coordinate geometry|heron/i, () => ({ type: 'geometry', title: 'Right-angled triangle', caption: 'AB² + AC² = BC² (Pythagoras).', points: [{ name: 'A', x: 0, y: 0 }, { name: 'B', x: 4, y: 0 }, { name: 'C', x: 0, y: 3 }], segments: [['A', 'B'], ['B', 'C'], ['C', 'A']], angles: [{ at: 'A', label: '90°' }], labels: [{ between: ['A', 'B'], text: '4 cm' }, { between: ['A', 'C'], text: '3 cm' }, { between: ['B', 'C'], text: '5 cm' }] })],
];

// Picks one diagram that explains a syllabus topic; falls back to a concept map of its sub-points.
function diagramsForTopic({ chapterName = '', topicName = '', subtopics = [] } = {}) {
  const hay = `${topicName} | ${chapterName}`;
  let picked;
  for (const [re, make] of RULES) {
    if (re.test(topicName)) { picked = make(hay); break; }
  }
  if (picked === undefined) {
    for (const [re, make] of RULES) {
      if (re.test(hay)) { picked = make(hay); break; }
    }
  }
  if (picked) return [sanitizeDiagram(picked)].filter(Boolean);
  const branches = (subtopics || []).slice(0, 5).map(s => {
    const text = String(s || '').replace(/^derivation\s*:?\s*/i, 'Derive: ');
    const at = text.indexOf(':');
    return at > 0 && at < 40 ? { label: text.slice(0, at).trim(), children: [text.slice(at + 1).trim().slice(0, 34)] } : { label: text.slice(0, 34), children: [] };
  }).filter(b => b.label);
  if (!branches.length) return [];
  return [sanitizeDiagram({ type: 'concept_map', title: 'The topic at a glance', caption: 'The main ideas of this topic and how they connect.', center: topicName.slice(0, 34), branches })].filter(Boolean);
}

module.exports = { TYPES, DIAGRAM_GUIDE, sanitizeDiagram, diagramsForTopic };
