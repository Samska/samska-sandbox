import type { RequestError } from "./transport/types";

/**
 * POST outcomes are non-idempotent in R1: the server may have processed the
 * request even when the response never reached us. The UI must not claim a
 * definitive failure nor auto-replay.
 */
const CREATE_UNCERTAINTY =
  "Creation not confirmed. The product may have been saved — check Products before retrying.";

export function humaniseCreateError(error: RequestError): string {
  switch (error.kind) {
    case "validation":
      return error.message;
    case "invalid":
      return "The server rejected the product.";
    case "notFound":
      return "Product not found.";
    case "server":
    case "network":
    case "parse":
      return CREATE_UNCERTAINTY;
  }
}

export function humaniseReadError(error: RequestError): string {
  switch (error.kind) {
    case "validation":
      return error.message;
    case "invalid":
      return "The server rejected the request.";
    case "notFound":
      return "Product not found.";
    case "server":
      return `Server returned ${error.status}. Try again later.`;
    case "network":
      return "Could not reach the candidate backend.";
    case "parse":
      return "Server response was not understood.";
  }
}