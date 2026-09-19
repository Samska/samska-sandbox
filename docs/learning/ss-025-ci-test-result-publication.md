# SS-025: CI Test Result Publication

- Status: Draft
- Work date: 2026-09-19
- Last reviewed: 2026-09-19
- Work item: [SS-025](https://github.com/Samska/samska-sandbox/issues/36)
- Pull request: [PR #37](https://github.com/Samska/samska-sandbox/pull/37)
- ADRs: None
- Canonical documentation: [Testing Strategy](../TESTING.md), [GitHub Repository Controls](../GITHUB.md), and [AI Engineering Governance](../AI-GOVERNANCE.md)

## What you should learn

- Test execution and test-result publication are separate CI responsibilities.
- JUnit XML is an interchange format for test outcomes, failures, skips, and durations.
- CI, agent, and human verification have distinct evidence sources.
- Failure-safe reporting must not turn a failed test suite into a successful job.
- GitHub Check Runs, annotations, Job Summaries, and artifacts answer different review questions.
- Immutable Action pinning limits CI supply-chain drift.

### Core — Know this for interviews

- JUnit XML as an interchange format.
- Failure propagation versus always-running reporting.
- CI evidence provenance and immutable Action pinning.

## Concepts explained

JUnit XML separates test-runner output from the system that presents it. Surefire and Vitest each produce structured test cases, outcomes, and timing, allowing the same report publisher to present backend and frontend evidence without replacing either framework.

An always-running report step needs careful control flow. The test command records its own outcome, reporting can execute after that outcome, and an explicit final gate restores the original test failure. A report parser must still fail for missing, empty, or malformed expected reports so lost evidence is not treated as success.

Check Runs expose structured results in the pull-request Checks experience. Annotations point to source lines when mapping is possible, Job Summaries collect a workflow-level overview, artifacts preserve the original XML for short-lived diagnosis, and logs retain raw execution detail. None is a dedicated GitHub Tests tab.

## How Samska uses it

Backend CI reuses Surefire XML from `backend/target/surefire-reports/TEST-*.xml`. Frontend CI invokes the existing Vitest test command with default and JUnit reporters, producing `web/test-results/junit.xml`. Both workflows use the same SHA-pinned JUnit report action and retain XML artifacts for seven days.

The reporting action needs only `checks: write` in addition to checkout's `contents: read`; it receives no explicit token, secrets, or PR-comment permission. External fork PRs use the action's annotation-only behavior because GitHub downgrades their token.

The GitHub UI is remote-only evidence. The governance exception permits the minimum commit and PR needed to expose that behavior after normal human engineering review, but requires Human Verification of the remote evidence before merge. Local XML inspection remains Agent Verification, and CI execution remains CI Verification.

## Interview perspective

A strong explanation distinguishes whether a test ran from whether reviewers can efficiently inspect its result. It should describe JUnit XML as a portable result contract, explain why report publication must run after failures without masking them, and identify the least privilege needed to create a Check Run.

## What not to worry about yet

Coverage measurement, retry systems, external test-management platforms, E2E tests, PR comments, and privileged cross-workflow reporting are intentionally outside SS-025.

## Why this design

Surefire already produces the required XML, and Vitest provides a built-in JUnit reporter, so no test framework or application dependency changes are needed. A single maintained JUnit report action provides Check Runs and summaries that repository-owned artifact storage alone cannot provide without a custom XML parser.

## Common mistakes

- Treating a green reporting step as proof that the original test command passed.
- Skipping report publication because the test step failed.
- Giving a report action broad token permissions or a personal access token.
- Calling local report-file inspection Human Verification of the GitHub PR experience.

## Reference

- Issue: [SS-025](https://github.com/Samska/samska-sandbox/issues/36)
- Pull request: [PR #37](https://github.com/Samska/samska-sandbox/pull/37)
- Relevant source files: `.github/workflows/backend-ci.yml`, `.github/workflows/frontend-ci.yml`
- ADRs: None
- Canonical documentation: [Testing Strategy](../TESTING.md), [GitHub Repository Controls](../GITHUB.md), and [AI Engineering Governance](../AI-GOVERNANCE.md)
