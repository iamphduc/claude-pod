#!/usr/bin/env bash
# A pod project at the start of wave 2. The human answered the BLOCKED halt for two slices owning one file, but the answer doesn't fix it.
. "$(dirname "$0")/../_fixtures/wave2-start.sh"
wave2_sprint A3 'Shout flag' \
  '`shout(name)` in `src/shout.js` returns the greeting in capitals.' \
  '`src/greet.js`, `test/shout.test.js` (new)' \
  '[test] `test/shout.test.js` › shouts'
cat >> pod-docs/handoff-queue.md <<'QUEUE'

- `[2026-10-20 · BLOCKED · orchestrator → human · plan: demo · sprint: one]` wave 2 slices A2 and A3 both own `src/greet.js`. **Resolution:** pending **Answer (human):** go ahead
QUEUE
pod_commit
