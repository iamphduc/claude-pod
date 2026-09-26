# Autonomous mode policy

## Auto-merge criteria

Merge any PR that clears the bar below — `/pod:autopilot` is standing consent for the run. (If `CLAUDE.md` forbids unattended merges, add an autopilot carve-out or use `/pod:code`.)

A PR is **mechanically mergeable** only if **all** hold:

- `gh pr checks <url>` reports **at least one** check, and every required check as `pass`. Zero checks is not a pass — it means nothing but the agents checked the code. (Skipped only under `--no-ci`.)
- `gh pr view <url> --json mergeable,mergeStateStatus` returns `mergeable: MERGEABLE` and `mergeStateStatus: CLEAN`.
- No reviews marked `CHANGES_REQUESTED`.
- No unresolved review threads — `gh api graphql -f query='{repository(owner:"<owner>",name:"<repo>"){pullRequest(number:<n>){reviewThreads(first:100){nodes{isResolved}}}}}'` returns no node with `isResolved: false`.

**Precondition.** Merge-target branch protection must **not** require a human approving review (else `mergeStateStatus` stays `BLOCKED` → gate 3).

**CI precondition.** CI must run on pull requests: checked once at preflight (below). `--no-ci` opts out of this and of the at-least-one-check rule — the human's explicit choice to trust the agents' own checks alone.

**Plan review (final PR only).** The final plan PR also needs `pod:reviewer`'s `pass` — on the first review or after the one fix pass. Still `fix` → halt (gate 2). Wave PRs have no reviewer: the mechanical criteria, inter-wave verification, and escalation valve are their gates.

**Escalation valve.** **Withhold the merge and halt (gate 6)** if **any** slice in the wave reported `Confidence: low`.

Otherwise merge (merge commit, not squash): `gh pr merge <url> --merge --delete-branch`. Wave PR → also delete the pushed slice branches (`git push origin --delete <branch>`), set the wave's PR cell `merged` and its slices `done`. Final plan PR → tear down `<plan-slug>`. Any failure → halt + notify (gate 3).

## Preflight (before `/pod:code`'s own preflight)

Halt at gate 3, naming what's missing, unless `--no-ci` was passed:

- The brief's `## CI` section is not `none`, **and** the repo has CI that runs on pull requests — for GitHub Actions, a file in `.github/workflows/` whose `on:` includes `pull_request`, on the merge-target's current commit.
- No CI → tell the human to run `/pod:init` (it offers a minimal workflow) or re-run with `--no-ci`.

## Halt gates

| # | Name | Trigger | Queue type |
|---|---|---|---|
| 1 | blocked-concern | `BLOCKED` concern from any engineer or from you (incl. an agent that stalled twice — `/pod:code`'s **Watch for stalls**) | `BLOCKED` |
| 2 | plan-review-fail | Final plan PR still has reviewer `FIX` findings after the fix pass | `BLOCKED` |
| 3 | auto-merge-fail | Auto-merge fails per criteria above | `BLOCKED` |
| 4 | inter-wave-verify | Inter-wave verification fails | `BLOCKED` |
| 5 | safety-bound | Safety bound hit | `PENDING` |
| 6 | escalation-valve | A mechanically-mergeable PR carries a risk signal; withheld for human review | `PENDING` |
| 7 | plan-complete | Plan complete — the next-sprint check finds no `planned` rows left in the main plan | `PENDING` |

**Every gate halts — end the turn.** `Queue type` only labels the queue entry (`BLOCKED` = resolve before resuming; `PENDING` = human can ack); both halt the run.

On halt: append a one-line `docs/handoff-queue.md` entry from `orchestrator` naming the gate and artifact, `PushNotification`, then end the turn. Gate 7 is the exception: its entry was written and committed on the plan branch before the final merge (`/pod:code`'s **Plan complete** step 5) — don't append a second one to the merge-target.

## Inter-wave verification

Verify the wave's combined slices on the wave head `<sprint-slug>-w<N>`, in its worktree, **before** opening the wave PR (the Integrate step) — pre-merge, so a bad wave never reaches the plan branch. Bring the app up and exercise the merged slices, else run the project's verification command (`Verification:` in `docs/codebase-structure.md`, else detect from repo files). Failure → halt + notify (gate 4). A defect the recipe doesn't fail on (a user would notice it, but nothing errors) → `/pod:code`'s **Wave fix** before opening the PR, not a halt. It's autopilot's only check that the wave **runs** — exercise behavior, not just a clean merge. The code itself is read once, at plan end (Plan review, above).

## Safety bounds

Three caps from `/pod:autopilot` args (plus `--no-ci`, above); hitting any → halt at gate 5:

- `--max-sprints=<N>` — sprints completed. Default: unlimited (until no `planned` rows).
- `--max-waves=<N>` — total waves dispatched. Default: `20`.
- `--max-runtime=<duration>` — wall-clock (`30m`, `4h`). Default: `4h`.

Persist a counter line `<!-- autopilot-run: started=<ISO8601> sprints=<N> waves=<N> -->` in the active sprint doc (the plan doc between sprints; move on start/archive, re-inject after `sprint-planner` writes a fresh doc). Re-derive each turn; check all bounds before each wave and after each archive.
