# AI Agent Instructions

Repository documentation is the authoritative project context. Conversation history, generated output, and agent assumptions are not.

Before meaningful work, an agent must:

1. Read this file, documentation relevant to the task, and the existing implementation.
2. Confirm requested scope, acceptance criteria, affected modules, documentation, security implications, and risk-based verification.
3. Produce a concise plan before substantial changes and stop for a human decision when material uncertainty exists.
4. Implement only approved scope; do not pull roadmap work forward.
5. Update affected documentation, create or update required learning records under [docs/learning/](docs/learning/README.md), and create an ADR for significant, durable architecture decisions.
6. Run appropriate verification.
7. Report what changed, why, verification, decisions, tradeoffs, alternatives when relevant, risks, remaining concerns, and `## Local Environment Changes` as required by [AI Engineering Governance](docs/AI-GOVERNANCE.md).

Follow these rules:

- Do not add dependencies, infrastructure, or architectural patterns without a demonstrated need and justification.
- Keep the backend a modular monolith unless an accepted ADR changes that direction.
- Never add, expose, log, or commit secrets, credentials, private keys, or real customer data.
- Use synthetic data and simulated payments only.
- Explain meaningful engineering decisions so the human can learn and approve them.
- Human review, understanding, and validation remain mandatory; never accept AI output blindly.
- Maintain the Issue Handoff items and Pull Request Handoff sections defined in [the handoff protocol](docs/AI-GOVERNANCE.md#issue-and-project-handoff-protocol), and keep [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) a concise project snapshot.

Read the relevant detailed guidance in [docs/AI-GOVERNANCE.md](docs/AI-GOVERNANCE.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/architecture/principles.md](docs/architecture/principles.md), [docs/TESTING.md](docs/TESTING.md), [docs/SECURITY.md](docs/SECURITY.md), [docs/learning/README.md](docs/learning/README.md), and [docs/adr/README.md](docs/adr/README.md).

## Agent Role Instructions

This repository version-controls the tool-agnostic instructions for orchestrating agents and specialized roles under [docs/agents/](docs/agents/README.md). Every agent follows the [shared instructions](docs/agents/shared-instructions.md), then its assigned [role](docs/agents/README.md#role-catalogue), then the active Issue, in that order. Roles add responsibilities and boundaries; they never grant authorization.

## Session Resume

For a new or resumed work session, use the active Issue and any pull request as the working handoff; do not require the owner to copy their status into a new prompt.

Before implementation:

1. Fetch and refresh the repository; confirm the branch, working tree, and that local `main` equals `origin/main`. In a read-only Plan session, compare local refs with the remote state without changing them, and state that limitation.
2. Read [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) as the concise project snapshot. Verify the active Issue's state, Project status, priority, assignee, and labels; check for an existing pull request and its current state.
3. Read the Issue Handoff and, when a pull request exists, the Pull Request Handoff. Confirm approved scope, decisions, pending questions, blockers, Agent/Human/CI Verification, and the next step against repository and GitHub evidence.
4. Briefly report the confirmed state and next step. Stop for an owner decision if a material conflict, missing approval, or unresolved decision prevents the proposed work; do not silently treat stale handoff text as current state.
5. Keep the Issue and pull request handoffs current at material transitions and decisions, including verification evidence and the next step. Give the owner a concise update when a decision or verification action is needed, rather than repeating the full status on every routine step. Update [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) only under its project-snapshot rule.

Explicit owner decisions, engineering review, required Human Verification before commit or pull request, CI evidence, and explicit merge authorization remain required by [AI Engineering Governance](docs/AI-GOVERNANCE.md).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
