---
name: create-wave-prompts
description: Use when the user types /pod:create-wave-prompts or asks to emit per-wave dispatch prompts to run engineers in separate Claude Code sessions (session fan-out instead of subagent dispatch).
---

For a human who wants to run each engineer in a terminal they can watch: find the sprint's current wave and print one paste-ready prompt per slice, then stop. You only write text — don't dispatch agents, create worktrees, write the queue, or merge. The one file you may change is the sprint doc's status board, and only to mark waves that are already finished.

Args: the sprint slug (none → the only active sprint doc; several → list them and stop; none at all → point to `/pod:sprint`), an optional wave number (skips detection and the board sync — say it was chosen by hand), and `--merge-target=<branch>` (default: origin's default branch).

## Checks — warn at the top, don't halt

`origin` exists; the merge-target and the plan branch `<plan-slug>` (the sprint doc's `From plan:`) are on origin — plan branch missing → show how to create it off the merge-target; the wave's `Files owned` don't overlap (name any overlap).

## The current wave

Git and GitHub are the record here, not the board, because the human runs the waves by hand. After fetching, a wave is **done** when a merged PR titled exactly `Wave <N>` targets the plan branch, or all its slice branches are already in the plan branch. The current wave is the first one not done.

- Mark done waves' slices `done` / `merged` on the board.
- A current-wave slice already pushed to origin is built: list it as `pushed — not re-emitted`.
- Every wave done → `/pod:code <plan-slug>` is next (it archives the sprint and, at plan end, opens and reviews the final PR); stop.

## Output

1. **A header:** the wave and why it's current (`Wave 2 — wave 1's PR #14 is merged`), any rows you synced, its slices (flag any whose `One-way door:` isn't `none`), and any slice missing scope, files owned, or criteria. Then one `git worktree add <parent>/.claude/worktrees/<sprint-slug>-<slice-code>/ -b <branch> origin/<plan-slug>` per slice, to run **before** any session starts (sessions creating worktrees at once fight over one `.git`). Then the steps: one terminal per block at the project root, `claude --agent pod:engineer`, paste the block; when all are pushed, add each session's `Concerns` to `docs/handoff-queue.md` and its **Features** rows to `docs/features.md`, combine the wave into one PR to `<plan-slug>` titled `Wave <N>` (its body opening with the `Door:` line, per `/pod:code`), and re-run this command after it merges.
2. **One fenced block per slice**, carrying the engineer's **Required dispatch context** from the sprint doc:

   ```
   You are implementing one slice of sprint `<sprint-slug>`.

   - sprint slug:      <sprint-slug>
   - slice code:       <slice-code>
   - branch:           <branch from the status board>
   - merge-target:     <plan-slug>
   - parent-repo:      <absolute project root>
   - worktree:         <parent>/.claude/worktrees/<sprint-slug>-<slice-code>/
   - dev ports:        web <3000+10i>, api <3001+10i>
   - scope:            <scope>
   - files owned:      <paths>
   - success criteria: <criteria>
   - teardown:         defer

   Your worktree is pre-created — cd into it. Push your branch; don't open a PR
   (the wave becomes one PR afterward). Leave the worktree in place; it's removed
   after the wave PR merges.
   ```

   Print ports as numbers: *i* is the slice's row on the status board (row 1 → `3010`/`3011`), so no two sessions share a port and `3000`/`3001` stay free for checking the wave head.
