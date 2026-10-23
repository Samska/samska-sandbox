# Local Agent Tooling: Upstream Fidelity and Project Boundaries

- Status: Active
- Work date: 2026-10-23
- Last reviewed: 2026-10-23
- Work item: [SS-048 / Issue #92](https://github.com/Samska/samska-sandbox/issues/92). The Issue was created after the implementation to track the already-completed work; it does not imply earlier authorization or tracking.
- Pull request: Opened from `chore/agent-tooling-official-restore`; see [Issue #92](https://github.com/Samska/samska-sandbox/issues/92) for the link.
- ADRs: None
- Canonical documentation: [Tool integration records](../agents/tool-integration/README.md), [Restoration record](../agents/tool-integration/restoration-2026-10-23.md)

## What you should learn

### Core — Know this for interviews

- “Installed as published” and “locally adapted” are different operating modes; choose one deliberately.
- Upstream fidelity is verifiable by comparing installed files with a fresh install of the pinned release.
- Project configuration can constrain *authorization* without editing upstream *content*.
- Unsupported or unexercised paths must be reported, not silently patched.

## Concepts explained

**Upstream fidelity.** A tool installation is faithful when the active instructions, references, scripts, and hooks are the author's published bytes. A local patch improves one environment but creates a second distribution that future upgrades must reconcile. Fidelity is a property you can test: install the same release in a clean fixture and compare.

**Configuration versus modification.** A project can pin a version, choose a profile, exclude generated output from Git, or keep a narrow lint exclusion without changing upstream behavior. Those are configuration and repository policy. Editing the skill text, removing a reference, or rewriting a query command is a modification.

**Evidence levels.** Configuration present means the file exists. Loaded means the runtime registered it. Available means an agent can read or call it. Demonstrated means a bounded observation produced the expected result. A successful install proves only the first, and one sample does not prove universal compliance.

**Explicit decisions still bind.** A tool can offer a provider, a cloud service, a commit workflow, or a cross-model review. Owner decisions can forbid those paths without requiring the tool to be patched. The correct response is to leave upstream content intact, report the dependency or conflict, and not execute the unauthorized path.

**Restoration is a change with provenance.** Removing a local patch is not “undo”; it is a new decision. Keep a recoverable copy of the pre-change tree, record exactly which files and behaviors were superseded, and verify the restored bytes against the selected release.

## How Samska uses it

- [Restoration record](../agents/tool-integration/restoration-2026-10-23.md) lists the removed patches, the recoverable backup, and the restored releases.
- Ponytail 5.3.2 is an unmodified project plugin; the cached package matches the official npm tarball.
- Graphify 0.9.94 uses the author's user-level CLI install and the official OpenCode installer. The skill, references, and installer-generated `AGENTS.md` block are content-identical; the plugin and version stamp have formatting-only normalizations recorded in the tool record.
- Agent Skills 0.6.13 includes all 25 skills and all seven references, including the previously omitted `orchestration-patterns.md`.
- Unauthorized paths are reported: Graphify semantic extraction, Chrome DevTools MCP, cross-model review, commits, pushes, and deployments are not exercised.

## Interview perspective

A strong answer distinguishes *vendor fidelity* from *local compatibility*. It can explain why a local patch is attractive in the short term and costly across upgrades, how to verify that an installation matches a release, and why a tool's default behavior is not permission. It should also recognize that an owner can forbid a capability without demanding a fork: report the requirement, leave the upstream bytes intact, and stop only that path.

## What not to worry about yet

- Automatic enforcement of the model/provider decision for every skill.
- Semantic graph enrichment, Graphify Cloud, MCP, or browser DevTools MCP.
- Whether every one of the 25 skills is suitable for this repository.
- Whether a running session picks up a changed plugin without a reload; the observed behavior and limitation are recorded per tool.

## Reference

- Issue: [SS-048 / Issue #92](https://github.com/Samska/samska-sandbox/issues/92)
- Pull request: Opened from `chore/agent-tooling-official-restore`; see Issue #92 for the link.
- Relevant source files: [`.opencode/opencode.json`](../../.opencode/opencode.json), [`.opencode/plugins/graphify.js`](../../.opencode/plugins/graphify.js), [`.graphifyignore`](../../.graphifyignore), [`.markdownlint-cli2.yaml`](../../.markdownlint-cli2.yaml)
- ADRs: None
- Canonical documentation: [Tool integration records](../agents/tool-integration/README.md), [Restoration record](../agents/tool-integration/restoration-2026-10-23.md)
