#!/usr/bin/env node
// Rebuild R1 candidate launcher, built exclusively on Node built-in modules.
//
// It supervises exactly two children it starts itself: the backend candidate
// (io.github.samska.commerce entry via the Maven `rebuild` profile) and the
// candidate frontend Vite dev server. It never inspects, signals or stops
// processes it does not own: occupied ports are refused at pre-flight and the
// port owner keeps running. The backend candidate identity is proven via
// GET /api/rebuild/runtime responding {"runtime":"rebuild-r1"} before the
// frontend is started, so a standard runtime can never be paired with the
// candidate UI. Ctrl+C and termination signals stop only this owned tree.
//
// Usage (repository root): node scripts/rebuild.mjs
//
// Exit codes (contract asserted by scripts/rebuild.test.mjs):
//   0  requested shutdown (signal or readiness hook) completed cleanly
//   1  an owned child exited or could not be spawned
//   2  pre-flight refused: backend or frontend port already occupied
//   3  readiness timeout: backend identity or frontend readiness not confirmed

import {
  createServer
} from "node:net";
import {
  spawn
} from "node:child_process";
import path from "node:path";
import process from "node:process";
import {
  fileURLToPath
} from "node:url";
import {
  isDeepStrictEqual
} from "node:util";

const EXIT_OK = 0;
const EXIT_CHILD = 1;
const EXIT_PORT_BUSY = 2;
const EXIT_TIMEOUT = 3;

// Exported for scripts/rebuild.test.mjs; importers must not mutate it.
export const EXIT_CODES = Object.freeze({
  ok: EXIT_OK,
  child: EXIT_CHILD,
  portBusy: EXIT_PORT_BUSY,
  timeout: EXIT_TIMEOUT
});

const EXPECTED_IDENTITY = Object.freeze({
  runtime: "rebuild-r1"
});

// Children are addressed with absolute directories derived from this file's
// own location, never from the caller's working directory: Playwright runs
// this launcher from web/ while developers usually run it from the root.
const launcherDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(launcherDir, "..");

const DEFAULT_OPTIONS = Object.freeze({
  backendHost: "127.0.0.1",
  backendPort: 8080,
  frontendHost: "127.0.0.1",
  frontendPort: 5173,
  backendIdentityTimeoutMs: 240_000,
  frontendReadyTimeoutMs: 120_000,
  teardownGraceMs: 5_000,
  // Injectable seams for lifecycle tests only; production uses the real ones.
  spawnImpl: spawn,
  fetchImpl: (url, init) => fetch(url, init),
  delayImpl: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  // Test hook invoked with `{ backend, frontend, backendPort, frontendPort }`
  // once both children are running and ready. When the hook resolves, the
  // launcher performs a clean teardown and exits with code 0 (contracts T01
  // to T03 in scripts/rebuild.test.mjs drive exactly this path). Without the
  // hook the launcher supervises the tree until a child exits or a stop
  // signal arrives, mirroring the developer-facing behavior.
  onReady: undefined,
  installSignalHandlers: true
});

function log(prefix, message) {
  process.stderr.write(`[${prefix}] ${message}\n`);
}

// Child output is tagged so evidence is attributable. The launcher itself
// never echoes environment values, credentials or secrets, and it does not
// reproduce foreign payload bodies in its own log lines.
function pipeChildStreams(child, tag) {
  for (const stream of [child.stdout, child.stderr]) {
    if (!stream) {
      continue;
    }
    let pending = "";
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      pending += chunk;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (line.length > 0) {
          log(tag, line);
        }
      }
    });
    stream.on("end", () => {
      if (pending.length > 0) {
        log(tag, pending);
      }
    });
  }
}

// Pre-flight probe: attempt an exclusive bind on the exact host/port, then
// release the socket immediately. Binding the external host keeps the check
// faithful to what the real listeners will require (a wildcard probe would
// falsely treat an occupied loopback port as free). A refused probe never
// signals the process that currently owns the port.
function probePort(host, port) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    let settled = false;
    const fail = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      probe.close(() => reject(new Error(`port ${host}:${port} is already in use`)));
    };
    const succeed = () => {
      if (settled) {
        return;
      }
      settled = true;
      // Swallow any late probe error so it cannot reject the already settled
      // outcome.
      probe.once("error", () => {});
      probe.close(() => resolve());
    };

    probe.once("error", fail);
    probe.listen(port, host, undefined, succeed);
  });
}

