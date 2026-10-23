# Tool Integration Records

This directory records how external agent tools are installed and wired into Samska Sandbox. It is wiring and provenance only: it never changes a role's responsibilities or grants authority.

| Tool | Record | Installation shape |
| --- | --- | --- |
| Maestri | [maestri.md](maestri.md) | Instruction delivery, role presets, and teammate lifecycle |
| Ponytail | [ponytail.md](ponytail.md) | Official npm plugin, activated by project configuration |
| Graphify | [graphify.md](graphify.md) | Official CLI and official OpenCode skill/plugin |
| Agent Skills | [agent-skills.md](agent-skills.md) | Official skills and references copied from the pinned release |
| Restoration | [restoration-2026-10-23.md](restoration-2026-10-23.md) | Superseded local adaptations and the official-content restoration |

## Precedence and authority

The integrations are installed as published by their authors. They do not add an instruction layer, grant authority, or authorize an action. Repository governance still decides what an agent may do, and the active Issue or owner instruction still defines task scope. A tool workflow never authorizes a commit, push, pull request, merge, deployment, credential, or provider change.

## Verification vocabulary

Installation success is not adoption. Each record keeps these claims separate:

- **Configuration present:** the tracked configuration or installation files exist as recorded.
- **Integration loaded:** the runtime reports the plugin or skill as active.
- **Content or tools available:** an agent can read the instructions or call the tool.
- **Intended behavior demonstrated:** a bounded, observed example produced the expected result.

## Dependency separation

Agent tooling is development tooling, not an application dependency. Nothing here is added to `backend/pom.xml`, `web/package.json`, `compose.yaml`, or a CI workflow.

Ponytail and the Agent Skills pack are project-local. Graphify uses the author's documented user-level CLI installation (`pip install graphifyy==0.9.94`), which puts `graphify` on `PATH`; that is a local developer-tool change, not an application dependency. Generated graph state is ignored by Git and excluded from indexing.

## Lint and provenance

Vendored third-party Markdown under `.opencode/skills/` and `.opencode/references/` is excluded from the repository prose lint by `.markdownlint-cli2.yaml`; repository-authored documentation remains linted. The installed upstream content is unedited; the Graphify plugin and version stamp have formatting-only normalizations recorded in [graphify.md](graphify.md). Each record records the exact release or revision. Upstream license texts and the Graphify NOTICE are under `.opencode/licenses/`.

## Human Verification

Human Verification is owner-reported approved on 2026-10-23 for the basic installation, bounded to the observations in [the restoration record](restoration-2026-10-23.md#human-verification). It does not cover the full Graphify pipeline, semantic extraction, all Agent Skills, or all Ponytail modes. The Agent Verification in each record is not Human Verification.
