#!/usr/bin/env bash
# Between sprints: sprint one is archived, sprint two is still planned and has no sprint doc.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI that keeps a list of books.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/index.js` prints the books.\n' > pod-docs/codebase-structure.md
pod_queue
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| list books | `node src/index.js` prints the books |\n| search books | `node src/index.js --search dune` prints only Dune |\n' > pod-docs/features.md
printf '# Decisions\n\n' > pod-docs/decisions.md
cat > pod-docs/plans/demo.md <<'PLAN'
# Plan: Demo

_Generated: 2026-10-01 · Status: active · Grilled-with: pod_

Port base: 3100

## Goal

Search, sort, and tag the book list.

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Search the book list | done | — |
| two | Sort and tag books | planned | one |
PLAN
cat > pod-docs/sprints/archive/one.md <<'SPRINT'
# Sprint: One

_From plan: pod-docs/plans/demo.md · Slug: one · Status: archived · Generated: 2026-10-02_

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | Search books by title | one-A1 | merged | done | high | — |

## Sprint summary

- **Synced with merge-target:** up to date
- **Slices shipped:** A1
- **Queue entries:** resolved 0, deferred 0
SPRINT
printf 'console.log("books")\n' > src/index.js
pod_commit
