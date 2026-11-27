import { expect, test } from "@playwright/test";
import { clearCart, createOrderViaApi, createProduct } from "./fixtures";

test.describe("Order history and tracking in a real browser", () => {
  test("a new Order appears in history and opens its simulated tracking", async ({ page, request }) => {
    await clearCart(request);
    const product = await createProduct(request, `Tracked ${Date.now()}`, 21);
    const order = await createOrderViaApi(request, product.id, 2);
    await clearCart(request);

    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "Primary" });
    await navigation.getByRole("link", { name: "Orders" }).click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("heading", { name: "Your orders", level: 1 })).toBeFocused();
    const reference = order.orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
    const row = page.getByRole("row", { name: new RegExp(`${reference.slice(0, 4)}-${reference.slice(4)}`) });
    await expect(row).toBeVisible();
    await expect(row).toContainText("42.00");
    await expect(row).toContainText("Processing");

    await row.getByRole("link", { name: /^Track order/ }).click();
    await expect(page).toHaveURL(new RegExp(`/orders/${order.orderId}$`));
    await expect(page.getByRole("heading", { name: "Getting ready", level: 1 })).toBeFocused();
    await expect(page.getByText("Couriers and notifications are simulated")).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Order created" })).toContainText("(done)");
    await expect(page.getByRole("listitem").filter({ hasText: "Delivered" })).toContainText("(not yet)");

    await page.getByRole("button", { name: "Check again" }).click();
    await expect(page.getByRole("button", { name: "Check again" })).toBeEnabled();
  });

  test("tracking an unknown Order says it was not found", async ({ page }) => {
    await page.goto("/orders/00000000-0000-4000-8000-000000000000");
    await expect(page.getByRole("heading", { name: "Order not found" })).toBeVisible();
  });
});
