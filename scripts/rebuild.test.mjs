// Lifecycle tests for scripts/rebuild.mjs, built exclusively on Node's built-in
// test runner (node:test). No external dependency is added.
//
// Safety rules honored here:
// - Fixture servers and children always use ephemeral ports; 8080 and 5173 are
//   never touched by these tests.
// - No Maven or Vite process is started; fake child servers are tiny `node -e`
//   scripts spawned through the launcher's injectable spawn seam.
// - The spawn seam forwards the launcher's own tree-kill commands (taskkill on
//   Windows) to the real spawn, so teardows genuinely kill the fixture PIDs the
//   launcher owns; every fixture child is registered and force-killed again in
//   each test's finally block, so no test run leaves an orphan behind and
//   `node --test` never hangs on leaked handles.
// - The launcher must never kill by name/port, so a foreign detached sleeper
//   process must survive the launcher teardown in T03.
//
// Run from the repository root: node --test scripts/rebuild.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import {
  spawn
} from "node:child_process";
import {
  createServer
} from "node:net";
import http from "node:http";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  fileURLToPath
} from "node:url";

import {
  runRebuild,
  EXIT_CODES
} from "./rebuild.mjs";

const EXIT_OK = EXIT_CODES.ok;
const EXIT_CHILD = EXIT_CODES.child;
const EXIT_PORT_BUSY = EXIT_CODES.portBusy;
const EXIT_TIMEOUT = EXIT_CODES.timeout;

const here = path.dirname(fileURLToPath(import.meta.url));
const launcherSourcePath = path.join(here, "rebuild.mjs");
const identityPath = "/api/rebuild/runtime";
const isWindows = process.platform === "win32";

function getFreePort() {
  const probe = createServer();
  return new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });
}

// A fake backend: serves the configured identity payload on the candidate
// identity path, optionally after a delay. When `witnessPort` is provided,
// the fixture connects to that local port the first time identity is served,
// giving the test an out-of-band timestamp without any file markers. The
// identity body is passed through a JSON string literal so an object body
// cannot be re-evaluated as a JavaScript object literal inside the script.
function backendFixtureScript(port, identityBody, serveDelayMs, witnessPort) {
  const body = JSON.stringify(JSON.stringify(identityBody));
  return `
const http = require("node:http");
const net = require("node:net");
const server = http.createServer((req, res) => {
  if (req.url !== ${JSON.stringify(identityPath)}) {
    res.writeHead(404);
    res.end();
    return;
  }
  const respond = () => {
    const proceed = () => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(${body});
    };
    if (${witnessPort !== undefined}) {
      // Reply only after the witness has accepted the connection, so the
      // witness timestamp is strictly before the identity response that lets
      // the launcher spawn the frontend.
      const client = net.connect(${witnessPort}, "127.0.0.1", () => {
        client.end("served");
        proceed();
      });
      client.on("error", () => proceed());
    } else {
      proceed();
    }
  };
  setTimeout(respond, ${serveDelayMs});
});
server.listen(${port}, "127.0.0.1", () => process.stdout.write("backend-up\\n"));
`;
}

// A fake frontend: answers any request with 200, or exits immediately with a
// non-zero code when configured to fail (proves exit-code propagation).
function frontendFixtureScript(port, exitImmediately) {
  return `
const http = require("node:http");
${exitImmediately ? "setTimeout(() => process.exit(3), 50);" : ""}
const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end("rebuild-e2e-fixture");
});
server.listen(${port}, "127.0.0.1", () => process.stdout.write("frontend-up\\n"));
`;
}

function mkSharedState() {
  return {
    commands: [],
    taskkillCalls: [],
    children: [],
    frontendCommand: null,
    backendSpawnAt: null,
    frontendSpawnAt: null
  };
}

