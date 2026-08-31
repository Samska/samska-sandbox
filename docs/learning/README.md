# Engineering Learning Journal

## Purpose

The Engineering Learning Journal preserves durable lessons from Samska Sandbox work. It helps the project owner return to an implemented decision months later and work through:

```text
understand -> recall -> explain -> apply
```

It is a curated, evidence-based learning layer, not a new source of operational truth. Issues, pull requests, ADRs, and technical documentation remain authoritative for their respective purposes.

## Structure

| File | Purpose |
| --- | --- |
| [000-template.md](000-template.md) | Reusable active-learning format for a Learning Record. |
| [ss-002-architecture-principles.md](ss-002-architecture-principles.md) | Architecture principles, the modular-monolith decision, and ADR use. |
| [ss-003-ai-engineering-governance.md](ss-003-ai-engineering-governance.md) | AI-assisted engineering governance and human accountability. |
| [ss-004-github-repository-security.md](ss-004-github-repository-security.md) | GitHub security controls and evidence-based governance. |
| [ss-005-repository-documentation-ci.md](ss-005-repository-documentation-ci.md) | Repository CI, GitHub Actions security, and documentation quality gates. |
| [ss-006-java-backend-bootstrap.md](ss-006-java-backend-bootstrap.md) | Java backend baseline, dependency management, Spring Boot, testing, and backend CI. |

Use the work-item identifier in a new record name, for example `ss-009-product-domain.md`. One record should cover one coherent work item; link to another record when later work builds on its lesson.

## Artifact Boundaries

| Artifact | Canonical responsibility | Learning-record responsibility |
| --- | --- | --- |
| GitHub Issue | Requested outcome, scope, acceptance criteria, and work status. | Explain what is worth learning from completing the work. |
| Pull Request | Exact change set, review discussion, verification evidence, and merge context. | Distill durable conclusions and link to the PR. |
| ADR | Historical rationale for a significant, durable architectural decision. | Explain the engineering concepts and interview lessons around the decision without replacing the ADR. |
| Technical documentation | Current system, process, control, or operational guidance. | Relate current guidance to the work that produced it without copying it. |
| Learning record | Evidence-linked learning context and practice. | Never become a second copy of the canonical artifact. |

## When a Learning Record Is Required

Create or update a Learning Record for meaningful work that establishes or materially changes architecture, module boundaries, dependencies, infrastructure, data or API behavior, security posture, CI/CD, testing or verification strategy, engineering governance, or material operational risk.

Also create a record when an experiment, incident, rejected approach, or non-obvious trade-off produces a reusable engineering lesson. Do not create a record for mechanical edits with no durable lesson. If the need is unclear, the human owner decides before implementation.

Create or update the record in the same pull request as the work. Retrospective records may use repository history and GitHub artifacts when a prior work item predates this journal.

## Record Format

Use [the template](000-template.md), adapting it to the work rather than filling every possible section. The required parts are:

- Evidence-linked metadata, including the original work date and `Last reviewed` for records in the active format.
- A concise Mental Model that lets a reader reconstruct the important pieces and their connection.
- Learning Priorities.
- Active Recall before detailed concept treatment, with answer guidance hidden in GitHub-native `<details>` elements.
- Appropriate treatment of Core concepts.
- A learning-outcome Self-check.
- Engineering Evidence and History, including security and verification implications.
- Canonical sources.

The following are conditional or optional: Important Concept Cards, Common Misconceptions, Hands-on Reinforcement, Interview Practice, explanation-depth ladders, likely interview follow-ups, and diagrams. Omit them when they do not add learning value; do not leave empty headings.

Use an ASCII flow or diagram only when it clarifies a sequence, dependency, system boundary, or connection that prose would make harder to reconstruct.

### Learning Priorities

| Priority | Meaning | Expected treatment |
| --- | --- | --- |
| Core | Needed to reconstruct the work, justify its central decisions, and explain or apply the lesson. | Full Concept Card, recall coverage, and usually interview coverage. |
| Important | Needed to reason about implementation, verification, risk, or a material trade-off. | Compact card or focused prose. |
| Supporting | Useful evidence, terminology, version detail, or operational context, but not a primary learning outcome. | Grouped brief context or a source link. |

Prioritize a concept when misunderstanding it would lead to a materially wrong design or explanation, it was central to the Issue outcome, it transfers to later work, or it has a meaningful alternative, failure mode, or practical exercise. A normal record has at most three Core concepts and four Important concepts. These are limits, not quotas; group Supporting details.

### Concept Cards and Recall

Use a full Concept Card only for a Core concept or an Important concept that needs structured treatment. A full card has:

- **Meaning**
- **Samska application**
- **Decision value**
- **Trade-off or failure boundary**

Alternative, common-mistake, and evidence fields are optional. Use normal prose for minor details. Do not create a card for every noun in an implementation.

Use approximately three to six Active Recall questions when warranted. Ask why, how, comparison, prediction, or failure-reasoning questions tied to Samska decisions. The answer guide should provide reasoning points and evidence, not a script to memorize.

Interview Practice is different: it tests open-ended communication of a real decision. Include one to three high-value questions only when useful. Give expected discussion points covering context, constraint, decision, evidence, trade-off, and boundary or deferred work. Add likely follow-ups only when they improve practice.

Use a 15-second thesis and an approximately one-minute expansion for no more than two Core decisions when different explanation depths add interview value. Link to deeper cards and evidence instead of repeating the same explanation three times.

### Hands-on Reinforcement and Misconceptions

An exercise must use the actual repository, be safe and reproducible, reinforce a Core or Important concept, and ask for an observation or explanation. It must not require unrelated infrastructure. Include zero to three meaningful exercises and execute published commands during change verification where the environment permits. Exercise results from a later Learning Record update are study validation, not historical evidence for the original work.

Use a concise Common Misconceptions section only when several related mistakes would weaken technical explanations. Otherwise put the mistake in the relevant Concept Card.

## Evidence and Sustainability

Clearly distinguish verified facts, historical facts, current state, future direction, and deferred work. Include alternatives only when evidence supports them. Preserve concise Plan, Build, Review, and Pull Request conclusions because they explain delivery history, but do not reproduce raw AI prompts, chat transcripts, tool output, hidden reasoning, credentials, secrets, personal data, or unsupported reconstructions.

Canonical documents describe current state; records preserve a dated lesson. Update canonical documentation first when later work changes a lesson, then add a dated follow-up or supersession note to the affected record. Do not rewrite supported historical facts to make them appear current.

Learning density matters more than document size. Prefer the shortest record that achieves its learning outcomes. A record below 1,200 words is acceptable; do not add prose to reach a target. Around 1,800 words should trigger a pruning review, and more than 2,000 words requires explicit review justification. Never remove necessary engineering evidence merely to meet a length guideline. Link canonical sources instead of copying inventories, policies, workflows, or ADR text.

Records created under the previous format remain valid historical records and do not require immediate migration. Migrate them only through separately justified work after the active format has proven useful. Verify relative links whenever the journal changes.
