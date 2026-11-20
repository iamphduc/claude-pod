# Autonomous mode policy

`/pod:autopilot` is the human's standing consent to merge PRs that clear the bar below. Anything that doesn't clear it halts the run for the human. A PR merges only when it meets every rule in **Auto-merge criteria**. (If `CLAUDE.md` forbids unattended merges, add an autopilot carve-out or use `/pod:code`.)

## Auto-merge criteria

- **CI passed, if there is CI:** the brief's `## CI` isn't `none` → at least one check ran and every required check passes. Zero checks means CI didn't run, not a pass.
- **No CI:** the brief's `## CI` is `none` → the wave check is the gate.
- **GitHub says it's clean:** `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, no `CHANGES_REQUESTED` review, no unresolved review thread.
- **Required approval:** branch protection that requires a human approval keeps the PR `BLOCKED` → gate 3.
- **No low confidence:** any slice in the wave reported `Confidence: low` → withhold and halt (gate 6). `B1`'s `medium` Confidence is expected.
- **No one-way door:** a wave with a slice marked one-way → withhold and halt (gate 6); the human merges it.
- **One-way door in the final PR:** any wave carried a one-way slice, or the plan adds a migration → withhold the final plan PR too (gate 6), since merging it to the merge-target can deploy them.
- **Final plan PR only:** the reviewer's `pass`, on the first review or after the one fix pass. Still `fix` → gate 2.

## Merging

- **Merge:** a PR clears every criterion → merge it with a merge commit (not squash), leave the branches for teardown, then mark the wave `merged`/`done`.
- **Merge fails:** any merge failure → gate 3.

## Preflight (before `/pod:code`'s own)

- **No CI is not a halt:** the brief's `## CI` is `none` → say once, at the start, that merges rest on the wave check alone.
- **Browser:** settle `/pod:code`'s browser check first → once the run is unattended, a question nobody answers stalls it.
- **Merge target:** settle it per **Merge target** below, with the browser check.

## Merge target

- **Reuse the choice:** no `--merge-target` given → reuse a `## <date> — merge target: <choice>` entry in `pod-docs/decisions.md`.
- **Ask once:** no such entry → ask once, with the browser check: **Staging (recommended)** — merges land on `pod-staging` and the human moves them to the default branch after looking, so unattended code never reaches it alone — or **Default branch**. Record the answer there under that title.
- **Staging:** staging chosen → bring `pod-staging` on origin up to date with origin's default branch (create it if missing), and use `pod-staging` as the merge-target everywhere.
- **Append-only staging conflict:** bringing `pod-staging` up to date conflicts, and every hunk only appends lines to a `pod-docs/` file → keep both sides (a line both sides added word for word stays once), and name the files in your next hand-back.
- **Other staging conflict:** any other conflict while bringing `pod-staging` up to date → gate 3.

## The wave check is a gate

- **Wave check:** `/pod:code`'s check of the combined wave exercises the merged slices' behavior, not just a clean merge. It fails → gate 4.
- **Quiet defect:** a defect a user would notice that nothing errors on → `/pod:code`'s **Wave fix**, not a halt.

## Halt gates

Each gate is `<N>. **<name>:** <trigger> → <queue type>`.

1. **blocked-concern:** `BLOCKED` from any engineer or from you (incl. an agent that stalled twice) → `BLOCKED`.
2. **plan-review-fail:** the final plan PR still has `FIX` findings, or any reproduced bug, after the fix pass → `BLOCKED`.
3. **auto-merge-fail:** a PR fails the auto-merge criteria, or the merge fails → `BLOCKED`.
4. **inter-wave-verify:** wave verification fails → `BLOCKED`.
5. **safety-bound:** a safety bound is hit → `PENDING`.
6. **escalation-valve:** a mergeable PR withheld for a risk signal (`Confidence: low`, or a one-way door) → `PENDING`.
7. **plan-complete:** no `planned` sprint row left; with staging, open (or reuse) a PR from `pod-staging` to the default branch and name it in the halt, and never merge it → `PENDING`.

- **Gate 1's one exception:** a `BLOCKED` fixed only by a test fixture or doc no other slice owns → give it to that engineer, resume it, and tell the human.

## Every gate halts

- **Halt entry:** append a one-line queue entry from `orchestrator` whose body starts `gate <N> (<name>): ` and then names the artifact, e.g. `gate 6 (escalation-valve): wave 2 PR <url> withheld, one-way door`.
- **Queue type:** always the gate's, from the list above, never your own pick → a gate 3 is `BLOCKED` even when the fix is only "merge it after #27".
- **Withheld final PR:** a withheld final plan PR starts `gate 6 (escalation-valve): final plan PR <url> withheld, ` → pod-flow reads that start as a PR for the human to merge, then resume.
- **Plain words:** the rest of the entry is in plain words with real values, per the PR template's **The human reads every slot**.
- **Only halts start that way:** Pod Board tells a halt from a note by the `gate <N> (<name>): ` start → no entry but a halt starts that way.
- **Then stop:** send a `PushNotification` and end the turn.
- **Before resuming:** `BLOCKED` must be resolved; `PENDING` only needs acknowledging. A Pod Board answer (`**Answer (human):**`) acknowledges either.
- **Answered `BLOCKED`:** it is resolved once `/pod:code`'s **Answers** rule applies it and finds the cause gone.
- **Notes are not halts:** `/pod:code`'s **Plan complete** step 5 entry is a note, written before the final merge → gate 2 and gate 7 each add their own halt entry when they halt.

## Staging PR (gate 7)

- **What it says:** the human reads this PR, not the branch → it says what `pod-staging` holds.
- **Title:** a conventional commit for what its plans built, ending `(plan <slug>)` or `(plans <slug>, <slug>)`, e.g. `feat: friends list and invites (plan friends)`.
- **Body:** per `${CLAUDE_PLUGIN_ROOT}/skills/code/pr-template.md`, with one `## <plan title> (<plan-slug>)` section per plan on it.
- **Plan section:** the goal in a sentence, the features it added or changed (from `pod-docs/features.md`), its one-way doors and the decisions made for the human, loose ends, links to its final PR and report, and last, a `### Try it` with its final PR's **Try it** steps.
- **Reuse an open PR:** a PR from `pod-staging` to the default branch is already open → rewrite the title to cover every plan, add this plan's section, and keep the others.

## Safety bounds

- **Check the bounds:** before each wave and after each sprint is archived. Hitting any → gate 5.
- **`--max-sprints=<N>`:** sprints completed (default: unlimited).
- **`--max-waves=<N>`:** waves dispatched (default `20`).
- **`--max-runtime=<duration>`:** wall clock, e.g. `4h` (default: unlimited).
- **Resume:** resuming after a halt starts the clock and the counts again.
- **Run line:** keep the count in a line `<!-- autopilot-run: started=<ISO8601> sprints=<N> waves=<N> -->` in the active sprint doc.
- **No active sprint doc:** between sprints, and after the last sprint is archived → keep the run line in the plan doc. It stays there after a gate 2 or 7 halt.
- **New sprint doc:** the sprint-planner writes a new doc → carry the run line over.
