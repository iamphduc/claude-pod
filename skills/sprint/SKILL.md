---
name: sprint
description: Use when the user types /pod:sprint or asks to draft the next sprint from a main plan.
argument-hint: "[plan-slug] [--max-width=N]"
---

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`. Then dispatch `pod:sprint-planner` with the user's args (if any) as the prompt. It wrote a sprint doc → tell the human to review it and run `/pod:code` (or `/pod:autopilot`).

## Args

- `[plan-slug]`: none → the only active plan.
- `--max-width=N`: the most slices in one wave. Default: 5.
