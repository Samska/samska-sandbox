# Roadmap

## How To Read This Roadmap

This document describes durable product and engineering direction. Execution
tracking belongs in GitHub Issues and the [Samska Sandbox Project](https://github.com/users/Samska/projects/1).
Roadmap scope does not authorize unrequested work or guarantee a technology
choice before evidence supports it.

## Work-Item Identifiers

SS identifiers are immutable historical work-item identities. An identifier is
allocated only when the corresponding GitHub Issue is created. Roadmap
capabilities do not reserve future SS identifiers, and existing Issues are
never renumbered.

## v0.1.0: First Order

### Completed Historical Work

| Work | Historical Issues |
| --- | --- |
| Repository foundation, architecture, AI governance, and security | SS-001 through SS-004 |
| Repository validation and application CI foundations | SS-005 through SS-007 |
| PostgreSQL local infrastructure | SS-008 |
| Catalog Product domain, API, and UI | SS-009 through SS-011 |
| Learning, local development, verification, and CI reporting improvements | SS-018 through SS-025 |
| Shopping Cart vertical slice | SS-027 |
| Product UX Foundation | SS-028 |
| Product Discovery | SS-029 |
| Product Storefront UX/UI refinement | SS-031 |
| Checkout vertical slice | SS-032 |
| Admin Catalog Management | SS-033 |
| Product Media Upload | SS-034 |
| Payment Simulator (removed by SS-099) | SS-036 |
| Order creation | SS-037 |
| First Order end-to-end journey | SS-039 |
| Release v0.1.0 — First Order (published 2026-10-15) | SS-040, SS-041 |

### Future Product Sequence

SS-042 — Minimal real-browser First Order regression suite (#77) is
complete and merged via PR #78 (squash `eb829cc`, merged 2026-10-15). It adds
two Playwright/TypeScript Chromium tests that drive the real frontend through
the Vite proxy against a fresh, exclusively owned backend: the First Order
success journey with frozen data and focused keyboard/focus checks (simplified
to one Place order step by SS-099). Execution is serialized on Windows 11 Pro/Git Bash
locally and Ubuntu 24.04 in the Browser E2E CI job, using synthetic data and
existing APIs only. The next product capability is not yet selected. Future
capabilities receive their SS identifier when their Issues are created.

Admin Catalog Management (SS-033) is complete and merged through PR #56. Product
Media Upload (SS-034) is complete and merged through PR #58: one validated,
re-encoded JPEG per Product (stored in bounded backend process memory until SS-067 moved it to PostgreSQL), uploaded
media display precedence on Market cards and Product detail, the curated
`mediaKey` selection and the monogram fallback retained, and the no-upload
decision of ADR 0003 superseded by ADR 0004. Its endpoints are unauthenticated
and bound retained media, not peak memory; `/admin/products` remains navigation,
not an access-control boundary. Payment Simulator (SS-036) is complete and
merged through PR #62: it captures a revision-checked immutable Cart snapshot,
applies one of three explicit simulated outcomes, owns identified attempts with
UUID replay and GET reconciliation, and records at most one approval per
unchanged Cart revision in a bounded 32-attempt process-local store (persisted without the cap by SS-066). SS-099 removed the simulator again: Checkout places the Order directly ([ADR 0021](adr/0021-remove-the-simulated-payment.md)). CI test result
visibility (SS-035) was investigated separately and cancelled on 2026-09-28; its
issue is closed as not
planned and its pull request closed without merging, so it delivers nothing and
is not part of the product sequence.

Order creation copies the Cart snapshot into an immutable record, with same-request replay and lookup (originally from a frozen approved payment attempt, removed by SS-099); SS-049 later made that record durable in PostgreSQL. No full-page UI recovery or Cart clearing is introduced by that capability alone. Order creation (SS-037) is complete and merged through PR #67; the owner verified the main browser flow, while API replay, uncertain-response recovery, and accessibility remain unobserved real-browser checks for SS-037 itself. The First Order end-to-end journey (SS-039) is complete and merged through PR #70: `/checkout` and `/checkout/attempts/{attemptId}` recover the simulated result or frozen Order through read-only lookups after reload, direct entry, and history, keep the live Cart editable, and require explicit abandonment before a new journey replaces an unresolved reference.

Market Product-name search (SS-044, #81) is complete and merged via PR #82 (squash `8b32000`, merged 2026-10-15). It adds a local, case- and accent-insensitive substring filter on `Product.name` to the Market: the term lives in `Catalog` state while mounted so it survives Product details and Market → Checkout → Back to Market and resets only on a full-page reload; the term is never written to the URL, history, sessionStorage, localStorage, or logs, and never sent to the API — `GET /api/products` is unchanged and filtering runs entirely in the browser over the already-loaded list. Admin Catalog Management keeps its accent-sensitive filter (`String.prototype.toLowerCase` only) by decision; the documented difference is that Market is accent-insensitive and Admin is accent-sensitive. The existing focus-return mechanism is reused, with a fallback to the search input when the originating View details control is no longer in the map. No new dependency, server endpoint, persistence, accessibility test, ADR, or learning record is introduced. SS-045 (#84) introduced versioned agent instructions under `docs/agents/` and merged via PR #85 (squash `54b9afc`, merged 2026-10-16). The mandatory Orchestrator, role hierarchy, specialist catalogue, and Maestri adapter were superseded as active requirements on 2026-10-27; the historical files remain at commit `4ec11f8`, and the portable rules now live in `AGENTS.md` and AI Engineering Governance. SS-046 (#87) remains historical adoption evidence. SS-049 (#95) is complete and merged via PR #96: Orders and their items are durable in PostgreSQL through the existing OrderStore, the process-local 32-order guard is removed, PostgreSQL is required at startup, and Products, media, Cart, and Payment attempts remain in memory. SS-051 (#98) is complete and merged via PR #99 (squash `db9047b`, merged 2026-10-27); it removes the mandatory orchestration layer and establishes a bounded engineering loop without changing application behavior. SS-052 (#100) is complete and merged through PR #101, and SS-053 (#102) is complete and merged through PR #103: Candidate 03 is owner-approved for the reviewed catalog, foundations, and components, and SS-053 Batch 1 is owner-approved for the current-interface shell and functional Market at `revn 52`; both contain provisional illustrations and do not authorize application implementation or production adoption. SS-054 (#104) adds the Product detail and Cart drawer designs at `revn 78`, received qualified first-version visual acceptance, and is completed through merged PR #105. SS-055 (#106) adds the Checkout and simulated Payment designs at `revn 96`, including the approved minimal payment-attempt recovery surface; it received owner-reported visual acceptance “Parece ok” and is completed through Issue #106 and merged PR #107. SS-056 (#108) adds Order/recovery, Admin list/create/edit, and not-found/fallback designs and is owner-reported visually approved at its named version with the exact answer “Eu aprovo” (2026-10-29); the seven-file documentation is approved and commit/push is authorized. After successful push, the separate PR creation decision is the next gate. Production UI adoption remains a separate future decision. The next product capability remains unselected.

### MVP Boundaries

From v0.3.0 (SS-069) accounts, sessions and per-account Cart and Orders exist; the paragraph below is the v0.1.0 boundary and is kept as history. The local MVP deliberately deferred authentication and authorization. They are
deferred until after the local First Order MVP but are a mandatory prerequisite
for any hosted environment, and no hosting work begins before the MVP. Orders
and their items are persisted in PostgreSQL and survive a backend restart. Since
SS-065 (#125), SS-066 (#127) and SS-067 (#130), the single current Cart with its
revision, and Catalog Products with their uploaded media
are persisted too, so no application state is process-local any more. A Cart line
keeps its own name and price snapshot and has no foreign key to Catalog. The
Order placement captures the revision-checked Cart snapshot. Orders are
unauthenticated synthetic records in a loopback-only local database; the
application has no deployment environment.

## Versioning And Releases

Samska Sandbox uses Semantic Versioning at the product level. There is one
Samska Sandbox product release version; work-item identifiers and product
versions are independent. Releases are milestone-based rather than
Issue-based, and Git tags use `vMAJOR.MINOR.PATCH`.

Versions below `1.0.0` represent evolving, pre-stable product milestones. The
first release, `v0.1.0 — First Order`, was published on 2026-10-15 from commit
`23cebe2e08912d22f7364ad9f20198f9c92d2241` as a source-only release with
GitHub-generated archives and no additional assets; the annotated `v0.1.0` tag
is immutable. Its preparation (SS-040) and dependency remediation (SS-041) are
complete, and the [release notes](releases/v0.1.0.md) are reconciled to the
published state. See [Releasing](RELEASING.md) for the publication sequence and
the post-publication reconciliation.

## Release Plan To v1.0.0

Decided on 2026-11-27 (SS-068, [ADR 0012](adr/0012-adopt-release-plan-to-v1.md)). Each release is a milestone with a name, scope and exit criteria. A release is **delivered** when its scope is merged on `main` and its exit criteria hold; it is **published** (tag and GitHub Release) only under [Releasing](RELEASING.md) and the owner's authorization. Work-item identifiers are allocated when Issues are created, and the owner validates the product at v1.0.0.

Design baseline for every release is the owner-approved [Bench prototype](design/samska-store/README.md). Its "Next · design only" screens were approved as an identity direction, not as scope; each release below names the screens it builds and the gaps the prototype does not cover. A gap is designed in the same visual language before it is built, and recorded in the design record.

| Release | Name | Scope | Exit criteria | Design status |
| --- | --- | --- | --- | --- |
| v0.2.0 | Durable Store | Orders, Cart, Catalog and uploaded media in PostgreSQL (SS-049, SS-065 to SS-067); Bench identity applied to `web/` (SS-063, SS-064) | No state is lost on restart; browser journey passes against the real database | Bench approved |
| v0.3.0 | Accounts | Registration, sign-in and sign-out with synthetic accounts; server-side sessions; per-account Cart and Orders; an administrator role that guards Admin and media endpoints; CSRF protection | Anonymous visitors browse only; a customer cannot read another account's data; Admin is refused to customers; E2E journey runs signed in | Account screen in Bench. Gap: sign-out and signed-in header state |
| v0.4.0 | Order History and Tracking | Order history for the signed-in account; an Order status set by the administrator (placed, packed, shipped, delivered or cancelled; see ADR 0022, which replaced the first simulated lifecycle); tracking screen | History shows only own Orders; status changes are stored with their time; tracking reachable from history and Order result | Orders and Tracking screens in Bench (states: empty, list, packed, shipped, delivered, cancelled). Gap: none |
| v0.5.0 | Inventory | Stock quantity per Product; stock consumed when the Order is placed (a reservation on payment approval existed until SS-099); concurrency-safe decrement; inventory states on catalog and detail; stock field in Admin | No oversell under concurrent Orders; out-of-stock Products cannot be added or ordered | Inventory states and public demo banner in Bench. Gap: Admin stock field and reservation-expired message, designed in the existing form and notice patterns |
| v0.6.0 | Operations | An administrator Operations screen with figures from real data (Orders per hour, approval rate, checkout latency, error rate, service health) from Actuator and Micrometer; structured request logging with correlation IDs | Every figure is traceable to a stated query or metric; screen is admin-only | Operations screen in Bench. Gap: loading and empty states |
| v1.0.0 | Secured Public Demo | Security hardening (headers, rate limiting, production configuration without default credentials, secure cookies), containerized runtime and hosted-demo configuration, threat model, demo banner and synthetic-data reset, release documentation | Security checklist and threat model reviewed; all suites and E2E green on the release candidate; documentation matches behavior | Demo banner in Bench |

Limits that remain true at v1.0.0 and are never presented as resolved: synthetic data only with no payment, a single application process, no email or real couriers, no real identity provider. The mobile phone layout in Bench stays a responsive-web design; a native app is not part of 1.0.

Delivery state (2026-11-27): v0.2.0 to v1.0.0 are built on `release/1.0` and await the owner's validation; see the [v1.0.0 release notes](releases/v1.0.0.md). The owner added to v1.0.0 on 2026-11-27: sign-up and sign-in and two roles (buyer and administrator, delivered in v0.3.0), a manageable area separate from the customer area, and hosting on a VPS (SS-075, [Deployment](DEPLOYMENT.md)). On 2026-11-28 the owner removed self sign-up (SS-095): the administrator is the only user.

## Beyond v1.0.0

Decided on 2026-11-28 at the owner's request: after 1.0 the roadmap covers the whole project, not only features. This section replaces the earlier directional table, whose themes (Redis, RabbitMQ, React Native, microservices and others) are kept as the "Candidate pool" below and stay unscheduled until measured evidence exists.

Starting point (v1.0.0): a single-owner store on Railway at `store.samska.dev`; orders are approved at checkout and the administrator sets their status; a fixed catalog of 18 example Products with Bench illustrations; PostgreSQL holds all state; sessions, rate limits and request metrics live in one process; there is no Dependabot, code scanning, linter, accessibility automation, pagination, backup schedule or uptime monitor yet. Those gaps drive the order below.

Rules for every release: each release is a milestone with a theme, scope and exit criteria; a user-facing item needs an owner-approved HTML prototype before Build; work lands on a `release/x.y` branch and the release merges into `main` once, then is tagged; priorities are P1 (do first), P2 (do if the theme has room), P3 (candidate). Items are one line with the reason; Issues receive their SS identifier only when created.

### v1.1 — Solid Ground (trust what is already live)

Exit criteria: the live store can be restored from a backup, is watched, and every pull request is scanned and checked for accessibility.

| Area | Pri | Item | Why |
| --- | --- | --- | --- |
| Infra and ops | P1 | Scheduled PostgreSQL backups stored outside Railway, plus a documented restore drill | The only copy of Orders and accounts is one database; `backup.sh` was never exercised on the hosted setup |
| Infra and ops | P1 | External uptime and health monitor with a notification for `store.samska.dev` | Today an outage is noticed only by visiting |
| Infra and ops | P1 | Deploy from `main` with a post-deploy smoke test (sign in, list Products, place and cancel an Order) | Deploys currently trust CI only; a smoke test catches configuration mistakes such as the resolver 502 |
| Infra and ops | P2 | Decide whether to keep or retire the VPS/Caddy path | It is documented but unexercised; carrying it has a cost |
| Security | P1 | Dependabot for Maven, npm, Docker and Actions; CodeQL; secret scanning; pin Actions by SHA | No automated dependency or code scanning exists |
| Security | P1 | Sessions stored in PostgreSQL | Every restart or deploy signs the owner out and drops rate-limit state |
| Security | P1 | Optional TOTP second factor for the administrator | The owner's account controls Orders and the catalog and has only a password |
| Security | P1 | Progressive sign-in lockout per client address | Deferred from the pre-1.0 review; the limiter is per process today |
| Security | P2 | `security.txt`, CSP violation reporting, Admin audit log of status and catalog changes | Visibility into who changed what |
| Quality | P1 | Automated accessibility checks (axe) in Playwright for every screen, light and dark | Accessibility is a stated principle and today it is manual |
| Quality | P1 | ESLint, Prettier and a backend formatter wired into CI | There is no linter or formatter, so style drifts and mistakes reach review |
| Quality | P2 | Coverage reporting (JaCoCo, Vitest) as information without a threshold | Shows where tests are thin; no threshold until the numbers are understood |
| Quality | P2 | E2E on Firefox and WebKit for the main journey | Chromium only today |
| CI/CD | P2 | Faster CI: Maven and npm caches, parallel jobs, Testcontainers reuse | Feedback time shapes how often the owner can merge |
| CI/CD | P2 | Release workflow that builds notes and a GitHub Release from a tag | Publication is manual under RELEASING.md |
| Docs | P1 | Cut `docs/ROADMAP.md` and `PROJECT_HANDOFF.md` down to current state; move history to release notes | `ROADMAP.md` carries paragraphs of SS-0xx history that bury the plan |
| Docs | P1 | Operations runbook: deploy, roll back, rotate secrets, restore, rotate the administrator password | Knowledge now lives in chat and memory |
| Docs | P2 | ADR index review: mark superseded ADRs and add the missing payment-removal and single-user decisions | Several ADRs describe removed behavior |
| Cleanup | P1 | Remove code left by the single-user decision (customer role paths, reservation leftovers, simulated-courier copy) | Dead paths mislead readers and widen the attack surface |

### v1.2 — A Better Store (product and design)

Exit criteria: browsing, buying and administering feel like a complete small store, on phone and desktop.

| Area | Pri | Item | Why |
| --- | --- | --- | --- |
| Product | P1 | Categories or tags, sorting and filters on the Market | 18 Products already need more than a name search |
| Product | P1 | Server-side pagination and search for Products and Orders | Lists return everything; this limits growth and is a learning goal |
| Product | P2 | Multiple images and a gallery per Product | A single image per Product is thin for a store page |
| Product | P2 | Shipping address and order notes captured at checkout | An Order with no destination is unrealistic |
| Product | P2 | Printable order receipt | Gives the owner a tangible output of an Order |
| Product | P2 | Low-stock indicator and Admin stock adjustments with history | Inventory exists but has no operational view |
| Product | P3 | Discount codes; product variants (size, colour) | Realistic commerce rules to practice domain modelling |
| Admin | P2 | Catalog import and export (CSV) | Bulk changes without clicking each Product |
| Design | P1 | Design system page: tokens, components and states, kept with the prototypes | The owner decided design leads; a single reference stops drift |
| Design | P2 | Full accessibility pass: keyboard, screen reader, reduced motion, 200 percent zoom | Automated checks do not cover these |
| Design | P2 | Portuguese (pt-BR) interface alongside English | The owner works in Portuguese; also practices i18n |
| Design | P3 | Installable PWA | A phone-first owner could pin the store |
| Frontend | P2 | Route-level code splitting and image optimization (sizes, WebP) | Smaller first load, measured under v1.3 |

### v1.3 — Performance and Visibility

Exit criteria: the owner can answer "is it healthy and is it fast?" from data, and performance has budgets.

| Area | Pri | Item | Why |
| --- | --- | --- | --- |
| Observability | P1 | Structured logs and metrics shipped to a hosted viewer (Grafana Cloud or similar) | Metrics today reset on restart and live in one screen |
| Observability | P1 | OpenTelemetry tracing across web, backend and database | Request correlation IDs exist; traces show where time goes |
| Observability | P2 | Alerts on error rate, latency and failed health checks | Turns dashboards into action |
| Performance | P1 | Baseline load test (k6) of browse and checkout with recorded results | No performance number exists to improve against |
| Performance | P1 | Database indexes and query review driven by the load test | Pagination and filters add query patterns |
| Performance | P2 | Lighthouse CI with budgets for the web app | Prevents silent frontend regressions |
| Performance | P2 | HTTP caching with ETag for Product reads | Cheapest cache; do this before any Redis |
| Performance | P3 | Redis only if the baseline shows catalog read pressure | The old v0.3 theme, kept evidence-gated |

### v1.4 — Architecture and Data

Exit criteria: module boundaries are enforced by tests and the API is a documented contract.

| Area | Pri | Item | Why |
| --- | --- | --- | --- |
| Architecture | P1 | Enforce module boundaries with ArchUnit or Spring Modulith | ADR 0001 relies on convention only |
| Architecture | P1 | OpenAPI description generated from the backend; the web client typed from it | The contract is implicit in code and mocks |
| Architecture | P2 | In-process domain events and a transactional outbox | Decouples Order, Inventory and notifications without a broker |
| Architecture | P2 | Per-module package review for the modules that grew (Order, Operations) | Keeps the monolith modular |
| Data | P1 | Migration policy: expand-contract changes and a restore-then-migrate test | Flyway runs forward only |
| Data | P2 | Point-in-time recovery and retention rules | Beyond daily dumps |
| Data | P2 | Account data export and erasure for the owner | Practices data-governance habits on synthetic data |
| Data | P3 | Analytics views over Orders (daily sales, top Products) in Admin | First use of the data for decisions |

### v1.5 — Resilience and Reliability

Exit criteria: failure behavior is designed, measured and rehearsed.

| Area | Pri | Item | Why |
| --- | --- | --- | --- |
| Reliability | P1 | Service objectives (availability, checkout latency) and an error budget on the monitor | Defines "reliable" before improving it |
| Reliability | P1 | Failure-mode review and tests: database down, slow queries, deploy during checkout | Resilience needs known failure modes |
| Reliability | P2 | Graceful degradation: read-only Market when writes fail; clear UI errors | Turns outages into understandable states |
| Reliability | P2 | Rate limiting that survives restart and instance count (PostgreSQL or Redis) | Limits are per process today |
| Reliability | P3 | Small, safe chaos experiments in a staging copy | Only once monitoring and runbooks are trustworthy |
| Infra and ops | P2 | Staging environment from a branch deploy, with infrastructure as code for Railway | Repeatable environments; makes failure tests safe |

### Cross-cutting tracks (any release)

| Area | Item | Why |
| --- | --- | --- |
| Portfolio | Case-study page on the site: goals, architecture diagram, key ADRs, screenshots, what was learned | The project doubles as a portfolio piece |
| Portfolio | README and repository social preview kept current with each release | First impression for readers |
| Governance | Labels and GitHub milestones per release; Project board fields aligned with the release plan | Makes this roadmap visible in tracking |
| Governance | Review `AI-GOVERNANCE.md` yearly and after each release; trim rules that no longer pay for themselves | Process should shrink as trust grows |
| Learning | Keep `docs/learning/` notes only for decisions worth teaching; link them from ADRs | Prevents note sprawl |
| DX | Dev container and one-command local setup; script to reset local data | New machine, new session or new agent starts fast |
| DX | Pre-commit checks for formatting and secrets | Catch problems before CI |
| Security | Yearly threat-model refresh and dependency-risk review | Keeps the threat model true |

### Candidate pool (unscheduled, evidence-gated)

RabbitMQ or another broker (when synchronous workflows become slow or fragile), React Native (a justified mobile need), simulation engine, data engineering pipelines, chaos engineering at scale, evaluation of service extraction (v2.0, only with independently evolving boundaries and operational evidence). Real payments, real couriers and email are not planned; the store stays synthetic.

Any significant change to this direction requires the relevant documentation
and, when architectural, an ADR update. See [ARCHITECTURE.md](ARCHITECTURE.md)
and [the ADR guide](adr/README.md).
