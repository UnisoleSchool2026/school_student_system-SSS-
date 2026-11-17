/* =============================================================================
   UNISOLE APP SHELL (2026-11-16 redesign)
   - PC (>= 900px): top tab bar under the header + hamburger menu for everything else.
   - Phone (< 900px): compact top bar + bottom tab bar (4 main tabs + "More").
   The tabs mirror the existing drawer cards (teacher / student workspaces and the
   Board/Competitive mode tools), so every tab still runs the original click handler
   and all existing logic (scoping, dual mode, feature flags) stays in charge of
   which features exist. This file only renders navigation; it owns no data.
   ========================================================================== */
(function (global) {
  'use strict';

  var MOBILE_MAX = 899;
  var MAX_TABS = 7; // PC top bar: at most 7 tabs; anything beyond goes under "More"

  // Short labels for the bottom bar and the phone page title.
  var SHORT = {
    'NCERT': 'NCERT',
    'NCERT Reading Engine': 'NCERT',
    'Create Test & Paper': 'Create Test',
    'Class Progress & Tests': 'Progress',
    'Question Bank & PYQs': 'Question Bank',
    'Scan Paper Sheets': 'Scan Sheets',
    'Chapter-wise DPP': 'DPP',
    'Roadmap & Milestones': 'Roadmap',
    'Definition & Derivation Cards': 'Cards',
    'Homework Sets': 'Homework',
    'Predictive Rank Analytics': 'Rank',
    'Take Test / Practice': 'Tests',
    'Weekly Report Card': 'Report Card',
    'Record of Previous Tests': 'My Results',
    'Personalized Assignments': 'Practice',
    'School Overview': 'Overview',
    'Tests & Topics': 'Tests & Topics',
    'Study Board': 'Study Board',
    'Class Desk': 'Class Desk'
  };
  var TINY = { // bottom bar (very short)
    'NCERT': 'NCERT',
    'Create Test': 'Create', 'Progress': 'Progress', 'Question Bank': 'Bank', 'Scan Sheets': 'Scan',
    'Report Card': 'Report', 'My Results': 'Results', 'Cheat Sheet': 'Formulas', 'Tests & Topics': 'Tests',
    'Study Board': 'Board', 'Class Desk': 'Desk'
  };
  var TAB_LABEL = { // top tab bar (PC)
    'NCERT': 'NCERT',
    'NCERT Reading Engine': 'NCERT',
    'Create Test & Paper': 'Create Test',
    'Class Progress & Tests': 'Class Progress',
    'Question Bank & PYQs': 'Question Bank',
    'Scan Paper Sheets': 'Scan Sheets',
    'Take Test / Practice': 'Tests',
    'Weekly Report Card': 'Report Card',
    'Record of Previous Tests': 'My Results',
    'Personalized Assignments': 'Practice',
    'Definition & Derivation Cards': 'Revision Cards'
  };
  var PORTAL = { teacher: 'Teacher', student: 'Student', director: 'Principal' };

  function byId(id) { return document.getElementById(id); }
  function activeRole() {
    try { if (typeof state !== 'undefined' && state && state.activeRole) return state.activeRole; } catch (e) { /* ignore */ }
    if (byId('studentView') && byId('studentView').classList.contains('active')) return 'student';
    if (byId('directorView') && byId('directorView').classList.contains('active')) return 'director';
    return 'teacher';
  }
  function isShown(el) {
    if (!el || el.hidden || el.classList.contains('dm-hidden')) return false;
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      if (n.hidden) return false;
      if (n.style && n.style.display === 'none' && n.id !== 'sidebarNavDrawer') return false;
    }
    return true;
  }
  function iconOf(card) {
    var i = card.querySelector('[data-lucide]');
    if (i) return i.getAttribute('data-lucide');
    var svg = card.querySelector('svg.lucide');
    if (svg) {
      var cls = Array.prototype.find.call(svg.classList, function (c) { return c.indexOf('lucide-') === 0; });
      if (cls) return cls.replace('lucide-', '');
    }
    return 'circle';
  }
  function titleOf(card) {
    var t = card.querySelector('.drawer-nav-card-title');
    return (t ? t.textContent : card.textContent).replace(/\s+/g, ' ').trim();
  }

  // Nav items for the active role, in drawer order.
  function navItems() {
    var role = activeRole();
    var cards = [];
    if (role === 'teacher') {
      cards = Array.prototype.slice.call(document.querySelectorAll('#drawerSectionTeacherWorkspaces .drawer-nav-card'));
    } else if (role === 'student') {
      cards = Array.prototype.slice.call(document.querySelectorAll('#drawerSectionStudentWorkspaces .drawer-nav-card'));
      var tools = byId('drawerSectionModeTools');
      if (tools && !tools.hidden) cards = cards.concat(Array.prototype.slice.call(tools.querySelectorAll('.drawer-nav-card')));
    } else {
      cards = Array.prototype.slice.call(document.querySelectorAll('#drawerSectionPrincipalNav .drawer-nav-card'));
    }
    return cards.filter(isShown).map(function (card, i) {
      var label = titleOf(card);
      var shortL = SHORT[label] || label;
      return {
        key: card.getAttribute('data-tab') || card.getAttribute('data-tool') || card.getAttribute('data-ptab') || ('item' + i),
        label: label,
        tab: TAB_LABEL[label] || shortL,
        short: shortL,
        tiny: TINY[shortL] || shortL,
        icon: iconOf(card),
        active: card.classList.contains('active'),
        run: function () { card.click(); }
      };
    });
  }

  // The header class pill belongs to the teacher. Students see their own class; the principal sees none.
  var teacherBadgeText = null;
  function syncClassBadge(role) {
    var badge = byId('headerFacultyClassBadge');
    if (!badge) return;
    if (role === 'teacher') {
      if (teacherBadgeText !== null && badge.getAttribute('data-shell-owned') === '1') badge.textContent = teacherBadgeText;
      badge.removeAttribute('data-shell-owned');
      badge.style.display = '';
      return;
    }
    if (badge.getAttribute('data-shell-owned') !== '1') teacherBadgeText = badge.textContent;
    badge.setAttribute('data-shell-owned', '1');
    if (role === 'student') {
      var sp = global.ACTIVE_STUDENT_PROFILE || {};
      var sec = String(sp.section || '');
      var nice = /NonMed/.test(sec) ? 'Non-Medical' : /Med/.test(sec) ? 'Medical' : '';
      badge.textContent = 'Class ' + (sp.grade || '') + (nice ? ' ' + nice : '');
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  function iconHtml(name) { return '<i data-lucide="' + name + '" aria-hidden="true"></i>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var lastSig = '';
  function render() {
    var items = navItems();
    var role = activeRole();
    var activeIdx = items.findIndex(function (it) { return it.active; });
    var sig = role + '|' + items.map(function (it) { return it.key + (it.active ? '*' : '') + it.tab; }).join(',');
    var portal = byId('shellPortalLabel');
    if (portal) portal.textContent = (PORTAL[role] || 'Teacher') + ' Portal';
    var title = byId('shellPageTitle');
    if (title) title.textContent = activeIdx >= 0 ? items[activeIdx].short : (PORTAL[role] || 'Unisole');
    document.body.setAttribute('data-shell-role', role);
    syncClassBadge(role);
    placeModeBar();
    if (sig === lastSig) { fitTabs(); return; }
    lastSig = sig;

    // PC top tabs (at most MAX_TABS; the rest sit in a "More" menu. An active tab from "More" takes the last slot.)
    var tabs = byId('shellTabs');
    if (tabs) {
      closeMoreMenu();
      var shown = items;
      var extra = [];
      if (items.length > MAX_TABS) {
        shown = items.slice(0, MAX_TABS);
        if (activeIdx >= MAX_TABS) shown[MAX_TABS - 1] = items[activeIdx];
        extra = items.filter(function (it) { return shown.indexOf(it) === -1; });
      }
      tabs.innerHTML = shown.map(function (it) {
        return '<button type="button" class="shell-tab' + (it.active ? ' is-active' : '') + '" role="tab" aria-selected="' + it.active + '" data-shell-idx="' + items.indexOf(it) + '" title="' + esc(it.label) + '">'
          + iconHtml(it.icon) + '<span>' + esc(it.tab) + '</span></button>';
      }).join('') + (extra.length
        ? '<button type="button" class="shell-tab shell-more-btn" id="shellMoreBtn" aria-haspopup="menu" aria-expanded="false" title="More sections">' + iconHtml('chevron-down') + '<span>More</span></button>'
        : '');
      bindRun(tabs, items);
      var moreBtn = byId('shellMoreBtn');
      if (moreBtn) moreBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMoreMenu(moreBtn, extra, items); });
      fitTabs();
      var on = tabs.querySelector('.is-active');
      if (on && on.scrollIntoView && tabs.scrollWidth > tabs.clientWidth) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    // Phone bottom bar: 4 tabs + More. If the active tab is not among the first 4, it takes slot 4.
    var bottom = byId('shellBottomNav');
    if (bottom) {
      var slots = items.slice(0, 4);
      if (activeIdx >= 4) slots[3] = items[activeIdx];
      var moreActive = false;
      var html = slots.map(function (it) {
        var i = items.indexOf(it);
        return '<button type="button" class="shell-bottom-btn' + (it.active ? ' is-active' : '') + '" data-shell-idx="' + i + '" aria-label="' + esc(it.label) + '"' + (it.active ? ' aria-current="page"' : '') + '>'
          + iconHtml(it.icon) + '<span>' + esc(it.tiny) + '</span></button>';
      }).join('');
      html += '<button type="button" class="shell-bottom-btn' + (moreActive ? ' is-active' : '') + '" id="shellBottomMore" aria-label="More options and menu">'
        + iconHtml('menu') + '<span>More</span></button>';
      bottom.innerHTML = html;
      bindRun(bottom, items);
      var more = byId('shellBottomMore');
      if (more) more.addEventListener('click', function (e) { if (typeof global.toggleSidebarDrawer === 'function') global.toggleSidebarDrawer(e); });
    }
    if (global.lucide && typeof global.lucide.createIcons === 'function') {
      try { global.lucide.createIcons(); } catch (e) { /* ignore */ }
    }
  }
  // When the tab row does not fit, drop the icons and tighten the spacing instead of scrolling.
  function fitTabs() {
    var tabs = byId('shellTabs');
    if (!tabs || !tabs.clientWidth) return;
    tabs.classList.remove('shell-tabs-compact');
    if (tabs.scrollWidth > tabs.clientWidth + 1) tabs.classList.add('shell-tabs-compact');
  }

  // "More" menu for the PC tab bar. It is attached to <body> so the scrolling tab row cannot clip it.
  function closeMoreMenu() {
    var m = byId('shellMoreMenu');
    if (m) m.parentNode.removeChild(m);
    var b = byId('shellMoreBtn');
    if (b) b.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', closeMoreMenu);
    document.removeEventListener('keydown', moreMenuKey);
  }
  function moreMenuKey(e) {
    if (e.key === 'Escape') { var b = byId('shellMoreBtn'); closeMoreMenu(); if (b) b.focus(); }
  }
  function toggleMoreMenu(btn, extra, items) {
    if (byId('shellMoreMenu')) { closeMoreMenu(); return; }
    var menu = document.createElement('div');
    menu.id = 'shellMoreMenu';
    menu.className = 'shell-more-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = extra.map(function (it) {
      return '<button type="button" role="menuitem" data-shell-idx="' + items.indexOf(it) + '">' + iconHtml(it.icon) + '<span>' + esc(it.tab) + '</span></button>';
    }).join('');
    document.body.appendChild(menu);
    var r = btn.getBoundingClientRect();
    menu.style.top = Math.round(r.bottom + 6) + 'px';
    menu.style.left = Math.round(Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8))) + 'px';
    btn.setAttribute('aria-expanded', 'true');
    bindRun(menu, items);
    if (global.lucide && typeof global.lucide.createIcons === 'function') { try { global.lucide.createIcons(); } catch (e) { /* ignore */ } }
    var first = menu.querySelector('button');
    if (first) first.focus();
    setTimeout(function () { document.addEventListener('click', closeMoreMenu); document.addEventListener('keydown', moreMenuKey); }, 0);
  }

  function bindRun(root, items) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-shell-idx]'), function (btn) {
      btn.addEventListener('click', function () {
        var it = items[Number(btn.getAttribute('data-shell-idx'))];
        if (it) it.run();
        if (typeof global.closeSidebarDrawer === 'function') global.closeSidebarDrawer();
        setTimeout(schedule, 30);
        if (window.innerWidth <= MOBILE_MAX) window.scrollTo({ top: 0, behavior: 'auto' });
      });
    });
  }

  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    (global.requestAnimationFrame || setTimeout)(function () { pending = false; render(); }, 16);
  }

  // "Create Test & Paper": the assessment type dropdown becomes a simple two-button switch.
  function buildPaperModeSwitch() {
    var sel = byId('selectPaperModeDropdown');
    var strip = byId('paperModeSelectionStrip');
    if (!sel || !strip || byId('shellPaperModeSwitch')) return;
    var wrap = document.createElement('div');
    wrap.id = 'shellPaperModeSwitch';
    wrap.className = 'shell-segmented';
    wrap.setAttribute('role', 'tablist');
    wrap.setAttribute('aria-label', 'Type of paper');
    strip.parentNode.insertBefore(wrap, strip);
    var labels = { unit_test: 'Unit Test / Quiz', board_paper: 'Full Board Paper' };
    function paint() {
      wrap.innerHTML = Array.prototype.map.call(sel.options, function (o) {
        var on = o.value === sel.value;
        return '<button type="button" role="tab" aria-selected="' + on + '" class="' + (on ? 'is-active' : '') + '" data-value="' + esc(o.value) + '"'
          + (o.disabled ? ' disabled title="Not available for this subject"' : '') + '>' + esc(labels[o.value] || o.textContent.replace(/^\d+\.\s*/, '')) + '</button>';
      }).join('');
      Array.prototype.forEach.call(wrap.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () {
          if (b.disabled || sel.value === b.getAttribute('data-value')) return;
          sel.value = b.getAttribute('data-value');
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          paint();
        });
      });
    }
    paint();
    sel.addEventListener('change', paint);
    new MutationObserver(paint).observe(sel, { attributes: true, childList: true, subtree: true });
    var origSwitch = global.switchPaperCreationMode;
    if (typeof origSwitch === 'function') {
      global.switchPaperCreationMode = function () { var r = origSwitch.apply(this, arguments); setTimeout(paint, 0); return r; };
    }
  }

  // Move the Board/Competitive control into the tab bar so it is one slim row, not a big card.
  function placeModeBar() {
    var bar = byId('modeSwitchBar');
    var slot = byId('shellModeSlot');
    if (bar && slot && bar.parentNode !== slot) slot.appendChild(bar);
  }

  function init() {
    if (!byId('shellTabs')) return;
    placeModeBar();
    buildPaperModeSwitch();
    render();
    var drawer = byId('sidebarNavDrawer');
    var obs = new MutationObserver(schedule);
    if (drawer) obs.observe(drawer, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    ['teacherView', 'studentView', 'directorView'].forEach(function (id) {
      var el = byId(id);
      if (el) obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    global.addEventListener('haps:modechange', schedule);
    global.addEventListener('resize', function () { closeMoreMenu(); schedule(); });
  }

  global.UnisoleShell = { refresh: function () { lastSig = ''; render(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
