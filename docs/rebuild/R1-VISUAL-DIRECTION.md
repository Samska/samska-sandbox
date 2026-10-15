# R1 — visual direction

## Why this pass exists

The owner approved the R1 behaviours but rejected the presentation: a generic technical form with serious contrast problems. Reproducing the original application's look is explicitly not required. This pass rebuilds the visual layer of the candidate while keeping R1's functional scope unchanged.

## Direction: "paper and ink commerce"

Derived from the product's real identity (warm canvas, dark ink, teal brand accent, amber focus), not from framework defaults.

- **Palette.** Warm canvas background, near-white surfaces, deep ink text, teal as the single brand accent, amber for focus rings, restrained success/danger. Explicit tokens rather than default utility colours, so contrast is a decision rather than an accident.
- **Typography.** Strong scale contrast: a large, tightly tracked display line for the surface title; readable body text at 16px or more; uppercase micro-labels with letter spacing used as section eyebrows; tabular figures where numbers are compared.
- **Two distinct experiences.** The catalogue is an editorial storefront: brand mark, product-forward grid, prominent amounts, restrained elevation on hover/focus. Creation is a workshop surface: one panel with internal rules, technical labels, denser fields, an anchored primary action and inline feedback. They must not read as the same screen with different copy.
- **Composition over cards.** Space, rules and hierarchy carry structure; nested bordered boxes and purposeless decoration are removed. One accent colour per context.
- **Monogram fallback.** A tile derived from the Product name gives the grid visual weight without new assets, dependencies or capabilities.
- **Discrete technical information.** The partial-candidate notice and the runtime identity stay available but do not dominate; technology status is not the product.

## Accessibility and responsiveness requirements

- Text, field borders and disabled/hover states meet AA contrast.
- Visible, consistent focus; keyboard order follows reading order; targets at least 44px.
- Fluid layout from 320px upward; nothing conveyed by colour alone.
- `prefers-reduced-motion` respected.
- Test hooks and English copy required by the R1 browser suite are preserved.

## Scope boundaries

Presentation only. No upload, no new fields, no mediaKey picker, no persistence, no extra endpoints, no new dependency. Amount format keeps grouping and two decimals with no currency symbol. Functional guards, POST counts, uncertain-create handling and the standard application are untouched.

## Outcome (implemented in web/rebuild)

- **Tokens.** A dedicated stylesheet replaces framework defaults: warm canvas, near-white surfaces, deep ink, teal brand accent, amber focus, restrained status colours. No default blue/slate/amber utilities remain in the markup or in the built CSS.
- **Typography.** Editorial display line for the page title with tight tracking; readable 16px body; uppercase micro-labels as section eyebrows; serif product names; tabular figures for amounts; monospace for the Product id.
- **Catalogue.** One frame per product card with an inset monogram tile derived from the name, prominent amount, restrained hover/focus elevation, and an explicit "View details" action. One frame per card; no nested borders.
- **Workshop.** A single panel with internal rules, technical labels, dense 44px fields with one consistent treatment, an anchored primary action and inline per-field feedback.
- **Disclosure.** The partial/in-memory notice sits quietly under the title; runtime identity stays in a slim brand strip outside the main flow.
- **Structure.** `sections/Catalog.tsx`, `sections/Workshop.tsx`, `sections/ProductDetail.tsx`, `sections/PageHead.tsx`, `sections/BrandStrip.tsx`, `ui/Monogram.tsx`, with the heading outline h1 → h2 catalogue → h3 cards → h2 detail → h2 creation.

## Verification of this pass

- `npm run typecheck:rebuild`, `npm run test:rebuild` (63 tests) and `npm run build:rebuild` pass; `npm run test:e2e:rebuild` passes 5/5 against the real launcher stack; the preserved standard application still passes 173 tests and both First Order E2E tests.
- `node scripts/contrast-check.mjs` is a real gate: every pair declares text, UI or decorative, and any enforced failure exits non-zero. 29 enforced pairs pass AA; the single decorative hairline is exempt. Verified by falsification (a broken token produced exit 1).
- Real-browser inspection by the Orquestrador at 1440x900, 768x1024, 390x844 and 320x720 confirmed no overlap, no clipping, visible focus, legible error states and a single h1.
- Defects found by inspection and fixed: fields that did not read as fields (underline-only inputs), header collision below 520px, excessive vertical rhythm, a floating "Refresh" label, nested card borders, cramped card footer, oversized empty state, and the detail panel opening below the form.

## Independent visual review and outcome

Design UX/UI reviewed the frozen tree read-only with real browser captures: **approved with minor reservations, no blockers**. Confirmed: visible amber focus on keyboard navigation, 44px targets at every breakpoint, triple-redundant validation signalling (tint + border + message), clear pending/success states, strong serif-versus-sans hierarchy, clear separation between storefront and workshop, no horizontal overflow from 320 to 1440, and discrete technical information.

Two details were corrected after that review:

- **Catalogue grid.** Explicit breakpoints replace auto-fill (1 column below 640px, 2 up to 1023px, 3 up to 1279px, 4 from 1280px) so four products fill a desktop row instead of leaving an orphan card.
- **Detail reveal.** Opening a detail now scrolls with `block: "start"` instead of `"nearest"`. With `"nearest"` the panel rested against the bottom edge of the viewport whenever the grid was short; the Orquestrador measured `headingTop` 819 of 900 in that case. With `"start"` the panel top lands at the viewport top (`headingTop` 0, 857px of room below).
- **Aligned amounts.** The card name reserves two lines, so the price row lines up across the grid instead of drifting when a name wraps.

Evidence handling note: the reviewer listed capture files under `backend/target/review-r1/` and reported detail metrics, but the files were actually written to `web/review-r1/` (outside the declared scope) and its own `summary.json` recorded those metrics as `null`. The Orquestrador rejected the report as evidence at face value, re-measured independently (which confirmed the substance of the numbers), moved the artifacts out of the versioned tree, and re-verified every claim. No agent report is being used as its own proof.
