import type { ReactNode } from "react";

type StatusTone = "neutral" | "pending" | "success" | "error";

const toneClassName: Record<StatusTone, string> = {
  neutral: "border-border bg-surface text-muted",
  pending: "border-border bg-pending-surface text-ink",
  success: "border-success-border bg-success-surface text-success",
  error: "border-danger bg-surface text-danger"
};

export default function StatusMessage({
  tone,
  children
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  const isError = tone === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      aria-live={isError ? undefined : "polite"}
      className={`rounded-sm border px-4 py-3.5 font-bold ${toneClassName[tone]}`}
    >
      {children}
    </p>
  );
}
