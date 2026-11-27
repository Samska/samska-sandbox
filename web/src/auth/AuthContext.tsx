import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { currentAccount, signOut as signOutRequest, type Account } from "./authApi";
import { unauthorizedEvent } from "../http";

/**
 * "local" means no AuthProvider is mounted (component tests): nothing is gated. "loading" is the
 * first read of the session; the application never treats a visitor as anonymous before it ends.
 */
export type AuthState =
  | { status: "local" }
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "signed-in"; account: Account };

export interface AuthValue {
  state: AuthState;
  setAccount: (account: Account | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  state: { status: "local" },
  setAccount: () => undefined,
  signOut: async () => undefined
});

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const setAccount = useCallback((account: Account | null) => {
    setState(account === null ? { status: "anonymous" } : { status: "signed-in", account });
  }, []);

  useEffect(() => {
    let active = true;

    const refresh = () => {
      currentAccount().then(
        (account) => active && setAccount(account),
        () => active && setAccount(null)
      );
    };

    refresh();
    window.addEventListener(unauthorizedEvent, refresh);

    return () => {
      active = false;
      window.removeEventListener(unauthorizedEvent, refresh);
    };
  }, [setAccount]);

  const signOut = useCallback(async () => {
    try {
      await signOutRequest();
    } finally {
      setAccount(null);
    }
  }, [setAccount]);

  const value = useMemo(() => ({ state, setAccount, signOut }), [state, setAccount, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
