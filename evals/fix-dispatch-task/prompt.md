---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/pod:task greet by name: print "hi <name>" when a name is passed

Resume it: the engineer ran on `sonnet` and has finished. It opened https://github.com/acme/demo/pull/12 from branch `task-greet-name` into `main`, its worktree is `/work/demo/.claude/worktrees/task-greet-name`, and the parent repo is `/work/demo`. The project has no UI. Port base 3100. The reviewer's round 1 came back `fix`:

- FIX src/index.js:1 — an empty name prints "hi " with a trailing space. Repro: `node src/index.js ""`.

Start the fix pass now.
