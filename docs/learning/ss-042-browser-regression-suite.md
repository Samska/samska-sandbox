# SS-042: Minimal Real-Browser First Order Regression Suite

- Status: In Build
- Work date: 2026-10-15
- Last reviewed: 2026-10-15
- Work item: [SS-042](https://github.com/Samska/samska-sandbox/issues/77)
- Pull request: None
- ADRs: [ADR 0007](../adr/0007-adopt-attempt-addressed-browser-recovery.md)
- Canonical documentation: [Testing](../TESTING.md), [Local Development](../LOCAL-DEVELOPMENT.md), [Security](../SECURITY.md)

## What you should learn

- What real-browser E2E tests add over API and jsdom component tests, and what they still cannot prove
- Why shared process-local state forces serialized execution and externally-scoped test isolation
- How to observe "no transactional resubmission" by counting browser-dispatched requests instead of asserting on internals
- Why owning the test lifecycle (ports, processes, readiness) is part of the test contract, not incidental tooling
- How process ownership boundaries differ between POSIX signals and native Windows termination

### Core — Know this for interviews

- Test level is a risk decision: the empty browser, real proxy, and real backend make reload, focus, and history behavior observable; domain permutations stay in faster tests
- Isolation must come from the environment's actual ownership model, not from test-framework conveniences like browser contexts
- A clean teardown is an acceptance criterion with measurable evidence, and its limits must be documented honestly

## Concepts explained

**Browser E2E as integration evidence.** jsdom tests mock `fetch`, so they prove component logic but not that a browser actually reloads a page, follows history, moves focus, or that the Vite proxy forwards to Spring Boot. A real-browser test substitutes the real stack for mocks precisely at the seams that mocked tests cannot cross. Its cost is speed, flakiness risk, and operational machinery.

**Isolation against shared process-local state.** A new browser context isolates cookies and storage, but every context talks to the same backend Cart. Test isolation therefore had to be built on the *backend's* boundaries: clear the Cart through the existing API before each test, use uniquely named synthetic Products, serialize with one worker, and accept that a fresh backend per invocation is the only real reset. This is the difference between isolation theater and isolation that matches the system under test.

**Observing absence of behavior.** "No transactional resubmission" is a statement about requests that must *not* happen. The suite attaches a page-level request listener and counts POSTs to `/api/payment-attempts` and `/api/orders`, then asserts exactly one of each across reloads, direct entry, cold contexts, and Back/Forward. Counting external effects is more trustworthy than asserting on internal flags.

**Owned lifecycle.** The suite starts its own backend and Vite server via Playwright's `webServer` with `reuseExistingServer: false`, so an occupied port is refused rather than silently absorbed. Measured evidence on Windows: both ports released 122 ms after normal exit, no owned descendants remained, and occupied-port runs left the existing owner and an unrelated sentinel process untouched.

**Termination boundaries.** On POSIX, a process group can be signaled coherently. On Windows, `gracefulShutdown` signals are ignored and cleanup relies on forceful tree termination; if the supervisor itself is hard-killed before cleanup runs, descendants keep running — reproduced deliberately: the backend JVM and Vite stayed alive holding their ports. Recovery is possible only with identity checks (command line referencing this repository, or the process owning the port), never by image name.

## How Samska uses it

`web/playwright.config.ts` defines the two owned servers, one worker, no retries, and failure-only artifacts. `web/e2e/global-setup.ts` proves readiness through the Vite proxy, not just port availability. `web/e2e/fixtures.ts` holds the synthetic-data and Cart-cleanup helpers plus the transactional-request observer; `web/e2e/first-order.spec.ts` contains the success journey with recovery and keyboard checks and the declined ineligibility test. Type accuracy is enforced by `web/tsconfig.e2e.json`, wired into the existing `tsc -b` typecheck, while Vitest discovery is explicitly scoped to `src/**/*.test.{ts,tsx}` so the two runners cannot overlap. The `.github/workflows/ci.yml` Browser E2E job runs the same command on Ubuntu with seven-day failure artifacts.

## Interview perspective

Expect questions like: why did you add browser tests when you already had 173 frontend tests, and how do you keep them from becoming flaky? A strong answer separates the evidence gap (real reload/history/focus/proxy behavior) from the risk controls (two tests only, no retries, serialized, fresh owned backend, existing-API isolation), quantifies teardown behavior, and states what the suite deliberately does not prove (screen readers, visual quality, cross-process durability, deployment routing) and why those stay Human Verification.

## What not to worry about yet

Cross-browser and mobile matrices, sharding, retry strategies, visual regression snapshots, accessibility automation, hosted-environment E2E, and persistence-backed fixtures. Each becomes relevant only when a concrete need and evidence justify the added cost.

## Reference

- Issue: [SS-042](https://github.com/Samska/samska-sandbox/issues/77)
- Pull request: None yet
- Relevant source files: `web/playwright.config.ts`, `web/e2e/global-setup.ts`, `web/e2e/fixtures.ts`, `web/e2e/first-order.spec.ts`, `web/tsconfig.e2e.json`, `.github/workflows/ci.yml`
- ADRs: [ADR 0007](../adr/0007-adopt-attempt-addressed-browser-recovery.md)
- Canonical documentation: [Testing](../TESTING.md), [Local Development](../LOCAL-DEVELOPMENT.md), [Security](../SECURITY.md)

### Why this design

Two tests were kept instead of a broad suite because the existing API and component tests already cover domain rules and failure permutations; only the browser-integration seams needed real evidence. Cold browser contexts were used for direct-entry recovery because they also prove that `sessionStorage` is not required for recovery. A 10-second teardown acceptance target was set so cleanup quality is measured, not assumed, and the forced-termination limitation is documented with a recovery procedure instead of being hidden behind an unqualified promise.

### Common mistakes

- Treating a new browser context as backend isolation in a system with a shared process-local Cart
- Asserting "no duplicate submission" through component state instead of counting real dispatched requests
- Using `getByLabel` with substring matching where increase/decrease button labels also contain the label text and trip strict mode
- Assuming Windows honors Unix signal semantics for child-process cleanup
- Letting Vitest's default discovery pick up `*.spec.ts` E2E files
