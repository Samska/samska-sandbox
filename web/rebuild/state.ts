import type { CreateProductInput, Product, RequestError, RuntimeStatus } from "./transport/types";

/**
 * Form values the user has typed. We keep raw strings so submission matches
 * what was entered; emptiness is checked with a trimmed copy only.
 */
export interface FormValues {
  name: string;
  description: string;
  price: string;
}

export const EMPTY_FORM: FormValues = { name: "", description: "", price: "" };

export interface ProductsState {
  runtime: RuntimeStatus;
  list: ListSlice;
  create: CreateSlice;
  detail: DetailSlice;
}

export type ListSlice =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; products: ReadonlyArray<Product> }
  | { status: "error"; error: RequestError };

export type CreateSlice =
  | { status: "idle"; values: FormValues }
  | { status: "pending"; values: FormValues; token: string }
  | { status: "error"; values: FormValues; error: RequestError; token: string }
  | { status: "saved"; values: FormValues; saved: Product };

export interface DetailSlice {
  status: "idle" | "loading" | "success" | "error";
  productId: string | null;
  product: Product | null;
  error: RequestError | null;
  /** Last focusable element that opened the detail; focus returns here. */
  returnFocus: HTMLElement | null;
}

export const INITIAL_STATE: ProductsState = {
  runtime: { kind: "unknown" },
  list: { status: "idle" },
  create: { status: "idle", values: EMPTY_FORM },
  detail: { status: "idle", productId: null, product: null, error: null, returnFocus: null }
};

export type Action =
  | { type: "runtime/checking" }
  | { type: "runtime/status"; runtime: RuntimeStatus }
  | { type: "list/load" }
  | { type: "list/success"; products: ReadonlyArray<Product> }
  | { type: "list/error"; error: RequestError }
  | { type: "list/idle" }
  | { type: "create/values"; values: FormValues }
  | { type: "create/submit"; input: CreateProductInput; token: string }
  | { type: "create/success"; product: Product; token: string }
  | { type: "create/error"; error: RequestError; token: string }
  | { type: "create/reset" }
  | { type: "detail/open"; productId: string; returnFocus: HTMLElement | null }
  | { type: "detail/loading"; productId: string }
  | { type: "detail/success"; product: Product; productId: string }
  | { type: "detail/error"; error: RequestError; productId: string }
  | { type: "detail/close" }
  | { type: "detail/idle" };

export function reducer(state: ProductsState, action: Action): ProductsState {
  switch (action.type) {
    case "runtime/checking":
      return { ...state, runtime: { kind: "checking" } };
    case "runtime/status":
      return { ...state, runtime: action.runtime };
    case "list/load":
      return { ...state, list: { status: "loading" } };
    case "list/success":
      return { ...state, list: { status: "success", products: action.products } };
    case "list/error":
      return { ...state, list: { status: "error", error: action.error } };
    case "list/idle":
      if (state.list.status === "loading") {
        return { ...state, list: { status: "idle" } };
      }
      return state;
    case "create/values":
      if (state.create.status === "pending") {
        return state;
      }
      return { ...state, create: { ...state.create, values: action.values } };
    case "create/submit":
      // A new submission may be started from idle, saved or error. Only an
      // already-pending submission must not be replaced: that guard lives in
      // App via submittingRef so two clicks in the same tick cannot race.
      if (state.create.status === "pending") {
        return state;
      }
      return {
        ...state,
        create: { status: "pending", values: state.create.values, token: action.token }
      };
    case "create/success":
      if (state.create.status !== "pending" || state.create.token !== action.token) {
        return state;
      }
      return {
        ...state,
        create: {
          status: "saved",
          values: state.create.values,
          saved: action.product
        },
        list: appendToList(state.list, action.product)
      };
    case "create/error":
      if (state.create.status !== "pending" || state.create.token !== action.token) {
        return state;
      }
      return {
        ...state,
        create: {
          status: "error",
          values: state.create.values,
          error: action.error,
          token: action.token
        }
      };
    case "create/reset":
      return { ...state, create: { status: "idle", values: EMPTY_FORM } };
    case "detail/open":
      return {
        ...state,
        detail: {
          status: "loading",
          productId: action.productId,
          product: null,
          error: null,
          returnFocus: action.returnFocus
        }
      };
    case "detail/loading":
      if (state.detail.productId !== action.productId) {
        return state;
      }
      return {
        ...state,
        detail: { ...state.detail, status: "loading", productId: action.productId }
      };
    case "detail/success":
      if (state.detail.productId !== action.productId) {
        return state;
      }
      return {
        ...state,
        detail: {
          ...state.detail,
          status: "success",
          productId: action.productId,
          product: action.product
        }
      };
    case "detail/error":
      if (state.detail.productId !== action.productId) {
        return state;
      }
      return {
        ...state,
        detail: {
          ...state.detail,
          status: "error",
          productId: action.productId,
          error: action.error
        }
      };
    case "detail/close":
      return {
        ...state,
        detail: { status: "idle", productId: null, product: null, error: null, returnFocus: null }
      };
    case "detail/idle":
      if (state.detail.status === "loading") {
        return {
          ...state,
          detail: { status: "idle", productId: null, product: null, error: null, returnFocus: null }
        };
      }
      return state;
    default: {
      const _exhaustive: never = action;
      void _exhaustive;
      return state;
    }
  }
}

function appendToList(list: ListSlice, product: Product): ListSlice {
  if (list.status === "success") {
    const filtered = list.products.filter((existing) => existing.id !== product.id);
    return { status: "success", products: [...filtered, product] };
  }
  return { status: "success", products: [product] };
}

/**
 * Validates raw form values. Returns null when valid, otherwise a list of
 * offending field keys. We only trim to check emptiness; the submitted values
 * preserve the user's original whitespace.
 */
export function validateForm(values: FormValues): ReadonlyArray<"name" | "description" | "price"> {
  const errors: Array<"name" | "description" | "price"> = [];
  if (values.name.trim().length === 0) {
    errors.push("name");
  }
  if (values.description.trim().length === 0) {
    errors.push("description");
  }
  const trimmedPrice = values.price.trim();
  if (trimmedPrice.length === 0) {
    errors.push("price");
  } else {
    const price = Number(trimmedPrice);
    if (!Number.isFinite(price) || price < 0) {
      errors.push("price");
    }
  }
  return errors;
}

/** Coerces raw form values into the wire payload, preserving whitespace. */
export function toCreateInput(values: FormValues): CreateProductInput {
  return {
    name: values.name,
    description: values.description,
    price: Number(values.price)
  };
}