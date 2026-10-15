# SS-040: Preparing a Versioned Release Without Publishing It

- Status: Completed
- Work date: 2026-10-14
- Last reviewed: 2026-10-14
- Work item: [SS-040](https://github.com/Samska/samska-sandbox/issues/72)
- Pull request: [#73](https://github.com/Samska/samska-sandbox/pull/73)
- ADRs: None
- Canonical documentation: [Releasing](../RELEASING.md), [v0.1.0 release notes](../releases/v0.1.0.md), [Roadmap](../ROADMAP.md), [GitHub controls](../GITHUB.md)

## What you should learn

- Preparation and publication as two separately approved states
- Annotated versus lightweight tags, and why published tags are immutable
- Product version versus build metadata versus work-item identifiers
- Source-only releases and provenance honesty, including why source-only does not mean dependency-risk-free
- Reviewing dependency alerts by exposure path, not by severity count
- Why a squash merge needs a final candidate gate on a new SHA
- Documentation that must not run ahead of reality

### Core — Know this for interviews

- A release is an approval boundary: preparing artifacts and publishing them are different decisions with different evidence
- Severity is not exposure: a high advisory in a development/test dependency is not the same as the same advisory in application runtime code, and neither can be dismissed by calling the release "source-only"
- An immutable annotated tag makes the release candidate auditable; you fix forward and never move a published tag
- A squash merge creates a new commit, so checks that ran on the pull request head are not checks on the released SHA

## Concepts explained

**Two-phase release.** Preparing a release produces reviewable documentation and decisions; publishing creates the tag and the GitHub Release. Keeping the phases separate means the exact release candidate is reviewed before it becomes immutable, and "prepared" can never be mistaken for "published".

**Annotated tags and immutability.** An annotated tag is a Git object with its own message, tagger, and date, unlike a lightweight tag that is only a pointer. Because a tag can be moved or deleted after publication, immutability is a process commitment: a published version is never rewritten, and a mistake is corrected with a new version.

**Version, metadata, identifier.** The product version (`v0.1.0`) names the milestone. Build metadata (`0.1.0-SNAPSHOT` for the backend, `0.1.0` for the private frontend package) describes build tooling, and SS identifiers identify work items. Conflating them creates false claims: a Maven version is not a release.

**Source-only release.** Publishing the tag and letting GitHub generate source archives gives consumers exactly the tagged commit. No binary, package, container, SBOM, or attestation is claimed, so nothing implies a provenance guarantee that was never produced. Source-only also does not remove dependency risk: the tagged source still contains the committed lockfile, so installing dependencies from it reproduces the same resolved versions until the lockfile is updated.

**Exposure-based vulnerability triage.** A dependency advisory matters through its path: application runtime code, build tooling, or development and CI test tooling. The same seven advisories change meaning when the package's implementation is not bundled into the application and no production path imports it — but the committed lockfile still pins the vulnerable resolved version, and `npm ci` installs it for development and CI. The correct statement is "no application runtime exposure; developer/CI exposure present", not "not shipped, so no risk".

**Squash commits and verified heads.** A squash merge produces a new commit with the same tree and a different SHA. Checks that ran on the pull request head are evidence for the reviewed head, not for the squash commit. A final candidate gate records the resulting `main` SHA, verifies tree equivalence to the approved head, runs the planned verification on that exact SHA, and stops for approval before tagging.

**Documentation honesty.** A release note is part of the release. While a release is pending, every document must say so; the published GitHub Release body is prepared separately from preparation-status text, and the post-publication reconciliation updates only the default branch — the tagged preparation snapshot is historical and is not edited.

## How Samska uses it

`docs/RELEASING.md` records the versioning model, readiness checks, the final candidate gate, the release-notes versus release-body rule, the publication sequence, and the post-publication reconciliation. `docs/releases/v0.1.0.md` is the final release note, published on 2026-10-15 and reconciled to the published state on the default branch, with the preparation-only text excluded from the published body. The dependency assessment is recorded in [SS-040](https://github.com/Samska/samska-sandbox/issues/72) and PR [#73](https://github.com/Samska/samska-sandbox/pull/73) from the live Dependabot alerts API, distinguishing application-runtime from developer/CI exposure. `docs/GITHUB.md` records the release control as configured with the published `v0.1.0` release.

## Interview perspective

Be ready to explain why publishing is a separate approval from building, how annotated tags differ from lightweight tags and branches, why "the build says 0.1.0" is not release evidence, and how you would triage a high advisory that lives only in a development/test dependency without either dismissing it or overstating it. Discuss why a squash merge forces a final candidate gate, what a source-only release guarantees and what it does not, and how you would keep preparation status text out of a published release body.

## What not to worry about yet

SBOM generation, artifact signing, SLSA-style provenance, release automation, deployment environments, and hosted-demo security controls. They are deferred until a concrete need justifies them.

## Reference

- Issue: [SS-040](https://github.com/Samska/samska-sandbox/issues/72)
- Pull request: [#73](https://github.com/Samska/samska-sandbox/pull/73)
- Release: [v0.1.0 — First Order](https://github.com/Samska/samska-sandbox/releases/tag/v0.1.0)
- Canonical documentation: [Releasing](../RELEASING.md), [v0.1.0 release notes](../releases/v0.1.0.md), [Roadmap](../ROADMAP.md), [GitHub controls](../GITHUB.md), [AI engineering governance](../AI-GOVERNANCE.md)
