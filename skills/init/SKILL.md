---
name: init
description: Use when the user types /pod:init or asks to set up pod in a project. Creates the project-owned docs in pod-docs/ (codebase brief, decisions, handoff queue, plans/sprints folders) without overwriting anything, and upgrades an older pod docs layout. Also when the user asks to update or migrate pod's docs.
---

Set up the project's pod files so the other commands can run, then stop.

**Guardrails:** never overwrite or delete an existing file; an upgrade only moves pod's own files. **Ask before anything that creates things off this machine** (a GitHub repo, a push).

## Docs version

Every pod skill reads this before touching pod's files. The current version is **2**.

- `pod-docs/README.md` has a `pod docs: <N>` line → version N.
- No such line, but `docs/codebase-structure.md` or `docs/handoff-queue.md` exists → version 1 (pod's files in `docs/`, before `pod-docs/`).
- Neither → not set up: `/pod:init` sets it up; `/pod:research` and `/pod:idea` create what they need in `pod-docs/`.
- Older than 2 → any skill but this one stops and says: `pod's docs are version <N>; run /pod:init to update them to 2.` Newer than 2 → stop and ask the human to update the pod plugin.

## Upgrade

Older docs → run each step from the found version up, in order, before the setup below. Show the human what will move and wait for a yes. Never run while a pod run is going in another session. Commit nothing: `/pod:code` commits the result to the plan branch with the rest of pod's docs.

**1 → 2:** pod's files move from `docs/` to `pod-docs/`, so the project's own `docs/` is its own again.
- **Move** each of these that exists: `codebase-structure.md`, `decisions.md`, `features.md`, `handoff-queue.md`, `handoff-queue-archive.md`, `known-issues/`, `research/`, `plans/`, `sprints/`, `design-drafts/`, `reports/`. Tracked → `git mv`, so history follows; untracked → a plain move. Nothing else in `docs/` moves. A target that already exists in `pod-docs/` → stop and report both paths.
- **Fix links** inside the moved files: `docs/<one of those names>` → `pod-docs/<name>`, such as a sprint doc's `From plan:` line or a queue `Resolution` link.
- **Tell the human** that `handoff-queue-archive.md` is no longer used: resolved queue entries now go to each plan doc's `## Queue log`, so they can delete it. List each file outside `pod-docs/` that still names an old path (`git grep -n` for them, such as `CLAUDE.md` or a CI workflow), and leave those files alone.
- Then the **Docs** step below adds `README.md` and `ideas/`.

## Setup

- **Docs:** copy `${CLAUDE_PLUGIN_ROOT}/skills/init/scaffold/pod-docs/` into `pod-docs/`, skipping files that exist. An existing `pod-docs/README.md` with an older `pod docs:` line → set it to the current version. Report what was created and what was already there.
- **Empty repo** (no application code — only docs, config, dotfiles): skip the scout and the CI offer; there's nothing to map and no stack to run. Tell the human the plan's first sprint will bootstrap the project (skeleton, test runner, smoke recipe, and CI if they want it).
- **Map the project:** `pod-docs/codebase-structure.md` still has `<!-- … -->` placeholders, or `pod-docs/features.md` has no rows → dispatch `pod:scout` with only the repo root (its file has the rest) and relay its summary.
- **CI:** the brief's `## CI` is `none` → offer to add `.github/workflows/pod-ci.yml` (without CI, only the agents check the code). On a yes, write it as the **Bootstrap** bullet in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md` describes, for the brief's runtime (gitleaks is free for personal repos; an organization needs a `GITLEAKS_LICENSE` secret). Don't commit it; update `## CI`.
- **Browser:** the project has a UI and `agent-browser --version` fails → `missing — npm i -g agent-browser` (agents check pages with it; without it, `/pod:code` and `/pod:fix` offer Chrome DevTools MCP, with fewer checks).
- **Ready to run:** `/pod:code` and `/pod:autopilot` need an `origin` remote with the merge-target on it. Never commit to the merge-target yourself, not even a first commit. No GitHub repo yet → create one with GitHub's own first commit (`gh repo create … --add-readme`, `--private` unless the human says otherwise) and base the local branch on it; local commits but no `origin` → create the repo and push them. Anything else (an empty remote, a local file that clashes) → tell the human how to get a first commit there. Ask before each step. Report each as `ready` / `fixed` / `missing — <fix>`.

Finish by telling the human to review the brief, `pod-docs/features.md`, and any new known issues (the **Smoke recipe** is required — engineers use it to run and check every slice), record decisions in `pod-docs/decisions.md` as they're made, and leave the new files uncommitted (`/pod:code` commits them to the plan branch; they reach the merge-target with the plan's final PR). Then run `/pod:plan` — or, if a plan already exists, `/pod:sprint` or `/pod:autopilot`.
