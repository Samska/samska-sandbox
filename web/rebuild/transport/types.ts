/**
 * Wire types for the R1 candidate backend.
 *
 * The Product contract is exactly six keys; do not add fields client-side.
 * `uploadedMediaId` is null because uploads are out of R1 scope.
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mediaKey: string | null;
  uploadedMediaId: string | null;
}

/** Raw input the form submits. `mediaKey` is omitted in R1. */
export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  mediaKey?: string | null;
}

/** Client-side validation outcome used before any network call. */
export interface ValidationError {
  kind: "validation";
  fields: ReadonlyArray<"name" | "description" | "price">;
  message: string;
}

/** Reasons a request can fail without giving up silent success. */
export type RequestError =
  | { kind: "validation"; fields: ReadonlyArray<"name" | "description" | "price">; message: string }
  | { kind: "invalid"; status: 400; message: string }
  | { kind: "notFound"; status: 404; message: string }
  | { kind: "server"; status: number; message: string }
  | { kind: "network"; message: string }
  | { kind: "parse"; message: string };

/** Runtime identity statuses surfaced to the UI gate. */
export type RuntimeStatus =
  | { kind: "unknown" }
  | { kind: "checking" }
  | { kind: "ready"; runtime: "rebuild-r1" }
  | { kind: "mismatch"; observed: string }
  | { kind: "unavailable"; reason: string };

export function isRequestError(value: unknown): value is RequestError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    typeof (value as { kind: unknown }).kind === "string"
  );
}