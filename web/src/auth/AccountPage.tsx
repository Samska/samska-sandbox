import { useRef, useState, type FormEvent } from "react";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import StatusMessage from "../ui/StatusMessage";
import { navigateTo } from "../journey/routes";
import { AuthApiError, signIn } from "./authApi";
import { useAuth } from "./AuthContext";

export const accountPath = "/account";

const errorMessages = {
  invalid: "Check the details: use a valid email and a password.",
  credentials: "The email or password is not right.",
  network: "The server could not be reached. Try again.",
  server: "Something went wrong. Try again."
} as const;

export default function AccountPage({ notice }: { notice?: string }) {
  const { state, setAccount } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const account = await signIn(email, password);
      setAccount(account);
      navigateTo(account.role === "ADMIN" ? "/admin/products" : "/");
    } catch (caught) {
      setError(errorMessages[caught instanceof AuthApiError ? caught.kind : "server"]);
    } finally {
      setPending(false);
    }
  }

  if (state.status === "signed-in") {
    return (
      <section className="grid gap-4">
        <h1 ref={headingRef} className="text-4xl font-black uppercase">
          Signed in
        </h1>
        <p>
          You are signed in as <strong>{state.account.displayName}</strong> ({state.account.email}).
        </p>
        <p>
          <a className="font-bold underline" href="/">
            Back to the market
          </a>
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.25fr_1fr]">
      <section className="grid content-start gap-4 rounded-sm bg-ink p-[clamp(1.4rem,4vw,2.75rem)] text-canvas">
        <span className="font-mono text-base tracking-[0.06em] text-brand">MEMBER AREA</span>
        <h1 className="text-[clamp(2.4rem,6vw,4.4rem)] font-black uppercase leading-none">
          Sign in
        </h1>
        <p>This store is private. Sign in to manage the catalog or to check out.</p>
      </section>
      <section className="grid content-start gap-4 rounded-sm border-[1.5px] border-ink bg-surface p-5">
        {notice !== undefined ? <StatusMessage tone="neutral">{notice}</StatusMessage> : null}
        <h2 className="text-2xl font-black uppercase">Welcome back</h2>
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <FormField id="account-email" label="Email" error={null}>
            {(control) => (
              <input
                {...control}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.test"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={pending}
                required
              />
            )}
          </FormField>
          <FormField id="account-password" label="Password" error={null}>
            {(control) => (
              <input
                {...control}
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={pending}
                required
              />
            )}
          </FormField>
          {error !== null ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Working..." : "Sign in"}
          </Button>
        </form>
      </section>
    </div>
  );
}
