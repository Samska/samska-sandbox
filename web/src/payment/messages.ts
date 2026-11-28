import { PaymentApiError, type PaymentApiErrorKind } from "./paymentApi";

const capacityMessage =
  "The payment demo is busy right now. No payment was made. Try again in a moment.";

export const unconfirmedPaymentMessage =
  "We couldn't confirm the payment result. Check the result before trying again.";

export function isUnconfirmedPaymentError(kind: PaymentApiErrorKind): boolean {
  return kind === "network" || kind === "server" || kind === "invalid-response";
}

export function paymentErrorMessage(error: unknown): string {
  if (!(error instanceof PaymentApiError)) {
    return "The payment demo failed. No payment was made.";
  }

  switch (error.kind) {
    case "bad-request":
      return "The payment request was rejected. Review your Cart and try again.";
    case "cart-changed":
      return "Your Cart changed since you reviewed it. The latest Cart is shown; review it and try again.";
    case "already-approved":
      return "This Cart already has an approved payment. The existing result is shown.";
    case "attempt-id-conflict":
      return "This payment conflicts with an earlier one. Start a new payment.";
    case "out-of-stock":
      return "An item in your Cart is no longer available in that quantity. No payment was approved. Review your Cart and try again.";
    case "capacity":
      return capacityMessage;
    case "not-found":
      return "We couldn't find a result for this payment.";
    case "network":
    case "server":
    case "invalid-response":
      return unconfirmedPaymentMessage;
    default:
      return "The payment demo failed. No payment was made.";
  }
}
