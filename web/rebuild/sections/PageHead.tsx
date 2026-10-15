import type { RuntimeStatus } from "../transport/types";

interface PageHeadProps {
  runtime: RuntimeStatus;
  onRetryRuntime(): void;
}

/**
 * Top of the page: the unique h1 ("Products") and the partial-candidate
 * notice (when ready) or the runtime banner (when not). Count and refresh
 * live with the catalog section so the heading hierarchy is
 * h1 → h2(catalog) → h3(cards) → h2(creation) → h2(detail).
 */
export function PageHead({ runtime, onRetryRuntime }: PageHeadProps) {
  return (
    <div className="page-head">
      <h1 className="display-title">Products</h1>
      {runtime.kind === "ready" ? (
        <p className="partial-notice" data-testid="partial-notice">
          R1 candidate — partial scope, in-memory only. Create, list and detail
          Product only.
        </p>
      ) : (
        <RuntimeBanner runtime={runtime} onRetry={onRetryRuntime} />
      )}
    </div>
  );
}

function RuntimeBanner({
  runtime,
  onRetry
}: {
  runtime: RuntimeStatus;
  onRetry(): void;
}) {
  const message = (() => {
    switch (runtime.kind) {
      case "unknown":
        return "Checking candidate backend…";
      case "checking":
        return "Checking candidate backend…";
      case "mismatch":
        return `Candidate backend reports runtime "${runtime.observed}", expected "rebuild-r1".`;
      case "unavailable":
        return `Candidate backend unavailable: ${runtime.reason}`;
    }
  })();
  return (
    <div
      role="status"
      aria-live="polite"
      className="runtime-banner"
      data-testid="runtime-banner"
    >
      <p className="runtime-banner__text">{message}</p>
      <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
        Retry runtime check
      </button>
    </div>
  );
}