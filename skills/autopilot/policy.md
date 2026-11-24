# Autonomous mode policy

`/pod:autopilot` is the human's standing consent to merge wave PRs and `Review fixes` PRs into the plan branch when they clear the bar below. Such a PR merges only when it meets every rule in **Auto-merge criteria**; anything else halts the run for the human. Autopilot never merges the final plan PR: the human merges it after `/pod:code`'s plan-end hand-back. (If `CLAUDE.md` forbids unattended merges, add an autopilot carve-out or use `/pod:code`.)

## Auto-merge criteria

- The project has CI: CI config in the repo (such as `.github/workflows/`), or the brief's `## CI` isn't `none`. The repo wins over the brief and `ci: off` in `pod-docs/config.md`, since anyone can add CI without `/pod:init`.
- The project has CI → at least one check ran and every required check passes. Zero checks means CI didn't run, not a pass.
- The project has CI, and its checks are still running or haven't started yet after a push → wait for them; that is neither a pass nor a fail.
- GitHub reports the PR mergeable and clean, with no requested changes and no open review thread → anything else, a required human approval included, is gate 3.
- A slice in the wave reported `Confidence: low` → gate 6.
- A wave with a one-way slice → gate 6; the human merges it.
- Every criterion holds → merge with a merge commit (not squash).

## Preflight (before `/pod:code`'s own)

- The project has no CI → the wave check is the gate. Say so once, at the start; it isn't a halt.
- Settle `/pod:code`'s browser check before the run goes unattended → a question nobody answers stalls it.

## The wave check is a gate

- A defect a user would notice that nothing errors on → `/pod:code`'s **Wave fix**, not gate 4.

## Halt gates

- **Gate 1, blocked-concern:** `BLOCKED` from any engineer or from you → `BLOCKED`.
- **Gate 3, auto-merge-fail:** a criterion fails, or the merge fails → `BLOCKED`.
- **Gate 4, inter-wave-verify:** the wave check fails → `BLOCKED`.
- **Gate 5, safety-bound:** a safety bound is hit → `PENDING`.
- **Gate 6, escalation-valve:** a criterion withholds a mergeable PR → `PENDING`.
- The plan's end is not a gate: it is `/pod:code`'s close-out entry and hand-back. Gates 2 and 7 are retired.

- Gate 1's one exception: a `BLOCKED` fixed only by a test fixture or doc no other slice owns → give it to that engineer, resume it, and tell the human.

## Every gate halts

- Each halt appends a one-line queue entry from `orchestrator` whose body starts `gate <N> (<name>): ` and names the artifact, e.g. `gate 6 (escalation-valve): wave 2 PR <url> withheld, one-way door`.
- Pod Board tells a halt from a note by the `gate <N> (<name>): ` start → no other entry starts that way.
- The queue type is the one after the gate's `→` above, never your own pick → a gate 3 is `BLOCKED` even when the fix is only "merge it after #27".
- To resume, a `PENDING` needs acknowledging, and a Pod Board answer (`**Answer (human):**`) does that. A `BLOCKED` needs resolving, per `/pod:code`'s **Answers**.

## Safety bounds

- `--max-sprints=<N>` (sprints completed, default unlimited), `--max-waves=<N>` (waves dispatched, default `20`), `--max-runtime=<duration>` (wall clock, e.g. `4h`, default unlimited).
- A resume starts the clock and the counts again.
- Keep the counts in `<!-- autopilot-run: started=<ISO8601> sprints=<N> waves=<N> -->` in the active sprint doc, or in the plan doc while none is active (between sprints and after the last one) → a new sprint doc takes it over.
