# SS-006: Java Backend Bootstrap

- Status: Active
- Date: 2026-08-31
- Work item: [SS-006, Issue #12](https://github.com/Samska/samska-sandbox/issues/12)
- Pull request: Pending
- ADRs: [ADR 0001: Adopt a Modular Monolith for v0.1](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing Strategy](../TESTING.md), [Security Engineering](../SECURITY.md), [GitHub Repository Controls](../GITHUB.md), and [Backend CI workflow](../../.github/workflows/backend-ci.yml)

## Goal and Previous State

SS-006 established the first application code in Samska Sandbox. Before this work, the repository contained governance, architecture direction, documentation CI, and no Java project, runtime, dependency manifest, application tests, or backend CI.

## What Changed and Why

The `backend/` directory now contains one Spring Boot application built with Maven. It uses Java 25, Spring Boot 4.1.1, the Maven 3.9.16 wrapper, Spring MVC, Actuator, and Spring Boot test support. The application has no business-domain code. Its only intentional HTTP endpoint is Actuator health, used to prove startup without inventing a business API.

## Engineering Concepts

### Java, JVM, JDK, and LTS

Java source is compiled by a JDK, which includes the compiler and the JVM used to execute bytecode. A JRE historically referred to a runtime-only distribution; modern server development and CI normally install a full JDK. Java 25 is an LTS release and Eclipse Temurin supports it through at least September 2031. Java 21 is also LTS but is one LTS generation behind Java 25. Java 26 is newer but non-LTS, so its support window is much shorter.

Samska uses Temurin 25 in CI and compiles for Java 25. This gives a greenfield project the current LTS baseline while Spring Boot 4.1.1 supports Java 17 through Java 26. The trade-off is that future third-party dependencies need explicit Java 25 and Spring Boot 4 compatibility review.

### Spring Boot Bootstrap and Dependency Management

`@SpringBootApplication` combines the standard application bootstrap, component scanning, and auto-configuration. The main class is located in the root package `io.github.samska.sandbox`, allowing future project packages to be scanned without scanning external packages.

The Spring Boot Maven parent manages aligned versions of Spring, the embedded server, test libraries, and plugins. The POM declares only the approved capabilities and does not override managed transitive versions. This reduces incompatible dependency combinations, but upgrades to Spring Boot remain deliberate changes that require verification.

### Maven and the Wrapper

Maven uses a declarative POM and standard lifecycle phases. `clean verify` removes prior build output, compiles, tests, and verifies the project. The wrapper provides the repository-selected Maven 3.9.16 version to local machines and CI, avoiding reliance on an arbitrary Maven installation. It uses Maven Wrapper 3.3.4 in only-script mode, so no wrapper binary is committed; the Maven distribution download is SHA-256 verified.

Gradle was considered because it is equally supported by Spring Boot and can be more flexible for complex builds. Maven was selected because this one conventional Spring Boot application has no custom build-logic or multi-project needs. The trade-off is less build-programming flexibility if later requirements justify it.

### Testing Foundation

The project contains one application/component smoke test, not a unit test. It starts the embedded server on a random port and requests `/actuator/health`, proving context initialization, embedded-server startup, Actuator configuration, and the reachable health route. No artificial unit tests were added because no isolated business behavior exists yet.

Unit tests should begin when business rules exist. Persistence integration tests, including PostgreSQL and Testcontainers, must wait for actual persistence behavior. End-to-end tests must wait for a stable user journey.

### Modular Monolith and Structure

`backend/` is one deployable application, consistent with ADR 0001. No empty catalog, cart, orders, payments, inventory, shared, or generic-layer packages were created. A future business capability should be introduced with its behavior and ownership in one package, then gain explicit in-process contracts and focused boundary tests when dependencies exist. A directory named `services/` was rejected because it would imply independent services that do not exist.

### Backend CI

Backend CI is separate from documentation CI because they validate independent artifact types. It runs on pull requests to `main`, checks out without persisted credentials, has only `contents: read`, pins actions to immutable commit SHAs, installs Temurin 25, caches Maven dependencies, and fails on `clean verify` errors. Caching improves feedback time but is not dependency-integrity or vulnerability assurance.

## Alternatives and Trade-offs

- Java 21 LTS was rejected because Java 25 is the current LTS and Java 21 is one LTS generation behind it.
- Java 26 was rejected because it is non-LTS.
- Spring Boot 3.5 was rejected because no legacy ecosystem constraint justifies starting on the prior major release.
- Gradle was rejected for the current conventional, single-application build; it remains viable if demonstrated build complexity needs its flexibility.
- A custom health controller was rejected because Actuator already supplies health without creating a business API.
- Context-only testing and shell-managed CI startup were rejected because the random-port smoke test proves real server and endpoint startup without fixed-port or cleanup failures.
- Spring Modulith, ArchUnit, Testcontainers, databases, security tooling, and deployment were deferred because no current behavior requires them.

## Security and Verification

The direct dependency set is deliberately small. Versions are managed by Spring Boot, Maven downloads are checksum verified by the wrapper, and CI uses read-only permissions, disabled persisted credentials, and immutable action pins. Health is the only intentionally exposed HTTP endpoint; discovery is disabled and health details are hidden. The baseline does not provide authentication, authorization, public deployment protections, vulnerability scanning, or dependency-update automation.

Local verification used an ephemeral Temurin 25.0.4.1 JDK because the workstation default was a Java 8 JRE without a compiler. Maven Wrapper 3.9.16 passed `clean verify`: it compiled the application and ran the application/component smoke test successfully. The packaged JAR started successfully; `/actuator/health` returned HTTP 200 with status `UP`, while `/actuator` and `/actuator/env` returned 404. `actionlint` 1.7.12 passed for the backend workflow after its official Windows artifact checksum was verified. Backend CI has not run yet because no pull request has been created.

## Failure Modes and Safeguards

- A developer can use an incompatible JDK. The POM, CI, README, and wrapper establish Java 25 and Maven 3.9.16 expectations.
- A dependency version can drift or become incompatible. Keep managed versions under Spring Boot and verify deliberate upgrades.
- The server can start but its intended route can fail. The random-port smoke test calls health over HTTP.
- An Actuator endpoint can reveal operational data. Keep discovery disabled, expose only health, and review exposure again before deployment.
- Empty packages or generic abstractions can be mistaken for architecture. Add module structure only with behavior and ownership.
- CI can be granted unnecessary capability. Retain read-only permissions, disabled credentials, immutable pins, and failing build behavior.

## Plan, Build, Review, and Pull Request Lessons

### Plan

Issue #12 approved Java 25, Temurin, Maven, Spring Boot, `backend/`, health-only Actuator exposure, a separate backend workflow, and an evidence-based Learning Record. It explicitly excluded business domains, persistence, distributed infrastructure, authentication, clients, and deployment.

### Build

The implementation added Maven Wrapper 3.3.4 in only-script mode, a SHA-256-verified Maven 3.9.16 distribution, one Spring Boot application class, health-only Actuator configuration, one application/component smoke test, and a separate backend CI workflow. It preserves the official CRLF line ending for the Windows Maven Wrapper through an explicit EditorConfig exception and a narrow Git attributes checkout rule. `clean verify`, packaged-JAR startup, health verification, unintended-Actuator-endpoint checks, and actionlint passed locally with ephemeral Temurin 25.0.4.1.

### Review

No formal review evidence exists yet. Human review must confirm the selected dependencies, endpoint surface, CI security settings, and absence of out-of-scope implementation.

### Pull Request

No pull request exists yet. Add its link, review findings, verification evidence, and residual risks when one is created.

## What the Project Owner Should Understand

The project uses a current Java LTS and a conventional Spring Boot/Maven baseline to minimize initial configuration and dependency risk. Maven's wrapper standardizes the build tool; Spring Boot's parent manages coherent library versions; the component smoke test proves that the actual web application and health route start; and a modular monolith begins with one deployable application, not empty module folders or microservices.

## Interview Practice

### Questions

- Why select Java 25 over Java 21 or Java 26 for a greenfield backend?
- What do the JDK, JVM, and historical JRE provide?
- Why use the Spring Boot parent instead of versioning every dependency?
- Why is the health test a component smoke test rather than a unit test?
- Why choose Maven over Gradle for this repository?
- How does this structure support a modular monolith without premature abstraction?
- What GitHub Actions practices reduce CI supply-chain and token risk?

### Interview-Ready Explanation

Samska bootstrapped one Spring Boot backend with Java 25 LTS and Maven because the project was a conventional single application with no custom build requirements. Spring Boot manages compatible dependency versions, while Maven Wrapper fixes the Maven version for developers and CI. We exposed only Actuator health and verified it through an application/component smoke test that starts a real embedded server on a random port. We did not create fake domain modules, databases, or infrastructure; future modular-monolith boundaries will be introduced with real business behavior and ownership.

## Follow-up and Sources

- Add focused unit tests with the first business rule.
- Introduce PostgreSQL and Testcontainers only when persistence behavior is implemented.
- Review authentication, authorization, CORS, rate limiting, and Actuator exposure before public deployment.
- Revisit CodeQL, Dependabot, and dependency review in separately justified work.
- Investigate the Mockito dynamic-agent warning when test-library configuration or JDK policy work is otherwise justified; no mocks are currently used.
- [Issue #12](https://github.com/Samska/samska-sandbox/issues/12)
- [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- [Spring Boot system requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Eclipse Temurin support](https://adoptium.net/support/)
- [Maven Wrapper](https://maven.apache.org/wrapper/)
