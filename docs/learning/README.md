# Engineering Learning Journal

## Purpose

The Engineering Learning Journal preserves durable lessons from Samska Sandbox work. It supports:

```text
understand -> retrieve -> explain -> apply -> revisit
```

It is an evidence-based learning layer, not a source of operational truth. Issues, pull requests, ADRs, and technical documentation remain authoritative for their respective responsibilities.

## Structure

| File | Purpose |
| --- | --- |
| [000-template.md](000-template.md) | Reusable retention-oriented Learning Record format. |
| [ss-002-architecture-principles.md](ss-002-architecture-principles.md) | Modular-monolith boundaries and ADR reasoning. |
| [ss-003-ai-engineering-governance.md](ss-003-ai-engineering-governance.md) | Human accountability in AI-assisted engineering. |
| [ss-004-github-repository-security.md](ss-004-github-repository-security.md) | Repository security controls and evidence boundaries. |
| [ss-005-repository-documentation-ci.md](ss-005-repository-documentation-ci.md) | Risk-based CI and workflow security. |
| [ss-006-java-backend-bootstrap.md](ss-006-java-backend-bootstrap.md) | Java backend baseline and verification boundaries. |
| [ss-007-react-application-bootstrap.md](ss-007-react-application-bootstrap.md) | React frontend baseline and browser/tooling boundaries. |
| [ss-008-postgresql-local-development.md](ss-008-postgresql-local-development.md) | PostgreSQL container, networking, readiness, and data-lifecycle boundaries. |

Use the work-item identifier in new record names, for example `ss-009-product-domain.md`. One record covers one coherent work item; link earlier records when their lessons remain relevant.

## Artifact Boundaries

| Artifact | Canonical responsibility | Learning-record responsibility |
| --- | --- | --- |
| GitHub Issue | Requested outcome, scope, acceptance criteria, and status. | Explain what completing the work teaches. |
| Pull Request | Exact change, review, verification, and merge evidence. | Distill durable conclusions and link it. |
| ADR | Historical rationale for a significant, durable architecture decision. | Teach its reasoning without replacing it. |
| Technical documentation | Current system, process, control, or operational guidance. | Relate it to dated work without copying it. |
| Learning Record | Evidence-linked study and reference material. | Never become a second canonical artifact. |

## When a Learning Record Is Required

Create or update a Learning Record for meaningful work that establishes or materially changes architecture, module boundaries, dependencies, infrastructure, data or API behavior, security posture, CI/CD, testing or verification strategy, engineering governance, or material operational risk.

Also create one when an experiment, incident, rejected approach, or non-obvious trade-off produces a reusable lesson. Do not create one for mechanical edits with no durable lesson. Create or update it in the same pull request as the work. Retrospective records may use repository and GitHub history.

SS-020 is an explicit exception: it evolves this canonical Learning System, so its durable evidence is Issue #19, this guide, the template, migrated records, the pull request, and verification evidence. It does not need a recursive Learning Record.

## Study Surface

The Study Surface is the compact material a returning reader should repeatedly retrieve and explain. It appears before detailed evidence. A reader should identify retention targets within about one minute; a normal review should take about 5-10 minutes, excluding exercise execution.

### Must Remember

Use 3-5 atomic statements normally. Fewer are valid when they sufficiently capture the lesson. More than five requires explicit pruning review and justification.

Choose decisions, transferable concepts, architecture reasoning, testing or security boundaries, and material trade-offs. Avoid exact versions, hashes, commands, individual configuration, and incidental implementation facts unless selecting them was itself the central decision. Every item must be exercised by recall, a Decision Drill, a Concept Card, an Interview Drill, or checkpoint cues.

### Mental Model

Use one short paragraph or one small useful diagram. It connects responsibilities, flow, or boundaries and should be reconstructable from memory. Around 3-7 meaningful nodes is a useful review trigger. Do not turn it into a file inventory, version list, decision rationale, or generic tutorial.

### Active Recall

Use 3-5 reasoning questions normally. Ask why, why not, what a layer solves or does not solve, how responsibilities differ, what would fail without it, or what would justify reconsideration. Answers stay collapsed in GitHub-native `<details>` and use concise reasoning bullets, not scripts or a duplicated Decision Drill.

Use 0-1 hint per question only when a small cue can unblock retrieval without revealing the answer. A reader attempts the question first, opens a hint only after a genuine attempt, then opens the answer guide only after another attempt.

### Decision Drills

