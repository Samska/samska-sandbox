# SS-067: PostgreSQL Catalog Persistence

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-067 (#130)](https://github.com/Samska/samska-sandbox/issues/130)
- Pull request: See the Issue
- ADRs: [ADR 0011](../adr/0011-adopt-postgresql-catalog-persistence.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Local Development](../LOCAL-DEVELOPMENT.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- How to keep list order stable in SQL with an identity column instead of relying on physical row order.
- Why large binary data should not travel with every list query, and how a snapshot can carry an ID instead of bytes.
- How an advisory lock serializes a cross-row budget that no single-row constraint can enforce.
- Why snapshots in Cart, Payment and Order let Catalog be persisted last without foreign keys.

### Core — Know this for interviews

Prioritize the aggregate-budget race and its lock, the ordering guarantee, and the decision to drop foreign keys for historical snapshots.

## Concepts explained

### Ordered listing

A table has no inherent order. `position BIGINT GENERATED ALWAYS AS IDENTITY` plus `ORDER BY position` keeps the Market order the in-memory map used to provide.

### ID in the list, bytes on demand

The Market needs `uploadedMediaId` only. The list query joins the media table but selects the ID, never the JPEG; the detail read loads bytes for one Product.

### Budget under concurrency

"Total stored media at most 32 MiB" spans many rows. Two uploads can each see room and both insert. `pg_advisory_xact_lock` makes the check-and-write one critical section across all transactions until commit.

### Cascade for ownership

Media belongs to its Product, so `ON DELETE CASCADE` deletes it with the Product; Cart and Order lines are copies and have no foreign key.

## How Samska uses it

- `JdbcProductStore`, `CatalogPersistenceConfiguration`, Flyway `V4__create_catalog.sql`.
- `JdbcProductStoreTest` and `CatalogPersistenceRestartTest` provide the evidence; no-database API tests keep using the in-memory store.

## Interview perspective

Explain how you would prove the budget holds under concurrency (the barrier test), why ordering needs an explicit column, and when a database round trip per storefront read becomes a caching question.

## What not to worry about yet

- Object storage, CDN, caching, search indexes.
- Product soft delete, retention, and authorization.

## Reference

- Issue: [SS-067 (#130)](https://github.com/Samska/samska-sandbox/issues/130)
- Relevant source files: `backend/src/main/java/io/github/samska/sandbox/catalog/storage/JdbcProductStore.java`, `backend/src/main/resources/db/migration/V4__create_catalog.sql`
- ADRs: [ADR 0004](../adr/0004-adopt-product-media-upload.md), [ADR 0011](../adr/0011-adopt-postgresql-catalog-persistence.md)

## Why this design

It finishes the sequence in ADR 0008 with the largest slice last, reusing the port, profile and test patterns of the earlier slices.

## Common mistakes

- Ordering by primary key (a random UUID) instead of an insertion position.
- Selecting `BYTEA` columns in a list query.
- Checking the budget without a lock.
- Forgetting that full-application PostgreSQL tests now share Product rows.

## Deeper — Useful later

Hosted use needs authorization on Product mutation, image storage choices and caching decisions.
