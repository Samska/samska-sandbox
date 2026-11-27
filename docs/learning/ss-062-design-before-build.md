# SS-062 — Design before build

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-062](https://github.com/Samska/samska-sandbox/issues/120)
- Pull request: None yet
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md), [Samska Store design record](../design/samska-store/README.md)

## What you should learn

- Why an approved prototype acts as the contract for a user-facing feature before code exists.
- How to link a design to an Issue so any later session finds it.
- When design is not applicable, and how to say so explicitly.

### Core — Know this for interviews

- Design-first delivery turns visual and interaction questions into reviewable artifacts early, when changes are cheap, and gives implementation something concrete to be compared against.

## Concepts explained

A prototype is a self-contained HTML file with its design tokens, versioned in the repository. It is reviewed on a pull request like code. Because the Issue records its path and revision, Build starts from an approved target and the result is compared with it in the browser.

## How Samska uses it

[AI Engineering Governance](../AI-GOVERNANCE.md#frontend-design-review) states the rule. The existing Vitrine prototype lives under `docs/design/samska-store/prototypes/`, and the Issue Form asks for the prototype link in Relevant files and documentation.

## Interview perspective

A strong answer explains the cost of changing design after implementation, why the prototype is approved before Build, and why work without user-facing change records `Design: Not applicable`.

## What not to worry about yet

A design system tool, visual regression tooling, and automated enforcement stay deferred.

## Reference

- Issue: [SS-062 (#120)](https://github.com/Samska/samska-sandbox/issues/120)
- Pull request: None yet
- Relevant source files: `docs/AI-GOVERNANCE.md`, `AGENTS.md`, `.github/ISSUE_TEMPLATE/work-item.yml`
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md)
