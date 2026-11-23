#!/usr/bin/env bash
# An empty repo after /pod:init: pod's docs, no application code yet.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
git remote add origin https://github.com/acme/streak.git
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/ideas pod-docs/known-issues pod-docs/feature-details
pod_readme
printf '# Codebase structure\n\n## What it is\n\n<!-- one paragraph -->\n\n## CI\n\n<!-- what runs on pull requests, or `none` -->\n\n## Smoke recipe\n\n<!-- install, start, Verification: -->\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n' > pod-docs/features.md
pod_decisions
printf '# streak\n' > README.md
pod_commit
