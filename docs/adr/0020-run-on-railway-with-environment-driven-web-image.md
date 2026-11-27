# ADR 0020: Run On Railway With An Environment-Driven Web Image

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-076 (#148)](https://github.com/Samska/samska-sandbox/issues/148), [ADR 0018](0018-add-demo-mode-and-containers.md), [ADR 0019](0019-separate-admin-area-and-terminate-tls-with-caddy.md)

## Context

The owner chose Railway instead of a VPS. Railway builds a service from a Dockerfile, injects a `PORT`, terminates TLS at its edge, offers private networking by service name and PostgreSQL as a service, and has no Caddy in the path. The web image had its port, its backend host name and the private-mode password (in Caddy) fixed for the Compose stack.

## Decision

Backend and web are separate Railway services built from the existing Dockerfiles, with PostgreSQL as a Railway service; only `web` has a public address. The web image now renders its nginx configuration at start-up from environment variables: `PORT`, `API_UPSTREAM` and the DNS resolver taken from the container, so the backend address can change after a redeploy. Private mode moves into the web image: `WEB_ACCESS=private` (the default) requires `DEMO_ACCESS_USER` and a bcrypt `DEMO_ACCESS_HASH` and refuses to start without them, `WEB_ACCESS=none` opens the site, and `/healthz` stays open for the platform's health check. The Compose stack sets `WEB_ACCESS=none` because Caddy remains its gate. The backend listens on `PORT` and keeps its database settings in the same `SPRING_DATASOURCE_*` variables on both hosts. Trusted client-address ranges gain `100.64.0.0/10` and `fc00::/7` for the platform edge and private network.

## Alternatives Considered

- **One service serving both the web build and the API.** Rejected: it changes the architecture and the images that the VPS guide already uses.
- **Caddy as a Railway service.** Rejected: a second proxy behind Railway's own TLS edge for the sake of one password.
- **A Railway-only Dockerfile.** Rejected: two images to keep in step; one image configured by environment serves both hosts.
- **Open by default.** Rejected: the private default fails closed.

## Consequences

- The same web image runs on Railway and under Compose; the VPS guide stays valid.
- nginx resolves the backend per request, so a redeployed backend is found again without restarting `web`.
- The client-address ranges for Railway's edge are unconfirmed until the first deployment; if they differ, visitors would share one rate-limit bucket, which the guide tells the deployer to check.

## Validation

`deploy/verify-web-config.sh` renders the real template and start-up script in the stock nginx image and checks the refusal without credentials, `401` without or with a wrong password, `200` with the right one, the proxied API path, the open health path and a custom `PORT`; it runs in CI. The backend was started with `PORT` set and answered its health check.
