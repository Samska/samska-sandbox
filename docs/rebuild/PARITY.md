# R1 — frozen contract and parity matrix

## Baseline and authority

- Reference implementation: `ec92cd35073ea3b52afa13a740f75fb0788f6c2b`.
- Planning checkpoint: `f54491b50dc996da9128a7e3f6f9a1f39062b31d`.
- Owner approved from-scratch direction and R1 only: create/list/detail Product, existing stack/contracts/rules, English texts, accessible functional UI, no redesign, persistence, auth, hosting, cutover or removal.
- R1 expectations below were reviewed by Arquitetura and frozen **before implementation**, with 0 blockers and the raw-text validation clarification recorded below. Later changes require an explicit reason, review and owner decision for material behavior deviations, not adjustment to make tests pass.
- Java paths below are relative to `backend/src/main/java/io/github/samska/sandbox/`. Contract source: `catalog/api/ProductController.java`, `CreateProductRequest.java`, `ProductResponse.java`, `ProductApiExceptionHandler.java`; rules: `catalog/Product.java`; ordering: `catalog/storage/InMemoryProductStore.java`.

## Product wire contract

POST `/api/products` JSON input: `name`, `description`, `price`, optional nullable `mediaKey`. Successful response is **201**, relative `Location: /api/products/{id}`, and JSON with exactly six keys: `id` (UUID string), `name` (string), `description` (string), `price` (JSON number), `mediaKey` (string/null), `uploadedMediaId` (null in R1). GET collection is **200** JSON array of those responses; GET known ID is **200** with the same values. Do not add currency, version, data envelope or candidate flags to Product JSON. Identity is generated server-side.

Name/description must not be null/blank and are preserved as supplied: leading/trailing whitespace in a nonblank value is retained, blank-only is rejected. UI validation may trim only to check emptiness, never trim on change or submit; submitted values must match raw input. Price must not be null/negative; zero and fractional values beyond two places are valid, without rounding/two-decimal business restriction. mediaKey null/omitted is valid; otherwise regex `[a-z0-9]+(-[a-z0-9]+)*`, maximum 40 characters. Invalid body/input/UUID returns **400 without body**; unknown well-formed UUID **404 without body**. JSON coercion/content negotiation remain the same Spring/Jackson defaults as the reference; do not invent stricter rules without review.

## Matrix

| ID / scope | Frozen expectation / source | Oracle level | Planned evidence | Result / gap |
| --- | --- | --- | --- | --- |
| R1-C01 create | POST valid data → 201, Location, six-key body, UUID, exact name/description/mediaKey, numeric price, uploadedMediaId null; ProductController create/ProductResponse | HTTP | New API test, live candidate E2E, shape/status comparison with reference expectations | Pending implementation |
| R1-C02 collection | Fresh process returns `[]`; created Products appear once in insertion order (LinkedHashMap reference) with matching values | HTTP/store | Store/API tests and UI flow | Pending |
| R1-C03 detail | Known ID returns same full Product body, unknown UUID → empty 404; malformed UUID → empty 400 | HTTP | New API + adapter/UI tests; live read | Pending |
| R1-C04 required fields | Null/missing/blank name or description, null/missing/negative price → empty 400; rejection does not mutate collection | Domain expectations + HTTP | New domain cases and API unchanged-state assertions | Pending |
| R1-C05 money/text | Zero and nonnegative high-scale prices valid; no imposed currency/rounding; surrounding nonblank text retained | Domain expectations + HTTP | Exact BigDecimal domain/API cases; UI input permits fractional prices, no cents rule | Pending |
| R1-C06 media reference | Omitted/null mediaKey valid; valid slug retained, >40/uppercase/invalid slug/empty string rejected; no uploads in R1 | Domain expectations + HTTP | Boundary/API tests; optional UI field not required for creation | Pending |
| R1-C07 memory/ownership | Immutable values/copies, safe collection snapshot, new store isolated; process restart resets data. No client-provided ID or server-side legacy delegation | New design preserves observable reference behavior | Unit/store tests, live restart or independently fresh context, import/bean scan review | Pending |
| R1-U01 create/list/detail | English Name/Description/Price, Create Product, Products, View details/Back; accessible labels, heading/focus/feedback; empty/loading/pending/error/success and retry without speculative automatic POST replay | Reference UI behavior + RF8; layout not pixel parity | New RTL tests, candidate Playwright and required owner observation | Pending |
| R1-U02 error safety | A failed/uncertain create is not reported as saved; preserve form input and do not auto-repeat POST; list/detail read failure offers retry; malformed server payload is not accepted silently | Reference admin/API error semantics; R1 creation has no Payment-style idempotency | Mocked transport edge cases and live happy/invalid scenarios | Pending |
| R1-T01 isolation | Candidate identity GET `/api/rebuild/runtime` → 200 `{"runtime":"rebuild-r1"}`; health may be exposed; only R1 business methods. Standard runtime has no candidate mapping/beans. Other business capabilities absent, no fallback to old stores | Approved transition; technical endpoint not legacy product contract | Explicit Spring contexts, mapping/bean tests, no-legacy-import checks and identity-gated launcher/E2E | Pending |
| R1-T02 runtime/build | Same Java/Node toolchains; profile main CommerceApplication; entire candidate build under target/rebuild, standard under target; correct Start-Class; one runtime at a time; occupied ports refused without stopping owner; owned startup/teardown | Approved plan, not previous test outcome | Build/manifests, lifecycle probes and standard First Order E2E after candidate teardown | Pending |
| R1-T03 no regression | Current application source/capabilities not removed or cut over; standard unit/component/typecheck/build and real First Order still pass | Reference tests; can reuse black-box assertions | Full default checks plus standard E2E, diff review | Pending |

## Explicitly deferred

RF1 full PUT/DELETE, RF2 upload, RF3 full Admin, RF4 Cart/Checkout, RF5 Payment, RF6 Order and RF7 recovery are **not implemented by R1**. Their reference contracts remain unchanged in the standard application. No cutover, bridge, deletion coordination rewrite, new domain feature, release or public deployment is authorized. R1 does not claim First Order parity.

## Review and evidence

- Architecture contract review: completed before coding, 0 blockers. Reviewed C01–C07/U01–U02/T01–T03 against ec92cd3; accepted clarification that UI can trim for emptiness validation only, preserving raw submitted values. R1 expectations frozen at this preparation checkpoint.
- Qualidade verification and independent Revisor code review: pending until implementation.
- Human Verification: Required, pending after Agent Verification and independent code review, before implementation commit/PR.
- CI: not run; no PR authorization.
- Actual command outputs, worktree state and paths will be recorded in the R1 handoff; passing previous base tests is not passing this matrix.
