# SS-037: Order Creation from an Approved Simulated Payment

- Status: Completed
- Work date: 2026-09-28
- Last reviewed: 2026-09-28
- Work item: [SS-037](https://github.com/Samska/samska-sandbox/issues/63)
- Pull request: [#67](https://github.com/Samska/samska-sandbox/pull/67)
- ADRs: [ADR 0006](../adr/0006-adopt-order-owned-in-memory-store.md), [ADR 0005](../adr/0005-adopt-payment-attempt-store-with-cart-revision.md)

## What you should learn

- Identity-based idempotency across two business boundaries
- Frozen value copies instead of a mutable Cart reference
- Directional lock ordering and the limit of process-local guarantees
- Honest reconciliation of lost HTTP responses

### Core — Know this for interviews

- One Order per approved attempt; replay before capacity checks
- Order → Payment dependency and lock ordering
- Unconfirmed is not failure; two `404` lookups do not prove restart

## Concepts explained

**Idempotency by source identity.** Order indexes its records by both new Order ID and approved Payment attempt ID. A repeated creation request returns the same Order, even if the Cart has changed or the Order store is full. An explicit same-ID retry after two successful reconciliation lookups is safe even if an earlier POST finishes late.

**Value copy.** The approved attempt already owns a Cart-captured snapshot. Order copies its frozen lines and total into its own immutable model; future Cart or Product mutations cannot rewrite that record.

**Bounded atomic store.** The Order lock covers lookup, eligibility, capacity, and publication of both indexes. Its Payment read is nested in the Order → Payment direction. The 32-Order limit is defensive under the current 32-attempt Payment cap and never evicts older Orders.

**Uncertainty versus absence.** A lost POST response is unconfirmed. Order GET `404` requires a Payment GET before offering another explicit POST. Payment `404` means the approved attempt cannot be confirmed, not that a restart is proven. Failed lookups retain uncertainty. The UI remembers the identity only during in-app navigation in the mounted session.

## How Samska uses it

The `order/` backend boundary reads attempts through `payment/application/PaymentAttempts` and owns `InMemoryOrderStore`. `POST /api/orders`, `GET /api/orders/{orderId}`, and `GET /api/orders/payment-attempts/{paymentAttemptId}` expose creation, replay, and lookup. `web/src/order/` validates the response and presents the Order result; the Market container keeps the approved attempt and uncertain Order identity while mounted.

## Interview perspective

Explain why both an Order ID and a stable source ID exist, why a replay must be checked before capacity, which data is copied from Payment rather than the Cart, and what a 404 can and cannot establish in a process-local system.

## What not to worry about yet

Persistence, hosted access controls, customers, inventory, tax, delivery, multiple carts, post-reload Order rediscovery, and the complete First Order end-to-end journey.

## Reference

- Issue: [SS-037](https://github.com/Samska/samska-sandbox/issues/63)
- Pull request: [#67](https://github.com/Samska/samska-sandbox/pull/67)
- ADR: [ADR 0006](../adr/0006-adopt-order-owned-in-memory-store.md)
- Prior boundary: [ADR 0005](../adr/0005-adopt-payment-attempt-store-with-cart-revision.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Product](../PRODUCT.md), [Testing](../TESTING.md), [Security](../SECURITY.md)
