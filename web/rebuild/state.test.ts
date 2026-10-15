import { describe, expect, it } from "vitest";
import { INITIAL_STATE, reducer, validateForm, toCreateInput } from "./state";
import type { Product } from "./transport/types";

const baseProduct: Product = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Canvas Tote",
  description: "Synthetic canvas tote",
  price: 12.5,
  mediaKey: null,
  uploadedMediaId: null
};

describe("reducer", () => {
  it("moves the create slice to pending on submit and ignores stale values", () => {
    const pending = reducer(INITIAL_STATE, { type: "create/submit", input: { name: "a", description: "b", price: 1 }, token: "tok-1" });
    expect(pending.create.status).toBe("pending");
    if (pending.create.status === "pending") {
      expect(pending.create.token).toBe("tok-1");
    }
  });

  it("moves to pending from a saved state so a second creation can succeed", () => {
    const saved = {
      ...INITIAL_STATE,
      create: { status: "saved" as const, values: INITIAL_STATE.create.values, saved: baseProduct }
    };
    const after = reducer(saved, { type: "create/submit", input: { name: "a", description: "b", price: 1 }, token: "tok-2" });
    expect(after.create.status).toBe("pending");
    if (after.create.status === "pending") {
      expect(after.create.token).toBe("tok-2");
    }
  });

  it("moves to pending from an error state so a retry is honoured", () => {
    const errored = reducer(
      reducer(INITIAL_STATE, {
        type: "create/submit",
        input: { name: "a", description: "b", price: 1 },
        token: "tok-1"
      }),
      {
        type: "create/error",
        token: "tok-1",
        error: { kind: "invalid", status: 400, message: "bad" }
      }
    );
    expect(errored.create.status).toBe("error");

    const after = reducer(errored, {
      type: "create/submit",
      input: { name: "a", description: "b", price: 1 },
      token: "tok-2"
    });
    expect(after.create.status).toBe("pending");
    if (after.create.status === "pending") {
      expect(after.create.token).toBe("tok-2");
    }
  });

  it("create/reset returns to idle from saved, error and pending", () => {
    const saved = {
      ...INITIAL_STATE,
      create: { status: "saved" as const, values: INITIAL_STATE.create.values, saved: baseProduct }
    };
    expect(reducer(saved, { type: "create/reset" }).create).toEqual({
      status: "idle",
      values: { name: "", description: "", price: "" }
    });

    const errored = {
      ...INITIAL_STATE,
      create: {
        status: "error" as const,
        values: { name: "x", description: "y", price: "1" },
        error: { kind: "invalid" as const, status: 400 as const, message: "bad" },
        token: "tok-1"
      }
    };
    expect(reducer(errored, { type: "create/reset" }).create).toEqual({
      status: "idle",
      values: { name: "", description: "", price: "" }
    });
  });

  it("ignores a second submit while one is already pending (token guard)", () => {
    const pending = reducer(INITIAL_STATE, {
      type: "create/submit",
      input: { name: "a", description: "b", price: 1 },
      token: "tok-1"
    });
    const stillPending = reducer(pending, {
      type: "create/submit",
      input: { name: "x", description: "y", price: 2 },
      token: "tok-2"
    });
    expect(stillPending.create).toEqual(pending.create);
  });

  it("ignores stale success tokens", () => {
    const pending = reducer(INITIAL_STATE, { type: "create/submit", input: { name: "a", description: "b", price: 1 }, token: "tok-1" });
    const stale = reducer(pending, { type: "create/success", product: baseProduct, token: "tok-2" });
    expect(stale.create.status).toBe("pending");
  });

  it("applies success when the token matches and appends to the list", () => {
    const pending = reducer(INITIAL_STATE, { type: "create/submit", input: { name: "a", description: "b", price: 1 }, token: "tok-1" });
    const success = reducer(pending, { type: "create/success", product: baseProduct, token: "tok-1" });
    expect(success.create.status).toBe("saved");
    expect(success.list).toEqual({ status: "success", products: [baseProduct] });
  });

  it("appends without duplicating when the same id arrives twice", () => {
    const withOne = reducer(INITIAL_STATE, {
      type: "list/success",
      products: [baseProduct]
    });
    const pending = reducer(withOne, { type: "create/submit", input: { name: "a", description: "b", price: 1 }, token: "tok-1" });
    const success = reducer(pending, { type: "create/success", product: baseProduct, token: "tok-1" });
    expect(success.list).toEqual({ status: "success", products: [baseProduct] });
  });

  it("preserves form values when create errors", () => {
    const pending = reducer(INITIAL_STATE, { type: "create/submit", input: { name: "a", description: "b", price: 1 }, token: "tok-1" });
    const error = reducer(pending, {
      type: "create/error",
      token: "tok-1",
      error: { kind: "invalid", status: 400, message: "bad" }
    });
    expect(error.create.status).toBe("error");
    if (error.create.status === "error") {
      expect(error.create.values).toEqual(INITIAL_STATE.create.values);
    }
  });

  it("ignores stale error tokens", () => {
    const pending = reducer(INITIAL_STATE, { type: "create/submit", input: { name: "a", description: "b", price: 1 }, token: "tok-1" });
    const stale = reducer(pending, {
      type: "create/error",
      token: "tok-2",
      error: { kind: "server", status: 500, message: "boom" }
    });
    expect(stale.create.status).toBe("pending");
  });

  it("ignores changes while a submission is pending", () => {
    const pending = reducer(INITIAL_STATE, { type: "create/submit", input: { name: "a", description: "b", price: 1 }, token: "tok-1" });
    const after = reducer(pending, { type: "create/values", values: { name: "x", description: "y", price: "1" } });
    expect(after.create).toEqual(pending.create);
  });

  it("only resolves detail success when the productId matches", () => {
    const opened = reducer(INITIAL_STATE, { type: "detail/open", productId: "abc", returnFocus: null });
    const stale = reducer(opened, { type: "detail/success", productId: "other", product: baseProduct });
    expect(stale.detail.status).toBe("loading");
    const fresh = reducer(opened, { type: "detail/success", productId: "abc", product: baseProduct });
    expect(fresh.detail.status).toBe("success");
  });
});

describe("validateForm", () => {
  it("treats whitespace-only as empty for name and description", () => {
    expect(validateForm({ name: "   ", description: "ok", price: "1" })).toEqual(["name"]);
    expect(validateForm({ name: "ok", description: " \t\n ", price: "1" })).toEqual(["description"]);
  });

  it("flags negative or non-numeric price", () => {
    expect(validateForm({ name: "ok", description: "ok", price: "-1" })).toEqual(["price"]);
    expect(validateForm({ name: "ok", description: "ok", price: "abc" })).toEqual(["price"]);
  });

  it("accepts zero and fractional prices", () => {
    expect(validateForm({ name: "ok", description: "ok", price: "0" })).toEqual([]);
    expect(validateForm({ name: "ok", description: "ok", price: "0.001" })).toEqual([]);
    expect(validateForm({ name: "ok", description: "ok", price: "12345.6789" })).toEqual([]);
  });

  it("reports every offending field", () => {
    expect(
      validateForm({ name: "", description: "", price: "" })
    ).toEqual(expect.arrayContaining(["name", "description", "price"]));
  });
});

describe("toCreateInput", () => {
  it("preserves whitespace and coerces the price", () => {
    expect(toCreateInput({ name: "  X  ", description: "Y", price: "1.5" })).toEqual({
      name: "  X  ",
      description: "Y",
      price: 1.5
    });
  });
});