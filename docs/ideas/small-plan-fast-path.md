# Idea: a faster path for small plans

Status: parked. Build it only when the trigger below shows up.

## The idea

Two ways to save time on small ideas in `/pod:ship`:

- **`--fix-if-small`:** skip the size-check question and run `/pod:fix` when the idea passes it.
- **One-sprint plans skip research by default.**

## Why it's on hold

- `/pod:ship` already sorts easy from hard: its size check runs before research and offers `/pod:fix` (no plan, no sprint), and `/pod:fix` picks `sonnet` for contained work. The question costs one reply.
- Skipping the plan without asking is the same trade as skipping review by diff size: small isn't the same as safe (`docs/design.md`, **Reviewing `/pod:fix` PRs**). A flag the human chooses keeps that call with them.
- `--no-research` already skips research.

## What would make it worth building

- A retro shows two or more one-sprint ship runs where research changed nothing in the plan.
- Humans answer "yes" to the size-check question nearly every time.

## Sources

- [Claude Code — Best practices](https://code.claude.com/docs/en/best-practices): "If you could describe the diff in one sentence, skip the plan."
- [arXiv 2509.03581 — Learning when to plan](https://arxiv.org/abs/2509.03581)
