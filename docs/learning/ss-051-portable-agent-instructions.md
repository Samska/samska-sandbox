# SS-051 — Portable agent instructions and bounded Build execution

## What you should learn

- Why a repository instruction base should name obligations and boundaries rather than require a specific agent tool, model, or orchestration topology.
- How a Build authorization can cover routine implementation and scoped commits or pushes without becoming permission for pull request creation or merge.
- Why AI review and owner review are different evidence classes, and why policy review does not demonstrate instruction loading or behavioral adoption.
- How to supersede instructions without erasing the historical record or reviving obsolete requirements.
- How content-level preservation evidence protects abandoned work better than branch names or file counts.

### Core — Know this for interviews

- Authorization is scoped by task, repository, and action; covered actions do not need renewed permission.
- Build completion is acceptance-criteria and evidence based, not merely a passing test run.
- Obsolete instructions must be marked historical or removed from the active path, with immutable references preserving what they said.

## Concepts explained

### Portable entry point

`AGENTS.md` is the common entry point, but it points to canonical governance instead of duplicating it. Tool-specific configuration stays outside the repository requirement. This keeps the instruction base usable by OpenCode, another coding agent, or a future tool without rewriting the engineering rules.

### Covered actions and separate gates

A Build authorization can cover scoped edits, verification, commits, and normal pushes to the task branch. It can do that while required engineering review and Human Verification remain conditions. Pull request creation and merge are separate actions and need their own explicit authorization. This removes routine confirmation prompts without collapsing the decision gates.

### Review evidence classes

An AI review is Agent Verification. A review performed by the owner is human engineering review. Neither is automatically Human Verification. Human Verification requires an owner-reported observation or reproduction of behavior. Reviewing code or policy wording alone does not establish Human Verification, and approval of wording does not prove that an instruction was loaded or followed.

### Supersession without erasure

Deleting an active instruction file does not require deleting its history. A dated supersession note, an immutable commit link, and a short mapping preserve what was removed and why. Historical Issues, pull requests, failed observations, and Human Verification records keep their original scope.

## How Samska uses it

- [AGENTS.md](../../AGENTS.md) is the portable entry point.
- [AI Engineering Governance](../AI-GOVERNANCE.md) holds authorization, independent review, Build execution, evidence, supersession, and work-preservation policy.
- The historical role layer remains at commit `4ec11f8` and is linked from the superseded-instructions section.
- The SS-047 standing dismissal authorization remains in force with its original conditions and limits; the Maestri procedure is historical.
- The abandoned SS-050 work was preserved with branch, index, tracked-diff, and untracked-content evidence rather than reused or cleaned.

## Interview perspective

A strong answer explains why authorization is not the same as instruction, why a bounded autonomy loop still needs explicit gates, and why evidence provenance matters. It distinguishes AI review from owner review and Human Verification, and it describes supersession as a history-preserving operation rather than a deletion.

## What not to worry about yet

No mandatory orchestrator, specialist catalogue, automatic instruction loading, custom hooks, installers, or adoption automation is required. A future tool may need a local pointer, but that is an operator decision, not a repository requirement.

## Reference

- Issue: [SS-051 (#98)](https://github.com/Samska/samska-sandbox/issues/98)
- Canonical governance: [AI Engineering Governance](../AI-GOVERNANCE.md)
- Historical role layer: [docs/agents at `4ec11f8`](https://github.com/Samska/samska-sandbox/tree/4ec11f8f7397806b7920e99f707693babb989467/docs/agents)
- Preservation source: [SS-050 (#97)](https://github.com/Samska/samska-sandbox/issues/97) and its [cancellation record](https://github.com/Samska/samska-sandbox/issues/97#issuecomment-6431534509)
