# SS-036: Implement Payment Simulator

- Status: Active
- Work date: 2026-09-28
- Last reviewed: 2026-09-28
- Work item: [SS-036](https://github.com/Samska/samska-sandbox/issues/61)
- Pull request: Pending
- ADRs: [ADR 0005](../adr/0005-adopt-payment-attempt-store-with-cart-revision.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

## What you should learn

- Idempotency by attempt identity: replay, conflict, and reconciliation instead of deciding twice
- Freezing state at the first irreversible decision using a revision-checked atomic snapshot
- Lock ordering between modules and why nested locks must have one direction
- Bounded in-memory state: capacity without eviction, and honest restart behavior
- Honest failure semantics: unconfirmed is not declined, approved, or failed
- Explicit local-demo controls versus passive randomness, and local-only as a deployment constraint

### Core — Know this for interviews

- Idempotent initiation and same-ID replay
- Revision-checked atomic snapshot and lock ordering
- Honest unconfirmed-outcome handling
- Bounded capacity without eviction

## Concepts explained

**Idempotency by identity.** A client-generated attempt ID makes initiation retryable: repeating the identical request returns the stored decision instead of deciding again, and reusing the ID with different input is a conflict rather than silently overwriting history. GET by the same ID reconciles a lost response, so the UI never guesses what happened.

**Revision-checked atomic capture.** A monotonically increasing Cart revision gives the Cart a comparable version. The payment decision is applied to `snapshotForRevision(expected)`, which compares and captures items, total, and revision under the Cart monitor. If a Cart edit wins the lock first, the mismatch produces `cart-changed` and no decision is made.

**Lock ordering.** Payment holds one store lock across replay checks, capture, guards, and storage. The nested order is Payment → Cart; Cart never calls Payment, so no cycle exists. The lock makes "check guard, capture, record" one linearization and keeps the failure modes explainable.

**One approval per revision.** Approval is the irreversible simulated outcome, so an unchanged revision can have at most one approved attempt. Later attempts with new IDs receive the existing attempt's identity so the UI can show the already-recorded result instead of fabricating another approval.

**Honest failure semantics.** A network loss, server error, or malformed success response is *unconfirmed*: the UI shows a reconciliation action with the same attempt ID and does not render approved, declined, or failed. Decline and simulated failure are stored, final, replayable decisions that allow a new attempt; they are not transport errors.

**Bounded state without eviction.** The store keeps at most 32 attempts and refuses new ones beyond that. Eviction or ID recycling would break the replay and lookup guarantees the store exists for, so capacity exhaustion is surfaced as guidance with an explicit local reset (restart) instead.

## How Samska uses it

`Cart` increments a revision on each successful mutation and exposes `snapshotForRevision`. `payment/` owns the attempt domain (`PaymentAttempt`, `PaymentAttemptItem`, `PaymentScenario`, `PaymentStatus`), the store contract in `payment/application`, and `InMemoryPaymentStore` in `payment/storage`, which serializes initiation under one `ReentrantLock` and calls the Cart snapshot provider while holding it — the concrete Payment → Cart ordering. `PaymentController` exposes `POST /api/payment-attempts` and `GET /api/payment-attempts/{attemptId}`, mapping conflicts to `409` codes (`cart-changed`, `already-approved`, `attempt-id-conflict`) and capacity to `503 attempt-capacity-exceeded`.

The frontend keeps payment state in `Catalog`, renders an explicit demo outcome selector and pending/disabled states in `CheckoutReview`, and shows the frozen attempt in `PaymentResult`, which states that no real payment was made and no Order was created. `paymentApi` maps every response code, and `messages.ts` centralizes the capacity and unconfirmed copy.

Evidence: backend tests cover the capture race, simultaneous approvals, identical concurrent replay, approval guard, capacity 32/33 with replay and conflict still working at capacity, and MockMvc for the full status contract; frontend tests cover the three outcomes, pending lockout, stale Cart, uncertain reconciliation including a restart `404`, capacity, and focus behavior.

## Interview perspective

Expect questions about making a retrying client safe, why the snapshot must be addressed by revision instead of read twice, how lock ordering prevents deadlock and torn decisions, why approval is cardinality-limited while declines are not, when process-local state is acceptable, and why "unconfirmed" is a distinct outcome. Strong answers tie each rule to a concrete failure: double decisions, decisions on an edited Cart, lost responses, capacity eviction, or forced restarts.

## What not to worry about yet

Order creation and First Order end-to-end automation, persistence and PostgreSQL, authentication and authorization, hosting controls and rate limiting, multiple carts and customers, currency and taxes, provider integrations, distributed idempotency, browser E2E infrastructure, and capacity/throughput tuning.

## Reference

- Issue: [SS-036](https://github.com/Samska/samska-sandbox/issues/61)
- Pull request: Pending
- Relevant source files: `backend/src/main/java/io/github/samska/sandbox/cart/Cart.java`, `backend/src/main/java/io/github/samska/sandbox/payment/storage/InMemoryPaymentStore.java`, `backend/src/main/java/io/github/samska/sandbox/payment/application/PaymentApplicationService.java`, `backend/src/main/java/io/github/samska/sandbox/payment/api/PaymentController.java`, `web/src/payment/paymentApi.ts`, `web/src/payment/PaymentResult.tsx`, `web/src/checkout/CheckoutReview.tsx`, `web/src/catalog/Catalog.tsx`
- ADRs: [ADR 0005](../adr/0005-adopt-payment-attempt-store-with-cart-revision.md); follows [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

## Why this design

Freezing belongs at the first irreversible step, and the earlier Checkout work deferred the snapshot to exactly this capability. A Payment-owned attempt keeps irreversibility out of the Cart aggregate while preserving one-way dependencies. The single store lock is deliberate: it makes guard, capture, and record appear atomic, which the tests can then attack with latch-controlled interleavings. Capacity without eviction prefers a hard, explainable refusal over silently losing results a user might still be reconciling. Deterministic scenarios were chosen over random outcomes because unreplicable results cannot support local demonstration or risk-based verification.

## Common mistakes

- Reading the Cart twice around a decision and calling the total "the same Cart"
- Treating a lost response as declined or approved instead of unconfirmed
- Deciding before knowing whether the displayed revision is still current
- Letting two different IDs both approve one unchanged revision
- Evicting old attempts to make room and silently breaking replay and duplicate detection
- Acquiring the Cart lock before the Payment lock on one path and the reverse on another
- Presenting an unauthenticated local simulation selector as a hosted control or any kind of access control

## Interview vocabulary

**Idempotency key:** A client-generated identity that lets a retried request return the original result instead of repeating the effect.

**Revision (optimistic concurrency):** A version counter compared before acting so stale state is detected instead of used.

**Linearization point:** The moment under the store lock when guard checks, capture, and recording take effect as one atomic step.

**Unconfirmed outcome:** A request result that is neither success nor failure because the response was lost or invalid; reconciliation by identity is required.
