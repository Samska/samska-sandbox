# Restoration of Official Agent Tooling (2026-10-23)

The owner superseded the previous compatibility adaptations and authorized restoring Ponytail, Graphify, and Agent Skills as published. This record lists what was removed, what was restored, and which project text is superseded. It is tracked by [Issue #92 (SS-048)](https://github.com/Samska/samska-sandbox/issues/92); the pull request is opened from `chore/agent-tooling-official-restore`.

## Recoverable pre-change state

The pre-change working tree and evidence copies were stored outside the repository before any restoration edit:

- `C:\Users\Samuel\Desktop\samska-sandbox-evidence\2026-10-23-agent-tooling\pre-restore\`
  - `tracked-working-tree.patch` — binary patch of the tracked changes.
  - `untracked-files.tar.gz` — all non-ignored untracked files at the time.
  - `untracked-files.txt`, `status-before.txt`, `branch-before.txt`, `head-before.txt`.
  - `global-python-packages-before.txt` — global Python package state before the official Graphify install.
  - `verification/python-path-before.txt` and `python-resolution-before.txt` — process, user, and machine `PATH` plus the pre-correction `python3` resolution.
  - `verification/python3-alias.txt`, `step1-after.sh`, and `step1-after.out` — the user-level `python3` correction and the successful bootstrap evidence.
  - Copies of the previously modified `AGENTS.md`, `.gitignore`, `docs/agents/README.md`, and `docs/learning/README.md`.
- `C:\Users\Samuel\Desktop\samska-sandbox-evidence\2026-10-23-agent-tooling\evidence\` — the previous reviewer and probe session exports, verified against the originals in temporary storage. The originals were retained. The post-restore Graphify hook probe (`ses_e975…`) was exported directly to this directory, so it has no temporary original; its checksum is recorded in `evidence-sha256.txt`. The Graphify Step 1 bootstrap probe is a separate evidence set under `evidence/graphify-step1/` (`step1.sh`, `step1.out`, `sha256.txt`), copied from the throwaway test directory.
- `C:\Users\Samuel\Desktop\samska-sandbox-evidence\2026-10-23-agent-tooling\inventory\` — the before/after diffs against official content.

The restoration work is on local branch `chore/agent-tooling-official-restore`; no commit or push was made.

## Local modifications removed

No standalone wrapper script existed. The previous custom behavior was embedded in the patched Graphify skill and plugin, the project venv, the omitted Agent Skills reference, and the project compatibility text below.

| File | Previous local modification | Disposition |
| --- | --- | --- |
| `.opencode/skills/graphify/SKILL.md` | Code-only frontmatter description, `Samska local constraint`, usage scope note, project-venv Step 1 and interpreter guard, semantic-extraction stop text, and local-interpreter query commands | Overwritten by the official `graphify install --platform opencode --project`; verified identical to a fresh official install |
| `.opencode/skills/graphify/references/query.md` | Local-interpreter query/path/explain/reflect commands | Overwritten by the official installer |
| `.opencode/plugins/graphify.js` | Reminder changed to name the project venv executable | Overwritten by the official installer |
| `.opencode/skills/graphify/SKILL.md.bak` | Installer backup of the locally modified skill | Copied to `inventory/graphify-SKILL.md.patched.before-restore`, removed from the repository |
| `.opencode/tools/graphify-venv/` | Project-local Python virtual environment used by the local patch | Removed; the official user-level `pip install graphifyy==0.9.94` is used instead |
| `.opencode/references/orchestration-patterns.md` | Previously omitted to avoid a competing orchestration model | Restored from the pinned Agent Skills release |
| `.opencode/skills/doubt-driven-development/SKILL.md` | Two references rewritten to point at repository roles | Restored to upstream content |
| `.opencode/skills/idea-refine/SKILL.md` | Installed script path and owner-confirmation note added | Restored to upstream content |
| `AGENTS.md` | Custom `## Local Agent Tooling` section and a replacement graphify block | Custom section removed; official `## graphify` block installed |
| `docs/agents/tool-integration/*.md` | Compatibility precedence tables, patch lists, and “local patch” provenance claims | Rewritten to describe the official installation and its dependencies |
| `.markdownlintignore` | Legacy ignore file; unsupported by markdownlint-cli2 and ineffective in CI | Replaced with `.markdownlint-cli2.yaml`; vendored Markdown remains excluded from prose lint |
| `docs/learning/local-agent-tooling-integration.md` | Taught the local-patch approach as the current design | Updated to record the restoration and the superseded approach |
| `docs/learning/README.md` | Index description of the local-patch record | Updated to describe official restoration |

## Project text superseded

The earlier project text that described the three tools as “advisory” compatibility layers, listed local patches, or claimed byte-identical content with exceptions is superseded. The owner’s decision is that the tools are used as published and documented by their authors, without local modifications to instructions, workflows, scripts, references, or default behavior.

The following project statements remain:

- Owner and Issue authority, verification distinctions, and approval gates remain in [AI Engineering Governance](../../AI-GOVERNANCE.md) and the [agent instructions](../README.md). The owner did not replace those documents.
- The no-commit, no-push, no-GitHub-record, no-new-provider, and Go-only execution decisions remain in force for this task.
- The project keeps version pins, upstream license texts, the project plugin entry, `.graphifyignore`, `.markdownlint-cli2.yaml`, and `graphify-out/` ignored as project configuration and VCS policy. These are not edits to upstream content.

## Official content restored

- **Ponytail:** npm `@dietrichgebert/ponytail` 5.3.2, commit `16352ac229eb08a9598dcae48fe9f2b342567d86`. The OpenCode cache copy is identical to a fresh npm tarball; no upstream file was edited.
- **Graphify:** `graphifyy` 0.9.94, commit `c588b72d936927790a87ad009955078ed40562a3`. The installed skill and eight references are identical to a fresh official project install. The plugin is identical except for LF normalization for the repository EditorConfig; `.graphify_version` differs only by a final newline; and the official `AGENTS.md` section has one formatting blank line after its `Rules:` label. The wording is unchanged. The upstream Apache-2.0 NOTICE is retained at `.opencode/licenses/graphify-NOTICE`.
- **Agent Skills:** pack 0.6.13, commit `aeac41d4d005999432bb7312f7ff06383a91d59d`. All 25 skills and all seven shared references are identical to the pinned tarball.

## Known official behavior not exercised

- Graphify semantic extraction of docs, PDFs, images, or video. It can use Gemini if a key is already set, otherwise the host model. No key, provider, account, or cloud upload is configured or authorized.
- The full `/graphify` Step 1 bash bootstrap initially failed in a throwaway directory because `python3` resolved to the Microsoft Store alias. A user-level `python3.exe` hardlink next to `python.exe` corrected the command; the same bootstrap then exited 0 and wrote `.graphify_python` and `.graphify_root`. The full pipeline beyond Step 1 and semantic extraction of docs/media were not exercised.
- Agent Skills `browser-testing-with-devtools`, which requires the Chrome DevTools MCP server.
- Agent Skills cross-model review patterns. Execution remains on OpenCode Go / DeepSeek V4.1 Flash / `max`.

These are reported as limitations, not patched. If an official workflow requires an action outside the owner’s decisions, that path is stopped and reported rather than modified.

## Verification

- `graphify --version` → `graphify 0.9.94`; `python -m pip check` → no broken requirements.
- Windows bootstrap: the official Step 1 block ran once in a throwaway directory after the `python3` correction and exited 0, writing `.graphify_python` and `.graphify_root`. Evidence: `verification/step1-after.sh`, `step1-after.out`, and `verification/python3-alias.txt`.
- Post-restoration comparison in `verification/provenance.txt` and `inventory/graphify-post-restore-diff.txt`: Graphify skill and references identical; plugin identical except LF normalization; version stamp identical except final newline; AGENTS block identical except the formatting blank line.
- Agent Skills post-restoration comparison in `inventory/agent-skills-post-restore-diff.txt`: all 25 skills and all 7 references identical.
- Ponytail post-restoration comparison in `inventory/ponytail-post-restore-diff.txt`: identical.
- Hashes: installed content in `inventory/installed-content-sha256.txt`; official fixtures (including the Graphify plugin) in `inventory/official-fixture-sha256.txt`, with root labels in the file.
- `opencode plugin list` shows `ponytail 5.3.2` and the local Graphify plugin.
- Graph query against the regenerated 1,270-node code-only graph returns `Cart.java` L49/L53, verified against source.
- Human Verification is owner-reported approved; see below.

## Human Verification

Owner-reported approval on 2026-10-23 for the basic installation, bounded to these observations:

- the owner observed the Graphify query result and its source-line check;
- the owner supplied the `opencode plugin list` output showing Ponytail 5.3.2 and the local Graphify plugin;
- the owner supplied the successful `code-review-and-quality` skill-loading output.

This is Human Verification, not Agent Verification. It does **not** cover the full Graphify pipeline beyond the query, Graphify Step 1 in a real agent session, semantic extraction, docs/PDF/image/video ingestion, graph hooks, all 25 Agent Skills, all Ponytail modes or workflows, application behavior, UI, accessibility, or the browser DevTools MCP path.

The approval accepts the recorded limitations: the code-only Graphify scope, the user-level `pip` install, the Windows `python3` hardlink correction and its future-upgrade caveat, and the unexercised provider/semantic paths.

## Local Environment Changes

- **What changed and why:** Graphify was installed with the author's documented user-level `pip` method, `python -m pip install --disable-pip-version-check "graphifyy==0.9.94"`, so the unmodified official skill can resolve `graphify` on `PATH`. This added `graphifyy` and its runtime dependencies (`networkx`, `numpy`, `rapidfuzz`, and the tree-sitter packages) to the user's Python 3.13 environment. The earlier project-local venv was removed to avoid a second, unofficial installation. A user-level `python3.exe` hardlink was created next to `python.exe` so the official generic skill's `python3` command resolves to Python 3.13 instead of the Microsoft Store alias. No `PATH` entry was changed; the previous process, user, and machine `PATH` values are recorded in `verification/python-path-before.txt`.
- **Required manual developer action:** none for the application. Open a new OpenCode session to pick up the restored plugin and skill; an already-open session may need a reload or restart.
- **Affected configuration or files:** user Python site-packages under `C:\Users\Samuel\AppData\Local\Programs\Python\Python313\`; `graphify.exe` in `C:\Users\Samuel\AppData\Local\Programs\Python\Python313\Scripts\`; `python3.exe` hardlink in `C:\Users\Samuel\AppData\Local\Programs\Python\Python313\`; `.opencode/skills/graphify/`, `.opencode/plugins/graphify.js`, `AGENTS.md`, `graphify-out/`. The pre-install package list is `pre-restore/global-python-packages-before.txt`.
- **Migration or update steps:** existing environments need the same `pip install` and `python3` command correction for the official skill to bootstrap. The full `/graphify` pipeline beyond Step 1 remains unexercised. For rollback, remove `python3.exe` (the Store alias then returns), run `python -m pip uninstall graphifyy`, and compare dependencies against `pre-restore/global-python-packages-before.txt`. Verify with `python -m pip check`.
- **Verification steps:** `graphify --version`, `python -m graphify --version`, `python -m pip check`, `opencode plugin list`, and a bounded `graphify query` against `graphify-out/graph.json`.
