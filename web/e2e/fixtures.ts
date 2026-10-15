import { expect, type APIRequestContext, type Page } from "@playwright/test";

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

export interface PaymentAttemptDto {
  attemptId: string;
  status: "approved" | "declined" | "failed";
  cartRevision: number;
  items: CartItemDto[];
  total: number;
}

export interface OrderDto {
  orderId: string;
  paymentAttemptId: string;
  cartRevision: number;
  items: CartItemDto[];
  total: number;
}

export interface TransactionalRequestCounts {
  paymentPosts: () => number;
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
    data: { name, description: `Synthetic E2E fixture for ${name}`, price }
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

// The backend keeps one shared process-local Cart, so tests start from an empty
// Cart using the existing Cart API. No application reset endpoint is added.
export async function clearCart(request: APIRequestContext): Promise<CartDto> {
  const initial = await getCart(request);

  for (const item of initial.items) {
    const response = await request.delete(`/api/cart/items/${encodeURIComponent(item.productId)}`);
    expect(response.status(), `remove ${item.productId} from cart`).toBe(200);
  }

  const cart = await getCart(request);
  expect(cart.items, "cart is empty before the test starts").toHaveLength(0);
  return cart;
}

export function fetchPaymentAttempt(request: APIRequestContext, attemptId: string) {
  return request.get(`/api/payment-attempts/${encodeURIComponent(attemptId)}`);
}

export function fetchOrderByAttempt(request: APIRequestContext, attemptId: string) {
  return request.get(`/api/orders/payment-attempts/${encodeURIComponent(attemptId)}`);
}

export function fetchOrderById(request: APIRequestContext, orderId: string) {
  return request.get(`/api/orders/${encodeURIComponent(orderId)}`);
}

// Observes only browser-dispatched transactional requests. Fixture traffic uses
// the separate request context and is deliberately not counted here.
export function trackTransactionalRequests(page: Page): TransactionalRequestCounts {
  const paymentPosts: string[] = [];
  const orderPosts: string[] = [];

  page.on("request", (request) => {
    if (request.method() !== "POST") {
      return;
    }

    const path = new URL(request.url()).pathname;

    if (path === "/api/payment-attempts") {
      paymentPosts.push(request.url());
    }

    if (path === "/api/orders") {
      orderPosts.push(request.url());
    }
  });

  return {
    paymentPosts: () => paymentPosts.length,
    orderPosts: () => orderPosts.length
  };
}
