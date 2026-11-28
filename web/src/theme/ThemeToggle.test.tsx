import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "./ThemeToggle";
import { applyThemePreference, readThemePreference, saveThemePreference, themeStorageKey } from "./theme";

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("theme preference", () => {
  it("defaults to system and ignores unknown stored values", () => {
    expect(readThemePreference()).toBe("system");
    window.localStorage.setItem(themeStorageKey, "purple");
    expect(readThemePreference()).toBe("system");
  });

  it("pins light or dark with data-theme and clears it for system", () => {
    applyThemePreference("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyThemePreference("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    applyThemePreference("system");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("stores light and dark and forgets system", () => {
    saveThemePreference("dark");
    expect(window.localStorage.getItem(themeStorageKey)).toBe("dark");
    saveThemePreference("system");
    expect(window.localStorage.getItem(themeStorageKey)).toBeNull();
  });

  it("keeps working when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readThemePreference()).toBe("system");
    expect(() => saveThemePreference("dark")).not.toThrow();
  });
});

describe("ThemeToggle", () => {
  it("starts on Auto and marks the saved choice", () => {
    window.localStorage.setItem(themeStorageKey, "dark");
    render(<ThemeToggle />);

    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Auto" })).toHaveAttribute("aria-pressed", "false");
  });

  it("applies and remembers the chosen theme", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(themeStorageKey)).toBe("dark");
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    expect(document.documentElement.dataset.theme).toBe("light");

    fireEvent.click(screen.getByRole("button", { name: "Auto" }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(window.localStorage.getItem(themeStorageKey)).toBeNull();
  });
});
