# Claude Code Instructions

@AGENTS.md

This file only points Claude Code to the shared instructions above. Do not add rules here that belong in [AGENTS.md](AGENTS.md) or [AI Engineering Governance](docs/AI-GOVERNANCE.md).

Claude-specific notes:

- Work is an `SS-NNN` Issue and pull request. Build, pull request creation, and merge each need the owner's explicit authorization, as defined in the governance document.
- Repository documentation outranks conversation history and any session memory.
- Do not create `.claude/` settings, hooks, skills, or other agent tooling without a separately justified request.
