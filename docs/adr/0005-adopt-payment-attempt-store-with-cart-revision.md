# ADR 0005: Adopt a Payment-Owned In-Memory Attempt Store with Revision-Checked Cart Snapshots

- Status: Accepted
- Date: 2026-09-28
- Decision makers: Samska (human owner) with AI implementation support
- Related: [SS-036](https://github.com/Samska/samska-sandbox/issues/61), [SS-032](https://github.com/Samska/samska-sandbox/issues/53), [ADR 0001](0001-adopt-modular-monolith.md), [Architecture](../ARCHITECTURE.md), [Security](../SECURITY.md), [Testing](../TESTING.md), [Product](../PRODUCT.md)

## Context

Checkout is a frontend view over the single current Cart; entering it creates no backend resource. The owner-approved Payment Simulator capability is the first irreversibility point: a simulated payment decision should apply to one frozen view of the Cart, not to whatever the Cart contains when a later request reads it. Prior work deferred "the immutable transactional snapshot" to this capability without deciding which module owns it, how it is addressed, or how concurrent Cart edits and duplicate submissions are resolved.

Several forces shape the choice:

- Cart already owns atomic reads. `Cart.snapshot()` captures items and total under one lock, but it carries no identity, so two reads around a mutation cannot be compared.
- The capability is a local MVP with no persistence, authentication, or hosting. Any guarantee is bounded to one backend process and its lifetime.
- Duplicate submissions and lost responses are real user-visible problems even in a simulation; a decision must be replayable by identity instead of being decided twice.
- Architecture principles require one owning module per durable concept, directional dependencies, and no distributed coordination without demonstrated need.

## Decision

Introduce a Payment business boundary that owns identified, immutable simulated-payment attempts in bounded process memory:

- **Ownership.** Payment owns attempts, decisions, and the snapshot values captured for each attempt. Cart remains the single owner of Cart state and monetary calculation; Payment obtains a snapshot only through the Cart-owned application operation and never reads Cart storage directly. The dependency remains one-way: Payment → Cart.
- **Revision-checked capture.** Cart carries a monotonically increasing revision in its snapshot and API responses, incremented on each successful mutation. `Cart.snapshotForRevision(expectedRevision)` compares the revision and captures items, total, and revision atomically under the Cart monitor, throwing a mismatch instead of returning stale state.
- **Lock order and atomicity.** Payment serializes initiation through one store lock that also guards the attempt map, the approved-revision set, and the capacity count. Under that lock, initiation checks same-ID replay, captures through the revision check, enforces the one-approval-per-revision and capacity guards, and stores the result before releasing. The nested lock order is **Payment → Cart**; Cart paths never acquire the Payment lock. There is no I/O inside either lock.
- **Replay and conflict semantics.** An identical request with an existing attempt ID replays the stored result; a different scenario or revision with the same ID is a conflict. One unchanged Cart revision can hold at most one approved attempt; later attempts return the existing result's identity. Declined and failed attempts are final and replayable, and a retry uses a new identity.
- **Capacity.** The store retains at most 32 attempts without eviction or ID recycling, so earlier results stay retrievable and duplicate protection is not weakened. Capacity exhaustion refuses only new attempts.
- **Boundaries.** Three explicit local-demo outcomes (approve, decline, temporary failure) exist for demonstration; there is no real payment processing, provider, credential, card-data field, external call, or Order creation. The HTTP API is unauthenticated, and local-only is a deployment/use constraint, not access control.
- **Lifetime.** Attempts and duplicate protection are lost on backend restart together with Products, Cart, and uploaded media. A lookup after restart returns not-found, which requires Cart reload and a new explicit initiation; no request is resubmitted automatically.

No new dependency, infrastructure, persistence, queue, or distributed coordination is introduced.

## Alternatives Considered

- **Stateless decision computed per request without stored attempts.** Rejected: a lost response or duplicate click would decide again, and there would be no way to reconcile the original outcome by identity.
- **Cart-owned snapshot capture that stores an "in-progress" payment against the Cart.** Rejected: it mixes irreversibility state into the Cart aggregate and forces Cart to grow a payment concept it does not own.
- **Optimistic revision check without a Payment store lock (compare-and-set only).** Rejected: two simultaneous initiations for the same revision could both capture and decide unless the guard, capture, and record happen atomically; the store lock makes the invariant reviewable and testable.
- **Persisting attempts in PostgreSQL.** Rejected for this MVP: persistence is deliberately deferred, and process-local data already resets on restart.
- **Evicting or recycling attempt IDs at capacity.** Rejected: it would weaken replay, lookup, and duplicate protection that the capability exists to provide.
- **Random or provider-simulated decisions.** Rejected: unreliable outcomes make local demonstration and verification non-deterministic; the explicit scenario selector is deterministic and honest about being a simulation.
- **Creating an Order on approval.** Rejected and explicitly deferred: Order creation remains a later roadmap capability and must not be pulled forward.

## Consequences

Positive:

- A simulated decision always applies to one identified, frozen Cart revision, and later Cart edits cannot retroactively change a result.
- Same-ID retries, duplicate clicks, and approval races have deterministic, testable outcomes under one documented lock order.
- The Payment boundary stays small, in-process, and dependency-light, consistent with the modular monolith.

Negative and operational:

- The guarantee is single-process and non-durable: restart clears attempts, replay protection, and the Cart.
- One lock serializes all payment initiations; acceptable at local-demo scale but not a throughput design.
- Cart responses and frontend validation gain a `revision` field, a visible contract change for consumers.
- The 32-attempt capacity is a hard limit that can interrupt a long local demonstration until the backend restarts.

Security:

- No credentials, card data, providers, or real transactions exist. Inputs are validated; responses and logs avoid exception internals.
- The endpoints and scenario selector are unauthenticated and must never be presented as a hosted simulation-control or payment capability.

Testing:

- Domain, store, service, and MockMvc tests cover revision mismatch, empty Cart, replay, conflicts, approval guards, capacity boundaries, and frozen snapshots, including latch-controlled interleavings for capture races and simultaneous approvals; frontend tests mock the transport and cover pending, three outcomes, stale-Cart refresh, uncertain-result reconciliation, capacity messaging, and focus.

## Validation

- Backend `clean verify` and frontend typecheck, tests, and production build pass with the payment endpoints and revision field.
- Human Verification exercises editing then initiation, all three outcomes, stale-Cart behavior, uncertain-result recovery, capacity messaging, restart loss, keyboard focus, and narrow layout before merge.
- Revisit this decision if payment persistence, authentication or hosting, Order creation requiring durable payment references, multiple carts, or capacity and throughput requirements appear; supersede or amend this ADR rather than silently changing the model.
