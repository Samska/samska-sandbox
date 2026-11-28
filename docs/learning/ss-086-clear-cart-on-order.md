# SS-086: Empty The Cart When An Order Is Created

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-086 (#170)](https://github.com/Samska/samska-sandbox/issues/170)
- Pull request: See the Issue
- ADRs: [ADR 0007](../adr/0007-adopt-attempt-addressed-browser-recovery.md) (superseded in part)
- Canonical documentation: [Architecture](../ARCHITECTURE.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a side effect that follows a committed write must not undo or hide it.
- Why only the first creation of an Order may touch the Cart, not a replay.

### Core — Know this for interviews

Order creation is idempotent per Payment attempt. Emptying the Cart is a side effect of the first creation only; a replay returns the stored Order and leaves a Cart filled afterwards alone. The Cart is emptied after the Order is stored, so a failure there is logged and the customer still gets the Order.

## Concepts explained

### Changing an earlier decision

ADR 0007 kept the Cart after an Order so recovery pages never depended on it. Recovery already reads the frozen Order, so clearing the Cart does not break it. The ADR now points to this change instead of being rewritten.
