#!/usr/bin/env bash
# A pod project whose plan `demo` has finished its sprints; its final PR is open, not yet reviewed.
. "$(dirname "$0")/../_fixtures/plan-end.sh"
pod_commit
