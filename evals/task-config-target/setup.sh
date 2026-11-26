#!/usr/bin/env bash
# A pod project on main, with no plan running, whose config.md sends work to a staging branch.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans
pod_readme
pod_config staging
printf '# Codebase structure\n\n## What it is\n\nA small CLI.\n\n## Smoke recipe\n\n`node --test`\n' > pod-docs/codebase-structure.md
pod_decisions
pod_queue
printf 'console.log("Helo")\n' > greet.js
pod_commit
git branch staging
git remote add origin https://github.com/acme/greeter.git
git update-ref refs/remotes/origin/main main
git update-ref refs/remotes/origin/staging staging
git symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/main
