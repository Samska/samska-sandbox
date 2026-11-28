# ADR 0014: Derive Simulated Shipments From The Order And The Clock

- Status: Superseded by [ADR 0022](0022-administrator-sets-order-status.md)
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-070 (#135)](https://github.com/Samska/samska-sandbox/issues/135), [ADR 0012](0012-adopt-release-plan-to-v1.md), [ADR 0013](0013-adopt-account-sessions-and-ownership.md)

## Context

v0.4.0 needs Order history and delivery tracking, but no courier, warehouse or notification system exists, and none is wanted: data and payments are synthetic.

## Decision

A new `shipping` module computes a `Shipment` on every request from the Order's creation time (new `orders.created_at`), an injected `Clock` and a `ShippingPolicy` of configurable step durations (`samska.shipping.*`, defaults of minutes so a demo shows progress). Nothing is stored. About one Order in five is delayed, chosen from the least-significant bits of the Order ID, so the outcome is stable across requests and restarts; a delay moves out-for-delivery and delivery by a configurable day. The module reads Orders only through `OrderApplicationService`, which scopes every read to the signed-in account.

## Alternatives Considered

- **A shipments table advanced by a scheduler.** Rejected: it adds a scheduler, a state machine and clock-dependent flakiness for no behavior a derived value lacks.
- **Random delays.** Rejected: results would change between reloads and tests could not assert them.
- **Administrator controls to advance shipments.** Deferred: not in the approved design.

## Consequences

- Tests set time with a fixed `Clock` or with policy durations of zero; there is nothing to clean up.
- The history endpoint computes status for every listed Order; cost grows with the number of Orders, which is bounded in a demo.
- Changing the policy changes the apparent state of existing Orders, which is acceptable for a simulation.

## Validation

`ShipmentTest` covers every status, delay shifting, step order and codes. `OrderTrackingApiTest` covers history order and counts, an on-time and a delivered shipment, isolation between accounts and visitors, and malformed IDs.
