# SS-076: Railway Deployment

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-076 (#148)](https://github.com/Samska/samska-sandbox/issues/148)
- Pull request: See the Issue
- ADRs: [ADR 0020](../adr/0020-run-on-railway-with-environment-driven-web-image.md)
- Canonical documentation: [Deployment](../DEPLOYMENT.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- How one container image can run on different hosts by reading its configuration from the environment.
- Why a security default should fail closed.
- What a platform's own proxy changes about who the client is.

### Core — Know this for interviews

Build once, configure by environment. The image carries no host-specific values; the host supplies the port, the upstream address and the credentials, and the image refuses to start when a required secret is missing.

## Concepts explained

### Templates rendered at start-up

The official nginx image renders `*.template` files with `envsubst` when the container starts. The web image uses that for `PORT`, the backend address and the DNS server, and a small start-up script (sourced by the image's entrypoint) fills defaults and writes the access configuration. Limiting `envsubst` to a named list of variables keeps nginx's own `$host`-style variables intact.

### Resolving a name per request

nginx normally resolves an upstream name once at start-up. Putting the address in a variable and naming a resolver makes it resolve at request time, so a backend that redeploys to a new address is found again without restarting the web service.

### Fail closed

`WEB_ACCESS` defaults to `private`, and private mode without a user and a password hash stops the container. A forgotten variable therefore closes the site instead of opening it.

### Who is the client

Behind a platform edge, the address nginx sees is the platform's. The rate limiter needs the visitor's address, which the edge puts in `X-Forwarded-For`; nginx may trust that header only from known private ranges, otherwise a visitor could choose their own address. The platform's ranges are the unconfirmed part until the first deployment.

## Design record

No visible UI changed. The Railway layout, variables and setup steps are in the deployment guide; the VPS guide stays valid.

## Verification

`deploy/verify-web-config.sh` (also run in CI) renders the real template and start-up script in the stock nginx image and checks refusal without credentials, `401` without or with a wrong password, `200` with the right one, the proxied API path, the open health path and a custom `PORT`. The backend was started with `PORT` set and answered its health check. Not verified: the Railway build itself.
