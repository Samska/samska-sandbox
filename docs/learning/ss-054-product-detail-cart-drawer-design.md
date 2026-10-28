# SS-054 — Product detail and Cart drawer design

- Status: Active
- Work date: 2026-10-28
- Last reviewed: 2026-10-28
- Work item: [SS-054 / #104](https://github.com/Samska/samska-sandbox/issues/104)
- Pull request: None
- ADRs: None
- Canonical documentation: [Samska Store design record](../design/samska-store/README.md), [tokens.json](../design/samska-store/tokens.json), [Frontend Design Review](../AI-GOVERNANCE.md#frontend-design-review)

`Last reviewed` records document maintenance or revalidation, not personal study activity. Keep verified repository evidence distinct from generic explanation.

## What you should learn

### Core — Know this for interviews

- How to build a design state matrix from the current handlers, API types, and messages rather than from a generic interface idea.
- Why a design specification can intentionally differ from current behavior, and why that difference must be recorded instead of presented as implemented.
- How dialog focus, scroll locking, and responsive drawer-versus-sheet behavior are specified without claiming browser verification.
- How to add a new interface batch while preserving approved candidate, component, token, and named-version baselines.
- Why export hashes are stronger preservation evidence than a mutable cloud file link.

## Concepts explained

A design state matrix is an evidence map. The designer starts with the states the implementation can actually produce: loading, error, empty, populated, pending, validation failure, retained-content failure, last-item removal, and long content. Each state is then tied to the handlers and data that produce it. This prevents a polished board from implying a state the application cannot enter or omitting a state it can.

A design specification is not an implementation claim. The approved Batch 2 decisions show three deliberate differences: quantity-input Escape cancels the draft instead of closing the drawer; Add pending reads “Adding…”; and Add failure has visible feedback below the detail. The current code does something different in each case. The design record and review notes state both the intent and the current behavior, so the later implementation task has an explicit scope rather than a silent behavior change.

Dialog semantics are a system, not a visual overlay. The drawer needs a name, focus entry, containment, focus return, close controls, a backdrop, body scroll locking, and an internal scroll region. The current implementation already provides most of these in `CartDrawer.tsx`; the design specifies the intended behavior and records gaps such as focus relocation after removal and 44px narrow stepper targets.

Responsive behavior is a set of thresholds, not two pictures. The Product detail uses a 832px two-column breakpoint. The Cart drawer uses a 704px side-drawer boundary and a mobile 88dvh cap. At 768 the side drawer is still in use; at 390 and 320 the bottom sheet is used. The design boards show the endpoints and the notes state the boundary rules.

Preservation is evidence, not intention. Candidate 03 and SS-053 were re-exported after Batch 2 authoring. Their SHA-256 values match the approved evidence exactly, which is stronger than asserting that the boards “look unchanged.” The Batch 2 exports, named version, page and board IDs, and dimensions are recorded in an external manifest.

## How Samska uses it

- Batch 2 adds pages `22 Product Detail — Current Interface`, `23 Cart Drawer — Current Interface`, and `24 Review — Batch 2` to the existing Penpot file. The approved Candidate 03 and SS-053 pages are not edited.
- Seven additive masters cover the repeated row, drawer, and status patterns. Product-detail and compact state compositions use existing masters and local token-bound groups rather than creating a whole-screen component.
- The design record transcribes the control mapping and current-versus-design differences. The review notes board keeps the same information available inside Penpot.
- The named version `SS-054 Batch 2 — Product detail and Cart drawer — review-ready — corrected final` pins the review state at `revn 78`; earlier review-ready snapshots at `revn 76` and `revn 77` remain preserved. On 2026-10-28 the owner reported qualified first-version visual acceptance: “Parece ok para uma primeira versão”. It is not unconditional final approval, execution of every checklist item, browser verification, documentation approval, or commit/push authorization.
- On 2026-10-28 the owner separately approved the reviewed documentation and authorized scoped commit/push on `feat/ss-054-product-detail-cart-design`; PR creation remains separate. This documentation approval is distinct from the qualified visual acceptance.
- The runtime was reused for a short MCP read/export smoke, then closed gracefully. The historical 631.3-second SS-053 trial is not presented as new SS-054 evidence.

## Interview perspective

A strong answer should explain why design states must be derived from implementation behavior, and why a design can specify a better behavior without pretending it is already implemented. It should distinguish visual design review from DOM, keyboard, screen-reader, and cross-browser verification. It should also explain how preservation hashes and named versions make an external design baseline reviewable and durable.

## What not to worry about yet

- Implementing the Product detail, Cart drawer, or design tokens in `web/src`.
- Automated visual regression or accessibility tooling.
- A native `.penpot` backup or a new export pipeline.
- Checkout, Payment, Order/recovery, Admin, or 404 screen design.
- Later design batches or production adoption.

## Reference

- Issue: [SS-054 / #104](https://github.com/Samska/samska-sandbox/issues/104)
- Pull request: None
- Relevant source files: `web/src/catalog/ProductDetail.tsx`, `ProductMedia.tsx`, `ProductBrowse.tsx`, `Catalog.tsx`; `web/src/cart/CartDrawer.tsx`, `Cart.tsx`, `CartItemRow.tsx`, `CartTrigger.tsx`; `web/src/formatAmount.ts`
- ADRs: None
- Canonical documentation: [design record](../design/samska-store/README.md), [token JSON](../design/samska-store/tokens.json), [SS-053 learning record](ss-053-headless-penpot-market-design.md)

## Why this design

The approved shell and Market already establish the visual language, so Batch 2 reuses the header, footer, buttons, and cards instead of forking a second system. The Cart drawer keeps the existing fields and server-authoritative amounts; the design changes hierarchy and accessibility intent, not the Cart contract. The Product detail keeps the in-place Market view and focus-return behavior, so search state and the user's place in the list survive the detail round trip.

## Common mistakes

- Treating a Penpot frame as proof of DOM semantics, keyboard order, or screen-reader announcements.
- Designing a state that no handler can produce, or omitting a failure state because it is visually inconvenient.
- Describing a proposed behavior as current behavior without recording the difference.
- Editing approved masters or boards to make a new batch fit instead of adding a scoped layer.
- Claiming preservation from a mutable file link instead of re-exported hashes.
