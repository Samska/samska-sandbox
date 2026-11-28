import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { xsrfHeaders } from "./session";

export interface ProductFixture {
  id: string;
  name: string;
  price: number;
}

export interface CartItemDto {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
}

export interface CartDto {
  items: CartItemDto[];
  total: number;
  revision: number;
}

export interface OrderDto {
  orderId: string;
  orderNumber: string;
  cartRevision: number;
  items: CartItemDto[];
  total: number;
}

export interface TransactionalRequestCounts {
  orderPosts: () => number;
}

// Synthetic fixtures are created through the existing Catalog API. The request
// context uses the configured baseURL, so fixture traffic flows through the
// same Vite proxy path the application uses.
export async function createProduct(
  request: APIRequestContext,
  name: string,
  price: number
): Promise<ProductFixture> {
  const response = await request.post("/api/products", {
    data: { name, description: `Synthetic E2E fixture for ${name}`, price },
    headers: await xsrfHeaders(request)
  });

  expect(response.status(), `create product ${name}`).toBe(201);

  const body = (await response.json()) as { id: string; name: string; price: number };
  return { id: body.id, name: body.name, price: body.price };
}

export async function getCart(request: APIRequestContext): Promise<CartDto> {
  const response = await request.get("/api/cart");
  expect(response.status(), "read cart").toBe(200);
  return (await response.json()) as CartDto;
}

// The signed-in account keeps one Cart across tests, so they start from an empty
// Cart using the existing Cart API. No application reset endpoint is added.
export async function clearCart(request: APIRequestContext): Promise<CartDto> {
  const initial = await getCart(request);

  for (const item of initial.items) {
    const response = await request.delete(`/api/cart/items/${encodeURIComponent(item.productId)}`, {
      headers: await xsrfHeaders(request)
    });
    expect(response.status(), `remove ${item.productId} from cart`).toBe(200);
  }

  const cart = await getCart(request);
  expect(cart.items, "cart is empty before the test starts").toHaveLength(0);
  return cart;
}

export function fetchOrderById(request: APIRequestContext, orderId: string) {
  return request.get(`/api/orders/${encodeURIComponent(orderId)}`);
}

// Observes only browser-dispatched transactional requests. Fixture traffic uses
// the separate request context and is deliberately not counted here.
export function trackTransactionalRequests(page: Page): TransactionalRequestCounts {
  const orderPosts: string[] = [];

  page.on("request", (request) => {
    if (request.method() !== "POST") {
      return;
    }

    const path = new URL(request.url()).pathname;

    if (path === "/api/orders") {
      orderPosts.push(request.url());
    }
  });

  return {
    orderPosts: () => orderPosts.length
  };
}

// Places an Order for the signed-in account through the existing APIs, so tests about Order history do not repeat the whole browser journey.
export async function createOrderViaApi(
  request: APIRequestContext,
  productId: string,
  quantity: number
): Promise<OrderDto> {
  const headers = await xsrfHeaders(request);
  const added = await request.post("/api/cart/items", { data: { productId, quantity }, headers });
  expect(added.status(), "add to cart").toBe(200);
  const cart = (await added.json()) as CartDto;

  const order = await request.post("/api/orders", {
    data: { requestId: crypto.randomUUID(), cartRevision: cart.revision },
    headers
  });
  expect(order.status(), "place order").toBe(201);
  return (await order.json()) as OrderDto;
}
