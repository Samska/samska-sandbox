import { useSyncExternalStore } from "react";

export const marketPath = "/";
export const checkoutPath = "/checkout";

const attemptPathPattern = /^\/checkout\/attempts\/([^/]+)$/;
const attemptIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAttemptId(value: string): boolean {
  return attemptIdPattern.test(value);
}

export function attemptPath(attemptId: string): string {
  return `/checkout/attempts/${encodeURIComponent(attemptId)}`;
}

export function attemptIdForPath(path: string): string | null {
  const match = attemptPathPattern.exec(path);

  if (match === null) {
    return null;
  }

  try {
    const attemptId = decodeURIComponent(match[1]);
    return isAttemptId(attemptId) ? attemptId : null;
  } catch {
    return null;
  }
}

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
