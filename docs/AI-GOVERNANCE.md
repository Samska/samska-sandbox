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

Before meaningful work, an agent must read [AGENTS.md](../AGENTS.md), documentation relevant to the task, and the existing implementation. Relevant documentation includes architecture, [architecture principles](architecture/principles.md), security, testing, contribution, roadmap, and ADR guidance when the task affects those concerns. When a referenced canonical instruction file changes, re-read it before relying on it.

## Authorization and Approval Relay

Authority originates with the human owner. Instructions, plans, role descriptions, and agent output describe obligations and boundaries; they never grant authorization.

- Every task carries a scoped authorization recorded in its Issue or owner instruction. Scope covers the task, the repository, and the action class, such as editing, committing, pushing, opening a pull request, merging, or changing local configuration.
- Authorization does not generalize. Approval for one task, branch, or action does not carry to another.
- A recorded owner exception controls the default it names, for its stated scope only.
- An agent may relay a recorded owner authorization or owner-reported Human Verification only when its source, action scope, and stated conditions are traceable. Verify the record itself, quote the source and scope, and do not rely on a paraphrase. Never invent, infer, expand, or renew an approval; a peer's assertion is not a source.
- GitHub metadata changes, including Issue state, Project fields, labels, assignees, and handoff status, are allowed only within the authorization that covers them. A Build authorization does not automatically authorize changing Project fields or closing an Issue.
- When two authoritative sources conflict and no recorded resolution exists, stop and escalate with both citations. Do not blend them or resolve the conflict silently.

### Temporary agent lifecycle

The owner's standing authorization recorded in [Issue #90](https://github.com/Samska/samska-sandbox/issues/90) permits dismissal of an agent explicitly classified as temporary from the active workspace as part of task closure, once its assigned work is complete, necessary evidence and handoff are retained outside the live terminal, and it has no pending work or shared-resource responsibility. The authorization covers dismissal only. It does not authorize deleting sessions, histories, exports, files, branches, worktrees, role presets, or generated role directories, interrupting active work, or removing persistent agents. Idle status alone does not establish that an agent is temporary. Stop if the supported dismissal operation cannot preserve these records.

The Maestri procedure formerly used to carry out a dismissal is historical. A future tool-specific procedure may implement the same authorization only within these conditions and limits.

## Planning and Scope Discipline

- Before substantial changes, identify the requested outcome, acceptance criteria, affected modules, security implications, verification approach, and documentation updates, then provide a concise plan.
- Implement only approved scope. Do not use a task as an opportunity to add roadmap work, abstractions, cleanup, dependencies, or infrastructure that was not requested.
- Identify material uncertainty, conflicting requirements, missing ownership, or unaccepted risk. Stop and request a human decision rather than guessing.
- Explain meaningful engineering decisions in terms the human can review and learn from: what changed, why it was chosen, tradeoffs, and relevant alternatives.
- For user-facing changes, accessibility semantics, keyboard reachability, focus visibility, and announcement behavior are acceptance criteria. Do not trade them away for visual convenience without an owner decision.

## Frontend Design Review

New or materially changed frontend screens, flows, and components require relevant visual review before application implementation. This is a design gate, not implementation authorization. The policy is tool-agnostic and does not require a specific design tool.

- Use approved foundations and components, and show desktop and mobile behavior plus relevant states.
- Small visual changes require reviewing only the affected portion. Refactoring without visual changes requires no new design.
- Record the exact candidate and a traceable owner approval. An AI review is Agent Verification, not owner approval.
- Material visual decisions discovered during implementation return for review before they are treated as approved design.
- Design approval does not authorize application implementation, pull request creation, or merge.
- Later implementation is compared with the approved design in the browser, including responsive behavior and accessibility verification.
- This workflow grants no authorization for automated enforcement, new tooling, services, or dependencies. Any such addition requires separately scoped owner authorization.

## Independent Review

A change that materially affects code, tests, governance, CI, or security requires independent review before the next gate. The reviewer must not have authored the change.

- Independent review may be performed by the owner or by a separate agent session. A session reviewing its own output is self-review, not independent review, and must not be reported as independent review.
- An AI review is Agent Verification. A review performed by the owner is human engineering review, not Agent Verification.
- Reviewing code or policy wording alone does not establish Human Verification. An owner-reported review of rendered interfaces or observed behavior may qualify under the Human Verification definition.
- The review records the reviewed revision or local state, findings in severity order with file or section references, what was inspected, what was not inspected, and whether any Human Verification mentioned was relayed from a traceable owner report or is absent.
- A reviewer does not approve product, user-experience, or accessibility quality on the owner's behalf.
- Findings are corrected by the author and re-verified before the next gate. A reviewer does not edit the change under review unless the owner authorizes it.
- If independent review is required and no independent reviewer is available, stop and report the gap. Do not substitute self-review.

