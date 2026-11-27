import type { ShipmentStatus } from "./ordersApi";
import { statusLabel, statusTone } from "./shipmentText";

const toneClassName = {
  success: "border-success-border bg-success-surface text-success",
  pending: "border-ink bg-pending-surface text-ink",
  error: "border-danger bg-surface text-danger"
} as const;

export default function StatusPill({ status }: { status: ShipmentStatus }) {
  return (
    <span
      className={`inline-block rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.06em] ${toneClassName[statusTone(status)]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
