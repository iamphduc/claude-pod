#!/usr/bin/env bash
# A pod project at plan end: plan demo done, its final PR reviewed. Its queue keeps an older Format line with no plan:.
set -e
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| greet | `node src/index.js` prints hi |\n' > pod-docs/features.md
printf '# Decisions\n' > pod-docs/decisions.md
cat > pod-docs/plans/demo.md <<'PLAN'
# Plan: Demo

_Generated: 2026-10-01 · Status: active · Grilled-with: pod_

Port base: 3100

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Greet by name | done | — |
PLAN
cat > pod-docs/sprints/archive/one.md <<'SPRINT'
# Sprint: One

_From plan: pod-docs/plans/demo.md · Slug: one · Status: archived · Generated: 2026-10-02_

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | Greet by name | one-A1 | merged | done | high | — |
SPRINT
printf 'console.log("hi")\n' > src/index.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
