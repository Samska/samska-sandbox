# SS-098: Fixed Example Catalog

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-098 (#197)](https://github.com/Samska/samska-sandbox/issues/197)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Deployment](../DEPLOYMENT.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a seed that must be re-run safely matches by a natural key and only adds.
- How a fixed example data set differs from data a reset removes.

### Core — Know this for interviews

Start-up seeding runs on every deploy, so it must be idempotent. This one adds a sample only when no Product with that name exists, so running it twice, or against a catalog that already holds some of the samples, produces the same result and never edits what is there. Products are not part of the reset, which keeps the catalog permanent.

## Concepts explained

### Matching by name

Names are the only stable key of a sample: its identifier is generated when it is created. Matching by name lets production grow from 6 to 18 Products without duplicates.

### Trade-off

An administrator who deletes a sample sees it return at the next start-up. Turning `SAMSKA_DEMO_SEED_PRODUCTS` off stops that.
