import { PaymentApiError, type PaymentApiErrorKind } from "./paymentApi";

const capacityMessage =
  "Payment simulator is full. No new decision was made. This local demo retains up to 32 " +
  "attempts so earlier results remain available. Restart the local backend to reset the " +
  "simulator, then recreate your synthetic Product and Cart and review Checkout again.";

export const unconfirmedPaymentMessage =
  "We could not confirm the payment result. No decision is confirmed. Check the result of this " +
  "attempt before trying again.";

export function isUnconfirmedPaymentError(kind: PaymentApiErrorKind): boolean {
  return kind === "network" || kind === "server" || kind === "invalid-response";
}

export function paymentErrorMessage(error: unknown): string {
  if (!(error instanceof PaymentApiError)) {
    return "The payment simulator failed. No decision is confirmed.";
  }

  switch (error.kind) {
    case "bad-request":
      return "The payment simulator rejected the request. Review the Cart and try again.";
    case "cart-changed":
      return "The Cart changed since you reviewed it. The latest Cart is shown; review it and try again.";
    case "already-approved":
      return "This Cart revision already has a simulated approval. The existing result is shown.";
    case "attempt-id-conflict":
      return "This payment attempt conflicts with an earlier attempt. Start a new attempt.";
    case "capacity":
      return capacityMessage;
    case "not-found":
      return "We couldn't confirm a result for this reference.";
    case "network":
    case "server":
    case "invalid-response":
      return unconfirmedPaymentMessage;
    default:
      return "The payment simulator failed. No decision is confirmed.";
  }
}
