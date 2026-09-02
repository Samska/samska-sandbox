# SS-006: Java Backend Bootstrap

- Status: Active
- Work date: 2026-08-31
- Last reviewed: 2026-09-02
- Work item: [SS-006, Issue #12](https://github.com/Samska/samska-sandbox/issues/12)
- Pull request: [#13: feat(backend): bootstrap Java Spring Boot foundation](https://github.com/Samska/samska-sandbox/pull/13)
- ADRs: [ADR 0001: Adopt a Modular Monolith for v0.1](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing Strategy](../TESTING.md), [Security Engineering](../SECURITY.md), [GitHub Repository Controls](../GITHUB.md), and [Backend CI workflow](../../.github/workflows/backend-ci.yml)

## Study Surface

The backend baseline makes Java, Maven, Spring Boot, and narrow startup verification reproducible without inventing business behavior.

### Must Remember

- The JDK supplies compilation and runtime; Maven Wrapper supplies the selected Maven build tool. They solve different reproducibility layers.
- Maven models the project and lifecycle; the POM declares direct dependencies while transitive dependencies and Spring Boot-managed versions remain resolved support.
- Spring Boot configures and packages a Spring-based application; it does not replace Spring Framework.
- The random-port HTTP smoke test proves application context, embedded-server startup, Actuator configuration, and health-route reachability, not business, persistence, or public-security behavior.
- Health-only Actuator exposure is a narrow operational boundary, not a complete API security posture.

### Mental Model

```text
JDK -> Maven Wrapper -> Maven lifecycle -> POM / Spring Boot
                                      -> application -> health smoke test -> Backend CI
```

### Active Recall

#### Why do the JDK and Maven Wrapper both matter?

<details>
<summary>Answer guide</summary>

- The JDK provides `javac` and the JVM for compilation and execution.
- The Wrapper provisions the selected Maven version rather than relying on a local Maven installation.

</details>

#### What does `clean verify` prove in this repository, and why does that boundary exist?

<details>
<summary>Answer guide</summary>

- This lifecycle executes the project test that starts a random-port server and calls health over HTTP.
- It proves startup and route reachability for cooperating components.
- No business rule, persistence behavior, authentication, authorization, CORS, rate limiting, or deployment behavior exists to prove yet.

</details>

#### Why is the health test a component smoke test rather than a unit test?

<details>
<summary>Hint</summary>

Consider what Spring and the embedded server do before the HTTP request runs.

</details>

<details>
<summary>Answer guide</summary>

- `@SpringBootTest` starts a Spring context and random-port embedded server.
- The test exercises Actuator and an HTTP route, so it is not isolated behavior.
- Unit tests begin when a business rule exists.

</details>

#### Why is Actuator health useful without becoming a business API?

<details>
<summary>Answer guide</summary>

- It provides an operational startup signal.
- Discovery is disabled and health details are hidden.
- It does not supply the public API security controls deferred for later work.

</details>

### Decision Drills

#### Decision Drill: Maven and Wrapper baseline

**Problem:** Build one conventional Spring Boot application reproducibly without requiring a separately installed build tool.

**Options:** Maven with Wrapper, Gradle, or a locally managed Maven installation.

**Decision:** Maven with Maven Wrapper and a declarative POM.

**Why:** The project had one conventional application and did not need Gradle build-programming flexibility; Wrapper standardizes Maven execution.

**Trade-off:** Gradle remains viable for future complexity, and managed dependency versions still require deliberate upgrade verification.

**Reconsider When:** Real multi-project or custom-build complexity creates an evidenced need for Gradle.

#### Decision Drill: Operational startup verification

**Problem:** Verify a runnable baseline without inventing a business API or relying on a fixed port or shell-managed process.

**Options:** A custom health controller, context-only test, shell startup, or Actuator health with a random-port HTTP smoke test.

**Decision:** Actuator health plus a random-port HTTP smoke test.

**Why:** It verifies the context, embedded server, configuration, and route through a real HTTP request.

**Trade-off:** It is intentionally narrow and does not prove business, persistence, security, or deployment behavior.

**Reconsider When:** New behavior introduces risks requiring unit, persistence, API, end-to-end, or security tests.

### Concept Cards

#### Spring Boot

- **Meaning:** Spring Boot supplies convention, auto-configuration, and packaging for a Spring application.
- **Samska application:** The parent and starters establish the initial application and test foundation.
- **Boundary or common mistake:** It builds on Spring Framework; it does not make compatibility, dependency security, or business design automatic.

#### Maven dependency model

- **Meaning:** The POM declares direct dependencies; transitives arrive through them and managed versions align supported libraries.
- **Samska application:** The backend declares Spring Boot starters and uses `clean verify` for lifecycle verification.
- **Boundary or common mistake:** A resolved dependency is not necessarily direct, and managed versions do not remove upgrade review.

### Hands-on Reinforcement

#### Inspect the dependency model

- **Prerequisite:** Java 25 JDK; work from `backend/`.
- **Perform or inspect:** inspect `pom.xml`, then run `./mvnw dependency:tree` on Unix-like systems or `mvnw.cmd dependency:tree` on Windows.
- **Expected observation:** direct starters appear in the POM and transitives appear in the resolved tree.
- **Explain:** identify one transitive dependency and why its version is not declared directly.
- **Cleanup:** none.
- **Proves / does not prove:** illustrates dependency resolution; does not prove vulnerability safety.

#### Verify the component boundary

- **Prerequisite:** Java 25 JDK; work from `backend/`.
- **Perform or inspect:** run `./mvnw clean verify` or `mvnw.cmd clean verify`, then inspect `SamskaSandboxApplicationTests`.
- **Expected observation:** the lifecycle passes and the test starts a random-port application before calling health.
- **Explain:** name what this proves and one behavior it cannot prove.
- **Cleanup:** Maven build output is generated; remove `target/` only if a clean workspace is required.
- **Proves / does not prove:** validates this component smoke boundary, not business or deployment behavior.

### Interview Drill

#### Justify the smallest backend baseline

- **Expected reasoning:** conventional single application, separate JDK/Wrapper responsibilities, Maven/POM dependency model, Spring Boot, health-only startup evidence, and deferred behavior-based layers.
- **Likely follow-up:** why Maven rather than Gradle, and what would justify changing the build choice?
- **Short, 15-30 seconds:** reproducible Java/Maven/Spring Boot baseline with honest startup evidence, not invented features.
- **Technical, 1-2 minutes:** reconstruct both Decision Drills and state the smoke-test/security boundaries.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** operational startup verification.
- **Concept or boundary to explain:** JDK versus Maven Wrapper, or component smoke test versus unit test.
- **Repository action:** inspect the POM or test and name its proof boundary.

## Reference Surface

### Historical Context and Outcome

SS-006 added the first application code: one Spring Boot 4.1.1 application in `backend/`, Java 25, Spring MVC, Actuator, test support, Maven Wrapper, and Backend CI. It added no business-domain code; health is the only intentional HTTP endpoint.

### Implementation and Decision Evidence

The POM targets Java 25; Backend CI selects Temurin 25. Maven Wrapper 3.3.4 in only-script mode provisions checksum-verified Maven 3.9.16. Java 21 and non-LTS Java 26 were rejected during the dated selection; Gradle, Spring Boot 3.5, Spring Modulith, ArchUnit, Testcontainers, databases, security tooling, deployment, business domains, and distributed infrastructure were deferred. Windows Wrapper CRLF and Unix executable handling were addressed; a Mockito/JDK 25 warning remained deferred.

### Security, Verification, and Risks

Actuator discovery is disabled and health details are hidden. The baseline has no authentication, authorization, deployment controls, vulnerability scanning, or dependency-update automation. Historical verification used ephemeral Temurin 25.0.4.1 after a workstation Java 8 JRE lacked a compiler; `clean verify`, packaged-JAR startup, health HTTP 200/`UP`, expected `/actuator` and `/actuator/env` 404s, and actionlint 1.7.12 passed. PR #13 Backend CI, Repository CI, and GitGuardian passed.

### Delivery History and Deferred Work

Issue #12 approved the Java, Maven, Spring Boot, health-only, CI, and Learning Record direction while excluding business domains, persistence, distributed infrastructure, authentication, clients, and deployment. No formal GitHub review was submitted. PR #13 merged on 2026-08-31; merge is not independent-review evidence. Add behavior-specific unit tests, persistence tests, and public API security controls only when their behavior exists.

### Sources

- [Issue #12](https://github.com/Samska/samska-sandbox/issues/12)
- [PR #13](https://github.com/Samska/samska-sandbox/pull/13)
- [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Maven Wrapper](https://maven.apache.org/wrapper/)
