# SS-002: Architecture Principles and the Modular Monolith

- Status: Historical
- Work date: 2026-08-30
- Work item: [SS-002, Issue #3](https://github.com/Samska/samska-sandbox/issues/3)
- Pull request: [PR #1](https://github.com/Samska/samska-sandbox/pull/1)
- ADRs: [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Architecture Principles](../architecture/principles.md), and [ADR guide](../adr/README.md)

## Study Surface

Explicit internal boundaries let one deployable backend remain simple without becoming an unstructured monolith.

### Must Remember

- One deployable application can still have explicit business-module boundaries.
- A business capability owns its rules and durable concepts; other modules use explicit behavior rather than internals.
- Directional, acyclic dependencies and persistence ownership prevent hidden cross-module contracts.
- Architecture changes when evidence changes its trade-off; an ADR preserves a consequential durable decision while principles guide repeated choices.

### Mental Model

```text
One deployable backend
  -> explicit in-process business boundaries
  -> owned rules and persisted concepts
  -> directional dependencies
  -> evidence can justify later extraction
```

### Active Recall

#### Why was a modular monolith appropriate before product behavior existed?

<details>
<summary>Answer guide</summary>

- It establishes ownership and boundaries without distributed operational cost.
- Independent deployment, scaling, coordination, and ownership needs had no supporting evidence.
- It is a starting point, not an anti-microservices rule.

</details>

#### What fails when Orders directly mutates Inventory persistence?

<details>
<summary>Answer guide</summary>

- Inventory loses ownership of its durable concept.
- Storage becomes a hidden cross-module contract.
- Explicit behavior and reviewable orchestration are bypassed.

</details>

#### What would justify reconsidering ADR 0001?

<details>
<summary>Answer guide</summary>

- Observed coupling, deployment, scaling, reliability, or ownership needs must outweigh distributed-system cost.
- A significant durable change requires a new ADR.

</details>

### Decision Drills

#### Decision Drill: Modular monolith baseline

**Problem:** Establish future business boundaries without premature distributed infrastructure.

**Options:** Microservices, an unstructured monolith, preemptive event-driven infrastructure, or an explicit modular monolith.

**Decision:** One deployable modular monolith with explicit in-process boundaries.

**Why:** Boundaries and ownership matter now; independent services do not yet have evidence-based value.

**Trade-off:** Modules cannot deploy or scale independently and require design discipline.

**Reconsider When:** Observed coupling, deployment, scaling, reliability, or ownership needs justify a different cost profile. See [ADR 0001](../adr/0001-adopt-modular-monolith.md).

### Concept Cards

#### Module ownership

- **Meaning:** One capability owns its rules and durable concepts; other modules use its explicit behavior.
- **Samska application:** Candidate catalog, cart, orders, payments, and inventory boundaries are in-process, not services.
- **Boundary or common mistake:** Shared mutable state or direct cross-module persistence access conceals coupling.

### Interview Drill

#### Why did Samska choose a modular monolith rather than microservices?

- **Expected reasoning:** initial context, explicit ownership, avoided distributed cost, accepted independent-scaling limitation, and evidence-driven reconsideration.
- **Short, 15-30 seconds:** one deployable backend with explicit boundaries was the smallest justified starting point.
- **Technical, 1-2 minutes:** reconstruct the Decision Drill and distinguish ADR history from ongoing principles.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** modular monolith baseline.
- **Concept or boundary to explain:** why direct persistence access violates ownership.
- **Repository action:** inspect ADR 0001 and identify its reconsideration condition.

## Reference Surface

### Historical Context and Outcome

SS-002 established architecture guidance before application implementation. Issue #3 was backfilled for tracking; PR #1 and ADR 0001 are the detailed historical evidence. The work established candidate in-process catalog, cart, orders, payments, and inventory boundaries, not services, databases, packages, APIs, or infrastructure.

### Implementation and Decision Evidence

ADR 0001 rejected starting with microservices, an unstructured monolith, and preemptive event infrastructure. The principles require ownership, directional acyclic dependencies, explicit in-process contracts, and module-owned persistence while leaving schema, transaction, package, and enforcement design open until implementation exists.

### Security, Verification, and Risks

No application behavior or security control was implemented. PR #1 reported relative-link validation and `git diff --check`; no application tests existed. Risks were architectural drift, shared business abstractions, cross-module access, and premature infrastructure.

### Delivery History and Deferred Work

PR #1 was documentation-only. No formal GitHub review or review finding is recorded. Validate one deployable unit and reviewable ownership/dependencies as business behavior appears.

### Sources

- [Issue #3](https://github.com/Samska/samska-sandbox/issues/3)
- [PR #1](https://github.com/Samska/samska-sandbox/pull/1)
- [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- [Architecture Principles](../architecture/principles.md)
