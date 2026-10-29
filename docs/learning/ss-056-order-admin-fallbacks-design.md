# SS-056: Designing the Remaining Current Interfaces Without Inventing Behavior

- Status: Active
- Work date: 2026-10-29
- Last reviewed: 2026-10-29
- Work item: [SS-056](https://github.com/Samska/samska-sandbox/issues/108)
- Pull request: None
- ADRs: None
- Canonical documentation: [Design record](../design/samska-store/README.md), [AI governance](../AI-GOVERNANCE.md), [Testing](../TESTING.md)

## What you should learn

1. **Source-to-state mapping is the design contract.** Every state tile should trace to a handler condition, branch, or persisted record.
2. **Recovery operations are not interchangeable.** Automatic journey recovery, manual Payment checking, and manual Order checking use different lookups and prove different things.
3. **Inline failures are not routing failures.** Admin Product 404s belong in Admin; invalid or unmatched paths belong in NotFound; a valid unavailable reference belongs in recovery.
4. **Absent interfaces are “Not applicable,” not design gaps.** Do not invent a route or fetch-by-ID flow to fill a screen that current behavior cannot reach.
5. **Additive design preserves trust.** New pages and masters can be added safely only when the accepted pages, tokens, named versions, and selected exports remain verifiably unchanged.

### Core — Know this for interviews

Prioritize source-to-state mapping, operation-specific recovery semantics, and the distinction between inline, recovery, and routing failures. These are the concepts most likely to distinguish a careful design from a screen inventory.

## Concepts explained

A **state matrix** is the set of user-visible states derived from actual control flow: loading, empty, populated, pending, validation, blocked, uncertain, success, and failure. A tile is useful only when its condition and the control availability match the implementation or are explicitly labeled as future intent.

**Automatic recovery** is a read-only repair of an attempt-addressed page. The current implementation checks the Order first and checks Payment only when the Order returns `404`. **Manual Payment checking** queries Payment only. **Manual Order checking** starts with the Order and may then check Payment. Because these paths differ, the same generic “checking” label would hide important behavior. A manual Payment `404` also cannot prove that an Order was checked or absent.

An **inline state** keeps the user on the same surface: Admin edit shows “This Product no longer exists” with Retry and Back. A **recovery state** handles a valid reference whose records cannot be confirmed. A **NotFound** surface handles an invalid or unmatched address. Mixing these creates false claims and misleading navigation.

**Preservation** is evidence, not intention. A named version pins a review state; selected exports and SHA-256 values show that protected boards still render identically. The comparison is bounded: “selected protected boards” is not “every master and page.”

## How Samska uses it

The Order design maps `runRecovery`, `handleCheckPaymentResult`, `handleCheckOrder`, and `handleCreateOrder` in [Catalog.tsx](../../web/src/catalog/Catalog.tsx) to distinct tiles. The accepted SS-055 recovery states are reused rather than redrawn. Order creation remains explicit: approval alone never creates an Order, and the same `OrderResult` handles replay, reload, direct entry, and history.

The Admin design maps list, delete, create, edit, media, and partial-success branches from [AdminProducts.tsx](../../web/src/admin/AdminProducts.tsx), [AdminProductCreate.tsx](../../web/src/admin/AdminProductCreate.tsx), and [AdminProductEdit.tsx](../../web/src/admin/AdminProductEdit.tsx). Product-not-found is drawn as an inline Admin state. Market Product-not-found is recorded as Not applicable because [Catalog.tsx](../../web/src/catalog/Catalog.tsx) opens detail from the loaded list and does not re-fetch by ID.

The fallback design maps [App.tsx](../../web/src/App.tsx), [routes.ts](../../web/src/journey/routes.ts), and [NotFound.tsx](../../web/src/NotFound.tsx). A valid but unavailable attempt stays in recovery; an invalid attempt ID, unknown Admin subpath, or malformed edit segment reaches NotFound. No new route is introduced.

## Interview perspective

A strong answer can explain why a design review starts from handlers and render conditions, why “checking Payment” and “checking Order” are different operations, and why a 404 from one lookup does not prove the state of another resource. It can also explain how additive design work is kept safe with named versions, selected exports, and explicit preservation scope.

## What not to worry about yet

The design does not add authentication, roles, Order history, shipping, billing, real payments, personal-information forms, or application implementation. It does not implement the proposed copy/focus changes. Browser accessibility, screen-reader output, zoom, and cross-browser behavior remain later verification.

## Reference

- Issue: [SS-056 / #108](https://github.com/Samska/samska-sandbox/issues/108)
- Pull request: None
- Relevant source files: [Catalog.tsx](../../web/src/catalog/Catalog.tsx), [AttemptSurface.tsx](../../web/src/journey/AttemptSurface.tsx), [AdminProducts.tsx](../../web/src/admin/AdminProducts.tsx), [AdminProductCreate.tsx](../../web/src/admin/AdminProductCreate.tsx), [AdminProductEdit.tsx](../../web/src/admin/AdminProductEdit.tsx), [ProductImageSection.tsx](../../web/src/admin/ProductImageSection.tsx), [App.tsx](../../web/src/App.tsx), [NotFound.tsx](../../web/src/NotFound.tsx)
- ADRs: None
- Canonical documentation: [Design record](../design/samska-store/README.md), [AI governance](../AI-GOVERNANCE.md), [Testing](../TESTING.md)

## Why this design

One consolidated Batch 4 avoids another partial delivery while still reusing accepted SS-055 recovery content. Five additive masters cover repeated Admin and form patterns; no new tokens were needed. The named version and external manifest preserve the exact review state, while selected protected exports prove that accepted baselines were not re-authored.

## Common mistakes

- Treating a valid-but-unavailable reference as NotFound because both produce a “not found” message.
- Describing a manual Payment `404` as proof that no Order exists.
- Rendering every control as disabled during an error when navigation links remain available.
- Treating a missing Market Product-not-found screen as a design omission instead of a non-existent current interface.
- Treating a Penpot revision counter as a content hash. In SS-056, the counter advanced after the named version while the executed scripts contained no design-mutation calls; exact per-operation attribution was unavailable. This is a bounded observation, not a universal guarantee that a particular page open or export always advances the revision.
- Claiming “all pages verified” when only selected boards were re-exported.
