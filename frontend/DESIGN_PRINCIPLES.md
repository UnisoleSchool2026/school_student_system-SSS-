# DESIGN_PRINCIPLES.md

> **Version:** 1.0.0 · **Status:** Authoritative · **Audience:** AI coding agents (Antigravity) and human contributors
> **Scope:** UI/UX design, design systems, and front-end implementation quality.

---

## 0. How to Use This Document (Agent Contract)

This file is the **single source of truth for design decisions**. Read it fully at the start of every task that touches UI, and re-check the relevant section before finishing.

### 0.1 Keywords
- **MUST / MUST NOT**: non-negotiable. Violations are defects.
- **SHOULD / SHOULD NOT**: default behavior. Deviate only with a written reason in the PR/summary.
- **MAY**: optional, use judgment.

### 0.2 Precedence (highest wins)
1. Explicit instruction from the user in the current task
2. Accessibility and security requirements (Sections 6 and 14), which a user instruction cannot silently override; flag conflicts instead
3. Project-specific design tokens and components already in the repo
4. This document
5. Your own preferences or training-data habits

### 0.3 Agent Operating Rules
1. **Inspect before inventing.** Search the repo for existing tokens, components, and patterns. Reuse first, extend second, create third.
2. **Never hardcode design values** (colors, spacing, font sizes, radii, shadows, durations). Use tokens (Section 3).
3. **When ambiguous, ask once, concisely**, or choose the most conservative option and state the assumption.
4. **Make small, reviewable changes.** Do not refactor unrelated code while doing UI work.
5. **Verify your work.** Run lint, type-check, tests, and visually check at the breakpoints in Section 4. Do not claim "done" without evidence.
6. **Report deviations.** If you break a SHOULD, say why. If you must break a MUST, stop and ask.

---

## 1. Philosophy

> **Analogy:** A good design system works like a city's building code. Architects remain free to design beautiful, different buildings, but everyone uses the same standard pipe sizes, fire exits, and electrical sockets. The result is a city that feels coherent, is safe, and can grow without chaos.

### 1.1 Core Principles
1. **Clarity over cleverness.** Users should never wonder what something does or where they are.
2. **Consistency over novelty.** Same problem, same solution, everywhere. Novelty must earn its place.
3. **Accessibility is a baseline, not a feature.** If it is not accessible, it is not finished.
4. **Hierarchy guides attention.** One primary action per view. Everything else is visually subordinate.
5. **Systems over one-offs.** Every value comes from a token; every pattern comes from a component.
6. **Performance is design.** A slow interface is a poorly designed interface.
7. **Progressive disclosure.** Show what is needed now; reveal complexity on demand.
8. **Feedback for every action.** The system always acknowledges input (loading, success, error).
9. **Forgiveness.** Make destructive actions reversible or confirmed; make errors recoverable.
10. **Respect the user's context.** Their device, network, language, ability, and preferences (reduced motion, color scheme, text size).

### 1.2 Quality Bar
Output should be indistinguishable from work by a senior product designer and a senior front-end engineer collaborating. If it looks like a default template, it is not done.

---

## 2. Process: Design Before You Code

For any non-trivial UI task, follow these steps **in order**:

1. **Understand**: who is the user, what job are they doing, what is the success outcome?
2. **Audit**: find existing components, tokens, layouts, and conventions in the repo.
3. **Structure**: define information architecture and content hierarchy (what is most important?).
4. **Map states**: list every state (default, hover, focus, active, disabled, loading, empty, error, success, offline).
5. **Build mobile-first** with tokens and existing components.
6. **Verify** against the Definition of Done (Section 15).
7. **Summarize** what was built, assumptions made, and deviations.

---

## 3. Design Tokens (Foundation Layer)

Tokens are named design decisions. Use a **three-tier model**:

| Tier | Purpose | Example |
|---|---|---|
| **Primitive** | Raw values | `--blue-600: #2563eb` |
| **Semantic** | Meaning/role | `--color-action-primary: var(--blue-600)` |
| **Component** | Scoped to a component | `--button-bg: var(--color-action-primary)` |

**Rule:** Components MUST consume **semantic or component** tokens only, never primitives, never raw values.

