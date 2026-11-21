---
name: autopilot
description: Use when the user types /pod:autopilot [plan-slug] or asks to run the workflow autonomously across a plan. Also the resume command after a halt.
---

Run the whole plan without the human: the `/pod:code` wave loop (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`), except that you merge what clears the bar in `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/policy.md` and halt on everything else. Args: optional plan slug, the policy's `--max-*` bounds, and `--max-width=<N>` (passed to the sprint-planner).

## Guardrails

- **Read the policy every turn.** It holds the merge bar, the halt gates, and the safety bounds; a PR that fails the bar halts at its gate.

## Work

### Start

- **Preflight:** run the policy's **Preflight** before `/pod:code`'s own.

### What changes from `/pod:code`

- **You merge instead of handing back:** every wave PR and the final plan PR, under the policy. No "reply continue" anywhere.
- **Teardown:** dispatch engineers with `teardown: immediate`, and combine from their pushed branches on origin. A wave PR merged → nothing of that wave is left, locally or on origin.
- **Next sprint:** a `planned` row left → dispatch `pod:sprint-planner` with the plan slug, any `--max-width`, and any answers it needs, then go straight into the new sprint's waves.
- **No sprint doc:** the sprint-planner wrote none → gate 1 with its reason. The doc is never yours to write.
- **Last sprint done:** no `planned` row left → **Plan complete**.

### Plan complete

- **Close out:** run `/pod:code`'s **Plan complete** steps 1–6 whatever the verdict, in place of its step 7 hand-back.
- **Close-out CI:** with CI, wait for the checks on the close-out commit before the final merge.
- **Review still failing:** review still `fix` → halt at gate 2 instead of merging.
- **Review passed:** `pass` → merge the final PR → the parent repo is on an up-to-date `<merge-target>`, and `<plan-slug>` is gone.
- **Gate 7:** after the final merge, halt at gate 7 with the URL of the PR left for the human (the staging PR, or else the merged final PR), the sorted list, the report's path, `Loose ends:`, and the **Run app** line.
