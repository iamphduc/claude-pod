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

Finish by telling the human to fill in:

- `docs/codebase-structure.md` — the codebase brief; its **`## Smoke recipe`** section is required (engineers use it to bring the app up and browser-verify each slice).
- `docs/decisions.md` — architectural decisions, as they're made.

Then `/pod:plan` to start.

If the repo still has copies from the old `install.sh` (`.claude/agents/waves-*.md`, or `.claude/skills/{autopilot,code,fix,plan,sprint,wave-prompts}/`, `docs/engineer-protocol.md`, `docs/autonomous-policy.md`, `docs/templates/`), list them and suggest the human delete them — they now ship in the plugin, and stale local copies take priority over it. Don't delete them yourself.
