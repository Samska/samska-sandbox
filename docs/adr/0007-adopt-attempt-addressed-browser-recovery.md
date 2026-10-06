# ADR 0007: Adopt Attempt-Addressed Browser Recovery for the First Order Journey

- Status: Accepted
- Date: 2026-10-06
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-039](https://github.com/Samska/samska-sandbox/issues/69), [ADR 0005](0005-adopt-payment-attempt-store-with-cart-revision.md), [ADR 0006](0006-adopt-order-owned-in-memory-store.md), [Architecture](../ARCHITECTURE.md), [Security](../SECURITY.md), [Testing](../TESTING.md), [Product](../PRODUCT.md)

## Context

ADR 0005 and ADR 0006 deliberately kept Payment attempt and Order identity in memory only: in-app navigation retains the identity, and a full-page reload cannot rediscover it through the UI. The owner-approved First Order journey closes that gap without adding persistence, a router, or a browser end-to-end framework.

Forces shaping the decision:

- Payment and Order remain bounded, process-local stores; a browser reference may outlive the backend records, and a `404` cannot establish why a record is unavailable or whether a request is still completing.
- The existing frontend resolves Market and Admin surfaces from `window.location.pathname` with same-origin links and no router dependency; the Checkout surface was local view state.
- Browser-held identifiers are public to the user and same-origin scripts, and URLs can appear in browser history, logs, and copied links.
- SS-037 left real-browser observations of API replay, uncertain-response recovery, and accessibility pending; the journey must make those behaviors reproducible without retrying transactional requests automatically.

## Decision

Introduce attempt-addressed journey surfaces with API-confirmed recovery:

- **Addressable surfaces.** `/checkout` renders the editable live Cart. `/checkout/attempts/{attemptId}` renders the Payment result or Order confirmation, resolved through the existing `GET /api/payment-attempts/{attemptId}`, `GET /api/orders/payment-attempts/{attemptId}`, and `GET /api/orders/{orderId}` operations. Pathname selection is extended with narrowly scoped History API and `popstate` handling; no router dependency is introduced.
- **Minimum recovery handle.** The payment attempt UUID is the only required identity. It is registered locally and established in the URL before a Payment POST is dispatched; if the URL cannot be established, no POST is sent. The URL and one latest-reference UUID in `sessionStorage` are lookup hints, never evidence; only a valid, matching API response is authority.
- **Pending operations are not recoverable reads.** A synchronous in-memory guard marks the Payment or Order POST active before it is sent. Route-driven reads never run for an attempt with an active local operation, and an early `404` or any older response cannot replace the pending state, alter another attempt, or enable a transactional action. Reads carry attempt identity and a generation token; starting a POST invalidates earlier generations, and responses apply only when identity, generation, and expected state still match.
- **Reload and history semantics.** After reload, the reference means "look up this reference", not "the operation failed". Recovery performs Order lookup first and Payment lookup only after an Order `404`. One or two `404`s never prove restart, completed absence, or that an earlier POST cannot still complete; a late completion replays to the same Order. Route entry, reload, Back, and Forward never dispatch transactional requests.
- **Reference lifecycle.** API-confirmed resolution, unconfirmed state, and explicit abandonment are distinct. Replacement rules: a new explicit Payment may replace a confirmed finished reference; a confirmed approval awaiting its Order requires an explicit choice to leave; an uncertain or unavailable reference requires explicit abandonment; no replacement starts while an operation is locally pending. Forgetting or abandoning clears browser discovery and continuation only; it never cancels an in-flight request, deletes backend records, or reverses a simulated Payment or Order. Unavailable or tampered `sessionStorage` fails safely while URL recovery still works.
- **Already-approved alignment.** When initiation returns `409 already-approved` with an existing attempt ID, the URL and latest-reference hint align with that API-confirmed attempt and its result; the newly proposed UUID is never presented as approved.
- **Recovery independent of live data.** Payment results render from the Payment-owned captured snapshot and Order confirmation from the Order-owned frozen record, even when Cart or Catalog loading fails. Creating an Order from a recovered approval requires no live Cart read; starting a new Payment still requires a loaded, reviewed Cart.
- **Retained live Cart.** Order creation never clears or locks the live Cart; confirmation copy states that the Cart was not cleared and may have changed.
- **Boundaries.** The endpoints remain unauthenticated and local-only as a deployment and use constraint, not access control. No persistence, cross-process guarantee, Order history, or cross-device discovery is added.

## Alternatives Considered

- **Accept that reload loses recovery (status quo of ADRs 0005 and 0006).** Rejected: the approved First Order journey requires reload, direct-entry, and history recovery for the attempt.
- **Durable server-side journey sessions keyed by a cookie or token.** Rejected for this scope: it introduces identity, persistence, and security scope that the local MVP deliberately defers.
- **`localStorage` or an Order-history list.** Rejected: it overstates record lifetime, retains identifiers beyond the tab, and grows a browsing feature the plan excludes.
- **Automatic POST retry or resubmission after recovery reads.** Rejected: it would risk duplicate decisions or Orders and violates the explicit-action rule; recovery is GET-only with explicit user actions.
- **A client router dependency.** Rejected: three addressable surfaces do not justify a new dependency and migration when pathname selection already exists.
- **Playwright or another browser framework now.** Deferred: component and API tests plus required real-browser Human Verification cover the risk without adding dependencies or CI infrastructure; revisit if journey regressions justify automation.

## Consequences

- A reloaded or directly opened attempt URL recovers the API-confirmed Payment result or Order without creating, approving, or cancelling anything.
- Uncertainty is honest and durable across navigation and reload: no `404` implies restart, and a new journey requires explicit abandonment after a reviewed Cart.
- One `sessionStorage` key is the only browser persistence; it is a discovery hint with a safe failure mode.
- Guarantees remain single-process and non-durable: a backend restart clears Products, Cart, attempts, Orders, and their duplicate protection, while a browser reference can outlive them.
- Security posture is unchanged: identifiers are public, unauthenticated, and local-only; `sessionStorage` is not confidential storage.
- Testing gains route, guard, recovery, lifecycle, and cross-module journey coverage while real-browser behavior remains a Human Verification concern.

## Validation

Agent Verification covers component and API behavior, including identity/generation guards, reload recovery outcomes, alignment, storage failure, and recovery with failing Cart/Catalog loads, plus one cross-module MockMvc journey test. Human Verification exercises reload, direct entry, history navigation, replay, uncertain-response recovery, and accessibility in a real browser before commit or pull request. Revisit this decision if persistence, authentication or hosting, multiple carts, Order history, or browser journey automation becomes a requirement; supersede or amend this ADR rather than silently changing the model.
