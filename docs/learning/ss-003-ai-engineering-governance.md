# SS-003: AI Engineering Governance

- Status: Historical
- Work date: 2026-08-30
- Work item: [SS-003, Issue #4](https://github.com/Samska/samska-sandbox/issues/4)
- Pull request: [PR #5](https://github.com/Samska/samska-sandbox/pull/5)
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md), [agent instructions](../../AGENTS.md), [Testing Strategy](../TESTING.md), and [Security Engineering](../SECURITY.md)

## Study Surface

AI accelerates engineering execution, while repository evidence and humans retain decision authority and accountability.

### Must Remember

- AI may inspect, plan, implement, verify, and report; humans retain requirements, risk tolerance, material decisions, review, and acceptance.
- Repository documentation and implementation are authoritative; conversation history and generated output are not.
- Substantial work requires scope, security, verification, and documentation assessment before implementation.
- Material uncertainty, conflicting requirements, unclear ownership, or unaccepted risk require a human decision.
- Verification claims need evidence and meaningful gaps must be disclosed.

### Mental Model

```text
Repository evidence -> AI execution support -> verification -> report
       ^                    |                         |
       +---- human decisions, review, and acceptance ---+
```

### Active Recall

#### Why is generated output not sufficient verification evidence?

<details>
<summary>Answer guide</summary>

- It can be stale, incomplete, or unsupported.
- Verification is a risk-based activity with observable evidence and disclosed gaps.

</details>

#### When must an agent stop rather than choose a direction?

<details>
<summary>Answer guide</summary>

- On material ambiguity, conflicting requirements, unclear ownership, or unaccepted risk.
- Continuing would replace accountable human judgment with agent preference.

</details>

#### Why is repository context preferable to conversation memory?

<details>
<summary>Answer guide</summary>

- Durable artifacts are reviewable by future contributors and can be updated with the system.
- Conversations and assumptions are not authoritative project state.

</details>

### Decision Drills

#### Decision Drill: Governed AI-assisted work

**Problem:** AI can broaden scope, use stale context, make unsupported claims, or decide risks it does not own.

**Options:** Treat chat as project memory and let agents decide material risks, or require repository-grounded execution with human authority.

**Decision:** AI supports execution; repository evidence grounds work; humans own material decisions and acceptance.

**Why:** It makes decisions reviewable and preserves accountability while retaining AI delivery support.

**Trade-off:** Context maintenance and meaningful human review take time.

**Reconsider When:** A demonstrated process failure requires governance improvement; speed alone does not transfer accountability.

### Concept Cards

#### Claim versus evidence

- **Meaning:** A statement about a control, test, or behavior needs evidence proportionate to its risk.
- **Samska application:** Agents must report actual validation and gaps rather than claim success from generated output.
- **Boundary or common mistake:** A merge, policy, or agent statement is not independent verification.

### Five-Minute Checkpoint Cues

Use the [canonical checkpoint](README.md#five-minute-learning-checkpoint).

- **Decision or reasoning to reconstruct:** governed AI-assisted work.
- **Concept or boundary to explain:** claim versus evidence.
- **Repository action:** inspect `AGENTS.md` and identify a stop condition for an ambiguous dependency request.

## Reference Surface

### Historical Context and Outcome

SS-003 established AI-assisted engineering governance before application implementation. It kept `AGENTS.md` concise and made `docs/AI-GOVERNANCE.md` the detailed source.

### Implementation and Decision Evidence

The governance assigns agents context gathering, planning, scoped implementation, documentation synchronization, verification, and reporting. Humans own requirements, acceptance criteria, risk tolerance, review, material decisions, and acceptance. It rejects chat as project memory, autonomous material-risk decisions, and unrequested AI-specific tooling.

### Security, Verification, and Risks

The policy requires assessment of data, secrets, APIs, dependencies, logs, build pipelines, infrastructure, and deployment. PR #5 reported documentation consistency, relative-link validation, and `git diff --check`; no application code, dependencies, infrastructure, or application tests existed.

### Delivery History and Deferred Work

No formal GitHub review, comments, or findings are recorded for PR #5. The durable risk is process drift; future work must continue to apply and update governance when evidence warrants it.

### Sources

- [Issue #4](https://github.com/Samska/samska-sandbox/issues/4)
- [PR #5](https://github.com/Samska/samska-sandbox/pull/5)
- [AI Engineering Governance](../AI-GOVERNANCE.md)
- [Agent Instructions](../../AGENTS.md)
