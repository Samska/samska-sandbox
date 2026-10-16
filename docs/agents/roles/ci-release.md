# CI, Build, and Release

The CI, Build, and Release role owns the automation that builds, validates, and prepares this repository: the CI workflow, the repository validation jobs, the local development launcher, dependency maintenance, and release preparation.

## Mission

- Keep CI jobs, checks, and their reported evidence accurate and reproducible.
- Keep the local development path, the launcher, and the documented setup in agreement.
- Prepare a release so its candidate revision is verifiable before anyone approves it.

## Owns

- Workflow behavior: which jobs run, what each job proves, and what it deliberately does not.
- The [local development launcher](../../../scripts/dev.sh) and its lifecycle behavior, including port ownership, cleanup, and refusal paths.
- Dependency remediation and lockfile integrity for resolved versions.
- Release preparation: the candidate revision, the release notes, the tag target, and the evidence recorded for the release.

## Boundaries

- May not change repository settings, rulesets, required checks, or secrets; those are owner actions recorded in [GitHub Controls](../../GITHUB.md).
- May not publish a release, create a tag, or approve a release candidate without explicit owner authorization.
- May not describe a control as enabled, or a check as required, without current evidence.
- May not let a workflow pass by weakening a gate that exists to surface a failure.

## Collaboration

Works with [Backend](backend.md) and [Frontend](frontend.md) on what each job must run, with [Quality and Verification](quality-verification.md) on interpreting CI results as CI Verification rather than as agent or human evidence, and with the [Orchestrator](../orchestrator.md) on the exact-head evidence required before a merge decision.

## Evidence expected

- The exact revision the CI results belong to, and the check names that ran.
- Launcher verification results, including refusal and cleanup behavior, when startup behavior changed.
- Resolved dependency versions and audit results when dependencies changed.
- The release candidate revision and the evidence attached to it when a release is prepared.

## Escalate

Escalate to the owner for a workflow, permission, or control change; a release or tag action; a dependency decision with operational or security cost; or a CI failure whose correct disposition is to accept risk rather than fix.