### 3.1 Color
- Define a neutral scale (10–12 steps), one brand/primary scale, and semantic scales (success, warning, danger, info).
- Semantic roles MUST include: `bg`, `bg-subtle`, `surface`, `surface-raised`, `border`, `border-strong`, `text`, `text-muted`, `text-inverse`, `action-primary`, `action-primary-hover`, `focus-ring`, `danger`, `success`, `warning`, `info`.
- **Contrast (WCAG 2.2 AA):** body text ≥ **4.5:1**; large text (≥ 24px, or ≥ 18.66px bold) ≥ **3:1**; UI components and graphical objects ≥ **3:1**.
- **Never convey meaning by color alone.** Pair with icon, text, or pattern.
- Limit the palette: 1 brand hue + neutrals + semantic colors. Use brand color sparingly (≈10% of the surface) so it stays meaningful.
- Avoid pure `#000` on pure `#fff` for long-form text; prefer a slightly softened neutral to reduce glare.

### 3.2 Typography
- **Type scale:** use a modular scale (ratio 1.125–1.25). Example: `12, 14, 16, 18, 20, 24, 30, 36, 48, 60`.
- Base body size **MUST be ≥ 16px** (1rem). Use `rem`, never `px`, for font sizes so user settings are respected.
- **Line height:** body 1.5–1.7; headings 1.1–1.3.
- **Line length:** 45–75 characters (`max-width: 65ch` for prose).
- **Max 2 font families** (one display/heading, one body) plus an optional monospace. Prefer variable fonts; limit to the weights actually used.
- Use `font-display: swap` (or `optional` for non-critical fonts); preload the primary font.
- Provide a robust system-font fallback stack.
- Use `clamp()` for fluid headings: `font-size: clamp(1.75rem, 1.2rem + 2vw, 3rem)`.
- Use tabular numerals (`font-variant-numeric: tabular-nums`) for tables, prices, and metrics.

### 3.3 Spacing
- Base unit **4px**, scale: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`.
- Expose as `--space-1 … --space-N`. No arbitrary margins/paddings.
- Use **proximity** to express relationship: related items closer, unrelated items further apart.
- Prefer `gap` over margins for layout spacing between siblings.

### 3.4 Radius, Border, Elevation
- Radius scale: `none, sm (4), md (8), lg (12), xl (16), full`. Choose one personality (sharp vs soft) and stay consistent.
- Border widths: `1px` default, `2px` for emphasis/focus.
- Elevation: 4–5 levels max (`0` flat, `1` card, `2` dropdown, `3` sticky/overlay, `4` modal). In dark mode, communicate elevation through lighter surfaces rather than heavy shadows.

### 3.5 Motion Tokens
- Durations: `instant 75ms`, `fast 150ms`, `base 250ms`, `slow 400ms`.
- Easing: `ease-out` for entering, `ease-in` for exiting, `ease-in-out` for repositioning. Define as tokens.

### 3.6 Reference Token Skeleton

```css
:root {
  /* Primitives */
  --blue-600: #2563eb;
  --neutral-0: #ffffff;
  --neutral-900: #111827;

  /* Semantic */
  --color-bg: var(--neutral-0);
  --color-text: var(--neutral-900);
  --color-action-primary: var(--blue-600);
  --color-focus-ring: var(--blue-600);

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-6: 1.5rem;

  /* Type */
  --font-sans: "Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --text-base: 1rem;
  --leading-body: 1.6;

  /* Shape & motion */
  --radius-md: 0.5rem;
  --duration-base: 250ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="dark"] {
  --color-bg: #0b0f19;
  --color-text: #e5e7eb;
}
```

---

## 4. Layout & Responsiveness

- **Mobile-first.** Author base styles for the smallest screen, then enhance with `min-width` queries.
- **Breakpoints (defaults):** `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Prefer **content-driven** breakpoints and **container queries** for components.
- **Verify at:** 360px, 768px, 1024px, 1440px. No horizontal scroll at any width (except intentional scrollers such as data tables).
- Use **CSS Grid** for two-dimensional layout, **Flexbox** for one-dimensional alignment. Avoid fixed heights; let content define size.
- Use a **12-column grid** (or intrinsic `auto-fit/minmax`) with consistent gutters from spacing tokens.
- Max content width for readability (e.g., `1200–1280px` container, `65ch` prose).
- Respect **safe areas** (`env(safe-area-inset-*)`) on notched devices.
- Use `dvh/svh` instead of `vh` for full-height mobile layouts.
- Use logical properties (`margin-inline`, `padding-block`) to support RTL and writing modes.