// Spawn seam: intercepts the launcher's spawns. The tree-kill commands the
// launcher aims at its own child PIDs are forwarded to the real spawn so
// teardown actually kills the fixture tree; app children (backend / frontend)
// are replaced by tiny node -e servers. Every spawned fixture is registered
// in `state.children` for cleanup.
function makeSpawnSeam(state) {
  return (command, args, options) => {
    if (command === "taskkill") {
      // The launcher only ever targets PIDs of children it spawned itself
      // (asserted by the launcher's source and T03); forward it untouched.
      state.taskkillCalls.push([...args]);
      return spawn(command, args, {
        stdio: "ignore"
      });
    }

    const commandLine = [command, ...args].join(" ");
    const byDirectory = options.cwd?.endsWith(`${path.sep}backend`) === true;
    const isBackend = commandLine.includes("spring-boot:run") || byDirectory;
    if (!isBackend) {
      assert.ok(
        commandLine.includes("dev:rebuild") &&
        commandLine.includes("strictPort"),
        `unexpected child command in the spawn seam: ${commandLine}`
      );
    }

    const script = isBackend
      ? state.backendScript
      : state.frontendScript;
    if (isBackend) {
      state.backendSpawnAt = Date.now();
    } else {
      state.frontendSpawnAt = Date.now();
      state.frontendCommand = {
        command,
        args
      };
    }

    const child = spawn(process.execPath, ["-e", script], {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      ...(isWindows ? {
        windowsHide: true
      } : {
        detached: true
      })
    });
    child.once("error", () => {});
    state.children.push(child);
    if (isBackend) {
      state.backendChild = child;
    } else {
      state.frontendChild = child;
    }
    return child;
  };
}

// Residual cleanup for fixtures: the launcher's teardown should already have
// stopped its children; this is the guarantee that no test run leaves a fake
// server process alive on any outcome, including failed assertions.
async function killFixtureTree(child) {
  if (!child || !child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore"
      });
      killer.on("exit", resolve);
      killer.on("error", resolve);
    });
  } else {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      // Process group already gone.
    }
  }
  child.kill();
}

async function cleanUpState(state) {
  for (const child of state.children) {
    await killFixtureTree(child);
  }
}

