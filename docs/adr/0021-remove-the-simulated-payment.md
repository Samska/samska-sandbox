# ADR 0021: Remove The Simulated Payment And Place The Order Directly

- Status: Accepted; supersedes [ADR 0005](0005-adopt-payment-attempt-store-with-cart-revision.md), [ADR 0010](0010-adopt-postgresql-payment-attempt-persistence.md) and the reservation rule of [ADR 0015](0015-add-inventory-with-reservations.md), and supersedes in part [ADR 0006](0006-adopt-order-owned-in-memory-store.md) and [ADR 0007](0007-adopt-attempt-addressed-browser-recovery.md)
- Date: 2026-11-28
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-099 (#189)](https://github.com/Samska/samska-sandbox/issues/189), [ADR 0008](0008-adopt-postgresql-order-persistence.md), [Architecture](../ARCHITECTURE.md), [Security](../SECURITY.md)

## Context

SS-036 added a simulated payment with three demo outcomes (approve, decline, temporary failure) so the First Order journey could exercise a decision before an Order. It cost two steps for the customer (simulate, then create the Order), a Payment module with its own tables, replay and approval rules, a stock reservation taken on approval, and a set of browser recovery surfaces (attempt URLs, a "Payment not finished / Resume payment" notice, reference abandonment) that existed only because a payment could end in an unknown state. On the public demo the owner judged the simulation no longer made sense: every Order should simply be approved.

## Decision

- Checkout has one step, **Place order**. `POST /api/orders` takes a client-generated `requestId` and the Cart `cartRevision` the customer reviewed. The Order store asks Cart for a revision-checked snapshot, stores the Order and its items and takes the stock in one transaction.
- The `requestId` replaces the Payment attempt ID as the idempotency key (`orders.payment_attempt_id` becomes `orders.request_id`, migration `V11`). The same request ID returns the stored Order with `200`; a Cart that changed answers `409 cart-changed`; stock that is gone answers `409 out-of-stock`; an empty Cart or a request ID that belongs to another account answers `400`.
- The Payment module, its endpoints, `payment_attempts`, `payment_attempt_items` and `stock_reservations` are removed. Inventory no longer reserves: available stock is the units on hand, and the Order consumes them under the same row locks.
- The browser keeps the request ID while a result is unconfirmed, so pressing Place order again cannot place a second Order, and starts a new one after a definite refusal. The attempt URLs, the Resume payment notice, the abandon flow and the `sessionStorage` reference are removed; the confirmation is shown in `/checkout` and the Order stays reachable from the history.
- The Operations screen drops the approval-rate figure; checkout latency is measured on `POST /api/orders`.

## Alternatives Considered

- Keep the payment code but hide the selector and always approve: rejected because it keeps the Payment tables, the reservation expiry and the recovery surfaces with no behaviour to justify them.
- Create the Order from the Cart with no idempotency key: rejected because an unconfirmed response would then risk a duplicate Order.
- Keep reservations for a future payment: rejected as speculative; a payment step can bring them back when it exists.

## Consequences

- One step and less code: the Payment module, three tables, the reservation expiry and most of the journey state in `Catalog.tsx` are gone.
- The migration drops the Payment data and reservations; Orders keep their rows and idempotency keys.
- Historical records (ADRs 0005, 0006, 0007, 0010, 0015, learning notes, release notes of v0.1.0) describe the earlier design and stay as dated evidence.
- A real payment, if ever wanted, would be a new decision with its own ADR.

## Validation

Backend tests cover placement, replay, a changed or empty Cart, stock exhaustion and rollback, concurrent duplicates and restart; web tests cover the single step, retry with the same request ID and the refusal messages; the Playwright journey places an Order in one Checkout step.
