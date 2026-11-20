---
type: regex
# The human said no to CI before: no offer to add it. A pointer to ask for it later is fine.
pattern: '(do you want|want me to|shall I|should I|would you like|I can add)[^\n]{0,80}\b(CI|pod-ci\.yml|workflow)\b'
match: not_contains
flags: i
---
