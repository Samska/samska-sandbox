# ADR 0019: Separate The Admin Area And Terminate TLS With Caddy

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-075 (#146)](https://github.com/Samska/samska-sandbox/issues/146), [ADR 0013](0013-adopt-account-sessions-and-ownership.md), [ADR 0018](0018-add-demo-mode-and-containers.md)

## Context

The owner added three requirements for v1.0.0: the manageable area must be separate from the customer area, there are two roles (buyer and administrator), and the app must run on a VPS. Accounts and roles already existed and are enforced by the backend; the interface mixed both areas.

## Decision

Everything under `/admin` renders in its own shell with its own header and navigation (Products, Operations, View store, Sign out) and no storefront or Cart links. The storefront header shows only an "Admin" link, and only to administrators. A customer or visitor who opens an Admin path sees the storefront shell with a sign-in prompt or "Not allowed". Sign-in sends an administrator to `/admin/products` and a customer to the Market. Authorization stays on the server: Product writes, Operations and the demo reset require the `ADMIN` role regardless of what the interface shows. TLS is terminated by a Caddy container with automatic Let's Encrypt certificates; Caddy is the only service that publishes ports, and the web container trusts the client address header only from the private Compose network.

## Alternatives Considered

- **A separate web application for Admin.** Rejected: a second build and deployment for two screens.
- **nginx with certbot.** Rejected: more moving parts than Caddy's built-in certificate management.
- **A hosting platform.** Deferred: the owner chose a VPS.

## Consequences

- An administrator who wants to shop uses View store; the roles do not forbid it.
- The Bench prototype has no Admin shell screen; the shell reuses the Bench header language with an inverted header to mark the different area, and the gap is recorded here.

## Validation

Web tests cover the Admin shell, its absence for customers, the sign-in redirect and the storefront link; backend tests from SS-069 and SS-072 cover role enforcement; the browser suite drives the Admin area. The proxy chain is verified on first deployment.
