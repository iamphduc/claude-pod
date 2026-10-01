# Autonomous mode policy

`/pod:autopilot` is the human's standing consent to merge PRs that clear the bar below. Anything that doesn't clear it halts the run for the human. (If `CLAUDE.md` forbids unattended merges, add an autopilot carve-out or use `/pod:code`.)

## Auto-merge criteria

A PR merges only if **all** hold:

- **CI passed, if there is CI:** when the brief's `## CI` isn't `none`, at least one check ran and every required check passes — zero checks there means CI didn't run, not a pass. No CI → the wave verification below is the gate.
- **GitHub says it's clean:** `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, no `CHANGES_REQUESTED` review, no unresolved review thread. Branch protection that requires a human approval keeps it `BLOCKED` → gate 3.
- **No low confidence:** any slice in the wave reported `Confidence: low` → withhold and halt (gate 6).
- **Final plan PR only:** the reviewer's `pass`, on the first review or after the one fix pass. Still `fix` → gate 2.

Merge with a merge commit, not squash (`gh pr merge --merge`); teardown deletes the branches. A wave PR → also delete its slice branches and mark the wave `merged`/`done`. Any failure → gate 3.

## Preflight (before `/pod:code`'s own)

No CI (the brief's `## CI` is `none`) isn't a halt: say once, at the start, that merges rest on the wave check alone and that `/pod:init` can add CI. `B1`'s `medium` Confidence is expected; `low` still halts.

## Verify every wave before its PR

On the wave head, before the wave PR opens, bring the app up and exercise the merged slices — behavior, not just a clean merge — with the smoke recipe's checks (else the project's verification command). Failure → gate 4. A defect a user would notice that nothing errors on → `/pod:code`'s **Wave fix**, not a halt.

## Halt gates

| # | Name | Trigger | Queue type |
|---|---|---|---|
| 1 | blocked-concern | `BLOCKED` from any engineer or from you (incl. an agent that stalled twice) | `BLOCKED` |
| 2 | plan-review-fail | Final plan PR still has `FIX` findings, or any reproduced bug, after the fix pass | `BLOCKED` |
| 3 | auto-merge-fail | A PR fails the auto-merge criteria, or the merge fails | `BLOCKED` |
| 4 | inter-wave-verify | Wave verification fails | `BLOCKED` |
| 5 | safety-bound | A safety bound is hit | `PENDING` |
| 6 | escalation-valve | A mergeable PR withheld for a risk signal (`Confidence: low`) | `PENDING` |
| 7 | plan-complete | No `planned` sprint row left | `PENDING` |

**Every gate halts:** append a one-line queue entry from `orchestrator` naming the gate and artifact, send a `PushNotification`, and end the turn. The queue type only labels it (`BLOCKED` = resolve before resuming; `PENDING` = acknowledge). A queue entry that only needs the human's decision is **not** a halt — notify and keep going on the value in use. Gate 7's entry is the one written on the plan branch before the final merge (`/pod:code`'s **Plan complete** step 5); don't write a second.

## Safety bounds

Hitting any → gate 5. Check them before each wave and after each archive.

- `--max-sprints=<N>` — sprints completed (default: unlimited).
- `--max-waves=<N>` — waves dispatched (default `20`).
- `--max-runtime=<duration>` — wall clock, e.g. `4h` (default `4h`). Resuming after a halt starts the clock again.

Keep the count in a line `<!-- autopilot-run: started=<ISO8601> sprints=<N> waves=<N> -->` in the active sprint doc (the plan doc between sprints; carry it over when the sprint-planner writes a new doc).
