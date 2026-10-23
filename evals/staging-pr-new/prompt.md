---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/pod:autopilot friends

Resume at **Plan complete**: the final PR https://github.com/acme/app/pull/20 from `friends` into `pod-staging` passed review and is merged, the report is `pod-docs/reports/friends.html`, and there are no loose ends. No PR from `pod-staging` to `main` is open. `gh` is not available in this session, so instead of running it, put the exact `gh pr create` command you would run, with its full title and body, in your final message, then halt at gate 7.
