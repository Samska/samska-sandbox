# SS-080: Web Image DNS Resolver On Railway

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-080 (#156)](https://github.com/Samska/samska-sandbox/issues/156)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Deployment](../DEPLOYMENT.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why nginx needs an explicit DNS resolver when the upstream is a variable.
- Why a default that works in Docker Compose can fail on another platform.

### Core — Know this for interviews

A default tuned to one environment is a hidden dependency. The web image fell back to Docker's embedded DNS (`127.0.0.11`), so Compose worked and Railway returned `502` for every `/api` request.

## Concepts explained

### Resolver for a variable upstream

With `set $api_upstream http://...; proxy_pass $api_upstream;` nginx resolves the name at request time and needs a `resolver`. The start-up script takes it from `NGINX_LOCAL_RESOLVERS`, which the stock image computes from `/etc/resolv.conf` only when `NGINX_ENTRYPOINT_LOCAL_RESOLVERS` is set. The image now sets it, so each platform's own DNS server is used (Railway's private network included).

### Verification

`deploy/verify-web-config.sh` starts the image with a known DNS server and checks that the rendered configuration uses it. Without the variable the same check fails with `127.0.0.11`, which reproduces the Railway defect.
