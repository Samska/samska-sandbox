import { expect, test } from "@playwright/test";
import { clearCart } from "./fixtures";
import { xsrfHeaders } from "./session";

test.describe("Stock in a real browser", () => {
  test("a Product with no stock is sold out and low stock is flagged", async ({ page, request }) => {
    await clearCart(request);
    const stamp = Date.now();
    const create = async (name: string, stock: number) => {
      const response = await request.post("/api/products", {
        data: { name, description: "Synthetic stock fixture", price: 9, stock },
        headers: await xsrfHeaders(request)
      });
      expect(response.status()).toBe(201);
    };
    await create(`Gone ${stamp}`, 0);
    await create(`Rare ${stamp}`, 2);

    await page.goto("/");
    const rare = page.getByRole("listitem").filter({ hasText: `Rare ${stamp}` });
    await expect(rare).toContainText("2 left");
    await expect(rare.getByRole("button", { name: /^Add/ })).toBeEnabled();

    const gone = page.getByRole("listitem").filter({ hasText: `Gone ${stamp}` });
    await expect(gone).toContainText("Sold out");
    await expect(gone.getByRole("button", { name: /^Add/ })).toBeDisabled();
  });
});
