#!/usr/bin/env bash
# A pod project at Plan complete: sprint one is archived, and the plan branch `books` holds 3 changes a person can
# see, one that changes nothing they can see (a reworded features.md row), and an internal test helper.
set -e
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# Codebase structure\n\n## What it is\n\nA small web app that keeps a reading list.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/server.js` serves on http://localhost:3000.\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n' > pod-docs/handoff-queue.md
cat > pod-docs/features.md <<'FEATURES'
# Features

| Feature | User reaches it by | Drive | Proof |
|---|---|---|---|
| Sign in | the /login page | sign in as demo / demo | the reading list shows |
| Mark read | the ✓ button on a book in the list | press it | the book moves to Read, and Undo puts it back |
| Sort | the Sort menu over the list | pick Title | the books show A to Z |
| Dark theme | Settings → Theme | pick Dark | every page turns dark, and stays dark after a reload |
FEATURES
printf '# Decisions\n\n## 2026-11-01 — merge target: default branch\n\nPlans merge to main.\n' > pod-docs/decisions.md
cat > pod-docs/plans/books.md <<'PLAN'
# Plan: Books

_Generated: 2026-11-01 · Status: active · Grilled-with: pod_

Port base: 3200

## Goal

Let a reader mark books read, sort the list, and switch to a dark theme.

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Mark read, sort, and the dark theme | done | — |
PLAN
cat > pod-docs/sprints/archive/one.md <<'SPRINT'
# Sprint: One

_From plan: pod-docs/plans/books.md · Slug: one · Status: archived · Generated: 2026-11-02_

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | B1 | Mark read, with Undo | one-B1 | https://github.com/acme/books/pull/31 | done | high | — |
| 1 | B2 | Sort the list | one-B2 | https://github.com/acme/books/pull/31 | done | high | — |
| 2 | B3 | Dark theme | one-B3 | https://github.com/acme/books/pull/32 | done | high | — |
| 2 | B4 | Test fixture helper | one-B4 | https://github.com/acme/books/pull/32 | done | high | — |

## Per-slice detail

### B1: Mark read, with Undo
- **Scope:** a ✓ button on each book moves it to a Read section; a 5-second Undo toast puts it back.
### B2: Sort the list
- **Scope:** a Sort menu over the list: Title, Author, Date added.
### B3: Dark theme
- **Scope:** Settings → Theme → Dark, kept after a reload. Also rewords the Sign in row of features.md; sign-in itself is unchanged.
### B4: Test fixture helper
- **Scope:** `test/fixtures.js`, a helper the tests use to seed books. No user sees it.

## Sprint summary

- **Synced with merge-target:** up to date
- **Slices shipped:** B1, B2, B3, B4
- **Queue entries:** resolved 0, deferred 0
SPRINT
printf 'console.log("serving on 3000")\n' > src/server.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
git branch books
