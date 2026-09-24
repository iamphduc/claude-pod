# Autonomous mode policy

## Auto-merge criteria

Merge any PR that clears the bar below — `/pod:autopilot` is standing consent for the run. (If `CLAUDE.md` forbids unattended merges, add an autopilot carve-out or use `/pod:code`.)

A PR is **mechanically mergeable** only if **all** hold:

- `gh pr checks <url>` reports every required check as `pass`.
- `gh pr view <url> --json mergeable,mergeStateStatus` returns `mergeable: MERGEABLE` and `mergeStateStatus: CLEAN`.
- No reviews marked `CHANGES_REQUESTED`.
- No unresolved review threads — `gh api graphql -f query='{repository(owner:"<owner>",name:"<repo>"){pullRequest(number:<n>){reviewThreads(first:100){nodes{isResolved}}}}}'` returns no node with `isResolved: false`.

**Precondition.** Merge-target branch protection must **not** require a human approving review (else `mergeStateStatus` stays `BLOCKED` → gate 3).

**PR review (wave PRs).** The `pod:pr-reviewer`'s verdict is `pass` — on the first review or after the one fix round. Still `fix` after round 2 → halt (gate 8).

**Escalation valve.** **Withhold the merge and halt (gate 6)** if **any** slice in the wave reported `Confidence: low`.

Otherwise merge (merge commit, not squash): `gh pr merge <url> --merge --delete-branch`. Wave PR → also delete the pushed slice branches (`git push origin --delete <branch>`), set the wave's PR cell `merged` and its slices `done`. Final plan PR → tear down `<plan-slug>`. Any failure → halt + notify (gate 3).

## Halt gates

| # | Name | Trigger | Queue type |
|---|---|---|---|
| 1 | blocked-concern | `BLOCKED` concern from any engineer or from you | `BLOCKED` |
| 2 | severe-finding | Sprint-reviewer finding prefixed `SEVERE:` | `PENDING` |
| 3 | auto-merge-fail | Auto-merge fails per criteria above | `BLOCKED` |
| 4 | inter-wave-verify | Inter-wave verification fails | `BLOCKED` |
| 5 | safety-bound | Safety bound hit | `PENDING` |
| 6 | escalation-valve | A mechanically-mergeable PR carries a risk signal; withheld for human review | `PENDING` |
| 7 | plan-complete | Plan complete — the next-sprint check finds no `planned` rows left in the main plan | `PENDING` |
| 8 | pr-review-fail | Wave PR still has pr-reviewer `FIX` findings after the fix round | `BLOCKED` |

**Every gate halts — end the turn.** `Queue type` only labels the queue entry (`BLOCKED` = resolve before resuming; `PENDING` = human can ack); both halt the run.

On halt: append a one-line `docs/handoff-queue.md` entry from `orchestrator` naming the gate and artifact, `PushNotification`, then end the turn.

## Inter-wave verification

Verify the wave's combined slices on the wave head `<sprint-slug>-w<N>` **before** opening the wave PR (the Integrate step) — pre-merge, so a bad wave never reaches the plan branch. Bring the app up and exercise the merged slices, else run the project's verification command (`Verification:` in `docs/codebase-structure.md`, else detect from repo files). Failure → halt + notify (gate 4). It's autopilot's only check that the wave **runs** — exercise behavior, not just a clean merge. The pr-reviewer then reads the code (PR review, above).

## Safety bounds

Three caps from `/pod:autopilot` args; hitting any → halt at gate 5:

- `--max-sprints=<N>` — sprints completed. Default: unlimited (until no `planned` rows).
- `--max-waves=<N>` — total waves dispatched. Default: `20`.
- `--max-runtime=<duration>` — wall-clock (`30m`, `4h`). Default: `4h`.

Persist a counter line `<!-- autopilot-run: started=<ISO8601> sprints=<N> waves=<N> -->` in the active sprint doc (the plan doc between sprints; move on start/archive, re-inject after `sprint-planner` writes a fresh doc). Re-derive each turn; check all bounds before each wave and after each archive.
