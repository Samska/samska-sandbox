export type ThemePreference = "system" | "light" | "dark";

export const themeStorageKey = "samska-theme";
export const themePreferences: readonly ThemePreference[] = ["system", "light", "dark"];

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (themePreferences as readonly string[]).includes(value);
}

/** The saved choice, or "system" when nothing valid is stored or storage is unavailable. */
export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/** Light and dark pin the theme with data-theme; system removes it so the OS setting decides. */
export function applyThemePreference(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = preference;
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    if (preference === "system") {
      window.localStorage.removeItem(themeStorageKey);
    } else {
      window.localStorage.setItem(themeStorageKey, preference);
    }
  } catch {
    // The choice still applies for this page view; it just will not persist.
  }
}
