# SS-007: React Application Bootstrap

- Status: Active
- Work date: 2026-09-01
- Last reviewed: 2026-09-02
- Work item: [SS-007, Issue #16](https://github.com/Samska/samska-sandbox/issues/16)
- Pull request: [#17: feat(web): bootstrap React application foundation](https://github.com/Samska/samska-sandbox/pull/17)
- ADRs: None
- Canonical documentation: [README](../../README.md), [Architecture](../ARCHITECTURE.md), [Testing Strategy](../TESTING.md), [Security Engineering](../SECURITY.md), [GitHub Repository Controls](../GITHUB.md), and [Frontend CI workflow](../../.github/workflows/frontend-ci.yml)

## Study Surface

The frontend baseline distinguishes Node tooling from browser execution and combines reproducible dependencies with separate verification layers.

### Must Remember

- Node runs npm, TypeScript, Vite, and Vitest; the browser runs generated JavaScript and React updates the DOM.
- `package.json` declares intent, `package-lock.json` records resolution, and `npm ci` installs the locked graph applicable to the platform and npm configuration.
- React renders UI, TypeScript checks source before runtime, and Vite supplies development and static production-build tooling; none supplies a full-stack application architecture by itself.
- Typecheck, jsdom component test, production build, and browser observation provide different evidence boundaries.
- Browser-delivered configuration, including `VITE_*`, is public and cannot be a secret boundary.

### Mental Model

```text
Node -> npm / TypeScript / Vite / Vitest -> JavaScript assets -> browser -> React DOM
                                      -> Frontend CI: typecheck, test, build
```

### Active Recall

#### Why does Node run the frontend toolchain while React runs in the browser?

<details>
<summary>Answer guide</summary>

- Node executes npm and development/build/test tooling.
- Vite emits JavaScript assets; the browser executes those assets and React updates its DOM.

</details>

#### How do package metadata, the lockfile, and `npm ci` differ?

<details>
<summary>Answer guide</summary>

- `.nvmrc`, `engines`, and `packageManager` select or communicate supported tooling intent.
- `package.json` declares direct packages; the lockfile records the resolved graph and integrity data.
- `npm ci --ignore-scripts` installs that locked graph while reducing lifecycle-script execution.

</details>

#### What does each frontend verification layer prove, and not prove?

<details>
<summary>Answer guide</summary>

- Typecheck finds static type errors, component testing checks visible output in jsdom, and build produces static assets.
- They do not prove real-browser layout, deployment, backend behavior, runtime data validity, or a user journey.

</details>

#### Why can `VITE_*` values not hold secrets?

<details>
<summary>Answer guide</summary>

- Vite exposes them through code delivered to the browser.
- Users can inspect browser-delivered configuration, so it is public.

</details>

### Decision Drills

#### Decision Drill: npm baseline

**Problem:** Install and reproduce dependencies for one JavaScript application without a current workspace need.

**Options:** npm with lockfile, pnpm, or an uncommitted loose dependency graph.

**Decision:** npm with committed `package-lock.json` and `npm ci --ignore-scripts`.

**Why:** Bundled npm and a lockfile are simple for one application; no second package manager or workspace model was justified.

**Trade-off:** npm does not provide pnpm's store efficiency or stricter dependency layout; lockfiles do not establish package safety.

**Reconsider When:** Multiple packages create demonstrated efficiency or boundary problems.

#### Decision Drill: Client-rendered Vite baseline

**Problem:** Establish a browser application without requirements for SSR, server components, framework routing, or full-stack behavior.

**Options:** React with Vite, a full-stack framework such as Next.js, or no frontend foundation.

**Decision:** React, TypeScript, and Vite for a client-rendered baseline.

**Why:** React rendering and Vite tooling satisfied the actual foundation need without framework-owned server architecture.

**Trade-off:** Routing, server rendering, APIs, data fetching, state, hosting, and E2E behavior remain separate future decisions.

**Reconsider When:** Requirements justify framework-owned server rendering, routing, or full-stack behavior.

### Concept Cards

#### Browser and tooling runtime boundary

- **Meaning:** Build/test tools run under Node; TypeScript types do not run in the browser.
- **Samska application:** Node runs the toolchain and Vite emits JavaScript that `main.tsx` uses to render `App`.
- **Boundary or common mistake:** `vite dev` is not production hosting, and browser code cannot protect secrets.

#### Layered frontend verification

- **Meaning:** Different checks detect different failure classes.
- **Samska application:** CI runs deterministic install, typecheck, a semantic jsdom component smoke test, and production build.
- **Boundary or common mistake:** A component smoke test is not E2E, real-browser, backend, or CSS-layout evidence.

### Hands-on Reinforcement

#### Inspect dependency responsibility

- **Prerequisite:** Node 24.20.0 and npm 11.19.0; work from `web/`.
- **Perform or inspect:** inspect `.nvmrc`, `package.json`, and `package-lock.json`, then run `npm ci --ignore-scripts` and `npm ls --depth=0`.
- **Expected observation:** tooling intent, direct dependencies, and locked resolution are represented separately.
- **Explain:** why the lockfile improves reproducibility without making dependencies safe.
- **Cleanup:** `node_modules/` is generated; remove it only if a clean workspace is required.
- **Proves / does not prove:** practices dependency interpretation; does not prove vulnerability safety.

#### Compare verification layers

- **Prerequisite:** installed web dependencies; work from `web/`.
- **Perform or inspect:** run `npm run typecheck`, `npm test`, and `npm run build`.
- **Expected observation:** each command passes and build creates `dist/`.
- **Explain:** name one failure each command can detect and one it cannot.
- **Cleanup:** remove `dist/` only if a clean workspace is required.
- **Proves / does not prove:** validates static, component, and asset-generation layers, not deployment or a user journey.

### Interview Drill

#### Justify the frontend baseline and its confidence boundaries

- **Expected reasoning:** Node/browser separation, npm and lockfile choice, React/TypeScript/Vite responsibilities, client-rendered boundary, verification layers, browser-public configuration, and deferred behavior.
- **Likely follow-up:** when would pnpm, a full-stack framework, or E2E testing be justified?
- **Short, 15-30 seconds:** a reproducible client-rendered baseline with distinct tooling and browser responsibilities.
- **Technical, 1-2 minutes:** reconstruct both Decision Drills and compare the verification layers.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** npm baseline or client-rendered Vite baseline.
- **Concept or boundary to explain:** Node tooling versus browser runtime.
- **Repository action:** identify what one of typecheck, test, or build proves and does not prove.

## Reference Surface

### Historical Context and Outcome

SS-007 added one `web/` React application, native CSS foundation screen, component smoke test, and dedicated Frontend CI workflow. It added no business behavior, backend API call, routing, persistence, deployment, or environment configuration.

### Implementation and Decision Evidence

The dated selection used Node 24.20.0, bundled npm 11.19.0, React 19.2.8, TypeScript 6.0.2, Vite 8.2.2, native CSS, and manually curated files. Node 26 was Current, Node 22 had less remaining support, and TypeScript 7 was a later verified upgrade candidate. ESLint, Tailwind, Sass, CSS-in-JS, APIs, global state, React Router, design systems, browser E2E, deployment, and security scanners were deferred.

### Security, Verification, and Risks

The direct dependency set includes React, React DOM, Vite, TypeScript, Vitest, jsdom, Testing Library, and related type/plugin packages. Clean `npm ci --ignore-scripts` passed; the only `hasInstallScript` marker was optional macOS-only `fsevents`, which was not needed on Windows. Historical local verification passed typecheck, jsdom smoke test, production build, Edge rendering/HMR, and preview inspection. `dist/` is static output, not deployment. The initial PR #17 commit passed Frontend CI, Repository CI, Backend CI, and GitGuardian.

### Delivery History and Deferred Work

Human approval selected the baseline and separate Frontend CI. No formal GitHub review exists. PR #17 merged on 2026-09-01 after its initial successful checks; its previous open-state wording is corrected here. Reassess linting with non-trivial Hooks/effects, and define browser support, API security, deployment, and behavior tests only when their requirements exist.

### Sources

- [Issue #16](https://github.com/Samska/samska-sandbox/issues/16)
- [PR #17](https://github.com/Samska/samska-sandbox/pull/17)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
- [Vite guide](https://vite.dev/guide/)
- [Vitest guide](https://vitest.dev/guide/)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)
