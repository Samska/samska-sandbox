# SS-071: Inventory And Reservations

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-071 (#138)](https://github.com/Samska/samska-sandbox/issues/138)
- Pull request: See the Issue
- ADRs: [ADR 0015](../adr/0015-add-inventory-with-reservations.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why stock is held at payment approval and not at Cart time.
- How row locks in a fixed order prevent both overselling and deadlocks.
- How a reservation with an expiry heals without a background job.

### Core — Know this for interviews

Reserve then consume, atomicity inside one database transaction, and testing concurrency with real threads against a real database.

## Concepts explained

### Reservation

An approved payment holds the units for a short time. The Order then consumes the hold, and an unused hold expires, so abandoned purchases return stock by themselves.

### Lock ordering

Every transaction locks the stock rows of its lines sorted by product ID, so two buyers with overlapping Carts wait on each other and never deadlock.

### Available is derived

Available stock is on-hand minus unexpired holds, computed when read, so expiry needs no scheduler.
