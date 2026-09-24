# pod design: how work gets checked

Why pod checks work where it does, what each check covers, and what we chose not to do. Written for people changing pod; agents follow the skills and protocol, not this file.

## The short version

- **Each wave: automated gates, no reviewer.** Engineers test their own slice and check it in the browser; the orchestrator checks file ownership and runs the smoke test on the combined wave before opening its PR. Then it merges (you, or autopilot).
- **End of plan: one reviewer, reading in pieces.** Before the final plan PR goes to `main`, `pod:reviewer` reviews each wave's diff on its own, then the plan as a whole, keeps only findings it can pin to a line, and posts them on the PR.
- **One fix pass, then merge.** An engineer fixes the blocking findings on one branch; the reviewer checks those fixes once; the PR comes back to you. No loops.
- **Keep plans small.** A few sprints each, so the end-of-plan review stays readable and late fixes stay cheap.
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
| Static checks | engineer | every slice | broken tests, types, lint, build |
| Browser check | engineer | every slice | the slice's pages don't work |
| Files owned | orchestrator | every wave | a slice edited files it doesn't own |
| Smoke test | orchestrator | every wave | slices that work alone but break together |
| Mechanical merge checks | autopilot | every PR | red CI, merge conflicts, open threads |
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
