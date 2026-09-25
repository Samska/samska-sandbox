# SS-034: Product Media Upload

- Status: Active
- Work date: 2026-09-25
- Last reviewed: 2026-09-25
- Work item: [SS-034](https://github.com/Samska/samska-sandbox/issues/57)
- Pull request: None yet
- ADRs: [ADR 0004](../adr/0004-adopt-product-media-upload.md); supersedes the no-upload decision of [ADR 0003](../adr/0003-adopt-optional-product-media-reference.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md)

## What you should learn

- Treating uploads as untrusted input: signature checks, server-side decode, and re-encode normalization
- Layered resource limits and the difference between bounded storage and bounded peak memory
- Atomicity when a parent record owns a child value: one lock, one publication, explicit replace semantics
- Linearization points, versioned immutable media IDs, and what a concurrent reader can observe
- Media resolution precedence with an intentional fallback, and failure-state resets in the UI
- Partial success across separate requests, and reconciling uncertain outcomes before claiming results
- Handling uncertain client outcomes after a network failure without misreporting the server state

### Core — Know this for interviews

- Upload trust boundaries and content validation
- Layered limits versus peak-memory exposure
- Atomic parent/child state publication under one lock
- Linearization and safe media identity
- Fallback-first media rendering
- Partial-success honesty across multi-request workflows

## Concepts explained

**Uploads are untrusted input.** A browser-declared content type, file extension, or filename proves nothing; an attacker controls all of them. The server therefore identifies JPEG by its byte signature, asks an ImageIO reader for dimensions before decoding, decodes, checks the pixel budget, flattens alpha onto RGB, and writes a fresh JPEG. Re-encoding is a security normalization: it strips metadata and any embedded payload and produces bytes the server itself generated. The cost is that EXIF orientation is not applied, so some phone photos can appear sideways.

**Layered limits, bounded storage, unbounded peak memory.** This capability enforces six different boundaries: multipart request size (3 MiB), input file size (2 MiB), per-side dimension (2048), total pixels (4 million), normalized output size (2 MiB), and aggregate stored bytes (32 MiB). The aggregate cap bounds what is *retained*; it does not bound what concurrent requests *transiently allocate*, because each request can hold input bytes, decoded pixels, normalized output, and decoder buffers at once. Saying "32 MiB of storage" is honest; saying "32 MiB of memory" would not be. Limit rejections return `413`. In-handler rejections carry a JSON body code that separates exhausted aggregate capacity (`storage-capacity-exceeded`) from per-image limits (`media-limit-exceeded`), so the Admin can show a distinct, actionable message without changing the status contract. Servlet-level multipart and input rejections can be body-less `413` because they occur before handler mapping; the client treats a body-less `413` as the generic per-image limit.

**Atomic parent/child publication.** The Product record and its optional media value live in one in-memory store guarded by a single lock. Full `PUT` validates a new Product and replaces only the Product part, keeping the existing media; upload computes `total - old + new`, rejects if the budget would be exceeded, then publishes the new media ID and byte total in one locked transition; removal and Product deletion release bytes under the same lock. There is no `replace(Product)` shortcut that could silently drop media, and no window where a Product references bytes that are not stored.

**Linearization and media identity.** Each mutation has a single linearization point—the locked publication. Readers take a record snapshot under the lock and serialize or stream after releasing it, so a reader sees the complete old state or the complete new state. Because each upload gets a new immutable ID and only the current ID is served, a client that captured the old bytes before a replacement may finish streaming them afterward, while any *new* request for the old ID returns `404`. Cache headers are `no-store`; the URL is the version.

**Fallback-first rendering.** Display resolution chooses uploaded media when present and otherwise the curated `mediaKey` asset, and any absent, unmapped, or failed-to-load source renders the generated monogram without a broken image or layout shift. An uploaded image that fails does not fall back to the curated asset. The component remembers only the specific source that failed, so a replacement source can render after an earlier failure.

**Uncertain outcomes.** A network failure during upload cannot tell the client whether the server committed. The Admin flows re-read the Product before inviting a retry, so the user acts on observed server state rather than an assumption: a create whose outcome is unknown removes the create action entirely and points at the list, and a media upload or removal that cannot be confirmed is reconciled by reading the current `uploadedMediaId`. A reload that finds no uploaded image keeps the pending retry state instead of presenting the create as complete.

**Partial success across separate requests.** Creating or editing a Product and changing its image are two independent HTTP requests, so "saved" is not one fact. The create form posts the Product first, then uploads the selected JPEG, and if the upload fails it states exactly that ("Product created; image could not be uploaded."), keeps the created identity, and offers image retry without another create. The edit form applies the field `PUT` first and then the staged media operation, reporting that the details were saved while the image was not. A network error in either request is never treated as failure: the client re-reads the Product and only claims success when the observed state proves the operation took effect; otherwise it says the result could not be confirmed. The strongest rule is "never silently create a duplicate" — an unknown create outcome removes the create action and points at the list instead. Abandoned choices follow the same rule: clearing a selection or undoing a staged removal must also clear the pending retry, so a retry never sends a discarded file or performs a cancelled removal.

## How Samska uses it

Backend: `backend/src/main/java/io/github/samska/sandbox/catalog/application/ProductMediaNormalizer.java` owns validation and re-encoding with memory-backed ImageIO streams; `MediaLimits.java` holds the documented limits; `ProductStore.java` declares the media-aware operations implemented atomically in `catalog/storage/InMemoryProductStore.java`; `ProductApplicationService.java` orchestrates them; `catalog/api/ProductController.java` exposes `PUT`/`DELETE`/`GET` media routes; `ProductApiExceptionHandler.java` maps `400`, `404`, `409`, `413`, and `415`; `ProductResponse.java` carries `uploadedMediaId`; `backend/src/main/resources/application.properties` configures multipart bounds. The existing `CatalogCartCoordinator` still owns the deletion/Cart-conflict workflow.

Frontend: `web/src/App.tsx` selects the Market, the Admin list, the create form, the edit form, or not-found from the path without a router dependency; `web/src/admin/AdminProducts.tsx` owns the compact management list, search, result count, delete confirmation, and focus recovery; `web/src/admin/AdminProductCreate.tsx` owns the create-first-then-upload flow with partial-failure and uncertainty handling; `web/src/admin/AdminProductEdit.tsx` owns staged replacement/removal, legacy `mediaKey` preservation, partial-success reporting, and reconciliation; `ProductFields.tsx` shares validated fields; `ProductImageSection.tsx` shares the preview, guidance, selection, and confirmed-removal copy; `useFilePreview.ts` produces the local selection preview; `web/src/catalog/catalogApi.ts` maps the Catalog, media, and error-code operations; `web/src/catalog/mediaCatalog.ts` resolves uploaded-first, curated-second; `web/src/catalog/ProductMedia.tsx` renders image or monogram across card, detail, thumbnail, and form-square variants.

Evidence: `ProductMediaNormalizerTest`, `InMemoryProductStoreTest` (accounting, budget, concurrent replacement), `ProductApiTest` media cases, `ProductMediaCapacityApiTest`, and the Admin, API, and `ProductMedia` Vitest suites. Real serving and restart behavior remain Human Verification.

## Interview perspective

Expect questions about why re-encoding untrusted images is safer than trusting them, how you choose and layer limits, how you keep a parent record and its binary child consistent, what a linearization point guarantees for readers, why versioned media IDs matter when bytes are immutable, how an unauthenticated upload endpoint differs from a hosted one, and how to report partial success honestly when a user action spans two requests. A strong answer names the failure mode each control addresses—polyglot files, metadata leakage, decompression bombs, torn reads, stale caches, orphaned bytes, and duplicate records—and states the guarantees the local MVP does not provide.

## What not to worry about yet

Authentication and authorization, hosting, PostgreSQL persistence, external object storage or CDNs, image editing and cropping, multiple images per Product, EXIF-aware rotation, rate limiting, and the First Order journey.

## Reference

- Issue: [SS-034](https://github.com/Samska/samska-sandbox/issues/57)
- Pull request: None yet
- Relevant source files: `backend/src/main/java/io/github/samska/sandbox/catalog/application/ProductMediaNormalizer.java`, `application/MediaLimits.java`, `application/ProductStore.java`, `application/ProductApplicationService.java`, `application/MediaChange.java`, `storage/InMemoryProductStore.java`, `api/ProductController.java`, `api/ProductResponse.java`, `api/ProductApiExceptionHandler.java`, `api/MediaErrorResponse.java`, `backend/src/main/resources/application.properties`, `web/src/App.tsx`, `web/src/admin/AdminProducts.tsx`, `web/src/admin/AdminProductCreate.tsx`, `web/src/admin/AdminProductEdit.tsx`, `web/src/admin/ProductFields.tsx`, `web/src/admin/ProductImageSection.tsx`, `web/src/admin/useFilePreview.ts`, `web/src/catalog/catalogApi.ts`, `web/src/catalog/mediaCatalog.ts`, `web/src/catalog/ProductMedia.tsx`
- ADRs: [ADR 0004](../adr/0004-adopt-product-media-upload.md), [ADR 0003](../adr/0003-adopt-optional-product-media-reference.md), [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Security](../SECURITY.md), [Local Development](../LOCAL-DEVELOPMENT.md)

## Why this design

Filesystem storage was the main alternative. It survives restarts, but it adds a configured path, permissions, orphan cleanup on replacement and deletion, and coordination between files and records—operational surface the local MVP does not need, while Products themselves still vanish on restart. Sending the original bytes without re-encoding was rejected because it would serve attacker-controlled metadata and encodings; the accepted cost is losing EXIF orientation. A router-free, fetch-based Admin flow was kept consistent with the existing surface rather than introducing a form library or global state. Multiple images were deferred because the current card and detail views present one image, and gallery semantics would expand the API and storage without a demonstrated need.

## Common mistakes

- Trusting `Content-Type`, file extension, or filename for validation or path construction
- Claiming an aggregate storage cap bounds peak memory or concurrent decoder use
- Letting full Product update overwrite or drop the uploaded media accidentally
- Serving retired media IDs after replacement, or caching media responses
- Believing a network error means the server did not commit
- Rendering a broken image instead of the intended fallback for absent, unmapped, or failed media
- Treating the Admin path or a hidden control as authorization for uploads

## Interview vocabulary

- **Polyglot file**: content valid under more than one format, often used to smuggle active content past extension checks.
- **Decompression bomb**: a small compressed file whose decoded form is enormous, used to exhaust memory or CPU.
- **Linearization point**: the instant at which a concurrent operation appears to take effect.
- **Versioned immutable media**: each replacement gets a new ID and never-changing bytes, so URLs are safe to reference and stale URLs 404.
- **Peak memory**: the maximum simultaneous allocation during an operation, distinct from final retained size.
- **Fallback chain**: ordered media resolution that degrades instead of failing.

## Deeper — Useful later

Content-addressed storage would deduplicate identical uploads and let bytes be shared safely, at the cost of hashing and reference counting. A persistent blob store with a metadata table and transactional cleanup is the typical production answer once restart durability matters. EXIF orientation handling and image resizing pipelines belong with a deliberate editing feature, not with validation normalization. Rate limiting, request authentication, and quarantining or malware scanning are hosting prerequisites.
