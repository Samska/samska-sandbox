import type { RuntimeStatus } from "./types";

const RUNTIME_PATH = "/api/rebuild/runtime";
const EXPECTED_RUNTIME = "rebuild-r1";

/**
 * Reads the candidate runtime identity. The candidate backend is the only
 * acceptable source; a plain /actuator/health answer is explicitly rejected.
 *
 * The promise resolves to a status object — never throws — so callers can
 * gate UI without try/catch noise. Reasons are user-friendly and never echo
 * the raw fetch cause.
 */
export async function fetchRuntimeIdentity(
  baseUrl: string = "",
  signal?: AbortSignal
): Promise<RuntimeStatus> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${RUNTIME_PATH}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal
    });
  } catch {
    return { kind: "unavailable", reason: "Could not reach the candidate backend." };
  }

  if (!response.ok) {
    return {
      kind: "unavailable",
      reason: `Runtime endpoint returned status ${response.status}.`
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { kind: "unavailable", reason: "Runtime response was not understood." };
  }

  const runtime = readRuntimeField(payload);
  if (runtime === undefined) {
    return { kind: "unavailable", reason: "Runtime response was not understood." };
  }
  if (runtime === EXPECTED_RUNTIME) {
    return { kind: "ready", runtime: EXPECTED_RUNTIME };
  }
  return { kind: "mismatch", observed: runtime };
}

function readRuntimeField(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== "runtime") {
    return undefined;
  }
  const runtime = (value as Record<string, unknown>).runtime;
  return typeof runtime === "string" ? runtime : undefined;
}