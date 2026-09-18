import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Catalog from "./Catalog";

const createdProduct = {
  id: "f84c1a1d-6d7a-4c07-b40f-3c5ca66ab612",
  name: "Canvas Tote",
  price: 12.5
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Catalog", () => {
  it("creates a Product with the Catalog API contract and renders its generated data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(201, createdProduct));
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Tote" } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "12.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Canvas Tote", price: 12.5 })
    });
    expect(await screen.findByText("Product created successfully.")).toBeInTheDocument();
    expect(screen.getByText(createdProduct.id)).toBeInTheDocument();
    expect(screen.getByText(createdProduct.name)).toBeInTheDocument();
    expect(screen.getByText("12.5")).toBeInTheDocument();
  });

  it("prevents invalid creation input from calling the API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Price"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Product name.");
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Tote" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a price that is zero or greater.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a create 400 response without reading an error body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(400)));
    render(<Catalog />);

    submitCreation();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Check the Product name and price, then try again."
    );
  });

  it("retrieves a Product by its trimmed and encoded ID", async () => {
    const productId = "product/id";
    const fetchMock = vi.fn().mockResolvedValue(response(200, { ...createdProduct, id: productId }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    fireEvent.change(screen.getByLabelText("Product ID"), { target: { value: ` ${productId} ` } });
    fireEvent.click(screen.getByRole("button", { name: "Find Product" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(fetchMock).toHaveBeenCalledWith("/api/products/product%2Fid", undefined);
    expect(await screen.findByText("Product found successfully.")).toBeInTheDocument();
    expect(screen.getByText(productId)).toBeInTheDocument();
  });

  it.each([
    [400, "Enter a valid Product ID."],
    [404, "No Product was found with that ID."]
  ])("reports lookup status %i", async (status, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(status)));
    render(<Catalog />);

    submitLookup();

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });

  it("reports network and unexpected server failures safely", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("connection details"))
      .mockResolvedValueOnce(response(500));
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    submitLookup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The Product service could not be reached. Try again."
    );

    submitLookup();
    expect(await screen.findByRole("alert")).toHaveTextContent("The Product service failed. Try again.");
  });

  it("reports malformed successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(201, { id: "only-an-id" })));
    render(<Catalog />);

    submitCreation();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The Product service returned an unexpected response. Try again."
    );
  });

  it("disables only the pending form, prevents duplicate submission, and clears stale results on retry", async () => {
    let resolveRequest: ((value: Response) => void) | undefined;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(201, createdProduct))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve;
          })
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<Catalog />);

    submitCreation();
    expect(await screen.findByText("Product created successfully.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(screen.getByRole("status")).toHaveTextContent("Loading Product...");
    expect(screen.queryByText("Product created successfully.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByLabelText("Product ID")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Find Product" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Creating Product..." }));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    resolveRequest?.(response(201, createdProduct));
    expect(await screen.findByText("Product created successfully.")).toBeInTheDocument();
  });
});

function submitCreation() {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Tote" } });
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "12.50" } });
  fireEvent.click(screen.getByRole("button", { name: "Create Product" }));
}

function submitLookup() {
  fireEvent.change(screen.getByLabelText("Product ID"), { target: { value: "product-id" } });
  fireEvent.click(screen.getByRole("button", { name: "Find Product" }));
}

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}
