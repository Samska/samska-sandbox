# Security Engineering

## Security Baseline

Assume the repository is public and a future demo may receive hostile users and automated traffic. Security requirements apply from the first implementation change. The current backend has unauthenticated Catalog Product and Cart APIs with process-local data, but no application persistence, external integration, or deployed public environment; the frontend provides Catalog browsing and Cart interactions.

## Data and Secrets

- Use synthetic data only. Real customer data is prohibited.
- Never commit, hardcode, log, or expose passwords, tokens, credentials, connection strings, private keys, or other secrets.
- Real environment files must not be committed. Safe example files may be committed only when they contain no secrets.
- Never include secrets in frontend bundles, documentation examples, test fixtures, images, or CI output.
- Payments are simulated only; do not integrate real payment processors.

## Future Deployment Boundaries

- PostgreSQL, Redis, and RabbitMQ must not be publicly exposed in deployed environments.
- Public APIs must eventually have rate limits and quotas appropriate to their risk.
- Privileged debug, simulation, chaos, and infrastructure endpoints must never be anonymously exposed.
- Public environments must use synthetic data and remain constrained and disposable.
- Cloud infrastructure must have explicit cost controls.
- When cloud deployment is introduced, prefer short-lived OIDC credentials over long-lived cloud credentials.

## Engineering Practice

Security implications must be assessed for changes to data flows, authentication and authorization, APIs, dependencies, logs, infrastructure, build pipelines, and deployment configuration. Security testing is selected based on risk, not performed mechanically for every change.

## Current Backend Baseline

The backend exposes Spring Boot Actuator health plus Product creation, collection browsing, identity retrieval, update, deletion, media upload, media removal, media retrieval, and Cart operations over HTTP. Actuator discovery remains disabled and health details are not exposed. Product and Cart inputs are constrained by domain invariants, Cart prices and totals are calculated server-side with `BigDecimal`, and the Cart API response serializes one atomic Cart snapshot; API failures do not expose exception details, and Product and Cart data are process-local. Product deletion is refused with `409 Conflict` while the Product is in the current Cart; the refusal is enforced by an in-process coordination component under a shared lock and is a single-process API-path guarantee, not a cross-process or persistence guarantee. Repository policy requires synthetic data, but the API does not verify data provenance. The Catalog and Cart APIs have no authentication, authorization, rate limiting, or explicit CORS configuration and are not a complete public-API security posture; the Admin Product-management surface calls the same unauthenticated APIs, and its URL is navigation only. Deployment controls remain deferred until corresponding work is justified.

Product media upload is restricted to one JPEG per Product and is validated server-side by content signature, decoded dimensions, and pixel budget, then re-encoded before publication, with fixed limits: 3 MiB multipart request, 2 MiB input file, 2048 pixels per side, 4 million pixels total, 2 MiB normalized JPEG output, and 32 MiB aggregate stored bytes. A rejection does not change the Product, its current media ID, its image, or stored-byte accounting. Media is served only for the Product's current media ID, as `image/jpeg` with `X-Content-Type-Options: nosniff` and `Cache-Control: no-store`; client filenames, extensions, and declared content types are not trusted. The aggregate cap bounds retained encoded bytes, not peak process memory: concurrent requests can each hold input bytes, decoded pixels, normalized output, and decoder buffers, so the unauthenticated media endpoints remain a local-only risk and not a hosting posture. Re-encoding strips EXIF orientation metadata; EXIF-aware rotation is deliberately not implemented.

Do not claim a control is enabled until it has been independently verified. The intended GitHub controls and their current verification status are in [GITHUB.md](GITHUB.md). Vulnerability reporting instructions are in the repository-level [security policy](../SECURITY.md).

## Current Frontend Baseline

The React application in `web/` uses a feature-local API adapter to send relative Catalog requests during local development. Vite proxies `/api` to `http://localhost:8080` only for its development server, so the proxy does not establish production routing or a backend CORS policy. Media requests flow through the same relative `/api` path, and uploaded media is referenced by the server-issued media ID rather than by a client filename. The UI does not store credentials, browser data, or backend error bodies. The frontend selects the Market at `/`, the Admin Product-management list at `/admin/products`, the Admin create and edit forms at `/admin/products/new` and `/admin/products/{id}/edit`, or an in-app not-found view from the browser path; this routing is navigation, and the Admin paths are not an access-control boundary and hide nothing from the API. Browser-delivered JavaScript, HTML, CSS, browser storage, and network requests must be treated as public to users; deployed source maps are public too when enabled. Vite statically exposes `VITE_*` values through `import.meta.env`; those values are public configuration, never secret storage. Do not put credentials, tokens, private API keys, connection strings, or backend secrets in frontend source, Vite configuration, or `VITE_*` variables.

`web/.nvmrc` selects the Node version for supported workflows and CI. The `engines` and `packageManager` fields communicate intended compatibility to tooling but do not themselves prevent unsupported local tools. The committed `package-lock.json` and `npm ci --ignore-scripts` provide deterministic dependency installation while minimizing lifecycle-script execution. This baseline does not provide authentication, authorization, API security, vulnerability scanning, dependency-update automation, or deployment controls.

## Current Local Database Baseline

Docker Compose publishes PostgreSQL only on IPv4 loopback, preventing direct exposure on other host interfaces. The database name and bootstrap user are committed configuration, but the PostgreSQL password must be supplied through an ignored local `.env` and is not present in the repository. The committed `.env.example` is an inert configuration template with an empty password field. The official image gives the bootstrap user elevated PostgreSQL privileges; no application uses that account, and future backend integration must establish least-privileged credentials.

The local `.env` may contain a disposable development credential and must remain ignored. It is a local Compose input, not production secret management; shared and deployed environments must use an appropriate runtime secret mechanism. No production or shared credential belongs in the repository. The local database uses a Docker-managed named volume outside the Git repository. Local data remains until the volume is explicitly removed, so developers must use synthetic data and treat `docker compose down -v` as a destructive reset. Real data and credentials remain prohibited in committed files, commands, logs, and database contents.
