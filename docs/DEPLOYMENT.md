# Deployment

This guide runs the hosted demo: a synthetic-data store that anyone may use, so it is constrained and disposable. It does not choose a hosting provider; the owner decides where it runs.

## What runs

`compose.demo.yaml` starts three containers: PostgreSQL (no published port), the backend with the `prod` profile and demo mode on, and the web server. The web server is nginx: it serves the single-page application with a restrictive Content-Security-Policy and proxies `/api` to the backend. Only the web port is published, on `127.0.0.1` unless you change it.

## Steps

1. Copy `.env.demo.example` to `.env.demo` (Git ignores it) and set `POSTGRES_PASSWORD`, `SAMSKA_ADMIN_EMAIL` and `SAMSKA_ADMIN_PASSWORD`. The administrator password must have at least 12 characters, and the `prod` profile refuses to start otherwise. Generate fresh values; never reuse a real password.
2. Run `docker compose --env-file .env.demo -f compose.demo.yaml up --build -d`.
3. Open `http://127.0.0.1:8080`, sign in as the administrator and create a few synthetic Products.
4. For a public address, put a TLS-terminating proxy you control in front of the web container, and make that proxy set `X-Forwarded-Proto: https`. The web container overwrites `X-Forwarded-For` with the address that connects to it, which behind such a proxy is the proxy's address. All visitors then share one rate-limit bucket, which is safe but coarse. Per-visitor limits need the proxy to preserve the client address at the network level.

## Demo mode

`SAMSKA_DEMO_ENABLED=true` (set by the Compose file) shows a banner on every page and enables **Reset demo data** on the Operations screen. A reset removes every Order, Payment attempt, Cart and customer account, restores stock to 25 and signs everyone else out; Products and the administrator stay. Set `SAMSKA_DEMO_RESET_CRON` to a Spring cron expression, for example `0 0 4 * * *`, to reset automatically.

## Operating notes

- Logs carry an `X-Request-Id` per request; the same ID is returned in the response header.
- `GET /actuator/health` is public; details are not exposed.
- The database volume `demo-postgres-data` persists until `docker compose ... down -v`.
- Sessions and rate limits live in the backend process and reset when it restarts.
- Real data and real payments are never appropriate. See the [Threat Model](THREAT-MODEL.md) and [Security](SECURITY.md).

## Verification

The images were exercised locally with the Compose file: the stack became healthy, the web server delivered the single-page application with its policy headers, `/api/config` reported demo mode, API responses carried a request ID, and the sixth to eleventh credential attempts were refused with `429`. The Docker builds themselves run `./mvnw` and `npm ci` inside the build; a build host with TLS interception needs its certificate authority trusted in the build.
