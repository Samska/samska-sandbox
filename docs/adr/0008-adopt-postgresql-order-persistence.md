# ADR 0008: Adopt PostgreSQL Persistence for Orders

- Status: Accepted
- Date: 2026-10-26
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-049 (#95)](https://github.com/Samska/samska-sandbox/issues/95), [ADR 0006](0006-adopt-order-owned-in-memory-store.md), [Architecture](../ARCHITECTURE.md)

## Context

Orders are immutable records copied from approved simulated-payment attempts. ADR 0006 deliberately kept them process-local and deferred persistence until it was needed. That deferral made a backend restart erase every Order, including the frozen record a customer may still hold through an attempt-addressed URL.

The repository already had a local PostgreSQL 18 Compose runtime, but no application connection, schema, migration, repository, or database-backed test. The first persistence slice must keep the modular monolith, preserve module ownership, and avoid migrating unrelated in-memory state.

## Decision

Order persistence uses the existing Order-owned `OrderStore` port, implemented with Spring JDBC (`JdbcClient`) against PostgreSQL. Flyway owns the schema. The backend requires PostgreSQL at startup; the DataSource, migration, and database health participation exist only for the Order boundary.

The `orders` table stores the Order ID, unique payment-attempt ID, Cart revision, and total. `order_items` stores the historical item snapshot and references only its owning Order. There is no creation timestamp, no foreign key to Product or Payment state, and money is stored as unconstrained PostgreSQL `numeric` while the API keeps its JSON-number contract.

Creation checks for an existing Order by payment-attempt ID before reading the in-memory Payment attempt. It then inserts the Order and items in one transaction with `ON CONFLICT (payment_attempt_id) DO NOTHING`. A concurrent duplicate therefore resolves to the single stored Order, and an item-insert failure rolls back the whole write. Replay works after restart even though the source Payment attempt is gone.

The former 32-Order process-local cap is removed because it bounded memory, not durable data. A persistent row-count limit would permanently block later Orders. Payment's 32-attempt cap and all other module limits are unchanged.

PostgreSQL unavailability is reported as `503 order-store-unavailable` for Order create and read requests. Startup is fail-fast. Hikari and JDBC connection, socket, login, and validation timeouts bound request failure; the exact values are recorded in configuration and validation evidence.

## Alternatives Considered

- **Persist Catalog Products first.** Rejected for this slice: it would require the wider Product store contract, media bytes, media-capacity transactions, preserved list order, and database reads on every storefront load.
- **Persist Payment attempts first.** Rejected: attempt approval uniqueness is coupled to Cart revision, and Cart is intentionally still in memory.
- **Use JPA/Hibernate.** Rejected: the model is three records and three store operations; explicit SQL is smaller and avoids entity and transaction mapping.
- **Use `schema.sql` instead of Flyway.** Rejected: schema versioning and repeatable test-database creation are current needs, and the repository already deferred migrations until persistence existed.
- **Run every Spring test against PostgreSQL.** Rejected: unrelated Catalog, Cart, and Payment API tests do not exercise persistence; a no-database test profile keeps them Docker-free while the Order tests use the production wiring.
- **Retain a per-process 32-Order admission guard.** Rejected: it would preserve a memory-specific rule without its rationale and require a second, artificial lifecycle contract.
- **Persist other aggregates or add foreign keys across modules.** Rejected: it would expand the slice and couple durable Orders to in-memory state.

## Consequences

- Orders and items survive backend restart. Products, uploaded media, Cart, and Payment attempts remain process-local and are still lost.
- Missing attempts and unapproved attempts retain their existing `404` and `409` behavior. Repeating creation for an attempt with a stored Order returns the same Order.
- Local synthetic Orders accumulate until the local database volume is explicitly reset; there is no eviction or retention policy.
- PostgreSQL becomes a local and CI prerequisite. Docker is required for backend tests that use Testcontainers and for Browser E2E.
- Order records are unauthenticated and now outlive the process. Order IDs remain UUIDs and no customer data is stored; this remains a local-only use constraint, not a hosting or access-control decision.
- The database connection is a new failure mode. Order endpoints fail with a bounded `503`; other in-memory journeys continue while the process is running. Recovery without a backend restart must be observed, not assumed.

## Validation

The implementation is validated by Testcontainers tests for round-trip, multi-item order, more than 32 Orders, concurrent duplicate creation, rollback, and post-commit retry; a two-context real-HTTP restart test; Order API and First Order journey tests against PostgreSQL; the existing no-database suites; a controlled real-PostgreSQL outage check; frontend checks; and Browser E2E. The current Agent Verification run at 2026-10-26 14:00 -03 passed 141 backend tests; eleven use the production PostgreSQL wiring, while the no-database `OrderApiUnavailableTest` separately covers the 503 mapping.

The controlled check used identifiable synthetic attempts. A two-item Order existed and a second approved attempt had no Order. With PostgreSQL stopped, both a new-create POST and a replay POST returned `503 order-store-unavailable`, health was down, and the database still held one Order and two items; the unordered attempt had no row. After PostgreSQL returned without a backend restart, the new attempt returned `201`, the existing attempt returned `200` with the same Order ID, and the database held two Orders and four items. The roughly five-second observation is the Hikari connection-acquisition bound; `socketTimeout` is ten seconds, so it is not a universal end-to-end bound. Exact observations and limits are recorded in [Issue #95 comment 6422580807](https://github.com/Samska/samska-sandbox/issues/95#issuecomment-6422580807). Human Verification of restart and outage behavior remains separate and must not be inferred from automated tests.
