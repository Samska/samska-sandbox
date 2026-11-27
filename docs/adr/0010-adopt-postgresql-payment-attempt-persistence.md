# ADR 0010: Adopt PostgreSQL Persistence for Payment Attempts

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-066 (#127)](https://github.com/Samska/samska-sandbox/issues/127), [ADR 0005](0005-adopt-payment-attempt-store-with-cart-revision.md), [ADR 0008](0008-adopt-postgresql-order-persistence.md), [ADR 0009](0009-adopt-postgresql-cart-persistence.md)

## Context

ADR 0005 made simulated Payment attempts a process-local store that owns an immutable Cart snapshot, replays identical requests by attempt ID and allows one approved attempt per Cart revision, capped at 32 attempts. ADR 0008 deferred persisting them because the approval rule is keyed by Cart revision and the Cart restarted at revision zero. ADR 0009 made the Cart and its revision durable and monotonic, removing that blocker.

## Decision

Payment attempts are persisted by `JdbcPaymentStore` behind the Payment-owned `PaymentStore` port, wired by `PaymentPersistenceConfiguration` unless the `no-database` test profile is active. Flyway `V3` creates `payment_attempts` (attempt ID, Cart revision, scenario, status, total) and `payment_attempt_items` (the frozen snapshot lines, no foreign keys to Cart or Product). A partial unique index on `cart_revision WHERE status = 'APPROVED'` enforces one approval per Cart revision in the database.

`createAttempt` runs in one transaction and keeps the ADR 0005 order of checks: replay by attempt ID (a different scenario or revision is a conflict), revision-checked Cart capture, empty Cart, existing approval for the revision, then insert. The insert uses `ON CONFLICT DO NOTHING` without a target, so both a concurrent identical request (primary key) and a concurrent approval for the same revision (partial index) produce "no row" rather than an aborted transaction. The loser then reads the winner: the same attempt is a replay, otherwise it is `already-approved` with the winner's ID. Attempt and items are written together and roll back together.

The 32-attempt cap is removed for the database-backed store, for the reason ADR 0008 gave for Orders: it bounded memory, and a durable row-count limit would permanently block later attempts. `InMemoryPaymentStore`, with its cap and lock, remains only for the `no-database` profile and pure unit tests; the `attempt-capacity-exceeded` response is therefore unreachable in production wiring.

Database unavailability is reported as `503 payment-store-unavailable` on Payment endpoints (including the Cart read inside initiation). Order creation after a restart now finds the stored attempt, so an approved attempt can still be ordered.

## Alternatives Considered

- **Keep the cap in the database store.** Rejected: it would need a global count under concurrency and would block forever once reached.
- **Application-level lock instead of unique indexes.** Rejected: it protects one process and duplicates what a partial unique index states exactly.
- **Catching a unique-violation exception.** Rejected: the transaction is aborted in PostgreSQL after the violation, so the winner could not be read in the same transaction.
- **Persist Catalog next and Payment later.** Rejected: Payment was blocked only by the Cart revision, which is now solved.
- **Delete `InMemoryPaymentStore`.** Rejected for this slice: many fast Docker-free API tests rely on it, and its lock-interleaving tests document the original design.

## Consequences

- Payment attempts, their frozen snapshots and the approval rule survive a backend restart. Only Products and uploaded media remain process-local.
- Attempts accumulate in the local database until the volume is reset; there is no eviction or retention policy.
- Behavior differs between profiles only in the cap; production wiring has none.
- Unauthenticated simulated payments now persist; data is synthetic and no card data exists. This remains a local-only constraint.
- The frontend capacity guidance for `attempt-capacity-exceeded` can no longer trigger against the real backend; the `503 payment-store-unavailable` body is handled as a generic Payment error by the existing UI. A visible message for it needs a separate design-approved UI change.
- Full-application PostgreSQL tests must clear Payment tables between tests.

## Validation

`JdbcPaymentStoreTest` covers the frozen round trip and line order, replay without reading the Cart, conflicts, one approval per revision, empty and stale-revision rejection, more than 32 attempts, rollback on an item failure, simultaneous approvals with different IDs, and simultaneous identical requests. `PaymentPersistenceRestartTest` runs two real-HTTP contexts proving reload, replay, conflict, the already-approved rule, a new approval on a new revision and Order creation after restart. `CartApiUnavailableTest` covers the 503 mapping. The Order restart test now proves a pre-restart approved attempt can be ordered afterwards. Human Verification remains separate.
