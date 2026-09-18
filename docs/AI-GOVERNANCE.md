# AI Engineering Governance

## Purpose

AI coding agents are expected to generate or modify production code in Samska Sandbox. They accelerate execution and help the human learn, but do not transfer accountability from humans.

Repository documentation is the source of truth for project context. Conversation history, generated output, and agent assumptions are not authoritative.

## Responsibilities

| AI Agents | Human Owner and Reviewers |
| --- | --- |
| Read required context, inspect the implementation, and identify affected modules and documentation | Define requirements, acceptance criteria, priorities, and risk tolerance |
| Assess scope, security implications, dependencies, architecture compliance, and risk-based verification | Make and approve important product, architecture, dependency, and risk decisions |
| Produce a concise plan and request a decision when material uncertainty exists | Review scope, correctness, security, maintainability, tradeoffs, and evidence |
| Implement only approved scope, synchronize documentation, and run appropriate verification | Validate results, understand the approach, and accept or reject the output |
| Explain what changed, why, tradeoffs, relevant alternatives, verification, risks, and follow-up concerns | Remain accountable for the resulting change and its residual risk |

Humans must not accept AI output blindly.

## Required Context

Before meaningful work, an agent must read [AGENTS.md](../AGENTS.md), documentation relevant to the task, and the existing implementation. Relevant documentation includes architecture, [architecture principles](architecture/principles.md), security, testing, contribution, roadmap, and ADR guidance when the task affects those concerns.

## Planning and Scope Discipline

- Before substantial changes, identify the requested outcome, acceptance criteria, affected modules, security implications, verification approach, and documentation updates, then provide a concise plan.
- Implement only approved scope. Do not use a task as an opportunity to add roadmap work, abstractions, cleanup, dependencies, or infrastructure that was not requested.
- Identify material uncertainty, conflicting requirements, missing ownership, or unaccepted risk. Stop and request a human decision rather than guessing.
- Explain meaningful engineering decisions in terms the human can review and learn from: what changed, why it was chosen, tradeoffs, and relevant alternatives.

## Architecture and Dependencies

- Follow [Architecture Principles](architecture/principles.md) and accepted ADRs. Do not introduce an architectural pattern without demonstrated need and justification.
- Significant, durable architectural decisions require an ADR under [adr/](adr/README.md). Routine implementation details do not.
- A new dependency, platform component, or infrastructure capability requires a current problem, alternatives, security and operational cost, testing impact, and removal or rollback consideration.
- Do not introduce distributed infrastructure, services, or future roadmap technology merely to demonstrate it.

## Security and Verification

- Assess security implications for changes to data, secrets, APIs, dependencies, logs, build pipelines, infrastructure, and deployment configuration. Follow [security engineering guidance](SECURITY.md).
- Never add or expose secrets, private keys, credentials, real data, or real payment processing. Use synthetic data and simulated payments only.
- Select verification according to risk and follow [the testing strategy](TESTING.md). Do not claim tests, checks, controls, or behavior without evidence.
- Run appropriate verification after implementation and disclose meaningful verification gaps.

## Documentation and Reporting

- Update affected documentation in the same change as behavior, architecture, security posture, process, or roadmap status changes.
- For meaningful work that meets the [learning-journal criteria](learning/README.md#when-a-learning-record-is-required), create or update the corresponding learning record in the same change.
- Learning records preserve concise, evidence-linked mini-lessons for human learning. Their canonical format is defined in the [Learning Journal guide](learning/README.md) and [Learning Record template](learning/000-template.md). They must not contain raw AI prompts, transcripts, hidden reasoning, secrets, credentials, or personal data.
- Learning supports engineering work but never gates it. Agents must not require quizzes, recall, exercises, checkpoints, or human answers before Build, pull request creation, merge, Issue completion, or other engineering progression.
- Agents must not wait for study responses unless the human explicitly requests study/review mode. Normal human engineering review remains required where the delivery workflow calls for it; engineering review is not a learning gate.
- Report scope completed, files changed, why the approach was chosen, decisions, tradeoffs, relevant alternatives, verification performed, residual risks, and deferred concerns.
- Preserve durable rationale in documentation and ADRs so future agents do not depend on conversation history.

### Local Environment Changes

Every meaningful implementation report must include a `## Local Environment Changes` section. It must say `None` when the change does not alter local developer setup.

When local setup changes, the section must state:

- what changed and why;
- required manual developer action and exact commands;
- affected configuration or files;
- migration or update steps for existing local environments; and
- verification steps.

Report changes to Java/JDK, Node/npm, or other required local tools; environment variables; Docker services; ports; volumes; database migrations; startup commands; and local runtime or configuration. When any of these changes alter canonical local setup, update [Local Development](LOCAL-DEVELOPMENT.md) in the same change.

Every setup-affecting change must also review whether the repository [local-development launcher](../scripts/dev.sh) remains valid. Update the launcher and rerun relevant launcher verification in the same change only when its startup commands, prerequisites, ports, environment or local-configuration assumptions, required runtime services, process lifecycle, or other startup behavior are affected. Setup-affecting work is incomplete when the canonical guide, launcher, and verified runtime behavior disagree.

## Boundaries

- AI agents must not claim verification, enabled repository controls, or system behavior without evidence.
- AI agents must not automatically implement future roadmap items or replace human decisions with agent preference.
- AI agents must not create custom agent tooling, automated reviewers, CI/CD automation, or other AI-specific infrastructure without a separately justified request.

## Evidence and Review

Every meaningful change should leave durable evidence in the repository: code and tests where applicable, updated documentation, ADRs for significant decisions, and a reviewable change description. Human review remains required regardless of whether a change was authored manually or with AI assistance. AI assistance is successful only when the human can understand and approve the important decisions it supported.
