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

**Offer CI if there's none.** If the brief's `## CI` section says `none`, tell the human pod's checks are otherwise all run by the agents themselves, and **ask** whether to add a minimal GitHub Actions workflow. Only on a yes, write `.github/workflows/pod-ci.yml`, triggered on `pull_request` and on `push` to the merge-target, with two jobs:

- **verify** — `actions/checkout@v4`, the runtime setup the brief's **Stack & conventions** calls for (e.g. `actions/setup-node@v4` with its package manager's cache), the install step, then the smoke recipe's `Verification:` command exactly.
- **secrets** — `actions/checkout@v4` with `fetch-depth: 0`, then `gitleaks/gitleaks-action@v2` with `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` in `env`. Tell the human it's free for personal repos; an organization repo needs a `GITLEAKS_LICENSE` secret.

Don't commit it — list it with the other new files, and update the brief's `## CI` section to describe it.

Finish by telling the human to:

- review `docs/codebase-structure.md` and any new `docs/known-issues/` files — the scout's draft is a starting point; its **`## Smoke recipe`** section is required (engineers use it to bring the app up and browser-verify each slice). Fill anything the scout left open.
- add to `docs/decisions.md` — architectural decisions, as they're made.
- commit the new files (and push the CI workflow, if added — it only runs once it's on GitHub).

Then `/pod:plan` to start.

If the repo still has copies from the old `install.sh` (`.claude/agents/waves-*.md`, or `.claude/skills/{autopilot,code,fix,plan,sprint,wave-prompts}/`, `docs/engineer-protocol.md`, `docs/autonomous-policy.md`, `docs/templates/`), list them and suggest the human delete them — they now ship in the plugin, and stale local copies take priority over it. Don't delete them yourself.
