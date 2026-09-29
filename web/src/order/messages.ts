import { OrderApiError } from "./orderApi";

export const unconfirmedOrderMessage =
  "We could not confirm whether an Order was created. Check the Order result before trying again.";

export const missingApprovalMessage =
  "The approved payment attempt cannot be confirmed. Reload the Cart, recreate and review synthetic data if needed, " +
  "then make a new explicit simulated payment attempt before creating an Order.";

export const orderCapacityMessage =
  "No Order was created. This local Order store is full. Existing Orders remain retrievable. " +
  "Restart the backend to reset, then recreate and review synthetic Product and Cart data and make " +
  "a new simulated payment attempt.";

export function orderErrorMessage(error: unknown): string {
  if (!(error instanceof OrderApiError)) return unconfirmedOrderMessage;
  switch (error.kind) {
    case "capacity": return orderCapacityMessage;
    case "not-found": return missingApprovalMessage;
    case "not-approved": return "This simulated payment was not approved. No Order was created.";
    case "bad-request": return "The Order request was rejected. No Order was created.";
    default: return unconfirmedOrderMessage;
  }
}
