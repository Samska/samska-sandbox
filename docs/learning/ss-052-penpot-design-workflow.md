# SS-052 — Penpot design workflow and candidate evidence

## What you should learn

### Core — Know this for interviews

- How a hosted MCP integration changes the operating model of an agent-assisted design task.
- Why design tokens and component instances are different sources of reuse.
- How to make an external design candidate reviewable when the tool's version history is short.
- Why clean isolated screen exports can still hide overlapping boards on the design canvas.
- Why design review is not browser accessibility verification.

The supporting concepts are tool-specific relayout behavior, canvas organization, free-plan limits, and credential handling for a token-bearing MCP URL.

## Concepts explained

### Hosted MCP with an active browser tab

The Penpot MCP server is remote, but the Penpot plugin that gives it access to a file runs inside the user's browser tab. The server acts only on the currently focused page and only while that tab is alive. A frozen or unloaded tab produces a failed task, not a background retry.

This differs from a pure server API. The integration is still hosted, but the design session has a human-in-the-loop runtime dependency: the right file must be open, one tab must own MCP, and the tab must stay awake.

### Tokens versus components

A **design token** is a named reusable value, such as `color.primary` or `spacing.24`. Changing the token updates every bound property.

A **component** is reusable structure, such as a product card. A **component instance** is a copy that inherits the main component's structure and can override content such as text or an image. In Penpot, changing text on a component copy did not render reliably until the text was forced through a relayout; this is a tool limitation, not a property of component-based design. The design record documents it so a future session does not mistake stale rendering for a content bug.

### Canvas organization versus isolated screen exports

An exported board can be perfectly composed while the surrounding canvas is unusable because boards, notes, or extra component instances overlap. Verification must inspect top-level bounds and parent relationships, not only the isolated exports.

Moving whole boards or groups preserves their internal layout, component relationships, and assets. Recreating, detaching, or deleting components to fix canvas layout would damage the design system. Candidate 02 separated the overlapping boards and duplicate card instances, then confirmed that the isolated desktop and mobile exports were byte-identical to Candidate 01.

Composed exports omit Penpot’s automatic component and board labels. Those labels are editor-space overlays, so they can overlap authored headings at zoomed-out views even when the shape bounds do not overlap. A canvas-space reserve reduces the collision risk, but neither a shape-bound scan nor a composed PNG can prove label readability. Candidate 03 reserved 140 canvas px above each section’s component examples and left the final judgment to focused owner inspection in the editor.

### Candidate identity

Penpot's free plan keeps seven days of autosaved versions and recovery. A live file link is not durable evidence by itself. A reviewable candidate normally needs a named file version, an external `.penpot` export, PNG exports for the required widths, and one-off content hashes. The candidate is then identified by those artifacts, not by whatever the file happens to contain later. An owner may explicitly make the native export optional for a specific task; that exception and its limits must be recorded.

### Free-plan capability versus evidence durability

The free Professional plan removes file-count limits and includes the hosted MCP, but it still has storage, team, and history limits. "Free and feature-complete" does not mean infinite retention. Export the native file at each approved milestone and keep the review exports outside the repository, unless the owner explicitly makes that export optional for a specific task.

SS-052 specific exception: the owner accepted the native `.penpot` backup as optional and non-blocking. The approved Candidate 03 remains pinned at `revn 32`; no file, hash, archive validation, or restoration result is claimed for the native backup. The exception is specific to SS-052.

### Design review versus browser verification

A Penpot frame can demonstrate hierarchy, typography, color, and intended reflow. It cannot prove DOM structure, keyboard order, focus visibility, screen-reader announcements, zoom behavior, performance, or cross-browser rendering. Those remain future implementation checks.

### Credential handling

The Penpot MCP server URL contains a `userToken` query parameter. During setup, a local inspection printed the token into tool output; the key was regenerated immediately and the local file was reduced to the bare URL. Token-bearing URLs must never be logged, pasted into chat, or committed. Local tool configuration belongs outside the repository.

## How Samska uses it

- The SS-052 design record and token JSON are versioned under [`docs/design/samska-store/`](../design/samska-store/README.md).
- The native `.penpot` file and PNG exports live outside Git, referenced by path and SHA-256.
- The catalog uses native Penpot components and component copies, with content overrides per product.
- The proposed identity is applied to both required boards, with 768/320 rules documented rather than turned into a large capture matrix.
- Candidate 02 corrected canvas-level overlaps without changing the isolated desktop/mobile compositions. Candidate 03 reserved 140 canvas px between the Components section headings and component examples for Penpot’s automatic labels. The full-page canvas views are composed from top-level shape exports because the page-root export failed; the owner’s Penpot review is the editor-label check.
- The owner reviewed and approved Candidate 03 (`revn 32`) in Penpot on 2026-10-27. The approval covers the design candidate with its provisional illustrations only; it does not approve future photographic assets or application implementation.
- The native backup is not exported; the owner accepted it as optional and non-blocking for SS-052. No native file, hash, archive validation, or restoration result is claimed.
- The owner approved the resulting documentation and authorized scoped commit/push to `feat/ss-052-samska-store-design`; PR creation and merge remain separate authorizations.
- The canonical design gate is [Frontend Design Review](../AI-GOVERNANCE.md#frontend-design-review); it requires relevant visual review before implementation, traceable owner approval, and later browser comparison. Human review is the design gate; browser verification is deferred to implementation.

## Interview perspective

A strong answer should distinguish an MCP server from the client-side plugin and explain the failure modes of a browser-bound integration. It should also explain why tokens, components, and instances solve different reuse problems, and why an exported artifact plus a hash is stronger review evidence than a mutable cloud link. For accessibility, it should state plainly that a design frame is evidence of intent, not proof of rendered behavior.

## What not to worry about yet

- Building a production component library from these tokens.
- Implementing the catalog in React.
- Figma migration or synchronization.
- A full state matrix, responsive browser test suite, or visual-regression system.
- Automated design-governance tooling.

## Reference

- [Issue #100 — SS-052](https://github.com/Samska/samska-sandbox/issues/100)
- [SS-052 design record](../design/samska-store/README.md)
- [SS-052 token JSON](../design/samska-store/tokens.json)
- [Penpot MCP server guide](https://help.penpot.app/mcp/)
- [Penpot pricing](https://penpot.app/pricing)
- [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers/)
