# pod design: how work gets checked

Why pod checks work where it does, what each check covers, and what we chose not to do. Written for people changing pod; agents follow their own instructions and the skills, not this file.

## The short version

- **Each wave: automated gates, no reviewer.** Engineers test their own slice and check it in the browser; the orchestrator checks file ownership and runs the smoke test on the combined wave before opening its PR. Anything wrong it can see there gets fixed there, by one wave-fix engineer, not deferred. Then it merges (you, or autopilot).
- **Nothing hangs quietly.** The orchestrator checks on its background agents every 15 minutes and restarts one that has stopped making progress.
- **End of plan: one reviewer, reading in pieces and running the checks.** Before the final plan PR goes to `main`, `pod:reviewer` runs the tests and the smoke recipe's scripted checks, reviews each wave's diff on its own, then the plan as a whole, keeps only findings it can pin to a line, and posts them on the PR.
- **One fix pass, then merge.** An engineer fixes the blocking findings on one branch; the reviewer checks those fixes once; the PR comes back to you. No loops.
- **Keep plans small.** A few sprints each, so the end-of-plan review stays readable and late fixes stay cheap.
- **The plan branch keeps up with `main`.** At the start of each sprint, anything new on `main` is merged into the plan branch and smoke-tested, so conflicts show up small and early.
- **CI is optional, and a real gate when it's there.** With CI, autopilot needs every check to pass and won't treat "no checks" as a pass; `/pod:init` and `/pod:plan` offer a minimal workflow but don't require it.
- **Test first, real TDD.** Every success criterion names a test; engineers write it, watch it fail, then make it pass, and the tests decide when they're done. The reviewer checks the tests are honest and reviews what they don't cover.
- **`/pod:fix` PRs get the same reviewer.** They go straight to `main` with no plan around them, so each one is reviewed before it merges.

## The flow

```
/pod:plan → /pod:sprint → /pod:code
                              │
          ┌───────── per wave ┴───────────────────────────────────────┐
          │ engineers build slices in parallel worktrees               │
          │   └ each: tests + typecheck + lint + browser check         │
          │ orchestrator combines the wave in its own worktree         │
          │   └ files-owned check, merge, smoke test on the whole wave │
          │ wave PR → plan branch → merged (you, or autopilot)         │
          └────────────────────────────────────────────────────────────┘
                              │ all sprints done
          ┌───────── end of plan ─────────────────────────────────────┐
          │ final PR: plan branch → main                               │
          │ pod:reviewer: per-wave pass → whole-plan pass → filter     │
          │   pass → merge          fix → one fix pass → re-check      │
          └────────────────────────────────────────────────────────────┘
```

## What each check covers

| Check | Who | When | Catches |
|---|---|---|---|
| Test first | engineer | every slice | a success criterion not actually met — each has a test written before the code |
| Static checks | engineer | every slice | broken tests, types, lint, build |
| Edges first | engineer | every slice | a gap the spec left open in a rule — listed and tested before the code |
| Run it | engineer | every slice | the change doesn't work when used — pages in its own browser session, routes with real requests |
| Files owned | orchestrator | every wave | a slice edited files it doesn't own |
| Smoke test | orchestrator | every wave | slices that work alone but break together |
| Look check | orchestrator | every wave that changes what a user sees | pages off the plan's Look (colors or fonts it doesn't list), sideways scroll at phone width, unreadable text |
| Wave fix | orchestrator + one engineer | every wave, when needed | a defect you'd see on the combined wave that no check fails on (wrong behavior, unreadable text), proved by a measurement first — fixed before the wave PR |
| Stall watch | orchestrator | every 15 min while agents run | an agent hung in one tool call |
| CI | GitHub Actions (or your CI) | every PR | the project's own build/test/lint, secrets committed by mistake — run by something other than the agent that wrote the code |
| Mechanical merge checks | autopilot | every PR | red CI (or no checks on a repo that has CI), merge conflicts, open threads |
| Sync with `main` | orchestrator | every sprint start | the plan drifting from `main` (merge conflicts, a `/pod:fix` the plan breaks) |
| Low-confidence stop | autopilot | every wave | an engineer said it isn't sure |
| **Code review** | **pod:reviewer** | **end of plan** | bugs, security, unmet goals, missing tests, one wave breaking another, duplicated code — plus a re-run of the tests and scripted smoke checks on the final code |
| **Code review** | **pod:reviewer** | **every `/pod:fix` PR** | the task not done (or overdone), bugs, security, missing tests |

## Why no reviewer per wave

We tried two per-wave designs and dropped both:

- **A challenger** that scored every PR 0–100. It repeated the reviewer's checks at the same level, then reviewed the reviewer.
- **A pr-reviewer** on every wave PR with a fix round. It worked, but added an agent run (often two) to every wave. That's a lot of cost and time for a solo developer, when the automated gates already catch most breakage.

