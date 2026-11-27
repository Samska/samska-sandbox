# ADR 0012: Adopt a Release Plan From v0.2.0 To v1.0.0

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-068 (#132)](https://github.com/Samska/samska-sandbox/issues/132), [Roadmap](../ROADMAP.md), [ADR 0001](0001-adopt-modular-monolith.md), [ADR 0008](0008-adopt-postgresql-order-persistence.md)

## Context

The Roadmap listed directional themes per minor version (quality, caching, messaging, inventory, React Native, observability, dashboards, IaC) with v1.0 as a secured public demo, and no scope. The owner asked for concrete releases up to 1.0 so the work can proceed until 1.0 is ready for one validation. The owner-approved Bench prototype already designs account, order history, tracking, inventory states, an operations screen and a phone layout.

## Decision

Replace the themed table with six releases that each deliver a user-visible or operable capability: v0.2.0 Durable Store, v0.3.0 Accounts, v0.4.0 Order History and Tracking, v0.5.0 Inventory, v0.6.0 Operations and v1.0.0 Secured Public Demo, each with scope, exit criteria and design status. Caching, messaging, React Native, IaC and the later themes move to a "Beyond v1.0.0" candidate list. Authentication precedes everything that exposes per-person data, and no hosted use is allowed before v1.0.0's controls, consistent with the existing MVP boundary.

The modular monolith stays. Accounts, shipping and inventory become new modules with their own storage behind ports.

## Alternatives Considered

- **Keep the old themes as the path to 1.0.** Rejected: Redis, RabbitMQ and React Native have no measured trigger, and the roadmap itself forbids adopting them without evidence.
- **Build the Bench "Next" screens first and leave security to the end.** Rejected: order history and operations expose per-person and administrative data; accounts and authorization come first.
- **Publish a GitHub Release for every milestone.** Deferred: publication follows [Releasing](../RELEASING.md) and needs the owner's authorization, so milestones are delivered on `main` and only a release the owner authorizes is tagged.

## Consequences

- The Roadmap now commits to scope for six milestones, which can still change through a new ADR.
- The Bench screens become scope for the releases that name them; Admin stock and a few states are designed as small gaps in the same language.
- Several slices are stacked pull requests, merged in order.
