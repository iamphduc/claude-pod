---
# The brief's ## CI is no longer none.
type: regex
target: { source: file, path: pod-docs/codebase-structure.md }
pattern: '## CI\s*\n+[^\n]*(pod-ci|workflow|GitHub Actions|gitleaks)'
flags: i
---