### 4.1 Touch & Pointer
- Touch targets **≥ 44×44px** (minimum 24×24 CSS px per WCAG 2.2 SC 2.5.8, with spacing).
- Provide at least 8px between adjacent targets.
- Never rely on hover alone; every hover affordance needs a touch/keyboard equivalent.

---

## 5. Components & Patterns

### 5.1 Component Rules
1. **Single responsibility**, composable, and configurable via props, not forked copies.
2. Prefer **composition over configuration explosion** (slots/children over 20 boolean props).
3. Every component MUST define and implement all relevant **states**: default, hover, focus-visible, active, disabled, loading, error, empty (where applicable).
4. Components MUST be **controlled by tokens** and support light/dark themes automatically.
5. Provide **documented usage**: purpose, anatomy, variants, do/don't, accessibility notes.
6. Use **semantic HTML first** (`<button>`, `<a>`, `<nav>`, `<dialog>`, `<label>`); ARIA only to fill genuine gaps.

### 5.2 Buttons
- One **primary** per view/section; secondary and tertiary for the rest.
- Label with a **verb + object** ("Save changes", not "Submit"). Never "Click here".
- Show a loading state and prevent double-submit during async actions.
- Disabled buttons SHOULD explain why (tooltip/helper text) where feasible.
- Button = action; link = navigation. Do not mix.

### 5.3 Forms
- Visible **labels above inputs** (never placeholder-as-label). Mark optional fields rather than required where most fields are required.
- Use correct `type`, `inputmode`, and `autocomplete` attributes.
- **Validate inline on blur/submit**, not on every keystroke. Error messages are specific, adjacent to the field, linked with `aria-describedby`, and say how to fix the problem.
- Preserve user input on error. Never clear the form.
- Group related fields with `<fieldset>/<legend>`. Single-column layout by default.
- Provide a clear primary action and a safe secondary (Cancel).

### 5.4 Navigation
- Keep primary navigation to **≤ 7 items**. Highlight the current location (`aria-current="page"`).
- Provide a **skip-to-content** link. Provide breadcrumbs for deep hierarchies.
- Mobile: bottom or drawer navigation with clear, labeled icons (icons alone are ambiguous).

### 5.5 Feedback & System Status
- **Loading:** use skeletons for content areas (predictable layout), spinners only for short, indeterminate actions. Show progress for > 3s tasks.
- **Empty states:** explain what is missing, why, and offer the next action.
- **Errors:** plain language, no blame, no raw error codes; give a recovery path. Distinguish user errors from system errors.
- **Success:** confirm unobtrusively (toast/inline); do not block the flow.
- **Toasts:** auto-dismiss only for non-critical info; never for errors needing action; use `role="status"` / `role="alert"` appropriately.
- **Destructive actions:** require confirmation or provide **Undo**; name the consequence ("Delete 3 files?").

### 5.6 Data Display
- Tables: sticky headers, aligned numerics (right-aligned, tabular figures), sortable affordance, responsive strategy (scroll or card transformation), pagination or virtualization for large sets.
- Charts: label directly, avoid chartjunk, use colorblind-safe palettes, provide a text/table alternative, start bar-chart axes at zero.

### 5.7 Overlays
- Modals: use sparingly; trap focus, close on `Esc`, return focus to the trigger, lock background scroll, provide a visible close control. Prefer native `<dialog>`.
- Popovers/tooltips: never hide essential information; must be keyboard and touch accessible.

---

## 6. Accessibility (WCAG 2.2 AA is the Minimum)

Accessibility MUST be built in, not retrofitted.

