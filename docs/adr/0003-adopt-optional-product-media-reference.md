# ADR 0003: Adopt an Optional Product Media Reference

- Status: Accepted
- Date: 2026-09-22
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-031](https://github.com/Samska/samska-sandbox/issues/49), [ADR 0001](0001-adopt-modular-monolith.md), [ADR 0002](0002-adopt-tailwind-css-v4-for-frontend-styling.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [Product](../PRODUCT.md)

## Context

SS-028 and SS-029 gave the storefront deterministic, generated abstract media: a tonal monogram derived from the Product name. That solution never breaks, needs no assets, and never implies it depicts the item, but it does not make the storefront read as a credible commerce surface.

Representative product imagery requires a media source. External runtime image URLs would add network availability and third-party licensing risk, prevent fully offline development, and leave the served content outside repository review. Image uploads or a media edit pipeline would add storage, processing, and security surface far beyond the current milestone. The remaining option is a small set of curated, repository-owned local assets that the application references by key.

The Product contract also needs a way to express "this Product uses curated media X" without making media mandatory. Existing Products, including ones created through the setup tools, must keep working unchanged.

## Decision

Add an optional media reference to Product and resolve it locally:

- `mediaKey` is optional and always present as nullable in Catalog API responses. It is a lowercase slug of at most 40 characters; blank or malformed values are rejected by the domain. A well-formed key with no matching local asset is accepted.
- The frontend resolves keys through one reviewed static mapping, `web/src/catalog/mediaCatalog.ts`, to repository-owned files under `web/public/media/`. There are no external runtime image URLs and no media upload or edit endpoint.
- Media is explicitly assigned at Product creation (the setup tools offer the curated keys). Media is never attached automatically.
- A missing key, an unknown key, or an image that fails to load renders the existing monogram fallback, with no broken image and no layout shift.
- Curated assets require rights verification, optimization, and attribution in `web/public/media/ATTRIBUTION.md`. CC0 or original assets are preferred; attributed licenses are acceptable.
- The Cart API contract is unchanged and Cart responses carry no media fields. Cart continues to obtain the minimum Product data through the Catalog-owned `ProductCatalog` contract.

## Alternatives Considered

- **External runtime image URLs.** Rejected: runtime availability and privacy exposure, third-party license drift, no reviewable asset set, and broken offline development.
- **Image uploads with storage and processing.** Rejected: introduces infrastructure, validation, and security surface the milestone does not need, and turns a curation decision into an operational one.
- **A generated cover per Product.** Rejected during the SS-031 visual review: generated graphics should not imply they depict the item, and a large cover made the browse layout less text-first.
- **Carrying media in Cart responses.** Rejected: Cart keeps its minimum-data boundary, and Cart presentation does not need media yet.
- **A media key without format validation.** Rejected: an unvalidated free-text key invites inconsistent values, ambiguous assets, and later migration problems; a bounded slug keeps the mapping reviewable.

## Consequences

Positive:

- No runtime dependency on external image hosts; local development stays fully offline.
- The asset set is explicit, reviewed, and versioned with the code.
- The contract change is additive and nullable, so existing Products and API consumers keep working.
- The fallback keeps browse and detail layouts stable for Products without media.

Negative:

- Adding or changing media requires a repository change, a rights review, and a frontend mapping update.
- Curated assets add repository weight, bounded to optimized 800-pixel-wide JPEGs.
- A well-formed key with no asset falls back silently by design; the mismatch is only visible in review or tests.
- Third-party asset licenses must be maintained separately from the Apache License 2.0 code license.

Operational and security:

- No upload endpoint, storage service, or runtime external fetch is introduced. Assets are static files served by the frontend with no user data or secrets involved.

Testing:

- Backend domain tests cover null, valid, over-length, and malformed keys; MockMvc tests cover null, valid, and unresolvable-but-well-formed keys in create and retrieval responses.
- Frontend tests cover the curated mapping, the missing-key and unknown-key fallback, and the image-error fallback.

## Validation

- Backend `clean verify`, frontend typecheck, tests, and production build pass with the optional key.
- Human Verification passed on 2026-09-22 for media rendering, fallback behavior, and layout stability at desktop and narrow viewports.
- Accepted on 2026-09-22 after Human Verification approval; supersede or deprecate this ADR if circumstances change.
- Revisit this decision if media editing, uploads, multiple images per Product, or external hosting becomes a requirement, or if any asset license changes.
