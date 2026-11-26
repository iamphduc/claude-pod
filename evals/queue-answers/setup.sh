#!/usr/bin/env bash
# A pod project at the start of wave 2. The human answered both queue entries: a PENDING decision, and the BLOCKED halt for two slices owning one file.
. "$(dirname "$0")/../_fixtures/wave2-start.sh"
wave2_sprint A3 'Shout flag' \
  '`shout(name)` in `src/shout.js` returns the greeting in capitals.' \
  '`src/greet.js`, `test/shout.test.js` (new)' \
  '[test] `test/shout.test.js` › shouts'
cat >> pod-docs/handoff-queue.md <<'QUEUE'

- `[2026-10-22 · PENDING · engineer → human · plan: demo · sprint: one · slice: A1]` decision: should the greeting say `Hi` or `Hello`? A1 kept `Hi`. **Resolution:** pending **Answer (human):** Hello
- `[2026-10-22 · BLOCKED · orchestrator → human · plan: demo · sprint: one]` wave 2 slices A2 and A3 both own `src/greet.js`. **Resolution:** pending **Answer (human):** A3 owns only src/shout.js (new) and imports greet from src/greet.js
QUEUE
pod_commit