function buildBackendCommand() {
  // Windows selects the Maven Wrapper batch entry point through cmd so
  // `mvnw.cmd` resolves as documented; the child inherits JAVA_HOME and the
  // rest of the environment from this launcher's own process.
  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: [
        "/d",
        "/s",
        "/c",
        "mvnw.cmd -Prebuild --batch-mode --no-transfer-progress spring-boot:run"
      ],
      // Absolute path derived from this file's location (see repositoryRoot),
      // not from process.cwd: Playwright launches this script from web/.
      cwd: path.join(repositoryRoot, "backend")
    };
  }

  return {
    command: "./mvnw",
    args: ["-Prebuild", "--batch-mode", "--no-transfer-progress", "spring-boot:run"],
    cwd: path.join(repositoryRoot, "backend")
  };
}

function buildFrontendCommand(options) {
  // Contract with web/package.json (integrated by the Orquestrador):
  // npm run dev:rebuild -- --host 127.0.0.1 --port 5173 --strictPort
  const args = ["dev:rebuild", "--", "--host", options.frontendHost, "--port", String(options.frontendPort), "--strictPort"];

  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", `npm run ${args.join(" ")}`],
      cwd: path.join(repositoryRoot, "web")
    };
  }

  return {
    command: "npm",
    args: ["run", ...args],
    cwd: path.join(repositoryRoot, "web")
  };
}

// Strict identity gate: only 200 with exactly {"runtime":"rebuild-r1"} is
// accepted. An extra key, a different value or a non-JSON body is rejected,
// so health endpoints or a standard runtime cannot pass the gate.
async function waitForBackendIdentity(options, context) {
  const identityUrl = `http://${options.backendHost}:${options.backendPort}/api/rebuild/runtime`;
  const deadline = Date.now() + options.backendIdentityTimeoutMs;

  while (Date.now() < deadline) {
    if (isAborted(context)) {
      return "aborted";
    }
    try {
      const response = await options.fetchImpl(identityUrl, {
        signal: AbortSignal.timeout(2_000)
      });
      if (isAborted(context)) {
        return "aborted";
      }
      if (response.ok) {
        const text = await response.text();
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          body = undefined;
        }
        if (isDeepStrictEqual(body, EXPECTED_IDENTITY)) {
          log("launcher", `backend identity confirmed at ${identityUrl}`);
          return "ready";
        }
        if (body !== undefined) {
          // Do not log foreign response bodies; state the mismatch generically.
          log("launcher", "identity body did not match the expected rebuild-r1 contract");
        }
      }
    } catch {
      // Backend not listening yet or probe aborted; keep polling.
    }
    if (isAborted(context)) {
      return "aborted";
    }
    await Promise.race([options.delayImpl(500), context.abortPromise]);
  }

  return "timeout";
}

async function waitForFrontendReady(options, context) {
  const frontendUrl = `http://${options.frontendHost}:${options.frontendPort}/`;
  const deadline = Date.now() + options.frontendReadyTimeoutMs;

  while (Date.now() < deadline) {
    if (isAborted(context)) {
      return "aborted";
    }
    try {
      const response = await options.fetchImpl(frontendUrl, {
        signal: AbortSignal.timeout(2_000)
      });
      if (isAborted(context)) {
        return "aborted";
      }
      if (response.ok) {
        log("launcher", `frontend readiness confirmed at ${frontendUrl}`);
        return "ready";
      }
    } catch {
      // Frontend not listening yet or probe aborted; keep polling.
    }
    if (isAborted(context)) {
      return "aborted";
    }
    await Promise.race([options.delayImpl(500), context.abortPromise]);
  }

  return "timeout";
}

// A stop signal or the exit of an owned child can arrive at any moment; both
// cancel the readiness gates immediately instead of waiting for a deadline
// that no longer exists. No poll loop survives a stop request.
function isAborted(context) {
  return context.abortReason !== null;
}

