# SS-002: Architecture Principles and the Modular Monolith

- Status: Historical
- Date: 2026-08-30
- Work item: [SS-002, Issue #3](https://github.com/Samska/samska-sandbox/issues/3)
- Pull request: [PR #1](https://github.com/Samska/samska-sandbox/pull/1)
- ADR: [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Architecture Principles](../architecture/principles.md), and [ADR guide](../adr/README.md)

## Goal and Previous State

SS-002 established architecture guidance before application implementation. The repository had no backend, modules, APIs, persistence, or infrastructure. Issue #3 was backfilled only for project tracking; PR #1 and the merged commit are the detailed historical evidence for this work.

## What Changed and Why

The work added architecture principles and accepted ADR 0001: v0.1 will begin as one deployable modular monolith with explicit in-process business-module boundaries. The candidate catalog, cart, orders, payments, and inventory capabilities remain directional boundaries, not independently deployed services or separate databases.

The decision keeps local development, deployment, debugging, and end-to-end testing simpler while the product and boundaries are still unproven. It also creates reviewable rules for ownership and dependencies without prematurely selecting package structure, persistence technology, APIs, or infrastructure.

## Engineering Concepts

### Modular Monolith, Microservices, and an Unstructured Monolith

A modular monolith is one deployable application whose internal business boundaries are explicit. Samska selected this baseline because no evidence yet justified independent deployment, scaling, coordination, or ownership. Starting with microservices would have added distributed failure handling, operational overhead, and observability needs before the product existed.

An unstructured monolith would avoid distributed complexity but would not protect ownership or future evolution. Samska rejected that alternative because business rules and durable concepts need a clear owner. The trade-off is that module boundaries require continuing design review; modules cannot yet be deployed or scaled independently.

### Module Boundaries, Dependencies, and Persistence Ownership

The architecture principles organize modules around business capability. Each business rule and durable data concept has one owning module; other modules use its explicit behavior rather than reaching into internals. Dependencies must be directional and acyclic, and cross-module orchestration must be explicit.

The same ownership rule applies to persistence: a module must not directly query or mutate another module's persisted concepts. This prevents convenience shortcuts from turning storage structure into a hidden cross-module contract. It leaves physical schema layout, transaction design, and persistence libraries undecided until implementation supplies evidence.

### Evidence-Driven Evolution and ADRs

Samska treats Redis, messaging, service extraction, and other infrastructure as evaluation candidates, not planned implementations. A measurable coupling, deployment, scale, reliability, or ownership problem must justify change.

An ADR records one significant, durable decision and its historical rationale. Architecture principles are broader, ongoing rules used to evaluate many implementation choices. ADR 0001 records the modular-monolith baseline; the principles guide how that baseline is applied. Neither replaces implementation documentation.

## Alternatives and Trade-offs

ADR 0001 explicitly rejected starting with microservices, an unstructured monolith, and preemptive event-driven infrastructure. The accepted trade-off is a simpler initial operating model in exchange for no independent module deployment or scaling. Future extraction may require migration work if evidence later justifies its cost.

## Security and Verification

No security control or application behavior was implemented. The principles nevertheless require external systems to sit behind module-owned boundaries, which reduces vendor concerns leaking into business behavior. Security effects remain future implementation concerns, not verified protections.

PR #1 reports relative-link validation and `git diff --check`; it also confirms no application code or infrastructure was introduced. No application tests existed or were claimed.

## Failure Modes and Safeguards

- Direct cross-module access can undermine ownership. Apply the principles during design review and focused testing as implementation appears.
- Shared mutable state or shared business abstractions can conceal coupling. Keep shared code technical and independent of business modules.
- Premature services or messaging can create operational complexity without a product need. Require evidence and a new ADR for a significant change.
- Treating candidate modules as deployed services would overstate the current architecture. Preserve the distinction in code and documentation.

## Plan, Build, Review, and Pull Request Lessons

### Plan

PR #1 constrained the work to architecture documentation and an initial decision record; it did not authorize implementation or infrastructure.

### Build

The merged change added the principles, ADR 0001, and links from existing architecture documentation. It intentionally left package, API, schema, transaction, and deployment choices open.

### Review

No formal GitHub review, review comment, or review finding is recorded for PR #1. The available PR evidence reports documentation-link validation and `git diff --check`; it cannot establish review that occurred outside GitHub.

### Pull Request

PR #1 documented SS-002-only scope and no application or infrastructure work. Its residual risk is architectural drift once implementation begins, which the principles direct reviewers to manage.

## What the Project Owner Should Understand

The modular monolith is a deliberate starting point, not an anti-microservices claim. Samska chose explicit in-process ownership first because it provides a simpler learning and operating model while retaining an evidence-based path to later change.

## Interview Practice

### Questions

- Why did Samska start with a modular monolith instead of microservices?
- How do directional dependencies and persistence ownership protect module boundaries?
- When should an ADR be used instead of an architecture-principles document?

### Interview-Ready Explanation

For v0.1, Samska chose a single deployable modular monolith in ADR 0001 because the project had no evidence that independent deployment or scaling was needed. We still defined business ownership, acyclic dependencies, and persistence ownership so the monolith would not become unstructured. The trade-off is that modules cannot scale independently, but we avoid distributed-system cost until observed coupling, reliability, or ownership needs justify a new ADR.

## Follow-up and Sources

Validate these principles when the backend begins: confirm one deployable unit and reviewable module ownership and dependencies. Revisit ADR 0001 only when concrete evidence changes its trade-off.

- [Issue #3](https://github.com/Samska/samska-sandbox/issues/3)
- [PR #1](https://github.com/Samska/samska-sandbox/pull/1)
- [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- [Architecture Principles](../architecture/principles.md)
