# SS-064 — Applying a design to a React and Tailwind app

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-064](https://github.com/Samska/samska-sandbox/issues/124)
- Pull request: None yet
- ADRs: None
- Canonical documentation: [Design record](../design/samska-store/README.md), [Testing](../TESTING.md)

## What you should learn

- Why semantic tokens (canvas, ink, brand) let a whole app change look by changing values, not components.
- Why unlayered base CSS can silently beat Tailwind utilities, and how a cascade layer fixes it.
- How to test a visual identity without pixel snapshots.

### Core — Know this for interviews

- Test design at three levels: contrast math on the tokens, component tests on structure and accessible names, and browser tests on computed style, layout and focus.

## Concepts explained

The app already used semantic color names. Remapping them to the Bench palette, adding dark values under `prefers-color-scheme`, and restyling a few shared components (Button, header, product media) moved most screens at once. A first run showed buttons in the wrong font: `button { font: inherit }` was outside any layer, and unlayered rules beat Tailwind's layered utilities. Putting base rules in `@layer base` fixed it. The contrast test then found a real defect, a success color at 4.37:1 against 4.5:1, which was fixed in the app and the prototype.

## How Samska uses it

`web/src/index.css` holds the tokens. `web/src/theme.test.ts` checks them, component tests under `web/src` check structure and names, and `web/e2e/identity.spec.ts` checks the rendered result at phone and desktop widths in both themes.

## Interview perspective

A strong answer explains token-based theming, the cascade-layer ordering problem, why assertions on computed style and overflow are more stable than screenshots, and that tests supplement but do not replace human visual review.

## What not to worry about yet

Visual regression services, a component library, and animation.

## Reference

- Issue: [SS-064 (#124)](https://github.com/Samska/samska-sandbox/issues/124)
- Pull request: None yet
