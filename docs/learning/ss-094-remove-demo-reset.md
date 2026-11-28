# SS-094: Remove The Demo Reset

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-094 (#191)](https://github.com/Samska/samska-sandbox/issues/191)
- Pull request: See the Issue
- ADRs: [ADR 0018](../adr/0018-add-demo-mode-and-containers.md) (reset removed)
- Canonical documentation: [Deployment](../DEPLOYMENT.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a capability that is safe in one context becomes dangerous when the context changes, and how to retire it.
- Why a header such as HSTS must be repeated in nginx locations that set their own headers.

### Core — Know this for interviews

The demo reset was built for a throwaway public demo. When the site became the owner's own store, a switch or schedule that wipes Orders and accounts was a liability, so the code path was deleted rather than hidden: there is nothing left to enable by mistake. A test now asserts the endpoint answers 404 even for an administrator.

## Concepts explained

### nginx `add_header` inheritance

A `location` that declares any `add_header` stops inheriting the server-level ones. The HSTS header therefore appears in each location, and `deploy/verify-web-config.sh` checks the site, the API and the fonts.
