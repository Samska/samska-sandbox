# SS-038: BDD-style Scenarios for Agent Evidence

- Status: Draft
- Work date: 2026-10-23
- Last reviewed: 2026-10-23
- Work item: [SS-038, Issue #64](https://github.com/Samska/samska-sandbox/issues/64)
- Pull request: None
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md), [Testing Strategy](../TESTING.md), [Local Development](../LOCAL-DEVELOPMENT.md), and [Learning Journal](README.md)

The owner reviewed the evidence report on 2026-10-23 and said it appears okay. This record remains **Draft** because the retain/revise/abandon decision was not supplied; the review did not include personal execution or detailed retrospective answers.

## What you should learn

- A scenario is a plan for observation, not evidence by itself.
- Expected outcome, actual observation, result, and evidence are separate fields for a reason.
- A harness or environment failure is not a product failure; preserve it as a blocked attempt.
- Same-revision payment sequencing matters: decline can be followed by approval on the same revision, but not the reverse.
- Owner review of agent evidence is not the same as the owner executing the flow.

### Core — Know this for interviews

- Evidence provenance and the difference between Agent Verification and Human Verification.
- Separating expected behavior from observed behavior.
- Distinguishing a product contradiction from a blocked execution attempt.

## Concepts explained

A scenario states a starting condition, an action, and an expected observable result. It becomes evidence only when someone actually performs the action and records what happened. The scenario text can be well written and still prove nothing on its own.

Recording expected, actual, result, and evidence separately prevents a common failure: retrofitting an observation to the expected wording. A screenshot supports an observation only for the state it shows; it does not prove that the preceding action occurred or that the transition was performed.

A blocked run is not a failed scenario. A browser address, a selector, an unavailable tool, or a non-empty shared Cart can prevent execution without contradicting product behavior. Preserving the blocked attempt separately keeps the final result honest.

Payment attempts are revision-aware. A declined attempt does not mark the Cart revision approved, so a later approval on the same revision can succeed. Once approved, another outcome on that revision returns `already-approved` and reopens the existing attempt. That makes S2 -> S1 a valid sequence and S1 -> S2 invalid for the same revision.

## How Samska uses it

Issue #64 records the owner's decision that the agent executes S2 -> S1 -> S3 and the owner reviews the results and evidence. The execution comment records the browser observations, screenshots, trace, and structured result; the Issue body indexes the results without duplicating the evidence.

The observed flow was: decline an unapproved Cart, return through `Try again with the current Cart`, approve the same revision, create the Order explicitly, change the live Cart to quantity 3, and recover the frozen Order through the saved attempt URL in a full-page load. All three scenarios passed as Agent Verification. The owner reviewed the evidence report and said it appears okay; the format decision remains pending.

The pilot does not evaluate whether the scenarios help the owner perform the flow manually. That was the earlier approach and is now superseded context.

## Interview perspective

Expect questions about how you know a browser flow worked, why a screenshot is not sufficient by itself, and how you distinguish a product bug from a test-harness problem. A strong answer describes the action performed, the observable state, the evidence, the revision, and what the evidence does not prove.

A second theme is verification ownership: an agent can execute and report, but the owner remains accountable for accepting the evidence and deciding whether the verification approach is adequate. Reviewing evidence is not the same as reproducing the runtime flow.

## What not to worry about yet

No BDD framework, runner, CI integration, or mandatory scenario template is adopted. The pilot also does not establish that scenario wording improves manual execution for the owner; that question is outside the current approach.

## Why this design

The owner changed the approach to agent execution with owner review. This uses the existing browser capability and avoids asking the owner to reproduce a runtime flow that the agent can execute and document. The trade-off is that the pilot evaluates evidence clarity and reviewability, not owner-performed ease of use.

## Common mistakes

- Treating a scenario document or a screenshot as proof that an action was performed.
- Calling a blocked harness attempt `Failed` when no product contradiction was observed.
- Reusing historical Human Verification as evidence for a new pilot.
- Saying the owner executed or reproduced the flow when the owner only reviewed agent evidence.
- Running S2 after S1 on the same Cart revision and expecting a decline.

## Reference

- Issue: [SS-038, Issue #64](https://github.com/Samska/samska-sandbox/issues/64); [execution evidence comment 6367487152](https://github.com/Samska/samska-sandbox/issues/64#issuecomment-6367487152); [owner review comment 6370941385](https://github.com/Samska/samska-sandbox/issues/64#issuecomment-6370941385)
- Pull request: None
- Relevant source files: `web/src/payment/PaymentResult.tsx`, `web/src/order/OrderResult.tsx`, `web/src/catalog/Catalog.tsx`, `backend/src/main/java/io/github/samska/sandbox/payment/storage/InMemoryPaymentStore.java`
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md), [Testing Strategy](../TESTING.md), [Local Development](../LOCAL-DEVELOPMENT.md)