A Decision Drill is a study-oriented reconstruction of an evidence-supported choice. It is not an ADR and does not approve or change a decision.

Create one only when realistic documented alternatives existed, the choice mattered to the Issue, meaningful reasoning and a trade-off exist, and it has reusable learning value. A normal record has 0-2 drills; three needs clear justification. When used, include all fields:

- **Problem**
- **Options**
- **Decision**
- **Why**
- **Trade-off**
- **Reconsider When**

Do not invent alternatives or rationale. Maven vs Gradle, npm vs pnpm, and the current Vite vs Next.js choice are Decision Drill candidates. Modular Monolith vs Microservices is authoritative in [ADR 0001](../adr/0001-adopt-modular-monolith.md); SS-002 may summarize it with a link, never supersede it.

### Concept Cards

Use a card only when the mechanics of a concept deserve understanding. A normal record has 0-2 cards; three needs clear justification. Use:

- **Meaning**
- **Samska application**
- **Boundary or common mistake**

Decision reasoning belongs in a Decision Drill. Use prose or a source link for minor details.

### Primary-Home Rule

| Section | Owns |
| --- | --- |
| Must Remember | Retention target name. |
| Mental Model | Connections and responsibilities. |
| Decision Drill | Decision reasoning. |
| Concept Card | Concept mechanics. |
| Active Recall | Retrieval. |
| Interview Drill | Combined explanation. |
| Reference Surface | Evidence and exact detail. |

Cross-reference instead of repeating explanatory prose.

### Interview Drills

Use 0-2 high-value drills when useful. Include a question, expected reasoning, and an optional likely follow-up. Expected reasoning uses only applicable context, problem, decision, why, evidence, trade-off, boundary, and reconsideration points. Do not provide polished answers.

One major decision may also use depth cues:

- **Short, 15-30 seconds:** decision, principal reason, and important boundary.
- **Technical, 1-2 minutes:** context, options, decision, evidence, trade-off, boundary, and reconsideration.

These are coverage cues, not scripts.

### Hands-on Reinforcement

Use 0-2 exercises normally. Each needs prerequisites, a perform/inspect action, expected observation, explanation task, platform differences where relevant, side effects/cleanup, and a statement of what it proves and does not prove. Prefer inspection over mutation. Exercise results from a later record update are study validation, not historical Issue evidence.

## Five-Minute Learning Checkpoint

After a meaningful Issue merges, use this reusable checkpoint:

1. Explain the Issue outcome in about 60 seconds.
2. Recall the Must Remember items.
3. Reconstruct one Decision Drill when one exists.
4. Explain one important concept or boundary.
5. Interpret or perform one small repository-based action.

Records contain only compact, record-specific cues linked here. Do not record scores, failures, study dates, mistakes, personal performance, or private learning analytics.

## Spaced and Cumulative Recall

Review after merge, about +1 day, +7 days, +30 days, and when the concept is reused. Start with Active Recall rather than rereading explanations. `Last reviewed` means document maintenance or revalidation, not personal study activity.

Occasionally mix real cross-Issue comparisons without creating a central question bank. Useful examples include JDK versus Maven Wrapper, Maven Wrapper versus `package-lock.json`/`npm ci`, Node tooling versus browser runtime, Spring versus React component smoke tests, CI evidence versus runtime evidence, and future PostgreSQL readiness versus application persistence.

## Reference Surface

Reference comes after study and preserves engineering evidence without making every fact a memorization target. Use conditional sections as appropriate:

- Historical Context and Outcome
- Implementation and Decision Evidence
- Security, Verification, and Risks
- Delivery History and Deferred Work
- Sources

Clearly distinguish historical facts, current state, future direction, and deferred work. Include alternatives only when evidence supports them. Link canonical documentation rather than copying inventories, policy prose, workflows, or ADR text. Do not include raw prompts, transcripts, hidden reasoning, secrets, credentials, personal data, or unsupported reconstructions.

## Sustainability

Learning density matters more than total file size. A large Reference Surface is acceptable when evidence requires it; an oversized Study Surface is not.

Trigger pruning review when there are more than five Must Remember items, more than three Decision Drills or five recall questions, more than two Concept Cards or Interview Drills without justification, a Study Surface exceeds about ten minutes, evidence interrupts the study path, explanations repeat, a Mental Model becomes an inventory, interview content becomes a script, or generic tutorial text could be reused unchanged elsewhere.

Do not fill a quota, create a card for every concept, create a drill for every choice, or write to reach a word count. Verify relative links whenever the journal changes.
