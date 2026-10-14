# SS-040: Preparing a Versioned Release Without Publishing It

- Status: Active
- Work date: 2026-10-14
- Last reviewed: 2026-10-14
- Work item: [SS-040](https://github.com/Samska/samska-sandbox/issues/72)
- Pull request: Pending
- ADRs: None
- Canonical documentation: [Releasing](../RELEASING.md), [v0.1.0 release notes](../releases/v0.1.0.md), [Roadmap](../ROADMAP.md), [GitHub controls](../GITHUB.md)

## What you should learn

- Preparation and publication as two separately approved states
- Annotated versus lightweight tags, and why published tags are immutable
- Product version versus build metadata versus work-item identifiers
- Source-only releases and provenance honesty
- Reviewing dependency alerts by exposure path, not by severity count
- Documentation that must not run ahead of reality

### Core — Know this for interviews

- A release is an approval boundary: preparing artifacts and publishing them are different decisions with different evidence
- Severity is not exposure: a high advisory in a dev-only test dependency is not the same risk as the same advisory in shipped runtime code
- An immutable annotated tag makes the release candidate auditable; you fix forward and never move a published tag

## Concepts explained

**Two-phase release.** Preparing a release produces reviewable documentation and decisions; publishing creates the tag and the GitHub Release. Keeping the phases separate means the exact release candidate is reviewed before it becomes immutable, and "prepared" can never be mistaken for "published".

**Annotated tags and immutability.** An annotated tag is a Git object with its own message, tagger, and date, unlike a lightweight tag that is only a pointer. Because a tag can be moved or deleted after publication, immutability is a process commitment: a published version is never rewritten, and a mistake is corrected with a new version.

**Version, metadata, identifier.** The product version (`v0.1.0`) names the milestone. Build metadata (`0.1.0-SNAPSHOT` for the backend, `0.1.0` for the private frontend package) describes build tooling, and SS identifiers identify work items. Conflating them creates false claims: a Maven version is not a release.

**Source-only release.** Publishing the tag and letting GitHub generate source archives gives consumers exactly the tagged commit. No binary, package, container, SBOM, or attestation is claimed, so nothing implies a provenance guarantee that was never produced.

**Exposure-based vulnerability triage.** A dependency advisory matters through its path: runtime code, build tooling, or tests. The same seven advisories change meaning when the package is a development-only transitive dependency that never ships and whose affected features (shared caches, pools, retry interceptors) the tests do not exercise.

**Documentation honesty.** A release note is part of the release. While a release is pending, every document must say so; the post-publication reconciliation updates the status only after the tag and release exist.

## How Samska uses it

`docs/RELEASING.md` records the versioning model, readiness checks, the documented publication sequence, and the post-publication reconciliation. `docs/releases/v0.1.0.md` is the final release note, currently marked "Prepared; awaiting publication". The dependency assessment is recorded in [SS-040](https://github.com/Samska/samska-sandbox/issues/72) from the live Dependabot alerts API, and `docs/GITHUB.md` records the release control as prepared rather than enabled.

## Interview perspective

Be ready to explain why publishing is a separate approval from building, how annotated tags differ from lightweight tags and branches, why "the build says 0.1.0" is not release evidence, and how you would triage a severity-9 advisory that lives only in a test dependency. Discuss what a source-only release guarantees and what it deliberately does not.

## What not to worry about yet

SBOM generation, artifact signing, SLSA-style provenance, release automation, deployment environments, and hosted-demo security controls. They are deferred until a concrete need justifies them.

## Reference

- Issue: [SS-040](https://github.com/Samska/samska-sandbox/issues/72)
- Pull request: Pending
- Canonical documentation: [Releasing](../RELEASING.md), [v0.1.0 release notes](../releases/v0.1.0.md), [Roadmap](../ROADMAP.md), [GitHub controls](../GITHUB.md), [AI engineering governance](../AI-GOVERNANCE.md)
