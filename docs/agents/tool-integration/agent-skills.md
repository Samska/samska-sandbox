# Agent Skills Integration

The Agent Skills pack is a set of on-demand engineering method skills. This record covers the official OpenCode installation, the pinned release, and the skills whose execution needs an owner decision or an unavailable dependency.

## Installed pack and scope

| Field | Value |
| --- | --- |
| Upstream | <https://github.com/addyosmani/agent-skills> |
| Pack version | 0.6.13 |
| Revision | `aeac41d4d005999432bb7312f7ff06383a91d59d` |
| License | MIT (text at `.opencode/licenses/agent-skills-LICENSE`) |
| Scope | Project-local OpenCode skills and shared references, upstream content unmodified |
| Installed | 2026-10-23 |
| Restored to official content | 2026-10-23 |

The official OpenCode path is a project directory that OpenCode scans for `SKILL.md` files. The pack was installed from the pinned revision, not from a fork or a replacement plugin:

- the pack's 25 skill directories under `.opencode/skills/` (the directory also contains the separate Graphify skill);
- all seven shared references under `.opencode/references/`, because skills reference them as `../../references/<file>.md`, which resolves from `.opencode/skills/<name>/` to `.opencode/references/`;
- each skill's own `references/`, `examples.md`, `frameworks.md`, `refinement-criteria.md`, or `scripts/` sidecar where the pack has one.

The upstream root `AGENTS.md` and `CLAUDE.md` were **not** copied. They configure development of the upstream repository, not this project. The four `agents/` personas were **not** copied: Samska already has functional roles under [docs/agents/roles/](../roles/).

The installed skills and references are byte-identical to the pinned upstream release. The previously omitted `references/orchestration-patterns.md` is restored, and the previously rewritten `doubt-driven-development` and `idea-refine` skill files are restored to upstream content.

## Activation model

Skills are discoverable by name and description. They are loaded only when an agent calls the `skill` tool, or when the user invokes them. Installation does not auto-run every workflow, and no skill is wired into `AGENTS.md` as an always-on instruction.

The repository's [instruction layers](../shared-instructions.md#instruction-layers) are unchanged. The pack is method guidance; the active Issue and owner authorization still decide scope.

## Known dependencies and explicit-decision boundaries

The upstream pack is installed as published. The following skills are not auto-activated and need a decision or a dependency before use.

| Skill | Dependency or conflict | Handling |
| --- | --- | --- |
| `browser-testing-with-devtools` | Requires the Chrome DevTools MCP server, which is not configured. Its setup text may run `npx chrome-devtools-mcp`. | Not available. Installing the MCP server or a browser dependency needs a separate owner decision. Existing Playwright tests remain the browser evidence path. |
| `doubt-driven-development` | Upstream offers cross-model escalation to a different CLI/model. | Do not switch away from OpenCode Go / DeepSeek V4.1 Flash / `max`. A cross-model review would need explicit owner approval. |
| `code-review-and-quality` | Its "Multi-Model Review Pattern" suggests different models for author and reviewer. | Keep the independent reviewer on the same Go model. Independence comes from not authoring the change, not from switching providers. |
| `git-workflow-and-versioning` | Prescribes trunk-based work, atomic commits, and commit-as-save-point. | Repository branch lifecycle and owner authorization win. Do not commit, push, open a PR, or merge without the recorded authorization. |
| `incremental-implementation` | Suggests committing each thin slice. | Use the slicing method, but do not commit before the repository's verification gates. |
| `ci-cd-and-automation` | May propose workflow, deployment, or secret changes. | CI changes need a separate authorized task. Do not add workflows, actions, or secrets from a skill run. |
| `shipping-and-launch` | Assumes a deployable production environment and rollout/rollback controls. | No deployment target is authorized. Treat as a checklist only. |
| `constraint-driven-development` | Writes `CONSTRAINTS.md` and establishes a new quality gate. | Do not run without an owner decision. It would duplicate [AI Engineering Governance](../../AI-GOVERNANCE.md) and [Testing Strategy](../../TESTING.md). |
| `spec-driven-development`, `interview-me`, `planning-and-task-breakdown` | Can create a parallel spec/plan and ask requirement questions. | Use only as method inside the active Issue. The Issue remains the scope record; do not create competing canonical artifacts. |
| `idea-refine` | Can write a one-pager under `docs/ideas/`. | Only with owner confirmation. Installation does not authorize a repository write. |
| `documentation-and-adrs` | Generic ADR and documentation guidance. | Repository [ADR guidance](../../adr/README.md) and documentation rules win. |
| `test-driven-development` | Mandates red-green-refactor for logic. | Repository risk-based [Testing Strategy](../../TESTING.md) decides the level. Use the loop where it fits; do not treat it as a universal gate. |
| `deprecation-and-migration` | Includes database migration patterns. | PostgreSQL persistence work is paused. Do not apply migration steps. |
| `context-engineering` | May edit rules files and add context sources. | Do not duplicate or replace repository governance. |
| `security-and-hardening`, `performance-optimization`, `observability-and-instrumentation`, `frontend-ui-engineering`, `api-and-interface-design` | Generic guidance that may suggest dependencies, endpoints, or instrumentation. | Repository architecture, security, testing, and dependency rules win. A suggested dependency is not authorized by the skill. |
| `source-driven-development` | Fetches official documentation over the network. | Acceptable for research; do not add a runtime dependency or credential because a source was fetched. |

`references/orchestration-patterns.md` is included as published. It is upstream reference material, not project policy; the repository roles under [docs/agents/](../README.md) remain canonical. Where a checklist or reference and a canonical repository document disagree, the repository document wins.

## Verification (2026-10-23)

| Claim | Evidence |
| --- | --- |
| Configuration present | The pack's 25 skill directories and all seven shared references exist under `.opencode/`; the skills directory also contains the separate Graphify skill. No upstream root instructions or personas were copied. |
| Integration loaded | The OpenCode service registered the pack's 25 skill IDs, including `code-review-and-quality`, `test-driven-development`, and `frontend-ui-engineering`. |
| Content available | The `skill` tool loaded `doubt-driven-development`; its restored upstream orchestration reference is present at `.opencode/references/orchestration-patterns.md`. `code-review-and-quality` loads with its five-axis workflow and reference links. |
| Intended behavior demonstrated | A separate reviewer session loaded `code-review-and-quality` and applied its five axes to the restoration change; the review result is recorded in the task handoff. |

Limitations: skill discovery and representative loading do not prove that every skill is correct or suitable for this repository. Skill invocation depends on model compliance. The Agent Skills pack is installed unmodified; upstream changes must be re-reviewed before an update. The restored `orchestration-patterns.md` is reference material, not an active role model.

Human Verification: owner-reported approved on 2026-10-23 for the successful `code-review-and-quality` loading output. The other 24 skills were not individually observed.

## Update and rollback

To update, download the intended upstream revision, re-read the changed skills and any new hooks or commands, copy all skill directories and all shared references, and repeat discovery and loading checks. Do not copy the upstream root `AGENTS.md` or `CLAUDE.md`, and do not add personas over the existing roles.

To roll back, remove the installed skill directories and `.opencode/references/`; no application code or data is affected.
