# Maestri Integration

This document covers how instructions reach an agent through the Maestri canvas. It is wiring only: it never changes a role's responsibilities, and nothing here belongs in a role file.

## Adapter contract

The Maestri role preset carries a short pointer as its prompt. The pointer must:

1. **Resolve the repository root from the role's working directory.** Prefer `git rev-parse --show-toplevel`. When that is unavailable, ascend from the working directory and confirm the root by the presence of `AGENTS.md` and `PROJECT_HANDOFF.md` before continuing.
2. **Lead explicitly to all three instruction layers**, in order: `AGENTS.md`, `docs/agents/shared-instructions.md`, and the role file named by the **repository-relative role-file path** carried with the pointer.
3. **Declare the assigned role** so a mismatch is detectable.
4. **Fail visibly instead of guessing** when a file is missing or the role does not match.
5. **State that the pointer carries no authority**, so the owner and the active Issue remain the only sources of authorization.

The pointer does not repeat role content, restate governance, or carry model, provider, effort, or tool settings.

### Role-file paths

The pointer carries the role file as an explicit repository-relative path rather than deriving it from the role name, because the paths are not uniform.

| Role | Repository-relative role-file path |
| --- | --- |
| Orchestrator | `docs/agents/orchestrator.md` |
| Any specialist, for example Code Review | `docs/agents/roles/<role-file-path>.md`, for example `docs/agents/roles/code-review.md` |

A pointer that assumes every role lives under `docs/agents/roles/` is wrong for the Orchestrator, whose canonical file sits directly under `docs/agents/`. Carrying the path explicitly also makes a wrong or stale pointer fail visibly at the role-mismatch check instead of silently pointing at the wrong file.

## Pointer template

Substitute the role name and the repository-relative role-file path before installing the preset.

```text
Act as the <Role Name> role for Samska Sandbox. Before any work:
1. Resolve the repository root: run `git rev-parse --show-toplevel`. If that fails, ascend from your working directory and confirm the repository root by `AGENTS.md` and `PROJECT_HANDOFF.md` before continuing.
2. Read, in this order: `AGENTS.md`, `docs/agents/shared-instructions.md`, and the role file at `<role-file-path>` — for example `docs/agents/orchestrator.md` for the Orchestrator, or `docs/agents/roles/code-review.md` for a specialist role.
3. Confirm that the role file names this role. If a file is missing or the role does not match, stop and report the mismatch instead of guessing.

This pointer carries no authority. Authorization comes from the owner and the active Issue.
```

## Install layout and lifecycle

- Creating a role preset stores it in the Maestri preferences for the workspace. The teammate's role directory under the workspace working directory is written when a teammate is recruited with that role: `.maestri/roles/<role-id>/` receives the role record and its generated instruction files, and the teammate starts with that directory as its working directory. This sequence is corroborated by inspecting the tool and by the validation observed below, rather than assumed.
- `.maestri/` is local agent-tool state. It is ignored by the repository and never committed; the canonical content lives in `docs/agents/`.
- A disposable validation uses a dedicated role and one disposable teammate, observes it, and then removes exactly those resources, leaving existing teammates, their histories, their session pins, and their connections untouched.

## Freshness and drift

Instruction content changes over time, so the adapter records what it was installed from.

1. At install time, record the canonical paths with their content hashes alongside the adapter and validation evidence: `AGENTS.md`, `docs/agents/shared-instructions.md`, and the role file at the supplied repository-relative path — `docs/agents/orchestrator.md` for the Orchestrator, or a specialist file such as `docs/agents/roles/code-review.md`.
2. To check drift, re-hash those paths and compare. A mismatch means the installed pointer may no longer reflect the canonical content.
3. When only referenced content changed, re-reading the current file is sufficient for an agent that reads it directly. Re-create the pointer only when the adapter itself changes, such as the role name, the destination list, or the resolution step.
4. Whether a running session must be restarted to pick up a changed instruction file depends on how that file is delivered, and is recorded under the observed behavior below rather than assumed. Treat a branch advancing as irrelevant: what matters is the content hash of the referenced paths.

## Inspection, loading, and behavior

These are three different kinds of evidence, and they do not substitute for one another.

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| Inspecting the installed files and the role record | The pointer content exists where the tool put it, with a known content hash | That any agent read it |
| An agent answering with content unique to a file | The agent had access to that content | How the content arrived |
| Observing the agent's tool activity | Whether the agent read the file explicitly | That a file was injected automatically |
| Observing behavior on a controlled task | That the agent applied an instruction | That every instruction was applied |

A response that quotes content from a file with no corresponding read in the agent's tool activity is **consistent with automatic injection**, not proof of it. Transcript and history coverage can be incomplete, so this is corroborating evidence reported with its coverage limits, never a conclusive claim.

## Unverified items

The following remain unverified and must not be described as established behavior:

