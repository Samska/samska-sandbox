# SS-077: Empty-State Design Fix

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-077 (#149)](https://github.com/Samska/samska-sandbox/issues/149)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Samska Store design](../design/samska-store/README.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a design review of the running app finds what a review of the prototype cannot.
- Why one shared component keeps a pattern from drifting.

### Core — Know this for interviews

When the same visual pattern appears on several screens, give it one component and one test, so a fix lands everywhere and a deviation is a code-review diff rather than a visual accident.

## Concepts explained

### Prototype fidelity

The owner validating `release/1.0` saw the empty Admin list as a flat grey box while the approved Bench prototype uses a dashed outline, a centred layout, the box icon and an action inside the block. Four screens (Admin list, Admin search with no match, Cart, Checkout) had been built with an earlier plain style; the Market and the orders screen already used the dashed outline.

### One component

`EmptyState` renders the outline, the icon and the centring; `EmptyTitle`, `EmptyNote` and `emptyActionClassName` keep the typography and the primary action style in one place. Callers keep their own text, heading level and focus behaviour (Checkout focuses its empty heading).

## Design record

- The Admin empty list now offers a "Create the first Product" action inside the block, as the prototype does; the header action stays.
- Checkout's empty state links to the Market.
- The Admin header no longer says the area has no access control. That sentence came from the prototype, written before accounts existed; the prototype keeps it as dated evidence and the running app is authoritative here.
- Gap: the Market and orders empty states stay left-aligned (they already use the dashed outline); aligning them with the centred prototype is a follow-up.

## Verification

`EmptyState.test.tsx` and the Admin test cover the component and the new action; the web suite, typecheck and build pass.
