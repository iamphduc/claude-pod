---
max_turns: 25
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
model: opus
---

/pod:autopilot demo --max-width=3

Resume between sprints: sprint `one` is complete and archived, its summary is written, and `pod-docs/` is committed and pushed. No safety bound is hit. `gh` and git aren't available here, so don't run them. Take the next step autopilot says to take; an Agent call counts as done when you send it. Then stop.
