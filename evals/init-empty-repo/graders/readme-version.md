---
# Init writes the current docs layout version.
type: regex
target: { source: file, path: pod-docs/README.md }
pattern: 'pod docs: 2'
---