Real-world practice backs this. Guides on running agents in parallel put **automated gates** — tests, CI, scope checks — at each task, and keep human or AI review for when work is ready to land ([Augment Code](https://www.augmentcode.com/guides/how-to-run-a-multi-agent-coding-workspace), [MindStudio](https://www.mindstudio.ai/blog/git-worktrees-parallel-ai-coding-agents)). pod's per-wave gates match that list.

## Why the end-of-plan review reads in pieces

The obvious design — one reviewer reads the final PR's whole diff — is the weakest one:

- Review quality drops sharply after the first **200–400 lines** ([DEV](https://dev.to/code-board/why-large-pull-requests-are-killing-your-code-quality-in-2026-52ij)).
- PRs over **1,000 lines** show about **70% lower defect detection** ([DEV](https://dev.to/code-board/why-large-pull-requests-are-killing-your-code-quality-in-2026-52ij)).
- AI-written PRs already run about **2.5× larger** than human ones and wait far longer for review ([FlowVerify](https://www.flowverify.co/blog/ai-code-review-bottleneck-2026-data)).
- This isn't only a human limit: AI reviewers give much better results on a clearly scoped ~200-line change ([Graphite](https://graphite.com/blog/introducing-graphite-agent-and-pricing)).

A plan's final PR is easily thousands of lines. The fix, used by GitHub itself, is to **split one big change into a stack of small ones and review each** ([GitHub blog](https://github.blog/engineering/turn-one-giant-ai-generated-pull-request-to-a-reviewable-stack/)). pod already has that stack: every wave lands on the plan branch as its own commit. So the reviewer walks the plan branch's first-parent history and reviews each wave's diff separately, then does one whole-plan pass for what only shows across waves.

## How the reviewer works

`pod:reviewer` never edits, pushes, merges, or approves. It does run things: the only files it leaves behind are build output and caches in its own worktree.

1. **Read the ground truth** from the main repo: the plan (goals, scope, **Verification** section), every archived sprint doc for the plan (each slice's success criteria), the codebase brief, known issues, and decisions. Then **run the checks**: the smoke recipe's `Verification:` command, every scripted check it lists, and every `docs/features.md` row (browser rows in its own browser session, judging text and state, not looks). A failing check is a blocking finding.
2. **Per-wave pass.** For each first-parent commit on the plan branch (skipping docs-only commits), review `git diff <commit>^1 <commit>`:
   - **Honest tests** — each criterion's test exists, would fail if the behavior broke, and isn't weaker than the criterion.
   - **Beyond the tests** — branches, error paths, and inputs no test covers; code special-cased to pass.
   - **Bugs** — hardest at the seams between that wave's slices.
   - **Security** — injection, auth bypass, exposed secrets, unsafe deserialization.
   - **`[manual]` criteria** — the engineer said how each was checked, and the code plausibly does it.
3. **Whole-plan pass** over the full diff, for what no single wave shows:
   - **Plan goals** — the plan's Goal and Verification criteria hold on the final code.
   - **Later waves breaking earlier ones** — a shared type, route, schema, or config reshaped after something already relied on it.
   - **Duplication across waves** — the same helper written twice by different slices.
4. **Filter** ([like Claude Code Review](https://www.gend.co/blog/claude-code-review-ai-agents)): keep only findings it can point to by `file:line` with a concrete failure. Before calling anything non-blocking, it tries to write the steps that make it go wrong for a user; if it can, it's blocking. Rank them — security, then correctness, then unmet goals, then missing tests. Suspicions it checked and dropped are listed as **Dismissed**, with why, so you can overrule a call you'd otherwise never see ([pstack's `/interrogate`](https://flaviocopes.com/pstack) does the same).
5. **Post** the verdict and findings as a comment on the final PR.

Findings are either:

- **`FIX`** (blocking) — a real bug, a security hole, an unmet plan goal or success criterion, a failing check, or new behavior with no test. Wrong logic is always blocking, even in an app that only runs locally; "local only" excuses missing hardening like rate limits, not bugs.
- **`PENDING`** (non-blocking) — duplication, simpler shapes, risks it couldn't confirm. Each is tagged `now` / `before hosting` / `someday` and ends with why it isn't a `FIX`: `no repro — <what it tried>`, `product choice`, or `hardening — <what it needs>`. These go to the handoff queue and are listed for you at hand-back; the next plan can pick them up.

## The fix pass

One review pass, one fix pass, then merge — no endless loops ([Tembo](https://www.tembo.io/blog/claude-code-multi-agent-orchestration)).

1. The orchestrator cuts `<plan-slug>-fix` off the plan branch in its own worktree.
2. One `pod:engineer` fixes **exactly** the `FIX` findings, runs its usual checks, and pushes. A finding it thinks is wrong, it leaves and explains.
3. The orchestrator opens a PR from `<plan-slug>-fix` into the plan branch and merges it; the final PR updates in place.
4. The reviewer re-checks **only those fixes** (round 2).
5. Pass → merge the final PR. Still failing → it comes to you marked `review still failing` (autopilot halts at gate 2). You decide: fix by hand, merge as is, or re-plan.

## Reviewing `/pod:fix` PRs

A `/pod:fix` change skips the whole plan machinery — no sprint doc, no smoke test on a combined wave, no end-of-plan review — and lands straight on `main`. So it gets its own review, with the same reviewer and the same rules, in a lighter shape:

- **One pass, no pieces.** A fix is one small diff, so there's no per-wave or whole-plan pass. The reviewer checks it against the **task** as you gave it: done, not overdone, no bugs, no security holes, a test for the fixed behavior.
- **Reproduce first, fix the cause.** For a bug, the engineer reproduces it on the path the user hit before touching code, names the cause, and re-runs the same steps after the fix; the reviewer checks the diff fixes that cause, not just the symptom. A fix for the symptom passes its test and the bug comes back by another path ([pstack's Bug fix playbook](https://flaviocopes.com/pstack) makes the same demand).
- **Same fix pass.** Blocking findings go back to the **same engineer**, in its retained worktree; the PR updates in place; the reviewer re-checks just those fixes once.
- **Then it's yours.** The PR comes back with the verdict — `Review still failing` if the fix pass didn't clear it — and you merge.
- **Skip it on purpose: `/pod:fix --no-review <task>`.** For a typo or a one-line config value, a review costs more than it's worth, and you look at every fix PR before merging anyway. The skip is a flag you choose, never automatic by diff size: small isn't the same as safe — a one-line auth change is tiny and dangerous.

## Test first

Success criteria used to be prose, and the reviewer judged them by reading code. Now they're tests, written first:

- **The sprint-planner names a test per criterion** — `[test] <behavior> — <file> › <test name>` — and puts the test files in the slice's **Files owned**. `[manual]` is kept for what a test genuinely can't check, like visual layout, and those get checked in the browser.
- **Engineers do real TDD.** Red: write the named tests and watch them fail on an assertion — a missing module or a type error doesn't count, because the test body never ran — then commit the tests with throwing stubs and nothing else. Green: the least code that passes them. Refactor with the tests green. Any extra logic no criterion covers gets its own test first too. Engineers never weaken a test to make it pass.
- **The tests decide "done".** An engineer doesn't judge its own work by reading it; a slice is done when its criteria's tests pass along with the rest of the suite.
- **The commit order is the evidence.** Each slice's `test(<slice>):` commit lands before its implementation, so the reviewer can see test-first happened.
- **No test runner → set one up first.** The sprint-planner makes that the sprint's first, solo slice; a feature slice never invents one.

This is how spec-driven setups work — the written spec drives what gets built and checked ([GitHub Spec Kit](https://github.com/github/spec-kit)) — carried one step further, into tests that run.

**What the reviewer does with it.** Tests an agent writes for its own code can be honest and still miss things, so the reviewer does two jobs:

1. **Check the tests are honest** — each criterion's test exists, asserts the behavior (not the implementation, no mocking the unit under test), would fail if the behavior broke, and came first.
2. **Review what the tests don't cover** — branches, error paths, and inputs no test exercises; code special-cased to pass the tests' values; logic nobody asked for; bugs at the seams between slices; security, which tests rarely check.

One cost: the red test commits enter the plan branch's history, so a plain `git bisect` can land on one. Use `git bisect --first-parent`, which steps wave by wave.

## Keeping the plan branch in sync with `main`

The plan branch lives for the whole plan. Meanwhile `main` keeps moving — a `/pod:fix` lands, or you commit something yourself. Without syncing, all of that meets the plan for the first time at the final PR: the worst moment for a conflict, and the plan's code was never tested against it.

Real-world practice is to keep branches short-lived and merged often, because drift grows with time ([Atlassian](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development)). pod's plan branch can't be as short-lived as a trunk-based branch, so it does the next best thing: **at the start of every sprint** (after the first), the orchestrator merges `origin/main` into the plan branch in its own worktree, runs the smoke test on the result, and pushes. A conflict or a failing smoke test stops the run while the drift is still one sprint's worth. It merges rather than rebases, so no one ever force-pushes the plan branch.

## The feature map

The smoke recipe proves the app starts; it doesn't say how to prove a given feature still works, so each agent worked that out again, and an older feature was only re-checked if a test happened to cover it. `docs/features.md` keeps one row per user-facing feature: how a user reaches it, how an agent drives the running app, and what observable state proves it works — the feature map from pstack's verification skill ([flaviocopes.com/pstack](https://flaviocopes.com/pstack)).

- **Who writes it.** The scout starts it at init and drives each row once. The orchestrator adds rows at each wave check, where it drives the new features anyway, so parallel slices never edit the same file. A `/pod:fix` engineer edits the row in its own branch.
- **Who runs it.** Engineers and the wave check drive the rows a change touches. At plan end the reviewer drives every row, old ones included — a regression pass.
- **What the first run taught.** On a browser-only chess app, 6 of the scout's 10 rows were "run this test file" (told to prefer commands because the reviewer had no browser), and the reviewer drove 1 row — the only one a command could reach. A test file repeats `Verification:` and proves nothing about the running app, so a drive must act on the app; and the reviewer now drives browser rows itself, judging text and state but never looks. The sprint-planner had also put `docs/features.md` in one slice's files, which would force two feature slices into separate waves; it now leaves the file to the orchestrator.
- **It can't hide a bug.** A failing row is a bug unless a plan changed that feature on purpose. Editing the row to make it pass is never the fix.
- **Not a separate skill.** pstack writes a project-local `verify-<app>` skill. pod's agents already read the brief and docs, so a table in `docs/` gives them the same thing without another file to keep in sync.

## CI as a gate

Engineers run tests, types, lint, and build on their own machine, and the orchestrator runs the smoke test. That's the agent checking its own work. Real-world setups add **required CI checks** on every PR — deterministic gates (lint, test, type, build) plus scanning (secrets, dependencies) — run by something other than the code's author ([Augment Code](https://www.augmentcode.com/guides/ai-agent-pre-merge-verification)).

Before, autopilot's "every required check passes" rule was satisfied by a repo with **no CI at all** — zero checks, zero failures. Now:

- **The scout records CI** in the brief: what runs on pull requests, or `none`.
- **`/pod:init` offers a minimal workflow** when there's none: the smoke recipe's `Verification:` command on every PR, plus a secret scan. You say yes before anything is written.
- **Autopilot uses CI when it's there**: with CI, a PR with **zero** checks is not mergeable. Without it, the wave check is the gate. CI was required until the third run, where it ran 25 times and never failed: it repeats the wave check's `Verification:` command, and its own value — a clean-machine run and a secret scan — matters most once an app is hosted. So `/pod:plan` now asks whether the bootstrap should add it, recommending yes.
- In `/pod:code` you merge, so there's no hard rule — but every hand-back shows the PR's CI status.

## Where rules live

**Skill or agent.** A skill is a command the human types: it runs in their session, talks to them, and coordinates agents. An agent is a worker: it runs alone, in the background or in parallel, often with tools locked down. A worker's rules always live in an agent file, never in a skill that a general-purpose agent is told to follow. A command whose work is done by an agent is a thin skill that dispatches it, like `/pod:sprint` and `/pod:report`. Work becomes an agent only when it needs what a skill can't give: tools Claude Code itself locks down (the reviewer can't edit, the researcher has no Bash), running in parallel, its own model, or a session started with `claude --agent`. Anything that dispatches agents stays a skill, because a subagent can't start other subagents.

An agent's markdown body **is** its system prompt: Claude Code loads it when the agent starts ([Claude Code docs](https://code.claude.com/docs/en/sub-agents)). So every rule a **background agent** needs lives inside its own file — the engineer's contract in `agents/engineer.md`, the sprint doc template in `agents/sprint-planner.md`. An agent never has to remember to read a separate file, never hits a permission prompt for a file outside the project (a background agent can't answer one), and never depends on a path being filled in.

Rules only a **skill** needs sit next to that skill (`skills/autopilot/policy.md`, `skills/plan/template.md`); skills run in the main session, where reading a plugin file is fine. Skills that dispatch an agent read the fields to pass from the agent's own file. `/pod:create-wave-prompts` sessions start with `claude --agent pod:engineer`, so a hand-launched engineer gets the same instructions as a dispatched one.

## Why the rule files are short

After the third run, every agent and skill file was cut to guardrails, contracts, and the goal with its reason — about 16,900 words down to 9,900. The rule for future edits, and the sources behind it, are in the README under "Editing pod's rules".

## Keep plans small

Reviewing at the end has one real cost: a bug found then was built on for the rest of the plan, so it costs more to fix than it would have mid-plan. Long-lived branches make this worse the longer they live ([Atlassian](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development), [Ardalis](https://ardalis.com/trunk-based-development-vs-long-lived-feature-branches/)).

So `/pod:plan` aims for **at most 4 sprints per plan** (one is fine). Bigger goals become several plans in a row, each merged to `main` before the next starts. That keeps the final review readable and the plan branch short-lived.

## What the first real run changed

pod's first real run (two plans, 5 sprints, 11 waves, a Flappy Bird game with a server) worked: every plan check held, no merge conflicts, test-first in almost every slice. Reading its transcripts found three problems, each now fixed:

- **An agent hung for 1h53m and nobody noticed.** One engineer's browser call waited inside the page and never answered; the whole wave sat idle, and the engineer's report didn't mention it. A tool call with no timeout just keeps waiting, because no error ever fires to trigger recovery — the standard fix is a watchdog that checks whether the work is still producing output, not whether the process is alive ([DEV — stalled tasks](https://dev.to/bobrenze/how-ai-agents-handle-stalled-tasks-and-timeouts-lessons-from-my-production-failure-1jj9), [DEV — watchdog pattern](https://dev.to/mukesh_13/the-watchdog-pattern-keeping-a-long-running-ai-agent-alive-on-a-bare-vps-56o2), [AgentCenter](https://www.agentcenter.cloud/blogs/how-to-detect-agent-stuck-or-looping)). So: the orchestrator checks each agent's transcript file every 15 minutes and restarts one that hasn't moved; engineers keep browser calls short and report any time lost.
- **A visible defect was found twice during the waves, then left for the final review.** An engineer, and later the orchestrator, saw that the chosen pixel font made "C" read as "O" and "5" as "S". Both logged it and moved on; the final review then flagged it, costing a fix pass and a second review round. Defects cost more the later they're fixed ([Functionize](https://www.functionize.com/blog/the-cost-of-finding-bugs-later-in-the-sdlc), [ContextQA](https://contextqa.com/blog/cost-of-defects-in-software-testing/)). So: a **wave fix** — one engineer, once per wave, before the wave PR — for what the orchestrator can see on the running wave.
- **The reviewer never ran anything.** "Never run anything that writes" read as "don't run the tests"; it also filed a real bug (rejected events never resent) as non-blocking because the app only runs locally. Reading code tells you whether it looks right; running it tells you whether it works, and an AI reviewer tends to miss what the AI author missed ([TestMu](https://www.testmuai.com/blog/ai-code-review-vs-verification/), [Endor Labs](https://www.endorlabs.com/learn/ai-code-review-how-to-actually-review-code-an-agent-wrote)). So: the reviewer runs the test suite and the smoke recipe's scripted checks, and wrong logic is always blocking.

A second look at the engineers found four smaller problems in how they judged their own work:

- **"Red" meant four different things** — a failing assertion, a missing module, a type error, a stub committed with the test. A test that fails because its module doesn't exist proves nothing about its assertions: one test with a broken regex "failed first" and could never pass. Claude Code's own issue tracker records the same trap ([anthropics/claude-code#94753](https://github.com/anthropics/claude-code/issues/94753)). Now red means an assertion failed, reached through throwing stubs.
- **Logic hid in code only checked by hand.** Three slices put real logic (retries, state) in `main.ts` wiring marked `[manual]`, so it shipped untested. The long-standing fix is the **Humble Object** pattern: move the logic out of the hard-to-test part into a small testable module and leave the rest too thin to need a test ([Martin Fowler](https://martinfowler.com/bliki/HumbleObject.html), [xUnit Patterns](http://xunitpatterns.com/Humble%20Object.html)). Planner and engineer now both apply it.
- **Confidence was always high** — 17 high, 6 medium, 0 low across 23 reports, and every medium came from broken tooling, not doubt. Several "high"s hid a problem the engineer knew about. LLMs rate themselves above their results in general ([arXiv 2512.24661](https://arxiv.org/pdf/2512.24661)). So Confidence is now defined by what was checked, an open concern about your own output caps it at medium, reports list what wasn't checked, and the level goes on the status board so later reviews can compare it with what was found.
- **Screenshots hid the font problem.** Full-page phone screenshots were shrunk about 2× before the model saw them; only close-up crops showed "C" reading as "O". Vision models downscale large images and blur small text ([DEV — screenshot cropping](https://dev.to/aaroncarlisle94/i-built-a-00005-screenshot-cropper-that-saves-ai-agents-95-on-vision-llm-costs-2c41), [Hugging Face](https://huggingface.co/blog/visheratin/vlm-resolution-curse)). Visual slices now read changed text in full-size close-ups. And slices with no UI no longer run a browser check just to keep "high".

**The queue filled with FYIs.** By the end, 33 of its 51 entries were open; about two in three were engineers noting a default they chose or how a test went — nothing anyone had to act on. Noise trains people to skim past the one entry that matters, the same way noisy review bots do ([DEV — alert fatigue in code review](https://dev.to/pyor/alert-fatigue-comes-for-code-review-16kj), [TechTarget](https://www.techtarget.com/it-strategy/news/366649960/The-human-in-the-loop-is-falling-asleep)), and deferred items that sit in a pile rarely get done ([Deviera](https://deviera.dev/blog/todo-comments-technical-debt)). So engineers now split `PENDING` (someone must act) from `NOTE` (FYI, goes in the wave PR body), the reviewer tags each non-blocking finding `now` / `before hosting` / `someday`, and at plan end the orchestrator resolves what's obsolete and hands back a short sorted list instead of the raw queue.

**An empty repo couldn't start.** `/pod:init` ran the scout on a repo with no code (46k tokens for a stub, overriding the scout's own stop rule) and asked about CI with no stack to run. Then autopilot halted at once: no remote, no commit, no CI, no smoke recipe — while the plan's first sprint was the one meant to create CI and the recipe. The orchestrator ended up writing that setup by hand, outside any engineer and without tests. The standard answer is a **walking skeleton**: first build the thinnest slice that can be built, tested, and deployed end to end, then add features ([Freeman & Pryce, *Growing Object-Oriented Software*](https://www.oreilly.com/library/view/growing-object-oriented-software/9780321574442/ch10.html)). Now `/pod:init` skips the scout and CI offer on an empty repo and checks the remote and first commit up front; the plan's first sprint opens with a `B1` bootstrap slice (skeleton, test runner, smoke recipe, CI workflow), and preflight accepts the missing recipe and CI until that wave lands.

**The look was left to chance.** The first plan never styled anything; the second asked for a restyle and the engineers picked a direction on their own. Left without constraints, AI agents fall back to the most common patterns they know — the "generic AI UI" problem — and the fix practitioners converge on is a **design brief before any code**: a one-line visual thesis, a palette, a type pairing, a layout, fixed up front and handed to every agent ([Elkholy — the anti-slop framework](https://moelkholy1995.medium.com/beyond-make-it-beautiful-the-anti-slop-framework-for-ai-frontend-craftsmanship-c99bbee6c994), [gu-log — stop letting AI default to generic templates](https://gu-log.vercel.app/en/posts/en-gp-130-20260327-emanueledpt-codex-ui-guide/)). So `/pod:plan` now uses the `frontend-design` skill to show the human three directions on one preview page and records the pick as the plan's `## Look`; a look-foundation slice turns it into design tokens once; every UI slice invokes `frontend-design` and uses only the tokens; and the wave check treats "ignores the Look" as a defect to fix at the wave.

**No record of what was built, or how.** Understanding the finished run meant reading plan docs, sprint docs, PRs, the queue, and 30 transcripts. `/pod:report` now writes one self-contained HTML page at plan end — features, decisions (in the context → decision → consequence shape of an architecture decision record, [adr.github.io](https://adr.github.io/)), data structures, and the agents' timeline — built from the paper trail, which now keeps a one-line log per slice.

**The end of a plan left loose ends.** After each plan, the human had to ask "Is everything finished?", "archive the plan too", and "start the dev server so I can test it": the plan doc still said `active`, the plan-complete queue line was written after the merge and left uncommitted on `main`, and a browser page was still open. Now the orchestrator archives the plan and writes its last queue line on the plan branch *before* the merge, so the final PR carries them; checks that nothing is left running or uncommitted; and ends by offering to start the app.

The per-wave pr-reviewer stays out: the end-of-plan review found one blocking problem across both plans, and it was one the wave check had already seen.

## What the third run changed

The third run built a room booking app — a UI plus server rules — from an empty repo. Compared with the second, it took the same sprints and time, handled the queue better, and wrote smaller docs. Reading its docs, PRs, and transcripts found eight problems, each now fixed:

- **Planning stopped before anything was written.** The interview ended on "Is this right?"; the human then ran `/pod:autopilot` with no plan on disk, and the plan was later written with its Look left open, so autopilot halted before the first UI sprint. Now the summary and the look pick share one turn, the plan is written in the turn that answers it, the design draft opens itself, and the human picks the look.
- **Two engineers shared one browser.** They switched each other's tabs, and both apps used the same `session` cookie, so their logins kicked each other out — about 5 minutes lost each. Now each engineer drives its own named browser session.
- **The one blocking bug was an untested edge.** The contract said changing the day resets the pick; the code reset it only when the query changed, so after midnight the old pick carried onto the new day. The reviewer found two more edges nobody tested. Now engineers list what each rule leaves open before writing tests, and the hand-back says how each edge was handled.
- **Concerns stayed in chat.** Engineer `PENDING`s from three slices never reached the queue — one sat in the orchestrator's own list, one was turned into a `NOTE`. Now every `PENDING` is queued, and a `NOTE` describing a bug a user would hit becomes a `PENDING`.
- **Non-blocking review findings gave no reason.** None of the reviewer's 8 `PENDING`s said why it wasn't a `FIX`, and two were bugs a user could hit. It also copied old code over a tracked file to watch a test fail. Now each `PENDING` ends with its reason, a bug it can write repro steps for is a `FIX`, and old code is checked out in a separate worktree.
- **A wave fix fixed nothing.** The orchestrator misread a screenshot and sent an engineer after an overlap that couldn't happen — 78k tokens, no code changed. Meanwhile a Look check passed a theme with two colors the Look doesn't list. Now a wave fix needs a measurement proving the defect first, and the Look check compares the colors the page actually uses with the Look.
- **The shared contract said how, not what.** It spelled out exact labels, rule order, and steps; one engineer followed a step that stopped a view from updating, and that sprint doc was 32 KB against about 20 KB for the others. Now the contract states what slices agree on; how belongs to the slice that builds it.
- **Worktrees couldn't be removed on Windows.** `git worktree remove` failed with "Filename too long" in `node_modules` for five worktrees, and the only other way out — a recursive delete — is blocked by the user's permission rules. Preflight now turns on `core.longpaths`.

## What the fourth run changed

The fourth run built a shared-expenses app — 27 slices, twice the third — on the trimmed rules. Every run-3 fix held, and context per slice stayed flat. What it found:

- **A caught bug reached `main`.** The reviewer re-checked an easier case in round 2 and filed the real bug as a product choice. Now a reproduced bug is never a decision or default: round 2 re-runs the original repro, and the final PR waits until it's fixed.
- **Planning before setup wasted a run.** The plan now points to `/pod:init` when pod isn't set up.
- **Force had unnamed forms** (`git worktree remove --force`, recursive delete). Both are named, with what to do instead.
- **Nine engineers rediscovered the same browser limits.** The orchestrator now records tool limits in `docs/known-issues/` the first time.
- **The orchestrator hung on its own command** for 2 h 44 m. Its long commands now run in the background or with a time limit.
- **Confidence claimed unchecked work** (stand-in pages, "1280 ✓" at 929 px). Now only the real path counts, and checks record what was actually reached.
- **The orchestrator's context grows with the work, not with waste.** It reached 517k tokens over 581 turns (about 19k per slice) and never compacted. Pod's own reads, commands, and agent reports were under half of that; IDE diagnostics added 73k, and the system prompt and tool lists most of the rest. A run two or three times larger will compact, so the orchestrator re-reads its state from disk after every compaction, and `--max-runtime` has no default limit — `--max-waves` and the stall check already stop a run that goes wrong.

## Researching an idea first

`/pod:plan` used to decide scope and stack without knowing whether the idea already existed or how others built it. `pod:researcher` looks outward first, and `/pod:plan` reads its report before the interview.

- **One agent, a fixed budget.** Anthropic's research system gives a comparison-sized question one agent and 10–15 tool calls, and saves parallel subagents — about 15× the tokens — for broad questions; it added effort limits after agents ran "50 subagents for simple queries" ([Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)). So: about 12 searches and 10 page reads (`--deep`: 30 and 25), stopping early when nothing new turns up.
- **Every claim rests on a page it read.** Anthropic checks citations in a separate pass; the researcher checks its own before finishing. WebFetch returns a small model's summary, not the page ([Claude Code tools reference](https://code.claude.com/docs/en/tools-reference)), so a page "not mentioning" something is never evidence.
- **Pages are data.** Injected instructions get dangerous when an agent has private data, untrusted content, and a way to send data out ([Simon Willison — the lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/), [OWASP LLM01](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)). The researcher has no Bash, reads no local files beyond its report and brief, and never puts local content into a search or URL.
- **Brainstorm after the evidence.** The report ends with ideas to consider and questions for the plan, brainstormed only once the search is done so they grow from what exists. Ideas are labelled as ideas, never as facts, and `/pod:plan` starts its interview from those questions.
- **Clarify only when vague.** Deep-research tools ask scoping questions up front ([OpenAI — deep research](https://developers.openai.com/api/docs/guides/deep-research), [open_deep_research](https://github.com/langchain-ai/open_deep_research)); the skill asks up to three, in your session, since a background agent can't ask.

## One-way doors and interface-only tests

- **Human attention goes where a change can't be undone.** Bezos splits decisions into one-way doors (careful, slow) and two-way doors (fast), and warns that treating two-way doors like one-way ones causes slowness ([rcmlabs](https://rcmlabs.io/blog/one-way-door-two-way-door-type-1-type-2-decisions/)). So the sprint-planner marks slices that destroy or migrate data, send to real people, move money, change auth, break a public API, or touch secrets or production. Autopilot leaves those waves to you; everything else goes ahead. Real agent disasters came from too much access, not misjudged changes ([Zenity](https://zenity.io/blog/current-events/ai-agent-database-deletion-pocketos)), so engineers never touch real users, money, or production.
- **Tests go through the public interface.** Tests that only call a module's public entry points survive a refactor of its insides — Beck's "structure-insensitive" property ([Test Desiderata](https://testdesiderata.com/)). Agents over-mock (36% of agent commits add mocks, against 26% for people, [arXiv 2602.00409](https://arxiv.org/abs/2602.00409)), so tests fake only what the app doesn't control. No folder layout is required: no evidence was found that a spec/src split helps agents.

## Choices we made on purpose

- **Few agent roles.** The orchestrator checks each wave itself and `/pod:plan` drafts the look itself, rather than handing either to a new checker or designer agent. Each new role adds handoffs and another contract to keep in sync, and the gain (a smaller orchestrator context) didn't justify it.
- **One reviewer, not several in parallel.** Claude Code Review runs several reviewers at once, one per concern, then filters. More thorough, but costs several times more; one agent reading small pieces gets most of the benefit. Revisit if end-of-plan reviews start missing things.
- **Trust the engineers per wave.** Anthropic's advice is to start simple and add agent steps only when simpler setups fall short ([Anthropic](https://www.anthropic.com/engineering/building-effective-agents)). If bugs keep slipping through waves into the final review, the per-wave pr-reviewer is the step to bring back.
- **The fix pass merges its own PR.** It only touches files the reviewer named, and the whole final PR still comes to you (or passes autopilot's checks) before reaching `main`.
- **The reviewer never fixes code itself.** Its value is independence: a fix it committed would reach `main` unreviewed. Fixes go to an engineer, and the reviewer re-checks them.
- **No coding-standards file or `/retro` yet.** Conventions live in the brief's Stack & conventions, and growing instruction files tend to cost more than they help. Revisit when one project runs several plans and the same review findings keep coming back.

## Sources

- [Augment Code — How to run a multi-agent coding workspace](https://www.augmentcode.com/guides/how-to-run-a-multi-agent-coding-workspace)
- [MindStudio — Git worktrees for parallel AI coding agents](https://www.mindstudio.ai/blog/git-worktrees-parallel-ai-coding-agents)
- [DEV — Why large pull requests are killing your code quality](https://dev.to/code-board/why-large-pull-requests-are-killing-your-code-quality-in-2026-52ij)
- [FlowVerify — The AI code review bottleneck, by the numbers](https://www.flowverify.co/blog/ai-code-review-bottleneck-2026-data)
- [Graphite — Introducing Graphite Agent](https://graphite.com/blog/introducing-graphite-agent-and-pricing)
- [GitHub blog — Turn one giant AI-generated PR into a reviewable stack](https://github.blog/engineering/turn-one-giant-ai-generated-pull-request-to-a-reviewable-stack/)
- [gend.co — Claude Code Review: multi-agent AI for better PRs](https://www.gend.co/blog/claude-code-review-ai-agents)
- [Tembo — Claude Code multi-agent orchestration](https://www.tembo.io/blog/claude-code-multi-agent-orchestration)
- [Anthropic — Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Atlassian — Trunk-based development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development)
- [Ardalis — Trunk-based development vs long-lived feature branches](https://ardalis.com/trunk-based-development-vs-long-lived-feature-branches/)
- [DEV — How AI agents handle stalled tasks and timeouts](https://dev.to/bobrenze/how-ai-agents-handle-stalled-tasks-and-timeouts-lessons-from-my-production-failure-1jj9)
- [DEV — The watchdog pattern for long-running AI agents](https://dev.to/mukesh_13/the-watchdog-pattern-keeping-a-long-running-ai-agent-alive-on-a-bare-vps-56o2)
- [AgentCenter — How to detect when an AI agent is stuck or looping](https://www.agentcenter.cloud/blogs/how-to-detect-agent-stuck-or-looping)
- [Functionize — The cost of finding bugs later in the SDLC](https://www.functionize.com/blog/the-cost-of-finding-bugs-later-in-the-sdlc)
- [ContextQA — Cost of defects in software testing](https://contextqa.com/blog/cost-of-defects-in-software-testing/)
- [TestMu — AI code review vs verification](https://www.testmuai.com/blog/ai-code-review-vs-verification/)
- [Endor Labs — How to review code an agent wrote](https://www.endorlabs.com/learn/ai-code-review-how-to-actually-review-code-an-agent-wrote)
- [Elkholy — Beyond "make it beautiful": the anti-slop framework](https://moelkholy1995.medium.com/beyond-make-it-beautiful-the-anti-slop-framework-for-ai-frontend-craftsmanship-c99bbee6c994)
- [gu-log — Stop letting AI default to generic SaaS templates](https://gu-log.vercel.app/en/posts/en-gp-130-20260327-emanueledpt-codex-ui-guide/)
- [adr.github.io — Architectural decision records](https://adr.github.io/)
- [Freeman & Pryce — Growing Object-Oriented Software, ch. 10: The Walking Skeleton](https://www.oreilly.com/library/view/growing-object-oriented-software/9780321574442/ch10.html)
- [DEV — Alert fatigue comes for code review](https://dev.to/pyor/alert-fatigue-comes-for-code-review-16kj)
- [TechTarget — The human in the loop is falling asleep](https://www.techtarget.com/it-strategy/news/366649960/The-human-in-the-loop-is-falling-asleep)
- [Deviera — TODO comments: the silent technical debt accumulator](https://deviera.dev/blog/todo-comments-technical-debt)
- [anthropics/claude-code#94753 — Compiler errors treated as satisfying the TDD red gate](https://github.com/anthropics/claude-code/issues/94753)
- [Martin Fowler — Humble Object](https://martinfowler.com/bliki/HumbleObject.html)
- [xUnit Patterns — Humble Object](http://xunitpatterns.com/Humble%20Object.html)
- [arXiv 2512.24661 — Do large language models know what they are capable of?](https://arxiv.org/pdf/2512.24661)
- [DEV — Screenshot cropping for vision LLMs](https://dev.to/aaroncarlisle94/i-built-a-00005-screenshot-cropper-that-saves-ai-agents-95-on-vision-llm-costs-2c41)
- [Hugging Face — Breaking the resolution curse of vision-language models](https://huggingface.co/blog/visheratin/vlm-resolution-curse)
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Claude Code — Tools reference](https://code.claude.com/docs/en/tools-reference)
- [Simon Willison — The lethal trifecta for AI agents](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- [OWASP — LLM01: Prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [OpenAI — Deep research guide](https://developers.openai.com/api/docs/guides/deep-research)
- [LangChain — open_deep_research](https://github.com/langchain-ai/open_deep_research)
- [rcmlabs — One-way and two-way doors: what Bezos actually said](https://rcmlabs.io/blog/one-way-door-two-way-door-type-1-type-2-decisions/)
- [Zenity — AI agent database deletion (PocketOS)](https://zenity.io/blog/current-events/ai-agent-database-deletion-pocketos)
- [Kent Beck — Test Desiderata](https://testdesiderata.com/)
- [arXiv 2602.00409 — Are coding agents generating over-mocked tests?](https://arxiv.org/abs/2602.00409)
