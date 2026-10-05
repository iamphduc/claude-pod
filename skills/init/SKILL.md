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
- **Ready to run:** `/pod:code` and `/pod:autopilot` need an `origin` remote with the merge-target on it. Never commit to the merge-target yourself, not even a first commit. No GitHub repo yet → create one with GitHub's own first commit (`gh repo create … --add-readme`, `--private` unless the human says otherwise) and base the local branch on it; local commits but no `origin` → create the repo and push them. Anything else (an empty remote, a local file that clashes) → tell the human how to get a first commit there. Ask before each step. Report each as `ready` / `fixed` / `missing — <fix>`.

Finish by telling the human to review the brief and any new known issues (the **Smoke recipe** is required — engineers use it to run and check every slice), record decisions in `docs/decisions.md` as they're made, and leave the new files uncommitted (`/pod:code` commits them to the plan branch; they reach the merge-target with the plan's final PR). Then run `/pod:plan` — or, if a plan already exists, `/pod:sprint` or `/pod:autopilot`.
