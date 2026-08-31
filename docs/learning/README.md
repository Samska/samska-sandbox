# Engineering Learning Journal

## Purpose

The Engineering Learning Journal preserves durable lessons from Samska Sandbox work. It helps the project owner explain actual decisions, alternatives, trade-offs, risks, verification, and failure modes during future study, interviews, and role transitions.

It is a curated learning layer, not a new source of operational truth. Issues, pull requests, ADRs, and technical documentation remain authoritative for their respective purposes.

## Structure

| File | Purpose |
| --- | --- |
| [000-template.md](000-template.md) | Reusable format for a learning record. |
| [ss-002-architecture-principles.md](ss-002-architecture-principles.md) | Architecture principles, the modular-monolith decision, and ADR use. |
| [ss-003-ai-engineering-governance.md](ss-003-ai-engineering-governance.md) | AI-assisted engineering governance and human accountability. |
| [ss-004-github-repository-security.md](ss-004-github-repository-security.md) | GitHub security controls and evidence-based governance. |
| [ss-005-repository-documentation-ci.md](ss-005-repository-documentation-ci.md) | Repository CI, GitHub Actions security, and documentation quality gates. |
| [ss-006-java-backend-bootstrap.md](ss-006-java-backend-bootstrap.md) | Java backend baseline, dependency management, Spring Boot, testing, and backend CI. |

Use the work-item identifier in a new record name, for example `ss-009-product-domain.md`. One record should cover one coherent work item; link to other records when a later item builds on its lesson.

## Artifact Boundaries

| Artifact | Canonical responsibility | Learning-record responsibility |
| --- | --- | --- |
| GitHub Issue | Requested outcome, scope, acceptance criteria, and work status. | Explain what is worth learning from completing the work. |
| Pull Request | Exact change set, review discussion, verification evidence, and merge context. | Distill only durable conclusions and link to the PR. |
| ADR | Historical rationale for a significant, durable architectural decision. | Explain the engineering concepts and interview lessons around the decision without replacing the ADR. |
| Technical documentation | Current system, process, control, or operational guidance. | Relate the current guidance to the work that produced it without copying it. |
| Learning record | Evidence-linked learning context. | Never become a second copy of the canonical artifact. |

## When a Learning Record Is Required

Create or update a learning record for meaningful work that establishes or materially changes architecture, module boundaries, dependencies, infrastructure, data or API behavior, security posture, CI/CD, testing or verification strategy, engineering governance, or material operational risk.

Also create a record when an experiment, incident, rejected approach, or non-obvious trade-off produces a reusable engineering lesson. Do not create a record for mechanical edits with no durable lesson. If the need is unclear, the human owner decides before implementation.

Create or update the record in the same pull request as the work. Retrospective records may use repository history and GitHub artifacts when a prior work item predates this journal.

## Record Quality

Use [the template](000-template.md) and adapt it to the work. A record must:

- Link to the Issue, Pull Request, ADRs, and canonical documentation that support its claims.
- Clearly distinguish verified facts, historical facts, future direction, and deferred work.
- Explain central concepts through the Samska change: define the concept, show its concrete application, explain why it mattered, and describe a relevant trade-off or failure mode.
- Include alternatives only when evidence supports them. Do not infer a decision merely because an alternative exists.
- State material security and verification implications, including meaningful gaps.
- Include interview questions and an interview-ready explanation grounded in the actual work.

The expected depth is sufficient for a technically literate reader to understand the reasoning and explain it accurately. Avoid generic tutorials and encyclopedic restatements of the linked sources.

## Plan, Build, Review, and Pull Request Lessons

Summarize only the conclusions that matter for future work:

- **Plan:** constraints, material questions, and selected direction.
- **Build:** meaningful implementation facts and deviations from the plan.
- **Review:** resolved findings, validation gaps, and human decisions. State when no review evidence exists.
- **Pull Request:** scope, evidence, deferred work, and residual risks.

Do not store raw AI prompts, chat transcripts, tool output, hidden reasoning, credentials, secrets, personal data, or unsupported reconstructions of conversations. Link to the relevant GitHub artifact instead.

## Freshness and Maintenance

Canonical documents describe the current state; records preserve learning from a dated work item. Link to canonical sources rather than copying configuration inventories, policy prose, workflow files, or ADR text.

When later work changes a lesson, update the canonical documentation first, then add a dated follow-up or supersession note to the affected learning record and link the new record. Do not rewrite supported historical facts to make them appear current. Verify relative links whenever the journal changes.
