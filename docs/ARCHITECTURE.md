# Architecture

## Current State

The repository contains a Spring Boot backend application in `backend/`, a React frontend application in `web/`, and a Docker Compose PostgreSQL runtime for local development. Catalog owns a framework-independent Product domain model, application-layer creation and retrieval use cases, an HTTP adapter, and a temporary in-memory Product store behind an application-owned boundary. The API supports Product creation and retrieval by identity only; its process-local data starts empty and is lost on restart. The frontend has one Catalog page with independent local create and retrieve-by-ID form state. A feature-local API adapter owns relative request paths, transport handling, response validation, and status-based error translation, while presentation components consume typed request and response data without owning Product rules. Vite proxies `/api` to the local backend for development only; it does not define production frontend/API routing or a backend CORS policy. The backend has no application persistence, external integrations, or deployment configuration. PostgreSQL readiness is infrastructure evidence only: the backend has no JDBC driver, DataSource, schema, migration, persistence repository, or database health participation. This document records the approved direction for future work; it does not describe a deployed system or unimplemented application behavior.

## Initial Direction

The initial backend is a modular monolith: one deployable application with explicit internal module boundaries, rather than independently deployed services. Catalog is the first implemented boundary and owns Product. The remaining candidate v0.1 modules are:

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
