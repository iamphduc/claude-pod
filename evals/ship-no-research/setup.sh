#!/usr/bin/env bash
# A set-up pod project with no research report: /pod:ship --no-research goes straight to the plan interview.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
git remote add origin https://github.com/acme/notes.git
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/research pod-docs/ideas pod-docs/known-issues pod-docs/feature-details src/routes src/db
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA JSON API in Node for shared notes. No UI. No user accounts yet: every note is public.\n\n## Parts\n\n- `src/routes/`: HTTP routes\n- `src/db/`: SQLite access\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/server.js` serves on port 3000.\nVerification: `node --test`\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| notes | GET /notes lists every note |\n' > pod-docs/features.md
printf '# Decisions\n\n## 2026-11-01 — CI: none\nContext: a prototype.\nDecision: no CI.\nConsequences: merges rest on the wave check.\n' > pod-docs/decisions.md
printf 'require("./routes/notes")\n' > src/server.js
printf 'module.exports = {}\n' > src/routes/notes.js
printf 'module.exports = {}\n' > src/db/index.js
pod_commit
