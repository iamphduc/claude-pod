# A small pod project with no UI, ready for a plan: a JSON API in Node.
# Used by: plan-interview-rounds plan-overview.
set -e
. "$(dirname "${BASH_SOURCE[0]}")/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/design-drafts src/routes src/db
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA JSON API in Node. No UI.\n\n## Parts\n\n- `src/routes/`: HTTP routes\n- `src/db/`: SQLite access\n\n## Smoke recipe\n\n`node src/server.js` serves on port 3000.\n' > pod-docs/codebase-structure.md
pod_queue
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| sign in | POST /login returns a token |\n' > pod-docs/features.md
pod_decisions
printf 'require("./routes/login")\n' > src/server.js
printf 'module.exports = {}\n' > src/routes/login.js
printf 'module.exports = {}\n' > src/db/index.js
pod_commit
