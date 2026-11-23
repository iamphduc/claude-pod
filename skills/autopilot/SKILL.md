---
name: autopilot
description: Use when the user types /pod:autopilot [plan-slug] or asks to run the workflow autonomously across a plan. Also the resume command after a halt.
argument-hint: "[plan-slug] [--merge-target=branch] [--max-sprints=N] [--max-waves=N] [--max-runtime=4h] [--max-width=N]"
---

Run the whole plan without the human: the `/pod:code` wave loop (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`), except that you merge what clears the bar in `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/policy.md` and halt on everything else.

## Args

- `[plan-slug]`: none → ask.
- `--merge-target=<branch>`: see the policy's **Merge target**.
- `--max-sprints=N`, `--max-waves=N`, `--max-runtime=4h`: the policy's safety bounds.
- `--max-width=N`: passed to the sprint-planner.

## Guardrails

- **Read the policy every turn.** It holds the merge bar, the halt gates, and the safety bounds; a PR that fails the bar halts at its gate.

## Work

### What changes from `/pod:code`

- **You merge instead of handing back:** every wave PR and the final plan PR, under the policy. No "reply continue" anywhere.
- **Next sprint:** a `planned` row left → dispatch `pod:sprint-planner` with the plan slug, any `--max-width`, and any answers it needs, then go straight into the new sprint's waves.
- **No sprint doc:** the sprint-planner wrote none → gate 1 with its reason.

### Plan complete

- **Close out:** run `/pod:code`'s **Plan complete** steps 1–6 whatever the verdict, in place of its step 7 hand-back.
- **Gate 7:** after the final merge, clean up as `/pod:code`'s **On resume** does for a merged final PR, then halt at gate 7 with the URL of the PR left for the human (the staging PR, or else the merged final PR), the sorted list, the report's path, `Loose ends:`, and the **Run app** line.
