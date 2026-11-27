# SS-069: Accounts, Sessions And Ownership

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-069 (#133)](https://github.com/Samska/samska-sandbox/issues/133)
- Pull request: See the Issue
- ADRs: [ADR 0013](../adr/0013-adopt-account-sessions-and-ownership.md)
- Canonical documentation: [Security](../SECURITY.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a server-side session with an HttpOnly cookie is simpler and safer than tokens in browser storage for one origin.
- How CSRF is stopped with the cookie-to-header pattern, and why forms and JSON endpoints both need it.
- How authorization differs from ownership: a role guards routes, an owner scopes rows.
- Why "not yours" answers 404 rather than 403.

### Core — Know this for interviews

Authentication versus authorization, session fixation, BCrypt and its 72-byte limit, and constant-time-ish failure paths so sign-in does not reveal which emails exist.

## Concepts explained

### Ownership as a port

Cart, Payment and Order do not know about HTTP or sessions. They ask `CurrentAccount` for an owner and add it to every query, so a forgotten filter is a code-review question in one place per store.

### Verifying against a dummy hash

When the email is unknown, the service still checks the password against a fixed hash so the response time is similar and an attacker cannot list registered emails from timing.

### Test switch

`samska.security.enforced=false` keeps older suites simple. The cost is that the default test run does not exercise security, so the dedicated tests and the browser suite run with it on.
