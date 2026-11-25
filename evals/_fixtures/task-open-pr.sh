# A project set up for pod, with a /pod:task that has an open PR.
# Used by: fix-dispatch-task review-dispatch-round2 review-dispatch-task task-more-changes-done task-more-changes-review.
set -e
. "$(dirname "${BASH_SOURCE[0]}")/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\n' > pod-docs/codebase-structure.md
pod_queue
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| greet | `node src/index.js` prints hi |\n' > pod-docs/features.md
pod_decisions
printf 'console.log("hi")\n' > src/index.js
pod_commit
