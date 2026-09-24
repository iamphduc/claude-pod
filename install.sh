#!/usr/bin/env bash
#
# claude-waves (now claude-pods) is the "pod" Claude Code plugin; this script no longer copies files.
#
cat <<'MSG'
claude-waves (now claude-pods) is the "pod" Claude Code plugin. Inside Claude Code, run:

  /plugin marketplace add iamphduc/claude-pods
  /plugin install pod@pod

Then run /pod:init in your project. Updates come through
/plugin marketplace update pod.

Upgrading from the old copy-based install? Delete the copied files first
(they take priority over the plugin) — see the README's "Moving from install.sh".
MSG
exit 1
