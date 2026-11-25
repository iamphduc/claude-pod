#!/usr/bin/env bash
# A pod project mid-plan: the parent repo is on the plan branch `friends`, and config sets no merge target.
set -e
git init -q -b main
mkdir -p pod-docs/plans
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# pod config\n\nmerge-target:\nbrowser:\nci: off\n' > pod-docs/config.md
printf '# Codebase structure\n\n## What it is\n\nA small CLI.\n\n## Smoke recipe\n\n`node --test`\n' > pod-docs/codebase-structure.md
printf '# Decisions\n' > pod-docs/decisions.md
printf '# Handoff Queue\n\n---\n' > pod-docs/handoff-queue.md
printf '# Plan: Friends\n\n_Generated: 2026-11-20 · Status: active_\n\nMerge target: main\nPort base: 3100\n\n## Goal\n\nLet users add friends.\n' > pod-docs/plans/friends.md
printf '# Greeter\n\nRun `node greet.js`.\n' > README.md
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
git checkout -q -b friends
printf 'console.log("Helo")\n' > greet.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm "feat: greet"
# Both branches are on origin, as in a real mid-plan repo.
git remote add origin https://github.com/acme/greeter.git
git update-ref refs/remotes/origin/main main
git update-ref refs/remotes/origin/friends friends
git symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/main
