import { request, type APIRequestContext } from "@playwright/test";

const backendIdentityUrl = "http://127.0.0.1:8080/api/rebuild/runtime";
const webBaseUrl = "http://127.0.0.1:5173";

// Exactly one JSON body proves the backend is the rebuild-r1 candidate, not
// the standard runtime and not a foreign process on the same port.
const expectedIdentity = { runtime: "rebuild-r1" };

// Readiness evidence before any test runs: the candidate identity is
// confirmed directly against the backend and through the Vite proxy path the
// application uses. The servers themselves are owned by the launcher started
// by Playwright's webServer lifecycle; this setup only proves they answer as
// expected before any test runs.
export default async function globalSetup(): Promise<void> {
  const direct = await request.newContext();
  const throughProxy = await request.newContext({ baseURL: webBaseUrl });

  try {
    await waitFor(async () => {
      return identityMatches(direct, backendIdentityUrl);
    }, `GET /api/rebuild/runtime against the backend to respond {"runtime":"rebuild-r1"}`);

    await waitFor(async () => {
      return identityMatches(throughProxy, "/api/rebuild/runtime");
    }, `GET /api/rebuild/runtime through the Vite proxy to respond {"runtime":"rebuild-r1"}`);
  } finally {
    await direct.dispose();
    await throughProxy.dispose();
  }
}

async function identityMatches(
  api: APIRequestContext,
  target: string
): Promise<boolean> {
  const response = await api.get(target);
  if (response.status() !== 200) {
    return false;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return false;
  }

  // Exact contract: no extra keys, no different value, no array wrapper.
  return deepEqual(body, expectedIdentity);
}

function deepEqual(actual: unknown, expected: { runtime: string }): boolean {
  if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
    return false;
  }

  const entries = Object.entries(actual as Record<string, unknown>);
  if (entries.length !== 1) {
    return false;
  }

  const [key, value] = entries[0];
  return key === "runtime" && value === expected.runtime;
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
