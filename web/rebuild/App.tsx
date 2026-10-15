import { useCallback, useEffect, useReducer, useRef } from "react";
import { ProductsPage } from "./ProductsPage";
import {
  INITIAL_STATE,
  reducer as productsReducer
} from "./state";
import { createProduct, getProduct, listProducts } from "./transport/products";
import { fetchRuntimeIdentity } from "./transport/runtime";
import type { CreateProductInput, RequestError } from "./transport/types";

/**
 * The create POST is the only request that can be in flight exactly once.
 * A ref is used (instead of reducer state) so two submits dispatched in the
 * same tick cannot both pass the readiness check.
 *
 * Reads use a separate in-flight ref per slice so a stale read on one slice
 * (e.g. a list fetch superseded by a POST) cannot leave a different slice
 * (e.g. detail) stuck in "loading".
 */
export function App() {
  const [state, dispatch] = useReducer(productsReducer, INITIAL_STATE);
  const createInFlight = useRef<AbortController | null>(null);
  const listInFlight = useRef<AbortController | null>(null);
  const detailInFlight = useRef<AbortController | null>(null);
  const runtimeInFlight = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);

  const abortAllReads = useCallback(() => {
    listInFlight.current?.abort();
    listInFlight.current = null;
    detailInFlight.current?.abort();
    detailInFlight.current = null;
    runtimeInFlight.current?.abort();
    runtimeInFlight.current = null;
  }, []);

  const startCreate = useCallback((): AbortController | null => {
    if (submittingRef.current) {
      return null;
    }
    // Reads whose results would arrive after the mutation are stale; drop them.
    abortAllReads();
    const controller = new AbortController();
    createInFlight.current = controller;
    submittingRef.current = true;
    return controller;
  }, [abortAllReads]);

  const startListRead = useCallback((): AbortController => {
    listInFlight.current?.abort();
    const controller = new AbortController();
    listInFlight.current = controller;
    return controller;
  }, []);

  const startDetailRead = useCallback((): AbortController => {
    detailInFlight.current?.abort();
    const controller = new AbortController();
    detailInFlight.current = controller;
    return controller;
  }, []);

  const startRuntimeRead = useCallback((): AbortController => {
    runtimeInFlight.current?.abort();
    const controller = new AbortController();
    runtimeInFlight.current = controller;
    return controller;
  }, []);

  const finishCreate = useCallback(() => {
    submittingRef.current = false;
    createInFlight.current = null;
  }, []);

  const loadList = useCallback(() => {
    dispatch({ type: "list/load" });
    const controller = startListRead();
    listProducts(controller.signal)
      .then((products) => {
        if (controller.signal.aborted) {
          return;
        }
        dispatch({ type: "list/success", products });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          // Same reasoning as the detail read: a newer list read keeps its own
          // loading state, but an empty slot after a mutation means nobody will
          // resolve this one, so clear it instead of leaving a stuck spinner.
          if (
            listInFlight.current === controller ||
            listInFlight.current === null
          ) {
            dispatch({ type: "list/idle" });
          }
          return;
        }
        dispatch({ type: "list/error", error: asError(cause) });
      });
  }, [startListRead]);

  const refreshRuntime = useCallback(() => {
    dispatch({ type: "runtime/checking" });
    const controller = startRuntimeRead();
    fetchRuntimeIdentity("", controller.signal)
      .then((runtime) => {
        if (controller.signal.aborted) {
          return;
        }
        dispatch({ type: "runtime/status", runtime });
        if (runtime.kind === "ready") {
          loadList();
        }
      })
      .catch(() => {
        // Defensive: fetchRuntimeIdentity resolves instead of throwing.
      });
  }, [loadList, startRuntimeRead]);

  useEffect(() => {
    refreshRuntime();
    return () => {
      createInFlight.current?.abort();
      listInFlight.current?.abort();
      detailInFlight.current?.abort();
      runtimeInFlight.current?.abort();
      createInFlight.current = null;
      listInFlight.current = null;
      detailInFlight.current = null;
      runtimeInFlight.current = null;
      submittingRef.current = false;
    };
  }, [refreshRuntime]);

  const handleCreate = useCallback(
    (input: CreateProductInput) => {
      if (state.runtime.kind !== "ready") {
        return;
      }
      const controller = startCreate();
      if (!controller) {
        return;
      }
      const token = createToken();
      dispatch({ type: "create/submit", input, token });
      createProduct(input, controller.signal)
        .then((product) => {
          if (controller.signal.aborted) {
            return;
          }
          finishCreate();
          dispatch({ type: "create/success", product, token });
          // After a successful create, refetch the list so the collection
          // reflects the server's insertion order, not the local cache.
          loadList();
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) {
            return;
          }
          finishCreate();
          dispatch({ type: "create/error", error: asError(cause), token });
        });
    },
    [state.runtime.kind, startCreate, loadList, finishCreate]
  );

  const handleCreateReset = useCallback(() => {
    dispatch({ type: "create/reset" });
  }, []);

  const handleRefreshList = useCallback(() => {
    if (state.runtime.kind !== "ready") {
      return;
    }
    if (submittingRef.current) {
      // A POST is in flight; a parallel GET would race with the post-create
      // refresh and could show stale data. The create handler will refresh
      // the list on completion.
      return;
    }
    loadList();
  }, [state.runtime.kind, loadList]);

  const handleOpenDetail = useCallback(
    (productId: string, returnFocus: HTMLElement | null) => {
      dispatch({ type: "detail/open", productId, returnFocus });
      const controller = startDetailRead();
      getProduct(productId, controller.signal)
        .then((product) => {
          if (controller.signal.aborted) {
            return;
          }
          dispatch({ type: "detail/success", product, productId });
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) {
            // Aborted either by a newer detail read (whose slot must keep its
            // own loading state) or by a mutation that cleared the slot. When
            // the slot is empty or still ours, no owner remains, so clear the
            // loading state and never leave the detail stuck without a way back.
            if (
              detailInFlight.current === controller ||
              detailInFlight.current === null
            ) {
              dispatch({ type: "detail/idle" });
            }
            return;
          }
          dispatch({ type: "detail/error", error: asError(cause), productId });
        });
    },
    [startDetailRead]
  );

  const handleCloseDetail = useCallback(() => {
    detailInFlight.current?.abort();
    detailInFlight.current = null;
    dispatch({ type: "detail/close" });
  }, []);

  const handleRetryRuntime = useCallback(() => {
    refreshRuntime();
  }, [refreshRuntime]);

  return (
    <ProductsPage
      state={state}
      onSubmit={handleCreate}
      onCreateChange={(values) => dispatch({ type: "create/values", values })}
      onCreateReset={handleCreateReset}
      onRefreshList={handleRefreshList}
      onOpenDetail={handleOpenDetail}
      onCloseDetail={handleCloseDetail}
      onRetryRuntime={handleRetryRuntime}
    />
  );
}

function createToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tok-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function asError(cause: unknown): RequestError {
  if (
    typeof cause === "object" &&
    cause !== null &&
    "kind" in cause &&
    typeof (cause as { kind: unknown }).kind === "string"
  ) {
    return cause as RequestError;
  }
  return { kind: "network", message: "unexpected error" };
}