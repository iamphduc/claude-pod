---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/pod:code books

Resume at **Plan complete**, step 1: every sprint is done, and wave PRs https://github.com/acme/books/pull/31 and https://github.com/acme/books/pull/32 are merged into `books`. The merge-target is `main`. The final PR doesn't exist yet. `gh` and Bash are not available in this session, so instead of running it, put the exact `gh pr create` command you would run, with its full title and body, in your final message. Then stop: don't dispatch the reviewer.
