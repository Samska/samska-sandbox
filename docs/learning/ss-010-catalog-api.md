# SS-010: Catalog API Foundation

- Status: Draft
- Work date: 2026-09-18
- Last reviewed: 2026-09-18
- Work item: [SS-010, Issue #24](https://github.com/Samska/samska-sandbox/issues/24)
- Pull request: None
- ADRs: [ADR 0001: Adopt a Modular Monolith for v0.1](../adr/0001-adopt-modular-monolith.md); no new ADR
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Architecture Principles](../architecture/principles.md), [Testing Strategy](../TESTING.md), and [Security Engineering](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## Study Surface

The first Catalog API keeps HTTP representation, use-case coordination, Product rules, and temporary storage distinct while exercising them through one Spring application.

### Must Remember

- **HTTP and API Contract:** method, path, status, headers, and JSON fields are observable behavior; SS-010 promises create and retrieve-by-ID only.
- **Controller and DTO:** the controller adapts transport data, while request and response DTOs prevent Product from becoming an accidental JSON contract.
- **Application Layer and Use Case:** one application service coordinates identity generation, Product creation, storage, and retrieval without deciding Product validity or HTTP status.
- **Error Mapping:** focused API advice translates only understood domain, application, and request-conversion failures; it never maps every `IllegalArgumentException` to a client error.
- **Domain and storage boundaries:** Product remains framework-independent and owns its invariants, while application code depends on `ProductStore` rather than the temporary map.

These five grouped targets cover the seven requested concepts without exceeding the canonical 3-5 Must Remember guidance.

### Mental Model

```text
HTTP -> Controller + DTO -> ProductApplicationService -> Product
                                  |
                                  +-> ProductStore <- InMemoryProductStore

typed domain/application failure -> focused API mapping -> HTTP status
```

### Active Recall

#### Why is Product not returned directly as JSON?

<details>
<summary>Answer guide</summary>

- Product owns business state and behavior, not transport field shape.
- A response DTO flattens ProductId to UUID and prevents domain refactoring from silently changing the API.

</details>

#### Where are Product creation decisions made?

<details>
<summary>Answer guide</summary>

- The application service coordinates ID generation, construction, and storage.
- Product decides whether name and price satisfy its invariants.
- The controller decides only how the result is represented over HTTP.

</details>

#### Why is a typed InvalidProductException safer than mapping IllegalArgumentException?

<details>
<summary>Answer guide</summary>

- The type identifies an understood domain outcome without importing HTTP into the domain.
- A blanket mapping could hide unrelated programming defects as client mistakes.

</details>

#### Why introduce ProductStore for a temporary map?

<details>
<summary>Answer guide</summary>

- The use case needs storage behavior but should not depend on a temporary mechanism.
- The narrow port isolates process-local storage without selecting a future persistence technology.

</details>

#### What does the Product API component test prove?

<details>
<summary>Answer guide</summary>

- It exercises Spring routing, JSON conversion, application coordination, temporary storage, DTO mapping, and focused error translation.
- It does not prove real-network behavior, persistence, restart durability, frontend integration, deployment, or public-API controls.

</details>

### Decision Drills

#### Decision Drill: Simple client-error status

**Problem:** The first API must distinguish successful, malformed, invalid-domain, and missing-resource outcomes without inventing a large error model.

**Options:** Use `400` for all understood invalid client input, or distinguish domain invalidity with `422`.

**Decision:** Use `400 Bad Request` for malformed representation, malformed UUID, and Product invariant failures; use `404 Not Found` for an unknown valid UUID.

**Why:** One status for invalid input keeps the first contract small while typed exceptions keep internal translation explicit.

**Trade-off:** Clients cannot distinguish malformed representation from domain invalidity by status alone, and SS-010 defines no stable JSON error body.

**Reconsider When:** A real client needs machine-readable validation categories or field-level feedback.

#### Decision Drill: Storage boundary before persistence

**Problem:** Use cases need temporary storage without coupling application code to a map or choosing PostgreSQL technology early.

**Options:** Access `ConcurrentHashMap` directly from the application service, or introduce a narrow `ProductStore` port with an in-memory adapter.

**Decision:** Depend on `ProductStore` and implement it with process-local `InMemoryProductStore`.

**Why:** The explicit boundary reflects a current application need and keeps the temporary mechanism replaceable without defining future database details.

**Trade-off:** One interface and adapter are added for a single implementation.

**Reconsider When:** Durable persistence requirements define transactions, query behavior, and PostgreSQL integration.

Decision Drills are study aids, not authoritative decisions or ADR replacements.

### Hands-on Reinforcement

#### Trace the Product API pipeline

- **Prerequisite:** Java 25 and the Maven Wrapper are available; work from `backend/`.
- **Perform or inspect:** run `./mvnw --batch-mode --no-transfer-progress -Dtest=ProductApiTest test`, then trace one create request through controller, application service, Product, store, and response DTO.
- **Expected observation:** creation returns `201` with generated identity and Location; retrieval returns the same data; invalid, malformed, and missing cases receive the approved statuses without PostgreSQL.
- **Explain:** identify which layer coordinates, which layer decides validity, and which layer represents failures as HTTP.
- **Cleanup:** Maven creates ignored `target/` output; the test context and its process-local Product data end with the test run.
- **Proves / does not prove:** proves the in-process HTTP pipeline and Spring wiring; does not prove persistence, network deployment, restart durability, frontend behavior, or public security controls.

### Interview Drill

#### Explain the first Catalog API boundary

- **Expected reasoning:** HTTP contract, DTO separation, thin controller, application coordination, domain-owned invariants, typed error mapping, storage port, in-memory lifecycle, and explicit deferred scope.
- **Likely follow-up:** what concrete requirement would justify collection browsing, Bean Validation, richer errors, or PostgreSQL?
- **Short, 15-30 seconds:** the API adapts create and retrieve requests around Product while the application coordinates and the domain decides validity.
- **Technical, 1-2 minutes:** trace request-to-response responsibilities, explain safe exception translation, and state what temporary storage and MockMvc do not prove.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** simple `400` semantics or ProductStore versus direct map access.
- **Concept or boundary to explain:** Controller, application use case, and Product responsibilities.
- **Repository action:** inspect `ProductApiTest` and identify every boundary exercised by the create-and-retrieve case.

## Reference Surface

### Historical Context and Outcome

On 2026-09-18, Catalog had a framework-independent Product model and pure domain tests but no business HTTP interface, application orchestration, or Product storage. SS-010 adds Product creation and retrieval by identity through Spring MVC, with generated UUID identity, explicit DTOs, one application service, focused error translation, and temporary process-local storage. It does not add collection browsing, durable persistence, frontend integration, or deployment behavior.

### Implementation and Decision Evidence

`POST /api/products` accepts name and price, creates identity inside the system, and returns `201 Created`, a relative Location header, and a Product response DTO. `GET /api/products/{id}` returns that DTO with `200 OK`. Malformed representation, malformed UUID, and Product invariant failures map to `400`; an unknown valid UUID maps to `404`. Error bodies are intentionally not a stable contract.

`ProductApplicationService` coordinates `createProduct` and `getProduct`. `ProductStore` exposes only save and find-by-ID behavior. `InMemoryProductStore` uses `ConcurrentHashMap`, starts empty, and loses all data with the application process. Product and ProductId use typed `InvalidProductException` for their own invariant failures; the domain imports no Spring or HTTP type.

### Security, Verification, and Risks

Repository policy requires synthetic Product data, but the API does not verify data provenance. The change introduces no secrets, credentials, database connection, external integration, authentication, authorization, rate limiting, or explicit CORS configuration. Focused exception mapping returns status-only error responses and does not expose domain exception messages. The API is not a complete deployed public-interface security posture.

`ProductTest` remains a pure domain test, while `ProductApiTest` uses the full Spring application context and MockMvc without PostgreSQL. Java 25 verification with `./mvnw clean verify` passed 22 tests: 16 Product domain tests, five Product API tests, and one application health test, with no failures, errors, or skips. Static Compose validation and `git diff --check` also passed; pull-request CI evidence remains pending.

### Delivery History and Deferred Work

Issue #24 is the canonical scope and acceptance-criteria record. No pull request or review evidence exists yet. Collection browsing, update/delete behavior, filtering, search, ordering, pagination, stable JSON errors, richer validation semantics, PostgreSQL persistence, Testcontainers, frontend integration, authentication, authorization, CORS, rate limiting, deployment, and SS-011 remain deferred.

### Sources

- [Issue #24](https://github.com/Samska/samska-sandbox/issues/24)
- [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- [Architecture](../ARCHITECTURE.md)
- [Testing Strategy](../TESTING.md)
- [Security Engineering](../SECURITY.md)
- [Learning Journal Guide](README.md)
