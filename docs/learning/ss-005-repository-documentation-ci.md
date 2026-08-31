# SS-005: Repository Documentation CI

- Status: Historical
- Date: 2026-08-31
- Work item: [SS-005, Issue #8](https://github.com/Samska/samska-sandbox/issues/8)
- Pull request: [PR #9](https://github.com/Samska/samska-sandbox/pull/9)
- ADRs: None
- Canonical documentation: [GitHub Repository Controls](../GITHUB.md), [Testing Strategy](../TESTING.md), and [Repository CI workflow](../../.github/workflows/repository-ci.yml)

## Goal and Previous State

SS-005 added the first CI workflow while the repository contained documentation and governance only. There was no backend, frontend, database, application build, application test suite, or dependency manifest. The work therefore had to validate existing artifacts without predicting future tooling.

## What Changed and Why

The `Repository CI` GitHub Actions workflow runs on pull requests targeting `main`. It lints Markdown, checks local Markdown links offline, and checks EditorConfig compliance. This gives the repository quality gates for the documentation and formatting that actually existed.

The workflow uses job-level `contents: read`, checks out without persisted credentials, pins actions to immutable commit SHAs, and specifies tool versions where the actions support them. These choices reduce unnecessary write capability and limit supply-chain drift in a workflow that evaluates pull requests.

## Engineering Concepts

### Continuous Integration and Quality Gates

Continuous Integration provides automated feedback on changes before merge. In Samska's initial state, the useful gates were Markdown structure, local links, and EditorConfig consistency, not Java, React, database, or end-to-end tests that did not yet exist.

This demonstrates risk-based verification: select the smallest effective checks for the repository's current artifacts. The trade-off is limited coverage. Passing documentation CI says nothing about future application correctness, security, or deployment readiness.

### GitHub Actions Permissions and Credentials

The workflow declares `contents: read`, granting the job only repository-content read access. The checkout step also uses `persist-credentials: false`, preventing the checkout action from retaining a GitHub token in local Git configuration for later steps. Together, they reduce the effect of a compromised or unsafe workflow step, but do not eliminate all workflow or third-party-action risk.

### Immutable Pinning and Supply-Chain Risk

Each referenced action is pinned to a full commit SHA, with a comment recording the release version. A tag can be moved; an immutable SHA fixes the referenced action revision. Tool-version inputs further constrain the tools used by actions where configured.

Pinning improves reviewability and reduces silent action-version drift, but it creates a maintenance responsibility: pinned actions and tools can become outdated or vulnerable and still require deliberate updates.

### `pull_request`, `pull_request_target`, and Deterministic Feedback

The workflow uses `pull_request` for changes targeting `main`; it does not use `pull_request_target`. The selected event is appropriate for running repository validation on proposed changes without requiring the base-repository context associated with `pull_request_target`. Workflows using `pull_request_target` require additional care because untrusted pull-request content can interact with a more privileged base-repository context.

The fixed runner image (`ubuntu-24.04`), immutable action SHAs, explicit tool versions, and offline link checking make CI feedback more predictable. They do not make hosted CI perfectly deterministic: runner images and action internals can still change, and offline link checking intentionally validates local links rather than live external availability.

### Markdown, Links, and EditorConfig

Markdown linting checks repository documentation structure. Lychee runs offline with fragment checks to validate local relative links without relying on network availability. EditorConfig checking enforces declared text-file consistency such as UTF-8, LF endings, final newlines, and trimmed trailing whitespace.

These are repository quality controls, not application tests. They prevent documentation navigation and formatting regressions, but cannot determine whether technical guidance is complete or behavior is correct.

## Alternatives and Trade-offs

SS-005 deliberately did not add Java or React builds, Playwright, Testcontainers, PostgreSQL, CodeQL, Dependabot, dependency review, deployment, containers, or cloud configuration. Adding them before corresponding artifacts existed would create speculative tooling and misleading assurance.

Required status checks remained deferred when this first workflow was introduced. The canonical control document records that they are not configured as required and that runtime verification occurs on the introducing pull request. The historical sources do not define a stability threshold or commit to when required checks will be enabled; do not represent a future requirement as already decided.

## Security and Verification

The workflow's least-privilege permission, disabled persisted credentials, SHA pinning, and `pull_request` trigger are implemented facts in the workflow. They reduce risk but are not a complete CI threat model or a substitute for reviewing third-party actions.

PR #9 reports that actionlint, markdownlint, offline relative-link validation, EditorConfig validation, and `git diff --check` passed. `docs/GITHUB.md` records that runtime verification occurs on the pull request that introduced the workflow. Required status checks remain deferred, and no application-specific CI is configured.

## Failure Modes and Safeguards

- A documentation change can contain a broken local link. Run offline relative-link validation with fragments.
- A workflow step can receive unnecessary write capability or retained credentials. Keep job permissions read-only and disable persisted checkout credentials.
- A mutable action tag can change unexpectedly. Pin to a reviewed commit SHA and update deliberately.
- Passing repository CI can be mistaken for application verification. Keep its scope explicit and add application checks only with implementation.
- An external link can fail while offline checking passes. The workflow intentionally validates local links only; external availability needs separate, justified verification.
- A new quality gate can block merges before its signal is understood. Required status checks remain deferred; the project must make a later evidence-based decision before enforcing them.

## Plan, Build, Review, and Pull Request Lessons

### Plan

Issue #8 required a minimal pull-request workflow that validates existing repository artifacts and follows least privilege. It explicitly excluded application tooling and infrastructure.

### Build

The merged change added one documentation-validation job, `.markdownlint.yaml`, and documentation updates describing its actual checks and deferred status-check configuration.

### Review

No formal GitHub review, review comment, or review finding is recorded for PR #9. The PR reports the local validation results listed above; it cannot establish review outside GitHub.

### Pull Request

PR #9 kept scope to repository CI and recorded explicit security choices: read-only permissions, immutable action pins, and no persisted checkout credentials. It did not claim application CI, required status checks, or deployment controls.

## What the Project Owner Should Understand

Early CI should be valuable for the artifacts that exist, not a future technology checklist. Workflow security matters even for documentation CI because third-party actions, tokens, event context, and supply-chain updates can affect repository trust.

## Interview Practice

### Questions

- How do you choose the first CI checks for a new repository?
- Why use `contents: read`, `persist-credentials: false`, and SHA-pinned actions in GitHub Actions?
- Why is `pull_request` safer than `pull_request_target` for this workflow?
- Why were required status checks deferred?

### Interview-Ready Explanation

Samska began CI with the repository artifacts that existed: Markdown, local documentation links, and EditorConfig rules. The workflow runs on pull requests to `main`, uses `contents: read`, avoids persisted checkout credentials, and pins actions to commit SHAs to reduce privilege and supply-chain drift. We did not add application checks without an application. Required status checks remain deferred because the initial workflow was newly introduced and the repository records only its first runtime validation, not an approved long-term enforcement threshold.

## Follow-up and Sources

Evolve CI alongside backend, frontend, persistence, and end-to-end implementation. Make any required-status-check decision only after reviewing workflow signal, reliability, and the current branch-protection strategy.

- [Issue #8](https://github.com/Samska/samska-sandbox/issues/8)
- [PR #9](https://github.com/Samska/samska-sandbox/pull/9)
- [Repository CI workflow](../../.github/workflows/repository-ci.yml)
- [GitHub Repository Controls](../GITHUB.md)
- [Testing Strategy](../TESTING.md)
