import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * R1 candidate browser evidence.
 *
 * Runs against the rebuild-only stack owned by scripts/rebuild.mjs through
 * playwright.rebuild.config.ts (1 worker, 0 retries). The candidate process
 * starts empty exactly once per run: the first test proves that fresh state,
 * and later tests accumulate Products without any reset endpoint, DELETE or
 * store swap.
 *
 * Scope is R1 only: create, list and detail Product. Uploads, Cart, Checkout,
 * Payment, Order and recovery are out of R1 and are not exercised here.
 */

interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  mediaKey: string | null;
  uploadedMediaId: string | null;
}

const PRODUCT_KEYS = ["description", "id", "mediaKey", "name", "price", "uploadedMediaId"];

/** Counts only browser-dispatched POSTs to the Product collection. */
function trackProductPosts(page: Page): () => number {
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/products") {
      posts += 1;
    }
  });
  return () => posts;
}

async function readCollection(request: APIRequestContext): Promise<ProductDto[]> {
  const response = await request.get("/api/products");
  expect(response.status(), "GET /api/products through the proxy").toBe(200);
  return (await response.json()) as ProductDto[];
}

async function createThroughUi(
  page: Page,
  name: string,
  description: string,
  price: string
): Promise<void> {
  await expect(page.getByTestId("create-submit")).toBeEnabled();
  await page.getByTestId("field-product-name").fill(name);
  await page.getByTestId("field-product-description").fill(description);
  await page.getByTestId("field-product-price").fill(price);
  await page.getByTestId("create-submit").click();
  await expect(page.getByTestId("create-success")).toBeVisible();
}

