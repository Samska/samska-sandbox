# SS-097: The Administrator Sets Order Status

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-097 (#196)](https://github.com/Samska/samska-sandbox/issues/196)
- Pull request: See the Issue
- ADRs: [ADR 0022](../adr/0022-administrator-sets-order-status.md), which supersedes [ADR 0014](../adr/0014-derive-simulated-shipments.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a status that people can change is stored as events rather than overwritten.
- How a side effect, returning stock on cancel, stays correct by sharing one transaction and a row lock.

### Core — Know this for interviews

A derived value cannot be edited, so once a person owns the decision the state must be stored. Storing each change as an event keeps the time of every step for free: the timeline is the list of events, and the current status is the latest one. Concurrency is handled by locking the Order row, so two administrators, or a double click, take turns, and a repeated cancel is rejected instead of returning stock twice.

## Concepts explained

### Default without a row

An Order with no events is Placed. That avoids a data migration and keeps the Order insert untouched, which another change was rewriting at the same time.

### Corrections versus a final state

Moving back and forth is allowed because a person makes mistakes, and the history shows them honestly. Cancelling is the one irreversible step, because reopening would need stock that may be gone.

### Where the guards live

Authorization is the existing `/api/admin/**` rule, so a customer gets 403 and a visitor 401 without new code. The status rules live in the store, inside the transaction that holds the lock, so no caller can skip them.
