# SS-049: PostgreSQL Order Persistence

- Status: Active
- Work date: 2026-10-26
- Last reviewed: 2026-10-26
- Work item: [SS-049 (#95)](https://github.com/Samska/samska-sandbox/issues/95)
- Pull request: None
- ADRs: [ADR 0008](../adr/0008-adopt-postgresql-order-persistence.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Local Development](../LOCAL-DEVELOPMENT.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why the first persistence slice should follow an existing module port instead of introducing a generic repository layer.
- How a database constraint replaces an in-process uniqueness lock without moving business ownership.
- How to distinguish a rolled-back write from a committed write whose response was lost.
- Why a persistence test needs a real schema and a restart boundary, not only a mocked store.
- How to keep most unit and API tests independent of Docker while still testing production wiring.

### Core — Know this for interviews

Prioritize the idempotency boundary, transaction/rollback reasoning, and the difference between process-local and durable state. The other concepts support those three.

## Concepts explained

### Port-first persistence

The application already depended on `OrderStore`, not on a database. Replacing `InMemoryOrderStore` with `JdbcOrderStore` keeps the application service and HTTP contract unchanged. The database is an implementation behind a module-owned boundary, so Catalog, Cart, and Payment never read Order tables.

### Idempotency by unique business key

An Order has one source payment attempt. A unique `payment_attempt_id` constraint lets the database enforce that rule even if two requests race. Application code checks for an existing Order first, then inserts with `ON CONFLICT DO NOTHING`. The losing request reads the winner and returns `200`, not a second row.

### Transaction and rollback

The Order row and its item rows are written in one transaction. If an item insert fails, the Order insert is rolled back. A rolled-back write leaves zero rows. A committed write followed by a lost response leaves one row; retrying the same attempt finds it and returns it. Those are different failure states and need different evidence.

### Restart boundary

An in-process test cannot prove durability. A restart test starts one application context against a database, creates an Order, closes the context, starts a second context against the same database, and reads the Order back. Payment attempts are intentionally absent in the second context, so replay must not depend on them.

### Database failure is a product behavior

A database outage is not an exception detail. The API returns `503 order-store-unavailable`, with bounded connection and socket timeouts, and no partial write. Recovery without a backend restart must be observed; it is not implied by a successful reconnect in another layer.

## How Samska uses it

- [ADR 0008](../adr/0008-adopt-postgresql-order-persistence.md) records the decision, schema ownership, and consequences.
- `JdbcOrderStore` implements the existing `OrderStore`; `OrderPersistenceConfiguration` wires it by default and backs off only when the `no-database` test profile is active.
- Flyway owns `orders` and `order_items`. Items store historical snapshots and have no foreign key to Product or Payment state.
- `JdbcOrderStoreTest` uses Testcontainers PostgreSQL for round-trip, more than 32 Orders, concurrency, rollback, and post-commit retry.
- `OrderPersistenceRestartTest` uses two application contexts against one database.
- Unrelated Spring API tests activate the `no-database` profile and a test-only `OrderStore`; pure domain tests remain Docker-free.
- The controlled outage check is Agent-local evidence, not a CI substitute. The 2026-10-26 observation recorded bounded `503` responses, health down, and recovery without a backend restart after PostgreSQL returned; see [Issue #95](https://github.com/Samska/samska-sandbox/issues/95).

## Interview perspective

A strong answer should explain why the unique key, not a Java lock, is the durable idempotency mechanism; why checking the existing Order before reading Payment preserves replay after restart; why a transaction is required for the parent and child rows; and why testing two contexts is stronger than testing a store method twice. It should also state that Products, Cart, and Payment remain process-local and that a local-only database is not an access-control boundary.

## What not to worry about yet

- Persisting Catalog, Product media, Cart, or Payment attempts.
- JPA, a generic repository abstraction, or multi-service transactions.
- Retention, backup, production credentials, hosting, and authorization.
- Removing every in-memory test double; the no-database profile is deliberate.

## Reference

- Issue: [SS-049 (#95)](https://github.com/Samska/samska-sandbox/issues/95)
- Pull request: None
- Relevant source files: `backend/src/main/java/io/github/samska/sandbox/order/storage/JdbcOrderStore.java`, `OrderPersistenceConfiguration.java`, `backend/src/main/resources/db/migration/V1__create_orders.sql`, `web/src/order/orderApi.ts`
- ADRs: [ADR 0006](../adr/0006-adopt-order-owned-in-memory-store.md), [ADR 0008](../adr/0008-adopt-postgresql-order-persistence.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Local Development](../LOCAL-DEVELOPMENT.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

## Why this design

Persisting the smallest immutable aggregate first proves the full path—configuration, migration, transaction, restart, and failure—without migrating mutable state or media. Orders are copied snapshots, so they do not need live Product or Payment data. The Closest alternative, persisting Catalog Products, would have required media bytes, capacity transactions, list ordering, and database reads on every storefront load.

## Common mistakes

- Treating `ON CONFLICT DO NOTHING` as enough without re-reading the winner; the client still needs the stored Order.
- Checking the Payment attempt before the Order; that breaks replay after restart.
- Assuming a failed HTTP response means the transaction rolled back. The commit may have succeeded and the response may have been lost.
- Calling a successful connection test proof of schema, migration, or business persistence.
- Adding a foreign key from Order items to current Product rows; the item is a historical snapshot and Products are not durable.

## Deeper — Useful later

The local database uses the Compose bootstrap account. A hosted environment needs a least-privileged application role, a real secret mechanism, retention and backup decisions, and an authorization boundary for Order lookups. Those are separate decisions, not extensions of this slice.
