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
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand bg-brand px-4 text-sm font-extrabold text-white hover:border-brand-dark hover:bg-brand-dark"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={accessibleName}
      onClick={onClick}
    >
      <span>Cart</span>
      {total === null ? null : (
        <span className="font-bold text-white/80">
          {itemCount} {itemLabel} &middot; {formatAmount(total)}
        </span>
      )}
    </button>
  );
}
