import Catalog from "./catalog/Catalog";

export default function App() {
  return (
    <div className="min-h-screen">
      <a
        className="absolute left-3 top-3 z-[2] -translate-y-[200%] rounded-sm bg-ink px-3.5 py-2.5 text-white focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-[3.75rem] w-[min(100%-2.5rem,76rem)] items-center justify-between gap-6">
          <a className="inline-flex items-center gap-2.5 font-extrabold text-ink no-underline" href="#main-content" aria-label="Samska market">
            <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-md bg-brand text-white">
              S
            </span>
            <span className="text-[1.05rem] tracking-[-0.02em]">Samska</span>
            <span className="border-l border-border pl-2.5 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-muted">
              market
            </span>
          </a>
          <a
            className="rounded-full border border-border-strong px-3.5 py-2 text-[0.9375rem] font-extrabold text-brand-dark no-underline hover:bg-brand hover:text-white hover:border-brand"
            href="#cart"
          >
            Cart
          </a>
        </div>
      </header>
      <main className="mx-auto w-[min(100%-2.5rem,76rem)] py-[clamp(1.5rem,3vw,2.5rem)] pb-16 pt-[clamp(1.5rem,3vw,2.5rem)]" id="main-content" tabIndex={-1}>
        <Catalog />
      </main>
    </div>
  );
}
