import { describe, expect, it } from "vitest";
import { filterProductsByName, normalizeForSearch } from "./productSearch";
import type { ProductResponse } from "./catalogApi";

function product(id: string, name: string, description: string): ProductResponse {
  return {
    id,
    name,
    description,
    price: 1,
    mediaKey: null,
    uploadedMediaId: null
  };
}

describe("normalizeForSearch", () => {
  it("lowercases ASCII characters", () => {
    expect(normalizeForSearch("ABC")).toBe("abc");
    expect(normalizeForSearch("Canvas TOTE")).toBe("canvas tote");
  });

  it("strips combining diacritical marks (cafe -> Café)", () => {
    expect(normalizeForSearch("Café")).toBe("cafe");
  });

  it("strips combining diacritical marks on uppercase (CAFÉ -> Cafe)", () => {
    expect(normalizeForSearch("CAFÉ")).toBe("cafe");
  });

  it("strips combining diacritical marks on lowercase (café -> Cafe)", () => {
    expect(normalizeForSearch("café")).toBe("cafe");
  });

  it("preserves internal whitespace", () => {
    expect(normalizeForSearch("a  b")).toBe("a  b");
    expect(normalizeForSearch("canvas  tote")).toBe("canvas  tote");
  });
});

describe("filterProductsByName", () => {
  const canvas = product("p1", "Canvas Tote", "A sturdy everyday tote.");
  const enamel = product("p2", "Enamel Pin", "A small pin badge.");
  const parisian = product("p3", "Café parisien", "Coffee inspired mug.");
  const doubleSpaced = product("p4", "Canvas  Tote", "Two spaces between words.");

  it("returns every Product when the term is empty", () => {
    const products = [canvas, enamel];
    const result = filterProductsByName(products, "");
    expect(result).toEqual(products);
    expect(result).not.toBe(products);
  });

  it("treats a whitespace-only term as empty", () => {
    const products = [canvas, enamel];
    expect(filterProductsByName(products, "   ")).toEqual(products);
    expect(filterProductsByName(products, "\t \n")).toEqual(products);
  });

  it("matches case-insensitively as a substring of the name", () => {
    const products = [canvas, enamel];
    expect(filterProductsByName(products, "TOTE")).toEqual([canvas]);
    expect(filterProductsByName(products, "tot")).toEqual([canvas]);
    expect(filterProductsByName(products, "Pin")).toEqual([enamel]);
    expect(filterProductsByName(products, "pin")).toEqual([enamel]);
  });

  it("trims leading and trailing whitespace from the term", () => {
    const products = [canvas];
    expect(filterProductsByName(products, "  tote  ")).toEqual([canvas]);
    expect(filterProductsByName(products, "\ncanvas\n")).toEqual([canvas]);
  });

  it("keeps internal whitespace significant in the term", () => {
    const products = [canvas, doubleSpaced];
    expect(filterProductsByName(products, "canvas  tote")).toEqual([doubleSpaced]);
    expect(filterProductsByName(products, "canvas tote")).toEqual([canvas]);
    expect(filterProductsByName(products, "canvas   tote")).toEqual([]);
  });

  it("matches across diacritics (cafe finds Café)", () => {
    const products = [parisian, canvas];
    expect(filterProductsByName(products, "cafe")).toEqual([parisian]);
    expect(filterProductsByName(products, "CAFÉ")).toEqual([parisian]);
    expect(filterProductsByName(products, "café")).toEqual([parisian]);
    expect(filterProductsByName(products, "CAFE")).toEqual([parisian]);
  });

  it("never matches against description", () => {
    const products = [
      product("p1", "Foo", "tote description"),
      product("p2", "Bar", "another description")
    ];
    expect(filterProductsByName(products, "tote")).toEqual([]);
    expect(filterProductsByName(products, "another")).toEqual([]);
    expect(filterProductsByName(products, "description")).toEqual([]);
  });

  it("returns an empty array when nothing matches", () => {
    const products = [canvas];
    expect(filterProductsByName(products, "xyz")).toEqual([]);
    expect(filterProductsByName(products, "  xyz  ")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const products = [canvas, enamel, parisian];
    const snapshot = products.slice();
    filterProductsByName(products, "caf");
    filterProductsByName(products, "");
    filterProductsByName(products, "tot");
    expect(products).toEqual(snapshot);
    expect(products).toHaveLength(3);
  });

  it("does not mutate the Product objects", () => {
    const products = [canvas, enamel, parisian];
    const nameSnapshot = canvas.name;
    const descriptionSnapshot = canvas.description;
    const parisianNameSnapshot = parisian.name;

    filterProductsByName(products, "CAFÉ");
    filterProductsByName(products, "tot");

    expect(canvas.name).toBe(nameSnapshot);
    expect(canvas.description).toBe(descriptionSnapshot);
    expect(parisian.name).toBe(parisianNameSnapshot);
  });
});
