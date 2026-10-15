import { defineConfig, devices } from "@playwright/test";

const webHost = "127.0.0.1";
const webPort = 5173;
const webUrl = `http://${webHost}:${webPort}`;

// Rebuild candidate browser suite. One webServer only: scripts/rebuild.mjs
// owns the whole candidate lifecycle (backend identity gate on 8080, then
// frontend on 5173), so Playwright never starts Maven or Vite directly and
// can never pair the candidate UI with a standard runtime. Artifacts live in
// rebuild-specific folders that stay ignored.
export default defineConfig({
  testDir: "./rebuild-e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 90_000,
  expect: {
    timeout: 10_000
  },
  globalSetup: "./rebuild-e2e/global-setup.ts",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/rebuild" }]
  ],
  outputDir: "test-results/rebuild",
  use: {
    baseURL: webUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      name: "rebuild-stack",
      command: "node ../scripts/rebuild.mjs",
      cwd: ".",
      url: webUrl,
      timeout: 420_000,
      reuseExistingServer: false,
      // POSIX children have their own process groups. Let the supervisor stop
      // those groups before Playwright escalates; Windows uses tree teardown.
      ...(process.platform === "win32" ? {} : {
        gracefulShutdown: { signal: "SIGTERM" as const, timeout: 10_000 }
      }),
      stdout: "pipe",
      stderr: "pipe"
    }
  ]
});
