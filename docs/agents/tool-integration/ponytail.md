# Ponytail Integration

Ponytail is a code-shape heuristic: understand the problem, then write the smallest change that fully solves it. This record covers its official OpenCode installation and provenance.

## Installed version and scope

| Field | Value |
| --- | --- |
| Upstream | <https://github.com/DietrichGebert/ponytail> |
| Package | `@dietrichgebert/ponytail` 5.3.2 |
| Revision | `16352ac229eb08a9598dcae48fe9f2b342567d86` (tag `v5.3.2`) |
| License | MIT (text at `.opencode/licenses/ponytail-LICENSE`) |
| Scope | Project-local OpenCode plugin, official package unmodified |
| Installed | 2026-10-23 |
| Restored to official content | 2026-10-23 |

OpenCode `2.0.30` reads plugins from the project-level `plugins` array. The entry is pinned in [`.opencode/opencode.json`](../../../.opencode/opencode.json):

```json
{
  "plugins": ["@dietrichgebert/ponytail@5.3.2"]
}
```

The official npm package was compared with a fresh `npm pack @dietrichgebert/ponytail@5.3.2` tarball and the OpenCode cache copy is identical. No instruction, skill, command, or hook was edited. No model, provider, effort, or permission setting is changed by the plugin.

## What it loads

- The ruleset is appended to the system prompt on every model call and on compaction, at the active level. The default is `full`.
- Six skills are registered: `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, and `ponytail-help`.
- Six commands are registered: `/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, and `/ponytail-help`.
- The selected level is stored in `~/.config/opencode/.ponytail-active`. That file is per-user, not repository content.

## Interaction with repository rules

Ponytail is installed as published and applies its ruleset as published. It shapes code; it does not authorize commits, pushes, pull requests, merges, deployments, credentials, or provider changes. Repository authorization and verification rules still decide what an agent may do. The active Issue or owner instruction remains the scope authority.

## Verification (2026-10-23)

| Claim | Evidence |
| --- | --- |
| Configuration present | `.opencode/opencode.json` contains the pinned plugin spec; OpenCode is `2.0.30`. |
| Integration loaded | `opencode plugin list` reports `ponytail 5.3.2` from `@dietrichgebert/ponytail@5.3.2`; the running service registered the six Ponytail skills. |
| Content available | The `skill` tool loaded `ponytail` and returned the ladder, level table, and skipped/risk footer from package 5.3.2. |
| Intended behavior demonstrated | A fresh `opencode run` session in `.opencode/tools/ponytail-probe/` created a 5-line `sum.js` and one `node:test` case, ran `node --test` (1 passed), and ended with a skipped/risk line. The probe is ignored by Git; its output and session export are retained in the evidence directory. |

The Ponytail package was not changed by the restoration, so the bounded behavior observation remains valid. Limitations: one sample does not establish universal compliance. The plugin appends to the system prompt; the assembled prompt order is not directly inspectable. A running session may need a reload or a new session to pick up a changed plugin. The level file is per-user, not per-project.

Human Verification: owner-reported approved on 2026-10-23 for the basic installation and the supplied plugin-list output. Individual Ponytail modes and workflows were not observed.

## Commands

| Command | Effect |
| --- | --- |
| `/ponytail` | Report the level, or switch it on at the default. |
| `/ponytail lite` | Build what was asked, name the smaller option. |
| `/ponytail full` | The published default ruleset. |
| `/ponytail ultra` | Also question whether the request is needed. |
| `/ponytail off` | Stop injecting the ruleset. |
| `/ponytail-review` | Review a change. |
| `/ponytail-audit` | Audit the whole repository. |
| `/ponytail-debt` | List `shortcut:` comments. |

## Rollback

Remove the `plugins` entry from `.opencode/opencode.json`, then reload OpenCode or start a new session. Optionally delete `~/.config/opencode/.ponytail-active`. The npm package remains in the OpenCode cache until normal cache cleanup; it is not an application dependency.
