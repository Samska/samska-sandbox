import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRuntimeIdentity } from "./runtime";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("fetchRuntimeIdentity", () => {
  it("returns ready when the candidate answers exactly rebuild-r1", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ runtime: "rebuild-r1" }));
    const status = await fetchRuntimeIdentity("");
    expect(status).toEqual({ kind: "ready", runtime: "rebuild-r1" });
  });

  it("returns mismatch when the runtime value differs", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ runtime: "production" }));
    const status = await fetchRuntimeIdentity("");
    expect(status).toEqual({ kind: "mismatch", observed: "production" });
  });

  it("returns unavailable without leaking the cause when the network rejects", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("secret: ECONNREFUSED 127.0.0.1:8080"));
    const status = await fetchRuntimeIdentity("");
    expect(status).toEqual({
      kind: "unavailable",
      reason: "Could not reach the candidate backend."
    });
    expect(JSON.stringify(status)).not.toContain("secret");
  });

  it("returns unavailable when the response body is not JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("not json", { status: 200 }));
    const status = await fetchRuntimeIdentity("");
    expect(status).toEqual({
      kind: "unavailable",
      reason: "Runtime response was not understood."
    });
  });

  it("returns unavailable when the JSON has extra keys", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ runtime: "rebuild-r1", version: 1 })
    );
    const status = await fetchRuntimeIdentity("");
    expect(status).toEqual({
      kind: "unavailable",
      reason: "Runtime response was not understood."
    });
  });

  it("returns unavailable when the JSON lacks the runtime field", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ hello: "world" }));
    const status = await fetchRuntimeIdentity("");
    expect(status).toEqual({
      kind: "unavailable",
      reason: "Runtime response was not understood."
    });
  });

  it("returns unavailable when status is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("", { status: 500 }));
    const status = await fetchRuntimeIdentity("");
    expect(status).toEqual({
      kind: "unavailable",
      reason: "Runtime endpoint returned status 500."
    });
  });

  it("aborts when the caller aborts", async () => {
    const controller = new AbortController();
    controller.abort();
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ runtime: "rebuild-r1" }));
    const status = await fetchRuntimeIdentity("", controller.signal);
    // Even when aborted, the call resolves; the caller should ignore the result.
    expect(status).toEqual({ kind: "ready", runtime: "rebuild-r1" });
  });
});