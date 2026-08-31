# SS-004: GitHub Repository Security and Governance

- Status: Historical
- Date: 2026-08-30
- Work item: [SS-004, Issue #6](https://github.com/Samska/samska-sandbox/issues/6)
- Pull request: [PR #7](https://github.com/Samska/samska-sandbox/pull/7)
- ADRs: None
- Canonical documentation: [GitHub Repository Controls](../GITHUB.md), [Security Engineering](../SECURITY.md), and [Security Policy](../../SECURITY.md)

## Goal and Previous State

SS-004 established and documented a security and governance baseline for a public repository before application development. Before this work, `docs/GITHUB.md` described desired controls but did not claim that controls were enabled.

## What Changed and Why

The work changed `docs/GITHUB.md` from an intention list into an evidence-based control record. It documented a `Main` ruleset targeting `main`, pull-request-based changes, zero required approvals, required conversation resolution, force-push and branch-deletion protection, and squash-only merging. It also recorded Secret Scanning, Push Protection, Private Vulnerability Reporting, and Security Advisories, with the evidence type for each.

The root security policy was updated to name GitHub Private Vulnerability Reporting as the preferred disclosure path. Controls without a current repository need, such as CodeQL, Dependabot, dependency review, environments, releases, and artifact attestations, remained explicitly deferred.

## Engineering Concepts

### Rulesets, Branch Protection, and Pull-Request-Based Development

GitHub rulesets are technical enforcement that can apply protections to a branch. Samska's active `Main` ruleset prevents direct changes to `main` through its pull-request requirement and blocks force pushes and branch deletion. Requiring conversation resolution makes unresolved PR discussion visible before merge.

The configured required-approval count is zero because the repository is maintained by one person. This supports a PR-based, reviewable change history but does not provide independent peer approval. The owner must therefore perform meaningful self-review rather than treating the rule as a substitute for review.

### Squash Merging and Repository History

Samska allows squash merging and disallows merge and rebase merge methods for pull requests to `main`. A squash merge keeps each completed work item reviewable as one main-branch commit. The trade-off is that individual branch commits are not preserved in `main`, so the PR remains important evidence for implementation history.

### Secret Protection and Vulnerability Disclosure

Secret Scanning detects supported secret patterns already present in repository content, while Push Protection aims to stop supported secrets before they are pushed. Both reduce accidental exposure but do not make it safe to commit credentials or replace careful review.

Private Vulnerability Reporting provides a non-public channel for reports; Security Advisories support maintainer handling of private remediation and coordinated disclosure. These controls complement the repository security policy rather than replacing secure engineering practices.

### Policy, Technical Enforcement, and Progressive Controls

Documentation states intent, scope, and evidence; GitHub settings and rulesets enforce the controls that the platform can enforce. Samska records whether a control was API-verified or owner-verified because documentation alone cannot establish a remote setting.

Security controls evolve with demonstrated need. Deferring application analysis and dependency automation before application code or dependency manifests exist avoids false claims and speculative configuration. Deferral is not a declaration that the risk is permanently accepted.

## Alternatives and Trade-offs

The work did not claim all desired controls were active. It chose explicit deferral over preemptive CodeQL, Dependabot, dependency review, deployment controls, or release controls. It also accepted zero required approvals for a solo-maintainer workflow while preserving PRs, conversation resolution, and protected-branch safeguards.

## Security and Verification

`docs/GITHUB.md` distinguishes API-verified controls from owner-verified, API-unverified controls. The documented Secret Scanning, Push Protection, bypass policy, and Security Advisories evidence is owner verification; the ruleset, merge settings, and Private Vulnerability Reporting evidence includes API verification. This distinction is material: no learning record should upgrade an evidence level.

PR #7 reports documentation-link validation and `git diff --check`. It reports no CI/CD, application code, dependencies, or infrastructure. The work did not test an application because none existed.

## Failure Modes and Safeguards

- A policy can be mistaken for a platform-enforced control. Record evidence type and verify remote settings independently.
- A zero-approval rule can be mistaken for peer review. Require owner understanding and review of the PR evidence.
- Secret-detection tools can miss unsupported patterns or secrets outside scanned paths. Never commit secrets and use Push Protection as a defense in depth.
- A deferred control can be forgotten. Keep deferrals and their rationale in the canonical GitHub controls document.
- An unprotected branch can be force-pushed or deleted. Maintain the active ruleset and re-verify settings when they change.

## Plan, Build, Review, and Pull Request Lessons

### Plan

Issue #6 limited the work to applicable GitHub settings and evidence-backed documentation. It explicitly excluded CI/CD, CodeQL, Dependabot, dependency review, application code, infrastructure, and OpenCode configuration.

### Build

The merged documentation recorded enabled, deferred, and evidence-qualified controls, and it aligned the vulnerability-reporting policy with the configured private reporting path.

### Review

No formal GitHub review, review comment, or review finding is recorded for PR #7. The PR reports documentation-link validation and `git diff --check`; it cannot establish review outside GitHub.

### Pull Request

PR #7 kept scope to SS-004. Its lasting lesson is that a public repository's control documentation must report verified state, not desired state.

## What the Project Owner Should Understand

Repository security is layered: policies guide behavior, GitHub features enforce some controls, and evidence records what is actually enabled. A protected branch with zero required approvals improves change control but does not eliminate the need for careful owner review.

## Interview Practice

### Questions

- How do GitHub rulesets and pull-request requirements protect a repository?
- Why can a solo-maintainer project use zero required approvals while still using pull requests?
- What is the difference between security policy, technical enforcement, and evidence of configuration?

### Interview-Ready Explanation

Before application development, Samska configured a protected `main` workflow: pull requests, conversation resolution, force-push and deletion protection, and squash-only merging. We set required approvals to zero because it is a solo-maintainer repository, but kept PRs as reviewable evidence rather than claiming independent review. We also documented secret protection and private reporting with their verification level, and deferred application-specific controls until code and dependency manifests create a concrete need.

## Follow-up and Sources

Re-verify remote settings when controls change. Revisit deferred controls when application code, dependency manifests, deployment environments, or release artifacts exist.

- [Issue #6](https://github.com/Samska/samska-sandbox/issues/6)
- [PR #7](https://github.com/Samska/samska-sandbox/pull/7)
- [GitHub Repository Controls](../GITHUB.md)
- [Security Engineering](../SECURITY.md)
- [Security Policy](../../SECURITY.md)
