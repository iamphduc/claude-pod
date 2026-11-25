#!/usr/bin/env bash
# A set-up pod project where an earlier /pod:ship run finished research and stopped in the interview: a report, no plan.
set -e
. "$(dirname "$0")/../_fixtures/pod-project.sh"
git init -q -b main
git remote add origin https://github.com/acme/notes.git
mkdir -p pod-docs/plans pod-docs/sprints/archive pod-docs/research pod-docs/ideas pod-docs/known-issues pod-docs/feature-details src/routes src/db
pod_readme
printf '# Codebase structure\n\n## What it is\n\nA JSON API in Node for shared notes. No UI. No user accounts yet: every note is public.\n\n## Parts\n\n- `src/routes/`: HTTP routes\n- `src/db/`: SQLite access\n\n## CI\n\nnone\n\n## Smoke recipe\n\n`node src/server.js` serves on port 3000.\nVerification: `node --test`\n' > pod-docs/codebase-structure.md
printf '# Handoff Queue\n\n---\n' > pod-docs/handoff-queue.md
printf '# Features\n\n| Feature | How to prove it |\n|---|---|\n| notes | GET /notes lists every note |\n' > pod-docs/features.md
pod_decisions
pod_config '' '' off
cat > pod-docs/research/user-accounts.md <<'REPORT'
# Research: user accounts for a Node JSON API

_Generated: 2026-11-21 · Depth: standard · Researchers: 1 · Searches: 9 · Pages read: 6_

**Assumptions:** email and password only; no social login.

## What exists
| Name | Link | What it does | Alive? (last release · stars · users) | License | How close to the idea |
|------|------|--------------|---------------------------------------|---------|-----------------------|
| Lucia | https://lucia-auth.com | Session auth guide for JS | archived as a library, now a guide | MIT | close |
| Passport | https://www.passportjs.org | Auth middleware for Express | active | MIT | partial |

## Gaps and angles
- Most guides skip rate limits on login and reset — [source](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Best practices
- Hash passwords with scrypt or argon2, never a fast hash — [source](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- Reset tokens are single-use and expire within an hour — [source](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)

## Ideas to consider
- Rate-limit login and reset by IP and account — grows from the rate-limit gap

## Questions for the plan
- Sessions or JWTs? — why it matters: logout must revoke access — options: server sessions / short JWT plus refresh / JWT only
- Which email service sends reset links? — why it matters: it adds a secret and a dependency — options: SMTP / an API service / log to console in dev

## Suspect pages
- none

## Sources
- OWASP Authentication Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html — 2026-11-21
- OWASP Password Storage Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html — 2026-11-21
- OWASP Forgot Password Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html — 2026-11-21
REPORT
printf '<!doctype html><title>user accounts research</title><h1>Research: user accounts</h1>\n' > pod-docs/research/user-accounts.html
printf 'require("./routes/notes")\n' > src/server.js
printf 'module.exports = {}\n' > src/routes/notes.js
printf 'module.exports = {}\n' > src/db/index.js
pod_commit
