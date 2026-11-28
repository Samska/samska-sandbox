import { expect, test } from "@playwright/test";
import { xsrfHeaders } from "./session";
import {
  clearCart,
  createProduct,
  fetchOrderById,
  getCart,
  trackTransactionalRequests,
  type OrderDto
} from "./fixtures";

test.describe("First Order journey in a real browser", () => {
  test("places the First Order in one Checkout step", async ({ page, request }) => {
    await clearCart(request);
    const product = await createProduct(request, `E2E Success ${Date.now()}`, 12.5);
    const tracker = trackTransactionalRequests(page);

    // Market: add the synthetic Product to the Cart through the UI.
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: `Add ${product.name} to Cart` }).click();
    await expect(page.getByText(`${product.name} added to your Cart.`)).toBeVisible();

    // Cart drawer: keyboard entry, focus containment, Escape, and focus return.
    const cartTrigger = page.getByRole("button", { name: /^Cart\b/ });
    const cartDialog = page.getByRole("dialog", { name: "Your Cart" });
    await cartTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(cartDialog).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Cart" })).toBeFocused();

    // Explicit cycle boundaries instead of a fixed Tab count: the last
    // focusable control wraps to the first on Tab, and the first wraps back to
    // the last on Shift+Tab.
    const drawerFocusables = cartDialog.locator(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    const firstDrawerControl = drawerFocusables.first();
    const lastDrawerControl = drawerFocusables.last();
    await lastDrawerControl.focus();
    await page.keyboard.press("Tab");
    await expect(firstDrawerControl).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(lastDrawerControl).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(cartDialog).toBeHidden();
    await expect(cartTrigger).toBeFocused();

    // Re-enter and edit the quantity; the server response drives the drawer.
    await cartTrigger.focus();
    await page.keyboard.press("Enter");
    const drawerQuantity = page.getByRole("spinbutton", { name: `Quantity for ${product.name}`, exact: true });
    await drawerQuantity.fill("3");
    await drawerQuantity.press("Enter");
    await expect(page.getByText("Cart updated.")).toBeVisible();
    await expect(cartDialog.locator("dd")).toHaveText("$37.50");

    // Checkout: heading focus, then one step. There is no payment to choose or simulate.
    await cartDialog.getByRole("button", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeFocused();
    await expect(page.getByLabel("Demo outcome")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Simulate payment" })).toHaveCount(0);

    // A live Cart change before placing the order is reflected in what is ordered.
    const checkoutQuantity = page.getByRole("spinbutton", { name: `Quantity for ${product.name}`, exact: true });
    await checkoutQuantity.fill("4");
    await checkoutQuantity.press("Enter");
    await expect(page.getByText("Cart updated.")).toBeVisible();
    await expect(page.locator("#checkout dd")).toHaveText("$50.00");

    // Placing the Order through keyboard activation approves it directly.
    const placeOrder = page.getByRole("button", { name: "Place order" });
    await expect(placeOrder).toBeEnabled();
    await placeOrder.press("Enter");
    await expect(page.getByRole("heading", { name: "Order created", level: 1 })).toBeFocused();
    expect(tracker.orderPosts()).toBe(1);

    const orderNumber = (await page.getByLabel(/^Order number /).innerText()).trim();
    expect(orderNumber).toMatch(/^SK-\d{6}$/);
    const trackHref = (await page.getByRole("link", { name: "Track this order" }).getAttribute("href")) ?? "";
    const orderId = trackHref.replace("/orders/", "");
    expect(orderId).toMatch(/^[0-9a-f-]{36}$/i);
    await expect(page.getByText("Order total: $50.00")).toBeVisible();
    await expect(page.getByText("× 4 · $12.50 each")).toBeVisible();

    const orderById = await fetchOrderById(request, orderId);
    expect(orderById.status()).toBe(200);
    const capturedOrder = (await orderById.json()) as OrderDto;
    expect(capturedOrder.orderNumber).toBe(orderNumber);
    expect(capturedOrder.total).toBe(50);
    expect(capturedOrder.items[0]).toMatchObject({ productId: product.id, quantity: 4, lineSubtotal: 50 });

    // Placing the Order emptied the live Cart; a new Cart change leaves the frozen Order untouched.
    const emptiedCart = await getCart(request);
    expect(emptiedCart.items).toHaveLength(0);
    expect(emptiedCart.total).toBe(0);
    const refilled = await request.post("/api/cart/items", {
      data: { productId: product.id, quantity: 7 },
      headers: await xsrfHeaders(request)
    });
    expect(refilled.status()).toBe(200);
    expect((await (await fetchOrderById(request, orderId)).json()) as OrderDto).toEqual(capturedOrder);

    // The Order shows in the history and opens its tracking.
    await page.goto("/orders");
    const row = page.getByRole("listitem").filter({ hasText: orderNumber });
    await expect(row).toBeVisible();
    await expect(row).toContainText("$50.00");
    await row.getByRole("link", { name: /^Track order/ }).click();
    await expect(page).toHaveURL(new RegExp(`/orders/${orderId}$`));

    // Back at Checkout the new Cart is a fresh review, with no payment notice left behind.
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
    await expect(page.locator("#checkout dd")).toHaveText("$87.50");
    await expect(page.getByText("Payment not finished")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Resume payment" })).toHaveCount(0);

    expect(tracker.orderPosts(), "exactly one browser Order POST across the journey").toBe(1);
  });
});
