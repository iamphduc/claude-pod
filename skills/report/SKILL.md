---
name: report
description: Use when the user types /pod:report [plan-slug] or asks for a report of what a plan built. Also run by /pod:code and /pod:autopilot at plan complete. Writes one self-contained HTML file — key features, key decisions, data structures, and how the agents worked together — from the plan's paper trail and the code.
---

Write `docs/reports/<plan-slug>.html`: a report a person can open in a browser and read in ten minutes to learn what the plan built, why it's shaped that way, and how the agents got there. Then stop. Don't change anything else.

Parse from args: the plan slug. None given → the newest plan in `docs/plans/` (archived or not); several equally likely → list them and ask.

## Gather — from files and GitHub, not memory

Read everything below before writing a line. If you ran this plan in this session, what you remember may fill gaps, but the files win when they disagree.

- **The plan** — `docs/plans/<plan-slug>.md`: Goal, Why, Scope, Key decisions, **Look**, Verification.
- **Every sprint doc for the plan** — `docs/sprints/archive/*.md` (and `docs/sprints/*.md` if one is still active) whose `From plan:` header names it: status boards (slice, wave, Confidence), per-slice Scope and criteria, decisions recorded in the doc, and each **Sprint summary** (sync, slices shipped, slice log, queue counts, stalls, token cost).
- **Decisions** — `docs/decisions.md`, the entries made during this plan (by date, or linked from the plan or queue).
- **The queue** — `docs/handoff-queue.md`, entries tagged with this plan's sprints plus project-wide ones dated inside the plan's run: what was raised, by whom, and how it was resolved.
- **GitHub** — the wave PRs and the fix pass (`gh pr list --state all --base <plan-slug> --json number,title,createdAt,mergedAt,body`): each wave PR's body (its slices' `NOTE`s, stray paths, wave fix). The final PR (`gh pr list --state all --head <plan-slug> --json number,url,createdAt,mergedAt,mergeCommit`) and its reviewer comments (`gh pr view <n> --comments`).
- **Git** — the plan branch's first-parent history, oldest first: not merged yet → `git log --first-parent --reverse --format='%h %ad %s' --date=iso origin/<merge-target>..origin/<plan-slug>`; merged as commit `M` → the same with `M^1..M^2`. It shows the wave merges, sync merges, `Review fixes`, and the plan's start and end times.
- **The code**, for **Data structures**: the database schema (migrations, `CREATE TABLE`, ORM models), the main types or models (Pydantic models, TypeScript interfaces, dataclasses), the API surface (method, path, request, response), and any state machine or protocol. Read the files; name each one's path.

## Write — one HTML file

Self-contained: inline CSS and inline SVG only, no scripts from elsewhere, no web fonts from a CDN, no network requests — it must open from disk, offline, years from now. Readable first: a clear type scale, body text at 16 px or more, good contrast in light and dark (`prefers-color-scheme`), a table of contents, tables that scroll sideways on a phone instead of breaking the page. If the plan has a **Look**, borrow its palette and display font for headings so the report feels like the project; body text stays plain and legible. Invoke the `frontend-design` skill (Skill tool) before styling it, if it's available.

Sections, in this order:

1. **At a glance** — the goal in one sentence; what shipped in one or two; numbers: sprints, waves, slices, PRs, wall time from first to last commit, approximate agent tokens (sum of the Sprint summaries), review verdict and rounds.
2. **Key features** — what a user can do now, one short paragraph or bullet each, tied to the plan's Verification criteria (mark each met / not met / not checked). If the app has a UI, include one or two screenshots: bring it up per the `## Smoke recipe` in `docs/codebase-structure.md`, capture 1280 px and 375 px, embed them as `data:` URIs (PNG, a width of ~1200 px at most), and stop what you started.
3. **Key decisions** — one card each: the decision, why (the context that forced it), what else was considered, and the consequence. Mark which were made by the human (plan interview, queue resolutions) and which by agents (sprint-planner, engineers' defaults the human later accepted). Link `docs/decisions.md` entries by title.
4. **Data structures** — each table, model, or type that matters: its fields (name, type, meaning), where it lives (path), and who reads or writes it. The API as a table (method, path, purpose, request → response). A small inline-SVG diagram of how the main structures relate, when there are more than three.
5. **How the agents worked together** — the conversation, told as a timeline. Per sprint: what the sprint-planner decided (wave shape, notable criteria); per wave: each slice dispatched (one-line scope) → what its engineer reported back (Confidence, test-first, notable `NOTE`s and `PENDING`s, time lost) → what the orchestrator did with it (wave check, wave fix, stray paths, stalls, halts) → the wave PR. Then the review: each finding the reviewer raised, the fix pass, round 2. Mark every point where the human stepped in (a halt resolved, a queue entry answered, an instruction given). Quote agents sparingly and exactly — a short phrase from a report or PR, never an invented line.
6. **What's left** — the open queue entries, grouped **Fix next / Before hosting / Someday**, one line each.
7. **Sources** — the files, PRs, and commits this report was built from, as a list.

Say plainly when something couldn't be found (e.g. `token cost not recorded for sprint 2`); never estimate a number without saying it's an estimate.

## Finish

Check it: the file opens without errors, has no `http` requests in `src`/`href` except links in **Sources**, and every section is there. Reply with its path and a one-line way to open it (`start docs/reports/<plan-slug>.html` on Windows, `open …` on macOS, `xdg-open …` on Linux). When `/pod:code` or `/pod:autopilot` ran you, return to its next step — it commits the report with the plan's close-out.
