---
name: wave-prompts
description: Use when the user types /pod:wave-prompts or asks to emit per-wave dispatch prompts to run engineers in separate Claude Code sessions (session fan-out instead of subagent dispatch).
---

Read-only and one-shot: read the sprint doc and emit one paste-ready dispatch prompt per slice in the requested wave, then stop. Do **not** dispatch subagents, create worktrees, write the status board / handoff-queue, or merge PRs.

Parse from args: the sprint slug (if any), the wave number (default `1`), and `--merge-target=<branch>` (default: origin's default branch, else `main`). If no slug is given, use the sole non-archived `docs/sprints/*.md`; if several exist, list them and stop; if none exist, tell the human to run `/pod:sprint` and stop.

## Inputs

- `docs/sprints/<slug>.md` — status board (Wave / Slice / Branch columns) + per-slice detail (scope, files owned, success criteria).
- `${CLAUDE_PLUGIN_ROOT}/docs/engineer-protocol.md` — the Required dispatch context fields each prompt must carry.

## Preflight (read-only)

Check `origin` exists (`git remote get-url origin`), the merge-target is on origin (`git ls-remote --heads origin <merge-target>`), the **plan integration branch** `<plan-slug>` (from the sprint doc's `From plan:` header) is on origin, and the wave's `Files owned` sets are pairwise disjoint (any overlap → name the two slices and the shared path; they cannot run in the same wave). If `<plan-slug>` is missing, the banner should say to create it first: `git branch <plan-slug> origin/<merge-target> && git push -u origin <plan-slug>`. On failure, print a warning banner atop your output — do not halt.

## Emit

Select the requested wave's slices (grouped by the **Wave** column). If that wave has no slices, say so and stop. Otherwise:

1. Print a header: the wave number; the slices in it; then one `git worktree add <parent>/.claude/worktrees/<slug>-<code>/ -b <branch> origin/<plan-slug>` line per slice, to be run **before** any session launches — concurrent sessions creating their own worktrees contend on one `.git`. Then the reminder — *launch one session per block **at the project root**, paste it; when all slices are pushed and green, append each session's `Concerns` lines to `docs/handoff-queue.md` (nothing else files them), integrate the wave (cut a wave head off `<plan-slug>`, merge the slice branches into it, verify, open one PR `--base <plan-slug>`), then re-run `/pod:wave-prompts <slug> <next-wave>`. After the plan's last wave, open one final PR `<plan-slug>` → `<merge-target>`.*
2. Print one fenced block per slice, filled from the sprint doc (if a slice lacks scope, files owned, or success criteria, flag it in the header instead of emitting a blank field):

   ```
   You are implementing one slice of sprint `<slug>`. Read and follow ${CLAUDE_PLUGIN_ROOT}/docs/engineer-protocol.md exactly.

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

   Your worktree is pre-created — `cd` into it (create it per the protocol only
   if it's missing), then push your branch — do NOT open a PR (the wave is
   integrated into one PR afterward). Leave the worktree
   intact (teardown: defer) so this session can apply follow-up fixes to the
   same branch; it gets removed after the wave PR merges.
   ```

   `<absolute project root>` is your cwd; `branch` is the sprint doc's Branch column. Resolve **dev ports** to literal numbers before printing: *i* is the slice's 1-based row in the status board, so row 1 gets `web 3010, api 3011`, row 2 `web 3020, api 3021`. These sessions run concurrently and nothing supervises them — no two blocks may share a port, and offset 0 (`3000`/`3001`) is reserved for whoever verifies the wave head.

Then end your turn — there is no state to resume.
