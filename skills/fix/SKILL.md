---
name: fix
description: Use when the user types /pod:fix <task> or asks for an ad-hoc code change outside the sprint workflow.
---

A one-off change straight to the merge-target, outside any plan: one engineer builds it test-first, the reviewer checks it, and the human merges. Never merge it yourself. Args: the task, `--merge-target=<branch>` (default: origin's default branch; pass it on), `--no-review` (for a change the human knows is trivial; don't pass it on), and `--model=<sonnet | opus>`.

- **Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`.
- **Browser** (the project has a UI): as in `/pod:code`'s **Preflight** (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`); pass the mode on, and with `devtools-mcp` drive the reviewer's browser rows yourself.
- **Ports:** claim a port base B as in `/pod:code`'s **Preflight**, with `<parent-repo> fix-<slug>` in the file (free once that branch is gone). Pass the engineer ports B+10/B+11 and the reviewer B+20/B+21; your own checks run on B/B+1. Delete the file after the merge.
- **Parked ideas:** the task touches one in `pod-docs/ideas/` → bring it back per **Bringing ideas back** in `${CLAUDE_PLUGIN_ROOT}/skills/idea/SKILL.md`.
- **Build:** dispatch `pod:engineer` with the task, on `--model`, else `sonnet` for small work with a clear cause, `opus` otherwise or when unsure; it sets itself up per its **Standalone** rules and keeps its worktree until the merge. Its `Concerns` go to `pod-docs/handoff-queue.md` (`from: engineer`, no `sprint:`); repeat any `BLOCKED` in your hand-back.
- **Review** (unless `--no-review`): dispatch `pod:reviewer` with `kind: fix` and every field in its **Required dispatch context** (`${CLAUDE_PLUGIN_ROOT}/agents/reviewer.md`), written as field lines the way it says. `incomplete` → dispatch again with what it names; that isn't the fix pass. Its `PENDING`s go to the queue (`from: reviewer`, `to: human`). On `fix`, **one fix pass**: the same engineer on `opus` in the same worktree and branch with **review findings** = the `FIX` lines, then the reviewer again with `round: 2`, its round-1 findings, and the engineer's summary. Then hand back, whatever the verdict.
- **Hand back for merge:** the PR URL; `Review: pass`, `Review still failing` with its `FIX` findings, or `Review: skipped (--no-review)`; and that the worktree is kept, so the human can merge, fix by hand, or ask for more changes (the engineer updates the same PR) before replying `continue`.
- **After the merge:** not merged yet → end the turn again. Merged → from the parent repo, remove the worktree and delete the branch with `git branch -d`. No `--force` or `-D`; on failure, leave it and tell the human.
