---
max_turns: 25
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill]
model: opus
---

/pod:code demo

Resume in sprint `one` at the start of wave 1. Preflight is done: the project has no UI, so `browser: none`; the port base is 3100; the docs version is current; the plan branch `demo` exists. `gh` and git aren't available here, so don't run them. Dispatch wave 1's engineers now, one Agent call per slice, then stop.
