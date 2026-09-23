# Testing Strategy

## Principle

Quality begins with the first feature. Testing is risk-based: use the smallest effective level of verification for the risk, and do not require every test type for every change.

The Repository validation job in the `CI` workflow validates Markdown, local relative links, EditorConfig consistency, the rendered Docker Compose configuration, and that pull request bodies contain the required handoff headings from [the pull request template](../.github/pull_request_template.md) as defined in [AI governance](AI-GOVERNANCE.md#issue-and-project-handoff-protocol). The Compose check is static: it does not pull images or start PostgreSQL. The Java backend has pure Product and Cart domain unit tests, including Cart snapshot consistency and snapshot value-object independence, an in-memory Product store test for atomic replace and delete behavior, a pure coordination test that exercises both add/delete orderings including latch-controlled thread interleavings, a Spring Boot application/component smoke test that starts the embedded server on a random port and verifies the health endpoint, and Spring Boot plus MockMvc Catalog and Cart API component tests that exercise routing, JSON conversion, application coordination, full update and deletion semantics including `409` Cart conflicts, in-memory boundaries, and error translation. The React frontend has Vitest and React Testing Library component tests that render the Market, Admin Product-management, Cart, and Checkout UI in jsdom, mock feature-local `fetch` boundaries, and verify accessible shell semantics, navigation context and path selection, Product list and case-insensitive search, create/edit/delete request construction and confirmation, media mapping and fallback behavior, browse and Cart interactions, success rendering, loading behavior, focus return between browse and detail, Cart-drawer focus behavior, the quantity-summed Cart count, Checkout eligibility, entering Checkout without a Checkout request, direct Cart editing in Checkout (quantity increase, decrease, direct input, and removal), server-response rendering, pending and error states, contextual focus recovery after create, edit, delete, and removal, empty and no-match states, and relevant failure states. Browser layout, responsive behavior, real browser reload and history behavior, and rendered focus appearance remain Human Verification concerns. The Backend and Frontend jobs run Maven `clean verify`, deterministic npm installation, TypeScript checking, component tests, and a production build on pull requests targeting `main`.

The Backend job publishes the JUnit-compatible Surefire XML generated at `backend/target/surefire-reports/TEST-*.xml`. The Frontend job keeps Vitest console output and additionally generates JUnit-compatible XML at `web/test-results/junit.xml`. GitHub presents the parsed results through named Check Runs, failure annotations where source mapping is available, and workflow Job Summaries; the raw XML is retained as a short-lived diagnostic artifact. Reporting runs after an executed failing test command, while a separate workflow gate preserves the failed CI result. This is test-result publication, not code coverage: it does not add coverage collection, thresholds, badges, or PR comments.

## Intended Testing Layers

| Risk or Behavior | Preferred Verification |
| --- | --- |
| Business and domain rules | Unit tests |
| Persistence behavior | Integration tests, preferably against PostgreSQL with Testcontainers rather than H2 substitutes |
| Backend and API behavior | Component-level tests where appropriate |
| Cross-module coordination invariants | Focused application tests with controlled thread interleavings, stating the guaranteed scope and its limits |
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

The SS-007 foundation smoke test, SS-011 Catalog component tests, SS-028 Product UX Foundation tests, SS-031 Product Storefront tests, SS-032 Checkout tests, and SS-033 Admin Catalog tests are not backend integration, end-to-end, or real-browser tests. The Market, Admin, Cart, and Checkout tests mock `fetch`, so they verify frontend presentation, accessibility semantics, route selection, and transport handling without requiring Spring Boot, Docker, PostgreSQL, or network access; they verify behavior and semantics rather than styling implementation, and do not assert Tailwind utility classes. The SS-033 route selection is additionally exercised against the local Vite development and production preview servers: direct requests to `/`, `/admin/products`, and unknown paths return the application shell, which the client then resolves to the Market, Admin, or not-found surface. That check does not prove real browser reload, history navigation, or layout behavior; those remain Human Verification concerns. Tailwind CSS v4 generation is exercised through the Vite production build. The tests do not prove the Vite proxy, backend behavior, browser layout, rendered responsive behavior, rendered focus appearance, deployed hosting, or a full user journey. TypeScript checking catches static type errors, the Vite development server and Hot Module Replacement are manually verified locally, and the production build verifies static asset generation.

The SS-008 PostgreSQL healthcheck verifies that the database server accepts connections inside its container. Separate `psql` execution verifies authentication and SQL query execution, while persistence/reset exercises verify the named-volume lifecycle. None of these proves Spring Boot connectivity, schemas, migrations, repositories, business persistence, or data correctness. Database-backed backend tests begin only when application persistence behavior exists.
