---
# Ship runs init when the project isn't set up: the README has the docs version.
type: regex
target: { source: file, path: pod-docs/README.md }
pattern: 'pod docs: 2'
---
