import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";

const originalFetch = globalThis.fetch;

type FetchMock = ReturnType<typeof vi.fn>;

const sampleProduct = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Tote",
  description: "Synthetic canvas tote",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

function installFetchMock(handlers: Record<string, () => Response | Promise<Response>>) {
  const mock: FetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method ?? "GET").toUpperCase();
    const key = `${method} ${url}`;
    const handler = handlers[key] ?? handlers[`ANY ${url}`] ?? handlers[`${method} *`];
    if (!handler) {
      throw new Error(`Unexpected fetch: ${key}`);
    }
    return Promise.resolve(handler());
  });
  globalThis.fetch = mock as unknown as typeof fetch;
  return mock;
}

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders }
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function fillForm(values: { name: string; description: string; price: string }) {
  fireEvent.change(screen.getByTestId("field-product-name"), {
    target: { value: values.name }
  });
  fireEvent.change(screen.getByTestId("field-product-description"), {
    target: { value: values.description }
  });
  fireEvent.change(screen.getByTestId("field-product-price"), {
    target: { value: values.price }
  });
}

describe("App integration", () => {
  beforeEach(() => {
    let listCalls = 0;
    installFetchMock({
      "GET /api/rebuild/runtime": () => jsonResponse({ runtime: "rebuild-r1" }),
      "GET /api/products": () => {
        listCalls += 1;
        // First call (initial load) returns empty; subsequent calls include
        // the product that the just-completed POST created.
        if (listCalls === 1) {
          return jsonResponse([]);
        }
        return jsonResponse([sampleProduct]);
      },
      "POST /api/products": () =>
        jsonResponse(sampleProduct, 201, { Location: `/api/products/${sampleProduct.id}` }),
      [`GET /api/products/${sampleProduct.id}`]: () => jsonResponse(sampleProduct)
    });
  });

  it("shows the runtime banner when the candidate is unavailable and blocks mutations", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    render(<App />);
    expect(await screen.findByTestId("runtime-banner")).toBeInTheDocument();
    const submit = screen.getByTestId("create-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it("renders an empty list, creates a product, opens detail and returns focus", async () => {
    render(<App />);
    await screen.findByTestId("list-empty");
    fillForm({ name: "Canvas Tote", description: "Synthetic canvas tote", price: "12.5" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-success")).toBeInTheDocument();
    });
    expect(await screen.findByTestId("product-list")).toBeInTheDocument();

    const viewButton = await screen.findByTestId(`view-${sampleProduct.id}`);
    fireEvent.click(viewButton);

    const heading = await screen.findByTestId("detail-heading");
    await waitFor(() => {
      expect(document.activeElement).toBe(heading);
    });

    const back = screen.getByTestId("back-to-products");
    fireEvent.click(back);
    await waitFor(() => {
      expect(document.activeElement).toBe(viewButton);
    });
  });

  it("keeps form fields when the server rejects the product", async () => {
    globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        return Promise.resolve(jsonResponse([sampleProduct]));
      }
      if (method === "POST" && url.endsWith("/api/products")) {
        return Promise.resolve(new Response("", { status: 400 }));
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    }) as unknown as typeof fetch;

    render(<App />);
    const name = (await screen.findByTestId("field-product-name")) as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Reused" } });
    fireEvent.change(screen.getByTestId("field-product-description"), {
      target: { value: "Reused desc" }
    });
    fireEvent.change(screen.getByTestId("field-product-price"), {
      target: { value: "1" }
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-error")).toBeInTheDocument();
    });
    expect(name.value).toBe("Reused");
    expect((screen.getByTestId("field-product-description") as HTMLTextAreaElement).value).toBe("Reused desc");
  });

  it("blocks client-side submit for empty fields and surfaces inline errors", async () => {
    render(<App />);
    await screen.findByTestId("list-empty");

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("field-product-name")).toHaveAttribute("aria-invalid", "true");
    });
    expect(screen.getByTestId("field-product-description")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("field-product-price")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByTestId("create-error")).not.toBeInTheDocument();
  });

  it("dispatches exactly one POST when the user clicks submit twice in the same tick", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        return Promise.resolve(jsonResponse([]));
      }
      if (method === "POST" && url.endsWith("/api/products")) {
        return new Promise<Response>(() => {
          // never resolves; the test only cares that exactly one POST was issued.
        });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<App />);
    await screen.findByTestId("list-empty");
    fillForm({ name: "X", description: "Y", price: "1" });

    const submit = screen.getByTestId("create-submit") as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(submit);
      fireEvent.click(submit);
    });

    const postCalls = fetchMock.mock.calls.filter(([, init]) => {
      const method = (init?.method ?? "GET").toUpperCase();
      return method === "POST";
    });
    expect(postCalls).toHaveLength(1);
  });

  it("does not let a refresh read abort an in-flight create POST", async () => {
    let resolvePost!: (response: Response) => void;
    let listCallCount = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        listCallCount += 1;
        // Initial load resolves so the list shows empty; any subsequent list
        // call (refresh while POST pending, or post-create refetch) hangs so
        // we can observe what the POST does on its own.
        if (listCallCount === 1) {
          return Promise.resolve(jsonResponse([]));
        }
        return new Promise<Response>(() => {
          // never resolves while we assert the POST survives a refresh
        });
      }
      if (method === "POST" && url.endsWith("/api/products")) {
        return new Promise<Response>((resolve) => {
          resolvePost = resolve;
        });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<App />);
    await screen.findByTestId("list-empty");
    fillForm({ name: "X", description: "Y", price: "1" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    // While POST is pending, fire a refresh. It must not abort the POST.
    await act(async () => {
      fireEvent.click(screen.getByTestId("refresh-list"));
    });

    const postCalls = fetchMock.mock.calls.filter(([, init]) => {
      const method = (init?.method ?? "GET").toUpperCase();
      return method === "POST";
    });
    expect(postCalls).toHaveLength(1);

    await act(async () => {
      resolvePost(
        jsonResponse(sampleProduct, 201, { Location: `/api/products/${sampleProduct.id}` })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-success")).toBeInTheDocument();
    });
  });

  it("ignores a stale list response that arrives after a newer read", async () => {
    const resolvers: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        return new Promise<Response>((resolve) => {
          resolvers.push(resolve);
        });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<App />);
    // Wait for the initial list GET to be in flight.
    await waitFor(() => {
      expect(resolvers.length).toBeGreaterThanOrEqual(1);
    });

    // Fire a refresh, which supersedes the previous read.
    await act(async () => {
      fireEvent.click(screen.getByTestId("refresh-list"));
    });
    expect(resolvers.length).toBeGreaterThanOrEqual(2);

    // Resolve the stale (first) read with the empty array. The UI must not
    // pick it up because the new read already superseded it.
    const stale = resolvers.shift()!;
    await act(async () => {
      stale(jsonResponse([]));
    });

    // Resolve the fresh (second) read with the populated array.
    const fresh = resolvers.shift()!;
    await act(async () => {
      fresh(jsonResponse([sampleProduct]));
    });

    await waitFor(() => {
      expect(screen.getByTestId("product-list")).toBeInTheDocument();
    });
  });

  it("shows a mismatch banner when runtime reports a different value", async () => {
    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "production" }));
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as unknown as typeof fetch;

    render(<App />);
    const banner = await screen.findByTestId("runtime-banner");
    expect(banner.textContent).toMatch(/production/);
    expect(screen.getByTestId("create-submit")).toBeDisabled();
  });

  it("does not auto-replay a POST on uncertain network outcome", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        return Promise.resolve(jsonResponse([]));
      }
      if (method === "POST" && url.endsWith("/api/products")) {
        return Promise.reject(new TypeError("network down"));
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<App />);
    await screen.findByTestId("list-empty");
    fillForm({ name: "X", description: "Y", price: "1" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-error")).toBeInTheDocument();
    });

    const postCalls = fetchMock.mock.calls.filter(([, init]) => {
      const method = (init?.method ?? "GET").toUpperCase();
      return method === "POST";
    });
    expect(postCalls).toHaveLength(1);
  });

  it("shows the permanent partial notice while the candidate is ready", async () => {
    render(<App />);
    const notice = await screen.findByTestId("partial-notice");
    expect(notice.textContent).toMatch(/R1 candidate/i);
    expect(notice.textContent).toMatch(/partial/i);
    expect(notice.textContent).toMatch(/in-memory/i);
  });

  it("reports create uncertainty instead of a definitive failure for network errors", async () => {
    globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        return Promise.resolve(jsonResponse([]));
      }
      if (method === "POST" && url.endsWith("/api/products")) {
        return Promise.reject(new TypeError("network down"));
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    }) as unknown as typeof fetch;

    render(<App />);
    await screen.findByTestId("list-empty");
    fillForm({ name: "X", description: "Y", price: "1" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    const error = await screen.findByTestId("create-error");
    expect(error.textContent).toMatch(/not confirmed/i);
    expect(error.textContent).toMatch(/check Products before retrying/i);
    expect(error.textContent).not.toMatch(/Failed/i);
  });

  it("accepts a second creation after Create another and posts again", async () => {
    let postCount = 0;
    let listCallCount = 0;
    globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        listCallCount += 1;
        if (listCallCount === 1) return jsonResponse([]);
        return jsonResponse([sampleProduct]);
      }
      if (method === "POST" && url.endsWith("/api/products")) {
        postCount += 1;
        return Promise.resolve(
          jsonResponse(sampleProduct, 201, {
            Location: `/api/products/${sampleProduct.id}`
          })
        );
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    }) as unknown as typeof fetch;

    render(<App />);
    await screen.findByTestId("list-empty");
    fillForm({ name: "First", description: "first", price: "1" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("create-success")).toBeInTheDocument();
    });

    const createAnother = await screen.findByRole("button", { name: "Create another" });
    fireEvent.click(createAnother);

    // The slice must have been reset to idle, the success message cleared,
    // and the form fields empty so the next submission can be evaluated.
    expect(screen.queryByTestId("create-success")).not.toBeInTheDocument();
    expect(
      (screen.getByTestId("field-product-name") as HTMLInputElement).value
    ).toBe("");
    expect(
      (screen.getByTestId("field-product-description") as HTMLTextAreaElement).value
    ).toBe("");
    expect(
      (screen.getByTestId("field-product-price") as HTMLInputElement).value
    ).toBe("");

    fillForm({ name: "Second", description: "second", price: "2" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-success")).toBeInTheDocument();
    });
    expect(postCount).toBe(2);
  });

  it("accepts a retry after the server rejected the product", async () => {
    let postCount = 0;
    let listCallCount = 0;
    globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        listCallCount += 1;
        if (listCallCount === 1) return jsonResponse([]);
        return jsonResponse([sampleProduct]);
      }
      if (method === "POST" && url.endsWith("/api/products")) {
        postCount += 1;
        if (postCount === 1) {
          return Promise.resolve(new Response("", { status: 400 }));
        }
        return Promise.resolve(
          jsonResponse(sampleProduct, 201, {
            Location: `/api/products/${sampleProduct.id}`
          })
        );
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    }) as unknown as typeof fetch;

    render(<App />);
    await screen.findByTestId("list-empty");
    fillForm({ name: "First", description: "first", price: "1" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-error")).toBeInTheDocument();
    });
    // Form fields are preserved across the rejection.
    expect((screen.getByTestId("field-product-name") as HTMLInputElement).value).toBe("First");

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-success")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("create-error")).not.toBeInTheDocument();
    expect(postCount).toBe(2);
  });

  it("disables the form fields while a create POST is in flight", async () => {
    let resolvePost!: (response: Response) => void;
    globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url.endsWith("/api/rebuild/runtime")) {
        return Promise.resolve(jsonResponse({ runtime: "rebuild-r1" }));
      }
      if (method === "GET" && url.endsWith("/api/products")) {
        return Promise.resolve(jsonResponse([]));
      }
      if (method === "POST" && url.endsWith("/api/products")) {
        return new Promise<Response>((resolve) => {
          resolvePost = resolve;
        });
      }
      throw new Error(`Unexpected fetch: ${method} ${url}`);
    }) as unknown as typeof fetch;

    render(<App />);
    await screen.findByTestId("list-empty");
    fillForm({ name: "X", description: "Y", price: "1" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("create-submit"));
    });

    expect(screen.getByTestId("field-product-name")).toBeDisabled();
    expect(screen.getByTestId("field-product-description")).toBeDisabled();
    expect(screen.getByTestId("field-product-price")).toBeDisabled();

    await act(async () => {
      resolvePost(
        jsonResponse(sampleProduct, 201, { Location: `/api/products/${sampleProduct.id}` })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("create-success")).toBeInTheDocument();
    });
  });
});