test.describe.serial("R1 candidate Product slice", () => {
  test("starts empty with the exact candidate identity and no Cart capability", async ({ request }) => {
    const identity = await request.get("/api/rebuild/runtime");
    expect(identity.status()).toBe(200);
    expect(await identity.json()).toEqual({ runtime: "rebuild-r1" });

    expect(await readCollection(request)).toEqual([]);

    // R1 exposes no Cart: a legacy stack accidentally paired here would answer 200.
    const cart = await request.get("/api/cart");
    expect(cart.status()).toBe(404);
  });

  test("refuses an empty form locally without sending a POST", async ({ page }) => {
    const postCount = trackProductPosts(page);
    await page.goto("/");

    await expect(page.getByTestId("create-submit")).toBeEnabled();
    await expect(page.getByTestId("list-empty")).toBeVisible();
    await page.getByTestId("create-submit").click();

    // Each field explains its own rule instead of a generic message.
    await expect(page.getByText("Name is required.")).toBeVisible();
    await expect(page.getByText("Description is required.")).toBeVisible();
    await expect(page.getByText("Enter zero or greater.")).toBeVisible();
    await expect(page.getByTestId("field-product-name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("field-product-description")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("field-product-price")).toHaveAttribute("aria-invalid", "true");
    expect(postCount(), "client-side refusal must not reach the network").toBe(0);
  });

  test("creates a Product from the UI preserving raw spaces and opens its detail with focus return", async ({
    page,
    request
  }) => {
    const postCount = trackProductPosts(page);
    await page.goto("/");

    const rawName = "  Rebuild Tote  ";
    const rawDescription = "  Synthetic tote from the rebuild candidate  ";

    await createThroughUi(page, rawName, rawDescription, "12.50");
    expect(postCount(), "exactly one browser POST creates the Product").toBe(1);

    const collection = await readCollection(request);
    const created = collection.find((product) => product.name === rawName);

    if (!created) {
      throw new Error("the created Product was not returned by the collection");
    }

    expect(created.description, "raw description is preserved").toBe(rawDescription);
    expect(created.price).toBe(12.5);
    expect(created.mediaKey).toBeNull();
    expect(created.uploadedMediaId).toBeNull();
    expect(Object.keys(created).sort()).toEqual(PRODUCT_KEYS);

    // UI presents the Product; whitespace is only normalized for the query.
    await expect(page.getByTestId("product-list").getByText("Rebuild Tote", { exact: true })).toBeVisible();

    const viewButton = page.getByTestId(`view-${created.id}`);
    await viewButton.click();

    await expect(page.getByTestId("detail-heading")).toBeFocused();
    await expect(page.getByTestId("detail-heading")).toHaveText("Rebuild Tote");
    await expect(page.getByTestId("detail-description")).toHaveText("Synthetic tote from the rebuild candidate");
    // Reference SS-031 groups amounts without imposing a currency symbol.
    await expect(page.getByTestId("detail-price")).toHaveText("12.50");
    expect(postCount(), "opening detail only reads").toBe(1);

    await page.getByTestId("back-to-products").click();
    await expect(viewButton).toBeFocused();
    expect(postCount(), "returning to the list only reads").toBe(1);
  });

  test("accepts a zero price and keeps it after reload without another POST", async ({ page, request }) => {
    const postCount = trackProductPosts(page);
    await page.goto("/");

    const name = `Rebuild Zero ${Date.now()}`;
    await createThroughUi(page, name, "Synthetic zero-priced item", "0");
    expect(postCount()).toBe(1);

    const collection = await readCollection(request);
    const created = collection.find((product) => product.name === name);

    if (!created) {
      throw new Error("the zero-priced Product was not returned by the collection");
    }

    expect(created.price).toBe(0);
    await expect(page.getByTestId(`view-${created.id}`)).toBeVisible();

    await page.reload();
    await expect(page.getByTestId(`view-${created.id}`)).toBeVisible();
    expect(postCount(), "reload must not replay the create POST").toBe(1);
  });

  test("rejects invalid input without mutating the collection and answers unknown ids honestly", async ({
    request
  }) => {
    const before = await readCollection(request);

    const blankName = await request.post("/api/products", {
      data: { name: "   ", description: "Synthetic", price: 1 }
    });
    expect(blankName.status()).toBe(400);
    expect(await blankName.text(), "400 body is empty").toBe("");

    const negativePrice = await request.post("/api/products", {
      data: { name: "Rebuild Negative", description: "Synthetic", price: -0.01 }
    });
    expect(negativePrice.status()).toBe(400);
    expect(await negativePrice.text()).toBe("");

    const nullPrice = await request.post("/api/products", {
      data: { name: "Rebuild Null Price", description: "Synthetic", price: null }
    });
    expect(nullPrice.status()).toBe(400);

    const longMediaKey = await request.post("/api/products", {
      data: { name: "Rebuild Long Key", description: "Synthetic", price: 1, mediaKey: "a".repeat(41) }
    });
    expect(longMediaKey.status()).toBe(400);

    const after = await readCollection(request);
    expect(after.map((product) => product.id), "rejected creates do not mutate the collection").toEqual(
      before.map((product) => product.id)
    );

    const malformedId = await request.get("/api/products/not-a-uuid");
    expect(malformedId.status()).toBe(400);
    expect(await malformedId.text()).toBe("");

    const unknownId = await request.get("/api/products/00000000-0000-0000-0000-000000000000");
    expect(unknownId.status()).toBe(404);
    expect(await unknownId.text(), "404 body is empty").toBe("");

    const valid = await request.post("/api/products", {
      data: {
        name: "Rebuild API Shape",
        description: "Synthetic API shape",
        price: 12.3456,
        mediaKey: "a".repeat(40)
      }
    });
    expect(valid.status()).toBe(201);

    const validBody = (await valid.json()) as ProductDto;
    expect(valid.headers()["location"]).toBe(`/api/products/${validBody.id}`);
    expect(Object.keys(validBody).sort()).toEqual(PRODUCT_KEYS);
    expect(validBody.price, "high-scale price is not rounded").toBe(12.3456);
    expect(validBody.mediaKey).toBe("a".repeat(40));
    expect(validBody.uploadedMediaId).toBeNull();

    const detail = await request.get(`/api/products/${validBody.id}`);
    expect(detail.status()).toBe(200);
    expect(await detail.json()).toEqual(validBody);
  });
});
