#!/usr/bin/env bash
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q
mkdir -p docs/plans src
printf '# Codebase structure\n\n## What it is\n\nA demo app.\n' > docs/codebase-structure.md
printf '# Handoff queue\n' > docs/handoff-queue.md
printf '# Plan: demo\n\nStatus: archived\n' > docs/plans/demo.md
printf '# My own guide\n' > docs/guide.md
printf 'console.log("hi")\n' > src/index.js
pod_commit
