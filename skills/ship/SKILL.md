---
name: ship
description: Use when the user types /pod:ship [idea] or asks to go from an idea to a shipped plan in one command.
argument-hint: "[idea] [--no-research] [--deep] [--max-sprints=N] [--max-waves=N] [--max-runtime=4h]"
---

Take one idea from research to autopilot in one command, running each step's own skill.

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`.

## Args

- `[idea]`: what to build.
- `--no-research`: skip research.
- `--deep`: deeper research.
- `--max-sprints=N`, `--max-waves=N`, `--max-runtime=4h`: passed to autopilot.

## Work

1. **Resume:** on a rerun, skip each step already done: a research report on this idea, a written plan, pod set up. Autopilot already started on this plan → go straight to **Autopilot**.
2. **Size check:** run `/pod:plan`'s **Size check** now, before research. Yes → it sets pod up if needed and runs `/pod:task` instead, and this command stops.
3. **Research:** with `--no-research`, skip this whole step. Otherwise run `${CLAUDE_PLUGIN_ROOT}/skills/research/SKILL.md` without asking first. The repo has code but no filled brief → in the same message, copy init's scaffold per its **Docs** rule and dispatch `pod:scout` in the background, so the plan starts from the map. Init's questions wait for **Init**.
4. **Plan:** run `${CLAUDE_PLUGIN_ROOT}/skills/plan/SKILL.md` once the scout you started has finished, then keep going.
5. **Init:** pod isn't set up (per `/pod:init`) or **Research** started it → run `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`, without waiting for the human to review the scout's draft.
6. **Go check:** open the plan's overview page and show what the human needs to say `go`: the plan, its sprints, the bounds, the choices you made for them, and what init left open. Ask `/pod:code`'s **Browser** check here and record the answer, so autopilot never asks.
7. **Go reply:** end the turn with *"Check that the overview matches what you want built, then reply `go` to start autopilot."* Any other reply → apply it and ask again.
8. **Autopilot:** run `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/SKILL.md` with the slug and bounds.
