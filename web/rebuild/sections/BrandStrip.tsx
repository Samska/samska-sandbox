import type { RuntimeStatus } from "../transport/types";

interface BrandStripProps {
  runtime: RuntimeStatus;
}

export function BrandStrip({ runtime }: BrandStripProps) {
  return (
    <div className="brand-strip" role="banner">
      <div className="brand-mark" aria-label="Samska · Paper & ink · R1 candidate">
        <span className="brand-mark__symbol" aria-hidden="true" />
        <span>Samska</span>
        <span className="brand-mark__divider" aria-hidden="true">
          /
        </span>
        <span className="brand-mark__candidate">R1 candidate</span>
      </div>
      <RuntimeIndicator runtime={runtime} />
    </div>
  );
}

function RuntimeIndicator({ runtime }: { runtime: RuntimeStatus }) {
  const label = (() => {
    switch (runtime.kind) {
      case "ready":
        return "Candidate online";
      case "checking":
        return "Checking candidate";
      case "unknown":
        return "Checking candidate";
      case "mismatch":
        return "Wrong runtime";
      case "unavailable":
        return "Candidate offline";
    }
  })();
  const dotClass = `brand-status__dot brand-status__dot--${runtime.kind}`;
  return (
    <div
      className="brand-status"
      aria-label={`Runtime status: ${label}`}
      data-testid="runtime-status"
    >
      <span className={dotClass} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}