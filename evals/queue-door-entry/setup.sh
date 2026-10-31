#!/usr/bin/env bash
# A pod project mid-sprint: wave 1's only slice is a one-way door, and its wave PR #74 is open for the human's merge.
set -e
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI that keeps a list of books.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/index.js` prints the books.\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| list books | `node src/index.js` prints the books |\n' > pod-docs/features.md
printf '# Decisions\n' > pod-docs/decisions.md
cat > pod-docs/plans/demo.md <<'PLAN'
# Plan: Demo

_Generated: 2026-10-01 · Status: active · Grilled-with: pod_

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Store books in the v2 format | active | — |
PLAN
cat > pod-docs/sprints/one.md <<'SPRINT'
# Sprint: One

_From plan: pod-docs/plans/demo.md · Slug: one · Status: active · Generated: 2026-10-02_

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | Move saved books to v2 | one-A1 | https://github.com/acme/demo/pull/74 | pushed | high | — |

## Per-slice detail

### A1: Move saved books to v2
- **Scope:** rewrite `books.json` in the v2 format on first load.
- **Files owned:** `src/store.js` (new), `src/store.test.js` (new)
- **Success criteria:**
  - `[test] a v1 file loads as v2 — src/store.test.js › migrates v1`
- **Depends on:** —
- **One-way door:** saved books move to the v2 format and older builds can't read them; undo: restore `books.v1.json`, the backup the migration writes
- **Model:** opus
SPRINT
printf 'console.log("books")\n' > src/index.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
