import Catalog from "./catalog/Catalog";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="absolute left-3 top-3 z-[2] -translate-y-[200%] rounded-sm bg-ink px-3.5 py-2.5 text-white focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[3.75rem] w-[min(100%-2.5rem,76rem)] items-center justify-between gap-6">
          <a
            className="inline-flex items-center gap-2.5 font-extrabold text-ink no-underline"
            href="#main-content"
            aria-label="Samska market"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-md bg-brand text-sm font-extrabold text-white"
            >
              S
            </span>
            <span className="text-[1.05rem] tracking-[-0.02em]">Samska</span>
            <span className="border-l border-border pl-2.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">
              market
            </span>
          </a>
        </div>
      </header>
      <main
        className="mx-auto w-[min(100%-2.5rem,76rem)] flex-1 py-[clamp(1.25rem,3vw,2.25rem)]"
        id="main-content"
        tabIndex={-1}
      >
        <Catalog />
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-[min(100%-2.5rem,76rem)] flex-wrap items-center justify-between gap-2 py-6 text-sm text-muted">
          <p className="font-bold text-ink">Samska Market</p>
          <p>A fictional storefront for engineering practice. Product and Cart data reset when the server restarts.</p>
        </div>
      </footer>
    </div>
  );
}
