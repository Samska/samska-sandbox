# SS-023: Local Development Launcher

- Status: Draft
- Work date: 2026-09-18
- Last reviewed: 2026-09-18
- Work item: [SS-023, Issue #32](https://github.com/Samska/samska-sandbox/issues/32)
- Pull request: [#33: SS-023 — Add local development launcher](https://github.com/Samska/samska-sandbox/pull/33)
- ADRs: None
- Canonical documentation: [Local Development](../LOCAL-DEVELOPMENT.md), [AI Engineering Governance](../AI-GOVERNANCE.md), and [Testing Strategy](../TESTING.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- A parent process can start child processes, but ending only the parent does not necessarily end every descendant.
- A process group gives a launcher a bounded ownership unit for signal delivery and cleanup.
- `SIGINT` represents interactive cancellation, while `SIGTERM` requests orderly termination; shell traps can map both to one cleanup path.
- Idempotent cleanup makes `EXIT`, `SIGINT`, and `SIGTERM` safe when they overlap.
- Non-interactive Bash inherits environment variables but usually does not run interactive NVM initialization.
- A launcher orchestrates existing runtime commands; it must not make optional infrastructure appear to be an application dependency.

### Core — Know this for interviews

- Process groups and owned-process cleanup
- Signals, traps, and idempotent shutdown
- Environment inheritance and NVM in non-interactive shells
- Orchestration convenience versus runtime architecture

## Concepts explained

Killing a Maven or npm wrapper PID alone can leave the Spring Boot JVM or Vite descendant running. A process group lets the launcher signal the complete tree it started without searching the machine for every Java or Node process.

`SIGINT` is normally sent by `Ctrl+C`; `SIGTERM` is a programmatic request to stop. The launcher converts either signal to an exit status, sends `SIGTERM` to each owned group, waits briefly, and escalates only its own remaining groups to `SIGKILL`. An idempotency guard prevents the `EXIT` trap from repeating that work.

A child process inherits its parent environment, but a non-interactive script does not automatically execute interactive shell configuration. NVM is commonly defined as a shell function by `.bashrc`, so the launcher first checks `PATH` and conditionally sources NVM only to run `nvm use` against the repository's `.nvmrc`.

## How Samska uses it

[`scripts/dev.sh`](../../scripts/dev.sh) resolves the repository root from `BASH_SOURCE`, validates prerequisites, and starts the documented Maven Wrapper and Vite commands as separate Bash job-control process groups. It records only those group leaders and verifies the PID/PGID relationship with `ps` before allowing group-wide cleanup.

The launcher uses `wait -n`, which is why it requires Bash 4.3 or later. It reports backend health only after the existing Actuator endpoint returns `UP`; Vite keeps its native output so its selected port remains visible.

[`LOCAL-DEVELOPMENT.md`](../LOCAL-DEVELOPMENT.md) retains the manual backend/frontend commands and the independent Compose PostgreSQL workflow. The launcher neither reads `.env` nor runs Docker because Catalog state remains in [`InMemoryProductStore`](../../backend/src/main/java/io/github/samska/sandbox/catalog/InMemoryProductStore.java), not PostgreSQL.

Repository governance prevents launcher drift: setup-affecting work reviews the canonical local-development guide and the launcher together when relevant, updates the launcher only when its assumptions change, and reruns its verification after an update.

## Why this design

Bash job control provides separate process groups without adding `concurrently`, PM2, tmux, or a system-level supervisor. The implementation verifies that ownership relationship rather than assuming background jobs are isolated.

The launcher does not add `--with-db`. PostgreSQL currently has no application-runtime role, and managing its independent Compose lifecycle would add credential and ownership complexity without improving the Catalog launch path.

`curl` improves startup evidence when already available, but it is not a launcher prerequisite. Without it, the script does not falsely claim the backend is ready.

## Common mistakes

- Treating a background PID as proof that all descendants will terminate with it.
- Using `pkill java`, `pkill node`, or `killall` and terminating unrelated developer work.
- Treating NVM's presence in an interactive terminal as proof that a script can use it.
- Running `npm ci` automatically on every launch instead of reporting missing dependencies.
- Starting PostgreSQL by default merely because Compose configuration exists.
- Reporting Vite port `5173` as certain when Vite may select another available port.

## Interview perspective

A strong explanation distinguishes process supervision from process naming: a safe local launcher tracks the processes it created, groups their descendants deliberately, and signals only that owned boundary. It should explain why graceful termination comes before forced termination, why cleanup must tolerate repeated triggers, and why a convenience script must preserve visibility into the real backend, frontend, and optional-infrastructure boundaries.

## Interview vocabulary

- **Process group:** A set of related processes addressed together by a group ID for signal delivery.
- **Child process:** A process created by another process; it can itself create further descendants.
- **SIGINT:** The interruption signal normally generated by `Ctrl+C` in a terminal.
- **SIGTERM:** A request for a process to terminate gracefully.
- **Shell trap:** A shell handler that runs when a signal or shell exit occurs.
- **Idempotent cleanup:** Cleanup that is safe to run more than once without creating conflicting effects.

## Deeper — Useful later

Production supervision involves service managers, health policies, restart behavior, logging aggregation, and deployment ownership. Those concerns are intentionally different from this developer-terminal launcher and remain out of scope.

## What not to worry about yet

Do not add Dockerized frontend/backend services, a cross-platform Windows wrapper, production process management, database persistence, or another orchestration dependency. The current manual commands remain the fallback and make the runtime topology visible.

## Reference

- Issue: [#32](https://github.com/Samska/samska-sandbox/issues/32)
- Pull request: [#33: SS-023 — Add local development launcher](https://github.com/Samska/samska-sandbox/pull/33)
- Relevant source files: [`scripts/dev.sh`](../../scripts/dev.sh), [`backend/mvnw`](../../backend/mvnw), [`web/package.json`](../../web/package.json), [`web/.nvmrc`](../../web/.nvmrc), and [`web/vite.config.ts`](../../web/vite.config.ts)
- ADRs: None
- Canonical documentation: [Local Development](../LOCAL-DEVELOPMENT.md), [Learning Journal](README.md), and [AI Engineering Governance](../AI-GOVERNANCE.md)
