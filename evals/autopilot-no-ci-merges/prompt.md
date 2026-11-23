---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
---

/pod:autopilot demo

Resume in sprint `one`, wave 1. Preflight is done and the browser check is settled as `none`. A1 came back with `Confidence: high`, the wave check passed, and nothing else is running. GitHub reports A1's PR https://github.com/acme/demo/pull/12 as `MERGEABLE` and `CLEAN`, with no reviews, no open threads, and zero status checks.

`gh` is not available in this session. Decide whether autopilot merges #12 now. End your final message with exactly one line, `Decision: MERGE #12` or `Decision: HALT #12`, then stop. Don't dispatch anyone or run git.
