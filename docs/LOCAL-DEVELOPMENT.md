# Local Development

## Purpose and Current Boundaries

This is the canonical guide for configuring, running, verifying, stopping, and troubleshooting Samska Sandbox locally. It describes the repository's current state; it is not deployment guidance.

The core Catalog application uses a Java/Spring Boot backend and a React/Vite frontend. Product data is held in backend process memory and disappears whenever the backend restarts. Docker Compose PostgreSQL is optional local infrastructure: Spring Boot does not connect to it, and it does not persist Products.

## Prerequisites

Install the following tools before using the matching part of the repository:

| Tool | Current repository expectation | Used for |
| --- | --- | --- |
| Git | Required; no minimum version is specified. | Clone and contribute. |
| Java JDK | Compatible Java 25 JDK. CI uses Eclipse Temurin 25. | Backend build and runtime. |
| Maven | No separate installation. `backend/mvnw` provisions Maven 3.9.16. | Backend build and runtime. |
| Node.js | `24.20.0` selected by `web/.nvmrc`; supported range is `>=24.20.0 <25`. | Frontend install, checks, and runtime. |
| npm | `11.19.0`, the intended version declared by `web/package.json`. | Frontend install, checks, and runtime. |
| Docker Engine or Docker Desktop with Compose plugin | Required only for the optional PostgreSQL runtime. No repository minimum is specified. | PostgreSQL infrastructure. |
| Browser | Required for manual Catalog UI interaction. | Frontend verification. |

`JAVA_HOME` is not mandatory when `java` and `javac` already resolve to a compatible Java 25 JDK. If a tool cannot locate Java, set `JAVA_HOME` to that JDK and restart the shell. The Maven Wrapper does not replace the JDK.

The committed `package-lock.json` records the frontend dependency graph. Use `npm ci --ignore-scripts` rather than treating an existing `node_modules/` directory as reproducible setup.

## Core Application Setup

Clone the repository and install frontend dependencies:

```bash
git clone https://github.com/Samska/samska-sandbox.git
cd samska-sandbox/web
npm ci --ignore-scripts
```

No root `.env` file, Docker, or PostgreSQL is required for the current Catalog application. The backend Maven Wrapper is already executable on Unix-like systems; from `backend/`, use `./mvnw`. On Windows, use `mvnw.cmd`.

## Optional PostgreSQL Setup

Run PostgreSQL only when exercising the current local infrastructure. From the repository root, create an ignored local configuration file:

```bash
cp .env.example .env
```

Edit `.env` and set `POSTGRES_PASSWORD` to a non-empty, disposable local value. Retain `POSTGRES_HOST_PORT=5432` unless the host port is occupied; for example, set it to `5433` when needed. Never commit `.env`, copy it to shared locations, or use a real or reusable credential.

Start PostgreSQL:

```bash
docker compose up -d
docker compose ps
```

Verify that PostgreSQL accepts connections inside the container:

```bash
docker compose exec postgres pg_isready -h 127.0.0.1 -p 5432 -U samska_dev -d samska
```

The service uses `postgres:18-trixie`, database `samska`, user `samska_dev`, a healthcheck, and a Docker-managed named volume. Its host address is `127.0.0.1:${POSTGRES_HOST_PORT:-5432}`. PostgreSQL is not connected to Spring Boot and currently exercises infrastructure setup only.

## Runtime Topology

```text
Browser
  -> Vite development server (default 5173 when available)
    -> /api proxy
      -> Spring Boot (default 8080)
        -> InMemoryProductStore

PostgreSQL (127.0.0.1:${POSTGRES_HOST_PORT:-5432})
  -> separate local infrastructure
  -> not used by Spring Boot
```

Vite's startup output is authoritative when its default port is unavailable. The frontend can start without the backend, but Product requests then fail. The backend can run without the frontend and without PostgreSQL. The Catalog UI requires both frontend and backend; PostgreSQL is optional.

## Start the Backend

From `backend/`, start Spring Boot:

```bash
./mvnw spring-boot:run
```

Wait for startup, then verify health at <http://localhost:8080/actuator/health>. A healthy response contains `"status":"UP"`.

The Catalog API creates Products with `POST /api/products` and retrieves them with `GET /api/products/{id}`. If `curl` is available, a direct API check can use:

```bash
curl -i -X POST http://localhost:8080/api/products \
  -H 'Content-Type: application/json' \
  --data '{"name":"Canvas Tote","price":12.50}'
curl -i http://localhost:8080/api/products/<returned-id>
```

Use only synthetic Product data. Save the returned ID only for the current backend process: after restarting the backend, retrieving that ID returns `404 Not Found` because the `InMemoryProductStore` starts empty.

