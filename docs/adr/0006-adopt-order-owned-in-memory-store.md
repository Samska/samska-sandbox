# ADR 0006: Adopt an Order-Owned In-Memory Store from Approved Payment Attempts

- Status: Accepted
- Date: 2026-09-28
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-037](https://github.com/Samska/samska-sandbox/issues/63), [ADR 0005](0005-adopt-payment-attempt-store-with-cart-revision.md), [Architecture](../ARCHITECTURE.md)

## Context

Payment owns immutable, identified decisions over revision-checked Cart snapshots (ADR 0005). Approval alone does not create an Order. Order creation must remain explicit and must not depend on the mutable live Cart. Lost HTTP responses and concurrent requests may otherwise create two Orders for one approved attempt.

## Decision

Order owns an immutable record (new Order ID, source payment attempt ID and Cart revision, copied Product IDs, names, unit prices, quantities, subtotals, and total) in a bounded process-local store. Order reads a Payment attempt through a narrow Payment-owned read contract, never Payment storage or Cart storage. Only an approved attempt is eligible. Under one Order-store lock, check existing Order replay first, then look up Payment, check approval and capacity, and publish both ID and source-attempt indexes together. The dependency and nested lock order are **Order → Payment → Cart** (Order creation uses Order → Payment; Payment initiation uses Payment → Cart). Neither Payment nor Cart calls Order. No I/O occurs under these locks.

One attempt creates at most one Order per process: first POST returns `201`, repeats return `200` with the same Order, and GET by Order or attempt ID retrieves it. The Order store retains at most 32 entries without eviction, matching the Payment store's 32-attempt ceiling. Since 32 Orders require 32 distinct retained attempts, capacity refusal for an approved un-ordered attempt cannot normally occur with current caps; keep a defensive `503` guard without weakening lookup or replay. Restart loses Orders and source attempts and their duplicate protection. The UI retains the source attempt identity only while mounted; a full-page reload cannot rediscover it through the UI.

An uncertain POST is reconciled by GET Order by attempt ID. After Order `404`, GET Payment by the same ID: only a valid, matching approved result permits a **new explicit** same-ID POST. Other lookup failures remain unconfirmed or ineligible; two `404`s do not prove restart. No automatic POST follows reconciliation. Creating an Order does not clear or lock Cart and never moves real money.

## Alternatives Considered

- Derive Orders from the current Cart on demand: rejected because a later edit would alter the purchased snapshot.
- Create an Order automatically on approval: rejected because the accepted capability requires a separate explicit action.
- Store Orders inside Payment or Cart: rejected because Order has its own identity, lifecycle, and owner.
- Persist Orders or use a distributed idempotency system: deferred for the process-local MVP; it would change operational and security scope without present need.
- Evict old Orders at capacity: rejected because it breaks lookup and duplicate protection.

## Consequences

- Single-process, non-durable semantics: a backend restart clears Products, Cart, Payment attempts, and Orders. A full-page reload loses the UI's recovery handle even if backend records remain.
- One Order lock serializes creations; narrow Payment reads under that lock preserve a reviewable ordering without reverse dependencies.
- Both Order creation and lookup are unauthenticated, local-only capabilities; local-only is a deployment/use constraint, not access control. No customer/card data or provider integration is introduced.
- Domain/store tests must cover immutable copies, simultaneous creation, refusal and replay at constrained capacity. MockMvc and frontend tests cover eligibility, status codes, uncertainty, and navigation; real-browser focus and layout require Human Verification.

## Validation

Record exact Agent, Human, and CI evidence in the Issue and later pull request. Revisit this decision if persistence, hosting, multiple carts, or durable customer Orders become requirements; do not silently expand this guarantee.
