import { isAttemptId } from "./routes";

const latestReferenceKey = "samska.latest-payment-attempt";

export function readLatestReference(): string | null {
  try {
    const stored = window.sessionStorage.getItem(latestReferenceKey);
    return stored !== null && isAttemptId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeLatestReference(attemptId: string): void {
  try {
    window.sessionStorage.setItem(latestReferenceKey, attemptId);
  } catch {
    return;
  }
}

export function clearLatestReference(): void {
  try {
    window.sessionStorage.removeItem(latestReferenceKey);
  } catch {
    return;
  }
}
