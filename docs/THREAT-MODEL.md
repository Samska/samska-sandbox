# Threat Model

Status: reviewed 2026-11-27 for v1.0.0 (SS-073). This is a small, honest model of a synthetic-data demo, not a certification.

## What is protected

- Account credentials and sessions (synthetic accounts only).
- The integrity of Orders and stock, which are synthetic.
- Availability of the demo for a few concurrent visitors.

There is no real customer data, no card data and no real payment or courier integration. The assets worth defending are the administrator account, per-account isolation and the demo's availability.

## Boundaries and entry points

- The browser to the reverse proxy over TLS, then the proxy to the backend, then the backend to PostgreSQL. PostgreSQL is not published outside its network.
- Public: Product reads, `GET /api/auth/me`, sign-in, health. There is no self sign-up (SS-095).
- Signed in: Cart, Orders, tracking.
- Administrator: Product writes and media, Operations.

## Threats and controls

| Threat | Control | Residual risk |
| --- | --- | --- |
| Credential stuffing and password guessing | BCrypt hashes; identical sign-in failures; strict per-client limit on sign-in with `429` and `Retry-After` | A distributed attacker has many addresses; limits are per process and in memory |
| Account lockout abuse | No per-account lockout, so nobody can lock a victim out | Guessing against one account is bounded only by the per-client limit |
| Session theft | HttpOnly, SameSite Lax session cookie; `Secure` in production; sessions are in memory and end on restart | A stolen cookie works until sign-out or restart |
| Cross-site request forgery | Cookie-to-header token on every state-changing request | None known |
| Cross-account access | Every Cart, Order and shipment read is scoped to the signed-in account; others answer 404 | Tests cover it; guessing UUIDs gains nothing |
| Privilege escalation | Role checked on the server for Product writes, Operations; there is no default administrator and production refuses a weak configured password | The administrator password is a deployment secret |
| Cross-site scripting | The API sends JSON only with a `default-src 'none'` policy; the single-page application is served with a restrictive policy by the proxy; React escapes output | Third-party script supply chain, mitigated by lockfile and audit |
| Clickjacking, sniffing, referrer leaks | `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, HSTS over HTTPS | None known |
| Request flooding | Generous per-client limit on the rest of the API; bounded upload sizes | A volumetric attack needs an upstream defence the demo does not have |
| Stock or Order races | Row locks in the Order transaction; unique constraints | None known |
| Accidental real data | Synthetic data only, no payment | Visitors may type real data; nothing is erased automatically, so real data would stay |
| Secrets in the repository or logs | No secrets committed; logs carry method, path, status and duration only | Operators must keep deployment secrets out of version control |
| Unsafe configuration | The `prod` profile refuses to start when enforcement is off, cookies are not secure, the database password is missing or the administrator password is short | An operator can still run without the `prod` profile |

## Known limitations at v1.0.0

Sessions and rate limits live in one process and are lost on restart. There is no email verification, no password reset, no multi-factor sign-in and no external identity provider. The demo trusts the forwarded client address only behind a proxy the operator controls.
