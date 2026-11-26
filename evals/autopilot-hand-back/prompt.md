---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
---

/pod:autopilot demo

Resume in sprint `one`, wave 1. Preflight is done and the browser check is settled as `none`. Both slices came back, and nothing else is running:

- A1's PR https://github.com/acme/demo/pull/12 is mergeable, but the engineer reported `Confidence: low`.
- A2's PR https://github.com/acme/demo/pull/13 passed every check, but `gh pr merge 13` was refused: it builds on https://github.com/acme/demo/pull/11, which isn't merged yet.

`gh` and git aren't available here, so don't run them, and `PushNotification` isn't available either. Decide what autopilot does with each PR. End your final message with exactly two lines, one per PR: `Decision: MERGE #<n>` or `Decision: HAND BACK #<n>`, then stop.