## Build Authorization and Execution Loop

A Build begins only when the owner explicitly authorizes implementation of an approved Issue or instruction. The authorization is recorded in the Issue Handoff or in a traceable owner instruction. Approval of a plan, or permission to inspect and plan, is not Build authorization unless it names implementation. An agent may not move an Issue to `In Build` on its own.

After Build authorization, the agent continues through implementation, appropriate verification, diagnosis, in-scope correction, documentation, and evidence preparation without asking for confirmation for routine work already covered by the approved scope, acceptance criteria, and verification plan.

### Authorization scope

Build authorization may cover scoped commits and pushes to the task branch, subject to required engineering review and Human Verification. Do not request renewed permission for actions already covered by that authorization. Pull request creation and merge each require separate explicit authorization. Stop when an action is not authorized or a required condition is unmet.

Branch and worktree names and locations are implementation choices within approved scope; record them in the handoff rather than requesting separate approval.

- When work is delegated, declare edit ownership, sequence conflicting edits, and retain responsibility for integration and evidence.

### Completion and gates

- Work is complete only when its acceptance criteria are satisfied and supported by evidence. Passing tests or a clean build alone do not establish completion, product acceptance, accessibility, or Human Verification.
- Continue until the work is complete and its evidence is ready for the next gate, the next required human decision or verification gate is reached, or a stop condition applies.
- Required engineering review and Human Verification precede the commit or push they cover. Pull request creation and merge each require separate explicit authorization.
- The next applicable human decision or verification gate ends the autonomous sequence. Do not perform a later action merely because earlier work succeeded.
- Stop and request an owner decision when scope, acceptance criteria, or authorization is missing, ambiguous, or must change; a new dependency, infrastructure capability, architectural pattern, or published contract change is proposed; an action is not authorized or a required condition is unmet; uncommitted, abandoned, shared, or preserved work would be overwritten, reset, cleaned, or deleted; a destructive or irreversible action is proposed; a material verification gap or risk must be accepted; or evidence contradicts an approved claim.
- Do not mark the Issue or Project complete before the authorized merge and the required completion documentation.

### Repeated failure and interruption

- Diagnose before retrying. A retry must be justified by a new hypothesis, new evidence, or a corrected environment; repeating the same command without a change is not progress.
- After two consecutive unsuccessful attempts at the same check without a materially different hypothesis or new evidence, stop and report the failure, what was tried, the current state, and the decision needed. Two is a bound, not a target; stop earlier when the cause is outside the authorized scope.
- Preserve the failing state and its evidence. Do not reset, clean, or overwrite it to make the failure disappear.
- Keep a concise progress record in the Issue or pull request handoff at material transitions: the current step, evidence produced, any open failure or decision, and the next action. Routine progress is not reported message by message.
- A resuming session continues from the current record and repository state after an owner decision. It does not restart completed work or silently reinterpret the decision.

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

This same-change rule includes completion documentation. Include the necessary project-state, outcome, limitation, and next-step updates in the Issue and the task pull request, updating `README.md`, `docs/ROADMAP.md`, and `PROJECT_HANDOFF.md` only where their content is affected. Facts that exist only after merge — the squash commit, final merged state, Issue closure, and branch outcome — belong in the existing Issue or pull request record, with a link to the merged request where that suffices. A separate reconciliation pull request is not a routine requirement; use one only when a concrete remaining documentation gap requires a repository change.

