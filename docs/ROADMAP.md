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
| Payment Simulator (removed by SS-094) | SS-036 |
| Order creation | SS-037 |
| First Order end-to-end journey | SS-039 |
| Release v0.1.0 — First Order (published 2026-10-15) | SS-040, SS-041 |

### Future Product Sequence

SS-042 — Minimal real-browser First Order regression suite (#77) is
complete and merged via PR #78 (squash `eb829cc`, merged 2026-10-15). It adds
two Playwright/TypeScript Chromium tests that drive the real frontend through
the Vite proxy against a fresh, exclusively owned backend: the First Order
success journey with frozen data and focused keyboard/focus checks (simplified
to one Place order step by SS-094). Execution is serialized on Windows 11 Pro/Git Bash
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
unchanged Cart revision in a bounded 32-attempt process-local store (persisted without the cap by SS-066). SS-094 removed the simulator again: Checkout places the Order directly ([ADR 0021](adr/0021-remove-the-simulated-payment.md)). CI test result
visibility (SS-035) was investigated separately and cancelled on 2026-09-28; its
issue is closed as not
planned and its pull request closed without merging, so it delivers nothing and
is not part of the product sequence.

Order creation copies the Cart snapshot into an immutable record, with same-request replay and lookup (originally from a frozen approved payment attempt, removed by SS-094); SS-049 later made that record durable in PostgreSQL. No full-page UI recovery or Cart clearing is introduced by that capability alone. Order creation (SS-037) is complete and merged through PR #67; the owner verified the main browser flow, while API replay, uncertain-response recovery, and accessibility remain unobserved real-browser checks for SS-037 itself. The First Order end-to-end journey (SS-039) is complete and merged through PR #70: `/checkout` and `/checkout/attempts/{attemptId}` recover the simulated result or frozen Order through read-only lookups after reload, direct entry, and history, keep the live Cart editable, and require explicit abandonment before a new journey replaces an unresolved reference.

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
| v0.4.0 | Order History and Tracking | Order history for the signed-in account; a simulated shipment lifecycle (packed, left warehouse, out for delivery, delivered, or delayed) derived from a controllable clock; tracking screen | History shows only own Orders; shipment status is deterministic under a fixed clock; tracking reachable from history and Order result | Orders and Tracking screens in Bench (states: empty, list, in transit, delayed, delivered). Gap: none |
| v0.5.0 | Inventory | Stock quantity per Product; stock consumed when the Order is placed (a reservation on payment approval existed until SS-094); concurrency-safe decrement; inventory states on catalog and detail; stock field in Admin | No oversell under concurrent Orders; out-of-stock Products cannot be added or ordered | Inventory states and public demo banner in Bench. Gap: Admin stock field and reservation-expired message, designed in the existing form and notice patterns |
| v0.6.0 | Operations | An administrator Operations screen with figures from real data (Orders per hour, approval rate, checkout latency, error rate, service health) from Actuator and Micrometer; structured request logging with correlation IDs | Every figure is traceable to a stated query or metric; screen is admin-only | Operations screen in Bench. Gap: loading and empty states |
| v1.0.0 | Secured Public Demo | Security hardening (headers, rate limiting, production configuration without default credentials, secure cookies), containerized runtime and hosted-demo configuration, threat model, demo banner and synthetic-data reset, release documentation | Security checklist and threat model reviewed; all suites and E2E green on the release candidate; documentation matches behavior | Demo banner in Bench |

Limits that remain true at v1.0.0 and are never presented as resolved: synthetic data only with no payment, a single application process, no email or real couriers, no real identity provider. The mobile phone layout in Bench stays a responsive-web design; a native app is not part of 1.0.

Delivery state (2026-11-27): v0.2.0 to v1.0.0 are built on `release/1.0` and await the owner's validation; see the [v1.0.0 release notes](releases/v1.0.0.md). The owner added to v1.0.0 on 2026-11-27: sign-up and sign-in and two roles (buyer and administrator, delivered in v0.3.0), a manageable area separate from the customer area, and hosting on a VPS (SS-075, [Deployment](DEPLOYMENT.md)). On 2026-11-28 the owner removed self sign-up (SS-095): the administrator is the only user.

## Beyond v1.0.0

The earlier directional themes are kept as candidates after 1.0. None has measured evidence yet, so none is scheduled. A technology is evaluated only when an identified engineering problem justifies it.

| Candidate | Evidence That May Trigger Evaluation |
| --- | --- |
| Caching / Redis | Measured catalog read pressure or unacceptable latency |
| Event-driven processing / RabbitMQ | Synchronous workflows become slow, fragile, or operationally coupled |
| React Native | A justified mobile learning or product need exists |
| Infrastructure as Code | Repeated environment setup requires reproducibility and reviewability |
| Performance engineering | Performance risks or service objectives require measurement and tuning |
| Security engineering expansion | Threat-model or assessment findings justify additional controls |
| Data engineering and simulation engine | Analytics or simulation needs require governed data pipelines |
| Resilience, SRE and chaos engineering | Failure-mode analysis and reliable operational signals support them |
| v2.0: evaluate service extraction | Clear independently evolving boundaries and operational evidence justify it |

Any significant change to this direction requires the relevant documentation
and, when architectural, an ADR update. See [ARCHITECTURE.md](ARCHITECTURE.md)
and [the ADR guide](adr/README.md).
