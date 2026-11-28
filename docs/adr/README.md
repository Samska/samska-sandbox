# Architecture Decision Records

## Purpose

Architecture Decision Records (ADRs) preserve the context and rationale for significant, durable architectural decisions. They complement implementation and documentation; they do not replace either.

## When To Create an ADR

Create an ADR when a decision has meaningful long-term impact, constrains future options, changes system boundaries, introduces or rejects a major architectural pattern, or records a consequential tradeoff.

Examples include adopting the initial modular-monolith approach, selecting a messaging strategy after evidence supports it, or deciding to extract a service boundary.

## When Not To Create an ADR

Do not create ADRs for routine implementation details, short-lived experiments, formatting choices, isolated bug fixes, or decisions that are already fully reversible and local to one change.

## Format and Lifecycle

- Start from [000-template.md](000-template.md).
- Use zero-padded sequential identifiers: `0001`, `0002`, and so on.
- Name files as `<number>-<short-kebab-case-title>.md`.
- Use a status of Proposed, Accepted, Superseded, Deprecated, or Rejected.
- Once accepted, do not rewrite the decision's historical rationale. Record a new ADR to supersede or deprecate it when circumstances change.
- Link related ADRs, implementation, and affected documentation.

The first accepted decision is [ADR 0001: Adopt a Modular Monolith for v0.1](0001-adopt-modular-monolith.md).

[ADR 0002: Adopt Tailwind CSS v4 for Frontend Styling](0002-adopt-tailwind-css-v4-for-frontend-styling.md) records the accepted frontend styling foundation.

[ADR 0003: Adopt an Optional Product Media Reference](0003-adopt-optional-product-media-reference.md) recorded the curated Product media direction; its no-upload decision is superseded by ADR 0004.

[ADR 0004: Adopt Product Media Upload with Bounded In-Memory Storage](0004-adopt-product-media-upload.md) records the accepted upload, storage, validation, and serving direction.

[ADR 0005: Adopt a Payment-Owned In-Memory Attempt Store with Revision-Checked Cart Snapshots](0005-adopt-payment-attempt-store-with-cart-revision.md) records the accepted simulated-payment attempt ownership, atomic capture, replay, approval, and capacity direction.

[ADR 0006: Adopt an Order-Owned In-Memory Store from Approved Payment Attempts](0006-adopt-order-owned-in-memory-store.md) records Order ownership, source-attempt idempotency, capacity, lock ordering, and reconciliation.

[ADR 0007: Adopt Attempt-Addressed Browser Recovery for the First Order Journey](0007-adopt-attempt-addressed-browser-recovery.md) records the attempt-addressed URL surfaces, GET-only recovery, reference lifecycle, stale-response guards, and browser/holder security boundaries that supplement ADRs 0005 and 0006. A dated 2026-10-15 follow-up records the SS-042 reconsideration of browser automation while preserving the accepted recovery model.

[ADR 0008: Adopt PostgreSQL Persistence for Orders](0008-adopt-postgresql-order-persistence.md) records the first application persistence slice, the JDBC and Flyway stack, the Order-owned schema, transaction and idempotency model, removal of the process-local Order cap, and the bounded database-unavailability behavior. It supersedes ADR 0006's persistence deferral and its capacity and restart-loss consequences.

[ADR 0009: Adopt PostgreSQL Persistence for the Cart](0009-adopt-postgresql-cart-persistence.md) records the second persistence slice: the single current Cart and its revision, the row-locked transactional `update`, the missing Product reference, and why Payment attempts follow.

[ADR 0010: Adopt PostgreSQL Persistence for Payment Attempts](0010-adopt-postgresql-payment-attempt-persistence.md) records the third persistence slice: durable attempts and frozen snapshots, the partial unique index for one approval per Cart revision, race handling without aborted transactions, and removal of the 32-attempt cap for the database-backed store.

[ADR 0011: Adopt PostgreSQL Persistence for the Catalog](0011-adopt-postgresql-catalog-persistence.md) records the final persistence slice: Products and uploaded media in PostgreSQL, insertion-ordered listings, media IDs without bytes in lists, and the transactional aggregate media budget. It supersedes the in-memory storage consequences of ADR 0004.

[ADR 0012: Adopt a Release Plan From v0.2.0 To v1.0.0](0012-adopt-release-plan-to-v1.md) records the six releases to v1.0.0, why caching, messaging and React Native move beyond 1.0, and that accounts precede per-person data.

[ADR 0013: Adopt Server-Side Sessions And Per-Account Ownership](0013-adopt-account-sessions-and-ownership.md) records the account module, in-memory sessions, cookie-to-header CSRF, the `CurrentAccount` ownership port, role rules, and the administrator bootstrap.

[ADR 0014: Derive Simulated Shipments From The Order And The Clock](0014-derive-simulated-shipments.md) (superseded by ADR 0021) records the `shipping` module, derived rather than stored shipment state, the injected clock, and deterministic delays.

[ADR 0015: Add Inventory With Reservations In The Payment Transaction](0015-add-inventory-with-reservations.md) records the `inventory` module, reserve on approval and consume on Order, expiry, and ordered row locks.

[ADR 0016: Observe Requests With Correlation IDs And Micrometer Meters](0016-observe-requests-with-correlation-ids.md) records the request filter, in-process meters, SQL-derived business figures, and the admin-only Operations endpoint.

[ADR 0017: Harden The Public Demo In The Application And The Production Profile](0017-harden-the-public-demo.md) records the rate limiter, API headers, the `prod` profile and the startup guard.

[ADR 0018: Add Demo Mode And A Containerized Runtime](0018-add-demo-mode-and-containers.md) records demo mode, the administrator reset, the nginx web image and the hosted-demo Compose stack.

[ADR 0019: Separate The Admin Area And Terminate TLS With Caddy](0019-separate-admin-area-and-terminate-tls-with-caddy.md) records the Admin shell, role-based sign-in destination, and the Caddy-fronted VPS stack.

[ADR 0020: Run On Railway With An Environment-Driven Web Image](0020-run-on-railway-with-environment-driven-web-image.md) records the Railway service layout, the start-up rendered nginx configuration and the private mode moved into the web image.

[ADR 0021: The Administrator Sets Order Status And It Is Stored As Events](0021-administrator-sets-order-status.md) records the stored status events, the administrator endpoints, corrections allowed and cancelling as final with stock returned, and the removal of the simulated courier.
