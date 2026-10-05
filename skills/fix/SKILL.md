---
name: fix
description: Use when the user types /pod:fix <task> or asks for an ad-hoc code change outside the sprint workflow.
---

A one-off change straight to the merge-target, outside any plan: one engineer builds it test-first, the reviewer checks it, and the human merges. Never merge it yourself. Args: the task, `--merge-target=<branch>` (default: origin's default branch; pass it on), and `--no-review` (for a change the human knows is trivial; don't pass it on).

- **Build:** dispatch `pod:engineer` with the task; it sets itself up per its **Standalone** rules and keeps its worktree until the merge. Its `Concerns` go to `docs/handoff-queue.md` (`from: engineer`, no `sprint:`); repeat any `BLOCKED` in your hand-back.
- **Review** (unless `--no-review`): dispatch `pod:reviewer` with `kind: fix` and its **Required dispatch context** — the task as given, the PR URL, the branch, the merge-target, the parent-repo path, and the engineer's worktree (read-only for it). Its `PENDING`s go to the queue (`from: reviewer`, `to: human`). On `fix`, **one fix pass**: the same engineer in the same worktree and branch with **review findings** = the `FIX` lines, then the reviewer again with `round: 2`, its round-1 findings, and the engineer's summary. Then hand back, whatever the verdict.
- **Hand back for merge:** the PR URL; `Review: pass`, `Review still failing` with its `FIX` findings, or `Review: skipped (--no-review)`; and that the worktree is kept, so the human can merge, fix by hand, or ask for more changes (the engineer updates the same PR) before replying `continue`.
- **After the merge:** not merged yet → end the turn again. Merged → from the parent repo, remove the worktree and delete the branch with `git branch -d`. No `--force` or `-D`; on failure, leave it and tell the human.
