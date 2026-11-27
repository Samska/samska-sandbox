import { useState } from "react";
import {
  applyThemePreference,
  readThemePreference,
  saveThemePreference,
  themePreferences,
  type ThemePreference
} from "./theme";

const labels: Record<ThemePreference, string> = { system: "Auto", light: "Light", dark: "Dark" };

/** Auto follows the system setting; Light and Dark override it and are remembered in this browser. */
export default function ThemeToggle({ inverted = false }: { inverted?: boolean }) {
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference);

  function choose(next: ThemePreference) {
    setPreference(next);
    applyThemePreference(next);
    saveThemePreference(next);
  }

  const pressed = inverted ? "bg-canvas text-ink" : "bg-ink text-canvas";
  const idle = inverted ? "text-canvas hover:bg-canvas/20" : "text-ink hover:bg-surface-muted";

  return (
    <div
      role="group"
      aria-label="Theme"
      className={`inline-flex overflow-hidden rounded-sm border-[1.5px] ${inverted ? "border-canvas" : "border-ink"}`}
    >
      {themePreferences.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={preference === option}
          onClick={() => choose(option)}
          className={`min-h-9 px-2.5 max-[34rem]:px-1.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.06em] ${preference === option ? pressed : idle}`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
