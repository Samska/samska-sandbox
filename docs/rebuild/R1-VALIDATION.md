# R1 — local validation and execution evidence

## Current state

Implementation is complete for the authorized R1 slice, verified and independently reviewed. Human Verification is Required and pending. R1 does not replace the current application or implement First Order.

## Prerequisites and safe startup

Use the reconstruction worktree, Java 25 (JAVA_HOME authoritative), Node in the repository range and npm 11.19.0. No database, Docker, `.env`, credentials or new global tool is required. Install existing frontend dependencies from `web` with `npm ci --ignore-scripts` only if needed.

Stop your own existing app using its terminal's Ctrl+C before starting the candidate; both use ports 8080/5173. Do not terminate another process by name or port. From the worktree root, the candidate command is:

```text
node scripts/rebuild.mjs
```

Expected identity: `GET http://127.0.0.1:8080/api/rebuild/runtime` returns `{"runtime":"rebuild-r1"}`. Open `http://127.0.0.1:5173/`. The candidate must refuse occupied ports and must not treat default health alone as candidate identity. Use Ctrl+C to stop only its owned processes. Runtime data is in memory and disappears when the backend stops.

## Short human checklist

1. Check the candidate notice and an empty Product list. With keyboard, reach fields Name, Description and Price and the Create Product control; labels and focus must be understandable.
2. Create a synthetic Product, for example Canvas Tote / Synthetic canvas tote / 12.50. Observe success and one matching Product in the list; open its details, verify name/description/price and return to Products. Keyboard focus must move sensibly and remain visible.
3. Try a blank name/description and negative price; observe a useful refusal without claiming success or adding a Product. Then create a zero-priced Product; zero must be accepted. Do not use real data.
4. Refresh the page while backend is still running; Products should remain. Stop/restart the candidate; the list should be empty. This reset is deliberate, not persistence failure.
5. Stop the candidate. Standard application remains separately runnable by its documented command; it was not cut over. Do not run both stacks on the same ports.

Report pass/partial/fail, what you actually observed and any messages/issues. Browser/version and viewport are useful if available; do not infer results for checks not performed. Approval of the plan is not evidence of these observations.

## Limitations

R1 contains Product create/list/detail only. PUT, DELETE, uploads, Cart, Checkout, simulated Payment, Orders and attempt recovery remain only in the preserved standard application. No candidate hosting, authentication or persistence exists. POST creation has no idempotency key; an uncertain outcome must not be auto-replayed. This is functional/a11y validation, not a complete accessibility audit or redesign approval.

## Agent Verification

Executed by the Orquestrador on 2026-10-15 against the working tree containing all R1 changes (not yet committed; documentation checkpoint `0dd38de` is the last commit on `origin/rebuild/maestri`):

- Backend standard profile: `./mvnw.cmd --batch-mode --no-transfer-progress verify` → 188 tests, 0 failures/errors/skips → `backend/target/r1-backend-default-final.log`.
- Backend candidate profile: `./mvnw.cmd -Prebuild ... verify` → 188 tests, 0 failures/errors/skips → `backend/target/r1-backend-candidate-final.log`. Jar `Start-Class` is the standard entry in `target/` and `CommerceApplication` in `target/rebuild/`.
- Candidate frontend: `npm run typecheck:rebuild` 0, `npm run test:rebuild` 63 tests (5 files), `npm run build:rebuild` 0.
- Candidate browser suite: `npm run test:e2e:rebuild` 5/5 against the real launcher stack → `backend/target/r1-candidate-e2e-4.log`; ports 8080/5173 free afterwards.
- Preserved standard app: `npm run typecheck` 0, 173 tests, `npm run test:e2e` 2/2 → `backend/target/r1-standard-final.log`.
- Launcher lifecycle: `node --test scripts/rebuild.test.mjs` 9/9 → `backend/target/r1-lifecycle.log`.
- Isolation: no `io.github.samska.sandbox` references in candidate production sources; candidate exposes `/api/rebuild/runtime` and answers `/api/cart` with 404.
- Independent review by Crivo (read-only) found and confirmed the blank-page defect and the create-state defect; both were corrected and rechecked. Final recheck reported no blockers.
- Documentation checks: markdownlint (0 issues), relative-link/fragment/node scripts and EditorConfig on changed files; `git diff --check` clean.

Not covered by Agent Verification: screen-reader output, responsive/zoom layouts, visible focus quality, and Windows Ctrl+C timing. Earlier 136/173 counts belong to the reference, not to the R1 candidate.

## Human Verification

Required — pending owner observations after implementation and independent review. No implementation commit or PR until this checkpoint is satisfied.

## CI Verification

Not run; no PR authorized. No remote green result is claimed for uncommitted R1 code.

## Local Environment Changes

R1 adds candidate-only startup/build/configuration next to the unchanged default application:

- New root launcher: `node scripts/rebuild.mjs` (Node built-ins only). It refuses occupied ports 8080/5173, starts the candidate backend through the Maven `rebuild` profile, proves candidate identity before starting the candidate Vite server, and tears down only the process tree it started. Stop it with `Ctrl+C` in its own terminal.
- New npm scripts in `web`: `dev:rebuild`, `start:rebuild`, `typecheck:rebuild`, `test:rebuild`, `build:rebuild`, `test:e2e:rebuild`, `test:lifecycle:rebuild`.
- New Maven profile `rebuild` with output under `backend/target/rebuild`; the default profile and its `target/` output are unchanged.
- Candidate frontend output goes to `web/dist/rebuild`; the existing `web/dist/` output is not overwritten.
- No new dependency, JDK/Node version, environment variable, database, Docker service, port change or credential is required. `npm ci --ignore-scripts` remains the install step for the existing frontend.
- Switching between the standard app and the candidate requires stopping one first; they share ports 8080/5173 and each holds its own in-memory state, which resets when its backend stops. No data migration applies.
