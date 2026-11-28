---
# The workflow scans for secrets.
type: regex
target: { source: file, path: .github/workflows/pod-ci.yml }
pattern: 'gitleaks/gitleaks-action'
---
