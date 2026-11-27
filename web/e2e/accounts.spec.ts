import { expect, test } from "@playwright/test";
import { createProduct } from "./fixtures";

// Accounts (SS-069): these tests start with no session, unlike the rest of the suite.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Accounts in a real browser", () => {
  test("a visitor browses, is asked to sign in, registers, shops and signs out", async ({ page, browser }) => {
    // Fixture data is created by the administrator in a separate context.
    const admin = await browser.newContext({ storageState: ".auth/admin.json" });
    const product = await createProduct(admin.request, `Accounts ${Date.now()}`, 9.5);
    await admin.close();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
    const navigation = page.getByRole("navigation", { name: "Primary" });
    await expect(navigation.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Admin" })).toHaveCount(0);

    // Adding to the Cart needs an account.
    await page.getByRole("button", { name: `Add ${product.name} to Cart` }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();

    // Wrong credentials do not reveal which part was wrong.
    await page.getByLabel("Email").fill("nobody@example.test");
    await page.getByLabel("Password").fill("wrong-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toHaveText("The email or password is not right.");

    // Register.
    await page.getByRole("button", { name: "Create an account" }).click();
    const email = `person-${Date.now()}@example.test`;
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Name").fill("Synthetic Person");
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(navigation.getByText("Synthetic Person")).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Admin" })).toHaveCount(0);

    // Shop: the Cart belongs to this account.
    await page.getByRole("button", { name: `Add ${product.name} to Cart` }).click();
    await expect(page.getByText(`${product.name} added to your Cart.`)).toBeVisible();

    // A customer cannot use Admin.
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: "Not allowed" })).toBeVisible();
    const forbidden = await page.request.post("/api/products", {
      data: { name: "x", description: "y", price: 1 },
      headers: {
        "X-XSRF-TOKEN": decodeURIComponent(
          (await page.context().cookies()).find((cookie) => cookie.name === "XSRF-TOKEN")?.value ?? ""
        )
      }
    });
    expect(forbidden.status()).toBe(403);

    // Sign out ends the session, and signing in again finds the same Cart.
    await page.goto("/");
    await navigation.getByRole("button", { name: "Sign out" }).click();
    await expect(navigation.getByRole("link", { name: "Sign in" })).toBeVisible();
    expect((await page.request.get("/api/cart")).status()).toBe(401);

    await page.goto("/account");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: /^Cart\b/ }).click();
    await expect(page.getByRole("dialog", { name: "Your Cart" })).toContainText(product.name);
  });

  test("checkout and Admin ask a visitor to sign in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText("Sign in to check out.")).toBeVisible();
    await page.goto("/admin/products");
    await expect(page.getByText(/administrator account/)).toBeVisible();
  });
});
