---
# The workflow runs the smoke recipe's Verification: command.
type: regex
target: { source: file, path: .github/workflows/pod-ci.yml }
pattern: 'node --test'
---
