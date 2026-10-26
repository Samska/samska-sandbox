# Local Development

## Purpose and Current Boundaries

This is the canonical guide for configuring, running, verifying, stopping, and troubleshooting Samska Sandbox locally. It describes the repository's current state; it is not deployment guidance.

The core Catalog, Cart, Payment, and Order application uses a Java/Spring Boot backend and a React/Vite frontend. Product and Cart data, uploaded Product media, and simulated payment attempts are held in backend process memory and disappear whenever the backend restarts. Orders and their items are persisted in PostgreSQL and survive a backend restart. PostgreSQL is required for backend startup; Docker Compose provides the local runtime.

## Prerequisites

Install the following tools before using the matching part of the repository:

| Tool | Current repository expectation | Used for |
| --- | --- | --- |
| Git | Required; no minimum version is specified. | Clone and contribute. |
| Bash | Version 4.3 or later on a Unix-like system or in Git Bash on Windows (verified on Windows 11). Native Windows cmd/PowerShell launcher use is not supported. | `scripts/dev.sh` process supervision. |
| Java JDK | Compatible Java 25 JDK. CI uses Eclipse Temurin 25. | Backend build and runtime. |
| Maven | No separate installation. `backend/mvnw` provisions Maven 3.9.16. | Backend build and runtime. |
| Node.js | `24.20.0` selected by `web/.nvmrc`; supported range is `>=24.20.0 <25`. | Frontend install, checks, and runtime. |
| npm | `11.19.0`, the intended version declared by `web/package.json`. | Frontend install, checks, and runtime. |
| Docker Engine or Docker Desktop with Compose plugin | Required for local PostgreSQL and for backend tests that use Testcontainers. No repository minimum is specified. | PostgreSQL infrastructure and persistence tests. |
| Browser | Required for manual Catalog UI interaction. | Frontend verification. |

`JAVA_HOME` is not mandatory when `java` and `javac` already resolve to a compatible Java 25 JDK. When `JAVA_HOME` is set, `scripts/dev.sh` treats that JDK as the authoritative selection: it validates it and prepends its `bin` directory to `PATH` for the backend and frontend child processes. A different `java` earlier on `PATH`, such as a legacy Oracle `java8path` shim, is reported but does not block the launcher while `JAVA_HOME` selects Java 25. Without `JAVA_HOME`, the launcher validates `java` and `javac` from `PATH`. The Maven Wrapper does not replace the JDK.

The committed `package-lock.json` records the frontend dependency graph. Use `npm ci --ignore-scripts` rather than treating an existing `node_modules/` directory as reproducible setup.

`scripts/dev.sh` validates its Bash, Java, Node, npm, Maven Wrapper, installed frontend dependencies, and that the required backend (8080) and frontend (5173) ports are free before starting anything. When a required port is already in use, it exits with an explanation of how to inspect the owner and never stops that process; stop the existing instance yourself and retry. It does not install tools or run `npm ci`. It uses the Node range declared in `web/package.json` and the intended npm version declared in that file.

## Core Application Setup

Clone the repository and install frontend dependencies:

```bash
git clone https://github.com/Samska/samska-sandbox.git
cd samska-sandbox/web
npm ci --ignore-scripts
```

The backend requires PostgreSQL and a non-empty `POSTGRES_PASSWORD` in its process environment. The Maven Wrapper is already executable on Unix-like systems; from `backend/`, use `./mvnw`. On Windows, use `mvnw.cmd`.

## Recommended: Start the Application Launcher

After installing frontend dependencies, start the Catalog application from the repository root:

```bash
./scripts/dev.sh
```

The launcher resolves the repository root from its own location, so it also works when its path is invoked from another directory. It starts these existing commands concurrently:

```text
(cd backend && ./mvnw spring-boot:run)
(cd web && npm run dev)
```

It prints the commands, Spring Boot health URL, and native Maven/Vite logs. Vite startup output is authoritative for the frontend URL; it normally uses <http://localhost:5173>, but may select another port when `5173` is unavailable. Spring Boot remains on its normal default of <http://localhost:8080>.

The launcher starts only the backend and frontend. It does not start, stop, inspect, or otherwise manage Compose services, and it does not read `.env`. Start PostgreSQL and export `POSTGRES_PASSWORD` in the launcher environment first. The backend fails fast if PostgreSQL or the password is missing; Flyway applies the Order schema at startup.

### Node and NVM Selection

