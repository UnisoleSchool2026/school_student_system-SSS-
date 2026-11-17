/* =============================================================================
   BOARD DIAGRAMS (2026-11-17)
   Draws teaching diagrams on the Study Board from a small JSON "spec", one
   stage at a time, like a teacher drawing with markers. The same spec types
   are produced by the backend topic library and by the AI tutor
   (backend/src/services/diagramLibrary.js lists every type and field).
   Everything is computed here, so diagrams are exact: field lines are traced
   from Coulomb's law, ray diagrams use the lens/mirror formula, graphs are
   plotted from the function (safe parser, no eval).

   API: BoardDiagrams.render(spec)        -> { svg, steps }
        BoardDiagrams.mount(el, spec, step) draws into el, returns steps
        BoardDiagrams.show(el, step)       reveals stages up to step (1-based)
   ========================================================================== */
(function (global) {
  'use strict';

  var W = 640;
  var H = 400;
  var INK = { black: '#1b2a41', blue: '#1d4ed8', red: '#c81e1e', green: '#0f7a4d', gray: '#94a3b8', light: '#dbeafe', amber: '#b45309' };
  var uid = 0;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function color(name, dflt) { return INK[name] || dflt || INK.black; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function fmt(n) { var a = Math.abs(n); return (a >= 100 || Number.isInteger(n)) ? String(Math.round(n * 10) / 10) : String(Math.round(n * 100) / 100); }

  // ------------------------------------------------------------ drawing kit --
  function Pen() {
    this.steps = [];
    this.cur = null;
    this.markers = {};
  }
  Pen.prototype.step = function () { this.cur = []; this.steps.push(this.cur); return this; };
  Pen.prototype.add = function (s) { if (!this.cur) this.step(); this.cur.push(s); return this; };
  Pen.prototype.marker = function (c) {
    var id = 'bdh' + c.replace('#', '') + '_' + this.id;
    this.markers[id] = c;
    return id;
  };
  Pen.prototype.line = function (x1, y1, x2, y2, o) {
    o = o || {};
    return this.add('<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="' + (o.c || INK.black) + '" stroke-width="' + (o.w || 2.5) + '" stroke-linecap="round"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : ' pathLength="1" class="bd-draw"') + (o.head ? ' marker-end="url(#' + this.marker(o.c || INK.black) + ')"' : '') + (o.tail ? ' marker-start="url(#' + this.marker(o.c || INK.black) + ')"' : '') + '/>');
  };
  Pen.prototype.arrow = function (x1, y1, x2, y2, o) { o = o || {}; o.head = true; return this.line(x1, y1, x2, y2, o); };
  Pen.prototype.path = function (d, o) {
    o = o || {};
    return this.add('<path d="' + d + '" fill="' + (o.fill || 'none') + '"' + (o.fillOpacity ? ' fill-opacity="' + o.fillOpacity + '"' : '') + ' stroke="' + (o.c || INK.black) + '" stroke-width="' + (o.w === undefined ? 2.5 : o.w) + '" stroke-linecap="round" stroke-linejoin="round"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : (o.fill ? '' : ' pathLength="1" class="bd-draw"')) + (o.head ? ' marker-end="url(#' + this.marker(o.c || INK.black) + ')"' : '') + '/>');
  };
  Pen.prototype.circle = function (cx, cy, r, o) {
    o = o || {};
    return this.add('<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r1(r) + '" fill="' + (o.fill || 'none') + '" stroke="' + (o.c || INK.black) + '" stroke-width="' + (o.w === undefined ? 2.5 : o.w) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : (o.fill && o.fill !== 'none' ? '' : ' pathLength="1" class="bd-draw"')) + '/>');
  };
  Pen.prototype.rect = function (x, y, w, h, o) {
    o = o || {};
    return this.add('<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="' + (o.rx || 0) + '" fill="' + (o.fill || 'none') + '"' + (o.fillOpacity ? ' fill-opacity="' + o.fillOpacity + '"' : '') + ' stroke="' + (o.c || INK.black) + '" stroke-width="' + (o.w === undefined ? 2.5 : o.w) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>');
  };
  // Text in marker handwriting. Multi-line when s contains \n.
  Pen.prototype.text = function (x, y, s, o) {
    o = o || {};
    var lines = String(s == null ? '' : s).split('\n');
    var size = o.size || 17;
    var out = '<text x="' + r1(x) + '" y="' + r1(y) + '" fill="' + (o.c || INK.black) + '" font-size="' + size + '" text-anchor="' + (o.anchor || 'middle') + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + ' class="bd-text' + (o.cls ? ' ' + o.cls : '') + '">';
    lines.forEach(function (l, i) { out += '<tspan x="' + r1(x) + '" dy="' + (i ? size * 1.15 : 0) + '">' + esc(l) + '</tspan>'; });
    return this.add(out + '</text>');
  };
  Pen.prototype.dot = function (x, y, r, c) { return this.add('<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + (r || 4) + '" fill="' + (c || INK.black) + '"/>'); };
  // Double-headed dimension arrow with a label.
  Pen.prototype.dim = function (x1, y1, x2, y2, label, o) {
    o = o || {};
    this.line(x1, y1, x2, y2, { c: o.c || INK.red, w: 1.8, head: true, tail: true });
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    return this.text(mx + (o.dx || 0), my + (o.dy === undefined ? -8 : o.dy), label, { c: o.c || INK.red, size: o.size || 17, anchor: o.anchor });
  };
  Pen.prototype.svg = function () {
    var self = this;
    var defs = Object.keys(this.markers).map(function (id) {
      return '<marker id="' + id + '" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + self.markers[id] + '"/></marker>';
    }).join('');
    return '<svg class="bd-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>'
      + this.steps.map(function (g, i) { return '<g class="bd-s" data-s="' + (i + 1) + '">' + g.join('') + '</g>'; }).join('') + '</svg>';
  };

  function wrap(s, n) {
    var words = String(s || '').split(/\s+/);
    var lines = [];
    var cur = '';
    words.forEach(function (w) {
      if ((cur + ' ' + w).trim().length > n && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 4).join('\n');
  }

  // ------------------------------------------------- safe expression parser --
  var FUNCS = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp, ln: Math.log, log: function (v) { return Math.log10(v); }, asin: Math.asin, acos: Math.acos, atan: Math.atan };
  function compile(src) {
    var s = String(src || '').toLowerCase().replace(/\s+/g, '');
    var toks = [];
    var i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/[0-9.]/.test(c)) { var j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; toks.push({ t: 'n', v: parseFloat(s.slice(i, j)) }); i = j; continue; }
      if (/[a-z]/.test(c)) {
        var k = i; while (k < s.length && /[a-z]/.test(s[k])) k++;
        var w = s.slice(i, k);
        if (w === 'x') toks.push({ t: 'x' });
        else if (w === 'pi') toks.push({ t: 'n', v: Math.PI });
        else if (w === 'e') toks.push({ t: 'n', v: Math.E });
        else if (FUNCS[w]) toks.push({ t: 'f', v: w });
        else if (/^x+$/.test(w)) { for (var q = 0; q < w.length; q++) toks.push({ t: 'x' }); }
        else throw new Error('Unknown name ' + w);
        i = k; continue;
      }
      if ('+-*/^(),'.indexOf(c) !== -1) { toks.push({ t: c }); i++; continue; }
      throw new Error('Bad character ' + c);
    }
    // implicit multiplication: 2x, 2(x), x(x), )(, 2sin(x)
    var out = [];
    toks.forEach(function (t, idx) {
      var prev = out[out.length - 1];
      if (prev && (prev.t === 'n' || prev.t === 'x' || prev.t === ')') && (t.t === 'n' || t.t === 'x' || t.t === '(' || t.t === 'f')) out.push({ t: '*' });
      out.push(t);
    });
    var pos = 0;
    function peek() { return out[pos]; }
    function eat(t) { if (out[pos] && out[pos].t === t) { pos++; return true; } return false; }
    function primary() {
      var t = out[pos++];
      if (!t) throw new Error('Unexpected end');
      if (t.t === 'n') return function () { return t.v; };
      if (t.t === 'x') return function (x) { return x; };
      if (t.t === '(') { var e = expr(); if (!eat(')')) throw new Error('Missing )'); return e; }
      if (t.t === 'f') { var fn = FUNCS[t.v]; if (!eat('(')) throw new Error('Missing ('); var a = expr(); if (!eat(')')) throw new Error('Missing )'); return function (x) { return fn(a(x)); }; }
      if (t.t === '-') { var u = power(); return function (x) { return -u(x); }; }
      if (t.t === '+') return power();
      throw new Error('Unexpected ' + t.t);
    }
    function power() {
      var b = primary();
      if (eat('^')) { var ex = unary(); return function (x) { return Math.pow(b(x), ex(x)); }; }
      return b;
    }
    function unary() {
      if (eat('-')) { var u = unary(); return function (x) { return -u(x); }; }
      if (eat('+')) return unary();
      return power();
    }
    function term() {
      var a = unary();
      while (peek() && (peek().t === '*' || peek().t === '/')) {
        var op = out[pos++].t;
        var b = unary();
        a = (function (l, r, o) { return o === '*' ? function (x) { return l(x) * r(x); } : function (x) { return l(x) / r(x); }; })(a, b, op);
      }
      return a;
    }
    function expr() {
      var a = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        var op = out[pos++].t;
        var b = term();
        a = (function (l, r, o) { return o === '+' ? function (x) { return l(x) + r(x); } : function (x) { return l(x) - r(x); }; })(a, b, op);
      }
      return a;
    }
    var f = expr();
    if (pos !== out.length) throw new Error('Unexpected input');
    return f;
  }

  // ------------------------------------------------------------- templates --
  var T = {};

  // Point charges: field lines traced from Coulomb's law.
  T.charges = function (p, d) {
    var cs = (d.charges || []).filter(function (c) { return isFinite(c.x) && isFinite(c.y) && c.q; });
    var sx = function (x) { return 320 + x * 250; };
    var sy = function (y) { return 200 - y * 165; };
    var field = function (x, y) {
      var ex = 0, ey = 0;
      cs.forEach(function (c) { var dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 1e-6, r3 = r2 * Math.sqrt(r2); ex += c.q * dx / r3; ey += c.q * dy / r3; });
      return [ex, ey];
    };
    var positives = cs.filter(function (c) { return c.q > 0; });
    var sources = positives.length ? positives : cs;
    var sign = positives.length ? 1 : -1;
    p.step();
    cs.forEach(function (c) {
      p.circle(sx(c.x), sy(c.y), 17, { fill: c.q > 0 ? '#fee2e2' : '#dbeafe', c: c.q > 0 ? INK.red : INK.blue, w: 2.5 });
      p.text(sx(c.x), sy(c.y) + 7, c.q > 0 ? '+' : '−', { c: c.q > 0 ? INK.red : INK.blue, size: 24, weight: 700 });
      if (c.label) p.text(sx(c.x), sy(c.y) + 42, c.label, { c: c.q > 0 ? INK.red : INK.blue, size: 18 });
    });
    p.step();
    sources.forEach(function (c) {
      var n = Math.min(16, Math.max(8, Math.round(8 * Math.abs(c.q))));
      for (var k = 0; k < n; k++) {
        var a = (2 * Math.PI * k) / n + 0.2;
        var x = c.x + 0.07 * Math.cos(a), y = c.y + 0.07 * Math.sin(a);
        var pts = [[x, y]];
        for (var s = 0; s < 700; s++) {
          var e = field(x, y);
          var m = Math.sqrt(e[0] * e[0] + e[1] * e[1]) || 1;
          x += sign * 0.012 * e[0] / m; y += sign * 0.012 * e[1] / m;
          pts.push([x, y]);
          if (Math.abs(x) > 1.25 || Math.abs(y) > 1.25) break;
          var hit = cs.some(function (o) { return o !== c && Math.hypot(x - o.x, y - o.y) < 0.06; });
          if (hit) break;
        }
        var dpath = pts.map(function (q, i) { return (i ? 'L' : 'M') + r1(sx(q[0])) + ',' + r1(sy(q[1])); }).join('');
        p.path(dpath, { c: INK.black, w: 1.6 });
        var mid = Math.min(pts.length - 2, Math.max(1, Math.round(pts.length * 0.35)));
        if (pts.length > 4) {
          var A = pts[mid], B = pts[mid + 1];
          if (sign < 0) { var t = A; A = B; B = t; }
          p.arrow(sx(A[0]), sy(A[1]), sx(A[0]) + (sx(B[0]) - sx(A[0])) * 6, sy(A[1]) + (sy(B[1]) - sy(A[1])) * 6, { c: INK.black, w: 1.6 });
        }
      }
    });
    if (d.surface || d.showForces) p.step();
    if (d.surface) {
      p.circle(sx(d.surface.x), sy(d.surface.y), d.surface.r * 250, { c: INK.green, w: 2.5, dash: '9 7' });
      if (d.surface.label) p.text(sx(d.surface.x) + d.surface.r * 180, sy(d.surface.y) - d.surface.r * 180 - 6, d.surface.label, { c: INK.green, size: 17, anchor: 'start' });
    }
    if (d.showForces && cs.length >= 2) {
      cs.forEach(function (c, i) {
        var fx = 0, fy = 0;
        cs.forEach(function (o) { if (o === c) return; var dx = c.x - o.x, dy = c.y - o.y, r = Math.hypot(dx, dy) || 1; fx += c.q * o.q * dx / (r * r * r); fy += c.q * o.q * dy / (r * r * r); });
        var m = Math.hypot(fx, fy) || 1;
        var x0 = sx(c.x), y0 = sy(c.y) - 34;
        p.arrow(x0, y0, x0 + 70 * fx / m, y0 - 70 * fy / m, { c: INK.green, w: 3 });
        p.text(x0 + 82 * fx / m, y0 - 82 * fy / m - 6, 'F' + (i ? '₁₂' : '₂₁'), { c: INK.green, size: 18 });
      });
    }
  };

  T.capacitor = function (p, d) {
    var L = d.labels || {};
    p.step();
    p.rect(232, 80, 14, 240, { fill: '#e5e7eb', c: INK.black });
    p.rect(394, 80, 14, 240, { fill: '#e5e7eb', c: INK.black });
    p.line(239, 80, 239, 40, {}); p.line(239, 40, 160, 40, {});
    p.line(401, 80, 401, 40, {}); p.line(401, 40, 480, 40, {});
    p.text(150, 46, '+', { c: INK.red, size: 24, anchor: 'end' });
    p.text(492, 46, '−', { c: INK.blue, size: 24, anchor: 'start' });
    p.step();
    for (var i = 0; i < 6; i++) {
      p.text(222, 108 + i * 38, '+', { c: INK.red, size: 22, anchor: 'end', weight: 700 });
      p.text(420, 108 + i * 38, '−', { c: INK.blue, size: 22, anchor: 'start', weight: 700 });
    }
    p.text(200, 345, L.plus || '+Q', { c: INK.red, size: 20 });
    p.text(440, 345, L.minus || '−Q', { c: INK.blue, size: 20 });
    if (d.dielectric) {
      p.step();
      p.rect(260, 85, 120, 230, { fill: '#fde68a', fillOpacity: 0.55, c: INK.amber, w: 1.5 });
      p.text(320, 308, 'dielectric', { c: INK.amber, size: 15 });
    }
    p.step();
    for (var k = 0; k < 5; k++) p.arrow(258, 110 + k * 45, 382, 110 + k * 45, { c: INK.green, w: 2 });
    p.text(320, 72, 'E (uniform)', { c: INK.green, size: 17 });
    p.step();
    p.dim(246, 372, 394, 372, L.gap || 'd', { c: INK.black, dy: -8 });
  };

  // Circuit components drawn centred at (cx, cy), horizontal or vertical.
  function component(p, kind, cx, cy, vertical, label) {
    var rot = vertical ? ' transform="rotate(90 ' + r1(cx) + ' ' + r1(cy) + ')"' : '';
    var g = '<g' + rot + '>';
    var c = INK.black;
    g += '<rect x="' + (cx - 38) + '" y="' + (cy - 20) + '" width="76" height="40" fill="#ffffff" stroke="none"/>';
    var L = function (a, b, x2, y2, w) { return '<line x1="' + r1(a) + '" y1="' + r1(b) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="' + c + '" stroke-width="' + (w || 2.5) + '" stroke-linecap="round"/>'; };
    if (kind === 'resistor') {
      var z = 'M' + (cx - 38) + ',' + cy + ' L' + (cx - 26) + ',' + cy;
      for (var i = 0; i < 6; i++) z += ' L' + (cx - 22 + i * 8) + ',' + (cy + (i % 2 ? 10 : -10));
      z += ' L' + (cx + 26) + ',' + cy + ' L' + (cx + 38) + ',' + cy;
      g += '<path d="' + z + '" fill="none" stroke="' + c + '" stroke-width="2.5" stroke-linejoin="round"/>';
    } else if (kind === 'bulb' || kind === 'ammeter' || kind === 'voltmeter' || kind === 'ac') {
      g += L(cx - 38, cy, cx - 16, cy) + L(cx + 16, cy, cx + 38, cy);
      g += '<circle cx="' + cx + '" cy="' + cy + '" r="16" fill="#fff" stroke="' + c + '" stroke-width="2.5"/>';
      if (kind === 'bulb') g += L(cx - 11, cy - 11, cx + 11, cy + 11, 2) + L(cx - 11, cy + 11, cx + 11, cy - 11, 2);
      else if (kind === 'ac') g += '<path d="M' + (cx - 10) + ',' + cy + ' q5,-12 10,0 q5,12 10,0" fill="none" stroke="' + c + '" stroke-width="2"/>';
      else g += '<text x="' + cx + '" y="' + (cy + 6) + '" text-anchor="middle" font-size="17" class="bd-text" fill="' + c + '"' + (vertical ? ' transform="rotate(-90 ' + cx + ' ' + cy + ')"' : '') + '>' + (kind === 'ammeter' ? 'A' : 'V') + '</text>';
    } else if (kind === 'capacitor') {
      g += L(cx - 38, cy, cx - 6, cy) + L(cx + 6, cy, cx + 38, cy) + L(cx - 6, cy - 16, cx - 6, cy + 16, 3) + L(cx + 6, cy - 16, cx + 6, cy + 16, 3);
    } else if (kind === 'battery') {
      g += L(cx - 38, cy, cx - 5, cy) + L(cx + 5, cy, cx + 38, cy) + L(cx - 5, cy - 18, cx - 5, cy + 18, 3) + L(cx + 5, cy - 9, cx + 5, cy + 9, 5);
    } else if (kind === 'inductor') {
      var coil = 'M' + (cx - 38) + ',' + cy + ' L' + (cx - 24) + ',' + cy;
      for (var j = 0; j < 4; j++) coil += ' a6,9 0 1,1 12,0';
      coil += ' L' + (cx + 38) + ',' + cy;
      g += '<path d="' + coil + '" fill="none" stroke="' + c + '" stroke-width="2.5"/>';
    } else if (kind === 'switch') {
      g += L(cx - 38, cy, cx - 14, cy) + L(cx + 14, cy, cx + 38, cy) + L(cx - 14, cy, cx + 12, cy - 16) + '<circle cx="' + (cx - 14) + '" cy="' + cy + '" r="3" fill="' + c + '"/><circle cx="' + (cx + 14) + '" cy="' + cy + '" r="3" fill="' + c + '"/>';
    } else if (kind === 'diode') {
      g += L(cx - 38, cy, cx - 10, cy) + L(cx + 10, cy, cx + 38, cy) + '<path d="M' + (cx - 10) + ',' + (cy - 12) + ' L' + (cx + 10) + ',' + cy + ' L' + (cx - 10) + ',' + (cy + 12) + ' z" fill="#fff" stroke="' + c + '" stroke-width="2.5"/>' + L(cx + 10, cy - 12, cx + 10, cy + 12, 3);
    }
    g += '</g>';
    p.add(g);
    if (label) {
      if (vertical) p.text(cx + 26, cy + 6, label, { c: INK.blue, size: 17, anchor: 'start' });
      else p.text(cx, cy - 26, label, { c: INK.blue, size: 17 });
    }
  }

  T.circuit = function (p, d) {
    var left = 110, right = 540, top = 90, bottom = 320;
    var par = d.parallel || [];
    var ser = d.series || [];
    var split = par.length > 1 ? 380 : right;
    p.step();
    p.line(left, top, split, top, {});
    if (par.length > 1) { p.line(split, top, right, top, {}); p.line(split, bottom, right, bottom, {}); }
    p.line(left, bottom, split, bottom, {});
    p.line(left, top, left, bottom, {});
    if (par.length <= 1) p.line(right, top, right, bottom, {});
    component(p, d.source.kind === 'ac' ? 'ac' : 'battery', left, (top + bottom) / 2, true, d.source.label || '');
    if (d.source.kind !== 'ac') { p.text(left - 26, (top + bottom) / 2 - 18, '+', { c: INK.red, size: 20 }); p.text(left - 26, (top + bottom) / 2 + 32, '−', { c: INK.blue, size: 20 }); }
    if (ser.length) {
      p.step();
      var span = split - left - 60;
      ser.forEach(function (c, i) { component(p, c.kind, left + 60 + span * (i + 0.5) / ser.length, top, false, c.label); });
    }
    if (par.length) {
      p.step();
      if (par.length === 1) component(p, par[0].kind, right, (top + bottom) / 2, true, par[0].label);
      else {
        par.forEach(function (c, i) {
          var x = split + (right - split) * (i / (par.length - 1));
          p.line(x, top, x, bottom, {});
          component(p, c.kind, x, (top + bottom) / 2, true, c.label);
        });
        p.dot(split, top, 5); p.dot(split, bottom, 5);
      }
    }
    if (d.current) {
      p.step();
      p.arrow(left + 8, top - 24, left + 58, top - 24, { c: INK.red, w: 2.5 });
      p.text(left + 33, top - 32, d.current, { c: INK.red, size: 18 });
      if (par.length > 1) {
        p.arrow(split + 6, top + 20, split + 6, top + 56, { c: INK.red, w: 2 });
        p.text(split + 14, top + 44, d.current + '₁', { c: INK.red, size: 15, anchor: 'start' });
      }
    }
  };

  // Ray diagram for lenses and mirrors, computed with the Cartesian sign convention.
  T.rays = function (p, d) {
    var lens = /lens/.test(d.element);
    var converging = d.element === 'convex_lens' || d.element === 'concave_mirror';
    var f = d.f, uC = -d.u, h = d.h;
    var fC = lens ? (converging ? f : -f) : (converging ? -f : f);
    var v, m;
    var atInfinity = Math.abs(d.u - f) < 1e-6 && converging;
    if (lens) { v = atInfinity ? Infinity : 1 / (1 / fC + 1 / uC); m = v / uC; } else { v = atInfinity ? Infinity : 1 / (1 / fC - 1 / uC); m = -v / uC; }
    var real = lens ? v > 0 : v < 0;
    var x0 = lens ? 330 : 430, ay = 215;
    var ext = Math.max(d.u, 2 * f, isFinite(v) ? Math.min(Math.abs(v), 6 * f) : 2 * f) * 1.15;
    var sc = (lens ? 300 : 400) / ext;
    var X = function (x) { return x0 + x * sc; };
    var hs = Math.min(130 / Math.max(h, Math.abs(isFinite(m) ? m * h : h)), 26);
    var Y = function (y) { return ay - y * hs; };
    p.step();
    p.line(10, ay, 630, ay, { c: INK.gray, w: 1.5, dash: '6 5' });
    if (lens) {
      var bulge = converging ? 14 : -10;
      p.path('M' + x0 + ',' + (ay - 150) + ' Q' + (x0 + bulge * 2.2) + ',' + ay + ' ' + x0 + ',' + (ay + 150) + ' Q' + (x0 - bulge * 2.2) + ',' + ay + ' ' + x0 + ',' + (ay - 150) + ' z', { c: INK.blue, w: 2.5, fill: '#dbeafe', fillOpacity: 0.6 });
      [-1, 1].forEach(function (s) {
        p.dot(X(s * f), ay, 4, INK.black); p.text(X(s * f), ay + 24, 'F', { size: 16 });
        if (2 * f * sc < 300) { p.dot(X(s * 2 * f), ay, 4, INK.black); p.text(X(s * 2 * f), ay + 24, '2F', { size: 16 }); }
      });
    } else {
      var curve = converging ? -22 : 22;
      p.path('M' + (x0 - curve * 0.2) + ',' + (ay - 150) + ' Q' + (x0 + curve) + ',' + ay + ' ' + (x0 - curve * 0.2) + ',' + (ay + 150), { c: INK.blue, w: 3.5 });
      for (var k = -140; k <= 140; k += 20) p.line(x0 + 10 + (converging ? 6 : 14), ay + k, x0 + 22 + (converging ? 6 : 14), ay + k - 10, { c: INK.gray, w: 1.2, dash: '1 0' });
      var sgn = converging ? -1 : 1;
      p.dot(X(sgn * f), ay, 4); p.text(X(sgn * f), ay + 24, 'F', { size: 16 });
      if (2 * f * sc < 400) { p.dot(X(sgn * 2 * f), ay, 4); p.text(X(sgn * 2 * f), ay + 24, 'C', { size: 16 }); }
      p.text(x0 + 4, ay + 24, 'P', { size: 16, anchor: 'start' });
    }
    p.step();
    var ox = X(uC), oy = Y(h);
    p.arrow(ox, ay, ox, oy, { c: INK.green, w: 3.5 });
    p.text(ox, oy - 12, 'Object', { c: INK.green, size: 16 });
    var ix = isFinite(v) ? X(Math.max(-6 * f, Math.min(6 * f, v))) : null;
    var iy = isFinite(m) ? Y(m * h) : null;
    // A ray hits the lens/mirror plane at (x0, py). Lens: thin-lens deflection (exact in paraxial optics).
    // Mirror: the reflected ray passes through (or appears to come from) the image tip.
    var ray = function (py, col) {
      p.line(ox, oy, x0, py, { c: col, w: 2 });
      var dx, dy;
      if (lens) {
        var sIn = ((ay - py) - (ay - oy)) / (x0 - ox);
        var sOut = sIn - (ay - py) / (fC * sc);
        dx = 1; dy = -sOut;
      } else if (ix !== null) {
        if (real) { dx = ix - x0; dy = iy - py; } else { dx = x0 - ix; dy = py - iy; }
        if (dx > 0) { dx = -dx; dy = -dy; }
      } else {
        dx = -(x0 - ox); dy = ay - oy;
      }
      var len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      var t = 600;
      if (dx > 0) t = Math.min(t, (634 - x0) / dx); else if (dx < 0) t = Math.min(t, (6 - x0) / dx);
      if (dy > 0) t = Math.min(t, (396 - py) / dy); else if (dy < 0) t = Math.min(t, (4 - py) / dy);
      p.arrow(x0, py, x0 + dx * t, py + dy * t, { c: col, w: 2 });
      if (ix !== null && !real) p.line(x0, py, ix, iy, { c: col, w: 1.5, dash: '6 6' });
    };
    p.step(); ray(oy, INK.red);
    p.step(); ray(ay, '#7c3aed');
    if (converging && lens && d.u > f) {
      p.step();
      var fx = X(-f);
      var py3 = oy + (ay - oy) * ((x0 - ox) / (fx - ox));
      if (isFinite(py3) && Math.abs(py3 - ay) < 170) ray(py3, '#0e7490');
    }
    p.step();
    var nature;
    if (!isFinite(v)) nature = 'image at infinity (rays come out parallel)';
    else {
      p.arrow(ix, ay, ix, iy, { c: INK.amber, w: 3.5, dash: real ? null : '7 6' });
      nature = (real ? 'real, ' : 'virtual, ') + (m < 0 ? 'inverted, ' : 'erect, ') + (Math.abs(m) > 1.02 ? 'magnified' : (Math.abs(m) < 0.98 ? 'diminished' : 'same size'));
      p.text(ix, iy + (m < 0 ? 26 : -12), 'Image', { c: INK.amber, size: 16 });
    }
    p.text(320, 392, 'u = ' + fmt(uC) + ' cm, f = ' + fmt(fC) + ' cm' + (isFinite(v) ? ', v = ' + fmt(v) + ' cm, m = ' + fmt(m) : '') + ': ' + nature, { size: 15, c: INK.black });
  };

  T.refraction = function (p, d) {
    var cx = 320, cy = 200, R = 170;
    var i = d.angle * Math.PI / 180;
    var s = d.n1 * Math.sin(i) / d.n2;
    var tir = s > 1;
    var r = tir ? 0 : Math.asin(s);
    p.step();
    p.rect(20, cy, 600, 185, { fill: '#dbeafe', fillOpacity: 0.55, c: 'none', w: 0 });
    p.line(20, cy, 620, cy, { c: INK.blue, w: 2.5 });
    p.line(cx, 20, cx, 380, { c: INK.gray, w: 1.5, dash: '6 6' });
    p.text(cx + 8, 34, 'normal', { c: INK.gray, size: 15, anchor: 'start' });
    p.text(40, cy - 14, d.labels.top + ' (n = ' + d.n1 + ')', { size: 16, anchor: 'start' });
    p.text(40, cy + 30, d.labels.bottom + ' (n = ' + d.n2 + ')', { size: 16, anchor: 'start' });
    p.step();
    p.arrow(cx - R * Math.sin(i), cy - R * Math.cos(i), cx, cy, { c: INK.red, w: 3 });
    p.path('M' + cx + ',' + (cy - 60) + ' A60,60 0 0,0 ' + r1(cx - 60 * Math.sin(i)) + ',' + r1(cy - 60 * Math.cos(i)), { c: INK.red, w: 1.6 });
    p.text(cx - 28 * Math.sin(i / 2) - 8, cy - 76 * Math.cos(i / 2), 'i = ' + Math.round(d.angle) + '°', { c: INK.red, size: 16, anchor: 'end' });
    p.step();
    if (tir) {
      p.arrow(cx, cy, cx + R * Math.sin(i), cy - R * Math.cos(i), { c: INK.green, w: 3 });
      p.text(cx + 150, cy - 150, 'total internal\nreflection', { c: INK.green, size: 16, anchor: 'start' });
    } else {
      p.arrow(cx, cy, cx + R * Math.sin(r), cy + R * Math.cos(r), { c: INK.green, w: 3 });
      p.path('M' + cx + ',' + (cy + 60) + ' A60,60 0 0,0 ' + r1(cx + 60 * Math.sin(r)) + ',' + r1(cy + 60 * Math.cos(r)), { c: INK.green, w: 1.6 });
      p.text(cx + 78 * Math.sin(r) + 24, cy + 70 * Math.cos(r / 2), 'r = ' + (Math.round(r * 1800 / Math.PI) / 10) + '°', { c: INK.green, size: 16, anchor: 'start' });
      if (s > 0) p.line(cx, cy, cx + 90 * Math.sin(i), cy - 90 * Math.cos(i), { c: INK.gray, w: 1.2, dash: '3 5' });
    }
    p.step();
    p.text(470, 380, tir ? 'sin i > n₂/n₁ : no refracted ray' : 'n₁ sin i = n₂ sin r', { size: 17, c: INK.black });
  };

  T.vectors = function (p, d) {
    var vs = d.vectors || [];
    var pts = [[0, 0]];
    var sum = [0, 0];
    vs.forEach(function (v) { pts.push([v.x, v.y]); sum = [sum[0] + v.x, sum[1] + v.y]; });
    if (d.resultant) {
      var acc = [0, 0];
      vs.forEach(function (v) { acc = [acc[0] + v.x, acc[1] + v.y]; pts.push(acc.slice()); });
    }
    var mx = Math.max.apply(null, pts.map(function (q) { return Math.abs(q[0]); }).concat([1]));
    var my = Math.max.apply(null, pts.map(function (q) { return Math.abs(q[1]); }).concat([1]));
    var sc = Math.min(250 / mx, 160 / my);
    var ox = Math.min(pts.map(function (q) { return q[0]; }).reduce(function (a, b) { return Math.min(a, b); }, 0) < 0 ? 320 : 120, 320);
    var oy = pts.some(function (q) { return q[1] < 0; }) ? 200 : 340;
    var X = function (x) { return ox + x * sc; }, Y = function (y) { return oy - y * sc; };
    var cols = [INK.blue, '#7c3aed', '#0e7490', INK.amber, INK.green];
    p.step();
    p.arrow(20, oy, 625, oy, { c: INK.gray, w: 1.4 }); p.text(620, oy + 22, 'x', { c: INK.gray, size: 15 });
    p.arrow(ox, 390, ox, 12, { c: INK.gray, w: 1.4 }); p.text(ox + 12, 24, 'y', { c: INK.gray, size: 15 });
    vs.forEach(function (v, i) {
      p.step();
      var c = INK[v.color] || cols[i % cols.length];
      p.arrow(X(0), Y(0), X(v.x), Y(v.y), { c: c, w: 3 });
      p.text(X(v.x * 0.55) - 12, Y(v.y * 0.55) - 10, v.label, { c: c, size: 19, weight: 700 });
      if (d.components) {
        p.line(X(v.x), Y(v.y), X(v.x), Y(0), { c: c, w: 1.2, dash: '5 5' });
        p.line(X(v.x), Y(v.y), X(0), Y(v.y), { c: c, w: 1.2, dash: '5 5' });
        p.text(X(v.x / 2), Y(0) + 20, v.label + 'ₓ', { c: c, size: 15 });
        p.text(X(0) - 10, Y(v.y / 2) + 5, v.label + 'ᵧ', { c: c, size: 15, anchor: 'end' });
      }
    });
    if (d.resultant && vs.length > 1) {
      p.step();
      var a = [0, 0];
      vs.forEach(function (v, i) {
        if (i) p.line(X(a[0]), Y(a[1]), X(a[0] + v.x), Y(a[1] + v.y), { c: cols[i % cols.length], w: 1.8, dash: '7 6' });
        a = [a[0] + v.x, a[1] + v.y];
      });
      p.step();
      p.arrow(X(0), Y(0), X(sum[0]), Y(sum[1]), { c: INK.red, w: 3.5 });
      p.text(X(sum[0] * 0.5) + 16, Y(sum[1] * 0.5) + 22, 'R', { c: INK.red, size: 20, weight: 700 });
      p.text(320, 392, 'R = ' + vs.map(function (v) { return v.label || '?'; }).join(' + ') + ',  |R| = ' + fmt(Math.hypot(sum[0], sum[1])), { size: 15 });
    }
  };

  T.forces = function (p, d) {
    var cx = 320, cy = 200;
    var inc = d.incline || 0;
    p.step();
    if (inc > 0) {
      var a = inc * Math.PI / 180;
      var bx = 120, by = 340, ex = 540, hgt = Math.min(300, (ex - bx) * Math.tan(a));
      p.path('M' + bx + ',' + by + ' L' + ex + ',' + by + ' L' + ex + ',' + (by - hgt) + ' z', { c: INK.black, fill: '#f1f5f9' });
      p.path('M' + (bx + 50) + ',' + by + ' A50,50 0 0,0 ' + r1(bx + 50 * Math.cos(a)) + ',' + r1(by - 50 * Math.sin(a)), { c: INK.black, w: 1.5 });
      p.text(bx + 64, by - 8, Math.round(inc) + '°', { size: 16, anchor: 'start' });
      var t = 0.55;
      cx = bx + (ex - bx) * t; cy = by - hgt * t - 26;
      p.add('<rect x="' + (cx - 34) + '" y="' + (cy - 24) + '" width="68" height="48" fill="#fde68a" stroke="' + INK.black + '" stroke-width="2.5" transform="rotate(' + (-inc) + ' ' + cx + ' ' + (cy + 24 * 0) + ')"/>');
    } else if (d.body === 'ball') {
      p.circle(cx, cy, 34, { fill: '#fde68a', c: INK.black });
    } else {
      p.line(150, cy + 30, 490, cy + 30, {});
      for (var k = 160; k < 490; k += 22) p.line(k, cy + 30, k - 12, cy + 44, { c: INK.gray, w: 1.2, dash: '1 0' });
      p.rect(cx - 40, cy - 28, 80, 58, { fill: '#fde68a', c: INK.black });
    }
    var cols = [INK.red, INK.blue, INK.green, '#7c3aed', INK.amber, '#0e7490'];
    (d.forces || []).forEach(function (f, i) {
      p.step();
      var ang = f.angle * Math.PI / 180;
      var len = 85 * f.size;
      var x2 = cx + len * Math.cos(ang), y2 = cy - len * Math.sin(ang);
      p.arrow(cx, cy, x2, y2, { c: cols[i % cols.length], w: 3.2 });
      p.text(x2 + 18 * Math.cos(ang), y2 - 18 * Math.sin(ang) + 6, f.label, { c: cols[i % cols.length], size: 19, weight: 700 });
    });
  };

  T.wave = function (p, d) {
    var x0 = 70, x1 = 590, ay = 200, A = 85;
    var cyc = d.cycles || 2;
    var lam = (x1 - x0) / cyc;
    var curve = function (phase) {
      var s = '';
      for (var x = x0; x <= x1; x += 4) s += (x === x0 ? 'M' : 'L') + x + ',' + r1(ay - A * Math.sin(2 * Math.PI * (x - x0) / lam + phase));
      return s;
    };
    p.step();
    p.arrow(40, ay, 620, ay, { c: INK.gray, w: 1.4 });
    p.text(612, ay + 24, 'x', { c: INK.gray, size: 15 });
    p.step();
    p.path(curve(0), { c: INK.blue, w: 3 });
    p.step();
    var crest1 = x0 + lam / 4;
    p.dim(crest1, ay - A - 22, crest1 + lam, ay - A - 22, d.labels.wavelength, { c: INK.red, dy: -8 });
    p.line(crest1, ay - A - 4, crest1, ay - A - 30, { c: INK.red, w: 1, dash: '3 3' });
    p.line(crest1 + lam, ay - A - 4, crest1 + lam, ay - A - 30, { c: INK.red, w: 1, dash: '3 3' });
    p.text(crest1, ay - A + 28, 'crest', { size: 14, c: INK.gray });
    p.text(crest1 + lam / 2, ay + A + 24, 'trough', { size: 14, c: INK.gray });
    p.step();
    p.line(crest1, ay - A, x0 - 30, ay - A, { c: INK.green, w: 1, dash: '3 3' });
    p.dim(x0 - 30, ay, x0 - 30, ay - A, d.labels.amplitude, { c: INK.green, dx: -8, dy: 4, anchor: 'end' });
    if (d.second) {
      p.step();
      if (d.second.perpendicular) {
        // Drawn in perspective: the second field oscillates at right angles to the page.
        var ps = '';
        for (var xx = x0; xx <= x1; xx += 4) {
          var z = 0.7 * A * Math.sin(2 * Math.PI * (xx - x0) / lam - d.second.phase * Math.PI / 180);
          ps += (xx === x0 ? 'M' : 'L') + r1(xx - 0.45 * z) + ',' + r1(ay + 0.45 * z);
        }
        p.path(ps, { c: INK.green, w: 2.4 });
        p.line(x0 + 30, ay + 70, x0 - 20, ay + 120, { c: INK.gray, w: 1.2, dash: '4 4' });
      } else {
        p.path(curve(-d.second.phase * Math.PI / 180), { c: INK.green, w: 2.4, dash: '8 6' });
      }
      if (d.second.label) p.text(x1 - 10, ay - A - 6, d.second.label, { c: INK.green, size: 16, anchor: 'end' });
    }
  };

  T.projectile = function (p, d) {
    var a = d.angle * Math.PI / 180;
    var gx = 80, gy = 330;
    var Rw = 460;
    var Hh = Rw * Math.tan(a) / 4;
    if (Hh > 250) { Rw = Rw * 250 / Hh; Hh = 250; }
    var L = d.labels;
    p.step();
    p.line(30, gy, 620, gy, { c: INK.black, w: 2.5 });
    p.arrow(gx, gy, gx + 90 * Math.cos(a), gy - 90 * Math.sin(a), { c: INK.red, w: 3 });
    p.text(gx + 100 * Math.cos(a) + 8, gy - 100 * Math.sin(a), L.u, { c: INK.red, size: 19, anchor: 'start' });
    p.path('M' + (gx + 40) + ',' + gy + ' A40,40 0 0,0 ' + r1(gx + 40 * Math.cos(a)) + ',' + r1(gy - 40 * Math.sin(a)), { c: INK.red, w: 1.5 });
    p.text(gx + 52, gy - 10, 'θ', { c: INK.red, size: 17, anchor: 'start' });
    p.step();
    var s = '';
    for (var t = 0; t <= 1.0001; t += 0.02) s += (t ? 'L' : 'M') + r1(gx + Rw * t) + ',' + r1(gy - 4 * Hh * t * (1 - t));
    p.path(s, { c: INK.blue, w: 3, dash: null });
    p.step();
    p.dim(gx + Rw / 2, gy, gx + Rw / 2, gy - Hh, L.height, { c: INK.green, dx: 14, dy: 4, anchor: 'start' });
    p.step();
    p.dim(gx, gy + 28, gx + Rw, gy + 28, L.range, { c: INK.black, dy: 26 });
    p.step();
    p.arrow(gx + Rw / 2 - 2, gy - Hh - 18, gx + Rw / 2 + 70, gy - Hh - 18, { c: '#7c3aed', w: 2.5 });
    p.text(gx + Rw / 2 + 76, gy - Hh - 12, L.u + ' cos θ', { c: '#7c3aed', size: 16, anchor: 'start' });
  };

  // Rounded "nice" step for axis ticks.
  function niceStep(span) {
    var raw = span / 6;
    var pow = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / pow;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * pow;
  }

  T.graph = function (p, d) {
    var L = 72, R = 610, Tp = 24, B = 352;
    var xa = d.x, ya = d.y;
    var X = function (x) { return L + (x - xa.min) * (R - L) / (xa.max - xa.min); };
    var Y = function (y) { return B - (y - ya.min) * (B - Tp) / (ya.max - ya.min); };
    var axX = ya.min <= 0 && ya.max >= 0 ? Y(0) : B;
    var axY = xa.min <= 0 && xa.max >= 0 ? X(0) : L;
    p.step();
    var sx = niceStep(xa.max - xa.min), sy = niceStep(ya.max - ya.min);
    for (var gx = Math.ceil(xa.min / sx) * sx; gx <= xa.max + 1e-9; gx += sx) {
      p.line(X(gx), Tp, X(gx), B, { c: '#e2e8f0', w: 1, dash: '1 0' });
      if (Math.abs(gx) > 1e-9) p.text(X(gx), axX + 18, fmt(gx), { size: 12, c: INK.gray });
    }
    for (var gy = Math.ceil(ya.min / sy) * sy; gy <= ya.max + 1e-9; gy += sy) {
      p.line(L, Y(gy), R, Y(gy), { c: '#e2e8f0', w: 1, dash: '1 0' });
      if (Math.abs(gy) > 1e-9) p.text(axY - 6, Y(gy) + 4, fmt(gy), { size: 12, c: INK.gray, anchor: 'end' });
    }
    p.arrow(L - 6, axX, R + 14, axX, { c: INK.black, w: 1.8 });
    p.arrow(axY, B + 6, axY, Tp - 12, { c: INK.black, w: 1.8 });
    p.text(R + 12, axX - 10, xa.label || 'x', { size: 16, anchor: 'end' });
    p.text(axY + 10, Tp - 2, ya.label || 'y', { size: 16, anchor: 'start' });
    var sample = function (fn, from, to) {
      var segs = [], cur = [];
      var n = 360;
      for (var i = 0; i <= n; i++) {
        var x = from + (to - from) * i / n;
        var y;
        try { y = fn(x); } catch (e) { y = NaN; }
        if (!isFinite(y) || y < ya.min - (ya.max - ya.min) * 0.5 || y > ya.max + (ya.max - ya.min) * 0.5) { if (cur.length > 1) segs.push(cur); cur = []; continue; }
        cur.push([X(x), Math.max(Tp - 30, Math.min(B + 30, Y(y)))]);
      }
      if (cur.length > 1) segs.push(cur);
      return segs;
    };
    var cols = [INK.blue, INK.red, INK.green, '#7c3aed'];
    if (d.shade) {
      try {
        var fs = compile(d.shade.fn);
        p.step();
        var a = Math.max(xa.min, Math.min(d.shade.from, d.shade.to)), b = Math.min(xa.max, Math.max(d.shade.from, d.shade.to));
        var path = 'M' + r1(X(a)) + ',' + r1(axX);
        for (var i = 0; i <= 80; i++) { var xx = a + (b - a) * i / 80; var yy = fs(xx); if (isFinite(yy)) path += ' L' + r1(X(xx)) + ',' + r1(Math.max(Tp, Math.min(B, Y(yy)))); }
        path += ' L' + r1(X(b)) + ',' + r1(axX) + ' z';
        p.path(path, { fill: '#bfdbfe', fillOpacity: 0.7, c: 'none', w: 0 });
      } catch (e) { /* skip bad shade */ }
    }
    (d.curves || []).forEach(function (c, i) {
      var fn;
      try { fn = compile(c.fn); } catch (e) { return; }
      p.step();
      var col = cols[i % cols.length];
      sample(fn, xa.min, xa.max).forEach(function (seg) {
        p.path(seg.map(function (q, k) { return (k ? 'L' : 'M') + r1(q[0]) + ',' + r1(q[1]); }).join(''), { c: col, w: 3, dash: c.dashed ? '9 6' : null });
      });
      if (c.label) {
        var lx = xa.min + (xa.max - xa.min) * (0.78 - i * 0.16);
        var ly = fn(lx);
        if (isFinite(ly)) p.text(X(lx), Math.max(Tp + 14, Math.min(B - 8, Y(ly) - 12)), c.label, { c: col, size: 16 });
      }
    });
    if (d.tangent) {
      try {
        var ft = compile(d.tangent.fn);
        var x0 = d.tangent.at, y0 = ft(x0), hh = 1e-4 * Math.max(1, Math.abs(x0));
        var slope = (ft(x0 + hh) - ft(x0 - hh)) / (2 * hh);
        p.step();
        var span = (xa.max - xa.min) * 0.35;
        p.line(X(x0 - span), Y(y0 - slope * span), X(x0 + span), Y(y0 + slope * span), { c: INK.red, w: 2.2, dash: '8 6' });
        p.text(X(x0 + span), Y(y0 + slope * span) - 8, 'slope = ' + fmt(slope), { c: INK.red, size: 15, anchor: 'end' });
      } catch (e) { /* skip */ }
    }
    if ((d.points || []).length) {
      p.step();
      d.points.forEach(function (pt) {
        if (pt.x < xa.min || pt.x > xa.max || pt.y < ya.min || pt.y > ya.max) return;
        p.dot(X(pt.x), Y(pt.y), 5, INK.red);
        if (pt.label) p.text(X(pt.x) + 8, Y(pt.y) - 10, pt.label, { c: INK.red, size: 15, anchor: 'start' });
      });
    }
  };

  T.energy_profile = function (p, d) {
    var L = 80, R = 600, base = 340;
    var rY = d.exothermic ? 220 : 270, pY = d.exothermic ? 290 : 190, peak = 80;
    p.step();
    p.arrow(L, base + 10, L, 30, { c: INK.black, w: 1.8 });
    p.arrow(L - 10, base, R + 20, base, { c: INK.black, w: 1.8 });
    p.text(L - 12, 40, 'Energy', { size: 15, anchor: 'end' });
    p.text(R + 10, base + 24, 'reaction progress', { size: 15, anchor: 'end' });
    p.step();
    p.line(L + 20, rY, L + 140, rY, { c: INK.blue, w: 3 });
    p.text(L + 80, rY + 24, d.reactants, { c: INK.blue, size: 16 });
    p.line(R - 140, pY, R - 20, pY, { c: INK.green, w: 3 });
    p.text(R - 80, pY + 24, d.products, { c: INK.green, size: 16 });
    p.step();
    p.path('M' + (L + 140) + ',' + rY + ' C' + (L + 230) + ',' + rY + ' ' + (300) + ',' + peak + ' ' + 330 + ',' + peak + ' S' + (R - 230) + ',' + pY + ' ' + (R - 140) + ',' + pY, { c: INK.black, w: 3 });
    p.text(330, peak - 10, 'transition state', { size: 14, c: INK.gray });
    if (d.catalyst) {
      p.step();
      var cp = peak + 70;
      p.path('M' + (L + 140) + ',' + rY + ' C' + (L + 230) + ',' + rY + ' ' + 300 + ',' + cp + ' ' + 330 + ',' + cp + ' S' + (R - 230) + ',' + pY + ' ' + (R - 140) + ',' + pY, { c: INK.green, w: 2.4, dash: '8 6' });
      p.text(380, cp + 10, 'with catalyst', { c: INK.green, size: 15, anchor: 'start' });
    }
    p.step();
    p.dim(L + 160, rY, L + 160, peak + 4, d.ea, { c: INK.red, dx: -10, anchor: 'end', dy: 4 });
    p.step();
    p.line(L + 140, rY, R - 120, rY, { c: INK.gray, w: 1, dash: '4 4' });
    p.dim(R - 110, rY, R - 110, pY, d.dh + (d.exothermic ? ' (−)' : ' (+)'), { c: '#7c3aed', dx: 10, anchor: 'start', dy: 4 });
  };

  T.atom = function (p, d) {
    var cx = 300, cy = 200;
    var n = d.shells.length;
    var gap = Math.min(42, 170 / (n + 0.6));
    var names = ['K', 'L', 'M', 'N', 'O'];
    p.step();
    p.circle(cx, cy, 30, { fill: '#fee2e2', c: INK.red });
    p.text(cx, cy + 7, d.symbol, { c: INK.red, size: 20, weight: 700 });
    d.shells.forEach(function (e, i) {
      p.step();
      var r = 30 + gap * (i + 1);
      p.circle(cx, cy, r, { c: INK.blue, w: 1.8 });
      for (var k = 0; k < e; k++) {
        var a = (2 * Math.PI * k) / e - Math.PI / 2 + i * 0.3;
        p.dot(cx + r * Math.cos(a), cy + r * Math.sin(a), 6, INK.blue);
      }
      p.text(cx + 30 + gap * n + 40, 70 + i * 30, (names[i] || 'shell ' + (i + 1)) + ' shell: ' + e + ' e⁻', { size: 17, anchor: 'start', c: INK.blue });
    });
  };

  function boxText(p, x, y, w, h, text, o) {
    o = o || {};
    p.rect(x, y, w, h, { rx: 12, fill: o.fill || '#ffffff', c: o.c || INK.blue, w: 2.2 });
    var t = wrap(text, Math.max(8, Math.floor(w / 9.5)));
    var lines = t.split('\n').length;
    p.text(x + w / 2, y + h / 2 - (lines - 1) * 9 + 6, t, { size: o.size || 16, c: o.tc || INK.black });
  }

  T.flow = function (p, d) {
    var n = d.nodes.length;
    if (d.cycle) {
      var cx = 320, cy = 200, rx = 225, ry = 140;
      var pos = d.nodes.map(function (_, i) { var a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
      pos.forEach(function (q, i) {
        p.step();
        boxText(p, q[0] - 75, q[1] - 28, 150, 56, d.nodes[i], { fill: i === 0 ? '#dbeafe' : '#fff' });
        var nx = pos[(i + 1) % n];
        var a1 = Math.atan2(nx[1] - q[1], nx[0] - q[0]);
        var sx = q[0] + Math.cos(a1) * 70, sy = q[1] + Math.sin(a1) * 32, ex = nx[0] - Math.cos(a1) * 70, ey = nx[1] - Math.sin(a1) * 32;
        var mx = (sx + ex) / 2 + (cx - (sx + ex) / 2) * -0.15, my = (sy + ey) / 2 + (cy - (sy + ey) / 2) * -0.15;
        p.path('M' + r1(sx) + ',' + r1(sy) + ' Q' + r1(mx) + ',' + r1(my) + ' ' + r1(ex) + ',' + r1(ey), { c: INK.red, w: 2.2, head: true });
      });
      return;
    }
    var perRow = n <= 4 ? n : Math.ceil(n / 2);
    var rows = Math.ceil(n / perRow);
    var bw = Math.min(150, (600 - (perRow - 1) * 36) / perRow), bh = 64;
    var rowY = rows === 1 ? [168] : [80, 250];
    var place = function (i) {
      var row = Math.floor(i / perRow), col = i % perRow;
      if (row % 2 === 1) col = perRow - 1 - col;
      var total = perRow * bw + (perRow - 1) * 36;
      return [20 + (600 - total) / 2 + col * (bw + 36), rowY[row]];
    };
    d.nodes.forEach(function (t, i) {
      p.step();
      var q = place(i);
      boxText(p, q[0], q[1], bw, bh, (i + 1) + '. ' + t, { fill: i === 0 ? '#dbeafe' : (i === n - 1 ? '#dcfce7' : '#fff') });
      if (i < n - 1) {
        var nq = place(i + 1);
        if (Math.abs(nq[1] - q[1]) < 1) {
          var dir = nq[0] > q[0] ? 1 : -1;
          p.arrow(dir > 0 ? q[0] + bw + 4 : q[0] - 4, q[1] + bh / 2, dir > 0 ? nq[0] - 4 : nq[0] + bw + 4, nq[1] + bh / 2, { c: INK.red, w: 2.4 });
        } else {
          p.arrow(q[0] + bw / 2, q[1] + bh + 4, nq[0] + bw / 2, nq[1] - 4, { c: INK.red, w: 2.4 });
        }
      }
    });
  };

  T.labelled = function (p, d) {
    var cx = 320, cy = 200;
    p.step();
    if (d.shape === 'cell') {
      p.path('M' + (cx - 120) + ',' + cy + ' C' + (cx - 125) + ',' + (cy - 110) + ' ' + (cx + 110) + ',' + (cy - 125) + ' ' + (cx + 122) + ',' + (cy - 10) + ' C' + (cx + 130) + ',' + (cy + 105) + ' ' + (cx - 100) + ',' + (cy + 120) + ' ' + (cx - 120) + ',' + cy + ' z', { c: INK.green, w: 3, fill: '#dcfce7' });
      p.circle(cx - 10, cy - 5, 34, { fill: '#c7d2fe', c: INK.blue });
      p.dot(cx - 10, cy - 5, 7, INK.blue);
      p.add('<ellipse cx="' + (cx + 62) + '" cy="' + (cy + 45) + '" rx="26" ry="12" fill="#fecaca" stroke="' + INK.red + '" stroke-width="2"/>');
      [[cx - 70, cy + 50], [cx + 40, cy - 70], [cx - 60, cy - 60], [cx + 80, cy - 20]].forEach(function (q) { p.dot(q[0], q[1], 3.5, INK.black); });
      p.path('M' + (cx + 20) + ',' + (cy + 60) + ' q15,-12 30,0 q15,12 30,0', { c: '#7c3aed', w: 2 });
    } else if (d.shape === 'box') {
      p.rect(cx - 110, cy - 70, 220, 140, { rx: 14, fill: '#e0f2fe', c: INK.blue });
    } else {
      p.circle(cx, cy, 110, { fill: '#e0f2fe', c: INK.blue });
    }
    if (d.center) p.text(cx, d.shape === 'cell' ? cy + 104 : cy + 6, d.center, { size: 17, weight: 700 });
    var parts = d.parts;
    parts.forEach(function (pt, i) {
      p.step();
      var leftSide = i % 2 === 0;
      var row = Math.floor(i / 2);
      var rowsPerSide = Math.ceil(parts.length / 2);
      var ty = 70 + row * (260 / Math.max(1, rowsPerSide - 1 || 1));
      if (rowsPerSide === 1) ty = 200;
      var tx = leftSide ? 22 : 618;
      var a = Math.atan2(ty - cy, (leftSide ? -1 : 1) * 170);
      var ex = cx + 112 * Math.cos(a), ey = cy + 92 * Math.sin(a);
      p.line(leftSide ? tx + 150 : tx - 150, ty - 4, ex, ey, { c: INK.gray, w: 1.5 });
      p.dot(ex, ey, 4, INK.red);
      p.text(tx, ty - 8, pt.name, { size: 16, weight: 700, anchor: leftSide ? 'start' : 'end', c: INK.blue });
      if (pt.note) p.text(tx, ty + 12, pt.note, { size: 13, anchor: leftSide ? 'start' : 'end', c: INK.black });
    });
  };

  T.compare = function (p, d) {
    p.step();
    p.rect(20, 20, 290, 360, { rx: 14, fill: '#eff6ff', c: INK.blue });
    p.rect(330, 20, 290, 360, { rx: 14, fill: '#f0fdf4', c: INK.green });
    p.text(165, 52, d.left.title, { size: 19, weight: 700, c: INK.blue });
    p.text(475, 52, d.right.title, { size: 19, weight: 700, c: INK.green });
    var rows = Math.max(d.left.points.length, d.right.points.length);
    var gap = Math.min(62, 300 / Math.max(rows, 1));
    for (var i = 0; i < rows; i++) {
      p.step();
      if (d.left.points[i]) p.text(36, 90 + i * gap, '• ' + wrap(d.left.points[i], 28), { size: 14, anchor: 'start' });
      if (d.right.points[i]) p.text(346, 90 + i * gap, '• ' + wrap(d.right.points[i], 28), { size: 14, anchor: 'start' });
    }
  };

  T.concept_map = function (p, d) {
    var cx = 320, cy = 200;
    p.step();
    p.add('<ellipse cx="' + cx + '" cy="' + cy + '" rx="96" ry="40" fill="#dbeafe" stroke="' + INK.blue + '" stroke-width="2.5"/>');
    p.text(cx, cy + 6 - (wrap(d.center, 18).split('\n').length - 1) * 9, wrap(d.center, 18), { size: 16, weight: 700 });
    var n = d.branches.length;
    d.branches.forEach(function (b, i) {
      p.step();
      var a = -Math.PI / 2 + (2 * Math.PI * i) / n + (n % 2 === 0 ? Math.PI / n : 0);
      var bx = cx + 225 * Math.cos(a), by = cy + 140 * Math.sin(a);
      bx = Math.max(95, Math.min(545, bx)); by = Math.max(40, Math.min(352, by));
      p.line(cx + 96 * Math.cos(a), cy + 40 * Math.sin(a), bx - 60 * Math.cos(a), by - 26 * Math.sin(a), { c: INK.red, w: 2 });
      boxText(p, bx - 82, by - 24, 164, 48, b.label, { size: 14, c: INK.red });
      if (b.children && b.children.length) p.text(bx, by + 40, wrap(b.children.join('; '), 26), { size: 12, c: INK.black });
    });
  };

  T.geometry = function (p, d) {
    var ps = d.points;
    var xs = ps.map(function (q) { return q.x; }), ys = ps.map(function (q) { return q.y; });
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
    var sc = Math.min(460 / Math.max(maxx - minx, 1e-6), 300 / Math.max(maxy - miny, 1e-6));
    var ox = 320 - ((minx + maxx) / 2) * sc, oy = 200 + ((miny + maxy) / 2) * sc;
    var P = {};
    ps.forEach(function (q) { P[q.name] = [ox + q.x * sc, oy - q.y * sc]; });
    var gcx = ps.reduce(function (s, q) { return s + P[q.name][0]; }, 0) / ps.length;
    var gcy = ps.reduce(function (s, q) { return s + P[q.name][1]; }, 0) / ps.length;
    p.step();
    d.segments.forEach(function (s) { p.line(P[s[0]][0], P[s[0]][1], P[s[1]][0], P[s[1]][1], { c: INK.blue, w: 3 }); });
    p.step();
    ps.forEach(function (q) {
      var a = Math.atan2(P[q.name][1] - gcy, P[q.name][0] - gcx);
      p.dot(P[q.name][0], P[q.name][1], 4.5, INK.black);
      p.text(P[q.name][0] + 20 * Math.cos(a), P[q.name][1] + 20 * Math.sin(a) + 6, q.name, { size: 19, weight: 700 });
    });
    if (d.angles.length) p.step();
    d.angles.forEach(function (an) {
      var v = P[an.at];
      var nb = d.segments.filter(function (s) { return s[0] === an.at || s[1] === an.at; }).map(function (s) { return P[s[0] === an.at ? s[1] : s[0]]; }).slice(0, 2);
      if (nb.length < 2) return;
      var a1 = Math.atan2(nb[0][1] - v[1], nb[0][0] - v[0]), a2 = Math.atan2(nb[1][1] - v[1], nb[1][0] - v[0]);
      if (/90/.test(an.label)) {
        var u1 = [Math.cos(a1) * 18, Math.sin(a1) * 18], u2 = [Math.cos(a2) * 18, Math.sin(a2) * 18];
        p.path('M' + r1(v[0] + u1[0]) + ',' + r1(v[1] + u1[1]) + ' L' + r1(v[0] + u1[0] + u2[0]) + ',' + r1(v[1] + u1[1] + u2[1]) + ' L' + r1(v[0] + u2[0]) + ',' + r1(v[1] + u2[1]), { c: INK.red, w: 2 });
      } else {
        var diff = a2 - a1; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
        p.path('M' + r1(v[0] + 28 * Math.cos(a1)) + ',' + r1(v[1] + 28 * Math.sin(a1)) + ' A28,28 0 0,' + (diff > 0 ? 1 : 0) + ' ' + r1(v[0] + 28 * Math.cos(a2)) + ',' + r1(v[1] + 28 * Math.sin(a2)), { c: INK.red, w: 2 });
      }
      var am = a1 + (function () { var df = a2 - a1; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI; return df / 2; })();
      p.text(v[0] + 46 * Math.cos(am), v[1] + 46 * Math.sin(am) + 5, an.label, { c: INK.red, size: 15 });
    });
    if (d.labels.length) p.step();
    d.labels.forEach(function (l) {
      var A = P[l.between[0]], Bp = P[l.between[1]];
      var mx = (A[0] + Bp[0]) / 2, my = (A[1] + Bp[1]) / 2;
      var a = Math.atan2(my - gcy, mx - gcx);
      p.text(mx + 20 * Math.cos(a), my + 20 * Math.sin(a) + 5, l.text, { c: INK.green, size: 16 });
    });
  };

  T.custom = function (p, d) {
    var X = function (v) { return v * 6.4; }, Y = function (v) { return v * 4; };
    var per = Math.max(1, Math.ceil(d.items.length / 6));
    d.items.forEach(function (it, i) {
      if (i % per === 0) p.step();
      var c = INK[it.color] || INK.black;
      if (it.shape === 'line' || it.shape === 'arrow') p.line(X(it.x1), Y(it.y1), X(it.x2), Y(it.y2), { c: c, head: it.shape === 'arrow', dash: it.dashed ? '7 6' : null });
      else if (it.shape === 'circle') p.circle(X(it.cx), Y(it.cy), it.r * 4, { c: c, dash: it.dashed ? '7 6' : null });
      else if (it.shape === 'rect') p.rect(X(it.x), Y(it.y), X(it.w), Y(it.h), { c: c, rx: 6 });
      else if (it.shape === 'text') p.text(X(it.x), Y(it.y), it.text || '', { c: c, size: 16 });
    });
  };

  // --------------------------------------------------------------- public --
  function render(spec) {
    var p = new Pen();
    p.id = (++uid).toString(36);
    if (!spec || !T[spec.type]) return { svg: '', steps: 0 };
    try {
      T[spec.type](p, spec);
    } catch (e) {
      if (global.console) console.warn('[BOARD DIAGRAM] Could not draw', spec.type, '-', e && e.message);
      return { svg: '', steps: 0 };
    }
    return { svg: p.svg(), steps: p.steps.length };
  }

  function show(el, step) {
    if (!el) return;
    var groups = el.querySelectorAll('.bd-s');
    for (var i = 0; i < groups.length; i++) {
      var n = Number(groups[i].getAttribute('data-s'));
      groups[i].classList.toggle('on', n <= step);
    }
    el.setAttribute('data-step', String(step));
  }

  function mount(el, spec, step) {
    if (!el) return 0;
    var out = render(spec);
    if (!out.svg) { el.innerHTML = ''; return 0; }
    el.innerHTML = out.svg;
    // Let the browser lay out the hidden state first, so newly shown parts animate.
    var target = step === undefined ? out.steps : step;
    global.requestAnimationFrame ? global.requestAnimationFrame(function () { show(el, target); }) : show(el, target);
    return out.steps;
  }

  global.BoardDiagrams = { render: render, mount: mount, show: show, compile: compile, types: Object.keys(T) };
})(window);
