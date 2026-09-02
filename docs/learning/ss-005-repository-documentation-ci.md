# SS-005: Repository Documentation CI

- Status: Historical
- Work date: 2026-08-31
- Work item: [SS-005, Issue #8](https://github.com/Samska/samska-sandbox/issues/8)
- Pull request: [PR #9](https://github.com/Samska/samska-sandbox/pull/9)
- ADRs: None
- Canonical documentation: [GitHub Repository Controls](../GITHUB.md), [Testing Strategy](../TESTING.md), and [Repository CI workflow](../../.github/workflows/repository-ci.yml)

## Study Surface

CI should validate current artifacts with bounded assurance and execute with minimal capability.

### Must Remember

- CI should select the smallest effective checks for current artifacts and risks, not a future technology checklist.
- A passing quality gate proves only the behavior that gate checks.
- Read-only permissions and disabled persisted checkout credentials reduce capability available to later workflow steps.
- Immutable action SHA pinning reduces silent drift but does not remove supply-chain risk or update responsibility.
- Workflow event context matters when proposed changes are untrusted.

### Mental Model

```text
Pull request -> read-only pinned workflow -> checks current artifacts -> bounded feedback
```

### Active Recall

#### Why were Markdown, local-link, and EditorConfig checks justified before application CI?

<details>
<summary>Answer guide</summary>

- Documentation and governance were the artifacts that existed.
- Java, React, database, and journey checks would have been speculative.

</details>

#### What does passing Repository CI prove, and not prove?

<details>
<summary>Answer guide</summary>

- It proves the configured documentation checks passed.
- It does not prove application correctness, security, deployment readiness, semantic completeness, or live external-link availability.

</details>

#### Why do permissions, credentials, pins, and event context all matter?

<details>
<summary>Answer guide</summary>

- They constrain what untrusted or compromised workflow steps can do and reduce silent action drift.
- They do not eliminate hosted-runner or third-party-action risk.

</details>

### Decision Drills

#### Decision Drill: First CI gates

**Problem:** The repository had documentation and governance but no application, manifest, build, or test suite.

**Options:** No automated feedback, speculative future-stack CI, or checks for existing artifacts.

**Decision:** Markdown linting, offline local-link/fragment checking, and EditorConfig validation on PRs to `main`.

**Why:** These were the smallest effective checks for actual repository regressions.

**Trade-off:** Fast bounded feedback, not application or deployment assurance.

**Reconsider When:** New backend, frontend, persistence, or journey artifacts introduce corresponding risks.

#### Decision Drill: Least-privilege PR workflow

**Problem:** A PR workflow processes proposed content with tokens and third-party actions.

**Options:** Broad permissions, retained credentials, mutable tags, or privileged event context; or restricted permissions, no retained token, immutable pins, and `pull_request`.

**Decision:** `contents: read`, `persist-credentials: false`, SHA-pinned actions, and `pull_request`.

**Why:** It reduces unnecessary capability, credential exposure, privileged-context risk, and silent drift.

**Trade-off:** Updates remain deliberate and third-party or runner risk remains.

**Reconsider When:** Workflow responsibilities require a changed threat model and explicitly justified capabilities.

### Concept Cards

#### Quality-gate assurance boundary

- **Meaning:** A check supplies evidence only within its asserted scope.
- **Samska application:** Repository CI validates Markdown, local links/fragments, and EditorConfig.
- **Boundary or common mistake:** Passing documentation CI is not evidence of application correctness.

### Hands-on Reinforcement

#### Inspect Repository CI

- **Prerequisite:** none.
- **Perform or inspect:** read `.github/workflows/repository-ci.yml`.
- **Expected observation:** trigger, permissions, checkout credential behavior, SHA pins, and three checks are explicit.
- **Explain:** which risk each configuration reduces and which assurance boundary remains.
- **Cleanup:** none.
- **Proves / does not prove:** practices workflow interpretation; does not execute or independently secure the workflow.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** first CI gates.
- **Concept or boundary to explain:** a passing gate proves only its configured checks.
- **Repository action:** identify the workflow's least-privilege settings.

## Reference Surface

### Historical Context and Outcome

SS-005 added the first CI workflow when the repository had documentation and governance only. It intentionally excluded backend, frontend, database, application-test, deployment, and dependency tooling.

### Implementation and Decision Evidence

Repository CI runs on PRs to `main` and uses Markdown linting, offline local link/fragment validation, and EditorConfig checks. The workflow uses `contents: read`, no persisted checkout credentials, immutable action SHAs, explicit supported tool versions, and `pull_request` rather than `pull_request_target`.

### Security, Verification, and Risks

PR #9 reported actionlint, markdownlint, local-link validation, EditorConfig validation, and `git diff --check` passing. Pins, fixed runner selection, and offline checks improve predictability but do not make CI fully deterministic. Required status checks were historically deferred without an approved threshold.

### Delivery History and Deferred Work

No formal GitHub review, comments, or findings are recorded for PR #9. Later backend and frontend CI are current separate controls; consult canonical documentation for present state.

### Sources

- [Issue #8](https://github.com/Samska/samska-sandbox/issues/8)
- [PR #9](https://github.com/Samska/samska-sandbox/pull/9)
- [Repository CI workflow](../../.github/workflows/repository-ci.yml)
- [GitHub Repository Controls](../GITHUB.md)
