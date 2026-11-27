import { apiFetch } from "../http";

export interface ServiceHealth {
  name: string;
  healthy: boolean;
  latencyMillis: number;
}

export interface OperationsSnapshot {
  generatedAt: string;
  ordersLastHour: number;
  ordersLast24Hours: number;
  approvedAttempts: number;
  declinedAttempts: number;
  failedAttempts: number;
  approvalRate: number | null;
  checkoutP95Millis: number | null;
  checkoutSamples: number;
  requests: number;
  serverErrors: number;
  errorRate: number | null;
  services: ServiceHealth[];
}

export class OperationsApiError extends Error {
  readonly forbidden: boolean;

  constructor(forbidden: boolean) {
    super(forbidden ? "forbidden" : "server");
    this.forbidden = forbidden;
  }
}

const countKeys = [
  "ordersLastHour",
  "ordersLast24Hours",
  "approvedAttempts",
  "declinedAttempts",
  "failedAttempts",
  "checkoutSamples",
  "requests",
  "serverErrors"
] as const;

export async function getOperations(): Promise<OperationsSnapshot> {
  let response: Response;

  try {
    response = await apiFetch("/api/admin/operations");
  } catch {
    throw new OperationsApiError(false);
  }

  if (response.status === 403) {
    throw new OperationsApiError(true);
  }

  if (response.status !== 200) {
    throw new OperationsApiError(false);
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new OperationsApiError(false);
  }

  if (!isSnapshot(payload)) {
    throw new OperationsApiError(false);
  }

  return payload;
}

function isNumberOrNull(value: unknown): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isSnapshot(value: unknown): value is OperationsSnapshot {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.generatedAt === "string" &&
    countKeys.every((key) => typeof record[key] === "number" && Number.isFinite(record[key])) &&
    isNumberOrNull(record.approvalRate) &&
    isNumberOrNull(record.checkoutP95Millis) &&
    isNumberOrNull(record.errorRate) &&
    Array.isArray(record.services) &&
    record.services.every(
      (service) =>
        typeof service === "object" &&
        service !== null &&
        typeof (service as ServiceHealth).name === "string" &&
        typeof (service as ServiceHealth).healthy === "boolean" &&
        typeof (service as ServiceHealth).latencyMillis === "number"
    )
  );
}
