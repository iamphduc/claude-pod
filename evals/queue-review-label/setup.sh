#!/usr/bin/env bash
# A pod project at plan end: plan demo done, its final PR reviewed. Its queue keeps an older Format line with no plan:.
. "$(dirname "$0")/../_fixtures/plan-end.sh"
printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n' > pod-docs/handoff-queue.md
pod_commit
