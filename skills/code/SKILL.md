---
name: code
description: Use when the user types /pod:code or asks to execute a sprint via the wave loop — dispatch engineers per wave, hand back each wave's PR to merge, archive each sprint, then open the final plan PR, have the reviewer check it, and hand it back.
---

Work in thinking mode. Run this wave loop in the main loop; dispatch engineers and the reviewer via `Agent`.

Parse from args: the plan slug (if any) and `--merge-target=<branch>` (default: origin's default branch via `git symbolic-ref refs/remotes/origin/HEAD`, else `main`). If no plan is given, list `docs/plans/*.md` (excluding `Status: archived`) and ask which to run.

State on disk, re-read every resume: `docs/sprints/<sprint-slug>.md` (status board), `docs/handoff-queue.md` (concerns), `docs/plans/<plan-slug>.md` (master plan).

## Conventions

- **Plan integration branch:** cut `<plan-slug>` off `origin/<merge-target>` once at plan start (Preflight), push it. Slice branches and wave heads cut off it; wave PRs target it. `<merge-target>` (default `main`) only sees the plan via **one** final PR at Plan complete.
- **Dispatch:** one `Agent` call per slice in one message, **no `isolation`**; pass each the fields in the **Required dispatch context** of `${CLAUDE_PLUGIN_ROOT}/agents/engineer.md` (the engineer's own instructions) with **merge-target `<plan-slug>`**, `teardown: defer`, and its **dev ports** — web `3000 + 10i`, api `3001 + 10i`, where *i* is the slice's 1-based row in the sprint doc's status board (not its position in this dispatch batch, so a re-dispatched slice keeps its ports). Offset 0 (`3000`/`3001`) is yours for wave-head verification; slice worktrees are still up under `teardown: defer`. Engineers push their branch and don't open PRs — you integrate the wave and open its one PR.
- **Integrate a wave:** `git fetch origin`; per slice, `git diff --name-only origin/<plan-slug>...origin/<branch>` against its declared `Files owned` — anything outside → a `NOTE` in the wave PR body naming the stray paths, or a `PENDING` from `orchestrator` only if another slice or wave owns one of them. Build the wave head in **its own worktree** — never check out the wave head in the parent repo, whose `docs/` holds the uncommitted sprint state: `git worktree add <parent-repo>/.claude/worktrees/<sprint-slug>-w<N>/ -b <sprint-slug>-w<N> origin/<plan-slug>` (already there on resume → reuse it). In it, merge each pushed slice branch (`origin/<branch>`) **non-squash** (disjoint → clean; a conflict → halt `BLOCKED` from `orchestrator`); verify the combined wave there per the `## Smoke recipe` in `<parent-repo>/docs/codebase-structure.md` on ports `3000`/`3001` (failure → halt `BLOCKED`; a defect the recipe doesn't fail on → **Wave fix** first); push it, `gh pr create --base <plan-slug>` one PR titled `Wave <N>`, its body listing each slice with its `NOTE` lines (and any stray paths or wave fix). The wave-head worktree stays up until the PR merges.
- **Wave fix — once per wave, before the wave PR.** Fix now what you'd otherwise hand to the final review: it's cheapest while the wave is fresh and nothing is built on it yet. **Triggers:** a defect a user would notice on the combined wave head — wrong behavior, a broken, garbled, or unreadable page, a sprint or plan goal visibly unmet — that the smoke recipe didn't fail on; also each engineer `PENDING` that describes one (confirm it on the wave head first). **Not triggers:** style preferences, doubts you can't show on the running app, hardening outside the plan's scope — those stay `PENDING`. Push the wave head (`git push -u origin <sprint-slug>-w<N>`), then `git worktree add <parent-repo>/.claude/worktrees/<sprint-slug>-w<N>-fix -b <sprint-slug>-w<N>-fix origin/<sprint-slug>-w<N>` and dispatch one `pod:engineer`: sprint slug `<sprint-slug>`, slice code `w<N>-fix`, that branch, merge-target `<sprint-slug>-w<N>`, scope = fix exactly the listed defects and nothing else, files owned = the files they live in (overlapping a slice's is fine — the slices are done), success criteria = each defect gone (`[test]` where a test can pin it, else `[manual]` with what to look at), **review findings** = the defects, one line each with what you saw and where, dev ports `3010`/`3011`, `teardown: defer`. Its `BLOCKED` → halt as for any slice. Otherwise merge `origin/<sprint-slug>-w<N>-fix` into the wave head non-squash, re-verify, tear down the fix worktree and branch (local + remote), and name the fix in the wave PR body. A defect still showing → `PENDING` from `orchestrator` for the final review, then open the PR.
- **Watch for stalls.** A background agent can hang inside one tool call for hours and nothing tells you. Each time you dispatch agents (engineers, the reviewer), start a timer: Bash `sleep 900` with `run_in_background: true`. When it fires and any of them is still running, check each one's `output_file` (from its `Agent` result) — `find "<output_file>" -mmin -15` prints nothing → no progress for 15 minutes → **stalled**. Never read that file itself (it's the whole transcript). Restart the timer while any remain. A stalled agent: stop it (`TaskStop`) and re-dispatch it **once** — an engineer after resetting its worktree (per **Reset a worktree**), with a note that its previous run hung in a browser call; a second stall → halt `BLOCKED` from `orchestrator` naming the agent and how long it stalled. Note every stall, and each engineer's **Time lost**, in the Sprint summary.
- **Hand back for merge:** end the turn with the wave's one PR as `- <label>: <PR URL>` under a one-line header, its CI status from `gh pr checks <url>` (`passing`, `failing: <check names>`, `pending`, or `no CI checks — nothing but the agents checked this`), plus a "reply `continue`" line. Don't poll, auto-merge, or proceed.
- **Confirm-on-resume:** `gh pr view <URL> --json mergedAt,state` the wave's PR; unmerged → re-end. Once merged: sync the plan branch (`git checkout <plan-slug> && git pull origin <plan-slug>`), set its PR/Status cells to `merged`/`done`, tear down the wave — each slice's worktree (`git worktree remove` → `git branch -d` → `git push origin --delete <branch>`) and the wave head (`git worktree remove` its worktree → `git branch -d` → delete the remote branch if it still exists). No `--force`/`-D`; on failure leave it and note it.
- **Reset a worktree:** `git reset --hard origin/<plan-slug> && git clean -fd`, then re-run skipping pre-create.

## Preflight (once, before the first wave; skip on resume mid-sprint)

Before pre-creating worktrees, halt naming the first check that fails:

- `origin` remote exists (`git remote get-url origin`).
- The merge-target is on origin (`git ls-remote --heads origin <merge-target>` returns a ref).
- Every non-slice prerequisite (new dependencies, the plan/sprint docs) is committed and pushed to the merge-target.
- `docs/codebase-structure.md`'s `## Smoke recipe` is filled in — no `<!-- … -->` placeholders left. Unfilled, every engineer caps Confidence at `medium` and ships unverified, and gate 6 doesn't catch it.

Then **create the plan integration branch** (skip if `git ls-remote --heads origin <plan-slug>` exists — resuming): `git fetch origin && git branch <plan-slug> origin/<merge-target> && git push -u origin <plan-slug>`.

## The loop

For each sprint row, read `docs/sprints/<sprint-slug>.md` (re-read on resume to find the next wave); if missing → halt and tell the human to run `/pod:sprint`, never draft it yourself.

**Sync with the merge-target** (once at the start of each sprint, before its first wave; skip for the plan's first sprint — the plan branch was just cut). Anything that landed on `<merge-target>` since — a `/pod:fix`, the human's own commits — must reach the plan branch now, while the drift is small, not at the final PR.

1. `git fetch origin`. `git rev-list --count origin/<plan-slug>..origin/<merge-target>` is `0` → nothing to do; note `up to date` for the Sprint summary.
2. Otherwise, in its own worktree — never in the parent repo: `git worktree add --detach <parent-repo>/.claude/worktrees/<plan-slug>-sync origin/<plan-slug>`, then in it `git merge --no-ff origin/<merge-target> -m "Sync <merge-target> into <plan-slug>"`.
3. A conflict → `git merge --abort`, halt `BLOCKED` from `orchestrator` naming the conflicting files; leave the worktree for the human.
4. Verify the merged result per the `## Smoke recipe` in `<parent-repo>/docs/codebase-structure.md` on ports `3000`/`3001` (failure → halt `BLOCKED`, worktree left in place).
5. `git push origin HEAD:<plan-slug>` (a plain fast-forward push — never force), `git pull origin <plan-slug>` in the parent repo, tear down the sync worktree. Note `synced <N> commits` for the Sprint summary.

### Per wave (run in order)

**Resume a halted wave:** re-dispatch each `blocked` slice fresh — reset its worktree if it exists (per convention) else recreate it (step 2); dispatch (step 3) with any still-`pending` slice. Skip `pushed`, `merged`, and `done`.

1. **Sync** (skip on the first wave of the first sprint): confirm-on-resume the prior wave's PR.
2. **Check disjointness, then pre-create worktrees.** Intersect the wave's `Files owned` sets pairwise; any overlap → halt `BLOCKED` from `orchestrator` naming the two slices and the shared path, before dispatching anything. Then per slice, `git worktree add <parent-repo>/.claude/worktrees/<sprint-slug>-<slice-code>/ -b <branch-name> origin/<plan-slug>` — branch names from the sprint doc's Branch column.
3. **Dispatch** per the Dispatch convention, subagent_type `pod:engineer` for every slice, and start the stall timer (**Watch for stalls**).
4. **Translate concerns:** append each engineer's `BLOCKED`, `PENDING`, and `SOLVED` lines to `docs/handoff-queue.md` per its template (`from: engineer`). Keep its `NOTE` lines for the wave PR body; pass each `NOTE for <slice-code>:` into that slice's dispatch when it runs. An engineer `PENDING` that is plainly FYI by the engineer's own rule (nothing goes wrong if nobody reads it) → treat it as a `NOTE`.
5. **Update the status board:** set each slice's Status to `pushed` (or `blocked`) and its Confidence to the level the engineer reported, per the **Field rules** in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md`; the PR cell is filled in step 6.
6. **Integrate & open the wave PR.** Halt instead if any slice reported a `BLOCKED` concern, naming the trigger and its queue entry; when >50% of the wave ended `blocked`, first append a wave-summary `BLOCKED` entry from `orchestrator` and point the halt at that rather than at one slice. Otherwise integrate per convention — running the **Wave fix** when a defect shows — and set the wave's slices' PR cell to its URL.
7. **Hand back for merge** per convention (header `Wave <N> of sprint <sprint-slug> awaiting merge` → reply `continue` to proceed).

### Sprint complete (all waves `done`)

Waves are reviewed once, at plan end — go straight to archive.

**Archive & advance.** Append the Sprint summary (per the **Sprint summary** at the end of `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md`), flip the doc `Status:` to `archived`, and `mv` it to `docs/sprints/archive/`.
- **Update the plan & advance:** set the sprint's row in `docs/plans/<plan-slug>.md` to `done` (reshape later rows only if unresolved `PENDING`s require it — never rewrite history). Prune `docs/handoff-queue.md` per its own rule, then commit `docs/` to `<plan-slug>` and push — the sprint's whole paper trail, uncommitted until now, and the final plan PR is what carries it to `<merge-target>`. If a `planned` sprint row remains → end the turn: `Sprint <sprint-slug> complete. Reply 'continue' to start the next sprint.` If none remains → go to **Plan complete**.

### Plan complete (no `planned` sprint rows left)

The whole plan sits on `<plan-slug>`. It reaches `<merge-target>` in **one** PR, after the workflow's only code review. Why it's shaped this way: `${CLAUDE_PLUGIN_ROOT}/docs/design.md`.

1. **Open the final PR:** `gh pr create --base <merge-target> --head <plan-slug>`, titled for the plan.
2. **Review.** Pre-create a read-only checkout of the plan head: `git fetch origin && git worktree add --detach <parent-repo>/.claude/worktrees/<plan-slug>-review origin/<plan-slug>`. Dispatch `pod:reviewer` with the final PR URL, plan slug, merge-target, parent-repo path, that worktree path, and dev ports `3020`/`3021` (it runs the checks and the smoke recipe there); start the stall timer. Append its `PENDING` lines to `docs/handoff-queue.md` (`from: reviewer`, `to: human`), keeping their `now` / `before hosting` / `someday` tag at the start of the body.
   - `pass` → step 4.
   - `fix` → step 3.
3. **Fix pass — once.** `git worktree add <parent-repo>/.claude/worktrees/<plan-slug>-fix -b <plan-slug>-fix origin/<plan-slug>`. Dispatch one `pod:engineer` with: sprint slug `review`, slice code `fix`, branch `<plan-slug>-fix`, merge-target `<plan-slug>`, scope = fix exactly the `FIX` findings and nothing else, files owned = the files those findings name, success criteria = each finding resolved, **review findings** = the `FIX` lines, dev ports `3010`/`3011`, `teardown: defer`. Append its `Concerns` to the queue. Its `BLOCKED` → skip to step 4 with the review still failing. Otherwise open and merge its PR yourself — `gh pr create --base <plan-slug> --head <plan-slug>-fix --title "Review fixes"`, then `gh pr merge <url> --merge --delete-branch` — and `git pull origin <plan-slug>` in the parent repo; the final PR updates in place. Move the review checkout to the new head (`git -C <review-worktree> fetch origin && git -C <review-worktree> checkout --detach origin/<plan-slug>`) and re-dispatch `pod:reviewer` with `round: 2`, its round-1 findings, and the fix engineer's summary. Tear down the fix worktree and local branch.
4. **Sort the queue.** No sprint is left to fold open entries into, so hand the human a short list, not the raw queue. For every unresolved `PENDING` in `docs/handoff-queue.md`:
   - **Obsolete** — the code or doc it names is gone or already changed as it asked, or a later entry settled it: resolve it inline, `**Resolution:** <date> — obsolete: <why>`. Check the plan head before calling one obsolete.
   - Otherwise put it in one group: **Fix next** (wrong behavior, a doc that misleads, anything tagged `now`) · **Before hosting** (limits, abuse, scale, anything tagged `before hosting`) · **Someday** (tidy-ups, duplication, `someday`). One line each, most important first.
5. **Close out the paper trail — on the plan branch, before the merge.** Everything the plan leaves in `docs/` must ride the final PR; anything written after the merge lands uncommitted on `<merge-target>`, where you may not commit. In the parent repo (on `<plan-slug>`):
   - Set the plan doc's header to `Status: archived` (`docs/plans/<plan-slug>.md`).
   - Append one queue entry from `orchestrator` to `human`: `plan <plan-slug> complete — final PR <url>, review <pass | still failing>, <N> open entries sorted in the hand-back`. Autopilot's gate-7 entry **is** this line — don't write another after the merge.
   - Commit `docs/` to `<plan-slug>` (`docs: close out plan <plan-slug>`) and push; the final PR updates in place.
6. **Leave nothing running.** Tear down the review worktree. Then check: `git status --porcelain` in the parent repo is empty; every server you started is stopped and its ports are free (on Windows a dev server can leave child processes behind — check the ports, not just the parent process); every browser page you opened is closed; no worktree for this plan remains (`git worktree list`). Fix what you can; name anything left over in the hand-back.
7. **Hand back** (`Plan <plan-slug> complete — final merge awaiting`): the final PR URL; the review verdict — `Review: pass`, or `Review still failing` leading, with its `FIX` findings, for the human to fix by hand, merge as is, or re-plan; the sorted list from step 4, with how many entries you resolved as obsolete; and one line `Loose ends: none` (or what's left, from step 6). Suggest `/pod:fix` for small **Fix next** items and a next plan for the rest. End with **Try it**: `Reply 'try' to start the app (<start command from the smoke recipe>, <URL>); 'stop' when you're done.`

**Try it** (any time after step 7, and after the merge): `try` → in the parent repo, start the app per the `## Smoke recipe` on ports `3000`/`3001`, in the background, and reply with the URL(s) and any login from the recipe. `stop` → stop it and confirm the ports are free.

**On resume:** final PR open and no reviewer comment on it yet (`gh pr view <url> --comments`) → run step 2 first; open and reviewed → re-end the turn pointing at it; merged → sync `<merge-target>` (`git checkout <merge-target> && git pull origin <merge-target>`), tear down `<plan-slug>` (local + remote), and run step 6's checks again. End: `Plan <plan-slug> merged to <merge-target>. Done.` plus the **Try it** line.
