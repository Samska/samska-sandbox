# SS-035: CI Test Visibility Without Mandatory Classification

- Status: Active
- Work date: 2026-09-28
- Last reviewed: 2026-09-28
- Work item: [SS-035](https://github.com/Samska/samska-sandbox/issues/59)
- Pull request: None yet
- ADRs: None
- Canonical documentation: [Testing](../TESTING.md), [AI Engineering Governance](../AI-GOVERNANCE.md), [GitHub Controls](../GITHUB.md)

## What you should learn

- Reporting clarity versus reporting precision: proving what a test ran matters more than summing arbitrary buckets
- Why a mandatory classification inventory creates maintenance and CI-failure risk
- The difference between a Job Summary, a Check Run, and an artifact as evidence surfaces
- Honest layer terminology: MockMvc and jsdom are component tests, not browser end-to-end
- Why "we can show per-layer totals" is a stronger claim than it looks
- Superseding an approach while keeping its evidence clearly labeled

### Core — Know this for interviews

- Reporting decisions carry maintenance costs that outlive the original need
- CI failures should reflect evidence loss or product risk, not bookkeeping
- Evidence surfaces answer different review questions

## Concepts explained

**Visibility is not the same as taxonomy.** A reviewer wants to know what ran, what failed, and what it proves. The existing reporter already answers "what ran and failed" with overall counts and per-suite result tables in each Job Summary. Turning those numbers into per-layer totals requires deciding every suite's layer, keeping that decision current, and treating a missing decision as a failure. That is a data-maintenance program, not visibility.

**A mandatory inventory changes the failure mode.** With an explicit class/file inventory and a custom XML classifier, an ordinary refactor (a renamed suite, a split file, a new test) can fail CI even when every test passed and no product risk changed. The owner rejected that: classification-only failures are bookkeeping failures, not engineering signal.

**Static guidance is cheap and honest.** A short `job_summary_text` paragraph explains what the suite mixes and what it cannot prove—MockMvc exercises HTTP in-process, jsdom is not a browser, PostgreSQL integration does not exist—without claiming a per-layer count or that suites were classified. It can become stale as suites evolve, but it requires no per-file registry and it does not cause classification-only CI failures.

**Evidence surfaces.** Check Runs carry aggregate results and annotations; the Job Summary is the review panel; the XML artifact is the raw record. The replacement keeps all three and adds guidance where reviewers already look.

## How Samska uses it

`.github/workflows/ci.yml` passes a static `job_summary_text` to every pinned report step: the Backend publish step and its fork annotation step, and the Frontend publish step and its fork annotation step. The text distinguishes the executed layers from browser end-to-end and database integration, states that totals are overall rather than per-layer, and leaves the existing commands, publication, artifacts, permissions, `continue-on-error` flow, and failure gates unchanged. `docs/TESTING.md` documents the same boundaries. This record also preserves the superseded inventory/classifier lesson so the rejected direction is not rediscovered as new.

## Interview perspective

Expect questions about when a reporting improvement is worth its maintenance cost, how you would notice and correct stale or ambiguous suite guidance, and why jsdom and MockMvc tests are not end-to-end tests. A strong answer separates the evidence a reviewer needs from the metadata bookkeeping would require, and explains why CI should fail for lost evidence rather than for an uncategorized test.

## What not to worry about yet

Per-layer totals, coverage thresholds, test-analytics platforms, flaky-test quarantine, Playwright or browser end-to-end frameworks, and PostgreSQL or Testcontainers integration. Those become relevant only when a concrete decision needs them.

## Reference

- Issue: [SS-035](https://github.com/Samska/samska-sandbox/issues/59)
- Pull request: None yet
- Relevant files: `.github/workflows/ci.yml`, `docs/TESTING.md`, `README.md`
- Superseded evidence: the removed inventory, classifier, and fixture tests, and the 99/107 aggregation runs recorded under them, are evidence of the withdrawn approach only
- ADRs: None
- Canonical documentation: [Testing](../TESTING.md), [AI Engineering Governance](../AI-GOVERNANCE.md)

## Why this design

Three options were compared. Improving only the existing report with static guidance costs almost nothing and cannot produce a false CI failure. Renaming suites to communicate layers helps human readers but still provides no reliable totals and imposes naming judgment on every change. Splitting suites into separate CI jobs with framework-native selection (Surefire tag groups, Vitest projects) can provide real per-layer counts, but duplicates setup, increases runner cost, and can silently hide tests when selection and sources drift. The explicit inventory plus custom XML classifier was withdrawn by owner decision for exactly the maintenance and failure-mode reasons above. The project accepts descriptive clarity without per-layer totals.

## Common mistakes

- Treating per-layer totals as free when they require ongoing classification decisions
- Letting a classification bookkeeping error fail a green test run
- Claiming jsdom or MockMvc tests are end-to-end
- Implying that every present or future suite has been classified
- Assuming a green reporting step replaces the test-failure gate

## Interview vocabulary

- **Job Summary**: the Markdown panel a workflow publishes for review, distinct from logs and artifacts.
- **Check Run**: the per-commit status object that can carry aggregate results and annotations.
- **Component test**: an in-process test of a slice through framework boundaries, not a browser journey.
- **Superseded evidence**: verification that belongs to a withdrawn implementation and must not be reused to claim the replacement works.

## Deeper — Useful later

If reliable per-layer totals ever matter, framework-native selection (JUnit tags, Vitest projects) inside separate jobs is the honest path, with an explicit completeness check so untagged tests are reported rather than hidden. Until then, descriptive guidance and the existing publisher remain the cheapest honest evidence.
