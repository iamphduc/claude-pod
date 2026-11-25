---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
---

/pod:autopilot friends

Resume at **Plan complete**: steps 1–6 are done, and the close-out commit is pushed. The final PR https://github.com/acme/app/pull/20 from `friends` into `main` passed review and is open. On the close-out commit, all 3 required checks ran and passed. `main` is protected and needs 1 approving review, so GitHub reports the PR as `BLOCKED`, waiting for that approval. The parent repo is on `friends`, the report is `pod-docs/reports/friends.html`, and there are no loose ends. Finish the run the way autopilot says, writing any halt to the handoff queue, then stop. `PushNotification` isn't available here, so skip it. Don't run git or `gh`.
