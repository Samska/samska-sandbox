# SS-084: Illustrations For The Sample Products

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-084 (#165)](https://github.com/Samska/samska-sandbox/issues/165)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Design](../design/samska-store/README.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why an inline SVG can follow the theme and an `<img>` SVG cannot.
- How to migrate data written by an earlier version without overwriting a user's edits.

### Core — Know this for interviews

An SVG loaded through `<img>` is isolated from the page's CSS variables, so it cannot follow a theme chosen in the page. Inline SVG uses the page's custom properties, so the same drawing is correct in light and dark. Because the markup is static and repository-owned, injecting it is safe; user input never reaches it.

## Concepts explained

### Migrating seeded data

The first seed version stored photo keys. The new start-up step updates a sample only while its name, description, price and earlier media key are all unchanged, so an administrator's edit is never overwritten, and a second run changes nothing.

### Precedence

Uploaded media still wins over a curated key, and the old photo keys keep working for any Product that uses them.
