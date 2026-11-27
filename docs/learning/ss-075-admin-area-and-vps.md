# SS-075: Admin Area Separation And VPS Deployment

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-075 (#146)](https://github.com/Samska/samska-sandbox/issues/146)
- Pull request: See the Issue
- ADRs: [ADR 0019](../adr/0019-separate-admin-area-and-terminate-tls-with-caddy.md)
- Canonical documentation: [Deployment](../DEPLOYMENT.md), [Security](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why interface separation is a usability feature and the server check is the security feature.
- What TLS termination does and why one container owns the public ports.
- Why backups are only real once a restore has been tested.

### Core — Know this for interviews

Defence in depth for authorization, least exposure in deployment, and the difference between a build that works and an operation you can recover.

## Concepts explained

### Two layers of authorization

Hiding a link prevents a mistake; the server refusing a request prevents an attack. Both exist, and only the second counts as security.

### Reverse proxy

A reverse proxy receives public traffic, handles TLS and forwards to private services. Because it sets the client address header, services behind it may trust that header only from it.

### Backup and restore

A dump is a copy; a restore script you have never run is a hope. The deployment guide names the first deployment as the place to run it.
