---
name: fix
description: Use when the user types /pod:fix <task> or asks for an ad-hoc code change outside the sprint workflow.
---

Parse `--merge-target=<branch>` from the args (default: origin's default branch) and pass it through with the rest. Parse `--no-review` too: it skips the **Review** step for a change the human knows is trivial (a typo, a one-line config value) — don't pass it to the engineer.

Dispatch the `pod:engineer` subagent via the Agent tool with the user's task description as the prompt. It sets up its own worktree and context per its **Standalone invocation** instructions and **defers teardown** — worktree stays up through merge.

From its summary, capture the **worktree path**, **branch**, and **PR URL**, and append its `Concerns` lines to `docs/handoff-queue.md` per that file's template (`from: engineer`, no `sprint:` — a fix is project-wide). Repeat any `BLOCKED` in your hand-back rather than burying it in the queue.

- **Review** (skipped with `--no-review`): once the engineer reports a PR URL, dispatch `pod:reviewer` with `kind: fix`, the PR URL, merge-target, the task as the human gave it, the branch, the parent-repo path, and the retained worktree path (it reads there, never writes). Append its `PENDING` lines to `docs/handoff-queue.md` (`from: reviewer`, `to: human`, no `sprint:`).
  - `pass` → hand back for merge.
  - `fix` → **one fix pass:** re-dispatch `pod:engineer` per **Follow-up fixes**, adding **review findings** = the `FIX` lines; then re-dispatch `pod:reviewer` with `round: 2`, its round-1 findings, and the engineer's summary. Then hand back whatever the verdict — an engineer `BLOCKED` in the fix pass also goes straight to hand-back.
- **Hand back for merge:** end the turn with the PR URL, the review verdict (`Review: pass`, `Review still failing` leading with its `FIX` findings, or `Review: skipped (--no-review)`), and a note that the worktree is retained — the human can merge it, fix by hand, or ask for more follow-up fixes, then reply `continue`.
- **Follow-up fixes (before merge):** re-dispatch `pod:engineer` with the retained **worktree path** and **branch** as explicit dispatch context so it reuses the worktree (no recreate) and updates the same PR.
- **Confirm-on-resume:** `gh pr view <URL> --json mergedAt,state`; unmerged → re-end the turn. Merged → tear down: `cd "<parent-repo>" && git worktree remove <worktree-path> && git branch -d <branch>` (no `--force`/`-D`; on failure, leave it and tell the human).
