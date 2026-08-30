# ADR 0001: Adopt a Modular Monolith for v0.1

- Status: Accepted
- Date: 2026-08-30
- Decision makers: Project owner
- Related: [Architecture](../ARCHITECTURE.md), [Architecture Principles](../architecture/principles.md), [Roadmap](../ROADMAP.md)

## Context

Samska Sandbox has no application implementation. Its first milestone, v0.1.0 "First Order", will introduce a fictional commerce workflow. Candidate business capabilities include catalog, cart, orders, payments, and inventory.

The project needs clear internal boundaries while preserving a simple learning and operating model. Starting with independently deployed services or distributed infrastructure would add deployment, coordination, failure-handling, observability, and operational complexity before a product problem demonstrates their value.

## Decision

For v0.1, the backend will be one deployable modular monolith. It will use explicit in-process business-module boundaries guided by [the architecture principles](../architecture/principles.md).

This decision does not prescribe package structure, APIs, persistence design, framework conventions, or deployment configuration. It does not introduce independently deployed services, separate data stores, or distributed infrastructure.

Any future service extraction or significant change to this direction requires evidence of a concrete engineering need and a new ADR.

## Alternatives Considered

### Start With Microservices

Rejected. Independent services would introduce distributed-system and operational concerns before the project has stable boundaries or evidence that independent deployment, scaling, or ownership is needed.

### Build an Unstructured Monolith

Rejected. A single deployable application without explicit internal boundaries would make ownership and future evolution harder to manage.

### Preemptively Add Event-Driven Infrastructure

Rejected. The current repository has no demonstrated asynchronous-processing, reliability, or throughput problem that would justify additional infrastructure.

## Consequences

Positive consequences:

- Local development, deployment, debugging, and end-to-end testing can remain simple.
- In-process behavior avoids distributed coordination while v0.1 boundaries are still evolving.
- Explicit module ownership provides a basis for future evidence-driven evolution.

Negative consequences:

- Module boundaries require ongoing design and review discipline.
- Modules cannot be independently deployed or scaled.
- Future extraction, if justified, may require migration work and additional operational capability.

## Validation

Validate this decision as implementation begins by confirming that the backend remains one deployable unit and that new business behavior has reviewable module ownership and dependencies.

Revisit the decision when observed coupling, deployment, scaling, reliability, or ownership needs make the costs of the modular monolith greater than the costs of a different approach.
