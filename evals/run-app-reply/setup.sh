#!/usr/bin/env bash
# A pod project at plan end: plan demo is handed back, its final PR waits for the human's merge.
set -e
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
cat > pod-docs/codebase-structure.md <<'DOC'
# Codebase structure

## What it is

A tiny web app: one page that greets you.

## Smoke recipe

- **Start:** `PORT=<web port> node src/server.js`, then open `http://localhost:<web port>/`.
- **Proof:** the page reads `hi`.
DOC
printf '# Handoff Queue\n\n---\n- `[2026-10-21 · PENDING · orchestrator → human · plan: demo]` plan demo complete — final PR https://github.com/acme/demo/pull/20, review pass, 0 open entries sorted in the hand-back **Resolution:** pending\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | User reaches it by | Drive | Proof |\n|---|---|---|---|\n| Greeting | `/` | open it | reads hi |\n' > pod-docs/features.md
printf '# Decisions\n' > pod-docs/decisions.md
cat > pod-docs/plans/demo.md <<'PLAN'
# Plan: Demo

_Generated: 2026-10-01 · Status: archived · Grilled-with: pod_

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Greet | done | — |
PLAN
# Ends by itself, so a run never leaves it behind.
cat > src/server.js <<'JS'
const http = require('http')
const server = http.createServer((_, res) => res.end('<title>hi</title>hi'))
server.listen(Number(process.env.PORT) || 3000)
setTimeout(() => server.close(() => process.exit(0)), 60_000)
JS
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
