# Changelog

Newest first. The `pod` and `pod-flow` plugins share this file.

## Unreleased

- Every queue entry written during a plan, including the plan-complete entry and autopilot's halt entries, has `plan: <slug>` in its header, so tools can tell which plan an entry belongs to. When a new plan starts, an older `plan <slug> complete` entry without the tag moves to that plan's Queue log instead of being deleted.
- `/pod:code` and `/pod:fix` send the reviewer its context as labeled field lines (`- **PR URL:** <url>`, `- **plan slug:** <slug>`), using the names in the reviewer's Required dispatch context. Longer items, such as round-1 findings, go in a block under their label.
- pod-flow's review list shows only the current plan's rounds. Before, reviews from `/pod:fix` and from earlier plans in the same session were mixed in, and their tokens counted toward the plan.
- pod-flow opens with a **needs you** group: each pending queue entry addressed to you that asks something (a `BLOCKED`, a decision, a product choice, or a one-way door), so a question doesn't scroll away in the chat. The header counts them, and a narrow terminal tells each one once. "Someday" notes and answered entries stay out.
- At a plan's hand-back, pod-flow shows a **Run app** button. It sends `run app` for you and turns into **Stop app**. Under it is a checklist of the `pod-docs/features.md` rows the plan's PR added or changed, which you can tick. The hand-back's reply words are now `run app` and `stop app` instead of `try` and `stop`.

## 0.3.0 — 2026-10-21

- pod checks that the browser actually opens a page, under a 30-second limit, instead of trusting `agent-browser --version`. pod's commands run through Bash, because on Windows `agent-browser` can hang when PowerShell captures its output.
- When `agent-browser` doesn't work, pod also offers chrome-devtools-axi, so engineers keep checking their own pages.
- After a browser hang, the orchestrator checks the browser again before the next wave and warns the engineers still to come. Known-issue files now name the step that failed and say `Cause: unknown` until a cause is confirmed.
- Dev servers start as a background command that ends in `; exit 0`, and agents prove a server started from the page's `<title>`, so a planned stop no longer shows as a failed command.
- The scout's smoke recipe says how a worktree runs its own code (for example `PYTHONPATH=<worktree>/src`) and how to check it.
- The sprint-planner looks for an additive, two-way change before it marks a slice as a one-way door.
- Engineers scope test commits by area (`test(<area>)`), like every other commit.
- Teardown runs with the shell outside the worktree and its servers stopped, so Windows can remove the folder.
- `/pod:autopilot` and `/pod:ship` ask once where unattended runs merge, recommending a `pod-staging` branch. At the end, autopilot opens a PR from `pod-staging` to your default branch for you to merge after a look.
- Two pod runs on one machine no longer fight over ports. Each plan or fix claims a port base (3000, 3100, …) with a file in the system temp folder, records it in the plan doc, and offsets every port from it.
- New JavaScript projects use pnpm, so each engineer's install reuses one shared store instead of downloading everything again. Existing projects keep the package manager their lockfile names, and engineers never switch it.
- New `pod-docs/feature-details/`: at the end of each plan, the reporter writes one short file per feature the plan added or changed, covering how it works, why it's built that way, and what to watch out for. Engineers, the sprint-planner, and `/pod:plan` read it before they change that feature, and a `/pod:fix` adds a line to its history.
- `/pod:plan` shows the three look directions as one grid with columns A, B, and C, so you compare the same button, input, or screen side by side. The first row still shows each direction whole.
- Engineers check a change where it lives (the real command, a real request, or the page), and saved data counts only when read back after a reload or restart.
- `/pod:ship` maps an existing project in the background while it researches, so the plan interview starts from the codebase brief.
- At plan end, the orchestrator fixes any part of the codebase brief the plan made wrong, so the next plan doesn't start from a stale map.
- The README says how to connect the Chrome DevTools MCP when you can't install `agent-browser`.

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
