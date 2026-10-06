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
| Payment Simulator | SS-036 |
| Order creation | SS-037 |

### Future Product Sequence

1. First Order end-to-end journey (SS-039) — implemented for review; required Human Verification and merge remain
2. Release `v0.1.0`

Future capabilities receive their SS identifier when their Issues are created.

Admin Catalog Management (SS-033) is complete and merged through PR #56. Product
Media Upload (SS-034) is complete and merged through PR #58: one validated,
re-encoded JPEG per Product stored in bounded backend process memory, uploaded
media display precedence on Market cards and Product detail, the curated
`mediaKey` selection and the monogram fallback retained, and the no-upload
decision of ADR 0003 superseded by ADR 0004. Its endpoints are unauthenticated
and bound retained media, not peak memory; `/admin/products` remains navigation,
not an access-control boundary. Payment Simulator (SS-036) is complete and
merged through PR #62: it captures a revision-checked immutable Cart snapshot,
applies one of three explicit simulated outcomes, owns identified attempts with
UUID replay and GET reconciliation, and records at most one approval per
unchanged Cart revision in a bounded 32-attempt process-local store. CI test result
visibility (SS-035) was investigated separately and cancelled on 2026-09-28; its
issue is closed as not
planned and its pull request closed without merging, so it delivers nothing and
is not part of the product sequence.

Order creation is a separate explicit step from simulated approval. It copies the frozen approved attempt into an immutable process-local record, with same-attempt replay and lookup; no full-page UI recovery or Cart clearing is introduced by that capability alone. Order creation (SS-037) is complete and merged through PR #67; the owner verified the main browser flow, while API replay, uncertain-response recovery, and accessibility remain unobserved real-browser checks for SS-037 itself. The First Order end-to-end journey (SS-039) is implemented for review: `/checkout` and `/checkout/attempts/{attemptId}` recover the simulated result or frozen Order through read-only lookups after reload, direct entry, and history, keep the live Cart editable, and require explicit abandonment before a new journey replaces an unresolved reference. Required Human Verification and merge of SS-039 remain.

### MVP Boundaries

The local MVP deliberately defers authentication and authorization. They are
deferred until after the local First Order MVP but are a mandatory prerequisite
for any hosted environment, and no hosting work begins before the MVP. The MVP
also remains process-local: Cart state is lost when the backend restarts,
uploaded Product media is lost together with its Product, and simulated payment
attempts, including their captured snapshots and duplicate protection, and
Orders are lost on restart. The attempt-addressed URL and one browser-session
reference are lookup hints for recovery and do not add persistence or
cross-process guarantees. Payment Simulator captures the revision-checked Cart
snapshot inside a bounded process-local store, and its unauthenticated scenario
selector and endpoints are a local-only use constraint, not access control or a
hosting posture. The application has no persistence or deployed environment.

## Versioning And Releases

Samska Sandbox uses Semantic Versioning at the product level. There is one
Samska Sandbox product release version; work-item identifiers and product
versions are independent. Releases are milestone-based rather than
Issue-based, and Git tags use `vMAJOR.MINOR.PATCH`.

Versions below `1.0.0` represent evolving, pre-stable product milestones. The
first planned release is `v0.1.0 — First Order`. No Git tag or GitHub Release
exists yet; release creation is future First Order work.

## Directional Evolution

Long-term versions are directional learning themes, not fixed commitments or a
technology checklist. A future technology is evaluated only when an identified
engineering problem justifies it.

| Version | Directional Theme | Evidence That May Trigger Evaluation |
| --- | --- | --- |
| v0.2 | Quality maturity | Identified testing gaps or unreliable delivery feedback |
| v0.3 | Caching / Redis | Measured catalog read pressure or unacceptable latency |
| v0.4 | Event-driven processing / RabbitMQ | Synchronous workflows become slow, fragile, or operationally coupled |
| v0.5 | Inventory concurrency | Concurrent stock updates expose consistency or contention problems |
| v0.6 | React Native | A justified mobile learning or product need exists |
| v0.7 | Observability | Insufficient visibility into behavior, failures, or dependencies |
| v0.8 | Operational dashboards | Defined operational questions require actionable views |
| v0.9 | Infrastructure as Code | Repeated environment setup requires reproducibility and reviewability |
| v1.0 | Secured public demo | A bounded, disposable demo can meet defined security controls |
| v1.1 | Performance engineering | Performance risks or service objectives require measurement and tuning |
| v1.2 | Security engineering expansion | Threat-model or assessment findings justify additional controls |
| v1.3 | Data engineering | Analytics or simulation needs require governed data pipelines |
| v1.4 | Simulation engine | Product learning goals justify a dedicated simulation capability |
| v1.5 | Resilience engineering | Failure-mode analysis identifies resilience gaps |
| v1.6 | SRE / SLI / SLO / error budgets | Reliable operational signals and service objectives are needed |
| v1.7 | Chaos engineering | Mature observability and resilience controls support safe experiments |
| v2.0 | Evaluate service extraction / microservices | Clear independently evolving boundaries and operational evidence justify it |

Any significant change to this direction requires the relevant documentation
and, when architectural, an ADR update. See [ARCHITECTURE.md](ARCHITECTURE.md)
and [the ADR guide](adr/README.md).
