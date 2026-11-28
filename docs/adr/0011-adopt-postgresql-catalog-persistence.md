# ADR 0011: Adopt PostgreSQL Persistence for the Catalog

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-067 (#130)](https://github.com/Samska/samska-sandbox/issues/130), [ADR 0003](0003-adopt-optional-product-media-reference.md), [ADR 0004](0004-adopt-product-media-upload.md), [ADR 0008](0008-adopt-postgresql-order-persistence.md), [ADR 0009](0009-adopt-postgresql-cart-persistence.md), [ADR 0010](0010-adopt-postgresql-payment-attempt-persistence.md)

## Context

After ADRs 0008 to 0010, Orders, the Cart and Payment attempts are durable, but Products and uploaded media remain in `InMemoryProductStore`. A restart empties the Market while the Cart, attempts and Orders still reference Products. ADR 0008 deferred this slice because it needs media bytes, capacity transactions, preserved list order and database reads on every storefront load.

## Decision

Products are persisted by `JdbcProductStore` behind the Catalog-owned `ProductStore` port, wired by `CatalogPersistenceConfiguration` unless the `no-database` profile is active. Flyway `V4` creates `products` (ID, name, description, price, optional curated media key, and an identity `position` column that preserves insertion order for listings) and `product_media` (one row per Product, `ON DELETE CASCADE`, media ID, JPEG `BYTEA`, byte length). There are no foreign keys from Cart, Payment or Order to Products.

The port is unchanged. `ProductSnapshot` gains the media ID as a separate component so `findAll` returns IDs without loading image bytes; `findById` loads the bytes for the single Product that serves them. Replacing a Product keeps its uploaded media. Deleting a Product deletes its media in the same statement chain.

The aggregate media budget (`catalog.media.max-total-bytes`, default 32 MiB) is checked inside the replacement transaction under `pg_advisory_xact_lock`, summing the other Products' stored sizes, so concurrent uploads cannot exceed it, and replacing a Product's own image reuses its share. Validation, normalization and the per-image limits remain in the application layer, unchanged.

The in-process `CatalogCartCoordinator` lock, which orders add-to-Cart against Product deletion, is unchanged and still a single-process guarantee. `InMemoryProductStore` remains for the `no-database` profile and pure unit tests. Database outages on Product endpoints return `503 catalog-store-unavailable`.

## Alternatives Considered

- **Store images on disk or in object storage.** Rejected: it adds a second durable system and consistency problem for at most 32 MiB of bounded, re-encoded images.
- **Keep media in memory and persist only Products.** Rejected: uploaded images would vanish while Products remain, an inconsistent state that is harder to explain than either extreme.
- **Load image bytes in every listing.** Rejected: the Market list only needs media IDs.
- **Optimistic budget check without a lock.** Rejected: two concurrent uploads could both pass the check and jointly exceed the budget.
- **Foreign keys from Cart items or Order items to Products.** Rejected: Cart and Order lines are historical snapshots that must outlive deletion.

## Consequences

- All application state now survives a backend restart; nothing is process-local except the coordination lock and test doubles. The documented MVP boundaries about volatile state no longer apply.
- Product data accumulates in the local database until the volume is reset; there is no retention policy.
- Storefront reads now hit the database; a measured need for caching is a later, separate decision (Roadmap v0.3).
- Product and media endpoints are still unauthenticated; persistence makes that exposure longer-lived, so it remains a local-only constraint and a prerequisite for any hosted use.
- Full-application PostgreSQL tests must clear Product tables between tests.

## Validation

`JdbcProductStoreTest` covers exact round trip and duplicate rejection, list order after replace, replace keeping media, one image per Product with replacement and on-demand bytes, removal outcomes, delete cascade, the aggregate budget, and concurrent uploads staying within it. `CatalogPersistenceRestartTest` runs three real-HTTP contexts proving Products, edits, curated media keys, list order and served image bytes survive, and that media removal and deletion persist. The Cart, Payment and Order restart tests now also rely on durable Products. The existing no-database Catalog API, media and capacity suites pass unchanged.
