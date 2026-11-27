import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "./AuthContext";

const customer = { id: "1", email: "ana@example.test", displayName: "Ana", role: "CUSTOMER" };
const admin = { id: "2", email: "admin@example.test", displayName: "Administrator", role: "ADMIN" };

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
  window.sessionStorage.clear();
});

type Handler = (path: string, init?: RequestInit) => Response | undefined;

function stubApi(session: unknown | null, extra: Handler = () => undefined) {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      calls.push({ path, init });
      const custom = extra(path, init);

      if (custom !== undefined) {
        return Promise.resolve(custom);
      }
      if (path === "/api/auth/me") {
        return Promise.resolve(
          session === null ? new Response(null, { status: 204 }) : json(200, session)
        );
      }
      if (path === "/api/products") {
        return Promise.resolve(json(200, []));
      }
      return Promise.resolve(json(200, { items: [], total: 0, revision: 0 }));
    })
  );
  return calls;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function renderApp() {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

describe("accounts in the application shell", () => {
  it("shows Sign in and hides Admin for a visitor, and keeps the Market browsable", async () => {
    const calls = stubApi(null);
    renderApp();

    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(await within(navigation).findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/account");
    expect(within(navigation).queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Products", level: 1 })).toBeInTheDocument();
    expect(calls.some((call) => call.path === "/api/cart")).toBe(false);
  });

  it("asks a visitor to sign in before checkout and for Admin", async () => {
    stubApi(null);
    window.history.replaceState({}, "", "/checkout");
    renderApp();
    expect(await screen.findByText("Sign in to check out.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign in", level: 1 })).toBeInTheDocument();
  });

  it("asks for the administrator account on Admin routes", async () => {
    stubApi(null);
    window.history.replaceState({}, "", "/admin/products");
    renderApp();
    expect(await screen.findByText(/administrator account/)).toBeInTheDocument();
  });

  it("shows the account name, Sign out and Admin for the administrator", async () => {
    stubApi(admin);
    renderApp();

    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(await within(navigation).findByText("Administrator")).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Admin" })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("refuses Admin routes to a customer", async () => {
    stubApi(customer);
    window.history.replaceState({}, "", "/admin/products");
    renderApp();

    expect(await screen.findByRole("heading", { name: "Not allowed" })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(within(navigation).queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("signs in from the account page and returns to the Market", async () => {
    const calls = stubApi(null, (path, init) =>
      path === "/api/auth/login" && init?.method === "POST" ? json(200, customer) : undefined
    );
    window.history.replaceState({}, "", "/account");
    renderApp();

    fireEvent.change(await screen.findByLabelText("Email"), { target: { value: "ana@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(window.location.pathname).toBe("/"));
    const login = calls.find((call) => call.path === "/api/auth/login");
    expect(JSON.parse(String(login?.init?.body))).toEqual({
      email: "ana@example.test",
      password: "correct-horse"
    });
    expect(await screen.findByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("explains wrong credentials without saying which part was wrong", async () => {
    stubApi(null, (path) => (path === "/api/auth/login" ? json(401, { code: "invalid-credentials" }) : undefined));
    window.history.replaceState({}, "", "/account");
    renderApp();

    fireEvent.change(await screen.findByLabelText("Email"), { target: { value: "ana@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The email or password is not right.");
    expect(window.location.pathname).toBe("/account");
  });

  it("creates an account and reports a duplicate email", async () => {
    stubApi(null, (path) => (path === "/api/auth/register" ? json(409, { code: "email-already-registered" }) : undefined));
    window.history.replaceState({}, "", "/account");
    renderApp();

    fireEvent.click(await screen.findByRole("button", { name: "Create an account" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ana@example.test" } });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already has an account");
  });
});
