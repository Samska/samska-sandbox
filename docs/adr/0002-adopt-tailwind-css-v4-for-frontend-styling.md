# ADR 0002: Adopt Tailwind CSS v4 for Frontend Styling

- Status: Accepted
- Date: 2026-09-20
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-028](https://github.com/Samska/samska-sandbox/issues/43), [ADR 0001](0001-adopt-modular-monolith.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

## Context

SS-028 established the Product UX Foundation with a hand-authored stylesheet (`web/src/index.css`). Repeated Human Verification rounds showed that further CSS-only visual polishing was reaching diminishing returns: the stylesheet had grown to roughly 600 lines of bespoke selectors, repeated control/layout declarations, and manually maintained responsive rules for a single page.

The styling layer is a cross-cutting frontend concern. It affects every future screen, including Checkout, Payment, and Order presentation in the remaining First Order journey. Continuing with hand-authored component CSS would keep duplicating the same layout, control, state, and responsive patterns in new features.

The current styling tokens (colors, radii, shadows, font stack) are already approved design direction. The problem is the maintenance model for applying them, not the visual direction itself.

## Decision

Adopt Tailwind CSS v4 as the frontend styling foundation for `web/`, using exactly:

- `tailwindcss` 4.3.3 (devDependency)
- `@tailwindcss/vite` 4.3.3 (devDependency), integrated through the official Vite plugin in `web/vite.config.ts`

Boundaries:

- Styling uses `@import "tailwindcss"` plus `@theme` tokens in `web/src/index.css`.
- Approved visual tokens (canvas, surface, ink, muted, brand, focus, success, danger, borders, radii, shadows, media palette, font stack) become Tailwind theme tokens.
- Only genuinely global rules remain in `index.css`: base element behavior, focus-visible baseline, disabled-control behavior, and role-based status/alert coloring.
- Component presentation uses Tailwind utilities in JSX.
- Deterministic Product media tones use a static class map so Tailwind can statically detect every class.
- No `tailwind.config.js`, no PostCSS configuration, no autoprefixer, and no additional Tailwind plugins are introduced.
- MUI, shadcn/ui, Bootstrap, Chakra, routing, global state, Storybook, and a generic component library remain out of scope.
- No generic `Button`/`Card`/`Input` primitives are created in this change.

## Alternatives Considered

- **Continue hand-authored CSS with token custom properties.** Rejected for this change: Human Verification demonstrated diminishing returns; the stylesheet was already duplicating control, layout, and responsive patterns, and each new feature would repeat them.
- **CSS Modules.** Preserves scoping but does not reduce repeated utility-level declarations or provide a shared spacing/sizing scale; migration effort would be comparable with less benefit.
- **MUI or shadcn/ui.** Rejected: introduces component-library opinions and dependency surface the product does not need yet; the current need is styling consistency, not prebuilt components.
- **Tailwind v3 with PostCSS.** Rejected in favor of the v4 Vite plugin, which removes PostCSS configuration and aligns with the existing Vite toolchain.

## Consequences

Positive:

- Consistent spacing, sizing, color, and state patterns shared by all future screens.
- Removes roughly the entire bespoke component stylesheet; global CSS shrinks to base rules.
- Theme tokens keep the approved visual direction centralized.
- Static media class map preserves deterministic presentation without runtime class construction.

Negative:

- Two new devDependencies and their transitive graph in `package-lock.json`.
- Utility-class verbosity in JSX.
- Vite/Vitest integration risk if plugin versions drift from Vite.
- Tests must stay behavior-focused; asserting utility classes would couple tests to styling implementation.

Operational/security:

- Dependencies are pinned exactly and installed with `npm ci --ignore-scripts`; no runtime dependency is added and no secrets or data handling change.

Testing:

- Existing RTL tests verify semantics and behavior and required no changes; layout and visual quality remain Human Verification and CI build concerns.

## Validation

- Full frontend verification passes: `npm.cmd ci --ignore-scripts`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`.
- Backend `clean verify` remains green (33 tests) with no backend changes.
- `git diff --check` and Docker Compose static validation pass.
- Human Verification confirms desktop and 375–390px layouts, keyboard/focus behavior, Catalog tools disclosure, and Product/Cart behavior are preserved.
- Revisit this decision if the plugin becomes incompatible with the Vite line, if utilities materially reduce readability, or if the project later needs component-library-level structure; at that point a new ADR supersedes this one.
