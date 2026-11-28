import { useSyncExternalStore } from "react";

export const marketPath = "/";
export const checkoutPath = "/checkout";

export function normalizedPath(): string {
  return window.location.pathname.replace(/\/+$/, "") || marketPath;
}

export function navigateTo(path: string, options: { replace?: boolean } = {}): boolean {
  try {
    if (options.replace === true) {
      window.history.replaceState({}, "", path);
    } else if (normalizedPath() !== path) {
      window.history.pushState({}, "", path);
    }

    emitPathChange();
    return true;
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();

function emitPathChange() {
  for (const listener of [...listeners]) {
    listener();
  }
}

window.addEventListener("popstate", emitPathChange);

function subscribeToPath(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function usePath(): string {
  return useSyncExternalStore(subscribeToPath, normalizedPath);
}
