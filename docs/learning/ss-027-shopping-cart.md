# SS-027: Implement Shopping Cart vertical slice

- Status: Active
- Work date: 2026-09-19
- Last reviewed: 2026-09-19
- Work item: [SS-027](https://github.com/Samska/samska-sandbox/issues/41)
- Pull request: [PR #42](https://github.com/Samska/samska-sandbox/pull/42)
- ADRs: None
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

## What you should learn

- Aggregate roots and invariants
- Narrow in-process contracts between modular-monolith capabilities
- Quantity value objects and repeated-add semantics
- Price snapshots and derived-total ownership
- Process-local backend state and local React state
- Risk-based testing of stateful behavior

### Core — Know this for interviews

- Aggregate ownership and invariants
- Directional module dependencies through explicit contracts
- Snapshot versus live-reference pricing

## Concepts explained

An aggregate root controls mutations to its owned entities and preserves invariants. The Cart owns Cart items, quantity changes, removals, line subtotals, and the Cart total.

A narrow application contract allows Cart to request the minimum Product information without accessing Catalog persistence or implementation details. This preserves ownership and keeps the modular-monolith dependency directional.

A Quantity value object makes the minimum valid quantity explicit. Repeated addition increments an existing item, while zero remains invalid because removal is a separate operation.

A price snapshot makes the Cart total deterministic after addition. The Cart owns derived calculations, while the browser only renders server-provided values.

## How Samska uses it

Catalog owns Product and exposes `ProductCatalog` with `CatalogProduct` boundary data. Cart owns `Cart`, `CartItem`, `ProductReference`, and `Quantity`. Cart state is a single process-local current Cart held by `InMemoryCartStore`.

Backend domain tests cover invariants and exact `BigDecimal` calculations. MockMvc tests cover the published APIs. React Testing Library tests cover browse and Cart interaction without introducing global frontend state.

## Interview perspective

Relevant discussions include why Cart does not call `ProductStore`, why a single current Cart is sufficient without authentication, why repeated additions increment, and why a price snapshot is preferable to recalculating from Catalog for this slice. Strong answers distinguish domain ownership from transport and persistence concerns.

## What not to worry about yet

Authentication, sessions, multiple carts, persistence, Checkout, inventory, payment, messaging, distributed services, and browser E2E infrastructure remain deferred until concrete evidence requires them.

## Reference

- Issue: [SS-027](https://github.com/Samska/samska-sandbox/issues/41)
- Pull request: [PR #42](https://github.com/Samska/samska-sandbox/pull/42)
- Relevant source files: `backend/src/main/java/io/github/samska/sandbox/catalog/application/ProductCatalog.java`, `backend/src/main/java/io/github/samska/sandbox/cart/Cart.java`, `backend/src/main/java/io/github/samska/sandbox/cart/Quantity.java`, `web/src/cart/Cart.tsx`
- ADRs: None; follows [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

## Why this design

The implementation uses one current process-local Cart rather than inventing Cart identity, sessions, or persistence. Cart receives Product data through a Catalog-owned contract rather than depending on a store. Unit price and Product name are snapshotted on first addition, so repeated additions preserve deterministic Cart state.

## Common mistakes

- Treating browser totals as authoritative
- Letting Cart access Catalog storage directly
- Using zero quantity as an implicit removal operation
- Making opaque Product UUID order part of the public API
- Introducing global frontend state before the page boundary requires it

## Interview vocabulary

**Aggregate root:** The object responsible for protecting invariants across its owned entities.

**Application contract:** An explicit use-case-facing boundary used by another in-process module.

**Price snapshot:** The Product price captured when a Cart item is first added.
