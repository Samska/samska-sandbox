import { OrderApiError } from "./orderApi";

export const unconfirmedOrderMessage =
  "We could not confirm whether an Order was created. Check the Order result before trying again.";

export const missingApprovalMessage =
  "The approved payment attempt cannot be confirmed. Reload the Cart, recreate and review synthetic data if needed, " +
  "then make a new explicit simulated payment attempt before creating an Order.";

export function orderErrorMessage(error: unknown): string {
  if (!(error instanceof OrderApiError)) return unconfirmedOrderMessage;
  switch (error.kind) {
    case "not-found": return missingApprovalMessage;
    case "not-approved": return "This simulated payment was not approved. No Order was created.";
    case "out-of-stock":
      return "Your reserved items were sold to someone else before the Order was created. No Order was created. Review your Cart and pay again.";
    case "bad-request": return "The Order request was rejected. No Order was created.";
    default: return unconfirmedOrderMessage;
  }
}
