# A set-up pod project with no CI. Used by: init-ci-decline-write, init-ci-declined.
# The case adds its own files, then runs pod_commit.
set -e
. "$(dirname "${BASH_SOURCE[0]}")/pod-project.sh"
git init -q -b main
git remote add origin https://github.com/acme/demo.git
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/ideas pod-docs/known-issues pod-docs/feature-details src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI that keeps a list of books.\n\n## Stack & conventions\n\nNode 22, no dependencies, `node --test`.\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/index.js` prints the books.\nVerification: `node --test`\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| list books | `node src/index.js` prints each book |\n' > pod-docs/features.md
pod_decisions
printf 'console.log("Dune")\n' > src/index.js
