# Samska Sandbox

Samska Sandbox is a public educational engineering platform built around a fictional commerce and logistics domain. It is non-commercial as a project purpose; the source code is licensed under the [Apache License 2.0](LICENSE).

The repository contains a Java backend, a React frontend, a Docker Compose PostgreSQL runtime for local development, and a Catalog boundary with a framework-independent Product domain model and HTTP API. The frontend can create Products and retrieve them by generated identity. Catalog products use temporary process-local storage; there is no application persistence.

All production code is expected to be generated or modified with AI coding agents. Humans remain responsible for requirements, architecture, engineering decisions, review, validation, risk assessment, and understanding the resulting work.

## Product Direction

The initial milestone, v0.1.0 "First Order", will eventually allow a user to browse products, add an item to a cart, complete simulated checkout, receive a simulated payment decision, create an order, and view confirmation. No real financial transactions or real customer data will be used.

The initial technology direction is React, TypeScript, Java, Spring Boot, PostgreSQL, and Docker Compose. PostgreSQL is currently local infrastructure only; the Spring Boot application does not connect to it.

## Documentation

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Testing strategy](docs/TESTING.md)
- [Security engineering](docs/SECURITY.md)
- [AI engineering governance](docs/AI-GOVERNANCE.md)
- [Engineering Learning Journal](docs/learning/README.md)
- [GitHub controls](docs/GITHUB.md)
- [Architecture Decision Records](docs/adr/README.md)
- [Local development](docs/LOCAL-DEVELOPMENT.md)
- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)

## Current Status

SS-005 establishes repository CI for Markdown, local relative-link, and EditorConfig validation. SS-006 establishes backend CI that builds and tests the Java backend on pull requests targeting `main`. SS-007 establishes a React frontend foundation and Frontend CI for type checking, component smoke tests, and production builds. SS-008 establishes a PostgreSQL local runtime without backend database integration and extends Repository CI with static Compose validation. SS-009 establishes the initial Catalog Product domain model with framework-independent business rules and unit tests. SS-010 adds Product creation and retrieval over HTTP with application-layer coordination and temporary in-memory storage. SS-011 adds a focused Catalog UI with independent create and retrieve-by-ID forms. SS-021 establishes the canonical local development workflow.

## Local Development

The Catalog application requires the Java/Spring Boot backend and React/Vite frontend. PostgreSQL is optional local infrastructure and is not connected to Spring Boot. Product data is process-local and is lost when the backend stops. See [Local Development](docs/LOCAL-DEVELOPMENT.md) for the canonical prerequisites, setup, commands, verification, shutdown, reset, and troubleshooting guidance.
