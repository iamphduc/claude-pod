#!/usr/bin/env bash
# Autopilot at a wave merge. The brief says no CI, but someone added a CI workflow to the repo since.
. "$(dirname "$0")/../_fixtures/wave-merge.sh"
mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<'YML'
name: ci
on:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node --test
YML
pod_commit