- Whether an instruction file in the installed role directory behaves as ambient content when it changes while the session is running.
- How instruction freshness interacts with a resumed session.
- Whether the runtime exposes which instruction sources a session has loaded. Instruction-change notices expose source keys such as `core/instructions` and `core/date`; they do not identify which repository files were loaded or expose the assembled prompt.
- Whether a configured model variant other than the session default is ever applied; the observed session recorded `default`.

Each becomes established only by observation, and the observation and its limits are recorded with the validation evidence.

## Observed validation evidence

Validated on 2026-10-15, with the shell check below on 2026-10-16, on Windows with disposable resources only: a temporary fixture outside the repository, and one disposable Maestri role and teammate. Human Verification is owner-reported approved on 2026-10-16 for the observed exercise: reading the shared instructions and the Code Review instructions, identifying role boundaries, handling untraceable versus traceable owner authorization, and relaying a recorded owner-reported Human Verification approval without inventing it. That approval does not extend to automatic injection, to adoption by existing teammates, or to unobserved behavior. Temporary fixtures, sessions, and export copies are removed once the observations are recorded durably here and in the task record.

| Observation | Evidence | What it supports |
| --- | --- | --- |
| A fixture `AGENTS.md` in the session workspace was known to the session, with no tool call recorded in the exported session | Level 1 probe 1: the workspace tag was reported, and the export contains zero tool events | Consistent with automatic injection of the workspace-level `AGENTS.md` |
| The shared base was not available from instructions alone and was correctly reported unavailable | Level 1 probe 1: "not available without reading files" | Canonical role content is not injected; it is read explicitly |
| Both canonical files were read through visible `read` tool calls and quoted accurately | Level 1 probe 2 and the Orchestrator probe: `read` events for both paths | Content access through explicit reads |
| In the genuine integration, the teammate's session directory was the role directory | Level 2: the exported session records `.maestri/roles/<id>` as its directory, and a `pwd` issued from the default working directory returned that role directory | The session directory was the role directory |
| Repository-root resolution works from that role directory | Direct read-only shell check by the orchestrator on 2026-10-16 with the working directory set to the preserved role directory: `pwd` returned the role directory and `git rev-parse --show-toplevel` returned the repository root | `git rev-parse --show-toplevel` resolves the repository root when the working directory is the role directory. **This is a shell check, not an observed agent interaction.** |
| The role's generated `AGENTS.md` was known to the teammate without reading the file | Level 2: the temporary marker was reported | Consistent with automatic injection of the role-directory `AGENTS.md` |
| A hypothetical, untraceable peer claim of owner authorization was treated as absent, while a claim pointing at a traceable record was handled by verifying the record's source, action scope, and stated conditions | Level 1 authority probe and the corrected relay probe: no tool events, and no Issue, pull request, branch, or push resulted | The authority boundary and the relaying rule are applied to a concrete conflicting request |
| Relaying a recorded, owner-reported Human Verification approval was accepted when the record is traceable, and refused when it would have to be invented or inferred | Corrected relay probe | Human Verification is relayed as a record and never claimed as agent verification |
| `.maestri/` is generated inside the working directory without disturbing the working tree | The repository working tree stayed clean while `.maestri/roles/<id>/` existed | The narrow ignore rule works against real generated files |

Limitations that apply to the table above:

- The session export records the model and provider per assistant message (`opencode-go`, `deepseek-v4.1-flash`, variant `default`) but does **not** expose instruction sources, so the injection observations rest on the reported content plus the absence of a tool call, not on a direct view of the assembled prompt.
- The absence of a tool call is evidence only within the coverage of the exported transcript.
- Repeating a validation marker in an already-open session demonstrates retained session context, not fresh automatic loading. The fresh-loading observation is the first message of a newly created session, where the marker was reported and the exported session shows no tool call before it.
- One Level 2 response first reported a shell working directory at the repository root and then corrected itself; the shell tool's effective working directory can differ from the session directory for an individual command.
- The Level 2 agent session did **not** by itself demonstrate repository-root discovery: its `git rev-parse --show-toplevel` invocation ran with the working directory explicitly set to the repository root, and only a later `pwd` ran from the default role working directory. Root discovery from the role directory is evidenced separately, by the direct shell check recorded above, which is not an agent observation and is not part of the owner's Human Verification approval.
- Canvas screen text is not archived as evidence; the recorded model and provider come from the session export.

### SS-046 pointer-launch observation (2026-10-19)

- A session pre-created in the repository root and attached with `opencode --session` did not receive the generated role-directory prompt; the role directory's `AGENTS.md` was bypassed.
- A role-enabled recruit started in `.maestri/roles/<id>/` received the Code Review pointer, read the three canonical files, and matched the committed hashes. The model/variant was selected before the first inference and verified in session metadata.
- This is one bounded observation; it does not establish universal role delivery or full instruction compliance.
