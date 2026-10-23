#!/usr/bin/env bash
# A pod project with two research parts ready to merge; their text is in the prompt.
set -e
git init -q -b main
mkdir -p pod-docs/research/habit-tracker.parts
printf '# pod docs\n\npod docs: 2\n' > pod-docs/README.md
