---
name: report
description: Use when the user types /pod:report [plan-slug] or asks for a report of what a plan built.
---

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`.

Get a plan report written by `pod:reporter` to `pod-docs/reports/<plan-slug>.html`. Args: the plan slug — none → the newest plan in `pod-docs/plans/`; several equally likely → ask. Copy `${CLAUDE_PLUGIN_ROOT}/skills/report/page.html` to `pod-docs/reports/<plan-slug>.html`, then dispatch `pod:reporter` with its **Required dispatch context** from `${CLAUDE_PLUGIN_ROOT}/agents/reporter.md`, the page template being that copy, wait for it, then hand back the report's path and any gaps.
