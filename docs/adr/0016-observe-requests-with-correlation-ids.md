# ADR 0016: Observe Requests With Correlation IDs And Micrometer Meters

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-072 (#140)](https://github.com/Samska/samska-sandbox/issues/140), [ADR 0012](0012-adopt-release-plan-to-v1.md)

## Context

v0.6.0 needs an administrator screen whose every figure is traceable, and logs that let one request be followed across lines.

## Decision

A servlet filter runs first for `/api/**`. It accepts an incoming `X-Request-Id` only when it matches `[A-Za-z0-9-]{8,64}`, otherwise it generates a UUID; it returns the ID in the response, puts it in the logging context as `requestId` (printed in the log level field) and writes one line with method, path, status and duration. It never logs headers, query strings, bodies or identities. The same filter records Micrometer meters: `samska.requests`, `samska.requests.errors` (5xx) and `samska.checkout.duration` (Payment attempt requests, 95th percentile over about 15 minutes). `GET /api/admin/operations`, restricted to administrators, combines those meters with SQL counts over `orders` and `payment_attempts` for the last hour and 24 hours (`payment_attempts.created_at` is new) and a database round trip as service health. A rate with nothing to measure is `null`, shown as "No data yet", never as zero.

## Alternatives Considered

- **Expose Actuator metrics to the browser.** Rejected: it widens the public surface; one admin-only endpoint states exactly what is shown.
- **An external metrics store.** Rejected: no demonstrated need for a single process.
- **Counting from access logs.** Rejected: harder to test and to trace to a query.

## Consequences

- Latency and error figures reset when the process restarts and are stated as such on the screen.
- Approval rate is approved attempts over all attempts in 24 hours.

## Validation

`RequestMetricsTest` covers counting, the percentile and the no-data case. `OperationsApiTest` covers admin-only access, figures following real Orders and attempts, and correlation IDs. Web tests and a Playwright test cover the screen.
