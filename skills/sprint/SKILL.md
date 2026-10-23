---
name: sprint
description: Use when the user types /pod:sprint or asks to draft the next sprint from a main plan.
---

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`. Then dispatch the `pod:sprint-planner` subagent via the Agent tool, passing the user's args (if any) as the prompt — including `--max-width=<N>` if given.
