---
name: autopilot
description: Use when the user types /pod:autopilot [plan-slug] or asks to run the workflow autonomously across a plan. Also the resume command after a halt.
---

Run the whole plan without the human: the `/pod:code` wave loop (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`), except that you merge what clears the bar in `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/policy.md` and halt on everything else. Args: optional plan slug, the policy's `--max-*` bounds, and `--max-width=<N>` (passed to the sprint-planner).

## Guardrails

- **Read the policy every turn.** It holds the merge bar, the halt gates, and the safety bounds.
- **Merge only what clears the bar.** A PR that fails the policy's auto-merge criteria halts at its gate.
- **Never merge the staging PR.** The human moves `pod-staging` to the default branch.

## Work

### Start

- **Preflight:** run the policy's **Preflight** before `/pod:code`'s own.

### What changes from `/pod:code`

- **You merge instead of handing back:** every wave PR and the final plan PR, under the policy's auto-merge criteria. Anything that fails them halts at its gate.
- **Teardown:** dispatch engineers with `teardown: immediate` and combine from their pushed branches on origin. After each wave PR merges, remove the wave-head worktree and delete the slice branches and wave head on origin; delete `<plan-slug>` after the final merge.
- **Between sprints, don't stop:** no "reply continue". `--max-sprints` reached → gate 5.
- **Next sprint:** a `planned` row left → dispatch `pod:sprint-planner` with the plan slug, any `--max-width`, and any answers the human gave that it needs, then go straight into the new sprint's waves (no halt to review the draft).
- **No sprint doc:** the sprint-planner wrote no sprint doc → gate 1 with its reason. Never write the doc yourself.
- **Last sprint done:** no `planned` row left → **Plan complete**.

### Plan complete

- **Plan complete:** run `/pod:code`'s **Plan complete** steps 1–6 (review, the one fix pass, sort the queue, close out, leave nothing behind) whatever the verdict, in place of its step 7 hand-back.
- **Close-out CI:** with CI, the close-out commit re-runs it → wait for the checks on the new head before the final merge.
- **Review still failing:** review still `fix` → halt at gate 2 instead of merging.
- **Review passed:** `pass` → merge the final PR, check out and pull `<merge-target>` in the parent repo, and delete `<plan-slug>`.
- **Gate 7:** after the final merge, halt at gate 7 with the URL of the PR left for the human (the staging PR, or else the merged final PR), the sorted list, the report's path, `Loose ends:`, and the **Run app** line.
