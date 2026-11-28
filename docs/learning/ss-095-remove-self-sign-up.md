# SS-095: Remove Self Sign-Up

- Status: Active
- Work date: 2026-11-28
- Last reviewed: 2026-11-28
- Work item: [SS-095 (#190)](https://github.com/Samska/samska-sandbox/issues/190)
- Pull request: See the Issue
- ADRs: None; amends the account decision in [ADR 0013](../adr/0013-adopt-account-sessions-and-ownership.md)
- Canonical documentation: [Security](../SECURITY.md), [Threat Model](../THREAT-MODEL.md)

`Last reviewed` records document maintenance or revalidation, not personal study activity.

## What you should learn

- Why removing an attack surface is simpler and safer than guarding it: the endpoint, its request type, its rate-limit rule and its screen were deleted, not disabled by a flag.
- Why the role model stays when only one person uses the system.

### Core — Know this for interviews

Access control has two parts: who may create an identity and what an identity may do. Removing sign-up changes only the first. The `CUSTOMER` role, per-account ownership of Carts and Orders and the administrator checks stay, because they still protect data and the tests depend on them. The administrator is created at startup from configuration, so no public path creates accounts.

## Concepts explained

### Tests without a sign-up endpoint

Tests that need a customer now create one through the account service and then sign in through the real login endpoint, so the session and CSRF behaviour under test is unchanged. The account journey in the browser signs in as the seeded administrator, who can also shop.

### Existing accounts

Customer accounts that already exist keep working until the daily demo reset deletes every non-administrator account.
