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

## Issue and Project Handoff Protocol

Every Issue and pull request carries a structured handoff so a future session can resume work from repository and GitHub state instead of conversation history.

The Issue Handoff applies to new Issues created from this protocol forward. Existing and historical Issues, including [#47](https://github.com/Samska/samska-sandbox/issues/47), are not retrofitted.

### Issue Handoff

Every new Issue must record these canonical Issue Handoff items in this order:

1. Handoff status.
2. Objective.
3. Approved scope.
4. Out of scope.
5. Acceptance criteria.
6. Decisions and assumptions.
7. Relevant files and documentation.
8. Verification plan.
9. Pending questions or blockers.
10. Next step.
11. Whether `PROJECT_HANDOFF.md` must be updated, with a reason.

Handoff status is a controlled value: `Planned`, `Awaiting approval`, `In Build`, `Blocked`, `Paused`, or `Completed`. It records the work-item state for continuation; the Project `Status` field remains the execution state on the board.

The repository [Issue Form](../.github/ISSUE_TEMPLATE/work-item.yml) is the enforced creation path; blank issues are disabled in the same directory's `config.yml`. GitHub submits only the form's input fields, so a form-created issue body contains the canonical items in their order but not the form's `markdown` introduction, including its `## Issue Handoff` heading; that heading names the ordered item set and is not required as a literal line in the issue body. Issues created through the GitHub API or by an AI agent bypass the form and must reproduce the same canonical items in the same order.

### Pull Request Handoff

Every pull request body must contain a `# Pull Request Handoff` heading with these fields in order:

1. Issue reference.
2. Confirmed implementation state.
3. Files changed.
4. Decisions and deviations.
5. Agent Verification.
6. Human Verification.
7. CI Verification.
8. Documentation impact.
9. Remaining risks.
10. Next step.
11. `PROJECT_HANDOFF` update.
12. Local Environment Changes, as required by the reporting rules above.

The repository [pull request template](../.github/pull_request_template.md) provides the structure, and the Repository validation job fails when a required heading is missing from a pull request body, including after a body edit. The check verifies heading presence only; authors remain responsible for content. The check is not yet a required status check, as documented in [GitHub controls](GITHUB.md).

### PROJECT_HANDOFF.md

[PROJECT_HANDOFF.md](../PROJECT_HANDOFF.md) is one concise project-level resume snapshot, not a per-Issue work log or conversation archive. It records current active work and recent durable completed work, and it is updated in the same change when project state, durable decisions, active work, or the next step changes. It does not contain the full history of every Issue, and transient local branch or working-tree details are not durable project state.

A resuming session follows the procedure in [AGENTS.md](../AGENTS.md#session-resume).

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

### Human Verification

Keep verification evidence distinct in implementation and pull request reports:

- **Agent Verification** is commands, tests, inspections, and runtime checks performed by the AI agent.
- **Human Verification** is behavior explicitly reproduced or reviewed by the human owner. Never claim it unless the human actually performed and reported it.
- **CI Verification** is checks performed by GitHub Actions or other repository automation.

For every meaningful change, classify Human Verification as **Required** or **Not applicable** with a concise evidence-based reason. It is usually required when direct human observation adds evidence, such as for UI, locally exercisable API, runtime/startup, developer-tooling, safe integration, end-to-end, or accessibility behavior. It may be not applicable for pure documentation, GitHub/project administration, mechanical metadata, or changes with no useful human-observable behavior.

When Human Verification is required, complete Build and Agent Verification, then stop before commit or pull request creation. The agent must provide the human with:

1. What changed.
2. How to reproduce it locally.
3. What to observe.
4. Known limitations or areas requiring human judgment.
5. `## Local Environment Changes`.

The human reports the relevant result before the workflow continues. Human Verification is an engineering evidence control, not a Learning System gate: use representative behavior checks and human judgment rather than repeating automated suites, quizzes, exercises, or learning responses. Future Build prompts may rely on this governance rule rather than restating the policy.

#### Remote-only Human Verification

Pre-commit/pre-PR Human Verification remains the default. A narrow exception is allowed only when the required human-observable behavior exists exclusively in remote CI or PR infrastructure and cannot meaningfully be inspected earlier. The agent must explain that boundary and the remote behavior to inspect. Normal human engineering review of the implementation remains required before commit or PR creation; it is not Human Verification.

For an approved remote-only exception, create only the minimum commit and PR needed to expose the behavior, then stop for actual Human Verification before merge. Keep CI Verification and Human Verification distinct, and never use this exception merely for convenience when meaningful local Human Verification exists.

##### Default-branch-only Human Verification exception

GitHub renders Issue Forms and pull request templates from the default branch, so some composer behavior is observable only after merge. For that case only, the owner may approve a narrow, change-specific exception that allows the merge to proceed with the check recorded as pending Human Verification, provided all of the following hold:

- Human engineering review and CI verification pass before merge.
- The pending check, its concrete post-merge follow-up, and the corrective action are recorded in the Issue, the pull request, and `PROJECT_HANDOFF.md`.
- If the post-merge check fails, a corrective pull request or Issue follows immediately.

This exception never applies when the behavior is observable before merge, never relaxes the default pre-merge rule, and must not be used for convenience. A pending check must never be reported as passed.

## Documentation and Reporting

- Update affected documentation in the same change as behavior, architecture, security posture, process, or roadmap status changes.
- `README.md` is the high-level repository landing page for engineers, recruiters, and contributors. Meaningful work must assess README impact and update it in the same pull request when the change materially affects capabilities, product stage or milestone, architecture or module boundaries, technology stack, CI/CD, security controls, testing capabilities, the local-development entry point, or the next major capability. This assessment is not required for trivial metadata-only work.
- Report the assessment as `README impact: Yes` followed by `Updated: <sections>`, or `README impact: No` followed by `Reason: <concise reason>` when relevant.
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
