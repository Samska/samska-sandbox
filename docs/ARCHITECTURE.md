# Architecture

## Current State

The repository contains a Spring Boot backend application in `backend/`, a React frontend application in `web/`, and a Docker Compose PostgreSQL runtime for local development. The backend has an application bootstrap and a health-only Actuator endpoint. The frontend renders only a neutral foundation screen and has no routing, business UI, API integration, or browser configuration. Neither application has business modules, business APIs, persistence, external integrations, or deployment configuration. PostgreSQL readiness is infrastructure evidence only: the backend has no JDBC driver, DataSource, schema, migration, repository, or database health participation. This document records the approved direction for future work; it does not describe a deployed system or unimplemented application behavior.

## Initial Direction

The initial backend will be a modular monolith. It will begin as one deployable application with explicit internal module boundaries, rather than independently deployed services.

Candidate v0.1 modules are:

- Catalog
- Cart
- Orders
- Payments
- Inventory

These are candidate in-process boundaries, not a requirement to create services or independent databases. Their responsibilities, dependencies, persistence ownership, and enforcement approach are guided by [Architecture Principles](architecture/principles.md).

The initial technology direction uses React and TypeScript with Vite for the web application and Java and Spring Boot for the backend. Docker Compose now provides a local PostgreSQL runtime that future persistence work can use. Physical schemas, module data ownership, persistence libraries, transactions, migrations, application credentials, and backend connectivity remain future decisions tied to actual persistence behavior.

## Evidence-Driven Evolution

Architecture evolves when observed engineering problems justify a change. Examples include catalog read pressure motivating cache evaluation, problematic synchronous processing motivating message-broker evaluation, concurrent stock updates requiring transaction and locking strategy, or independently evolving boundaries motivating service-extraction evaluation.

Redis, RabbitMQ, OpenTelemetry, cloud infrastructure, Kubernetes, and other future technologies are evaluation candidates. They are not current architecture, implementation requirements, or automatic roadmap deliverables.

## Decision Records

Significant, durable architectural decisions must be recorded as Architecture Decision Records (ADRs). The ADR process and template are in [adr/README.md](adr/README.md). The initial direction is recorded in [ADR 0001: Adopt a Modular Monolith for v0.1](adr/0001-adopt-modular-monolith.md).

The guiding rules for module boundaries and future evolution are in [Architecture Principles](architecture/principles.md).
