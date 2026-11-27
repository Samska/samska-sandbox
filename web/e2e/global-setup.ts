import { mkdirSync } from "node:fs";
import { request } from "@playwright/test";
import { adminCredentials, authStatePath, xsrfHeaders } from "./session";

const backendHealthUrl = "http://127.0.0.1:8080/actuator/health";
const webBaseUrl = "http://127.0.0.1:5173";

// Readiness evidence before any test runs: the backend reports UP, and the
// Vite proxy path used by the application returns valid Catalog and Cart
// responses. The servers themselves are owned by Playwright's webServer
// lifecycle; this check only proves they answer as expected.
export default async function globalSetup(): Promise<void> {
  const direct = await request.newContext();
  const throughProxy = await request.newContext({ baseURL: webBaseUrl });

  try {
    await waitFor(async () => {
      const health = await direct.get(backendHealthUrl);
      if (health.status() !== 200) {
        return false;
      }

      const body = (await health.json()) as { status?: unknown };
      return body.status === "UP";
    }, "backend health at /actuator/health to report UP");

    await waitFor(async () => {
      const products = await throughProxy.get("/api/products");
      if (products.status() !== 200) {
        return false;
      }

      return Array.isArray(await products.json());
    }, "GET /api/products through the Vite proxy to return an array");

    await waitFor(async () => {
      const me = await throughProxy.get("/api/auth/me");
      return me.status() === 204;
    }, "GET /api/auth/me through the Vite proxy to answer 204 for a visitor");
    await signInAdministrator(webBaseUrl);
  } finally {
    await direct.dispose();
    await throughProxy.dispose();
  }
}

async function waitFor(check: () => Promise<boolean>, description: string): Promise<void> {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    try {
      if (await check()) {
        return;
      }
    } catch {
      // Keep polling until the deadline; the servers may still be settling.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${description}`);
}

// Every test runs as the configured synthetic administrator, who can also shop. The session is stored
// once and reused, so no test depends on sign-in screens unless it is about them.
async function signInAdministrator(webBaseUrl: string): Promise<void> {
  const context = await request.newContext({ baseURL: webBaseUrl });

  try {
    await context.get("/api/auth/me");
    const response = await context.post("/api/auth/login", {
      data: adminCredentials(),
      headers: await xsrfHeaders(context)
    });

    if (response.status() !== 200) {
      throw new Error(`Administrator sign-in failed with HTTP ${response.status()}`);
    }

    mkdirSync(".auth", { recursive: true });
    await context.storageState({ path: authStatePath });
  } finally {
    await context.dispose();
  }
}
