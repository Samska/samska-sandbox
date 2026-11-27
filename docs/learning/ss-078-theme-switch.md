# SS-078: In-App Theme Switch

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-078 (#151)](https://github.com/Samska/samska-sandbox/issues/151)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Samska Store design](../design/samska-store/README.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- How a user override layers on top of a system preference in CSS.
- Why a small file loaded in `<head>` avoids a flash of the wrong theme under a strict Content-Security-Policy.
- Why storage access is wrapped so the page works when storage is blocked.

### Core — Know this for interviews

A preference has three states, not two: follow the system, or pin a value. Pinning is an attribute on the root element, and the stylesheet decides which palette wins.

## Concepts explained

### Layering the override

The dark palette is declared twice with the same values: inside `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])` (the system is dark and nobody pinned Light), and for `:root[data-theme="dark"]` (the person pinned Dark). Auto removes `data-theme`, so the system decides again. A test fails if the two copies drift.

### No flash

The saved choice is applied by `public/theme-init.js`, a blocking script in `<head>`, before the first paint. It is a file because the web server's Content-Security-Policy allows scripts only from the same origin, not inline. The React control then reads the same key to show the current state.

### Storage that may fail

`localStorage` can throw in private windows or with blocked site data. Reads fall back to Auto and writes are ignored, so the choice still applies to the current page view.

## Design record

- The control is three small buttons (Auto, Light, Dark) in both headers; the Admin header uses the inverted colors. Auto is the default.
- The Bench prototype already had the `data-theme` override but only in its review bar; the header control is added to the prototype in the same pull request, which the owner reviews before merge. This is a design gap closed in the same change, requested directly by the owner.
- The preference lives in the browser only; it does not follow the account to another device.

## Verification

Unit and component tests cover reading, applying, saving, storage failure and the control; a stylesheet test keeps the two dark copies identical and the early script external; a Chromium check confirmed that pinning overrides the system setting in both directions, persists after reload and returns to the system setting under Auto.
