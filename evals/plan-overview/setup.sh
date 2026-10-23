#!/usr/bin/env bash
# A small pod project with no UI, ready for a plan; the interview's answers come in the prompt.
set -e
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/design-drafts src/routes src/db
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# Codebase structure\n\n## What it is\n\nA JSON API in Node. No UI.\n\n## Parts\n\n- `src/routes/`: HTTP routes\n- `src/db/`: SQLite access\n\n## Smoke recipe\n\n`node src/server.js` serves on port 3000.\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| sign in | POST /login returns a token |\n' > pod-docs/features.md
printf '# Decisions\n' > pod-docs/decisions.md
printf 'require("./routes/login")\n' > src/server.js
printf 'module.exports = {}\n' > src/routes/login.js
printf 'module.exports = {}\n' > src/db/index.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
