# GitHub Repository Controls

## Purpose

GitHub is part of the engineering laboratory. This document records repository
controls and the evidence available for them. Verification dates are stated
per control because repository settings, workflow files, and runtime checks do
not necessarily change on the same date.

## Configured Controls

| Control | Status | Verified state | Evidence |
| --- | --- | --- | --- |
| `main` protection mechanism | Enabled | Active `Main` ruleset targets the default branch (`main`). | API-verified 2026-09-19 |
| Pull requests | Enabled | Changes to `main` require a pull request. | API-verified 2026-09-19 |
| Required approvals | Enabled | The pull request rule requires zero approvals. | API-verified 2026-09-19 |
| Conversation resolution | Enabled | Pull request review threads must be resolved before merge. | API-verified 2026-09-19 |
| Force-push protection | Enabled | Non-fast-forward updates to `main` are blocked. | API-verified 2026-09-19 |
| Branch-deletion protection | Enabled | Deletion of `main` is blocked. | API-verified 2026-09-19 |
| Automatic merged-head branch deletion | Enabled | Merged pull request head branches are deleted automatically. | Owner/external verified 2026-09-19; not exposed by the OpenCode GitHub read surface |
| Bypass policy | Enabled | No bypass actors are permitted. | Owner-verified, API-unverified; recorded 2026-08-30 |
| Squash merge | Enabled | Squash is the only allowed merge method for pull requests to `main`. | API-verified 2026-09-19 |
| Merge commits | Enabled | Merge commits are not allowed for pull requests to `main`. | API-verified 2026-09-19 |
| Rebase merge | Enabled | Rebase merges are not allowed for pull requests to `main`. | API-verified 2026-09-19 |
| Secret Protection / Secret Scanning | Enabled | Secret Scanning is enabled. | Owner-verified, API-unverified; recorded 2026-08-30 |
| Push Protection | Enabled | Push Protection is enabled. | Owner-verified, API-unverified; recorded 2026-08-30 |
| Private Vulnerability Reporting | Enabled | Private vulnerability reports can be submitted through GitHub. | API-verified 2026-08-30 |
| Security Advisories | Enabled | Available to maintainers for private vulnerability remediation and coordinated disclosure. | Owner-verified, API-unverified; recorded 2026-08-30 |
| GitHub Actions / CI | Configured | The `CI` workflow runs on pull request events (`opened`, `synchronize`, `reopened`, `edited`) targeting `main` with independent Repository validation, Backend, and Frontend jobs. Repository validation has `contents: read` and checks Markdown, local relative links, EditorConfig, the rendered Docker Compose configuration, and required pull request handoff headings; Backend and Frontend additionally have narrowly scoped `checks: write` for structured result Check Runs. | `.github/workflows/ci.yml`; runtime verification occurs on the PR that introduces or changes the workflow. |
| Issue Forms | Configured | One generic Issue Form defines the canonical Issue Handoff, and blank issues are disabled. | `.github/ISSUE_TEMPLATE/`; becomes effective on the default branch when merged. |
| CodeQL | Configured | GitHub-managed CodeQL analysis is active. Current successful checks analyze GitHub Actions, Java/Kotlin, and JavaScript/TypeScript. | GitHub Advanced Security CodeQL check and dynamic `github-code-scanning/codeql` workflow observed on PR #37, 2026-09-19. |
| GitGuardian | Configured | GitGuardian Security Checks are active as a separate secret-related PR check. | Successful GitGuardian Security Checks observed on PR #37, 2026-09-19. |

## Deferred Controls

| Control | Status | Rationale |
| --- | --- | --- |
| Required status checks | Deferred | The active `Main` ruleset does not require named status checks. |
| Dependabot | Deferred | Dependency-update automation is not configured. |
| Dependency Review | Deferred | Dependency-change automation is not configured. |
| GitHub Environments | Deferred | Deployment environments do not exist yet. |
| GitHub Container Registry | Deferred | Image distribution is not justified yet. |
| Releases | Deferred | The first versioned release has not begun. |
| SBOM and artifact attestations | Deferred | Build and release outputs do not exist yet. |

## Configuration Rules

- The `CI` workflow keeps repository validation, backend, and frontend work as
  independent jobs within one workflow. A workflow groups automation; jobs run
  independently; steps execute within a job; and Check Runs expose job or
  structured test-result evidence in GitHub.
- Backend and frontend reporting reuses JUnit-compatible XML, publishes named
  Check Runs and Job Summaries, retains seven-day diagnostic artifacts, and
  preserves failed test-job results through an explicit final gate.
- GitHub exposes test evidence through Check Runs, annotations, Job Summaries,
  artifacts, and raw logs; it does not provide a dedicated Bamboo-style Tests
  tab.
- GitHub settings that cannot be represented in the repository must be checked
  manually and their evidence recorded here when enabled.
- Protected default-branch deletion and automatic merged-head branch deletion
  solve different problems: the `Main` ruleset protects `main`, while the
  cleanup setting removes completed short-lived pull request branches.
- Normal branch teardown still verifies remote and local cleanup after merge.
  Disposable branches from pull requests closed without merge require explicit
  remote and local cleanup.
- The Issue Form is the enforced issue-creation path, and the pull request
  template carries the canonical handoff headings. Repository validation checks
  pull request handoff headings only; API- or agent-created Issues are not
  CI-validated and must reproduce the canonical Issue Handoff manually.
- No workflow, token, secret, or control should be represented as active solely
  because it is desired.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution expectations and
[SECURITY.md](../SECURITY.md) for vulnerability reporting.
