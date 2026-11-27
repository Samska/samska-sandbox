# SS-059 — Remediating Dependabot alerts in the web workspace

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-059](https://github.com/Samska/samska-sandbox/issues/114)
- Pull request: None yet
- ADRs: None
- Canonical documentation: [Security](../SECURITY.md), [Testing](../TESTING.md)

## What you should learn

- How to read a Dependabot alert: package, vulnerable range, and first patched version.
- The difference between a dependency pinned in `package.json` and one resolved only through the lockfile.
- Why bumping one tool can move several transitive packages.
- How to prove a remediation with `npm audit` and the project's existing gates.

### Core — Know this for interviews

- A fix is the smallest version change that leaves the vulnerable range, verified by the resolved version and by `npm audit`, not by the alert state alone.

## Concepts explained

`vite` and `vitest` are exact pins in `web/package.json`, so fixing them changes the manifest: `vite` 8.2.2 to 8.2.4 and `vitest` 4.1.11 to 4.1.12. `@vitest/mocker` is a dependency of `vitest` and followed it to 4.1.12. `undici` is reached only through `jsdom`, so it moved in the lockfile alone.

## How Samska uses it

The 12 open alerts covered `undici` (patched in 8.12.2), `vite` (8.2.4) and `@vitest/mocker` (4.1.12). Updating `undici` resolved the latest in-range release, 8.13.1, which is newer than the first patched version. The lockfile also moved `@types/estree`, `chai` and `tinyrainbow` as a consequence of the `vitest` bump.

## Interview perspective

A strong answer separates direct pins from transitive resolution, explains why the first patched version is the minimum and why a package manager may choose a newer in-range one, and names the checks used to show no behavior change.

## What not to worry about yet

Automated dependency update tooling and SBOM governance stay deferred.

## Reference

- Issue: [SS-059 (#114)](https://github.com/Samska/samska-sandbox/issues/114)
- Pull request: None yet
- Relevant source files: `web/package.json`, `web/package-lock.json`
- ADRs: None
- Canonical documentation: [Security](../SECURITY.md)
