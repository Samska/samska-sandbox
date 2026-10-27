# SS-045 — Versioned, tool-agnostic agent role instructions

> **Superseded 2026-10-27.** The mandatory Orchestrator, role hierarchy, specialist catalogue, and Maestri adapter described here were removed as active requirements. This record remains historical evidence and learning material; the links below point to the preserved revision at `4ec11f8`. Current rules are in [AGENTS.md](../../AGENTS.md) and [AI Engineering Governance](../AI-GOVERNANCE.md#superseded-agent-role-instructions-2026-10-27). This note does not alter any Human Verification recorded in this or linked records; its original scope remains.

## What you should learn

- Why instructions should describe obligations and boundaries rather than permissions, and why a role file must never be able to grant authorization.
- How an agent's context is assembled from layered instruction sources, and why the delivery mechanism matters as much as the content.
- Why "the agent quoted the file" is weaker evidence than it appears, and how to keep access evidence separate from delivery evidence.
- How a thin adapter can point at canonical content without an installer, and how content hashes make drift detectable.
- How to bound an experiment so that validating a tool cannot disturb the work it is supposed to support.

### Core — Know this for interviews

- Authority is granted by a person and scoped to a task; instructions are not permissions.
- Instruction layers combine, and a system that combines without conflict resolution needs an explicit, stated precedence rule.
- Evidence provenance: what was inspected, what was executed, and what was merely reported are three different claims.

## Concepts explained

Instruction layering separates what applies to every agent (a shared base) from what applies to one role (a role file) and what applies to one task (the Issue). Layering keeps role files small and prevents the same rule from being written twice in two places that later drift apart.

Authority and instruction are different axes. An instruction can say what an agent must do, may do, or must escalate; it cannot make an action authorized. That separation is what stops a well-written prompt from becoming a permission system.

Relaying an approval is a verification problem, not a trust problem. A relayed authorization or Human Verification approval is usable when its source, action scope, and stated conditions are traceable, and the record is what gets checked — not the agent that passed it on.

Adapter contracts exist because a tool needs a concrete way to deliver instructions. A thin pointer that resolves a repository root, names its destinations, and fails loudly on a mismatch is more durable than copying content, because the canonical text keeps living in one versioned place.

Content hashes convert a vague question ("is this still current?") into a checkable one. A recorded hash of the referenced paths answers it without an installer, a generator, or a rewrite whenever the content changes.

Evidence provenance distinguishes access from delivery. A response that quotes unique file content proves the content was available, not how it arrived. Injection, an explicit read, and prior session history can all produce the same answer, so the weaker claim is the honest one.

## How Samska uses it

The shared base was in [docs/agents/shared-instructions.md](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/shared-instructions.md), the role files and catalogue in [docs/agents/README.md](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/README.md#role-catalogue), and the orchestrator responsibilities in [docs/agents/orchestrator.md](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/orchestrator.md). The tool wiring was in [docs/agents/tool-integration/maestri.md](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/tool-integration/maestri.md) so that no role responsibility depended on a tool.

The authority model reuses the existing governance rather than restating it: authorization and the verification classifications remain in [AI Engineering Governance](../AI-GOVERNANCE.md), and the shared base adds only the conflict-handling and relaying rules that a multi-agent setup needs.

Disposable validation of the first integration observed the distinction this record describes: the workspace-level pointer was already present to the session, while the canonical shared base and role file had to be read explicitly, and hypothetical probes distinguished an untraceable peer claim from a claim pointing at a traceable record. The observations, their method, and their limits are recorded in [the adapter document](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/tool-integration/maestri.md#observed-validation-evidence).

## Interview perspective

Expect questions about how a team of agents avoids acting without authorization, how two agents avoid editing the same file, and how you would prove that an agent actually received the instructions you wrote. A strong answer separates declared obligations from granted permissions, names an explicit precedence rule instead of "whatever is stricter", explains the difference between reading content and being handed it, and describes evidence with its limits rather than a green check mark.

## What not to worry about yet

Nothing here requires an installer, a generator, or a runtime enforcement layer. Provider and model configuration stays outside instruction content. Automating role installation and adding environment-based enforcement remain deferred until an evidence-backed need appears.

## Reference

- Issue: [SS-045 (#84)](https://github.com/Samska/samska-sandbox/issues/84)
- Shared base: [docs/agents/shared-instructions.md](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/shared-instructions.md)
- Role catalogue: [docs/agents/README.md](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/README.md)
- Adapter contract: [docs/agents/tool-integration/maestri.md](https://github.com/Samska/samska-sandbox/blob/4ec11f8f7397806b7920e99f707693babb989467/docs/agents/tool-integration/maestri.md)
