---
max_turns: 20
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent]
---

We're in `/pod:research` for a habit tracker, at its **Merge** step: both researchers are done and checked. Dispatch the merge now, per `/pod:research`, with these two parts pasted in as text. The repo is the current folder and the slug is `habit-tracker`. Don't do anything else.

Part 1 (`pod-docs/research/habit-tracker.parts/1-existing.md`):

```
# Research: habit tracker — existing

_Generated: 2026-10-20 · Depth: standard · Researchers: 1 · Searches: 6 · Pages read: 5_

## What exists
| Name | Link | What it does | Alive? | License | How close to the idea |
|------|------|--------------|--------|---------|-----------------------|
| Loop Habit Tracker | https://github.com/iSoron/uhabits | Android habit tracker with streaks and charts | yes · 2025-09 release · 9k stars | GPL-3.0 | close: same core, Android only |
| Habitica | https://habitica.com | Habits as a role-playing game | yes · active | GPL-3.0 (server) | partial: game-first |

## Sources
- Loop Habit Tracker repo — https://github.com/iSoron/uhabits — 2025-09
- Habitica home — https://habitica.com — 2025-10
```

Part 2 (`pod-docs/research/habit-tracker.parts/2-gaps.md`):

```
# Research: habit tracker — gaps

_Generated: 2026-10-20 · Depth: standard · Researchers: 1 · Searches: 6 · Pages read: 5_

## Gaps and angles
- Users of Loop ask for an iOS or web version in its issues — [source](https://github.com/iSoron/uhabits/issues)

## Questions for the plan
- Web, mobile, or both? — why it matters: the closest app is Android only — options: web / iOS / both

## Sources
- Loop issues — https://github.com/iSoron/uhabits/issues — 2025-10
```
