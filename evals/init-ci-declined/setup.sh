#!/usr/bin/env bash
# A set-up pod project with no CI, where the human said no to CI before.
. "$(dirname "$0")/../_fixtures/init-no-ci.sh"
printf '# Decisions\n\n## 2026-11-01 — CI: none\nContext: a throwaway prototype.\nDecision: no CI; the human adds it with /pod:init when they want it.\nConsequences: merges rest on the wave check.\n' > pod-docs/decisions.md
pod_commit
