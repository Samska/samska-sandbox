import { apiFetch } from "../http";

/** True when the server runs as the public demo. Any failure means "not a demo", never an error screen. */
export async function readDemoMode(): Promise<boolean> {
  try {
    const response = await apiFetch("/api/config");

    if (response.status !== 200) {
      return false;
    }

    const payload: unknown = await response.json();

    return typeof payload === "object" && payload !== null && (payload as { demo?: unknown }).demo === true;
  } catch {
    return false;
  }
}

export async function resetDemoData(): Promise<boolean> {
  try {
    const response = await apiFetch("/api/admin/demo/reset", { method: "POST" });

    return response.status === 204;
  } catch {
    return false;
  }
}
