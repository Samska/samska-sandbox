# Engineering Learning Journal

## Purpose

The Engineering Learning Journal preserves durable, evidence-linked technical mini-lessons from Samska Sandbox work. It supports interview preparation and engineering development by explaining important concepts, decisions, and boundaries in the context of the repository.

Learning Records are passive and non-blocking by default. They complement Issues, pull requests, ADRs, and technical documentation; those artifacts remain authoritative for their respective responsibilities.

## Delivery Workflow

Engineering work follows this workflow:

```text
Issue -> Plan -> human review -> Build -> review -> PR -> merge -> Done
```

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
