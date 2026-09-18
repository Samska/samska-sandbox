# SS-024: Human Verification Workflow

- Status: Active
- Work date: 2026-09-18
- Last reviewed: 2026-09-18
- Work item: [SS-024](https://github.com/Samska/samska-sandbox/issues/34)
- Pull request: [PR #35](https://github.com/Samska/samska-sandbox/pull/35)
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md)

## What you should learn

- Evidence provenance
- Human-in-the-loop engineering
- Verification-layer boundaries
- Automation versus human judgment
- Risk-based manual verification

### Core — Know this for interviews

- Evidence provenance
- Human-in-the-loop engineering
- Risk-based verification boundaries

## Concepts explained

Evidence provenance identifies who or what produced a verification result. Agent, human, and CI evidence can support the same change, but they establish different facts and must not be merged into an unsupported generic claim.

Human-in-the-loop engineering keeps accountability with the owner while using automation effectively. A focused human observation can reveal usability, behavior, or judgment that an automated check does not establish.

Risk-based verification selects the smallest useful evidence for the change. Human Verification is required when direct observation adds value; it is not applicable when no meaningful human-observable behavior exists, and it never requires repeating an automated suite.

## How Samska uses it

[AI Engineering Governance](../AI-GOVERNANCE.md) is the canonical workflow rule. It requires each meaningful change to classify Human Verification, separates Agent, Human, and CI evidence, and stops an agent before commit or pull request creation when human verification is required.

This Learning Record explains the transferable concepts without replacing the governance rule. SS-024 itself is documentation-only, so its Human Verification classification is Not applicable: it introduces no human-observable runtime behavior. Normal human engineering review of the change remains separate.

## Interview perspective

Strong answers distinguish automated test coverage from human review evidence, explain why evidence provenance matters, and use risk to decide when direct observation adds confidence. They avoid claiming that one verification layer proves behavior established only by another.

## What not to worry about yet

SS-024 does not add screenshots, video evidence, approval bureaucracy, new automation, or a requirement to manually execute all automated tests. Those controls need separate evidence and justification if they are ever considered.

## Reference

- Issue: [SS-024](https://github.com/Samska/samska-sandbox/issues/34)
- Pull request: [PR #35](https://github.com/Samska/samska-sandbox/pull/35)
- Relevant source files: [AI Engineering Governance](../AI-GOVERNANCE.md), [Contributing](../../CONTRIBUTING.md), [Learning Journal guide](README.md)
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md), [Learning Journal guide](README.md)
