# PR body

Every PR pod opens uses this body: `/pod:code` writes the wave, `Review fixes`, and final plan PRs, `/pod:task` the task PR, and `/pod:autopilot` the staging PR. Write it with `gh pr create --body-file` or `gh pr edit --body-file`. When the code changes (a fix pass, a review verdict, a new head), write the whole body again: it describes the end state, never a log of edits.

```markdown
<Door line>

<What changes and why, 1–3 sentences: the behavior a user gets.>
<Links: the task · or plan `<plan-slug>` · sprint `<sprint-slug>` · wave <N>/<M> · or the plan's report>

## Review guide
1. <Weight> [<step>](<link>) — <what to check in it>
2. …

## Risks
<Edge cases, limits, decisions made for the human — or `None known`>

<details><summary>Proof</summary>

<The proof for this kind of PR, below.>
</details>
```

**The human reads every slot.** Fill each slot in plain words. The filled text has no `<…>` placeholder: name the thing (`a tag named after each commit`) or give its real value. A placeholder reads as a template left unfilled. To make a body plainer, rewrite inside the same sections; never drop a section or a Proof part.

**Door line:** `Door: two-way`, or one `Door: one-way — <what>, undo: <how>` per one-way change. The staging PR has none; its plan sections name the doors. `undo:` is a command the human can run on the real commits of this PR, with the check that shows it is the right one: a slice merged with a merge commit → `git revert -m 1 <its merge commit ID>` (check: `git show <ID> --stat`); a fast-forwarded slice or a task commit → `git revert <its commit IDs>`. Say whether it applies clean on this PR's head. A part that can't exist yet (such as tags a later deploy creates) says so and names the command that lists it then.

## Review guide

One numbered line per step, in the order it was built. A PR with one step gets one line.

| PR | A step is | Its link |
|---|---|---|
| Task | each commit | `pull/<n>/commits/<sha>` |
| Wave | each slice, then the wave fix | `pull/<n>/files/<wave head before its merge>..<its merge commit>`; a fast-forwarded lone slice → `<wave base>..<wave head>` |
| `Review fixes` | each `FIX` finding: its test, then its fix | `pull/<n>/files/<commit before its test>..<its fix commit>` |
| Final plan | each wave PR in order, then `Review fixes` and each sync | an earlier PR → its PR link; new commits → a range on this PR |
| Staging | each plan | its final PR |

A range starts at the commit **before** the step: GitHub leaves out the first commit of `<a>..<b>`. Short SHAs work.

Each line starts with a weight:
- **`Read`** — logic, data, a public contract, a one-way door, or security.
- **`Skim`** — tests that match their criterion, renames, moves, docs, generated files.
- **`Done`** — reviewed in an earlier PR (the final plan PR's wave steps).

A step that touches a one-way door or security is always `Read`. Name what to check in behavior terms ("the server rule, not only the hidden button"); the diff already lists the files.

## Proof

| PR | Proof |
|---|---|
| Task | **Repro** (a bug: the steps, before, cause, after) · **Tests first**: each criterion — its test — the red output — its commit · **Checks run** with results · **Browser rows** driven · **Review**: verdict, round, and its red checks, or `skipped (--no-review)` |
| Wave | Per slice: **Tests first** as above, its `NOTE`s, stray paths · then the **wave check**: checks run, browser rows, the Look check line, the wave fix · **Sent to the queue**: each entry, one line |
| `Review fixes` | Each `FIX` finding → its fix commit → the check that now passes · checks run |
| Final plan | **Review**: verdict and round · the regression pass: rows driven and results · a link to each wave PR, which holds its own proof |
| Staging | A link to each plan's final PR |

Take the proof from the agents' reports and your own checks, as written. A claim the reports don't back stays out.

## Staging PR

One `## <plan title> (<plan-slug>)` section per plan, from `skills/autopilot/policy.md`, takes the place of `## Risks`. Reusing the PR adds this plan's guide line and section and keeps the others.
