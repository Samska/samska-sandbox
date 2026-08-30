# Architecture

## Current State

No application architecture has been implemented. This document records the approved direction for future work; it does not describe a deployed system, existing modules, APIs, data stores, or operational controls.

## Initial Direction

The initial backend will be a modular monolith. It will begin as one deployable application with explicit internal module boundaries, rather than independently deployed services.

Candidate v0.1 modules are:

- Catalog
- Cart
- Orders
- Payments
- Inventory

These are candidate in-process boundaries, not a requirement to create services or independent databases. Their responsibilities, dependencies, persistence ownership, and enforcement approach are guided by [Architecture Principles](architecture/principles.md).

The intended initial technology direction is React and TypeScript for the web application, Java and Spring Boot for the backend, PostgreSQL for persistence, and Docker Compose for local orchestration. No technology in this list is configured or required in the repository yet.

## Evidence-Driven Evolution

Architecture evolves when observed engineering problems justify a change. Examples include catalog read pressure motivating cache evaluation, problematic synchronous processing motivating message-broker evaluation, concurrent stock updates requiring transaction and locking strategy, or independently evolving boundaries motivating service-extraction evaluation.

Redis, RabbitMQ, OpenTelemetry, cloud infrastructure, Kubernetes, and other future technologies are evaluation candidates. They are not current architecture, implementation requirements, or automatic roadmap deliverables.

## Decision Records

Significant, durable architectural decisions must be recorded as Architecture Decision Records (ADRs). The ADR process and template are in [adr/README.md](adr/README.md). The initial direction is recorded in [ADR 0001: Adopt a Modular Monolith for v0.1](adr/0001-adopt-modular-monolith.md).

The guiding rules for module boundaries and future evolution are in [Architecture Principles](architecture/principles.md).
