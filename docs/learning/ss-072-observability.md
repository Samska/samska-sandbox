# SS-072: Observability With Correlation IDs

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-072 (#140)](https://github.com/Samska/samska-sandbox/issues/140)
- Pull request: See the Issue
- ADRs: [ADR 0016](../adr/0016-observe-requests-with-correlation-ids.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a correlation ID is attached to every request and how a logging context carries it.
- Which figures belong in a database query and which in in-process meters.
- Why "no data" differs from zero.

### Core — Know this for interviews

Logs, metrics and traces answer different questions; a percentile is not an average; untrusted headers must be validated before they reach logs.

## Concepts explained

### Correlation ID

One ID per request, in the response header and in every log line, lets you follow a request across lines. An incoming ID is accepted only when it has a safe shape, so it cannot forge log lines.

### Percentile

The 95th percentile says how slow the slowest one in twenty requests was, which an average hides.

### No data

A rate with no samples is unknown. Showing zero would claim the system is perfect.
