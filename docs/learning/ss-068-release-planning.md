# SS-068: Release Planning To v1.0.0

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-068 (#132)](https://github.com/Samska/samska-sandbox/issues/132)
- Pull request: See the Issue
- ADRs: [ADR 0012](../adr/0012-adopt-release-plan-to-v1.md)
- Canonical documentation: [Roadmap](../ROADMAP.md), [Releasing](../RELEASING.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- How to turn directional themes into releases with scope and exit criteria.
- Why ordering follows dependencies: identity before per-person data, stock before operations figures.
- Why technology without a measured trigger is deferred.

### Core — Know this for interviews

A release is a testable promise, not a list of technologies. Exit criteria make "done" checkable.

## Concepts explained

### Integration branch

Work for 1.0 merges into `release/1.0` through small pull requests with CI, so history stays reviewable while `main` changes once, after the owner validates.

### Delivered versus published

A milestone is delivered when merged and verified; it is published only through the release process and the owner's authorization.
