# SS-090: Plain-Language Copy

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-090 (#183)](https://github.com/Samska/samska-sandbox/issues/183)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Design](../design/samska-store/README.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why error messages are part of the interface and should name what the person can do, not an internal concept.
- Why a stale message is a defect: the "32 attempts" limit it described was removed in SS-066.

### Core — Know this for interviews

Messages written while building a feature drift away from the product. Keeping them in a few `messages.ts` modules made this a small change; tests that assert on the wording are updated with it, and the safety statement that no real payment was made is kept on every payment and order screen.

## Concepts explained

### What stays technical

Identifiers in URLs, API fields and logs keep their names. Only text a customer reads changed.
