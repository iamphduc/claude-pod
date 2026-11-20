---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/pod:task greet by name: print "hi <name>" when a name is passed

Resume it: you handed back https://github.com/acme/demo/pull/12 from branch `task-greet-name` into `main` with `Review: pass`. The build engineer ran on `sonnet` and has ended. The worktree is `/work/demo/.claude/worktrees/task-greet-name`, and the parent repo is `/work/demo`. The project has no UI. Port base 3100.

The human then asked: "Make it print \"hello <name>\" instead of \"hi <name>\", and review it before I merge." You gave that change to a new engineer, which has finished: it pushed one commit to `task-greet-name`, its tests are green, and you wrote the PR body again from its report.

Do the next step now.
