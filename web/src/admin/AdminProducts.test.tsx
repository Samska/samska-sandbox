import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminProducts from "./AdminProducts";
import type { ProductResponse } from "../catalog/catalogApi";

const tote: ProductResponse = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Tote",
  description: "A sturdy everyday tote.",
  price: 12.5,
  mediaKey: null
};

const pourOver: ProductResponse = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Pour-Over Set",
  description: "A stoneware pour-over set.",
  price: 68.5,
  mediaKey: "stoneware-pour-over-set"
};

afterEach(() => {
  vi.unstubAllGlobals();
});

type Handlers = {
  list?: () => Promise<Response>;
  create?: () => Promise<Response>;
  update?: () => Promise<Response>;
  remove?: () => Promise<Response>;
};

function stubFetch(handlers: Handlers = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);
    const method = options?.method ?? "GET";

    if (path === "/api/products" && method === "GET") {
      return Promise.resolve(handlers.list ? handlers.list() : response(200, [tote]));
    }

    if (path === "/api/products" && method === "POST") {
      return Promise.resolve(handlers.create ? handlers.create() : response(201, tote));
    }

    if (path.startsWith("/api/products/") && method === "PUT") {
      return Promise.resolve(handlers.update ? handlers.update() : response(200, tote));
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

function createForm() {
  return screen.getByRole("form", { name: "Create Product" });
}

describe("AdminProducts", () => {
  it("lists Products with identity, name, description, price, and media", async () => {
    const fetchMock = stubFetch({ list: () => Promise.resolve(response(200, [tote, pourOver])) });
    render(<AdminProducts />);

    expect(await screen.findByText(tote.name)).toBeInTheDocument();
    expect(screen.getByText(tote.description)).toBeInTheDocument();
    expect(screen.getByText(tote.id)).toBeInTheDocument();
    expect(screen.getByText("12.50")).toBeInTheDocument();
    expect(screen.getByText("2 products")).toBeInTheDocument();

    const toteRow = screen.getByText(tote.name).closest("li") as HTMLElement;
    const pourOverRow = screen.getByText(pourOver.name).closest("li") as HTMLElement;
    expect(within(toteRow).getByText("No media")).toBeInTheDocument();
    expect(within(pourOverRow).getByText(pourOver.mediaKey as string)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Edit ${tote.name}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Delete ${pourOver.name}` })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/products");
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
    expect(screen.queryByRole("button", { name: `Edit ${tote.name}` })).not.toBeInTheDocument();
  });

  it("creates a Product, refreshes the list, and recovers focus", async () => {
    const created: ProductResponse = { ...tote, mediaKey: "canvas-market-tote" };
    let listed: ProductResponse[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);
      const method = options?.method ?? "GET";

      if (path === "/api/products" && method === "GET") {
        return Promise.resolve(response(200, listed));
      }

      if (path === "/api/products" && method === "POST") {
        listed = [created];
        return Promise.resolve(response(201, created));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProducts />);

    await screen.findByText("No Products exist yet.");
    const form = createForm();
    fireEvent.change(within(form).getByLabelText("Name"), { target: { value: created.name } });
    fireEvent.change(within(form).getByLabelText("Description"), {
      target: { value: created.description }
    });
    fireEvent.change(within(form).getByLabelText("Price"), { target: { value: "12.50" } });
    fireEvent.change(within(form).getByLabelText("Media"), {
      target: { value: "canvas-market-tote" }
    });
    fireEvent.click(within(form).getByRole("button", { name: "Create Product" }));

    expect(await screen.findByText("Canvas Tote was created.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: created.name,
        description: created.description,
        price: 12.5,
        mediaKey: "canvas-market-tote"
      })
    });

    const editButton = await screen.findByRole("button", { name: `Edit ${created.name}` });
    await waitFor(() => expect(editButton).toHaveFocus());
    expect(within(createForm()).getByLabelText("Name")).toHaveValue("");
  });

  it("shows pending feedback while creating", async () => {
    let resolveCreate: (value: Response) => void = () => {};
    const pendingCreate = new Promise<Response>((resolve) => {
      resolveCreate = resolve;
    });
    stubFetch({
      list: () => Promise.resolve(response(200, [])),
      create: () => pendingCreate
    });
    render(<AdminProducts />);

    await screen.findByText("No Products exist yet.");
    const form = createForm();
    fireEvent.change(within(form).getByLabelText("Name"), { target: { value: tote.name } });
    fireEvent.change(within(form).getByLabelText("Description"), {
      target: { value: tote.description }
    });
    fireEvent.change(within(form).getByLabelText("Price"), { target: { value: "12.50" } });
    fireEvent.click(within(form).getByRole("button", { name: "Create Product" }));

    expect(within(form).getByRole("button", { name: "Creating Product..." })).toBeDisabled();

    resolveCreate(response(201, tote));

    expect(await screen.findByText("Canvas Tote was created.")).toBeInTheDocument();
  });

  it("rejects invalid creation input without calling the create API", async () => {
    const fetchMock = stubFetch({ list: () => Promise.resolve(response(200, [])) });
    render(<AdminProducts />);

    await screen.findByText("No Products exist yet.");
    const form = createForm();
    fireEvent.change(within(form).getByLabelText("Name"), { target: { value: "   " } });
    fireEvent.change(within(form).getByLabelText("Description"), {
      target: { value: "A sample product" }
    });
    fireEvent.change(within(form).getByLabelText("Price"), { target: { value: "-1" } });
    fireEvent.click(within(form).getByRole("button", { name: "Create Product" }));

    expect(within(form).getByRole("alert")).toHaveTextContent("Enter a Product name.");
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/products",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("edits a Product in place and returns focus to its Edit control", async () => {
    const updated: ProductResponse = { ...tote, name: "Canvas Market Tote", price: 15.25 };
    let listed: ProductResponse[] = [tote];
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);
      const method = options?.method ?? "GET";

      if (path === "/api/products" && method === "GET") {
        return Promise.resolve(response(200, listed));
      }

      if (path === `/api/products/${tote.id}` && method === "PUT") {
        listed = [updated];
        return Promise.resolve(response(200, updated));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Edit ${tote.name}` }));

    const editForm = screen.getByRole("form", { name: `Edit ${tote.name}` });
    expect(within(editForm).getByLabelText("Name")).toHaveValue(tote.name);
    expect(within(editForm).getByLabelText("Description")).toHaveValue(tote.description);
    expect(within(editForm).getByLabelText("Price")).toHaveValue(12.5);
    await waitFor(() => expect(within(editForm).getByLabelText("Name")).toHaveFocus());

    fireEvent.change(within(editForm).getByLabelText("Name"), {
      target: { value: updated.name }
    });
    fireEvent.change(within(editForm).getByLabelText("Price"), { target: { value: "15.25" } });
    fireEvent.click(within(editForm).getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Canvas Market Tote was updated.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${tote.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: updated.name,
        description: tote.description,
        price: 15.25,
        mediaKey: null
      })
    });

    const editButton = await screen.findByRole("button", { name: `Edit ${updated.name}` });
    await waitFor(() => expect(editButton).toHaveFocus());
  });

  it("preserves a well-formed but unmapped media key when editing", async () => {
    const unmapped: ProductResponse = { ...tote, mediaKey: "well-formed-but-unmapped" };
    const fetchMock = stubFetch({
      list: () => Promise.resolve(response(200, [unmapped])),
      update: () => Promise.resolve(response(200, unmapped))
    });
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Edit ${unmapped.name}` }));

    const editForm = screen.getByRole("form", { name: `Edit ${unmapped.name}` });
    expect(within(editForm).getByLabelText("Media")).toHaveValue("well-formed-but-unmapped");

    fireEvent.click(within(editForm).getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(`/api/products/${unmapped.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: unmapped.name,
          description: unmapped.description,
          price: unmapped.price,
          mediaKey: "well-formed-but-unmapped"
        })
      })
    );
  });

  it("cancels editing without calling the update API and restores focus", async () => {
    const fetchMock = stubFetch({ list: () => Promise.resolve(response(200, [tote])) });
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Edit ${tote.name}` }));

    const editForm = screen.getByRole("form", { name: `Edit ${tote.name}` });
    fireEvent.change(within(editForm).getByLabelText("Name"), { target: { value: "Changed" } });
    fireEvent.click(within(editForm).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("form", { name: `Edit ${tote.name}` })).not.toBeInTheDocument();
    expect(screen.getByText(tote.name)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === "PUT")).toBe(false);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: `Edit ${tote.name}` })).toHaveFocus()
    );
  });

  it("reports a failed update without losing the edit form", async () => {
    stubFetch({
      list: () => Promise.resolve(response(200, [tote])),
      update: () => Promise.resolve(response(400))
    });
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Edit ${tote.name}` }));

    const editForm = screen.getByRole("form", { name: `Edit ${tote.name}` });
    fireEvent.change(within(editForm).getByLabelText("Name"), { target: { value: "Changed" } });
    fireEvent.click(within(editForm).getByRole("button", { name: "Save changes" }));

    expect(await within(editForm).findByRole("alert")).toHaveTextContent(
      "Check the Product name, description, price, and media, then try again."
    );
    expect(screen.getByRole("form", { name: `Edit ${tote.name}` })).toBeInTheDocument();
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

  it("deletes the Product after confirmation and refreshes the list", async () => {
    let listed: ProductResponse[] = [tote];
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);
      const method = options?.method ?? "GET";

      if (path === "/api/products" && method === "GET") {
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
    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${tote.id}`, { method: "DELETE" });
    expect(await screen.findByText("No Products exist yet.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Products", level: 2 })).toHaveFocus()
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

  it("keeps the create success message when the list refresh fails and retries the list", async () => {
    const created: ProductResponse = { ...tote };
    let listCalls = 0;
    let listed: ProductResponse[] = [];
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

      if (path === "/api/products" && method === "POST") {
        listed = [created];
        return Promise.resolve(response(201, created));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProducts />);

    await screen.findByText("No Products exist yet.");
    const form = createForm();
    fireEvent.change(within(form).getByLabelText("Name"), { target: { value: created.name } });
    fireEvent.change(within(form).getByLabelText("Description"), {
      target: { value: created.description }
    });
    fireEvent.change(within(form).getByLabelText("Price"), { target: { value: "12.50" } });
    fireEvent.click(within(form).getByRole("button", { name: "Create Product" }));

    expect(await screen.findByText("Canvas Tote was created.")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "The change was saved, but the Product list could not be refreshed. Retry Products to load the current list."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `Edit ${created.name}` })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry Products" }));

    expect(await screen.findByRole("button", { name: `Edit ${created.name}` })).toBeInTheDocument();
    expect(screen.queryByText(/could not be refreshed/i)).not.toBeInTheDocument();
    expect(screen.getByText("Canvas Tote was created.")).toBeInTheDocument();
  });

  it("keeps the update success message when the list refresh fails and retries the list", async () => {
    const updated: ProductResponse = { ...tote, name: "Canvas Market Tote", price: 15.25 };
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

      if (path === `/api/products/${tote.id}` && method === "PUT") {
        listed = [updated];
        return Promise.resolve(response(200, updated));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProducts />);

    fireEvent.click(await screen.findByRole("button", { name: `Edit ${tote.name}` }));

    const editForm = screen.getByRole("form", { name: `Edit ${tote.name}` });
    fireEvent.change(within(editForm).getByLabelText("Name"), {
      target: { value: updated.name }
    });
    fireEvent.click(within(editForm).getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Canvas Market Tote was updated.")).toBeInTheDocument();
    expect(await screen.findByText(/could not be refreshed/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `Edit ${updated.name}` })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry Products" }));

    expect(await screen.findByRole("button", { name: `Edit ${updated.name}` })).toBeInTheDocument();
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
