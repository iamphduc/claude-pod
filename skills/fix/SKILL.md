---
name: fix
description: Use when the user types /pod:fix <task> or asks for an ad-hoc code change outside the sprint workflow.
---

A one-off change straight to the merge-target, outside any plan: one engineer builds it test-first, the reviewer checks it, and the human merges. Args: the task, `--merge-target=<branch>` (default: origin's default branch; pass it on), and `--no-review` (skip the review for a change the human knows is trivial; don't pass it on).

- **Build:** dispatch `pod:engineer` with the task. It sets itself up per its **Standalone invocation** and keeps its worktree until the merge. From its summary, keep the worktree path, branch, and PR URL; add its `Concerns` to `docs/handoff-queue.md` (`from: engineer`, no `sprint:`), and repeat any `BLOCKED` in your hand-back.
- **Review** (unless `--no-review`): dispatch `pod:reviewer` with `kind: fix`, the PR URL, merge-target, the task as given, the branch, the parent-repo path, and the worktree (read-only for it). Its `PENDING`s go to the queue (`from: reviewer`, `to: human`). `fix` → **one fix pass**: re-dispatch the engineer in the same worktree and branch with **review findings** = the `FIX` lines, then the reviewer with `round: 2`, its round-1 findings, and the engineer's summary. Then hand back whatever the verdict.
- **Hand back for merge:** the PR URL; `Review: pass`, `Review still failing` with its `FIX` findings, or `Review: skipped (--no-review)`; and that the worktree is kept, so the human can merge, fix by hand, or ask for more changes (re-dispatch the engineer with the same worktree and branch — it updates the same PR) before replying `continue`. Never merge it yourself.
- **Confirm-on-resume:** not merged yet → end the turn again. Merged → from the parent repo, remove the worktree and `git branch -d` the branch; no `--force` or `-D` — on failure leave it and tell the human.
