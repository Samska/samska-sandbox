# ADR 0009: Adopt PostgreSQL Persistence for the Cart

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-065 (#125)](https://github.com/Samska/samska-sandbox/issues/125), [ADR 0008](0008-adopt-postgresql-order-persistence.md), [ADR 0005](0005-adopt-payment-attempt-store-with-cart-revision.md), [Architecture](../ARCHITECTURE.md)

## Context

ADR 0008 persisted Orders and deliberately left the Cart in memory. It also rejected persisting Payment attempts first, because attempt approval uniqueness is keyed by Cart revision and the Cart revision restarted at zero with every backend process. A durable Payment attempt table needs a durable, monotonic Cart revision, so the Cart is the next prerequisite slice.

The Cart is a single current Cart without identity, owned by the Cart module behind the `CartStore` port. The previous port returned one live, internally synchronized `Cart` object and callers mutated it in place, which cannot be made durable without changing the port.

## Decision

The single current Cart is persisted in PostgreSQL by `JdbcCartStore`, wired by `CartPersistenceConfiguration` unless the `no-database` test profile is active. Flyway migration `V2` creates `cart` (one row, enforced by a check constraint, holding the revision) and `cart_items` (ordered lines with Product ID, name and unit price snapshot, and quantity). There is no foreign key to Product, and no Cart identity is introduced.

The port changes from "return the live Cart" to two operations: `current()` reads the Cart, and `update(Consumer<Cart>)` applies one change atomically and returns the resulting Cart. `JdbcCartStore.update` runs in one transaction: it locks the Cart row (`SELECT ... FOR UPDATE`), loads the Cart through `Cart.restore`, applies the existing domain methods, and, only when the revision changed, rewrites the lines and the revision. The domain rules (merging repeated additions, revision increments, validation) stay in `Cart`; the store only loads and saves. A change that throws, including an invalid one, stores nothing.

`CartApplicationService` expresses each existence check and mutation inside one `update`, which also makes check-then-change atomic across processes sharing the database. Payment's revision-checked capture reads the Cart through `current()` and `snapshotForRevision`; its lock order (Payment, then Cart) is unchanged and the database adds no lock that Payment holds.

`InMemoryCartStore` remains for the `no-database` profile and pure unit tests, and implements the same `update` contract.

Database unavailability on Cart reads or writes, Payment initiation (Cart capture) and Product deletion (Cart membership check) returns `503` with code `cart-store-unavailable`, mirroring `order-store-unavailable`.

## Alternatives Considered

- **Persist Payment attempts first.** Rejected again: the approved-per-revision rule would collide after a restart, because a restarted Cart reuses low revision numbers.
- **Persist Catalog Products first.** Rejected for this slice for the reasons in ADR 0008 (media bytes, capacity transactions, list ordering).
- **Keep the live `Cart` object and save after every call.** Rejected: it hides the transaction boundary, loses updates across processes, and leaves a half-applied change if the save fails.
- **Optimistic revision check instead of a row lock.** Rejected: the revision is a business concept exposed to clients; using it as the concurrency token would turn a concurrent add into a client-visible conflict where today it simply succeeds.
- **Per-line upserts instead of rewriting the lines.** Rejected: a Cart is a handful of lines, and one delete-and-insert inside the locked transaction is simpler to reason about.
- **Foreign key from Cart items to Product.** Rejected: Products remain in memory, so the reference would be unenforceable and would couple a durable record to volatile state.

## Consequences

- The Cart and its revision survive a backend restart. Products, media and Payment attempts remain process-local.
- After a restart the Cart can hold a line for a Product that no longer exists. The line keeps its own name and price, so Cart totals, Payment capture and Order creation still work, and the line can be edited or removed; adding that Product again returns `404` as before. Resolving this properly requires persisting Catalog.
- The in-process `CatalogCartCoordinator` lock still orders add-to-Cart against Product deletion inside one process; the database row lock serializes Cart changes themselves.
- The single Cart is shared by every client of the database, as before; this remains a local-only use constraint, not an access-control or hosting decision.
- Cart data is synthetic, holds no customer data, and persists until the local volume is reset or the lines are removed.
- Backend tests that start the full application against PostgreSQL must clear Cart state between tests.

## Validation

`JdbcCartStoreTest` covers round-trip values and order, repeated addition, quantity change and removal, rejected and failing changes leaving state untouched, rollback on a storage failure, and 40 concurrent additions with no lost update or repeated revision. `CartPersistenceRestartTest` runs three sequential real-HTTP application contexts against one database and proves items, snapshots, totals and revision survive, that the revision continues rather than restarting, and that a rejected add changes nothing. `CartApiUnavailableTest` covers the `503` mapping on Cart, Payment and Product-deletion endpoints. The existing Cart, Payment, Order and journey suites pass unchanged in behavior. Human Verification of restart behavior remains separate from these automated checks.
