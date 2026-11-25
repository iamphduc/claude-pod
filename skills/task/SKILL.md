---
name: task
description: Use when the user types /pod:task [task] or asks for an ad-hoc code change outside the sprint workflow.
argument-hint: "[task] [--merge-target=branch] [--no-review] [--model=model]"
---

Make one change straight to the merge-target, outside any plan: one engineer builds it test-first, the reviewer checks it, and the human gets a PR to merge.

## Args

- `[task]`: the change.
- `--merge-target=<branch>`: default: the parent repo's current branch, so a task mid-plan goes into the plan branch; a detached HEAD or a branch not on origin → origin's default branch, said in the hand-back. Pass it on.
- `--no-review`: skip the reviewer.
- `--model=<model>`: the model for every agent.

## Guardrails

- Never merge the PR: the human merges.
- Never choose a model above your own: only the human's `--model` can name one.
- Never delete a branch or worktree with `--force` or `-D`.

## Work

### Set up

- **Docs version:** a new task → check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md` first.
- **Browser:** the project has a UI → pick it as in `/pod:code`'s **Preflight** (`${CLAUDE_PLUGIN_ROOT}/skills/code/SKILL.md`); with `axi` or `none`, pass that value to the engineer and reviewer.
- **Ports:** claim a port base B as in **Preflight**, with `<parent-repo> task-<slug>` in the file → engineer B+10/B+11, reviewer B+20/B+21, your checks B/B+1. Delete the file after the merge.
- **Parked ideas:** the task touches one in `pod-docs/ideas/` → bring it back per **Bringing ideas back** in `${CLAUDE_PLUGIN_ROOT}/skills/idea/SKILL.md`.

### Build

- **Model:** `--model` → the engineer runs on it. Else small work with a clear cause → `sonnet` when your model is above Sonnet; otherwise, or when unsure → no `model`, so it runs on your model.
- **Engineer:** dispatch `pod:engineer` with the task → it sets itself up per its **Standalone** rules and keeps its worktree until the merge.
- **Edges:** write the brief → it names the edges the human would check, as they apply: the longest text, an empty and a full list, both themes, each branch.
- **Concerns:** the engineer reports `Concerns` → they go to `pod-docs/handoff-queue.md` (`from: engineer`, no `sprint:`).
- **PR:** the engineer pushes its branch, never the PR → open the PR yourself, once, with the whole body per `${CLAUDE_PLUGIN_ROOT}/skills/code/pr-template.md`, from its report and commits, starting with its **Door** line.

### Review

- **Skip:** `--no-review` → no reviewer; hand back.
- **Dispatch:** the full PR body is written, since the reviewer checks it → dispatch `pod:reviewer` (on `--model`, else no `model`) with `kind: task` and every field of its **Required dispatch context** (`${CLAUDE_PLUGIN_ROOT}/agents/reviewer.md`), as field lines `- **<field>:** <value>`, with a long item (the task, the Repro) in an indented block under its label.
- **Incomplete:** `incomplete` → dispatch again with what it names; that isn't the fix pass.
- **Pending:** the reviewer reports `PENDING`s → they go to the queue (`from: reviewer`, `to: human`), each body opening with the reviewer's label as `<when> (<why>):`, such as `someday (no repro):`.
- **Fix pass:** `fix` → one fix pass: an engineer on the build's model in the same worktree and branch (the build engineer if it can still take a message, else a new one), with the task, its ports and browser, the PR URL, and **review findings** = the `FIX` lines.
- **Round 2:** the fix pass is done → write the PR body again from its report, with its **Door** line and the fix commits (a one-way `undo:` also names them); then the reviewer again with `round: 2`, its round-1 findings, and the engineer's summary. Hand back, whatever the verdict.
- **Verdict:** the reviewer returns one → it stays in its PR comment, never in the body.

### Hand back

- **Hand back:** the PR URL and the branch it goes into; `Review: pass`, `Review still failing` with its `FIX` findings, `Review: skipped (--no-review)`, or `Review: not run on the changes since <commit>`; any `BLOCKED` the engineer reported; and that the worktree is kept, so the human can merge, fix by hand, or ask for more changes before replying `continue`.
- **Queue commit:** just before each hand-back, write this task's queue entries in the task worktree → one `docs(queue): …` commit on the task branch; a later round adds one new commit, never one per entry.
- **More changes:** the human asks for more after the hand-back → an engineer makes them as in the **Fix pass**, with no reviewer, and the hand-back says `Review: not run on the changes since <commit>`, so the human, who checks each change, isn't held up.
- **Review on request:** the human asks for a review of those changes → run **Review** again.
- **Not merged:** the human hasn't merged yet → end the turn again.
- **Merged:** from the parent repo, remove the worktree and delete the branch with `git branch -d` → on failure, leave it and tell the human.
