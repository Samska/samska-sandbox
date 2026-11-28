import { OrderApiError } from "./orderApi";

export const unconfirmedOrderMessage =
  "We couldn't confirm whether your Order was placed. Try Place order again; it will not be placed twice.";

export function orderErrorMessage(error: unknown): string {
  if (!(error instanceof OrderApiError)) return unconfirmedOrderMessage;
  switch (error.kind) {
    case "cart-changed":
      return "Your Cart changed since you reviewed it. The latest Cart is shown; review it and place the order again.";
    case "out-of-stock":
      return "An item in your Cart is no longer available in that quantity. No Order was placed. Review your Cart and try again.";
    case "bad-request":
      return "The Order request was rejected. No Order was placed.";
    default:
      return unconfirmedOrderMessage;
  }
}

/** Whether the server may still have placed the Order, so the same request ID must be kept. */
export function isUnconfirmedOrderError(error: unknown): boolean {
  return !(error instanceof OrderApiError) || ["network", "server", "invalid-response"].includes(error.kind);
}
