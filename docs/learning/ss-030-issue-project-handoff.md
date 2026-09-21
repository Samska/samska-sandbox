# SS-030: Issue and Project Handoff Protocol

- Status: Active
- Work date: 2026-09-21
- Last reviewed: 2026-09-21
- Work item: [SS-030](https://github.com/Samska/samska-sandbox/issues/47)
- Pull request: None at Build/Agent Verification stop
- ADRs: None; this is a process decision, not an architecture decision
- Canonical documentation: [AI Governance](../AI-GOVERNANCE.md), [GitHub controls](../GITHUB.md), [Testing](../TESTING.md), [Contributing](../../CONTRIBUTING.md)

## What you should learn

- Why asynchronous work needs an explicit handoff contract
- How GitHub Issue Forms and pull request templates enforce structure differently
- Why a controlled vocabulary beats free-text status
- The boundary between structural CI validation and content review
- How one canonical document plus thin pointers avoids policy duplication
- Why a project snapshot must have a bounded scope

### Core — Know this for interviews

- Handoff sections are ordered contracts, not summaries.
- The Issue Form is a UI gate; pull request headings can be CI-validated.
- A heading-presence check proves structure, never meaning.
- Snapshots stay useful when they record current state instead of history.

## Concepts explained

A handoff contract lists the context another session needs to continue work without reading a conversation: objective, scope, exclusions, acceptance criteria, decisions, files, verification plan, open questions, next step, and whether the project snapshot changes. Order matters because it makes the handoff predictable to write and review.

Enforcement depends on the surface. Issues have no CI event trigger, so the GitHub Issue Form and the `blank_issues_enabled: false` setting shape structure only through the web UI. The form is skipped entirely by API- and agent-created Issues, which is why the protocol requires those paths to reproduce the same canonical fields manually. Pull request bodies, by contrast, are read by the workflow on `opened`, `synchronize`, `reopened`, and `edited` events, so heading presence can be automated.

A controlled vocabulary turns status into a small fixed set: `Planned`, `Awaiting approval`, `In Build`, `Blocked`, `Paused`, `Completed`. Free text drifts; a fixed set stays comparable and scriptable.

The CI check greps for required heading lines. It cannot judge whether content is true or complete. That is a deliberate boundary: structural automation is cheap and deterministic, while quality remains human review.

`PROJECT_HANDOFF.md` is a bounded snapshot: current active work and recent durable completed work. Git history and pull requests already preserve the full record, so copying per-Issue history into the snapshot would duplicate it and go stale.

## How Samska uses it

[.github/ISSUE_TEMPLATE/work-item.yml](../../.github/ISSUE_TEMPLATE/work-item.yml) renders the canonical Issue Handoff for every Issue created through the web UI, and [config.yml](../../.github/ISSUE_TEMPLATE/config.yml) disables blank issues. [.github/pull_request_template.md](../../.github/pull_request_template.md) provides the Pull Request Handoff headings, and the Repository validation job in [.github/workflows/ci.yml](../../.github/workflows/ci.yml) fails when any required heading is missing, including after a body edit. [AI Governance](../AI-GOVERNANCE.md) is the canonical protocol, [AGENTS.md](../../AGENTS.md#session-resume) adds the session resume procedure, [CONTRIBUTING.md](../../CONTRIBUTING.md#issue-and-pull-request-handoff) states contributor expectations, [GitHub controls](../GITHUB.md) records the control while keeping required status checks deferred, and [Testing](../TESTING.md) describes the validation. The Issue Form deliberately sets no labels, assignees, or Project metadata; those remain owner decisions per CONTRIBUTING.

## Interview perspective

Expect questions about template enforcement across UI and API paths, why CI checks structure instead of content, how controlled vocabularies reduce drift, and how snapshot documents differ from logs. A strong answer explains the trade-off behind each choice and the failure mode it prevents.

## What not to worry about yet

Automated content validation, comment bots, required status checks, agent-specific tooling, Project-field automation, and the Product Storefront issue. This work is documentation, templates, and one validation step inside the existing Repository validation job.

## Reference

- Issue: [SS-030](https://github.com/Samska/samska-sandbox/issues/47)
- Pull request: None at Build/Agent Verification stop
- Relevant source files: [.github/ISSUE_TEMPLATE/work-item.yml](../../.github/ISSUE_TEMPLATE/work-item.yml), [.github/pull_request_template.md](../../.github/pull_request_template.md), [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- ADRs: None
- Canonical documentation: [AI Governance](../AI-GOVERNANCE.md), [GitHub controls](../GITHUB.md), [Testing](../TESTING.md), [Contributing](../../CONTRIBUTING.md)

## Why this design

Alternatives considered: a handoff file per Issue (rejected: duplicates the Issue body and the project snapshot); a free-text status field (rejected: inconsistent and unscriptable); full content validation in CI (rejected: brittle heuristics and noise); a second protocol document (rejected: policy duplication); enabling required status checks now (deferred until branch protection policy justifies it). The chosen design keeps one canonical protocol, one template per surface, one cheap validation step, and a bounded snapshot.

## Common mistakes

- Treating the heading check as proof that handoff content is complete or accurate
- Creating Issues through the API or an agent and skipping the canonical fields
- Using the handoff status as a replacement for the Project Status field
- Logging every Issue into `PROJECT_HANDOFF.md` instead of keeping it a snapshot
- Expecting the Issue Form to assign labels, assignees, or Project fields
- Forgetting that editing a pull request body re-runs handoff validation
