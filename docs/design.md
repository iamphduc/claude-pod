# pod design: how work gets checked

Why pod checks work where it does, what each check covers, and what we chose not to do. Written for people changing pod; agents follow their own instructions and the skills, not this file.

## The short version

- **Each wave: automated gates, no reviewer.** Engineers test their own slice and check it in the browser; the orchestrator checks file ownership and runs the smoke test on the combined wave before opening its PR. Then it merges (you, or autopilot).
- **End of plan: one reviewer, reading in pieces.** Before the final plan PR goes to `main`, `pod:reviewer` reviews each wave's diff on its own, then the plan as a whole, keeps only findings it can pin to a line, and posts them on the PR.
- **One fix pass, then merge.** An engineer fixes the blocking findings on one branch; the reviewer checks those fixes once; the PR comes back to you. No loops.
- **Keep plans small.** A few sprints each, so the end-of-plan review stays readable and late fixes stay cheap.
- **The plan branch keeps up with `main`.** At the start of each sprint, anything new on `main` is merged into the plan branch and smoke-tested, so conflicts show up small and early.
- **CI is a real gate.** Autopilot won't treat "no CI checks" as "all checks passed"; `/pod:init` offers a minimal CI workflow when a repo has none.
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
| Browser check | engineer | every slice | the slice's pages don't work |
| Files owned | orchestrator | every wave | a slice edited files it doesn't own |
| Smoke test | orchestrator | every wave | slices that work alone but break together |
| CI | GitHub Actions (or your CI) | every PR | the project's own build/test/lint, secrets committed by mistake — run by something other than the agent that wrote the code |
| Mechanical merge checks | autopilot | every PR | red or **missing** CI, merge conflicts, open threads |
| Sync with `main` | orchestrator | every sprint start | the plan drifting from `main` (merge conflicts, a `/pod:fix` the plan breaks) |
| Low-confidence stop | autopilot | every wave | an engineer said it isn't sure |
| **Code review** | **pod:reviewer** | **end of plan** | bugs, security, unmet goals, missing tests, one wave breaking another, duplicated code |
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

`pod:reviewer` is read-only: it never edits, pushes, merges, or approves.

