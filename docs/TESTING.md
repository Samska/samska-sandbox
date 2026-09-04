# Testing Strategy

## Principle

Quality begins with the first feature. Testing is risk-based: use the smallest effective level of verification for the risk, and do not require every test type for every change.

Repository CI validates Markdown, local relative links, EditorConfig consistency, and the rendered Docker Compose configuration. The Compose check is static: it does not pull images or start PostgreSQL. The Java backend has a Spring Boot application/component smoke test that starts the embedded server on a random port and verifies the health endpoint. The React frontend has a Vitest and React Testing Library component smoke test that renders the foundation component and verifies its semantic heading and visible message in jsdom. Backend CI runs the Maven `clean verify` lifecycle and Frontend CI runs deterministic npm installation, TypeScript checking, component tests, and a production build on pull requests targeting `main`.

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

The SS-006 application/component smoke test is not a unit test: it verifies framework configuration, embedded-server startup, and the health endpoint together. No artificial unit tests exist because no isolated business behavior exists yet. Test infrastructure evolves with the product. Unit tests begin with business rules, persistence integration tests begin with persistence, and end-to-end tests begin when a stable user journey exists. See [the roadmap](ROADMAP.md) and [AI governance](AI-GOVERNANCE.md).

The SS-007 frontend test is also not a unit, backend integration, end-to-end, or real-browser test. It verifies user-visible component output through a simulated DOM. TypeScript checking catches static type errors, the Vite development server and Hot Module Replacement are manually verified locally, and the production build verifies static asset generation. These layers do not prove browser layout, deployed hosting, backend behavior, or a user journey.

The SS-008 PostgreSQL healthcheck verifies that the database server accepts connections inside its container. Separate `psql` execution verifies authentication and SQL query execution, while persistence/reset exercises verify the named-volume lifecycle. None of these proves Spring Boot connectivity, schemas, migrations, repositories, business persistence, or data correctness. Database-backed backend tests begin only when application persistence behavior exists.
