# SS-035: CI Test Result Visibility Through Suite Names

- Status: Active
- Work date: 2026-09-28
- Last reviewed: 2026-09-28
- Work item: [SS-035](https://github.com/Samska/samska-sandbox/issues/59)
- Pull request: [#60](https://github.com/Samska/samska-sandbox/pull/60)
- ADRs: None
- Canonical documentation: [Testing](../TESTING.md), [AI Engineering Governance](../AI-GOVERNANCE.md), [GitHub Controls](../GITHUB.md)

## What you should learn

- Putting the layer where reviewers already look instead of beside the report
- Why the first attempt—prose guidance in the summary—failed human review
- The boundary between a descriptive naming convention and an enforced taxonomy
- Honest layer terms: smoke, unit, in-memory, coordination, MockMvc, jsdom, helper
- How an unlabelled test still stays visible
- Superseding a rejected approach without hiding its evidence

### Core — Know this for interviews

- The suite name in JUnit XML is the heading a reviewer sees for each case
- Naming conventions persuade; they must not gate
- Evidence surfaces answer different review questions

## Concepts explained

**Names travel with the result.** Surefire names a suite after the test class and Vitest after the test file; the publisher groups individual cases under that suite name in the Job Summary. A layer-bearing name therefore labels every case where reviewers look, with no parser, registry, or configuration.

**Prose guidance did not survive review.** PR #60 added a `job_summary_text` paragraph to each summary. The owner inspected the rendered summaries and found that it described the suite in aggregate without identifying each test's layer. A paragraph is read once; a suite heading is read next to every case. That failed review is the evidence behind the replacement.

**Convention, not gate.** The renames are one-time and descriptive. A future unlabelled test still runs in the unfiltered jobs and appears under its own name; no CI check fails for a missing or mistaken label, and no per-layer totals are claimed. The convention can drift as the suite evolves; it costs no registry, and it cannot block a green run.

**Honest terminology.** `InMemoryProductStoreTest` keeps its in-memory name because it primarily exercises store behavior, not coordination; the latch-controlled interleaving suites use the `Coordination` prefix. MockMvc and jsdom suites are component tests, not browser end-to-end.

## How Samska uses it

Backend headings: `ApplicationSmokeTest`; `UnitProductTest`, `UnitCartTest`, `UnitProductMediaNormalizerTest`, `UnitUploadedMediaTest`; `InMemoryProductStoreTest`; `CoordinationCatalogCartCoordinatorTest`, `CoordinationProductApplicationServiceMediaTest`; `MockMvcProductApiTest`, `MockMvcProductMediaCapacityApiTest`, `MockMvcCartApiTest`. Frontend files carry `.jsdom-component` before `.test.tsx` or `.isolated-helper` before `.test.ts`. The CI jobs, their unfiltered commands, publishing, artifacts, permissions, fork handling, and failure gates are unchanged, and the shortened `job_summary_text` still states that MockMvc and jsdom are not browser end-to-end and that no PostgreSQL integration tests exist. `docs/TESTING.md` documents the same limits.

## Interview perspective

Expect questions about how to make test results navigable without building a taxonomy engine, why a naming convention is safer than an enforced inventory, and how you would notice that a convention has drifted. A strong answer explains that the suite name is the artifact reviewers already read, that labels must not gate CI, and that no per-layer totals are inferred from names alone.

## What not to worry about yet

Per-layer totals, tag/project-filtered report groups, coverage thresholds, test-analytics platforms, flaky-test quarantine, Playwright or browser end-to-end frameworks, and PostgreSQL or Testcontainers integration.

## Reference

- Issue: [SS-035](https://github.com/Samska/samska-sandbox/issues/59)
- Pull request: [#60](https://github.com/Samska/samska-sandbox/pull/60)
- Relevant files: backend test classes under `backend/src/test/java/`, frontend test files under `web/src/`, `.github/workflows/ci.yml`, `docs/TESTING.md`, `README.md`
- Superseded evidence: the withdrawn inventory/classifier (20 fixture tests and 99/107 aggregation results) and the rejected static-guidance presentation on PR #60 head `a45a4ce` are evidence of earlier approaches only and are not verification of the naming replacement
- ADRs: None
- Canonical documentation: [Testing](../TESTING.md), [AI Engineering Governance](../AI-GOVERNANCE.md)

## Why this design

Alternatives were compared: a custom XML classifier with a per-file inventory (rejected: maintenance and classification-only failure risk); static prose guidance (rejected by failed Human Verification of the rendered presentation on `a45a4ce`); separate tag/project-filtered report groups (real per-layer counts but extra runtime, duplicated setup, and a completeness risk that could hide tests); and descriptive suite names (chosen: the cheapest change that labels each case where reviewers look, with no gate). The accepted limit is that names are not enforced and no automatic per-layer totals exist.

## Common mistakes

- Claiming a naming convention is mechanically enforced
- Presenting suite-name counts as automatic per-layer totals
- Calling store tests coordination or MockMvc/jsdom tests end-to-end
- Letting a rename break discovery (Java names must still match `*Test`/`*Tests`; frontend files must still match `*.test.ts(x)`)
- Assuming prose in the summary identifies each test's layer

## Interview vocabulary

- **Suite heading**: the class or file name under which the publisher groups individual cases.
- **Descriptive convention**: a reviewable naming habit without enforcement.
- **Classification-only failure**: a CI failure caused solely by missing or mistaken metadata; explicitly rejected here.
- **Superseded evidence**: verification belonging to a withdrawn or rejected approach that must not be reused.

## Deeper — Useful later

If automatic per-layer totals ever matter, native tag/project selection in separate jobs is the honest path, with a completeness check so ungrouped tests are reported rather than hidden. Until then, layer-bearing names plus the existing publisher remain the cheapest honest evidence.
