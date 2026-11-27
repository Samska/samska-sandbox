const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const unauthorizedEvent = "samska:unauthorized";

function readCookie(name: string): string | null {
  for (const part of document.cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

/**
 * fetch for the application's own API. State-changing requests echo the XSRF cookie in a header, which
 * the backend requires, and a 401 tells the shell that the session is gone.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  let options = init;
  const method = (init?.method ?? "GET").toUpperCase();
  const token = UNSAFE_METHODS.has(method) ? readCookie("XSRF-TOKEN") : null;

  if (token !== null) {
    const headers = new Headers(init?.headers);
    headers.set("X-XSRF-TOKEN", token);
    options = { ...init, headers };
  }

  const response = await fetch(input, options);

  if (response.status === 401 && !input.startsWith("/api/auth/")) {
    window.dispatchEvent(new Event(unauthorizedEvent));
  }

  return response;
}
