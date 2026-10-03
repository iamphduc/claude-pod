---
name: init
description: Use when the user types /pod:init or asks to set up pod in a project. Creates the project-owned docs (codebase brief, decisions, handoff queue, plans/sprints folders) without overwriting anything.
---

Set up the project's pod files so the other commands can run, then stop.

**Guardrails:** never overwrite or delete an existing file. **Ask before anything that creates things off this machine** (a GitHub repo, a push).

- **Docs:** copy `${CLAUDE_PLUGIN_ROOT}/skills/init/scaffold/docs/` into `docs/`, skipping files that exist. Report what was created and what was already there.
- **Empty repo** (no application code — only docs, config, dotfiles): skip the scout and the CI offer; there's nothing to map and no stack to run. Tell the human the plan's first sprint will bootstrap the project (skeleton, test runner, smoke recipe, and CI if they want it).
- **Map the project:** `docs/codebase-structure.md` still has `<!-- … -->` placeholders → dispatch `pod:scout` with the repo root and relay its summary.
- **CI:** the brief's `## CI` is `none` → offer to add `.github/workflows/pod-ci.yml` (without CI, only the agents check the code). On a yes, write it as the **Bootstrap** bullet in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md` describes, for the brief's runtime (gitleaks is free for personal repos; an organization needs a `GITLEAKS_LICENSE` secret). Don't commit it; update `## CI`.
- **Ready to run:** `/pod:code` and `/pod:autopilot` need an `origin` remote and a first commit pushed to the merge-target. For each that's missing, show the fix and ask first — a new repo is `--private` unless the human says otherwise; the first commit holds the pod files and is the one commit pod makes on the merge-target itself. Report each as `ready` / `fixed` / `missing — <fix>`.

Finish by telling the human to review the brief and any new known issues (the **Smoke recipe** is required — engineers use it to run and check every slice), record decisions in `docs/decisions.md` as they're made, commit the new files, then run `/pod:plan` — or, if a plan already exists, `/pod:sprint` or `/pod:autopilot`.