// Teardown is bounded to this launcher's own tree, matched only by the exact
// PIDs the launcher spawned. Windows: taskkill /T walks the descendant tree
// of that PID (cmd.exe -> mvnw.cmd -> java). POSIX: the children run in their
// own process groups (detached: true), so the group leader PID alone
// identifies the tree; escalation goes TERM -> KILL after the grace period.
// Processes are never located by name or port, so third-party runtimes on the
// same ports remain untouched even if a previous owner has since exited.
async function teardownTree(spawnImpl, children, graceMs) {
  const windowsForceKillTree = (pid) => new Promise((resolve) => {
    const killer = spawnImpl("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: "ignore"
    });
    killer.on("exit", () => resolve());
    killer.on("error", () => resolve());
  });

  const exitedAlready = (entry) =>
    !entry.child?.pid || entry.child.exitCode !== null || entry.child.signalCode !== null;

  const stop = async (entry) => {
    if (exitedAlready(entry)) {
      return;
    }
    if (process.platform === "win32") {
      await windowsForceKillTree(entry.child.pid);
    } else {
      try {
        process.kill(-entry.child.pid, "SIGTERM");
      } catch {
        // Process group already gone.
      }
    }
    log("launcher", `${entry.tag} stop requested`);
  };

  await Promise.all(children.map(stop));

  const deadline = Date.now() + graceMs;
  const waitExited = async (entry) => {
    if (exitedAlready(entry)) {
      return;
    }
    const { child, tag } = entry;
    while (Date.now() < deadline && child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (child.exitCode === null && child.signalCode === null) {
      if (process.platform === "win32") {
        await windowsForceKillTree(child.pid);
      } else {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          // Process group already gone.
        }
      }
    }
    log("launcher", `${tag} stopped`);
  };

  await Promise.all(children.map(waitExited));
  log("launcher", "owned child tree stopped");
}

