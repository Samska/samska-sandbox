# SS-046 — Agent instruction adoption

## What you should learn

- Why delivering an instruction file is not the same as an agent adopting it.
- Why explicit reads are a reasonable least-disruptive first attempt, but not proof that restarts are unnecessary.
- Why a committed content hash is version evidence, not behavior evidence.
- Why behavioral probes must be hypothetical and must not grant the authority they describe.
- Why validation-only agents stay separate from functional project roles.

### Core — Know this for interviews

- Adoption requires three separate observations: content access, correct interpretation, and behavior consistent with the instruction.
- Evidence provenance matters: inspected files, tool activity, and observed behavior establish different claims.
- A bounded probe demonstrates bounded behavior, not complete compliance.

## Concepts explained

Instruction layering separates repository-wide rules, shared agent obligations, role-specific boundaries, and task authorization. A role pointer is only a delivery mechanism: it names the canonical files and the assigned role. It does not copy the role content and it never grants permission.

Adoption is weaker than delivery and stronger than a self-report. An agent has adopted a role instruction only when observable evidence shows that it accessed the content, interpreted the relevant boundary correctly, and behaved consistently with that boundary in a controlled situation. A single probe cannot establish that every instruction will be applied in every future task.

A committed hash answers a narrow question: was this exact version of the file part of the evidence? It does not show that the agent read the content, understood it, or followed it. The working tree may differ from the committed blob because of line-ending normalization, so the committed form is the version baseline.

A hypothetical probe is a test input, not an authorization. It describes a request so the agent can classify it, while explicitly stating that no action is requested. This prevents the test itself from becoming a permission or causing the action it is meant to evaluate.

A validation-only agent is a test participant kept separate from functional roles. It may use a canonical role file to exercise the pointer mechanism, but it is not a functional teammate and is excluded from the project role mapping. Its evidence is kept separate from the adoption status of the real agents.

## How Samska uses it

The canonical instructions live in [`AGENTS.md`](../../AGENTS.md) and [`docs/agents/`](../agents/README.md). Role pointers and the Maestri wiring are documented separately in [`docs/agents/tool-integration/maestri.md`](../agents/tool-integration/maestri.md). Runtime model and effort choices are recorded in [`PROJECT_HANDOFF.md`](../../PROJECT_HANDOFF.md), not in role content.

[SS-046 (#87)](https://github.com/Samska/samska-sandbox/issues/87) applies this model: it checks the existing functional agents with bounded hypothetical scenarios, creates canonical role presets for future agents, and runs one separate pointer validation, recording the result and any failure rather than assuming success. The Issue records the difference between a passed probe and full compliance, and preserves failures and pending checks instead of retrying or replacing sessions automatically.

### Observed launch-path result

The first SS-046 pointer attempt pre-created a repository-root session and attached it with `opencode --session`. That bypassed the generated `.maestri/roles/<id>/` prompt: the agent did not receive the Code Review pointer, guessed Orchestrator, and is preserved as a failed observation.

The corrected attempt started the teammate in its role directory with no pre-created session. The model/variant was selected before the first inference and verified in session metadata. The agent named the Code Review role, read `AGENTS.md`, the shared base, and `docs/agents/roles/code-review.md`, matched the committed hashes, and refused the hypothetical self-review request without acting. This is one bounded observation, not proof of full compliance.

## Interview perspective

Expect questions about how you prove that an agent received the instructions it was given. A strong answer separates delivery from adoption, names the evidence type behind each claim, explains why hashes are version evidence only, and describes a bounded behavioral check without pretending that one probe proves universal compliance.

## What not to worry about yet

Automatic instruction enforcement, an installer, and complete prompt observability are deferred. The current approach uses canonical files, explicit pointers, explicit reads, and recorded evidence rather than a new runtime mechanism.

## Reference

- Issue: [SS-046 (#87)](https://github.com/Samska/samska-sandbox/issues/87)
- Shared instructions: [`docs/agents/shared-instructions.md`](../agents/shared-instructions.md)
- Role catalogue: [`docs/agents/README.md`](../agents/README.md)
- Maestri adapter: [`docs/agents/tool-integration/maestri.md`](../agents/tool-integration/maestri.md)
- Runtime record: [`PROJECT_HANDOFF.md`](../../PROJECT_HANDOFF.md#agent-runtime-provisional)
