import { expect, test, type Page } from "@playwright/test";
import { clearCart, createProduct } from "./fixtures";

// Bench identity (SS-064): visual-contract checks that need a real browser.
// They assert computed styles, layout and accessibility basics rather than
// pixel baselines, so they stay stable across machines and font loading.

const surfaces = [
  { name: "Market", path: "/" },
  { name: "Admin list", path: "/admin/products" },
  { name: "Admin create", path: "/admin/products/new" },
  { name: "Not found", path: "/does-not-exist" }
];

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 }
] as const;

const schemes = ["light", "dark"] as const;

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    // Web fonts come from Google Fonts; a blocked network must not fail the suite.
    if (
      message.type() === "error" &&
      !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(message.text())
    ) {
      errors.push(message.text());
    }
  });
  return errors;
}

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

test.describe("Bench identity in a real browser", () => {
  test.beforeEach(async ({ request }) => {
    await clearCart(request);
  });

  for (const scheme of schemes) {
    for (const viewport of viewports) {
      test(`every surface fits without overflow or errors (${viewport.name}, ${scheme})`, async ({
        page,
        request
      }) => {
        await createProduct(request, `Identity ${viewport.name} ${scheme} ${Date.now()}`, 19.5);
        const errors = collectConsoleErrors(page);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.emulateMedia({ colorScheme: scheme });

        for (const surface of surfaces) {
          await page.goto(surface.path);
          await expect(page.getByRole("main")).toBeVisible();
          expect(await hasHorizontalOverflow(page), `${surface.name} overflows`).toBe(false);
        }

        expect(errors).toEqual([]);
      });
    }
  }

  test("applies the Bench palette and type in light and dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();

    const light = await page.evaluate(() => {
      const heading = getComputedStyle(document.querySelector("h1") as Element);
      return {
        background: getComputedStyle(document.body).backgroundColor,
        headingFont: heading.fontFamily,
        headingTransform: heading.textTransform,
        headingWeight: heading.fontWeight
      };
    });
    expect(light.background).toBe("rgb(228, 231, 228)");
    expect(light.headingFont).toContain("Archivo");
    expect(light.headingTransform).toBe("uppercase");
    expect(Number(light.headingWeight)).toBeGreaterThanOrEqual(800);

    await page.emulateMedia({ colorScheme: "dark" });
    const dark = await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      colorScheme: getComputedStyle(document.documentElement).colorScheme
    }));
    expect(dark.background).toBe("rgb(14, 17, 20)");
    expect(dark.colorScheme).toBe("dark");
  });

  test("renders object cards with catalog numbers, price tags and mono buttons", async ({
    page,
    request
  }) => {
    const product = await createProduct(request, `Identity Card ${Date.now()}`, 42);
    await page.goto("/");
    const card = page.getByRole("listitem").filter({ hasText: product.name });

    await expect(card).toBeVisible();
    await expect(card).toContainText(/No\. \d{4}/);
    await expect(card.getByText("$42.00")).toBeVisible();

    const button = card.getByRole("button", { name: `Add ${product.name} to Cart` });
    const style = await button.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        font: computed.fontFamily,
        transform: computed.textTransform,
        background: computed.backgroundColor,
        shadow: computed.boxShadow
      };
    });
    expect(style.font).toContain("IBM Plex Mono");
    expect(style.transform).toBe("uppercase");
    expect(style.background).toBe("rgb(255, 74, 28)");
    expect(style.shadow).not.toBe("none");
  });

  test("shows a visible focus ring on keyboard focus in both schemes", async ({ page, request }) => {
    const product = await createProduct(request, `Identity Focus ${Date.now()}`, 8);

    for (const [scheme, expected] of [
      ["light", "rgb(10, 88, 255)"],
      ["dark", "rgb(122, 166, 255)"]
    ] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const add = page.getByRole("button", { name: `Add ${product.name} to Cart` });
      // The Cart loads after the session is known; Add stays disabled, and unfocusable, until then.
      await expect(add).toBeEnabled();
      await add.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(add).toBeFocused();

      const outline = await add.evaluate((node) => {
        const computed = getComputedStyle(node);
        return {
          style: computed.outlineStyle,
          color: computed.outlineColor,
          width: computed.outlineWidth
        };
      });
      expect(outline.style).toBe("solid");
      expect(outline.color).toBe(expected);
      expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(3);
    }
  });

  test("keeps the Cart drawer inside the phone viewport and closable with Escape", async ({
    page,
    request
  }) => {
    const product = await createProduct(request, `Identity Drawer ${Date.now()}`, 15);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: `Add ${product.name} to Cart` }).click();
    await expect(page.getByText(`${product.name} added to your Cart.`)).toBeVisible();

    await page.getByRole("button", { name: /^Cart\b/ }).click();
    const dialog = page.getByRole("dialog", { name: "Your Cart" });
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844 + 1);
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("exposes names for every control and one level-one heading per surface", async ({
    page,
    request
  }) => {
    await createProduct(request, `Identity A11y ${Date.now()}`, 5);

    for (const surface of surfaces) {
      await page.goto(surface.path);
      await expect(page.getByRole("main")).toBeVisible();

      const problems = await page.evaluate(() => {
        const found: string[] = [];
        const nameOf = (element: Element) =>
          (element.getAttribute("aria-label") ?? "").trim() || (element.textContent ?? "").trim();
        document.querySelectorAll("button, a[href]").forEach((element) => {
          if (nameOf(element) === "") {
            found.push(`unnamed ${element.tagName.toLowerCase()}`);
          }
        });
        document
          .querySelectorAll("input:not([type=hidden]):not([type=file]), select, textarea")
          .forEach((element) => {
            const control = element as HTMLInputElement;
            if ((control.labels?.length ?? 0) === 0 && !control.getAttribute("aria-label")) {
              found.push(`unlabelled ${control.tagName.toLowerCase()}`);
            }
          });
        return found;
      });
      expect(problems, surface.name).toEqual([]);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  });
});