1. **Read the ground truth** from the main repo: the plan (goals, scope, **Verification** section), every archived sprint doc for the plan (each slice's success criteria), the codebase brief, known issues, and decisions.
2. **Per-wave pass.** For each first-parent commit on the plan branch (skipping docs-only commits), review `git diff <commit>^1 <commit>`:
   - **Success criteria** — each slice in that wave meets its criteria in code, not just in its engineer's report.
   - **Bugs** — edge cases, unhandled errors, and the seams between that wave's slices.
   - **Security** — injection, auth bypass, exposed secrets, unsafe deserialization.
   - **Tests** — new behavior has a test that would fail without it.
3. **Whole-plan pass** over the full diff, for what no single wave shows:
   - **Plan goals** — the plan's Goal and Verification criteria hold on the final code.
   - **Later waves breaking earlier ones** — a shared type, route, schema, or config reshaped after something already relied on it.
   - **Duplication across waves** — the same helper written twice by different slices.
4. **Filter** ([like Claude Code Review](https://www.gend.co/blog/claude-code-review-ai-agents)): keep only findings it can point to by `file:line` with a concrete failure. Rank them — security, then correctness, then unmet goals, then missing tests. Unconfirmed worries become non-blocking.
5. **Post** the verdict and findings as a comment on the final PR.

Findings are either:

- **`FIX`** (blocking) — a real bug, a security hole, an unmet plan goal or success criterion, or new behavior with no test.
- **`PENDING`** (non-blocking) — duplication, simpler shapes, risks it couldn't confirm. These go to the handoff queue and are listed for you at hand-back; the next plan can pick them up.

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
- **Same fix pass.** Blocking findings go back to the **same engineer**, in its retained worktree; the PR updates in place; the reviewer re-checks just those fixes once.
- **Then it's yours.** The PR comes back with the verdict — `Review still failing` if the fix pass didn't clear it — and you merge.
- **Skip it on purpose: `/pod:fix --no-review <task>`.** For a typo or a one-line config value, a review costs more than it's worth, and you look at every fix PR before merging anyway. The skip is a flag you choose, never automatic by diff size: small isn't the same as safe — a one-line auth change is tiny and dangerous.

## Test first

Success criteria used to be prose, and the reviewer judged them by reading code. Now they're tests, written first:

- **The sprint-planner names a test per criterion** — `[test] <behavior> — <file> › <test name>` — and puts the test files in the slice's **Files owned**. `[manual]` is kept for what a test genuinely can't check, like visual layout, and those get checked in the browser.
- **Engineers do real TDD.** Red: write the named tests and watch them fail for the right reason, then commit the tests alone. Green: the least code that passes them. Refactor with the tests green. Any extra logic no criterion covers gets its own test first too. Engineers never weaken a test to make it pass.
- **The tests decide "done".** An engineer doesn't judge its own work by reading it; a slice is done when its criteria's tests pass along with the rest of the suite.
- **The commit order is the evidence.** Each slice's `test:` commit lands before its implementation, so the reviewer can see test-first happened.
- **No test runner → set one up first.** The sprint-planner makes that the sprint's first, solo slice; a feature slice never invents one.

This is how spec-driven setups work — the written spec drives what gets built and checked ([GitHub Spec Kit](https://github.com/github/spec-kit)) — carried one step further, into tests that run.

**What the reviewer does with it.** Tests an agent writes for its own code can be honest and still miss things, so the reviewer does two jobs:

1. **Check the tests are honest** — each criterion's test exists, asserts the behavior (not the implementation, no mocking the unit under test), would fail if the behavior broke, and came first.
2. **Review what the tests don't cover** — branches, error paths, and inputs no test exercises; code special-cased to pass the tests' values; logic nobody asked for; bugs at the seams between slices; security, which tests rarely check.

One cost: the red test commits enter the plan branch's history, so a plain `git bisect` can land on one. Use `git bisect --first-parent`, which steps wave by wave.

## Keeping the plan branch in sync with `main`

The plan branch lives for the whole plan. Meanwhile `main` keeps moving — a `/pod:fix` lands, or you commit something yourself. Without syncing, all of that meets the plan for the first time at the final PR: the worst moment for a conflict, and the plan's code was never tested against it.

Real-world practice is to keep branches short-lived and merged often, because drift grows with time ([Atlassian](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development)). pod's plan branch can't be as short-lived as a trunk-based branch, so it does the next best thing: **at the start of every sprint** (after the first), the orchestrator merges `origin/main` into the plan branch in its own worktree, runs the smoke test on the result, and pushes. A conflict or a failing smoke test stops the run while the drift is still one sprint's worth. It merges rather than rebases, so no one ever force-pushes the plan branch.

## CI as a gate

Engineers run tests, types, lint, and build on their own machine, and the orchestrator runs the smoke test. That's the agent checking its own work. Real-world setups add **required CI checks** on every PR — deterministic gates (lint, test, type, build) plus scanning (secrets, dependencies) — run by something other than the code's author ([Augment Code](https://www.augmentcode.com/guides/ai-agent-pre-merge-verification)).

Before, autopilot's "every required check passes" rule was satisfied by a repo with **no CI at all** — zero checks, zero failures. Now:

- **The scout records CI** in the brief: what runs on pull requests, or `none`.
- **`/pod:init` offers a minimal workflow** when there's none: the smoke recipe's `Verification:` command on every PR, plus a secret scan. You say yes before anything is written.
- **Autopilot requires CI**: its preflight halts if nothing runs on pull requests, and a PR with **zero** checks is not mergeable. `--no-ci` opts out, on purpose.
- In `/pod:code` you merge, so there's no hard rule — but every hand-back shows the PR's CI status.

## Where rules live

An agent's markdown body **is** its system prompt: Claude Code loads it when the agent starts ([Claude Code docs](https://code.claude.com/docs/en/sub-agents)). So every rule a **background agent** needs lives inside its own file — the engineer's contract in `agents/engineer.md`, the sprint doc template in `agents/sprint-planner.md`. An agent never has to remember to read a separate file, never hits a permission prompt for a file outside the project (a background agent can't answer one), and never depends on a path being filled in.

Rules only a **skill** needs sit next to that skill (`skills/autopilot/policy.md`, `skills/plan/template.md`); skills run in the main session, where reading a plugin file is fine. Skills that dispatch an agent read the fields to pass from the agent's own file. `/pod:create-wave-prompts` sessions start with `claude --agent pod:engineer`, so a hand-launched engineer gets the same instructions as a dispatched one.

## Keep plans small

Reviewing at the end has one real cost: a bug found then was built on for the rest of the plan, so it costs more to fix than it would have mid-plan. Long-lived branches make this worse the longer they live ([Atlassian](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development), [Ardalis](https://ardalis.com/trunk-based-development-vs-long-lived-feature-branches/)).

So `/pod:plan` aims for **2–4 sprints per plan**. Bigger goals become several plans in a row, each merged to `main` before the next starts. That keeps the final review readable and the plan branch short-lived.

## Choices we made on purpose

- **One reviewer, not several in parallel.** Claude Code Review runs several reviewers at once, one per concern, then filters. More thorough, but costs several times more; one agent reading small pieces gets most of the benefit. Revisit if end-of-plan reviews start missing things.
- **Trust the engineers per wave.** Anthropic's advice is to start simple and add agent steps only when simpler setups fall short ([Anthropic](https://www.anthropic.com/engineering/building-effective-agents)). If bugs keep slipping through waves into the final review, the per-wave pr-reviewer is the step to bring back.
- **The fix pass merges its own PR.** It only touches files the reviewer named, and the whole final PR still comes to you (or passes autopilot's checks) before reaching `main`.

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
