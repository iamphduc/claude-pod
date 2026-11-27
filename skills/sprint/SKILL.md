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

## Guardrails

- Leave the sprint doc to the planner: don't write or edit it yourself.

## Work

- **Dispatch:** dispatch `pod:sprint-planner` with its **Required dispatch context** from `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md` → it writes the sprint doc.
- **Answers:** the human gave decisions with the command or earlier in the conversation, such as answers to what an earlier draft left for them → pass them in `answers`.

## Hand back

- **Sprint:** the planner wrote a sprint doc → its path, its shape, and each one-way door, then ask the human to review it and run `/pod:code` (or `/pod:autopilot`).
- **Left for you:** what the planner couldn't decide, or `none`.
- **Stopped:** the planner stopped → its reason.
