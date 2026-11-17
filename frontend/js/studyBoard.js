/* =============================================================================
   STUDY BOARD (2026-11-17)
   A classroom-style whiteboard with a live voice teacher (it replaces the old
   AI Voice Smartboard tab).
     Learn     - a topic written on the board one line at a time: why it matters,
                 the idea in simple words, diagrams drawn step by step, worked
                 examples, common mistakes, check-yourself.
                 "Explain with voice": a human-sounding teacher (Gemini Live,
                 js/liveTutor.js) explains each part aloud in English, Hindi or
                 Hinglish while the board writes; the student can interrupt any
                 time by speaking or typing, and the teacher answers, can draw a
                 diagram or write on the board, then carries on. Falls back to
                 the school's neural read-aloud voices if live voice is down.
                 Diagrams: js/boardDiagrams.js.
     Doubt     - type a question or add a photo; it is worked out line by line,
                 or a similar solved question is shown; one tap sends it to the
                 subject teacher (students)
     Practice  - one question at a time with hints revealed step by step
     Present   - full-screen classroom mode (teachers project it; arrow keys)
     Notes     - print or save the whole lesson; mark a topic as understood
   Backend: /api/study-board/* (routes/studyBoard.js). Uses window.UnisoleKit.
   ========================================================================== */
