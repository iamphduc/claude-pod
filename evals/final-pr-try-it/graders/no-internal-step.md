---
type: regex
# Nothing to see, no step: the test fixture helper gets none.
pattern: '## Try it[ \t]*\r?\n(?:[ \t]*\r?\n|\d+\. [^\n]*\n)*\d+\. [^\n]*fixture'
match: not_contains
flags: i
---
