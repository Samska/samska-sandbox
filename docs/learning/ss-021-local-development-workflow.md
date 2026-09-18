# SS-021: Local Development Workflow

- Status: Draft
- Work date: 2026-09-18
- Last reviewed: 2026-09-18
- Work item: [SS-021, Issue #28](https://github.com/Samska/samska-sandbox/issues/28)
- Pull request: None
- ADRs: None
- Canonical documentation: [Local Development](../LOCAL-DEVELOPMENT.md), [AI Engineering Governance](../AI-GOVERNANCE.md), [Architecture](../ARCHITECTURE.md), and [Security Engineering](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## Study Surface

Repository-owned setup guidance makes local operation reproducible without treating session history, installed artifacts, or a running database as implicit application dependencies.

### Must Remember

- **Canonical operational source:** one repository guide owns current setup commands and boundaries; summaries link to it rather than copying it.
- **Dependency boundary:** the Catalog application needs Vite and Spring Boot, while PostgreSQL is optional infrastructure until the backend has persistence integration.
- **State boundary:** a Docker volume can retain PostgreSQL data while `InMemoryProductStore` loses every Product when Spring Boot restarts.
- **Reproducibility layers:** a JDK runs Java, Maven Wrapper selects Maven, `.nvmrc` selects Node, and `package-lock.json` resolves frontend dependencies; none replaces the others.
- **Change visibility:** meaningful implementation reports must disclose local-environment impact, including a deliberate `None` when no setup change occurred.

### Mental Model

```text
Repository guide -> developer prerequisites -> local commands -> observed runtime
                                              |
                                              +-> report local-environment impact

Vite -> Spring Boot -> process-local Products
PostgreSQL -> separate optional infrastructure
```

### Active Recall

#### Why is PostgreSQL optional even though Compose configuration exists?

<details>
<summary>Answer guide</summary>

- Compose provides a local database container, but the backend has no JDBC driver, DataSource, migration, or persistence repository.
- Catalog requests use `InMemoryProductStore`, so backend and frontend can run without PostgreSQL.

</details>

#### Why should the README link to, rather than duplicate, local setup instructions?

<details>
<summary>Answer guide</summary>

- Competing command inventories drift and force developers to decide which source is current.
- A concise README entry point preserves discoverability while the canonical guide owns operational detail.

</details>

#### What must a Local Environment Changes report establish?

<details>
<summary>Answer guide</summary>

- It either explicitly says `None` or tells developers what changed, why, how to update, and how to verify the result.
- This prevents Java, Node, Docker, environment, port, volume, migration, and startup changes from being implicit agent knowledge.

</details>

### Decision Drills

#### Decision Drill: PostgreSQL as optional current infrastructure

**Problem:** The repository includes PostgreSQL Compose configuration while Catalog Products are process-local.

**Options:** Present PostgreSQL as mandatory application setup, omit it from local guidance, or document it as optional infrastructure with its own lifecycle.

**Decision:** Document PostgreSQL separately and explicitly state that it is not connected to Spring Boot or Product persistence.

**Why:** This matches the implementation and lets a developer run the Catalog application without unnecessary Docker configuration.

**Trade-off:** Developers must understand two independent local workflows until application persistence is introduced.

**Reconsider When:** The backend gains a documented database connection and Product persistence behavior.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** why PostgreSQL is separate from the current Catalog runtime.
- **Concept or boundary to explain:** process-local Product state versus PostgreSQL named-volume persistence.
- **Repository action:** inspect `docs/LOCAL-DEVELOPMENT.md` and identify where a future setup change must be reported.

## Reference Surface

### Historical Context and Outcome

SS-021 consolidated local operation guidance that was previously spread across current-state documentation and implementation history. It establishes `docs/LOCAL-DEVELOPMENT.md` as the operational source and makes the README a concise entry point.

### Implementation and Decision Evidence

The guide derives Java 25, Maven Wrapper 3.9.16, Node 24.20.0, npm 11.19.0, Vite proxying, Spring Boot health, Compose PostgreSQL, and Catalog API behavior from repository configuration and implementation. It distinguishes repository requirements from a particular developer machine.

AI governance now requires every meaningful implementation report to disclose local-environment effects and requires the canonical guide to change with setup-affecting work.

### Security, Verification, and Risks

The guide keeps PostgreSQL credentials in ignored `.env`, uses only disposable local values, avoids frontend secret configuration, and labels volume removal as destructive. Runtime validation must clean up isolated verification processes and Compose resources. Static checks and mocked frontend tests do not prove live browser integration.

### Delivery History and Deferred Work

Issue #28 is the canonical scope record. No ADR is needed because documentation ownership and reporting requirements are reversible governance details, not a durable system architecture decision. Dockerized applications, PostgreSQL integration, migrations, production deployment, and Learning System refactoring remain deferred.

### Sources

- [Issue #28](https://github.com/Samska/samska-sandbox/issues/28)
- [Local Development](../LOCAL-DEVELOPMENT.md)
- [AI Engineering Governance](../AI-GOVERNANCE.md)
- [Architecture](../ARCHITECTURE.md)
- [Security Engineering](../SECURITY.md)
