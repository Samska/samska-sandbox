# SS-066: PostgreSQL Payment Attempt Persistence

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-066 (#127)](https://github.com/Samska/samska-sandbox/issues/127)
- Pull request: See the Issue
- ADRs: [ADR 0010](../adr/0010-adopt-postgresql-payment-attempt-persistence.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- How a partial unique index encodes "at most one approved attempt per revision" more reliably than a lock.
- Why `ON CONFLICT DO NOTHING` without a target lets a transaction read the winner afterwards, while catching a unique violation does not in PostgreSQL.
- Why persistence has to follow dependencies: the approval rule needed a durable, monotonic Cart revision.
- What changes when an in-memory limit disappears with durability.

### Core — Know this for interviews

Prioritize the constraint-as-invariant idea, the aborted-transaction behavior after a violation, and the replay-versus-conflict distinction for idempotent requests.

## Concepts explained

### Invariant in the schema

A unique index `ON payment_attempts (cart_revision) WHERE status = 'APPROVED'` allows many declined or failed attempts for a revision but only one approval, regardless of how many application processes run.

### Reading the winner

Two requests race. Both pass the pre-checks, one inserts, the other blocks on the index, then sees "0 rows inserted". It reads the row: same attempt ID means a replay of an identical request, otherwise another attempt won and the answer is `already-approved` with that ID.

### Frozen snapshot, no foreign keys

Items copy name, price and quantity from the Cart at capture time, so a decision stays explainable even if the Cart or Product later changes or disappears.

### Removing a memory guard

The 32-attempt cap protected memory. In a database it would only block future work, so it is dropped for the real store and kept only in the test double.

## How Samska uses it

- `JdbcPaymentStore`, `PaymentPersistenceConfiguration`, Flyway `V3__create_payment_attempts.sql`.
- Tests: `JdbcPaymentStoreTest`, `PaymentPersistenceRestartTest`, the updated Order restart test.

## Interview perspective

Explain why the loser of a race must read rather than retry blindly, why an index beats a Java lock across processes, and what the restart test proves that a store test cannot.

## What not to worry about yet

- Retention, expiry, or a real payment provider.
- Persisting Catalog and media.

## Reference

- Issue: [SS-066 (#127)](https://github.com/Samska/samska-sandbox/issues/127)
- Relevant source files: `backend/src/main/java/io/github/samska/sandbox/payment/storage/JdbcPaymentStore.java`, `backend/src/main/resources/db/migration/V3__create_payment_attempts.sql`
- ADRs: [ADR 0005](../adr/0005-adopt-payment-attempt-store-with-cart-revision.md), [ADR 0010](../adr/0010-adopt-postgresql-payment-attempt-persistence.md)

## Why this design

It reuses the Order and Cart persistence pattern and lets the database enforce the two uniqueness rules. Alternatives are in ADR 0010.

## Common mistakes

- Catching the unique violation inside the same transaction and then querying.
- Forgetting that after an approval every further attempt for that revision is rejected, even a decline.
- Leaving test tables uncleared so earlier attempts block later approvals.

## Deeper — Useful later

Hosted use needs retention, ownership and authorization of attempts; these are separate decisions.
