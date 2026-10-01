---
name: init
description: Use when the user types /pod:init or asks to set up pod in a project. Creates the project-owned docs (codebase brief, decisions, handoff queue, plans/sprints folders) without overwriting anything.
---

Set up the project's pod files so the other commands can run, then stop. Never overwrite or delete an existing file, and **ask before anything that creates things outside this machine** (a GitHub repo, a push).

1. **Copy the scaffold** from the repo root, skipping files that exist: `cp -rn "${CLAUDE_PLUGIN_ROOT}/skills/init/scaffold/docs/." docs/`. Report what was created and what was already there.
2. **Map the project.** No application code yet (only docs, config, dotfiles) → skip this and step 3: tell the human the plan's first sprint will bootstrap the project (skeleton, test runner, smoke recipe, and CI if they want it). Otherwise, if `docs/codebase-structure.md` still has `<!-- … -->` placeholders, dispatch `pod:scout` with the repo root and relay its summary.
3. **Offer CI if there's none** (`## CI` says `none`). Without CI, only the agents check the code — ask whether to add `.github/workflows/pod-ci.yml`. On a yes, write it as the **Bootstrap** bullet in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md` describes it, using the runtime the brief names (gitleaks is free for personal repos; an organization needs a `GITLEAKS_LICENSE` secret). Don't commit it; update the brief's `## CI`.
4. **Ready to run.** `/pod:code` and `/pod:autopilot` need an `origin` remote and a first commit pushed to the merge-target. For each that's missing, show the fix and ask before running it: `gh repo create … --private --source . --remote origin`; commit the pod files as the first commit and `git push -u origin <merge-target>` — the one commit pod makes on the merge-target itself. Report each as `ready` / `fixed` / `missing — <fix>`.

Finish by telling the human to review the brief and any new known issues (the **Smoke recipe** is required — engineers use it to run and check every slice), record decisions in `docs/decisions.md` as they're made, commit the new files, then run `/pod:plan` — or, if a plan already exists, `/pod:sprint` or `/pod:autopilot`.
