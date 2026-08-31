# SS-003: AI Engineering Governance

- Status: Historical
- Date: 2026-08-30
- Work item: [SS-003, Issue #4](https://github.com/Samska/samska-sandbox/issues/4)
- Pull request: [PR #5](https://github.com/Samska/samska-sandbox/pull/5)
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md), [agent instructions](../../AGENTS.md), [Testing Strategy](../TESTING.md), and [Security Engineering](../SECURITY.md)

## Goal and Previous State

SS-003 defined how AI coding agents and the human owner work together in a repository intentionally built with AI assistance. The goal was controlled, reviewable, secure, testable work without treating generated output or conversation history as authoritative project context.

## What Changed and Why

The work refined `AGENTS.md` into concise operational instructions and made `docs/AI-GOVERNANCE.md` the detailed governance source. It assigned AI agents responsibility for context gathering, planning, scoped implementation, documentation synchronization, verification, and reporting. It retained human responsibility for requirements, acceptance, risk tolerance, review, decisions, and acceptance.

This separation avoids an unsafe delegation model: AI can accelerate work and explain reasoning, but cannot transfer accountability or replace human judgment.

## Engineering Concepts

### Human Accountability in AI-Assisted Engineering

Samska assigns execution support to AI and accountability to people. An agent can inspect documentation, identify implications, and propose or implement a change, but the owner and reviewers decide whether requirements, trade-offs, and residual risks are acceptable. This is operational governance, not a claim that AI output is independently trustworthy.

The trade-off is added review effort, especially for documentation-only work. The safeguard is that human understanding and validation are mandatory rather than a formality after automation completes.

### Repository Documentation as the Source of Truth

The governance documents require agents to read repository context and the existing implementation before meaningful work. Conversation history, generated output, and agent assumptions are explicitly non-authoritative because they can be incomplete, stale, or wrong.

This makes durable repository artifacts reviewable by future contributors. It also means an agent must update affected documentation when process, architecture, security posture, or behavior changes instead of leaving reasoning only in a chat.

### Planning, Scope, Uncertainty, and Verification

Before substantial changes, the agent identifies outcome, acceptance criteria, affected modules, security implications, verification, and documentation updates. It must not use a task to add speculative dependencies, infrastructure, abstractions, or future roadmap work.

Material ambiguity, conflicting requirements, unclear ownership, or unaccepted risk require a human decision rather than an agent guess. Verification is risk-based: use the smallest effective level and report actual evidence and meaningful gaps. These rules prevent unsupported AI claims, such as saying a control is enabled or a test passed without evidence.

## Alternatives and Trade-offs

The documented approach rejects treating AI conversations as project memory, allowing agents to autonomously decide material risks, and automatically adding AI-specific tooling or future roadmap technology. Centralizing detailed policy in `docs/AI-GOVERNANCE.md` while keeping `AGENTS.md` concise trades some duplication avoidance for a linked two-level guide: immediate operational instructions and fuller rationale.

## Security and Verification

The governance explicitly requires assessment of data, secrets, APIs, dependencies, logs, build pipelines, infrastructure, and deployment configuration. It prohibits exposing secrets, real data, or real payment processing, and requires claims about controls and verification to be evidence-based.

PR #5 reports documentation consistency review, relative-link validation, and `git diff --check`. It reports no application code, infrastructure, dependencies, or OpenCode-specific configuration. No application test suite existed or was claimed.

## Failure Modes and Safeguards

- An agent can rely on a stale conversation rather than repository evidence. Require context reading and durable documentation.
- An agent can broaden a narrow task into roadmap work. Require approved scope and stop on material uncertainty.
- Generated output can make unsupported claims about tests or controls. Require evidence and disclose gaps.
- Human review can become blind approval. Require owners to understand and accept or reject important decisions.
- New automation can be introduced merely because AI is available. Require a separately justified request.

## Plan, Build, Review, and Pull Request Lessons

### Plan

Issue #4 required explicit responsibilities, planning, scope, architecture, security, verification, documentation, dependency, ADR, and uncertainty guidance while excluding application work and AI-specific tooling.

### Build

The merged change concentrated detailed policy in `docs/AI-GOVERNANCE.md` and kept `AGENTS.md` concise. It aligned the instructions with existing architecture, security, testing, and ADR guidance.

### Review

No formal GitHub review, review comment, or review finding is recorded for PR #5. The PR reports documentation consistency and link validation, but it cannot prove any review outside GitHub.

### Pull Request

PR #5 kept the change within SS-003 and reported no application, infrastructure, dependency, or OpenCode-specific configuration work. The ongoing risk is process drift, so later meaningful work must apply and maintain the governance.

## What the Project Owner Should Understand

AI governance is an engineering control over how work is prepared, reviewed, and evidenced. Its value comes from traceable human decisions and verification, not from the mere presence of an agent or a policy document.

## Interview Practice

### Questions

- How do you retain human accountability when using AI coding agents?
- Why should repository documentation take precedence over AI conversation history?
- How do planning and risk-based verification reduce AI-assisted delivery risk?

### Interview-Ready Explanation

Samska uses AI to inspect, plan, implement, and report, but governance assigns acceptance, risk tolerance, and material decisions to humans. We made repository documentation authoritative because chat history and generated output can be stale or unsupported. Before substantial work, agents identify scope, security, and verification, then stop for human decisions when uncertainty is material. This adds review discipline, but prevents scope creep and unverified claims from being accepted as engineering evidence.

## Follow-up and Sources

Apply the governance to future work and update it only when a durable process lesson requires it.

- [Issue #4](https://github.com/Samska/samska-sandbox/issues/4)
- [PR #5](https://github.com/Samska/samska-sandbox/pull/5)
- [AI Engineering Governance](../AI-GOVERNANCE.md)
- [Agent Instructions](../../AGENTS.md)
