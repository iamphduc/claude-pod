---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/pod:task greet by name: print "hi <name>" when a name is passed

Resume it: the reviewer's round 1 came back `fix`, the engineer's fix pass is done, and you already wrote the PR body again for it. Dispatch the reviewer for round 2 now. The PR is https://github.com/acme/demo/pull/12 from branch `task-greet-name` into `main`, the worktree is `/work/demo/.claude/worktrees/task-greet-name`, and the parent repo is `/work/demo`. No UI. Port base 3100.

Round-1 findings:

- FIX src/index.js:1 — an empty name prints "hi " with a trailing space. Repro: `node src/index.js ""`.
- FIX src/index.js:1 — a name with spaces is cut at the first space. Repro: `node src/index.js "Ann Lee"`.

The engineer's summary:

Both fixed in src/index.js. An empty name now prints "hi". Arguments are joined, so "Ann Lee" prints in full. Added two tests.
