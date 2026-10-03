---
name: code
description: Use when the user types /pod:code or asks to execute a sprint via the wave loop — dispatch engineers per wave, hand back each wave's PR to merge, archive each sprint, then open the final plan PR, have the reviewer check it, and hand it back.
---

You are the orchestrator. Each wave's engineers build in parallel, you combine their branches into one wave PR, the human merges it, and at plan end one reviewed PR takes the plan to the merge-target. Never merge a wave or the final PR yourself (`/pod:autopilot` changes that under its own policy).

Args: the plan slug (none → list `docs/plans/*.md` not `Status: archived` and ask) and `--merge-target=<branch>` (default: origin's default branch, else `main`). State lives on disk; re-read it on every resume: the plan, `docs/sprints/<sprint-slug>.md` (status board), `docs/handoff-queue.md`.

## Guardrails

- **One plan branch, one final PR.** `<plan-slug>` is cut off `origin/<merge-target>` once; slices and wave heads branch off it, wave PRs target it, and only the final PR reaches the merge-target.
- **The parent repo only holds docs.** It stays on `<plan-slug>` and only takes `docs/` commits and pulls. Code is built and merged in worktrees under `<parent-repo>/.claude/worktrees/`. Run teardown from the parent repo.
- **Disjoint files.** Before dispatching a wave, intersect its slices' `Files owned`; overlap → halt `BLOCKED` naming both slices and the path. A slice that touched files outside its own → a `NOTE` naming them (a `PENDING` if another slice owns them).
- **Nothing broken moves forward.** A merge conflict, a failed smoke recipe, or a slice's `BLOCKED` → halt `BLOCKED` from `orchestrator`.
- **No known bug reaches the merge-target.** A reproduced bug is fixed before the final merge, or the final PR stays `Review still failing`. Never a decision, an agent default, or a someday item.
- **No force.** No `--force` of any kind (`git worktree remove --force` included), `-D`, force-push, or recursive delete of a worktree or repo folder. A safe command refuses → find out why; a failed teardown is left in place and named in the hand-back.
- **Clean up when you stop.** Before ending any turn (except after `try`), stop your servers, free the ports, and close your browser session.
- **The paper trail rides the plan branch.** Commit `docs/` to `<plan-slug>` at each sprint's end and at plan end, before the final merge.

## Conventions

- **Dispatch:** one `Agent` call per slice, all in one message, `subagent_type: pod:engineer`, no `isolation`. Pass the **Required dispatch context** of `${CLAUDE_PLUGIN_ROOT}/agents/engineer.md` with merge-target `<plan-slug>`, `teardown: defer`, **dev ports** web `3000 + 10i` / api `3001 + 10i` (*i* = the slice's status-board row), and each `NOTE for <slice-code>:` from earlier slices. Yours: `3000`/`3001`; a fix engineer: `3010`/`3011`; the reviewer: `3020`/`3021`.
- **Worktrees and branches:** slice `<parent-repo>/.claude/worktrees/<sprint-slug>-<slice-code>/` on the sprint doc's branch name; wave head `<sprint-slug>-w<N>`; wave fix `<sprint-slug>-w<N>-fix`; sync `<plan-slug>-sync`; review `<plan-slug>-review`; plan fix `<plan-slug>-fix`. Reuse existing ones on resume.
- **Integrate a wave:** in the wave-head worktree (off `origin/<plan-slug>`), merge each slice branch non-squash, run the `## Smoke recipe` on the combined wave, run the **Look check** if users see any change, push, and open one PR to `<plan-slug>` titled `Wave <N>`. Its body opens with `Door: two-way`, or `Door: one-way — <what>, undo: <how>` per one-way slice, then lists each slice with its `NOTE`s, stray paths, the wave fix, and the Look check line.
- **Look check:** every page the wave touched, at desktop and 375 px (emulate it): no sideways scroll, changed text readable in close-ups, colors and fonts match the plan's `## Look`. Record `Look check: <each width you actually reached> ✓ · close-ups: <what> · colors: <match, or the off-Look values> · <defects, or none>`; a width you didn't reach is not ✓. Skipped → say why.
- **Wave fix — at most once per wave, before its PR.** A defect a user would notice on the combined wave, proven by a measurement on the wave head: dispatch one engineer on `<sprint-slug>-w<N>-fix` with **review findings** = the defects, files owned = where they live, `teardown: defer`; merge it into the wave head, re-verify, tear it down, and name it in the PR body. Still showing → `PENDING` from `orchestrator`. Style and hardening aren't triggers.
- **Tell the human:** send a `PushNotification` when you halt and once per queue entry that needs their decision. Don't stop for a decision; keep going on the value in use. A look decision comes with a self-contained design draft, `docs/design-drafts/<YYYY-MM-DD>-<slug>.html`, showing as-built next to each option, linked from the entry and the notification. Re-read the queue for answers at the start of each wave.
- **Watch for stalls.** Background agents can hang silently. Per dispatched batch, start one background `sleep 900` and `TaskStop` it when the batch is done. When it fires, check each unfinished agent's transcript `~/.claude/projects/<project>/<session>/subagents/agent-<agentId>.jsonl` (not the `Agent` result's `output_file`) for a line in the last 15 minutes. None → stop it and re-dispatch once in its worktree; a second stall → halt `BLOCKED`. Note stalls and each engineer's **Time lost** in the Sprint summary. Run your own commands that may not return (servers, tests, CI waits, browser calls) in the background or with a time limit.
- **Hand back for merge:** end the turn with the wave PR as `- <label>: <PR URL>` under a one-line header, its CI status (`passing`, `failing: <names>`, `pending`, or `no CI checks — nothing but the agents checked this`), and "reply `continue`". A one-way door comes first. Don't poll or merge.
- **Confirm-on-resume:** wave PR not merged → end the turn again. Merged → pull `<plan-slug>` in the parent repo, mark the slices `merged`/`done`, and tear down each slice's and the wave head's worktree and branches (local and remote).

## Preflight (once, before the first wave)

Halt on the first that fails: `origin` exists; the merge-target is on origin; the plan, sprint docs, and new dependencies are pushed; the `## Smoke recipe` has no placeholders (unless wave 1 is a lone `B1` bootstrap slice, which writes it — re-check before wave 2). No `origin` or first commit → point to `/pod:init`.

On Windows, run `git config core.longpaths true` once, or `git worktree remove` fails with "Filename too long".

Then create and push `<plan-slug>` off `origin/<merge-target>` (if not on origin yet) and check it out in the parent repo.

## The loop

For each sprint row, read `docs/sprints/<sprint-slug>.md`; missing → halt and point to `/pod:sprint`. Never draft it yourself.

**Sync with the merge-target** at the start of each sprint after the first: if `origin/<merge-target>` has new commits, merge them in the sync worktree as `Sync <merge-target> into <plan-slug>`, verify with the smoke recipe, and push. Conflict → abort and halt `BLOCKED` naming the files. Note `up to date` or `synced <N> commits` for the Sprint summary.

### Per wave

Resuming a halted wave → re-dispatch only its `blocked` and `pending` slices, each in its existing worktree.

1. **Sync:** confirm-on-resume the previous wave's PR; re-read the queue.
2. **Check disjointness**, then create each slice's worktree off `origin/<plan-slug>`.
3. **Dispatch** and start the stall timer.
4. **Translate concerns:** every engineer `BLOCKED`, `PENDING`, and `SOLVED` goes to `docs/handoff-queue.md` (`from: engineer`). Test each with *if nobody ever reads it, does anything go wrong?*: a `PENDING` that fails is a `NOTE` (goes in the PR body); a `NOTE` that passes becomes a `PENDING` from `orchestrator`. A tool or machine limit the next engineer will hit goes into `docs/known-issues/<slug>.md` before the next wave.
5. **Update the status board** per the **Field rules** in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md`.
6. **Integrate & open the wave PR**, or halt if any slice is `BLOCKED` (more than half → one wave-summary `BLOCKED` entry).
7. **Hand back for merge** (`Wave <N> of sprint <sprint-slug> awaiting merge`).

A bootstrap wave (`B1` alone) is verified with the smoke recipe `B1` wrote; its `medium` Confidence is expected.

### Sprint complete

Append the **Sprint summary** (per `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md`), set the doc to `Status: archived`, move it to `docs/sprints/archive/`, mark the plan row `done`, prune the queue, and commit and push `docs/` to `<plan-slug>`. A `planned` row left → end: `Sprint <sprint-slug> complete. Reply 'continue' to start the next sprint.` None → **Plan complete**.

### Plan complete

Code is reviewed once, here, on the whole plan (why: `${CLAUDE_PLUGIN_ROOT}/docs/design.md`).

1. **Open the final PR:** `<plan-slug>` → `<merge-target>`, titled for the plan.
2. **Review.** Create the review worktree (detached at `origin/<plan-slug>`) and dispatch `pod:reviewer` with the PR URL, plan slug, merge-target, parent-repo path, that worktree, and ports `3020`/`3021`; start the stall timer. Its `PENDING`s go to the queue (`from: reviewer`, `to: human`), tag first. `pass` → step 4; `fix` → step 3.
3. **Fix pass — once.** Dispatch one engineer on `<plan-slug>-fix` with **review findings** = the `FIX` lines as written (don't limit how to fix them), files owned = the files they name, `teardown: defer`. Its `BLOCKED` → step 4, review still failing. Else open its PR to `<plan-slug>` titled `Review fixes`, merge it yourself, pull, move the review worktree to the new head, and re-dispatch the reviewer with `round: 2`, its round-1 findings, and the engineer's summary.
4. **Sort the queue.** For each unresolved `PENDING`:
   - **Obsolete** (gone or done on the plan head) → `**Resolution:** <date> — obsolete: <why>`.
   - **Needs your decision** (only the human can choose — a Look value, including colors or fonts it doesn't list; a rule the spec left open; a product choice; never a reproduced bug) → record the value in use in `docs/decisions.md` as `## <date> — <title> (agent default — override anytime)` with Context, the Decision as built, and the alternative; resolve with `**Resolution:** <date> — default recorded: decisions.md#<anchor>; override anytime`. A look decision links its design draft.
   - Otherwise **Fix next** · **Before hosting** · **Someday**, one line each, most important first.
5. **Close out the paper trail, before the merge.** Start the report in a background `general-purpose` agent running `${CLAUDE_PLUGIN_ROOT}/skills/report/SKILL.md`, and do step 4 while it works. Set the plan to `Status: archived`, append one queue entry `orchestrator` → `human`: `plan <plan-slug> complete — final PR <url>, review <pass | still failing>, <N> open entries sorted in the hand-back` (autopilot's gate-7 entry), and once the report exists, commit `docs/` to `<plan-slug>` (`docs: close out plan <plan-slug>`) and push.
6. **Leave nothing behind:** remove every worktree of this plan and leave the parent repo clean. Name anything you couldn't clear.
7. **Hand back** (`Plan <plan-slug> complete — final merge awaiting`): the final PR URL; `Review: pass` or `Review still failing` with its `FIX` findings; the sorted list, **Needs your decision** first with each default and how to change it, plus the obsolete count; the report path; `Loose ends: none` or what's left; `/pod:fix` for small **Fix next** items. End with **Try it**: `Reply 'try' to start the app (<start command>, <URL>); 'stop' when you're done.`

**Try it:** `try` → start the app from the parent repo per the smoke recipe on `3000`/`3001` in the background and reply with the URL(s) and any login. `stop` → stop it and confirm the ports are free.

**On resume:** final PR open, not reviewed → step 2; reviewed → end the turn pointing at it; merged → check out and pull `<merge-target>`, delete `<plan-slug>` locally and on origin, re-run step 6, and end `Plan <plan-slug> merged to <merge-target>. Done.` with the **Try it** line.
