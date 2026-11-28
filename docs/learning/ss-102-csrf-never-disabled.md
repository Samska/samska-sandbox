# SS-102: Never Disable CSRF in Production Code

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-102 (#206)](https://github.com/Samska/samska-sandbox/issues/206)
- Pull request: See the Issue
- ADRs: None
- Canonical documentation: [Testing](../TESTING.md), [Security](../SECURITY.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why a test-only security relaxation belongs in the test source set.
- How a conditional bean replaces a runtime `if` inside a configuration.

### Core — Know this for interviews

CodeQL flagged `csrf.disable()` in the branch that tests used. The branch was unreachable in a real run, but the code existed in the shipped artifact. The fix moves the permissive filter chain to `src/test` and makes the production chain conditional on `samska.security.enforced`, so production code cannot open every request even by mistake.

## Concepts explained

### Conditional beans

`@ConditionalOnProperty` creates exactly one of the two filter chains from the same property, instead of an `if` that both chains share.

### Trade-off

The test chain still exempts all requests from CSRF checks, but only in test builds. `ProductionGuard` keeps refusing `enforced=false` in production.
