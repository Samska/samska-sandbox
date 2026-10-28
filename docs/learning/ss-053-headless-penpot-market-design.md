# SS-053 — Storefront shell and functional Market design

## What you should learn

### Core — Know this for interviews

- Why a headless browser runtime needs an authenticated profile, a live MCP plugin tab, and a verified application route.
- Why a missing route parameter can look like a rendering failure.
- How bounded runtime validation differs from design approval and browser accessibility verification.
- How to preserve an approved design baseline while adding a new interface layer.

## Concepts explained

A headless Chrome process can run the full browser without a displayed window, but Penpot MCP still needs a live tab running the Penpot plugin. The browser profile persists authentication; it does not by itself prove the plugin is connected or the application rendered.

The Penpot workspace URL requires team context. Without `team-id`, the application can land on the homepage with an empty `#app` even though the file ID is correct. The homepage rendering proved headless Chrome itself was not generally incompatible.

Runtime validation is a bounded experiment: scheduled read-only MCP operations, a deliberate idle interval, an existing-board export, and process/listener checks. It establishes behavior for that interval, not indefinite reliability.

Design approval is a separate owner gate. Penpot frames specify layout, states, and accessibility intent; they do not prove DOM semantics, keyboard order, screen-reader announcements, or rendered contrast.

## How Samska uses it

- The approved Candidate 03 catalog and its masters remain unchanged. SS-053 adds current-interface masters and boards without editing the approved candidate.
- The current-interface design adds `11 Current Components` and `21 Market — Current Interface`, with populated 1440/390 boards, essential state examples, a 320 specimen, and review notes.
- The verified headless route includes `team-id=122350ae-89ad-8027-8008-dacbedb3c9d3` and the known file ID.
- A 631.3-second runtime validation passed, including six minutes without external MCP/CDP calls; an existing catalog board exported twice with the same hash.
- The owner approved the named `revn 52` design version on 2026-10-28. This is design approval only; browser verification remains separate.
- The owner approved the reviewed documentation and authorized a scoped commit/push on `feat/ss-053-storefront-market-design` on 2026-10-28. PR creation and merge remain separate decisions.
- Candidate 03 desktop and mobile exports still match the approved hashes exactly.
- The verified startup, plugin-connection, and graceful-shutdown procedure is recorded in the [design record](../design/samska-store/README.md#review-access-and-dedicated-runtime). Review evidence and runtime evidence remain outside the repository under `C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\evidence`.

## Interview perspective

A strong answer should separate the authenticated browser profile, the live plugin tab, and the MCP client. It should explain why the empty `#app` was diagnosed by comparing the home route with the workspace route, not by assuming headless Chrome was unsupported. It should also state clearly what a timed validation proves and what later browser verification must cover.

## What not to worry about yet

- Implementing the Market in React.
- Automated visual regression or accessibility tooling.
- Native `.penpot` backup or a new export pipeline.
- Delivery 2 or later interface design.

## Reference

- [Issue #102](https://github.com/Samska/samska-sandbox/issues/102)
- [Samska Store design record](../design/samska-store/README.md)
- [Design tokens](../design/samska-store/tokens.json)
- [Penpot MCP server guide](https://help.penpot.app/mcp/)
- [Chrome Headless mode](https://developer.chrome.com/docs/chromium/headless)
