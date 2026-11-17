/**
 * ==============================================================================
 * HAPS-AI SCHOLAR ASSISTANT: DUAL-MODE ENGINE (BOARD vs COMPETITIVE)
 * Multi-tenant, data-driven mode switcher for the Teacher and Student portals.
 *
 * - Loads the school profile from GET {API}/api/tenant/config (no hardcoded tabs).
 * - Renders the header Mode pill (Board Exam / Competitive Prep) and the track
 *   sub-selector (CBSE / HP Board / ICSE or JEE / NEET).
 * - Shows, hides and relabels teacher workspace tabs from the tenant feature
 *   flags (e.g. Scan Paper Sheets is hidden in Competitive mode).
 * - Lists mode tools (DPP, Roadmap, Cheat Sheets, NCERT Core, Rank Analytics)
 *   in the side drawer and renders them in a generic Module Workspace from
 *   GET {API}/api/modules/:moduleId.
 *
 * Loaded after js/app.js. Reads host state (window.state, teacherBuilderState,
 * boardPaperStudioState) but never rewrites app.js functions. The AI Smartboard
 * tab is not modified. If the backend is unreachable the bar stays hidden and
 * the portal behaves exactly as before.
 * ==============================================================================
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'haps_dual_mode_v1';
  var DEFAULT_STUDENT_ID = 'b0000000-0000-0000-0000-000000000001';
  var TRACK_SHORT = {
    CBSE: 'CBSE',
    HP_BOARD: 'HP Board',
    ICSE: 'ICSE',
    JEE: 'JEE Main & Adv',
    NEET: 'NEET UG'
  };
  var MODE_ICONS = { BOARD: 'book-open', COMPETITIVE: 'target' };
  var CONTAINERS = {
    teacher: { tabId: 'tabModuleWorkspace', rootId: 'dmWorkspaceTeacher' },
    student: { tabId: 'tabStudentModuleWorkspace', rootId: 'dmWorkspaceStudent' }
  };

  var ds = {
    tenant: null,
    mode: null,
    tracks: { BOARD: null, COMPETITIVE: null },
    activeTool: null,
    subjectByKey: {},
    chapterByKey: {},
    roadmapWeeks: 12,
    requestSeq: 0,
    statusMsg: '',
    dppTimerId: null,
    dppStartedAt: null,
    lastClassKey: ''
  };

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------
  function byId(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function apiBase() {
    if (typeof global.getHapsApiBaseUrl === 'function') return global.getHapsApiBaseUrl();
    return 'http://localhost:5050';
  }

  function schoolId() {
    if (global.HAPS_SCHOOL_ID) return String(global.HAPS_SCHOOL_ID);
    try {
      var p = new URLSearchParams(global.location.search || '');
      if (p.get('schoolId')) return p.get('schoolId');
    } catch (e) { /* ignore */ }
    try {
      return global.localStorage ? (global.localStorage.getItem('haps_school_id') || '') : '';
    } catch (e) { return ''; }
  }

  function api(path, options) {
    var opts = options || {};
    var headers = { 'Accept': 'application/json' };
    var sid = schoolId();
    if (sid) headers['x-school-id'] = sid;
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(apiBase() + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok || body.success === false) {
          var msg = body.error || (body.errors && body.errors[0] && body.errors[0].message) || ('Request failed (' + res.status + ')');
          var err = new Error(msg);
          err.status = res.status;
          err.body = body;
          throw err;
        }
        return body;
      });
    });
  }

  function qs(params) {
    return Object.keys(params)
      .filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
      .join('&');
  }

  function save() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: ds.mode, tracks: ds.tracks, roadmapWeeks: ds.roadmapWeeks }));
    } catch (e) { /* storage unavailable */ }
  }

  function restore() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && saved.mode) ds.mode = saved.mode;
      if (saved && saved.tracks) ds.tracks = Object.assign(ds.tracks, saved.tracks);
      if (saved && saved.roadmapWeeks) ds.roadmapWeeks = saved.roadmapWeeks;
    } catch (e) { /* ignore corrupt state */ }
  }

  function refreshIcons() {
    try {
      if (typeof global.initLucideIcons === 'function') global.initLucideIcons();
      else if (global.lucide && typeof global.lucide.createIcons === 'function') global.lucide.createIcons();
    } catch (e) { /* icons are decorative */ }
  }

  function renderMath(el) {
    try {
      if (el && typeof global.renderMathInElement === 'function') {
        global.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      }
    } catch (e) { /* plain text fallback */ }
  }

  function formatNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return '-';
    try { return Number(n).toLocaleString('en-IN'); } catch (e) { return String(n); }
  }

  // --------------------------------------------------------------------------
  // Host-app context (role, class, subject)
  // --------------------------------------------------------------------------
  function currentRole() {
    var role = (global.state && global.state.activeRole) || 'teacher';
    return role === 'principal' ? 'director' : role;
  }

  function teacherState() {
    try { return typeof teacherBuilderState !== 'undefined' ? teacherBuilderState : null; } catch (e) { return null; }
  }

  function classContext() {
    if (currentRole() === 'student') {
      return { grade: '12', classStream: 'NON_MEDICAL', label: 'Class 12 Non-Medical', subjectKey: '' };
    }
    var tb = teacherState() || {};
    var id = String(tb.selectedClassId || '');
    var gradeMatch = id.match(/^(\d+)/);
    var grade = gradeMatch ? gradeMatch[1] : '';
    var classStream = /nonmed/i.test(id) ? 'NON_MEDICAL' : (/med/i.test(id) ? 'MEDICAL' : (grade === '10' ? 'FOUNDATION' : ''));
    var label = grade ? ('Class ' + grade + (classStream === 'NON_MEDICAL' ? ' Non-Medical' : classStream === 'MEDICAL' ? ' Medical' : '')) : 'this class';
    return { grade: grade, classStream: classStream, label: label, subjectKey: String(tb.teacherSubjectKey || '') };
  }

  // --------------------------------------------------------------------------
  // Mode / track resolution against the tenant profile
  // --------------------------------------------------------------------------
  function computeModes() {
    var cc = classContext();
    var modes = ds.tenant.activeModes.map(function (id) {
      var cfg = ds.tenant.modes[id];
      var gradeOk = !cc.grade || !cfg.eligibleGrades.length || cfg.eligibleGrades.indexOf(cc.grade) !== -1;
      var tracks = cfg.tracks.slice();
      if (id === 'COMPETITIVE' && cc.classStream === 'NON_MEDICAL') tracks = tracks.filter(function (t) { return t.id === 'JEE'; });
      if (id === 'COMPETITIVE' && cc.classStream === 'MEDICAL') tracks = tracks.filter(function (t) { return t.id === 'NEET'; });
      var reason = '';
      if (!gradeOk) reason = cfg.label + ' is available for Class ' + cfg.eligibleGrades.join(', ') + ' only.';
      else if (!tracks.length) reason = 'No ' + cfg.label + ' track matches ' + cc.label + '.';
      return { id: id, label: cfg.label, eligible: gradeOk && tracks.length > 0, reason: reason, tracks: tracks, cfg: cfg };
    });
    return { cc: cc, modes: modes };
  }

  function reconcile() {
    var r = computeModes();
    var cur = r.modes.filter(function (m) { return m.id === ds.mode; })[0];
    if (!cur || !cur.eligible) {
      var fallback = r.modes.filter(function (m) { return m.eligible; })[0] || r.modes[0];
      if (cur && cur.id !== fallback.id) {
        ds.statusMsg = cur.label + ' is not available for ' + r.cc.label + '. Switched to ' + fallback.label + '.';
      }
      ds.mode = fallback.id;
      cur = fallback;
    }
    var t = ds.tracks[ds.mode];
    if (!t || !cur.tracks.some(function (x) { return x.id === t; })) {
      var def = cur.tracks.filter(function (x) { return x.id === cur.cfg.defaultTrack; })[0] || cur.tracks[0];
      ds.tracks[ds.mode] = def ? def.id : null;
    }
    return { cc: r.cc, modes: r.modes, cur: cur };
  }

  function activeTrack(cur) {
    return (cur.tracks.filter(function (t) { return t.id === ds.tracks[ds.mode]; })[0]) || null;
  }

  function toolsFor(role) {
    if (!ds.tenant || !ds.mode) return [];
    var tabs = ds.tenant.modes[ds.mode].tabs[role === 'student' ? 'student' : 'teacher'] || [];
    return tabs.filter(function (t) { return t.target && t.target.type === 'module'; });
  }

  // --------------------------------------------------------------------------
  // Mode bar (header pill + track chips)
  // --------------------------------------------------------------------------
  function renderBar() {
    var bar = byId('modeSwitchBar');
    if (!bar) return;
    var role = currentRole();
    if (!ds.tenant || role === 'director') {
      bar.hidden = true;
      return;
    }
    var r = reconcile();
    bar.hidden = false;
    document.body.setAttribute('data-exam-mode', ds.mode);

    var modeGroup = byId('modeSwitchModeGroup');
    var seg = byId('modeSegmented');
    if (modeGroup) modeGroup.hidden = r.modes.length < 2;
    if (seg) {
      seg.innerHTML = r.modes.map(function (m) {
        var checked = m.id === ds.mode;
        return '<button type="button" role="radio" class="mode-seg-btn" data-mode="' + m.id + '"'
          + ' aria-checked="' + checked + '" tabindex="' + (checked ? '0' : '-1') + '"'
          + (m.eligible ? '' : ' aria-disabled="true" title="' + esc(m.reason) + '"') + '>'
          + '<i data-lucide="' + MODE_ICONS[m.id] + '" aria-hidden="true"></i>'
          + '<span>' + esc(m.label) + '</span></button>';
      }).join('');
    }

    var trackLabel = byId('modeTrackLabel');
    if (trackLabel) trackLabel.textContent = ds.mode === 'BOARD' ? 'Board' : 'Exam';
    var chips = byId('modeTrackChips');
    if (chips) {
      chips.innerHTML = r.cur.tracks.map(function (t) {
        var checked = t.id === ds.tracks[ds.mode];
        return '<button type="button" role="radio" class="mode-track-chip" data-track="' + t.id + '"'
          + ' aria-checked="' + checked + '" tabindex="' + (checked ? '0' : '-1') + '">'
          + '<span>' + esc(TRACK_SHORT[t.id] || t.label) + '</span>'
          + (t.hasContent ? '' : '<span class="mode-track-flag">No content</span>')
          + '</button>';
      }).join('');
    }

    var status = byId('modeSwitchStatus');
    if (status) {
      var track = activeTrack(r.cur);
      var toolCount = toolsFor(role).length;
      var msg = ds.statusMsg;
      if (!msg && track && !track.hasContent) msg = track.contentStatusNote;
      if (!msg) msg = r.cur.label + ' (' + (TRACK_SHORT[ds.tracks[ds.mode]] || ds.tracks[ds.mode]) + ') for ' + r.cc.label + '. ' + toolCount + ' ' + (toolCount === 1 ? 'tool' : 'tools') + ' in the menu.';
      status.textContent = msg;
      status.classList.toggle('is-warning', Boolean(track && !track.hasContent) || Boolean(ds.statusMsg));
    }
    ds.statusMsg = '';
    refreshIcons();
  }

  function handleRadioKeys(container, selector, onSelect) {
    container.addEventListener('keydown', function (e) {
      var keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (keys.indexOf(e.key) === -1) return;
      var items = Array.prototype.slice.call(container.querySelectorAll(selector))
        .filter(function (b) { return b.getAttribute('aria-disabled') !== 'true'; });
      if (!items.length) return;
      var idx = items.indexOf(document.activeElement);
      var next = idx;
      if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + items.length) % items.length;
      else next = (idx + 1) % items.length;
      e.preventDefault();
      onSelect(items[next]);
      var refocus = container.querySelector(selector + '[aria-checked="true"]');
      if (refocus) refocus.focus();
    });
  }

  function bindBar() {
    var seg = byId('modeSegmented');
    var chips = byId('modeTrackChips');
    if (seg && !seg.dataset.bound) {
      seg.dataset.bound = '1';
      var pickMode = function (btn) {
        if (!btn) return;
        if (btn.getAttribute('aria-disabled') === 'true') {
          var status = byId('modeSwitchStatus');
          if (status) {
            status.textContent = btn.getAttribute('title') || 'This mode is not available here.';
            status.classList.add('is-warning');
          }
          return;
        }
        setMode(btn.getAttribute('data-mode'));
      };
      seg.addEventListener('click', function (e) { pickMode(e.target.closest('.mode-seg-btn')); });
      handleRadioKeys(seg, '.mode-seg-btn', pickMode);
    }
    if (chips && !chips.dataset.bound) {
      chips.dataset.bound = '1';
      var pickTrack = function (btn) { if (btn) setTrack(btn.getAttribute('data-track')); };
      chips.addEventListener('click', function (e) { pickTrack(e.target.closest('.mode-track-chip')); });
      handleRadioKeys(chips, '.mode-track-chip', pickTrack);
    }
  }

  function setMode(mode) {
    if (!ds.tenant || mode === ds.mode) return;
    ds.mode = mode;
    applyAll(true);
  }

  function setTrack(track) {
    if (!ds.tenant || track === ds.tracks[ds.mode]) return;
    ds.tracks[ds.mode] = track;
    applyAll(true);
  }

  // --------------------------------------------------------------------------
  // Teacher workspace tabs (core cards) and drawer tool cards
  // --------------------------------------------------------------------------
  function applyTeacherTabs() {
    var list = document.querySelectorAll('#drawerSectionTeacherWorkspaces .drawer-nav-card[data-tab]');
    if (!list.length || !ds.tenant) return;
    var tabs = ds.tenant.modes[ds.mode].tabs.teacher || [];
    var visibleCore = [];
    Array.prototype.forEach.call(list, function (card) {
      var tabId = card.getAttribute('data-tab');
      var def = tabs.filter(function (t) { return t.target.type === 'core' && t.target.tabId === tabId; })[0];
      card.classList.toggle('dm-hidden', !def);
      if (!def) return;
      visibleCore.push(tabId);
      var title = card.querySelector('.drawer-nav-card-title');
      var sub = card.querySelector('.drawer-nav-card-sub');
      var badge = card.querySelector('.drawer-nav-card-badge');
      if (title) {
        if (!title.dataset.dmOrig) title.dataset.dmOrig = title.textContent;
        title.textContent = def.label.title || title.dataset.dmOrig;
      }
      // Elements with an id are kept up to date by app.js (counts), so only static labels are swapped.
      if (sub && !sub.id) {
        if (!sub.dataset.dmOrig) sub.dataset.dmOrig = sub.textContent;
        sub.textContent = def.label.subtitle || sub.dataset.dmOrig;
      }
      if (badge && !badge.id) {
        if (!badge.dataset.dmOrig) badge.dataset.dmOrig = badge.textContent;
        badge.textContent = def.label.badge || badge.dataset.dmOrig;
      }
    });

    // The retired Board/JEE/NEET drawer list is superseded by the header mode switch.
    var legacyTracks = byId('drawerSectionTracks');
    if (legacyTracks) legacyTracks.classList.add('dm-hidden');

    var activeTab = global.state && global.state.activeTeacherTab;
    var isCore = activeTab && document.querySelector('#drawerSectionTeacherWorkspaces .drawer-nav-card[data-tab="' + activeTab + '"]');
    if (currentRole() === 'teacher' && isCore && visibleCore.indexOf(activeTab) === -1 && visibleCore.length && typeof global.switchTeacherTab === 'function') {
      global.switchTeacherTab(visibleCore[0]);
    }
  }

  function applyPaperStudioMode() {
    var dropdown = byId('selectPaperModeDropdown');
    var r = reconcile();
    var track = activeTrack(r.cur);
    var boardPaperAllowed = ds.mode === 'BOARD' && track && track.hasContent
      && (typeof global.teacherHasBoardPaper !== 'function' || global.teacherHasBoardPaper());
    if (dropdown) {
      var opt = dropdown.querySelector('option[value="board_paper"]');
      if (opt) {
        opt.disabled = !boardPaperAllowed;
        opt.hidden = ds.mode !== 'BOARD';
      }
      if (!boardPaperAllowed && dropdown.value === 'board_paper' && typeof global.switchPaperCreationMode === 'function') {
        global.switchPaperCreationMode('unit_test');
      }
    }
    // Keep the Board Paper Studio on the board picked in the header (CBSE / HP Board).
    try {
      if (ds.mode === 'BOARD' && typeof boardPaperStudioState !== 'undefined' && (ds.tracks.BOARD === 'CBSE' || ds.tracks.BOARD === 'HP_BOARD')) {
        if (boardPaperStudioState.board !== ds.tracks.BOARD) {
          var studioVisible = byId('subModeBoardPaper') && byId('subModeBoardPaper').style.display !== 'none';
          if (studioVisible && typeof global.changeStudioBoard === 'function') {
            global.changeStudioBoard(ds.tracks.BOARD);
          } else {
            boardPaperStudioState.board = ds.tracks.BOARD;
            if (typeof global.updateBoardToggleUI === 'function') global.updateBoardToggleUI();
          }
        }
      }
    } catch (e) { /* studio not initialised yet */ }
  }

  function renderTools() {
    var section = byId('drawerSectionModeTools');
    var listEl = byId('drawerModeToolsList');
    var titleEl = byId('drawerModeToolsTitle');
    if (!section || !listEl) return;
    var role = currentRole();
    if (!ds.tenant || role === 'director') {
      section.hidden = true;
      return;
    }
    var tools = toolsFor(role);
    // Teachers: mode tools (NCERT, Roadmap, DPP, Cheat Sheet) sit inside the
    // "Teacher Workspace Tabs" list right after the core tabs, so one list holds every tab of the mode.
    var teacherList = document.querySelector('#drawerSectionTeacherWorkspaces .drawer-nav-list');
    var inlineHost = byId('drawerTeacherModeTools');
    if (role === 'teacher' && teacherList) {
      if (!inlineHost) {
        inlineHost = document.createElement('div');
        inlineHost.id = 'drawerTeacherModeTools';
        inlineHost.className = 'dm-inline-tools';
        teacherList.appendChild(inlineHost);
      }
      section.hidden = true;
      listEl.innerHTML = '';
      listEl = inlineHost;
      inlineHost.hidden = tools.length === 0;
    } else {
      if (inlineHost) { inlineHost.innerHTML = ''; inlineHost.hidden = true; }
      section.hidden = tools.length === 0;
    }
    if (titleEl) titleEl.textContent = ds.tenant.modes[ds.mode].label + ' Tools';
    listEl.innerHTML = tools.map(function (t) {
      var active = ds.activeTool === t.id && isWorkspaceVisible(role);
      return '<button type="button" class="drawer-nav-card dm-tool-card' + (active ? ' active' : '') + '" data-tool="' + esc(t.id) + '"' + (active ? ' aria-current="page"' : '') + '>'
        + '<div class="drawer-nav-card-left">'
        + '<div class="drawer-nav-card-icon dm-tone-' + esc(t.tone || 'blue') + '"><i data-lucide="' + esc(t.icon || 'layers') + '" aria-hidden="true"></i></div>'
        + '<div class="drawer-nav-card-text">'
        + '<strong class="drawer-nav-card-title">' + esc(t.label.title) + '</strong>'
        + '<span class="drawer-nav-card-sub">' + esc(t.label.subtitle) + '</span>'
        + '</div></div>'
        + '<span class="drawer-nav-card-badge teacher-nav-badge dm-badge">' + esc(t.label.badge) + '</span>'
        + '</button>';
    }).join('');
    if (!listEl.dataset.bound) {
      listEl.dataset.bound = '1';
      listEl.addEventListener('click', function (e) {
        var card = e.target.closest('.dm-tool-card');
        if (card) openTool(card.getAttribute('data-tool'));
      });
    }
    refreshIcons();
  }

  function isWorkspaceVisible(role) {
    var tab = byId(CONTAINERS[role === 'student' ? 'student' : 'teacher'].tabId);
    return Boolean(tab && tab.style.display !== 'none' && tab.style.display !== '');
  }

  function applyAll(fromUserAction) {
    if (!ds.tenant) return;
    reconcile();
    save();
    if (global.state) global.state.activeTargetStream = ds.mode === 'BOARD' ? 'BOARD' : ds.tracks.COMPETITIVE;
    applyTeacherTabs();
    applyPaperStudioMode();
    renderTools();
    renderBar();

    var role = currentRole();
    if (ds.activeTool && isWorkspaceVisible(role)) {
      var stillAvailable = toolsFor(role).some(function (t) { return t.id === ds.activeTool; });
      if (stillAvailable) {
        loadActiveTool();
      } else {
        ds.activeTool = null;
        if (role === 'teacher' && typeof global.switchTeacherTab === 'function') global.switchTeacherTab('tabTeacherCreateTestAndPaper');
        else if (role === 'student' && typeof global.switchStudentTab === 'function') global.switchStudentTab('tabStudentActiveTest');
      }
    }
    try {
      global.dispatchEvent(new CustomEvent('haps:modechange', { detail: getContext() }));
    } catch (e) { /* old browsers */ }
    if (global.UnisoleShell && typeof global.UnisoleShell.refresh === 'function') {
      global.UnisoleShell.refresh();
    }
  }

  // --------------------------------------------------------------------------
  // Module workspace
  // --------------------------------------------------------------------------
  function workspaceRoot() {
    return byId(CONTAINERS[currentRole() === 'student' ? 'student' : 'teacher'].rootId);
  }

  function findTool(toolId) {
    return toolsFor(currentRole()).filter(function (t) { return t.id === toolId; })[0] || null;
  }

  function openTool(toolId) {
    var tool = findTool(toolId);
    if (!tool) return;
    var role = currentRole();
    ds.activeTool = toolId;
    if (role === 'teacher' && typeof global.switchTeacherTab === 'function') {
      global.switchTeacherTab(CONTAINERS.teacher.tabId);
      document.querySelectorAll('#drawerSectionTeacherWorkspaces .drawer-nav-card[data-tab]').forEach(function (c) {
        c.classList.remove('active');
        c.removeAttribute('aria-current');
      });
      var matchingCard = document.querySelector('#drawerSectionTeacherWorkspaces .drawer-nav-card[data-tool="' + toolId + '"]');
      if (matchingCard) {
        matchingCard.classList.add('active');
        matchingCard.setAttribute('aria-current', 'page');
      }
    } else if (role === 'student' && typeof global.switchStudentTab === 'function') {
      global.switchStudentTab(CONTAINERS.student.tabId);
      if (typeof global.closeSidebarDrawer === 'function') global.closeSidebarDrawer();
    }
    var header = byId('headerNavTitle');
    if (header) header.innerText = tool.label.title + ' • ' + ds.tenant.modes[ds.mode].label + ' (' + (TRACK_SHORT[ds.tracks[ds.mode]] || ds.tracks[ds.mode]) + ')';
    renderTools();
    loadActiveTool();
    if (global.UnisoleShell && typeof global.UnisoleShell.refresh === 'function') {
      global.UnisoleShell.refresh();
    }
    var root = workspaceRoot();
    if (root) {
      var heading = root.querySelector('h2');
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  function memoryKey(moduleId) {
    return currentRole() + ':' + ds.mode + ':' + ds.tracks[ds.mode] + ':' + moduleId;
  }

  function moduleParams(moduleId, extra) {
    var cc = classContext();
    var role = currentRole();
    var p = {
      mode: ds.mode,
      board: ds.mode === 'BOARD' ? ds.tracks.BOARD : '',
      stream: ds.mode === 'COMPETITIVE' ? ds.tracks.COMPETITIVE : '',
      grade: cc.grade,
      role: role,
      subjectKey: ds.subjectByKey[memoryKey(moduleId)] || '',
      chapter: ds.chapterByKey[memoryKey(moduleId)] || '',
      teacherSubjectKey: role === 'teacher' ? cc.subjectKey : '',
      studentId: role === 'student' ? DEFAULT_STUDENT_ID : ('teacher_preview_' + (cc.subjectKey || 'faculty')),
      weeks: moduleId === 'roadmap' ? ds.roadmapWeeks : ''
    };
    return Object.assign(p, extra || {});
  }

  function loadActiveTool() {
    var tool = findTool(ds.activeTool);
    var root = workspaceRoot();
    if (!tool || !root) return;
    stopDppTimer();
    // Teachers do not solve DPPs: their DPP tab creates, assigns and tracks them (js/teacherDpp.js).
    if (currentRole() === 'teacher' && tool.target.moduleId === 'dpp' && global.TeacherDpp) {
      ++ds.requestSeq;
      global.TeacherDpp.renderTeacher(root);
      return;
    }
    var seq = ++ds.requestSeq;
    root.setAttribute('aria-busy', 'true');
    root.innerHTML = headerHtml(tool, null) + '<div class="dm-loading" role="status"><span class="dm-spinner" aria-hidden="true"></span><span>Loading ' + esc(tool.label.title) + '...</span></div>';
    refreshIcons();
    api('/api/modules/' + encodeURIComponent(tool.target.moduleId) + '?' + qs(moduleParams(tool.target.moduleId)))
      .then(function (body) {
        if (seq !== ds.requestSeq) return;
        renderModule(tool, body.module || {});
      })
      .catch(function (err) {
        if (seq !== ds.requestSeq) return;
        root.removeAttribute('aria-busy');
        root.innerHTML = headerHtml(tool, null)
          + '<div class="dm-alert dm-alert-error" role="alert"><i data-lucide="alert-circle" aria-hidden="true"></i>'
          + '<div><strong>Could not load ' + esc(tool.label.title) + '.</strong><p>' + esc(err.message) + '</p>'
          + '<button type="button" class="btn-secondary dm-btn" data-dm-action="retry">Try again</button></div></div>';
        refreshIcons();
      });
  }

  function headerHtml(tool, mod) {
    var cc = classContext();
    var subjects = (mod && mod.availableSubjects) || [];
    var subjectSelect = '';
    if (subjects.length > 1) {
      subjectSelect = '<div class="dm-field"><label for="dmSubjectSelect">Subject</label>'
        + '<select id="dmSubjectSelect" class="form-select dm-select">'
        + subjects.map(function (s) {
          return '<option value="' + esc(s.key) + '"' + (s.key === mod.subjectKey ? ' selected' : '') + '>' + esc(s.label) + '</option>';
        }).join('') + '</select></div>';
    }
    return '<header class="dm-header">'
      + '<div class="dm-header-text">'
      + '<h2 class="dm-title" tabindex="-1">' + esc((mod && mod.title) || tool.label.title) + '</h2>'
      + '<p class="dm-subtitle">' + esc(tool.label.subtitle) + '</p>'
      + '<div class="dm-context-pills" aria-label="Active context">'
      + '<span class="dm-pill dm-pill-mode">' + esc(ds.tenant.modes[ds.mode].label) + '</span>'
      + '<span class="dm-pill">' + esc(TRACK_SHORT[ds.tracks[ds.mode]] || ds.tracks[ds.mode]) + '</span>'
      + (cc.grade ? '<span class="dm-pill">Class ' + esc(cc.grade) + '</span>' : '')
      + '</div></div>'
      + '<div class="dm-header-controls">' + subjectSelect + '</div>'
      + '</header>';
  }

  function emptyHtml(reason) {
    return '<div class="dm-empty" role="status"><i data-lucide="inbox" aria-hidden="true"></i>'
      + '<h3>Nothing to show yet</h3><p>' + esc(reason || 'No content is available for this selection.') + '</p></div>';
  }

  function renderModule(tool, mod) {
    var root = workspaceRoot();
    if (!root) return;
    root.removeAttribute('aria-busy');
    var body = '';
    if (mod.empty || !mod.data) {
      body = emptyHtml(mod.emptyReason);
    } else if (mod.moduleId === 'dpp') {
      body = dppHtml(mod);
    } else if (mod.moduleId === 'roadmap') {
      body = roadmapHtml(mod);
    } else if (mod.moduleId === 'cheatsheets') {
      body = cheatsheetHtml(mod);
    } else if (mod.moduleId === 'ncert_core') {
      body = ncertHtml(mod);
    } else if (mod.moduleId === 'rank_analytics') {
      body = rankHtml(mod);
    } else {
      body = emptyHtml('This tool has no viewer yet.');
    }
    root.innerHTML = headerHtml(tool, mod) + '<div class="dm-body" data-module="' + esc(mod.moduleId) + '">' + body + '</div>';
    root._dmModule = mod;
    renderMath(root);
    refreshIcons();
    if (mod.moduleId === 'dpp' && !mod.empty && mod.data) startDppTimer(mod.data.timeLimitMinutes);
    if (mod.moduleId === 'ncert_core' && !mod.empty) initNcertEngine(root, mod);
  }

  // ---------------------------- DPP -----------------------------------------
  function optionList(q) {
    return (q.mcq_options || []).map(function (o) {
      var id = 'dm_' + q.id + '_' + o.key;
      return '<label class="dm-opt" for="' + esc(id) + '" data-key="' + esc(o.key) + '">'
        + '<input type="radio" id="' + esc(id) + '" name="dmq_' + esc(q.id) + '" value="' + esc(o.key) + '">'
        + '<span class="dm-opt-key" aria-hidden="true">' + esc(o.key) + '</span>'
        + '<span class="dm-opt-text">' + esc(o.latex) + '</span></label>';
    }).join('');
  }

  function dppHtml(mod) {
    var d = mod.data;
    var markText = '+' + d.marking.correct + ' / ' + (d.marking.incorrect ? d.marking.incorrect : '0');
    var streak = d.streak || { current: 0, best: 0 };
    var stats = '<dl class="dm-stats">'
      + statTile('Date', d.date)
      + statTile('Questions', d.questionCount)
      + statTile('Time limit', d.timeLimitMinutes + ' min')
      + statTile('Marking', markText)
      + statTile('Streak', streak.current + (streak.current === 1 ? ' day' : ' days') + ' (best ' + streak.best + ')')
      + '</dl>';
    var warn = d.poolWarning ? '<div class="dm-alert dm-alert-warning" role="note"><i data-lucide="alert-triangle" aria-hidden="true"></i><p>' + esc(d.poolWarning) + '</p></div>' : '';
    var questions = d.questions.map(function (q) {
      return '<fieldset class="dm-q" data-qid="' + esc(q.id) + '">'
        + '<legend class="dm-q-legend"><span class="dm-q-num">Q' + q.index + '</span>'
        + '<span class="dm-q-meta">' + esc(q.chapter_name) + ' • ' + esc(q.difficulty_level) + (q.competitive_source === 'DERIVED_BOARD_MCQ' ? ' • Board MCQ' : '') + '</span></legend>'
        + '<div class="dm-q-text">' + esc(q.question_latex) + '</div>'
        + '<div class="dm-opts">' + optionList(q) + '</div>'
        + '<div class="dm-q-feedback" hidden></div>'
        + '</fieldset>';
    }).join('');
    var isComp = ds.mode === 'COMPETITIVE';
    var pyq = (d.pyqChapters || []).length ? (
      '<section class="dm-section" aria-labelledby="dmPyqHeading"><h3 id="dmPyqHeading">Chapter-wise PYQs</h3>'
      + (isComp ? '<p class="dm-muted">Includes board PYQs that work as objective practice. The bracketed number counts questions tagged JEE or NEET.</p>' : '')
      + '<div class="dm-table-wrap"><table class="dm-table"><caption class="dm-sr-only">Previous year questions by chapter</caption>'
      + '<thead><tr><th scope="col">Chapter</th><th scope="col">PYQs</th><th scope="col">Years</th><th scope="col">Easy / Med / Hard</th><th scope="col"><span class="dm-sr-only">Action</span></th></tr></thead><tbody>'
      + d.pyqChapters.map(function (c) {
        return '<tr><td>' + esc(c.chapterName) + (c.grade ? ' <span class="dm-muted">(Class ' + esc(c.grade) + ')</span>' : '') + '</td>'
          + '<td>' + c.count + (isComp ? ' <span class="dm-muted">(' + c.nativeCompetitive + ' JEE/NEET)</span>' : '') + '</td><td>' + esc(c.years.join(', ') || '-') + '</td>'
          + '<td>' + c.difficulty.EASY + ' / ' + c.difficulty.MEDIUM + ' / ' + c.difficulty.HARD + '</td>'
          + '<td><button type="button" class="btn-secondary dm-btn dm-btn-sm" data-dm-action="pyq" data-chapter="' + esc(c.chapterCode) + '" aria-expanded="false" aria-controls="dmPyq_' + esc(c.chapterCode) + '">View</button></td></tr>'
          + '<tr class="dm-pyq-row" id="dmPyq_' + esc(c.chapterCode) + '" hidden><td colspan="5"><div class="dm-pyq-list"></div></td></tr>';
      }).join('')
      + '</tbody></table></div></section>'
    ) : '';
    var chapterPicker = (d.chapters || []).length ? '<div class="dm-inline-form">'
      + chapterSelectHtml('dmDppChapter', d.chapters.map(function (c) {
        return { key: c.key, chapterName: c.chapterName + ' - ' + c.count + ' Qs', grade: c.grade };
      }), d.chapter || 'ALL', true).replace('>All chapters<', '>All chapters (mixed)<')
      + '</div>' : '';
    return chapterPicker + stats + warn
      + '<section class="dm-section" aria-labelledby="dmDppHeading">'
      + '<div class="dm-section-head"><h3 id="dmDppHeading">' + (d.chapter ? 'Chapter DPP' : 'Today\'s set') + '</h3>'
      + '<div class="dm-timer" id="dmDppTimer" aria-label="Time remaining">' + pad(d.timeLimitMinutes) + ':00</div></div>'
      + '<p class="dm-muted">' + esc(d.sourceNote || '') + '</p>'
      + '<form id="dmDppForm" class="dm-dpp-form" novalidate data-dpp-id="' + esc(d.dppId) + '" data-date="' + esc(d.date) + '">'
      + questions
      + '<div class="dm-actions"><button type="submit" class="btn-primary dm-btn" id="dmDppSubmit">Submit DPP</button></div>'
      + '<div id="dmDppResult" role="status" aria-live="polite"></div>'
      + '</form></section>'
      + pyq;
  }

  function statTile(label, value) {
    return '<div class="dm-stat"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function startDppTimer(minutes) {
    stopDppTimer();
    var total = (Number(minutes) || 20) * 60;
    ds.dppStartedAt = Date.now();
    ds.dppTimerId = setInterval(function () {
      var el = byId('dmDppTimer');
      if (!el) { stopDppTimer(); return; }
      var elapsed = Math.floor((Date.now() - ds.dppStartedAt) / 1000);
      var left = total - elapsed;
      var abs = Math.abs(left);
      el.textContent = (left < 0 ? '+' : '') + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);
      el.classList.toggle('is-overtime', left < 0);
    }, 1000);
  }

  function stopDppTimer() {
    if (ds.dppTimerId) clearInterval(ds.dppTimerId);
    ds.dppTimerId = null;
  }

  function submitDpp(form) {
    var root = workspaceRoot();
    var mod = root && root._dmModule;
    if (!mod || !mod.data) return;
    var answers = {};
    mod.data.questions.forEach(function (q) {
      var checked = form.querySelector('input[name="dmq_' + q.id.replace(/"/g, '') + '"]:checked');
      if (checked) answers[q.id] = checked.value;
    });
    var btn = byId('dmDppSubmit');
    if (btn) { btn.disabled = true; btn.textContent = 'Checking...'; }
    var params = moduleParams('dpp', {
      subjectKey: mod.subjectKey,
      chapter: mod.data.chapter || '',
      date: form.getAttribute('data-date'),
      dppId: form.getAttribute('data-dpp-id'),
      answers: answers,
      timeTakenSeconds: ds.dppStartedAt ? Math.round((Date.now() - ds.dppStartedAt) / 1000) : null
    });
    api('/api/modules/dpp/submit', { method: 'POST', body: params })
      .then(function (res) {
        stopDppTimer();
        showDppResults(form, res);
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = 'Submit DPP'; }
        var out = byId('dmDppResult');
        if (out) out.innerHTML = '<div class="dm-alert dm-alert-error" role="alert"><p>' + esc(err.message) + '</p></div>';
      });
  }

  function showDppResults(form, res) {
    var a = res.attempt;
    (res.results || []).forEach(function (r) {
      var fs = form.querySelector('fieldset[data-qid="' + r.questionId.replace(/"/g, '') + '"]');
      if (!fs) return;
      Array.prototype.forEach.call(fs.querySelectorAll('input'), function (i) { i.disabled = true; });
      Array.prototype.forEach.call(fs.querySelectorAll('.dm-opt'), function (lab) {
        var key = lab.getAttribute('data-key');
        if (key === r.correctAnswer) lab.classList.add('dm-opt-correct');
        if (key === r.selected && !r.isCorrect) lab.classList.add('dm-opt-wrong');
      });
      var fb = fs.querySelector('.dm-q-feedback');
      if (fb) {
        var verdict = r.isCorrect ? 'Correct (+' + r.marks + ')' : (r.selected ? 'Incorrect (' + r.marks + '). Correct answer: ' + r.correctAnswer : 'Not attempted. Correct answer: ' + r.correctAnswer);
        fb.innerHTML = '<p class="dm-verdict ' + (r.isCorrect ? 'is-correct' : (r.selected ? 'is-wrong' : 'is-skipped')) + '">' + esc(verdict) + '</p>'
          + (r.trap ? '<p class="dm-trap"><strong>Trap:</strong> ' + esc(r.trap) + '</p>' : '')
          + (r.solutionLatex ? '<details class="dm-details"><summary>Solution</summary><div class="dm-solution">' + esc(r.solutionLatex) + '</div></details>' : '');
        fb.hidden = false;
      }
    });
    var btn = byId('dmDppSubmit');
    if (btn) { btn.disabled = true; btn.textContent = 'Submitted'; }
    var out = byId('dmDppResult');
    if (out) {
      out.innerHTML = '<div class="dm-result-card">'
        + '<strong>Score: ' + esc(a.score) + ' / ' + esc(a.maxScore) + '</strong>'
        + '<span>' + a.correctCount + ' correct, ' + a.wrongCount + ' wrong, ' + a.unattempted + ' not attempted</span>'
        + '<span>Streak: ' + res.streak.current + (res.streak.current === 1 ? ' day' : ' days') + ' (best ' + res.streak.best + ')</span>'
        + '</div>';
    }
    renderMath(form);
  }

  function togglePyq(btn) {
    var code = btn.getAttribute('data-chapter');
    var row = byId('dmPyq_' + code);
    if (!row) return;
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.textContent = open ? 'View' : 'Hide';
    row.hidden = open;
    if (open || row.dataset.loaded) return;
    var list = row.querySelector('.dm-pyq-list');
    list.innerHTML = '<p class="dm-muted" role="status">Loading questions...</p>';
    var root = workspaceRoot();
    var mod = root && root._dmModule;
    var p = moduleParams('dpp', { chapter: code, contentType: 'PYQ', includeSolutions: 'true', limit: 20, subjectKey: mod && mod.subjectKey !== 'ALL' ? mod.subjectKey : '' });
    delete p.role; delete p.studentId; delete p.weeks; delete p.teacherSubjectKey;
    api('/api/content?' + qs(p)).then(function (body) {
      row.dataset.loaded = '1';
      if (!body.items.length) { list.innerHTML = emptyHtml(body.emptyReason); return; }
      list.innerHTML = '<ol class="dm-pyq-items">' + body.items.map(function (q) {
        return '<li><div class="dm-q-text">' + esc(q.question_latex) + '</div>'
          + '<p class="dm-muted">' + esc(q.pyq_appearance || q.year_tag || '') + ' • ' + esc(q.difficulty_level) + '</p>'
          + (q.solution_latex ? '<details class="dm-details"><summary>Answer &amp; solution' + (q.correct_answer ? ' (' + esc(q.correct_answer) + ')' : '') + '</summary><div class="dm-solution">' + esc(q.solution_latex) + '</div></details>' : '')
          + '</li>';
      }).join('') + '</ol>' + (body.totalCount > body.count ? '<p class="dm-muted">Showing ' + body.count + ' of ' + body.totalCount + '.</p>' : '');
      renderMath(list);
    }).catch(function (err) {
      list.innerHTML = '<div class="dm-alert dm-alert-error" role="alert"><p>' + esc(err.message) + '</p></div>';
    });
  }

  // ---------------------------- Roadmap -------------------------------------
  function chapterChips(c) {
    var chips = [];
    if (c.unitWeightageMarks) chips.push('<span class="dm-chip">' + esc(c.unitWeightageMarks) + 'M unit</span>');
    if (c.highYieldTopicCount) chips.push('<span class="dm-chip dm-chip-accent">' + c.highYieldTopicCount + ' high-yield</span>');
    if (c.pyqCount) chips.push('<span class="dm-chip">' + c.pyqCount + ' PYQs</span>');
    return chips.join('');
  }

  function roadmapHtml(mod) {
    var d = mod.data;
    if (d.kind === 'BOARD_MILESTONES') {
      return '<p class="dm-muted">' + esc(d.subjectName) + ': ' + d.totals.chapters + ' chapters, ' + d.totals.pyqs + ' PYQs mapped.</p>'
        + '<div class="dm-grid dm-grid-3">' + d.milestones.map(function (m) {
          return '<section class="dm-card" aria-labelledby="dmMs_' + esc(m.id) + '">'
            + '<h3 id="dmMs_' + esc(m.id) + '">' + esc(m.title) + '</h3><p class="dm-muted">' + esc(m.goal) + '</p>'
            + '<ol class="dm-list">' + m.chapters.map(function (c) {
              return '<li><span class="dm-list-title">' + esc(c.chapterName) + '</span><span class="dm-chips">' + chapterChips(c) + '</span></li>';
            }).join('') + '</ol>'
            + (m.focus && m.focus.length ? '<h4>Pre-board focus</h4><ul class="dm-list dm-list-plain">' + m.focus.map(function (f) {
              return '<li><span class="dm-list-title">' + esc(f.topic) + '</span>' + (f.detail ? '<span class="dm-muted">' + esc(f.detail) + '</span>' : '') + '</li>';
            }).join('') + '</ul>' : '')
            + '</section>';
        }).join('') + '</div>';
    }
    var tierLabel = { MUST_DO: 'Must-do', HIGH: 'High', STANDARD: 'Standard' };
    return '<form class="dm-inline-form" id="dmRoadmapForm">'
      + '<div class="dm-field"><label for="dmWeeksInput">Weeks to exam</label>'
      + '<input type="number" id="dmWeeksInput" class="form-input dm-input" min="4" max="52" step="1" value="' + esc(d.countdown.totalWeeks) + '" inputmode="numeric"></div>'
      + '<button type="submit" class="btn-secondary dm-btn">Update plan</button></form>'
      + '<section class="dm-section" aria-labelledby="dmRankHeading"><h3 id="dmRankHeading">Chapters ranked by weightage</h3>'
      + '<p class="dm-muted">Signals: ' + esc(d.rankingSignals.join('; ')) + '.</p>'
      + '<div class="dm-table-wrap"><table class="dm-table"><caption class="dm-sr-only">Chapter weightage ranking</caption>'
      + '<thead><tr><th scope="col">#</th><th scope="col">Chapter</th><th scope="col">Tier</th><th scope="col">Score</th><th scope="col">PYQs</th><th scope="col">Blueprint match</th></tr></thead><tbody>'
      + d.chapters.map(function (c) {
        return '<tr><td>' + c.rank + '</td><td>' + esc(c.chapterName) + (c.grade ? ' <span class="dm-muted">(' + esc(c.grade) + ')</span>' : '') + '</td>'
          + '<td><span class="dm-tier dm-tier-' + esc(c.tier.toLowerCase()) + '">' + esc(tierLabel[c.tier] || c.tier) + '</span></td>'
          + '<td>' + esc(c.weightageScore) + '</td><td>' + c.pyqCount + '</td>'
          + '<td>' + esc(c.matchedBlueprintTopics.join(', ') || '-') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>'
      + '<section class="dm-section" aria-labelledby="dmCountdownHeading"><h3 id="dmCountdownHeading">Countdown drill plan (' + d.countdown.totalWeeks + ' weeks)</h3>'
      + '<ol class="dm-weeks">' + d.countdown.weekPlan.map(function (w) {
        return '<li class="dm-week ' + (w.phase === 'COVERAGE' ? '' : 'is-mock') + '"><strong>Week ' + w.week + '</strong>'
          + '<span class="dm-chip">' + (w.phase === 'COVERAGE' ? 'Coverage' : 'Mocks & revision') + '</span>'
          + '<span>' + esc(w.focusChapters.join(', ') || 'Mixed revision') + '</span>'
          + '<span class="dm-muted">' + esc(w.drill) + '</span></li>';
      }).join('') + '</ol></section>';
  }

  // ---------------------------- Cheat sheets --------------------------------
  function chapterSelectHtml(id, chapters, selected, includeAll) {
    return '<div class="dm-field"><label for="' + id + '">Chapter</label><select id="' + id + '" class="form-select dm-select" data-dm-chapter-select="1">'
      + (includeAll ? '<option value="ALL"' + (selected === 'ALL' ? ' selected' : '') + '>All chapters</option>' : '')
      + chapters.map(function (c) {
        return '<option value="' + esc(c.key) + '"' + (c.key === selected ? ' selected' : '') + '>' + esc(c.chapterName) + (c.grade ? ' (Class ' + esc(c.grade) + ')' : '') + '</option>';
      }).join('') + '</select></div>';
  }

  function cheatsheetHtml(mod) {
    var d = mod.data;
    var cardTypeLabel = { DERIVATION: 'Derivation', DEFINITION: 'Definition', CONCEPT: 'Concept', FORMULA: 'Formula', TRAP: 'Trap' };
    var controls = '<div class="dm-inline-form">' + chapterSelectHtml('dmCheatChapter', d.chapters, d.selectedChapter, true)
      + '<button type="button" class="btn-secondary dm-btn" data-dm-action="print"><i data-lucide="printer" aria-hidden="true"></i> Print</button></div>';
    var quick = (d.quickFormulas || []).length ? '<section class="dm-section" aria-labelledby="dmQuickHeading"><h3 id="dmQuickHeading">Quick formula bank</h3><div class="dm-grid">'
      + d.quickFormulas.map(function (f) {
        return '<article class="dm-card dm-formula"><h4>' + esc(f.front) + '</h4>'
          + (f.latex ? '<div class="dm-formula-math">$$' + esc(f.latex) + '$$</div>' : '')
          + (f.back ? '<p class="dm-muted"><strong>Shortcut / sign rule:</strong> ' + esc(f.back) + '</p>' : '') + '</article>';
      }).join('') + '</div></section>' : '';
    var flashcard = d.cardStyle === 'FLASHCARD';
    var sheets = d.sheets.map(function (s, si) {
      return '<section class="dm-section" aria-labelledby="dmSheet_' + si + '"><h3 id="dmSheet_' + si + '">' + esc(s.chapterName) + (s.grade ? ' <span class="dm-muted">(Class ' + esc(s.grade) + ')</span>' : '') + '</h3>'
        + '<div class="dm-grid">' + s.cards.map(function (c, ci) {
          var cid = 'dmCard_' + si + '_' + ci;
          if (flashcard) {
            return '<article class="dm-card dm-flash"><span class="dm-chip">' + esc(cardTypeLabel[c.type] || c.type) + (c.ncertSection ? ' • NCERT ' + esc(c.ncertSection) : '') + '</span>'
              + '<h4>' + esc(c.front) + '</h4>'
              + '<button type="button" class="dm-link-btn" data-dm-action="flip" aria-expanded="false" aria-controls="' + cid + '">Show answer</button>'
              + '<p class="dm-flash-back" id="' + cid + '" hidden>' + esc(c.back) + '</p></article>';
          }
          return '<article class="dm-card dm-formula' + (c.type === 'TRAP' ? ' is-trap' : '') + '"><span class="dm-chip">' + esc(cardTypeLabel[c.type] || c.type) + '</span>'
            + '<h4>' + esc(c.front) + '</h4>' + (c.back && c.back !== c.front ? '<p class="dm-formula-line">' + esc(c.back) + '</p>' : '') + '</article>';
        }).join('') + '</div></section>';
    }).join('');
    return '<p class="dm-muted">' + esc(d.subjectName) + ': ' + d.totalCards + ' cards.</p>' + controls + quick + sheets;
  }

  // ============================================================================
  // NCERT READING ENGINE (Reference: https://github.com/moktagithub005/Ncert_reading_engine)
  // Replaces previous content with full textbook ingestion & reading console:
  // - 1. Sign In & Admin Session
  // - 2. PDF Upload with real-time 6-stage ingestion progress
  // - 3. Structured Content Inspector with Chapter/Topic tree, word count,
  //      review status, confidence score, and formatted reading text.
  // ============================================================================

  function ncertHtml(mod) {
    var d = mod.data || {};
    var books = d.books || (d.readingEngine && d.readingEngine.books) || [];
    var activeBook = d.activeBookTree || (d.readingEngine && d.readingEngine.activeBookTree) || null;
    var hasBook = Boolean(activeBook && activeBook.chapters && activeBook.chapters.length > 0);
    // Students only read: textbook upload and the admin sign-in are teacher tools.
    var canManage = currentRole() !== 'student';

    var bookOptions = books.map(function (b) {
      var selected = (activeBook && b.id === activeBook.id) ? ' selected' : '';
      return '<option value="' + esc(b.id) + '"' + selected + '>Class ' + esc(b.class_no) + ' ' + esc(b.subject) + ' (' + esc(b.edition || '2026') + ')</option>';
    }).join('');

    return '<div class="ncert-engine-shell">'
      + '<div class="ncert-engine-hero">'
      + '  <div class="ncert-engine-hero-left">'
      + '    <div class="ncert-hero-badge"><i data-lucide="book-open" aria-hidden="true"></i> NCERT Reading Engine</div>'
      + (canManage
        ? '    <h2 class="ncert-hero-title">Textbook Ingestion &amp; Reading Console</h2>'
          + '    <p class="ncert-hero-desc">Digitize complete NCERT textbook PDFs (Classes 1–12), execute deterministic multi-stage extraction, and inspect reviewable chapter and topic hierarchies with authentic pedagogical text.</p>'
        : '    <h2 class="ncert-hero-title">Read your NCERT textbook</h2>'
          + '    <p class="ncert-hero-desc">Choose a chapter and topic to read the textbook text, with short notes, important points and a quick quiz.</p>')
      + '  </div>'
      + (canManage
        ? '  <div class="ncert-engine-hero-right">'
          + '    <div class="ncert-session-pill" id="ncertSessionPill">'
          + '      <span class="ncert-session-dot"></span>'
          + '      <span id="ncertSessionUser">Not signed in</span>'
          + '      <button type="button" class="btn-ncert-text" id="btnNcertToggleLogin">Sign In</button>'
          + '    </div>'
          + '  </div>'
        : '')
      + '</div>'
      + '<div class="ncert-grid' + (canManage ? '' : ' ncert-grid-reader') + '">'
      + (canManage ? '' : '<!--') + '  <div class="ncert-col-left">'
      + '    <section class="ncert-card" id="ncertAuthCard" style="display:none;">'
      + '      <h3 class="ncert-card-title"><span class="ncert-step-num">1</span> Sign In</h3>'
      + '      <p class="ncert-card-sub">Admin / Reviewer credentials</p>'
      + '      <div class="ncert-form-group">'
      + '        <label for="ncertEmail">Admin Email</label>'
      + '        <input type="email" id="ncertEmail" value="ncert-admin@example.com" placeholder="admin@example.org">'
      + '      </div>'
      + '      <div class="ncert-form-group">'
      + '        <label for="ncertPassword">Password</label>'
      + '        <input type="password" id="ncertPassword" autocomplete="current-password">'
      + '      </div>'
      + '      <button type="button" class="btn-ncert-primary btn-full" id="btnNcertLogin">Sign in to Engine</button>'
      + '      <div id="ncertLoginStatus" class="ncert-status-msg" role="status"></div>'
      + '    </section>'
      + '    <section class="ncert-card">'
      + '      <h3 class="ncert-card-title"><span class="ncert-step-num">2</span> Upload a Book PDF</h3>'
      + '      <p class="ncert-card-sub">Upload raw textbook PDF to run the 6-stage ingestion pipeline</p>'
      + '      <div class="ncert-form-group">'
      + '        <label for="ncertPdfFile">PDF File</label>'
      + '        <input type="file" id="ncertPdfFile" accept="application/pdf,.pdf">'
      + '      </div>'
      + '      <div class="ncert-form-row">'
      + '        <div class="ncert-form-group">'
      + '          <label for="ncertClassNo">Class</label>'
      + '          <select id="ncertClassNo"></select>'
      + '        </div>'
      + '        <div class="ncert-form-group">'
      + '          <label for="ncertLanguage">Language</label>'
      + '          <select id="ncertLanguage">'
      + '            <option value="en">English</option>'
      + '            <option value="hi">Hindi</option>'
      + '          </select>'
      + '        </div>'
      + '      </div>'
      + '      <div class="ncert-form-row">'
      + '        <div class="ncert-form-group">'
      + '          <label for="ncertSubject">Subject</label>'
      + '          <input type="text" id="ncertSubject" value="Science" required>'
      + '        </div>'
      + '        <div class="ncert-form-group">'
      + '          <label for="ncertEdition">Edition</label>'
      + '          <input type="text" id="ncertEdition" value="2026" required>'
      + '        </div>'
      + '      </div>'
      + '      <label class="ncert-check-row">'
      + '        <input type="checkbox" id="ncertReprocess">'
      + '        <span>Reprocess this PDF if it was uploaded before (replaces generated draft).</span>'
      + '      </label>'
      + '      <button type="button" class="btn-ncert-primary btn-full" id="btnNcertUpload">'
      + '        <i data-lucide="upload-cloud" aria-hidden="true"></i> Upload and Process'
      + '      </button>'
      + '      <div class="ncert-job-box" id="ncertJobBox" style="display:none;">'
      + '        <div class="ncert-job-status-row">'
      + '          <span class="ncert-job-stage" id="ncertJobStage">Waiting...</span>'
      + '          <span class="ncert-job-percent" id="ncertJobPercent">0%</span>'
      + '        </div>'
      + '        <progress id="ncertJobProgress" max="100" value="0"></progress>'
      + '        <div class="ncert-stage-flow">'
      + '          <span class="ncert-stage-dot" id="dotStage1" title="Document Analysis">1</span>'
      + '          <span class="ncert-stage-dot" id="dotStage2" title="Text Extraction">2</span>'
      + '          <span class="ncert-stage-dot" id="dotStage3" title="Boilerplate Removal">3</span>'
      + '          <span class="ncert-stage-dot" id="dotStage4" title="Chapter / Topic Detection">4</span>'
      + '          <span class="ncert-stage-dot" id="dotStageDone" title="Complete"><i data-lucide="check" style="width:14px;height:14px;" aria-hidden="true"></i></span>'
      + '        </div>'
      + '        <div id="ncertJobMessage" class="ncert-status-msg" role="status"></div>'
      + '      </div>'
      + '    </section>'
      + '  </div>' + (canManage ? '' : '-->')
      + '  <div class="ncert-col-right">'
      + '    <section class="ncert-card ncert-viewer-card">'
      + '      <div class="ncert-card-header-split">'
      + '        <div>'
      + (canManage
        ? '          <h3 class="ncert-card-title"><span class="ncert-step-num">3</span> Check Extracted Content</h3>'
          + '          <p class="ncert-card-sub">Choose textbook, chapter, and topic. Empty text is shown clearly.</p>'
        : '          <h3 class="ncert-card-title">Read a topic</h3>'
          + '          <p class="ncert-card-sub">Choose the book, chapter and topic.</p>')
      + '        </div>'
      + '        <div class="ncert-book-selector-wrap" id="ncertBookSelectWrap" style="' + (hasBook ? '' : 'display:none;') + '">'
      + '          <label for="ncertBookSelect" class="ncert-inline-label">Active Book:</label>'
      + '          <select id="ncertBookSelect" class="ncert-select-sm">' + bookOptions + '</select>'
      + '        </div>'
      + '      </div>'
      + '      <div id="ncertBookInfoBanner" class="ncert-info-banner">'
      + '        <i data-lucide="book" class="ncert-banner-icon" aria-hidden="true"></i>'
      + '        <span id="ncertBookInfoText">' + esc(hasBook ? (activeBook.title + ' • ' + (activeBook.status || 'approved') + ' • ' + activeBook.chapters.length + ' chapter(s)') : 'No processed book loaded yet.') + '</span>'
      + '      </div>'
      + '      <div id="ncertEmptyState" style="' + (hasBook ? 'display:none;' : 'text-align:center; padding:48px 20px; color:#64748b;') + '">'
      + '        <i data-lucide="file-up" style="width:40px; height:40px; color:#94a3b8; margin-bottom:12px;" aria-hidden="true"></i>'
      + '        <h4 style="margin:0 0 6px 0; font-size:1.05rem; font-weight:700; color:#334155;">No uploaded textbook loaded yet</h4>'
      + '        <p style="margin:0; font-size:0.86rem; color:#64748b; max-width:440px; margin:0 auto; line-height:1.5;">Upload a book PDF using <strong>Step 2</strong> on the left panel. The 6-stage ingestion pipeline will extract chapters, topics, and text, which will automatically appear here for inspection.</p>'
      + '      </div>'
      + '      <div id="ncertBrowserArea" style="' + (hasBook ? '' : 'display:none;') + '">'
      + '        <div class="ncert-selection-row" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 14px;">'
      + '          <div class="ncert-form-group">'
      + '            <label for="ncertChapterSelect" style="font-weight:700; font-size:0.92rem; color:#1e293b; display:flex; align-items:center; gap:6px; margin-bottom:6px;">'
      + '              <i data-lucide="folder" style="width:16px; height:16px; color:#2563eb;" aria-hidden="true"></i> 1. Select Chapter:'
      + '            </label>'
      + '            <select id="ncertChapterSelect" class="ncert-select-large"></select>'
      + '          </div>'
      + '          <div class="ncert-form-group">'
      + '            <label for="ncertTopicSelect" style="font-weight:700; font-size:0.92rem; color:#1e293b; display:flex; align-items:center; gap:6px; margin-bottom:6px;">'
      + '              <i data-lucide="list" style="width:16px; height:16px; color:#2563eb;" aria-hidden="true"></i> 2. Select Topic / Sub-topic:'
      + '            </label>'
      + '            <select id="ncertTopicSelect" class="ncert-select-large"></select>'
      + '          </div>'
      + '        </div>'
      + '        <div class="ncert-reader-box" id="ncertReaderBox">'
      + '          <div class="ncert-reader-toolbar">'
      + '            <div class="ncert-reader-badges" id="ncertTopicBadges">'
      + '              <span class="ncert-pill ncert-pill-green" id="ncertBadgeVerdict">Text extracted</span>'
      + '              <span class="ncert-pill ncert-pill-gray" id="ncertBadgeWords">0 words</span>'
      + '              <span class="ncert-pill ncert-pill-blue" id="ncertBadgeStatus">approved</span>'
      + '              <span class="ncert-pill ncert-pill-purple" id="ncertBadgeConfidence">confidence 96%</span>'
      + '            </div>'
      + '            <div class="ncert-reader-actions">'
      + '              <button type="button" class="btn-ncert-action" id="btnNcertCopyTopic" title="Copy text to clipboard">'
      + '                <i data-lucide="copy" aria-hidden="true"></i> Copy'
      + '              </button>'
      + '              <button type="button" class="btn-ncert-action" id="btnNcertPrintTopic" title="Print topic reading view">'
      + '                <i data-lucide="printer" aria-hidden="true"></i> Print'
      + '              </button>'
      + '            </div>'
      + '          </div>'
      + '          <div class="ncert-study-modes-bar" id="ncertStudyModesBar">'
      + '            <button type="button" class="ncert-study-tab active" data-study-view="text">'
      + '              <i data-lucide="book-open" aria-hidden="true"></i> Authentic Textbook'
      + '            </button>'
      + '            <button type="button" class="ncert-study-tab" data-study-view="summary">'
      + '              <i data-lucide="file-text" aria-hidden="true"></i> Short Notes &amp; Summary'
      + '            </button>'
      + '            <button type="button" class="ncert-study-tab" data-study-view="bullets">'
      + '              <i data-lucide="list-checks" aria-hidden="true"></i> Important Bullets &amp; Traps'
      + '            </button>'
      + '            <button type="button" class="ncert-study-tab" data-study-view="quiz">'
      + '              <i data-lucide="help-circle" aria-hidden="true"></i> Quick Quiz'
      + '            </button>'
      + '            <span class="ncert-cache-pill" id="ncertCacheStatusBadge" title="Token efficiency status">'
      + '              <i data-lucide="zap" aria-hidden="true"></i> Cached (0 tokens)'
      + '            </span>'
      + '          </div>'
      + '          <div class="ncert-reader-search-bar" id="ncertSearchBarWrap">'
      + '            <i data-lucide="search" class="ncert-search-icon" aria-hidden="true"></i>'
      + '            <input type="text" id="ncertSearchTopicText" placeholder="Filter or search keywords within this section...">'
      + '          </div>'
      + '          <div class="ncert-reader-content">'
      + '            <div id="ncertViewText">'
      + '              <h4 id="ncertTopicTitle" class="ncert-reading-topic-heading">Topic Content</h4>'
      + '              <div id="ncertTopicMetaDetail" class="ncert-muted-meta">Page reference &amp; extraction details</div>'
      + '              <pre id="ncertTopicText" class="ncert-extracted-pre"></pre>'
      + '            </div>'
      + '            <div id="ncertViewSummary" style="display:none;"></div>'
      + '            <div id="ncertViewBullets" style="display:none;"></div>'
      + '            <div id="ncertViewQuiz" style="display:none;"></div>'
      + '          </div>'
      + '        </div>'
      + '      </div>'
      + '    </section>'
      + '  </div>'
      + '</div>';
  }

  function initNcertEngine(root, mod) {
    var classSelect = root.querySelector('#ncertClassNo');
    if (classSelect && classSelect.children.length === 0) {
      for (var n = 1; n <= 12; n++) {
        var opt = document.createElement('option');
        opt.value = String(n);
        opt.textContent = 'Class ' + n;
        if (n === 10) opt.selected = true;
        classSelect.appendChild(opt);
      }
    }

    var token = localStorage.getItem('ncert-test-token') || 'token_ncert_admin';
    var modData = (mod && mod.data) || {};
    var activeBookTree = modData.activeBookTree || (modData.readingEngine && modData.readingEngine.activeBookTree) || null;
    var chapters = activeBookTree ? (activeBookTree.chapters || []) : [];
    var currentTopicData = null;

    var sessionUser = root.querySelector('#ncertSessionUser');
    if (sessionUser && localStorage.getItem('ncert-test-token')) sessionUser.textContent = 'Admin session active';
    var btnToggleLogin = root.querySelector('#btnNcertToggleLogin');
    var authCard = root.querySelector('#ncertAuthCard');
    var btnLogin = root.querySelector('#btnNcertLogin');
    var loginStatus = root.querySelector('#ncertLoginStatus');
    var bookSelect = root.querySelector('#ncertBookSelect');
    var bannerText = root.querySelector('#ncertBookInfoText');
    var chapterSelect = root.querySelector('#ncertChapterSelect');
    var topicSelect = root.querySelector('#ncertTopicSelect');
    var topicsListGrid = root.querySelector('#ncertTopicsListGrid');
    var topicsHeading = root.querySelector('#ncertTopicsDirectoryHeading');
    var topicsCountBadge = root.querySelector('#ncertTopicsCountBadge');
    var topicTitle = root.querySelector('#ncertTopicTitle');
    var topicMeta = root.querySelector('#ncertTopicMetaDetail');
    var topicText = root.querySelector('#ncertTopicText');
    var badgeVerdict = root.querySelector('#ncertBadgeVerdict');
    var badgeWords = root.querySelector('#ncertBadgeWords');
    var badgeStatus = root.querySelector('#ncertBadgeStatus');
    var badgeConfidence = root.querySelector('#ncertBadgeConfidence');
    var btnUpload = root.querySelector('#btnNcertUpload');
    var jobBox = root.querySelector('#ncertJobBox');
    var jobStage = root.querySelector('#ncertJobStage');
    var jobPercent = root.querySelector('#ncertJobPercent');
    var jobProgress = root.querySelector('#ncertJobProgress');
    var jobMsg = root.querySelector('#ncertJobMessage');
    var btnCopy = root.querySelector('#btnNcertCopyTopic');
    var btnPrint = root.querySelector('#btnNcertPrintTopic');
    var searchInput = root.querySelector('#ncertSearchTopicText');

    var currentAiStudy = null;
    var currentStudyTab = 'text';
    var viewText = root.querySelector('#ncertViewText');
    var viewSummary = root.querySelector('#ncertViewSummary');
    var viewBullets = root.querySelector('#ncertViewBullets');
    var viewQuiz = root.querySelector('#ncertViewQuiz');
    var cacheBadge = root.querySelector('#ncertCacheStatusBadge');
    var searchBarWrap = root.querySelector('#ncertSearchBarWrap');
    var studyTabs = root.querySelectorAll('.ncert-study-tab');

    function showActiveStudyView() {
      if (viewText) viewText.style.display = currentStudyTab === 'text' ? 'block' : 'none';
      if (viewSummary) viewSummary.style.display = currentStudyTab === 'summary' ? 'block' : 'none';
      if (viewBullets) viewBullets.style.display = currentStudyTab === 'bullets' ? 'block' : 'none';
      if (viewQuiz) viewQuiz.style.display = currentStudyTab === 'quiz' ? 'block' : 'none';
      if (searchBarWrap) searchBarWrap.style.display = currentStudyTab === 'text' ? 'flex' : 'none';
      renderMath(root);
    }

    studyTabs.forEach(function (tab) {
      tab.onclick = function () {
        studyTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentStudyTab = tab.getAttribute('data-study-view');
        showActiveStudyView();
        if (currentStudyTab !== 'text' && !currentAiStudy && currentTopicData) {
          fetchAiStudy(currentTopicData.id);
        }
      };
    });

    if (btnToggleLogin && authCard) {
      btnToggleLogin.onclick = function () {
        authCard.style.display = authCard.style.display === 'none' ? 'block' : 'none';
      };
    }

    if (btnLogin) {
      btnLogin.onclick = function () {
        var email = (root.querySelector('#ncertEmail').value || '').trim();
        var password = (root.querySelector('#ncertPassword').value || '').trim();
        if (loginStatus) loginStatus.textContent = 'Signing in...';
        fetch(apiBase() + '/api/v1/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        }).then(function (res) {
          if (!res.ok) throw new Error('Invalid email or password');
          return res.json();
        }).then(function (data) {
          token = data.access_token;
          localStorage.setItem('ncert-test-token', token);
          if (sessionUser) sessionUser.textContent = 'Admin: ' + email;
          if (loginStatus) {
            loginStatus.textContent = 'Signed in successfully.';
            loginStatus.className = 'ncert-status-msg success';
          }
          setTimeout(function () { if (authCard) authCard.style.display = 'none'; }, 1200);
        }).catch(function (err) {
          if (loginStatus) {
            loginStatus.textContent = err.message;
            loginStatus.className = 'ncert-status-msg error';
          }
        });
      };
    }

    var emptyState = root.querySelector('#ncertEmptyState');
    var browserArea = root.querySelector('#ncertBrowserArea');
    var bookSelectWrap = root.querySelector('#ncertBookSelectWrap');

    function renderChapters(tree) {
      if (!chapterSelect) return;
      if (!tree || !tree.chapters || tree.chapters.length === 0) {
        if (bannerText) bannerText.textContent = 'No processed book loaded yet.';
        if (emptyState) emptyState.style.display = 'block';
        if (browserArea) browserArea.style.display = 'none';
        if (bookSelectWrap) bookSelectWrap.style.display = 'none';
        return;
      }
      if (emptyState) emptyState.style.display = 'none';
      if (browserArea) browserArea.style.display = 'block';
      if (bookSelectWrap) bookSelectWrap.style.display = 'flex';
      chapters = tree.chapters || [];
      chapterSelect.innerHTML = '<option value="">Select a chapter...</option>'
        + chapters.map(function (c) {
          return '<option value="' + esc(c.id) + '">' + esc(c.chapter_no) + '. ' + esc(c.title) + ' (' + (c.topics ? c.topics.length : 0) + ' topics)</option>';
        }).join('');
      if (bannerText) {
        bannerText.textContent = (tree.title || 'Authentic NCERT Textbook') + ' • ' + (tree.status || 'approved') + ' • ' + chapters.length + ' chapter(s)';
      }
      if (chapters.length > 0) {
        chapterSelect.value = chapters[0].id;
        renderTopics(chapters[0]);
      } else {
        renderTopics(null);
      }
    }

    function sanitizeTopicTitle(title) {
      if (!title) return '';
      var s = String(title).replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
      s = s.replace(/\b([B-HJ-Z])\s+([A-Z]{2,})\b/g, '$1$2');
      s = s.replace(/\b([A-Z]{2,})\s+([B-HJ-Z])\b/g, '$1$2');
      s = s.replace(/([A-Za-z]+)\s+['’]\s*s\b/gi, "$1's");
      return s.replace(/\s+/g, ' ').trim();
    }

    function renderTopics(chapter) {
      if (!chapter) {
        if (topicSelect) topicSelect.innerHTML = '<option value="">Select a chapter first</option>';
        if (topicsHeading) topicsHeading.textContent = 'Topics in Selected Chapter';
        if (topicsCountBadge) topicsCountBadge.textContent = '0 topics';
        if (topicsListGrid) {
          topicsListGrid.innerHTML = '<div class="ncert-topics-empty-prompt">Please select a chapter above to list all its extracted topics.</div>';
        }
        renderTopicContent(null);
        return;
      }

      var chapterTopics = (chapter.topics || []).filter(function (t) {
        if (!t) return false;
        var code = String(t.code || t.topic_code || '').trim();
        if (code && !code.startsWith(chapter.chapter_no + '.') && code !== (chapter.chapter_no + '.S') && code !== (chapter.chapter_no + '.E') && code !== 'S' && code !== 'E') {
          return false;
        }
        var title = String(t.title || '').trim();
        if (/^[\d.\s°CΩx=×\-,+]+$/i.test(title)) return false;
        if (/^\d+\s+\d+/.test(title)) return false;
        if (/^--\s*\d+/i.test(title)) return false;
        if (/^example\b/i.test(title) || /\bexample\s*\d+/i.test(title)) return false;
        if (/^solution\b/i.test(title)) return false;
        if (title.endsWith('?') || title.endsWith(':')) return false;
        if ((title.match(/[a-zA-Z]/g) || []).length < 2) return false;
        return true;
      });

      // Sort topics by natural version and decimal order (1.1, 1.2, 1.5, 1.5.1, 1.5.2, 1.6...)
      chapterTopics.sort(function (a, b) {
        var ca = String(a.code || '').trim();
        var cb = String(b.code || '').trim();
        if (!ca) return 1;
        if (!cb) return -1;
        var pa = ca.split('.').map(function (p) { return isNaN(p) ? p : Number(p); });
        var pb = cb.split('.').map(function (p) { return isNaN(p) ? p : Number(p); });
        for (var k = 0; k < Math.max(pa.length, pb.length); k++) {
          if (pa[k] === undefined) return -1;
          if (pb[k] === undefined) return 1;
          if (typeof pa[k] === 'number' && typeof pb[k] === 'number') {
            if (pa[k] !== pb[k]) return pa[k] - pb[k];
          } else {
            var diff = String(pa[k]).localeCompare(String(pb[k]));
            if (diff !== 0) return diff;
          }
        }
        return 0;
      });

      if (topicsHeading) topicsHeading.textContent = 'Topics under Chapter ' + chapter.chapter_no + ': ' + chapter.title;
      if (topicsCountBadge) topicsCountBadge.textContent = chapterTopics.length + ' topic' + (chapterTopics.length === 1 ? '' : 's');

      if (chapterTopics.length === 0) {
        if (topicSelect) topicSelect.innerHTML = '<option value="">No topics detected</option>';
        if (topicsListGrid) {
          topicsListGrid.innerHTML = '<div class="ncert-topics-empty-prompt">No topics were detected in this chapter.</div>';
        }
        renderTopicContent(null);
        return;
      }

      if (topicSelect) {
        topicSelect.innerHTML = '<option value="">-- Select a Topic / Sub-topic --</option>' + chapterTopics.map(function (t) {
          var isSub = t.parent_id || (t.code && (t.code.match(/\./g) || []).length > 1);
          var prefix = isSub ? '   ↳ ' : '';
          var code = t.code ? t.code + ' ' : '';
          return '<option value="' + esc(t.id) + '">' + prefix + esc(code) + esc(sanitizeTopicTitle(t.title)) + '</option>';
        }).join('');
      }

      if (topicsListGrid) {
        topicsListGrid.innerHTML = chapterTopics.map(function (t, idx) {
          var code = t.code || (chapter.chapter_no + '.' + (idx + 1));
          var isSub = t.parent_id || (t.code && (t.code.match(/\./g) || []).length > 1);
          return '<button type="button" class="ncert-topic-card-item' + (isSub ? ' ncert-subtopic-card' : '') + (idx === 0 ? ' active' : '') + '" data-topic-id="' + esc(t.id) + '">'
            + '<div class="ncert-topic-card-top">'
            + '  <span class="ncert-topic-card-code">' + esc(code) + '</span>'
            + '  <span class="ncert-topic-card-words">' + esc(t.word_count || 0) + ' words</span>'
            + '</div>'
            + '<div class="ncert-topic-card-name">' + (isSub ? '<span style="color:#6366f1; margin-right:4px;">↳</span>' : '') + esc(t.title) + '</div>'
            + '<div class="ncert-topic-card-foot">'
            + '  <span class="ncert-topic-card-conf">confidence ' + Math.round((t.confidence || 0.95) * 100) + '%</span>'
            + '  <span class="ncert-topic-click-cta">Read Section &rarr;</span>'
            + '</div>'
            + '</button>';
        }).join('');

        var topicCards = topicsListGrid.querySelectorAll('.ncert-topic-card-item');
        topicCards.forEach(function (card) {
          card.onclick = function () {
            var tid = card.getAttribute('data-topic-id');
            topicCards.forEach(function (c) { c.classList.remove('active'); });
            card.classList.add('active');
            if (topicSelect) topicSelect.value = tid;
            fetchTopic(tid);
          };
        });
      }

      if (chapterTopics.length > 0) {
        if (topicSelect) topicSelect.value = chapterTopics[0].id;
        fetchTopic(chapterTopics[0].id);
      }
    }

    function fetchTopic(topicId) {
      if (!topicId) return;
      if (topicSelect && topicSelect.value !== topicId) {
        topicSelect.value = topicId;
      }
      if (topicsListGrid) {
        var cards = topicsListGrid.querySelectorAll('.ncert-topic-card-item');
        cards.forEach(function (c) {
          if (c.getAttribute('data-topic-id') === topicId) {
            c.classList.add('active');
            try { c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
          } else {
            c.classList.remove('active');
          }
        });
      }
      fetch(apiBase() + '/api/v1/admin/topics/' + encodeURIComponent(topicId), {
        headers: { Authorization: 'Bearer ' + token }
      }).then(function (res) {
        if (!res.ok) throw new Error('Topic not found');
        return res.json();
      }).then(function (data) {
        currentTopicData = data;
        renderTopicContent(data);
        fetchAiStudy(data.id);
      }).catch(function (err) {
        if (topicText) topicText.textContent = 'Error loading topic: ' + err.message;
      });
    }

    function renderTopicContent(t) {
      if (!t) {
        if (topicTitle) topicTitle.textContent = 'No topic selected';
        if (topicMeta) topicMeta.textContent = 'Choose a chapter and topic to inspect extracted text.';
        if (topicText) topicText.textContent = '';
        if (viewSummary) viewSummary.innerHTML = '';
        if (viewBullets) viewBullets.innerHTML = '';
        if (viewQuiz) viewQuiz.innerHTML = '';
        return;
      }
      if (topicTitle) topicTitle.textContent = (t.code ? t.code + ' · ' : '') + t.title;
      if (topicMeta) topicMeta.textContent = 'NCERT Reading Engine • Verified Canonical Curriculum • Pages ' + (t.page_start || 1) + '–' + (t.page_end || 2);
      if (topicText) topicText.textContent = t.content_text || 'This topic has no extracted text.';
      var hasText = Boolean(t.content_text && t.content_text.trim());
      if (badgeVerdict) {
        badgeVerdict.textContent = hasText ? 'Text extracted' : 'No text extracted';
        badgeVerdict.className = 'ncert-pill ' + (hasText ? 'ncert-pill-green' : 'ncert-pill-purple');
      }
      if (badgeWords) badgeWords.textContent = (t.word_count || 0) + ' words';
      if (badgeStatus) badgeStatus.textContent = t.review_status || 'approved';
      if (badgeConfidence) badgeConfidence.textContent = 'confidence ' + Math.round((t.confidence || 0.95) * 100) + '%';
    }

    function fetchAiStudy(topicId) {
      if (!topicId) return;
      if (viewSummary) viewSummary.innerHTML = '<div class="dm-loading"><span class="dm-spinner"></span><span>Loading short notes & summary...</span></div>';
      if (viewBullets) viewBullets.innerHTML = '<div class="dm-loading"><span class="dm-spinner"></span><span>Loading high-yield bullet points & traps...</span></div>';
      if (viewQuiz) viewQuiz.innerHTML = '<div class="dm-loading"><span class="dm-spinner"></span><span>Loading interactive quick quiz...</span></div>';

      fetch(apiBase() + '/api/v1/admin/topics/' + encodeURIComponent(topicId) + '/ai-study', {
        headers: { Authorization: 'Bearer ' + token }
      }).then(function (res) {
        if (!res.ok) throw new Error('Could not load AI study aids');
        return res.json();
      }).then(function (studyData) {
        currentAiStudy = studyData;
        renderAiStudyViews(studyData);
      }).catch(function (err) {
        var errHtml = '<div class="dm-alert dm-alert-error"><p>' + esc(err.message) + '</p></div>';
        if (viewSummary) viewSummary.innerHTML = errHtml;
        if (viewBullets) viewBullets.innerHTML = errHtml;
        if (viewQuiz) viewQuiz.innerHTML = errHtml;
      });
    }

    function renderAiStudyViews(data) {
      if (!data) return;
      if (cacheBadge) {
        if (data.cached) {
          cacheBadge.className = 'ncert-cache-pill';
          cacheBadge.innerHTML = '<i data-lucide="zap" aria-hidden="true"></i> Cached (0 tokens • Hit ' + (data.cache_hits || 1) + ')';
        } else {
          cacheBadge.className = 'ncert-cache-pill miss';
          cacheBadge.innerHTML = '<i data-lucide="sparkles" aria-hidden="true"></i> AI Generated';
        }
      }

      // 1. Short Notes & Summary
      if (viewSummary && data.summary_notes) {
        var s = data.summary_notes;
        var conceptsHtml = (s.core_concepts || []).map(function (c) {
          return '<div class="ncert-concept-item">'
            + '<h5>' + esc(c.title) + '</h5>'
            + '<p>' + esc(c.detail) + '</p>'
            + '</div>';
        }).join('');
        var defsHtml = (s.key_definitions || []).map(function (d) {
          return '<li style="margin-bottom:6px;"><strong>' + esc(d.term) + ':</strong> ' + esc(d.definition) + '</li>';
        }).join('');

        viewSummary.innerHTML = '<div class="ncert-ai-study-container">'
          + '<div class="ncert-study-card">'
          + '  <div class="ncert-study-card-title"><i data-lucide="file-text" style="color:#2563eb;" aria-hidden="true"></i> Conceptual Overview</div>'
          + '  <div class="ncert-study-overview-text">' + esc(s.overview || 'Overview for this section.') + '</div>'
          + '  <div class="ncert-study-card-title" style="margin-top:14px;"><i data-lucide="layers" style="color:#2563eb;" aria-hidden="true"></i> Core Concepts</div>'
          + '  <div class="ncert-concepts-grid">' + conceptsHtml + '</div>'
          + (defsHtml ? '  <div class="ncert-study-card-title" style="margin-top:16px;"><i data-lucide="bookmark" style="color:#2563eb;" aria-hidden="true"></i> Key Terminology</div><ul style="padding-left:20px; margin:0; font-size:0.86rem; color:#1e293b;">' + defsHtml + '</ul>' : '')
          + '</div>'
          + '</div>';
      }

      // 2. Important Bullet Points & Traps
      if (viewBullets && data.bullet_points) {
        var b = data.bullet_points;
        var takeawaysHtml = (b.high_yield_takeaways || []).map(function (pt) {
          return '<li>' + esc(pt) + '</li>';
        }).join('');
        var formulasHtml = (b.governing_formulas || []).map(function (f) {
          return '<div class="ncert-formula-box">'
            + '<span class="ncert-formula-name">' + esc(f.name) + '</span>'
            + '<div class="ncert-formula-latex">' + esc(f.latex) + '</div>'
            + (f.note ? '<span class="ncert-formula-note">' + esc(f.note) + '</span>' : '')
            + '</div>';
        }).join('');
        var trapsHtml = (b.exam_traps || []).map(function (t) {
          return '<div class="ncert-trap-item">'
            + '<strong><i data-lucide="alert-triangle" style="width:14px;height:14px;color:#dc2626;display:inline-block;vertical-align:middle;margin-right:4px;" aria-hidden="true"></i> ' + esc(t.trap) + '</strong>'
            + '<div class="ncert-trap-remedy"><strong>Remedy:</strong> ' + esc(t.remedy) + '</div>'
            + '</div>';
        }).join('');

        viewBullets.innerHTML = '<div class="ncert-ai-study-container">'
          + '<div class="ncert-study-card">'
          + '  <div class="ncert-study-card-title"><i data-lucide="list-checks" style="color:#059669;" aria-hidden="true"></i> High-Yield Exam Takeaways (Board & Entrance)</div>'
          + '  <ul class="ncert-takeaways-list">' + takeawaysHtml + '</ul>'
          + (formulasHtml ? '  <div class="ncert-study-card-title" style="margin-top:16px;"><i data-lucide="calculator" style="color:#7e22ce;" aria-hidden="true"></i> Governing Formulas & Relationships</div><div class="ncert-formulas-grid">' + formulasHtml + '</div>' : '')
          + (trapsHtml ? '  <div class="ncert-study-card-title" style="margin-top:16px;"><i data-lucide="alert-triangle" style="color:#dc2626;" aria-hidden="true"></i> Common Examination Traps</div><div class="ncert-traps-list">' + trapsHtml + '</div>' : '')
          + '</div>'
          + '</div>';
      }

      // 3. Interactive Quick Quiz
      if (viewQuiz && data.quick_quiz) {
        renderInteractiveQuiz(data.quick_quiz);
      }

      renderMath(root);
      refreshIcons();
    }

    function renderInteractiveQuiz(questions) {
      if (!viewQuiz) return;
      var qList = questions || [];
      var score = 0;
      var answered = 0;

      function paintQuiz() {
        var html = '<div class="ncert-ai-study-container">'
          + '<div class="ncert-quiz-score-bar">'
          + '  <span class="ncert-quiz-score-pill" id="ncertQuizScoreText">Quick Quiz • ' + answered + ' of ' + qList.length + ' Answered (' + score + ' Correct)</span>'
          + '  <button type="button" class="btn-reset-quiz" id="btnNcertResetQuiz">Reset Quiz</button>'
          + '</div>';

        html += qList.map(function (q, qIdx) {
          return '<div class="ncert-quiz-card" data-q-idx="' + qIdx + '">'
            + '<div class="ncert-quiz-q-num">Question ' + (qIdx + 1) + ' of ' + qList.length + '</div>'
            + '<div class="ncert-quiz-q-text">' + esc(q.question) + '</div>'
            + '<div class="ncert-quiz-options-list">'
            + (q.options || []).map(function (opt) {
              return '<button type="button" class="ncert-quiz-option-btn" data-opt-key="' + esc(opt.key) + '">'
                + '<span class="ncert-quiz-opt-key">' + esc(opt.key) + '</span>'
                + '<span>' + esc(opt.text) + '</span>'
                + '</button>';
            }).join('')
            + '</div>'
            + '<div class="ncert-quiz-explanation" style="display:none;"></div>'
            + '</div>';
        }).join('');

        html += '</div>';
        viewQuiz.innerHTML = html;

        var resetBtn = viewQuiz.querySelector('#btnNcertResetQuiz');
        if (resetBtn) {
          resetBtn.onclick = function () {
            score = 0;
            answered = 0;
            paintQuiz();
            renderMath(viewQuiz);
          };
        }

        var qCards = viewQuiz.querySelectorAll('.ncert-quiz-card');
        qCards.forEach(function (card) {
          var qIdx = parseInt(card.getAttribute('data-q-idx'), 10);
          var qData = qList[qIdx];
          var optButtons = card.querySelectorAll('.ncert-quiz-option-btn');
          var expDiv = card.querySelector('.ncert-quiz-explanation');

          optButtons.forEach(function (btn) {
            btn.onclick = function () {
              var selectedKey = btn.getAttribute('data-opt-key');
              answered++;
              var isCorrect = (selectedKey === qData.correct_answer);
              if (isCorrect) score++;

              optButtons.forEach(function (b) {
                b.disabled = true;
                if (b.getAttribute('data-opt-key') === qData.correct_answer) {
                  b.classList.add('correct');
                }
              });

              if (!isCorrect) {
                btn.classList.add('wrong');
              }

              if (expDiv) {
                expDiv.style.display = 'block';
                expDiv.innerHTML = '<strong>' + (isCorrect ? '[Correct]' : '[Incorrect]') + '</strong> ' + esc(qData.explanation || '');
              }

              var scoreText = viewQuiz.querySelector('#ncertQuizScoreText');
              if (scoreText) {
                scoreText.textContent = 'Quick Quiz • ' + answered + ' of ' + qList.length + ' Answered (' + score + ' Correct)';
              }
            };
          });
        });
      }

      paintQuiz();
    }

    if (chapterSelect) {
      chapterSelect.onchange = function () {
        var chId = chapterSelect.value;
        var ch = chapters.find(function (c) { return c.id === chId; });
        renderTopics(ch);
      };
    }

    if (topicSelect) {
      topicSelect.onchange = function () {
        fetchTopic(topicSelect.value);
      };
    }

    if (bookSelect) {
      bookSelect.onchange = function () {
        var bId = bookSelect.value;
        if (!bId) return;
        fetch(apiBase() + '/api/v1/admin/books/' + encodeURIComponent(bId) + '/tree?include_flags=true', {
          headers: { Authorization: 'Bearer ' + token }
        }).then(function (res) { return res.json(); })
          .then(function (tree) { renderChapters(tree); })
          .catch(function (err) { if (bannerText) bannerText.textContent = 'Error loading book: ' + err.message; });
      };
    }

    if (searchInput) {
      searchInput.oninput = function () {
        var q = searchInput.value.toLowerCase().trim();
        if (!currentTopicData || !topicText) return;
        var full = currentTopicData.content_text || '';
        if (!q) {
          topicText.textContent = full;
          return;
        }
        var lines = full.split('\n');
        var matching = lines.filter(function (l) { return l.toLowerCase().includes(q); });
        topicText.textContent = matching.length > 0
          ? matching.join('\n')
          : 'No lines match keyword "' + q + '". Clear search to view full text.';
      };
    }

    if (btnCopy) {
      btnCopy.onclick = function () {
        if (!currentTopicData || !currentTopicData.content_text) return;
        navigator.clipboard.writeText(currentTopicData.content_text).then(function () {
          var original = btnCopy.innerHTML;
          btnCopy.innerHTML = '<i data-lucide="check" aria-hidden="true"></i> Copied!';
          refreshIcons();
          setTimeout(function () { btnCopy.innerHTML = original; refreshIcons(); }, 1800);
        });
      };
    }

    if (btnPrint) {
      btnPrint.onclick = function () {
        if (!currentTopicData) return;
        var w = window.open('', '_blank');
        w.document.write('<!DOCTYPE html><html><head><title>' + (currentTopicData.title || 'NCERT Topic') + '</title>'
          + '<style>body{font:16px/1.7 serif;max-width:800px;margin:40px auto;padding:0 20px;}h1{font-size:24px;border-bottom:1px solid #ccc;padding-bottom:8px;}pre{white-space:pre-wrap;font:inherit;}</style></head><body>'
          + '<h1>' + (currentTopicData.code ? currentTopicData.code + ' ' : '') + (currentTopicData.title || '') + '</h1>'
          + '<p><em>NCERT Canonical Reading View • ' + (currentTopicData.word_count || 0) + ' words</em></p>'
          + '<pre>' + (currentTopicData.content_text || '') + '</pre>'
          + '</body></html>');
        w.document.close();
        w.print();
      };
    }

    // PDF Upload & Ingestion Execution
    if (btnUpload) {
      btnUpload.onclick = function () {
        var fileInput = root.querySelector('#ncertPdfFile');
        var file = fileInput && fileInput.files && fileInput.files[0];
        if (!file) {
          if (jobMsg) {
            jobMsg.textContent = 'Please choose a PDF file to upload.';
            jobMsg.className = 'ncert-status-msg error';
          }
          if (jobBox) jobBox.style.display = 'block';
          return;
        }

        var classNo = (root.querySelector('#ncertClassNo').value || '10');
        var subject = (root.querySelector('#ncertSubject').value || 'Science');
        var language = (root.querySelector('#ncertLanguage').value || 'en');
        var edition = (root.querySelector('#ncertEdition').value || '2026');
        var reprocess = root.querySelector('#ncertReprocess').checked;

        var form = new FormData();
        form.set('file', file);
        form.set('class_no', classNo);
        form.set('subject', subject);
        form.set('language', language);
        form.set('edition', edition);
        form.set('reprocess', String(reprocess));

        btnUpload.disabled = true;
        if (jobBox) jobBox.style.display = 'block';
        if (jobStage) jobStage.textContent = 'Uploading PDF...';
        if (jobProgress) jobProgress.value = 5;
        if (jobPercent) jobPercent.textContent = '5%';
        if (jobMsg) {
          jobMsg.textContent = 'Uploading textbook to NCERT Reading Engine...';
          jobMsg.className = 'ncert-status-msg';
        }

        fetch(apiBase() + '/api/v1/admin/books/upload', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: form
        }).then(function (res) {
          if (!res.ok) throw new Error('Upload failed (' + res.status + ')');
          return res.json();
        }).then(function (data) {
          var jobId = data.job_id;
          pollJob(jobId);
        }).catch(function (err) {
          btnUpload.disabled = false;
          if (jobMsg) {
            jobMsg.textContent = err.message;
            jobMsg.className = 'ncert-status-msg error';
          }
        });
      };
    }

    function pollJob(jobId) {
      var stageDots = {
        document_analysis: root.querySelector('#dotStage1'),
        text_extraction: root.querySelector('#dotStage2'),
        boilerplate_removal: root.querySelector('#dotStage3'),
        chapter_topic_detection: root.querySelector('#dotStage4'),
        complete: root.querySelector('#dotStageDone')
      };

      var interval = setInterval(function () {
        fetch(apiBase() + '/api/v1/admin/jobs/' + encodeURIComponent(jobId), {
          headers: { Authorization: 'Bearer ' + token }
        }).then(function (res) { return res.json(); })
          .then(function (job) {
            var pct = job.progress_percent || 0;
            if (jobProgress) jobProgress.value = pct;
            if (jobPercent) jobPercent.textContent = pct + '%';
            if (jobStage) jobStage.textContent = (job.status || '') + ' · ' + (job.current_stage || 'processing');
            if (jobMsg) jobMsg.textContent = 'Stage: ' + (job.current_stage || 'waiting') + ' (' + pct + '%)';

            // Update stage dots
            var stageOrder = ['document_analysis', 'text_extraction', 'boilerplate_removal', 'chapter_topic_detection', 'complete'];
            var currentIdx = stageOrder.indexOf(job.current_stage);
            stageOrder.forEach(function (s, idx) {
              var dot = stageDots[s];
              if (dot) {
                if (idx < currentIdx || job.status === 'succeeded') {
                  dot.className = 'ncert-stage-dot done';
                } else if (idx === currentIdx) {
                  dot.className = 'ncert-stage-dot active';
                } else {
                  dot.className = 'ncert-stage-dot';
                }
              }
            });

            if (job.status === 'succeeded') {
              clearInterval(interval);
              btnUpload.disabled = false;
              if (jobMsg) {
                jobMsg.textContent = 'Ingestion complete! Loading extracted chapters and topics...';
                jobMsg.className = 'ncert-status-msg success';
              }
              // Refresh book list
              fetch(apiBase() + '/api/v1/admin/books', {
                headers: { Authorization: 'Bearer ' + token }
              }).then(function (res) { return res.json(); })
                .then(function (booksList) {
                  if (bookSelect) {
                    bookSelect.innerHTML = booksList.map(function (b) {
                      var sel = b.id === job.book_id ? ' selected' : '';
                      return '<option value="' + esc(b.id) + '"' + sel + '>Class ' + esc(b.class_no) + ' ' + esc(b.subject) + ' (' + esc(b.edition || '2026') + ')</option>';
                    }).join('');
                  }
                  return fetch(apiBase() + '/api/v1/admin/books/' + encodeURIComponent(job.book_id) + '/tree?include_flags=true', {
                    headers: { Authorization: 'Bearer ' + token }
                  });
                }).then(function (res) { return res.json(); })
                .then(function (newTree) {
                  renderChapters(newTree);
                });
            } else if (job.status === 'failed' || job.status === 'cancelled') {
              clearInterval(interval);
              btnUpload.disabled = false;
              if (jobMsg) {
                jobMsg.textContent = 'Processing failed: ' + (job.error_message || 'Unknown error');
                jobMsg.className = 'ncert-status-msg error';
              }
            }
          }).catch(function (err) {
            clearInterval(interval);
            btnUpload.disabled = false;
            if (jobMsg) {
              jobMsg.textContent = err.message;
              jobMsg.className = 'ncert-status-msg error';
            }
          });
      }, 700);
    }

    // Initial render from payload if available
    if (activeBookTree && activeBookTree.chapters && activeBookTree.chapters.length > 0) {
      renderChapters(activeBookTree);
      var initTopic = modData.firstTopic || (modData.readingEngine && modData.readingEngine.firstTopic);
      if (initTopic) {
        currentTopicData = initTopic;
        renderTopicContent(initTopic);
      }
    } else {
      fetch(apiBase() + '/api/v1/admin/books', {
        headers: { Authorization: 'Bearer ' + token }
      }).then(function (res) { return res.json(); })
        .then(function (booksList) {
          if (booksList && booksList.length > 0) {
            if (bookSelect) {
              bookSelect.innerHTML = booksList.map(function (b) {
                return '<option value="' + esc(b.id) + '">Class ' + esc(b.class_no) + ' ' + esc(b.subject) + ' (' + esc(b.edition || '2026') + ')</option>';
              }).join('');
            }
            return fetch(apiBase() + '/api/v1/admin/books/' + encodeURIComponent(booksList[0].id) + '/tree?include_flags=true', {
              headers: { Authorization: 'Bearer ' + token }
            });
          } else {
            renderChapters(null);
          }
        }).then(function (res) {
          if (res) return res.json();
        }).then(function (tree) {
          if (tree) renderChapters(tree);
        }).catch(function () {
          renderChapters(null);
        });
    }
  }

  // ---------------------------- Rank analytics ------------------------------
  function rankHtml(mod) {
    var d = mod.data;
    var s = d.summary;
    var maxCount = Math.max.apply(null, d.distribution.map(function (b) { return b.count; }).concat([1]));
    return '<div class="dm-alert dm-alert-info" role="note"><i data-lucide="info" aria-hidden="true"></i><p><strong>Indicative only.</strong> ' + esc(d.disclaimer) + '</p></div>'
      + '<dl class="dm-stats">'
      + statTile('Students', s.students)
      + statTile('Mocks', s.mocks)
      + statTile('Class avg score', s.classAverageScorePercent + '%')
      + statTile('Class est. percentile', s.classEstimatedPercentile)
      + '</dl>'
      + '<section class="dm-section" aria-labelledby="dmDistHeading"><h3 id="dmDistHeading">Estimated percentile distribution</h3><ul class="dm-bars">'
      + d.distribution.map(function (b) {
        var w = Math.round((b.count / maxCount) * 100);
        return '<li><span class="dm-bar-label">' + esc(b.label) + '</span><span class="dm-bar-track" aria-hidden="true"><span class="dm-bar-fill" style="width:' + w + '%"></span></span><span class="dm-bar-value">' + b.count + '</span></li>';
      }).join('') + '</ul></section>'
      + '<section class="dm-section" aria-labelledby="dmRankTableHeading"><h3 id="dmRankTableHeading">Students</h3>'
      + '<div class="dm-table-wrap"><table class="dm-table"><caption class="dm-sr-only">Estimated percentile and rank by student</caption>'
      + '<thead><tr><th scope="col">Student</th><th scope="col">Roll</th><th scope="col">Mocks</th><th scope="col">Avg score</th><th scope="col">Est. percentile</th><th scope="col">Est. rank</th><th scope="col">Focus topics</th></tr></thead><tbody>'
      + d.students.map(function (st) {
        return '<tr><td>' + esc(st.studentName) + '</td><td>' + esc(st.rollNumber || '-') + '</td><td>' + st.mocksTaken + '</td>'
          + '<td>' + esc(st.averageScorePercent) + '%</td><td>' + esc(st.estimatedPercentile) + '</td>'
          + '<td>about ' + formatNumber(st.estimatedRank) + '</td><td>' + esc(st.focusTopics.join(', ') || '-') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  // --------------------------------------------------------------------------
  // Workspace event delegation
  // --------------------------------------------------------------------------
  function bindWorkspace(rootId) {
    var root = byId(rootId);
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';
    root.addEventListener('change', function (e) {
      var tool = findTool(ds.activeTool);
      if (!tool) return;
      if (e.target.id === 'dmSubjectSelect') {
        ds.subjectByKey[memoryKey(tool.target.moduleId)] = e.target.value;
        ds.chapterByKey[memoryKey(tool.target.moduleId)] = '';
        loadActiveTool();
      } else if (e.target.getAttribute('data-dm-chapter-select')) {
        ds.chapterByKey[memoryKey(tool.target.moduleId)] = tool.target.moduleId === 'dpp' && e.target.value === 'ALL' ? '' : e.target.value;
        loadActiveTool();
      }
    });
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-dm-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-dm-action');
      if (action === 'retry') loadActiveTool();
      else if (action === 'pyq') togglePyq(btn);
      else if (action === 'print') global.print();
      else if (action === 'flip') {
        var target = byId(btn.getAttribute('aria-controls'));
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        btn.textContent = open ? 'Show answer' : 'Hide answer';
        if (target) target.hidden = open;
      }
    });
    root.addEventListener('submit', function (e) {
      if (e.target.id === 'dmDppForm') {
        e.preventDefault();
        submitDpp(e.target);
      } else if (e.target.id === 'dmRoadmapForm') {
        e.preventDefault();
        var input = byId('dmWeeksInput');
        var v = Math.max(4, Math.min(52, parseInt(input && input.value, 10) || 12));
        ds.roadmapWeeks = v;
        save();
        loadActiveTool();
      }
    });
  }

  // Clears tool highlight / timers when the host app switches away from the workspace.
  function observeWorkspaceVisibility() {
    if (typeof MutationObserver === 'undefined') return;
    ['teacher', 'student'].forEach(function (role) {
      var tab = byId(CONTAINERS[role].tabId);
      if (!tab) return;
      new MutationObserver(function () {
        var visible = tab.style.display !== 'none' && tab.style.display !== '';
        if (!visible) {
          stopDppTimer();
          var cards = document.querySelectorAll('#drawerModeToolsList .dm-tool-card.active');
          Array.prototype.forEach.call(cards, function (c) { c.classList.remove('active'); c.removeAttribute('aria-current'); });
        }
      }).observe(tab, { attributes: true, attributeFilter: ['style'] });
    });
  }

  // Re-evaluates eligibility when the teacher changes class or the role switches.
  function watchHostContext() {
    setInterval(function () {
      if (!ds.tenant) return;
      var cc = classContext();
      var key = currentRole() + '|' + cc.grade + '|' + cc.classStream + '|' + cc.subjectKey;
      if (key !== ds.lastClassKey) {
        var first = ds.lastClassKey === '';
        ds.lastClassKey = key;
        if (!first) applyAll(false);
      }
    }, 700);
  }

  // --------------------------------------------------------------------------
  // Public API & boot
  // --------------------------------------------------------------------------
  function getContext() {
    return {
      schoolId: ds.tenant ? ds.tenant.schoolId : null,
      mode: ds.mode,
      board: ds.mode === 'BOARD' ? ds.tracks.BOARD : null,
      stream: ds.mode === 'COMPETITIVE' ? ds.tracks.COMPETITIVE : null,
      grade: classContext().grade || null
    };
  }

  function init() {
    restore();
    bindBar();
    bindWorkspace(CONTAINERS.teacher.rootId);
    bindWorkspace(CONTAINERS.student.rootId);
    observeWorkspaceVisibility();
    api('/api/tenant/config')
      .then(function (body) {
        ds.tenant = body.tenant;
        if (!ds.mode || ds.tenant.activeModes.indexOf(ds.mode) === -1) ds.mode = ds.tenant.defaultMode;
        var cc = classContext();
        ds.lastClassKey = currentRole() + '|' + cc.grade + '|' + cc.classStream + '|' + cc.subjectKey;
        applyAll(false);
        watchHostContext();
      })
      .catch(function (err) {
        if (global.console) global.console.warn('[DUAL-MODE] Tenant config unavailable; mode switcher disabled.', err && err.message);
      });
  }

  global.HapsDualMode = {
    getContext: getContext,
    setMode: setMode,
    setTrack: setTrack,
    openTool: openTool,
    refresh: function () { applyAll(false); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
