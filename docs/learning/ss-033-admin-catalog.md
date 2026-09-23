# SS-033: Admin Catalog Management

- Status: Active
- Work date: 2026-09-23
- Last reviewed: 2026-09-23
- Work item: [SS-033](https://github.com/Samska/samska-sandbox/issues/55)
- Pull request: [PR #56](https://github.com/Samska/samska-sandbox/pull/56)
- ADRs: None; follows [ADR 0001](../adr/0001-adopt-modular-monolith.md) and [ADR 0003](../adr/0003-adopt-optional-product-media-reference.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

## What you should learn

- Real URL routing without a router dependency: path selection, full-page navigation, and SPA server fallback
- Back-office boundaries: an admin surface is not an authorization control
- Cross-module coordination: keeping Catalog and Cart decoupled while enforcing a shared invariant
- Scoped concurrency guarantees: what one process-local lock does and does not protect
- Full-replacement update semantics and atomic per-identity storage operations
- Preserving captured Cart line values across Catalog edits

### Core — Know this for interviews

- Navigation versus authorization
- Cross-module orchestration without cyclic dependencies
- Scoped concurrency guarantees
- Atomic replace/delete and full-replacement updates
- Snapshot semantics of derived data

## Concepts explained

**Routing without a router.** The application chooses a surface from `window.location.pathname`: `/` renders the Market, `/admin/products` renders Admin, and every other path renders a not-found view. Navigation uses ordinary same-origin anchors, so the browser performs full page loads. That gives direct entry, reload, and Back/Forward behavior for free, and returning to the Market refetches Catalog data. A client-side router library buys in-app transitions and route state, but it also adds a dependency, a route model, and history management the application does not need yet. A full-page load is also the honest behavior for an application whose state is process-local and refetched anyway. The tradeoff is that the server must serve the application shell for unknown paths; Vite does this in development and preview. The client-side not-found view is not an HTTP `404`.

**Navigation is not authorization.** `/admin/products` separates administrative workflow from the customer Market, but anyone who knows the URL reaches it, and the underlying Product API is unauthenticated. Hiding or moving controls changes discoverability, not access. Treating a path as a security boundary before authentication and authorization exist would be a false control; [Security](../SECURITY.md) records this explicitly.

**Cross-module coordination.** The rule "a Product in the current Cart cannot be deleted" spans Catalog (Product lifecycle) and Cart (current contents). Catalog must not read Cart storage, and the modules must not become mutually dependent. The repository adds a neutral application component, `CatalogCartCoordinator`, that depends on both modules' application services and owns one `ReentrantLock`. Both HTTP entry points that can violate the invariant — add-to-Cart and delete-Product — run through it. Cart still depends only on Catalog; Catalog never depends on Cart. The coordinator is an application-orchestration layer, not a third business module: collapsing it into either module would create the cycle it exists to prevent.

**Scoped concurrency guarantees.** The lock serializes the two workflows in one backend process: if add runs first, delete observes the Cart line and returns `409`; if delete runs first, add finds no Product and returns the existing `404`. That is a real, testable guarantee for those API paths in this process. It is not a distributed transaction: a caller that bypasses the coordinator, a second process, or a future database would each invalidate it. A Cart removal racing a deletion can also produce a conservative `409` even though the line disappears moments later; conservative refusal preserves the invariant. Stating the scope of a guarantee is part of the guarantee.

**Atomic replace/delete.** The update endpoint is a full replacement: all four fields are validated by constructing a new `Product` with the same identity, then published with one atomic store `replace`. Separate mutable setters could publish a partially validated state, and a check-then-save sequence could resurrect a Product deleted in between. `ConcurrentHashMap.replace` and `remove` make the per-identity operation atomic, so an update on a deleted identity returns `404` instead of recreating it.

**Derived data snapshots.** A Cart line captures the Product name and unit price when it is first added. Editing the Product does not rewrite captured lines, quantity changes preserve them, and re-adding the same Product aggregates quantity using the first captured values. A later add of a different Product uses current Catalog values. This is the same snapshot principle as Checkout: derive once, then keep the derived copy stable until the owning workflow explicitly refreshes it.

## How Samska uses it

`web/src/App.tsx` selects the surface from `window.location.pathname` with plain anchors in a `Primary` navigation landmark; `web/src/admin/AdminProducts.tsx` owns list, search, create, edit, delete, confirmation, and focus recovery, and `web/src/admin/ProductForm.tsx` shares one validated form for create and edit. `web/src/catalog/catalogApi.ts` owns `updateProduct` and `deleteProduct` and maps `409` to a `conflict` error kind; `web/src/catalog/ProductBrowse.tsx` no longer links to setup tools.

On the backend, `catalog/application/ProductApplicationService.java` exposes `updateProduct` and `deleteProduct`; `catalog/application/ProductStore.java` declares `replace` and `deleteById` implemented atomically in `catalog/storage/InMemoryProductStore.java`; `coordination/CatalogCartCoordinator.java` owns the lock and the delete-eligibility workflow, and `catalog/api/ProductApiExceptionHandler.java` maps the coordinator's conflict exception to `409`. `cart/application/CartApplicationService.java` exposes the narrow `currentCartContainsProduct` contract, and `cart/api/CartController.java` routes addition through the coordinator.

Evidence lives in `CatalogCartCoordinatorTest` (both orderings plus latch-controlled interleavings), `InMemoryProductStoreTest`, the update/delete/conflict cases in `ProductApiTest`, the captured-value cases in `CartApiTest`, and the Admin, routing, and API-mapping Vitest suites. Direct-route behavior was exercised against local Vite development and preview servers; real browser reload, history, and layout behavior remain Human Verification.

## Interview perspective

Expect questions about when a routing library is justified, why an admin URL is not authorization, how to enforce an invariant that spans two modules without coupling them, what a process-local lock does and does not guarantee, why full replacement is safer than patching fields, and why editing a Product must not rewrite historical Cart lines. A strong answer names the scope and the failure mode each choice addresses: false access control, cyclic dependencies, resurrected entities, torn reads, or silently repriced historical data.

## What not to worry about yet

Authentication, authorization, roles, and access control; hosting; persistence and PostgreSQL integration; multi-process or distributed coordination; Product media upload and storage; payments, Orders, inventory, currency, and the First Order end-to-end journey; in-app routing transitions; and automated browser or end-to-end tests.

## Reference

- Issue: [SS-033](https://github.com/Samska/samska-sandbox/issues/55)
- Pull request: [PR #56](https://github.com/Samska/samska-sandbox/pull/56)
- Relevant source files: `web/src/App.tsx`, `web/src/NotFound.tsx`, `web/src/admin/AdminProducts.tsx`, `web/src/admin/ProductForm.tsx`, `web/src/admin/messages.ts`, `web/src/catalog/catalogApi.ts`, `web/src/catalog/ProductBrowse.tsx`, `backend/src/main/java/io/github/samska/sandbox/coordination/CatalogCartCoordinator.java`, `backend/src/main/java/io/github/samska/sandbox/catalog/application/ProductApplicationService.java`, `backend/src/main/java/io/github/samska/sandbox/catalog/application/ProductStore.java`, `backend/src/main/java/io/github/samska/sandbox/catalog/storage/InMemoryProductStore.java`, `backend/src/main/java/io/github/samska/sandbox/cart/application/CartApplicationService.java`, `backend/src/test/java/io/github/samska/sandbox/coordination/CatalogCartCoordinatorTest.java`
- ADRs: [ADR 0001](../adr/0001-adopt-modular-monolith.md), [ADR 0003](../adr/0003-adopt-optional-product-media-reference.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

## Why this design

Two coordination alternatives were considered. **Dependency inversion** would place a Catalog-owned `ProductUsage` contract implemented by Cart and a shared lock component, keeping the package graph strictly acyclic even when collapsed to top-level packages; it distributes the workflow across two application services. **The coordinator** keeps the cross-module workflow in one reviewable place and colocates the lock with it, at the cost of an application-orchestration package that both HTTP adapters depend on. The coordinator was chosen because the workflow is easier to review and test in one unit, and because the business modules remain one-way (Cart → Catalog) with no Catalog dependency on Cart; the learning record keeps the alternative visible because the tradeoff is real.

A client-side router dependency was rejected: the application needs distinct URLs and browser history, not client transitions, and full-page navigation also refreshes the process-local Catalog state on return to the Market. A separate backend search endpoint was rejected: the collection API plus local filtering is sufficient at the current process-local scale. Blocking Product edits while a Product is in the Cart was rejected: the Issue requires edits to affect future Catalog values only, leaving captured Cart lines untouched.

## Common mistakes

- Treating an admin route or hidden controls as authorization
- Making Catalog read Cart storage, or creating a Catalog ↔ Cart dependency cycle
- Claiming concurrency safety beyond the scope actually protected by a process-local lock
- Using check-then-save instead of an atomic per-identity replace or delete
- Publishing a partial update through separate mutable setters
- Rewriting or clearing captured Cart line values when a Product is edited or deleted
- Adding a router dependency before in-app navigation is actually required
- Assuming SPA fallback means the server returns `404` for unknown paths

## Interview vocabulary

- **SPA fallback**: a server behavior that returns the application shell for unmatched paths so client-side routing can resolve them.
- **Navigation versus authorization**: separating where a user can go from what a user is allowed to do.
- **Application coordinator**: a component that orchestrates a workflow spanning modules without owning either module's data.
- **Scoped invariant**: a guarantee that holds only within a stated boundary, such as one process and specific entry points.
- **Atomic replace**: publishing a complete new value for a key only if the key currently exists.
- **Captured snapshot**: a derived copy (name, unit price) kept stable until the owning workflow explicitly refreshes it.
- **Conservative conflict**: refusing an operation that might violate an invariant even though a race could make it succeed.
