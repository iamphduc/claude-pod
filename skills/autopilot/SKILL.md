---
name: autopilot
description: Use when the user types /pod:autopilot [plan-slug] or asks to run the workflow autonomously across a plan. Also the resume command after a halt.
argument-hint: "[plan-slug] [--merge-target=branch] [--max-sprints=N] [--max-waves=N] [--max-runtime=4h] [--max-width=N]"
---

Run the whole plan without the human: the `/pod:code` wave loop (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`), except that you merge the wave PRs that clear the bar in `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/policy.md`, and stop the way `/pod:code` does for any other PR.

## Args

- `[plan-slug]`: none → ask.
- `--merge-target=<branch>`: as in `/pod:code`.
- `--max-sprints=N`, `--max-waves=N`, `--max-runtime=4h`: the policy's safety bounds.
- `--max-width=N`: passed to the sprint-planner.

## Guardrails

- **Read the policy every turn.** It holds the merge bar, what to do when the bar fails, and the safety bounds.

## Work

### What changes from `/pod:code`

- **You merge instead of handing back:** every wave PR, under the policy. No sprint hand-backs, and a wave hand-back only when the bar fails.
- **Next sprint:** a `planned` row left → dispatch `pod:sprint-planner` with the plan slug, any `--max-width`, and any answers it needs, then go straight into the new sprint's waves.
- **No sprint doc:** the sprint-planner wrote none → halt `BLOCKED` with its reason.

### Plan complete

- **The plan ends as in `/pod:code`:** run its **Plan complete** as written, steps 1–7, whatever the verdict or the CI status. Its close-out entry and step 7 hand-back are the end of the run; never merge the final PR.
