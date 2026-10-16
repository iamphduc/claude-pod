---
name: autopilot
description: Use when the user types /pod:autopilot or asks to run the workflow autonomously across a plan. Also the resume command after a halt.
---

Run the whole plan without the human: the `/pod:code` wave loop (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`), except that you merge what clears the bar in `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/policy.md` and halt on everything else. Read the policy every turn. Args: optional plan slug and the policy's `--max-*` bounds. Run the policy's **Preflight** before `/pod:code`'s own.

## What changes from `/pod:code`

- **You merge instead of handing back** — every wave PR and the final plan PR, under the policy's auto-merge criteria. Anything that fails them halts at its gate.
- **Teardown:** dispatch engineers with `teardown: immediate` and combine from their pushed branches on origin. After each wave PR merges, remove the wave-head worktree and delete the slice branches and the wave head on origin. Delete `<plan-slug>` after the final merge.
- **Between sprints, don't stop:** no "reply continue". `--max-sprints` reached → gate 5. A `planned` row left → dispatch `pod:sprint-planner` with the plan slug and any answers the human gave that it needs, then go straight into the new sprint's waves (no halt to review the draft). None left → **Plan complete**.
- **Plan complete:** run `/pod:code`'s **Plan complete** steps 1–6 (review, the one fix pass, sort the queue, close out, leave nothing behind) whatever the verdict, in place of its step 7 hand-back. The close-out commit re-runs CI — wait for the checks on the new head. Review still `fix` → halt at gate 2 instead of merging. `pass` → merge the final PR, check out and pull `<merge-target>` in the parent repo, delete `<plan-slug>`, then halt at gate 7 with the sorted list, the report's path, `Loose ends:`, and the **Try it** line.
