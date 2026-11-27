# SS-061 — Changing owner approval gates

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-061](https://github.com/Samska/samska-sandbox/issues/117)
- Pull request: None yet
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md), [AGENTS.md](../../AGENTS.md)

## What you should learn

- How an owner decision moves a human gate from before the work to after it, at pull request review and merge.
- Which controls stay in place when approvals are relaxed: merge authorization, Human Verification, and the stop conditions.
- How to supersede policy text without erasing it.

### Core — Know this for interviews

- A gate can move without disappearing: review of the open pull request replaces up-front approval, and merge remains the owner's decision.

## Concepts explained

Before this change, Build and pull request creation each needed explicit authorization. The owner decided on 2026-11-27 to review the open pull request and authorize merge instead. Autonomy increases, but the work still needs an Issue with scope and acceptance criteria, and the agent still stops on uncertainty, new dependencies, destructive actions, or conflicting evidence.

## How Samska uses it

[AI Engineering Governance](../AI-GOVERNANCE.md) records the new rule and a dated supersession note that links the previous wording at an immutable commit. [AGENTS.md](../../AGENTS.md) and [CLAUDE.md](../../CLAUDE.md) point to it.

## Interview perspective

A strong answer explains that reducing approval steps should be a recorded owner decision, that review shifts to the pull request, and that irreversible actions such as merge stay gated.

## What not to worry about yet

Automated merge, required reviewers, and branch rules beyond the existing ruleset.

## Reference

- Issue: [SS-061 (#117)](https://github.com/Samska/samska-sandbox/issues/117)
- Pull request: None yet
- Relevant source files: `docs/AI-GOVERNANCE.md`, `AGENTS.md`, `CLAUDE.md`
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md)