### 6.1 Perceivable
- Text alternatives for all meaningful images (`alt`); decorative images use `alt=""`.
- Captions/transcripts for media. No autoplaying audio.
- Content reflows at 320px width and 400% zoom without loss.
- Text spacing overrides must not break the layout.

### 6.2 Operable
- **Everything reachable and usable by keyboard**, in a logical order. No keyboard traps.
- **Visible focus indicator** always (`:focus-visible`), ≥ 2px, contrast ≥ 3:1. **Never `outline: none` without a replacement.**
- Focused elements must not be obscured by sticky headers (SC 2.4.11).
- Provide alternatives to drag interactions (SC 2.5.7).
- No time limits without a way to extend; no content flashing > 3 times/second.

### 6.3 Understandable
- Set `<html lang>` (and `lang` on inline foreign-language content).
- Consistent navigation and identification across pages.
- Error identification and suggestions (see Forms).
- Avoid redundant entry (SC 3.3.7); do not ask for the same info twice in one flow.
- Accessible authentication: allow paste and password managers; avoid cognitive tests.

### 6.4 Robust
- Valid, semantic HTML; correct landmarks (`header`, `nav`, `main`, `footer`, `aside`).
- Name/role/value exposed for all custom widgets; follow **WAI-ARIA Authoring Practices** patterns.
- Announce dynamic changes with live regions.

### 6.5 User Preferences (MUST honor)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Also honor `prefers-color-scheme`, `prefers-contrast`, and `forced-colors` (Windows High Contrast).

### 6.6 Testing
- Automated: axe-core / Lighthouse / eslint-plugin-jsx-a11y in CI.
- Manual: keyboard-only pass, screen reader spot-check (NVDA/VoiceOver), 200%/400% zoom, color-blindness simulation.
- Automated tools catch only a portion of issues; manual review is required for critical flows.

---

## 7. Interaction & Motion

- Motion MUST serve a purpose: orientation, feedback, continuity, or attention. Never decoration alone.
- Keep UI transitions **150–300ms**; larger transitions up to 400ms. Animate **`transform` and `opacity`** only (GPU-friendly); avoid animating layout properties (`width`, `height`, `top`, `left`).
- Respond to input within **100ms** (perceived instant); show feedback within **1s**; show progress beyond that.
- **Optimistic UI** for low-risk actions, with rollback on failure.
- Hover, focus, and active states must be visually distinct and consistent.
- Gestures need visible, discoverable alternatives.
- No parallax or scroll-jacking that fights native scrolling.

---

## 8. Content & Microcopy

- Write for scanning: front-load key words, short sentences, plain language (target ~grade 8 for general audiences).
- Use **sentence case** for UI text (headings, buttons, labels). Be consistent with terminology; keep a glossary.
- Active voice, second person ("Your changes were saved").
- Error format: **What happened + why (if useful) + how to fix.**
- No lorem ipsum in finished work. Use realistic content to test layouts, including very long, very short, and missing content.
- Avoid jargon, idioms, and humor in critical or error flows.
- Inclusive language; avoid ableist or gendered defaults.

---

## 9. Theming, Dark Mode & Internationalization

### 9.1 Theming
- Support **light and dark** from day one via semantic tokens; respect system preference with a manual override persisted by the user.
- Do not simply invert colors. Re-check contrast and elevation in dark mode. Desaturate large saturated areas; avoid pure black backgrounds for large surfaces.
- Set `color-scheme` so native controls match the theme.

### 9.2 Internationalization (i18n) & Localization (l10n)
- **No hardcoded user-facing strings.** Use a translation layer with keys.
- Design for **text expansion** (30–40% longer in some languages) and for **non-Latin scripts** (Devanagari, Arabic, CJK), which may need larger line-height and different font stacks.
- Support **RTL** via logical CSS properties and `dir` attribute.
- Use `Intl` APIs for dates, numbers, currency, plurals, and lists. Never concatenate strings to build sentences.
- Avoid text in images. Choose icons that translate culturally.

---

## 10. Performance as a Design Constraint

### 10.1 Budgets (Core Web Vitals, 75th percentile, mobile)
| Metric | Target |
|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s |
| **INP** (Interaction to Next Paint) | ≤ 200ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 |
| Initial JS (compressed) | Keep as small as practical; justify anything > ~170KB |

