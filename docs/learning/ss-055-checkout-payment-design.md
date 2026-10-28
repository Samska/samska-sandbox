# SS-055 — Checkout and simulated Payment design

- Status: Active
- Work date: 2026-10-28
- Last reviewed: 2026-10-28
- Work item: [SS-055 / #106](https://github.com/Samska/samska-sandbox/issues/106)
- Pull request: None
- ADRs: None
- Canonical documentation: [Samska Store design record](../design/samska-store/README.md), [tokens.json](../design/samska-store/tokens.json), [Frontend Design Review](../AI-GOVERNANCE.md#frontend-design-review)

`Last reviewed` records document maintenance or revalidation, not personal study activity. Keep verified repository evidence distinct from generic explanation.

## What you should learn

### Core — Know this for interviews

- How to derive a design state matrix from actual handlers, API error kinds, and render conditions.
- Why confirmed declined/failed outcomes are different from an unconfirmed response.
- Why the editable live Cart and the immutable captured Payment attempt must stay visually and behaviorally distinct.
- Why automatic Order-then-Payment recovery and a manual Payment check do not prove the same facts.
- How to add a design batch without changing approved pages, masters, tokens, or named versions.

## Concepts explained

A design state matrix is an evidence map. The matrix starts with states the implementation can actually produce: initial loading, initial error, empty, populated, mutation pending, local validation failure, retained-content failure, last-item removal, cart-changed, simulator capacity, attempt conflict, blocked reference, and payment pending. Each state is tied to the handler or render condition that produces it. This prevents the design from implying a state the application cannot enter or omitting one it can.

Payment status is not a single "not success" bucket. `declined` and `failed` are confirmed simulated decisions with captured items and a total. A network, server, or invalid-response outcome is unconfirmed: no decision is known, so the surface must offer a read-only check and must not look like a decline or failure. The design keeps those states visibly separate.

The live Cart and the captured attempt have different ownership. Checkout edits the current Cart through the Cart API. Payment captures a revision-checked snapshot at initiation. Later Cart edits do not change the captured items or total, and Order creation, when it happens later, copies that snapshot without clearing the live Cart. The design uses editable rows in Checkout and read-only captured rows in Payment.

Recovery wording must match what was actually checked. `runRecovery` sets `recoveryStatus="checking"`, performs Order lookup, then Payment lookup when Order returns 404. `handleCheckPaymentResult` queries Payment only and does not currently activate the same visible checking state. A manual Payment 404 therefore does not establish that an Order was checked or absent. The design marks manual checking feedback as approved future intent and keeps unavailable wording truthful: no confirmed result, without claiming a record was deleted or never created.

Design review is not browser verification. The Penpot boards specify hierarchy, states, focus intent, labels, target sizes, and responsive rules. They do not prove DOM semantics, keyboard order, screen-reader announcements, rendered contrast, zoom, or cross-browser behavior.

## How Samska uses it

- Batch 3 adds pages `25 Checkout — Current Interface`, `26 Payment — Current Interface`, and `27 Review — Batch 3` at `revn 96`, with named version `SS-055 Batch 3 — Checkout and simulated Payment — review-ready`. The owner reported visual acceptance of that named version: “Parece ok” (2026-10-28). This is visual acceptance only; application/browser Human Verification remains unperformed. The reviewed documentation is approved and commit/push is authorized; after successful push, PR creation remains a separate decision.
- Checkout preserves the single-column editable live Cart and covers 16 state tiles at desktop and mobile; Payment covers 12 state tiles at each width, including pending, approved, declined, failed, unconfirmed, checking, unavailable, lookup error, abandonment, existing approval, cart-changed, capacity, and conflict.
- Two additive masters, `Captured Item Row / Desktop` and `Captured Item Row / Narrow`, carry the read-only result rows. No new tokens are introduced; the approved shell, buttons, statuses, and token set are reused.
- The approved result shows only the idle Create Order handoff. `View saved Order` is omitted because `onViewOrder` is not passed by production `AttemptSurface` wiring. OrderResult and order creation states remain later work.
- Selected Candidate 03, SS-053, and SS-054 exports were re-exported after authoring and match their approved hashes exactly. The comparison covers selected boards, not every master or page.
- Design checks report zero top-level overlaps, zero containment violations, zero text-bound violations, zero 320 horizontal overflow, and zero state-tile overflow. Contrast values were measured from the approved token set.
- Runtime evidence uses the preserved dedicated headless profile and a short MCP read/export smoke; the runtime was closed gracefully and the profile, helpers, and evidence are preserved.

## Interview perspective

A strong answer should explain why the state matrix is derived from handlers rather than from a generic screen checklist. It should distinguish a confirmed simulated decline from an unconfirmed response, explain why a manual Payment 404 cannot stand in for the automatic two-lookup path, and describe how the immutable captured attempt remains independent of later Cart edits. It should also separate design review from browser accessibility verification and explain why preservation hashes are stronger than an unchanged-looking file link.

## What not to worry about yet

- Implementing Checkout, Payment, recovery, or the design tokens in `web/src`.
- OrderResult, Order creation states, or full journey-recovery design.
- Automated visual regression or accessibility tooling.
- A native `.penpot` backup or a new export pipeline.
- Later design batches or production adoption.

## Why this design

The approved shell and current-interface patterns already establish the visual language, so Batch 3 reuses them rather than forking a second system. Checkout stays single-column because the current implementation is an editable Cart review, not a new checkout form. Payment uses captured read-only rows because the result must remain independent of later Cart edits. The minimal recovery surface is included because uncertain responses are a required Payment state; Order confirmation and full journey recovery remain separate batches.

## Common mistakes

- Treating a network failure as a decline or a failed decision.
- Saying a manual Payment 404 proves an Order was checked or absent.
- Letting captured Payment items react to later live Cart edits.
- Designing Order pending/error/uncertain states or OrderResult inside this batch.
- Using `View saved Order`, which is not reachable through production wiring.
- Claiming browser accessibility from Penpot boards.
- Editing approved masters or tokens to make the new batch fit.

## Reference

- Issue: [SS-055 / #106](https://github.com/Samska/samska-sandbox/issues/106)
- Pull request: None
- Relevant source files: `web/src/checkout/CheckoutReview.tsx`, `web/src/catalog/Catalog.tsx`, `web/src/cart/CartItemRow.tsx`, `web/src/cart/cartApi.ts`, `web/src/payment/PaymentResult.tsx`, `web/src/payment/paymentApi.ts`, `web/src/payment/messages.ts`, `web/src/journey/AttemptSurface.tsx`, `web/src/journey/routes.ts`, `web/src/journey/messages.ts`, `web/src/journey/LatestJourneyLink.tsx`, `web/src/order/OrderResult.tsx`, `web/src/order/orderApi.ts`
- Design evidence: `C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\evidence\ss-055-review-ready-20261028-184306`
- Canonical documentation: [design record](../design/samska-store/README.md), [token JSON](../design/samska-store/tokens.json), [SS-054 learning record](ss-054-product-detail-cart-drawer-design.md)
