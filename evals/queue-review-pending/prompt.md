---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
---

/pod:code demo

Resume at **Plan complete** step 2: the reviewer checked the final PR https://github.com/acme/demo/pull/20 and came back with this:

> Verdict: pass
> PENDING: someday — `src/index.js` builds the greeting inline; a `greet(name)` helper would make it testable on its own.

Put its PENDING in the handoff queue, then stop. Don't dispatch anyone or run git.
