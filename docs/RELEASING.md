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
- CI passes on the exact final preparation pull request head. That evidence applies to the reviewed head; it is not presented as checks executed on the merged squash commit, which the final candidate gate verifies separately.
- Release evidence keeps three things distinct: the preparation pull request's CI result on its exact final head, the historical SS-039 verification for the merged implementation, and the final candidate verification on the resulting `main` SHA.
- Release notes exist at `docs/releases/vX.Y.Z.md` with status "prepared; awaiting publication".
- Current dependency alerts are reviewed with fresh evidence and recorded: advisory, affected resolved version and path, application-runtime exposure versus developer/CI exposure, exploit conditions, available fix, and release relevance. A source-only release does not remove dependency risk: the tagged source archive contains the committed lockfile, so installing dependencies from it reproduces the same resolved versions until the lockfile is updated. Remediation or acceptance of a material risk is an owner decision, and release preparation does not change dependencies.
- Deliberate limitations are preserved accurately and never presented as resolved: synthetic data and simulated payments only, no authentication or authorization, no hosting or persistence, process-local state that is lost on restart, and no automated browser end-to-end suite.

## Release Notes And Release Body

- `docs/releases/vX.Y.Z.md` is the canonical release notes file on the default branch. Its status block and preparation-only statements describe the preparation state and must not be published.
- The GitHub Release body is a separate, publication-ready text derived from the durable sections of the release notes (delivered capabilities, journey, verification, limitations, build metadata, dependency review) with all preparation-status text omitted. It is written in published tense and never claims that the tag or release does not exist.
- The exact published body is prepared and recorded when publication is authorized; it may add the final candidate SHA and the verification identifiers recorded during the gate.
- The tag points at a commit whose `docs/releases/vX.Y.Z.md` still contains preparation-status text. The tagged file remains a historical preparation snapshot and is not edited; the post-publication reconciliation updates the default branch to the published state, so the default branch and the tag differ by that documentation change. This is expected and does not invalidate the tag.

## Final Candidate Gate

Performed after the authorized squash merge of the preparation pull request, before any tag exists:

1. Record the full resulting `main` SHA.
2. Verify tree equivalence to the approved pull request head (for example, `git diff --quiet <approved-head> <main-sha>` reports no differences) and record the result; stop on material divergence.
3. Perform and record the planned final candidate verification on that exact `main` SHA. Checks executed on the pull request head are evidence for the reviewed head only and are not represented as checks executed on the squash commit.
4. Stop for owner approval of that exact SHA. One explicit publication authorization may then cover the routine tag, release, and verification sequence; stop if the candidate diverges materially.

## Publication Sequence

Documented for the approved release; publication follows the final candidate gate and explicit owner authorization.

1. The owner authorizes merging the preparation pull request; record the resulting full `main` SHA and complete the final candidate gate.
2. The owner approves the exact full commit SHA for the tag (the publication authorization).
3. Create an annotated, immutable tag `vX.Y.Z` targeting that SHA, and push the tag.
4. Create a GitHub Release for the tag: a normal milestone release (not marked prerelease) with the prepared publication body, source-only with GitHub-generated source archives, and no binary, package, or container assets.
5. Verify the tag, the release, and the rendered notes. A published tag is immutable: never move or reuse it. If a release is wrong, document the correction and publish a new version.
6. Reconcile documentation after publication as described below.

No release workflow, release automation, SBOM, or artifact attestation exists or is planned by this guidance.

## Post-Publication Documentation Reconciliation

After publication, update the release notes status, the `README.md` milestone and next-work wording, `docs/ROADMAP.md`, `docs/GITHUB.md`, `PROJECT_HANDOFF.md`, and the related learning record to the published state. Until that change lands, documentation must continue to describe the release as prepared and awaiting publication. Documentation must never describe a release as published before the tag and GitHub Release exist. The tagged `docs/releases/vX.Y.Z.md` remains a historical preparation snapshot; only the default branch is reconciled.

## Related Documentation

- [Roadmap](ROADMAP.md) for release and milestone direction.
- [GitHub controls](GITHUB.md) for repository release capabilities and their verification status.
- [AI engineering governance](AI-GOVERNANCE.md) for approval and evidence rules.
- Release notes live under `docs/releases/`.
