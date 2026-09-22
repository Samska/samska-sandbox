# Samska Sandbox

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Samska Sandbox is a public engineering sandbox for practicing software
architecture, quality, security, delivery, and operational engineering through
a fictional commerce domain. It is non-commercial, and the source code is
licensed under the [Apache License 2.0](LICENSE).

## Current Milestone

- **Target milestone:** `v0.1.0 — First Order` (unreleased)
- **Current stage:** Product Storefront UX/UI in progress
- **Next planned work:** Checkout

[View the live Samska Sandbox Project](https://github.com/users/Samska/projects/1)

The product release is still future. No Git tag or GitHub Release exists yet.
The backend's `0.1.0-SNAPSHOT` and the private frontend package's `0.1.0`
are build metadata, not evidence of a published product release.

## Purpose And Scope

Samska Sandbox uses a fictional catalog and order journey to demonstrate
evidence-driven engineering. The current application contains a Java/Spring
Boot backend, a React/TypeScript frontend, a Catalog boundary for Products, and
a process-local Cart boundary.

AI agents are implementation tools operating under repository-defined
governance. Humans own requirements, architecture, decisions, review,
validation, learning, and risk.

## Current Capabilities

| Capability | Status | Current boundary |
| --- | --- | --- |
| Product domain model | Implemented | Framework-independent Catalog rules and identity. |
| Catalog API | Implemented | Product creation, collection browsing, and retrieval by identity. |
| Catalog UI | Implemented | Product creation, secondary lookup tools, product-oriented browsing, and Cart selection. |
| Product Discovery | Implemented | Product descriptions with a selectable detail view, local product media with a monogram fallback, Add to Cart, and a return to browsing. |
| Shopping Cart | Implemented | Process-local Cart contents, quantity changes, removal, and server-calculated totals. |
| Product UX Foundation | Implemented | Commerce-oriented shell, responsive Product browsing, integrated Cart presentation, accessible feedback, and secondary Catalog tools. |
| Product Storefront UX/UI | In progress | Browse, detail, and feedback presentation refined with a small shared primitive layer and focus return; optional nullable Product `mediaKey` resolved to curated local assets with a monogram fallback; accessible Cart drawer with the quantity-summed item count; the Cart API contract is unchanged; Human Verification passed, CI verification pending. |
| Backend and frontend automated tests | Implemented | Unit, component, type-check, and build verification. |
| Structured CI test reporting | Implemented | Named backend/frontend Check Runs, summaries, annotations, and XML artifacts. |
| PostgreSQL | Infrastructure only | Optional local Compose runtime; not connected to the application. |
| Checkout, payment, orders, E2E, deployment | Planned | Product Storefront UX/UI precedes Checkout and is in progress; Checkout and later First Order capabilities remain future work. |

## Architecture

```mermaid
flowchart LR
    User[User / browser] --> UI[React / TypeScript<br/>Catalog and Cart UI]
    UI --> Adapter[Catalog API adapter]
    Adapter --> Proxy[Vite development<br/>/api proxy]
    Proxy --> HTTP[Spring Boot<br/>Catalog and Cart HTTP APIs]
    HTTP --> App[Catalog and Cart applications<br/>service coordination]
    App --> Domain[Product domain]
    App --> Store[ProductStore boundary]
    Store --> Memory[InMemoryProductStore<br/>process-local]
    App --> Cart[Cart aggregate]
    Cart --> CartMemory[InMemoryCartStore<br/>single current Cart]

    Postgres[(PostgreSQL<br/>optional local Compose infrastructure<br/>not connected to application)]
```

The Vite proxy is for local development only. Product and Cart data are held in
process memory and are lost when the backend restarts. PostgreSQL is
deliberately shown separately because the application has no database connection
or persistence.

## Engineering Practices

- Modular-monolith backend direction with explicit business boundaries.
- Short-lived branches, focused pull requests, and squash-only merges.
- Risk-based backend, frontend, repository, and security verification.
- Independent CI jobs with structured test-result publication.
- Immutable GitHub Action pins and least-privilege workflow permissions.
- CodeQL and GitGuardian checks remain separate from application CI.
- ADRs record significant, durable architecture decisions.
- Agent, human, and CI verification evidence remain distinct.

## CI And Security

```mermaid
flowchart LR
    PR[Pull Request] --> CI[CI workflow]
    CI --> Repo[Repository validation]
    CI --> Backend[Backend build / test / reporting]
    CI --> Frontend[Frontend typecheck / test / build / reporting]
    PR --> CodeQL[CodeQL]
    PR --> GG[GitGuardian Security Checks]
```

The `CI` workflow contains three independent jobs. CodeQL is GitHub-managed
and currently analyzes GitHub Actions, Java/Kotlin, and JavaScript/TypeScript.
GitGuardian remains a separate secret-related check. Secret scanning and push
protection are repository controls documented in [GitHub controls](docs/GITHUB.md).

## Technology Overview

| Area | Current technology |
| --- | --- |
| Backend | Java 25, Spring Boot 4.1.1, Maven Wrapper |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Testing | JUnit/Surefire, Spring MockMvc, Vitest, React Testing Library |
| Local infrastructure | PostgreSQL 18 via Docker Compose, not application-integrated |
| CI/CD | GitHub Actions, structured JUnit reporting, immutable Action pins |
| Security | CodeQL, GitGuardian, GitHub secret protection controls |
| AI-assisted engineering | Repository-governed coding agents with human ownership |

Future technologies such as Redis, RabbitMQ, Playwright, Testcontainers,
OpenTelemetry, Terraform, and deployment platforms are not current stack
components.

## Roadmap And Next Work

The Product Storefront UX/UI refinement is in progress and precedes Checkout by
owner approval. The First Order sequence continues with Checkout, payment
simulation, order creation, the complete First Order journey, and then the
`v0.1.0` release. Future capabilities receive an SS identifier only when their
GitHub Issue is created; the roadmap does not reserve future identifiers.

See the [roadmap](docs/ROADMAP.md) for product direction and the [live Project](https://github.com/users/Samska/projects/1)
for execution state.

## Local Development

Install the repository's Java 25 and Node 24.20.0 prerequisites, then install
frontend dependencies and start the current Catalog application:

```bash
cd web
npm ci --ignore-scripts
cd ..
./scripts/dev.sh
```

The launcher starts Spring Boot and Vite. PostgreSQL is optional and is not
required for the current application. See [Local Development](docs/LOCAL-DEVELOPMENT.md)
for setup, verification, troubleshooting, and shutdown.

## Documentation

- [Product direction](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing strategy](docs/TESTING.md)
- [Security engineering](docs/SECURITY.md)
- [GitHub controls](docs/GITHUB.md)
- [AI engineering governance](docs/AI-GOVERNANCE.md)
- [Engineering Learning Journal](docs/learning/README.md)
- [Architecture Decision Records](docs/adr/README.md)
- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)
