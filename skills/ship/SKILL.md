---
name: ship
description: Use when the user types /pod:ship <idea> or asks to go from an idea to a shipped plan in one command — research, plan interview, setup, then autopilot.
---

Take one idea from research to autopilot in one command. Run each step's own skill. Args: the idea, `--no-research`, `--deep` (for research), and autopilot's `--max-*` bounds. **Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`.

1. **Resume:** autopilot already started on this plan → step 7. Plan written but not started → step 5.
2. **Size check:** run `/pod:plan`'s **Size check** now, before research. Yes → it sets pod up if needed and runs `/pod:fix` instead, and this command stops.
3. **Research** (unless `--no-research`): run `${CLAUDE_PLUGIN_ROOT}/skills/research/SKILL.md`, without asking first. The repo has code but no filled brief → in the same message, copy init's scaffold per its **Docs** step and dispatch `pod:scout` in the background, so the plan starts from the map. Init's questions wait for step 5.
4. **Plan:** run `${CLAUDE_PLUGIN_ROOT}/skills/plan/SKILL.md` (its size check is already done, and its overview check waits for step 6), then keep going.
5. **Init**, if pod isn't set up here or step 3 started it: run `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`, without waiting for the human to review the scout's draft.
6. **Go check:** open the plan's overview page and show its path, the plan, its sprint count, the bounds, any choice you made for the human (such as the look), anything init left open, and the answers to `/pod:code`'s **Browser** check and the autopilot policy's **Merge target** (ask them here, recorded, so autopilot never asks), then end the turn with *"Check that the overview matches what you want built, then reply `go` to start autopilot."* Apply any other reply and ask again.
7. **Autopilot:** run `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/SKILL.md` with the slug and bounds.
