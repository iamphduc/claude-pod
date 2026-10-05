---
name: code
description: Use when the user types /pod:code or asks to execute a sprint via the wave loop — dispatch engineers per wave, hand back each wave's PR to merge, archive each sprint, then open the final plan PR, have the reviewer check it, and hand it back.
---

You are the orchestrator. Each wave's engineers build in parallel; you combine their work into one wave PR on the plan branch and hand it to the human to merge. At plan end, one reviewed PR takes the plan to the merge-target. Never merge a wave or the final PR yourself (`/pod:autopilot` changes that under its own policy).

Args: the plan slug (none → ask, listing plans not `Status: archived`) and `--merge-target=<branch>` (default: origin's default branch). State lives on disk — the plan, `docs/sprints/<sprint-slug>.md` (status board), `docs/handoff-queue.md` — so re-read it on every resume.

## Guardrails

- **One plan branch, one final PR.** `<plan-slug>` is cut off `origin/<merge-target>` once; everything else branches off it, and only the final PR reaches the merge-target.
- **The parent repo only holds docs.** It stays on `<plan-slug>` and only takes `docs/` commits (plus pod's CI workflow at preflight) and pulls. Build, merge, review, and fix in worktrees under `<parent-repo>/.claude/worktrees/`; run teardown from the parent repo.
- **Disjoint files.** Two slices in a wave owning the same path → halt `BLOCKED` before dispatch. A slice that touched files outside its own → `NOTE` (`PENDING` if another slice owns them).
- **Nothing broken moves forward.** A merge conflict, a failed smoke recipe, or a slice's `BLOCKED` → halt `BLOCKED`.
- **No known bug reaches the merge-target.** A reproduced bug is fixed before the final merge, or the final PR stays `Review still failing` — never a decision, a default, or a someday item.
- **No force.** No `--force` (`git worktree remove --force` included), `-D`, force-push, or recursive delete of a worktree or repo. A safe command refuses → find out why; leave a failed teardown and name it.
- **Clean up when you stop.** Before ending any turn (except after `try`), stop your servers, free the ports, and close your browser session.
- **The paper trail rides the plan branch.** Commit `docs/` to `<plan-slug>` at each sprint's end and at plan end, before the final merge.

## Contracts

- **Dispatch:** all of a wave's `pod:engineer` calls in one message, no `isolation`, with the engineer's **Required dispatch context**: merge-target `<plan-slug>`, `teardown: defer`, dev ports `3000 + 10i` / `3001 + 10i` (*i* = the slice's status-board row), and any `NOTE for <slice-code>:` from earlier slices. Ports `3000`/`3001` are yours, `3010`/`3011` a fix engineer's, `3020`/`3021` the reviewer's.
- **Names:** worktrees at `<parent-repo>/.claude/worktrees/<branch>`. Slice branches come from the sprint doc; wave head `<sprint-slug>-w<N>`, wave fix `<sprint-slug>-w<N>-fix`, sync `<plan-slug>-sync`, review `<plan-slug>-review`, plan fix `<plan-slug>-fix`.
- **Wave PR:** titled `Wave <N>`, to `<plan-slug>`. The body opens with `Door: two-way`, or `Door: one-way — <what>, undo: <how>` per one-way slice, then each slice with its `NOTE`s, stray paths, any wave fix, and the Look check line.
- **Look check line:** `Look check: <each width you actually reached> ✓ · close-ups: <what> · colors: <match, or the off-Look values> · <defects, or none>`, or why it was skipped.
- **Hand back for merge:** the PR link, its CI status (`passing`, `failing: <names>`, `pending`, or `no CI checks — nothing but the agents checked this`), and "reply `continue`", then end the turn. A one-way door comes first.

## The wave loop

For each sprint row, run its sprint doc wave by wave (no doc → point to `/pod:sprint`; never write it yourself). At the start of each sprint after the first, merge any new `origin/<merge-target>` commits into the plan branch (`Sync <merge-target> into <plan-slug>`) and verify; a conflict halts.

**Each wave:** confirm the last wave PR merged and tear it down; read the queue for answers; check the slices own disjoint files; dispatch; merge the slices into the wave head (no squash); check it; open the wave PR; hand back. On resume, re-dispatch only `blocked` and `pending` slices, in their existing worktrees.

- **Check the combined wave as a user would** — run the `## Smoke recipe` and drive every `docs/features.md` row the wave touched, the engineers' new **Features** rows included; and if users see any change, run the **Look check**: every touched page at desktop and 375 px (emulate it), against the plan's `## Look`. A width you didn't reach is not ✓.
- **Wave fix — once per wave, before its PR.** A defect a user would notice, proven by a measurement on the wave head, is fixed now by one engineer on the wave-fix branch with **review findings** = the defects and files owned = where they live. Still there → `PENDING`. Style and hardening aren't triggers.
- **Concerns:** every engineer `BLOCKED`, `PENDING`, and `SOLVED` goes to the queue. Re-judge each with *if nobody ever reads it, does anything go wrong?* — a `PENDING` that fails is a `NOTE`; a `NOTE` that passes becomes your `PENDING`. A tool or machine limit the next engineer will hit goes into `docs/known-issues/` before the next wave.
- **Feature map:** once the wave PR merges, write the engineers' **Features** rows into `docs/features.md` in the parent repo. Replace an old row only when the plan changed that feature on purpose; never to make a failing row pass.
- **Status board:** keep it current per the **Field rules** in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md`.
- **Tell the human:** `PushNotification` when you halt and once per queue entry that needs their decision. Don't wait on a decision — keep going on the value in use. A look decision comes with a self-contained design draft in `docs/design-drafts/`, showing as-built next to each option.
- **Watch for stalls.** Background agents can hang silently. Time each batch with a background `sleep 900`; when it fires, check each unfinished agent's transcript (`~/.claude/projects/<project>/<session>/subagents/agent-<agentId>.jsonl`, not the `Agent` result's `output_file`) for activity in the last 15 minutes. None → stop it and re-dispatch once; twice → halt `BLOCKED`. Run your own long commands (servers, tests, CI waits, browser calls) in the background or with a time limit.

A bootstrap wave (`B1` alone) writes the smoke recipe and is checked with it; its `medium` Confidence is expected.

## Preflight

Before the first wave: the merge-target is on `origin`, and the `## Smoke recipe` is filled in (unless wave 1 is a lone `B1`, which writes it — check again before wave 2). No `origin` or no merge-target there → point to `/pod:init`. On Windows, set `git config core.longpaths true`, or worktree removal fails. Then create and push `<plan-slug>`, check it out in the parent repo, and commit any uncommitted pod setup (`docs/`, `.github/workflows/pod-ci.yml`) to it and push — never to the merge-target.

## Sprint complete

Append the **Sprint summary** (per the sprint-planner's file, with stalls, each engineer's **Time lost**, and the sync result), archive the sprint doc to `docs/sprints/archive/`, mark its plan row `done`, prune the queue per its own rule, and commit and push `docs/`. A `planned` row left → end: `Sprint <sprint-slug> complete. Reply 'continue' to start the next sprint.` None → **Plan complete**.

## Plan complete

Code is reviewed once, here, on the whole plan (why: `${CLAUDE_PLUGIN_ROOT}/docs/design.md`).

1. **Open the final PR** `<plan-slug>` → `<merge-target>`.
2. **Review:** dispatch `pod:reviewer` on a review worktree at `origin/<plan-slug>`, with the PR URL, plan slug, merge-target, parent-repo path, and ports. Its `PENDING`s go to the queue for the human. `pass` → step 4; `fix` → step 3.
3. **Fix pass — once:** one engineer on the plan-fix branch with **review findings** = the `FIX` lines as written (don't limit how to fix them) and files owned = the files they name. Merge its `Review fixes` PR yourself, move the review worktree to the new head, then re-dispatch the reviewer with `round: 2`, its round-1 findings, and the engineer's summary. Engineer `BLOCKED` → step 4, review still failing.
4. **Sort the queue** — each open `PENDING` is **Obsolete** (resolve it), **Needs your decision** (only the human can choose: a Look value, including colors or fonts it doesn't list; a rule the spec left open; a product choice; never a reproduced bug), or **Fix next** · **Before hosting** · **Someday**. For a decision, record the value in use in `docs/decisions.md` as `## <date> — <title> (agent default — override anytime)` and resolve the entry with a link to it.
5. **Close out the paper trail, before the merge:** have a background `general-purpose` agent write the report (`${CLAUDE_PLUGIN_ROOT}/skills/report/SKILL.md`), set the plan to `Status: archived`, add one queue entry `orchestrator` → `human`: `plan <plan-slug> complete — final PR <url>, review <pass | still failing>, <N> open entries sorted in the hand-back` (autopilot's gate-7 entry), and once the report exists, commit and push `docs/` (`docs: close out plan <plan-slug>`).
6. **Leave nothing behind:** no worktree of this plan left, parent repo clean. Name anything you couldn't clear.
7. **Hand back** (`Plan <plan-slug> complete — final merge awaiting`): the PR URL, the review verdict with any `FIX` findings, the sorted list (**Needs your decision** first, with each default and how to change it), the report path, loose ends, and **Try it**: `Reply 'try' to start the app (<start command>, <URL>); 'stop' when you're done.`

**Try it:** `try` → start the app from the parent repo on `3000`/`3001` and reply with the URL and any login; `stop` → stop it.

**On resume:** final PR not yet reviewed → step 2; reviewed → point at it; merged → pull `<merge-target>`, delete `<plan-slug>` locally and on origin, re-run step 6, and end `Plan <plan-slug> merged to <merge-target>. Done.` with the **Try it** line.
