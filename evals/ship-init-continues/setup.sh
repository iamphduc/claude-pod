#!/usr/bin/env bash
# An empty repo with a written plan, but pod not set up: /pod:ship resumes at init (step 5).
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
git remote add origin https://github.com/acme/todo.git
mkdir -p pod-docs/plans pod-docs/design-drafts
printf '# todo\n' > README.md
cat > pod-docs/plans/todo-cli.md <<'PLAN'
# Plan: todo CLI

_Generated: 2026-11-20 · Status: active · Grilled-with: pod_

## Goal
A command-line todo list: add, list, and finish items, saved in a JSON file.

## Why
A small tool for one user. Done when the three commands work and `node --test` passes.

## Scope
**In scope:**
- `todo add <text>`, `todo list`, `todo done <n>`

**Out of scope:**
- sync, due dates

## How it fits together

**Parts:**

| Part | New or changed | Where (existing folder or module) | Does |
|------|----------------|-----------------------------------|------|
| cli | new | `src/` | parses the command |
| store | new | `src/` | reads and writes `todo.json` |

**How they connect:** cli → store

```mermaid
flowchart LR
  cli -->|items| store
```

**Main flow:** a user adds an item.

```mermaid
sequenceDiagram
  user->>cli: todo add milk
  cli->>store: save
```

**Data:** `todo.json` in the home folder, written by store.

## Sprint sequence

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| todo-cli-core | bootstrap and the three commands | planned | — |

## Look
none — no UI

## Key decisions
- CI: none (default)
PLAN
printf '<!doctype html><title>todo-cli overview</title><h1>todo CLI</h1>\n' > pod-docs/design-drafts/todo-cli-overview.html
pod_commit
