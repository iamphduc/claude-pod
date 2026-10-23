---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/pod:autopilot friends

Resume at **Plan complete**: the final PR https://github.com/acme/app/pull/20 from `friends` into `pod-staging` passed review and is merged, the report is `pod-docs/reports/friends.html`, and there are no loose ends.

A PR from `pod-staging` to `main` is already open from an earlier plan, and you don't need to look it up: https://github.com/acme/app/pull/30, titled `feat: weekly email digest (plan digest)`, with this body:

```
## Digest (digest)

Send each user a weekly email of what their friends posted.

- Features added: weekly digest
- Decisions made for you: none
- Loose ends: none
- Final PR: https://github.com/acme/app/pull/12 · Report: pod-docs/reports/digest.html
```

`gh` is not available in this session, so instead of running it, put the exact `gh pr edit` command you would run, with its full title and body, in your final message, then halt at gate 7.
