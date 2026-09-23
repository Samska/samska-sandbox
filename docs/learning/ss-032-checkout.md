# SS-032: Implement Checkout Vertical Slice

- Status: Active
- Work date: 2026-09-23
- Last reviewed: 2026-09-23
- Work item: [SS-032](https://github.com/Samska/samska-sandbox/issues/53)
- Pull request: None at Build/Agent Verification stop
- ADRs: None; follows [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

## What you should learn

- Editable live review versus frozen snapshot: when state should be shared and when it should be frozen
- Single source of truth: one Cart state rendered by several surfaces
- Reuse through demonstrated duplication rather than a speculative component system
- Contextual focus recovery: keeping keyboard editing context through asynchronous mutations
- Atomic aggregate reads: why two synchronized getters are not one snapshot
- Server-authoritative monetary values without duplicating calculation

### Core — Know this for interviews

- Editable live review versus snapshot boundary
- Single source of truth
- Contextual focus recovery
- Atomic aggregate reads
- Server-authoritative presentation

## Concepts explained

Checkout at this stage is an editable live view of the current Cart. The user changes quantities or removes items directly on the Checkout surface, and each edit goes through the same Cart operations the Cart drawer uses. There is no Checkout aggregate, identity, storage, or API, and no copy of the Cart: the review is a render of the one authoritative Cart state. Freezing belongs at the first irreversible step, payment, where an identified transactional snapshot will protect a payment decision from later Cart edits.

A single source of truth keeps one `cart` value in the container. The drawer and Checkout both render it and both call the same mutation handlers, so a change made in one surface is visible in the other without synchronization code. Two separate Cart and Checkout copies would require fake synchronization and would eventually disagree.

Reuse should follow demonstrated duplication. The Cart drawer already had a complete editable item row (stepper, direct input with commit-on-blur/Enter and local validation, remove, subtotal). Checkout needed exactly that behavior, so the row was extracted into one `CartItemRow` component and both surfaces render it. No generic design system or configurable component API was introduced; the only additions are a stable `data-cart-item` hook and `tabIndex={-1}` on the row for focus targeting.

Asynchronous mutations break keyboard context: while a mutation is pending, the controls are disabled, and a disabled control cannot keep focus. Instead of moving focus to a global action such as Back to Market, Checkout remembers the affected Product and the focused control, then restores that same control (or the item's quantity input as a stable fallback) when the server responds. Removing a non-final item moves focus to the adjacent remaining item; removing the final item focuses the empty-state heading. This keeps repeated keyboard adjustments on the same item and never drops focus to `document.body`.

Atomic aggregate reads are about consistency within one read, not business immutability. `Cart.items()` and `Cart.total()` are each synchronized, but calling them separately can interleave with a mutation, producing a response whose lines and total disagree. `Cart.snapshot()` captures both under one lock, and the Cart API serializes exactly one snapshot; the JSON contract does not change.

Server-authoritative values mean the Cart calculates unit prices, quantities, line subtotals, and the total; the API serializes them; the browser only formats them. Checkout never recomputes or invents currency.

## How Samska uses it

`web/src/cart/CartItemRow.tsx` owns the shared editing row. `web/src/cart/Cart.tsx` (`CartPanel`) and `web/src/checkout/CheckoutReview.tsx` both render it, so the Cart drawer and Checkout have identical quantity and removal semantics. `CheckoutReview` also renders the pending status, the existing Cart error alert with a "Reload Cart" action, the server total, the empty state, and Back to Market, and it implements the contextual focus recovery with a small mutation-intent ref and DOM lookups scoped to its item list.

`web/src/catalog/Catalog.tsx` remains the single owner of `cart`, `cartPending`, `cartError`, the mutation handlers, `refreshCart`, and the `isCheckoutOpen` view flag; it passes the same handlers to both surfaces, so every server response replaces the shared state and Checkout re-renders with the authoritative values. Entering Checkout clears any selected Product, closes the drawer directly, and focuses the heading; Back to Market returns to Product Browse and focuses the Cart trigger. No Cart trigger is rendered inside Checkout because editing is inline.

The backend keeps `Cart.snapshot()` and `CartSnapshot` as the atomic read primitive, and `cart/api/CartResponse.java` serializes one snapshot. There is no backend Checkout package.

Evidence lives in the Vitest/React Testing Library suites: direct editing from Checkout, exact Cart requests, server-response rendering, pending and error states, focus restoration after quantity changes, adjacent-item focus after removal, empty-state focus after final removal, and existing drawer regressions. Browser layout, responsive behavior, and rendered focus appearance remain Human Verification concerns.

## Interview perspective

Expect questions about when a checkout should share state versus freeze it, how to keep one source of truth across surfaces, when extracting a component is justified, how to preserve keyboard context across async mutations, why atomic reads differ from immutability, and where a transactional boundary belongs. A strong answer ties each choice to a concrete risk: drift between copies, lost editing context, premature freezing, duplicated pricing logic, or torn reads.

## What not to worry about yet

Payment simulation, order creation, authentication or user identity, persistence and PostgreSQL integration, hosting, routing and deep links, idempotency keys, currency and localization, inventory reservation, taxes, discounts, shipping, E2E automation, global state libraries, and component libraries.

## Reference

- Issue: [SS-032](https://github.com/Samska/samska-sandbox/issues/53)
- Pull request: None at Build/Agent Verification stop
- Relevant source files: `web/src/cart/CartItemRow.tsx`, `web/src/cart/Cart.tsx`, `web/src/cart/CartDrawer.tsx`, `web/src/checkout/CheckoutReview.tsx`, `web/src/catalog/Catalog.tsx`, `backend/src/main/java/io/github/samska/sandbox/cart/Cart.java`, `backend/src/main/java/io/github/samska/sandbox/cart/CartSnapshot.java`, `backend/src/main/java/io/github/samska/sandbox/cart/api/CartResponse.java`, `backend/src/test/java/io/github/samska/sandbox/cart/CartTest.java`
- ADRs: [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

## Why this design

Two earlier designs were superseded by owner decision (2026-09-23). First, an immutable Checkout snapshot was implemented; it created a second source of truth that could diverge from the Cart the user still sees and edits, and it front-loaded identity, storage, and API work that belongs where an irreversible decision happens. Second, a read-only Checkout review was implemented; it forced users to open the Cart drawer to change anything, which is an unnecessary navigation step when the same authoritative Cart is already on screen.

The current design extracts `CartItemRow` because the duplication is real: two surfaces need the same editing semantics. The Cart trigger is omitted from Checkout because inline editing makes the modal Cart redundant and because two mounted copies of the same row would duplicate input ids and live regions. Contextual focus recovery was chosen over the simpler "focus Back to Market after every mutation" because that would send keyboard users to the top of Checkout after each quantity change; the implemented behavior restores the same control or moves to the adjacent item, and it remains a small, Checkout-specific mechanism rather than a generic focus framework.

## Common mistakes

- Building a review that copies Cart state and then trying to keep the copy synchronized
- Forcing users to open a drawer to edit state that is already displayed
- Extracting a generic component system from two call sites instead of one concrete shared row
- Disabling controls during an async mutation and letting focus fall to `document.body`
- Sending keyboard focus to a global action after every edit and losing the editing context
- Confusing read atomicity with business immutability
- Freezing state before an irreversible decision exists
- Recomputing authoritative totals in the browser or adding an invented currency
