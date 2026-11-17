/* =============================================================================
   TEACHER DPPs (2026-11-17)
   Teacher (DPP tab): create a DPP for one of their classes from the question
   bank or from their own questions (type / paste, PDF, photo), assign it, and
   see each student's result.
   Student (Practice tab): DPPs assigned to their class, attempt once, then see
   score and solutions.
   Backend: /api/dpp (routes/dpp.js). Question reading reuses
   /api/questions/inject/preview (the Add Questions pipeline).
   ========================================================================== */
(function (global) {
  'use strict';

  var S = {
    teacherView: 'create',   // 'create' | 'list' | 'detail'
    source: 'BANK',          // 'BANK' | 'TEXT' | 'PDF' | 'IMAGE'
    custom: [],              // questions read from text / pdf / photo
    fileData: null,
    fileName: '',
    detailId: null,
    chapters: [],
    studentAttempt: null,    // { dpp, answers, startedAt, timer }
  };

  function byId(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function base() { return typeof global.getApiBaseUrl === 'function' ? global.getApiBaseUrl() : ''; }
  function toast(msg, type) { if (typeof global.showToast === 'function') global.showToast(msg, type || 'info'); }
  function icons() { if (global.lucide && global.lucide.createIcons) { try { global.lucide.createIcons(); } catch (e) { /* ignore */ } } }
  function math(el) { if (el && typeof global.renderMathInElement === 'function') { try { global.renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) { /* ignore */ } } }
  function latex(s) { return typeof global.renderLatexString === 'function' ? global.renderLatexString(String(s || '')) : esc(s); }

  function api(path, opts) {
    return fetch(base() + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}))
      .then(function (r) { return r.json().then(function (b) { if (!r.ok || b.success === false) throw new Error(b.error || ('Request failed (' + r.status + ')')); return b; }); });
  }

  function builderState() {
    // app.js declares teacherBuilderState with const (a global binding, not a window property).
    try { return typeof teacherBuilderState !== 'undefined' ? teacherBuilderState : null; } catch (e) { return null; } // eslint-disable-line no-undef
  }
  function teacher() {
    var tb = builderState() || {};
    var t = tb.activeTeacher || {};
    var key = String(t.subjectKey || tb.teacherSubjectKey || '').toUpperCase();
    return { id: t.id || null, name: t.name || t.full_name || '', subjectKey: key, subjectName: t.subjectName || t.subject || key, subject: t.subjectName || t.subject || key };
  }
  function modeCtx() {
    try { return (global.HapsDualMode && global.HapsDualMode.getContext && global.HapsDualMode.getContext()) || {}; } catch (e) { return {}; }
  }
  function teacherClasses() {
    try { return typeof global.scopedPaperClassList === 'function' ? global.scopedPaperClassList() : []; } catch (e) { return []; }
  }
  function classLabel(c) {
    try { return typeof global.paperClassLabel === 'function' ? global.paperClassLabel(c) : c.name; } catch (e) { return c.name; }
  }
  function sectionName(section) {
    var s = String(section || '');
    var m = s.match(/^(\d+)-(NonMed|Med)$/);
    if (m) return 'Class ' + m[1] + (m[2] === 'NonMed' ? ' Non-Medical' : ' Medical');
    if (s === '10-Science-A') return 'Class 10 Section A';
    return s;
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ======================================================================
  // TEACHER
  // ======================================================================
  function renderTeacher(root) {
    var t = teacher();
    if (!t.subjectKey) {
      root.innerHTML = '<div class="dm-empty"><h3>Sign in as a teacher to create DPPs.</h3></div>';
      return;
    }
    root.removeAttribute('aria-busy');
    root.innerHTML = '<header class="dm-header"><div class="dm-header-text">'
      + '<h2 class="dm-title" tabindex="-1">Chapter-wise DPP</h2>'
      + '<p class="dm-subtitle">Create a practice set for your class, assign it, and see every student\'s result.</p>'
      + '</div></header>'
      + '<div class="shell-segmented tdpp-switch" role="tablist" aria-label="DPP views">'
      + '<button type="button" role="tab" data-tdpp-view="create" class="' + (S.teacherView === 'create' ? 'is-active' : '') + '">Create DPP</button>'
      + '<button type="button" role="tab" data-tdpp-view="list" class="' + (S.teacherView !== 'create' ? 'is-active' : '') + '">My DPPs &amp; results</button>'
      + '</div>'
      + '<div id="tdppBody" class="tdpp-body"></div>';
    root.querySelectorAll('[data-tdpp-view]').forEach(function (b) {
      b.addEventListener('click', function () { S.teacherView = b.getAttribute('data-tdpp-view'); S.detailId = null; renderTeacher(root); });
    });
    var body = byId('tdppBody');
    if (S.teacherView === 'create') renderCreate(body);
    else if (S.teacherView === 'detail' && S.detailId) renderDetail(body, S.detailId);
    else renderList(body);
    icons();
  }

  function loadChapters() {
    var t = teacher();
    var ctx = modeCtx();
    var cls = teacherClasses()[0];
    var grade = cls ? String(cls.grade || (String(cls.id).match(/^(\d+)/) || [])[1] || '') : '';
    var params = new URLSearchParams({ mode: ctx.mode || 'COMPETITIVE', stream: ctx.stream || '', board: ctx.board || '', grade: grade, role: 'teacher', teacherSubjectKey: t.subjectKey, subjectKey: t.subjectKey });
    return api('/api/modules/dpp?' + params.toString())
      .then(function (b) { S.chapters = ((b.module && b.module.data && b.module.data.chapters) || []); return S.chapters; })
      .catch(function () { S.chapters = []; return []; });
  }

  function renderCreate(body) {
    var classes = teacherClasses();
    var today = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    body.innerHTML = '<form id="tdppForm" class="tdpp-form" novalidate>'
      + '<div class="tdpp-grid">'
      + field('tdppClass', 'Class', '<select id="tdppClass" class="form-select" required>' + classes.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(classLabel(c)) + '</option>'; }).join('') + '</select>')
      + field('tdppTitle', 'Title', '<input id="tdppTitle" class="form-control" type="text" maxlength="120" placeholder="e.g. Electrostatics DPP 1">')
      + field('tdppChapter', 'Chapter', '<select id="tdppChapter" class="form-select"><option value="">Loading chapters...</option></select>')
      + field('tdppTime', 'Time limit (minutes)', '<input id="tdppTime" class="form-control" type="number" min="5" max="180" value="20">')
      + field('tdppDue', 'Due date', '<input id="tdppDue" class="form-control" type="date" value="' + today + '">')
      + field('tdppMarking', 'Marking', '<select id="tdppMarking" class="form-select"><option value="4,-1">+4 / -1 (JEE / NEET)</option><option value="1,0">+1 / 0 (no negative)</option></select>')
      + '</div>'
      + '<fieldset class="tdpp-source"><legend>Questions</legend>'
      + '<div class="shell-segmented" role="radiogroup" aria-label="Where the questions come from">'
      + srcBtn('BANK', 'From question bank') + srcBtn('TEXT', 'Type or paste') + srcBtn('PDF', 'Upload PDF') + srcBtn('IMAGE', 'Upload photo')
      + '</div>'
      + '<div id="tdppSourceBody"></div>'
      + '</fieldset>'
      + '<div class="tdpp-actions"><button type="submit" class="btn-primary" id="tdppSubmit"><i data-lucide="send" aria-hidden="true"></i> Create &amp; assign DPP</button></div>'
      + '</form>';
    body.querySelectorAll('[data-tdpp-source]').forEach(function (b) {
      b.addEventListener('click', function () { S.source = b.getAttribute('data-tdpp-source'); S.custom = []; S.fileData = null; S.fileName = ''; renderCreate(body); icons(); });
    });
    renderSourceBody();
    loadChapters().then(function (chs) {
      var sel = byId('tdppChapter');
      if (!sel) return;
      sel.innerHTML = '<option value="">All chapters (mixed)</option>' + chs.map(function (c) {
        return '<option value="' + esc(c.key) + '" data-name="' + esc(c.chapterName) + '">' + esc(c.chapterName) + ' (Class ' + esc(c.grade) + ', ' + c.count + ' Qs)</option>';
      }).join('');
    });
    byId('tdppForm').addEventListener('submit', function (e) { e.preventDefault(); submitCreate(); });
  }

  function field(id, label, control) {
    return '<div class="tdpp-field"><label for="' + id + '">' + label + '</label>' + control + '</div>';
  }
  function srcBtn(key, label) {
    return '<button type="button" role="radio" aria-checked="' + (S.source === key) + '" class="' + (S.source === key ? 'is-active' : '') + '" data-tdpp-source="' + key + '">' + label + '</button>';
  }

  function renderSourceBody() {
    var box = byId('tdppSourceBody');
    if (!box) return;
    if (S.source === 'BANK') {
      box.innerHTML = '<div class="tdpp-field tdpp-inline"><label for="tdppCount">Number of questions</label>'
        + '<input id="tdppCount" class="form-control" type="number" min="1" max="40" value="10"></div>'
        + '<p class="tdpp-hint">Picked at random from the chapter\'s multiple-choice questions that have a verified answer.</p>';
      return;
    }
    var input = S.source === 'TEXT'
      ? '<label for="tdppText" class="tdpp-label">Questions (one after another, with options (a)-(d) and "Ans: (b)" lines)</label>'
        + '<textarea id="tdppText" class="form-control tdpp-textarea" rows="8" placeholder="Q1. A charge q is placed at the centre of a cube. The flux through one face is:\n(a) q/ε0  (b) q/6ε0  (c) q/2ε0  (d) 0\nAns: (b)"></textarea>'
      : '<label for="tdppFile" class="tdpp-label">' + (S.source === 'PDF' ? 'Choose a PDF of the question sheet' : 'Choose a clear photo of the question sheet') + '</label>'
        + '<input id="tdppFile" class="form-control" type="file" accept="' + (S.source === 'PDF' ? 'application/pdf' : 'image/*') + '"' + (S.source === 'IMAGE' ? ' capture="environment"' : '') + '>'
        + (S.fileName ? '<p class="tdpp-hint">Selected: ' + esc(S.fileName) + '</p>' : '');
    box.innerHTML = input
      + '<div class="tdpp-actions-left"><button type="button" class="btn-secondary" id="tdppRead"><i data-lucide="scan-text" aria-hidden="true"></i> Read questions</button></div>'
      + '<div id="tdppPreview" class="tdpp-preview"></div>';
    var file = byId('tdppFile');
    if (file) {
      file.addEventListener('change', function () {
        var f = file.files && file.files[0];
        if (!f) return;
        if (f.size > 15 * 1024 * 1024) { toast('File is larger than 15 MB. Please use a smaller file.', 'warning'); return; }
        var reader = new FileReader();
        reader.onload = function (ev) { S.fileData = ev.target.result; S.fileName = f.name; };
        reader.readAsDataURL(f);
      });
    }
    byId('tdppRead').addEventListener('click', readQuestions);
    renderPreview();
  }

  function dualContext() {
    try { return (global.HapsDualMode && global.HapsDualMode.getContext && global.HapsDualMode.getContext()) || {}; } catch (e) { return {}; }
  }
  function examMode() { return String(dualContext().mode || 'COMPETITIVE').toUpperCase() === 'BOARD' ? 'BOARD' : 'COMPETITIVE'; }
  function examTrack() {
    var c = dualContext();
    return String(examMode() === 'BOARD' ? (c.board || 'CBSE') : (c.stream || 'JEE')).toUpperCase();
  }

  function readQuestions() {
    var t = teacher();
    var cls = (teacherClasses().find(function (c) { return c.id === (byId('tdppClass') || {}).value; }) || teacherClasses()[0] || {});
    var grade = String(cls.grade || (String(cls.id || '').match(/^(\d+)/) || [])[1] || '12');
    var payload = {
      teacher: { id: t.id, name: t.name, subject: t.subject, subjectKey: t.subjectKey, role: 'TEACHER' },
      targetSubject: t.subject, targetSubjectKey: t.subjectKey, grade: grade,
      // The import API needs the exam mode + track (from the header switch) and the source type.
      mode: examMode(), track: examTrack(),
      category: examMode() === 'BOARD' ? examTrack() + '_PYQ' : 'COMPETITIVE_OTHER',
      sourceType: S.source === 'TEXT' ? 'text' : (S.source === 'PDF' ? 'pdf' : 'image')
    };
    if (S.source === 'TEXT') {
      payload.rawText = ((byId('tdppText') || {}).value || '').trim();
      if (!payload.rawText) { toast('Type or paste at least one question first.', 'warning'); return; }
    } else {
      if (!S.fileData) { toast('Choose a file first.', 'warning'); return; }
      payload.mediaData = S.fileData;
      payload.mimeType = S.source === 'PDF' ? 'application/pdf' : (String(S.fileData).match(/^data:([^;]+);/) || [])[1] || 'image/jpeg';
    }
    var btn = byId('tdppRead');
    btn.disabled = true;
    btn.textContent = 'Reading...';
    api('/api/questions/inject/preview', { method: 'POST', body: JSON.stringify(payload) })
      .then(function (b) {
        var list = (b.questions || []).map(function (q) {
          var opts = (q.options_latex || []).map(function (o) { return { key: String(o.key).toUpperCase(), latex: o.latex, is_correct: Boolean(o.is_correct) }; });
          var keyed = opts.find(function (o) { return o.is_correct; });
          return { question_latex: q.question_latex, options_latex: opts, correct_answer: keyed ? keyed.key : (q.correct_answer || ''), solution_latex: q.solution_latex || '', chapter_name: q.chapter_name || '', difficulty: q.difficulty || 'MEDIUM' };
        });
        S.custom = S.custom.concat(list);
        if (!list.length) toast('No questions were found. Check the text or file.', 'warning');
        renderPreview();
      })
      .catch(function (err) { toast(err.message, 'error'); })
      .then(function () { btn.disabled = false; btn.innerHTML = '<i data-lucide="scan-text" aria-hidden="true"></i> Read questions'; icons(); });
  }

  function renderPreview() {
    var box = byId('tdppPreview');
    if (!box) return;
    if (!S.custom.length) { box.innerHTML = ''; return; }
    var mcq = S.custom.filter(function (q) { return q.options_latex.length >= 2; }).length;
    box.innerHTML = '<p class="tdpp-hint"><strong>' + S.custom.length + '</strong> question(s) read. Only multiple-choice questions with a correct option are added to the DPP (' + mcq + ' MCQ).</p>'
      + S.custom.map(function (q, i) {
        var isMcq = q.options_latex.length >= 2;
        return '<div class="tdpp-q' + (isMcq ? '' : ' is-skipped') + '">'
          + '<div class="tdpp-q-head"><strong>Q' + (i + 1) + '</strong>'
          + (isMcq ? '<label class="tdpp-key">Correct option <select data-tdpp-key="' + i + '" class="form-select"><option value="">Choose</option>' + q.options_latex.map(function (o) { return '<option value="' + esc(o.key) + '"' + (o.key === q.correct_answer ? ' selected' : '') + '>' + esc(o.key) + '</option>'; }).join('') + '</select></label>' : '<span class="tdpp-note">Not multiple-choice: skipped</span>')
          + '<button type="button" class="btn-secondary tdpp-remove" data-tdpp-remove="' + i + '" aria-label="Remove question ' + (i + 1) + '">Remove</button></div>'
          + '<div class="tdpp-q-text">' + latex(q.question_latex) + '</div>'
          + (isMcq ? '<ol class="tdpp-opts">' + q.options_latex.map(function (o) { return '<li><b>' + esc(o.key) + '</b> ' + latex(o.latex) + '</li>'; }).join('') + '</ol>' : '')
          + '</div>';
      }).join('');
    box.querySelectorAll('[data-tdpp-key]').forEach(function (sel) {
      sel.addEventListener('change', function () { S.custom[Number(sel.getAttribute('data-tdpp-key'))].correct_answer = sel.value; });
    });
    box.querySelectorAll('[data-tdpp-remove]').forEach(function (b) {
      b.addEventListener('click', function () { S.custom.splice(Number(b.getAttribute('data-tdpp-remove')), 1); renderPreview(); });
    });
    math(box);
  }

  function submitCreate() {
    var t = teacher();
    var section = (byId('tdppClass') || {}).value;
    if (!section) { toast('Choose a class.', 'warning'); return; }
    var chSel = byId('tdppChapter');
    var chOpt = chSel && chSel.selectedOptions && chSel.selectedOptions[0];
    var marking = String((byId('tdppMarking') || {}).value || '4,-1').split(',');
    var ctx = modeCtx();
    var payload = {
      teacher: t,
      subjectKey: t.subjectKey,
      subjectName: t.subjectName,
      section: section,
      title: (byId('tdppTitle') || {}).value || '',
      chapterCode: chSel ? chSel.value : '',
      chapterName: chOpt && chOpt.value ? chOpt.getAttribute('data-name') : '',
      timeLimitMinutes: Number((byId('tdppTime') || {}).value) || 20,
      dueDate: (byId('tdppDue') || {}).value || '',
      correctMarks: Number(marking[0]),
      incorrectMarks: Number(marking[1]),
      mode: ctx.mode || null,
      track: ctx.mode === 'COMPETITIVE' ? ctx.stream : ctx.board
    };
    if (S.source === 'BANK') {
      payload.source = 'BANK';
      payload.count = Number((byId('tdppCount') || {}).value) || 10;
    } else {
      var ready = S.custom.filter(function (q) { return q.options_latex.length >= 2; });
      var missing = ready.findIndex(function (q) { return !q.correct_answer; });
      if (!ready.length) { toast('Read at least one multiple-choice question first.', 'warning'); return; }
      if (missing !== -1) { toast('Choose the correct option for every question before assigning.', 'warning'); return; }
      payload.source = 'CUSTOM';
      payload.questions = ready.map(function (q) {
        return Object.assign({}, q, { options_latex: q.options_latex.map(function (o) { return { key: o.key, latex: o.latex, is_correct: o.key === q.correct_answer }; }) });
      });
    }
    var btn = byId('tdppSubmit');
    btn.disabled = true;
    api('/api/dpp', { method: 'POST', body: JSON.stringify(payload) })
      .then(function (b) {
        toast('DPP "' + b.dpp.title + '" assigned to ' + sectionName(b.dpp.section) + ' (' + b.dpp.questions.length + ' questions).', 'success');
        S.custom = []; S.fileData = null; S.fileName = ''; S.source = 'BANK';
        S.teacherView = 'detail'; S.detailId = b.dpp.id;
        var root = byId('tdppBody') && byId('tdppBody').parentNode;
        if (root) renderTeacher(root);
      })
      .catch(function (err) { toast(err.message, 'error'); btn.disabled = false; });
  }

  function renderList(body) {
    var t = teacher();
    body.innerHTML = '<div class="dm-loading" role="status"><span class="dm-spinner" aria-hidden="true"></span><span>Loading your DPPs...</span></div>';
    api('/api/dpp?teacherSubjectKey=' + encodeURIComponent(t.subjectKey))
      .then(function (b) {
        var list = b.dpps || [];
        if (!list.length) {
          body.innerHTML = '<div class="dm-empty"><i data-lucide="inbox" aria-hidden="true"></i><h3>No DPPs yet</h3><p>Create your first DPP and assign it to a class.</p></div>';
          icons();
          return;
        }
        body.innerHTML = '<div class="tdpp-list">' + list.map(function (d) {
          var pctTxt = d.avgPercent === null ? 'No submissions yet' : ('Average ' + d.avgPercent + '%');
          var progress = d.enrolled ? Math.round((d.submitted / d.enrolled) * 100) : 0;
          return '<button type="button" class="tdpp-card" data-tdpp-open="' + esc(d.id) + '">'
            + '<span class="tdpp-card-top"><strong>' + esc(d.title) + '</strong><span class="tdpp-chip">' + esc(sectionName(d.section)) + '</span></span>'
            + '<span class="tdpp-card-meta">' + esc(d.chapterName || 'Mixed chapters') + ' &bull; ' + d.questionCount + ' questions &bull; ' + d.timeLimitMinutes + ' min' + (d.dueDate ? ' &bull; due ' + esc(fmtDate(d.dueDate)) : '') + '</span>'
            + '<span class="tdpp-bar" aria-hidden="true"><span style="width:' + progress + '%"></span></span>'
            + '<span class="tdpp-card-meta"><b>' + d.submitted + ' / ' + d.enrolled + '</b> submitted &bull; ' + esc(pctTxt) + '</span>'
            + '</button>';
        }).join('') + '</div>';
        body.querySelectorAll('[data-tdpp-open]').forEach(function (b) {
          b.addEventListener('click', function () { S.teacherView = 'detail'; S.detailId = b.getAttribute('data-tdpp-open'); renderTeacher(body.parentNode); });
        });
        icons();
      })
      .catch(function (err) { body.innerHTML = '<div class="dm-alert dm-alert-error" role="alert">' + esc(err.message) + '</div>'; });
  }

  function renderDetail(body, id) {
    var t = teacher();
    body.innerHTML = '<div class="dm-loading" role="status"><span class="dm-spinner" aria-hidden="true"></span><span>Loading results...</span></div>';
    api('/api/dpp/' + encodeURIComponent(id) + '?teacherSubjectKey=' + encodeURIComponent(t.subjectKey))
      .then(function (b) {
        var d = b.dpp; var r = d.results;
        body.innerHTML = '<div class="tdpp-detail-head">'
          + '<button type="button" class="btn-secondary" data-tdpp-back><i data-lucide="arrow-left" aria-hidden="true"></i> All DPPs</button>'
          + '<button type="button" class="btn-secondary tdpp-danger" data-tdpp-delete><i data-lucide="trash-2" aria-hidden="true"></i> Delete</button></div>'
          + '<h3 class="tdpp-h">' + esc(d.title) + '</h3>'
          + '<p class="tdpp-hint">' + esc(sectionName(d.section)) + ' &bull; ' + esc(d.chapterName || 'Mixed chapters') + ' &bull; ' + d.questionCount + ' questions &bull; ' + d.timeLimitMinutes + ' min &bull; marking +' + d.marking.correct + ' / ' + d.marking.incorrect + (d.dueDate ? ' &bull; due ' + esc(fmtDate(d.dueDate)) : '') + '</p>'
          + '<div class="tdpp-stats">'
          + stat('Submitted', r.submitted + ' / ' + r.enrolled)
          + stat('Class average', r.avgPercent === null ? '-' : r.avgPercent + '%')
          + stat('Pending', String(r.enrolled - r.submitted))
          + stat('Questions', String(d.questionCount))
          + '</div>'
          + '<h4 class="tdpp-h4">Students</h4>'
          + '<div class="tdpp-table-wrap"><table class="assigned-table tdpp-table"><thead><tr><th>Student</th><th>Status</th><th>Score</th><th>Correct / wrong / skipped</th><th>Time</th></tr></thead><tbody>'
          + r.students.map(function (s) {
            return '<tr><td><strong>' + esc(s.name) + '</strong><br><span class="tdpp-muted">' + esc(s.roll || '') + '</span></td>'
              + '<td>' + (s.status === 'SUBMITTED' ? '<span class="tdpp-chip tdpp-ok">Submitted</span>' : '<span class="tdpp-chip">Pending</span>') + '</td>'
              + '<td>' + (s.score === null ? '-' : s.score + ' / ' + s.maxScore + ' (' + s.percent + '%)') + '</td>'
              + '<td>' + (s.correct === null ? '-' : s.correct + ' / ' + s.wrong + ' / ' + s.skipped) + '</td>'
              + '<td>' + (s.timeTakenSeconds ? Math.round(s.timeTakenSeconds / 60) + ' min' : '-') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
          + '<h4 class="tdpp-h4">Question-wise accuracy</h4>'
          + '<ol class="tdpp-qacc">' + r.perQuestion.map(function (q) {
            var acc = q.accuracy === null ? null : q.accuracy;
            return '<li><div class="tdpp-q-text">' + latex(q.questionLatex) + '</div>'
              + '<div class="tdpp-acc-row"><span class="tdpp-bar"><span style="width:' + (acc || 0) + '%"></span></span><span class="tdpp-muted">' + (acc === null ? 'No answers yet' : acc + '% correct (' + q.correct + '/' + q.answered + ') &bull; answer ' + esc(q.correctAnswer)) + '</span></div></li>';
          }).join('') + '</ol>';
        body.querySelector('[data-tdpp-back]').addEventListener('click', function () { S.teacherView = 'list'; S.detailId = null; renderTeacher(body.parentNode); });
        body.querySelector('[data-tdpp-delete]').addEventListener('click', function () {
          if (!global.confirm('Delete this DPP and its results?')) return;
          api('/api/dpp/' + encodeURIComponent(id) + '?teacherSubjectKey=' + encodeURIComponent(t.subjectKey), { method: 'DELETE' })
            .then(function () { toast('DPP deleted.', 'success'); S.teacherView = 'list'; S.detailId = null; renderTeacher(body.parentNode); })
            .catch(function (err) { toast(err.message, 'error'); });
        });
        math(body);
        icons();
      })
      .catch(function (err) { body.innerHTML = '<div class="dm-alert dm-alert-error" role="alert">' + esc(err.message) + '</div>'; });
  }

  function stat(label, value) {
    return '<div class="tdpp-stat"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
  }

  // ======================================================================
  // STUDENT
  // ======================================================================
  function studentId() {
    return (global.ACTIVE_STUDENT_PROFILE && global.ACTIVE_STUDENT_PROFILE.id) || 'b0000000-0000-0000-0000-000000000001';
  }

  function renderStudentList(box) {
    box = box || byId('studentAssignedDppList');
    if (!box) return;
    stopTimer();
    box.innerHTML = '<div class="dm-loading" role="status"><span class="dm-spinner" aria-hidden="true"></span><span>Loading your practice sets...</span></div>';
    api('/api/dpp/assigned?studentId=' + encodeURIComponent(studentId()))
      .then(function (b) {
        var list = (b.dpps || []).sort(function (a, c) { return (a.status === 'PENDING' ? 0 : 1) - (c.status === 'PENDING' ? 0 : 1) || String(c.createdAt).localeCompare(String(a.createdAt)); });
        var count = byId('studentDppCountTag');
        if (count) count.textContent = list.filter(function (d) { return d.status === 'PENDING'; }).length + ' to do';
        if (!list.length) {
          box.innerHTML = '<div class="dm-empty"><i data-lucide="inbox" aria-hidden="true"></i><h3>No practice sets yet</h3><p>When your teacher assigns a DPP, it will appear here.</p></div>';
          icons();
          return;
        }
        box.innerHTML = '<div class="tdpp-list">' + list.map(function (d) {
          var done = d.status === 'SUBMITTED';
          return '<div class="tdpp-card is-static">'
            + '<span class="tdpp-card-top"><strong>' + esc(d.title) + '</strong>' + (done ? '<span class="tdpp-chip tdpp-ok">' + d.score + ' / ' + d.maxScore + '</span>' : '<span class="tdpp-chip tdpp-todo">To do</span>') + '</span>'
            + '<span class="tdpp-card-meta">' + esc(d.subject) + ' &bull; ' + esc(d.chapterName || 'Mixed chapters') + ' &bull; ' + d.questionCount + ' questions &bull; ' + d.timeLimitMinutes + ' min</span>'
            + '<span class="tdpp-card-meta">' + (d.teacherName ? 'From ' + esc(d.teacherName) : '') + (d.dueDate ? ' &bull; due ' + esc(fmtDate(d.dueDate)) : '') + '</span>'
            + '<span class="tdpp-card-actions"><button type="button" class="' + (done ? 'btn-secondary' : 'btn-primary') + '" data-sdpp-open="' + esc(d.id) + '">' + (done ? 'See result' : 'Start') + '</button></span>'
            + '</div>';
        }).join('') + '</div>';
        box.querySelectorAll('[data-sdpp-open]').forEach(function (b) {
          b.addEventListener('click', function () { openStudentDpp(box, b.getAttribute('data-sdpp-open')); });
        });
        icons();
      })
      .catch(function (err) { box.innerHTML = '<div class="dm-alert dm-alert-error" role="alert">' + esc(err.message) + '</div>'; });
  }

  function openStudentDpp(box, id) {
    box.innerHTML = '<div class="dm-loading" role="status"><span class="dm-spinner" aria-hidden="true"></span><span>Opening...</span></div>';
    api('/api/dpp/' + encodeURIComponent(id) + '?studentId=' + encodeURIComponent(studentId()))
      .then(function (b) { renderAttempt(box, b.dpp); })
      .catch(function (err) { toast(err.message, 'error'); renderStudentList(box); });
  }

  function renderAttempt(box, d) {
    stopTimer();
    var done = Boolean(d.attempt);
    box.innerHTML = '<div class="tdpp-detail-head"><button type="button" class="btn-secondary" data-sdpp-back><i data-lucide="arrow-left" aria-hidden="true"></i> All practice sets</button>'
      + (done ? '' : '<span class="tdpp-timer" id="sdppTimer" role="timer" aria-live="off"></span>') + '</div>'
      + '<h3 class="tdpp-h">' + esc(d.title) + '</h3>'
      + '<p class="tdpp-hint">' + esc(d.subject) + ' &bull; ' + esc(d.chapterName || 'Mixed chapters') + ' &bull; marking +' + d.marking.correct + ' / ' + d.marking.incorrect + '</p>'
      + (done ? '<div class="tdpp-stats">' + stat('Score', d.attempt.score + ' / ' + d.attempt.maxScore) + stat('Percent', d.attempt.percent + '%') + stat('Correct', String(d.attempt.correct)) + stat('Wrong / skipped', d.attempt.wrong + ' / ' + d.attempt.skipped) + '</div>' : '')
      + '<form id="sdppForm"><ol class="tdpp-attempt">' + d.questions.map(function (q) {
        return '<li class="tdpp-aq"><div class="tdpp-q-text">' + latex(q.questionLatex) + '</div><div class="tdpp-aopts" role="radiogroup">'
          + q.options.map(function (o) {
            var cls = '';
            if (done) cls = o.key === q.correctAnswer ? ' is-correct' : (o.key === q.selected ? ' is-wrong' : '');
            return '<label class="tdpp-aopt' + cls + '"><input type="radio" name="sdpp_' + esc(q.id) + '" value="' + esc(o.key) + '"' + (done ? ' disabled' : '') + (done && o.key === q.selected ? ' checked' : '') + '><b>' + esc(o.key) + '</b><span>' + latex(o.latex) + '</span></label>';
          }).join('') + '</div>'
          + (done && q.solutionLatex ? '<details class="tdpp-sol"><summary>Solution</summary><div>' + latex(q.solutionLatex) + '</div></details>' : '')
          + '</li>';
      }).join('') + '</ol>'
      + (done ? '' : '<div class="tdpp-actions"><button type="submit" class="btn-primary" id="sdppSubmit">Submit DPP</button></div>')
      + '</form>';
    box.querySelector('[data-sdpp-back]').addEventListener('click', function () { renderStudentList(box); });
    if (!done) {
      S.studentAttempt = { id: d.id, startedAt: Date.now(), limit: d.timeLimitMinutes * 60 };
      startTimer(box, d);
      byId('sdppForm').addEventListener('submit', function (e) { e.preventDefault(); submitAttempt(box, d, false); });
    }
    math(box);
    icons();
  }

  function submitAttempt(box, d, auto) {
    var answers = {};
    d.questions.forEach(function (q) {
      var c = box.querySelector('input[name="sdpp_' + q.id + '"]:checked');
      if (c) answers[q.id] = c.value;
    });
    var answered = Object.keys(answers).length;
    if (!auto && answered < d.questions.length && !global.confirm('You answered ' + answered + ' of ' + d.questions.length + ' questions. Submit now?')) return;
    var taken = S.studentAttempt ? Math.round((Date.now() - S.studentAttempt.startedAt) / 1000) : null;
    stopTimer();
    var btn = byId('sdppSubmit');
    if (btn) btn.disabled = true;
    api('/api/dpp/' + encodeURIComponent(d.id) + '/submit', { method: 'POST', body: JSON.stringify({ studentId: studentId(), answers: answers, timeTakenSeconds: taken }) })
      .then(function (b) { toast('Submitted. Score ' + b.dpp.attempt.score + ' / ' + b.dpp.attempt.maxScore + '.', 'success'); renderAttempt(box, b.dpp); box.scrollIntoView({ block: 'start' }); })
      .catch(function (err) { toast(err.message, 'error'); if (btn) btn.disabled = false; });
  }

  var timerHandle = null;
  function startTimer(box, d) {
    var el = byId('sdppTimer');
    function tick() {
      if (!S.studentAttempt || !el) return;
      var left = S.studentAttempt.limit - Math.round((Date.now() - S.studentAttempt.startedAt) / 1000);
      if (left <= 0) { el.textContent = '00:00'; toast('Time is up. Your answers were submitted.', 'info'); submitAttempt(box, d, true); return; }
      el.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0') + ' left';
    }
    tick();
    timerHandle = setInterval(tick, 1000);
  }
  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }

  global.TeacherDpp = {
    renderTeacher: function (root) { S.teacherView = S.teacherView || 'create'; renderTeacher(root); },
    renderStudentList: renderStudentList
  };
})(window);
