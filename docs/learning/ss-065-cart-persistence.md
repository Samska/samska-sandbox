# SS-065: PostgreSQL Cart Persistence

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-065 (#125)](https://github.com/Samska/samska-sandbox/issues/125)
- Pull request: See the Issue
- ADRs: [ADR 0009](../adr/0009-adopt-postgresql-cart-persistence.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Local Development](../LOCAL-DEVELOPMENT.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a mutable in-memory object cannot simply be "saved afterwards", and how a read-modify-write inside one locked transaction replaces it.
- How `SELECT ... FOR UPDATE` serializes writers and keeps a business counter (the Cart revision) strictly increasing.
- Why persistence order follows dependencies: Payment needs a durable Cart revision first.
- How a snapshot copied into a row lets a durable record outlive volatile data.

### Core — Know this for interviews

Prioritize the row-lock transaction and lost-update reasoning, the difference between a lock inside one process and a lock in the database, and why the revision is not used as an optimistic concurrency token.

## Concepts explained

### Changing a port when the old one cannot be durable

`CartStore.current()` handed out one live `Cart` that callers mutated. That works in memory and cannot work with a database: nothing says when to save, and two requests would each mutate their own copy. The new `update(Consumer<Cart>)` makes the unit of change explicit: load, apply the domain method, save, commit.

### Row lock instead of Java lock

A `synchronized` method protects one JVM. `SELECT revision FROM cart WHERE cart_id = 1 FOR UPDATE` makes every writer queue on the database row, so eight threads adding the same Product produce quantity 40 and revisions 1 to 40 with no gaps or repeats. The concurrency test proves exactly that.

### Domain stays in the domain

The store does not know how to merge a repeated addition or when the revision increments. It loads a `Cart` with `Cart.restore`, lets the domain method run, and writes the result only if the revision changed. A rejected change throws before any write, so nothing is stored.

### Snapshot rows and a missing foreign key

Each line stores the Product ID, name and price at the time it was added. Products are still in memory, so after a restart a line can point to a Product that is gone; the line remains valid because it carries its own data, exactly like Order items.

## How Samska uses it

- `JdbcCartStore` and `CartPersistenceConfiguration` implement the Cart-owned port; Flyway `V2__create_cart.sql` owns the schema.
- `InMemoryCartStore` is active only in the `no-database` profile.
- `JdbcCartStoreTest`, `CartPersistenceRestartTest` (three contexts, real HTTP) and `CartApiUnavailableTest` provide the evidence.

## Interview perspective

A strong answer explains the lost-update scenario without the row lock, why the lock must be taken before reading, why the unchanged-revision case writes nothing, and why Payment persistence had to wait for this slice.

## What not to worry about yet

- Per-user carts, Cart expiry, and retention.
- Persisting Catalog or Payment attempts (Payment is the next slice).
- Optimistic locking, JPA, or a generic repository.

## Reference

- Issue: [SS-065 (#125)](https://github.com/Samska/samska-sandbox/issues/125)
- Relevant source files: `backend/src/main/java/io/github/samska/sandbox/cart/storage/JdbcCartStore.java`, `CartPersistenceConfiguration.java`, `backend/src/main/resources/db/migration/V2__create_cart.sql`
- ADRs: [ADR 0008](../adr/0008-adopt-postgresql-order-persistence.md), [ADR 0009](../adr/0009-adopt-postgresql-cart-persistence.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

## Why this design

It reuses the proven Order pattern (port, JDBC, Flyway, no-database profile, Testcontainers, restart test) and adds only what the Cart needs: a transactional update contract. Alternatives and rejections are in ADR 0009.

## Common mistakes

- Reading the Cart before taking the row lock, which reintroduces the lost update.
- Saving the revision from a stale copy after a failed change.
- Adding a foreign key to Product while Products are volatile.
- Forgetting that full-application PostgreSQL tests now share Cart rows and must clear them.

## Deeper — Useful later

A hosted environment needs Cart ownership (per user or session), expiry, and an authorization boundary. Those are separate decisions.
