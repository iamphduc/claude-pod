#!/usr/bin/env bash
set -e
git init -q
mkdir -p docs/plans src
printf '# Codebase structure\n\n## What it is\n\nA demo app.\n' > docs/codebase-structure.md
printf '# Handoff queue\n' > docs/handoff-queue.md
printf '# Plan: demo\n\nStatus: archived\n' > docs/plans/demo.md
printf '# My own guide\n' > docs/guide.md
printf 'console.log("hi")\n' > src/index.js
git add -A && git -c user.name=t -c user.email=t@t commit -qm init
