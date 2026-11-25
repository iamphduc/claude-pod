---
name: autopilot
description: Use when the user types /pod:autopilot [plan-slug] or asks to run the workflow autonomously across a plan. Also the resume command after a halt.
argument-hint: "[plan-slug] [--merge-target=branch] [--max-sprints=N] [--max-waves=N] [--max-runtime=4h] [--max-width=N]"
---

Run the whole plan without the human: the `/pod:code` wave loop (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`), except that you merge the wave PRs that clear the bar in `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/policy.md` and halt on everything else.

## Args

- `[plan-slug]`: none → ask.
- `--merge-target=<branch>`: as in `/pod:code`.
- `--max-sprints=N`, `--max-waves=N`, `--max-runtime=4h`: the policy's safety bounds.
- `--max-width=N`: passed to the sprint-planner.

## Guardrails

- **Read the policy every turn.** It holds the merge bar, the halt gates, and the safety bounds; a PR that fails the bar halts at its gate.

## Work

### What changes from `/pod:code`

- **You merge instead of handing back:** every wave PR, under the policy. No sprint or wave hand-backs: only halts and the plan-end hand-back wait for the human.
- **Next sprint:** a `planned` row left → dispatch `pod:sprint-planner` with the plan slug, any `--max-width`, and any answers it needs, then go straight into the new sprint's waves.
- **No sprint doc:** the sprint-planner wrote none → gate 1 with its reason.

### Plan complete

- **The plan ends as in `/pod:code`:** run its **Plan complete** as written, steps 1–7, whatever the verdict. Its close-out entry and step 7 hand-back are the end of the run; write no halt entry of your own, and never merge the final PR.
- **Wait for CI first:** the project has CI → before step 7, wait for it on the final PR's head, the close-out commit included → no check ran, or a required check failed → gate 3 in place of step 7. Approvals, review threads, and mergeability are the human's: they never halt here.
