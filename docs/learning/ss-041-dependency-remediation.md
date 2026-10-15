# SS-041: Lockfile-Only Dependency Remediation and Alert-State Honesty

- Status: Active
- Work date: 2026-10-15
- Last reviewed: 2026-10-15
- Work item: [SS-041](https://github.com/Samska/samska-sandbox/issues/74)
- Pull request: [#75](https://github.com/Samska/samska-sandbox/pull/75)
- ADRs: None
- Canonical documentation: [Releasing](../RELEASING.md), [v0.1.0 release notes](../releases/v0.1.0.md), [GitHub controls](../GITHUB.md)

## What you should learn

- Lockfile-only remediation: changing a resolved transitive version without touching `package.json`
- Minimum patched version versus latest in-range version
- Validating a lockfile edit with `npm ci` integrity checks
- Why GitHub alert state and the installed dependency version can disagree
- Scope discipline: reporting a newly observed advisory instead of silently fixing it

### Core — Know this for interviews

- `npm update <pkg>` moves to the latest in-range version, not necessarily the version you intend; the lockfile entry is the actual resolved state
- `npm ci` is the reproducibility gate: it fails if a lockfile entry does not match the registry artifact's integrity
- An open alert is not the same as a vulnerable installed version, and a closed alert is not evidence by itself — verify the resolved version against the advisory's patched range

## Concepts explained

**Resolved version versus declared range.** `package.json` declares `jsdom`, and `jsdom` declares `undici: ^8.9.0`. The lockfile records which version actually resolves. A remediation can change only the resolved entry while keeping the declared range and every other package untouched.

**Minimum patched version.** The `undici` advisories are fixed in 8.10.2 and the `source-map-js` advisory in 1.2.2. Updating `undici` to the latest in-range version (8.12.1 at the time) would also fix them but exceeds the authorized change; selecting the first patched version is the smallest correct move and keeps the diff reviewable.

**Integrity validation.** A lockfile entry carries the tarball URL and a `sha512` integrity hash. Editing the version without the matching hash makes `npm ci` fail; running it proves the artifact matches and the install is reproducible.

**Alert state versus installed state.** GitHub Dependabot alerts track the default branch and refresh asynchronously; they can stay open after a fix is merged, and they may not yet contain an advisory that `npm audit` already reports. Claim resolution only from the installed resolved version plus the advisory's patched range.

**Scope discipline.** Verification surfaced a high `source-map-js` advisory outside the originally authorized scope. The correct action was to record it with its exposure path and available fix and leave acceptance or remediation to the owner — not to expand the change silently. The owner then authorized the extension explicitly, and the same lockfile-only method was applied to the second package.

## How Samska uses it

`web/package-lock.json` resolves `undici` 8.10.2 through `jsdom@30.0.1` and `source-map-js` 1.2.2 through `vite` -> `postcss`, `@tailwindcss/vite` -> `@tailwindcss/node`, and `jsdom` -> `css-tree`; `npm audit` and `npm audit --omit=dev` report 0 vulnerabilities. The remediation PR records `npm ls undici source-map-js`, the two-entry lockfile diff, `npm ci --ignore-scripts`, the frontend typecheck, tests, and production build, and the alert-state distinction; `docs/releases/v0.1.0.md` carries the release-level dependency statement, and `docs/GITHUB.md` records the alert state.

## Interview perspective

Be ready to explain the difference between a declared range and a resolved version, why a lockfile-only fix is often the right-sized security change, how `npm ci` protects lockfile integrity, and how you would report a fix when the alerting system still shows the finding open.

## What not to worry about yet

Automated dependency updates, overrides and resolutions strategies, SCA tooling consolidation, and SBOM-based dependency governance. They are deferred until justified.

## Reference

- Issue: [SS-041](https://github.com/Samska/samska-sandbox/issues/74)
- Pull request: [#75](https://github.com/Samska/samska-sandbox/pull/75)
- Prior record: [SS-040](ss-040-release-preparation.md)
- Canonical documentation: [Releasing](../RELEASING.md), [v0.1.0 release notes](../releases/v0.1.0.md), [GitHub controls](../GITHUB.md)
