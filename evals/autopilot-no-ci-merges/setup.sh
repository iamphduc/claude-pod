#!/usr/bin/env bash
# Autopilot at a wave merge in a project with no CI: zero checks, and the wave check passed.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\nVerification: `node --test`\n' > pod-docs/codebase-structure.md
pod_queue
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| greet | `node src/index.js` prints hi |\n' > pod-docs/features.md
printf '# Decisions\n\n## 2026-10-19 — merge target: default branch\n\nAutopilot merges to main.\n\n## 2026-10-19 — CI: none\nContext: a prototype.\nDecision: no CI for now.\nConsequences: merges rest on the wave check.\n' > pod-docs/decisions.md
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
| 1 | A1 | Greet by name | one-A1 | https://github.com/acme/demo/pull/12 | in review | high | — |
SPRINT
printf 'console.log("hi")\n' > src/index.js
pod_commit