The launcher first uses `node` and `npm` already available on `PATH` when they satisfy the repository requirements. If they are missing or incompatible, it looks for NVM through `NVM_DIR`, then NVM's conventional user-relative `$HOME/.nvm` location, and runs `nvm use` for the version in `web/.nvmrc`. It never runs `nvm install` or installs Node/npm.

NVM is usually initialized by an interactive shell startup file such as `.bashrc`; non-interactive Bash scripts do not necessarily load those files. This is why a terminal can have NVM available while a script initially cannot see `node` or `npm`.

If no compatible runtime is available, select the version in `web/.nvmrc` manually, make compatible Node/npm available on `PATH`, or install them outside the launcher. If frontend dependencies are absent, run the setup command explicitly:

```bash
cd web
npm ci --ignore-scripts
```

### Startup, Health, and Shutdown

When `curl` is available, the launcher waits up to 90 seconds for <http://localhost:8080/actuator/health> to return `{"status":"UP"}`. It reports a timeout or an early child-process exit as a startup failure. `curl` is not required: without it, the launcher states that automatic health verification was skipped and prints the URL without claiming the backend is ready.

The launcher creates separate owned process groups for Maven/Spring Boot and npm/Vite. `Ctrl+C` sends the launcher `SIGINT`; it terminates both owned groups with `SIGTERM`, waits briefly, then uses `SIGKILL` only for its still-running groups. `SIGTERM` uses the same cleanup path. The launcher exits `130` after `Ctrl+C`, `143` after `SIGTERM`, and non-zero when either child exits unexpectedly. It never uses broad process-name termination such as `pkill` or `killall`.

Use `Ctrl+C` in the launcher terminal to stop both processes. Stopping Spring Boot still loses all in-memory Product data.

## PostgreSQL Setup

Start PostgreSQL before the backend. From the repository root, create an ignored local configuration file:

```bash
cp .env.example .env
```

Edit `.env` and set `POSTGRES_PASSWORD` to a non-empty, disposable local value. Retain `POSTGRES_HOST_PORT=5432` unless the host port is occupied; for example, set it to `5433` when needed. Never commit `.env`, copy it to shared locations, or use a real or reusable credential.

Compose reads `.env`; Spring Boot does not. Export the same password, and the host port when it is not `5432`, in the shell that starts the backend or launcher:

```bash
export POSTGRES_PASSWORD='the-same-disposable-value'
# export POSTGRES_HOST_PORT=5433
```

Start PostgreSQL and verify readiness:

```bash
docker compose up -d --wait
docker compose ps
docker compose exec postgres pg_isready -h 127.0.0.1 -p 5432 -U samska_dev -d samska
```

The service uses `postgres:18-trixie`, database `samska`, user `samska_dev`, a healthcheck, and a Docker-managed named volume. Its host address is `127.0.0.1:${POSTGRES_HOST_PORT:-5432}`. The backend connects to that address as `samska_dev`; Flyway creates and version-checks `orders` and `order_items` at startup. The bootstrap PostgreSQL user is local-only and has elevated privileges; it is not production secret management.

## Runtime Topology

```text
Browser
  -> Vite development server (default 5173 when available)
    -> /api proxy
      -> Spring Boot (default 8080)
        -> InMemoryProductStore (Products and uploaded media)
        -> InMemoryCartStore
        -> InMemoryPaymentStore (up to 32 simulated attempts)
        -> JdbcOrderStore (Orders and items copied from approved attempts)
             -> Flyway-managed PostgreSQL schema

PostgreSQL (127.0.0.1:${POSTGRES_HOST_PORT:-5432})
  -> required by the backend
  -> persists Orders and items only
```

Vite's startup output is authoritative when its default port is unavailable. The frontend can start without the backend, but Product and Cart requests then fail. The backend can run without the frontend but requires PostgreSQL. The Catalog and Cart UI requires both frontend and backend.

## Manual / Troubleshooting: Start the Backend

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

## Manual / Troubleshooting: Start the Frontend

From `web/`, start Vite:

```bash
npm run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>. Vite proxies relative `/api` requests to `http://localhost:8080` only during development. Open `/admin/products` directly or use the Admin link in the shell to find, edit, and delete Products; use Create Product to open `/admin/products/new`, or Edit on a row for `/admin/products/{id}/edit`, where one Product image can be selected, replaced, or removed. The Market at `/` browses them, adds them to the Cart, and reaches Checkout, where the simulated payment control can be used. This verifies the current UI flow when backend and frontend are running together.

