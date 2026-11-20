---
type: regex
# An empty repo gets no CI unless the human asks: no interview question about it.
pattern: '❓[^❓➡]*\b(CI|continuous integration)\b'
match: not_contains
flags: i
---
