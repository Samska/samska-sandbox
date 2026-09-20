# Testing Strategy

## Principle

Quality begins with the first feature. Testing is risk-based: use the smallest effective level of verification for the risk, and do not require every test type for every change.

The Repository validation job in the `CI` workflow validates Markdown, local relative links, EditorConfig consistency, and the rendered Docker Compose configuration. The Compose check is static: it does not pull images or start PostgreSQL. The Java backend has pure Product and Cart domain unit tests, a Spring Boot application/component smoke test that starts the embedded server on a random port and verifies the health endpoint, and Spring Boot plus MockMvc Catalog and Cart API component tests that exercise routing, JSON conversion, application coordination, in-memory boundaries, and error translation. The React frontend has Vitest and React Testing Library component tests that render the Catalog and Cart UI in jsdom, mock feature-local `fetch` boundaries, and verify accessible shell semantics, forms, browse and Cart interactions, request construction, success rendering, loading behavior, and relevant failure states. Browser layout, responsive behavior, and rendered focus appearance remain Human Verification concerns. The Backend and Frontend jobs run Maven `clean verify`, deterministic npm installation, TypeScript checking, component tests, and a production build on pull requests targeting `main`.

The Backend job publishes the JUnit-compatible Surefire XML generated at `backend/target/surefire-reports/TEST-*.xml`. The Frontend job keeps Vitest console output and additionally generates JUnit-compatible XML at `web/test-results/junit.xml`. GitHub presents the parsed results through named Check Runs, failure annotations where source mapping is available, and workflow Job Summaries; the raw XML is retained as a short-lived diagnostic artifact. Reporting runs after an executed failing test command, while a separate workflow gate preserves the failed CI result. This is test-result publication, not code coverage: it does not add coverage collection, thresholds, badges, or PR comments.

## Intended Testing Layers

| Risk or Behavior | Preferred Verification |
| --- | --- |
| Business and domain rules | Unit tests |
| Persistence behavior | Integration tests, preferably against PostgreSQL with Testcontainers rather than H2 substitutes |
| Backend and API behavior | Component-level tests where appropriate |
| Critical user journeys | Playwright and TypeScript end-to-end tests |
| Published cross-boundary behavior | Contract tests when independently evolving consumers or providers justify them |
| Capacity and latency risks | Performance tests when measurable performance questions exist |
| Security-relevant behavior | Security tests guided by threat and risk assessment |
| User accessibility | Accessibility tests for relevant UI changes and critical journeys |
| Failure behavior | Resilience tests when dependencies and failure modes exist |

## Test Selection

For each change, identify:

1. The behavior and risk being changed.
2. The fastest reliable level that can detect regression.
3. Any higher-level verification required for critical integration or user impact.
4. What is deliberately not tested and why, when that omission is material.

The SS-006 application/component smoke test is not a unit test: it verifies framework configuration, embedded-server startup, and the health endpoint together. SS-009 adds pure Product unit tests for isolated business behavior and invariants without starting Spring. SS-010 keeps those tests pure and adds a full-application-context MockMvc test for the Catalog HTTP pipeline without starting a network server or PostgreSQL. Test infrastructure evolves with the product. Persistence integration tests begin with persistence, and end-to-end tests begin when a stable user journey exists. See [the roadmap](ROADMAP.md) and [AI governance](AI-GOVERNANCE.md).

The SS-007 foundation smoke test, SS-011 Catalog component tests, and SS-028 Product UX Foundation tests are not backend integration, end-to-end, or real-browser tests. The Catalog and Cart tests mock `fetch`, so they verify frontend presentation, accessibility semantics, and transport handling without requiring Spring Boot, Docker, PostgreSQL, or network access; they verify behavior and semantics rather than styling implementation, and do not assert Tailwind utility classes. Tailwind CSS v4 generation is exercised through the Vite production build. The tests do not prove the Vite proxy, backend behavior, browser layout, rendered responsive behavior, rendered focus appearance, deployed hosting, or a full user journey; those remain Human Verification concerns. TypeScript checking catches static type errors, the Vite development server and Hot Module Replacement are manually verified locally, and the production build verifies static asset generation.

The SS-008 PostgreSQL healthcheck verifies that the database server accepts connections inside its container. Separate `psql` execution verifies authentication and SQL query execution, while persistence/reset exercises verify the named-volume lifecycle. None of these proves Spring Boot connectivity, schemas, migrations, repositories, business persistence, or data correctness. Database-backed backend tests begin only when application persistence behavior exists.
