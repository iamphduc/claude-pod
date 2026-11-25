#!/usr/bin/env bash
# A set-up pod project with no CI, where the human said no to CI before: config.md has ci: off.
. "$(dirname "$0")/../_fixtures/init-no-ci.sh"
pod_config '' '' off
pod_commit
