# SS-028: Establish product UX foundation

- Status: Active
- Work date: 2026-09-20
- Last reviewed: 2026-09-20
- Work item: [SS-028](https://github.com/Samska/samska-sandbox/issues/43)
- Pull request: [PR #44](https://github.com/Samska/samska-sandbox/pull/44); Human Verification approved
- ADRs: [ADR 0002: Adopt Tailwind CSS v4 for Frontend Styling](../adr/0002-adopt-tailwind-css-v4-for-frontend-styling.md) (Accepted)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md)

## What you should learn

- Product UI hierarchy versus engineering/demo UI
- Progressive emphasis for primary and secondary workflows
- Responsive and accessible interaction foundations
- Local React state versus premature shared state
- Risk-based testing of user-visible frontend behavior
- Utility-first styling versus hand-authored component CSS

### Core — Know this for interviews

- Information hierarchy turns a collection of functional controls into a coherent user journey.
- Responsive accessibility requires semantic structure, keyboard behavior, focus visibility, and layout verification together.
- Local state is sufficient when one page owns the related Product and Cart interactions.
- A utility-first styling layer centralizes design tokens without adopting a component library.

## Concepts explained

Information hierarchy gives the primary task the strongest visual and interaction emphasis. Secondary engineering tools remain available, but their lower visual weight keeps Browse Products, Add to Cart, and Review Cart as the dominant journey.

Responsive accessibility is more than shrinking a desktop layout. Landmarks, heading order, labels, status feedback, focus states, touch-sized controls, and narrow-width layout behavior must work together.

Progressive UX foundations use only the abstractions that current and immediately upcoming screens demonstrate. Tailwind CSS v4 supplies the shared token and utility layer; component structure stays feature-local, and no generic Design System is created.

## How Samska uses it

The React page keeps Product and Cart request state in `Catalog`, uses a shared shell and responsive layout, and presents Product creation and lookup as secondary Catalog tools. Approved visual tokens live in Tailwind `@theme` definitions, component styling uses Tailwind utilities in JSX, and `index.css` retains only base global rules. The Product and Cart API contracts remain unchanged. Component tests use mocked feature-local `fetch` boundaries, verify semantics rather than utility classes, and browser layout plus focus rendering require Human Verification.

## Interview perspective

Relevant discussions include how visual hierarchy preserves existing functionality without letting operational tools dominate, why local state remains sufficient before Checkout exists, how semantic landmarks and live feedback support keyboard users, and the trade-offs of adopting a utility-first styling layer: centralized tokens and consistent controls versus JSX verbosity and an added build-tool dependency.

## What not to worry about yet

Checkout, payment, orders, authentication, persistence, Product imagery, search and filtering, global state, component libraries such as MUI or shadcn/ui, Storybook, and browser E2E infrastructure remain deferred until their own requirements justify them.

## Reference

- Issue: [SS-028](https://github.com/Samska/samska-sandbox/issues/43)
- Pull request: [PR #44](https://github.com/Samska/samska-sandbox/pull/44); Human Verification approved
- Relevant source files: `web/src/App.tsx`, `web/src/catalog/Catalog.tsx`, `web/src/cart/Cart.tsx`, `web/src/index.css`, `web/vite.config.ts`
- ADRs: [ADR 0002](../adr/0002-adopt-tailwind-css-v4-for-frontend-styling.md) (Accepted); follows [ADR 0001](../adr/0001-adopt-modular-monolith.md)
- Canonical documentation: [Product](../PRODUCT.md), [Architecture](../ARCHITECTURE.md), [Testing](../TESTING.md), [AI Governance](../AI-GOVERNANCE.md)

## Why this design

The initial implementation used hand-authored CSS with custom-property tokens. Repeated Human Verification rounds showed diminishing returns from CSS-only polishing: the stylesheet had grown to roughly 600 lines of bespoke selectors duplicating control, layout, and responsive patterns. Tailwind CSS v4 through the official Vite plugin moves the approved tokens into `@theme` definitions, replaces component CSS with utilities, and keeps only base global rules. MUI, shadcn/ui, and generic primitives stay out of scope because the need is styling consistency, not prebuilt components. Neutral two-decimal amounts avoid inventing currency semantics that the API does not provide. Deterministic Product media tones use a static class map so Tailwind statically detects every class.

## Common mistakes

- Hiding useful Product creation or lookup functionality instead of making it secondary
- Treating jsdom tests as proof of browser layout or responsive behavior
- Adding global state or a component library before page ownership requires it
- Communicating loading, validation, or failure only through color
- Asserting Tailwind utility classes in behavior-focused component tests
- Dynamically constructing Tailwind class names that the scanner cannot statically detect
