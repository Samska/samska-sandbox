# ADR 0004: Adopt Product Media Upload with Bounded In-Memory Storage

- Status: Accepted
- Date: 2026-09-25
- Decision makers: Samska (human owner) with AI implementation support
- Supersedes: the no-upload decision of [ADR 0003](0003-adopt-optional-product-media-reference.md)
- Related: [SS-034](https://github.com/Samska/samska-sandbox/issues/57), [ADR 0001](0001-adopt-modular-monolith.md), [Architecture](../ARCHITECTURE.md), [Security](../SECURITY.md), [Testing](../TESTING.md), [Product](../PRODUCT.md)

## Context

ADR 0003 deliberately kept Product media curated: a nullable `mediaKey` resolved by the frontend to repository-owned local assets, with a monogram fallback and no upload endpoint. That decision explicitly deferred uploads until media editing, multiple images, or external hosting became requirements.

The owner approved Product Media Upload as the next capability after Admin Catalog Management. An Admin user needs to provide real Product imagery through the application instead of a repository change, and the Market must display it while retaining the intentional fallback that keeps browse and detail layouts stable. The capability must remain a local MVP: no hosting, no PostgreSQL integration, no external media service, and no authentication or authorization, since `/admin/products` is navigation and not access control.

Uploads change the security surface. The endpoints are unauthenticated, the repository is public, and the input is attacker-controllable in a future hosted environment. The decision must bound accepted content and memory, validate on the server, and state the limits of the guarantee.

## Decision

Add one uploaded image per Product, stored at runtime with the Product record:

- **Identity and API.** `mediaKey` and its curated mapping keep their current meaning and validation. Product responses add a read-only nullable `uploadedMediaId`. Uploaded media takes display precedence; removing it reveals the retained curated selection or the monogram fallback. Full Product `PUT` preserves the uploaded media.
- **Storage.** One uploaded media value (server-generated ID plus normalized JPEG bytes) is stored beside its Product in the Catalog-owned in-memory store. A single store lock covers all record mutation and aggregate-byte accounting, so full update, upload/replace, removal, and Product deletion are atomic per Product and cannot publish a partially changed state. A 32 MiB aggregate cap bounds retained encoded media. Products and their media are lost together on backend restart.
- **Limits.** A 3 MiB multipart request, a 2 MiB input file, 2048 pixels per side, 4 million pixels total, and a 2 MiB normalized JPEG output. Every limit rejection returns `413` and leaves the Product, media ID, image, and byte accounting unchanged. Exhausted aggregate capacity also returns `413` but carries a distinct JSON error code (`storage-capacity-exceeded` versus `media-limit-exceeded`) so the Admin can show an actionable storage-full message.
- **Validation and serving.** The server accepts only JPEG content identified by its signature, decodes and checks dimensions, flattens to RGB, and re-encodes a fresh JPEG before publication. Client filenames, extensions, and declared content types are never trusted or used as paths. Media is served only for the Product's current media ID as `image/jpeg` with `X-Content-Type-Options: nosniff` and `Cache-Control: no-store`.
- **Orientation.** Re-encoding strips EXIF metadata and does not rotate pixels, so an EXIF-dependent portrait phone photo can appear sideways. The owner accepted this documented limitation; EXIF-aware rotation is out of scope.
- **Boundaries.** No external media service, CDN, object storage, PostgreSQL persistence, image editing pipeline, or multiple-image model is introduced. The Cart contract is unchanged, and the existing one-way Cart → Catalog module dependency and `CatalogCartCoordinator` Cart-conflict guarantee remain intact.

## Alternatives Considered

- **Filesystem storage with a configured directory.** Rejected for this MVP: it adds a location, permissions, restart/orphan policy, and file-and-record coordination cost without improving the local learning goal, and process-local data already resets on restart.
- **Multiple images per Product.** Rejected for now: it requires ordering, gallery UI, more endpoints, and larger storage and cleanup rules that the current card and detail presentation do not need.
- **Accepting several image formats.** Rejected: each format adds decoder and active-content concerns; JPEG-only keeps validation and tests reviewable.
- **Trusting extension or declared MIME type.** Rejected: it proves nothing about content and invites mislabeled or active files.
- **Retaining original bytes without re-encoding.** Rejected: metadata, embedded payloads, and original encodings would be served directly; normalization bounds output size and strips metadata.
- **External runtime image hosting or CDN.** Rejected in ADR 0003 and still rejected: runtime availability, privacy exposure, license drift, and broken offline development.
- **Keeping curated media only.** Rejected by the owner: the capability was approved to let an Admin provide media without a repository change.

## Consequences

Positive:

- An Admin user can provide, replace, and remove Product imagery locally without a repository change.
- Existing Products, the curated mapping, the nullable `mediaKey` contract, and the fallback behavior keep working.
- Server-side validation and re-encoding bound content type, dimensions, output size, and metadata without a new dependency.
- Atomic store operations make media state consistent with Product state under concurrency, and Product deletion releases media bytes.

Negative and operational:

- Uploaded media is process-local and disappears on backend restart.
- The 32 MiB cap bounds retained encoded images, not peak process memory; concurrent requests can each hold input, decoded pixels, normalized output, and decoder buffers. The unauthenticated API remains unsuitable for hosting.
- Re-encoding strips EXIF orientation, so some phone photos can appear sideways.
- The multipart request limit depends on servlet multipart configuration and is exercised through local runtime checks rather than MockMvc.

Security:

- Content is validated and normalized before publication; rejections do not mutate state.
- Only the current media ID is served, as `image/jpeg`, with nosniff and no-store; this does not add authentication, authorization, rate limiting, or a hosting posture.

Testing:

- Domain, normalizer, store, and MockMvc tests cover acceptance, each limit, rejection without mutation, media preservation through full update, replacement, removal, deletion cleanup, serving headers, and aggregate capacity.
- Vitest and React Testing Library cover the Admin media workflow, error mapping, focus recovery, and uploaded/curated/fallback rendering in both Market views.

## Validation

- Backend `clean verify`, frontend typecheck, tests, and production build pass with the media endpoints.
- Agent Verification exercises a real upload and retrieval through the local Vite proxy; Human Verification checks upload, replacement, removal, restart loss, both Market views, curated/fallback behavior, keyboard and focus behavior, narrow layout, and EXIF-dependent versus normally oriented JPEGs before merge.
- Revisit this decision if media editing, multiple images per Product, persistent or external media storage, EXIF-aware rotation, or any hosted environment becomes a requirement.
