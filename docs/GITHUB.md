# GitHub Repository Controls

## Purpose

GitHub is part of the engineering laboratory. This document records the desired repository controls and distinguishes them from controls independently verified as enabled.

No GitHub repository control is verified as enabled during SS-001. This document is an intended baseline, not evidence of configuration.

## Desired Controls

| Control | Intended Direction | SS-001 Verification Status |
| --- | --- | --- |
| Protected `main` branch | Require reviewed, passing changes before merge when collaboration requires it | Not verified |
| Rulesets | Apply branch and repository protections as supported | Not verified |
| GitHub Issues and Projects | Track execution work and planning | Not verified |
| Pull requests | Use short-lived branches and reviewable changes | Not verified |
| GitHub Actions | Evolve CI with repository and product capabilities | Not verified |
| GitHub Environments | Use controlled deployment environments when deployments exist | Not verified |
| Dependabot | Review dependency updates when dependency manifests exist | Not verified |
| Dependency Review | Review dependency-change risk when supported | Not verified |
| CodeQL | Analyze supported application code when it exists | Not verified |
| Secret scanning and push protection | Detect and prevent exposed secrets where available | Not verified |
| GitHub Container Registry | Publish images only when image distribution is justified | Not verified |
| Releases | Publish versioned, reviewable milestones | Not verified |
| SBOM and artifact attestations | Add when build and release outputs exist | Not verified |
| Security advisories and private reporting | Support responsible vulnerability disclosure | Not verified |

## Configuration Rules

- SS-004 will configure applicable repository security controls and record what was independently verified.
- SS-005 may add lightweight repository or documentation CI only when justified; it must not predict application build systems.
- Backend, frontend, persistence/integration, and end-to-end CI evolve with their corresponding implementation work.
- GitHub settings that cannot be represented in the repository must be checked manually and their verification date recorded here when enabled.
- No workflow, token, secret, or control should be represented as active solely because it is desired.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution expectations and [SECURITY.md](../SECURITY.md) for vulnerability reporting.
