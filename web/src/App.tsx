import AdminProductCreate from "./admin/AdminProductCreate";
import AdminProductEdit from "./admin/AdminProductEdit";
import AdminProducts from "./admin/AdminProducts";
import Catalog from "./catalog/Catalog";
import NotFound from "./NotFound";
import { attemptIdForPath, checkoutPath, marketPath, usePath } from "./journey/routes";

const adminProductsPath = "/admin/products";
const adminProductNewPath = "/admin/products/new";
const adminProductEditPattern = /^\/admin\/products\/([^/]+)\/edit$/;

export default function App() {
  const path = usePath();
  const isMarket = path === marketPath;
  const isStorefront = isMarket || path === checkoutPath || attemptIdForPath(path) !== null;
  const isAdmin =
    path === adminProductsPath || path.startsWith(`${adminProductsPath}/`);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="absolute left-3 top-3 z-[2] -translate-y-[200%] rounded-sm bg-ink px-3.5 py-2.5 text-canvas focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[3.75rem] w-[min(100%-2.5rem,76rem)] items-center justify-between gap-6">
          <a
            className="inline-flex items-center gap-2.5 font-extrabold text-ink no-underline"
            href="/"
            aria-label="Samska Sandbox home"
          >
            <span aria-hidden="true" className="relative mr-2 h-3.5 w-3.5 rounded-full bg-brand">
              <span className="absolute left-2.5 top-0 h-3.5 w-3.5 rounded-full bg-pop mix-blend-normal" />
            </span>
            <span className="font-display text-[1.45rem] font-extrabold tracking-[-0.04em]">samska</span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-1">
            <a
              className={navLinkClassName(isStorefront)}
              href="/"
              aria-current={isStorefront ? "page" : undefined}
            >
              Market
            </a>
            <a
              className={navLinkClassName(isAdmin)}
              href="/admin/products"
              aria-current={isAdmin ? "page" : undefined}
            >
              Admin
            </a>
          </nav>
        </div>
      </header>
      <main
        className="mx-auto w-[min(100%-2.5rem,76rem)] flex-1 py-[clamp(1.25rem,3vw,2.25rem)]"
        id="main-content"
        tabIndex={-1}
      >
        {renderSurface(path)}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-[min(100%-2.5rem,76rem)] flex-wrap items-center justify-between gap-2 py-6 text-sm text-muted">
          <p className="font-bold text-ink">Samska Sandbox</p>
          <p>A fictional storefront for engineering practice. Product and Cart data reset when the server restarts.</p>
        </div>
      </footer>
    </div>
  );
}

function renderSurface(path: string) {
  if (path === marketPath || path === checkoutPath || attemptIdForPath(path) !== null) {
    return <Catalog />;
  }

  if (path === adminProductsPath) {
    return <AdminProducts />;
  }

  if (path === adminProductNewPath) {
    return <AdminProductCreate />;
  }

  const editMatch = adminProductEditPattern.exec(path);

  if (editMatch !== null) {
    const productId = decodePathSegment(editMatch[1]);

    if (productId !== null) {
      return <AdminProductEdit productId={productId} />;
    }
  }

  return <NotFound />;
}

function decodePathSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function navLinkClassName(isCurrent: boolean): string {
  return `rounded-full border px-4 py-2.5 text-sm font-bold no-underline ${
    isCurrent
      ? "border-ink bg-ink text-canvas"
      : "border-border bg-surface text-ink hover:border-border-strong"
  }`;
}
