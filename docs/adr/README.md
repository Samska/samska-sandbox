# Architecture Decision Records

## Purpose

Architecture Decision Records (ADRs) preserve the context and rationale for significant, durable architectural decisions. They complement implementation and documentation; they do not replace either.

## When To Create an ADR

Create an ADR when a decision has meaningful long-term impact, constrains future options, changes system boundaries, introduces or rejects a major architectural pattern, or records a consequential tradeoff.

Examples include adopting the initial modular-monolith approach, selecting a messaging strategy after evidence supports it, or deciding to extract a service boundary.

## When Not To Create an ADR

Do not create ADRs for routine implementation details, short-lived experiments, formatting choices, isolated bug fixes, or decisions that are already fully reversible and local to one change.

## Format and Lifecycle

- Start from [000-template.md](000-template.md).
- Use zero-padded sequential identifiers: `0001`, `0002`, and so on.
- Name files as `<number>-<short-kebab-case-title>.md`.
- Use a status of Proposed, Accepted, Superseded, Deprecated, or Rejected.
- Once accepted, do not rewrite the decision's historical rationale. Record a new ADR to supersede or deprecate it when circumstances change.
- Link related ADRs, implementation, and affected documentation.

The first accepted decision is [ADR 0001: Adopt a Modular Monolith for v0.1](0001-adopt-modular-monolith.md).
