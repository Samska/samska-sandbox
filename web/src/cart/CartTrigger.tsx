import type { Ref } from "react";
import { formatAmount } from "../formatAmount";

export default function CartTrigger({
  itemCount,
  total,
  isOpen,
  onClick,
  buttonRef
}: {
  itemCount: number;
  total: number | null;
  isOpen: boolean;
  onClick: () => void;
  buttonRef: Ref<HTMLButtonElement>;
}) {
  const itemLabel = itemCount === 1 ? "item" : "items";
  const accessibleName =
    total === null ? "Cart" : `Cart, ${itemCount} ${itemLabel}, total ${formatAmount(total)}`;

  return (
    <button
      ref={buttonRef}
      type="button"
      className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm border-[1.5px] border-ink bg-brand px-4 font-mono text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-on-brand shadow-[0_3px_0_var(--color-ink)] hover:bg-ink hover:text-canvas active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-ink)]"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={accessibleName}
      onClick={onClick}
    >
      <span>Cart</span>
      {total === null ? null : (
        <span className="font-medium opacity-80">
          {itemCount}
          <span className="max-[29.99rem]:sr-only"> {itemLabel}</span> &middot; {formatAmount(total)}
        </span>
      )}
    </button>
  );
}
