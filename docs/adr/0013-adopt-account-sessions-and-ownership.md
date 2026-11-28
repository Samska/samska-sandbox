# ADR 0013: Adopt Server-Side Sessions And Per-Account Ownership

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-069 (#133)](https://github.com/Samska/samska-sandbox/issues/133), [ADR 0012](0012-adopt-release-plan-to-v1.md), [ADR 0001](0001-adopt-modular-monolith.md)

## Context

Until v0.3.0 the application had one shared Cart, unauthenticated Payment and Order endpoints, and an Admin area that was navigation only. Order history, tracking and operations screens all expose per-person or administrative data, so identity has to exist first.

## Decision

- A new `account` module owns accounts (`accounts` table, BCrypt hashes, case-insensitive unique email, roles `CUSTOMER` and `ADMIN`) behind an `AccountStore` port, with the same Jdbc and in-memory split as other modules.
- Spring Security provides the filter chain, the password encoder and CSRF protection. Authentication is an application service called by `AuthController` (`/api/auth/login`, `logout`, `me`; a `register` endpoint existed until SS-095 removed self sign-up), which stores the security context in an `HttpSession`. Sessions are in memory: a restart signs everyone out. Persisting them needs a further dependency and is not worth it for a demo.
- CSRF uses the cookie-to-header pattern: a readable `XSRF-TOKEN` cookie that the single-page application echoes in `X-XSRF-TOKEN`. The session cookie is HttpOnly and SameSite Lax.
- Ownership is a port, `CurrentAccount`, which Cart, Payment and Order stores read. Cart rows are keyed by owner, Payment attempts and Orders carry `account_id`, the one-approval rule is per owner and Cart revision, and another account's resource answers 404 so existence is not revealed. There are no foreign keys from these tables to `accounts`.
- Catalog reads and health are public; Product writes and media endpoints require `ADMIN`; everything else under `/api` requires sign-in.
- There is no built-in administrator. `samska.admin.email` and `samska.admin.password` create one at startup; without them none exists.
- `samska.security.enforced=false` disables the filter chain and makes every owner the nil UUID. It exists only so that unit and MockMvc suites for unrelated features keep running; surefire sets it, and nothing else does.

## Alternatives Considered

- **JWT bearer tokens.** Rejected: revocation and storage in the browser add risk and code for no benefit in a single-origin application.
- **Spring Session with JDBC.** Deferred: a dependency and a table for a convenience a demo does not need.
- **An external identity provider.** Rejected for 1.0: synthetic data only, no real identities.
- **Cart keyed by an anonymous cookie.** Rejected: it would add a second identity concept; sign-in is required to shop.

## Consequences

- Visitors browse but must sign in to use the Cart; the web application gates the routes and the backend enforces them.
- Existing single-user data moves to the nil owner and is unreachable once enforcement is on.
- Login has no throttling until v1.0.0 (rate limiting), and registration revealed whether an email existed (the endpoint was removed in SS-095).

## Validation

`AccountSecurityApiTest` runs the real application on PostgreSQL with enforcement on: anonymous access, absence of sign-up, BCrypt storage, indistinguishable sign-in failures, sign-out, CSRF refusal, role checks on the Catalog, and isolation of Cart, attempts and Orders between two accounts. Vitest covers the request wrapper and the shell; Playwright runs the First Order journey signed in and an account journey with no session.
