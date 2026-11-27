import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, unauthorizedEvent } from "./http";

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});

function stubFetch(status = 200) {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiFetch", () => {
  it("echoes the XSRF cookie on state-changing requests", async () => {
    document.cookie = "XSRF-TOKEN=token%20value; path=/";
    const fetchMock = stubFetch();

    await apiFetch("/api/cart/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });

    const options = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(options[1].headers);
    expect(headers.get("X-XSRF-TOKEN")).toBe("token value");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("does not add the header to reads or when there is no cookie", async () => {
    const fetchMock = stubFetch();
    document.cookie = "XSRF-TOKEN=abc; path=/";
    await apiFetch("/api/cart");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/cart", undefined);

    document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    const init = { method: "DELETE" };
    await apiFetch("/api/cart/items/1", init);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/cart/items/1", init);
  });

  it("announces an expired session on 401, except for the sign-in calls", async () => {
    const listener = vi.fn();
    window.addEventListener(unauthorizedEvent, listener);
    stubFetch(401);

    await apiFetch("/api/auth/login", { method: "POST" });
    expect(listener).not.toHaveBeenCalled();

    await apiFetch("/api/cart");
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(unauthorizedEvent, listener);
  });
});
