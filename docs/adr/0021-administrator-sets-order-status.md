# ADR 0021: The Administrator Sets Order Status And It Is Stored As Events

- Status: Accepted
- Date: 2026-11-28
- Decision makers: Samska (human owner) with AI implementation support
- Supersedes: [ADR 0014](0014-derive-simulated-shipments.md)
- Related: [SS-097 (#196)](https://github.com/Samska/samska-sandbox/issues/196), [ADR 0013](0013-adopt-account-sessions-and-ownership.md)

## Context

[ADR 0014](0014-derive-simulated-shipments.md) derived a simulated shipment from the Order time and the clock. The store now has one real user, the owner, who wants to control an Order's status and wants customers to see the true status. A status computed from the clock cannot be controlled and shows a courier that does not exist.

## Decision

The administrator sets each Order's status: `PLACED`, `PACKED`, `SHIPPED`, `DELIVERED` or `CANCELLED`.

- Each change is stored as a row in `order_status_events` (migration `V12`). An Order with no event is `PLACED`; its status is its latest event, and its timeline is the placement time followed by the events, so the customer sees when each step really happened.
- A status can go forward or be corrected, but not repeated. `CANCELLED` is final and returns the Order's units to stock in the same transaction (`Inventory.restock`).
- `GET /api/admin/orders` (optional `status` filter) and `PUT /api/admin/orders/{id}/status` are administrator only, through the existing `/api/admin/**` rule. The customer endpoints keep their paths and now read the stored status.
- The simulated courier, tracking code, delay and estimate, `ShippingPolicy` and the `samska.shipping.*` properties are removed.
- The `shipping` store reads the Order tables for the administrator list and the tracking view; the Order module still owns writing them.

## Alternatives Considered

- **One mutable `status` column on `orders`.** Rejected: it loses the time of each step, which the timeline needs, and touches the Order insert that other work is changing.
- **A strict state machine.** Rejected: the owner corrects mistakes by hand, and only cancelling needs a guard.
- **Reopening a cancelled Order.** Rejected: it would have to take the units out of stock again and could fail on stock.

## Consequences

- Orders do not advance by themselves; the owner moves them.
- Existing Orders keep working: with no events they show as Placed.
- The administrator screen lists every Order with one query per page of Orders plus one per row for its lines, which is acceptable for one store.

## Validation

`ShipmentTest` covers the timeline, corrections and cancellation. `OrderTrackingApiTest` covers moving an Order, rejecting a repeat or a change after cancelling, stock returned once, listing and filtering, and access for customers and visitors. Web tests and a Playwright test cover the administrator screen and the customer's view.
