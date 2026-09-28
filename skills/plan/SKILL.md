---
name: plan
description: Use when the user types /pod:plan or asks to create/update a strategic main plan under docs/plans/.
---

Work in thinking mode. Produce a strategic main plan under `docs/plans/`. Do not implement, dispatch, or generate sprint files.

## Your job (4 steps)

1. **Ground in the docs layout.** Read whichever exist:
   - `docs/codebase-structure.md` — codebase brief
   - `docs/decisions.md` — authoritative architectural decisions
   - `docs/known-issues/*.md` — durable constraints
   - `docs/plans/*.md` — existing plans (check for overlap; skip any marked `Status: archived`)
   - `docs/handoff-queue.md` — surface unresolved `PENDING` (deferred work) and pending `BLOCKED` (live problems) during the interview; resolve `BLOCKED` before drafting

   If `docs/` is empty, note it in the plan's Assumptions and ground in the codebase via `Read`, `Grep`, `Glob`.

   **No application code yet** (only docs and config) → the plan's first sprint starts with a **bootstrap**: the thinnest runnable skeleton of the chosen stack, its test runner, the brief's `## Smoke recipe` and `## CI` filled in, and a CI workflow on pull requests. Put it in that sprint's Goal; the sprint-planner makes it wave 1's only slice, and `/pod:autopilot` accepts the missing smoke recipe and CI until it lands.

2. **Interview the user.** Invoke the `grill-me` skill via the `Skill` tool. If unavailable, interview the user manually until you both share the same path through the decision tree — same goal, scope, constraints, trade-offs accepted. Mark `Grilled-with: grill-me` or `Grilled-with: manual` in the plan header. Do not commit a plan to disk before this is done.

3. **Pick the look — with the human, before anything is built** (skip when the plan has no user interface; write `## Look` as `none — no UI`). Left to themselves, agents build the safest, most generic interface they know; one choice made up front fixes that for every slice. Invoke the `frontend-design` skill (Skill tool; if it isn't available, follow the same brief yourself), then:
   - Propose **three clearly different directions**, each: a one-sentence visual thesis (mood, material, energy), a palette of 5–7 named colors, a display + body font pairing (self-hostable, readable at 16 px — check that look-alike glyphs like C/O, 5/S, 2/8, 1/l stay distinct), the layout of the main screen, and the one detail someone will remember.
   - Write a **design draft** — `docs/design-drafts/look-directions.html`, self-contained (inline CSS, fonts from a local fallback or a clear note that the real font ships later) — showing each direction side by side. For each direction, a full **component sheet**, so the human judges the whole kit, not a mood:
     - **Palette** as labelled swatches (name + hex), and the **type scale** (heading levels, body, small) in the chosen fonts, with a line of real app text.
     - **Controls in every state:** primary and secondary buttons (normal, hover, focused, pressed, disabled), a text field with label, placeholder, focus, and error message, a select or toggle if the app has one. Show hover and pressed as static copies side by side too — a screenshot or a quick look won't hover.
     - **The app's own components**, built from this plan's scope: for a game, the board cells in every state (hidden, revealed with each number, flagged, mine, pressed) plus the score and timer; for a dashboard, a card, a table with a few rows, a chart legend. Also the nav or tabs, a badge or chip, a status or error message, and an empty state.
     - **One small screen** that puts them together at desktop width, and the same at 375 px. Label the directions A, B, C on the page. Tell the human to open it (`start docs/design-drafts/look-directions.html` on Windows) — never ask them to choose from text alone.
   - Ask the human to pick one, or mix. Their choice, in their words plus the concrete tokens, goes in the plan's `## Look`. Keep the draft: link it from `## Look`, so anyone can see what the other directions were.
4. **Write the plan** to `docs/plans/<slug>.md`. `<slug>` is short kebab-case (e.g. `parent-portal-mvp`). If the file already exists, ask the user: update or new?
   - **Update** → `Edit`; preserve `_Generated:_`, add an `_Updated:_` line.
   - **New** → pick a different slug; never silently overwrite.

## Main-plan format

Read `${CLAUDE_PLUGIN_ROOT}/skills/plan/template.md` before drafting.

## End of turn

After writing the plan, end your turn telling the user the slug and that `/pod:sprint <slug>` drafts the first sprint.

## Discipline

- **Honor prior decisions.** `docs/decisions.md` is authoritative. If your plan must contradict it, surface that in "Key decisions" as a deliberate override with rationale — never silently.
- **Keep plans small — 2–4 sprints.** Code is reviewed once, at plan end, and a bug found then was built on for the rest of the plan. A bigger goal becomes several plans in a row, each merged to the merge-target before the next starts; say so in the plan's Scope.
- **Strategic, not tactical.** Describe sprints by goal and dependency. If you find yourself naming individual files in the main plan, stop and trim — that detail belongs in the sprint doc.
