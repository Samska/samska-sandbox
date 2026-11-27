# SS-057: Keeping the Design Source Where Reviewers and Code Already Live

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-057](https://github.com/Samska/samska-sandbox/issues/110)
- Pull request: None
- ADRs: None
- Canonical documentation: [Design record](../design/samska-store/README.md), [AI governance](../AI-GOVERNANCE.md)

## What you should learn

1. **A design source of truth should be reviewable with the same tools as code.** A single HTML file produces a readable diff; a hosted canvas produces revision counters and hashes.
2. **A clickable prototype shows behavior a static frame cannot.** Cart totals, a declined payment that leaves the cart intact, and an upload preview are checked by using them.
3. **Tokens belong next to the prototype.** Keeping colors and radii in JSON beside the HTML lets the application adopt them later without re-reading a picture.
4. **Design approval is not implementation approval.** Approving a direction does not change `web/`; applying it is separate authorized work.

### Core — Know this for interviews

Be able to explain why a team might keep design artifacts in the repository, what is lost (a free canvas, visual editing), and why “approved direction” and “approved build” are separate gates.

## Concepts explained

A **design source of truth** is the one artifact that wins when people disagree about how something should look. If it lives in an external tool, reviewers need that tool, access, and a way to pin a version. If it lives in the repository, the pull request pins the version automatically.

A **self-contained prototype** is one file with inline CSS and JavaScript and no build step. It is deliberately not the application: it uses sample data in memory and simulates payment, so it can be opened anywhere but must not be mistaken for the product.

## How Samska uses it

The earlier SS-052 to SS-056 work recorded Penpot revision numbers, named versions, and SHA-256 export hashes as proof that accepted designs were preserved. The Vitrine prototype in [prototypes/vitrine.html](../design/samska-store/prototypes/vitrine.html) replaces that bookkeeping with Git history. Its tokens are in [prototypes/vitrine.tokens.json](../design/samska-store/prototypes/vitrine.tokens.json). The screens mirror the real journey in [App.tsx](../../web/src/App.tsx) and the catalog, cart, payment, order, and admin modules.

## Interview perspective

A strong answer compares tools by who can review them and how a version is pinned, not by feature lists, and states the tradeoff plainly: repository prototypes lose visual editing and a shared canvas.

## What not to worry about yet

The prototype does not change the application, add routes, call the API, or define production components. Accessibility beyond keyboard focus, labels, and reduced-motion handling, and cross-browser behavior, remain later verification.

## Reference

- Issue: [SS-057 / #110](https://github.com/Samska/samska-sandbox/issues/110)
- Pull request: None
- Relevant source files: [App.tsx](../../web/src/App.tsx), [index.css](../../web/src/index.css)
- ADRs: None
- Canonical documentation: [Design record](../design/samska-store/README.md), [AI governance](../AI-GOVERNANCE.md)

## Why this design

Penpot work needed a hosted MCP, evidence folders outside the repository, and hash checks to prove nothing moved. A single file in Git removes those steps and lets an agent create and review designs from any session.

## Common mistakes

- Treating the prototype’s sample products and simulated payment as application behavior.
- Treating approval of a visual direction as authorization to change `web/`.
- Editing the HTML without updating the tokens file when a color changes.
