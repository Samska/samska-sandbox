# AI Agent Instructions

This repository's documentation is the authoritative project context. Conversation history is not.

Before meaningful work, an agent must:

1. Read this file and documentation relevant to the task.
2. Inspect the existing implementation and identify affected modules.
3. Assess scope, security implications, and appropriate risk-based tests.
4. Produce a concise plan before making substantial changes.
5. Implement only the requested scope; do not pull roadmap work forward.
6. Run appropriate verification and report decisions, tradeoffs, risks, and remaining concerns.

Follow these rules:

- Do not add dependencies, infrastructure, or architectural patterns without a demonstrated need and justification.
- Keep the backend a modular monolith unless an accepted ADR changes that direction.
- Create an ADR for significant, durable architectural decisions; do not create ADRs for routine implementation choices.
- Never add, expose, log, or commit secrets, credentials, private keys, or real customer data.
- Use synthetic data and simulated payments only.
- Update affected documentation in the same change as implementation.
- Human review and validation remain mandatory for all AI-produced work.

Read the relevant detailed guidance in [docs/AI-GOVERNANCE.md](docs/AI-GOVERNANCE.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/TESTING.md](docs/TESTING.md), [docs/SECURITY.md](docs/SECURITY.md), and [docs/adr/README.md](docs/adr/README.md).
