# GitHub Repository Controls

## Purpose

GitHub is part of the engineering laboratory. This document records the repository controls and their verification evidence.

All statuses below were verified on 2026-08-30. `API-verified` controls were confirmed through the GitHub API. `Owner-verified, API-unverified` controls were confirmed by the project owner because the available API does not expose their configuration.

## Configured Controls

| Control | Status | Verified state | Evidence |
| --- | --- | --- | --- |
| `main` protection mechanism | Enabled | Active `Main` ruleset targets the default branch (`main`). | API-verified |
| Pull requests | Enabled | Changes to `main` require a pull request. | API-verified |
| Required approvals | Enabled | The pull request rule requires zero approvals. | API-verified |
| Conversation resolution | Enabled | Pull request review threads must be resolved before merge. | API-verified |
| Force-push protection | Enabled | Non-fast-forward updates to `main` are blocked. | API-verified |
| Branch-deletion protection | Enabled | Deletion of `main` is blocked. | API-verified |
| Bypass policy | Enabled | No bypass actors are permitted. | Owner-verified, API-unverified |
| Squash merge | Enabled | Squash is the only allowed merge method for pull requests to `main`. | API-verified |
| Merge commits | Enabled | Merge commits are not allowed for pull requests to `main`. | API-verified |
| Rebase merge | Enabled | Rebase merges are not allowed for pull requests to `main`. | API-verified |
| Secret Protection / Secret Scanning | Enabled | Secret Scanning is enabled. | Owner-verified, API-unverified |
| Push Protection | Enabled | Push Protection is enabled. | Owner-verified, API-unverified |
| Private Vulnerability Reporting | Enabled | Private vulnerability reports can be submitted through GitHub. | API-verified |
| Security Advisories | Enabled | Available to maintainers for private vulnerability remediation and coordinated disclosure. | Owner-verified, API-unverified |

## Deferred Controls

| Control | Status | Rationale |
| --- | --- | --- |
| Required status checks | Deferred | No CI checks exist yet. |
| GitHub Actions / CI | Deferred | SS-005 may add lightweight repository or documentation checks when justified. |
| CodeQL | Deferred | Application code does not exist yet. |
| Dependabot | Deferred | Dependency manifests do not exist yet. |
| Dependency Review | Deferred | Dependency-change automation is not configured yet. |
| GitHub Environments | Deferred | Deployment environments do not exist yet. |
| GitHub Container Registry | Deferred | Image distribution is not justified yet. |
| Releases | Deferred | Versioned release work has not begun. |
| SBOM and artifact attestations | Deferred | Build and release outputs do not exist yet. |

## Configuration Rules

- SS-005 may add lightweight repository or documentation CI only when justified; it must not predict application build systems.
- Backend, frontend, persistence/integration, and end-to-end CI evolve with their corresponding implementation work.
- GitHub settings that cannot be represented in the repository must be checked manually and their verification date and evidence recorded here when enabled.
- No workflow, token, secret, or control should be represented as active solely because it is desired.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution expectations and [SECURITY.md](../SECURITY.md) for vulnerability reporting.
