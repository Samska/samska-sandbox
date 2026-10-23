# Graphify Integration

Graphify builds a local knowledge graph from code and answers scoped questions against it. This record covers the official CLI installation, the official OpenCode integration, and the provenance check against the selected release.

## Installed version and scope

| Field | Value |
| --- | --- |
| Upstream | <https://github.com/Graphify-Labs/graphify> |
| Package | `graphifyy` 0.9.94 (double `y` is the official PyPI name) |
| Revision | `c588b72d936927790a87ad009955078ed40562a3` (tag `v0.9.94`) |
| License | Apache-2.0 and MIT (texts at `.opencode/licenses/graphify-LICENSE` and `.opencode/licenses/graphify-LICENSE-MIT`; attribution at `.opencode/licenses/graphify-NOTICE`) |
| Scope | User-level official CLI, project-local official OpenCode skill/plugin |
| Installed | 2026-10-23 |
| Restored to official content | 2026-10-23 |

The CLI is installed with the author's documented `pip` method:

```bash
python -m pip install --disable-pip-version-check "graphifyy==0.9.94"
```

This puts `graphify` on the existing user `PATH` (`C:\Users\Samuel\AppData\Local\Programs\Python\Python313\Scripts\graphify.exe`). `pip check` reports no broken requirements. It is a local developer-tool installation, not an application dependency: `backend/pom.xml`, `web/package.json`, `compose.yaml`, and CI workflows are unchanged. The earlier project-local venv was removed to avoid a second, unofficial installation.

A user-level `python3.exe` hardlink next to `python.exe` makes the official generic skill's `python3` command resolve to Python 3.13 instead of the Microsoft Store alias. The Python directory already precedes `WindowsApps` on the user and process `PATH`; no `PATH` entry was changed. The previous `PATH` and resolution are recorded in the external evidence `verification/python-path-before.txt` and `verification/python-resolution-before.txt`.

## Official OpenCode integration

```bash
graphify install --platform opencode --project
```

The official installer wrote:

- `.opencode/skills/graphify/SKILL.md` and its eight `references/` files;
- `.opencode/plugins/graphify.js`, the hook that prepends one reminder to the first shell command of a session when `graphify-out/graph.json` exists;
- the official `## graphify` section in `AGENTS.md`.

No instruction content, skill, reference, script, hook, or default behavior was changed. The installed skill and references are byte-identical to a fresh install produced by the same official release in a fixture. The plugin is identical except for LF normalization for the repository EditorConfig; the version stamp differs only by a final newline; and the official `AGENTS.md` block has one formatting blank line after its `Rules:` label. The wording is unchanged. The `AGENTS.md` section is the installer's official block; the repository's pre-existing content is preserved above it.

Installer-specific artifacts: the official installer writes `.opencode/plugins/graphify.js` with CRLF line endings on Windows. The installed file was normalized to LF for the repository EditorConfig; its content and behavior are unchanged. The installer writes `.opencode/skills/graphify/.graphify_version` without a final newline; one was added for EditorConfig, with the same version string. The installer also wrote `.opencode/skills/graphify/SKILL.md.bak` because the previous copy differed. That backup is not active content; it was copied to the evidence directory and removed. Hashes for the installed files are in the external evidence `inventory/installed-content-sha256.txt`; the official fixture hashes are in `inventory/official-fixture-sha256.txt`, and the exact differences are in `inventory/graphify-post-restore-diff.txt`.

## Windows Python command correction

The official generic skill uses `python3`. On this host the Python 3.13 directory precedes `WindowsApps` on `PATH`, but it had no `python3.exe`, so `python3` resolved to the Microsoft Store alias. The correction is a user-level hardlink:

```text
C:\Users\Samuel\AppData\Local\Programs\Python\Python313\python3.exe
  -> C:\Users\Samuel\AppData\Local\Programs\Python\Python313\python.exe
```

No `PATH` entry was changed. The previous `PATH` and resolution are recorded in `verification/python-path-before.txt` and `verification/python-resolution-before.txt`. The official Step 1 block then ran once in a throwaway directory, exited 0, and wrote `.graphify_python` and `.graphify_root`. The hardlink tracks the current `python.exe`; re-create it if a future Python replacement leaves `python3 --version` stale.

## Graph generation

Only local deterministic code analysis was used:

```bash
graphify extract . --code-only --out .
GRAPHIFY_BACKEND=none graphify cluster-only . --no-viz --no-label --backend=none
```

- `--code-only` parses code with tree-sitter and skips docs, PDFs, images, and video. It needs no API key.
- `GRAPHIFY_BACKEND=none` and `--no-label` disable every LLM backend, including community naming.
- `--no-viz` omits the HTML visualization; no `graph.html` was generated.
- Result: 1,270 nodes and 58 communities, built from commit `2cf05d2e`. Extraction was 94% `EXTRACTED`, 6% `INFERRED`, 0% `AMBIGUOUS`. Token cost: 0 input, 0 output. `graph.json` records `schema_version` 1, `graphify_version` 0.9.94, and `built_at_commit` `2cf05d2e3cb3c14710445fa8f9571cb6dd702c1b`.

