import { apiFetch } from "../http";

export interface Account {
  id: string;
  email: string;
  displayName: string;
  role: "CUSTOMER" | "ADMIN";
}

export type AuthErrorKind = "invalid" | "credentials" | "network" | "server";

export class AuthApiError extends Error {
  readonly kind: AuthErrorKind;

  constructor(kind: AuthErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

export async function currentAccount(): Promise<Account | null> {
  const response = await call("/api/auth/me");

  if (response.status === 204) {
    return null;
  }

  return readAccount(response, 200);
}

export async function signIn(email: string, password: string): Promise<Account> {
  return readAccount(await call("/api/auth/login", { email, password }), 200);
}

export async function signOut(): Promise<void> {
  const response = await call("/api/auth/logout", {});

  if (response.status !== 204) {
    throw new AuthApiError("server");
  }
}

async function call(path: string, body?: unknown): Promise<Response> {
  try {
    return await apiFetch(
      path,
      body === undefined
        ? undefined
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
  } catch {
    throw new AuthApiError("network");
  }
}

async function readAccount(response: Response, expected: number): Promise<Account> {
  if (response.status !== expected) {
    throw new AuthApiError(kindFor(response.status));
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!isAccount(payload)) {
    throw new AuthApiError("server");
  }

  return payload;
}

function kindFor(status: number): AuthErrorKind {
  if (status === 400) return "invalid";
  if (status === 401) return "credentials";
  return "server";
}

function isAccount(value: unknown): value is Account {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.displayName === "string" &&
    (candidate.role === "CUSTOMER" || candidate.role === "ADMIN")
  );
}
