---
description: Authoritative UI/UX design, design system, accessibility, and front-end implementation rules for all agent tasks.
globs: ["**/*.{html,jsx,tsx,js,ts,css,scss,vue,svelte}"]
always_on: true
---

# UI/UX & Front-End Design Rules

All UI, UX, styling, and front-end engineering in this repository MUST strictly follow [DESIGN_PRINCIPLES.md](../../DESIGN_PRINCIPLES.md).

## Non-Negotiable Core Rules:
1. **Single Source of Truth**: Follow [DESIGN_PRINCIPLES.md](../../DESIGN_PRINCIPLES.md) as the authoritative standard.
2. **Design Tokens Only**: Never hardcode colors, spacing, typography, radii, or durations. Use design tokens.
3. **Accessibility Baseline**: WCAG 2.2 AA is mandatory. Visible focus indicator (`:focus-visible`), touch targets ≥ 44×44px, text contrast ≥ 4.5:1.
4. **Hierarchy & Simplicity**: One primary action per view. Progressive disclosure for complexity.
5. **State Completeness**: Always implement and verify default, hover, focus-visible, active, disabled, loading, empty, and error states.
6. **Breakpoints Verification**: Verify at 360px, 768px, 1024px, 1440px with zero unintended horizontal overflow.
7. **Definition of Done**: Run Section 15 checklist and format the final report per Section 16 of [DESIGN_PRINCIPLES.md](../../DESIGN_PRINCIPLES.md).

