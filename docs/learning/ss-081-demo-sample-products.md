# SS-081: Sample Products For The Hosted Demo

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-081 (#158)](https://github.com/Samska/samska-sandbox/issues/158)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Deployment](../DEPLOYMENT.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why start-up seed data must be idempotent and must never overwrite existing data.
- Which data a reset removes and which it keeps.

### Core — Know this for interviews

A seed runs on every start, so it must be safe to run again: it acts only when the catalog is empty and does nothing otherwise. Separating "data the demo resets" (Orders, Carts, customers, stock levels) from "data the owner curates" (Products, the administrator) is what lets the samples survive the daily reset.

## Concepts explained

### Seeding through the application service

The seed creates Products with the same application service and Inventory that the API uses, so validation and stock records follow the normal rules and no SQL is duplicated.

### Opt in by configuration

`SAMSKA_DEMO_SEED_PRODUCTS` defaults to false, so tests, local development and a private release start empty as before.
