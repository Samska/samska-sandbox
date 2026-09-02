# SS-004: GitHub Repository Security and Governance

- Status: Historical
- Work date: 2026-08-30
- Work item: [SS-004, Issue #6](https://github.com/Samska/samska-sandbox/issues/6)
- Pull request: [PR #7](https://github.com/Samska/samska-sandbox/pull/7)
- ADRs: None
- Canonical documentation: [GitHub Repository Controls](../GITHUB.md), [Security Engineering](../SECURITY.md), and [Security Policy](../../SECURITY.md)

## Study Surface

Repository security is layered: policy guides behavior, platform controls enforce selected rules, and evidence establishes what is actually configured.

### Must Remember

- Policy, technical enforcement, and configuration evidence are different controls with different claims.
- A protected PR workflow with zero required approvals does not provide independent peer review.
- Secret Scanning detects supported existing patterns; Push Protection aims to prevent supported secrets before push; neither makes secrets safe to commit.
- Controls and their claims should evolve with evidence; deferral is not permanent risk acceptance.

### Mental Model

```text
Policy -> GitHub enforcement -> evidence of configured state -> human review
```

### Active Recall

#### What can be claimed when documentation describes a desired control but remote evidence is absent?

<details>
<summary>Answer guide</summary>

- Only intent or desired state can be claimed.
- Documentation does not independently establish a remote setting.

</details>

#### What does the zero-approval protected-main workflow solve, and what does it not solve?

<details>
<summary>Answer guide</summary>

- It preserves PR-based change evidence and protects against direct, force-push, and deletion paths.
- It does not establish peer approval; the owner must perform meaningful self-review.

</details>

#### When should a deferred control be revisited?

<details>
<summary>Answer guide</summary>

- When code, dependencies, environments, releases, or another concrete risk creates a justified need.
- The current canonical control record, not this dated record, states present status.

</details>

### Decision Drills

#### Decision Drill: Solo-maintainer protected-main workflow

**Problem:** Protect public `main` while one maintainer cannot obtain independent approvals.

**Options:** Direct unprotected changes, required peer approvals, or protected PRs with zero approvals and owner self-review.

**Decision:** PR-required protected `main`, conversation resolution, force-push/deletion protection, and zero required approvals.

**Why:** It keeps changes reviewable without falsely claiming unavailable peer review.

**Trade-off:** Change control exists, but independent review does not.

**Reconsider When:** Additional qualified reviewers or risk requirements make independent approval practical or necessary.

### Hands-on Reinforcement

#### Inspect policy, enforcement, and evidence

- **Prerequisite:** none.
- **Perform or inspect:** choose three entries in [`docs/GITHUB.md`](../GITHUB.md).
- **Expected observation:** each identifies a control, status, and evidence type.
- **Explain:** what each entry proves and does not prove.
- **Cleanup:** none.
- **Proves / does not prove:** practices evidence interpretation; does not independently re-verify remote configuration.

### Interview Drill

#### Explain the repository security baseline without overstating review or evidence.

- **Expected reasoning:** public-repository context, protected main, zero-approval boundary, secret protection, evidence levels, deferred controls, and residual owner review.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** solo-maintainer protected-main workflow.
- **Concept or boundary to explain:** policy versus enforcement versus evidence.
- **Repository action:** classify one `docs/GITHUB.md` control by its evidence.

## Reference Surface

### Historical Context and Outcome

Before SS-004, `docs/GITHUB.md` described desired controls without claiming they were enabled. SS-004 made it an evidence-based control record and updated the private vulnerability-reporting path.

### Implementation and Decision Evidence

The dated record included the `Main` ruleset, pull-request requirement, zero approvals, conversation resolution, force-push/deletion protection, squash-only merging, Secret Scanning, Push Protection, Private Vulnerability Reporting, Security Advisories, and deferred controls. API-verified and owner-verified evidence must remain distinct.

### Security, Verification, and Risks

PR #7 reported documentation-link validation and `git diff --check`; no CI/CD, application code, dependencies, infrastructure, or application tests were introduced. Detection is defense in depth, and deferred controls can be forgotten.

### Delivery History and Deferred Work

No formal GitHub review, comments, or findings are recorded for PR #7. The historical rationale for deferring application analysis predated code and manifests; consult `docs/GITHUB.md` for current state.

### Sources

- [Issue #6](https://github.com/Samska/samska-sandbox/issues/6)
- [PR #7](https://github.com/Samska/samska-sandbox/pull/7)
- [GitHub Repository Controls](../GITHUB.md)
- [Security Engineering](../SECURITY.md)
