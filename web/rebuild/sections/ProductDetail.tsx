import { useEffect, useMemo, useRef } from "react";
import type { DetailSlice } from "../state";
import { Monogram } from "../ui/Monogram";
import { formatAmount } from "../formatAmount";
import { humaniseReadError } from "../messages";

interface ProductDetailProps {
  slice: DetailSlice;
  onClose(): void;
}

export function ProductDetail({ slice, onClose }: ProductDetailProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const wasOpen = useRef(false);
  // Preserved across the close transition: the reducer clears returnFocus
  // on detail/close, so the focus-return effect needs a stable handle.
  const lastReturnFocus = useRef<HTMLElement | null>(null);

  const open = slice.status !== "idle" && slice.productId !== null;
  const shouldFocusHeading = useMemo(
    () => open && slice.status === "success",
    [open, slice.status]
  );

  useEffect(() => {
    if (slice.returnFocus) {
      lastReturnFocus.current = slice.returnFocus;
    }
  }, [slice.returnFocus]);

  useEffect(() => {
    if (shouldFocusHeading) {
      // Bring the heading into view so the user sees the result of
      // "View details" immediately. block:'start' is used deliberately: the
      // panel lands at the top of the viewport regardless of how tall the
      // catalogue happens to be.
      const node = headingRef.current;
      if (node) {
        node.focus();
        const reduceMotion =
          typeof window !== "undefined" &&
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (typeof node.scrollIntoView === "function") {
          node.scrollIntoView({
            block: "start",
            behavior: reduceMotion ? "auto" : "smooth"
          });
        }
      }
      wasOpen.current = true;
    }
  }, [shouldFocusHeading]);

  useEffect(() => {
    if (!open && wasOpen.current) {
      wasOpen.current = false;
      const target = lastReturnFocus.current;
      lastReturnFocus.current = null;
      if (target && document.contains(target)) {
        target.focus();
      }
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <section
      aria-labelledby="product-detail-heading"
      className="detail"
      data-testid="detail-section"
    >
      {slice.status === "loading" ? (
        <p
          className="list-state"
          style={{ gridColumn: "1 / -1" }}
          data-testid="detail-loading"
        >
          Loading product…
        </p>
      ) : null}
      {slice.status === "error" && slice.error ? (
        <div
          className="list-state list-state--error"
          style={{ gridColumn: "1 / -1" }}
          data-testid="detail-error"
        >
          <p>{humaniseReadError(slice.error)}</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
          >
            Back to Products
          </button>
        </div>
      ) : null}
      {slice.status === "success" && slice.product ? (
        <DetailView
          product={slice.product}
          headingRef={headingRef}
          onClose={onClose}
        />
      ) : null}
    </section>
  );
}

function DetailView({
  product,
  headingRef,
  onClose
}: {
  product: { id: string; name: string; description: string; price: number };
  headingRef: React.MutableRefObject<HTMLHeadingElement | null>;
  onClose(): void;
}) {
  return (
    <>
      <Monogram name={product.name} size="detail" />
      <div className="detail__body">
        <div className="detail__head">
          <h2
            id="product-detail-heading"
            ref={headingRef}
            tabIndex={-1}
            className="detail-heading"
            data-testid="detail-heading"
          >
            {product.name}
          </h2>
        </div>
        <p
          className="detail-description"
          data-testid="detail-description"
        >
          {product.description}
        </p>
        <p className="detail-price" data-testid="detail-price">
          {formatAmount(product.price)}
        </p>
        <p className="detail-id">ID: {product.id}</p>
      </div>
      <div className="detail__back">
        <button
          type="button"
          className="btn btn--text"
          onClick={onClose}
          data-testid="back-to-products"
        >
          ← Back to Products
        </button>
      </div>
    </>
  );
}