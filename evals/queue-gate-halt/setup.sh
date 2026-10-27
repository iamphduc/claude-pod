#!/usr/bin/env bash
# A pod project on autopilot, sprint one, wave 1: A1's PR came back with low confidence, A2's merge needs #11 first.
set -e
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| greet | `node src/index.js` prints hi |\n' > pod-docs/features.md
printf '# Decisions\n\n## 2026-10-19 — merge target: default branch\n\nAutopilot merges to main.\n' > pod-docs/decisions.md
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

<!-- autopilot-run: started=2026-10-27T09:00:00Z sprints=0 waves=1 -->

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | Greet by name | one-A1 | https://github.com/acme/demo/pull/12 | in review | low | — |
| 1 | A2 | Greet in French | one-A2 | https://github.com/acme/demo/pull/13 | in review | high | — |
SPRINT
printf 'console.log("hi")\n' > src/index.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
