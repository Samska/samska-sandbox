/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexCss = readFileSync("src/index.css", "utf8");
const indexHtml = readFileSync("index.html", "utf8");

// Bench design tokens (SS-063, SS-064). The CSS is the source for the app; the
// prototype and bench.tokens.json document the same values.
type Theme = Record<string, string>;

function declarations(block: string): Theme {
  const tokens: Theme = {};
  for (const match of block.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[match[1]] = match[2].toLowerCase();
  }
  return tokens;
}

function themeBlock(source: string, opener: string): string {
  const start = source.indexOf(opener);
  expect(start, `missing block ${opener}`).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let index = source.indexOf("{", start); index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated block ${opener}`);
}

const light = declarations(themeBlock(indexCss, "@theme"));
const darkOverrides = declarations(themeBlock(indexCss, "@media (prefers-color-scheme: dark)"));
const dark = { ...light, ...darkOverrides };

it("keeps the pinned Dark palette identical to the system-dark palette", () => {
  const pinned = declarations(themeBlock(indexCss, ':root[data-theme="dark"]'));
  expect(pinned).toEqual(darkOverrides);
  expect(indexCss).toContain(':root:not([data-theme="light"])');
});

it("loads the early theme script from a file the Content-Security-Policy allows", () => {
  expect(indexHtml).toContain('<script src="/theme-init.js"></script>');
  expect(indexHtml).not.toMatch(/<script(?![^>]*src=)[^>]*>/);
});

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const textPairs: Array<[string, string]> = [
  ["ink", "canvas"],
  ["ink", "surface"],
  ["ink", "surface-muted"],
  ["muted", "canvas"],
  ["muted", "surface"],
  ["on-brand", "brand"],
  ["brand-dark", "canvas"],
  ["ink", "count-surface"],
  ["danger", "canvas"],
  ["danger", "surface"],
  ["on-danger", "danger"],
  ["success-text", "success-surface"],
  ["ink", "pending-surface"],
  ["ink", "media-teal"],
  ["ink", "media-olive"],
  ["ink", "media-rose"],
  ["ink", "media-slate"]
];

describe("Bench theme tokens", () => {
  it("defines the Bench palette in light mode", () => {
    expect(light.canvas).toBe("#e4e7e4");
    expect(light.ink).toBe("#111518");
    expect(light.brand).toBe("#ff4a1c");
  });

  it("redefines the same tokens for dark mode", () => {
    expect(dark.canvas).toBe("#0e1114");
    expect(dark.ink).toBe("#eef0ec");
    expect(dark.brand).toBe("#ff5a2e");
    for (const token of ["canvas", "surface", "ink", "muted", "brand", "border", "danger"]) {
      expect(dark[token], token).not.toBe(light[token]);
    }
  });

  it.each(textPairs)("keeps %s on %s at WCAG AA text contrast in light mode", (foreground, background) => {
    expect(contrast(light[foreground], light[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(textPairs)("keeps %s on %s at WCAG AA text contrast in dark mode", (foreground, background) => {
    expect(contrast(dark[foreground], dark[background])).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["light", light],
    ["dark", dark]
  ] as const)("keeps the focus ring and strong borders visible in %s mode", (_name, theme) => {
    expect(contrast(theme.focus, theme.canvas)).toBeGreaterThanOrEqual(3);
    expect(contrast(theme.focus, theme.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(theme["border-strong"], theme.surface)).toBeGreaterThanOrEqual(3);
  });

  it("declares the display and data font stacks with fallbacks", () => {
    expect(indexCss).toMatch(/--font-sans:\s*"Archivo",[^;]*sans-serif;/);
    expect(indexCss).toMatch(/--font-mono:\s*"IBM Plex Mono",[^;]*monospace;/);
  });

  it("styles headings as uppercase display type in the base layer", () => {
    expect(themeBlock(indexCss, "@layer base")).toMatch(/text-transform:\s*uppercase/);
  });

  it("loads both fonts from Google Fonts and names the store", () => {
    expect(indexHtml).toContain("family=Archivo:wdth,wght@62..125,100..900");
    expect(indexHtml).toContain("family=IBM+Plex+Mono");
    expect(indexHtml).toContain("<title>Samska Store</title>");
  });
});
