---
name: ship
description: Use when the user types /pod:ship <idea> or asks to go from an idea to a shipped plan in one command — research, plan interview, setup, then autopilot.
---

Take one idea from research to autopilot in one command. Run each step's own skill. Args: the idea, `--no-research`, `--deep` (for research), and autopilot's `--max-*` bounds.

1. **Resume:** autopilot already started on this plan → step 6. Plan written but not started → step 4.
2. **Research** (unless `--no-research`): run `${CLAUDE_PLUGIN_ROOT}/skills/research/SKILL.md`, without asking first.
3. **Plan:** run `${CLAUDE_PLUGIN_ROOT}/skills/plan/SKILL.md`, then keep going.
4. **Init**, if pod isn't set up here: run `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`, without waiting for the human to review the scout's draft.
5. **Go check:** show the plan, its sprint count, the bounds, and anything init left open, then end the turn with *"Reply `go` to start autopilot."* Apply any other reply and ask again.
6. **Autopilot:** run `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/SKILL.md` with the slug and bounds.
