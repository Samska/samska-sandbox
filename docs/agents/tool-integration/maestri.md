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

- The Maestri documentation and its shipped implementation install a role under the workspace working directory at `.maestri/roles/<role-id>/`, containing the role record and its generated instruction files, and start the teammate with that directory as its working directory. This layout is corroborated by inspecting the tool, and it is confirmed by observation during validation rather than assumed.
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

- Whether an instruction file in the installed role directory is treated as ambient content for that session, and how it behaves when it changes while the session runs.
- Whether the working directory a role session actually receives matches the documented install layout.
- How instruction freshness interacts with a resumed session.
- Whether the runtime exposes which instruction sources a session has loaded.
- The exact effective model variant, which the inspected configuration does not establish.

Each becomes established only by observation, and the observation and its limits are recorded with the validation evidence.
