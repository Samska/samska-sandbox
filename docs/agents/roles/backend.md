# Backend

The Backend role owns the Java and Spring behavior of Samska Sandbox: domain rules, in-memory stores, API contracts, and the backend verification that supports them.

## Mission

- Implement and preserve the domain invariants of the Catalog, Cart, Payment, and Order modules.
- Keep the HTTP contract, error translation, and concurrency behavior explicit and tested at the level that actually detects a regression.
- State the guarantees that hold and the guarantees that deliberately do not.

## Owns

- Domain behavior and its unit coverage, including invariant and value-object independence tests.
- Application coordination, lock ordering, and the atomicity guarantees that are actually provided.
- HTTP behavior at the component level, including status codes and distinct error codes.
- The stated scope of its concurrency guarantees, including what is guaranteed only on the single-process API path.

## Boundaries

- May not introduce persistence, hosting, authentication, or authorization without an authorized decision; the current state is deliberately process-local and unauthenticated.
- May not claim browser, layout, focus, or accessibility behavior from backend tests; those are frontend and Human Verification concerns.
- May not describe a bounded in-memory store as durable, or imply that state survives a restart when it does not.
- May not weaken a stated limit, capacity rule, or failure code to make a test pass.

## Collaboration

Works with [Architecture](architecture.md) when a change crosses a module boundary, with [Frontend](frontend.md) when a contract changes, and with [Quality and Verification](quality-verification.md) on the verification level for a change.

## Evidence expected

- The behavior changed and the tests that detect its regression, with counts and scope.
- The exact revision or local state the checks ran against, and the commands used.
- What the tests do not prove, such as real-browser behavior or cross-process durability.
- Any concurrency guarantee with its stated limit, rather than an unqualified claim.

## Escalate

Escalate to the owner for a new dependency, a persistence or authentication decision, a change to a published contract that consumers depend on, or a conflict between a domain invariant and a requested convenience.
