# Autonomous mode policy

`/pod:autopilot` is the human's standing consent to merge wave PRs into the plan branch when they clear the bar below. Such a PR merges only when it meets every rule in **Auto-merge criteria**; anything else stops the run the way `/pod:code` stops. Autopilot never merges the final plan PR: the human merges it after `/pod:code`'s plan-end hand-back. (If `CLAUDE.md` forbids unattended merges, add an autopilot carve-out or use `/pod:code`.)

## Auto-merge criteria

- The project has CI: CI config in the repo (such as `.github/workflows/`), or the brief's `## CI` isn't `none`. The repo wins over the brief and a `CI: none` decision, since anyone can add CI without `/pod:init`.
- The project has CI → at least one check ran and every required check passes. Zero checks means CI didn't run, not a pass.
- The project has CI, and its checks are still running or haven't started yet after a push → wait for them; that is neither a pass nor a fail.
- GitHub reports the PR mergeable and clean, with no requested changes and no open review thread. A required human approval still missing is not clean.
- No slice in the wave reported `Confidence: low`, and no slice is one-way.
- Every criterion holds → merge with a merge commit (not squash).

## Preflight (before `/pod:code`'s own)

- The project has no CI → the wave check stands in for it. Say so once, at the start; it isn't a stop.
- Settle `/pod:code`'s browser check before the run goes unattended → a question nobody answers stalls it.

## When the bar fails

- A criterion fails, or the merge fails → `/pod:code`'s **Hand back for merge** for that PR, with the reason.
- A safety bound is hit → end the turn and name the bound.

## Safety bounds

- `--max-sprints=<N>` (sprints completed, default unlimited), `--max-waves=<N>` (waves dispatched, default `20`), `--max-runtime=<duration>` (wall clock, e.g. `4h`, default unlimited).
- A resume starts the clock and the counts again.
- Keep the counts in `<!-- autopilot-run: started=<ISO8601> sprints=<N> waves=<N> -->` in the active sprint doc, or in the plan doc while none is active (between sprints and after the last one) → a new sprint doc takes it over.
