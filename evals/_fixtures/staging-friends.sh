# A pod project whose autopilot plan `friends` merged into pod-staging.
# Used by: staging-pr-new staging-pr-reuse.
set -e
. "$(dirname "${BASH_SOURCE[0]}")/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/reports src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA small web app.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/server.js` serves on port 3000.\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n\n- `[2026-10-20 · PENDING · orchestrator → human · plan: friends · sprint: one · slice: A2]` Decision: invite links expire after 7 days. **Resolution:** 2026-10-21 — default recorded in pod-docs/decisions.md\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| sign in | log in at /login |\n| friends list | add a friend at /friends and see them listed after a reload |\n| invite links | open /invite/<code> and land on the sign-up page |\n' > pod-docs/features.md
printf '# Decisions\n\n## 2026-10-19 — merge target: staging\n\nAutopilot merges to pod-staging.\n\n## 2026-10-21 — invite links expire after 7 days (agent default — override anytime)\n' > pod-docs/decisions.md
cat > pod-docs/plans/friends.md <<'PLAN'
# Plan: Friends

_Generated: 2026-10-18 · Status: archived · Grilled-with: pod_

Port base: 3100

## Goal

Let users add friends and invite people who aren't signed up yet.

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Friends list and invite links | done | — |
PLAN
printf '<html><title>Friends report</title></html>\n' > pod-docs/reports/friends.html
printf 'console.log("hi")\n' > src/server.js
pod_commit
git branch pod-staging
