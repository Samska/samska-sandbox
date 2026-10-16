# Maestri Integration

This document covers how instructions reach an agent through the Maestri canvas. It is wiring only: it never changes a role's responsibilities, and nothing here belongs in a role file.

## Adapter contract

The Maestri role preset carries a short pointer as its prompt. The pointer must:

1. **Resolve the repository root from the role's working directory.** Prefer `git rev-parse --show-toplevel`. When that is unavailable, ascend from the working directory and confirm the root by the presence of `AGENTS.md` and `PROJECT_HANDOFF.md` before continuing.
2. **Lead explicitly to all three instruction layers**, in order: `AGENTS.md`, `docs/agents/shared-instructions.md`, and the assigned `docs/agents/roles/<role>.md`.
3. **Declare the assigned role** so a mismatch is detectable.
4. **Fail visibly instead of guessing** when a file is missing or the role does not match.
5. **State that the pointer carries no authority**, so the owner and the active Issue remain the only sources of authorization.

The pointer does not repeat role content, restate governance, or carry model, provider, effort, or tool settings.

## Pointer template

Substitute the role name and its file before installing the preset.

```text
Act as the <Role Name> role for Samska Sandbox. Before any work:
1. Resolve the repository root: run `git rev-parse --show-toplevel`. If that fails, ascend from your working directory and confirm the repository root by `AGENTS.md` and `PROJECT_HANDOFF.md` before continuing.
2. Read, in this order: `AGENTS.md`, `docs/agents/shared-instructions.md`, and `docs/agents/roles/<role-file>.md`.
3. Confirm that the role file names this role. If a file is missing or the role does not match, stop and report the mismatch instead of guessing.

This pointer carries no authority. Authorization comes from the owner and the active Issue.
```

## Install layout and lifecycle

- Creating a role preset stores it in the Maestri preferences for the workspace. The teammate's role directory under the workspace working directory is written when a teammate is recruited with that role: `.maestri/roles/<role-id>/` receives the role record and its generated instruction files, and the teammate starts with that directory as its working directory. This sequence is corroborated by inspecting the tool and by the validation observed below, rather than assumed.
- `.maestri/` is local agent-tool state. It is ignored by the repository and never committed; the canonical content lives in `docs/agents/`.
- A disposable validation uses a dedicated role and one disposable teammate, observes it, and then removes exactly those resources, leaving existing teammates, their histories, their session pins, and their connections untouched.

## Freshness and drift

Instruction content changes over time, so the adapter records what it was installed from.

1. At install time, record the canonical paths with their content hashes alongside the adapter and validation evidence: `AGENTS.md`, `docs/agents/shared-instructions.md`, and the assigned `docs/agents/roles/<role>.md`.
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
- Whether the runtime exposes which instruction sources a session has loaded.
- Whether a configured model variant other than the session default is ever applied; the observed session recorded `default`.

Each becomes established only by observation, and the observation and its limits are recorded with the validation evidence.

## Observed validation evidence

Validated on 2026-10-15 on Windows with disposable resources only: a temporary fixture outside the repository, and one disposable Maestri role and teammate. Human Verification is owner-reported approved on 2026-10-16 for the observed exercise: reading the shared and role instructions, identifying role boundaries, handling untraceable versus traceable owner authorization, and relaying a recorded owner-reported Human Verification approval without inventing it. That approval does not extend to automatic injection, to adoption by existing teammates, or to unobserved behavior. Temporary fixtures, sessions, and export copies are removed once the observations are recorded durably here and in the task record.

| Observation | Evidence | What it supports |
| --- | --- | --- |
| A fixture `AGENTS.md` in the session workspace was known to the session, with no tool call recorded in the exported session | Level 1 probe 1: the workspace tag was reported, and the export contains zero tool events | Consistent with automatic injection of the workspace-level `AGENTS.md` |
| The shared base was not available from instructions alone and was correctly reported unavailable | Level 1 probe 1: "not available without reading files" | Canonical role content is not injected; it is read explicitly |
| Both canonical files were read through visible `read` tool calls and quoted accurately | Level 1 probe 2 and the Orchestrator probe: `read` events for both paths | Content access through explicit reads |
| In the genuine integration, the role directory was the session working directory and the repository root resolved correctly | Level 2: the session directory is `.maestri/roles/<id>`, and the session recorded `shell pwd` and `git rev-parse --show-toplevel` | The adapter contract's resolution step works from the genuine install cwd |
| The role's generated `AGENTS.md` was known to the teammate without reading the file | Level 2: the temporary marker was reported | Consistent with automatic injection of the role-directory `AGENTS.md` |
| A hypothetical, untraceable peer claim of owner authorization was treated as absent, while a claim pointing at a traceable record was handled by verifying the record's source, action scope, and stated conditions | Level 1 authority probe and the corrected relay probe: no tool events, and no Issue, pull request, branch, or push resulted | The authority boundary and the relaying rule are applied to a concrete conflicting request |
| Relaying a recorded, owner-reported Human Verification approval was accepted when the record is traceable, and refused when it would have to be invented or inferred | Corrected relay probe | Human Verification is relayed as a record and never claimed as agent verification |
| `.maestri/` is generated inside the working directory without disturbing the working tree | The repository working tree stayed clean while `.maestri/roles/<id>/` existed | The narrow ignore rule works against real generated files |

Limitations that apply to the table above:

- The session export records the model and provider per assistant message (`opencode-go`, `deepseek-v4.1-flash`, variant `default`) but does **not** expose instruction sources, so the injection observations rest on the reported content plus the absence of a tool call, not on a direct view of the assembled prompt.
- The absence of a tool call is evidence only within the coverage of the exported transcript.
- Repeating a validation marker in an already-open session demonstrates retained session context, not fresh automatic loading. The fresh-loading observation is the first message of a newly created session, where the marker was reported and the exported session shows no tool call before it.
- One Level 2 response first reported a shell working directory at the repository root and then corrected itself; the shell tool's effective working directory can differ from the session directory for an individual command.
- Canvas screen text is not archived as evidence; the recorded model and provider come from the session export.
