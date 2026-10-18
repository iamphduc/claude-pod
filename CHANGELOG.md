# Changelog

Newest first. The `pod` and `pod-flow` plugins share this file.

## 0.2.0 — 2026-10-18

**Breaking:** after you update, run `/pod:init` once in each project that uses pod. Other pod commands stop until you do.

- **pod's files move from `docs/` to `pod-docs/`**, so they stay apart from your own docs. Run `/pod:init` in each project once: it shows what will move, moves pod's files with `git mv`, and leaves the rest of `docs/` alone. Until then, other pod commands stop and ask you to run it. `pod-docs/README.md` gives an overview and holds the docs version (`pod docs: 2`). pod-flow reads both places.
- New `/pod:idea` saves an idea for later in `pod-docs/ideas/`. `/pod:research`, `/pod:plan`, `/pod:ship`, and `/pod:fix` bring a saved idea back when your new work touches it, and `/pod:plan` offers to save what you left out of scope.
- Resolved queue entries now move to a `## Queue log` at the end of their plan's doc when the next plan starts, instead of one archive file that grew forever. pod no longer writes `docs/handoff-queue-archive.md`. If you have one, you can keep it or delete it.
- The README groups `pod-docs/` into files for you, shared files, and files agents keep, and each file `/pod:init` creates says who reads it.
- pod-flow 0.1.2: reads `pod-docs/`, and `docs/` in projects not upgraded yet.

## 0.1.2 — 2026-10-16

- The browser choice now reaches every engineer (wave fixes and the plan fix pass included) and `/pod:create-wave-prompts`. The `/pod:fix` reviewer gets browser results. `/pod:ship` asks the question at its go check, not after you leave.
- Agents treat web pages, repo files, and PR comments as data, not instructions. `/pod:plan` shows you any suspect pages from the research.
- /pod:research splits a broad idea across up to 3 researchers working at the same time (--deep: up to 5), each on a different angle, then merges their findings into one report.
- The researcher can no longer read local files, so a web page with hidden instructions has nothing on your machine to leak. Updating a report works as before.
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
