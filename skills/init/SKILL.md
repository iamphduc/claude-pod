---
name: init
description: Use when the user types /pod:init or asks to set up pod in a project. Creates the project-owned docs (codebase brief, decisions, handoff queue, plans/sprints folders) without overwriting anything.
---

Set up the project-owned pod files in the current repo, then stop. Never overwrite or delete an existing file.

Run from the repo root (`git rev-parse --show-toplevel`):

```bash
cp -rn "${CLAUDE_PLUGIN_ROOT}/skills/init/scaffold/docs/." docs/
```

`-n` skips files that already exist. Then report which files were created and which were already there.

**Draft the brief.** If `docs/codebase-structure.md` still has `<!-- … -->` placeholders, dispatch the `pod:scout` subagent via the Agent tool to map the project (prompt: the repo root path). It drafts the brief and records gotchas under `docs/known-issues/`. Relay its summary: what it wrote, its coverage, the known issues it found, whether the smoke recipe was verified, and what's left for the human.

Finish by telling the human to:

- review `docs/codebase-structure.md` and any new `docs/known-issues/` files — the scout's draft is a starting point; its **`## Smoke recipe`** section is required (engineers use it to bring the app up and browser-verify each slice). Fill anything the scout left open.
- add to `docs/decisions.md` — architectural decisions, as they're made.

Then `/pod:plan` to start.

If the repo still has copies from the old `install.sh` (`.claude/agents/waves-*.md`, or `.claude/skills/{autopilot,code,fix,plan,sprint,wave-prompts}/`, `docs/engineer-protocol.md`, `docs/autonomous-policy.md`, `docs/templates/`), list them and suggest the human delete them — they now ship in the plugin, and stale local copies take priority over it. Don't delete them yourself.
