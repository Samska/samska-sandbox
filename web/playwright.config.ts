import { defineConfig, devices } from "@playwright/test";

const webHost = "127.0.0.1";
const webPort = 5173;
const webUrl = `http://${webHost}:${webPort}`;
const backendHealthUrl = "http://127.0.0.1:8080/actuator/health";

// Windows selects the Maven Wrapper batch entry point; other platforms use the
// shell script. JAVA_HOME stays authoritative for the backend child process.
const backendCommand =
  process.platform === "win32"
    ? "mvnw.cmd --batch-mode --no-transfer-progress spring-boot:run"
    : "./mvnw --batch-mode --no-transfer-progress spring-boot:run";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 90_000,
  expect: {
    timeout: 10_000
  },
  globalSetup: "./e2e/global-setup.ts",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }]
  ],
  outputDir: "test-results",
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
      name: "backend",
      command: backendCommand,
      cwd: "../backend",
      url: backendHealthUrl,
      timeout: 300_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe"
    },
    {
      name: "frontend",
      command: `npm run dev -- --host ${webHost} --port ${webPort} --strictPort`,
      cwd: ".",
      url: webUrl,
      timeout: 120_000,
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe"
    }
  ]
});
