# SS-094: Remove The Simulated Payment

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-094 (#189)](https://github.com/Samska/samska-sandbox/issues/189)
- Pull request: See the Issue
- ADRs: [ADR 0021](../adr/0021-remove-the-simulated-payment.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why removing a feature means removing what only existed to support it.
- Why a retry key must exist even when the step it protected is gone.
- How to drop tables and rename an idempotency column with a forward migration.

### Core — Know this for interviews

The simulated payment gave Checkout two steps and a Payment module. Placing an Order is still a write that can end in an unknown state when a response is lost, so the idempotency key stayed: the client sends a `requestId`, and the same id returns the same Order. Everything that existed only for the payment went away: its tables, the stock reservation taken on approval, the attempt URLs and the "Resume payment" notice.

## Concepts explained

### Idempotency without a payment

The Payment attempt id used to be the key that made Order creation safe to repeat. Renaming the column to `request_id` keeps that guarantee and leaves existing Orders valid. The browser keeps the id while the result is unconfirmed and drops it after a definite refusal, so a changed Cart gets a fresh id.

### Removing stock reservations

A reservation held units between approval and Order. With one step there is no gap to protect, so available stock is the units on hand and the Order takes them under the same row locks that already prevented overselling.

### Historical documents

ADRs and learning notes about the payment describe the design of their day. They are marked superseded rather than rewritten, and the new ADR explains the change.

## Check your understanding

1. Why was the idempotency key kept when the payment was removed?
2. What breaks if the browser reuses a request id after the Cart changed?
3. Why does the migration rename a column instead of dropping and recreating it?
