# SS-007: React Application Bootstrap

- Status: Active
- Work date: 2026-09-01
- Last reviewed: 2026-09-01
- Work item: [SS-007, Issue #16](https://github.com/Samska/samska-sandbox/issues/16)
- Pull request: [#17: feat(web): bootstrap React application foundation](https://github.com/Samska/samska-sandbox/pull/17)
- ADRs: None
- Canonical documentation: [README](../../README.md), [Architecture](../ARCHITECTURE.md), [Testing Strategy](../TESTING.md), [Security Engineering](../SECURITY.md), [GitHub Repository Controls](../GITHUB.md), and [Frontend CI workflow](../../.github/workflows/frontend-ci.yml)

## Mental Model

SS-007 establishes the smallest browser application baseline. Node 24.20.0 runs npm, TypeScript, Vite, and Vitest locally and in CI. npm resolves the declared packages into `package-lock.json`; `npm ci --ignore-scripts` reconstructs that exact dependency graph. Vite serves source modules with Hot Module Replacement during development and creates static browser assets for production. React renders `App` into the browser DOM, while TypeScript verifies source before JavaScript reaches the browser.

```text
Node 24.20.0 -> npm + package-lock.json -> TypeScript / Vite / Vitest
                                        -> React App -> browser DOM
                                        -> Frontend CI -> typecheck, test, build
```

## Learning Priorities

| Priority | Concepts | Why this level matters |
| --- | --- | --- |
| Core | Node/npm toolchain and dependency reproducibility; React + TypeScript browser application model; Vite development/build and layered verification | They reconstruct how source becomes a verified browser application. |
| Important | Component smoke-test boundary; Frontend CI and supply-chain trust; browser-public configuration and secrets boundary | They explain the confidence and security limits of the baseline. |
| Supporting | Exact package versions, native CSS, `web/` location, HMR mechanics, and deferred libraries | They are useful implementation evidence, not independent outcomes. |

## Active Recall

### Why do `.nvmrc`, `engines`, `packageManager`, and `package-lock.json` have different reproducibility roles?

<details>
<summary>Answer guide</summary>

`web/.nvmrc` selects Node 24.20.0 for supported local workflows and CI. `engines` communicates the supported Node range, and `packageManager` records npm 11.19.0 for compatible tooling; neither field independently stops a developer using another local version. The committed lockfile plus `npm ci` determine the resolved dependency graph and its integrity-checked installation.

</details>

### Why is React not a full application framework in SS-007?

<details>
<summary>Answer guide</summary>

React and `react-dom` render and update UI components. They do not add routing, server rendering, backend APIs, data fetching, global state, hosting, or a design system. Samska had no requirement for those responsibilities, so Vite provides build tooling without a framework-owned application architecture.

</details>

### What does `npm run typecheck` prove that Vite development does not?

<details>
<summary>Answer guide</summary>

Vite transpiles TypeScript for development and production but does not substitute for a full `tsc -b` check. The explicit script validates strict TypeScript constraints without emitting JavaScript. It still cannot prove runtime values, browser behavior, or user journeys.

</details>

### Why is the first test a component smoke test rather than unit, E2E, or real-browser testing?

<details>
<summary>Answer guide</summary>

Vitest runs React Testing Library in jsdom and queries visible semantic output. It proves the component and selected test foundation cooperate, but does not start a real browser, call the backend, test CSS layout, or execute an end-to-end journey.

</details>

### Why must `VITE_*` values never contain secrets?

<details>
<summary>Answer guide</summary>

Vite statically exposes `VITE_*` values through `import.meta.env` in code sent to the browser. A user can inspect delivered JavaScript and configuration, so those values are public configuration rather than a credential boundary.

</details>

## Core Concepts

### Node, npm, and Deterministic Dependencies

- **Meaning:** Node is the local build and test runtime; npm installs packages. Direct dependencies are declared in `package.json`; their required packages are transitive. A lockfile records exact resolved versions and package integrity data.
- **Samska application:** Node 24.20.0 and bundled npm 11.19.0 run the web toolchain. npm was selected over pnpm because one application does not yet justify a separately installed package manager or workspace model. `npm ci --ignore-scripts` recreates the committed graph without lifecycle-script execution.
- **Decision value:** Exact direct versions and the lockfile make local and CI resolution reviewable and repeatable.
- **Trade-off or failure boundary:** npm has a larger transitive surface and looser dependency layout than pnpm. Caching improves speed, not dependency trust. Lockfiles do not make packages safe; they make a reviewed graph reproducible.

### React, TypeScript, and the Browser

- **Meaning:** React components return UI descriptions; `react-dom` applies them to a browser DOM. TypeScript checks source before execution but is not present at runtime.
- **Samska application:** `main.tsx` renders the one `App` component, which contains only a semantic main region, heading, and foundation message. Strict TypeScript checks code before Vite produces JavaScript.
- **Decision value:** This proves a real React and TypeScript path without inventing features, client architecture, or business state.
- **Trade-off or failure boundary:** Static typing cannot validate untrusted runtime data or protect secrets. Routing, API clients, global state, and component libraries require later behavior-based justification.

### Vite and Layered Verification

- **Meaning:** Vite provides a development server with HMR and an optimized static production build. Different checks answer different risk questions.
- **Samska application:** `npm run dev` serves source for local development, `npm run typecheck` checks strict types, `npm test` runs the component smoke test, `npm run build` writes `dist/`, and `npm run preview` locally serves that output for inspection.
- **Decision value:** The baseline distinguishes feedback loops from deployable assets instead of treating a development server as production.
- **Trade-off or failure boundary:** A successful build and preview do not provide deployment, browser compatibility policy, backend integration, or journey evidence.

## Important Concepts

### Component Test, CI, and Browser Boundary

The component smoke test queries the heading by role and accessible name rather than React internals. Frontend CI repeats lockfile installation, type checking, tests, and build on pull requests with read-only `contents`, disabled checkout credentials, and immutable Action commits. It does not execute a deployment or scan dependencies.

Browser-delivered code and all `VITE_*` values are public. SS-007 creates no environment file or API configuration. Future frontend-to-backend calls must not rely on a browser-held secret.

## Common Misconceptions

- `.nvmrc`, `engines`, or `packageManager` strictly enforce local tools -> they select or communicate intent for supported or compatible tooling; CI and human review provide the actual workflow control.
- TypeScript runs in the browser -> Vite emits JavaScript; the browser does not execute TypeScript types.
- `vite dev` is production hosting -> it is a development server with HMR; `vite build` creates static output and preview only inspects it locally.
- A jsdom component test is E2E -> it does not exercise a real browser, a deployed system, or a complete journey.
- A frontend environment variable can hide an API key -> Vite exposes `VITE_*` values in browser-delivered code.

## Hands-on Reinforcement

Use Node 24.20.0 and npm 11.19.0 from `web/`. `.nvmrc` is a version-manager input; select the runtime with the local tool that supports it before running commands.

### Toolchain and Dependencies

```bash
node --version
npm --version
npm ci --ignore-scripts
npm ls --depth=0
```

Confirm the selected runtime, identify direct packages, and explain why `package-lock.json` rather than a loose version range determines the CI graph.

### Verification Layers

```bash
npm run typecheck
npm test
npm run build
```

Name one failure each command could detect and one it cannot. Confirm that `dist/` is generated, then remove it only if a clean workspace is required because it is generated output.

### Development and Preview

```bash
npm run dev
npm run preview
```

Open each printed URL, change and restore the foundation message while development server HMR is active, then explain why previewing `dist/` is not deployment. Stop each server with `Ctrl+C`.

## Interview Practice

### How would you justify the SS-007 frontend baseline?

- Expected discussion points: Node 24 Active LTS; bundled npm and lockfile simplicity; React and TypeScript only; Vite instead of a full SSR framework; strict separate type checking; component smoke test; no speculative application architecture; native CSS; deferred routing, APIs, state, and E2E.
- Likely follow-up: Why not pnpm? Its store efficiency and stricter dependency layout are useful, but the single-package repository did not yet justify a second package-manager installation and workspace concepts.

### How does Frontend CI contribute to supply-chain trust without claiming full dependency security?

- Expected discussion points: committed integrity-checked lockfile, `npm ci --ignore-scripts`, immutable Action SHAs, read-only permissions, disabled persisted credentials, npm cache as a performance feature, and direct dependency minimization.
- Likely follow-up: What remains deferred? Dependency updates, scanning, SBOMs, vulnerability policy, and deployment controls require separately justified work.

## Self-check

Without reading this record, I can:

- Distinguish Node's local tooling role from the browser's JavaScript runtime.
- Explain `.nvmrc`, `engines`, `packageManager`, `package-lock.json`, and `npm ci` without overstating enforcement.
- Explain why React, TypeScript, and Vite each exist in the baseline.
- Identify the confidence and boundary of the component smoke test, development server, type check, build, and preview.
- Explain direct versus transitive dependencies and why lifecycle scripts were disabled.
- Explain why browser code and `VITE_*` values cannot hold secrets.

## Engineering Evidence and History

### Starting Point and Result

SS-007 followed the Java backend bootstrap and found no frontend project. It adds one `web/` React application, a native CSS foundation screen, one component smoke test, and a dedicated Frontend CI workflow. It adds no business behavior, backend API call, routing, persistence, deployment, or environment configuration.

### Decisions, Alternatives, and Boundaries

- Node 24.20.0 was selected as Active LTS through 2028-04-30; Node 26 was Current and Node 22 had a shorter remaining support window.
- npm was selected over pnpm because the project has one JavaScript application and no current workspace need. pnpm remains a future option if multiple packages create a demonstrated efficiency or boundary problem.
- Vite was selected for a client-rendered application; Next.js was rejected because no SSR, server components, framework routing, or full-stack behavior exists.
- TypeScript 6.0.2 matches Vite's current React TypeScript template and avoids the TypeScript 7 ecosystem API transition. TypeScript 7 is a later verified upgrade candidate.
- ESLint, Tailwind, Sass, CSS-in-JS, API libraries, global state, React Router, design systems, browser E2E, deployment, and security scanners remain deferred because the foundation has no behavior that requires them.

### Security and Verification

The direct dependency set contains React, React DOM, Vite, TypeScript, Vitest, jsdom, Testing Library, and their necessary type/plugin packages. The clean `npm ci --ignore-scripts` install passed. The only `hasInstallScript` lockfile marker was optional macOS-only `fsevents`; it was not installed or required on Windows. `npm ls --depth=0` and `npm ls --all` showed the approved direct dependencies, platform-specific optional packages, and no peer-dependency failure.

TypeScript checking, the jsdom component smoke test, and Vite production build passed locally. A real Microsoft Edge page rendered the heading and foundation message; a temporary text edit updated that page through Vite HMR before the source was restored. `dist/` is static build output, not a deployment. GitHub Actions validated initial commit `a508028` in [PR #17](https://github.com/Samska/samska-sandbox/pull/17): Frontend CI, Repository CI, Backend CI, and GitGuardian Security Checks all passed.

### Delivery History

- **Plan:** Human approval selected Node 24.20.0, npm 11.19.0, React 19.2.8, TypeScript 6.0.2, Vite 8.2.2, one component smoke test, native CSS, and separate Frontend CI.
- **Build:** The implementation used manually curated files rather than retaining a scaffold. It established the strict compiler configuration, semantic foundation output, test setup, lockfile, and immutable workflow pins.
- **Review:** No formal human GitHub review exists yet. Human review must assess the lockfile, scope, documentation claims, CI result, and dependency/security boundary.
- **Pull Request:** [PR #17](https://github.com/Samska/samska-sandbox/pull/17) is open. Its initial commit passed Frontend CI, Repository CI, Backend CI, and GitGuardian Security Checks; no out-of-scope application behavior was introduced.

## Follow-up and Sources

- Add focused UI behavior tests with the first feature.
- Reevaluate linting when Hooks, effects, or non-trivial client behavior creates a concrete need.
- Define browser support, API security, and deployment controls only with their corresponding requirements.
- [Issue #16](https://github.com/Samska/samska-sandbox/issues/16)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
- [Vite guide](https://vite.dev/guide/)
- [Vitest guide](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)
