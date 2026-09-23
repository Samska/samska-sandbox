import { useEffect, useRef, type KeyboardEvent } from "react";
import CartPanel from "./Cart";
import type { CartResponse } from "./cartApi";

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  isPending,
  error,
  onRetry,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: {
  isOpen: boolean;
  onClose: () => void;
  cart: CartResponse | null;
  isPending: boolean;
  error: string | null;
  onRetry: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
  onCheckout?: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    headingRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dialog = dialogRef.current;

    if (dialog === null) {
      return;
    }

    const activeElement = document.activeElement;
    const activeElementIsDisabled =
      activeElement instanceof HTMLButtonElement ||
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLSelectElement ||
      activeElement instanceof HTMLTextAreaElement
        ? activeElement.disabled
        : false;

    if (dialog.contains(activeElement) && !activeElementIsDisabled) {
      return;
    }

    dialog.querySelector<HTMLElement>(focusableSelector)?.focus();
  }, [isOpen, isPending]);

  if (!isOpen) {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      onClose();
      return;
    }

    if (event.key !== "Tab" || dialogRef.current === null) {
      return;
    }

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
    );

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && (activeElement === first || !focusable.includes(activeElement as HTMLElement))) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-30 flex h-dvh justify-end max-[44rem]:items-end"
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
        className="relative flex h-full w-full max-w-sm flex-col border-l border-border-strong bg-cart-surface shadow-card max-[44rem]:h-auto max-[44rem]:max-h-[88dvh] max-[44rem]:max-w-none max-[44rem]:rounded-t-2xl max-[44rem]:border-l-0 max-[44rem]:border-t max-[44rem]:pb-[env(safe-area-inset-bottom)]"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <CartPanel
            cart={cart}
            isPending={isPending}
            error={error}
            onRetry={onRetry}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            headingRef={headingRef}
            onClose={onClose}
            onCheckout={onCheckout}
          />
        </div>
      </div>
    </div>
  );
}
