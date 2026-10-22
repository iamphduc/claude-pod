---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
---

/pod:code demo

Resume in sprint `one`, wave 1. The engineer for slice A1 came back with this, and nothing else is running:

> Status: BLOCKED — `node` 14 on this machine has no `String.prototype.replaceAll`, which the plan's contract needs. Needs a decision: raise the Node floor to 16, or drop replaceAll.

Record its concern in the handoff queue, then stop. Don't dispatch anyone or run git.
