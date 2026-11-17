/* =============================================================================
   PRINCIPAL DASHBOARD (2026-11-17)
   Read-only, school-wide live telemetry for the principal:
     Overview  - key numbers, classes at a glance, students needing support, weak topics
     Classes   - every class: students, tests, participation, average, DPPs
     Teachers  - every teacher: classes, tests published, submissions, average, DPPs, last activity
     Tests     - every published test with participation and scores, plus weak / strong topics
   Data: GET /api/analytics/principal-overview (computed live, nothing hardcoded).
   ========================================================================== */
(function (global) {
  'use strict';

  var S = { data: null, panel: 'overview', loading: false };
  function byId(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function base() { return typeof global.getApiBaseUrl === 'function' ? global.getApiBaseUrl() : ''; }
  function icons() { if (global.lucide && global.lucide.createIcons) { try { global.lucide.createIcons(); } catch (e) { /* ignore */ } } }
  function pctTxt(v) { return v === null || v === undefined ? '-' : v + '%'; }
  function tone(v) { return v === null || v === undefined ? '' : (v < 50 ? ' pd-bad' : (v < 70 ? ' pd-mid' : ' pd-good')); }
  function sectionName(section) {
    var s = String(section || '');
    var m = s.match(/^(\d+)-(NonMed|Med)$/);
    if (m) return 'Class ' + m[1] + (m[2] === 'NonMed' ? ' Non-Medical' : ' Medical');
    if (s === '10-Science-A') return 'Class 10 Section A';
    if (s === '10-Maths-A') return 'Class 10 Maths-A';
    return s;
  }
  function fmtDate(iso) {
    if (!iso) return '-';
    var d = new Date(iso);
    return isNaN(d) ? '-' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }
  function bar(v) {
    var w = Math.max(0, Math.min(100, Number(v) || 0));
    return '<span class="pd-bar' + tone(v) + '" aria-hidden="true"><span style="width:' + w + '%"></span></span>';
  }
  function kpi(label, value, sub, icon) {
    return '<div class="pd-kpi"><div class="pd-kpi-top"><span>' + esc(label) + '</span><i data-lucide="' + icon + '" aria-hidden="true"></i></div>'
      + '<strong>' + esc(value) + '</strong>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
  }
  function card(title, inner, extra) {
    return '<section class="glass-card pd-card"' + (extra || '') + '><h3 class="pd-h">' + title + '</h3>' + inner + '</section>';
  }
  function table(head, rows, empty) {
    if (!rows.length) return '<p class="pd-empty">' + esc(empty || 'Nothing to show yet.') + '</p>';
    return '<div class="pd-table-wrap"><table class="assigned-table pd-table"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }

  function renderOverview(d) {
    var t = d.totals;
    var classes = d.classes.filter(function (c) { return c.students > 0; });
    return '<div class="pd-kpis">'
      + kpi('Students', t.students, t.classes + ' classes', 'graduation-cap')
      + kpi('Teachers', t.teachers, t.testsPublished + ' tests published', 'users')
      + kpi('Test participation', pctTxt(t.participation), t.submissions + ' submissions', 'clipboard-check')
      + kpi('School average', pctTxt(t.avgPercent), 'across all submitted tests', 'trending-up')
      + kpi('DPPs assigned', t.dppsCreated, t.dppAttempts + ' attempts', 'calendar-check')
      + kpi('Need support', t.studentsNeedingSupport, 'below 50% or missed tests', 'life-buoy')
      + '</div>'
      + '<div class="pd-grid2">'
      + card('Classes at a glance', table(['Class', 'Students', 'Tests', 'Average'], classes.map(function (c) {
        return '<tr><td><strong>' + esc(sectionName(c.section)) + '</strong></td><td>' + c.students + '</td><td>' + c.tests + '</td><td>' + bar(c.avgPercent) + ' ' + pctTxt(c.avgPercent) + '</td></tr>';
      }), 'No classes yet.'))
      + card('Students needing support', table(['Student', 'Class', 'Average', 'Missed'], d.needsSupport.slice(0, 8).map(function (s) {
        return '<tr><td><strong>' + esc(s.name) + '</strong></td><td>' + esc(sectionName(s.section)) + '</td><td class="' + tone(s.avgPercent) + '">' + pctTxt(s.avgPercent) + '</td><td>' + s.missed + ' of ' + s.testsExpected + '</td></tr>';
      }), 'No student is below 50% or missing a test.'))
      + '</div>'
      + card('Topics the school finds hardest', weakTopicList(d.weakTopics));
  }

  function weakTopicList(list) {
    if (!list.length) return '<p class="pd-empty">Not enough answers yet to rank topics.</p>';
    return '<ul class="pd-topics">' + list.map(function (tp) {
      return '<li><div><strong>' + esc(tp.topic) + '</strong><small>' + esc(tp.subject) + (tp.chapter && tp.chapter !== tp.topic ? ' &bull; ' + esc(tp.chapter) : '') + ' &bull; ' + esc(tp.sections.map(sectionName).join(', ')) + '</small></div>'
        + '<div class="pd-topic-score">' + bar(tp.accuracy) + '<span class="' + tone(tp.accuracy) + '">' + tp.accuracy + '% correct</span><small>' + tp.attempts + ' answers</small></div></li>';
    }).join('') + '</ul>';
  }

  function renderClasses(d) {
    return card('All classes', table(['Class', 'Subjects', 'Students', 'Tests', 'Participation', 'Average', 'DPPs'], d.classes.map(function (c) {
      return '<tr><td><strong>' + esc(sectionName(c.section)) + '</strong></td><td>' + esc(c.subjects.join(', ')) + '</td><td>' + c.students + '</td><td>' + c.tests + '</td>'
        + '<td>' + (c.tests ? bar(c.participation) + ' ' + pctTxt(c.participation) : '-') + '</td><td class="' + tone(c.avgPercent) + '">' + pctTxt(c.avgPercent) + '</td><td>' + c.dpps + '</td></tr>';
    }), 'No classes yet.'))
      + card('Top students', table(['Student', 'Class', 'Average', 'Tests taken'], d.topStudents.map(function (s) {
        return '<tr><td><strong>' + esc(s.name) + '</strong></td><td>' + esc(sectionName(s.section)) + '</td><td class="pd-good">' + pctTxt(s.avgPercent) + '</td><td>' + s.testsTaken + '</td></tr>';
      }), 'No submissions yet.'));
  }

  function renderTeachers(d) {
    return card('Teacher activity', table(['Teacher', 'Subject', 'Classes', 'Tests', 'Submissions', 'Class average', 'DPPs', 'Last activity'], d.teachers.map(function (t) {
      var idle = !t.testsPublished && !t.dppsCreated;
      return '<tr><td><strong>' + esc(t.name) + '</strong><br><small class="pd-muted">' + esc(t.designation) + '</small></td><td>' + esc(t.subject) + '</td>'
        + '<td>' + esc(t.classes.map(sectionName).join(', ') || '-') + '</td><td>' + t.testsPublished + '</td><td>' + t.submissionsReceived + '</td>'
        + '<td class="' + tone(t.avgPercent) + '">' + pctTxt(t.avgPercent) + '</td><td>' + t.dppsCreated + (t.dppsCreated ? ' (' + t.dppAttempts + ' attempts)' : '') + '</td>'
        + '<td>' + (idle ? '<span class="pd-chip pd-chip-warn">No tests yet</span>' : esc(fmtDate(t.lastActivity))) + '</td></tr>';
    }), 'No teachers yet.'));
  }

  function renderTests(d) {
    return card('Published tests', table(['Test', 'Class', 'Teacher', 'Submitted', 'Average', 'Lowest / highest'], d.tests.map(function (t) {
      return '<tr><td><strong>' + esc(t.title) + '</strong><br><small class="pd-muted">' + esc(t.subject) + ' &bull; ' + t.questions + ' questions &bull; ' + esc(fmtDate(t.createdAt)) + '</small></td>'
        + '<td>' + esc(sectionName(t.section)) + '</td><td>' + esc(t.teacherName || '-') + '</td>'
        + '<td>' + t.submitted + ' / ' + t.enrolled + '<br>' + bar(t.participation) + '</td>'
        + '<td class="' + tone(t.avgPercent) + '">' + pctTxt(t.avgPercent) + '</td>'
        + '<td>' + (t.lowestPercent === null ? '-' : t.lowestPercent + '% / ' + t.highestPercent + '%') + '</td></tr>';
    }), 'No tests have been published yet.'))
      + '<div class="pd-grid2">'
      + card('Hardest topics', weakTopicList(d.weakTopics))
      + card('Strongest topics', d.strongTopics.length ? '<ul class="pd-topics">' + d.strongTopics.map(function (tp) {
        return '<li><div><strong>' + esc(tp.topic) + '</strong><small>' + esc(tp.subject) + '</small></div><div class="pd-topic-score">' + bar(tp.accuracy) + '<span class="pd-good">' + tp.accuracy + '% correct</span></div></li>';
      }).join('') + '</ul>' : '<p class="pd-empty">Not enough answers yet.</p>')
      + '</div>';
  }

  // The Notices panel is drawn by js/classDesk.js (it has its own data, separate from the overview).
  function renderNotices() { return '<div id="pdNoticesHost"></div>'; }
  var RENDER = { overview: renderOverview, classes: renderClasses, teachers: renderTeachers, tests: renderTests, notices: renderNotices };
  var TITLES = { overview: 'School Overview', classes: 'Classes', teachers: 'Teachers', tests: 'Tests & Topics', notices: 'Notices' };

  function paint() {
    var d = S.data;
    Object.keys(RENDER).forEach(function (k) {
      var el = byId('pdPanel_' + k);
      if (!el) return;
      el.hidden = k !== S.panel;
      if (k === S.panel) el.innerHTML = (d || k === 'notices') ? RENDER[k](d) : '<div class="dm-loading" role="status"><span class="dm-spinner" aria-hidden="true"></span><span>Loading school data...</span></div>';
    });
    if (S.panel === 'notices' && global.ClassDesk) global.ClassDesk.renderPrincipal(byId('pdNoticesHost'));
    var title = byId('pdTitle');
    if (title) title.textContent = TITLES[S.panel];
    var upd = byId('pdUpdated');
    if (upd && d) upd.textContent = 'Live data • updated ' + new Date(d.generatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('#drawerSectionPrincipalNav [data-ptab]').forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-ptab') === S.panel);
    });
    icons();
  }

  function load(force) {
    if (S.loading) return;
    if (S.data && !force) { paint(); return; }
    S.loading = true;
    paint();
    fetch(base() + '/api/analytics/principal-overview')
      .then(function (r) { return r.json(); })
      .then(function (b) {
        if (!b || b.success === false) throw new Error((b && b.error) || 'Could not load school data.');
        S.data = b;
      })
      .catch(function (err) {
        var el = byId('pdPanel_' + S.panel);
        if (el) el.innerHTML = '<div class="dm-alert dm-alert-error" role="alert">' + esc(err.message) + '</div>';
        S.data = null;
      })
      .then(function () { S.loading = false; if (S.data) paint(); });
  }

  function show(panel) {
    if (!RENDER[panel]) panel = 'overview';
    S.panel = panel;
    if (typeof global.closeSidebarDrawer === 'function') global.closeSidebarDrawer();
    if (S.data) paint(); else load();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  global.PrincipalDashboard = { load: load, show: show, current: function () { return S.panel; } };
})(window);
