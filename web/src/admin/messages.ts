import { CatalogApiError } from "../catalog/catalogApi";

export function adminLoadErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError && error.kind === "network") {
    return "The Product service could not be reached. Try again.";
  }

  if (error instanceof CatalogApiError && error.kind === "invalid-response") {
    return "The Product service returned an unexpected response. Try again.";
  }

  return "The Product service failed. Try again.";
}

export function adminRefreshErrorMessage(): string {
  return "The change was saved, but the Product list could not be refreshed. Retry Products to load the current list.";
}

export function adminSaveErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError) {
    if (error.kind === "bad-request") {
      return "Check the Product name, description, price, and media, then try again.";
    }

    if (error.kind === "not-found") {
      return "This Product no longer exists. Reload the Product list.";
    }

    if (error.kind === "network") {
      return "The Product service could not be reached. Try again.";
    }

    if (error.kind === "invalid-response") {
      return "The Product service returned an unexpected response. Try again.";
    }
  }

  return "The Product service failed. Try again.";
}

export function adminDeleteErrorMessage(error: unknown): string {
  if (error instanceof CatalogApiError) {
    if (error.kind === "conflict") {
      return "This Product is in your Cart. Remove it from the Cart in the Market, then try again.";
    }

    if (error.kind === "not-found") {
      return "This Product no longer exists. Reload the Product list.";
    }

    if (error.kind === "network") {
      return "The Product service could not be reached. Try again.";
    }

    if (error.kind === "invalid-response") {
      return "The Product service returned an unexpected response. Try again.";
    }
  }

  return "The Product service failed. Try again.";
}
