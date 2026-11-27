# SS-074: Demo Mode And Containers

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-074 (#144)](https://github.com/Samska/samska-sandbox/issues/144)
- Pull request: See the Issue
- ADRs: [ADR 0018](../adr/0018-add-demo-mode-and-containers.md)
- Canonical documentation: [Deployment](../DEPLOYMENT.md), [Security](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- How a multi-stage image keeps build tools out of the runtime image.
- Why a reverse proxy should overwrite forwarded headers it does not trust.
- Why a destructive demo feature is off by default and needs a second confirmation.

### Core — Know this for interviews

Configuration through environment, least exposure (one published port), and verifying a deployment by running it.

## Concepts explained

### Multi-stage build

One stage compiles; the final stage copies only the artifact, runs as a non-root user and carries no compiler.

### Trusting a proxy

A rate limiter keyed on the client address is only as honest as the address it receives. The proxy sets it; the application never trusts a client-supplied one.

### Reset

A reset must remove what visitors made without removing what the operator prepared, and it must end their sessions, because their accounts no longer exist.
