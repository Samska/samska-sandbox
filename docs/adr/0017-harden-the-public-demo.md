# ADR 0017: Harden The Public Demo In The Application And The Production Profile

- Status: Accepted
- Date: 2026-11-27
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-073 (#142)](https://github.com/Samska/samska-sandbox/issues/142), [ADR 0012](0012-adopt-release-plan-to-v1.md), [ADR 0013](0013-adopt-account-sessions-and-ownership.md)

## Context

v1.0.0 exposes the application to hostile users and automated traffic. The controls must be small, testable and honest about limits.

## Decision

A first servlet filter after request observability applies an in-memory fixed-window limiter per client address: strict for `POST /api/auth/login` and `/register`, generous for everything else under `/api`, answering `429 {"code":"rate-limited"}` with `Retry-After`. There is no per-account lockout. Spring Security adds a restrictive API policy, `Referrer-Policy`, `Permissions-Policy` and HSTS. A `prod` profile turns on secure cookies and forwarded-header handling, and a `ProductionGuard` refuses unsafe settings at startup. Tests and the browser suite switch the limiter off with `samska.ratelimit.enabled=false`; dedicated API tests prove it.

## Alternatives Considered

- **A library such as Bucket4j or Resilience4j.** Rejected: a new dependency for a counter that fits in sixty lines.
- **Per-account lockout.** Rejected: it lets an attacker lock a victim out.
- **A gateway or WAF.** Deferred: not justified for a single-process demo.

## Consequences

- Limits reset on restart and are per process, which is stated in the Threat Model.
- Behind a proxy, the client address is the forwarded one only when the proxy is trusted, so the proxy must overwrite forwarded headers.

## Validation

`RateLimiterTest`, `HardeningApiTest`, `SecureCookieApiTest` and `ProductionGuardTest`.
