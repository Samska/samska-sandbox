import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Header navigation. From 40rem up it is the inline link row. Below that the links, account and theme controls
 * sit in a panel under the header, opened by a Menu button (SS-083). There is a single nav element, so links
 * are never duplicated for assistive technology.
 */
export default function HeaderMenu({
  label,
  inverted = false,
  children
}: {
  label: string;
  inverted?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const edge = inverted ? "border-canvas" : "border-ink";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-sm border-[1.5px] bg-transparent px-3 font-mono text-[0.8rem] font-medium uppercase tracking-[0.06em] min-[40rem]:hidden ${edge}`}
      >
        <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px]">
          <path
            d={open ? "M3 3l12 12M15 3L3 15" : "M2 5h14M2 9h14M2 13h14"}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        {open ? "Close" : "Menu"}
      </button>
      <nav
        id={panelId}
        aria-label={label}
        className={`${
          open
            ? "order-last flex basis-full flex-col gap-1 border-t-[1.5px] pb-4 pt-2"
            : "hidden"
        } ${edge} min-[40rem]:order-none min-[40rem]:flex min-[40rem]:basis-auto min-[40rem]:flex-row min-[40rem]:flex-wrap min-[40rem]:items-center min-[40rem]:justify-end min-[40rem]:gap-1 min-[40rem]:border-0 min-[40rem]:p-0`}
      >
        {children}
      </nav>
    </>
  );
}
