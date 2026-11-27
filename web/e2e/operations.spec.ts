import { expect, test } from "@playwright/test";

test.describe("Operations in a real browser", () => {
  test("an administrator reads real store figures and a visitor is asked to sign in", async ({ page, browser }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Operations" }).click();

    await expect(page).toHaveURL(/\/admin\/operations$/);
    await expect(page.getByRole("heading", { name: "Store health", level: 1 })).toBeFocused();
    await expect(page.getByText("Orders, last hour")).toBeVisible();
    await expect(page.getByRole("table", { name: "Service health" })).toContainText("Database");
    await expect(page.getByRole("table", { name: "Service health" })).toContainText("Healthy");

    const visitor = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const visitorPage = await visitor.newPage();
    await visitorPage.goto("/admin/operations");
    await expect(visitorPage.getByRole("heading", { name: /sign in/i }).first()).toBeVisible();
    await visitor.close();
  });
});
