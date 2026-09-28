import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminProducts from "./AdminProducts";
import type { ProductResponse } from "../catalog/catalogApi";

const tote: ProductResponse = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Tote",
  description: "A sturdy everyday tote.",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

const pourOver: ProductResponse = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Pour-Over Set",
  description: "A stoneware pour-over set.",
  price: 68.5,
  mediaKey: "stoneware-pour-over-set",
  uploadedMediaId: null
};

afterEach(() => {
  vi.unstubAllGlobals();
});

type Handlers = {
  list?: () => Promise<Response>;
  remove?: () => Promise<Response>;
};

function stubFetch(handlers: Handlers = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);
    const method = options?.method ?? "GET";

    if (path === "/api/products" && method === "GET") {
      return Promise.resolve(handlers.list ? handlers.list() : response(200, [tote]));
    }

    if (path.startsWith("/api/products/") && method === "DELETE") {
      return Promise.resolve(handlers.remove ? handlers.remove() : response(204));
    }

    return Promise.resolve(response(200, []));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}

describe("AdminProducts", () => {
  it("lists Products as a compact management list with clear actions", async () => {
    stubFetch({ list: () => Promise.resolve(response(200, [tote, pourOver])) });
    render(<AdminProducts />);

    expect(await screen.findByText(tote.name)).toBeInTheDocument();
    expect(screen.getByText("2 products")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Product" })).toHaveAttribute(
      "href",
      "/admin/products/new"
    );

    const toteRow = screen.getByText(tote.name).closest("li") as HTMLElement;
    expect(within(toteRow).getByText("12.50")).toBeInTheDocument();
    expect(within(toteRow).getByText("No image")).toBeInTheDocument();
    expect(within(toteRow).getByRole("link", { name: `Edit ${tote.name}` })).toHaveAttribute(
      "href",
      `/admin/products/${tote.id}/edit`
    );
    expect(within(toteRow).getByRole("button", { name: `Delete ${tote.name}` })).toBeInTheDocument();

    const pourOverRow = screen.getByText(pourOver.name).closest("li") as HTMLElement;
    expect(within(pourOverRow).getByText("Curated image")).toBeInTheDocument();
    expect(within(pourOverRow).queryByText(/mediaKey|uploadedMediaId/)).not.toBeInTheDocument();

    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();
  });

  it("filters Products by name case-insensitively and clears the search", async () => {
    stubFetch({ list: () => Promise.resolve(response(200, [tote, pourOver])) });
    render(<AdminProducts />);

    await screen.findByText(tote.name);
    fireEvent.change(screen.getByLabelText("Search Products by name"), {
      target: { value: "POUR" }
    });

    expect(screen.getByText(pourOver.name)).toBeInTheDocument();
    expect(screen.queryByText(tote.name)).not.toBeInTheDocument();
    expect(screen.getByText("1 of 2 products match")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(screen.getByText(tote.name)).toBeInTheDocument();
    expect(screen.getByText(pourOver.name)).toBeInTheDocument();
    expect(screen.getByText("2 products")).toBeInTheDocument();
  });

  it("distinguishes an empty Catalog from no search matches", async () => {
    stubFetch({ list: () => Promise.resolve(response(200, [])) });
    render(<AdminProducts />);

    expect(await screen.findByText("No Products exist yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Product" })).toBeInTheDocument();
    expect(screen.queryByText(/no products match/i)).not.toBeInTheDocument();
  });

  it("shows a no-match state without presenting an empty Catalog", async () => {
    stubFetch({ list: () => Promise.resolve(response(200, [tote])) });
    render(<AdminProducts />);

    await screen.findByText(tote.name);
    fireEvent.change(screen.getByLabelText("Search Products by name"), {
      target: { value: "zzz" }
    });

    expect(screen.getByText(/no products match/i)).toBeInTheDocument();
    expect(screen.queryByText("No Products exist yet.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: `Edit ${tote.name}` })).not.toBeInTheDocument();
  });

  it("shows a load failure with retry", async () => {
    let shouldFail = true;
    stubFetch({
      list: () => {
        if (shouldFail) {
          shouldFail = false;
          return Promise.resolve(response(500));
        }

        return Promise.resolve(response(200, [tote]));
      }
    });
    render(<AdminProducts />);

    expect(await screen.findByText("The Product service failed. Try again.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry Products" }));

    expect(await screen.findByText(tote.name)).toBeInTheDocument();
  });

  it("requires explicit confirmation and leaves the Product intact when cancelled", async () => {
    const fetchMock = stubFetch({ list: () => Promise.resolve(response(200, [tote])) });
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Delete ${tote.name}` }));

    expect(screen.getByRole("heading", { name: "Delete this Product?" })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("heading", { name: "Delete this Product?" })).not.toBeInTheDocument();
    expect(screen.getByText(tote.name)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: `Delete ${tote.name}` })).toHaveFocus()
    );
  });

  it("deletes the Product after confirmation and moves focus to the adjacent row", async () => {
    let listed: ProductResponse[] = [tote, pourOver];
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);
      const method = options?.method ?? "GET";

      if (path === "/api/products" && method === "GET") {
        return Promise.resolve(response(200, listed));
      }

      if (path === `/api/products/${tote.id}` && method === "DELETE") {
        listed = [pourOver];
        return Promise.resolve(response(204));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Delete ${tote.name}` }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Product" }));

    expect(await screen.findByText("Canvas Tote was deleted.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${tote.id}`, { method: "DELETE" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: `Delete ${pourOver.name}` })).toHaveFocus()
    );
  });

  it("explains a Cart conflict and keeps the Product in place", async () => {
    stubFetch({
      list: () => Promise.resolve(response(200, [tote])),
      remove: () => Promise.resolve(response(409))
    });
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Delete ${tote.name}` }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Product" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("This Product is in your Cart.");
    expect(within(alert).getByRole("link", { name: "Go to Market" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { name: "Delete this Product?" })).toBeInTheDocument();
    expect(screen.getByText(tote.name)).toBeInTheDocument();
  });

  it("reports a missing Product on delete", async () => {
    stubFetch({
      list: () => Promise.resolve(response(200, [tote])),
      remove: () => Promise.resolve(response(404))
    });
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Delete ${tote.name}` }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Product" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This Product no longer exists. Reload the Product list."
    );
  });

  it("keeps the delete success message when the list refresh fails and retries the list", async () => {
    let listCalls = 0;
    let listed: ProductResponse[] = [tote];
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);
      const method = options?.method ?? "GET";

      if (path === "/api/products" && method === "GET") {
        listCalls += 1;

        if (listCalls === 2) {
          return Promise.resolve(response(500));
        }

        return Promise.resolve(response(200, listed));
      }

      if (path === `/api/products/${tote.id}` && method === "DELETE") {
        listed = [];
        return Promise.resolve(response(204));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Delete ${tote.name}` }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Product" }));

    expect(await screen.findByText("Canvas Tote was deleted.")).toBeInTheDocument();
    expect(await screen.findByText(/could not be refreshed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry Products" }));

    expect(await screen.findByText("No Products exist yet.")).toBeInTheDocument();
  });
});
