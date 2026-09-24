---
name: code
description: Use when the user types /pod:code or asks to execute a sprint via the wave loop — dispatch engineers per wave, hand back each wave's PR to merge, then review, final-merge the plan branch, and archive.
---

Work in thinking mode. Run this wave loop in the main loop; dispatch engineers and the reviewer via `Agent`.

Parse from args: the plan slug (if any) and `--merge-target=<branch>` (default: origin's default branch via `git symbolic-ref refs/remotes/origin/HEAD`, else `main`). If no plan is given, list `docs/plans/*.md` (excluding `Status: archived`) and ask which to run.

State on disk, re-read every resume: `docs/sprints/<sprint-slug>.md` (status board), `docs/handoff-queue.md` (concerns), `docs/plans/<plan-slug>.md` (master plan).

## Conventions

- **Plan integration branch:** cut `<plan-slug>` off `origin/<merge-target>` once at plan start (Preflight), push it. Slice branches, wave heads, and the reviewer branch cut off it; their PRs target it. `<merge-target>` (default `main`) only sees the plan via **one** final PR at Plan complete.
- **Dispatch:** one `Agent` call per slice in one message, **no `isolation`**; pass each its context per `${CLAUDE_PLUGIN_ROOT}/docs/engineer-protocol.md` with **merge-target `<plan-slug>`**, `teardown: defer`, and its **dev ports** — web `3000 + 10i`, api `3001 + 10i`, where *i* is the slice's 1-based row in the sprint doc's status board (not its position in this dispatch batch, so a re-dispatched slice keeps its ports). Offset 0 (`3000`/`3001`) is yours for wave-head verification; slice worktrees are still up under `teardown: defer`. Engineers push their branch and don't open PRs — you integrate the wave and open its one PR.
- **Integrate a wave:** `git fetch origin`; per slice, `git diff --name-only origin/<plan-slug>...<branch>` against its declared `Files owned` — anything outside → `PENDING` from `orchestrator` naming the stray paths; cut wave head `<sprint-slug>-w<N>` off `origin/<plan-slug>`; merge each pushed slice branch into it **non-squash** (disjoint → clean; a conflict → halt `BLOCKED` from `orchestrator`); verify the combined wave on the head per the `## Smoke recipe` (failure → halt `BLOCKED`); push it, `gh pr create --base <plan-slug>` one PR titled `Wave <N>`.
- **Hand back for merge:** end the turn with the wave's one PR as `- <label>: <PR URL>` under a one-line header plus a "reply `continue`" line. Don't poll, auto-merge, or proceed.
- **Confirm-on-resume:** `gh pr view <URL> --json mergedAt,state` the wave's PR; unmerged → re-end. Once merged: sync the plan branch (`git checkout <plan-slug> && git pull origin <plan-slug>`), set its PR/Status cells to `merged`/`done`, tear down the wave — each slice's worktree (`git worktree remove` → `git branch -d` → `git push origin --delete <branch>`) and the wave head (local + remote). No `--force`/`-D`; on failure leave it and note it.
- **Reset a worktree:** `git reset --hard origin/<plan-slug> && git clean -fd`, then re-run skipping pre-create.
- **Gate-worktree resume** (reviewer): if the branch exists, find its PR — open → re-end the turn pointing at it; merged → confirm-on-resume, then skip ahead; none → reset the worktree and re-run.

## Preflight (once, before the first wave; skip on resume mid-sprint)

Before pre-creating worktrees, halt naming the first check that fails:

- `origin` remote exists (`git remote get-url origin`).
- The merge-target is on origin (`git ls-remote --heads origin <merge-target>` returns a ref).
- Every non-slice prerequisite (new dependencies, the plan/sprint docs) is committed and pushed to the merge-target.
- `docs/codebase-structure.md`'s `## Smoke recipe` is filled in — no `<!-- … -->` placeholders left. Unfilled, every engineer caps Confidence at `medium` and ships unverified, and gate 6 doesn't catch it.

Then **create the plan integration branch** (skip if `git ls-remote --heads origin <plan-slug>` exists — resuming): `git fetch origin && git branch <plan-slug> origin/<merge-target> && git push -u origin <plan-slug>`.

## The loop

For each sprint row, read `docs/sprints/<sprint-slug>.md` (re-read on resume to find the next wave); if missing → halt and tell the human to run `/pod:sprint`, never draft it yourself.

### Per wave (run in order)

**Resume a halted wave:** re-dispatch each `blocked` slice fresh — reset its worktree if it exists (per convention) else recreate it (step 2); dispatch (step 3) with any still-`pending` slice. Skip `pushed`, `merged`, and `done`.

1. **Sync** (skip on the first wave of the first sprint): confirm-on-resume the prior wave's PR.
2. **Check disjointness, then pre-create worktrees.** Intersect the wave's `Files owned` sets pairwise; any overlap → halt `BLOCKED` from `orchestrator` naming the two slices and the shared path, before dispatching anything. Then per slice, `git worktree add <parent-repo>/.claude/worktrees/<sprint-slug>-<slice-code>/ -b <branch-name> origin/<plan-slug>` — branch names from the sprint doc's Branch column.
3. **Dispatch** per the Dispatch convention, subagent_type `pod:engineer` for every slice.
4. **Translate concerns:** append each engineer's `Concerns` lines (`[TYPE] body`) to `docs/handoff-queue.md` per its template (`from: engineer`).
5. **Update the status board:** set each slice's Status to `pushed` (or `blocked`) per `${CLAUDE_PLUGIN_ROOT}/docs/templates/sprint.md`; the PR cell is filled in step 6.
6. **Integrate & open the wave PR.** Halt instead if any slice reported a `BLOCKED` concern, naming the trigger and its queue entry; when >50% of the wave ended `blocked`, first append a wave-summary `BLOCKED` entry from `orchestrator` and point the halt at that rather than at one slice. Otherwise integrate per convention and set the wave's slices' PR cell to its URL.
7. **Hand back for merge** per convention (header `Wave <N> of sprint <sprint-slug> awaiting merge` → reply `continue` to proceed).

### Sprint complete (all waves `done`)

Go straight to the reviewer — no post-merge smoke gate.

**Reviewer.** Dispatch the reviewer (subagent_type `pod:reviewer`) over the sprint's diff; resume via gate-worktree on `<sprint-slug>-review` (merged → skip to archive).
- **Dispatch:** pre-create `.claude/worktrees/<sprint-slug>-review/` off `origin/<plan-slug>`, then dispatch per convention with `slice code` = `review`, `branch` = `<sprint-slug>-review`, the sprint slug, and the sprint's merged slice branches (none merged → nothing to review, skip to archive).
- **Triage & ship:** translate `PENDING`/`SOLVED` concerns, routing a `SEVERE:` `PENDING` to the hand-back, else into the Archive gate's end-of-turn message. `PR: clean` → skip to archive, else open a PR (`--base <plan-slug>`) and hand back per convention (`Sprint <sprint-slug> review awaiting merge`).

**Archive & advance.** Append the Sprint summary (per `${CLAUDE_PLUGIN_ROOT}/docs/templates/sprint.md`), flip the doc `Status:` to `archived`, and `mv` it to `docs/sprints/archive/`.
- **Update the plan & advance:** set the sprint's row in `docs/plans/<plan-slug>.md` to `done` (reshape later rows only if unresolved `PENDING`s require it — never rewrite history). Tear down the reviewer's worktree and `<sprint-slug>-review` (local + remote), prune `docs/handoff-queue.md` per its own rule, then commit `docs/` to `<plan-slug>` and push — the sprint's whole paper trail, uncommitted until now, and the final plan PR is what carries it to `<merge-target>`. If a `planned` sprint row remains → end the turn: `Sprint <sprint-slug> complete. Reply 'continue' to start the next sprint.` If none remains → go to **Plan complete**.

### Plan complete (no `planned` sprint rows left)

The whole plan sits on `<plan-slug>`; merge it to the desired branch in **one** PR: `gh pr create --base <merge-target> --head <plan-slug>`, titled for the plan; hand back (`Plan <plan-slug> complete — final merge awaiting`). On resume once merged: sync `<merge-target>`, tear down `<plan-slug>` (local + remote). End: `Plan <plan-slug> merged to <merge-target>. Done.`
