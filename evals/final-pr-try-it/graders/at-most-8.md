---
type: regex
# At most 8 steps: no step 9 in the list.
pattern: '## Try it[ \t]*\r?\n(?:[ \t]*\r?\n|\d+\. [^\n]*\n)*9\. '
match: not_contains
---
