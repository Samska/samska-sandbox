# SS-060: Re-theming a Tailwind Application Through Design Tokens

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-060](https://github.com/Samska/samska-sandbox/issues/115)
- Pull request: None
- ADRs: None
- Canonical documentation: [Design record](../design/samska-store/README.md), [Testing](../TESTING.md), [AI governance](../AI-GOVERNANCE.md)

## What you should learn

1. **A well-tokenized UI can change look without changing behavior.** Because components use semantic classes such as `bg-brand` and `text-ink`, most of a redesign is a change to the theme values.
2. **Dark mode is a second set of the same tokens.** Redefining the variables under `prefers-color-scheme: dark` themes every component at once, but a class that hard-codes a color (for example `text-white`) breaks it.
3. **Stable markup protects tests.** Keeping roles, labels, and structure the same lets unit and browser tests verify that behavior survived a visual change.
4. **Visual checks need their own evidence.** Passing tests do not show that the result looks right; screenshots and the owner's review do.

### Core — Know this for interviews

Explain why semantic design tokens make re-theming cheap, what a hard-coded color costs, and why tests alone cannot verify a visual change.

## Concepts explained

A **design token** is a named value, such as a color or radius, that components reference instead of a literal. In Tailwind 4, `@theme` variables become CSS custom properties, so a media query can redefine them for dark mode without touching components.

## How Samska uses it

The Vitrine values from [vitrine.tokens.json](../design/samska-store/prototypes/vitrine.tokens.json) replace the old palette in [index.css](../../web/src/index.css). Components that used `text-white` on a brand background now use `text-on-brand`, which stays readable when the brand color lightens in dark mode.

## Interview perspective

A strong answer separates theme changes (tokens) from structure changes (markup), and explains how the unchanged test suite is evidence of preserved behavior but not of visual accuracy.

## What not to worry about yet

The search and Cart trigger are not moved into the header, there is no hero, and Checkout keeps its current layout. Cross-browser and screen-reader behavior remain later verification.

## Reference

- Issue: [SS-060 / #115](https://github.com/Samska/samska-sandbox/issues/115)
- Pull request: None
- Relevant source files: [index.css](../../web/src/index.css), [App.tsx](../../web/src/App.tsx), [Button.tsx](../../web/src/ui/Button.tsx), [ProductMedia.tsx](../../web/src/catalog/ProductMedia.tsx), [ProductBrowse.tsx](../../web/src/catalog/ProductBrowse.tsx)
- ADRs: None
- Canonical documentation: [Design record](../design/samska-store/README.md), [Testing](../TESTING.md)

## Why this design

Changing tokens and a few shared components delivers the approved look with the smallest diff and the least risk to tested behavior.

## Common mistakes

- Hard-coding `text-white` or a hex color and breaking dark mode.
- Changing accessible names while restyling, which breaks tests and assistive technology.
- Treating green tests as proof that the redesign looks right.
