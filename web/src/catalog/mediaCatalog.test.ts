import { describe, expect, it } from "vitest";
import { hasCuratedMedia } from "./mediaCatalog";
import { productArt } from "./productArt";

describe("curated media", () => {
  it("recognises curated images and curated illustrations, and nothing else", () => {
    expect(hasCuratedMedia("canvas-market-tote")).toBe(true);
    expect(hasCuratedMedia("art-tote")).toBe(true);
    expect(hasCuratedMedia("unknown-key")).toBe(false);
    expect(hasCuratedMedia(null)).toBe(false);
  });

  it("has an illustration for each sample Product, drawn with theme tokens only", () => {
    const keys = ["tote", "pour-over", "workbench", "linen-apron", "camp-mug", "serving-board"].map(
      (name) => `art-${name}`
    );

    for (const key of keys) {
      const art = productArt(key);

      expect(art, key).toBeDefined();
      expect(art?.markup).toContain("var(--color-ink)");
      expect(art?.markup).not.toMatch(/#[0-9a-f]{3,6}\b|<script|on[a-z]+=/i);
    }
  });
});
