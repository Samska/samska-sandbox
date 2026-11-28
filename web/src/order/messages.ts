import { OrderApiError } from "./orderApi";

export const unconfirmedOrderMessage =
  "We couldn't confirm whether your Order was created. Check the result before trying again.";

export const missingApprovalMessage =
  "We can't find an approved payment for this Order. Reload your Cart and pay again before creating an Order.";

export function orderErrorMessage(error: unknown): string {
  if (!(error instanceof OrderApiError)) return unconfirmedOrderMessage;
  switch (error.kind) {
    case "not-found": return missingApprovalMessage;
    case "not-approved": return "This payment wasn't approved, so no Order was created.";
    case "out-of-stock":
      return "Someone else bought these items before your Order was created. No Order was created. Review your Cart and pay again.";
    case "bad-request": return "The Order request was rejected. No Order was created.";
    default: return unconfirmedOrderMessage;
  }
}
