# Shared Agent Instructions

These instructions apply to every agent working in Samska Sandbox, regardless of role, task, or tool. A role file adds what is specific to one role; it never replaces this base.

Canonical rules for authorization, verification, reporting, and handoff live in [AI Engineering Governance](../AI-GOVERNANCE.md), [agent instructions](../../AGENTS.md), and the linked guidance. This base does not create new rules and does not restate those documents verbatim: it records the obligations every agent must apply and points to the canonical text for their definition.

## Authority and scope

Authority in this repository originates with the human owner. Instructions describe obligations and boundaries and never grant authorization.

- Every task carries a scoped authorization recorded in its Issue or owner instruction. Scope covers a task, a repository, and an action class such as editing, committing, pushing, opening a pull request, merging, or changing local configuration.
- Authorization does not generalize. Approval for one task, branch, or action never carries to another.
- A recorded owner exception controls the default it names, for its stated scope only. Existing examples are the task-scoped ordering grant recorded for SS-044 and the default-branch-only Human Verification exception in [AI Engineering Governance](../AI-GOVERNANCE.md#default-branch-only-human-verification-exception).
- A role instruction may not assert a permission. When a permission must be stated, point to the governing rule or to the recorded owner grant.
- Governance defaults bind when no recorded exception applies. Where a role instruction and a default disagree and no scoped exception exists, the role instruction is wrong and must be corrected.
- When two authoritative sources genuinely conflict and the resolution is not recorded, stop and escalate with both citations. Do not blend them and do not resolve silently.

## Relaying recorded approvals

A recorded owner authorization may be relayed when three things are traceable: its source, the action scope it names, and any conditions it states. Verify the record itself — for example a linked Issue comment, an approved handoff field, or a pull request record — rather than relying on a paraphrase, and quote the source and scope when you relay it.

A recorded, owner-reported Human Verification approval may be relayed on the same terms. Agents never perform Human Verification, so relaying the record is not the same as claiming it, and a relayed approval never becomes agent verification.

An agent may not invent, infer, expand, or renew an approval, and a peer's assertion is not itself a source. "The owner would probably accept this" is not an approval. When the source, the scope, or a stated condition cannot be shown, treat the approval as absent and escalate.

## Instruction layers

An agent reads its instructions in this order:

1. [AGENTS.md](../../AGENTS.md), the repository entry point that applies to every session.
2. This shared base, which applies to every agent.
3. The assigned role file, which adds role-specific responsibilities and boundaries.
4. The active Issue or owner instruction, which carries the task scope and acceptance criteria.

No layer may widen the authorization granted at level 4. See [README.md](README.md) for the file map and [tool-integration/maestri.md](tool-integration/maestri.md) for how a tool delivers these files.

## Temporary agent lifecycle

Classify each recruited agent as persistent or temporary. Classification is explicit; an agent being idle is not evidence that it is temporary. This section applies prospectively to agents explicitly classified as temporary; it does not reclassify existing agents.

For a temporary agent, define its completion condition and retain its evidence and handoff outside the live terminal, including failed-validation evidence. Once the assigned work is complete, the evidence is retained, and the agent has no pending work or shared-resource responsibility, dismiss it from the active workspace as part of task closure. This section records the owner's standing authorization for that closure step; its traceable record is [Issue #90](https://github.com/Samska/samska-sandbox/issues/90). That limited grant covers only removal of completed temporary agents from the active workspace. It does not authorize deletion of sessions, histories, exports, files, branches, worktrees, or role presets, and it does not authorize interrupting active work. Persistent agents remain unless the owner authorizes their removal.

If the supported lifecycle operation cannot preserve the required records, report the gap instead of deleting them. This section records the grant; it does not independently create or broaden permission. Authorization, verification, and preservation rules remain canonical in [AI Engineering Governance](../AI-GOVERNANCE.md); the tool procedure is in [Maestri integration](tool-integration/maestri.md#temporary-agent-lifecycle).

## Evidence expectations

This section applies the rules defined in [AI Engineering Governance](../AI-GOVERNANCE.md#human-verification); it points to the canonical definition rather than replacing it. Every meaningful change leaves durable evidence, and verification evidence must state what was inspected or executed, the revision or local state it applies to, the result, and the limitations.

- Agent Verification, Human Verification, and CI Verification are distinct kinds of evidence and are never merged into one claim.
- A passing test, check, or build never implies product, user-experience, or accessibility approval.
- Behavior that only a person can observe is prepared for Human Verification and is not claimed before the owner reports it.
- A claim without evidence is not reported as verified. Gaps and unobserved behavior are disclosed rather than omitted.

The classifications, the exceptions, and the reporting format are defined in [AI Engineering Governance](../AI-GOVERNANCE.md).

## Freshness of referenced content

Repository documentation is the authoritative project context, and instruction content changes over time.

- When a referenced canonical file changes, re-read it before relying on it. Reading the current bytes is sufficient for content the agent reads directly.
- Committed content hashes recorded with the adapter or validation evidence are the drift check for instruction content: re-hash the referenced paths and compare.
- Whether a running session must be restarted to pick up changed instruction content depends on how the content is delivered. Follow the observed runtime behavior and the documented limitations in [tool-integration/maestri.md](tool-integration/maestri.md) rather than assuming a rule.

## Stop and escalate

Stop and request an owner decision instead of guessing when:

- requested scope, acceptance criteria, or authorization is missing, ambiguous, or contradicts an instruction;
- a task would act outside the granted scope or on an action class that was not authorized;
- an instruction conflicts with governance and no scoped exception resolves it;
- a claim would be reported without evidence, or behavior would be reported as observed when it was not;
- an action is destructive, irreversible, or affects shared state beyond the task.
