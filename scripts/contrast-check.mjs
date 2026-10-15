#!/usr/bin/env node
/**
 * Paper & ink commerce — AA contrast audit.
 *
 * Computes the WCAG 2.1 relative-luminance contrast for every meaningful
 * pair of tokens used in the rebuild stylesheet.
 *
 * Each pair declares its own requirement:
 *   "text"       — normal text, needs >= 4.5:1 (WCAG 1.4.3 AA)
 *   "ui"         — UI component boundary / large text, needs >= 3:1 (1.4.11)
 *   "decorative" — purely ornamental divider, exempt from 1.4.11; reported only
 *
 * Exits non-zero when any enforced pair fails, so the audit can be a real gate
 * in CI instead of an informational printout.
 *
 * Tokens mirror web/rebuild/styles/index.css. Keep them in sync: change the
 * stylesheet and this list together.
 */

const tokens = {
  canvas: "#f6f2ea",
  surface: "#fffdf7",
  "surface-elevated": "#ffffff",
  ink: "#1b2430",
  "ink-soft": "#2c3845",
  muted: "#5a6672",
  "rule": "#d8d1c5",
  "rule-strong": "#7c8693",
  brand: "#175e75",
  "brand-deep": "#10485a",
  "brand-tint": "#e3eef1",
  "on-brand": "#fffdf7",
  focus: "#b45309",
  success: "#1f6b3a",
  "success-tint": "#dde9e0",
  danger: "#9b2222",
  "danger-tint": "#f0d7d7",
  warning: "#8a5a08",
  "warning-tint": "#f1e3c4"
};

const THRESHOLD = { text: 4.5, ui: 3.0 };

function parse(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
}

function rel([r, g, b]) {
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const la = rel(parse(a));
  const lb = rel(parse(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** [foreground, background, description, requirement] */
const pairs = [
  // Text on canvas / surface
  ["ink", "canvas", "body text on canvas", "text"],
  ["ink", "surface", "body text on surface (form panel)", "text"],
  ["ink", "surface-elevated", "body text on input", "text"],
  ["ink-soft", "canvas", "label / heading ink-soft on canvas", "text"],
  ["ink-soft", "surface", "label / heading ink-soft on surface", "text"],
  ["muted", "canvas", "muted body on canvas", "text"],
  ["muted", "surface", "muted body on surface", "text"],
  ["muted", "surface-elevated", "placeholder on input", "text"],
  ["brand", "canvas", "link / eyebrow on canvas", "text"],
  ["brand", "surface", "link on surface", "text"],
  ["brand", "brand-tint", "link on brand-tint", "text"],
  ["on-brand", "brand", "primary button text on brand", "text"],
  ["on-brand", "brand-deep", "primary button text on brand-deep (hover)", "text"],
  ["danger", "canvas", "danger text on canvas", "text"],
  ["danger", "surface", "danger text on surface", "text"],
  ["danger", "danger-tint", "danger text on danger-tint", "text"],
  ["success", "canvas", "success text on canvas", "text"],
  ["success", "success-tint", "success text on success-tint", "text"],
  ["warning", "canvas", "warning text on canvas", "text"],
  ["warning", "warning-tint", "warning text on warning-tint", "text"],
  // Non-text indicators and component boundaries
  ["focus", "canvas", "focus ring on canvas (keyboard indicator)", "ui"],
  ["rule-strong", "surface-elevated", "field border on input surface", "ui"],
  ["rule-strong", "canvas", "field border on canvas", "ui"],
  ["ink", "surface-elevated", "hover border on input surface", "ui"],
  ["focus", "surface-elevated", "focus border on input surface", "ui"],
  ["danger", "surface-elevated", "invalid border on input surface", "ui"],
  ["ink", "warning-tint", "runtime banner text on warning-tint", "text"],
  ["ink", "danger-tint", "list-state--error text on danger-tint", "text"],
  ["ink", "success-tint", "saved status on success-tint", "text"],
  // Ornamental divider only; exempt from 1.4.11 and reported for awareness.
  ["rule", "surface", "hairline rule on surface (decorative)", "decorative"]
];

const fmt = (n) => n.toFixed(2).padStart(5, " ");
const pad = (s, n) => String(s).padEnd(n, " ");

let failures = 0;
const empty = "";

console.log("Pair".padEnd(56) + "Ratio   Req          Pass");
console.log("-".repeat(88));

for (const [fg, bg, label, requirement] of pairs) {
  const ratio = contrast(tokens[fg], tokens[bg]);
  const required = THRESHOLD[requirement];
  const verdict = requirement === "decorative"
    ? "exempt"
    : ratio >= required
      ? "pass"
      : "FAIL";
  if (verdict === "FAIL") {
    failures += 1;
  }
  console.log(
    `${pad(`${fg} on ${bg} — ${label}`, 56)} ${fmt(ratio)}   ${pad(requirement, 12)} ${verdict}`
  );
}

console.log("-".repeat(88));
if (failures > 0) {
  console.error(`${failures} contrast requirement(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(
    `All ${pairs.length - 1} enforced pairs meet their WCAG AA requirement ` +
      `(1 decorative pair exempt).`
  );
}
