import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminProductEdit from "./AdminProductEdit";
import type { ProductResponse } from "../catalog/catalogApi";

const product: ProductResponse = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Tote",
  description: "A sturdy everyday tote.",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

const uploaded: ProductResponse = {
  ...product,
  uploadedMediaId: "22222222-2222-2222-2222-222222222222"
};

const curated: ProductResponse = { ...product, mediaKey: "canvas-market-tote" };

const unmapped: ProductResponse = { ...product, mediaKey: "well-formed-but-unmapped" };

afterEach(() => {
  vi.unstubAllGlobals();
});

function response(status: number, body?: unknown): Response {
  return {
    status,
    json: async () => body
  } as Response;
}

function stubProduct(initial: ProductResponse, handlers: {
  update?: () => Promise<Response>;
  upload?: (options?: RequestInit) => Promise<Response>;
  remove?: () => Promise<Response>;
  reload?: () => Promise<Response>;
} = {}) {
  let reloads = 0;
  const fetchMock = vi.fn((input: RequestInfo | URL, options?: RequestInit) => {
    const path = String(input);
    const method = options?.method ?? "GET";

    if (path === `/api/products/${initial.id}` && method === "GET") {
      reloads += 1;
      if (reloads > 1 && handlers.reload) {
        return handlers.reload();
      }
      return Promise.resolve(response(200, initial));
    }

    if (path === `/api/products/${initial.id}` && method === "PUT") {
      return handlers.update ? handlers.update() : Promise.resolve(response(200, initial));
    }

    if (path === `/api/products/${initial.id}/media` && method === "PUT") {
      return handlers.upload ? handlers.upload(options) : Promise.resolve(response(200, uploaded));
    }

    if (path === `/api/products/${initial.id}/media` && method === "DELETE") {
      return handlers.remove ? handlers.remove() : Promise.resolve(response(204));
    }

    return Promise.resolve(response(200, []));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function selectImage(name = "photo.jpg", type = "image/jpeg") {
  fireEvent.change(screen.getByLabelText("Image file"), {
    target: { files: [new File(["image-bytes"], name, { type })] }
  });
}

describe("AdminProductEdit", () => {
  it("loads the Product and shows the current uploaded image", async () => {
    stubProduct(uploaded);
    render(<AdminProductEdit productId={uploaded.id} />);

    expect(await screen.findByLabelText("Name")).toHaveValue(uploaded.name);
    expect(screen.getByRole("heading", { name: "Edit Product", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toHaveValue(uploaded.description);
    expect(screen.getByLabelText("Price")).toHaveValue(12.5);
    expect(screen.getByText("This is the current uploaded image.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("shows curated and unmapped media key states without a dropdown", async () => {
    stubProduct(curated);
    const { unmount } = render(<AdminProductEdit productId={curated.id} />);

    expect(
      await screen.findByText('This is the current curated image "canvas-market-tote".')
    ).toBeInTheDocument();
    unmount();

    stubProduct(unmapped);
    render(<AdminProductEdit productId={unmapped.id} />);

    expect(
      await screen.findByText(
        /Media key "well-formed-but-unmapped" has no matching local asset; the monogram is shown/
      )
    ).toBeInTheDocument();
  });

  it("preserves the exact legacy media key on a full update", async () => {
    const fetchMock = stubProduct(unmapped, {
      update: () => Promise.resolve(response(200, { ...unmapped, name: "Renamed Tote" }))
    });
    render(<AdminProductEdit productId={unmapped.id} />);

    await screen.findByLabelText("Name");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Renamed Tote" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Renamed Tote was saved.")).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/products/${unmapped.id}`,
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"mediaKey":"well-formed-but-unmapped"')
        })
      )
    );
  });

  it("does not change server media when a file is merely chosen or the form is cancelled", async () => {
    const fetchMock = stubProduct(product);
    render(<AdminProductEdit productId={product.id} />);

    await screen.findByLabelText("Name");
    selectImage();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Changed" } });

    expect(screen.getByText(/A new image is selected/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/admin/products");
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === "PUT")).toBe(false);
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(false);
  });

  it("applies field changes and a staged removal only when saved", async () => {
    const removed = { ...uploaded, uploadedMediaId: null };
    const fetchMock = stubProduct(uploaded, {
      update: () => Promise.resolve(response(200, { ...uploaded, name: "Canvas Market Tote" })),
      remove: () => Promise.resolve(response(204)),
      reload: () => Promise.resolve(response(200, { ...removed, name: "Canvas Market Tote" }))
    });
    render(<AdminProductEdit productId={uploaded.id} />);

    await screen.findByLabelText("Name");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Market Tote" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));

    expect(
      screen.getByRole("heading", { name: "Remove the uploaded image?" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove on save" }));

    expect(screen.getByText(/The saved image will be removed when you save/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === "DELETE")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Canvas Market Tote was saved.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${uploaded.id}/media`, {
      method: "DELETE"
    });
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/products/${uploaded.id}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
  });

  it("reports partial success when the image fails and retries without repeating the field update", async () => {
    let mediaCalls = 0;
    const updated = { ...product, name: "Canvas Market Tote", uploadedMediaId: "33333333-3333-3333-3333-333333333333" };
    const fetchMock = stubProduct(product, {
      update: () => Promise.resolve(response(200, { ...product, name: "Canvas Market Tote" })),
      upload: () => {
        mediaCalls += 1;
        return Promise.resolve(mediaCalls === 1 ? response(413, { code: "media-limit-exceeded" }) : response(200, updated));
      }
    });
    render(<AdminProductEdit productId={product.id} />);

    await screen.findByLabelText("Name");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Market Tote" } });
    selectImage();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(/The Product details were saved, but the image could not be uploaded/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry image upload" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry image upload" }));

    expect(await screen.findByText("Canvas Market Tote was saved.")).toBeInTheDocument();
    const productUpdates = fetchMock.mock.calls.filter(
      ([input, options]) =>
        String(input) === `/api/products/${product.id}` && options?.method === "PUT"
    );
    expect(productUpdates).toHaveLength(1);
    expect(mediaCalls).toBe(2);
  });

  it("retries with a newly selected replacement file without repeating the field update", async () => {
    const mediaRequests: FormData[] = [];
    let mediaCalls = 0;
    const updated = {
      ...product,
      name: "Canvas Market Tote",
      uploadedMediaId: "33333333-3333-3333-3333-333333333333"
    };
    const fetchMock = stubProduct(product, {
      update: () => Promise.resolve(response(200, { ...product, name: "Canvas Market Tote" })),
      upload: (options) => {
        mediaCalls += 1;
        mediaRequests.push(options?.body as FormData);
        return Promise.resolve(
          mediaCalls === 1 ? response(413, { code: "media-limit-exceeded" }) : response(200, updated)
        );
      }
    });
    render(<AdminProductEdit productId={product.id} />);

    await screen.findByLabelText("Name");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Canvas Market Tote" } });
    selectImage("first.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(/The Product details were saved, but the image could not be uploaded/i)
    ).toBeInTheDocument();

    selectImage("second.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Retry image upload" }));

    expect(await screen.findByText("Canvas Market Tote was saved.")).toBeInTheDocument();
    expect((mediaRequests[0].get("file") as File).name).toBe("first.jpg");
    expect((mediaRequests[1].get("file") as File).name).toBe("second.jpg");
    expect(
      fetchMock.mock.calls.filter(
        ([input, options]) =>
          String(input) === `/api/products/${product.id}` && options?.method === "PUT"
      )
    ).toHaveLength(1);
    expect(mediaCalls).toBe(2);
  });

  it("clears a pending upload when the selection is cleared", async () => {
    const fetchMock = stubProduct(product, {
      update: () => Promise.resolve(response(200, product)),
      upload: () => Promise.resolve(response(413, { code: "media-limit-exceeded" }))
    });
    render(<AdminProductEdit productId={product.id} />);

    await screen.findByLabelText("Name");
    selectImage("discarded.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("button", { name: "Retry image upload" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry image upload" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Canvas Tote was saved.")).toBeInTheDocument();

    const mediaPath = `/api/products/${product.id}/media`;
    const mediaUploads = fetchMock.mock.calls.filter(
      ([input, options]) => String(input) === mediaPath && options?.method === "PUT"
    );
    expect(mediaUploads).toHaveLength(1);
    expect((mediaUploads[0][1]?.body as FormData).get("file")).toHaveProperty(
      "name",
      "discarded.jpg"
    );
    expect(
      fetchMock.mock.calls.some(
        ([input, options]) => String(input) === mediaPath && options?.method === "DELETE"
      )
    ).toBe(false);
  });

  it("clears a pending removal when the uploaded image is kept", async () => {
    const fetchMock = stubProduct(uploaded, {
      update: () => Promise.resolve(response(200, uploaded)),
      remove: () => Promise.resolve(response(500))
    });
    render(<AdminProductEdit productId={uploaded.id} />);

    await screen.findByLabelText("Name");
    fireEvent.click(screen.getByRole("button", { name: "Remove image" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove on save" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("button", { name: "Retry image removal" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keep uploaded image" }));

    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry image removal" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove image" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Canvas Tote was saved.")).toBeInTheDocument();

    const mediaPath = `/api/products/${uploaded.id}/media`;
    expect(
      fetchMock.mock.calls.filter(
        ([input, options]) => String(input) === mediaPath && options?.method === "DELETE"
      )
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls.some(
        ([input, options]) => String(input) === mediaPath && options?.method === "PUT"
      )
    ).toBe(false);
  });

  it("does not claim the image was saved when a network failure cannot be reconciled", async () => {
    let reloads = 0;
    stubProduct(uploaded, {
      update: () => Promise.resolve(response(200, uploaded)),
      upload: () => Promise.reject(new Error("offline")),
      reload: () => {
        reloads += 1;
        return Promise.resolve(response(200, uploaded));
      }
    });
    render(<AdminProductEdit productId={uploaded.id} />);

    await screen.findByLabelText("Name");
    selectImage();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText(/the image change could not be confirmed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/was saved/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry image upload" })).toBeInTheDocument();
    expect(reloads).toBe(1);
  });

  it("shows a load failure with retry", async () => {
    let shouldFail = true;
    const fetchMock = vi.fn(() => {
      if (shouldFail) {
        shouldFail = false;
        return Promise.resolve(response(500));
      }

      return Promise.resolve(response(200, product));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminProductEdit productId={product.id} />);

    expect(await screen.findByText("The Product service failed. Try again.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry Product" }));

    expect(await screen.findByLabelText("Name")).toHaveValue(product.name);
  });
});
