# Samska Sandbox

Samska Sandbox is a public educational engineering platform built around a fictional commerce and logistics domain. It is non-commercial as a project purpose; the source code is licensed under the [Apache License 2.0](LICENSE).

The repository contains initial Java backend and React frontend foundations plus a Docker Compose PostgreSQL runtime for local development. It has no business-domain implementation or application persistence.

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
- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)

## Current Status

SS-005 establishes repository CI for Markdown, local relative-link, and EditorConfig validation. SS-006 establishes backend CI that builds and tests the Java backend on pull requests targeting `main`. SS-007 establishes a React frontend foundation and Frontend CI for type checking, component smoke tests, and production builds. SS-008 establishes a PostgreSQL local runtime without backend database integration and extends Repository CI with static Compose validation.

## Backend

The backend is a Spring Boot 4.1.1 application in [backend/](backend/) that requires Eclipse Temurin 25 or another compatible Java 25 JDK. The Maven Wrapper provisions Maven 3.9.16; a separate Maven installation is not required.

Run these commands from `backend/`:

```bash
./mvnw clean verify
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd` instead. When the application has started, `http://localhost:8080/actuator/health` returns a response whose status is `UP`. Health is the only intentionally exposed HTTP endpoint.

## Local PostgreSQL

The repository-root [Compose file](compose.yaml) runs the official Debian-based `postgres:18-trixie` image. The tag fixes the PostgreSQL major line and Debian base family while allowing PostgreSQL patches, operating-system security fixes, and image rebuilds through `docker compose pull`; it is not immutable.

Docker Desktop or Docker Engine with Docker Compose v2 is required. A local PostgreSQL installation and local `psql` are not required because the container provides the client tools. Run these commands from the repository root:

```bash
docker compose up -d --wait
docker compose ps
docker compose exec postgres pg_isready -h 127.0.0.1 -p 5432 -U samska_dev -d samska
docker compose exec postgres psql -U samska_dev -d samska
docker compose stop
docker compose down
docker compose down -v
```

`docker compose stop` retains the container, named volume, and database data. `docker compose down` removes the container and Compose network but retains the named volume and data. `docker compose down -v` also removes the named volume and intentionally destroys the local database data; treat it as a destructive reset. These commands do not remove the cached image.

The database is `samska`, the bootstrap development user is `samska_dev`, and the password is `samska-local-only`. These committed values are public local-only configuration, not secrets. The bootstrap user has elevated PostgreSQL privileges. Never reuse these values in CI, shared, deployed, or production environments; future application integration must establish appropriate least-privileged credentials.

PostgreSQL is published only on IPv4 loopback at `127.0.0.1:5432`. If that host port is occupied, set `POSTGRES_HOST_PORT=5433` in an uncommitted root `.env` file and use `127.0.0.1:5433`. A process on the host uses `127.0.0.1:<published-host-port>`, while a Compose peer uses `postgres:5432`. `localhost` always refers to the network namespace of the calling process.

A healthy container means PostgreSQL is accepting connections. It does not prove credentials, host publication, Spring Boot connectivity, schemas, migrations, repositories, business persistence, or data correctness. The backend remains runnable and testable without PostgreSQL.

## Frontend

The frontend is a React and TypeScript application in [web/](web/). It requires Node.js 24.20.0 and its bundled npm 11.19.0. The `web/.nvmrc` file selects that version for supported local workflows and CI; `engines` and `packageManager` in `web/package.json` communicate supported Node and intended npm versions to compatible tooling, but do not enforce local runtime selection by themselves.

Run these commands from `web/`:

```bash
npm ci --ignore-scripts
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

`npm ci` installs the exact dependency graph recorded in `package-lock.json`. The Vite development server supports local development and Hot Module Replacement; it is not a production runtime. `npm run build` creates production static assets in `web/dist/`, and `npm run preview` is only for local inspection of that build.
