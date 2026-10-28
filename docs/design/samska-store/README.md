# Samska Store — Storefront Catalog Candidate 03

Status: **Owner-approved Candidate 03 — design approval only. Provisional illustrations accepted for this candidate. Not production adoption.**

- Issue: [SS-052 / #100](https://github.com/Samska/samska-sandbox/issues/100)
- Date: 2026-10-27
- Owner: Samska
- Tool: Penpot Cloud Professional ($0), hosted remote MCP
- Candidate: `Samska Store — Catalog Candidate 03`
- Token source: [tokens.json](tokens.json)

## SS-053 — Current-interface Batch 1 (owner-approved, revn 52)

Status: **Owner-approved design delivery (Batch 1) at `revn 52`. The owner approved the reviewed documentation and authorized a scoped commit/push on `feat/ss-053-storefront-market-design`; implementation, PR creation, merge, and later deliveries remain unauthorized.**

- Issue: [SS-053 / #102](https://github.com/Samska/samska-sandbox/issues/102)
- Baseline: `main` `2f0470517d455bd0f6040daaa974d68416dc8cac`; Candidate 03 `revn 32` preserved.
- Current file: `Samska Store — Storefront Catalog`, file ID `bfddaaba-4180-81d4-8008-dacc2b056247`, `revn 52`.
- Named review version: `SS-053 Batch 1 — Storefront shell and functional Market — review-ready` (created 2026-10-28T00:21:15.716Z).
- Owner visual approval: 2026-10-28, reviewing `revn 52`: “Entendi, eu aprovo a revisão 52, qual os próximos passos?” This approves the named design version only. It does not imply execution of every review checklist item, browser accessibility verification, documentation approval, commit/push, pull request, merge, or later deliveries.
- Documentation approval and commit/push: 2026-10-28, owner answered “Sim” to the reviewed five-file documentation and authorized a normal scoped commit/push to `feat/ss-053-storefront-market-design`. PR creation, merge, Issue closure, deletion, and cleanup remain unauthorized.
- Pages: `11 Current Components` (index) and `21 Market — Current Interface`.
- Page 21 boards: `market/desktop-1440` (1440×2360), `market/mobile-390` (390×3230), `market/states-desktop-1440` (1440×2120), `market/states-mobile-390` (390×4100), `market/narrow-320` (320×960), and `review/notes-batch-1` (1000×2000).
- Native review locations: `11 Current Components` page `ede7c354-fdd1-8021-8008-db2800b21f07`; `21 Market — Current Interface` page `ede7c354-fdd1-8021-8008-db2800b410d1`; desktop `ede7c354-fdd1-8021-8008-db2ab62c3ca9`; mobile `ede7c354-fdd1-8021-8008-db2ab75b0e72`; desktop states `ede7c354-fdd1-8021-8008-db2b8eabc94d`; mobile states `ede7c354-fdd1-8021-8008-db2bed45c9da`; 320 `ede7c354-fdd1-8021-8008-db2c25be0571`; review notes `662c6bd9-a007-800a-8008-db3b96fbaeb2`; component index `662c6bd9-a007-800a-8008-db3b96bec9ed`.
- Additive masters live on `10 Components` → Current interface components: storefront header/footer desktop and mobile; Product Card Market desktop/mobile/narrow; Search Market desktop/narrow; primary/secondary buttons; action link.
- Additive semantic tokens: `color.success`, `color.successSurface`, `color.danger`, `color.dangerSurface`, `color.pending`, `color.pendingSurface`, `color.onDarkMuted`, `color.focus`.
- Functional mapping: brand/Market → `/`; Admin → `/admin/products`; Cart → existing drawer, storefront only; hero CTA → Products anchor; search/Clear search → existing local filter and focus return; Retry → reload; empty-state link → `/admin/products/new`; View details → existing in-place view; Add to Cart → existing add with pending/success/failure feedback.
- Static editorial copy is separate from dynamic product/search/Cart counts. No editorial copy generates a count.
- Design verification: page 21 top-level overlaps `0`; containment violations `0`; 320 horizontal overflow `0`; 97 desktop and 96 mobile component instances; 14 new additive components; Candidate 03 desktop and mobile exports match the approved hashes exactly.
- Contrast measurements: ink/canvas 14.91; muted/canvas 5.28; ink/surface 16.68; muted/surface 5.91; onPrimary/primary 6.63; success/successSurface 5.55; danger/dangerSurface 5.74; pending/pendingSurface 5.58; onDarkMuted/ink 8.16; canvas/ink 14.91; legal/ink 4.92.
- Review evidence: `C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\evidence\ss-053-review-ready-20261028-002011`.
- Runtime verification: bounded headless MCP validation passed for 631.3 seconds, including a six-minute interval with no external MCP/CDP calls. The verified route includes `team-id=122350ae-89ad-8027-8008-dacbedb3c9d3`. The debug listener `127.0.0.1:9229` was verified active for at least 3,125.5 seconds (runtime started 2026-10-27T20:58:55 local; last confirmed 21:51:01). The dedicated process later exited with profile `exit_type: SessionEnded`; no crash dump was found and port `9229` is free. No CDP client was attached during validation or design work. This is Agent Verification, not design approval, Human Verification, indefinite reliability, or CI.
- Limitations: Penpot editor labels are not directly inspectable through the plugin API; the search-field boundary remains a browser-verification item; browser DOM, keyboard, screen-reader, rendered contrast, zoom, and cross-browser behavior are not verified. Owner approval does not imply those checks.
- Next: documentation is approved and scoped commit/push is authorized. The next gate is a separate PR creation decision. No frontend implementation, merge, Issue closure, deletion, or cleanup is authorized.

### Review access and dedicated runtime

- Verified route: `https://design.penpot.app/#/workspace?team-id=122350ae-89ad-8027-8008-dacbedb3c9d3&file-id=bfddaaba-4180-81d4-8008-dacc2b056247`. The `team-id` is required; without it the app can land on the homepage with an empty `#app`.
- Chrome executable: `C:\Program Files\Google\Chrome\Application\chrome.exe`. Dedicated profile, helpers, and evidence remain outside Git under `C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\`. No personal Chrome profile, cookies, credentials, MCP key, or token-bearing URL is part of the repository.

#### Startup used for the passing trial

The passing trial used the diagnostic helper so CDP listeners could attach before navigation:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\start-headless-cdp-diagnostic.ps1"
node "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\cdp-route-test.js"
```

`start-headless-cdp-diagnostic.ps1` takes no parameters. It starts installed Chrome with the dedicated profile at `about:blank`, headless mode, the reviewed background-execution mitigations, and a loopback debugging listener on port `9229`; it writes the PID to `helpers\headless-diagnostic3-pid.txt`. `cdp-route-test.js` takes no arguments; it navigates the dedicated page to the verified route and prints the persisted file title and readiness. This navigation is diagnostic CDP, not design inspection.

A corrected direct-start helper exists but was not executed in the passing trial:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\start-headless-verified.ps1"
```

It takes no parameters, starts directly at the verified route, checks that port `9229` is free and that the dedicated profile is unused, and writes `helpers\headless-verified-pid.txt`. Its equivalence to the diagnostic startup remains unverified.

#### Runtime identity and listener check

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\runtime-check.ps1" -PenpotPidFile "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\headless-diagnostic3-pid.txt" -PenpotPort 9229
```

The helper verifies process ID, executable, dedicated profile, `--headless`, process ancestry, visible windows, listener presence, listener local address, and loopback-only binding. Use the PID file that matches the startup helper (`headless-verified-pid.txt` for the direct-start helper).

#### MCP read

```powershell
node "C:\Users\Samuel\AppData\Local\Temp\opencode\ss-052-evidence\mcp_exec_file.js" "C:\Users\Samuel\AppData\Local\Temp\opencode\ss-053-resume-inspect.js"
```

`mcp_exec_file.js` takes the read-only JavaScript file path as its argument and reads the existing hosted MCP URL file. It does not print or commit the token-bearing URL.

#### Bounded validation

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\validate-runtime.ps1" -PenpotPidFile "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\headless-diagnostic3-pid.txt" -PenpotPort 9229
```

This helper takes the PID file and port arguments. It performs scheduled read-only MCP reads, a six-minute no-call interval, an existing-board MCP export, and initial/final runtime checks. The actual passing run lasted 631.3 seconds. It is not an indefinite reliability test.

#### Plugin connection

In the passing trial, the file opened with the Penpot MCP control available and the plugin connected without additional CDP bootstrap. The approved fallback helper is:

```powershell
node "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\cdp-connect.js"
```

It takes no arguments and attempts the Penpot `File` → `MCP Server` → `Connect` UI path. It was not required for the passing trial, so its current selectors and headless behavior remain unverified. Design inspection, export, and authoring remain MCP-only.

#### Graceful shutdown

```powershell
node "C:\Users\Samuel\AppData\Local\SamskaSandbox\penpot-mcp\helpers\cdp-close.js"
```

It takes no arguments, connects to the loopback browser listener, and sends CDP `Browser.close`. It was used successfully for earlier dedicated runtimes. The passing runtime later exited with profile `exit_type: SessionEnded`; it was not closed by this helper, so graceful shutdown of that exact run is unobserved. `taskkill /F` is not the normal procedure and must not stop unrelated Chrome processes.

#### Boundaries

The runtime was verified active for at least 3,125.5 seconds and later exited with no crash dump; the listener port is free. This is bounded Agent Verification, not indefinite reliability, design approval, Human Verification, or CI. The authenticated profile, helpers, and evidence are preserved.

> **Historical SS-052 pre-merge snapshot.** The material below records Candidate 03 before PR #101. Statements that no PR existed and that commit/push was the next action are historical. SS-052 is completed by [Issue #100](https://github.com/Samska/samska-sandbox/issues/100) and [merged PR #101](https://github.com/Samska/samska-sandbox/pull/101) (squash `2f0470517d455bd0f6040daaa974d68416dc8cac`). Historical approvals and evidence are preserved; they are not reclassified as newly executed checks.

## Candidate identity

| Item | Reference |
| --- | --- |
| Penpot file | `Samska Store — Storefront Catalog` |
| Approved candidate | `SS-052 Candidate 03` — created 2026-10-27T20:20:53.822Z at `revn 32` |
| Owner visual approval | 2026-10-27, reviewed in Penpot |
| Native backup | Not exported; optional; non-blocking for SS-052 per owner decision |
| Earlier pinned versions | `SS-052 Candidate 02 final review` (revn 30), `SS-052 Candidate 02 review-ready` (revn 29), `SS-052 Candidate 02 final` (revn 28), `SS-052 Candidate 02` (revn 27), `SS-052 Candidate 01 final` (revn 24) |
| Foundations page | `00 Foundations`, board `foundations/overview` (1440×2020) |
| Components page | `10 Components` |
| Catalog page | `20 Storefront Catalog` |
| Desktop board | `catalog/desktop-1440` (1440×2100) |
| Mobile board | `catalog/mobile-390` (390×2610) |
| Review notes | `review/notes-desktop` and `review/notes-mobile` |
| Normal file URL | Not captured; no permission change was made. The MCP URL is never recorded. |

Native identifiers: file `bfddaaba-4180-81d4-8008-dacc2b056247`; Foundations page `bfddaaba-4180-81d4-8008-dacc2b056248`; Components page `f15d1118-48f1-80ff-8008-dacde0d61594`; Catalog page `f15d1118-48f1-80ff-8008-dacde0d6e216`; desktop board `f15d1118-48f1-80ff-8008-dad015b21f7f`; mobile board `f15d1118-48f1-80ff-8008-dad250753631`; foundations board `f15d1118-48f1-80ff-8008-dad2f0db1695`; narrow card main `f15d1118-48f1-80ff-8008-dacf2d8ff492`.

Version retention: named versions are pinned. The free plan’s autosaved history is separate and retains seven days. Pinned versions and the eventual native `.penpot` export are the durable evidence.

Native `.penpot` backup status: **Not exported; optional; non-blocking for SS-052.** The owner accepted the recommendation that the missing native export not block SS-052. No file, SHA-256, archive validation, or restoration result is claimed. The failed MCP export API was not retried. This exception is specific to SS-052.

## Owner review

**Owner visual approval recorded on 2026-10-27:**

> “Eu conferi no penpot e aprovo o candidate 03.”

Scope: approval of `SS-052 Candidate 03` at `revn 32`, as reviewed in Penpot. The accepted candidate contains **provisional illustrations**. This approval does not cover future photographic assets, application implementation, PR creation, or production adoption.

History: the owner previously requested changes for overlapping canvas items and then for Penpot’s automatic editor labels overlapping the **Product cards**, **Navigation**, **Actions**, and **Footer** headings. Candidate 02 corrected the first set; Candidate 03 reserved 140 canvas px above each section’s component examples. The owner then reviewed Candidate 03 in Penpot and approved it.

Direct editor-label inspection was not available to the agent through the MCP/plugin API, and the supplied screenshot was not accessible as an inspectable file. The owner’s Penpot review is the visual verification for this approval. The composed exports omit editor labels; readability at every possible zoom is not claimed.

## Corrections in Candidate 03

- Reserved **140 canvas px** between each authored section-heading bottom and the top of its first component example:
  - Product cards: 140 px
  - Navigation: 140 px
  - Actions: 140 px
  - Footer: 140 px
- Moved whole headings and component boards only. No component was detached, recreated, or deleted.
- Preserved component contents, relationships, token bindings, catalog compositions, and the existing visual direction.
- Candidate 02 catalog and foundations evidence are unchanged; their exports are copied into the Candidate 03 evidence folder for convenience.

Candidate 02 had already corrected the earlier overlapping boards and card instances, separated the Components and Catalog canvases, added labels, fixed the Foundations spacing specimens, and updated the note titles. Candidate 01 and Candidate 02 versions and evidence remain preserved.

## Reviewable exports

Persistent folder: `C:\Users\Samuel\Documents\samska-sandbox-evidence\ss-052\candidate-03`

| Approved candidate export | SHA-256 |
| --- | --- |
| `components-full-page.png` | `3f05b311e5424626561ebdafe74a38b5f3a4bc17f95d796c37e054f7e17acb67` |
| `catalog-full-page.png` | `be92b088a26f6c7e9bcf5dbb6d96b1dd87992b1361e270a4829b0aa1528dbf07` |
| `foundations.png` | `32c9995d70d8675a1c35131de7ad3f3f78f1afa85b9a9baceff258ee7952ad11` |
| `desktop-1440-verify.png` | `4d3283bf27577e8dc957dfc2fde16c3581a9e9c2d48883f12ad5a6fcfa71ba2c` |
| `mobile-390-verify-2.png` | `e3a92176a16a998ba26143e33e59c862d13d8fcd87f07dd5b6613fdacfbd59e0` |

The Components full-page image is **composed from top-level Penpot shape exports at their recorded canvas coordinates**, with a caption stating that editor labels are not shown. Penpot’s page-root export failed with a hidden-root locator timeout. The composed image preserves the canvas arrangement but cannot prove how automatic editor labels look. The live Penpot canvas is the focused review surface.

Catalog, Foundations, desktop, and mobile exports are unchanged from Candidate 02 and retain their prior hashes. Candidate 01 and Candidate 02 evidence remain in their persistent folders.

## Persistent evidence

- `C:\Users\Samuel\Documents\samska-sandbox-evidence\ss-052\candidate-01`
- `C:\Users\Samuel\Documents\samska-sandbox-evidence\ss-052\candidate-02`
- `C:\Users\Samuel\Documents\samska-sandbox-evidence\ss-052\candidate-03`

Candidate 03 contains the new Components canvas image, copies of the unchanged Catalog/Foundations/isolated exports, new Components part exports, the post-move overlap scan, the 140 px reserve results, review copies of the design record, token JSON, learning record, JS inventory, and updated documentation diffs.

## Verification

### Agent Verification

- Post-move top-level overlap scan reported **zero overlaps** on `10 Components` and `20 Storefront Catalog`. Evidence: `candidate-03/checks/canvas-layout-candidate-03.json`.
- Reserve check reports 140 px for Product cards, Navigation, Actions, and Footer. Evidence: `candidate-03/checks/fix-components-editor-labels-2-result.json`.
- The composed Components canvas was visually inspected for arrangement and spacing.
- Automatic Penpot editor labels are not represented in composed exports and could not be inspected directly by the agent. The correction is a 140 px canvas reserve.
- Isolated desktop and mobile screen exports remain byte-identical to Candidate 01, proving their internal compositions did not change.
- Catalog and Foundations exports remain unchanged from Candidate 02.
- Documentation checks: `git diff --check` clean; relative links resolve; token JSON valid; markdownlint unavailable locally.

### Owner visual verification

- 2026-10-27: the owner reviewed `SS-052 Candidate 03` at `revn 32` in Penpot and reported: “Eu conferi no penpot e aprovo o candidate 03.”
- Scope: design approval of Candidate 03 as reviewed, including the provisional illustrations. It does not approve future photographic assets, application implementation, PR creation, merge, browser accessibility, or production adoption.

### CI Verification

Historical pre-merge: not run. No pull request existed before PR #101, and no CI result is claimed. See [Issue #100](https://github.com/Samska/samska-sandbox/issues/100) and [PR #101](https://github.com/Samska/samska-sandbox/pull/101) for completion.

### Native backup status

Not exported; optional; non-blocking for SS-052 per the owner decision. No file, SHA-256, archive validation, or restoration result is claimed. This exception is specific to SS-052.

## Independent AI documentation review

An independent AI documentation re-review was performed in the ChatGPT conversation against:

- `governance-policy.diff`
- `project-docs.diff`
- the complete design record
- the SS-052 learning record
- `tokens.json`

Result: **P2 and P3 are resolved; no new blocking documentation findings were identified; token JSON validation passed.**

Bounded scope: that review does **not** verify the native Penpot file, local execution history, browser accessibility, or owner approval. It is not Human Verification. The owner visual approval recorded above is separate.

This approval/status update is mechanical; it does not restart or alter the reviewed design. The approved Penpot design and pinned versions are preserved.

## Documentation impact

- `docs/AI-GOVERNANCE.md` contains [Frontend Design Review](../../AI-GOVERNANCE.md#frontend-design-review). P2 is addressed: the workflow grants no authorization for automated enforcement, new tooling, services, or dependencies; future additions require separately scoped owner authorization.
- `PROJECT_HANDOFF.md` remains a concise snapshot; detailed hashes, local paths, API errors, and verification stay in this record and the Issue.
- `AGENTS.md` has the minimal discovery pointer.
- The material governance change has the bounded independent AI documentation re-review above. On 2026-10-27 the owner approved the documentation changes and authorized scoped commit/push to `feat/ss-052-samska-store-design`. Author self-review is not claimed as independent review. PR creation, merge, Issue closure, deletion, and cleanup remain unauthorized.

## Maintenance model

- Main components live on `10 Components`; catalog boards use copies.
- Future screens reuse the existing header, footer, search, button, link, and card components. New components are added only when a pattern repeats.
- Tokens remain the source for color, type size, spacing, and radius; the token JSON is versioned in Git.
- Named Penpot versions and an eventual `.penpot` export preserve approved milestones. No automated evidence tooling is introduced.
- The canonical review gate is [Frontend Design Review](../../AI-GOVERNANCE.md#frontend-design-review): relevant visual review before implementation, exact candidate and traceable owner approval, and later browser comparison for responsiveness and accessibility.

## Next step (historical SS-052 pre-merge)

Historical pre-merge instruction; completed by [Issue #100](https://github.com/Samska/samska-sandbox/issues/100) and [PR #101](https://github.com/Samska/samska-sandbox/pull/101).

Owner visual approval and owner human engineering approval of the documentation are recorded. Scoped commit/push to `feat/ss-052-samska-store-design` is authorized. Native backup is not exported; it is optional and non-blocking for SS-052. Commit and push the approved documentation, then stop for a separate PR creation decision. Do not create another candidate, open a pull request, merge, close the Issue, delete, or clean up.
