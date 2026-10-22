# Autonomous mode policy

`/pod:autopilot` is the human's standing consent to merge PRs that clear the bar below. Anything that doesn't clear it halts the run for the human. (If `CLAUDE.md` forbids unattended merges, add an autopilot carve-out or use `/pod:code`.)

## Auto-merge criteria

A PR merges only if **all** hold:

- **CI passed, if there is CI:** when the brief's `## CI` isn't `none`, at least one check ran and every required check passes — zero checks means CI didn't run, not a pass. No CI → the wave check is the gate.
- **GitHub says it's clean:** `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, no `CHANGES_REQUESTED` review, no unresolved review thread. Branch protection that requires a human approval keeps it `BLOCKED` → gate 3.
- **No low confidence:** any slice in the wave reported `Confidence: low` → withhold and halt (gate 6).
- **No one-way door:** a wave with a slice marked one-way → withhold and halt (gate 6); the human merges it. The final plan PR too, when any wave carried a one-way slice or the plan adds a migration: merging it to the merge-target can deploy them.
- **Final plan PR only:** the reviewer's `pass`, on the first review or after the one fix pass. Still `fix` → gate 2.

Merge with a merge commit, not squash: `gh pr merge --merge`, without `--delete-branch` — teardown deletes the branches. Then mark the wave `merged`/`done`. Any merge failure → gate 3.

## Preflight (before `/pod:code`'s own)

No CI (`## CI` is `none`) isn't a halt: say once, at the start, that merges rest on the wave check alone and that `/pod:init` can add CI. `B1`'s `medium` Confidence is expected; `low` still halts.

**Browser:** settle `/pod:code`'s browser check first — once the run is unattended, a question nobody answers stalls it.

**Merge target:** no `--merge-target` given → reuse a `## <date> — merge target: <choice>` entry in `pod-docs/decisions.md`; none → ask once, with the browser check: **Staging (recommended)** — merges land on `pod-staging` and the human moves them to the default branch after looking, so unattended code never reaches it alone — or **Default branch**. Record it there under that title. With staging: no `pod-staging` on origin → cut it from origin's default branch and push it; it exists → merge origin's default branch into it first (a conflict → gate 3). Use it as the merge-target everywhere.

## The wave check is a gate

`/pod:code`'s check of the combined wave must exercise the merged slices' behavior, not just a clean merge. It fails → gate 4. A defect a user would notice that nothing errors on → `/pod:code`'s **Wave fix**, not a halt.

## Halt gates

| # | Name | Trigger | Queue type |
|---|---|---|---|
| 1 | blocked-concern | `BLOCKED` from any engineer or from you (incl. an agent that stalled twice) | `BLOCKED` |
| 2 | plan-review-fail | Final plan PR still has `FIX` findings, or any reproduced bug, after the fix pass | `BLOCKED` |
| 3 | auto-merge-fail | A PR fails the auto-merge criteria, or the merge fails | `BLOCKED` |
| 4 | inter-wave-verify | Wave verification fails | `BLOCKED` |
| 5 | safety-bound | A safety bound is hit | `PENDING` |
| 6 | escalation-valve | A mergeable PR withheld for a risk signal (`Confidence: low`, or a one-way door) | `PENDING` |
| 7 | plan-complete | No `planned` sprint row left; with staging, open (or reuse) a PR from `pod-staging` to the default branch and name it in the halt — never merge it | `PENDING` |

**Gate 1's one exception:** a `BLOCKED` whose only fix is a test fixture or doc that no other slice in the wave owns. Add the file to that engineer's files owned, resume the same engineer, and say so in your next message to the human.

**Every gate halts:** append a one-line queue entry from `orchestrator`, with `plan: <plan-slug>` in its header, naming the gate and the artifact, send a `PushNotification`, and end the turn. `BLOCKED` must be resolved before resuming; `PENDING` only needs acknowledging. A queue entry that only needs the human's decision is **not** a halt — notify and keep going on the value in use. `/pod:code`'s **Plan complete** step 5 writes its entry whatever the verdict (`review <pass | still failing>`); that is gate 7's entry, so don't write a second. A gate 2 halt adds its own.

## Safety bounds

Hitting any → gate 5. Check them before each wave and after each sprint is archived.

- `--max-sprints=<N>` — sprints completed (default: unlimited).
- `--max-waves=<N>` — waves dispatched (default `20`).
- `--max-runtime=<duration>` — wall clock, e.g. `4h` (default: unlimited).

Resuming after a halt starts the clock and the counts again. Keep the count in a line `<!-- autopilot-run: started=<ISO8601> sprints=<N> waves=<N> -->` in the active sprint doc (the plan doc between sprints; carry it over when the sprint-planner writes a new doc).
