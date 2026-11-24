# A pod project whose plan `demo` has finished its sprints, with its final PR open. Used by: review-dispatch-plan, queue-review-label.
# The case adds its own files, then runs pod_commit.
set -e
. "$(dirname "${BASH_SOURCE[0]}")/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\n' > pod-docs/codebase-structure.md
pod_queue
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| greet | `node src/index.js` prints hi |\n' > pod-docs/features.md
pod_decisions
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
