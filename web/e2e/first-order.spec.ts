import { expect, test } from "@playwright/test";
import {
  clearCart,
  createProduct,
  fetchOrderByAttempt,
  fetchOrderById,
  fetchPaymentAttempt,
  getCart,
  trackTransactionalRequests,
  type OrderDto,
  type PaymentAttemptDto
} from "./fixtures";

test.describe("First Order journey in a real browser", () => {
  test("completes the First Order journey with explicit Order creation and recovery", async ({
    page,
    browser,
    request
  }) => {
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
    await expect(cartDialog.locator("dd")).toHaveText("37.50");

    // Checkout: heading focus, explicit approve outcome, transactional click.
    await cartDialog.getByRole("button", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeFocused();

    await page.getByLabel("Demo outcome").selectOption("approve");
    await page.getByRole("button", { name: "Simulate payment" }).click();
    await expect(page).toHaveURL(/\/checkout\/attempts\/[0-9a-f-]{36}$/);
    const attemptUrl = page.url();
    const attemptId = attemptUrl.split("/").at(-1) ?? "";
    expect(attemptId).toMatch(/^[0-9a-f-]{36}$/i);

    // Approval alone must not create an Order.
    await expect(
      page.getByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeFocused();
    expect(tracker.paymentPosts()).toBe(1);
    expect(tracker.orderPosts()).toBe(0);
    expect((await fetchOrderByAttempt(request, attemptId)).status()).toBe(404);

    const attemptResponse = await fetchPaymentAttempt(request, attemptId);
    expect(attemptResponse.status()).toBe(200);
    const capturedAttempt = (await attemptResponse.json()) as PaymentAttemptDto;
    expect(capturedAttempt.status).toBe("approved");
    expect(capturedAttempt.total).toBe(37.5);
    expect(capturedAttempt.items).toHaveLength(1);
    expect(capturedAttempt.items[0]).toMatchObject({
      productId: product.id,
      quantity: 3,
      lineSubtotal: 37.5
    });
    await expect(page.getByText(`${product.name} × 3`)).toBeVisible();
    await expect(page.locator("#payment-result dd")).toHaveText("37.50");

    // Reload recovers the approved attempt through reads only.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeVisible();
    await expect(page.getByText(`${product.name} × 3`)).toBeVisible();
    await expect(page.locator("#payment-result dd")).toHaveText("37.50");
    expect(tracker.paymentPosts()).toBe(1);
    expect(tracker.orderPosts()).toBe(0);
    expect((await fetchOrderByAttempt(request, attemptId)).status()).toBe(404);

    // The recovered Payment record must equal the captured original in full:
    // attempt ID, status, Cart revision, total, and every item field.
    const recoveredAttempt = (await (await fetchPaymentAttempt(request, attemptId)).json()) as PaymentAttemptDto;
    expect(recoveredAttempt).toEqual(capturedAttempt);

    // Direct entry with empty browser storage recovers the same attempt.
    const coldAttemptContext = await browser.newContext();
    try {
      const coldAttemptPage = await coldAttemptContext.newPage();
      const coldTracker = trackTransactionalRequests(coldAttemptPage);
      await coldAttemptPage.goto(attemptUrl);
      await expect(
        coldAttemptPage.getByRole("heading", { name: "Simulated payment approved", level: 1 })
      ).toBeVisible();
      await expect(coldAttemptPage.getByText(`${product.name} × 3`)).toBeVisible();
      await expect(coldAttemptPage.getByText("12.50 each")).toBeVisible();
      await expect(coldAttemptPage.locator("#payment-result dd")).toHaveText("37.50");
      const coldAttemptRecord = (await (await fetchPaymentAttempt(request, attemptId)).json()) as PaymentAttemptDto;
      expect(coldAttemptRecord).toEqual(capturedAttempt);
      expect(coldTracker.paymentPosts() + coldTracker.orderPosts()).toBe(0);
    } finally {
      await coldAttemptContext.close();
    }

    // A live Cart change must not alter the captured snapshot.
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
    const checkoutQuantity = page.getByRole("spinbutton", { name: `Quantity for ${product.name}`, exact: true });
    await checkoutQuantity.fill("5");
    await checkoutQuantity.press("Enter");
    await expect(page.getByText("Cart updated.")).toBeVisible();
    await expect(page.locator("#checkout dd")).toHaveText("62.50");

    await page.goto(attemptUrl);
    await expect(
      page.getByRole("heading", { name: "Simulated payment approved", level: 1 })
    ).toBeVisible();
    await expect(page.getByText(`${product.name} × 3`)).toBeVisible();
    await expect(page.locator("#payment-result dd")).toHaveText("37.50");
    const unchangedAttempt = (await (await fetchPaymentAttempt(request, attemptId)).json()) as PaymentAttemptDto;
    expect(unchangedAttempt).toEqual(capturedAttempt);

    // Explicit Order creation through keyboard activation.
    const createOrder = page.getByRole("button", { name: "Create Order" });
    await expect(createOrder).toBeEnabled();
    await createOrder.press("Enter");
    await expect(page.getByRole("heading", { name: "Order created", level: 1 })).toBeFocused();
    expect(tracker.orderPosts()).toBe(1);
    expect(tracker.paymentPosts()).toBe(1);

    const orderId = (await page.getByText(/^Order ID:/).innerText())
      .replace("Order ID:", "")
      .trim();
    expect(orderId).toMatch(/^[0-9a-f-]{36}$/i);

    const orderByAttempt = await fetchOrderByAttempt(request, attemptId);
    expect(orderByAttempt.status()).toBe(200);
    const capturedOrder = (await orderByAttempt.json()) as OrderDto;
    expect(capturedOrder.orderId).toBe(orderId);
    expect(capturedOrder.paymentAttemptId).toBe(attemptId);
    expect(capturedOrder.cartRevision).toBe(capturedAttempt.cartRevision);
    expect(capturedOrder.total).toBe(37.5);
    expect(capturedOrder.items[0]).toMatchObject({ productId: product.id, quantity: 3, lineSubtotal: 37.5 });
    await expect(page.getByText("Order total: 37.50")).toBeVisible();

    const orderById = await fetchOrderById(request, orderId);
    expect(orderById.status()).toBe(200);
    expect((await orderById.json()) as OrderDto).toEqual(capturedOrder);

    // Order creation never clears the live Cart.
    await page.getByRole("button", { name: "Back to Checkout" }).click();
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
    await expect(page.locator("#checkout dd")).toHaveText("62.50");
    await expect(page.getByRole("spinbutton", { name: `Quantity for ${product.name}`, exact: true })).toHaveValue("5");

    // After Order creation, change the live Cart again through the UI: the Cart
    // must move while the frozen Order stays untouched.
    const postOrderQuantity = page.getByRole("spinbutton", { name: `Quantity for ${product.name}`, exact: true });
    await postOrderQuantity.fill("7");
    await postOrderQuantity.press("Enter");
    await expect(page.getByText("Cart updated.")).toBeVisible();
    await expect(page.locator("#checkout dd")).toHaveText("87.50");
    await expect(postOrderQuantity).toHaveValue("7");
    const changedCart = await getCart(request);
    expect(changedCart.total).toBe(87.5);
    expect(changedCart.items[0]).toMatchObject({ productId: product.id, quantity: 7, lineSubtotal: 87.5 });

    // The frozen Order survives the post-order Cart change, reload, and entry,
    // and every recovered record must equal the captured original in full:
    // IDs, Cart revision, total, and every item field.
    await page.goto(attemptUrl);
    await expect(page.getByRole("heading", { name: "Order created", level: 1 })).toBeVisible();
    await expect(page.getByText(orderId)).toBeVisible();
    await expect(page.getByText(`${product.name} × 3 · 12.50 each`)).toBeVisible();
    await expect(page.getByText("Order total: 37.50")).toBeVisible();
    expect((await (await fetchOrderByAttempt(request, attemptId)).json()) as OrderDto).toEqual(capturedOrder);
    expect((await (await fetchOrderById(request, orderId)).json()) as OrderDto).toEqual(capturedOrder);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Order created", level: 1 })).toBeVisible();
    await expect(page.getByText(orderId)).toBeVisible();
    await expect(page.getByText("Order total: 37.50")).toBeVisible();
    expect((await (await fetchOrderByAttempt(request, attemptId)).json()) as OrderDto).toEqual(capturedOrder);

    const coldOrderContext = await browser.newContext();
    try {
      const coldOrderPage = await coldOrderContext.newPage();
      const coldOrderTracker = trackTransactionalRequests(coldOrderPage);
      await coldOrderPage.goto(attemptUrl);
      await expect(coldOrderPage.getByRole("heading", { name: "Order created", level: 1 })).toBeVisible();
      await expect(coldOrderPage.getByText(orderId)).toBeVisible();
      await expect(coldOrderPage.getByText(`${product.name} × 3 · 12.50 each`)).toBeVisible();
      await expect(coldOrderPage.getByText("Order total: 37.50")).toBeVisible();
      expect((await (await fetchOrderByAttempt(request, attemptId)).json()) as OrderDto).toEqual(capturedOrder);
      expect(coldOrderTracker.paymentPosts() + coldOrderTracker.orderPosts()).toBe(0);
    } finally {
      await coldOrderContext.close();
    }

    // Back/Forward history traversal stays read-only and keeps the frozen data.
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeVisible();
    await expect(page.locator("#checkout dd")).toHaveText("87.50");
    await page.goForward();
    await expect(page.getByRole("heading", { name: "Order created", level: 1 })).toBeVisible();
    await expect(page.getByText("Order total: 37.50")).toBeVisible();
    expect((await (await fetchOrderByAttempt(request, attemptId)).json()) as OrderDto).toEqual(capturedOrder);

    expect(tracker.paymentPosts(), "exactly one browser payment POST across the journey").toBe(1);
    expect(tracker.orderPosts(), "exactly one browser Order POST across the journey").toBe(1);
  });

  test("keeps a declined simulated payment ineligible for an Order across recovery", async ({
    page,
    browser,
    request
  }) => {
    await clearCart(request);
    const product = await createProduct(request, `E2E Decline ${Date.now()}`, 8.25);
    const tracker = trackTransactionalRequests(page);

    await page.goto("/");
    await page.getByRole("button", { name: `Add ${product.name} to Cart` }).click();
    await expect(page.getByText(`${product.name} added to your Cart.`)).toBeVisible();

    await page.getByRole("button", { name: /^Cart\b/ }).click();
    await page.getByRole("dialog", { name: "Your Cart" }).getByRole("button", { name: "Checkout" }).click();
    await expect(page.getByRole("heading", { name: "Checkout", level: 1 })).toBeFocused();

    await page.getByLabel("Demo outcome").selectOption("decline");
    await page.getByRole("button", { name: "Simulate payment" }).click();
    await expect(page).toHaveURL(/\/checkout\/attempts\/[0-9a-f-]{36}$/);
    const attemptUrl = page.url();
    const attemptId = attemptUrl.split("/").at(-1) ?? "";

    await expect(
      page.getByRole("heading", { name: "Simulated payment declined", level: 1 })
    ).toBeFocused();
    await expect(page.getByText("No payment was made for this attempt.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again with the current Cart" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Order" })).toHaveCount(0);

    const attemptResponse = await fetchPaymentAttempt(request, attemptId);
    expect(attemptResponse.status()).toBe(200);
    const capturedDeclinedAttempt = (await attemptResponse.json()) as PaymentAttemptDto;
    expect(capturedDeclinedAttempt.status).toBe("declined");
    expect(capturedDeclinedAttempt.total).toBe(8.25);

    expect((await fetchOrderByAttempt(request, attemptId)).status()).toBe(404);
    expect(tracker.paymentPosts()).toBe(1);
    expect(tracker.orderPosts()).toBe(0);

    // Reload recovers the declined attempt without any transactional request,
    // and the recovered record equals the captured original in full.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Simulated payment declined", level: 1 })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Order" })).toHaveCount(0);
    const recoveredDeclined = (await (await fetchPaymentAttempt(request, attemptId)).json()) as PaymentAttemptDto;
    expect(recoveredDeclined).toEqual(capturedDeclinedAttempt);
    expect(tracker.paymentPosts()).toBe(1);
    expect(tracker.orderPosts()).toBe(0);

    // Direct entry with empty browser storage behaves identically.
    const coldContext = await browser.newContext();
    try {
      const coldPage = await coldContext.newPage();
      const coldTracker = trackTransactionalRequests(coldPage);
      await coldPage.goto(attemptUrl);
      await expect(
        coldPage.getByRole("heading", { name: "Simulated payment declined", level: 1 })
      ).toBeVisible();
      await expect(coldPage.getByText("8.25 each")).toBeVisible();
      await expect(coldPage.locator("#payment-result dd")).toHaveText("8.25");
      await expect(coldPage.getByRole("button", { name: "Create Order" })).toHaveCount(0);
      expect((await (await fetchPaymentAttempt(request, attemptId)).json()) as PaymentAttemptDto).toEqual(capturedDeclinedAttempt);
      expect(coldTracker.paymentPosts() + coldTracker.orderPosts()).toBe(0);
    } finally {
      await coldContext.close();
    }
  });
});
