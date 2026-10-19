# SS-047 — Temporary-agent lifecycle

## What you should learn

- Why persistent versus temporary agent status must be an explicit classification, not an inference from idleness.
- Why evidence and handoff must be retained outside a live terminal before dismissal.
- Why dismissing a temporary agent is not the same as deleting its session, history, exports, role preset, or generated role directory.
- Why an Orchestrator-executed closure procedure is different from native automatic cleanup.
- Why a recorded owner authorization is evidence of a grant, not permission created by the Markdown itself.

### Core — Know this for interviews

- Lifecycle policy belongs in shared instructions; tool commands belong in the tool adapter.
- A narrow standing authorization can cover one action class without implying any deletion or interruption permission.
- The safe default is to preserve records and report a gap when a lifecycle operation cannot guarantee them.

## Concepts explained

Agent lifecycle classification is a scoping decision. A temporary agent has a defined completion condition and an expected end to its active terminal; a persistent agent remains available for future work. Idle is a runtime state, not a classification, so it cannot be used to infer that an agent is temporary.

Dismissal is a workspace action: the documented `maestri dismiss` behavior stops the teammate terminal and removes its canvas node and connections; the canvas graph itself was not directly inspected. It is not a records-retention action. Session history, exports, files, branches, worktrees, role presets, and generated role directories are separate artifacts and require separate, explicit authorization to delete. The safer procedure keeps them and records where the evidence is stored.

Evidence retention must happen before dismissal and must include failed validation as well as successful validation. A session export written to a file outside the repository, plus the Issue/pull request record, lets a later reader reconstruct what happened without relying on terminal scrollback.

Automatic enforcement and procedural closure are different claims. A documented Orchestrator procedure that exports evidence, dismisses a teammate, and verifies preservation is not proof that the tool performs automatic cleanup. No native automatic cleanup should be claimed unless an inspected setting or mechanism demonstrates it.

## How Samska uses it

The tool-agnostic conditions and the limited standing authorization are in the [shared instructions](../agents/shared-instructions.md#temporary-agent-lifecycle); the supported Maestri export/dismiss/verification procedure and observed limitations are in the [Maestri adapter](../agents/tool-integration/maestri.md#temporary-agent-lifecycle). The traceable owner authorization is [Issue #90](https://github.com/Samska/samska-sandbox/issues/90).

The SS-046 cleanup is the dated example: `SS-046 Probe` and `SS-046 Probe 2` were dismissed after their work completed; their OpenCode sessions remained with 10 and 6 messages, the `Adoption Probe` role preset and generated role directory remained, and the session exports were retained outside the repository. That observation supports the procedure but does not establish native automatic cleanup.

## Interview perspective

Expect questions about how to retire temporary workers without losing evidence or overreaching into deletion. A strong answer separates classification from idleness, dismissal from deletion, shared policy from tool commands, and a recorded authorization from permission the documentation creates. It should also say what was verified and what remains an observed limitation.

## What not to worry about yet

Automatic lifecycle enforcement, background cleanup jobs, and a session/export retention service are deferred. The current approach is an explicit Orchestrator procedure with retained evidence and a narrow owner grant.

## Reference

- Issue: [SS-047 (#90)](https://github.com/Samska/samska-sandbox/issues/90)
- Shared policy: [`docs/agents/shared-instructions.md`](../agents/shared-instructions.md#temporary-agent-lifecycle)
- Maestri adapter: [`docs/agents/tool-integration/maestri.md`](../agents/tool-integration/maestri.md#temporary-agent-lifecycle)
- Historical cleanup: [Issue #87](https://github.com/Samska/samska-sandbox/issues/87), [PR #88](https://github.com/Samska/samska-sandbox/pull/88)
- Governance: [`docs/AI-GOVERNANCE.md`](../AI-GOVERNANCE.md)
