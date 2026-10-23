# Agent Instructions

This directory holds the repository's versioned, tool-agnostic agent instructions. It defines how the Orchestrator and specialized agents work in Samska Sandbox: what each role owns, where its boundaries are, how agents collaborate, and what evidence is expected.

The content is deliberately independent of any agent tool, model, provider, or reasoning setting. Tool wiring lives separately in [tool-integration/maestri.md](tool-integration/maestri.md) and never changes a role's responsibilities.

## Relation to existing governance

These files add a role layer. They do not replace or restate existing governance.

| Document | Remains canonical for |
| --- | --- |
| [AGENTS.md](../../AGENTS.md) | Required context, the before-work checklist, session resume, and the documentation duties of every session |
| [AI Engineering Governance](../AI-GOVERNANCE.md) | Authorization, accountability, planning discipline, the Issue and pull request handoff protocol, verification classifications and exceptions, reporting, and local environment changes |
| [Testing Strategy](../TESTING.md) | Risk-based selection of verification levels and what each level does and does not prove |
| [GitHub Controls](../GITHUB.md) | CI jobs, check surfaces, and the status of repository controls |
| [Contributing](../../CONTRIBUTING.md) | Branch lifecycle, work metadata, and contributor expectations |
| [ADR Guide](../adr/README.md) | When a durable architecture decision needs an ADR and how it is recorded |
| [Learning Journal](../learning/README.md) | When a learning record is required and what it contains |

Where a role file and a governance document disagree, governance wins. The resolution rule and the escalation path are part of the authority model below.

## Authority and scope

The authority and scope model, including how a conflict between layers is resolved, is defined once in [shared-instructions.md](shared-instructions.md#authority-and-scope).

## How an agent reads these files

Every agent follows the [shared instructions](shared-instructions.md) first, then its assigned role file, then the active Issue or owner instruction. When a referenced file changes, re-read it; the freshness and drift procedure is in [tool-integration/maestri.md](tool-integration/maestri.md).

## Role catalogue

Roles are available capabilities, not a checklist. The Orchestrator activates only the capabilities a task needs; the [Orchestrator role](orchestrator.md) defines when independent review is requested and who may perform it.

| Capability | File | Purpose |
| --- | --- | --- |
| Orchestrator | [orchestrator.md](orchestrator.md) | Plan and scope work, declare ownership, coordinate dependencies, integrate, and report |
| Architecture | [roles/architecture.md](roles/architecture.md) | Module boundaries, architecture principles, dependency justification, and ADR input |
| Backend | [roles/backend.md](roles/backend.md) | Domain behavior, in-memory stores, API contracts, and backend verification |
| Frontend | [roles/frontend.md](roles/frontend.md) | React and TypeScript surfaces, state ownership, transport handling, and component verification |
| Quality and Verification | [roles/quality-verification.md](roles/quality-verification.md) | Verification strategy, evidence collection, gap disclosure, and Human Verification preparation |
| Code Review | [roles/code-review.md](roles/code-review.md) | Independent review of a completed change by an agent that did not author it |
| CI, Build, and Release | [roles/ci-release.md](roles/ci-release.md) | Workflows, the local development launcher, dependency remediation, and release preparation |
| UX and Accessibility | [roles/ux-accessibility.md](roles/ux-accessibility.md) | Interaction and visual intent, accessibility semantics, and human-observable user-experience checks |

## Evidence

Every role records Agent Verification evidence in the shape defined by the [shared instructions](shared-instructions.md#evidence-expectations) and reports it through the handoff fields defined in [AI Engineering Governance](../AI-GOVERNANCE.md). Human Verification is prepared, never self-approved, and CI Verification is recorded from the CI run rather than assumed.
