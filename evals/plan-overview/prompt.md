---
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

/pod:plan Let users store their own API keys for a third-party service, safely

Skip research and the interview: they're done, and every answer is below. Use the slug `api-keys` and one sprint.

- Goal: a signed-in user can save, list (masked), and delete their own API keys.
- Keys are encrypted at rest with a server key from the `KEY_SECRET` environment variable, and never returned in full after they're saved.
- New routes under `src/routes/`, a new `api_keys` table through `src/db/`, and a small encryption module.
- Out of scope: sharing keys, key rotation, and any UI. There's no UI, so the look is `none — no UI`.

Write the plan now. Opening a browser isn't possible here, so give the overview page's path instead.
