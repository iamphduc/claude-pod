#!/usr/bin/env bash
# A pod project at the start of sprint one, wave 1: slice A1 is `top` (the human's own model), A2 is `sonnet`.
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
| one | Search and sort the book list | active | — |
PLAN
cat > pod-docs/sprints/one.md <<'SPRINT'
# Sprint: One

_From plan: pod-docs/plans/demo.md · Slug: one · Status: active · Generated: 2026-10-02_

## Shared contract

`listBooks(): Book[]` in `src/books.js`, where `Book` is `{ title: string, author: string }`.

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | Search books by title | one-A1 | — | pending | — | — |
| 1 | A2 | Sort books by author | one-A2 | — | pending | — | — |

## Per-slice detail

### A1: Search books by title
- **Scope:** add `searchBooks(query)` and define the shared `listBooks()` contract.
- **Files owned:** `src/books.js` (new), `src/books.test.js` (new)
- **Success criteria:**
  - `[test] a query returns only matching titles — src/books.test.js › search`
- **Depends on:** —
- **Model:** top

### A2: Sort books by author
- **Scope:** add `sortByAuthor(books)`, using the contract as given.
- **Files owned:** `src/sort.js` (new), `src/sort.test.js` (new)
- **Success criteria:**
  - `[test] books come back in author order — src/sort.test.js › sort`
- **Depends on:** —
- **Model:** sonnet
SPRINT
printf 'console.log("books")\n' > src/index.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
