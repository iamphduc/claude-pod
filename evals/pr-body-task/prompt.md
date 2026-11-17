---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

/pod:task greet prints "hi " with a trailing space when no name is passed

Resume it: the engineer is done and pushed branch `task-greet-empty`. It did not open a PR. You will open it into `main`, and it will be https://github.com/acme/demo/pull/12. The review has not run yet. The project has no UI. The branch's commits, oldest first:

- `7be03f1` fix(greet): drop the space when no name is passed

The engineer's Final output:

- **Slice:** standalone · **Pushed branch:** `task-greet-empty`
- **Concerns:** none
- **Tests first:** [test] no name prints "hi" — `greet.test.js › no trailing space` — red: expected "hi", got "hi " → green; commit `7be03f1`
- **Edges:** a name of only spaces → tested (`greet.test.js › blank name`)
- **Door:** Door: two-way
- **Repro:** run `node src/index.js` with no name. Before: it printed `hi ` with a trailing space. Cause: `src/index.js` always adds the space before the name. After: it prints `hi`.
- **Checks run:** `npm test` — 6 passed · `npm run lint` — ok
- **Runtime verified:** ran `node src/index.js` and `node src/index.js Ann`; saw `hi` and `hi Ann`

Write the PR body now, to open the PR with. `gh` and Bash are not available in this session, so instead of running anything, put the full PR body you would write in your final message, in one fenced block.
