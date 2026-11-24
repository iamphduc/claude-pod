# A project set up for pod, with a /pod:task bug fix whose engineer is done.
# Used by: pr-body-task pr-body-task-door.
set -e
. "$(dirname "${BASH_SOURCE[0]}")/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA command-line tool with no UI.\n\n## Smoke recipe\n\n`node src/index.js <name>` prints a greeting.\n' > pod-docs/codebase-structure.md
pod_queue
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| greet | `node src/index.js Ann` prints hi Ann |\n' > pod-docs/features.md
pod_decisions
printf 'console.log("hi " + process.argv.slice(2).join(" ").trim())\n' > src/index.js
pod_commit
