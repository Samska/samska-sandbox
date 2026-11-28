# SS-073: Rate Limiting And Production Hardening

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-073 (#142)](https://github.com/Samska/samska-sandbox/issues/142)
- Pull request: See the Issue
- ADRs: [ADR 0017](../adr/0017-harden-the-public-demo.md)
- Canonical documentation: [Security](../SECURITY.md), [Threat Model](../THREAT-MODEL.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- How a fixed-window rate limiter works and what it cannot stop.
- Why per-account lockout can be an attack in itself.
- Why a production profile should fail closed.

### Core — Know this for interviews

Defence in depth, fail-closed configuration, and writing a threat model as threats, controls and residual risk.

## Concepts explained

### Fixed window

Count hits per client per minute and refuse the rest with `429` and `Retry-After`. It is cheap, but a client can use two windows back to back, and it counts addresses, not people.

### Fail closed

The `prod` profile refuses to start with weak settings, so a misconfiguration is found at deploy time, not by an attacker.

### Residual risk

Every control has a gap. Writing the gap down is part of the control.
