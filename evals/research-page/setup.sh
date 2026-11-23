#!/usr/bin/env bash
# A pod project with two research parts ready to merge; their text is in the prompt.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
mkdir -p pod-docs/research/habit-tracker.parts
pod_readme
