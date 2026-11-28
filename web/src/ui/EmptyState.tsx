import type { ComponentProps, ReactNode } from "react";

// The Bench "empty" block: a dashed ink outline, centred, with the box icon, a title, a note and one action.
export default function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-2.5 rounded-sm border-[1.5px] border-dashed border-ink bg-surface px-5 py-10 text-center">
      <svg
        className="h-14 w-14 text-ink"
        viewBox="0 0 72 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        aria-hidden="true"
      >
        <path d="M10 24 36 10l26 14v26L36 64 10 50z" />
        <path d="M10 24l26 14 26-14M36 38v26" />
      </svg>
      {children}
    </div>
  );
}

export function EmptyTitle({
  as = "p",
  className = "",
  ...props
}: ComponentProps<"h2"> & { as?: "p" | "h2" | "h3" }) {
  const Tag = as as "h2";
  return (
    <Tag className={`text-xl font-extrabold tracking-[-0.01em] text-ink ${className}`} {...props} />
  );
}

export function EmptyNote({ className = "", ...props }: ComponentProps<"p">) {
  return <p className={`max-w-prose text-muted ${className}`} {...props} />;
}

export const emptyActionClassName =
  "inline-flex min-h-11 items-center justify-center rounded-sm border-[1.5px] border-ink bg-brand px-4 py-2.5 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-on-brand no-underline shadow-[0_3px_0_var(--color-ink)] hover:bg-ink hover:text-canvas";
