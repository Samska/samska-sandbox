import { expect, test } from "@playwright/test";
import { clearCart, createProduct } from "./fixtures";
import { adminCredentials } from "./session";

// Accounts (SS-069): these tests start with no session, unlike the rest of the suite.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Accounts in a real browser", () => {
  test("a visitor browses, is asked to sign in, cannot sign up, signs in, shops and signs out", async ({ page, browser }) => {
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

    // There is no sign-up: nothing offers it and the endpoint does not exist.
    await expect(page.getByRole("button", { name: /create/i })).toHaveCount(0);
    const signUp = await page.request.post("/api/auth/register", {
      data: { email: "new@example.test", displayName: "New", password: "correct-horse-battery" }
    });
    expect([401, 403, 404]).toContain(signUp.status());

    // The only account is the administrator, who can also shop.
    const { email, password } = adminCredentials();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    await page.goto("/");

    // Shop: the Cart belongs to this account.
    await page.getByRole("button", { name: `Add ${product.name} to Cart` }).click();
    await expect(page.getByText(`${product.name} added to your Cart.`)).toBeVisible();

    // Sign out ends the session, and signing in again finds the same Cart.
    await page.goto("/");
    await navigation.getByRole("button", { name: "Sign out" }).click();
    await expect(navigation.getByRole("link", { name: "Sign in" })).toBeVisible();
    expect((await page.request.get("/api/cart")).status()).toBe(401);

    await page.goto("/account");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    await page.goto("/");
    await page.getByRole("button", { name: /^Cart\b/ }).click();
    await expect(page.getByRole("dialog", { name: "Your Cart" })).toContainText(product.name);

    // Leave the shared administrator Cart empty for the other tests.
    const cleanup = await browser.newContext({ storageState: ".auth/admin.json" });
    await clearCart(cleanup.request);
    await cleanup.close();
  });

  test("checkout and Admin ask a visitor to sign in", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText("Sign in to check out.")).toBeVisible();
    await page.goto("/admin/products");
    await expect(page.getByText(/administrator account/)).toBeVisible();
  });
});
