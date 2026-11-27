# SS-063 — Brand identity and prototype-first design

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-063](https://github.com/Samska/samska-sandbox/issues/121)
- Pull request: None yet
- ADRs: None
- Canonical documentation: [Design record](../design/samska-store/README.md), [Product](../PRODUCT.md)

## What you should learn

- Why a generic visual style reads as "not a real product", and how a single concept gives a design its personality.
- How a concept turns into tokens and recurring components rather than decoration.
- Why designing every state and the upcoming features before building makes later work cheaper to review.

### Core — Know this for interviews

- A brand is a concept applied consistently: here a workshop catalog, expressed through object numbers, hang tags, dimension lines and mono data type, not just a color palette.

## Concepts explained

A prototype that shows only the happy path hides most of the product. Loading, empty, error, sold-out and confirmation states are where users spend real time, so the prototype lists them and a review bar switches between them. Previewing upcoming features with clear "design only" labels lets the owner react to direction early without committing the roadmap.

## How Samska uses it

[bench.html](../design/samska-store/prototypes/bench.html) is one self-contained file with its [tokens](../design/samska-store/prototypes/bench.tokens.json). Light and dark themes redefine the same variables, so components do not change.

## Interview perspective

A strong answer ties visual choices to a product idea, separates approved scope from directional previews, and explains how states and themes were verified in a browser at phone and desktop widths.

## What not to worry about yet

Photography, a component library in React, and animation polish.

## Reference

- Issue: [SS-063 (#121)](https://github.com/Samska/samska-sandbox/issues/121)
- Pull request: None yet
