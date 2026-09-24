---
name: create-wave-prompts
description: Use when the user types /pod:create-wave-prompts or asks to emit per-wave dispatch prompts to run engineers in separate Claude Code sessions (session fan-out instead of subagent dispatch).
---

One-shot: find the sprint's current wave, emit one paste-ready dispatch prompt per slice in it, then stop. The only file you write is the sprint doc's status board, and only to record waves that are already finished (see **Find the current wave**). Do **not** dispatch subagents, create worktrees, write the handoff queue, or merge PRs.

Parse from args: the sprint slug (if any), the wave number (if any — it overrides **Find the current wave**), and `--merge-target=<branch>` (default: origin's default branch, else `main`). If no slug is given, use the sole non-archived `docs/sprints/*.md`; if several exist, list them and stop; if none exist, tell the human to run `/pod:sprint` and stop.

## Inputs

- `docs/sprints/<slug>.md` — status board (Wave / Slice / Branch columns) + per-slice detail (scope, files owned, success criteria).
- `${CLAUDE_PLUGIN_ROOT}/agents/engineer.md` — its **Required dispatch context** lists the fields each prompt must carry.

## Preflight (read-only)

Check `origin` exists (`git remote get-url origin`), the merge-target is on origin (`git ls-remote --heads origin <merge-target>`), the **plan integration branch** `<plan-slug>` (from the sprint doc's `From plan:` header) is on origin, and the wave's `Files owned` sets are pairwise disjoint (any overlap → name the two slices and the shared path; they cannot run in the same wave). If `<plan-slug>` is missing, the banner should say to create it first: `git branch <plan-slug> origin/<merge-target> && git push -u origin <plan-slug>`. On failure, print a warning banner atop your output — do not halt.

## Find the current wave

The human runs this flow by hand, so the status board may be stale — git and GitHub are the record. `git fetch origin`, then walk the waves in order (the **Wave** column). A wave is **done** if either:

- a merged PR titled `Wave <N>` targets the plan branch: `gh pr list --base <plan-slug> --state merged --search "Wave <N> in:title" --json number,title` returns one whose title is exactly `Wave <N>`; or
- every slice branch in the wave is already in the plan branch: `git merge-base --is-ancestor origin/<branch> origin/<plan-slug>` succeeds for each (a slice branch deleted from origin doesn't count as in).

The **current wave** is the first one not done.

- **Sync the board.** For each done wave whose slices aren't `done` yet, set their Status to `done` and PR cell to `merged` — so `/pod:code` later picks up where the human left off. Touch nothing else in the sprint doc.
- **Already pushed.** A current-wave slice whose branch is on origin (`git ls-remote --heads origin <branch>`) is already built: list it in the header as `pushed — not re-emitted`, and emit blocks only for the rest.
- **All waves done** → say so, then tell the human the next step: `/pod:code <plan-slug>` archives this sprint and moves on — at the plan's end it opens the final PR `<plan-slug>` → `<merge-target>` and runs the end-of-plan review. Emit nothing and stop.
- **A wave number in args** skips the detection (no board sync); say in the header that it was chosen by hand.

## Emit

Select the current wave's slices. If that wave has no slices, say so and stop. Otherwise:

1. Print a header: the wave number and **why it's current** (e.g. `Wave 2 — wave 1's PR #14 is merged`, or `chosen by hand`); any board rows you synced; the slices in it, marking any `pushed — not re-emitted`; then one `git worktree add <parent>/.claude/worktrees/<slug>-<code>/ -b <branch> origin/<plan-slug>` line per slice still to emit, to be run **before** any session launches — concurrent sessions creating their own worktrees contend on one `.git`. Then the reminder — *launch one session per block **at the project root** with `claude --agent pod:engineer` (the session then runs with the engineer's full instructions), paste the block; when all slices are pushed and green, append each session's `Concerns` lines to `docs/handoff-queue.md` (nothing else files them), integrate the wave (cut a wave head off `<plan-slug>`, merge the slice branches into it, verify, open one PR `--base <plan-slug>`), then re-run `/pod:create-wave-prompts` — it finds the next wave on its own once this wave's PR is merged.*
2. Print one fenced block per slice, filled from the sprint doc (if a slice lacks scope, files owned, or success criteria, flag it in the header instead of emitting a blank field):

   ```
   You are implementing one slice of sprint `<slug>`.

   - sprint slug:      <slug>
   - slice code:       <code>
   - branch:           <slug>-<code>
   - merge-target:     <plan-slug>   (the plan integration branch — base your worktree on it)
   - parent-repo:      <absolute project root>
   - worktree:         <parent>/.claude/worktrees/<slug>-<code>/
   - dev ports:        web <3000+10i>, api <3001+10i>
   - scope:            <from per-slice detail>
   - files owned:      <paths>
   - success criteria: <criteria>
   - teardown:         defer

   Your worktree is pre-created — `cd` into it (create it per your instructions only
   if it's missing), then push your branch — do NOT open a PR (the wave is
   integrated into one PR afterward). Leave the worktree
   intact (teardown: defer) so this session can apply follow-up fixes to the
   same branch; it gets removed after the wave PR merges.
   ```

   `<absolute project root>` is your cwd; `branch` is the sprint doc's Branch column. Resolve **dev ports** to literal numbers before printing: *i* is the slice's 1-based row in the status board, so row 1 gets `web 3010, api 3011`, row 2 `web 3020, api 3021`. These sessions run concurrently and nothing supervises them — no two blocks may share a port, and offset 0 (`3000`/`3001`) is reserved for whoever verifies the wave head.

Then end your turn — next time, the current wave is worked out again from git and GitHub.