`graphify-out/.graphify_python` points at the official user Python interpreter. This is Graphify's generated interpreter marker, not a patch.

## Project configuration

- `.graphifyignore` excludes local agent state (`.maestri/`, `.opencode/tools/`), generated output (`graphify-out/`), dependencies and build output, a `rebuild/` directory if one ever appears inside this tree, and secret-bearing files. Git-ignored paths are also honored.
- `graphify-out/` is ignored by Git. This is a repository VCS decision, not a change to Graphify. The official `AGENTS.md` block mentions a committed graph conditionally; no commit is authorized, so the generated graph stays untracked. The preserved `rebuild/maestri` worktree is the sibling directory `../samska-sandbox-rebuild`, outside this scan root, so it is not indexed.
- The graph was checked for `.maestri`, `.opencode/tools`, `samska-sandbox-rebuild`, `node_modules`, and `.env`: zero matches.

## Verification (2026-10-23)

| Claim | Evidence |
| --- | --- |
| Configuration present | `graphify` resolves from the user Python and returns `0.9.94`; official skill, eight references, and plugin exist in `.opencode/`. |
| Integration loaded | `opencode plugin list` reports `graphify-… local`; the `graphify` skill is registered with the official description; the hook fired in a fresh session. |
| Content/tools available | `graphify --version` → `graphify 0.9.94`; `python -m graphify --version` → same; skill and references readable. |
| Intended behavior demonstrated | Query returned `Cart.snapshot()` at `Cart.java` L49 and `snapshotForRevision()` at L53; the source matches. A disambiguated path query returned a 3-hop `EXTRACTED` path. |
| Windows bootstrap | The official Step 1 block ran once in a throwaway directory after the `python3` correction; it exited 0 and wrote `.graphify_python` and `.graphify_root`. Evidence: `verification/step1-after.sh`, `step1-after.out`, and `verification/python3-alias.txt`. |

Query:

```bash
graphify query "how is the Cart snapshot computed for payment?"
```

Returned `Cart`, `CartSnapshotProvider`, `Cart.snapshot()` at `Cart.java` L49, and `Cart.snapshotForRevision()` at L53, among 157 nodes (truncated at the default budget). The source at those lines matches: `snapshot()` builds a `CartSnapshot` from copied items, `total()`, and `revision`; `snapshotForRevision()` rejects a stale revision and then calls `snapshot()`.

Path:

```bash
graphify path \
  "backend/src/main/java/io/github/samska/sandbox/cart/Cart.java::Cart" \
  "backend/src/main/java/io/github/samska/sandbox/payment/PaymentAttempt.java::PaymentAttempt" \
  --undirected
```

Returned a 3-hop path through `InMemoryPaymentStoreTest.java -> PaymentAttemptResult -> PaymentAttempt`, with `EXTRACTED` tags. Ambiguous names are refused with candidates rather than guessed.

## Required services, providers, and limits

- The code-only path used here requires no service, provider, account, credential, or cloud upload.
- Graphify's published skill also supports semantic extraction of docs, PDFs, images, and video. That path can use Gemini if `GEMINI_API_KEY`/`GOOGLE_API_KEY` is already set, otherwise the host agent's model. It was **not exercised**, no key is configured, and no provider or cloud upload is authorized.
- The official `AGENTS.md` block and skill are installed as published. No local wrapper or patched distribution exists.
- The full `/graphify` skill pipeline beyond Step 1 was not exercised. Step 1 now passes on this Windows/Git Bash host: the throwaway bootstrap exited 0 and wrote both markers after the user-level `python3.exe` alias was created. Semantic extraction of docs, PDFs, images, or video was not exercised.
- The `python3.exe` hardlink tracks the current `python.exe`. A future Python replacement may leave the hardlink stale; re-create it if `python3 --version` no longer reports the installed Python. The Microsoft Store alias remains later on `PATH` and returns only if the hardlink is removed.
- Nine code files produced no symbols (for example `pom.xml`, Playwright config, and some test files), so their behavior is absent. Query matching is keyword/IDF-based, not semantic. The graph is a snapshot and becomes stale after code changes; `graphify update .` rebuilds it. The hook checks the session's location directory, so a session opened in a subdirectory may not see the repository-root graph.

Human Verification: owner-reported approved on 2026-10-23 for the observed query and source-line check. The full Graphify pipeline, semantic extraction, and media ingestion were not observed.

## Update and rollback

Update with the author's documented method, re-run the official installer, and repeat the provenance comparison. Do not add a local patch; if official behavior requires an unauthorized provider or credential, stop that path and report it.

To roll back, use the official uninstaller (`graphify uninstall`) or remove the skill, plugin, and `graphify-out/`, then uninstall `graphifyy`. No application code or data is affected.
