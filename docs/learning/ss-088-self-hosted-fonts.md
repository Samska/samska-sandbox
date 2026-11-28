# SS-088: Self-Hosted Fonts, Favicon And Page Metadata

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-088 (#174)](https://github.com/Samska/samska-sandbox/issues/174)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Security](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a strict Content-Security-Policy and a third-party font host cannot coexist.
- Why a missing static file must answer 404, not the single-page app.

### Core — Know this for interviews

The production policy is `default-src 'self'` with `style-src 'self' 'unsafe-inline'`. A stylesheet from `fonts.googleapis.com` is therefore blocked, so the hosted site silently fell back to system fonts while development worked. Serving the fonts from the same origin removes the conflict without weakening the policy, and removes a third-party request that would tell Google about every visitor.

## Concepts explained

### Subsetting

Only the Latin range of each family is shipped (about 135 KB in total). `font-display: swap` shows text immediately and swaps when the font arrives.

### Cache lifetime

Font files keep fixed names, so they are cached for a month. Hashed build assets under `/assets/` are cached for a year and marked immutable.

### Page metadata

A favicon, a description and Open Graph text make a shared link readable. No `og:image` is added because it needs an absolute URL that depends on the host.
