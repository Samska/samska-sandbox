import { afterEach, describe, expect, it } from "vitest";
import { navigateTo, normalizedPath } from "./routes";

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("journey routes", () => {
  it("normalizes trailing slashes", () => {
    window.history.replaceState({}, "", "/checkout///");
    expect(normalizedPath()).toBe("/checkout");
  });

  it("pushes and replaces history entries for the journey surfaces", () => {
    expect(navigateTo("/checkout")).toBe(true);
    expect(window.location.pathname).toBe("/checkout");

    expect(navigateTo("/", { replace: true })).toBe(true);
    expect(window.location.pathname).toBe("/");
  });
});
