import { useState } from "react";
import Button from "../ui/Button";
import {
  abandonConfirmLabel,
  abandonWarning,
  keepReferenceLabel,
  paymentInProgressNote
} from "./messages";
import { attemptPath } from "./routes";

export default function LatestJourneyLink({
  reference,
  unresolved,
  busy,
  onOpen,
  onAbandon,
  onForget
}: {
  reference: string;
  unresolved: boolean;
  busy: boolean;
  onOpen: () => void;
  onAbandon: () => void;
  onForget: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <section
      className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3"
      aria-label="Latest journey"
    >
      <div className="grid min-w-0 gap-0.5">
        <a
          className="w-fit font-bold text-brand-dark"
          href={attemptPath(reference)}
          onClick={(event) => {
            event.preventDefault();
            onOpen();
          }}
        >
          View latest journey
        </a>
        {busy ? <span className="text-sm text-muted">{paymentInProgressNote}</span> : null}
      </div>
      {busy ? null : isConfirming ? (
        <div className="grid gap-2">
          <p className="max-w-prose text-sm text-muted">{abandonWarning}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="quiet" onClick={onAbandon}>
              {abandonConfirmLabel}
            </Button>
            <Button variant="quiet" onClick={() => setIsConfirming(false)}>
              {keepReferenceLabel}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="quiet"
          onClick={() => {
            if (unresolved) {
              setIsConfirming(true);
              return;
            }

            onForget();
          }}
        >
          Forget latest reference
        </Button>
      )}
    </section>
  );
}