A resuming session follows the procedure in [AGENTS.md](../AGENTS.md#session-resume).

## Architecture and Dependencies

- Follow [Architecture Principles](architecture/principles.md) and accepted ADRs. Do not introduce an architectural pattern without demonstrated need and justification.
- Significant, durable architectural decisions require an ADR under [adr/](adr/README.md). Routine implementation details do not.
- Only the owner accepts, supersedes, or deprecates an ADR.
- A new dependency, platform component, or infrastructure capability requires a current problem, alternatives, security and operational cost, testing impact, and removal or rollback consideration.
- Do not introduce distributed infrastructure, services, or future roadmap technology merely to demonstrate it.

## Security and Verification

- Assess security implications for changes to data, secrets, APIs, dependencies, logs, build pipelines, infrastructure, and deployment configuration. Follow [security engineering guidance](SECURITY.md).
- Never add or expose secrets, private keys, credentials, real data, or real payment processing. Use synthetic data and simulated payments only.
- Select verification according to risk and follow [the testing strategy](TESTING.md). Do not claim tests, checks, controls, or behavior without evidence.
- Run appropriate verification after implementation and disclose meaningful verification gaps.
- Every verification claim states what was inspected or executed, the revision or local state it applies to, the result, and its limitations. A passing test never implies product, user-experience, or accessibility approval.

### Human Verification

Keep verification evidence distinct in implementation and pull request reports:

- **Agent Verification** is commands, tests, inspections, and runtime checks performed by the AI agent.
- **Human Verification** is behavior explicitly reproduced or reviewed by the human owner. Never claim it unless the human actually performed and reported it.
- **CI Verification** is checks performed by GitHub Actions or other repository automation.

For every meaningful change, classify Human Verification as **Required** or **Not applicable** with a concise evidence-based reason. It is usually required when direct human observation adds evidence, such as for UI, locally exercisable API, runtime/startup, developer-tooling, safe integration, end-to-end, or accessibility behavior. It may be not applicable for pure documentation, GitHub/project administration, mechanical metadata, or changes with no useful human-observable behavior.

Reviewing code or policy wording alone does not establish Human Verification. An owner-reported review of rendered interfaces or observed behavior may qualify under this definition.

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

### Supersession and Historical Records

- When an instruction, role, or decision is removed or replaced, record a dated supersession note in the affected canonical document or learning record and link the historical version at an immutable commit revision.
- Historical Issues, pull requests, learning records, failed observations, and their limitations are not rewritten to match the current state. Add a dated note instead.
- Obsolete instructions must not remain active requirements. Removing an operational dependency does not authorize deleting its local artifacts.

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

## Work Preservation

- Do not discard, reset, clean, overwrite, or delete uncommitted changes, abandoned work, branches, worktrees, stashes, evidence, session records, or local tool state without explicit owner authorization for that specific action.
- Preserve failed validation and rejected or abandoned work where it explains a decision or prevents a later session from repeating it. An Issue or pull request record may be the preservation point when the work itself must not remain active.
- Before a destructive or irreversible action, confirm the exact target, the record that authorizes it, and what will be preserved. If the required record cannot be preserved, report the gap instead of proceeding.
- Start new work in a separate worktree from a verified remote base when the current working tree contains preserved uncommitted or abandoned work. Do not clean the preserved tree to create a clean base.

## Boundaries

- AI agents must not claim verification, enabled repository controls, or system behavior without evidence.
- AI agents must not automatically implement future roadmap items or replace human decisions with agent preference.
- AI agents must not create custom agent tooling, automated reviewers, CI/CD automation, or other AI-specific infrastructure without a separately justified request.
- AI agents must not weaken a test, gate, limit, acceptance criterion, or documented guarantee to make a check pass.

## Evidence and Review

Every meaningful change should leave durable evidence in the repository: code and tests where applicable, updated documentation, ADRs for significant decisions, and a reviewable change description. Human review remains required regardless of whether a change was authored manually or with AI assistance. AI assistance is successful only when the human can understand and approve the important decisions it supported.

## Superseded Agent Role Instructions (2026-10-27)

The mandatory Orchestrator, role hierarchy, specialist catalogue, and Maestri adapter formerly under `docs/agents/` were superseded as active requirements on 2026-10-27. The portable requirements they carried are now in this document and in [AGENTS.md](../AGENTS.md). The historical instruction files are preserved at commit `4ec11f8f7397806b7920e99f707693babb989467`:

- [Agent instructions index](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/README.md)
- [Shared instructions](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/shared-instructions.md)
- [Orchestrator](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/orchestrator.md)
- [Role files](https://github.com/Samska/samska-sandbox/tree/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/roles)
- [Maestri adapter](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/tool-integration/maestri.md)

The historical files are evidence and learning material, not active instructions. Deleting the Maestri adapter does not revoke the owner's standing authorization recorded in Issue #90. That authorization remains in force with the conditions and limits stated in [Temporary agent lifecycle](#temporary-agent-lifecycle); it covers dismissal only and never authorizes deleting sessions, histories, exports, files, branches, worktrees, role presets, generated role directories, or other preserved state. This supersession authorizes no cleanup.
