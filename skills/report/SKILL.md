---
name: report
description: Use when the user types /pod:report [plan-slug] or asks for a report of what a plan built.
---

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`.

Get a plan report written by `pod:reporter` to `pod-docs/reports/<plan-slug>.html`. Args: the plan slug — none → the newest plan in `pod-docs/plans/`; several equally likely → ask. Dispatch `pod:reporter` with its **Required dispatch context** from `${CLAUDE_PLUGIN_ROOT}/agents/reporter.md`, wait for it, then hand back the report's path, how to open it, and any gaps.
