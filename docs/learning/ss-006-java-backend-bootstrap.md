# SS-006: Java Backend Bootstrap

- Status: Active
- Work date: 2026-08-31
- Last reviewed: 2026-08-31
- Work item: [SS-006, Issue #12](https://github.com/Samska/samska-sandbox/issues/12)
- Pull request: [#13: feat(backend): bootstrap Java Spring Boot foundation](https://github.com/Samska/samska-sandbox/pull/13)
- ADRs: [ADR 0001: Adopt a Modular Monolith for v0.1](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing Strategy](../TESTING.md), [Security Engineering](../SECURITY.md), [GitHub Repository Controls](../GITHUB.md), and [Backend CI workflow](../../.github/workflows/backend-ci.yml)

## Mental Model

SS-006 established the smallest runnable backend baseline: a Java 25 JDK runs Maven Wrapper, the POM selects Spring Boot capabilities, and `clean verify` proves the embedded application and its health route start. Backend CI repeats that build on pull requests.

```text
Java 25 JDK -> Maven Wrapper -> Maven lifecycle -> POM / Spring Boot parent
                                                     -> web application -> /actuator/health
                                                     -> component smoke test -> Backend CI
```

## Learning Priorities

| Priority | Concepts | Why this level matters |
| --- | --- | --- |
| Core | Java platform and LTS decision; Maven lifecycle, Wrapper, and dependency model; Spring Boot bootstrap and component verification | They explain the entire path from source to a verified running service. |
| Important | Actuator health and security boundary; modular-monolith implications; backend CI and reproducibility | They explain why the baseline is deliberately small and how it is protected. |
| Supporting | Root package, exact tool versions, Windows CRLF and Unix executable handling, Mockito/JDK 25 warning | They are useful implementation evidence, but not separate primary study outcomes. |

## Active Recall

### Why did Samska need both a Java 25 requirement and Maven Wrapper?

<details>
<summary>Answer guide</summary>

A JDK supplies `javac` and the JVM; a historical runtime-only JRE does not compile. The POM and CI select Java 25, while the Wrapper provisions checksum-verified Maven 3.9.16 instead of relying on a local installation.

</details>

### How does `clean verify` give stronger evidence than compiling a class, and what does it not prove?

<details>
<summary>Answer guide</summary>

It removes prior output, compiles, tests, and verifies. SS-006 also starts a random-port server and calls health over HTTP, proving context, Actuator configuration, and route reachability. It does not prove business behavior, security controls, or persistence behavior.

</details>

### Why is the health test a component smoke test rather than a unit test?

<details>
<summary>Answer guide</summary>

`@SpringBootTest` starts a Spring context and random-port embedded server; the test then makes an HTTP request to health. Those cooperating components are not isolated unit behavior, and SS-006 had no business rule to unit-test.

</details>

## Core Concepts

### Java, JVM, JDK, and LTS

- **Meaning:** A JDK contains the compiler and JVM; a historical JRE was runtime-only. LTS is a support line, not a compatibility guarantee.
- **Samska application:** The POM and Backend CI use Temurin 25. Java 25 is LTS, Temurin supports it through at least September 2031, and Spring Boot 4.1.1 supports Java 17 through 26.
- **Decision value:** The greenfield backend starts on the current LTS.
- **Trade-off or failure boundary:** Java 21 is an older LTS and Java 26 is non-LTS; future dependencies still need Java 25 and Spring Boot 4 compatibility review.

### Maven and the Wrapper

- **Meaning:** Maven uses a declarative POM and standard lifecycle phases. Dependencies declared in the POM are direct; dependencies brought by them are transitive.
- **Samska application:** `clean verify` builds and tests the backend. Wrapper 3.3.4 in only-script mode provisions checksum-verified Maven 3.9.16 without a committed binary. The POM declares approved starters rather than manually versioning their libraries.
- **Decision value:** Maven fit one conventional application; the Wrapper makes the tool reproducible.
- **Trade-off or failure boundary:** Gradle was viable but its build-programming flexibility was not needed. Managed versions reduce incompatibility, but Spring Boot upgrades still need verification.

### Spring Boot Bootstrap and Component Verification

- **Meaning:** `@SpringBootApplication` combines standard bootstrap, component scanning, and auto-configuration. A component smoke test verifies cooperating framework and application pieces rather than isolated logic.
- **Samska application:** The root package `io.github.samska.sandbox` supports future package scanning. The parent aligns framework versions; `SamskaSandboxApplicationTests` starts a random-port server and requests health through Java's HTTP client.
- **Decision value:** It proves context, server, Actuator, and route without a fixed port, business API, or artificial unit test.
- **Trade-off or failure boundary:** Unit, persistence, and end-to-end tests wait for their corresponding behavior. Parent-managed upgrades remain deliberate verified changes.

## Important Concepts

### Health, Structure, and CI Boundaries

Health is the only intentional HTTP endpoint; discovery is disabled and details are hidden. It verifies startup, not authentication, authorization, CORS, rate limiting, vulnerability scanning, or deployment protection.

`backend/` remains one deployable application under ADR 0001. No empty domains, generic layers, or `services/` package were created; capabilities need behavior and ownership before they gain in-process contracts and boundary tests.

Backend CI is separate from documentation CI and runs `clean verify` with Temurin 25, read-only `contents`, disabled persisted credentials, immutable pins, and Maven caching. Caching improves feedback time, not dependency integrity or vulnerability assurance.

## Common Misconceptions

- Java, JDK, JVM, and historical JRE are interchangeable -> the JDK supplies compilation and execution tooling; the workstation's Java 8 JRE lacked a compiler during SS-006 local verification.
- LTS guarantees compatibility -> it provides a support line, while dependency and framework compatibility still need review.
- Spring Boot replaces Spring Framework -> Spring Boot configures and packages a Spring-based application.
- Maven only downloads dependencies -> it also models the project and runs lifecycle phases such as `verify`.
- `@SpringBootTest` is a unit test -> SS-006 starts an embedded server and exercises an HTTP route.
- Every resolved dependency is direct -> only the three starters appear directly in the POM.

## Hands-on Reinforcement

Run these from `backend/` with a Java 25 JDK. On Unix-like systems use `./mvnw`; on Windows Command Prompt or PowerShell use `mvnw.cmd`.

### Toolchain and Maven Lifecycle

```bash
java -version
javac -version
./mvnw --version
./mvnw clean verify
```

On Windows, use `mvnw.cmd --version` and `mvnw.cmd clean verify`. Explain why both `java` and `javac` matter, then identify the final command's evidence boundary.

### POM and Dependency Graph

Identify the POM's three direct starters and test scope, then run:

```bash
./mvnw dependency:tree
```

On Windows, use `mvnw.cmd dependency:tree`. Name one transitive dependency and explain why the POM does not declare its version. This is study validation, not original SS-006 evidence.

### Spring Boot Startup and Health

Start the application:

```bash
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run`. Call `http://localhost:8080/actuator/health` in another terminal, observe `status` `UP`, then stop with `Ctrl+C`. Explain its security boundary.

## Interview Practice

### How would you justify the SS-006 backend baseline?

- Expected discussion points: a greenfield, conventional single application; Java 25 LTS; Maven and Wrapper reproducibility; Spring Boot-managed dependency versions; health-only startup evidence; no premature domains or infrastructure; deliberate upgrade and compatibility review.
- Likely follow-up: Why was Gradle not selected, and what evidence would justify revisiting that decision?

### Why is the health check a component smoke test rather than a unit test?

- Expected discussion points: random-port embedded server, Spring context, Actuator configuration, real HTTP request, risk-based verification, no isolated business rule yet, and the boundary before persistence or end-to-end testing.

## Explanation Depth

### Platform Baseline

- **15-second thesis:** Samska chose Java 25, Maven Wrapper, and Spring Boot for a current-LTS, reproducible foundation for one conventional backend, then verified actual startup through health rather than inventing business behavior.
- **Approximately 1-minute expansion:** Temurin 25 provides the compiler and runtime; Maven Wrapper pins the build tool; the Spring Boot parent aligns the starters; and the smoke test proves the application and health route start. Compatibility review and later product behavior remain deferred.
- **Deeper evidence:** See the three Core Concepts and [Engineering Evidence and History](#engineering-evidence-and-history).

## Self-check

Without reading this record, I can:

- Reconstruct the path from Java source to a CI-verified health response.
- Explain Java, JDK, JVM, historical JRE, and why Java 25 was selected.
- Explain Maven lifecycle, Maven Wrapper, direct versus transitive dependencies, and Spring Boot version management.
- Distinguish the health test from a unit test and name its verification boundary.
- Explain why health-only Actuator exposure and one application fit the initial modular-monolith direction.
- Describe what Backend CI protects and what it does not prove.

## Engineering Evidence and History

### Starting Point and Result

SS-006 established the first application code. The repository previously had governance, architecture direction, and documentation CI, but no Java project, dependency manifest, application test, or backend CI. It added one Spring Boot 4.1.1 application in `backend/`, Java 25, Spring MVC, Actuator, test support, Maven Wrapper, and Backend CI. There is no business-domain code; health is the only intentional HTTP endpoint.

### Decisions, Alternatives, and Boundaries

- Java 21 and Java 26 were rejected for the current LTS and non-LTS reasons; Spring Boot 3.5 had no legacy constraint; Gradle remains viable if later complexity needs it.
- A custom health controller, context-only testing, and shell-managed startup were rejected because Actuator plus a random-port HTTP smoke test gives stronger startup evidence without a business API, fixed port, or cleanup failure.
- Spring Modulith, ArchUnit, Testcontainers, databases, security tooling, deployment, business domains, and distributed infrastructure were deferred because no behavior required them.
- The Windows Wrapper preserves CRLF through `.editorconfig` and `.gitattributes`; the Unix Wrapper executable bit was corrected in PR #13. Mockito's JDK 25 warning remains deferred because no mocks or related policy work are justified.

### Security and Verification

The direct set is small; Spring Boot manages versions, the Wrapper checksum-verifies Maven, and CI uses read-only permissions and immutable pins. The baseline has no authentication, authorization, deployment controls, vulnerability scanning, or dependency-update automation.

Historical verification used ephemeral Temurin 25.0.4.1 because the workstation default was a Java 8 JRE without a compiler. Maven Wrapper 3.9.16 passed `clean verify`; the packaged JAR started; health returned HTTP 200 with `UP`; `/actuator` and `/actuator/env` returned 404; and `actionlint` 1.7.12 passed after its Windows artifact checksum verification. PR #13 Backend CI, Repository CI, and GitGuardian passed.

### Delivery History

- **Plan:** Issue #12 approved the Java, Maven, Spring Boot, health-only, CI, and Learning Record direction while excluding business domains, persistence, distributed infrastructure, authentication, clients, and deployment.
- **Build:** The baseline added the Wrapper, application class, health configuration, smoke test, CI workflow, and the platform-specific Wrapper handling described above.
- **Review:** No formal GitHub review was submitted. Human review still had to assess dependencies, endpoint surface, CI security, and scope.
- **Pull Request:** PR #13 was merged on 2026-08-31 after Backend CI, Repository CI, and GitGuardian passed. Merge status is not evidence of independent review.

## Follow-up and Sources

- Add focused unit tests with the first business rule.
- Introduce PostgreSQL and Testcontainers only with persistence behavior.
- Review authentication, authorization, CORS, rate limiting, and Actuator exposure before public deployment.
- Revisit CodeQL, Dependabot, dependency review, and the Mockito warning only through separately justified work.
- [Issue #12](https://github.com/Samska/samska-sandbox/issues/12)
- [PR #13](https://github.com/Samska/samska-sandbox/pull/13)
- [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Eclipse Temurin support](https://adoptium.net/support/)
- [Maven Wrapper](https://maven.apache.org/wrapper/)
