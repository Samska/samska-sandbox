import { afterEach, describe, expect, it } from "vitest";
import { attemptIdForPath, attemptPath, navigateTo, normalizedPath } from "./routes";

const attemptId = "aaaaaaaa-1111-1111-1111-111111111111";

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("journey routes", () => {
  it("builds and parses attempt paths for valid UUIDs", () => {
    expect(attemptPath(attemptId)).toBe(`/checkout/attempts/${attemptId}`);
    expect(attemptIdForPath(`/checkout/attempts/${attemptId}`)).toBe(attemptId);
  });

  it("rejects malformed, non-UUID, and incomplete attempt paths", () => {
    expect(attemptIdForPath("/checkout/attempts/not-a-uuid")).toBeNull();
    expect(attemptIdForPath("/checkout/attempts")).toBeNull();
    expect(attemptIdForPath("/checkout/attempts/%E0%A4%A")).toBeNull();
    expect(attemptIdForPath("/checkout")).toBeNull();
    expect(attemptIdForPath("/")).toBeNull();
  });

  it("normalizes trailing slashes", () => {
    window.history.replaceState({}, "", "/checkout///");
    expect(normalizedPath()).toBe("/checkout");
  });

  it("pushes and replaces history entries for the journey surfaces", () => {
    expect(navigateTo("/checkout")).toBe(true);
    expect(window.location.pathname).toBe("/checkout");

    expect(navigateTo(attemptPath(attemptId), { replace: true })).toBe(true);
    expect(window.location.pathname).toBe(`/checkout/attempts/${attemptId}`);

    expect(navigateTo("/checkout", { replace: true })).toBe(true);
    expect(window.location.pathname).toBe("/checkout");
  });
});