async function waitUntil(predicate, description, timeoutMs = 2_000) {
  if (predicate()) {
    return;
  }
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for ${description}`);
}

test("T01: occupied backend port is refused with exit 2 and the port owner keeps running", async () => {
  const owner = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("owner");
  });
  await new Promise((resolve) => owner.listen(0, "127.0.0.1", resolve));
  const backendPort = owner.address().port;
  const frontendPort = await getFreePort();

  const state = mkSharedState();
  state.backendScript = backendFixtureScript(backendPort, {
    runtime: "rebuild-r1"
  }, 0);
  state.frontendScript = frontendFixtureScript(frontendPort, false);
  const seam = makeSpawnSeam(state);

  try {
    const code = await runRebuild({
      backendPort,
      frontendPort,
      backendIdentityTimeoutMs: 300,
      frontendReadyTimeoutMs: 300,
      spawnImpl: seam,
      teardownGraceMs: 500
    });

    assert.equal(code, EXIT_PORT_BUSY, "launcher must exit 2 when the backend port is occupied");
    assert.equal(state.commands.length, 0, "launcher must not spawn children after pre-flight refusal");
    assert.equal(owner.listening, true, "the process owning the port must not be disturbed");
  } finally {
    await new Promise((resolve) => owner.close(resolve));
  }
});

test("T01b: occupied frontend port is refused with exit 2 and the port owner keeps running", async () => {
  const owner = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("owner");
  });
  await new Promise((resolve) => owner.listen(0, "127.0.0.1", resolve));
  const frontendPort = owner.address().port;
  const backendPort = await getFreePort();

  const state = mkSharedState();
  state.backendScript = backendFixtureScript(backendPort, {
    runtime: "rebuild-r1"
  }, 0);
  state.frontendScript = frontendFixtureScript(frontendPort, false);
  const seam = makeSpawnSeam(state);

  try {
    const code = await runRebuild({
      backendPort,
      frontendPort,
      backendIdentityTimeoutMs: 300,
      frontendReadyTimeoutMs: 300,
      spawnImpl: seam,
      teardownGraceMs: 500
    });

    assert.equal(code, EXIT_PORT_BUSY, "launcher must exit 2 when the frontend port is occupied");
    assert.equal(state.commands.length, 0, "launcher must not spawn children after pre-flight refusal");
    assert.equal(owner.listening, true, "the process owning the port must not be disturbed");
  } finally {
    await new Promise((resolve) => owner.close(resolve));
  }
});

const wrongIdentityBodies = [
  {
    name: "different value",
    body: {
      runtime: "legacy"
    }
  },
  {
    name: "extra key",
    body: {
      runtime: "rebuild-r1",
      craft: "extra"
    }
  },
  {
    name: "array instead of object",
    body: ["rebuild-r1"]
  }
];

for (const wrong of wrongIdentityBodies) {
  test(`T02: identity gate rejects ${wrong.name} (exit 3, frontend never started, backend tree stopped)`, async () => {
    const backendPort = await getFreePort();
    const frontendPort = await getFreePort();

    const state = mkSharedState();
    state.backendScript = backendFixtureScript(backendPort, wrong.body, 0);
    state.frontendScript = frontendFixtureScript(frontendPort, false);
    const seam = makeSpawnSeam(state);

    try {
      const code = await runRebuild({
        backendPort,
        frontendPort,
        backendIdentityTimeoutMs: 1_200,
        frontendReadyTimeoutMs: 1_200,
        spawnImpl: seam,
        teardownGraceMs: 3_000
      });

      assert.equal(code, EXIT_TIMEOUT, `mismatched identity must end in readiness timeout (${EXIT_TIMEOUT})`);
      assert.ok(state.backendChild, "backend child should have been spawned");
      assert.ok(!state.frontendSpawnAt && !state.frontendChild, "frontend child must never be spawned before identity passes");
      await waitUntil(
        () => state.backendChild.exitCode !== null || state.backendChild.signalCode !== null,
        "backend fixture to be stopped by launcher teardown"
      );
    } finally {
      await cleanUpState(state);
    }
  });
}

// Spawns an identity witness server; the state's `identityServedAt` timestamp
// is recorded when the backend fixture first serves the identity endpoint, as
// out-of-band proof of ordering (no files or polling in the repository).
function identityWitness() {
  return new Promise((resolve, reject) => {
    const witness = http.createServer();
    witness.once("error", reject);
    const state = {
      identityServedAt: null
    };
    witness.state = state;
    witness.on("connection", () => {
      if (state.identityServedAt === null) {
        state.identityServedAt = Date.now();
      }
    });
    witness.listen(0, "127.0.0.1", () => {
      resolve({
        port: witness.address().port,
        state,
        close: () => new Promise((done) => witness.close(done))
      });
    });
  });
}

test("T02b: frontend starts only after the backend serves the expected identity", async () => {
  const backendPort = await getFreePort();
  const frontendPort = await getFreePort();
  const witness = await identityWitness();
  const state = mkSharedState();
  state.backendScript = backendFixtureScript(
    backendPort, {
      runtime: "rebuild-r1"
    }, 0, witness.port);
  state.frontendScript = frontendFixtureScript(frontendPort, false);
  const seam = makeSpawnSeam(state);

  try {
    const code = await runRebuild({
      backendPort,
      frontendPort,
      backendIdentityTimeoutMs: 15_000,
      frontendReadyTimeoutMs: 15_000,
      spawnImpl: seam,
      teardownGraceMs: 3_000,
      onReady: async () => {}
    });

    assert.equal(code, EXIT_OK, "a happy-path session must exit 0");
    assert.ok(state.frontendSpawnAt, "frontend must have been spawned");
    assert.ok(
      witness.state.identityServedAt !== null &&
      witness.state.identityServedAt <= state.frontendSpawnAt,
      "backend identity must be served before the frontend child is spawned"
    );
    assert.ok(
      state.frontendCommand.args.join(" ").includes("dev:rebuild") &&
      state.frontendCommand.args.join(" ").includes("strictPort") &&
      state.frontendCommand.args.join(" ").includes(String(frontendPort)),
      `frontend command must target dev:rebuild with strictPort and the contract port, got: ${state.frontendCommand.args.join(" ")}`
    );
  } finally {
    await cleanUpState(state);
    await witness.close();
  }
});

test("T03: teardown kills only the owned tree; a foreign sleeper survives; no kill by name/port", async () => {
  const backendPort = await getFreePort();
  const frontendPort = await getFreePort();

  const state = mkSharedState();
  state.backendScript = backendFixtureScript(backendPort, {
    runtime: "rebuild-r1"
  }, 0);
  state.frontendScript = frontendFixtureScript(frontendPort, false);

  // Foreign process the launcher must never touch: a detached sleeper started
  // by the test itself (it is the test's own fixture, killed in finally).
  const foreign = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    stdio: "ignore",
    ...(isWindows ? {
      windowsHide: true
    } : {
      detached: true
    })
  });
  foreign.once("error", () => {});
  foreign.unref();

  const seam = makeSpawnSeam(state);
  try {
    const code = await runRebuild({
      backendPort,
      frontendPort,
      backendIdentityTimeoutMs: 15_000,
      frontendReadyTimeoutMs: 15_000,
      spawnImpl: seam,
      teardownGraceMs: 3_000,
      onReady: async () => {}
    });

    assert.equal(code, EXIT_OK, "a clean onReady-driven session must exit 0");

    await waitUntil(
      () => (state.backendChild.exitCode !== null || state.backendChild.signalCode !== null) &&
        (state.frontendChild.exitCode !== null || state.frontendChild.signalCode !== null),
      "owned backend and frontend fixtures to be stopped"
    );
    assert.equal(foreign.exitCode, null, "the foreign sleeper must survive the launcher teardown");

    if (isWindows) {
      assert.ok(
        state.taskkillCalls.some((args) => args.includes(String(state.backendChild.pid))) &&
        state.taskkillCalls.some((args) => args.includes(String(state.frontendChild.pid))),
        "teardown on Windows must target the exact own-child PIDs via taskkill /PID /T"
      );
      for (const args of state.taskkillCalls) {
        assert.deepEqual(args.slice(0, 2), ["/PID", state.backendChild.pid ? args[1] : ""].slice(0, 2), "taskkill must be PID-targeted");
        assert.ok(
          args[0] === "/PID" && args[2] === "/T" && args[3] === "/F" &&
          [String(state.backendChild.pid), String(state.frontendChild.pid)].includes(args[1]),
          `taskkill must kill only exact owned PIDs, got: ${args.join(" ")}`
        );
      }
    }

    // Static guard: the launcher must never derive victims from names, ports
    // or process listings.
    const source = fs.readFileSync(launcherSourcePath, "utf8");
    for (const forbidden of [
      /\/IM\b/,
      /tasklist/i,
      /pkill\b/,
      /killall\b/,
      /\bfuser\b/,
      /kill-port/,
      /\blsof\b/,
      /netstat/i
    ]) {
      assert.doesNotMatch(source, forbidden, "launcher must not contain kill-by-name/port patterns");
    }
  } finally {
    if (foreign.exitCode === null && !foreign.killed) {
      await killFixtureTree(foreign);
    }
    await cleanUpState(state);
  }
});

test("T04: owned frontend exiting ends the run with a non-zero exit and the owned tree is stopped", async () => {
  const backendPort = await getFreePort();
  const frontendPort = await getFreePort();

  const state = mkSharedState();
  state.backendScript = backendFixtureScript(backendPort, {
    runtime: "rebuild-r1"
  }, 0);
  state.frontendScript = frontendFixtureScript(frontendPort, true);

  const seam = makeSpawnSeam(state);

  try {
    const code = await runRebuild({
      backendPort,
      frontendPort,
      backendIdentityTimeoutMs: 15_000,
      frontendReadyTimeoutMs: 4_000,
      spawnImpl: seam,
      teardownGraceMs: 3_000
    });

    assert.equal(code, EXIT_CHILD, "an owned child exiting during supervision must end the run non-zero");
    await waitUntil(
      () => state.backendChild.exitCode !== null || state.backendChild.signalCode !== null,
      "backend fixture to be stopped after the frontend exited"
    );
  } finally {
    await cleanUpState(state);
  }
});

test("T05: backend exiting before identity is reported ends the run with exit 1", async () => {
  const backendPort = await getFreePort();
  const frontendPort = await getFreePort();

  const state = mkSharedState();
  // A "backend" that exits immediately must be surfaced as a child failure,
  // not waited out to a readiness timeout.
  state.backendScript = "setTimeout(() => process.exit(9), 0);";
  state.frontendScript = frontendFixtureScript(frontendPort, false);

  const seam = makeSpawnSeam(state);

  try {
    const code = await runRebuild({
      backendPort,
      frontendPort,
      backendIdentityTimeoutMs: 4_000,
      frontendReadyTimeoutMs: 4_000,
      spawnImpl: seam,
      teardownGraceMs: 3_000
    });

    assert.equal(code, EXIT_CHILD, "a backend that dies before identity must end the run non-zero");
    assert.ok(!state.frontendSpawnAt && !state.frontendChild, "frontend must not start when the backend never reported identity");
  } finally {
    await cleanUpState(state);
  }
});
