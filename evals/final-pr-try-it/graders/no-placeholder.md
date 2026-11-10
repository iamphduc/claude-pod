---
type: regex
# No `<…>` placeholder in a step.
pattern: '\n\d+\. [^\n]*<[a-zA-Z][^>\n]*>[^\n]*→'
match: not_contains
---
