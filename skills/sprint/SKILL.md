---
name: sprint
description: Use when the user types /pod:sprint or asks to draft the next sprint from a main plan.
argument-hint: "[plan-slug] [--max-width=N]"
---

Draft the next sprint of a main plan, so the human can review it before `/pod:code` or `/pod:autopilot` builds it.

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`.

## Args

- `[plan-slug]`: none → the only active plan.
- `--max-width=N`: the most slices in one wave. Default: 5.

## Work

- **Dispatch:** dispatch `pod:sprint-planner` with its **Required dispatch context** from `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md` → it writes the sprint doc.

## Hand back

- **Sprint:** the planner's final output, with each one-way door → ask the human to review it and run `/pod:code` (or `/pod:autopilot`).
