import { useState } from "react";
import Button from "../ui/Button";
import {
  abandonConfirmLabel,
  abandonWarning,
  keepReferenceLabel,
  paymentInProgressNote
} from "./messages";
import { attemptPath } from "./routes";

/** A slim notice shown only while the latest payment attempt has no final result. */
export default function LatestJourneyLink({
  reference,
  busy,
  onOpen,
  onAbandon
}: {
  reference: string;
  busy: boolean;
  onOpen: () => void;
  onAbandon: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <aside
      className="grid min-w-0 gap-3 rounded-sm border-[1.5px] border-l-[6px] border-ink border-l-brand bg-surface px-4 py-3"
      aria-label="Payment not finished"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="grid min-w-0 gap-0.5">
          <strong className="font-black uppercase [font-stretch:90%]">Payment not finished</strong>
          <span className="text-sm text-muted">
            {busy ? paymentInProgressNote : "Your last simulated payment has no confirmed result yet."}
          </span>
        </div>
        {isConfirming ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <a
              className="inline-flex min-h-10 items-center justify-center rounded-sm border-[1.5px] border-ink bg-brand px-3 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-on-brand no-underline shadow-[0_3px_0_var(--color-ink)]"
              href={attemptPath(reference)}
              onClick={(event) => {
                event.preventDefault();
                onOpen();
              }}
            >
              Resume payment
            </a>
            {busy ? null : (
              <Button variant="secondary" size="sm" onClick={() => setIsConfirming(true)}>
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
      {isConfirming ? (
        <div className="grid gap-2">
          <p className="max-w-prose text-sm text-muted">{abandonWarning}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={onAbandon}>
              {abandonConfirmLabel}
            </Button>
            <Button variant="quiet" size="sm" onClick={() => setIsConfirming(false)}>
              {keepReferenceLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
