import type { APIRequestContext } from "@playwright/test";

export const authStatePath = ".auth/admin.json";

// Synthetic values for the throwaway backend that Playwright starts; never used elsewhere.
export const adminEmail = "admin@samska.test";
export const adminPassword = "synthetic-e2e-admin-pass";

export function adminCredentials(): { email: string; password: string } {
  return { email: adminEmail, password: adminPassword };
}

// The backend requires the XSRF cookie value in a header on state-changing requests, as the
// application does. Playwright keeps the cookie in the context's storage state.
export async function xsrfHeaders(context: APIRequestContext): Promise<Record<string, string>> {
  const { cookies } = await context.storageState();
  const token = cookies.find((cookie) => cookie.name === "XSRF-TOKEN")?.value;
  return token === undefined ? {} : { "X-XSRF-TOKEN": decodeURIComponent(token) };
}
