/* =============================================================================
   CLASS DESK (2026-11-17)
   Student : Notices & homework, My doubts (ask the subject teacher),
             Mistake notebook (inside the Practice tab), printable report card.
   Teacher : Doubts inbox, Notices & homework for own classes, printable
             reports (question paper, answer key, class result sheet, student
             report card).
   Principal: School notices, printable school report.
   Backend : /api/doubts, /api/notices, /api/mistakes (see backend routes).
   Also defines window.UnisoleKit, small shared helpers used by studyBoard.js.
   ========================================================================== */
(function (global) {
  'use strict';

  // ------------------------------------------------------------------ kit --
  function byId(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function base() { return typeof global.getApiBaseUrl === 'function' ? global.getApiBaseUrl() : ''; }
  function toast(msg, type) { if (typeof global.showToast === 'function') global.showToast(msg, type || 'info'); }
  function icons() { if (global.lucide && global.lucide.createIcons) { try { global.lucide.createIcons(); } catch (e) { /* ignore */ } } }
  function latex(s) { return typeof global.renderLatexString === 'function' ? global.renderLatexString(String(s || '')) : esc(s); }
  function api(path, opts) {
    return fetch(base() + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}))
      .then(function (r) {
        return r.json().catch(function () { return { success: false, error: 'The server sent an unreadable reply (' + r.status + ').' }; })
          .then(function (b) { if (!r.ok || b.success === false) throw new Error(b.error || ('Request failed (' + r.status + ')')); return b; });
      }, function () { throw new Error('Cannot reach the server. Check your internet connection and try again.'); });
  }
  function post(path, body) { return api(path, { method: 'POST', body: JSON.stringify(body || {}) }); }
  function builderState() {
    try { return typeof teacherBuilderState !== 'undefined' ? teacherBuilderState : null; } catch (e) { return null; } // eslint-disable-line no-undef
  }
  function role() {
    try { if (typeof state !== 'undefined' && state) return state.sessionRole || state.activeRole || 'teacher'; } catch (e) { /* ignore */ } // eslint-disable-line no-undef
    return 'teacher';
  }
  function teacher() {
    var tb = builderState() || {};
    var t = tb.activeTeacher || {};
    var key = String(t.subjectKey || tb.teacherSubjectKey || '').toUpperCase();
    return { id: t.id || '', name: t.name || t.full_name || 'Teacher', subjectKey: key, subjectName: t.subjectName || t.subject || key };
  }
  function student() {
    var p = global.ACTIVE_STUDENT_PROFILE || {};
    return { id: p.id || '', name: p.name || '', section: p.section || '', grade: String(p.grade || '') };
  }
  function teacherClasses() {
    var key = teacher().subjectKey;
    var list = [];
    try { list = (typeof FACULTY_SUBJECT_CLASSES !== 'undefined' && FACULTY_SUBJECT_CLASSES[key]) || []; } catch (e) { list = []; } // eslint-disable-line no-undef
    return list.map(function (c) { return { id: c.id, name: sectionName(c.id) }; });
  }
  function sectionName(section) {
    var s = String(section || '');
    if (s === 'ALL') return 'Whole school';
    var m = s.match(/^(\d+)-(NonMed|Med)$/);
    if (m) return 'Class ' + m[1] + (m[2] === 'NonMed' ? ' Non-Medical' : ' Medical');
    if (s === '10-Science-A') return 'Class 10 Section A';
    if (s === '10-Maths-A') return 'Class 10 Maths-A';
    return s;
  }
  function fmtDate(iso, withTime) {
    if (!iso) return '';
    var d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return String(iso);
    var out = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    return withTime ? out + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : out;
  }
  function daysLeft(dateStr) {
    var d = new Date(dateStr + 'T23:59:59');
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
  }
  function loading(text) { return '<div class="dm-loading" role="status"><span class="dm-spinner" aria-hidden="true"></span><span>' + esc(text || 'Loading...') + '</span></div>'; }
  function errorBox(err) { return '<div class="dm-alert dm-alert-error" role="alert">' + esc(err && err.message ? err.message : err) + '</div>'; }
  function empty(icon, title, text) { return '<div class="dm-empty"><i data-lucide="' + icon + '" aria-hidden="true"></i><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p></div>'; }
  // Reads an image file, scales it to at most 1280px and returns a JPEG data URL (keeps uploads small).
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file) { resolve(null); return; }
      if (!/^image\//.test(file.type)) { reject(new Error('Please choose a photo (JPG or PNG).')); return; }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('The photo could not be read.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('The photo could not be opened.')); };
        img.onload = function () {
          var max = 1280;
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  // Shows a clean, printable page (school letterhead) in a preview panel inside the app.
  // No pop-up window is used, so pop-up blockers and phones do not get in the way.
  function printDoc(title, bodyHtml, subtitle) {
    var origin = location.origin + location.pathname.replace(/[^/]*$/, '');
    var doc = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(title) + '</title>'
      + '<link rel="stylesheet" href="' + origin + 'vendor/katex/katex.min.css">'
      + '<link rel="stylesheet" href="' + origin + 'css/print-report.css?v=1.0">'
      + '</head><body><div class="pr-page">'
      + '<header class="pr-head"><img src="' + origin + 'assets/brand/unisole-mark-on-light.png" alt=""><div><strong>Unisole AI School</strong><span>' + esc(subtitle || '') + '</span></div>'
      + '<div class="pr-date">' + esc(fmtDate(new Date().toISOString())) + '</div></header>'
      + '<h1>' + esc(title) + '</h1>' + bodyHtml
      + '<footer class="pr-foot">Generated from the Unisole school portal</footer></div>'
      + '</body></html>';
    closePrint();
    var wrap = document.createElement('div');
    wrap.className = 'pr-overlay';
    wrap.id = 'printPreviewOverlay';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Print preview: ' + title);
    wrap.innerHTML = '<div class="pr-bar"><strong>' + esc(title) + '</strong><span class="pr-bar-space"></span>'
      + '<button type="button" class="btn-primary" id="printPreviewPrint"><i data-lucide="printer" aria-hidden="true"></i> Print or save as PDF</button>'
      + '<button type="button" class="btn-secondary" id="printPreviewClose">Close</button></div>'
      + '<iframe class="pr-frame" id="printPreviewFrame" title="Print preview"></iframe>';
    document.body.appendChild(wrap);
    var frame = byId('printPreviewFrame');
    frame.srcdoc = doc;
    byId('printPreviewClose').addEventListener('click', closePrint);
    byId('printPreviewPrint').addEventListener('click', function () {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) { toast('Printing is not available in this browser.', 'warning'); }
    });
    document.addEventListener('keydown', printEsc);
    byId('printPreviewPrint').focus();
    icons();
    return frame;
  }
  function printEsc(e) { if (e.key === 'Escape') closePrint(); }
  function closePrint() {
    var el = byId('printPreviewOverlay');
    if (el) el.parentNode.removeChild(el);
    document.removeEventListener('keydown', printEsc);
  }

  var Kit = {
    byId: byId, esc: esc, api: api, post: post, toast: toast, icons: icons, latex: latex, role: role, teacher: teacher, student: student,
    teacherClasses: teacherClasses, sectionName: sectionName, fmtDate: fmtDate, loading: loading, errorBox: errorBox, empty: empty,
    readImage: readImage, printDoc: printDoc
  };
  global.UnisoleKit = Kit;

  // ============================================================= student --
  var S = { studentView: 'notices', teacherView: 'doubts', doubtFilter: 'OPEN', mistakeFilter: 'OPEN', pendingImage: null };

  function segmented(id, items, active) {
    return '<div class="shell-segmented cd-switch" id="' + id + '" role="tablist">' + items.map(function (it) {
      return '<button type="button" role="tab" aria-selected="' + (it.key === active) + '" class="' + (it.key === active ? 'is-active' : '') + '" data-view="' + it.key + '">' + it.label + '</button>';
    }).join('') + '</div>';
  }
  function bindSwitch(root, id, fn) {
    var el = root.querySelector('#' + id);
    if (!el) return;
    el.querySelectorAll('[data-view]').forEach(function (b) { b.addEventListener('click', function () { fn(b.getAttribute('data-view')); }); });
  }
  function head(title, sub) {
    return '<div class="cd-head"><h2>' + esc(title) + '</h2><p>' + esc(sub) + '</p></div>';
  }

  // Only one role's desk exists in the page at a time (form ids are shared between them).
  function clearOthers(keep) {
    ['classDeskStudent', 'classDeskTeacher', 'pdNoticesHost'].forEach(function (id) { var el = byId(id); if (el && id !== keep) el.innerHTML = ''; });
  }
  function renderStudent() {
    var root = byId('classDeskStudent');
    if (!root) return;
    clearOthers('classDeskStudent');
    root.innerHTML = '<div class="glass-card cd-card">' + head('Class Desk', 'Notices and homework from your teachers, and your doubts.')
      + segmented('cdStudentSwitch', [{ key: 'notices', label: 'Notices &amp; homework' }, { key: 'doubts', label: 'My doubts' }], S.studentView)
      + '<div id="cdStudentBody"></div></div>';
    bindSwitch(root, 'cdStudentSwitch', function (v) { S.studentView = v; renderStudent(); });
    if (S.studentView === 'notices') studentNotices(byId('cdStudentBody')); else studentDoubts(byId('cdStudentBody'));
    icons();
  }

  function noticeChip(n) {
    if (n.type === 'HOMEWORK') return '<span class="cd-chip cd-chip-hw">Homework</span>';
    if (n.author && n.author.role === 'PRINCIPAL') return '<span class="cd-chip cd-chip-school">School notice</span>';
    return '<span class="cd-chip">Notice</span>';
  }
  function dueText(n) {
    if (!n.dueDate) return '';
    var left = daysLeft(n.dueDate);
    var cls = left < 0 ? ' cd-overdue' : (left <= 1 ? ' cd-soon' : '');
    var label = left < 0 ? 'Was due ' + fmtDate(n.dueDate) : (left === 0 ? 'Due today' : (left === 1 ? 'Due tomorrow' : 'Due ' + fmtDate(n.dueDate)));
    return '<span class="cd-due' + cls + '">' + esc(label) + '</span>';
  }

  function studentNotices(body) {
    body.innerHTML = loading('Loading notices...');
    api('/api/notices?studentId=' + encodeURIComponent(student().id)).then(function (b) {
      var list = b.notices || [];
      if (!list.length) { body.innerHTML = empty('megaphone', 'Nothing yet', 'Notices and homework from your teachers will appear here.'); icons(); return; }
      var todo = list.filter(function (n) { return n.type === 'HOMEWORK' && !n.done; }).sort(function (a, c) { return String(a.dueDate).localeCompare(String(c.dueDate)); });
      var rest = list.filter(function (n) { return todo.indexOf(n) === -1; });
      body.innerHTML = (todo.length ? '<h3 class="cd-sub">Homework to do (' + todo.length + ')</h3>' + todo.map(studentNoticeCard).join('') : '')
        + (rest.length ? '<h3 class="cd-sub">' + (todo.length ? 'Notices and finished homework' : 'Notices and homework') + '</h3>' + rest.map(studentNoticeCard).join('') : '');
      body.querySelectorAll('[data-notice-done]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          post('/api/notices/' + encodeURIComponent(cb.getAttribute('data-notice-done')) + '/done', { studentId: student().id, done: cb.checked })
            .then(function () { studentNotices(body); })
            .catch(function (err) { toast(err.message, 'error'); cb.checked = !cb.checked; });
        });
      });
      icons();
    }).catch(function (err) { body.innerHTML = errorBox(err); });
  }
  function studentNoticeCard(n) {
    return '<article class="cd-item' + (n.type === 'HOMEWORK' && n.done ? ' is-done' : '') + '">'
      + '<div class="cd-item-top">' + noticeChip(n) + (n.subject ? '<span class="cd-meta">' + esc(n.subject) + '</span>' : '') + dueText(n) + '</div>'
      + '<h4>' + esc(n.title) + '</h4>'
      + (n.body ? '<p class="cd-text">' + esc(n.body) + '</p>' : '')
      + '<div class="cd-item-foot"><span class="cd-meta">' + esc(n.author.name) + ' &bull; ' + esc(fmtDate(n.createdAt)) + '</span>'
      + (n.type === 'HOMEWORK' ? '<label class="cd-check"><input type="checkbox" data-notice-done="' + esc(n.id) + '"' + (n.done ? ' checked' : '') + '> Done</label>' : '') + '</div>'
      + '</article>';
  }

  // ---------------------------------------------------------- doubts (student)
  function statusChip(st) {
    if (st === 'ANSWERED') return '<span class="cd-chip cd-chip-ok">Answered</span>';
    if (st === 'RESOLVED') return '<span class="cd-chip">Closed</span>';
    return '<span class="cd-chip cd-chip-hw">Waiting for teacher</span>';
  }
  function thread(d, forTeacher) {
    var ctx = d.context || {};
    return '<article class="cd-item cd-thread" data-doubt="' + esc(d.id) + '">'
      + '<div class="cd-item-top">' + statusChip(d.status) + '<span class="cd-meta">' + esc(d.subject) + (forTeacher ? ' &bull; ' + esc(d.studentName) + ' (' + esc(sectionName(d.section)) + ')' : '') + '</span><span class="cd-meta cd-right">' + esc(fmtDate(d.createdAt, true)) + '</span></div>'
      + (ctx.title ? '<p class="cd-meta">About: ' + esc(ctx.title) + '</p>' : '')
      + (ctx.questionLatex ? '<div class="cd-quote">' + latex(ctx.questionLatex) + '</div>' : '')
      + (d.text ? '<p class="cd-text">' + esc(d.text) + '</p>' : '')
      + (d.imageData ? '<img class="cd-photo" src="' + esc(d.imageData) + '" alt="Photo attached to the doubt">' : '')
      + (d.replies || []).map(function (r) {
        return '<div class="cd-reply' + (r.by === 'TEACHER' ? ' is-teacher' : '') + '"><strong>' + esc(r.name) + '</strong><span class="cd-meta">' + esc(fmtDate(r.at, true)) + '</span><p>' + esc(r.text) + '</p></div>';
      }).join('')
      + (d.status !== 'RESOLVED' || forTeacher
        ? '<div class="cd-replybox"><label class="cd-sr" for="cdReply_' + esc(d.id) + '">Reply</label><textarea id="cdReply_' + esc(d.id) + '" class="form-control" rows="2" placeholder="' + (forTeacher ? 'Write your answer for the student' : 'Add more detail or a follow-up question') + '"></textarea>'
          + '<div class="cd-row-end">' + (!forTeacher && d.status !== 'RESOLVED' ? '<button type="button" class="btn-secondary" data-doubt-resolve="' + esc(d.id) + '">My doubt is cleared</button>' : '')
          + '<button type="button" class="btn-primary" data-doubt-reply="' + esc(d.id) + '">' + (forTeacher ? 'Send answer' : 'Send') + '</button></div></div>'
        : '<div class="cd-row-end"><button type="button" class="btn-secondary" data-doubt-reopen="' + esc(d.id) + '">Ask again</button></div>')
      + '</article>';
  }

  function studentDoubts(body) {
    body.innerHTML = '<form id="cdAskForm" class="cd-form" novalidate>'
      + '<div class="cd-form-row"><div class="cd-field"><label for="cdAskSubject">Subject</label><select id="cdAskSubject" class="form-select"><option value="">Loading...</option></select></div>'
      + '<div class="cd-field cd-grow"><label for="cdAskText">Your doubt</label><textarea id="cdAskText" class="form-control" rows="2" maxlength="2000" placeholder="Write what you did not understand. Your subject teacher will reply here."></textarea></div></div>'
      + '<div class="cd-row-end"><label class="btn-secondary cd-attach"><i data-lucide="camera" aria-hidden="true"></i><span id="cdAskPhotoLabel">Add a photo</span><input type="file" id="cdAskPhoto" accept="image/*" hidden></label>'
      + '<button type="submit" class="btn-primary" id="cdAskSend">Send to teacher</button></div></form>'
      + '<div id="cdDoubtList">' + loading('Loading your doubts...') + '</div>';
    api('/api/study-board/catalog?studentId=' + encodeURIComponent(student().id)).then(function (b) {
      var sel = byId('cdAskSubject');
      if (sel) sel.innerHTML = (b.subjects || []).map(function (s) { return '<option value="' + esc(s.key) + '">' + esc(s.name) + '</option>'; }).join('');
    }).catch(function () { /* list still loads */ });
    S.pendingImage = null;
    byId('cdAskPhoto').addEventListener('change', function (e) {
      readImage(e.target.files && e.target.files[0]).then(function (data) { S.pendingImage = data; byId('cdAskPhotoLabel').textContent = data ? 'Photo added' : 'Add a photo'; })
        .catch(function (err) { toast(err.message, 'warning'); });
    });
    byId('cdAskForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var text = byId('cdAskText').value.trim();
      if (text.length < 5 && !S.pendingImage) { toast('Write your doubt or add a photo first.', 'warning'); byId('cdAskText').focus(); return; }
      var btn = byId('cdAskSend');
      btn.disabled = true;
      askTeacher({ subjectKey: byId('cdAskSubject').value, text: text, imageData: S.pendingImage }).then(function () { studentDoubts(body); icons(); })
        .catch(function () { btn.disabled = false; });
    });
    loadStudentDoubts();
  }
  function loadStudentDoubts() {
    var box = byId('cdDoubtList');
    if (!box) return;
    api('/api/doubts?studentId=' + encodeURIComponent(student().id)).then(function (b) {
      var list = b.doubts || [];
      box.innerHTML = list.length ? '<h3 class="cd-sub">Your doubts (' + list.length + ')</h3>' + list.map(function (d) { return thread(d, false); }).join('')
        : empty('message-circle-question', 'No doubts yet', 'Ask above, or use "Send to my teacher" on the Study Board.');
      bindThreads(box, false, loadStudentDoubts);
      icons();
    }).catch(function (err) { box.innerHTML = errorBox(err); });
  }
  function bindThreads(box, forTeacher, reload) {
    box.querySelectorAll('[data-doubt-reply]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-doubt-reply');
        var text = (byId('cdReply_' + id) || {}).value || '';
        if (text.trim().length < 2) { toast('Write a reply first.', 'warning'); return; }
        var t = teacher();
        b.disabled = true;
        post('/api/doubts/' + encodeURIComponent(id) + '/reply', forTeacher ? { teacherSubjectKey: t.subjectKey, teacherName: t.name, text: text } : { studentId: student().id, text: text })
          .then(function () { toast(forTeacher ? 'Answer sent to the student.' : 'Sent.', 'success'); reload(); })
          .catch(function (err) { toast(err.message, 'error'); b.disabled = false; });
      });
    });
    box.querySelectorAll('[data-doubt-resolve], [data-doubt-reopen]').forEach(function (b) {
      b.addEventListener('click', function () {
        var reopen = b.hasAttribute('data-doubt-reopen');
        post('/api/doubts/' + encodeURIComponent(b.getAttribute(reopen ? 'data-doubt-reopen' : 'data-doubt-resolve')) + '/resolve', { studentId: student().id, reopen: reopen })
          .then(reload).catch(function (err) { toast(err.message, 'error'); });
      });
    });
  }
  // Used by the Study Board too ("Send to my teacher").
  function askTeacher(payload) {
    return post('/api/doubts', Object.assign({ studentId: student().id }, payload)).then(function (b) {
      toast('Sent to your ' + b.doubt.subject + ' teacher. The reply will appear in Class Desk > My doubts.', 'success');
      return b.doubt;
    }).catch(function (err) { toast(err.message, 'error'); throw err; });
  }

  // =========================================================== mistakes --
  function initPracticeSwitch() {
    var sw = byId('practiceSwitch');
    if (!sw || sw.getAttribute('data-bound')) return;
    sw.setAttribute('data-bound', '1');
    sw.querySelectorAll('[data-practice]').forEach(function (b) {
      b.addEventListener('click', function () { showPractice(b.getAttribute('data-practice')); });
    });
  }
  function showPractice(view) {
    var sw = byId('practiceSwitch');
    if (!sw) return;
    sw.querySelectorAll('[data-practice]').forEach(function (b) { var on = b.getAttribute('data-practice') === view; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); });
    var dpp = byId('studentAssignedDppList'); var nb = byId('studentMistakeNotebook');
    if (dpp) dpp.hidden = view !== 'dpp';
    if (nb) nb.hidden = view !== 'mistakes';
    if (view === 'mistakes') renderMistakes();
  }
  function refreshMistakeCount() {
    var tag = byId('mistakeOpenCount');
    if (!tag || !student().id) return;
    api('/api/mistakes?studentId=' + encodeURIComponent(student().id)).then(function (b) { tag.textContent = b.summary.open ? ' (' + b.summary.open + ')' : ''; }).catch(function () { /* optional */ });
  }
  function renderMistakes() {
    var box = byId('studentMistakeNotebook');
    if (!box) return;
    box.innerHTML = loading('Opening your notebook...');
    api('/api/mistakes?studentId=' + encodeURIComponent(student().id)).then(function (b) {
      var sum = b.summary;
      var tag = byId('mistakeOpenCount');
      if (tag) tag.textContent = sum.open ? ' (' + sum.open + ')' : '';
      if (!sum.total) { box.innerHTML = empty('notebook-pen', 'Your notebook is empty', 'Questions you get wrong in tests, DPPs and Study Board practice are saved here to revise.'); icons(); return; }
      var items = b.items.filter(function (i) { return S.mistakeFilter === 'OPEN' ? i.status !== 'MASTERED' : i.status === 'MASTERED'; });
      box.innerHTML = '<div class="cd-stats"><div><span>To revise</span><strong>' + sum.open + '</strong></div><div><span>Mastered</span><strong>' + sum.mastered + '</strong></div>'
        + '<div class="cd-grow"><span>Topics to work on</span><p>' + (sum.topics.length ? sum.topics.map(function (t) { return esc(t.topic) + ' (' + t.count + ')'; }).join(', ') : 'All clear') + '</p></div></div>'
        + segmented('cdMistakeSwitch', [{ key: 'OPEN', label: 'To revise (' + sum.open + ')' }, { key: 'MASTERED', label: 'Mastered (' + sum.mastered + ')' }], S.mistakeFilter)
        + (items.length ? items.map(mistakeCard).join('') : '<p class="cd-meta cd-pad">' + (S.mistakeFilter === 'OPEN' ? 'Nothing left to revise. Well done.' : 'Answer a question correctly here to move it to Mastered.') + '</p>');
      bindSwitch(box, 'cdMistakeSwitch', function (v) { S.mistakeFilter = v; renderMistakes(); });
      box.querySelectorAll('[data-m-answer]').forEach(function (btn) {
        btn.addEventListener('click', function () { retry(btn.getAttribute('data-m-key'), { answer: btn.getAttribute('data-m-answer') }); });
      });
      box.querySelectorAll('[data-m-reveal]').forEach(function (btn) { btn.addEventListener('click', function () { retry(btn.getAttribute('data-m-reveal'), { reveal: true }); }); });
      box.querySelectorAll('[data-m-status]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          post('/api/mistakes/status', { studentId: student().id, key: btn.getAttribute('data-m-key'), status: btn.getAttribute('data-m-status') }).then(renderMistakes).catch(function (err) { toast(err.message, 'error'); });
        });
      });
      icons();
    }).catch(function (err) { box.innerHTML = errorBox(err); });
  }
  function retry(key, body) {
    post('/api/mistakes/retry', Object.assign({ studentId: student().id, key: key }, body)).then(function (b) {
      if (b.item.correct === true) toast('Correct. Moved to Mastered.', 'success');
      else if (b.item.correct === false) toast('Not yet. Read the solution and try again later.', 'info');
      renderMistakes();
    }).catch(function (err) { toast(err.message, 'error'); });
  }
  function mistakeCard(m) {
    var src = m.source === 'TEST' ? 'Test' : (m.source === 'DPP' ? 'DPP' : 'Practice');
    var shown = m.correctAnswer !== undefined;
    var opts = m.options.map(function (o) {
      var cls = shown ? (o.key === m.correctAnswer ? ' is-correct' : (o.key === m.yourAnswer ? ' is-wrong' : '')) : '';
      return '<button type="button" class="cd-opt' + cls + '"' + (m.isMcq && m.status !== 'MASTERED' ? ' data-m-key="' + esc(m.key) + '" data-m-answer="' + esc(o.key) + '"' : ' disabled') + '><b>' + esc(o.key) + '</b><span>' + latex(o.latex) + '</span></button>';
    }).join('');
    return '<article class="cd-item cd-mistake">'
      + '<div class="cd-item-top"><span class="cd-chip">' + src + '</span><span class="cd-meta">' + esc([m.subject, m.topic].filter(Boolean).join(' • ')) + '</span><span class="cd-meta cd-right">' + esc(m.sourceTitle) + (m.date ? ' • ' + esc(fmtDate(m.date)) : '') + '</span></div>'
      + '<div class="cd-q">' + latex(m.questionLatex) + '</div>'
      + (opts ? '<div class="cd-opts">' + opts + '</div>' : '')
      + '<p class="cd-meta">' + (m.skipped ? 'You skipped this question.' : 'Your answer then: ' + esc(m.yourAnswer)) + (m.reason ? ' &bull; ' + esc(m.reason) : '') + (m.retries ? ' &bull; retried ' + m.retries + ' time' + (m.retries > 1 ? 's' : '') : '') + '</p>'
      + (shown ? '<details class="cd-sol"' + (m.status !== 'MASTERED' ? ' open' : '') + '><summary>Solution' + (m.isMcq ? ' (answer ' + esc(m.correctAnswer) + ')' : '') + '</summary><div>' + (m.solutionLatex ? latex(m.solutionLatex) : 'No written solution is saved for this question.') + '</div></details>' : '')
      + '<div class="cd-row-end">'
      + (m.isMcq && !shown ? '<button type="button" class="btn-secondary" data-m-reveal="' + esc(m.key) + '">Show solution</button>' : '')
      + (!m.isMcq && m.status !== 'MASTERED' ? '<button type="button" class="btn-primary" data-m-key="' + esc(m.key) + '" data-m-status="MASTERED">I have revised this</button>' : '')
      + (m.status === 'MASTERED' ? '<button type="button" class="btn-secondary" data-m-key="' + esc(m.key) + '" data-m-status="OPEN">Move back to revise</button>' : '')
      + '</div></article>';
  }

  // ============================================================= teacher --
  function renderTeacher() {
    var root = byId('classDeskTeacher');
    if (!root) return;
    var t = teacher();
    clearOthers('classDeskTeacher');
    if (!t.subjectKey) { root.innerHTML = empty('log-in', 'Sign in as a teacher', 'Class Desk opens after you sign in.'); icons(); return; }
    root.innerHTML = '<div class="glass-card cd-card">' + head('Class Desk', 'Student doubts, notices and homework for your classes, and printable reports.')
      + segmented('cdTeacherSwitch', [{ key: 'doubts', label: 'Doubts <span id="cdDoubtBadge"></span>' }, { key: 'notices', label: 'Notices &amp; homework' }, { key: 'reports', label: 'Reports' }], S.teacherView)
      + '<div id="cdTeacherBody"></div></div>';
    bindSwitch(root, 'cdTeacherSwitch', function (v) { S.teacherView = v; renderTeacher(); });
    var body = byId('cdTeacherBody');
    if (S.teacherView === 'doubts') teacherDoubts(body);
    else if (S.teacherView === 'notices') teacherNotices(body);
    else teacherReports(body);
    icons();
  }

  function teacherDoubts(body) {
    var t = teacher();
    body.innerHTML = loading('Loading doubts...');
    api('/api/doubts?teacherSubjectKey=' + encodeURIComponent(t.subjectKey)).then(function (b) {
      var counts = b.counts || {};
      var badge = byId('cdDoubtBadge');
      if (badge) badge.textContent = counts.OPEN ? '(' + counts.OPEN + ')' : '';
      var list = (b.doubts || []).filter(function (d) { return S.doubtFilter === 'ALL' || d.status === S.doubtFilter; });
      body.innerHTML = segmented('cdDoubtFilter', [{ key: 'OPEN', label: 'Waiting (' + (counts.OPEN || 0) + ')' }, { key: 'ANSWERED', label: 'Answered (' + (counts.ANSWERED || 0) + ')' }, { key: 'ALL', label: 'All' }], S.doubtFilter)
        + (list.length ? list.map(function (d) { return thread(d, true); }).join('')
          : empty('inbox', S.doubtFilter === 'OPEN' ? 'No doubts waiting' : 'Nothing here', 'Doubts your ' + t.subjectName + ' students send from their Class Desk or the Study Board appear here.'));
      bindSwitch(body, 'cdDoubtFilter', function (v) { S.doubtFilter = v; teacherDoubts(body); });
      bindThreads(body, true, function () { teacherDoubts(body); });
      icons();
    }).catch(function (err) { body.innerHTML = errorBox(err); });
  }

  function noticeForm(opts) {
    var due = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    return '<form id="cdNoticeForm" class="cd-form" novalidate>'
      + '<div class="cd-form-row">'
      + (opts.homework ? '<div class="cd-field"><label for="cdNoticeType">Type</label><select id="cdNoticeType" class="form-select"><option value="HOMEWORK">Homework</option><option value="NOTICE">Notice</option></select></div>' : '')
      + '<div class="cd-field"><label for="cdNoticeClass">' + (opts.school ? 'Send to' : 'Class') + '</label><select id="cdNoticeClass" class="form-select">' + opts.classes.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>'; }).join('') + '</select></div>'
      + (opts.homework ? '<div class="cd-field" id="cdDueWrap"><label for="cdNoticeDue">Due date</label><input type="date" id="cdNoticeDue" class="form-control" value="' + due + '"></div>' : '')
      + '<div class="cd-field cd-grow"><label for="cdNoticeTitle">Title</label><input type="text" id="cdNoticeTitle" class="form-control" maxlength="140" placeholder="' + (opts.homework ? 'e.g. NCERT Exercise 1.1 to 1.10' : 'e.g. Parent-teacher meeting on Saturday') + '"></div>'
      + '</div>'
      + '<div class="cd-field"><label for="cdNoticeBody">Details (optional)</label><textarea id="cdNoticeBody" class="form-control" rows="2" maxlength="3000"></textarea></div>'
      + '<div class="cd-row-end"><button type="submit" class="btn-primary" id="cdNoticePost">Post</button></div></form>';
  }
  function bindNoticeForm(author, reload) {
    var type = byId('cdNoticeType');
    if (type) type.addEventListener('change', function () { byId('cdDueWrap').style.display = type.value === 'HOMEWORK' ? '' : 'none'; });
    byId('cdNoticeForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = byId('cdNoticeTitle').value.trim();
      if (title.length < 3) { toast('Give it a short title.', 'warning'); byId('cdNoticeTitle').focus(); return; }
      var kind = type ? type.value : 'NOTICE';
      var btn = byId('cdNoticePost');
      btn.disabled = true;
      post('/api/notices', { author: author, type: kind, title: title, body: byId('cdNoticeBody').value, section: byId('cdNoticeClass').value, dueDate: kind === 'HOMEWORK' ? byId('cdNoticeDue').value : null })
        .then(function (b) { toast((kind === 'HOMEWORK' ? 'Homework' : 'Notice') + ' posted to ' + sectionName(b.notice.section) + '.', 'success'); reload(); })
        .catch(function (err) { toast(err.message, 'error'); btn.disabled = false; });
    });
  }
  function staffNoticeCard(n, canDelete) {
    return '<article class="cd-item">'
      + '<div class="cd-item-top">' + noticeChip(n) + '<span class="cd-meta">' + esc(sectionName(n.section)) + (n.subject ? ' &bull; ' + esc(n.subject) : '') + '</span>' + dueText(n) + '</div>'
      + '<h4>' + esc(n.title) + '</h4>' + (n.body ? '<p class="cd-text">' + esc(n.body) + '</p>' : '')
      + '<div class="cd-item-foot"><span class="cd-meta">' + esc(n.author.name) + ' &bull; ' + esc(fmtDate(n.createdAt)) + (n.type === 'HOMEWORK' ? ' &bull; <b>' + n.doneCount + ' of ' + n.classSize + '</b> marked done' : '') + '</span>'
      + (canDelete ? '<button type="button" class="btn-secondary cd-danger" data-notice-delete="' + esc(n.id) + '">Delete</button>' : '') + '</div></article>';
  }
  function bindNoticeDelete(box, query, reload) {
    box.querySelectorAll('[data-notice-delete]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!global.confirm('Delete this for everyone?')) return;
        api('/api/notices/' + encodeURIComponent(b.getAttribute('data-notice-delete')) + '?' + query, { method: 'DELETE' }).then(function () { toast('Deleted.', 'success'); reload(); }).catch(function (err) { toast(err.message, 'error'); });
      });
    });
  }
  function teacherNotices(body) {
    var t = teacher();
    body.innerHTML = noticeForm({ homework: true, classes: teacherClasses() }) + '<div id="cdNoticeList">' + loading('Loading...') + '</div>';
    var reload = function () { teacherNotices(body); icons(); };
    bindNoticeForm({ role: 'TEACHER', name: t.name, id: t.id, subjectKey: t.subjectKey, subjectName: t.subjectName }, reload);
    api('/api/notices?teacherSubjectKey=' + encodeURIComponent(t.subjectKey)).then(function (b) {
      var box = byId('cdNoticeList');
      var list = b.notices || [];
      box.innerHTML = list.length ? '<h3 class="cd-sub">Posted (' + list.length + ')</h3>' + list.map(function (n) { return staffNoticeCard(n, n.mine); }).join('')
        : empty('megaphone', 'Nothing posted yet', 'Post homework or a notice to one of your classes above.');
      bindNoticeDelete(box, 'teacherSubjectKey=' + encodeURIComponent(t.subjectKey), reload);
      icons();
    }).catch(function (err) { byId('cdNoticeList').innerHTML = errorBox(err); });
  }

  // ------------------------------------------------------------- reports --
  function teacherReports(body) {
    var t = teacher();
    body.innerHTML = loading('Loading tests and students...');
    Promise.all([
      api('/api/analytics/class-dashboard?teacherSubjectKey=' + encodeURIComponent(t.subjectKey)).catch(function () { return { availableAssessments: [] }; }),
      api('/api/curriculum/students?subjectKey=' + encodeURIComponent(t.subjectKey)).catch(function () { return { students: [] }; })
    ]).then(function (res) {
      var tests = res[0].availableAssessments || [];
      var students = res[1].students || res[1].data || [];
      body.innerHTML = '<div class="cd-report-grid">'
        + '<section class="cd-report"><h3>Test papers and results</h3><p class="cd-meta">Opens a clean page you can print or save as PDF.</p>'
        + (tests.length ? '<div class="cd-field"><label for="cdReportTest">Test</label><select id="cdReportTest" class="form-select">' + tests.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.rawTitle || a.title) + ' (' + esc(sectionName(a.section)) + ')</option>'; }).join('') + '</select></div>'
          + '<div class="cd-btns"><button type="button" class="btn-secondary" data-report="paper"><i data-lucide="file-text" aria-hidden="true"></i> Question paper</button>'
          + '<button type="button" class="btn-secondary" data-report="key"><i data-lucide="key-round" aria-hidden="true"></i> Answer key</button>'
          + '<button type="button" class="btn-primary" data-report="results"><i data-lucide="table" aria-hidden="true"></i> Class result sheet</button></div>'
          : '<p class="cd-meta">No tests published yet for ' + esc(t.subjectName) + '.</p>')
        + '</section>'
        + '<section class="cd-report"><h3>Student report card</h3><p class="cd-meta">' + esc(t.subjectName) + ' performance of one student, for parents.</p>'
        + (students.length ? '<div class="cd-field"><label for="cdReportStudent">Student</label><select id="cdReportStudent" class="form-select">' + students.map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.full_name || s.name) + ' (' + esc(sectionName(s.section)) + ')</option>'; }).join('') + '</select></div>'
          + '<div class="cd-btns"><button type="button" class="btn-primary" data-report="student"><i data-lucide="user-round" aria-hidden="true"></i> Report card</button></div>'
          : '<p class="cd-meta">No students found for your classes.</p>')
        + '</section></div>';
      body.querySelectorAll('[data-report]').forEach(function (b) {
        b.addEventListener('click', function () {
          var kind = b.getAttribute('data-report');
          var done = function () { b.disabled = false; };
          b.disabled = true;
          var job = kind === 'student' ? printStudentReport((byId('cdReportStudent') || {}).value, t.subjectName)
            : (kind === 'results' ? printResultSheet(byId('cdReportTest').value) : printPaper(byId('cdReportTest').value, kind === 'key'));
          job.catch(function (err) { toast(err.message, 'error'); }).then(done);
        });
      });
      icons();
    });
  }

  function optionsOf(q) {
    return (q.options_latex || q.options || []).map(function (o) { return { key: o.key, latex: o.latex || o.text || '' }; }).filter(function (o) { return o.key; });
  }
  function printPaper(id, withKey) {
    return api('/api/assessments/' + encodeURIComponent(id)).then(function (b) {
      var a = b.assessment;
      var html = '<div class="pr-meta"><span>Class: <b>' + esc(sectionName(a.section)) + '</b></span><span>Subject: <b>' + esc(a.subject) + '</b></span><span>Time: <b>' + esc(a.durationMinutes) + ' min</b></span><span>Maximum marks: <b>' + esc(a.totalMarks) + '</b></span></div>'
        + (withKey ? '' : '<div class="pr-fill"><span>Name: ______________________________</span><span>Roll no: ____________</span><span>Date: ____________</span></div>')
        + '<ol class="pr-questions">' + (a.questions || []).map(function (q) {
          var opts = optionsOf(q);
          return '<li><div class="pr-q">' + latex(q.question_latex || q.questionLatex || '') + '</div>'
            + (opts.length ? '<div class="pr-opts">' + opts.map(function (o) { return '<span><b>(' + esc(o.key) + ')</b> ' + latex(o.latex) + '</span>'; }).join('') + '</div>' : '')
            + (withKey ? '<div class="pr-key"><b>Answer: ' + esc(q.correct_answer || '-') + '</b>' + (q.solution_latex ? '<div>' + latex(q.solution_latex) + '</div>' : '') + '</div>' : '')
            + '</li>';
        }).join('') + '</ol>';
      printDoc((withKey ? 'Answer key: ' : '') + a.title, html, a.teacherName ? 'Teacher: ' + a.teacherName : '');
    });
  }
  // "16 (Aryan Sharma)" from { score, students: [{ studentName }] } (older replies carry studentName directly).
  function scoreWho(x) {
    if (!x || x.score === undefined || x.score === null) return '-';
    var names = (x.students || []).map(function (st) { return st.studentName; }).filter(Boolean);
    if (!names.length && x.studentName) names = [x.studentName];
    return x.score + (names.length ? ' (' + names.slice(0, 2).join(', ') + (names.length > 2 ? ' +' + (names.length - 2) : '') + ')' : '');
  }
  function pctText(v) { if (v === null || v === undefined || v === '') return '-'; return /%$/.test(String(v)) ? String(v) : v + '%'; }
  function printResultSheet(id) {
    var t = teacher();
    return api('/api/analytics/class-dashboard?teacherSubjectKey=' + encodeURIComponent(t.subjectKey) + '&assessmentId=' + encodeURIComponent(id)).then(function (d) {
      if (!d.assessment) throw new Error('No data for this test yet.');
      var a = d.assessment; var cs = d.classSummary || {};
      var html = '<div class="pr-meta"><span>Class: <b>' + esc(sectionName(a.section)) + '</b></span><span>Subject: <b>' + esc(a.subject) + '</b></span><span>Questions: <b>' + esc(a.totalQuestions) + '</b></span><span>Maximum marks: <b>' + esc(a.totalMarks) + '</b></span></div>'
        + '<div class="pr-stats"><div><span>Submitted</span><b>' + esc(cs.totalSubmissions || 0) + ' of ' + esc(cs.classEnrolledCount || 0) + '</b></div><div><span>Class average</span><b>' + esc(pctText(cs.averagePercentage)) + '</b></div>'
        + '<div><span>Highest</span><b>' + esc(scoreWho(cs.highestScore)) + '</b></div><div><span>Lowest</span><b>' + esc(scoreWho(cs.lowestScore)) + '</b></div></div>'
        + '<h2>Students</h2><table class="pr-table"><thead><tr><th>#</th><th>Roll no</th><th>Student</th><th>Marks</th><th>Percent</th><th>Wrong</th><th>Time</th></tr></thead><tbody>'
        + (d.studentRoster || []).slice().sort(function (x, y) { return (y.percentage || 0) - (x.percentage || 0); }).map(function (s, i) {
          return '<tr><td>' + (i + 1) + '</td><td>' + esc(s.rollNumber || '') + '</td><td>' + esc(s.studentName) + '</td><td>' + esc(s.score) + ' / ' + esc(s.totalMarks) + '</td><td>' + esc(pctText(s.percentage)) + '</td><td>' + esc(s.wrongQuestionsCount) + '</td><td>' + Math.round((s.totalTimeSpentSeconds || 0) / 60) + ' min</td></tr>';
        }).join('') + '</tbody></table>'
        + '<h2>Question-wise</h2><table class="pr-table"><thead><tr><th>Q</th><th>Topic</th><th>Attempted</th><th>Correct</th><th>Accuracy</th></tr></thead><tbody>'
        + (d.questionAnalytics || []).map(function (q) {
          return '<tr><td>' + esc(q.questionIndex) + '</td><td>' + esc(q.subtopic || q.topic || '') + '</td><td>' + esc(q.attemptCount) + '</td><td>' + esc(q.correctCount) + '</td><td>' + esc(pctText(q.accuracyRate)) + '</td></tr>';
        }).join('') + '</tbody></table>';
      printDoc('Result sheet: ' + a.title, html, 'Teacher: ' + t.name);
    });
  }
  function reportCardHtml(info, subs, dpps, mistakes) {
    var avg = subs.length ? Math.round(subs.reduce(function (s, x) { return s + (Number(x.percentage) || 0); }, 0) / subs.length) : null;
    var doneDpps = dpps.filter(function (d) { return d.status === 'SUBMITTED'; });
    return '<div class="pr-meta"><span>Student: <b>' + esc(info.name) + '</b></span><span>Class: <b>' + esc(sectionName(info.section)) + '</b></span>' + (info.subject ? '<span>Subject: <b>' + esc(info.subject) + '</b></span>' : '') + '</div>'
      + '<div class="pr-stats"><div><span>Tests taken</span><b>' + subs.length + '</b></div><div><span>Average</span><b>' + (avg === null ? '-' : avg + '%') + '</b></div>'
      + '<div><span>DPPs done</span><b>' + doneDpps.length + ' of ' + dpps.length + '</b></div>' + (mistakes ? '<div><span>Questions to revise</span><b>' + mistakes.open + '</b></div>' : '') + '</div>'
      + '<h2>Tests</h2>' + (subs.length ? '<table class="pr-table"><thead><tr><th>Date</th><th>Test</th><th>Subject</th><th>Marks</th><th>Percent</th></tr></thead><tbody>' + subs.map(function (s) {
        return '<tr><td>' + esc(fmtDate(s.submittedAt)) + '</td><td>' + esc(s.title) + '</td><td>' + esc(s.subject || '') + '</td><td>' + esc(s.totalScore) + ' / ' + esc(s.totalMarks) + '</td><td>' + esc(pctText(s.percentage)) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p>No tests submitted yet.</p>')
      + (dpps.length ? '<h2>Daily practice (DPP)</h2><table class="pr-table"><thead><tr><th>DPP</th><th>Subject</th><th>Status</th><th>Score</th></tr></thead><tbody>' + dpps.map(function (d) {
        return '<tr><td>' + esc(d.title) + '</td><td>' + esc(d.subject || '') + '</td><td>' + (d.status === 'SUBMITTED' ? 'Submitted' : 'Not done') + '</td><td>' + (d.status === 'SUBMITTED' ? esc(d.score) + ' / ' + esc(d.maxScore) : '-') + '</td></tr>';
      }).join('') + '</tbody></table>' : '')
      + (mistakes && mistakes.topics.length ? '<h2>Topics that need more practice</h2><ul class="pr-list">' + mistakes.topics.map(function (t) { return '<li>' + esc([t.subject, t.topic].filter(Boolean).join(': ')) + ' (' + t.count + ' question' + (t.count > 1 ? 's' : '') + ')</li>'; }).join('') + '</ul>' : '')
      + '<div class="pr-sign"><span>Class teacher</span><span>Parent / guardian</span></div>';
  }
  function printStudentReport(studentId, subjectName) {
    if (!studentId) return Promise.reject(new Error('Choose a student.'));
    return Promise.all([
      api('/api/analytics/student/' + encodeURIComponent(studentId) + '/submissions'),
      api('/api/dpp/assigned?studentId=' + encodeURIComponent(studentId)).catch(function () { return { dpps: [] }; }),
      subjectName ? Promise.resolve(null) : api('/api/mistakes?studentId=' + encodeURIComponent(studentId)).catch(function () { return null; })
    ]).then(function (res) {
      var st = res[0].student || {};
      var subs = res[0].submissions || [];
      var dpps = res[1].dpps || [];
      if (subjectName) {
        var match = function (x) { return String(x.subject || '').toLowerCase().indexOf(String(subjectName).toLowerCase()) !== -1; };
        subs = subs.filter(match); dpps = dpps.filter(match);
      }
      printDoc('Progress report', reportCardHtml({ name: st.name, section: st.section, subject: subjectName || '' }, subs, dpps, res[2] ? res[2].summary : null), 'Academic session 2026-27');
    });
  }
  function printSchoolReport() {
    return api('/api/analytics/principal-overview').then(function (d) {
      var t = d.totals;
      var pct = function (v) { return v === null || v === undefined ? '-' : v + '%'; };
      var html = '<div class="pr-stats"><div><span>Students</span><b>' + t.students + '</b></div><div><span>Teachers</span><b>' + t.teachers + '</b></div><div><span>Test participation</span><b>' + pct(t.participation) + '</b></div><div><span>School average</span><b>' + pct(t.avgPercent) + '</b></div><div><span>DPPs assigned</span><b>' + t.dppsCreated + '</b></div><div><span>Need support</span><b>' + t.studentsNeedingSupport + '</b></div></div>'
        + '<h2>Classes</h2><table class="pr-table"><thead><tr><th>Class</th><th>Students</th><th>Tests</th><th>Participation</th><th>Average</th><th>DPPs</th></tr></thead><tbody>' + d.classes.map(function (c) {
          return '<tr><td>' + esc(sectionName(c.section)) + '</td><td>' + c.students + '</td><td>' + c.tests + '</td><td>' + (c.tests ? pct(c.participation) : '-') + '</td><td>' + pct(c.avgPercent) + '</td><td>' + c.dpps + '</td></tr>';
        }).join('') + '</tbody></table>'
        + '<h2>Teachers</h2><table class="pr-table"><thead><tr><th>Teacher</th><th>Subject</th><th>Tests</th><th>Submissions</th><th>Class average</th><th>DPPs</th></tr></thead><tbody>' + d.teachers.map(function (x) {
          return '<tr><td>' + esc(x.name) + '</td><td>' + esc(x.subject) + '</td><td>' + x.testsPublished + '</td><td>' + x.submissionsReceived + '</td><td>' + pct(x.avgPercent) + '</td><td>' + x.dppsCreated + '</td></tr>';
        }).join('') + '</tbody></table>'
        + '<h2>Students needing support</h2>' + (d.needsSupport.length ? '<table class="pr-table"><thead><tr><th>Student</th><th>Class</th><th>Average</th><th>Tests missed</th></tr></thead><tbody>' + d.needsSupport.map(function (s) {
          return '<tr><td>' + esc(s.name) + '</td><td>' + esc(sectionName(s.section)) + '</td><td>' + pct(s.avgPercent) + '</td><td>' + s.missed + ' of ' + s.testsExpected + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p>No student is below 50% or missing a test.</p>')
        + '<h2>Hardest topics</h2>' + (d.weakTopics.length ? '<table class="pr-table"><thead><tr><th>Topic</th><th>Subject</th><th>Correct</th><th>Answers</th></tr></thead><tbody>' + d.weakTopics.map(function (w) {
          return '<tr><td>' + esc(w.topic) + '</td><td>' + esc(w.subject) + '</td><td>' + w.accuracy + '%</td><td>' + w.attempts + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p>Not enough answers yet.</p>');
      printDoc('School report', html, 'Principal: Dr. Anita Chandel');
    }).catch(function (err) { toast(err.message, 'error'); });
  }

  // =========================================================== principal --
  function renderPrincipal(host) {
    host = host || byId('pdNoticesHost');
    if (!host) return;
    clearOthers('pdNoticesHost');
    var classes = [{ id: 'ALL', name: 'Whole school' }];
    host.innerHTML = '<section class="glass-card pd-card"><h3 class="pd-h">Post a school notice</h3><div id="cdPrincipalForm">' + loading('Loading classes...') + '</div></section>'
      + '<section class="glass-card pd-card"><h3 class="pd-h">All notices and homework</h3><div id="cdNoticeList">' + loading('Loading...') + '</div></section>';
    var reload = function () { renderPrincipal(host); };
    api('/api/analytics/principal-overview').then(function (d) { (d.classes || []).forEach(function (c) { classes.push({ id: c.section, name: sectionName(c.section) }); }); }).catch(function () { /* school-wide still works */ })
      .then(function () {
        byId('cdPrincipalForm').innerHTML = noticeForm({ school: true, classes: classes });
        bindNoticeForm({ role: 'PRINCIPAL', name: 'Dr. Anita Chandel', id: 'principal' }, reload);
      });
    api('/api/notices?role=principal').then(function (b) {
      var box = byId('cdNoticeList');
      var list = b.notices || [];
      box.innerHTML = list.length ? list.map(function (n) { return staffNoticeCard(n, true); }).join('') : empty('megaphone', 'No notices yet', 'Notices you post and homework set by teachers appear here.');
      bindNoticeDelete(box, 'role=principal', reload);
      icons();
    }).catch(function (err) { byId('cdNoticeList').innerHTML = errorBox(err); });
  }

  // =============================================================== wiring --
  function addStudentPrintButton() {
    var tab = byId('tabStudentSmartReport');
    if (!tab || byId('cdPrintMyReport')) return;
    var bar = document.createElement('div');
    bar.className = 'cd-printbar';
    bar.innerHTML = '<span>Share your progress with your parents.</span><button type="button" class="btn-secondary" id="cdPrintMyReport"><i data-lucide="printer" aria-hidden="true"></i> Print or save report card (PDF)</button>';
    tab.insertBefore(bar, tab.firstChild);
    byId('cdPrintMyReport').addEventListener('click', function () { printStudentReport(student().id).catch(function (err) { toast(err.message, 'error'); }); });
    icons();
  }
  function watch(id, fn) {
    var el = byId(id);
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
    watch('tabStudentClassDesk', renderStudent);
    watch('tabTeacherClassDesk', renderTeacher);
    watch('tabStudentRemedial', function () { initPracticeSwitch(); showPractice('dpp'); refreshMistakeCount(); });
    watch('tabStudentSmartReport', addStudentPrintButton);
    initPracticeSwitch();
  }
  global.ClassDesk = {
    renderStudent: renderStudent, renderTeacher: renderTeacher, renderPrincipal: renderPrincipal, askTeacher: askTeacher,
    printSchoolReport: printSchoolReport, printStudentReport: printStudentReport, renderMistakes: renderMistakes
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);
