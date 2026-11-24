#!/usr/bin/env bash
# A project set up for pod, with a web UI, before a /pod:task build.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans pod-docs/sprints/archive src
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA web app: a React page that lists team members.\n\n## Smoke recipe\n\n`node src/index.js` prints hi.\n' > pod-docs/codebase-structure.md
pod_queue
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| greet | `node src/index.js` prints hi |\n' > pod-docs/features.md
pod_decisions
printf 'console.log("hi")\n' > src/index.js
pod_commit
