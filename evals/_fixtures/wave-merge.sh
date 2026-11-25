# Autopilot at a wave merge; the brief and config.md say no CI. Used by: autopilot-no-ci-merges, autopilot-ci-from-repo.
# The case adds its own files, then runs pod_commit.
set -e
. "$(dirname "${BASH_SOURCE[0]}")/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\nVerification: `node --test`\n' > pod-docs/codebase-structure.md
pod_queue
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| greet | `node src/index.js` prints hi |\n' > pod-docs/features.md
pod_decisions
pod_config '' '' off
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