The proxy does not define production routing or establish a Spring Boot CORS policy. The frontend resolves `/` and `/admin/products` from the browser path; Vite serves the application for direct requests to those paths, and other paths render the in-app not-found view.

## Product Media Upload

The Admin surface accepts one JPEG image per Product. The limits are a 3 MiB multipart request, a 2 MiB input file, 2048 pixels per side, and 4 million pixels total; the server validates and re-encodes the image to a JPEG of at most 2 MiB, and the backend retains at most 32 MiB of stored media bytes in process memory. A rejected upload leaves the Product and its current image unchanged. Re-encoding discards EXIF metadata and orientation, so a phone photo that depends on EXIF rotation may appear sideways by design.

Uploaded images are runtime data: they are not committed to the repository, are not curated assets under `web/public/media/`, and are lost together with Products when the backend restarts. Do not add uploaded images to the repository or to `ATTRIBUTION.md`.

## Simulated Payment

Checkout offers a demo outcome selector (Approve, Decline, or Temporary failure) and a Simulate payment action. The backend captures an immutable, revision-checked snapshot of the current Cart and records a simulated decision in bounded process memory. Repeating the same attempt ID returns the stored result; one Cart revision can hold at most one approval; a changed Cart since the reviewed revision is refused with `409 cart-changed`; and the store retains at most 32 attempts. When the store is full, new attempts return `503 attempt-capacity-exceeded` without evicting existing results; restarting the backend resets the simulator, which also clears Products and the Cart, so recreate synthetic data and review Checkout again.

Payment simulation is local-only: no real payment is processed, no credentials or card data are accepted, and no Order is created. The endpoints and scenario selector are unauthenticated and must not be exposed as a hosted capability. Attempts, captured snapshots, and duplicate protection are lost on backend restart, and a lookup of an attempt from a previous process returns `404`, requiring a new explicit initiation.

## URLs and Ports

| Component | Address | Notes |
| --- | --- | --- |
| Spring Boot | `http://localhost:8080` | Default port; no repository override exists. |
| Health endpoint | `http://localhost:8080/actuator/health` | The only intentionally exposed Actuator endpoint. |
| Vite development server | `http://localhost:5173` when available | Check Vite startup output for the actual port. |
| Frontend routes | `/` (Market), `/checkout` (editable Checkout), `/checkout/attempts/{attemptId}` (Payment result and Order confirmation), `/admin/products` (Admin list), `/admin/products/new` (create), `/admin/products/{id}/edit` (edit) | Served by Vite for direct entry and reload; the attempt route recovers results through read-only API lookups. Other paths render the in-app not-found view. Not an access-control boundary. |
| PostgreSQL | `127.0.0.1:${POSTGRES_HOST_PORT:-5432}` | Required persistence; loopback only. |

## Runtime and Manual Verification

1. Start the backend and confirm the health response reports `UP`.
2. Start the frontend, open its reported URL, create a synthetic Product from `/admin/products/new` (optionally selecting a JPEG before Create), edit it from `/admin/products`, browse it in the Market, add it to the Cart, update its quantity, remove it, and then delete the Product from the Admin list. Adding a Product to the Cart and then attempting to delete it must report the `409` Cart conflict until it is removed from the Cart.
3. On `/admin/products/{id}/edit`, select a replacement JPEG or stage removal, then Save. The Market card and the Product detail view must reflect the change; replacing must serve the new image and stop serving the previous one, and removing must reveal the curated image or the monogram fallback. A rejected file (non-JPEG, over-limit, or malformed) must report that the details were saved while the image was not, and the current image must be unchanged.
4. Stop and restart the backend, then try the same Product ID again. It must no longer be found, and its uploaded image must no longer be served. Any earlier simulated payment attempt must also return not found, because payment state is process-local. A previously created Order must remain retrievable by its Order ID and by its original payment-attempt ID.
5. In Checkout, initiate a simulated payment. Selecting Decline or Temporary failure must state that no payment was made and offer another attempt; approving must state that no real payment was made and no Order was created. Editing the Cart, then attempting payment again after a Cart change, must refresh the displayed Cart instead of deciding on stale values. Stopping and restarting the backend must clear the Cart and attempts.
6. After an approval, reload the `/checkout/attempts/{attemptId}` page: the approved captured snapshot must be recovered from the API, not resent. Create the Order explicitly, reload again, and the frozen Order must remain retrievable. Save the attempt URL, stop and restart only the backend, and load that URL again: the frozen Order must still render even though the Payment attempt is gone. An unknown attempt URL must show that the result cannot be confirmed; a missing record must never be presented as proof that the backend restarted. The live Cart must remain editable after Order creation.
7. Use `docker compose ps` and the migration log to verify PostgreSQL and Flyway startup independently. While PostgreSQL is stopped, Order requests must return `503` with `order-store-unavailable` rather than hanging; record whether they recover after PostgreSQL restarts without restarting the backend. The roughly five-second observation is the Hikari connection-acquisition bound; `socketTimeout` is ten seconds, so a mid-query failure can take longer.

