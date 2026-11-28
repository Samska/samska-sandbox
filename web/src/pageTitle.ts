const site = "Samska Store";

/** The browser tab title for a path, so tabs and history entries say which screen they are. */
export function pageTitle(path: string): string {
  const name = screenName(path);
  return name === null ? site : `${name} · ${site}`;
}

function screenName(path: string): string | null {
  if (path === "/checkout") return "Checkout";
  if (path === "/account") return "Sign in";
  if (path === "/orders") return "Your orders";
  if (/^\/orders\/[^/]+$/.test(path)) return "Order tracking";
  if (path === "/admin/products") return "Admin products";
  if (path === "/admin/products/new") return "New product";
  if (/^\/admin\/products\/[^/]+\/edit$/.test(path)) return "Edit product";
  if (path === "/admin/orders") return "Admin orders";
  if (path === "/admin/operations") return "Operations";
  return null;
}
