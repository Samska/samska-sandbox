# Releasing

## Purpose

Concise guidance for preparing, approving, and publishing a Samska Sandbox product release. Execution tracking belongs in GitHub Issues and the [Samska Sandbox Project](https://github.com/users/Samska/projects/1); this document describes the durable process and its boundaries.

## Versioning Model

- Samska Sandbox uses Semantic Versioning at the product level. There is one product version; work-item (SS) identifiers and product versions are independent, and an identifier is allocated only when its Issue is created.
- Releases are milestone-based rather than Issue-based, and Git tags use `vMAJOR.MINOR.PATCH`.
- Versions below `1.0.0` are evolving, pre-stable product milestones. The first planned release is `v0.1.0 — First Order`.
- Build metadata is not the product release: the backend version is `0.1.0-SNAPSHOT` and the private frontend package is `0.1.0`. Neither is evidence that a product release exists.
- A release is prepared in a normal short-lived branch and pull request, and published only after separate owner approval. Preparation never creates a tag or a GitHub Release.

## Release Readiness

- The exact release candidate is a full commit SHA on `main`; the preparation pull request and its merge complete first.
- CI passes on the exact final pull request head, and evidence stays distinct: Agent Verification, Human Verification, and CI Verification.
- Release notes exist at `docs/releases/vX.Y.Z.md` with status "prepared; awaiting publication".
- Current dependency alerts are reviewed with fresh evidence and recorded: advisory, affected resolved version and path, runtime/build/test exposure, exploit conditions, available fix, and release relevance. Remediation or acceptance of a material risk is an owner decision, and release preparation does not change dependencies.
- Deliberate limitations are preserved accurately and never presented as resolved: synthetic data and simulated payments only, no authentication or authorization, no hosting or persistence, process-local state that is lost on restart, and no automated browser end-to-end suite.

## Publication Sequence

Documented for the approved release; each step requires explicit owner authorization.

1. The owner authorizes merging the preparation pull request; verify `main` equals the approved release candidate SHA.
2. The owner approves the exact full commit SHA for the tag.
3. Create an annotated, immutable tag `vX.Y.Z` targeting that SHA, and push the tag.
4. Create a GitHub Release for the tag: a normal milestone release (not marked prerelease) with the body from `docs/releases/vX.Y.Z.md`, source-only with GitHub-generated source archives, and no binary, package, or container assets.
5. Verify the tag, the release, and the rendered notes. A published tag is immutable: never move or reuse it. If a release is wrong, document the correction and publish a new version.
6. Reconcile documentation after publication as described below.

No release workflow, release automation, SBOM, or artifact attestation exists or is planned by this guidance.

## Post-Publication Documentation Reconciliation

After publication, update the release notes status, the `README.md` milestone and next-work wording, `docs/ROADMAP.md`, `docs/GITHUB.md`, `PROJECT_HANDOFF.md`, and the related learning record to the published state. Until that change lands, documentation must continue to describe the release as prepared and awaiting publication. Documentation must never describe a release as published before the tag and GitHub Release exist.

## Related Documentation

- [Roadmap](ROADMAP.md) for release and milestone direction.
- [GitHub controls](GITHUB.md) for repository release capabilities and their verification status.
- [AI engineering governance](AI-GOVERNANCE.md) for approval and evidence rules.
- Release notes live under `docs/releases/`.