These checks demonstrate current runtime behavior. A healthy PostgreSQL container does not by itself prove Order persistence; the restart, lookup, and outage checks above do.

### SS-049 Required Human Verification

Durable acceptance reference: [Issue #95](https://github.com/Samska/samska-sandbox/issues/95), section 5. This checklist is the repository-local execution guide for that acceptance.

Required owner checks:

R1 and R2 are automated in `OrderPersistenceRestartTest`. The owner checks below are spot-checks of the observable journey, not a request to repeat the full automated matrix.

- **R1 — restart reads.** Create a multi-item Order from an approved simulated payment; stop and start only the backend. GET by Order ID and by payment-attempt ID must both return `200` with the same Order ID, attempt ID, Cart revision, item order, names, unit prices, quantities, line subtotals, and total.
- **R2 — replay and row set.** POST the same attempt after restart. It must return `200`, not `201`, with the same Order ID. SQL must show exactly one Order row and one item set. A pre-restart approved attempt with no Order must return `404`.
- **R3 — saved URL.** Open the saved `/checkout/attempts/{attemptId}` URL after the restart. The frozen Order must render while Market and Checkout show empty state; reload and Back/Forward must remain stable, and no request may mutate state.
- **R4 — outage and revised copy.** Stop PostgreSQL. Health must be `503`/down; Order GET and POST must return `503 order-store-unavailable` within the connection-acquisition bound; the UI must show the existing unconfirmed/check-result state, not claim no Order exists. Database counts must be unchanged. Confirm the revised helper copy (“Orders persist across backend restarts. Simulated payment attempts may not. A failed lookup does not prove an Order was deleted or never created.”) is visible and accurate in this state.
- **R5 — recovery.** Start PostgreSQL without restarting the backend. Health and Order reads/replay must succeed; record the observation, or record that a backend restart was required.
- **R6 — scope.** Confirm Products, uploaded media, Cart, and Payment attempts are still empty after the backend restart, while the Order remains.

Optional coverage, not required for acceptance: browser E2E for the saved URL and outage message; an automated real-PostgreSQL outage stop/start; an explicit data-integrity `500` test; and a Flyway history assertion. The HTTP multi-item restart, replay, row-count, and unordered-attempt checks are automated; R1 and R2 are their owner spot-checks.

Verification status (2026-10-26): owner-reported browser checks covered restart visibility, saved-URL recovery, outage feedback and revised helper visibility, **Try again** recovery, recovery without backend restart, and empty Catalog/Cart. SQL row counts, concurrency tests, HTTP replay assertions, and media checks were not owner-executed; they remain automated/Agent Verification only. No CI Verification is claimed.

### Optional Scenario-Based Evidence

For a relevant flow, concise Given/When/Then scenarios may be used to structure agent execution and owner review of the evidence. This is an optional practical aid after the [SS-038 pilot](https://github.com/Samska/samska-sandbox/issues/64), not a replacement for the checks above and not a mandatory template, framework, automation requirement, or expectation for every Issue. See the [SS-038 Learning Record](learning/ss-038-bdd-human-verification-pilot.md) for the retained practice and its limits.

## Automated Repository Verification

Run the applicable checks from the indicated directories:

```bash
(cd backend && ./mvnw --batch-mode --no-transfer-progress clean verify)
(cd web && npm ci --ignore-scripts)
(cd web && npm run typecheck)
(cd web && npm test)
(cd web && npm run build)
(cd web && npx playwright install chromium)
(cd web && npm run test:e2e)
docker compose config --quiet
git diff --check
```

`clean verify` requires Docker for the PostgreSQL-backed Order tests; the no-database profile keeps the unrelated Spring API tests Docker-free. Browser E2E also requires PostgreSQL to be running and `POSTGRES_PASSWORD` exported. `docker compose config --quiet` requires a non-empty `POSTGRES_PASSWORD` through the ignored `.env` or the command environment. The Repository validation job in CI also validates Markdown, local relative links, and EditorConfig. Static checks and component tests do not prove live browser, proxy, or full application integration.

## Browser End-to-End Tests (Playwright)

`web/e2e/` contains two Chromium Playwright tests that drive the real frontend through the Vite proxy against a fresh Spring Boot backend: the First Order success journey (Cart, Checkout, explicit simulated approval, attempt-addressed recovery after reload and direct entry, explicit Order creation, frozen data after live Cart changes, and keyboard/focus checks) and a declined outcome that exposes no Order path.

Prepare once per machine. Start PostgreSQL and export its password before running from `web/`:

```bash
docker compose up -d --wait
export POSTGRES_PASSWORD='the-same-disposable-value'
cd web
npm ci --ignore-scripts
npx playwright install chromium
npm run test:e2e
```

What the runner does and expects:

- `playwright.config.ts` starts its own backend (`mvnw.cmd`/`./mvnw` `spring-boot:run` from `backend/`) and its own Vite server on `127.0.0.1:5173` with `--strictPort`. `JAVA_HOME` remains the authoritative JDK selection on Windows.
- If `8080` or `5173` is already in use, the run refuses to start with an explicit `already used` error and never stops the existing owner. Stop the other process yourself and retry.
- Each invocation owns a fresh backend process: Products, Cart, and payment attempts are empty at start and are lost when the run ends. Orders persist in PostgreSQL across runs; the tests use unique attempt IDs and do not require an empty Orders table.
- Tests run serially (one worker, no retries) and clear the shared Cart through the existing Cart API before each test; no application reset endpoint exists or is added.
- On failure, traces and screenshots are written under `web/test-results/`, and the HTML report under `web/playwright-report/` (`npx playwright show-report`); open a recorded trace with `npx playwright show-trace test-results/<test-directory>/trace.zip`. Both directories are ignored by Git, so local failure artifacts are review material and CI uploads them only when the run fails. Owned-server output is printed to the terminal and appears in the CI job log; it is not written into those artifact directories. Inspect failure artifacts before rerunning the suite: every new run cleans `web/test-results/` and overwrites `web/playwright-report/`, so a preserved copy of any diagnostics you want to keep must live outside those directories.
- Run a subset with `npm run test:e2e -- e2e/first-order.spec.ts` and watch locally with `npx playwright test --headed`.

Windows and Git Bash notes:

- Playwright supports Windows 11 natively and manages its own child processes; this is separate from `scripts/dev.sh`, whose native cmd/PowerShell limitation remains. The launcher's Git Bash path on Windows was verified on Windows 11 in PR #51.
- Chromium binaries are installed by `npx playwright install chromium` under `%LOCALAPPDATA%\ms-playwright` (on Linux, `~/.cache/ms-playwright`); on Linux use `npx playwright install --with-deps chromium` for required system libraries.
- `Ctrl+C` in the launcher terminal stops the run and cleans up the processes this run owns. Verified Agent evidence on Windows: after a normal exit and after controlled test failures, both ports were released within a second and no owned descendant processes remained.
- Documented limitation: closing the terminal window or force-killing the runner before it can clean up can leave the owned backend and Vite processes running. Recover from Git Bash with three identity-checked steps: confirm the listener, verify that the owning process references this repository, then terminate only the verified tree. Never terminate by image name or port alone.

```bash
# 1. Find the listener and its Windows PID (last column)
netstat -ano | grep -E ':(8080|5173) '

# 2. Verify which processes belong to this repository. Single quotes keep Bash
#    from expanding $_ before PowerShell receives it.
powershell -NoProfile -Command 'Get-CimInstance Win32_Process | Where-Object { $_.Name -in "java.exe","node.exe" -and $_.CommandLine -match "samska-sandbox" } | Select-Object ProcessId,ParentProcessId,Name,CommandLine'

# 3. Terminate only the verified process tree. The double slashes keep Git Bash
#    (MSYS) from rewriting the Windows-style switches into paths.
taskkill //PID <verified-pid> //T //F
```

## Shutdown and Reset

Use `Ctrl+C` in the launcher terminal to stop both application processes, or use `Ctrl+C` in each manual backend/frontend terminal to stop that process. Stopping the backend immediately loses its in-memory Product, Cart, and payment-attempt data; persisted Orders remain in PostgreSQL.

Run these from the repository root to manage PostgreSQL:

```bash
docker compose stop
docker compose down
docker compose down -v
```

`docker compose stop` stops containers and retains containers and the named volume. `docker compose down` removes Compose containers and network but retains the named volume, so Orders survive it. `docker compose down -v` also removes named volumes and destructively deletes local PostgreSQL data, including all Orders. Product, Cart, and payment-attempt data exist only in backend process memory and are unaffected by these commands except through loss of the backend process.

## Focused Troubleshooting

| Symptom | Check and action |
| --- | --- |
| Java 25 unavailable or incompatible | Run `java --version` and `javac --version`; select a compatible Java 25 JDK. |
| Java tool mismatch | Inspect `JAVA_HOME`. When set, the launcher uses it and prepends it for child processes; point it at a compatible Java 25 JDK or unset it to select Java from `PATH`. A different `java` earlier on `PATH`, such as a legacy Oracle `java8path` shim, is reported but does not block the launcher while `JAVA_HOME` selects Java 25. |
| Maven Wrapper cannot run or download | Run `./mvnw --version` from `backend/`; verify Unix execute permission and network access to Maven Central. |
| Node or npm missing/wrong | Run `node --version` and `npm --version`; select Node 24.20.0 and its intended npm 11.19.0. |
| Launcher rejects Bash | Use Bash 4.3 or later on a Unix-like system or in Git Bash on Windows. Native Windows cmd/PowerShell launcher support is out of scope. |
| Launcher cannot select Node | Ensure compatible Node/npm are on `PATH`, or make NVM available through `NVM_DIR` or its conventional `$HOME/.nvm` location and install the repository version manually before retrying. |
| Launcher says frontend dependencies are missing | Run `cd web && npm ci --ignore-scripts`; the launcher intentionally does not install them. |
| Launcher reports a required port is already in use | Another Samska development instance or another service owns port 8080 or 5173. Stop that process (for example, Ctrl+C in its terminal) or free the port, then retry; the launcher never stops other processes. |
| Launcher health check times out | Review the visible Maven logs, confirm no process owns port 8080, and open the health URL manually. |
| Launcher exits after one process stops | Review the visible Maven/Vite logs. The launcher deliberately stops its other owned process so a partial local stack is not left running. |
| Docker daemon unavailable | Run `docker info`; start Docker Engine/Desktop or resolve local socket permissions. |
| Backend fails before startup with a missing `POSTGRES_PASSWORD` placeholder | Export `POSTGRES_PASSWORD` in the backend shell; `.env` is read by Compose, not Spring Boot. |
| Backend cannot connect or Flyway fails at startup | Confirm `docker compose ps` is healthy, the exported password matches `.env`, and `POSTGRES_HOST_PORT` matches the published port. |
| Order requests return `503 order-store-unavailable` | Confirm PostgreSQL is running and reachable; the endpoint fails with a bounded timeout rather than hanging. |
| Compose rejects the configuration | Create ignored `.env` and set a non-empty `POSTGRES_PASSWORD`. |
| PostgreSQL host port occupied | Change ignored `POSTGRES_HOST_PORT` to an unused port such as `5433`. |
| Backend cannot bind to 8080 | Stop the conflicting process or use a deliberate Spring Boot port override for that local session. |
| Vite uses an unexpected port | Use the URL printed at startup; its default port may be occupied. |
| UI cannot reach Product API | Confirm Spring Boot is healthy at port 8080 and use Vite development mode so `/api` proxying is active. |

## Security and Local Data

Use synthetic data only. `.env` may hold a disposable local PostgreSQL password but is not production secret management. Do not commit it, log its value, place it in frontend `VITE_*` configuration, or use a shared credential.

PostgreSQL is published only to loopback. Its bootstrap user has elevated local privileges and is the local application user; this is a local-only constraint, not production credential management. Persisted Orders are unauthenticated synthetic records and outlive the backend process. Treat `docker compose down -v` as destructive, keep real data out of local volumes, and do not expose this database or application beyond loopback.

## Keeping This Guide Current

When a change affects local prerequisites, Java/Node/npm versions, environment variables, Docker services, ports, volumes, migrations, startup commands, or local runtime/configuration, update this guide in the same change. Meaningful implementation reports must include the required `## Local Environment Changes` section defined in [AI Engineering Governance](AI-GOVERNANCE.md).

This guide is the canonical human-facing local setup reference; [`scripts/dev.sh`](../scripts/dev.sh) is the convenience executable representation of the supported backend/frontend startup workflow. Changes affecting local startup or launcher assumptions must review both for consistency. Update the launcher only when affected, and rerun relevant launcher verification whenever it changes.
