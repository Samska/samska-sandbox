# SS-031: Elevate Product Storefront UX/UI

- Status: Active
- Work date: 2026-09-22
- Last reviewed: 2026-09-22
- Work item: [SS-031](https://github.com/Samska/samska-sandbox/issues/49)
- Pull request: None at Build/Agent Verification stop
- ADRs: [ADR 0003](../adr/0003-adopt-optional-product-media-reference.md); follows [ADR 0001](../adr/0001-adopt-modular-monolith.md) and [ADR 0002](../adr/0002-adopt-tailwind-css-v4-for-frontend-styling.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

## What you should learn

- Storefront information hierarchy versus a functional catalog layout
- Container-owned state with focused presentational components
- Repetition-driven shared primitives instead of a speculative design system
- Accessible focus return between an in-page browse and detail view
- Optional, nullable contract enrichment that preserves existing behavior
- Resolving Product media through a reviewed static mapping with a truthful fallback
- Accessible drawer behavior: dialog semantics, focus entry, containment, Escape, and focus return
- One Cart count definition across the trigger, the drawer, accessibility labels, and tests
- Explicit feedback tones replacing a blanket role-based color rule

### Core — Know this for interviews

- Hierarchy is a product decision; it should not require contract changes.
- Extract a primitive only when concrete repetition exists, and keep it small.
- Optional nullable fields grow a contract without breaking existing consumers.
- A media reference can stay local and reviewable instead of depending on external hosts.
- Programmatic focus must move into an overlay and return to its trigger when it closes.
- Unlayered global CSS overrides layered utility classes; scope shared feedback styling deliberately.

## Concepts explained

Storefront hierarchy turns a working catalog into a readable shopping surface: a browse intro with product count, cards with a consistent media/name/description/price/action rhythm, and a detail view that pairs product media with name, description, price, and the primary Add to Cart action. The information order changes; the data and boundaries do not.

Product media stays optional and explicit. A Product carries an optional `mediaKey` (nullable, lowercase slug, 40-character limit); a reviewed static frontend mapping resolves known keys to repository-owned local assets and everything else renders a monogram fallback. Media is never attached automatically, a well-formed key without an asset is not an error, and a failed image load switches to the fallback. This keeps the storefront visually credible without external runtime URLs, uploads, or a media pipeline. The contract change is additive, so existing Products and Cart behavior are untouched. Browse cards present the media region at the full card width with one consistent 16/10 aspect ratio for curated images and the monogram fallback alike, followed by name, a two-line description, price, and actions, so equal-height cards align their price and action rows and never shift when media loads.

The Cart drawer replaces the permanent sidebar. Because it is a modal overlay, the presentation owns accessibility behavior: focus moves to the drawer heading on open, Tab wraps within the drawer, Escape and the close control both call the same close path, and that path returns focus to the trigger. Background scrolling is locked while open, and the item list scrolls inside the drawer. On mobile the drawer is a full-bleed bottom sheet (the desktop `max-w-sm` is lifted with `max-w-none` under the mobile breakpoint) sized with dynamic viewport units (`88dvh` inside a `100dvh` overlay) so it stays within the visible viewport as browser toolbars move, with safe-area bottom padding and contained internal scrolling; the heading and close control remain at the top of the sheet and the total is reached by scrolling. Sizing the overlay with percentage units against the initial containing block instead let the sheet extend under mobile browser chrome, hiding the total.

Cart count semantics are defined once: "items" means the sum of item quantities. Tote ×2 plus Pour-Over ×1 is 3 items in the trigger, the drawer badge, the accessible name, and the tests.

A container/component split keeps `Catalog` as the only state owner: it loads Products and the Cart, owns selection, and passes handlers down. `ProductBrowse`, `ProductDetail`, `ProductSetupTools`, `ProductMedia`, `CartDrawer`, and `CartTrigger` are presentational, which makes the refinement reviewable without moving business behavior.

Repetition-driven primitives are extracted only from real duplication: the primary button class appeared across many controls, form label/error/aria wiring four times, and status surfaces across Catalog and Cart. `Button`, `FormField`, and `StatusMessage` are the result. ADR 0002 deliberately deferred generic primitives at SS-028; SS-031 reintroduces a bounded layer because the repetition now exists. No generic design system, no component library, no new dependency.

Focus return matters in an in-page master/detail flow. Opening detail moves focus to the detail heading; returning to browse previously left focus on a removed element. `Catalog` records the originating product id and focuses the registered View details button after `selectedProduct` returns to `null`.

Unlayered global CSS sits above Tailwind's layered utilities in the cascade. The previous `[role="status"] { color: var(--color-success) }` base rule therefore forced success green onto loading and pending messages. Replacing it with explicit tones on one shared `StatusMessage` makes feedback state visible and intentional.

## How Samska uses it

`web/src/catalog/Catalog.tsx` keeps request state, Cart handlers, drawer state, and selection; `web/src/catalog/ProductBrowse.tsx`, `ProductDetail.tsx`, `ProductSetupTools.tsx`, and `ProductMedia.tsx` render the storefront; `web/src/catalog/mediaCatalog.ts` maps curated `mediaKey` values to local assets and `web/src/catalog/messages.ts` owns API error translation; `web/src/cart/CartDrawer.tsx` and `CartTrigger.tsx` provide the accessible drawer and its visible trigger while `web/src/cart/Cart.tsx` remains the Cart panel; `web/src/ui/Button.tsx`, `FormField.tsx`, and `StatusMessage.tsx` are the shared primitives. Curated images live in `web/public/media/` with attribution, source links, and license notes in `ATTRIBUTION.md`. `web/src/index.css` keeps tokens and base rules, minus the blanket status color.

Media keys are validated in the Product domain, carried through the create request and the always-nullable response field, and assigned explicitly in the setup tools, which stay collapsed by default. Catalog and Cart API modules keep their existing request shapes and behaviors; the only Catalog contract change is the optional nullable `mediaKey`. `ProductMedia` uses a static class map so Tailwind detects every class, and the fallback keeps browse and detail layouts stable. Amounts are grouped with `Intl.NumberFormat` without a currency symbol, and the Cart quantity control pairs a stepper with a commit-on-blur input while preserving the existing update API.

Evidence lives in the Vitest/RTL suite: browse/detail/Cart behavior, product and item count text, focus return to the originating View details control, media mapping and fallback including image errors, and drawer focus entry, containment, Escape, close, and focus return. Typecheck and the Vite production build cover static types and Tailwind generation; browser layout, responsive behavior, rendered focus appearance, and the rendered media and drawer remain Human Verification.

## Interview perspective

Expect questions about when to extract a shared component, how to keep state ownership clear, why focus management is part of UX quality, how optional nullable contract fields avoid breaking changes, why a reviewed local media mapping can beat external URLs or uploads, how modal focus containment works without a library, and how the CSS cascade interacts with utility layers. A strong answer ties each choice to observed repetition, an observed accessibility gap, or a concrete constraint, not to aesthetics alone.

## What not to worry about yet

Checkout, payments, orders, authentication, persistence, PostgreSQL integration, routing, global state, search, filtering, categories, sorting, In Cart indicators, loading skeletons, currency formatting or localization, image uploads, an image pipeline, multiple images per Product, image editing, external image hosting, component libraries, Storybook, and browser E2E automation.

## Reference

- Issue: [SS-031](https://github.com/Samska/samska-sandbox/issues/49)
- Pull request: None at Build/Agent Verification stop
- Relevant source files: `web/src/catalog/Catalog.tsx`, `web/src/catalog/ProductBrowse.tsx`, `web/src/catalog/ProductDetail.tsx`, `web/src/catalog/ProductSetupTools.tsx`, `web/src/catalog/ProductMedia.tsx`, `web/src/catalog/mediaCatalog.ts`, `web/src/catalog/messages.ts`, `web/src/ui/Button.tsx`, `web/src/ui/FormField.tsx`, `web/src/ui/StatusMessage.tsx`, `web/src/cart/Cart.tsx`, `web/src/cart/CartDrawer.tsx`, `web/src/cart/CartTrigger.tsx`, `web/public/media/ATTRIBUTION.md`, `web/src/index.css`
- ADRs: [ADR 0003](../adr/0003-adopt-optional-product-media-reference.md); follows [ADR 0001](../adr/0001-adopt-modular-monolith.md) and [ADR 0002](../adr/0002-adopt-tailwind-css-v4-for-frontend-styling.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [AI Governance](../AI-GOVERNANCE.md)

## Why this design

The approved increment was intentionally bounded. Splitting the 666-line `Catalog.tsx` follows existing responsibilities instead of introducing a new pattern; the primitives reduce measured repetition, and the owner explicitly excluded a design system and an ADR for local UI primitives. Focus return was chosen over a heavier focus-trap or routing solution because the flow is a two-view local state change. Feedback tones reuse existing `@theme` tokens.

The media decision separates the contract from the assets. An optional nullable `mediaKey` keeps existing Products and API consumers working, while one reviewed static mapping keeps the asset set explicit and testable. External runtime URLs were rejected for availability, privacy, and license drift; uploads were rejected as infrastructure the milestone does not need; generated covers were rejected because they imply they depict the item. Curated assets prefer CC0, and the one attributed asset (CC BY 2.0) is credited in `ATTRIBUTION.md`; temporary mockup images were not copied into the repository.

The Cart drawer was chosen over a permanent sidebar because the Cart is an occasional task, and the drawer needed real modal behavior rather than a styled aside. The team implemented dialog semantics, focus entry, containment, Escape, focus return, and scroll handling directly, without adding a dependency or a routing change. Alternatives rejected: keeping one monolithic file (harder to review and extend for Checkout), a CSS utility layer for controls (does not remove JSX duplication of ARIA wiring), a router or shared store (out of scope until deep links or shared state are required), and a component library for the dialog (unnecessary dependency surface).

## Common mistakes

- Extracting a primitive from one or two uses and calling it a design system
- Treating a large generated cover as product imagery; abstract or stock media should not imply it depicts the exact item
- Depending on external image URLs or building upload infrastructure when a reviewed local asset set is enough
- Treating a well-formed media key without an asset as an error instead of rendering the fallback
- Forgetting focus entry, focus containment, or focus return when replacing a static panel with a drawer
- Letting the page scroll behind an open modal dialog
- Using different Cart count definitions in the trigger, the drawer, accessibility labels, and tests
- Moving Product or Cart state into presentational components
- Letting focus fall back to the document body after an in-page view change
- Assuming a utility class beats an unlayered global rule in the cascade
- Changing API contracts to make presentation easier
- Adding dynamic Tailwind class names that the scanner cannot detect
- Adding a currency symbol when the API carries no currency
