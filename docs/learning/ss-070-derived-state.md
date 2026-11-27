# SS-070: Derived State For Order Tracking

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-070 (#135)](https://github.com/Samska/samska-sandbox/issues/135)
- Pull request: See the Issue
- ADRs: [ADR 0014](../adr/0014-derive-simulated-shipments.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- When to compute a value from inputs instead of storing and updating it.
- How an injected `Clock` turns time-dependent behavior into a plain unit test.
- How to make "random" behavior stable by deriving it from an identifier.

### Core — Know this for interviews

Derived versus stored state, determinism in tests, and why a reader endpoint must still enforce ownership.

## Concepts explained

### Derived shipment

The Order has a creation time. The shipment is a pure function of that time, the current instant and a policy, so there is no job to run, no row to update and no state to drift.

### Stable pseudo-randomness

A delay for about one Order in five comes from the Order ID's bits, so reloading never flips the outcome, and a test can build an ID that is on time and another that is late.

### Ownership still applies

Tracking reads the creation time through a store method scoped to the signed-in account, so another account's Order is simply "not found".
