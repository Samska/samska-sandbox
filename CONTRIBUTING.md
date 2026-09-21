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

A pull request should explain the requested scope, decisions made, security considerations, verification performed, documentation updates, and remaining risks or follow-up work. When applicable, complete and report Human Verification before commit or pull request creation as defined in [AI Engineering Governance](docs/AI-GOVERNANCE.md). AI-generated output requires the same human review and validation as manually written output.

## Issue and Pull Request Handoff

Every Issue carries an Issue Handoff and every pull request carries a Pull Request Handoff, as defined in [AI Engineering Governance](docs/AI-GOVERNANCE.md#issue-and-project-handoff-protocol). Create Issues through the repository Issue Form so the canonical fields are enforced; Issues created through the GitHub API or by an AI agent must reproduce the same fields in the same order. Pull requests use the [pull request template](.github/pull_request_template.md), and the Repository validation job fails when a required handoff heading is missing from the pull request body.

[PROJECT_HANDOFF.md](PROJECT_HANDOFF.md) is one concise project-level snapshot, not a per-Issue work log. Update it in the same change when project state, durable decisions, active work, or the next step changes.

## GitHub Work Metadata

Issues are assigned to `Samska`, added to the [Samska Sandbox Project](https://github.com/users/Samska/projects/1), assigned a Project Status and Priority, and given exactly one `type:` label plus any relevant `area:` labels. Project fields are used for status and priority; they are not duplicated as labels.

Pull requests are assigned to `Samska` and reuse the corresponding Issue's labels. A pull request is not added as a duplicate Project item when its Issue already represents the work. A reviewer may remain empty while this is a solo repository.

The repository taxonomy is intentionally small: `type: feature`, `type: chore`, `type: docs`, and the area labels `area: backend`, `area: frontend`, `area: ci`, `area: testing`, `area: governance`, and `area: security`. Use multiple area labels only when each is materially relevant. Do not create labels for SS identifiers, technologies, status, or priority.

## Branch Lifecycle

Normal work follows: Issue -> short-lived branch -> PR -> squash merge -> remote branch deletion -> checkout `main` -> fetch/prune -> fast-forward local `main` -> local branch deletion -> verify local `main` equals `origin/main`.

Automatic remote deletion is the normal merged-PR path, but teardown must verify that deletion occurred. If it did not, explicitly delete the obsolete remote branch. Disposable verification PRs that close without merge require explicit deletion of their remote and local branches. Never delete a branch still associated with open or unmerged work.

Final task reports should include evidence such as:

```text
Branch teardown:
- remote implementation branch: deleted
- local implementation branch: deleted
- disposable branches: none remaining
- checkout: main
- local main == origin/main: yes
```

For meaningful changes, report README maintenance according to [AI Engineering Governance](docs/AI-GOVERNANCE.md): `README impact: Yes` followed by updated sections, or `README impact: No` with a concise reason when relevant.

Repository rules, CI behavior, required-check status, and security controls are documented in [docs/GITHUB.md](docs/GITHUB.md).
