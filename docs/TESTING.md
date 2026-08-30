# Testing Strategy

## Principle

Quality begins with the first feature. Testing is risk-based: use the smallest effective level of verification for the risk, and do not require every test type for every change.

No test framework, test suite, or CI test job is configured during repository bootstrap.

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

Test infrastructure evolves with the product. Backend tests begin with the backend, persistence integration tests begin with persistence, and end-to-end tests begin when a stable user journey exists. See [the roadmap](ROADMAP.md) and [AI governance](AI-GOVERNANCE.md).
