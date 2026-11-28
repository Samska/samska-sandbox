# SS-088: Compact Market List And A Human Order Number

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: SS-088 (see the Issue linked from the pull request); design in [SS-085 (#168)](https://github.com/Samska/samska-sandbox/issues/168)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Design](../design/samska-store/README.md), [Architecture](../ARCHITECTURE.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a customer-facing number should not be the primary key.
- How to add a unique, gap-tolerant sequence to a table that already has rows.

### Core — Know this for interviews

A UUID primary key is good for internal identity and URLs because it is unguessable and needs no coordination, but it is unreadable for people. A separate `order_number` column filled by a database sequence gives a short, sortable, unique number without changing keys, foreign keys or URLs. A sequence can leave gaps (a rolled-back insert still consumes a number), so the number is an identifier, never a count of orders.

## Concepts explained

### Migrating a table that already has data

V10 creates the sequence, adds a nullable column, numbers existing rows by `created_at` with `ROW_NUMBER()`, moves the sequence past the highest number with `setval`, and only then makes the column `NOT NULL`, defaulted and unique. Adding the constraint last means the migration works on both an empty and a populated database.

### Where formatting lives

The backend stores a number and formats it once (`SK-000128`) in `Order.displayNumber`; the API sends the formatted text, so the frontend never builds the format. The UUID is still the key in URLs and Track links.

### A notice that shows only when it helps

The old "latest journey" box linked to the last payment attempt even after it finished. It is now a notice shown only while that attempt has no final result, because a finished attempt is already visible as an Order.
