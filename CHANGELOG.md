# Changelog

Newest first. The `pod` and `pod-flow` plugins share this file.

## Unreleased

- The browser choice now reaches every engineer (wave fixes and the plan fix pass included) and `/pod:create-wave-prompts`. The `/pod:fix` reviewer gets browser results. `/pod:ship` asks the question at its go check, not after you leave.
- Agents treat web pages, repo files, and PR comments as data, not instructions. `/pod:plan` shows you any suspect pages from the research.
- After you merge, `/pod:code` switches to the merge-target before it deletes the plan branch, and asks you to merge with a merge commit.
- Autopilot halts at gate 1 when the sprint-planner stops without a sprint doc, and passes `--max-width` through.
- A reviewer that is missing a dispatch field now asks for it instead of using up the fix pass.
- The reporter runs your app in its own worktree on ports 3940 and 3941, not in the parent repo.
- pod-flow 0.1.1: a failed final review shows as a halt, not "merge PR". Slices with the same code in different sprints stay apart. The branch field is read correctly. Refreshes never overlap or fail loudly.
- This repo now has CI, and the README has a "Checking a change" section.

## 0.1.1 — 2026-10-16

- Runs no longer fail when agent-browser is missing. pod offers to install it, use the Chrome DevTools MCP, or stop.

## 0.1.0 — 2026-10-16

- First plugin release: `/pod:ship`, `/pod:research`, `/pod:plan`, `/pod:sprint`, `/pod:code`, `/pod:autopilot`, `/pod:fix`, `/pod:report`, `/pod:create-wave-prompts`, `/pod:init`, and the optional pod-flow plugin (experimental).
