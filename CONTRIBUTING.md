# Contributing

Samska Sandbox is an educational engineering laboratory. Contributions should improve the product or its engineering practice without introducing speculative complexity.

## Before You Start

1. Read [AGENTS.md](AGENTS.md) when using an AI coding agent.
2. Read the documentation relevant to the proposed change.
3. Check the [roadmap](docs/ROADMAP.md) and existing issues or project work before starting new scope.
4. Raise a proposal before introducing a dependency, infrastructure component, or significant architecture change.

## Change Expectations

- Use short-lived branches and keep `main` healthy.
- Keep changes focused and reviewable.
- Add or update risk-appropriate tests when implementation exists.
- Update documentation in the same change when behavior, architecture, security posture, process, or roadmap status changes.
- Record significant, durable architecture decisions as described in [the ADR guide](docs/adr/README.md).
- Do not commit secrets or real data. Follow [security guidance](docs/SECURITY.md).

## Pull Request Evidence

A pull request should explain the requested scope, decisions made, security considerations, verification performed, documentation updates, and remaining risks or follow-up work. AI-generated output requires the same human review and validation as manually written output.

Repository rules, required checks, and security controls will be documented and verified through the GitHub configuration work item. See [docs/GITHUB.md](docs/GITHUB.md) for the intended baseline and current verification status.
