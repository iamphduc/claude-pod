#!/usr/bin/env bash
# A pod project at the start of wave 2. The only answered entry is already resolved: pod applied it before wave 1 by adding slice Q1.
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

- `[2026-10-21 · PENDING · engineer → human · plan: demo · sprint: one · slice: A1]` decision: add a `--quiet` flag this sprint? **Resolution:** 2026-10-21 — slice Q1 (`--quiet`) added to wave 2 **Answer (human):** yes, add a --quiet slice Q1 to wave 2
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
| 2 | Q1 | Quiet flag | — | — | pending | — | A1 |

## Shared contract

`greet(name)` in `src/greet.js` returns the greeting string.

## Per-slice detail

### A2: Greet by name

- **Scope:** `node src/index.js Ann` prints the greeting with the name.
- **Files owned:** `src/greet.js`, `src/index.js`, `test/greet.test.js` (new)
- **Success criteria:** [test] `test/greet.test.js` › greets by name

### Q1: Quiet flag

- **Scope:** `quiet(name)` in `src/quiet.js` returns the greeting with no punctuation.
- **Files owned:** `src/quiet.js` (new), `test/quiet.test.js` (new)
- **Success criteria:** [test] `test/quiet.test.js` › is quiet
SPRINT
printf 'console.log("Hi")\n' > src/index.js
printf 'module.exports = { greet: () => "Hi" }\n' > src/greet.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
