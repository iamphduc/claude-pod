---
name: ship
description: Use when the user types /pod:ship <idea> or asks to go from an idea to a shipped plan in one command — research, plan interview, setup, then autopilot.
---

Take one idea all the way through, so the human never retypes it: research → plan → init if needed → autopilot. Run each step's own skill as written; this file only chains them and says where the human must answer. Args: the idea (none → ask for it), `--no-research`, `--deep` (pass to research), and autopilot's `--max-*` bounds (pass them on).

1. **Resume first.** The plan for this idea already has a sprint doc or plan branch → autopilot already started: go to step 6 to resume it. The plan exists but nothing started → go to step 4.
2. **Research** (unless `--no-research`): run `${CLAUDE_PLUGIN_ROOT}/skills/research/SKILL.md` with the idea. Don't ask whether to research — choosing `ship` was the yes.
3. **Plan:** run `${CLAUDE_PLUGIN_ROOT}/skills/plan/SKILL.md` with the idea — full interview and look pick. It finds the report, so it doesn't offer research again. Don't stop at its "next command" line.
4. **Init, only if needed** (no `docs/codebase-structure.md`, no `origin`, or no first commit): run `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`. Don't halt for the human to review the scout's draft; list what it left open in the go check.
5. **Go check.** Autopilot merges without the human, so end the turn with: the plan slug and path, its sprint count, the bounds in use, anything init left open, and *"Reply `go` to start autopilot."* Anything other than `go` → apply it (edit the plan, change bounds) and ask again.
6. **Autopilot:** on `go`, run `${CLAUDE_PLUGIN_ROOT}/skills/autopilot/SKILL.md` with the slug and bounds. From here it's autopilot's run — its halts and resume rules apply.
