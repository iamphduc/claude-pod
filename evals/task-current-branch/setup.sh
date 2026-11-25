#!/usr/bin/env bash
# A pod project mid-plan: the parent repo is on the plan branch `friends`, and config sets no merge target.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/plans
pod_readme
pod_config '' '' off
printf '# Codebase structure\n\n## What it is\n\nA small CLI.\n\n## Smoke recipe\n\n`node --test`\n' > pod-docs/codebase-structure.md
pod_decisions
pod_queue
printf '# Plan: Friends\n\n_Generated: 2026-11-20 · Status: active_\n\nPort base: 3100\n\n## Goal\n\nLet users add friends.\n' > pod-docs/plans/friends.md
printf '# Greeter\n\nRun `node greet.js`.\n' > README.md
pod_commit
git checkout -q -b friends
printf 'console.log("Helo")\n' > greet.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm "feat: greet"
# Both branches are on origin, as in a real mid-plan repo.
git remote add origin https://github.com/acme/greeter.git
git update-ref refs/remotes/origin/main main
git update-ref refs/remotes/origin/friends friends
git symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/main
