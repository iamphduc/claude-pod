---
name: init
description: Use when the user types /pod:init or asks to set up pod in a project. Creates the project-owned docs in pod-docs/ (codebase brief, decisions, handoff queue, plans/sprints folders) without overwriting anything. Also when the user asks to update pod's docs.
---

Set up the project's pod files so the other commands can run, then stop.

**Guardrails:** never overwrite or delete an existing file. **Ask before anything that creates things off this machine** (a GitHub repo, a push). Commit nothing; `/pod:code` commits pod's setup to the plan branch.

## Docs version

Every pod skill reads this before touching pod's files. The current version is **2**.

- `pod-docs/README.md` has a `pod docs: <N>` line → version N.
- No such line, but `docs/codebase-structure.md` or `docs/handoff-queue.md` exists → version 1 (pod's files in `docs/`, before `pod-docs/`).
- Neither → not set up: `/pod:init` sets it up; skills that only write to `pod-docs/` create what they need.
- Older than 2 → every skill, this one included, stops and changes nothing: `pod's docs here are version <N> (in docs/); this pod reads version 2. Run /pod:init with pod 0.17.1 to move them, then update pod.` Newer than 2 → stop and say: `pod's docs here are version <N>; this pod reads version 2. Update pod.`

**Set up** means `pod-docs/codebase-structure.md` exists, the repo has an `origin`, and a first commit.

## Config

`pod-docs/config.md` holds the project's `merge-target`: the branch plans go to through their final PR. pod reads it and never writes it; the human edits it.

- **Which value wins:** a `--merge-target` flag, then this file, then origin's default branch. No file, or an empty value → the default.
- **During a plan:** the plan's branch is cut from its merge-target, so keep it the same until the plan ends.

## Setup

- **Docs:** copy `${CLAUDE_PLUGIN_ROOT}/skills/init/scaffold/pod-docs/` into `pod-docs/`, skipping files that exist. Report what was created and what was already there.
- **Empty repo** (no application code): skip the scout and the CI offer; the plan's first sprint bootstraps.
- **Map the project:** `pod-docs/codebase-structure.md` still has `<!-- … -->` placeholders, or `pod-docs/features.md` has no rows → dispatch `pod:scout` with only the repo root (its file has the rest) and relay its summary.
- **CI:** the repo has no CI config (such as `.github/workflows/`), the brief's `## CI` is `none`, and `pod-docs/decisions.md` has no `## <date> — CI: none` entry, or the human asks for CI → offer to add `.github/workflows/pod-ci.yml` (without CI, only the agents check the code). On a no, record that entry, so no command asks again. On a yes, write it as the **Bootstrap CI** rule in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md` describes, for the brief's runtime (gitleaks is free for personal repos; an organization needs a `GITLEAKS_LICENSE` secret). Update `## CI`.
- **Tools:** `git` and `gh` are installed and `gh` is logged in → else report each missing one with its fix in **Ready to run**, e.g. `gh: not logged in — gh auth login`, and hold the GitHub steps until it's fixed.
- **Browser** (projects with a UI): run `/pod:code`'s browser probe → it fails → report each missing piece in **Ready to run**, in install order, each with its command: Node.js 22 or later, `agent-browser`, then its Chrome (`agent-browser install`).
- **Ready to run:** `/pod:code` and `/pod:autopilot` need an `origin` remote with the merge-target (per **Config**) on it; a merge-target missing there → `missing — git push origin origin/<default branch>:refs/heads/<merge-target>`. No GitHub repo → create one (private unless told otherwise) whose first commit comes from GitHub, and base the local branch on it; local commits but no `origin` → create the repo and push them. Anything else (an empty remote, a local file that clashes) → tell the human how to get a first commit there. Wait for a yes before each step. Report each as `ready` / `fixed` / `missing — <fix>`.

Finish by telling the human to review the brief, `pod-docs/features.md`, and any new known issues (the **Smoke recipe** is required — engineers use it to run and check every slice), record decisions in `pod-docs/decisions.md` as they're made. Then run `/pod:plan` — or, if a plan already exists, `/pod:sprint` or `/pod:autopilot`.
