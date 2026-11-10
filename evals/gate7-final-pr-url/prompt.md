---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
---

/pod:autopilot friends

Resume at **Plan complete**: the final PR https://github.com/acme/app/pull/20 from `friends` into `main` passed review and is merged, the parent repo is on an up-to-date `main`, the `friends` branch is deleted, the report is `pod-docs/reports/friends.html`, and there are no loose ends. Halt at gate 7 the way autopilot says, writing the halt to the handoff queue, then stop. `PushNotification` isn't available here, so skip it. Don't run git or `gh`.
