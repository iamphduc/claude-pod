---
name: create-wave-prompts
description: Use when the user types /pod:create-wave-prompts or asks to emit per-wave dispatch prompts to run engineers in separate Claude Code sessions (session fan-out instead of subagent dispatch).
---

For a human who wants to run each engineer in a terminal they can watch: find the sprint's current wave and print one paste-ready prompt per slice, then stop. Don't dispatch agents, create worktrees, write the queue, or merge. The only file you may touch is the sprint doc's status board, and only to mark waves that are already finished.

Args: the sprint slug (none → the only active `docs/sprints/*.md`; several → list and stop; none → point to `/pod:sprint`), an optional wave number (overrides detection), and `--merge-target=<branch>` (default: origin's default branch, else `main`).

## Checks (warn, don't halt)

`origin` exists; the merge-target and the plan branch `<plan-slug>` (from the sprint doc's `From plan:` header) are on origin — if the plan branch is missing, show how to create it off the merge-target; the wave's `Files owned` are pairwise disjoint (name any overlap — those slices can't share a wave). Print failures as a warning banner at the top.

## Find the current wave

The human runs this by hand, so git and GitHub are the record, not the board. After `git fetch origin`, a wave is **done** if a merged PR titled exactly `Wave <N>` targets the plan branch, or every slice branch in it is already in the plan branch. The current wave is the first one not done.

- Mark done waves' slices `done` / `merged` on the board if they aren't — nothing else in the doc.
- A current-wave slice whose branch is already on origin is built: list it as `pushed — not re-emitted`.
- All waves done → say `/pod:code <plan-slug>` is next (it archives the sprint, and at plan end opens and reviews the final PR), and stop.
- A wave number in args → skip detection and the board sync; say it was chosen by hand.

## Emit

1. A header: the wave and why it's current (`Wave 2 — wave 1's PR #14 is merged`); rows you synced; its slices; then one `git worktree add <parent>/.claude/worktrees/<slug>-<code>/ -b <branch> origin/<plan-slug>` per slice to emit, to run **before** any session starts (sessions creating worktrees at once contend on one `.git`). Then the steps: open one terminal per block at the project root, run `claude --agent pod:engineer`, paste the block; when all are pushed, add each session's `Concerns` to `docs/handoff-queue.md`, integrate the wave into one PR to `<plan-slug>` titled `Wave <N>`, and re-run this command after it merges.
2. One fenced block per slice, from the sprint doc (a missing scope, files owned, or criteria → flag it in the header instead):

   ```
   You are implementing one slice of sprint `<slug>`.

   - sprint slug:      <slug>
   - slice code:       <code>
   - branch:           <branch from the status board>
   - merge-target:     <plan-slug>
   - parent-repo:      <absolute project root>
   - worktree:         <parent>/.claude/worktrees/<slug>-<code>/
   - dev ports:        web <3000+10i>, api <3001+10i>
   - scope:            <scope>
   - files owned:      <paths>
   - success criteria: <criteria>
   - teardown:         defer

   Your worktree is pre-created — cd into it. Push your branch; don't open a PR
   (the wave becomes one PR afterward). Leave the worktree in place for follow-up
   fixes; it's removed after the wave PR merges.
   ```

   Print ports as numbers: *i* is the slice's row in the status board (row 1 → `3010`/`3011`). These sessions run at once with nobody supervising, so no two blocks share a port; `3000`/`3001` stay free for verifying the wave head.
