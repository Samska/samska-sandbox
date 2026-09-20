# SS-029: Enrich Product discovery experience

- Status: Active
- Work date: 2026-09-20
- Last reviewed: 2026-09-20
- Work item: [SS-029](https://github.com/Samska/samska-sandbox/issues/45)
- Pull request: None at Build/Agent Verification stop
- ADRs: None; follows [ADR 0001](../adr/0001-adopt-modular-monolith.md) and [ADR 0002](../adr/0002-adopt-tailwind-css-v4-for-frontend-styling.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

## What you should learn

- Adding a field to a domain model versus widening every internal contract
- Domain-owned invariants as the single validation authority
- Strict client-side response validation and its compatibility trade-off
- In-page master/detail navigation using local React state instead of a router
- Accessible focus movement and a keyboard-operable return path
- Keeping a cross-boundary contract intentionally narrow

### Core — Know this for interviews

- A domain invariant belongs where the state lives, so every caller gets the same rule.
- A shared contract should expose only what its consumer needs; not every new field must cross every boundary.
- Strict response validation turns silent contract drift into an explicit error.
- Local UI state is enough for a two-view flow until sharing or deep-linking is genuinely required.

## Concepts explained

A domain invariant is a rule enforced at construction time. `Product` rejects a null, empty, or whitespace-only description exactly as it already rejects an invalid name, so the rule cannot be bypassed by a different controller or service caller. The HTTP 400 mapping is a side effect of the existing `InvalidProductException` handler rather than new controller code.

A boundary contract is the minimal data an adjacent module needs. Cart only needs a Product's identity, name, and price to snapshot a line item, so the new `description` stays inside Catalog and its HTTP response instead of widening the Catalog-to-Cart `CatalogProduct` record. This keeps Cart unchanged and avoids coupling.

Strict response validation checks the exact shape of the payload. The frontend's `isProductResponse` guard now requires exactly four keys including a string `description`. That protects the UI from partially updated servers, at the cost of rejecting older three-field responses — acceptable here because frontend and backend ship together with no independent consumers.

Master/detail without a router uses local state: a selected `ProductResponse` replaces the browse list within the same column. The mounted Cart panel and the Catalog-owned Cart state are untouched, so returning to browsing cannot lose Cart contents.

## How Samska uses it

`Product` owns description validation alongside name and price. `CreateProductRequest`, `ProductResponse`, and `ProductApplicationService.createProduct` carry the field through the unchanged POST `/api/products`, GET `/api/products`, and GET `/api/products/{id}` endpoints; list and get already map through `ProductResponse.from`, so all three responses include it automatically. `CatalogProduct` and the entire `cart` package are intentionally unchanged.

`Catalog.tsx` holds `selectedProduct`, renders a `ProductDetail` section (deterministic media tone, name, description, price, Add to Cart, and Back to Products), moves focus to the detail heading on open, and returns `selectedProduct` to `null` on back. Product cards keep their direct Add to Cart and gain a description plus a View details action. The create form validates a non-blank description locally and sends it in the request body.

Evidence lives in the pure `ProductTest`, the MockMvc `ProductApiTest` (`hasSize(4)` plus a blank-description 400 case), and Vitest/RTL Catalog tests covering description rendering, detail open/return, Add to Cart from detail, description submission, and local description rejection. Verification guidance is unchanged.

## Interview perspective

Expect questions about where validation belongs, why a domain invariant beats per-caller checks, when to widen a shared contract versus keeping it narrow, the trade-off of strict payload validation, and why a router was not needed. A strong answer connects each choice to the current stage: one page owns the flow, the backend and frontend ship together, and no consumer needs the description outside Catalog yet.

## What not to worry about yet

Checkout, payments, orders, authentication, persistence, PostgreSQL integration, real images or upload, search, filtering, categories, sorting, pagination, routers, global state, component or icon libraries, animation frameworks, Playwright, and deploy configuration. Description editing beyond creation is also deferred until a concrete need appears.

## Reference

- Issue: [SS-029](https://github.com/Samska/samska-sandbox/issues/45)
- Pull request: None at Build/Agent Verification stop
- Relevant source files: `backend/src/main/java/io/github/samska/sandbox/catalog/Product.java`, `backend/src/main/java/io/github/samska/sandbox/catalog/api/ProductResponse.java`, `backend/src/main/java/io/github/samska/sandbox/catalog/api/ProductController.java`, `web/src/catalog/catalogApi.ts`, `web/src/catalog/Catalog.tsx`
- ADRs: None; follows [ADR 0001](../adr/0001-adopt-modular-monolith.md) and [ADR 0002](../adr/0002-adopt-tailwind-css-v4-for-frontend-styling.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [AI Governance](../AI-GOVERNANCE.md)

## Why this design

The Issue needed richer Product information without persistence, a router, or new dependencies. The smallest change was a domain-owned description plus propagation through existing Catalog DTOs and endpoints; because list and get already delegate to `ProductResponse.from`, no controller branching was added. Cart's `CatalogProduct` stays narrow because Cart never presents a description, which also preserves all Cart code and tests. The detail view is local state in `Catalog.tsx` so the Cart panel stays mounted and Cart state survives navigation. Strict four-key validation was chosen over a lenient optional field to keep the UI honest about its contract; the alternative, re-fetching details by id, was rejected because the browse list already carries full Product data.

## Common mistakes

- Validating the new field only in the controller or frontend while leaving the domain permissive
- Trimming or normalizing description text when the existing name behavior preserves raw input
- Widening `CatalogProduct` and Cart just because a new Product field exists
- Adding a router or global store for a two-view local flow
- Relaxing the strict response validator and silently accepting malformed payloads
- Letting the Cart panel unmount or duplicating Cart state in the detail view
- Asserting Tailwind utility classes in behavior-focused component tests
