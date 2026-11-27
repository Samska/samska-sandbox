import { useEffect, useRef } from "react";

export default function NotFound() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="grid max-w-prose gap-4 rounded-sm border-[1.5px] border-ink bg-surface p-6"
      aria-labelledby="not-found-heading"
    >
      <p className="font-mono text-[0.75rem] font-medium uppercase tracking-[0.14em] text-muted">
        Page not found
      </p>
      <h1
        id="not-found-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.15] tracking-[-0.025em] text-ink"
      >
        This page does not exist
      </h1>
      <p className="text-muted">
        The address you opened is not part of this application. Check the link or return to the
        Market to keep browsing Products.
      </p>
      <a className="w-fit font-bold text-brand-dark underline decoration-brand decoration-2 underline-offset-4" href="/">
        Go to Market
      </a>
    </section>
  );
}
