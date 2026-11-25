#!/usr/bin/env bash
# A pod project at the start of wave 2. The only answered entry is already resolved: pod applied it before wave 1 by adding slice Q1.
. "$(dirname "$0")/../_fixtures/wave2-start.sh"
wave2_sprint Q1 'Quiet flag' \
  '`quiet(name)` in `src/quiet.js` returns the greeting with no punctuation.' \
  '`src/quiet.js` (new), `test/quiet.test.js` (new)' \
  '[test] `test/quiet.test.js` › is quiet'
cat >> pod-docs/handoff-queue.md <<'QUEUE'

- `[2026-10-21 · PENDING · engineer → human · plan: demo · sprint: one · slice: A1]` decision: add a `--quiet` flag this sprint? **Resolution:** 2026-10-21 — slice Q1 (`--quiet`) added to wave 2 **Answer (human):** yes, add a --quiet slice Q1 to wave 2
QUEUE
pod_commit