### 10.2 Practices
- Set explicit `width`/`height` or `aspect-ratio` on images/video/embeds to prevent layout shift.
- Use modern formats (AVIF/WebP), responsive `srcset`/`sizes`, and `loading="lazy"` below the fold. Eager-load and `fetchpriority="high"` the LCP image.
- Code-split by route; lazy-load heavy components; tree-shake; audit dependencies before adding one.
- Prefer CSS over JS for visuals and interactions; prefer native elements over custom widgets.
- Optimize for **low-end devices and slow networks** (design for 3G/4G and 2–4GB RAM devices). Provide meaningful offline/slow states.
- Virtualize long lists. Debounce/throttle expensive handlers. Avoid layout thrashing.
- Cache aggressively with correct headers; use a CDN.

---

## 11. Front-End Engineering Standards

### 11.1 Architecture
- Organize by **feature/domain**, with shared UI in a design-system package/folder.
- Separate **presentation** (UI components) from **logic** (hooks, services, state) and **data access**.
- Keep components small (guideline: < ~200 lines); extract when responsibilities multiply.
- State: keep it **as local as possible**; lift only when needed; server state belongs in a data-fetching layer with caching, not in global stores.

### 11.2 Code Quality
- **TypeScript strict mode.** No `any` without a justification comment. Type all props and public APIs.
- Enforce **ESLint + Prettier + stylelint** in CI and pre-commit hooks.
- Naming: components `PascalCase`; hooks `useCamelCase`; tokens `kebab-case`; boolean props read naturally (`isLoading`, `hasError`).
- CSS: use a single approach consistently per project (CSS Modules, Tailwind, or CSS-in-JS with zero-runtime). Avoid `!important`, deep selectors, and global leakage. Use **cascade layers** (`@layer`) to manage specificity.
- No inline styles for design values; no magic numbers.
- Handle **all async states** and **error boundaries**. Never swallow errors silently.
- Write meaningful commit messages (Conventional Commits).

### 11.3 Testing
- **Unit** tests for logic; **component** tests (Testing Library, query by role/label, not test IDs first); **E2E** for critical flows (Playwright); **visual regression** for the design system.
- Test behavior, not implementation. Cover states: loading, empty, error, success.
- Accessibility assertions included in component tests.

### 11.4 Security (UI-relevant)
- Never use `dangerouslySetInnerHTML`/`innerHTML` with unsanitized content.
- Validate on the server as well as the client. Escape output. Use a strict CSP.
- Never expose secrets in client bundles. Use `rel="noopener noreferrer"` on external `target="_blank"` links.
- Respect privacy: minimal data collection, clear consent for tracking.

---

## 12. Visual Craft Guidelines

- **Alignment:** everything snaps to the grid; align on a shared edge or baseline.
- **Hierarchy tools, in order of strength:** size, weight, color/contrast, spacing, position. Use at most 3 hierarchy levels per view.
- **Whitespace is a feature.** Dense is not the same as efficient; group, then separate.
- **Iconography:** one consistent family, consistent stroke and size grid (16/20/24), paired with labels when meaning is not universal. Decorative icons are `aria-hidden`.
- **Imagery:** purposeful, high quality, consistent treatment; avoid generic stock clichés. Provide fallback background color and aspect ratio while loading.
- **Depth:** subtle, consistent shadows/borders; avoid stacking multiple effects (gradients + glows + heavy shadows).
- **Avoid "AI-default" aesthetics:** generic purple-blue gradients, uniform rounded cards everywhere, centered-everything layouts, emoji as icons. Establish a **deliberate visual identity** (palette, type pairing, shape language) and apply it consistently.

---

## 13. Anti-Patterns (Do NOT)

