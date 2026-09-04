# SS-008: PostgreSQL Local Development

- Status: Active
- Work date: 2026-09-04
- Last reviewed: 2026-09-04
- Work item: [SS-008, Issue #18](https://github.com/Samska/samska-sandbox/issues/18)
- Pull request: [#21: feat(database): establish PostgreSQL local development](https://github.com/Samska/samska-sandbox/pull/21)
- ADRs: None
- Canonical documentation: [README](../../README.md), [Architecture](../ARCHITECTURE.md), [Testing Strategy](../TESTING.md), [Security Engineering](../SECURITY.md), [GitHub Repository Controls](../GITHUB.md), and [Compose configuration](../../compose.yaml)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## Study Surface

The PostgreSQL foundation separates a reproducible local database runtime from application persistence and makes its networking, readiness, and data lifecycles explicit.

### Must Remember

- The bounded `postgres:18-trixie` image is a reusable runtime template; a container is an instance of it that shares the host kernel rather than emulating a complete machine.
- A host process uses `127.0.0.1:<published-port>`, while a Compose peer uses `postgres:5432`; `localhost` belongs to the caller's network namespace.
- The named volume outlives container removal: `down` preserves data, while destructive `down -v` removes the volume and data.
- Readiness and successful SQL provide database evidence, not Spring Boot connectivity, schemas, repositories, or business persistence.
- A disposable local password may have little runtime value, but committing a password literal violates secret-scanning policy; Compose therefore requires it from an ignored `.env`.

### Mental Model

```text
postgres:18-trixie image -> postgres container -> PostgreSQL process
                                      |
                                      +-> postgres-data named volume

host process -> 127.0.0.1:host port -> container:5432
Compose peer ------------------------> postgres:5432

.env (ignored) -> Compose interpolation -> POSTGRES_PASSWORD
.env.example ---- variable names only ---^

pg_isready / psql evidence -X-> Spring Boot persistence evidence
```

### Active Recall

#### How do an image, a container, and a virtual machine differ?

<details>
<summary>Answer guide</summary>

- The image supplies immutable packaged layers used to create containers.
- A container adds runtime state and process isolation while sharing the host kernel.
- A virtual machine emulates a complete machine and runs its own guest kernel; Docker Desktop may use a Linux VM to provide the container host without changing the container model.

</details>

#### Why can a host process and a Compose peer not use the same PostgreSQL address?

<details>
<summary>Hint</summary>

Identify whose network namespace interprets `localhost`.

</details>

<details>
<summary>Answer guide</summary>

- Host publication maps `127.0.0.1:<published-port>` to container port 5432.
- Compose DNS resolves service name `postgres` inside the project network.
- Inside another container, `localhost` refers to that container, not PostgreSQL.

</details>

#### Why does data survive `docker compose down` but not `docker compose down -v`?

<details>
<summary>Answer guide</summary>

- `down` removes the container and network but preserves the declared named volume.
- A recreated container mounts the same volume and sees the existing database cluster.
- `down -v` removes the declared volume, so the next startup initializes new database data.

</details>

#### What does each of health, `psql`, and an application persistence test prove?

<details>
<summary>Answer guide</summary>

- `pg_isready` proves that PostgreSQL is accepting connections, not that credentials are valid.
- An authenticated TCP `psql` query proves the selected credentials, database, and SQL path work; the image's trusted local socket does not prove the password.
- Only future application tests can prove Spring DataSource configuration, schemas, migrations, repositories, and business persistence.

</details>

#### Why use a mutable major/base tag instead of `latest`, an exact minor tag, or a digest?

<details>
<summary>Answer guide</summary>

- `latest` permits unintended major and base-family changes.
- An exact minor tag or digest increases determinism but requires an active update process to receive fixes.
- `18-trixie` holds the compatibility boundaries that matter now while explicit pulls receive compatible PostgreSQL and operating-system fixes.

</details>

#### Why keep even a disposable local password outside version control?

<details>
<summary>Answer guide</summary>

- A password literal conflicts with repository secret-scanning policy regardless of its current runtime value.
- The ignored `.env` supplies the local value while `.env.example` documents only the required variables.
- A local `.env` is not production secret management; shared and deployed environments need an appropriate runtime secret mechanism.

</details>

### Decision Drills

#### Decision Drill: Runtime-only database boundary

**Problem:** Future persistence needs a local PostgreSQL runtime, but no application persistence behavior, schema, or data ownership exists yet.

**Options:** Add only the database runtime, or also add PostgreSQL JDBC, DataSource configuration, and a connectivity test.

**Decision:** Add the Docker Compose PostgreSQL runtime only.

**Why:** Runtime readiness can be verified independently, while backend dependencies and configuration should arrive with behavior that needs them.

**Trade-off:** SS-008 does not prove that Spring Boot can connect; this prevents premature integration but leaves that evidence for later work.

**Reconsider When:** A scoped backend feature requires durable data and can define connection, credential, schema, migration, and testing responsibilities together.

#### Decision Drill: Bounded image updates

**Problem:** Local PostgreSQL should avoid accidental compatibility jumps while still receiving routine fixes without constant repository edits.

**Options:** Use a major tag, major/base tag, exact minor tag, or immutable digest.

**Decision:** Use the official Debian-based `postgres:18-trixie` major/base tag.

**Why:** It fixes PostgreSQL 18 and Debian Trixie while `docker compose pull` can receive compatible PostgreSQL patches, operating-system fixes, and image rebuilds.

**Trade-off:** Two clones pulled at different times may resolve different image bytes; the implementation records the verified digest but does not enforce it.

**Reconsider When:** Deployment, CI runtime dependence, supply-chain policy, or an automated update process makes byte-for-byte pinning worth its maintenance cost.

Decision Drills are study aids, not authoritative decisions or ADR replacements.

### Hands-on Reinforcement

#### Inspect runtime, addressing, and evidence layers

- **Prerequisite:** Docker Engine or Docker Desktop with Docker Compose v2 and an ignored root `.env` containing a non-empty `POSTGRES_PASSWORD`; work from the repository root.
- **Perform or inspect:** run `docker compose pull`, `docker compose up -d --wait`, `docker compose ps`, the documented `pg_isready` command, and `docker compose exec postgres sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT current_database(), current_user;"'`.
- **Expected observation:** the image is cached, one generated container is healthy, host port 5432 maps only from `127.0.0.1`, and SQL reports `samska` and `samska_dev`.
- **Explain:** distinguish image from container, host address from Compose service address, and readiness from authenticated query evidence.
- **Cleanup:** run `docker compose down -v` if no local data should remain.
- **Proves / does not prove:** proves the local database runtime and SQL path; does not prove backend integration or persistence behavior.

#### Reconstruct the data lifecycle

- **Prerequisite:** a healthy SS-008 PostgreSQL container with no data that must be retained.
- **Perform or inspect:** create the `ss008_persistence_probe` from the SS-008 verification evidence, observe it after `stop`/`start` and `down`/`up`, then run `down -v`, start again, and query `to_regclass('public.ss008_persistence_probe') IS NULL`.
- **Expected observation:** the probe survives stopped and recreated containers while the named volume exists, then is absent after volume removal.
- **Explain:** identify which operation changed the container lifecycle and which changed the database-data lifecycle.
- **Cleanup:** finish with `docker compose down -v`.
- **Proves / does not prove:** proves this named-volume persistence/reset contract; it does not prove backup, migration, or production durability.

### Interview Drill

#### Explain the smallest useful PostgreSQL foundation

- **Expected reasoning:** local runtime need, image/container distinction, bounded mutable tag, loopback publication, Compose DNS, named-volume lifecycle, readiness/query layers, and runtime-only backend boundary.
- **Likely follow-up:** what concrete future behavior would justify JDBC, least-privileged application credentials, migrations, and database integration tests?
- **Short, 15-30 seconds:** reproducible local PostgreSQL with bounded image updates and explicit lifecycle/evidence limits, without premature application persistence.
- **Technical, 1-2 minutes:** reconstruct both Decision Drills and explain the network, volume, and verification boundaries.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** runtime-only boundary or bounded image updates.
- **Concept or boundary to explain:** caller-relative `localhost`, or container versus volume lifecycle.
- **Repository action:** inspect `compose.yaml` and identify what its healthcheck proves and does not prove.

## Reference Surface

### Historical Context and Outcome

On 2026-09-04, SS-008 began with independent Java and React foundations and no database or container configuration. It added one official PostgreSQL 18 Docker Compose service for local development, a project-scoped named volume, loopback-only host publication, PostgreSQL-native health, static Compose CI validation, and current-state documentation. It added no backend integration, schema, migration, initialization SQL, business data, or additional service.

### Implementation and Decision Evidence

PostgreSQL 18 was selected after reviewing the PostgreSQL support policy: 18 had been stable since 2025-09-25, its current minor was 18.6, and community support ran through 2030-11-14. PostgreSQL 17 offered more maturity but less support runway; PostgreSQL 19 was beta. No current Spring compatibility behavior existed to test because the backend had no JDBC dependency.

The official `postgres:18-trixie` registry tag existed and supported the local AMD64 platform. The standard Debian image was preferred over Alpine because image size was not a requirement and Debian offered the more conventional compatibility and debugging baseline. The image documentation confirmed that PostgreSQL 18+ volumes mount at `/var/lib/postgresql`; the database cluster used the image's version-specific `/var/lib/postgresql/18/docker` subdirectory.

The root `compose.yaml` defines service `postgres`, database `samska`, bootstrap superuser `samska_dev`, fail-fast `POSTGRES_PASSWORD` interpolation, `127.0.0.1:${POSTGRES_HOST_PORT:-5432}:5432`, volume `postgres-data`, and a `pg_isready` healthcheck. The ignored `.env` supplies the local password; `.env.example` lists the host-port default and an empty password field without providing a usable credential. Repository CI uses the non-secret GitHub run ID only as a render-time value for static Compose validation; it does not start PostgreSQL. Compose supplies generated resource names and the default project network. No top-level version, custom name, container name, restart policy, custom network, initialization mount, or extra service exists.

### Security, Verification, and Risks

Docker 29.7.2, Docker Compose v5.5.0, and daemon connectivity through `hello-world` passed. Compose rejected configuration when `POSTGRES_PASSWORD` was absent, then both `docker compose config` and `docker compose config --quiet` passed with a temporary value in the ignored local `.env`; `git status --ignored` confirmed that `.env` remained excluded. Pull and startup resolved PostgreSQL 18.6 (`Debian 18.6-1.pgdg13+2`) and image ID/digest `sha256:4ef4dbc939d61acea57712655ddb4b4ab27419c913f94cca0cd57cb3ea3c2280`. The digest is evidence, not an enforced pin.

`docker compose ps` reported healthy with only `127.0.0.1:5432` published. `pg_isready` reported accepting connections. The required in-container local-socket `psql` query returned database `samska`, user `samska_dev`, and the server version; an additional in-container TCP query with `PGPASSWORD` verified password authentication. Host-native `psql` was unavailable and was not installed; Windows `Test-NetConnection` confirmed TCP reachability to `127.0.0.1:5432`, so host-native PostgreSQL protocol/query evidence remains absent.

The generic `ss008_persistence_probe` row survived `stop`/`start` and `down`/`up`. After `down -v`, a fresh startup returned true for `to_regclass('public.ss008_persistence_probe') IS NULL`. Final `down -v` removed the container, project network, volume, and temporary data; the image remained cached.

Independent verification passed the backend Maven `clean verify` lifecycle, frontend clean install/typecheck/component test/production build, actionlint 1.7.12, Markdown lint, offline local-link validation, EditorConfig checking, and `git diff --check`. The existing GitHub Action pins and backend/frontend application files remained unchanged.

PR #21's implementation commit passed Repository CI, Backend CI, Frontend CI, all three CodeQL analyses, and the aggregate CodeQL check. GitGuardian initially found a committed `POSTGRES_PASSWORD` literal. Although the disposable value had never protected a shared or external resource, the finding exposed a conflict with repository secret-scanning policy. The correction removed the literal, made Compose fail fast when the local variable is absent or empty, and added an inert `.env.example`; no external credential existed to rotate. GitGuardian then classified the explanatory text in the required interpolation expression as a generic password, so the equivalent message-free required expansion retains Compose's default fail-fast diagnostic without supplying a detector candidate or suppressing the detector. After human review, incidents 36915197 and 36915451 were classified `Ignored -> Test credential`; GitGuardian's final PR check reported no secrets present, and the final PR state contains no committed PostgreSQL password.

The ignored local `.env` supplies the password outside version control, and the bootstrap user has elevated privileges. An `.env` file does not make a production secret secure: shared and deployed environments must use an appropriate runtime secret mechanism, and no production or shared credential is present in the repository. A mutable image tag can resolve new bytes after a pull, and PostgreSQL major upgrades require an explicit data migration or disposable local reset.

### Delivery History and Deferred Work

Issue #18 approved PostgreSQL runtime infrastructure and is In Review with High priority. PR #21 opened on 2026-09-04; no formal GitHub review exists yet. Repository CI gained static Compose validation but does not start PostgreSQL. JDBC, DataSource configuration, least-privileged application credentials, schemas, migrations, repositories, Testcontainers, database-backed tests, other infrastructure services, deployment, backups, and monitoring remain deferred until concrete behavior requires them.

### Sources

- [Issue #18](https://github.com/Samska/samska-sandbox/issues/18)
- [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/)
- [Official PostgreSQL Docker image](https://hub.docker.com/_/postgres)
- [Docker Compose networking](https://docs.docker.com/reference/compose-file/networks/)
- [Docker Compose volumes](https://docs.docker.com/reference/compose-file/volumes/)
- [`pg_isready`](https://www.postgresql.org/docs/18/app-pg-isready.html)
