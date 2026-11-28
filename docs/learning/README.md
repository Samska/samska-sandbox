# Engineering Learning Journal

## Purpose

The Engineering Learning Journal preserves durable, evidence-linked technical mini-lessons from Samska Sandbox work. It supports interview preparation and engineering development by explaining important concepts, decisions, and boundaries in the context of the repository.

Learning Records are passive and non-blocking by default. They complement Issues, pull requests, ADRs, and technical documentation; those artifacts remain authoritative for their respective responsibilities.

## Delivery Workflow

Engineering work follows this workflow:

```text
Issue -> Plan -> human review -> Build -> engineering review -> Human Verification when required -> commit -> PR -> CI/review -> merge -> Done
```

Within Build, the agent follows the [Build Authorization and Execution Loop](../AI-GOVERNANCE.md#build-authorization-and-execution-loop). Learning never interrupts that sequence.

Learning Records may be created or updated during relevant work, but learning never blocks engineering progression:

- No learning question may block Build.
- No quiz or self-check may block pull request creation.
- No checkpoint may block merge.
- No retrieval exercise requires a human response.
- Agents must not wait for learning answers before continuing engineering work.
- Active study or review happens only when the human explicitly requests study/review mode.
- Post-Issue learning summaries may be provided without requiring interaction.

Human engineering review remains required where the workflow calls for it. Engineering review is not a learning gate.

## Structure

| File | Purpose |
| --- | --- |
| [000-template.md](000-template.md) | Reusable mini-lesson Learning Record format. |
| [ss-002-architecture-principles.md](ss-002-architecture-principles.md) | Modular-monolith boundaries and ADR reasoning. |
| [ss-003-ai-engineering-governance.md](ss-003-ai-engineering-governance.md) | Human accountability in AI-assisted engineering. |
| [ss-004-github-repository-security.md](ss-004-github-repository-security.md) | Repository security controls and evidence boundaries. |
| [ss-005-repository-documentation-ci.md](ss-005-repository-documentation-ci.md) | Risk-based CI and workflow security. |
| [ss-006-java-backend-bootstrap.md](ss-006-java-backend-bootstrap.md) | Java backend baseline and verification boundaries. |
| [ss-007-react-application-bootstrap.md](ss-007-react-application-bootstrap.md) | React frontend baseline and browser/tooling boundaries. |
| [ss-008-postgresql-local-development.md](ss-008-postgresql-local-development.md) | PostgreSQL container, networking, readiness, and data-lifecycle boundaries. |
| [ss-009-product-domain.md](ss-009-product-domain.md) | Catalog-owned Product identity, invariants, and framework-independent domain behavior. |
| [ss-010-catalog-api.md](ss-010-catalog-api.md) | Catalog HTTP contracts, application coordination, DTOs, error mapping, and temporary storage. |
| [ss-011-catalog-ui.md](ss-011-catalog-ui.md) | Catalog UI, typed API consumption, local state, accessible feedback, and mocked component tests. |
| [ss-021-local-development-workflow.md](ss-021-local-development-workflow.md) | Repository-owned local setup, runtime boundaries, and setup-change reporting. |
| [ss-023-local-development-launcher.md](ss-023-local-development-launcher.md) | Bash process supervision, signal-safe local orchestration, and non-interactive Node selection. |
| [ss-024-human-verification-workflow.md](ss-024-human-verification-workflow.md) | Evidence provenance, human verification, and automation boundaries. |
| [ss-025-ci-test-result-publication.md](ss-025-ci-test-result-publication.md) | JUnit XML reporting, CI evidence, failure propagation, and remote-only verification. |
| [ss-026-repository-workflow-governance.md](ss-026-repository-workflow-governance.md) | Workflow organization, repository metadata, release milestones, and documentation boundaries. |
| [ss-027-shopping-cart.md](ss-027-shopping-cart.md) | Cart aggregates, Catalog contracts, quantity invariants, price snapshots, state ownership, and risk-based verification. |
| [ss-028-product-ux-foundation.md](ss-028-product-ux-foundation.md) | Product-oriented hierarchy, responsive UX foundations, accessible interaction design, local state, and risk-based frontend verification. |
| [ss-029-product-discovery.md](ss-029-product-discovery.md) | Domain and API contract enrichment, strict response validation, local Product selection and detail flow, and accessible in-page navigation. |
| [ss-030-issue-project-handoff.md](ss-030-issue-project-handoff.md) | Structured Issue and pull request handoff, template enforcement boundaries, and snapshot scope. |
| [ss-031-product-storefront.md](ss-031-product-storefront.md) | Storefront information hierarchy, container/component boundaries, repetition-driven primitives, feedback tones, optional media reference with fallback, accessible Cart drawer, and focus management. |
| [ss-032-checkout.md](ss-032-checkout.md) | Live Checkout review over the current Cart, single source of truth in the frontend, atomic Cart reads, and deferring the transactional snapshot to Payment. |
| [ss-033-admin-catalog.md](ss-033-admin-catalog.md) | Real URL routing without a router, navigation versus authorization, cross-module coordination without cycles, scoped concurrency guarantees, atomic replace/delete, and captured Cart snapshots. |
| [ss-034-product-media-upload.md](ss-034-product-media-upload.md) | Untrusted upload validation, layered limits versus peak memory, atomic parent/child publication, linearization and versioned media identity, and fallback-first rendering. |
| [ss-036-payment-simulator.md](ss-036-payment-simulator.md) | Idempotent attempt identity, revision-checked atomic snapshots, Payment → Cart lock ordering, one approval per revision, bounded capacity without eviction, and honest unconfirmed-outcome handling. |
| [ss-037-order-creation.md](ss-037-order-creation.md) | Order ownership, value copies, one Order per approved attempt, replay before capacity, and honest two-lookup reconciliation. |
| [ss-038-bdd-human-verification-pilot.md](ss-038-bdd-human-verification-pilot.md) | Optional scenario-based evidence, scenarios as plans versus evidence, expected/actual separation, blocked attempts versus product failures, same-revision payment sequencing, and owner review of agent evidence. |
| [ss-039-first-order-journey.md](ss-039-first-order-journey.md) | Attempt-addressed URL recovery, GET-only reconciliation, pending-operation guards, stale-response invalidation, honest absence, and explicit abandonment. |
| [ss-067-catalog-persistence.md](ss-067-catalog-persistence.md) | Stable list ordering with an identity column, IDs instead of bytes in lists, advisory-lock serialization of an aggregate budget, and snapshots without foreign keys. |
| [ss-066-payment-persistence.md](ss-066-payment-persistence.md) | Constraint-enforced invariants with a partial unique index, reading the winner of a race, frozen snapshot rows, and dropping a memory-only limit. |
| [ss-069-accounts-and-sessions.md](ss-069-accounts-and-sessions.md) | Server-side sessions, cookie-to-header CSRF, ownership as a port, 404 over 403, and uniform sign-in failures. |
| [ss-070-derived-state.md](ss-070-derived-state.md) | Derived versus stored state, an injected clock for deterministic tests, and stable pseudo-randomness from an identifier. |
| [ss-071-inventory-reservations.md](ss-071-inventory-reservations.md) | Reserving then consuming stock in one transaction, ordered row locks, and expiry without a scheduler. |
| [ss-072-observability.md](ss-072-observability.md) | Correlation IDs, MDC, structured request logs, Micrometer meters, and reporting honest "no data" figures. |
| [ss-073-rate-limiting-and-hardening.md](ss-073-rate-limiting-and-hardening.md) | Fixed-window rate limiting, why lockout can backfire, fail-closed production configuration, and a threat model. |
| [ss-074-demo-mode-and-containers.md](ss-074-demo-mode-and-containers.md) | Multi-stage images, trusting a reverse proxy, and a safe synthetic-data reset. |
| [ss-075-admin-area-and-vps.md](ss-075-admin-area-and-vps.md) | Interface versus server authorization, TLS termination with a reverse proxy, and tested backups. |
| [ss-076-railway-deployment.md](ss-076-railway-deployment.md) | Configuring one image by environment, failing closed, and what a platform's proxy changes about client addresses. |
| [ss-077-empty-state-design-fix.md](ss-077-empty-state-design-fix.md) | Prototype fidelity in the running app and one shared component for a repeated pattern. |
| [ss-078-theme-switch.md](ss-078-theme-switch.md) | Layering a user theme override over the system preference, flash-free loading under a strict CSP, and failure-tolerant storage. |
| [ss-079-image-build-in-ci.md](ss-079-image-build-in-ci.md) | Why deployment artifacts are built in CI, and the Maven wrapper's dependency on `unzip`. |
| [ss-098-sample-catalog.md](ss-098-sample-catalog.md) | Idempotent seeding by natural key, and permanent example data. |
| [ss-084-product-art.md](ss-084-product-art.md) | Theme-aware inline SVG, and a safe data migration in a seed. |
| [ss-090-orders-catalog-number.md](ss-090-orders-catalog-number.md) | A customer-facing number beside a UUID key, and migrating a populated table. |
| [ss-086-clear-cart-on-order.md](ss-086-clear-cart-on-order.md) | Side effects after a commit, idempotent replays, and changing a documented decision. |
| [ss-088-self-hosted-fonts.md](ss-088-self-hosted-fonts.md) | Content-Security-Policy against third-party fonts, subsetting, and cache lifetimes. |
| [ss-097-admin-order-status.md](ss-097-admin-order-status.md) | Storing changes as events, and keeping a side effect correct with one transaction and a row lock. |
| [ss-095-remove-self-sign-up.md](ss-095-remove-self-sign-up.md) | Removing an attack surface instead of guarding it, and why roles outlive sign-up. |
| [ss-091-plain-copy.md](ss-091-plain-copy.md) | Error messages as interface, and stale messages as defects. |
| [ss-081-demo-sample-products.md](ss-081-demo-sample-products.md) | Idempotent seeding of demo data and why it must not overwrite existing data. |
| [ss-080-web-dns-resolver.md](ss-080-web-dns-resolver.md) | Why the web image must use the platform's DNS resolver, and how it was verified. |
| [ss-065-cart-persistence.md](ss-065-cart-persistence.md) | Transactional update contract for a mutable aggregate, row-lock serialization of a business revision, domain rules kept out of the store, and snapshot rows without a foreign key. |
| [ss-049-order-persistence.md](ss-049-order-persistence.md) | Port-first PostgreSQL persistence, unique-key idempotency, transaction rollback versus lost responses, restart evidence, and bounded database-failure behavior. |
| [ss-040-release-preparation.md](ss-040-release-preparation.md) | Release preparation versus publication, annotated immutable tags, source-only releases, build metadata versus product version, and exposure-based dependency triage. |
| [ss-041-dependency-remediation.md](ss-041-dependency-remediation.md) | Lockfile-only dependency remediation (`undici`, `source-map-js`), minimum patched version versus latest, integrity validation with `npm ci`, and alert-database state versus installed version. |
| [ss-042-browser-regression-suite.md](ss-042-browser-regression-suite.md) | Real-browser E2E boundaries, isolation against shared process-local state, observing unsubmitted transactions, owned lifecycle and teardown evidence, and Windows termination limits. |
| [ss-045-agent-role-instructions.md](ss-045-agent-role-instructions.md) | Instruction layering, authority versus permission, evidence provenance, adapter drift detection, and bounded validation of tool integration. |
| [ss-046-agent-instruction-adoption.md](ss-046-agent-instruction-adoption.md) | Delivery versus adoption, committed-hash scope, bounded hypothetical probes, and keeping validation-only agents separate. |
| [ss-047-temporary-agent-lifecycle.md](ss-047-temporary-agent-lifecycle.md) | Explicit persistent/temporary classification, evidence retention before dismissal, dismissal versus deletion, and procedural versus automatic cleanup. Historical Maestri procedure; the SS-047 authorization remains in force. |
| [ss-051-portable-agent-instructions.md](ss-051-portable-agent-instructions.md) | Portable instruction entry points, bounded Build execution, covered versus separately authorized actions, review classification, historical supersession, and content-level work preservation. |
| [ss-052-penpot-design-workflow.md](ss-052-penpot-design-workflow.md) | Hosted MCP with an active browser tab, tokens versus component instances, canvas organization and editor-label spacing versus isolated exports, candidate identity through exports and hashes, free-plan evidence durability, design review versus browser verification, and credential handling. |
| [ss-053-headless-penpot-market-design.md](ss-053-headless-penpot-market-design.md) | Authenticated headless runtime boundaries, team-context routing, diagnosing an empty Penpot app, bounded MCP validation versus design approval, and preserving an approved design baseline while adding current-interface layers. |
| [ss-054-product-detail-cart-drawer-design.md](ss-054-product-detail-cart-drawer-design.md) | Deriving a design state matrix from current handlers, separating design intent from implemented behavior, dialog focus and responsive drawer rules, and preserving approved Penpot baselines through named versions and export hashes. |
| [ss-055-checkout-payment-design.md](ss-055-checkout-payment-design.md) | Checkout and simulated Payment state matrices from current handlers, confirmed versus unconfirmed outcomes, captured-attempt versus live-Cart ownership, manual versus automatic recovery evidence, and additive design-batch preservation. |
| [ss-056-order-admin-fallbacks-design.md](ss-056-order-admin-fallbacks-design.md) | Consolidated current-interface design delivery, separating automatic journey recovery from manual Payment and Order checks, mapping Admin list/form/image states from handlers, treating non-existent surfaces as Not applicable, and preserving accepted Penpot baselines through additive masters and hash-checked exports. |
| [ss-057-html-design-source.md](ss-057-html-design-source.md) | Keeping the design source of truth in the repository as a self-contained, clickable HTML prototype with tokens, why that is reviewable with code, what it gives up, and why design approval is separate from implementation approval. |
| [ss-058-claude-harness-adoption.md](ss-058-claude-harness-adoption.md) | Keeping one tool-independent instruction source, thin per-tool pointer files, separating harness-specific history from active rules, and retiring abandoned tool-specific work. |
| [ss-059-web-dependabot-remediation.md](ss-059-web-dependabot-remediation.md) | Reading Dependabot alerts as package, vulnerable range and first patched version, pinned versus in-range bumps, why a test-runner bump moves transitive packages, and verifying with `npm audit` plus the existing gates. |
| [ss-061-approval-gate-change.md](ss-061-approval-gate-change.md) | Recording a change of owner approval gates, what stays gated (merge, Human Verification, stop conditions), and superseding policy text with a dated note and an immutable link. |
| [ss-062-design-before-build.md](ss-062-design-before-build.md) | Design-first delivery, using an approved HTML prototype as the contract for a feature, linking it from the Issue, and handling work with no user-facing change. |
| [ss-063-brand-and-prototype-first-design.md](ss-063-brand-and-prototype-first-design.md) | Giving a product a distinctive identity from a concept, expressing it as tokens, and prototyping all states and future features in one reviewable HTML file. |
| [ss-064-applying-a-design-system-to-react.md](ss-064-applying-a-design-system-to-react.md) | Re-theming a React and Tailwind app through semantic tokens, why base styles belong in a cascade layer, and testing a visual identity with contrast math, component tests and computed-style browser checks. |

The SS-045, SS-046, and SS-047 records describe the agent role layer that was superseded as active requirements on 2026-10-27. They remain historical learning records; their operational instructions are not current.

Use the work-item identifier in new record names, for example `ss-009-product-domain.md`. One record covers one coherent work item; link earlier records when their lessons remain relevant.

## Artifact Boundaries

| Artifact | Canonical responsibility | Learning-record responsibility |
| --- | --- | --- |
| GitHub Issue | Requested outcome, scope, acceptance criteria, and status. | Explain what completing the work teaches. |
| Pull Request | Exact change, review, verification, and merge evidence. | Distill durable conclusions and link it. |
| ADR | Historical rationale for a significant, durable architecture decision. | Teach its reasoning without replacing it. |
| Technical documentation | Current system, process, control, or operational guidance. | Relate it to dated work without copying it. |
| Learning Record | Evidence-linked mini-lesson material. | Never become a second canonical artifact. |

## When a Learning Record Is Required

Create or update a Learning Record for meaningful work that establishes or materially changes architecture, module boundaries, dependencies, infrastructure, data or API behavior, security posture, CI/CD, testing or verification strategy, engineering governance, or material operational risk.

Also create one when an experiment, incident, rejected approach, or non-obvious trade-off produces a reusable lesson. Create or update it in the same pull request as the work. Do not create one for mechanical edits with no durable lesson. Retrospective records may use repository and GitHub history.

An Issue whose primary artifact is maintenance or refactoring of this canonical Learning System does not require a separate recursive Learning Record when the Issue, canonical learning documentation/template, pull request, and verification evidence already preserve the decision. SS-020 and SS-022 are examples of this exception.

## Future Learning Record Format

Keep records concise, specific to the Issue, and useful for a returning reader. Explain concepts once, link evidence instead of copying it, and omit conditional sections that do not add value. A Learning Record is not a generic tutorial, a transcript, a quiz sheet, or a large reference dump.

### Required Sections

#### What you should learn

Identify approximately 3-6 important transferable concepts from the Issue. This section names the learning targets without trying to explain every detail.

##### Core — Know this for interviews

Place this prioritized subset inside **What you should learn**. It identifies the concepts with the strongest interview transfer value and does not repeat their explanation.

#### Concepts explained

Explain each Core concept concisely: what it is, why it exists, and what problem it solves. A short diagram or mental model is allowed here only when it materially improves understanding.

#### How Samska uses it

Connect the theory to actual repository implementation, architecture, runtime, workflow, or evidence. Link the relevant files or canonical documentation rather than duplicating inventories.

#### Interview perspective

Describe likely interview themes or questions and what a strong answer should cover. Do not require the human to answer and do not provide rigid memorized scripts.

#### What not to worry about yet

Identify intentionally deferred complexity so current interview and delivery priorities remain clear.

#### Reference

Link the Issue, pull request when available, relevant source files, ADRs when applicable, and canonical documentation. Keep verified repository evidence distinct from generic explanation.

### Conditional Sections

Use these sections only when they are relevant to the Issue:

#### Why this design

Use for meaningful alternatives, decisions, or trade-offs. Explain why the current choice fits the current stage, and do not invent unsupported alternatives or rationale.

#### Common mistakes

Use for realistic misconceptions, terminology confusion, or implementation errors that would weaken understanding or implementation.

#### Interview vocabulary

Include only important terms introduced by the Issue. Define each in normally 1-2 lines and distinguish adjacent concepts where useful. Avoid glossary bloat.

#### Deeper — Useful later

Use for advanced or lower-priority concepts that should not distract from current interview or job-search priorities.

#### Optional Review

This section is optional. No response is expected, and it never affects Issue progression. It may include review questions, safe hands-on prompts, or self-study cues only when they add real value.

## Previous Active-Learning Format

Future records no longer require the active-study structure introduced by SS-019 and SS-020. Preserve useful content through the mini-lesson sections instead:

| Previous mechanism | Future-record treatment |
| --- | --- |
| Must Remember | Replace with **What you should learn** and its Core subset. |
| Active Recall | Remove from the default format; questions may appear only in **Optional Review**. |
| Decision Drills | Absorb evidence-supported alternatives, decisions, and trade-offs into **Why this design**. |
| Concept Cards | Absorb concept mechanics into **Concepts explained**. |
| Interview Drills | Replace with **Interview perspective**. |
| Hands-on Reinforcement | Remove from the default format; allow safe exercises only in **Optional Review** when useful. |
| Five-Minute Learning Checkpoint | Remove from canonical requirements and the template. |
| Spaced and Cumulative Recall | Remove scheduled recall guidance; voluntary revisiting belongs only to explicitly requested study/review mode. |
| Mental Model | Do not require a standalone section; use a concise explanation or diagram in **Concepts explained** when useful. |

Do not add reminders, scheduling, scores, tracking, or learning analytics.

## Five-Minute Learning Checkpoint

This heading remains only for compatibility with historical Learning Record links. The Five-Minute Learning Checkpoint belonged to the previous active-learning format and is not part of the current Learning System.

It is not required before Build, pull request creation, merge, Issue completion, or any other engineering progression. Future Learning Records use the mini-lesson structure; optional review happens only in **Optional Review** or when the human explicitly requests study/review mode.

## Historical Learning Records

Do not bulk migrate historical Learning Records. Their active-recall and checkpoint structures remain valid dated evidence of the Learning System that existed when they were written.

Modernize a historical record only when its underlying engineering topic is revisited and doing so provides clear value. Never rewrite a record solely for formatting consistency.

## Sustainability

Learning density matters more than total file size. Focus on a small set of transferable concepts, repository-specific evidence, and interview-relevant reasoning. Avoid repeated explanation, unsupported claims, generic tutorial material, and unnecessary conditional sections. Verify relative links whenever the journal changes.
