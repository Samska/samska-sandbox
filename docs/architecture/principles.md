# Architecture Principles

## Purpose and Scope

These principles guide future architectural decisions for Samska Sandbox. They define decision boundaries, not classes, packages, APIs, database schemas, deployment topology, or framework conventions.

They apply to the future v0.1 backend and its integrations. The current repository has no application implementation.

## Modular Monolith Baseline

v0.1 uses one deployable backend application with explicit internal business-module boundaries. Candidate modules are catalog, cart, orders, payments, and inventory. They are in-process boundaries, not independently deployed services.

## Module Boundaries and Ownership

- Organize modules around business capability and ownership.
- Each business rule and durable data concept has one owning module.
- Other modules use the owning module's explicit behavior rather than accessing its internals.
- Prefer cohesive modules with narrow contracts over broad, shared abstractions.

## Dependencies and Coupling

- Module dependencies must be directional and acyclic.
- Business rules must not be owned by transport, persistence, framework, or vendor-integration concerns.
- Do not use shared mutable state or direct cross-module internal access.
- Make cross-module workflow orchestration explicit and reviewable.

## Persistence Ownership

- A module owns the persisted concepts for which it is responsible.
- A module must not directly query or mutate another module's persistence.
- Physical schema layout, database layout, persistence library, and transaction design remain implementation decisions until persistence behavior exists.

## Cross-Module Communication

- Use explicit in-process module contracts initially.
- Introduce asynchronous communication, retries, or distributed coordination only when a demonstrated engineering problem justifies them.
- Do not infer a need for distributed communication from the existence of multiple modules.

## Shared Code and External Integrations

- Shared code is limited to technical cross-cutting concerns without business ownership.
- Shared code must not become a business-logic dumping ground or depend on business modules.
- External systems belong behind a module-owned boundary and must not leak vendor concerns through business behavior.

## Dependencies and Infrastructure

- A new dependency, platform component, or infrastructure capability requires a current problem, alternatives, security and operational cost, testing impact, and removal or rollback consideration.
- Roadmap placement alone is not sufficient justification for adoption.
- No framework, infrastructure component, or deployment tool is prescribed by these principles.

## Evolution and Extraction

- Evolve the architecture in response to observed engineering evidence, not technology preference.
- Consider service extraction only when a stable boundary has meaningful independent change, deployment, scaling, reliability, or ownership needs, and the additional operational cost is understood.
- Record significant, durable architecture changes in an ADR before or alongside the change.

## Enforcement

Apply these principles through design review and focused testing as implementation appears. Introduce automated boundary checks only when a real dependency structure exists and such checks provide sufficient value.
