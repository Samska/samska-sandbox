import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminProductCreate from "./AdminProductCreate";
import type { ProductResponse } from "../catalog/catalogApi";

const created: ProductResponse = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "Canvas Tote",
  description: "A sturdy everyday tote.",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

const createdWithImage: ProductResponse = {
  ...created,
  uploadedMediaId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}

function fillFields() {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: created.name } });
  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: created.description }
  });
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "12.50" } });
}

function selectImage(name = "photo.jpg", type = "image/jpeg") {
  fireEvent.change(screen.getByLabelText("Image file"), {
    target: { files: [new File(["image-bytes"], name, { type })] }
  });
}

describe("AdminProductCreate", () => {
  it("renders the dedicated form with image guidance and no curated dropdown", () => {
    render(<AdminProductCreate />);

    expect(screen.getByRole("heading", { name: "Create Product", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Price")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Product image" })).toBeInTheDocument();
    expect(screen.getByLabelText("Image file")).toBeInTheDocument();
    expect(screen.getByText(/JPEG only, up to 2 MiB/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Product list" })).toHaveAttribute(
      "href",
      "/admin/products"
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("rejects invalid input without calling the create API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a Product name.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a Product without an image using a null media key", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      if (String(input) === "/api/products" && options?.method === "POST") {
        return Promise.resolve(response(201, created));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fillFields();
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(
      await screen.findByText("Product created without an image. You can add one later from the Product list.")
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: created.name,
        description: created.description,
        price: 12.5,
        mediaKey: null
      })
    });
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("/media"))).toBe(false);
    expect(screen.getByRole("link", { name: "Go to Product list" })).toHaveAttribute(
      "href",
      "/admin/products"
    );
  });

  it("creates a Product and then uploads the selected image", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products" && options?.method === "POST") {
        return Promise.resolve(response(201, created));
      }

      if (path === `/api/products/${created.id}/media` && options?.method === "PUT") {
        return Promise.resolve(response(200, createdWithImage));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fillFields();
    selectImage();
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(await screen.findByText("Product created with its uploaded image.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/products/${created.id}/media`,
      expect.objectContaining({ method: "PUT", body: expect.any(FormData) })
    );
    expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/api/products")).toHaveLength(1);
  });

  it("keeps the created Product identity when the image fails and retries without creating again", async () => {
    let mediaCalls = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products" && options?.method === "POST") {
        return Promise.resolve(response(201, created));
      }

      if (path === `/api/products/${created.id}/media` && options?.method === "PUT") {
        mediaCalls += 1;
        return Promise.resolve(mediaCalls === 1 ? response(415) : response(200, createdWithImage));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fillFields();
    selectImage("photo.png", "image/png");
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(await screen.findByText(/Product created; image could not be uploaded/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Only JPEG images are accepted.");

    fireEvent.click(screen.getByRole("button", { name: "Retry image upload" }));

    expect(await screen.findByText("Product created with its uploaded image.")).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([input]) => String(input) === "/api/products")).toHaveLength(1);
    expect(mediaCalls).toBe(2);
  });

  it("reconciles an uncertain image upload before stating what succeeded", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products" && options?.method === "POST") {
        return Promise.resolve(response(201, created));
      }

      if (path === `/api/products/${created.id}/media` && options?.method === "PUT") {
        return Promise.reject(new Error("offline"));
      }

      if (path === `/api/products/${created.id}`) {
        return Promise.resolve(response(200, created));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fillFields();
    selectImage();
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(
      await screen.findByText(/upload could not be confirmed, and the Product currently has no uploaded image/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry image upload" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload Product" })).toBeInTheDocument();
  });

  it("retains the created Product and retries with a newly selected JPEG", async () => {
    const mediaRequests: FormData[] = [];
    let mediaCalls = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products" && options?.method === "POST") {
        return Promise.resolve(response(201, created));
      }

      if (path === `/api/products/${created.id}/media` && options?.method === "PUT") {
        mediaCalls += 1;
        mediaRequests.push(options.body as FormData);
        return Promise.resolve(mediaCalls === 1 ? response(415) : response(200, createdWithImage));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fillFields();
    selectImage("photo.png", "image/png");
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(await screen.findByText(/Product created; image could not be uploaded/i)).toBeInTheDocument();

    selectImage("photo.jpg", "image/jpeg");
    expect(screen.getByRole("button", { name: "Retry image upload" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry image upload" }));

    expect(await screen.findByText("Product created with its uploaded image.")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(
        ([input, options]) => String(input) === "/api/products" && options?.method === "POST"
      )
    ).toHaveLength(1);
    expect(mediaCalls).toBe(2);
    expect((mediaRequests[0].get("file") as File).name).toBe("photo.png");
    expect((mediaRequests[1].get("file") as File).name).toBe("photo.jpg");
    expect((mediaRequests[1].get("file") as File).type).toBe("image/jpeg");
  });

  it("retains the retry state when reloading finds no uploaded image", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input);

      if (path === "/api/products" && options?.method === "POST") {
        return Promise.resolve(response(201, created));
      }

      if (path === `/api/products/${created.id}/media` && options?.method === "PUT") {
        return Promise.reject(new Error("offline"));
      }

      if (path === `/api/products/${created.id}`) {
        return Promise.resolve(response(200, created));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fillFields();
    selectImage();
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    await screen.findByRole("button", { name: "Reload Product" });
    fireEvent.click(screen.getByRole("button", { name: "Reload Product" }));

    expect(
      await screen.findByText(/No uploaded image was found for this Product/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry image upload" })).toBeInTheDocument();
    expect(screen.queryByText(/Product created without an image/)).not.toBeInTheDocument();
  });

  it("does not offer another create when the create outcome is unknown", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      if (String(input) === "/api/products" && options?.method === "POST") {
        return Promise.reject(new Error("offline"));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fillFields();
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(await screen.findByText("Create result unknown")).toBeInTheDocument();
    expect(screen.getByText(/Check the Product list before creating again/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Product" })).not.toBeInTheDocument();
  });

  it("creates without uploading when the file selection is cleared", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
      if (String(input) === "/api/products" && options?.method === "POST") {
        return Promise.resolve(response(201, created));
      }

      return Promise.resolve(response(200, []));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductCreate />);

    fillFields();
    selectImage();
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Product" }));

    expect(
      await screen.findByText("Product created without an image. You can add one later from the Product list.")
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("/media"))).toBe(false);
  });
});
