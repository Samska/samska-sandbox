# ADR 0015: Add Inventory With Reservations In The Payment Transaction

- Status: Accepted; the reservation taken on payment approval is superseded by [ADR 0021](0021-remove-the-simulated-payment.md) (SS-099): stock is now consumed when the Order is placed
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-071 (#138)](https://github.com/Samska/samska-sandbox/issues/138), [ADR 0012](0012-adopt-release-plan-to-v1.md)

## Context

v0.5.0 needs stock so two shoppers cannot buy the last unit and a Product can be sold out. Catalog, Cart, Payment and Order each own their data, so stock needs a clear owner and a rule for when units are held.

## Decision

A new `inventory` module owns `stock_levels` and `stock_reservations`. The Product API exposes `stock`; an administrator sets it on create and edit (default 25, maximum 100000). The Cart refuses a quantity above stock. An APPROVED Payment attempt reserves its lines in the same transaction that records the attempt, and Order creation consumes that reservation in the same transaction that writes the Order. A reservation expires after `samska.inventory.reservation-ttl` (default 15 minutes), and expired reservations stop counting as held. Stock rows are locked with `FOR UPDATE` in product-id order, so concurrent buyers serialize and cannot deadlock. A shortage answers `409` with code `out-of-stock` from the Cart, Payment and Order endpoints.

## Alternatives Considered

- **Decrement at Cart time.** Rejected: abandoned Carts would hold stock forever.
- **Decrement only when the Order is created.** Rejected: a shopper could pay for something that then cannot be fulfilled.
- **A stock column on `products`.** Rejected: it couples Catalog to Payment and Order transactions.

## Consequences

- Payment and Order stores depend on the `Inventory` port; in-memory test doubles implement it too.
- Available stock is `on_hand` minus unexpired reservations, so it can recover without a job.
- A declined or failed attempt reserves nothing.

## Validation

`JdbcInventoryTest` covers reserve, consume, expiry, rollback and concurrent buyers. `InventoryApiTest` covers the API surface and `409` responses. Web tests cover the badge, disabled Add and messages; a Playwright test covers sold-out and low-stock display.
