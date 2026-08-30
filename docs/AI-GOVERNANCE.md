# AI Engineering Governance

## Purpose

AI coding agents are expected to generate or modify production code in Samska Sandbox. They accelerate execution but do not transfer accountability from humans.

Repository documentation is the source of truth for project context. Conversation history, generated output, and agent assumptions are not authoritative.

## Responsibilities

| AI Agents | Human Owner and Reviewers |
| --- | --- |
| Inspect the repository and relevant documentation before meaningful work | Define requirements and acceptance criteria |
| Identify affected modules, security implications, tests, and documentation | Make architecture and engineering decisions |
| Propose a concise implementation plan | Review scope, correctness, security, maintainability, and tradeoffs |
| Implement only approved scope and run appropriate verification | Validate results and assess residual risk |
| Report evidence, decisions, risks, limitations, and follow-up concerns | Understand and accept or reject AI-produced changes |

Humans must not accept AI output blindly.

## Required Agent Workflow

Before meaningful implementation, an agent must read [AGENTS.md](../AGENTS.md), relevant documentation, and the existing implementation. It must then identify requested scope, affected modules, security concerns, suitable risk-based tests, and documentation updates before producing a concise plan.

During implementation, agents must avoid speculative dependencies, infrastructure, abstractions, and roadmap work. They must not introduce an architectural pattern without justification. Significant durable architectural changes require an ADR under [adr/](adr/README.md).

After implementation, agents must run appropriate verification and report what changed, why, tests or checks run, decisions, tradeoffs, residual risks, and deferred concerns.

## Boundaries

- AI agents must never add or reveal secrets, private keys, credentials, real data, or real payment processing.
- AI agents must not claim verification, enabled repository controls, or system behavior without evidence.
- AI agents must update relevant documentation in the same change as behavior, process, architecture, security posture, or roadmap changes.
- AI agents must not automatically implement future roadmap items.
- AI agents must stop and request a decision when requirements, ownership, risk acceptance, or architectural direction is materially unclear.

## Evidence and Review

Every meaningful change should leave durable evidence in the repository: code and tests where applicable, updated documentation, ADRs for significant decisions, and a reviewable change description. Human review remains required regardless of whether a change was authored manually or with AI assistance.