## Start the Frontend

From `web/`, start Vite:

```bash
npm run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>. Vite proxies relative `/api` requests to `http://localhost:8080` only during development. Create a Product, retain its generated ID, and use Find Product to retrieve it. This verifies the current UI flow when backend and frontend are running together.

The proxy does not define production routing or establish a Spring Boot CORS policy.

## URLs and Ports

| Component | Address | Notes |
| --- | --- | --- |
| Spring Boot | `http://localhost:8080` | Default port; no repository override exists. |
| Health endpoint | `http://localhost:8080/actuator/health` | The only intentionally exposed Actuator endpoint. |
| Vite development server | `http://localhost:5173` when available | Check Vite startup output for the actual port. |
| PostgreSQL | `127.0.0.1:${POSTGRES_HOST_PORT:-5432}` | Optional infrastructure; loopback only. |

## Runtime and Manual Verification

1. Start the backend and confirm the health response reports `UP`.
2. Start the frontend, open its reported URL, create a synthetic Product, and retrieve it by the generated ID.
3. Stop and restart the backend, then try the same ID again. It must no longer be found.
4. If PostgreSQL is running, use `docker compose ps` and `pg_isready` to verify its container state independently.

These checks demonstrate current runtime behavior. A healthy PostgreSQL container does not prove Spring Boot connectivity, schemas, migrations, or Product persistence.

## Automated Repository Verification

Run the applicable checks from the indicated directories:

```bash
(cd backend && ./mvnw --batch-mode --no-transfer-progress clean verify)
(cd web && npm ci --ignore-scripts)
(cd web && npm run typecheck)
(cd web && npm test)
(cd web && npm run build)
docker compose config --quiet
git diff --check
```

`docker compose config --quiet` requires a non-empty `POSTGRES_PASSWORD` through the ignored `.env` or the command environment. Repository CI also validates Markdown, local relative links, and EditorConfig. Static checks and component tests do not prove live browser, proxy, or full application integration.

## Shutdown and Reset

Use `Ctrl+C` in the backend or frontend terminal to stop that process. Stopping the backend immediately loses its in-memory Product data.

Run these from the repository root for optional PostgreSQL:

```bash
docker compose stop
docker compose down
docker compose down -v
```

`docker compose stop` stops containers and retains containers and the named volume. `docker compose down` removes Compose containers and network but retains the named volume. `docker compose down -v` also removes named volumes and destructively deletes local PostgreSQL data. None of these commands preserves or deletes Product data independently: Product data exists only in backend process memory.

## Focused Troubleshooting

| Symptom | Check and action |
| --- | --- |
| Java 25 unavailable or incompatible | Run `java --version` and `javac --version`; select a compatible Java 25 JDK. |
| Java tool mismatch | Inspect `JAVA_HOME`; unset it or point it to the same compatible JDK that `java` resolves. |
| Maven Wrapper cannot run or download | Run `./mvnw --version` from `backend/`; verify Unix execute permission and network access to Maven Central. |
| Node or npm missing/wrong | Run `node --version` and `npm --version`; select Node 24.20.0 and its intended npm 11.19.0. |
| Docker daemon unavailable | Run `docker info`; start Docker Engine/Desktop or resolve local socket permissions. |
| Compose rejects the configuration | Create ignored `.env` and set a non-empty `POSTGRES_PASSWORD`. |
| PostgreSQL host port occupied | Change ignored `POSTGRES_HOST_PORT` to an unused port such as `5433`. |
| Backend cannot bind to 8080 | Stop the conflicting process or use a deliberate Spring Boot port override for that local session. |
| Vite uses an unexpected port | Use the URL printed at startup; its default port may be occupied. |
| UI cannot reach Product API | Confirm Spring Boot is healthy at port 8080 and use Vite development mode so `/api` proxying is active. |

## Security and Local Data

Use synthetic data only. `.env` may hold a disposable local PostgreSQL password but is not production secret management. Do not commit it, log its value, place it in frontend `VITE_*` configuration, or use a shared credential.

PostgreSQL is published only to loopback. Its bootstrap user has elevated local privileges and is not used by the application. Treat `docker compose down -v` as destructive and keep real data out of local volumes.

## Keeping This Guide Current

When a change affects local prerequisites, Java/Node/npm versions, environment variables, Docker services, ports, volumes, migrations, startup commands, or local runtime/configuration, update this guide in the same change. Meaningful implementation reports must include the required `## Local Environment Changes` section defined in [AI Engineering Governance](AI-GOVERNANCE.md).
