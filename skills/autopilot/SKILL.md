---
name: autopilot
description: Use when the user types /pod:autopilot or asks to run the workflow autonomously across a plan. Also the resume command after a halt.
---

**Run the `/pod:code` wave loop** (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`) with the deltas below, under `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/policy.md` — read it every turn. Beyond `/pod:code`, also dispatch the `pod:sprint-planner` and notify on halt. Args: optional plan slug, the policy's `--max-*` bounds, and `--no-ci`. Run the policy's **Preflight** (CI must run on pull requests) before `/pod:code`'s own.

## Teardown

Dispatch engineers with `teardown: immediate` — they remove their own worktrees after pushing; you integrate from origin refs. After each wave PR merges, remove the wave-head worktree and delete the pushed slice branches and wave head (`git push origin --delete <branch>`). At **Plan complete**, delete `<plan-slug>`.

## Auto-merge

Don't hand back any PR — wave PR or final plan PR. Apply the policy's auto-merge criteria + escalation valve: merge if clean; a failed criterion or risk-flagged PR halts. The final plan PR also needs the reviewer's `pass` — run `/pod:code`'s **Plan complete** steps 1–3 (review, and the one fix pass) as usual; still `fix` → halt at the plan-review gate (policy gate 2) instead of handing back.

## Between sprints

Don't end with "reply continue" — run one sprint per turn:

1. `--max-sprints` reached → halt at the safety-bound gate (policy gate 5).
2. No `planned` row left → run **Plan complete**: open the final `<plan-slug>` → `<merge-target>` PR, review it (plus the one fix pass), then `/pod:code`'s **Plan complete** steps 4–6 — sort the queue, close out the paper trail on the plan branch (its commit re-runs CI; wait for the checks on the new head), leave nothing running. Auto-merge it on `pass`, sync `<merge-target>` in the parent repo (`git checkout <merge-target> && git pull origin <merge-target>`), tear down `<plan-slug>`, then halt at gate 7 + notify with the sorted list, the report's path, `Loose ends:`, and the **Try it** line.
3. Else dispatch the `pod:sprint-planner` and proceed straight into the new sprint's wave loop — no sprint-draft halt.
