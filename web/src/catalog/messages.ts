import { CatalogApiError } from "./catalogApi";
import { CartApiError } from "../cart/cartApi";

export function createErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError && error.kind === "bad-request") {
    return "Check the Product name and price, then try again.";
  }

  return generalErrorMessage(error);
}

export function lookupErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError) {
    if (error.kind === "bad-request") {
      return "Enter a valid Product ID.";
    }

    if (error.kind === "not-found") {
      return "No Product was found with that ID.";
    }
  }

  return generalErrorMessage(error);
}

export function catalogBrowseErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError && error.kind === "network") {
    return "The Product service could not be reached. Try again.";
  }

  return generalErrorMessage(error);
}

export function cartErrorMessage(error: unknown): string {
  if (error instanceof CartApiError) {
    if (error.kind === "bad-request") {
      return "The Cart request was invalid. Check the quantity and try again.";
    }

    if (error.kind === "not-found") {
      return "The Product or Cart item was not found.";
    }

    if (error.kind === "network") {
      return "The Cart service could not be reached. Try again.";
    }

    if (error.kind === "invalid-response") {
      return "The Cart service returned an unexpected response. Try again.";
    }
  }

  return "The Cart service failed. Try again.";
}

function generalErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError && error.kind === "network") {
    return "The Product service could not be reached. Try again.";
  }

  if (error instanceof CatalogApiError && error.kind === "invalid-response") {
    return "The Product service returned an unexpected response. Try again.";
  }

  return "The Product service failed. Try again.";
}