export async function runRebuild(overrides = {}) {
  const options = {
    ...DEFAULT_OPTIONS,
    ...overrides
  };
  const children = [];
  let abortReason = null;
  let abortResolver;
  const abortPromise = new Promise((resolve) => {
    abortResolver = resolve;
  });
  const context = {
    abortReason: null,
    abortPromise
  };

  // A stop signal or the exit of an owned child cancels the readiness gates
  // immediately; the reason distinguishes a requested stop (clean exit 0)
  // from a dead child (failure exit 1).
  const requestAbort = (reason) => {
    if (abortReason === null) {
      abortReason = reason;
      context.abortReason = reason;
      abortResolver();
    }
  };

  const onSignal = (name) => {
    log("launcher", `${name} received; stopping owned processes`);
    requestAbort(`signal:${name}`);
  };

  const childExitTag = (child, tag) => new Promise((resolve) => {
    child.once("exit", (code, name) => {
      log("launcher", `${tag} exited (code: ${code}, signal: ${name})`);
      requestAbort(`child:${tag}`);
      resolve(tag);
    });
    child.once("error", (error) => {
      log("launcher", `${tag} spawn failed: ${error.message}`);
      requestAbort(`child:${tag}`);
      resolve(tag);
    });
  });

  // Handler references are kept so every exit path (pre-flight refusal,
  // readiness timeout, child exit, signal, unexpected failure) removes them.
  const signalHandlers = [];
  if (options.installSignalHandlers) {
    for (const name of process.platform === "win32"
      ? ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]
      : ["SIGINT", "SIGTERM", "SIGHUP"]) {
      const handler = () => onSignal(name);
      signalHandlers.push([name, handler]);
      process.on(name, handler);
    }
  }

  let result = EXIT_OK;
  try {
    const busyPorts = await probeEndpoints(options);
    if (busyPorts) {
      log("launcher",
        `Port(s) ${busyPorts} already in use; refusing to start. The process ` +
        `owning the port is left untouched: stop it yourself first, then run ` +
        `this command again.`);
      return EXIT_PORT_BUSY;
    }
    log("launcher", "pre-flight ok: backend and frontend ports free");

    if (abortReason !== null) {
      return abortReason.startsWith("signal:") ? EXIT_OK : EXIT_CHILD;
    }

    // Backend first: the frontend may only start after the candidate
    // identity is confirmed.
    const backendCommand = buildBackendCommand();
    log("launcher", `starting backend candidate (cwd: ${backendCommand.cwd})`);
    const backendChild = options.spawnImpl(
      backendCommand.command,
      backendCommand.args,
      {
        cwd: backendCommand.cwd,
        stdio: ["ignore", "pipe", "pipe"],
        ...(process.platform === "win32" ? {
          windowsHide: true
        } : {
          // Own POSIX process group so teardown stops exactly this tree.
          detached: true
        })
      }
    );
    children.push({ child: backendChild, tag: "backend" });
    pipeChildStreams(backendChild, "backend");

    const backendExited = childExitTag(backendChild, "backend");

    const identityOutcome = await waitForBackendIdentity(options, context);
    if (identityOutcome === "aborted") {
      return context.abortReason.startsWith("signal:") ? EXIT_OK : EXIT_CHILD;
    }
    if (identityOutcome === "timeout") {
      log("launcher", `backend identity at /api/rebuild/runtime not confirmed within ${options.backendIdentityTimeoutMs} ms`);
      return EXIT_TIMEOUT;
    }

    log("launcher", "backend identity gate passed; starting frontend candidate");
    const frontendCommand = buildFrontendCommand(options);
    log("launcher", `starting frontend candidate (cwd: ${frontendCommand.cwd})`);
    const frontendChild = options.spawnImpl(
      frontendCommand.command,
      frontendCommand.args,
      {
        cwd: frontendCommand.cwd,
        stdio: ["ignore", "pipe", "pipe"],
        ...(process.platform === "win32" ? {
          windowsHide: true
        } : {
          detached: true
        })
      }
    );
    children.push({ child: frontendChild, tag: "frontend" });
    pipeChildStreams(frontendChild, "frontend");

    const frontendExited = childExitTag(frontendChild, "frontend");

    const frontendOutcome = await waitForFrontendReady(options, context);
    if (frontendOutcome === "aborted") {
      return context.abortReason.startsWith("signal:") ? EXIT_OK : EXIT_CHILD;
    }
    if (frontendOutcome === "timeout") {
      log("launcher", `frontend readiness not confirmed within ${options.frontendReadyTimeoutMs} ms`);
      return EXIT_TIMEOUT;
    }

    log("launcher", "rebuild candidate ready: backend identity confirmed, frontend serving");

    if (typeof options.onReady === "function") {
      await options.onReady({
        backend: backendChild,
        frontend: frontendChild,
        backendPort: options.backendPort,
        frontendPort: options.frontendPort
      });
      // The hook represents a completed supervised session (used by tests);
      // teardown then runs in the finally block below.
      return EXIT_OK;
    }

    // Supervision: wait until an owned child exits or a stop signal arrives.
    // A child exiting on its own ends the run with a non-zero exit so CI and
    // humans see the runtime ended; cleanup runs in the finally block.
    const stopped = await Promise.race([
      backendExited.then((tag) => ({ kind: "exit", tag })),
      frontendExited.then((tag) => ({ kind: "exit", tag })),
      abortPromise.then(() => ({ kind: "abort", reason: abortReason }))
    ]);

    if (stopped.kind === "abort" && stopped.reason.startsWith("signal:")) {
      result = EXIT_OK;
    } else {
      const tag = stopped.kind === "exit"
        ? stopped.tag
        : stopped.reason.replace(/^child:/, "");
      log("launcher",
        `runtime ended unexpectedly (${tag} exited); stopping the rest of the owned tree`);
      result = EXIT_CHILD;
    }
    return result;
  } catch (error) {
    log("launcher", `unexpected launcher failure: ${error.message}`);
    result = EXIT_CHILD;
    return result;
  } finally {
    await teardownTree(options.spawnImpl, children, options.teardownGraceMs);
    for (const [name, handler] of signalHandlers) {
      process.off(name, handler);
    }
  }
}

async function probeEndpoints(options) {
  const probes = await Promise.all([
    [options.backendHost, options.backendPort],
    [options.frontendHost, options.frontendPort]
  ].map(([host, port]) => probePort(host, port).then(
    () => null,
    () => port
  )));

  const busy = probes.filter((port) => port !== null);
  if (busy.length > 0) {
    return busy.join(", ");
  }
  return null;
}

// Run when executed directly (node scripts/rebuild.mjs), not when imported by
// the lifecycle tests.
const isDirectRun = String(process.argv[1] ?? "")
  .replace(/\\/g, "/")
  .endsWith("scripts/rebuild.mjs");
if (isDirectRun) {
  runRebuild().then((code) => {
    process.exitCode = code;
  }, (error) => {
    log("launcher", `launcher failed to start: ${error.message}`);
    process.exitCode = EXIT_CHILD;
  });
}
