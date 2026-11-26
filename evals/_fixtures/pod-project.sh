# Shared parts of the pod projects that the eval cases build.
# A case's setup.sh sources this file, then writes the files that only it needs.
# This folder has no prompt.md, so the eval tool doesn't load it as a case.

# The pod-docs layout version that /pod:init writes today. Change it here when the layout changes.
POD_DOCS_VERSION=2

# pod-docs/README.md, with the current layout version.
pod_readme() {
  printf '# pod docs\n\npod docs: %s\n' "$POD_DOCS_VERSION" > pod-docs/README.md
}

# An empty handoff queue, with the current Format line.
pod_queue() {
  printf '# Handoff Queue\n\nFormat: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending ``\n\n---\n' > pod-docs/handoff-queue.md
}

# An empty decisions log.
pod_decisions() {
  printf '# Decisions\n' > pod-docs/decisions.md
}

# pod-docs/config.md with the given merge-target; no argument leaves it empty.
pod_config() {
  printf '# pod config\n\nmerge-target: %s\n' "${1:-}" > pod-docs/config.md
}

# Commit everything as the project's first commit.
pod_commit() {
  git add -A && git -c user.name=t -c user.email=t@t commit -qm init
}