(function (global) {
  'use strict';
  var K = global.UnisoleKit;
  if (!K) return;
  var esc = K.esc;

  // One board per role container.
  var boards = {};
  function make(roleName, hostId) {
    return {
      role: roleName, hostId: hostId, mode: 'learn', catalog: null, understood: [],
      subjectKey: '', chapterId: '', topicId: '',
      lesson: null, frame: 0, line: 0, showAll: false,
      practice: null, session: { tried: 0, correct: 0 }, seen: [],
      doubt: null, doubtStep: 0, doubtImage: null,
      lang: savedPref('lang', 'hinglish'), gender: savedPref('gender', 'female'),
      v: null // voice teacher state (see "voice teacher" below)
    };
  }
  function savedPref(key, dflt) { try { return global.localStorage.getItem('sb_' + key) || dflt; } catch (e) { return dflt; } }
  function savePref(key, val) { try { global.localStorage.setItem('sb_' + key, val); } catch (e) { /* private mode */ } }
  function who(b) {
    return b.role === 'student' ? { studentId: K.student().id } : { teacherSubjectKey: K.teacher().subjectKey };
  }
  function qs(obj) {
    return Object.keys(obj).filter(function (k) { return obj[k] !== undefined && obj[k] !== null && obj[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }).join('&');
  }
  function host(b) { return K.byId(b.hostId); }
  function stage(b) { var h = host(b); return h ? h.querySelector('.sb-stage') : null; }
  function focusBoard(b) { var h = host(b); var el = h ? h.querySelector('.sb-board') : null; if (el) el.focus({ preventScroll: true }); }
  function $(b, sel) { var h = host(b); return h ? h.querySelector(sel) : null; }
  function subject(b) { return ((b.catalog && b.catalog.subjects) || []).find(function (s) { return s.key === b.subjectKey; }) || null; }
  function chapter(b) { var s = subject(b); return s ? s.chapters.find(function (c) { return c.id === b.chapterId; }) || null : null; }
  function topic(b) { var c = chapter(b); return c ? c.topics.find(function (t) { return t.id === b.topicId; }) || null : null; }

  // ================================================================ shell --
  function open(roleName) {
    var hostId = roleName === 'student' ? 'studyBoardStudent' : 'studyBoardTeacher';
    var b = boards[roleName] || (boards[roleName] = make(roleName, hostId));
    var h = host(b);
    if (!h) return;
    if (b.role === 'teacher' && !K.teacher().subjectKey) { h.innerHTML = K.empty('log-in', 'Sign in as a teacher', 'The Study Board opens after you sign in.'); K.icons(); return; }
    if (b.catalog && b.ownerKey === JSON.stringify(who(b))) { render(b); return; }
    h.innerHTML = '<div class="glass-card sb-card">' + K.loading('Setting up the board...') + '</div>';
    K.api('/api/study-board/catalog?' + qs(who(b))).then(function (c) {
      b.catalog = c; b.understood = c.understood || []; b.ownerKey = JSON.stringify(who(b));
      var s = c.subjects[0];
      b.subjectKey = s ? s.key : '';
      b.chapterId = s && s.chapters[0] ? s.chapters[0].id : '';
      b.topicId = '';
      b.lesson = null; b.practice = null; b.doubt = null;
      render(b);
    }).catch(function (err) { h.innerHTML = '<div class="glass-card sb-card">' + K.errorBox(err) + '</div>'; });
  }

  function render(b) {
    var h = host(b);
    if (!h) return;
    var modes = [{ key: 'learn', label: 'Learn a topic' }].concat(b.role === 'student' ? [{ key: 'doubt', label: 'Solve my doubt' }] : []).concat([{ key: 'practice', label: 'Practice with hints' }]);
    h.innerHTML = '<div class="glass-card sb-card">'
      + '<div class="sb-top"><div><h2 class="sb-title">Study Board</h2><p class="sb-sub">' + (b.role === 'student' ? 'Learn a topic step by step, get a doubt worked out, or practise with hints.' : 'Teach a topic on the board in class. Use Present for full screen and the arrow keys to move.') + '</p></div>'
      + '<div class="sb-top-actions">'
      + '<label class="sb-mini"><span>Teacher speaks</span><select class="form-select" data-sb-pref="lang" aria-label="Language of the teacher\'s voice and doubt answers">'
      + [['hinglish', 'Hinglish'], ['en', 'English'], ['hi', 'हिंदी (Hindi)']].map(function (o) { return '<option value="' + o[0] + '"' + (b.lang === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'
      + '<label class="sb-mini"><span>Voice</span><select class="form-select" data-sb-pref="gender" aria-label="Teacher\'s voice">'
      + [['female', 'Female teacher'], ['male', 'Male teacher']].map(function (o) { return '<option value="' + o[0] + '"' + (b.gender === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'
      + '<button type="button" class="btn-secondary sb-present" data-sb="present"><i data-lucide="maximize" aria-hidden="true"></i> ' + (b.role === 'teacher' ? 'Present' : 'Full screen') + '</button></div></div>'
      + '<div class="shell-segmented sb-modes" role="tablist">' + modes.map(function (m) { return '<button type="button" role="tab" aria-selected="' + (m.key === b.mode) + '" class="' + (m.key === b.mode ? 'is-active' : '') + '" data-sb-mode="' + m.key + '">' + m.label + '</button>'; }).join('') + '</div>'
      + '<div class="sb-picker" id="' + b.hostId + '_picker"></div>'
      + '<div class="sb-board" id="' + b.hostId + '_board" tabindex="0" aria-label="Study board">'
      + '<button type="button" class="sb-exit" data-sb="exit-full"><i data-lucide="minimize" aria-hidden="true"></i> Exit full screen</button>'
      + '<div class="sb-stage"></div></div>'
      + '</div>';
    h.querySelectorAll('[data-sb-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () { voiceStop(b); b.mode = btn.getAttribute('data-sb-mode'); render(b); });
    });
    h.querySelectorAll('[data-sb-pref]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var key = sel.getAttribute('data-sb-pref');
        b[key] = sel.value;
        savePref(key, sel.value);
        if (b.v && b.v.on) K.toast('The new ' + (key === 'lang' ? 'language' : 'voice') + ' is used from the next time you start the voice.', 'info');
      });
    });
    $(b, '[data-sb="present"]').addEventListener('click', function () { present(b); });
    $(b, '[data-sb="exit-full"]').addEventListener('click', function () { present(b); });
    var boardEl = $(b, '.sb-board');
    boardEl.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'Escape' && boardEl.classList.contains('sb-max')) { boardEl.classList.remove('sb-max'); return; }
      // A focused button keeps its own Enter / Space behaviour; the arrow keys always move the lesson.
      if ((e.key === 'Enter' || e.key === ' ') && /^(BUTTON|A|SUMMARY)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') { var n = boardEl.querySelector('[data-sb="next"]:not([disabled])'); if (n) { e.preventDefault(); n.click(); } }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { var p = boardEl.querySelector('[data-sb="back"]:not([disabled])'); if (p) { e.preventDefault(); p.click(); } }
    });
    renderPicker(b);
    if (b.mode === 'learn') renderLearn(b); else if (b.mode === 'doubt') renderDoubt(b); else renderPractice(b);
    K.icons();
  }

  function present(b) {
    var el = $(b, '.sb-board');
    if (!el) return;
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (el.classList.contains('sb-max')) { el.classList.remove('sb-max'); return; }
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) { try { var p = req.call(el); if (p && p.catch) p.catch(function () { el.classList.toggle('sb-max'); }); } catch (e) { el.classList.toggle('sb-max'); } } else { el.classList.toggle('sb-max'); }
    el.focus();
  }

  // =============================================================== picker --
  function renderPicker(b) {
    var box = K.byId(b.hostId + '_picker');
    if (!box) return;
    var subs = (b.catalog && b.catalog.subjects) || [];
    if (!subs.length) { box.innerHTML = '<p class="cd-meta">No syllabus is loaded for your class yet.</p>'; return; }
    var s = subject(b) || subs[0];
    var c = chapter(b) || s.chapters[0];
    var grades = Array.from(new Set(s.chapters.map(function (x) { return x.grade; }).filter(Boolean)));
    var chapterOpts = grades.length > 1
      ? grades.sort().reverse().map(function (g) { return '<optgroup label="Class ' + esc(g) + '">' + s.chapters.filter(function (x) { return x.grade === g; }).map(chOpt).join('') + '</optgroup>'; }).join('')
      : s.chapters.map(chOpt).join('');
    function chOpt(x) { return '<option value="' + esc(x.id) + '"' + (x.id === c.id ? ' selected' : '') + '>' + esc(x.chapterNumber + '. ' + x.chapterName) + '</option>'; }
    var done = c.topics.filter(function (t) { return b.understood.indexOf(t.id) !== -1; }).length;
    var needTopic = b.mode === 'learn';
    box.innerHTML = (b.mode === 'doubt' ? '' : '<div class="sb-pick-row">'
      + field(b, 'subject', 'Subject', '<select class="form-select" data-sb-pick="subject">' + subs.map(function (x) { return '<option value="' + esc(x.key) + '"' + (x.key === s.key ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>')
      + field(b, 'chapter', 'Chapter', '<select class="form-select" data-sb-pick="chapter">' + chapterOpts + '</select>')
      + field(b, 'topic', 'Topic', '<select class="form-select" data-sb-pick="topic">' + (needTopic ? '<option value="">Choose a topic</option>' : '<option value="">Whole chapter</option>')
        + c.topics.map(function (t) { return '<option value="' + esc(t.id) + '"' + (t.id === b.topicId ? ' selected' : '') + '>' + esc(t.topicName) + (b.understood.indexOf(t.id) !== -1 ? ' (understood)' : (t.highYield ? ' (important)' : '')) + '</option>'; }).join('') + '</select>')
      + '<button type="button" class="btn-primary sb-go" data-sb="go">' + (b.mode === 'learn' ? 'Start lesson' : 'Start practice') + '</button>'
      + '</div>'
      + (b.role === 'student' && b.mode === 'learn' ? '<p class="sb-progress"><span class="sb-progress-bar"><span style="width:' + (c.topics.length ? Math.round(done / c.topics.length * 100) : 0) + '%"></span></span>' + done + ' of ' + c.topics.length + ' topics in this chapter marked understood</p>' : ''));
    box.querySelectorAll('[data-sb-pick]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var kind = sel.getAttribute('data-sb-pick');
        if (kind === 'subject') { b.subjectKey = sel.value; b.chapterId = subject(b).chapters[0] ? subject(b).chapters[0].id : ''; b.topicId = ''; }
        if (kind === 'chapter') { b.chapterId = sel.value; b.topicId = ''; }
        if (kind === 'topic') b.topicId = sel.value;
        voiceStop(b);
        renderPicker(b);
        K.icons();
      });
    });
    var go = box.querySelector('[data-sb="go"]');
    if (go) go.addEventListener('click', function () { if (b.mode === 'learn') startLesson(b); else startPractice(b, true); });
  }
  function field(b, key, label, control) {
    var id = b.hostId + '_' + key;
    return '<div class="sb-field"><label for="' + id + '">' + label + '</label>' + control.replace('<select ', '<select id="' + id + '" ') + '</div>';
  }

  // ================================================================ lines --
  // Syllabus text is plain (Unicode) writing; only strings that carry LaTeX go through the maths renderer.
  function tx(v) { v = String(v == null ? '' : v); return /[$\\]|\[\[figure:/.test(v) ? K.latex(v) : esc(v); }
  function lineHtml(l) {
    if (l.t === 'term') return '<p class="sb-line"><span class="sb-term">' + esc(l.term) + '</span><span class="sb-arrow" aria-hidden="true">&rarr;</span> ' + tx(l.v) + '</p>';
    if (l.t === 'note') return '<p class="sb-line sb-note">' + tx(l.v) + '</p>';
    if (l.t === 'derive') return '<p class="sb-line sb-derive"><span class="sb-tag">Derive</span> ' + tx(l.v) + '</p>';
    if (l.t === 'question') return '<div class="sb-line sb-question">' + tx(l.v) + '</div>';
    if (l.t === 'options') return '<div class="sb-line sb-options">' + l.options.map(function (o) { return '<span><b>(' + esc(o.key) + ')</b> ' + K.latex(o.latex) + '</span>'; }).join('') + '</div>';
    if (l.t === 'work') return '<div class="sb-line sb-work"><span class="sb-num">' + esc(l.n) + '</span><div>' + tx(l.v) + '</div></div>';
    if (l.t === 'answer') return '<p class="sb-line sb-answer">' + tx(l.v) + '</p>';
    if (l.t === 'mistake') return '<p class="sb-line sb-mistake"><span class="sb-tag sb-tag-red">Careful</span> ' + tx(l.v) + '</p>';
    if (l.t === 'hint') return '<p class="sb-line sb-hint"><span class="sb-tag">Hint ' + esc(l.n) + '</span> ' + tx(l.v) + '</p>';
    if (l.t === 'heading') return '<h4 class="sb-line sb-h4">' + esc(l.v) + '</h4>';
    if (l.t === 'small') return '<p class="sb-line sb-small">' + esc(l.v) + '</p>';
    return '<p class="sb-line sb-point">' + tx(l.v) + '</p>';
  }
  // opts: { figure: diagram spec, figPrev: stages already shown, figStep: stages to show,
  //         aside: html shown above the text (a doubt being answered), ask: show the "ask a doubt" bar }
  function boardShell(b, title, counter, inner, controls, opts) {
    var el = stage(b);
    if (!el) return null;
    opts = opts || {};
    var fig = opts.figure && global.BoardDiagrams ? opts.figure : null;
    el.innerHTML = '<div class="sb-board-head"><h3>' + esc(title) + '</h3>' + (counter ? '<span class="sb-counter">' + esc(counter) + '</span>' : '') + '</div>'
      + '<div class="sb-surface' + (fig ? ' sb-split' : '') + '"><div class="sb-text">' + (opts.aside || '') + inner + '</div>'
      + (fig ? '<figure class="sb-figure"><div class="sb-fig-svg"></div><figcaption>' + (fig.title ? '<b>' + esc(fig.title) + '</b>' : '') + (fig.caption ? '<span>' + esc(fig.caption) + '</span>' : '') + '</figcaption></figure>' : '')
      + '</div>'
      + '<div class="sb-controls">' + controls + '</div>'
      + (opts.ask ? askBar(b) : '');
    if (fig) mountFigure(el.querySelector('.sb-fig-svg'), fig, opts.figPrev || 0, opts.figStep === undefined ? 99 : opts.figStep);
    if (opts.ask) bindAsk(b, el);
    K.icons();
    return el;
  }
  // Draws a diagram, showing stages already seen at once and animating only the new ones.
  function mountFigure(box, spec, prev, step) {
    var out = global.BoardDiagrams.render(spec);
    if (!out.svg) { box.parentNode.style.display = 'none'; return 0; }
    box.innerHTML = out.svg;
    global.BoardDiagrams.show(box, Math.min(prev, out.steps));
    var go = function () { global.BoardDiagrams.show(box, Math.min(step, out.steps)); };
    if (global.requestAnimationFrame) global.requestAnimationFrame(function () { global.requestAnimationFrame(go); }); else go();
    return out.steps;
  }
  function figureSteps(spec) { return spec && global.BoardDiagrams ? global.BoardDiagrams.render(spec).steps : 0; }
  function boardMessage(b, title, text) {
    var el = stage(b);
    if (el) el.innerHTML = '<div class="sb-surface sb-center"><div class="sb-welcome"><h3>' + esc(title) + '</h3><p>' + text + '</p></div></div>';
  }

  // ================================================================ learn --
  function renderLearn(b) {
    if (b.lesson) { paintLesson(b); return; }
    boardMessage(b, 'Pick a topic to begin', 'Choose the subject, chapter and topic above, then press <b>Start lesson</b>. The board writes the lesson one line at a time; press <b>Next</b> (or the right arrow key) to continue.');
  }
  function startLesson(b) {
    if (!b.topicId) { K.toast('Choose a topic first.', 'warning'); var t = K.byId(b.hostId + '_topic'); if (t) t.focus(); return; }
    var el = stage(b);
    el.innerHTML = '<div class="sb-surface sb-center">' + K.loading('Writing the lesson on the board...') + '</div>';
    var url = '/api/study-board/lesson?' + qs(Object.assign({ subjectKey: b.subjectKey, chapterId: b.chapterId, topicId: b.topicId }, who(b)));
    var ticket = b.lessonTicket = {};
    K.api(url).then(function (r) {
      if (b.lessonTicket !== ticket) return;
      b.lesson = r.lesson; b.frame = 0; b.line = 1; b.showAll = false; b.checkState = {}; b.paintedFrame = -1;
      paintLesson(b);
      focusBoard(b);
      if (r.lesson.aiPending) pollDetailed(b, url, ticket, 0);
    }).catch(function (err) { el.innerHTML = '<div class="sb-surface">' + K.errorBox(err) + '</div>'; });
  }
  // The board opens at once; the detailed explanation (diagrams, examples) is slipped in when ready,
  // keeping the student on the part they are reading.
  function pollDetailed(b, url, ticket, n) {
    setTimeout(function () {
      if (b.lessonTicket !== ticket || !b.lesson) return;
      K.api(url).then(function (r) {
        if (b.lessonTicket !== ticket || !b.lesson) return;
        var L = r.lesson;
        if (L.aiPending) { if (n < 25) pollDetailed(b, url, ticket, n + 1); else { b.lesson.aiPending = false; paintLesson(b); } return; }
        var old = b.lesson.frames[b.frame];
        var idx = -1;
        for (var i = 0; i < L.frames.length; i++) { if (L.frames[i].title === old.title && L.frames[i].kind === old.kind) { idx = i; if (i >= b.frame) break; } }
        b.lesson = L;
        if (b.frame > 0) { b.frame = idx === -1 ? Math.min(b.frame, L.frames.length - 1) : idx; b.paintedFrame = b.frame; }
        if (L.explained) K.toast('The detailed explanation with diagrams is ready on the board.', 'success');
        paintLesson(b);
      }).catch(function () { if (n < 25) pollDetailed(b, url, ticket, n + 1); });
    }, n < 5 ? 2500 : 4000);
  }
  function frameBody(b, f, upTo, animateLast) {
    if (f.kind === 'check') return checkBody(b, f);
    var lines = f.lines.slice(0, upTo);
    return (f.tag ? '<p class="sb-line sb-small">' + esc(f.tag) + '</p>' : '') + lines.map(function (l, i) {
      var html = lineHtml(l);
      return animateLast && i === lines.length - 1 ? html.replace('class="sb-line', 'class="sb-line sb-write') : html;
    }).join('');
  }
  function paintLesson(b) {
    var L = b.lesson;
    if (b.showAll) { paintNotes(b); return; }
    var f = L.frames[b.frame];
    var total = f.kind === 'check' ? 1 : f.lines.length;
    if (b.line > total) b.line = total;
    var lastFrame = b.frame === L.frames.length - 1;
    var atEnd = b.line >= total;
    var understood = b.understood.indexOf(L.topicId) !== -1;
    var v = b.v && b.v.on ? b.v : null;
    var voiceBtns = v
      ? '<button type="button" class="btn-secondary sb-voice-on" data-sb="voice-stop"><i data-lucide="volume-x" aria-hidden="true"></i> Stop voice</button>'
        + '<button type="button" class="btn-secondary' + (v.mic ? ' sb-mic-on' : '') + '" data-sb="mic" aria-pressed="' + Boolean(v.mic) + '"><i data-lucide="' + (v.mic ? 'mic' : 'mic-off') + '" aria-hidden="true"></i> ' + (v.mic ? 'Listening' : 'Speak') + '</button>'
      : '<button type="button" class="btn-primary sb-voice-btn" data-sb="voice"><i data-lucide="volume-2" aria-hidden="true"></i> Explain with voice</button>';
    var controls = '<button type="button" class="btn-secondary" data-sb="back"' + (b.frame === 0 && b.line <= 1 ? ' disabled' : '') + '><i data-lucide="arrow-left" aria-hidden="true"></i> Back</button>'
      + (lastFrame && atEnd
        ? (b.role === 'student' && !L.temporary ? '<button type="button" class="btn-primary" data-sb="understood">' + (understood ? '<i data-lucide="check" aria-hidden="true"></i> Understood' : 'I understood this topic') + '</button>' : '')
          + (L.temporary ? '' : '<button type="button" class="btn-secondary" data-sb="to-practice">Practise this topic</button>')
        : '<button type="button" class="btn-primary" data-sb="next">' + (atEnd ? 'Next part' : 'Next') + ' <i data-lucide="arrow-right" aria-hidden="true"></i></button>')
      + voiceBtns
      + (v ? '<span class="sb-voice-status" data-sb="status">' + esc(voiceStatusText(b)) + '</span>' : '')
      + '<span class="sb-spacer"></span>'
      + '<button type="button" class="btn-secondary" data-sb="notes"><i data-lucide="notebook-text" aria-hidden="true"></i> Full notes</button>';
    var old = $(b, '.sb-surface');
    var keepTop = f.kind === 'check' && b.paintedFrame === b.frame && old ? old.scrollTop : 0;
    var newFrame = b.paintedFrame !== b.frame;
    b.paintedFrame = b.frame;
    var dots = '<div class="sb-dots" aria-hidden="true">' + L.frames.map(function (_x, i) { return '<span class="' + (i === b.frame ? 'on' : (i < b.frame ? 'done' : '')) + '"></span>'; }).join('') + '</div>';
    // The diagram is drawn in stages that keep pace with the lines written on the board.
    var doubt = v && v.mode === 'doubt' ? v.doubt : (b.textDoubt || null);
    var fig = doubt && doubt.diagram ? doubt.diagram : f.diagram;
    var figStep = 99, figPrev = 0;
    if (fig && fig === f.diagram && f.kind !== 'check') {
      var steps = figureSteps(fig);
      figStep = atEnd ? steps : Math.max(1, Math.ceil(steps * b.line / Math.max(total, 1)));
      figPrev = newFrame ? 0 : (b.figShown || 0);
      b.figShown = figStep;
    } else if (fig) {
      figPrev = doubt && doubt.figShown ? 99 : 0;
      if (doubt) doubt.figShown = true;
    }
    var el = boardShell(b, f.title, (L.aiPending ? 'Adding the detailed explanation... ' : '') + 'Part ' + (b.frame + 1) + ' of ' + L.frames.length, dots + frameBody(b, f, b.line, true), controls,
      { figure: fig, figPrev: figPrev, figStep: figStep, aside: doubt ? doubtPanel(b, doubt) : '', ask: true });
    if (!el) return;
    bindLesson(b, el);
    if (f.kind === 'check') bindCheck(b, el, f);
    var surf = el.querySelector('.sb-surface');
    if (doubt) surf.scrollTop = 0; else surf.scrollTop = f.kind === 'check' ? keepTop : surf.scrollHeight;
  }

  // ------------------------------------------------------- doubts on the board
  function askBar(b) {
    return '<form class="sb-askbar" data-sb="ask-form" autocomplete="off"><label class="cd-sr" for="' + b.hostId + '_ask">Ask a doubt</label>'
      + '<input id="' + b.hostId + '_ask" class="form-control" maxlength="600" placeholder="' + (b.v && b.v.on ? 'Type a doubt any time, or press Speak and just ask' : 'Stuck? Type your doubt here, any time') + '">'
      + '<button type="submit" class="btn-secondary"><i data-lucide="message-circle-question" aria-hidden="true"></i> Ask</button>'
      + (b.v && b.v.on && !b.v.fallback ? '<div class="sb-quick">' + QUICK.map(function (q, i) { return '<button type="button" class="sb-chip" data-sb-quick="' + i + '">' + esc(q[0]) + '</button>'; }).join('') + '</div>' : '')
      + '</form>';
  }
  // One-tap requests while the voice teacher is on.
  var QUICK = [
    ['Explain it more simply', 'I did not fully understand this part. Explain it again more simply, with a different everyday example.'],
    ['Give a real-life example', 'Give me one more real-life example of this part from daily life in India.'],
    ['Repeat slowly', 'Please repeat the last thing you said, slowly.'],
    ['Quiz me on this', 'Ask me one short question to check that I understood this part, then wait for my answer.']
  ];
  function bindAsk(b, el) {
    var form = el.querySelector('[data-sb="ask-form"]');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var text = input.value.trim();
      if (text.length < 3) { input.focus(); return; }
      input.value = '';
      askDoubt(b, text);
    });
    form.querySelectorAll('[data-sb-quick]').forEach(function (btn) {
      btn.addEventListener('click', function () { var q = QUICK[Number(btn.getAttribute('data-sb-quick'))]; if (q) askDoubt(b, q[1], q[0]); });
    });
  }
  function doubtPanel(b, d) {
    var notes = d.notes ? '<div class="sb-doubt-notes">' + (d.notes.title ? '<h4 class="sb-h4">' + esc(d.notes.title) + '</h4>' : '') + d.notes.lines.map(function (l, i) { return lineHtml({ t: 'work', n: i + 1, v: l }); }).join('') + '</div>' : '';
    var answer = d.answer ? doubtLines(d.answer).map(lineHtml).join('') : '';
    var live = b.v && b.v.on && b.v.mode === 'doubt';
    return '<section class="sb-doubtbox" aria-live="polite">'
      + '<div class="sb-doubt-q"><span class="sb-tag">Your doubt</span> ' + (d.q ? esc(d.q) : '<i>Listening...</i>') + '</div>'
      + (d.said ? '<p class="sb-doubt-said">' + esc(d.said) + '</p>' : (live && !notes ? '<p class="sb-doubt-said sb-muted">The teacher is answering...</p>' : ''))
      + notes + answer
      + (d.pending ? K.loading('Working it out...') : '')
      + '<div class="sb-doubt-actions"><button type="button" class="btn-primary" data-sb="resume"><i data-lucide="play" aria-hidden="true"></i> ' + (live ? 'Continue the lesson' : 'Back to the lesson') + '</button>'
      + (b.role === 'student' && d.q ? '<button type="button" class="btn-secondary" data-sb="doubt-teacher"><i data-lucide="send" aria-hidden="true"></i> Ask my teacher</button>' : '') + '</div>'
      + '</section>';
  }
  // A typed doubt: with the voice on, the teacher answers aloud; otherwise it is worked out on the board.
  function askDoubt(b, text, label) {
    var v = b.v && b.v.on && !b.v.fallback ? b.v : null;
    if (b.v && b.v.fallback && b.v.audio) { try { b.v.audio.pause(); } catch (e) { /* ignore */ } b.v.mode = 'doubt'; }
    var ctxText = b.lesson ? '"' + b.lesson.title + '", part "' + b.lesson.frames[b.frame].title + '"' : '';
    var ctx = ctxText ? ' (while learning ' + ctxText + ')' : '';
    if (v) {
      clearTimeout(v.nextTimer);
      v.mode = 'doubt';
      v.resumeAfterTurn = false;
      v.doubt = { q: label || text, said: '', notes: null, diagram: null };
      v.tutor.say('STUDENT ASKS (typed)' + ctx + ': "' + text + '"\nStop the lesson now. Answer exactly this question from the student, not the lesson part. Do not repeat what you already explained unless the student asked for that.', true);
      paintLesson(b);
      return;
    }
    b.textDoubt = { q: text, pending: true };
    paintLesson(b);
    K.post('/api/study-board/doubt', Object.assign({ subjectKey: b.subjectKey, text: text, context: ctxText, language: b.lang }, who(b))).then(function (r) {
      if (!b.textDoubt || b.textDoubt.q !== text) return;
      var res = r.result;
      b.textDoubt = { q: text, answer: res, diagram: res.diagram || null };
      if (res.mode === 'none' || res.mode === 'unread') b.textDoubt.said = res.message + (b.role === 'student' ? ' You can send it to your teacher.' : '');
      paintLesson(b);
    }).catch(function (err) { if (b.textDoubt) { b.textDoubt = { q: text, said: err.message }; paintLesson(b); } });
  }

  function bindLesson(b, el) {
    var L = b.lesson;
    var on = function (name, fn) { var x = el.querySelector('[data-sb="' + name + '"]'); if (x) x.addEventListener('click', fn); };
    on('next', function () {
      var f = L.frames[b.frame];
      var total = f.kind === 'check' ? 1 : f.lines.length;
      b.textDoubt = null;
      if (b.line < total) b.line += 1; else if (b.frame < L.frames.length - 1) { b.frame += 1; b.line = 1; if (b.v && b.v.on) { narratePart(b); return; } }
      paintLesson(b);
      focusBoard(b);
    });
    on('back', function () {
      b.textDoubt = null;
      if (b.line > 1) b.line -= 1; else if (b.frame > 0) { b.frame -= 1; var f = L.frames[b.frame]; b.line = f.kind === 'check' ? 1 : f.lines.length; }
      paintLesson(b);
      focusBoard(b);
    });
    on('notes', function () { b.showAll = true; paintLesson(b); });
    on('voice', function () { voiceStart(b); });
    on('voice-stop', function () { voiceStop(b); paintLesson(b); });
    on('mic', function () { toggleMic(b); });
    on('resume', function () { resumeLesson(b); });
    on('doubt-teacher', function () {
      var d = (b.v && b.v.doubt) || b.textDoubt;
      if (!d || !d.q || !global.ClassDesk) return;
      global.ClassDesk.askTeacher({ subjectKey: b.subjectKey, text: d.q, context: { type: 'BOARD', title: b.lesson ? b.lesson.title : 'Study Board' } }).catch(function () { /* toast shown */ });
    });
    on('to-practice', function () { b.mode = 'practice'; b.practice = null; render(b); startPractice(b, true); });
    on('understood', function () {
      var now = b.understood.indexOf(L.topicId) === -1;
      K.post('/api/study-board/progress', { studentId: K.student().id, subjectKey: L.subjectKey, chapterId: L.chapterId, topicId: L.topicId, understood: now }).then(function () {
        if (now) b.understood.push(L.topicId); else b.understood.splice(b.understood.indexOf(L.topicId), 1);
        if (now) K.toast('Marked as understood. Keep going!', 'success');
        renderPicker(b); paintLesson(b);
      }).catch(function (err) { K.toast(err.message, 'error'); });
    });
  }
  // ========================================================= voice teacher --
  // The board sends one part at a time ("BOARD PART k of N") and the live teacher explains it
  // aloud; lines appear on the board as the teacher talks. The student can cut in at any time
  // by speaking (Speak) or typing; the teacher answers, may draw or write on the board, and the
  // lesson goes on from the same part. If live voice is not available, the board reads the lesson
  // aloud with the school's neural voices instead.

  // Board text to something a teacher would say ("$F = q E$" -> "F = q E").
  function speakable(text) {
    return String(text || '')
      .replace(/\$\$?([^$]+)\$\$?/g, function (m, tex) {
        return ' ' + tex.replace(/\^(?:\{2\}|2(?!\d))/g, ' squared').replace(/\^(?:\{3\}|3(?!\d))/g, ' cubed').replace(/\^\{([^{}]*)\}/g, ' to the power $1').replace(/\^(-?\w)/g, ' to the power $1')
          .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, ' $1 ')
          .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, ' $1 over $2 ')
          .replace(/\\sqrt\{([^{}]*)\}/g, 'root of $1')
          .replace(/\\times|\\cdot/g, ' times ').replace(/\\propto/g, ' is proportional to ').replace(/\\(?:var)?epsilon/g, 'epsilon')
          .replace(/\\mu/g, ' micro ').replace(/\\Omega/g, 'ohm').replace(/\\(Delta|delta|lambda|theta|alpha|beta|gamma|omega|pi|rho|sigma|phi)/g, '$1')
          .replace(/\\[,;:! ]/g, ' ').replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1').replace(/_\{?([^{}\s]*)\}?/g, ' $1').replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}\\]/g, '').replace(/\s+/g, ' ') + ' ';
      })
      .replace(/\s+/g, ' ').trim();
  }
  function lineSpeech(l) {
    if (l.t === 'options') return 'Options: ' + l.options.map(function (o) { return o.key + ', ' + speakable(o.latex); }).join('; ');
    if (l.t === 'term') return speakable(l.term + ': ' + l.v);
    return speakable(l.v);
  }
  function partText(b, k) {
    var f = b.lesson.frames[k];
    var lines = f.kind === 'check' ? (f.questions || []).map(function (q, i) { return 'Question ' + (i + 1) + ': ' + speakable(q.questionLatex); }) : f.lines.map(lineSpeech);
    return 'Part ' + (k + 1) + ': ' + f.title + (f.tag ? ' (' + f.tag + ')' : '') + '\n' + lines.map(function (l, i) { return (i + 1) + '. ' + l; }).join('\n')
      + (f.diagram ? '\nDiagram on the board: ' + (f.diagram.title || f.diagram.type) + (f.diagram.caption ? ' - ' + f.diagram.caption : '') : '');
  }
  function outline(b) {
    var L = b.lesson;
    return 'Lesson: ' + L.title + ' (' + L.subjectName + ', ' + L.chapterName + ')\n' + L.frames.map(function (_f, k) { return partText(b, k); }).join('\n\n');
  }
  function voiceStatusText(b) {
    var v = b.v;
    if (!v || !v.on) return '';
    if (v.fallback) return v.mode === 'doubt' ? 'Answering your doubt' : 'Reading aloud';
    if (v.studentTalking) return 'Listening to you...';
    if (v.mode === 'doubt') return v.speaking ? 'Answering your doubt' : 'Ask more, or continue the lesson';
    if (v.speaking) return 'Teacher is explaining';
    return v.mic ? 'Say something to ask a doubt' : 'Teacher is ready';
  }
  function setStatus(b) {
    var el = $(b, '[data-sb="status"]');
    if (el) el.textContent = voiceStatusText(b);
  }

  function voiceStart(b) {
    if (!b.lesson) return;
    if (!global.LiveTutor) { startReadAloud(b, 'The voice module did not load.'); return; }
    var v = b.v = { on: true, mode: 'lesson', mic: false, auto: true, doubt: null, speaking: false, spoken: 0 };
    var tutor = new global.LiveTutor({
      onSpeaking: function (on) { v.speaking = on; setStatus(b); },
      onStudentTalking: function (on) { v.studentTalking = on; setStatus(b); },
      onInterrupted: function () {
        if (v.mode !== 'doubt') { v.mode = 'doubt'; v.doubt = { q: '', said: '', notes: null, diagram: null }; v.resumeAfterTurn = false; paintLesson(b); }
      },
      onTranscript: function (who2, text, final) {
        if (b.v !== v) return;
        if (who2 === 'student') {
          if (v.mode !== 'doubt') { v.mode = 'doubt'; v.doubt = { q: '', said: '', notes: null, diagram: null }; }
          v.doubt.q = text.trim();
          paintLesson(b);
          return;
        }
        if (v.mode === 'doubt' && v.doubt) {
          v.doubt.said = text.trim();
          var said = $(b, '.sb-doubt-said');
          if (said) { said.textContent = v.doubt.said; said.classList.remove('sb-muted'); } else paintLesson(b);
          return;
        }
        // Lesson: write the next line on the board roughly every ~150 characters the teacher speaks.
        var f = b.lesson.frames[b.frame];
        if (f.kind === 'check') return;
        var want = Math.min(f.lines.length, 1 + Math.floor(text.length / 150));
        if (want > b.line) { b.line = want; paintLesson(b); }
      },
      onTool: function (name, args) {
        if (b.v !== v) return 'ignored';
        if (name === 'show_diagram') {
          var spec = null;
          try { spec = typeof args.diagram_json === 'string' ? JSON.parse(args.diagram_json) : (args.diagram || args); } catch (e) { return 'The diagram JSON could not be read.'; }
          var drawn = spec && global.BoardDiagrams && global.BoardDiagrams.render(spec).steps;
          if (!drawn) return 'That diagram type could not be drawn; explain in words instead.';
          if (v.mode !== 'doubt') { v.mode = 'doubt'; v.doubt = { q: '', said: '', notes: null }; }
          v.doubt.diagram = spec;
          v.doubt.figShown = false;
          paintLesson(b);
          return 'Drawn on the board.';
        }
        if (name === 'write_on_board') {
          var lines = (Array.isArray(args.lines) ? args.lines : []).map(String).slice(0, 10);
          if (!lines.length) return 'Nothing to write.';
          if (v.mode !== 'doubt') { v.mode = 'doubt'; v.doubt = { q: '', said: '', diagram: null }; }
          v.doubt.notes = { title: String(args.title || ''), lines: lines };
          paintLesson(b);
          return 'Written on the board.';
        }
        if (name === 'continue_lesson') { v.resumeAfterTurn = true; return 'The lesson will continue after you finish this sentence.'; }
        return 'Unknown tool.';
      },
      onTurnComplete: function () {
        if (b.v !== v || !v.on) return;
        if (v.mode === 'doubt') {
          if (v.resumeAfterTurn) { v.resumeAfterTurn = false; resumeLesson(b); }
          return;
        }
        var L = b.lesson;
        var f = L.frames[b.frame];
        if (f.kind !== 'check') { b.line = f.lines.length; paintLesson(b); }
        if (!v.auto || f.kind === 'check' || b.frame >= L.frames.length - 1) return;
        clearTimeout(v.nextTimer);
        v.nextTimer = setTimeout(function () {
          if (b.v !== v || v.mode !== 'lesson' || !v.on) return;
          b.frame += 1;
          b.line = 1;
          narratePart(b);
        }, 1400);
      },
      onClosed: function (reason) {
        if (b.v !== v || !v.on) return;
        K.toast('The voice teacher disconnected' + (reason ? ' (' + reason + ')' : '') + '. Press "Explain with voice" to start again.', 'warning');
        voiceStop(b);
        paintLesson(b);
      },
      onError: function (err) { K.toast(err.message, 'warning'); }
    });
    v.tutor = tutor;
    var btn = $(b, '[data-sb="voice"]');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Connecting...'; }
    var L = b.lesson;
    tutor.start(Object.assign({
      subjectKey: L.subjectKey, chapterId: L.temporary ? '' : L.chapterId, topicId: L.temporary ? '' : L.topicId, topicTitle: L.title,
      language: b.lang, voice: b.gender, outline: outline(b)
    }, who(b))).then(function () {
      if (b.v !== v) { tutor.stop(); return; }
      narratePart(b);
    }).catch(function (err) {
      if (b.v !== v) return;
      tutor.stop();
      startReadAloud(b, err.message);
    });
  }

  function narratePart(b, cont) {
    var v = b.v;
    if (!v || !v.on) return;
    var L = b.lesson;
    var f = L.frames[b.frame];
    v.mode = 'lesson';
    v.doubt = null;
    if (!cont) b.line = 1;
    paintLesson(b);
    if (v.fallback) { readPartAloud(b); return; }
    var head = 'BOARD PART ' + (b.frame + 1) + ' of ' + L.frames.length + (cont ? ' (we are back after the student\'s doubt: continue this part from where you stopped; do not repeat what you already said)' : '');
    var tail = f.kind === 'check'
      ? 'The student will now answer these questions on their own. Encourage them in one or two sentences, tell them to tap an option, and wait.'
      : (b.frame === 0 ? 'Start the lesson: greet the student warmly in one line, say what we will learn and why it matters in daily life, then explain this part.' : 'Explain this part now.');
    v.tutor.say(head + ': ' + partText(b, b.frame).replace(/^Part \d+: /, '') + '\n' + tail);
  }

  function resumeLesson(b) {
    b.textDoubt = null;
    var v = b.v;
    if (!v || !v.on) { paintLesson(b); return; }
    if (v.tutor && !v.fallback) v.tutor.stopAudio(true);
    if (v.audio) { try { v.audio.pause(); } catch (e) { /* ignore */ } }
    v.mode = 'lesson';
    v.doubt = null;
    v.auto = true;
    narratePart(b, true);
  }

  function toggleMic(b) {
    var v = b.v;
    if (!v || !v.on) return;
    if (v.fallback) { K.toast('Speaking needs the live voice teacher. Type your doubt instead.', 'info'); return; }
    if (v.mic) { v.tutor.micOff(); v.mic = false; paintLesson(b); return; }
    v.tutor.micOn().then(function () { v.mic = true; paintLesson(b); K.toast('Speak any time to ask a doubt. The teacher stops and answers.', 'info'); })
      .catch(function () { K.toast('The microphone is blocked. Allow it in the browser, or type your doubt.', 'warning'); });
  }

  function voiceStop(b) {
    var v = b.v;
    if (!v) return;
    v.on = false;
    clearTimeout(v.nextTimer);
    if (v.tutor) { try { v.tutor.stop(); } catch (e) { /* ignore */ } }
    if (v.audio) { try { v.audio.pause(); } catch (e) { /* ignore */ } }
    b.v = null;
  }

  // ------------------------------------------- read-aloud fallback (no live voice)
  var NEURAL = { hinglish: { female: 'swara', male: 'madhur' }, hi: { female: 'swara', male: 'madhur' }, en: { female: 'neerja', male: 'prabhat' } };
  function startReadAloud(b, reason) {
    K.toast('Live voice is not available (' + reason + '). The board will read the lesson aloud instead; type any doubt.', 'warning');
    b.v = { on: true, fallback: true, mode: 'lesson', auto: true, doubt: null };
    narratePart(b, true);
  }
  function readPartAloud(b) {
    var v = b.v;
    var f = b.lesson.frames[b.frame];
    var texts = f.kind === 'check' ? ['Now try these questions on your own. Tap the option you think is right.'] : f.lines.map(lineSpeech);
    var voice = (NEURAL[b.lang] || NEURAL.en)[b.gender] || 'swara';
    var base = typeof global.getApiBaseUrl === 'function' ? global.getApiBaseUrl() : '';
    var i = Math.max(0, b.line - 1);
    var next = function () {
      if (b.v !== v || !v.on || v.mode !== 'lesson') return;
      if (i >= texts.length) {
        if (f.kind !== 'check' && b.frame < b.lesson.frames.length - 1) {
          v.nextTimer = setTimeout(function () { if (b.v === v && v.on && v.mode === 'lesson') { b.frame += 1; b.line = 1; narratePart(b); } }, 1200);
        }
        return;
      }
      if (f.kind !== 'check' && i + 1 > b.line) { b.line = i + 1; paintLesson(b); }
      var audio = new Audio(base + '/api/voice-tutor/audio?voice=' + encodeURIComponent(voice) + '&text=' + encodeURIComponent(texts[i].slice(0, 600)));
      v.audio = audio;
      i += 1;
      audio.onended = next;
      audio.onerror = function () {
        if (b.v !== v) return;
        K.toast('The school voice could not be played. You can still read the board and ask doubts.', 'warning');
        voiceStop(b);
        paintLesson(b);
      };
      var pr = audio.play();
      if (pr && pr.catch) pr.catch(function () { /* autoplay blocked: wait for the next click */ });
    };
    next();
  }

  function notesHtml(L) {
    return L.frames.filter(function (f) { return f.kind !== 'check'; }).map(function (f) {
      var pic = f.diagram && global.BoardDiagrams ? global.BoardDiagrams.render(f.diagram).svg.replace(/class="bd-s"/g, 'class="bd-s on"') : '';
      return '<section class="sb-notes-frame"><h4>' + esc(f.title) + (f.tag ? ' <small>' + esc(f.tag) + '</small>' : '') + '</h4>' + f.lines.map(lineHtml).join('')
        + (pic ? '<figure class="sb-notes-fig">' + pic + (f.diagram.caption ? '<figcaption>' + esc(f.diagram.caption) + '</figcaption>' : '') + '</figure>' : '') + '</section>';
    }).join('');
  }
  function paintNotes(b) {
    var L = b.lesson;
    var el = boardShell(b, L.title, 'Full notes', '<p class="sb-line sb-small">' + esc(L.subjectName + ' • ' + L.chapterName) + '</p>' + notesHtml(L),
      '<button type="button" class="btn-secondary" data-sb="lesson"><i data-lucide="arrow-left" aria-hidden="true"></i> Back to lesson</button><span class="sb-spacer"></span>'
      + '<button type="button" class="btn-primary" data-sb="print"><i data-lucide="printer" aria-hidden="true"></i> Print or save notes (PDF)</button>');
    if (!el) return;
    el.querySelector('[data-sb="lesson"]').addEventListener('click', function () { b.showAll = false; paintLesson(b); });
    el.querySelector('[data-sb="print"]').addEventListener('click', function () {
      K.printDoc(L.title, '<div class="pr-meta"><span>Subject: <b>' + esc(L.subjectName) + '</b></span><span>Chapter: <b>' + esc(L.chapterName) + '</b></span></div><div class="pr-notes">' + notesHtml(L) + '</div>', 'Study notes');
    });
  }

  // --------------------------------------------------------- check yourself
  function checkBody(b, f) {
    return '<p class="sb-line sb-small">Answer on your own first. A wrong first try is saved to your mistake notebook.</p>' + f.questions.map(function (q, i) {
      var st = (b.checkState || {})[q.id] || {};
      return '<div class="sb-check" data-check="' + esc(q.id) + '"><div class="sb-line sb-question sb-numbered"><span class="sb-num">' + (i + 1) + '</span><div>' + tx(q.questionLatex) + '</div></div>'
        + optionButtons(q, st)
        + (st.solution ? '<div class="sb-solution">' + st.solution.map(function (s, n) { return lineHtml({ t: 'work', n: n + 1, v: s }); }).join('') + '</div>' : '')
        + (st.done ? '' : '<button type="button" class="sb-link" data-check-reveal="' + esc(q.id) + '">Show the solution</button>')
        + '</div>';
    }).join('');
  }
  function optionButtons(q, st) {
    return '<div class="sb-opts">' + q.options.map(function (o) {
      var cls = st.correctAnswer ? (o.key === st.correctAnswer ? ' is-correct' : ((st.wrong || []).indexOf(o.key) !== -1 ? ' is-wrong' : '')) : ((st.wrong || []).indexOf(o.key) !== -1 ? ' is-wrong' : '');
      return '<button type="button" class="sb-opt' + cls + '" data-opt="' + esc(o.key) + '"' + (st.done ? ' disabled' : '') + '><b>' + esc(o.key) + '</b><span>' + K.latex(o.latex) + '</span></button>';
    }).join('') + '</div>';
  }
  function bindCheck(b, el, f) {
    b.checkState = b.checkState || {};
    el.querySelectorAll('.sb-check').forEach(function (box) {
      var id = box.getAttribute('data-check');
      var st = b.checkState[id] || (b.checkState[id] = { tries: 0, wrong: [] });
      var send = function (body) {
        K.post('/api/study-board/practice/check', Object.assign({ questionId: id }, who(b), body)).then(function (r) {
          if (r.correct === false) { st.wrong.push(body.answer); K.toast('Not quite. Try another option.', 'info'); }
          if (r.correct || body.reveal) { st.done = true; st.correctAnswer = r.correctAnswer; st.solution = r.solutionLines; if (r.correct) K.toast('Correct!', 'success'); }
          paintLesson(b);
        }).catch(function (err) { K.toast(err.message, 'error'); });
      };
      box.querySelectorAll('[data-opt]').forEach(function (btn) {
        btn.addEventListener('click', function () { st.tries += 1; send({ answer: btn.getAttribute('data-opt'), attempt: st.tries }); });
      });
      var rev = box.querySelector('[data-check-reveal]');
      if (rev) rev.addEventListener('click', function () { send({ reveal: true, answeredCorrectly: false }); });
    });
  }

  // ============================================================= practice --
  function renderPractice(b) {
    if (b.practice) { paintPractice(b); return; }
    boardMessage(b, 'Practice with hints', 'Choose a chapter (and a topic if you like) above, then press <b>Start practice</b>. Try each question yourself. If you are stuck, take one hint at a time instead of jumping to the answer.');
  }
  function startPractice(b, reset) {
    if (reset) { b.seen = []; b.session = { tried: 0, correct: 0 }; }
    var el = stage(b);
    if (!el) return;
    el.innerHTML = '<div class="sb-surface sb-center">' + K.loading('Picking a question...') + '</div>';
    K.api('/api/study-board/practice?' + qs(Object.assign({ subjectKey: b.subjectKey, chapterId: b.chapterId, topicId: b.topicId, exclude: b.seen.join(',') }, who(b)))).then(function (r) {
      if (!r.question) {
        b.practice = null;
        boardMessage(b, b.seen.length ? 'You have done every question here' : 'No practice questions yet', b.seen.length ? 'You tried ' + b.session.tried + ' and got ' + b.session.correct + ' right on the first go. Pick another chapter or topic to continue.' : 'There are no questions with solutions for this chapter yet. Try another chapter.');
        return;
      }
      b.seen.push(r.question.id);
      b.practice = { q: r.question, hintTotal: r.hintCount, hints: [], tries: 0, wrong: [], done: false, remaining: r.remaining };
      paintPractice(b);
    }).catch(function (err) { el.innerHTML = '<div class="sb-surface">' + K.errorBox(err) + '</div>'; });
  }
  function paintPractice(b) {
    var p = b.practice; var q = p.q;
    var st = { wrong: p.wrong, correctAnswer: p.correctAnswer, done: p.done };
    var body = '<p class="sb-line sb-small">' + esc([q.chapterName, q.topic, q.source].filter(Boolean).join(' • ')) + '</p>'
      + '<div class="sb-line sb-question">' + tx(q.questionLatex) + '</div>'
      + (q.kind === 'MCQ' ? optionButtons(q, st) : '<p class="sb-line sb-small">Work this out in your notebook, then compare with the solution.</p>')
      + p.hints.map(function (h, i) { return lineHtml({ t: 'hint', n: i + 1, v: h }).replace('class="sb-line', i === p.hints.length - 1 && p.justHinted ? 'class="sb-line sb-write' : 'class="sb-line'); }).join('')
      + (p.solution ? '<h4 class="sb-line sb-h4">Solution</h4>' + p.solution.map(function (s, n) { return lineHtml({ t: 'work', n: n + 1, v: s }); }).join('') + (p.correctAnswer ? lineHtml({ t: 'answer', v: 'Answer: option ' + p.correctAnswer }) : '') : '');
    p.justHinted = false;
    var hintsLeft = p.hintTotal - p.hints.length;
    var controls = (p.done ? '' : '<button type="button" class="btn-secondary" data-sb="hint"' + (hintsLeft <= 0 ? ' disabled' : '') + '><i data-lucide="lightbulb" aria-hidden="true"></i> ' + (hintsLeft > 0 ? 'Hint (' + hintsLeft + ' left)' : 'No more hints') + '</button>'
      + '<button type="button" class="btn-secondary" data-sb="solution">Show solution</button>')
      + '<button type="button" class="btn-primary" data-sb="next">' + (p.done ? 'Next question' : 'Skip') + ' <i data-lucide="arrow-right" aria-hidden="true"></i></button>'
      + '<span class="sb-spacer"></span>'
      + (b.role === 'student' && !p.asked ? '<button type="button" class="btn-secondary" data-sb="ask"><i data-lucide="send" aria-hidden="true"></i> Ask my teacher</button>' : '');
    var el = boardShell(b, 'Practice', b.session.correct + ' right first time out of ' + b.session.tried + ' tried', body, controls);
    if (!el) return;
    var act = function (body2) {
      return K.post('/api/study-board/practice/check', Object.assign({ questionId: q.id }, who(b), body2));
    };
    el.querySelectorAll('[data-opt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        p.tries += 1;
        if (p.tries === 1) b.session.tried += 1;
        act({ answer: btn.getAttribute('data-opt'), attempt: p.tries }).then(function (r) {
          if (r.correct) {
            if (p.tries === 1) b.session.correct += 1;
            p.done = true; p.correctAnswer = r.correctAnswer; p.solution = r.solutionLines;
            K.toast(p.tries === 1 ? 'Correct on the first try!' : 'Correct.', 'success');
            paintPractice(b);
          } else {
            p.wrong.push(btn.getAttribute('data-opt'));
            K.toast('Not quite. Here is a hint.', 'info');
            takeHint(b);
          }
        }).catch(function (err) { K.toast(err.message, 'error'); });
      });
    });
    var on = function (name, fn) { var x = el.querySelector('[data-sb="' + name + '"]'); if (x) x.addEventListener('click', fn); };
    on('hint', function () { takeHint(b); });
    on('solution', function () {
      if (p.tries === 0 && q.kind === 'MCQ') b.session.tried += 1;
      act({ reveal: true, answeredCorrectly: false }).then(function (r) { p.done = true; p.correctAnswer = r.correctAnswer; p.solution = r.solutionLines.length ? r.solutionLines : ['No written solution is saved for this question.']; paintPractice(b); })
        .catch(function (err) { K.toast(err.message, 'error'); });
    });
    on('next', function () { startPractice(b, false); });
    on('ask', function () {
      global.ClassDesk.askTeacher({ subjectKey: b.subjectKey, text: 'I am stuck on this practice question.', context: { type: 'QUESTION', title: q.chapterName, questionLatex: q.questionLatex, chapterName: q.chapterName } })
        .then(function () { p.asked = true; paintPractice(b); }).catch(function () { /* toast shown */ });
    });
  }
  function takeHint(b) {
    var p = b.practice;
    if (p.hints.length >= p.hintTotal) { paintPractice(b); return; }
    K.post('/api/study-board/practice/hint', Object.assign({ questionId: p.q.id, level: p.hints.length + 1 }, who(b))).then(function (r) {
      p.hints = r.hints; p.hintTotal = r.total; p.justHinted = true;
      paintPractice(b);
    }).catch(function (err) { K.toast(err.message, 'error'); });
  }

  // ================================================================ doubt --
  function renderDoubt(b) {
    var subs = (b.catalog && b.catalog.subjects) || [];
    var box = K.byId(b.hostId + '_picker');
    box.innerHTML = '<form class="sb-doubt-form" novalidate>'
      + '<div class="sb-pick-row"><div class="sb-field"><label for="' + b.hostId + '_dsub">Subject</label><select id="' + b.hostId + '_dsub" class="form-select">' + subs.map(function (x) { return '<option value="' + esc(x.key) + '"' + (x.key === b.subjectKey ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></div>'
      + '<div class="sb-field sb-grow"><label for="' + b.hostId + '_dtext">Your question</label><textarea id="' + b.hostId + '_dtext" class="form-control" rows="2" maxlength="1500" placeholder="Type the question exactly as it is written in your book or paper">' + esc(b.doubtText || '') + '</textarea></div></div>'
      + '<div class="sb-doubt-actions"><label class="btn-secondary cd-attach"><i data-lucide="camera" aria-hidden="true"></i><span data-sb="photo-label">' + (b.doubtImage ? 'Photo added' : 'Add a photo of the question') + '</span><input type="file" accept="image/*" hidden data-sb="photo"></label>'
      + '<button type="submit" class="btn-primary">Work it out</button></div></form>';
    box.querySelector('[data-sb="photo"]').addEventListener('change', function (e) {
      K.readImage(e.target.files && e.target.files[0]).then(function (d) { b.doubtImage = d; box.querySelector('[data-sb="photo-label"]').textContent = d ? 'Photo added' : 'Add a photo of the question'; })
        .catch(function (err) { K.toast(err.message, 'warning'); });
    });
    box.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var text = K.byId(b.hostId + '_dtext').value.trim();
      b.doubtText = text;
      b.subjectKey = K.byId(b.hostId + '_dsub').value;
      if (text.length < 8 && !b.doubtImage) { K.toast('Type your question, or add a clear photo of it.', 'warning'); K.byId(b.hostId + '_dtext').focus(); return; }
      var el = stage(b);
      el.innerHTML = '<div class="sb-surface sb-center">' + K.loading('Working it out on the board...') + '</div>';
      K.post('/api/study-board/doubt', Object.assign({ subjectKey: b.subjectKey, text: text, imageData: b.doubtImage, language: b.lang }, who(b))).then(function (r) {
        b.doubt = r.result; b.doubtStep = 1; b.doubtSent = false;
        paintDoubt(b);
        focusBoard(b);
      }).catch(function (err) { el.innerHTML = '<div class="sb-surface">' + K.errorBox(err) + '</div>'; });
    });
    if (b.doubt) paintDoubt(b);
    else boardMessage(b, 'Stuck on a question?', 'Type it above (or add a photo) and press <b>Work it out</b>. If the board cannot solve it, one tap sends it to your subject teacher.');
  }
  function doubtLines(d) {
    var lines = [];
    if (d.mode === 'worked') {
      lines.push({ t: 'small', v: 'Your question' });
      lines.push({ t: 'question', v: d.question });
      var n = 0;
      d.steps.forEach(function (s) { lines.push({ t: 'heading', v: s.title }); s.lines.forEach(function (l) { n += 1; lines.push({ t: 'work', n: n, v: l }); }); });
      if (d.answer) lines.push({ t: 'answer', v: d.answer });
      if (d.concept) lines.push({ t: 'note', v: 'Idea used: ' + d.concept });
      if (d.tip) lines.push({ t: 'note', v: d.tip });
    } else if (d.mode === 'similar') {
      var m = d.match;
      if (d.aiError) lines.push({ t: 'note', v: 'Your exact doubt could not be worked out right now (the answer service is busy). Meanwhile, here is the closest solved question. Try again in a minute.' });
      lines.push({ t: 'small', v: 'Closest solved question in the school question bank (' + [m.chapterName, m.source].filter(Boolean).join(' • ') + ')' });
      lines.push({ t: 'question', v: m.questionLatex });
      if (m.options.length) lines.push({ t: 'options', options: m.options });
      m.lines.forEach(function (l, i) { lines.push({ t: 'work', n: i + 1, v: l }); });
      if (m.answer) lines.push({ t: 'answer', v: 'Answer: ' + m.answer });
      lines.push({ t: 'note', v: 'This is a similar question, not your exact one. Follow the same steps with your numbers, or send your question to your teacher.' });
    }
    return lines;
  }
  function paintDoubt(b) {
    var d = b.doubt;
    var askBtn = d.canAskTeacher ? '<button type="button" class="' + (d.mode === 'none' || d.mode === 'unread' ? 'btn-primary' : 'btn-secondary') + '" data-sb="ask"' + (b.doubtSent ? ' disabled' : '') + '><i data-lucide="send" aria-hidden="true"></i> ' + (b.doubtSent ? 'Sent to your teacher' : 'Send to my teacher') + '</button>' : '';
    var el;
    if (d.mode === 'none' || d.mode === 'unread') {
      el = boardShell(b, 'Could not work this one out here', '', '<p class="sb-line sb-point">' + esc(d.message) + '</p>' + (d.asked ? '<div class="sb-line sb-question">' + esc(d.asked) + '</div>' : '') + '<p class="sb-line sb-note">Your teacher can answer it. The reply will appear in Class Desk under My doubts.</p>', askBtn);
    } else {
      var lines = doubtLines(d);
      if (b.doubtStep > lines.length) b.doubtStep = lines.length;
      var atEnd = b.doubtStep >= lines.length;
      el = boardShell(b, d.mode === 'worked' ? 'Worked solution' : 'A solved question like yours', 'Line ' + b.doubtStep + ' of ' + lines.length,
        lines.slice(0, b.doubtStep).map(function (l, i) { var h = lineHtml(l); return i === b.doubtStep - 1 ? h.replace('class="sb-line', 'class="sb-line sb-write') : h; }).join(''),
        '<button type="button" class="btn-secondary" data-sb="back"' + (b.doubtStep <= 1 ? ' disabled' : '') + '><i data-lucide="arrow-left" aria-hidden="true"></i> Back</button>'
        + '<button type="button" class="btn-primary" data-sb="next"' + (atEnd ? ' disabled' : '') + '>Next <i data-lucide="arrow-right" aria-hidden="true"></i></button>'
        + '<button type="button" class="btn-secondary" data-sb="all"' + (atEnd ? ' disabled' : '') + '>Show all</button><span class="sb-spacer"></span>' + askBtn);
      var surf = el.querySelector('.sb-surface');
      surf.scrollTop = surf.scrollHeight;
      var on = function (name, fn) { var x = el.querySelector('[data-sb="' + name + '"]'); if (x) x.addEventListener('click', fn); };
      on('next', function () { b.doubtStep += 1; paintDoubt(b); focusBoard(b); });
      on('back', function () { b.doubtStep -= 1; paintDoubt(b); focusBoard(b); });
      on('all', function () { b.doubtStep = lines.length; paintDoubt(b); });
    }
    var ask = el && el.querySelector('[data-sb="ask"]');
    if (ask) ask.addEventListener('click', function () {
      global.ClassDesk.askTeacher({ subjectKey: b.subjectKey, text: b.doubtText || 'Please help me with the question in the photo.', imageData: b.doubtImage, context: { type: 'BOARD', title: 'Study Board doubt' } })
        .then(function () { b.doubtSent = true; paintDoubt(b); }).catch(function () { /* toast shown */ });
    });
  }

  // =============================================================== wiring --
  function watch(id, fn) {
    var el = K.byId(id);
    if (!el) return;
    var shown = false;
    var checkNow = function () {
      var vis = el.style.display !== 'none' && el.offsetParent !== null;
      if (vis && !shown) { shown = true; fn(); } else if (!vis) { shown = false; }
    };
    new MutationObserver(checkNow).observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    checkNow();
  }
  function init() {
    watch('tabStudentStudyBoard', function () { open('student'); });
    watch('tabTeacherStudyBoard', function () { open('teacher'); });
  }
  global.StudyBoard = { open: open };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
