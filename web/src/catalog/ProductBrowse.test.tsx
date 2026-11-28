import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductBrowse from "./ProductBrowse";
import type { ProductResponse } from "./catalogApi";

const products: ProductResponse[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Arc Table Lamp",
    description: "A slim steel arc.",
    price: 129,
    mediaKey: null,
    uploadedMediaId: null
  } as ProductResponse,
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Terra Vessel",
    description: "Hand-glazed stoneware.",
    price: 68,
    mediaKey: null,
    uploadedMediaId: null
  } as ProductResponse
];

function renderBrowse(overrides: Partial<Parameters<typeof ProductBrowse>[0]> = {}) {
  return render(
    <ProductBrowse
      products={products}
      isPending={false}
      error={null}
      isCartPending={false}
      onRetry={() => undefined}
      onAdd={async () => undefined}
      onSelect={() => undefined}
      onViewDetailsRef={() => undefined}
      cartTrigger={null}
      searchTerm=""
      onSearchTermChange={() => undefined}
      onSearchInputRef={() => undefined}
      {...overrides}
    />
  );
}

describe("ProductBrowse (Bench catalog)", () => {
  it("renders one object card per Product with a catalog number and the price tag", () => {
    renderBrowse();
    const cards = screen.getAllByRole("listitem");

    expect(cards).toHaveLength(2);
    const first = within(cards[0]);
    expect(first.getByRole("heading", { name: "Arc Table Lamp", level: 3 })).toBeInTheDocument();
    expect(first.getByText("$129.00")).toBeInTheDocument();
    expect(cards[0].textContent).toMatch(/No\. \d{4}/);
  });

  it("keeps the price inside the object stage, not as a separate row", () => {
    renderBrowse();
    const price = screen.getByText("$68.00");

    expect(price.closest("p")?.className).toContain("rounded-full");
    expect(price.closest("p")?.className).toContain("absolute");
  });

  it("keeps the accessible names tests and screen readers rely on", () => {
    renderBrowse();

    expect(screen.getByRole("button", { name: "View details for Arc Table Lamp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Terra Vessel to Cart" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Products", level: 1 })).toBeInTheDocument();
  });

  it("shows the empty state with a dashed ink frame and a link to Admin", () => {
    renderBrowse({ products: [] });

    const link = screen.getByRole("link", { name: "Create a synthetic Product" });
    expect(link).toHaveAttribute("href", "/admin/products/new");
    expect(link.className).toContain("underline");
    expect(link.closest("div")?.className).toContain("border-dashed");
  });

  it("shows the count as a mono label", () => {
    renderBrowse();

    expect(screen.getByText("2 products").className).toContain("font-mono");
  });

  it("announces loading without cards", () => {
    renderBrowse({ isPending: true, products: [] });

    expect(screen.getByRole("status")).toHaveTextContent("Loading Products...");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("shows an alert and a retry control on error", () => {
    const onRetry = vi.fn();
    renderBrowse({ error: "Could not load Products.", onRetry, products: [] });

    expect(screen.getByRole("alert")).toHaveTextContent("Could not load Products.");
    screen.getByRole("button", { name: "Retry Products" }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows stock badges and disables Add for a sold-out Product", () => {
    renderBrowse({
      products: [
        { ...products[0], stock: 0 },
        { ...products[1], stock: 3 },
        { ...products[1], id: "33333333-3333-3333-3333-333333333333", name: "Plenty", stock: 40 }
      ]
    });

    expect(screen.getByText("Sold out", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("3 left")).toBeInTheDocument();
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Arc Table Lamp to Cart" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add Terra Vessel to Cart" })).toBeEnabled();
  });
});
