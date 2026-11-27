import type { ReactNode } from "react";
import AdminProductCreate from "./admin/AdminProductCreate";
import AdminProductEdit from "./admin/AdminProductEdit";
import AdminProducts from "./admin/AdminProducts";
import Catalog from "./catalog/Catalog";
import AccountPage, { accountPath } from "./auth/AccountPage";
import { useAuth, type AuthState } from "./auth/AuthContext";
import Button from "./ui/Button";
import StatusMessage from "./ui/StatusMessage";
import DemoBanner from "./demo/DemoBanner";
import ThemeToggle from "./theme/ThemeToggle";
import OperationsPage, { operationsPath } from "./operations/OperationsPage";
import OrdersPage, { ordersPath } from "./orders/OrdersPage";
import TrackingPage from "./orders/TrackingPage";
import NotFound from "./NotFound";
import { attemptIdForPath, checkoutPath, marketPath, usePath } from "./journey/routes";

const adminProductsPath = "/admin/products";
const adminProductNewPath = "/admin/products/new";
const orderTrackingPattern = /^\/orders\/([^/]+)$/;
const adminProductEditPattern = /^\/admin\/products\/([^/]+)\/edit$/;

export default function App() {
  const path = usePath();
  const auth = useAuth();
  const canAdminister =
    auth.state.status === "local" ||
    (auth.state.status === "signed-in" && auth.state.account.role === "ADMIN");
  const isMarket = path === marketPath;
  const isStorefront = isMarket || path === checkoutPath || attemptIdForPath(path) !== null;
  const isOrders = path === ordersPath || path.startsWith(`${ordersPath}/`);
  const isAdmin =
    path === adminProductsPath || path.startsWith(`${adminProductsPath}/`);
  const isOperations = path === operationsPath;
  const inAdminArea = isAdmin || isOperations || path.startsWith("/admin/");

  if (inAdminArea && canAdminister) {
    return (
      <AdminShell path={path} auth={auth.state} onSignOut={auth.signOut}>
        {renderSurface(path, auth.state)}
      </AdminShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="absolute left-3 top-3 z-[2] -translate-y-[200%] rounded-sm bg-ink px-3.5 py-2.5 text-canvas focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <DemoBanner />
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[3.75rem] w-[min(100%-2.5rem,76rem)] flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1 sm:gap-x-6">
          <a
            className="inline-flex items-center gap-2.5 text-ink no-underline"
            href="/"
            aria-label="Samska Sandbox home"
          >
            <svg aria-hidden="true" viewBox="0 0 34 34" className="h-8 w-8 flex-none">
              <circle cx="17" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <circle cx="17" cy="17" r="7" className="fill-brand" stroke="currentColor" strokeWidth="2" />
              <path d="M17 0v6M17 28v6M0 17h6M28 17h6" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-[1.3rem] font-black uppercase tracking-[0.02em] [font-stretch:125%]">
              Samska
            </span>
            <span
              aria-hidden="true"
              className="self-start rounded-[3px] border-[1.5px] border-ink px-1.5 font-mono text-[0.6rem] font-medium tracking-[0.14em] max-[34rem]:hidden"
            >
              STORE
            </span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1">
            <a
              className={navLinkClassName(isStorefront)}
              href="/"
              aria-current={isStorefront ? "page" : undefined}
            >
              Market
            </a>
            {canAdminister ? (
              <a
                className={navLinkClassName(isAdmin)}
                href="/admin/products"
                aria-current={isAdmin ? "page" : undefined}
              >
                Admin
              </a>
            ) : null}
            {auth.state.status === "signed-in" ? (
              <a
                className={navLinkClassName(isOrders)}
                href={ordersPath}
                aria-current={isOrders ? "page" : undefined}
              >
                Orders
              </a>
            ) : null}
            <AccountControls state={auth.state} onSignOut={auth.signOut} isCurrent={path === accountPath} />
            <span className="ml-1 sm:ml-2">
              <ThemeToggle />
            </span>
          </nav>
        </div>
      </header>
      <main
        className="mx-auto w-[min(100%-2.5rem,76rem)] flex-1 py-[clamp(1.25rem,3vw,2.25rem)]"
        id="main-content"
        tabIndex={-1}
      >
        {renderSurface(path, auth.state)}
      </main>
      <footer className="border-t-2 border-ink bg-surface">
        <div className="mx-auto flex w-[min(100%-2.5rem,76rem)] flex-wrap items-center justify-between gap-2 py-6 text-sm text-muted">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink">Samska Sandbox</p>
          <p>A fictional storefront for engineering practice. Product and Cart data reset when the server restarts.</p>
        </div>
      </footer>
    </div>
  );
}

/** The manageable area: its own header and navigation, with no storefront or Cart links. */
function AdminShell({
  path,
  auth,
  onSignOut,
  children
}: {
  path: string;
  auth: AuthState;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const inOperations = path === operationsPath;
  const inProducts = !inOperations;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="absolute left-3 top-3 z-[2] -translate-y-[200%] rounded-sm bg-ink px-3.5 py-2.5 text-canvas focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <DemoBanner />
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-ink text-canvas">
        <div className="mx-auto flex min-h-[3.75rem] w-[min(100%-2.5rem,76rem)] flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1 sm:gap-x-6">
          <a className="inline-flex items-center gap-2.5 text-canvas no-underline" href={adminProductsPath} aria-label="Samska Admin home">
            <span className="text-[1.3rem] font-black uppercase tracking-[0.02em] [font-stretch:125%]">Samska</span>
            <span className="self-start rounded-[3px] border-[1.5px] border-canvas px-1.5 font-mono text-[0.6rem] font-medium tracking-[0.14em]">
              ADMIN
            </span>
          </a>
          <nav aria-label="Admin" className="flex flex-wrap items-center gap-0.5 sm:gap-1">
            <a className={adminNavClassName(inProducts)} href={adminProductsPath} aria-current={inProducts ? "page" : undefined}>
              Products
            </a>
            <a className={adminNavClassName(inOperations)} href={operationsPath} aria-current={inOperations ? "page" : undefined}>
              Operations
            </a>
            <a className={adminNavClassName(false)} href="/">
              View store
            </a>
            {auth.status === "signed-in" ? (
              <Button
                className="max-[34rem]:px-2"
                variant="secondary"
                size="sm"
                onClick={() => void onSignOut().then(() => window.location.assign("/"))}
              >
                Sign out
              </Button>
            ) : null}
            <span className="ml-1 sm:ml-2">
              <ThemeToggle inverted />
            </span>
          </nav>
        </div>
      </header>
      <main
        className="mx-auto w-[min(100%-2.5rem,76rem)] flex-1 py-[clamp(1.25rem,3vw,2.25rem)]"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}

function adminNavClassName(isCurrent: boolean): string {
  return `rounded-sm border-[1.5px] px-2 py-2.5 font-mono text-[0.8rem] font-medium uppercase tracking-[0.06em] no-underline sm:px-3 ${
    isCurrent ? "border-canvas bg-canvas text-ink" : "border-transparent text-canvas hover:border-canvas"
  }`;
}

function AccountControls({
  state,
  onSignOut,
  isCurrent
}: {
  state: AuthState;
  onSignOut: () => Promise<void>;
  isCurrent: boolean;
}) {
  if (state.status === "signed-in") {
    return (
      <>
        <span className="max-w-[10rem] truncate px-2 font-mono text-[0.75rem] text-muted max-[40rem]:hidden">
          {state.account.displayName}
        </span>
        <Button className="max-[34rem]:px-2" variant="secondary" size="sm" onClick={() => void onSignOut().then(() => window.location.assign("/"))}>
          Sign out
        </Button>
      </>
    );
  }

  if (state.status === "anonymous") {
    return (
      <a
        className={navLinkClassName(isCurrent)}
        href={accountPath}
        aria-current={isCurrent ? "page" : undefined}
      >
        Sign in
      </a>
    );
  }

  return null;
}

function renderSurface(path: string, auth: AuthState) {
  if (path === accountPath) {
    return <AccountPage />;
  }

  const isCheckout = path === checkoutPath || attemptIdForPath(path) !== null;
  const orderMatch = orderTrackingPattern.exec(path);
  const isOrdersPath = path === ordersPath || orderMatch !== null;
  const isOperationsPath = path === operationsPath;
  const isAdminPath =
    path === adminProductsPath || path.startsWith(`${adminProductsPath}/`) || isOperationsPath;

  if ((isCheckout || isAdminPath || isOrdersPath) && auth.status === "loading") {
    return <StatusMessage tone="pending">Checking your session...</StatusMessage>;
  }

  if ((isCheckout || isAdminPath || isOrdersPath) && auth.status === "anonymous") {
    return (
      <AccountPage
        notice={
          isAdminPath
            ? "Sign in with the administrator account to manage the store."
            : isOrdersPath
              ? "Sign in to see your orders."
              : "Sign in to check out."
        }
      />
    );
  }

  if (path === ordersPath) {
    return <OrdersPage />;
  }

  if (orderMatch !== null) {
    const orderId = decodePathSegment(orderMatch[1]);

    if (orderId !== null) {
      return <TrackingPage orderId={orderId} />;
    }
  }

  if (isAdminPath && auth.status === "signed-in" && auth.account.role !== "ADMIN") {
    return (
      <section className="grid gap-3">
        <h1 className="text-4xl font-black uppercase">Not allowed</h1>
        <p>Your account cannot manage the store.</p>
        <p>
          <a className="font-bold underline" href="/">
            Back to the market
          </a>
        </p>
      </section>
    );
  }

  if (path === marketPath || path === checkoutPath || attemptIdForPath(path) !== null) {
    return <Catalog />;
  }

  if (isOperationsPath) {
    return <OperationsPage />;
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
  return `rounded-sm border-[1.5px] px-2 py-2.5 font-mono text-[0.8rem] font-medium uppercase tracking-[0.06em] no-underline sm:px-3 ${
    isCurrent
      ? "border-ink bg-ink text-canvas"
      : "border-transparent text-ink hover:border-ink"
  }`;
}
