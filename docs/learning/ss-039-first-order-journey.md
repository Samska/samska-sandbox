# SS-039: First Order End-to-End Journey with Attempt-Addressed Recovery

- Status: Completed
- Work date: 2026-10-06
- Last reviewed: 2026-10-06
- Work item: [SS-039](https://github.com/Samska/samska-sandbox/issues/69)
- Pull request: [#70](https://github.com/Samska/samska-sandbox/pull/70)
- ADRs: [ADR 0007](../adr/0007-adopt-attempt-addressed-browser-recovery.md), [ADR 0006](../adr/0006-adopt-order-owned-in-memory-store.md), [ADR 0005](../adr/0005-adopt-payment-attempt-store-with-cart-revision.md)

## What you should learn

- A URL identifier as a recovery handle without server persistence
- GET-only reconciliation versus retrying an uncertain POST
- Pending-operation guards and stale-response invalidation in a UI
- Why a `404` is evidence of absence only for the lookup that returned it
- Explicit abandonment as a lifecycle transition, not a deletion

### Core — Know this for interviews

- One stable attempt UUID resolves both Payment and Order; the URL is a hint, the API is authority
- Synchronous pending registration plus generation tokens prevent duplicate and stale effects
- `404` never proves restart or cancellation; a late completion must replay safely

## Concepts explained

**Recovery handle versus source of truth.** The browser keeps a payment attempt UUID in the URL and one `sessionStorage` hint. Neither proves a decision or an Order; both are only addresses for lookups. Every displayed result comes from a fresh, structurally validated API response whose identity matches the requested attempt.

**GET-only recovery.** On reload or direct entry the surface looks up the Order first and the Payment attempt only after an Order `404`. No POST is triggered by navigation, reload, or lookup completion. This separates reconciliation (safe, repeatable reads) from transaction (explicit, once).

**Pending-operation guards.** The Payment POST is registered in a ref before the URL changes and before the request is sent, so a route effect cannot start reads for the same attempt. Each read carries a generation token; starting a POST or changing attempts invalidates older generations, so a late `404` cannot replace an active pending state or enable a second attempt.

**Honest absence.** A `404` means one lookup did not find a record. It cannot distinguish "never created", "lost on restart", or "still processing". The UI therefore keeps an unavailable state with retry and explicit abandonment instead of inferring a restart or silently starting over.

**Lifecycle transitions.** API-confirmed results, unconfirmed results, and abandonment are different states. A new Payment may replace a finished reference, but an approved attempt awaiting its Order or an unresolved reference needs an explicit choice first. Abandoning or forgetting clears only browser discovery; it never cancels a request or deletes a record.

**Recovery decoupled from live data.** Payment results use the Payment-captured snapshot and Order confirmations use the frozen Order, so failing Cart or Catalog loads cannot hide a recovered result. Starting a new payment remains impossible without a loaded, reviewed Cart.

## How Samska uses it

`web/src/journey/routes.ts` owns pathname parsing, `navigateTo`, and the external path store; `referenceStorage.ts` guards the single `sessionStorage` key against tampering and unavailable storage; `AttemptSurface.tsx` renders recovery, pending, and abandonment states; `LatestJourneyLink.tsx` exposes discovery. `Catalog.tsx` remains the journey controller with the synchronous guard refs, generation counters, alignment on `409 already-approved`, and the recovery runner. The backend is unchanged; `backend/src/test/java/io/github/samska/sandbox/journey/FirstOrderJourneyApiTest.java` proves the cross-module journey against the existing APIs.

## Interview perspective

Explain why a client-generated attempt UUID can be a safe idempotency key, why reconciliation must be GET-only, how generation tokens prevent stale responses from winning, and what a `404` can and cannot establish in a process-local system. Be ready to contrast this hint-based recovery with a durable server-side session.

## What not to worry about yet

Persistence, authentication, hosting, Order history, cross-device discovery, inventory, shipping, taxes, and automated real-browser end-to-end testing.

## Reference

- Issue: [SS-039](https://github.com/Samska/samska-sandbox/issues/69)
- Pull request: [#70](https://github.com/Samska/samska-sandbox/pull/70)
- ADR: [ADR 0007](../adr/0007-adopt-attempt-addressed-browser-recovery.md)
- Prior boundaries: [ADR 0005](../adr/0005-adopt-payment-attempt-store-with-cart-revision.md), [ADR 0006](../adr/0006-adopt-order-owned-in-memory-store.md)
- Canonical documentation: [Architecture](../ARCHITECTURE.md), [Product](../PRODUCT.md), [Testing](../TESTING.md), [Security](../SECURITY.md)
