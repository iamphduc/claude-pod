#!/usr/bin/env bash
# A pod project at the start of wave 2. Pod Board answered the BLOCKED halt for two slices owning one file, but the answer doesn't fix it.
set -e
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints src
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\n' > pod-docs/codebase-structure.md
printf '# Features\n\n| Feature | User reaches it by | Drive | Proof |\n|---|---|---|---|\n| greet | the command line | `node src/index.js` | prints hi |\n' > pod-docs/features.md
printf '# Decisions\n' > pod-docs/decisions.md
cat > pod-docs/handoff-queue.md <<'QUEUE'
# Handoff Queue

Format: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``

---

- `[2026-10-20 · BLOCKED · orchestrator → human · plan: demo · sprint: one]` Gate 1: wave 2 slices A2 and A3 both own `src/greet.js`. **Resolution:** pending **Answer (human):** go ahead
QUEUE
cat > pod-docs/plans/demo.md <<'PLAN'
# Plan: Demo

_Generated: 2026-10-01 · Status: active · Grilled-with: pod_

Port base: 3100

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Greet by name | active | — |
PLAN
cat > pod-docs/sprints/one.md <<'SPRINT'
# Sprint: One

_From plan: pod-docs/plans/demo.md · Slug: one · Status: active · Generated: 2026-10-02_

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | Print a greeting | one-A1 | merged | done | high | — |
| 2 | A2 | Greet by name | — | — | pending | — | A1 |
| 2 | A3 | Shout flag | — | — | pending | — | A1 |

## Shared contract

`greet(name)` in `src/greet.js` returns the greeting string.

## Per-slice detail

### A2: Greet by name

- **Scope:** `node src/index.js Ann` prints the greeting with the name.
- **Files owned:** `src/greet.js`, `src/index.js`, `test/greet.test.js` (new)
- **Success criteria:** [test] `test/greet.test.js` › greets by name

### A3: Shout flag

- **Scope:** `shout(name)` in `src/shout.js` returns the greeting in capitals.
- **Files owned:** `src/greet.js`, `test/shout.test.js` (new)
- **Success criteria:** [test] `test/shout.test.js` › shouts
SPRINT
printf 'console.log("Hi")\n' > src/index.js
printf 'module.exports = { greet: () => "Hi" }\n' > src/greet.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
