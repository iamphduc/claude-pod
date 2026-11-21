---
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Edit, Write]
---

/pod:code demo

Resume at **Plan complete** step 2: the reviewer checked the final PR https://github.com/acme/demo/pull/20 and came back with this:

> Verdict: pass
> [PENDING · no repro · someday] plan: `src/index.js` may print "Hello, undefined" when the name is empty — tried: `node src/index.js ""` printed "Hello, ".
> [PENDING · product choice · now] plan: the greeting is English only; other languages are a product choice.

Put its PENDINGs in the handoff queue, then stop. Don't dispatch anyone or run git.
