# ADR 0018: Add Demo Mode And A Containerized Runtime

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-074 (#144)](https://github.com/Samska/samska-sandbox/issues/144), [ADR 0017](0017-harden-the-public-demo.md)

## Context

A public demo needs a visible warning that data is synthetic, a way to return to a clean state, and a reproducible runtime.

## Decision

`samska.demo.enabled` (off by default) exposes `GET /api/config` and turns on `POST /api/admin/demo/reset`, an administrator-only endpoint that truncates Orders, Payment attempts, Carts and reservations, deletes non-administrator accounts, restores stock to 25 and invalidates every other session through a session registry. An optional cron (`samska.demo.reset-cron`) runs the same reset. The web application shows a banner when the flag is on. The runtime is a backend image, an nginx web image that serves the application with a restrictive Content-Security-Policy and proxies `/api`, and `compose.demo.yaml` with PostgreSQL unpublished and every secret supplied from an ignored environment file.

## Alternatives Considered

- **Serving the application from Spring Boot.** Rejected: nginx gives precise policy headers and keeps the backend an API.
- **Resetting by restarting the database.** Rejected: it drops Products and the administrator.
- **A hosting-provider configuration.** Deferred: the choice of provider belongs to the owner.

## Consequences

- The reset is destructive by design, so it exists only in demo mode and requires a second confirmation in the interface.
- Resetting signs visitors out; the registry holds open sessions in memory.

## Validation

`DemoApiTest` covers the flag, the reset and its effects, authorization and the disabled case. Web tests cover the banner and the confirmed reset. The Compose stack was run locally.
