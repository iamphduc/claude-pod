#!/usr/bin/env bash
# A pod project whose autopilot plan `friends` merged straight to main (no staging): its final PR #20 is in.
set -e
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/reports src
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# Codebase structure\n\n## What it is\n\nA small web app.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/server.js` serves on port 3000.\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n\n- `[2026-10-21 · PENDING · orchestrator → human · plan: friends]` plan friends complete — final PR https://github.com/acme/app/pull/20, review pass, 0 open entries sorted in the hand-back **Resolution:** pending\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| sign in | log in at /login |\n| friends list | add a friend at /friends and see them listed after a reload |\n' > pod-docs/features.md
printf '# Decisions\n\n## 2026-10-19 — merge target: default branch\n\nAutopilot merges to main.\n' > pod-docs/decisions.md
cat > pod-docs/plans/friends.md <<'PLAN'
# Plan: Friends

_Generated: 2026-10-18 · Status: archived · Grilled-with: pod_

Port base: 3100

## Goal

Let users add friends.

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Friends list | done | — |
PLAN
printf '<html><title>Friends report</title></html>\n' > pod-docs/reports/friends.html
printf 'console.log("hi")\n' > src/server.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
