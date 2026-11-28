import { expect, test } from "@playwright/test";
import { clearCart, createOrderViaApi, createProduct } from "./fixtures";

test.describe("Order history and tracking in a real browser", () => {
  test("a new Order appears in history and opens its tracking", async ({ page, request }) => {
    await clearCart(request);
    const product = await createProduct(request, `Tracked ${Date.now()}`, 21);
    const order = await createOrderViaApi(request, product.id, 2);
    await clearCart(request);

    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "Primary" });
    await navigation.getByRole("link", { name: "Orders" }).click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("heading", { name: "Your orders", level: 1 })).toBeFocused();
    const row = page.getByRole("listitem").filter({ hasText: order.orderNumber });
    await expect(row).toBeVisible();
    await expect(row).toContainText("$42.00");
    await expect(row).toContainText("Placed");

    await row.getByRole("link", { name: /^Track order/ }).click();
    await expect(page).toHaveURL(new RegExp(`/orders/${order.orderId}$`));
    await expect(page.getByRole("heading", { name: "Order placed", level: 1 })).toBeFocused();
    await expect(page.getByText(/simulated/i)).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: "Order placed" })).toContainText("(done)");
    await expect(page.getByRole("listitem").filter({ hasText: "Delivered" })).toContainText("(not yet)");

    await page.getByRole("button", { name: "Check again" }).click();
    await expect(page.getByRole("button", { name: "Check again" })).toBeEnabled();
  });

  test("tracking an unknown Order says it was not found", async ({ page }) => {
    await page.goto("/orders/00000000-0000-4000-8000-000000000000");
    await expect(page.getByRole("heading", { name: "Order not found" })).toBeVisible();
  });

  test("the administrator moves an Order and the customer sees the new status", async ({ page, request }) => {
    await clearCart(request);
    const product = await createProduct(request, `Moved ${Date.now()}`, 12);
    const order = await createOrderViaApi(request, product.id, 1);
    await clearCart(request);

    await page.goto("/");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Admin" }).click();
    await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/admin\/orders$/);
    await expect(page.getByRole("heading", { name: "Orders", level: 1 })).toBeFocused();

    const row = page.getByRole("listitem").filter({ hasText: order.orderNumber });
    await row.getByLabel("Status").selectOption("PACKED");
    await row.getByRole("button", { name: `Update order ${order.orderNumber}` }).click();
    await expect(page.getByText(`Order ${order.orderNumber} is now Packed.`)).toBeVisible();

    await page.goto(`/orders/${order.orderId}`);
    await expect(page.getByRole("heading", { name: "Packed", level: 1 })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Shipped" })).toContainText("(not yet)");
  });
});