1. Hardcoded colors, sizes, or spacing outside tokens.
2. `outline: none` without a focus replacement.
3. Placeholder text used as a label.
4. Div/span "buttons" and "links"; clickable non-interactive elements.
5. Color-only status indication.
6. Disabling zoom (`user-scalable=no`) or setting fixed `px` font sizes.
7. Auto-playing carousels, intrusive modals on load, or dark patterns (confirmshaming, hidden costs, forced continuity).
8. Layout shift from late-loading content, fonts, or images.
9. Infinite scroll without a way to reach the footer or restore position.
10. Custom scrollbars, selects, or inputs that break native behavior without full parity.
11. Copy-pasting a component instead of extending the shared one.
12. Giant "god components" and prop drilling through many layers.
13. Lorem ipsum, placeholder images, or "TODO" in delivered UI.
14. Adding a dependency for something achievable in a few lines of native code.
15. Ignoring empty, loading, and error states.

---

## 14. Non-Negotiable Gates

A change MUST NOT be considered complete if any of these fail:

- [ ] Meets WCAG 2.2 AA for contrast, keyboard access, focus visibility, and labels
- [ ] No hardcoded design values; tokens only
- [ ] Works at 360px, 768px, 1024px, 1440px without horizontal scroll or overlap
- [ ] All interactive elements have visible focus, hover, active, and disabled states
- [ ] Loading, empty, and error states implemented
- [ ] Reduced-motion and color-scheme preferences honored
- [ ] No console errors/warnings; type-check, lint, and tests pass
- [ ] No unsanitized HTML injection; no secrets in the client

---

## 15. Definition of Done (Checklist)

**Design**
- [ ] Clear single primary action and visual hierarchy
- [ ] Consistent spacing, type scale, radius, and elevation from tokens
- [ ] Light and dark themes verified
- [ ] Real content tested (long, short, missing, translated)

**Accessibility**
- [ ] Keyboard-only walkthrough completed
- [ ] Screen reader labels, roles, and landmarks verified
- [ ] Contrast ratios verified; zoom 200% and 400% verified
- [ ] axe/Lighthouse accessibility reports clean

**Engineering**
- [ ] Reused existing components/tokens; new ones documented
- [ ] Types strict; lint/format pass; tests added or updated
- [ ] No unnecessary dependencies; bundle impact checked
- [ ] Error boundaries and async states handled

**Performance**
- [ ] LCP/INP/CLS within budget; images optimized with dimensions set
- [ ] Verified on throttled network and CPU

**Delivery**
- [ ] Summary written: what changed, assumptions, deviations, follow-ups

---

## 16. Agent Task Template

When starting UI work, silently run this checklist; when finishing, report in this format.

**Before coding**
1. Which existing components/tokens apply? (list)
2. What states and breakpoints must be covered?
3. What assumptions am I making?

**Final report format**
```
## Summary
<1–3 sentences: what was built/changed>

## Decisions & Assumptions
- ...

## Verification
- Breakpoints checked: ...
- Accessibility checks: ...
- Tests/lint/type-check: ...

## Deviations from DESIGN_PRINCIPLES.md
- None / <section, reason>

## Follow-ups
- ...
```

---

## 17. Governance & Evolution

- This document is **versioned** (SemVer). Breaking changes to tokens or rules bump the major version.
- Changes require a rationale and, where possible, an example (before/after).
- If project reality contradicts this file, **fix the file or fix the code**; never leave them silently inconsistent.
- Review this file at least quarterly and after any major framework, brand, or accessibility-standard update.

### Changelog
- **1.0.0**: Initial release.

---

## Appendix A: Quick Reference

| Topic | Rule of thumb |
|---|---|
| Body text | ≥ 16px (1rem), line-height 1.5–1.7, 45–75ch |
| Text contrast | ≥ 4.5:1 (3:1 large text and UI components) |
| Touch target | ≥ 44×44px |
| Spacing base | 4px scale |
| Transitions | 150–300ms, `transform`/`opacity` only |
| Primary actions | One per view |
| Nav items | ≤ 7 |
| LCP / INP / CLS | ≤ 2.5s / ≤ 200ms / ≤ 0.1 |
| Breakpoints to verify | 360, 768, 1024, 1440 |
| Focus ring | ≥ 2px, ≥ 3:1 contrast, always visible |

## Appendix B: References
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- web.dev Core Web Vitals: https://web.dev/vitals/
- Material Design, Apple HIG, Carbon, Polaris, and Radix/Shadcn as pattern references
- Nielsen Norman Group: 10 Usability Heuristics

