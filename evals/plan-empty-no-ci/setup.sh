#!/usr/bin/env bash
# An empty repo after /pod:init: pod's docs, no application code yet.
set -e
git init -q -b main
git remote add origin https://github.com/acme/streak.git
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/ideas pod-docs/known-issues pod-docs/feature-details
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
printf '# Codebase structure\n\n## What it is\n\n<!-- one paragraph -->\n\n## CI\n\n<!-- what runs on pull requests, or `none` -->\n\n## Smoke recipe\n\n<!-- install, start, Verification: -->\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n' > pod-docs/features.md
printf '# Decisions\n' > pod-docs/decisions.md
printf '# streak\n' > README.md
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
