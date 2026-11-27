# SS-058 — Adopting Claude as the agent harness

- Status: Active
- Work date: 2026-11-27
- Last reviewed: 2026-11-27
- Work item: [SS-058](https://github.com/Samska/samska-sandbox/issues/111)
- Pull request: None yet
- ADRs: None
- Canonical documentation: [AGENTS.md](../../AGENTS.md), [AI Engineering Governance](../AI-GOVERNANCE.md)

## What you should learn

- Why one tool-independent instruction file plus thin per-tool pointers avoids drift between harnesses.
- How to tell active rules from harness-specific history when the tool changes.
- Why abandoned tool-specific work is retired by a recorded decision instead of being merged.

### Core — Know this for interviews

- Keep rules in one canonical file and make tool entry points import it.
- Mark superseded tool material as history rather than erasing it.

## Concepts explained

### Thin pointer file

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. `CLAUDE.md` imports `AGENTS.md` with `@AGENTS.md`, so the rules exist once and the pointer cannot contradict them.

### Active rules versus history

The audit found OpenCode, ChatGPT, and Maestri only in historical records, such as the superseded Agent Runtime section and earlier Learning Records, plus one phrase in `docs/GITHUB.md`. Governance itself was already tool-independent.

## How Samska uses it

- [CLAUDE.md](../../CLAUDE.md) imports [AGENTS.md](../../AGENTS.md).
- The SS-048 branch, which vendored OpenCode-format skills and later removed them, was not merged; the owner authorized deleting it.

## Interview perspective

A strong answer explains single-source instructions, why a pointer file beats a copy, and why history is kept with a dated supersession note.

## What not to worry about yet

Permission settings, hooks, and skills under `.claude/` are out of scope and need a separately justified request.

## Reference

- Issue: [SS-058 (#111)](https://github.com/Samska/samska-sandbox/issues/111)
- Pull request: None yet
- Relevant source files: `AGENTS.md`, `CLAUDE.md`, `PROJECT_HANDOFF.md`, `docs/GITHUB.md`
- ADRs: None
- Canonical documentation: [AI Engineering Governance](../AI-GOVERNANCE.md)
