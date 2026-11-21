# Autonomous mode policy

`/pod:autopilot` is the human's standing consent to merge PRs that clear the bar below. A PR merges only when it meets every rule in **Auto-merge criteria**; anything else halts the run for the human. (If `CLAUDE.md` forbids unattended merges, add an autopilot carve-out or use `/pod:code`.)

## Auto-merge criteria

- The brief's `## CI` isn't `none` → at least one check ran and every required check passes. Zero checks means CI didn't run, not a pass.
- GitHub reports the PR mergeable and clean, with no requested changes and no open review thread → anything else, a required human approval included, is gate 3.
- A slice in the wave reported `Confidence: low` → gate 6.
- A wave with a one-way slice → gate 6; the human merges it.
- Any wave carried a one-way slice, or the plan adds a migration → the final plan PR goes to gate 6 too, since its merge can deploy them.
- The final plan PR also needs the reviewer's `pass`, on the first review or after the one fix pass. Still `fix` → gate 2.
- Every criterion holds → merge with a merge commit (not squash), and mark the wave `merged`/`done`.

## Preflight (before `/pod:code`'s own)

- The brief's `## CI` is `none` → the wave check is the gate. Say so once, at the start; it isn't a halt.
- Settle `/pod:code`'s browser check and the **Merge target** before the run goes unattended → a question nobody answers stalls it.

## Merge target

- No `--merge-target` given → reuse a `## <date> — merge target: <choice>` entry in `pod-docs/decisions.md`.
- No such entry → ask **Staging (recommended)** — merges land on `pod-staging` and the human moves them to the default branch after looking, so unattended code never reaches it alone — or **Default branch**, and record the answer there under that title.
- Staging chosen → `pod-staging` exists on origin, holds origin's default branch, and is the merge-target everywhere.
- Bringing `pod-staging` up to date conflicts, and every hunk only appends lines to a `pod-docs/` file → keep both sides (a line both sides added word for word stays once), and name the files in your next hand-back.
- Any other conflict while bringing `pod-staging` up to date → gate 3.

## The wave check is a gate

- A defect a user would notice that nothing errors on → `/pod:code`'s **Wave fix**, not gate 4.

## Halt gates

1. **blocked-concern:** `BLOCKED` from any engineer or from you → `BLOCKED`.
2. **plan-review-fail:** the final plan PR still has `FIX` findings, or any reproduced bug, after the fix pass → `BLOCKED`.
3. **auto-merge-fail:** a criterion fails, or the merge fails → `BLOCKED`.
4. **inter-wave-verify:** the wave check fails → `BLOCKED`.
5. **safety-bound:** a safety bound is hit → `PENDING`.
6. **escalation-valve:** a criterion withholds a mergeable PR → `PENDING`.
7. **plan-complete:** no `planned` sprint row left; with staging, open (or reuse) the staging PR per `${CLAUDE_PLUGIN_ROOT}/skills/code/pr-template.md`'s **Staging PR**, and name it in the halt; never merge it → `PENDING`.

- Gate 1's one exception: a `BLOCKED` fixed only by a test fixture or doc no other slice owns → give it to that engineer, resume it, and tell the human.

## Every gate halts

- Each halt appends a one-line queue entry from `orchestrator` whose body starts `gate <N> (<name>): ` and names the artifact, e.g. `gate 6 (escalation-valve): wave 2 PR <url> withheld, one-way door`.
- Pod Board tells a halt from a note by the `gate <N> (<name>): ` start → no other entry starts that way.
- The queue type is the one after the gate's `→` above, never your own pick → a gate 3 is `BLOCKED` even when the fix is only "merge it after #27".
- A withheld final plan PR starts `gate 6 (escalation-valve): final plan PR <url> withheld, ` → pod-flow reads that start as a PR for the human to merge, then resume.
- Then send a `PushNotification` and end the turn.
- To resume, a `PENDING` needs acknowledging, and a Pod Board answer (`**Answer (human):**`) does that. A `BLOCKED` needs resolving: an answered one is resolved once `/pod:code`'s **Answers** rule finds the cause gone.
- `/pod:code`'s **Plan complete** step 5 entry is a note → gate 2 and gate 7 still add their own halt entry.

## Safety bounds

- `--max-sprints=<N>` (sprints completed, default unlimited), `--max-waves=<N>` (waves dispatched, default `20`), `--max-runtime=<duration>` (wall clock, e.g. `4h`, default unlimited).
- Check them before each wave and after each sprint is archived → one hit is gate 5. A resume starts the clock and the counts again.
- Keep the counts in `<!-- autopilot-run: started=<ISO8601> sprints=<N> waves=<N> -->` in the active sprint doc, or in the plan doc while none is active (between sprints, after the last one, and after a gate 2 or 7 halt) → a new sprint doc takes it over.
