# SS-011: Catalog UI Foundation

- Status: Draft
- Work date: 2026-09-18
- Last reviewed: 2026-09-18
- Work item: [SS-011, Issue #26](https://github.com/Samska/samska-sandbox/issues/26)
- Pull request: None
- ADRs: None
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing Strategy](../TESTING.md), [Security Engineering](../SECURITY.md), and [SS-010 Catalog API](ss-010-catalog-api.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## Study Surface

A small Catalog UI consumes the existing API contract while local React state and a focused adapter keep Product rules in the backend.

### Must Remember

- **API consumer boundary:** the frontend consumes request and response contracts; Product invariants remain authoritative in the backend domain.
- **Local async state:** each form owns its inputs, pending state, result, and error so unrelated operations stay usable.
- **Status without error bodies:** user feedback maps known HTTP statuses without depending on an undocumented error JSON format.
- **Validation boundary:** frontend validation provides immediate UX feedback but does not normalize or duplicate backend business rules.
- **Component-test boundary:** mocked `fetch` verifies UI behavior and request construction without proving a live backend, proxy, or browser journey.

### Mental Model

```text
Create or lookup form -> local state -> Catalog API adapter -> HTTP contract -> backend Product rules
                         |                 |
                         +-> status/error <-+-> typed response or safe failure category
```

### Active Recall

#### Why should the Catalog form keep its price input as a string?

<details>
<summary>Answer guide</summary>

- Form text is distinct from the numeric API contract.
- Conversion can reject empty, non-finite, and negative values before submission without using partial parsing.
- The API still owns acceptance of Product data.

</details>

#### Why are `400` and `404` messages based on status rather than an error payload?

<details>
<summary>Answer guide</summary>

- SS-010 intentionally does not define a stable error-body contract.
- Status mapping provides useful feedback without coupling the UI to undocumented fields.

</details>

#### What does a mocked Catalog component test prove and not prove?

<details>
<summary>Answer guide</summary>

- It proves semantic UI behavior, request construction, local state transitions, and safe response handling.
- It does not prove Vite proxying, Spring behavior, CORS, a real browser, persistence, or an end-to-end journey.

</details>

### Decision Drills

#### Decision Drill: Focused browser API adapter

**Problem:** The first UI needs to use two HTTP endpoints without spreading transport details across presentation code.

**Options:** Call `fetch` directly in each form, introduce a data-fetching library, or use one focused adapter with native `fetch`.

**Decision:** Use a feature-local adapter with native `fetch`, explicit request and response types, response checks, and safe failure categories.

**Why:** The two endpoint operations are small and independent, while the adapter gives presentation code one typed boundary without adding a dependency or cache.

**Trade-off:** The adapter contains hand-written status and response validation that a larger client could standardize later.

**Reconsider When:** More API operations need shared caching, retries, cancellation, invalidation, or cross-screen coordination.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** native `fetch` adapter versus direct form requests or a data-fetching dependency.
- **Concept or boundary to explain:** local form validation versus backend-owned Product invariants.
- **Repository action:** inspect `web/src/catalog/catalogApi.ts` and identify where HTTP status and response-shape handling stop before presentation code.

## Reference Surface

### Historical Context and Outcome

On 2026-09-18, the repository had a React foundation and a Catalog API but no user-facing Product interaction. SS-011 adds one page with independent Create Product and Find Product forms. Both display loading, success, and failure feedback and render the returned Product data.

### Implementation and Decision Evidence

`catalogApi.ts` owns relative paths, request methods, JSON serialization, exact expected creation and retrieval statuses, response parsing, and minimal shape validation. It translates failures to `bad-request`, `not-found`, `network`, `server`, or `invalid-response` without reading unsuccessful response bodies.

The UI retains form values after success, clears only the active operation's stale state on retry, and disables only the active form while a request is pending. The Vite development server proxies `/api` to the local backend; this supports local development but does not establish production routing or CORS behavior.

### Security, Verification, and Risks

The implementation adds no dependency, environment value, secret, credential, browser persistence, backend expansion, or error-body display. Browser code and Vite configuration remain public. UI tests mock `fetch` and do not require Spring Boot, Docker, PostgreSQL, or network access.

JavaScript numeric conversion cannot preserve arbitrary Java `BigDecimal` precision or scale. The current JSON-number API contract has no currency, rounding, or scale policy, so the UI neither invents nor claims one.

### Delivery History and Deferred Work

Issue #26 is the canonical scope and acceptance-criteria record. No ADR is needed because local component state, native `fetch`, and a Vite development proxy are reversible implementation details. Collection browsing, update and deletion, stable error JSON, production routing, CORS policy, routing, global state, caching, E2E automation, persistence, and SS-012 remain deferred.

### Sources

- [Issue #26](https://github.com/Samska/samska-sandbox/issues/26)
- [Product](../PRODUCT.md)
- [Architecture](../ARCHITECTURE.md)
- [Testing Strategy](../TESTING.md)
- [Security Engineering](../SECURITY.md)
- [SS-010 Catalog API](ss-010-catalog-api.md)
