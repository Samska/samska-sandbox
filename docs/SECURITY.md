# Security Engineering

## Security Baseline

Assume the repository is public and a future demo may receive hostile users and automated traffic. Security requirements apply from the first implementation change, even though the current backend and frontend are bootstrap applications with no business behavior.

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

The backend intentionally exposes only Spring Boot Actuator health over HTTP. Actuator discovery is disabled and health details are not exposed. This allows startup verification without creating a business API. It is not a complete public-API security posture: authentication, authorization, rate limiting, CORS policy, and deployment controls remain deferred until their corresponding work is justified.

Do not claim a control is enabled until it has been independently verified. The intended GitHub controls and their current verification status are in [GITHUB.md](GITHUB.md). Vulnerability reporting instructions are in the repository-level [security policy](../SECURITY.md).

## Current Frontend Baseline

The React application in `web/` has no environment files, API configuration, credentials, or backend integration. Browser-delivered JavaScript, HTML, CSS, browser storage, and network requests must be treated as public to users; deployed source maps are public too when enabled. Vite statically exposes `VITE_*` values through `import.meta.env`; those values are public configuration, never secret storage. Do not put credentials, tokens, private API keys, connection strings, or backend secrets in frontend source, Vite configuration, or `VITE_*` variables.

`web/.nvmrc` selects the Node version for supported workflows and CI. The `engines` and `packageManager` fields communicate intended compatibility to tooling but do not themselves prevent unsupported local tools. The committed `package-lock.json` and `npm ci --ignore-scripts` provide deterministic dependency installation while minimizing lifecycle-script execution. This baseline does not provide authentication, authorization, API security, vulnerability scanning, dependency-update automation, or deployment controls.

## Current Local Database Baseline

Docker Compose publishes PostgreSQL only on IPv4 loopback, preventing direct exposure on other host interfaces. The database name and bootstrap user are committed configuration, but the PostgreSQL password must be supplied through an ignored local `.env` and is not present in the repository. The committed `.env.example` is an inert configuration template with an empty password field. The official image gives the bootstrap user elevated PostgreSQL privileges; no application uses that account, and future backend integration must establish least-privileged credentials.

The local `.env` may contain a disposable development credential and must remain ignored. It is a local Compose input, not production secret management; shared and deployed environments must use an appropriate runtime secret mechanism. No production or shared credential belongs in the repository. The local database uses a Docker-managed named volume outside the Git repository. Local data remains until the volume is explicitly removed, so developers must use synthetic data and treat `docker compose down -v` as a destructive reset. Real data and credentials remain prohibited in committed files, commands, logs, and database contents.
