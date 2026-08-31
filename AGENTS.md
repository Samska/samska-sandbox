# AI Agent Instructions

Repository documentation is the authoritative project context. Conversation history, generated output, and agent assumptions are not.

Before meaningful work, an agent must:

1. Read this file, documentation relevant to the task, and the existing implementation.
2. Confirm requested scope, acceptance criteria, affected modules, documentation, security implications, and risk-based verification.
3. Produce a concise plan before substantial changes and stop for a human decision when material uncertainty exists.
4. Implement only approved scope; do not pull roadmap work forward.
5. Update affected documentation, create or update required learning records under [docs/learning/](docs/learning/README.md), and create an ADR for significant, durable architecture decisions.
6. Run appropriate verification.
7. Report what changed, why, verification, decisions, tradeoffs, alternatives when relevant, risks, and remaining concerns.

Follow these rules:

- Do not add dependencies, infrastructure, or architectural patterns without a demonstrated need and justification.
- Keep the backend a modular monolith unless an accepted ADR changes that direction.
- Never add, expose, log, or commit secrets, credentials, private keys, or real customer data.
- Use synthetic data and simulated payments only.
- Explain meaningful engineering decisions so the human can learn and approve them.
- Human review, understanding, and validation remain mandatory; never accept AI output blindly.

Read the relevant detailed guidance in [docs/AI-GOVERNANCE.md](docs/AI-GOVERNANCE.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/architecture/principles.md](docs/architecture/principles.md), [docs/TESTING.md](docs/TESTING.md), [docs/SECURITY.md](docs/SECURITY.md), [docs/learning/README.md](docs/learning/README.md), and [docs/adr/README.md](docs/adr/README.md).
