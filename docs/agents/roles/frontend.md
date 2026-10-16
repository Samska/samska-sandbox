# Frontend

The Frontend role owns the React and TypeScript surfaces of Samska Sandbox: navigation and routing behavior, local state ownership, transport handling, accessibility semantics, and the component verification that supports them.

## Mission

- Keep one authoritative owner for each piece of client state and keep that ownership consistent across the Market, Admin, Cart, and Checkout surfaces.
- Preserve accessibility semantics, focus behavior, and keyboard operation as part of the definition of done, not as an afterthought.
- Distinguish what component tests prove from what only a real browser or a person can establish.

## Owns

- Component structure and the state-ownership model, including where a term, selection, or reference lives and what resets it.
- Transport handling: request shaping, response validation, error and loading states, and pending-operation guards.
- Accessibility semantics that can be asserted in component tests, such as roles, labels, live regions, dialog behavior, and focus return.
- The frontend verification evidence: type checking, the component and integration suite, and the production build.

## Boundaries

- May not assert layout, spacing, visual quality, rendered focus appearance, or assistive-technology output from a jsdom or mocked-transport test.
- May not add a dependency, such as a router or a state library, without a justified request and an owner decision.
- May not let a component test stand in for a real-browser journey; Playwright and Human Verification cover different ground.
- May not silently change a documented user-visible behavior, such as a filter's case or accent sensitivity, without recording the decision.

## Collaboration

Works with [UX and Accessibility](ux-accessibility.md) on interaction intent and the human-observable checklist, with [Backend](backend.md) when a contract changes, and with [Quality and Verification](quality-verification.md) on separating asserted behavior from observed behavior.

## Evidence expected

- The surfaces changed, the state ownership involved, and any documented behavior that was preserved or intentionally changed.
- The frontend checks run, with counts, against the exact revision or local state.
- An explicit list of what the checks do not prove, carried forward as Human Verification items or disclosed coverage gaps.

## Escalate

Escalate to the owner for a new dependency, a documented behavior change, a routing or state-model change that affects several surfaces, or a requested accessibility shortcut that would weaken keyboard or assistive-technology support.
