---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
---

/pod:autopilot demo

Resume in sprint `one`, wave 1. Preflight is done and the browser check is settled as `none`. Both slices came back, and nothing else is running:

- A1's PR https://github.com/acme/demo/pull/12 is mergeable, but the engineer reported `Confidence: low`.
- A2's PR https://github.com/acme/demo/pull/13 passed every check, but its merge failed: it builds on https://github.com/acme/demo/pull/11, which isn't merged yet. The only fix is to merge #11, then #13.

Halt for each PR the way autopilot's policy says, writing each halt to the handoff queue, then stop. `PushNotification` isn't available here, so skip it. Don't dispatch anyone or run git.
