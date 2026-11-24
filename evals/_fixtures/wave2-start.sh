# A pod project at the start of wave 2 of sprint one: A1 merged, A2 and one more slice pending.
# Used by: queue-answers, queue-answer-resolved, queue-answer-still-blocked.
# The case calls wave2_sprint for its second slice, appends its queue entries, then runs pod_commit.
set -e
. "$(dirname "${BASH_SOURCE[0]}")/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\n' > pod-docs/codebase-structure.md
printf '# Features\n\n| Feature | User reaches it by | Drive | Proof |\n|---|---|---|---|\n| greet | the command line | `node src/index.js` | prints hi |\n' > pod-docs/features.md
pod_decisions
pod_queue
cat > pod-docs/plans/demo.md <<'PLAN'
# Plan: Demo

_Generated: 2026-10-01 · Status: active · Grilled-with: pod_

Port base: 3100

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | Greet by name | active | — |
PLAN
printf 'console.log("Hi")\n' > src/index.js
printf 'module.exports = { greet: () => "Hi" }\n' > src/greet.js

# wave2_sprint <code> <title> <scope> <files owned> <success criteria>: sprint one, with the given slice in wave 2 next to A2.
wave2_sprint() {
  cat > pod-docs/sprints/one.md <<'SPRINT'
# Sprint: One

_From plan: pod-docs/plans/demo.md · Slug: one · Status: active · Generated: 2026-10-02_

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | Print a greeting | one-A1 | merged | done | high | — |
| 2 | A2 | Greet by name | — | — | pending | — | A1 |
SPRINT
  printf '| 2 | %s | %s | — | — | pending | — | A1 |\n' "$1" "$2" >> pod-docs/sprints/one.md
  cat >> pod-docs/sprints/one.md <<'SPRINT'

## Shared contract

`greet(name)` in `src/greet.js` returns the greeting string.

## Per-slice detail

### A2: Greet by name

- **Scope:** `node src/index.js Ann` prints the greeting with the name.
- **Files owned:** `src/greet.js`, `src/index.js`, `test/greet.test.js` (new)
- **Success criteria:** [test] `test/greet.test.js` › greets by name
SPRINT
  printf '\n### %s: %s\n\n- **Scope:** %s\n- **Files owned:** %s\n- **Success criteria:** %s\n' "$1" "$2" "$3" "$4" "$5" >> pod-docs/sprints/one.md
}
