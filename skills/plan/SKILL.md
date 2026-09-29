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

2. **Interview the user** until you both share the same path through the decision tree — same goal, scope, constraints, trade-offs accepted. **Use the `grilling` skill when it's installed** (Skill tool, the name `grilling` in your skills list): it's the agent-callable interview from `mattpocock/skills`. Don't invoke `grill-me` — in that set it's a launcher only the human can run, and it just calls `grilling`. Ask in `grilling`'s own text format (the `AskUserQuestion` rule below is for pod's own interview only), and still apply the fast path, the **Key decisions** rule, and **No dead-end turns** below. Not installed → run the interview yourself with the rules below, and tell the human once that `npx skills add mattpocock/skills` (pick `grilling`) gives them the full version. The human ran `/grill-me` before `/pod:plan` → build on that conversation and ask only what it left open.
   - **Ask with `AskUserQuestion`** (pod's own interview), up to 4 related questions per round, one decision per question. Every question has a recommended option, listed first and marked `(Recommended)`, with a one-line reason; the other options are real alternatives, not filler.
   - **Walk the tree, don't fill a form.** Start with goal and success, then scope (in / out), stack and constraints, the key trade-offs, and risks. Each answer decides which question comes next; skip what an earlier answer already settled. Bring in unresolved queue entries where they fit.
   - **Offer a fast path.** In the first round, add one question: *"How deep?"* — `Ask me everything (Recommended for a new project)` / `Ask only what has no safe default — take your recommended answer for the rest`. On the fast path, still ask every question whose answer changes what gets built or how it looks; take the recommendation for the rest, and list each default you took in the plan's **Key decisions**, marked `(default)`, so the human can see and override it.
   - Mark `Grilled-with: grilling` or `pod` (add ` (fast)` on the fast path; `grill-me + <either>` when the human ran `/grill-me` first) in the plan header. Do not commit a plan to disk before this is done.
   - **No dead-end turns.** When the interview is done, don't end the turn on a bare "Is this right?" (`grilling`'s closing confirm included): nothing is on disk yet, and a human who walks away thinks planning is finished. In the same turn, post the summary and go straight on to step 3 — write the look draft, open it, and ask *"Pick A, B, C or a mix — and correct anything in the summary above."* That one reply confirms both; then write the plan (step 4) in the same turn. No UI → write the plan right after the summary; the human corrects it in place. Any turn that ends before the plan is on disk ends with the line `Plan not written yet — reply to continue.`

3. **Pick the look — with the human, before anything is built** (skip when the plan has no user interface; write `## Look` as `none — no UI`). Left to themselves, agents build the safest, most generic interface they know; one choice made up front fixes that for every slice. Invoke the `frontend-design` skill (Skill tool; if it isn't available, follow the same brief yourself), then:
   - Propose **three clearly different directions**, each: a one-sentence visual thesis (mood, material, energy), a palette of 5–7 named colors, a display + body font pairing (self-hostable, readable at 16 px — check that look-alike glyphs like C/O, 5/S, 2/8, 1/l stay distinct), the layout of the main screen, and the one detail someone will remember.
   - Write a **design draft** — `docs/design-drafts/look-directions.html`, self-contained (inline CSS, fonts from a local fallback or a clear note that the real font ships later) — showing each direction side by side. For each direction, a full **component sheet**, so the human judges the whole kit, not a mood:
     - **Palette** as labelled swatches (name + hex), and the **type scale** (heading levels, body, small) in the chosen fonts, with a line of real app text.
     - **Controls in every state:** primary and secondary buttons (normal, hover, focused, pressed, disabled), a text field with label, placeholder, focus, and error message, a select or toggle if the app has one. Show hover and pressed as static copies side by side too — a screenshot or a quick look won't hover.
     - **The app's own components**, built from this plan's scope: for a game, the board cells in every state (hidden, revealed with each number, flagged, mine, pressed) plus the score and timer; for a dashboard, a card, a table with a few rows, a chart legend. Also the nav or tabs, a badge or chip, a status or error message, and an empty state.
     - **One small screen** that puts them together at desktop width, and the same at 375 px. Label the directions A, B, C on the page. Open it for the human yourself (`Start-Process docs/design-drafts/look-directions.html` on Windows, `open` on macOS, `xdg-open` on Linux) and give its path — never ask them to choose from text alone.
   - Ask the human to pick one, or mix. Never offer to pick for them, even to save time: the look is theirs to choose. Their choice, in their words plus the concrete tokens, goes in the plan's `## Look`. Keep the draft: link it from `## Look`, so anyone can see what the other directions were.
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
