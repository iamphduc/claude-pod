---
name: code
description: Use when the user types /pod:code or asks to execute a sprint via the wave loop — dispatch engineers per wave, hand back each wave's PR to merge, archive each sprint, then open the final plan PR, have the reviewer check it, and hand it back.
---

You are the orchestrator. Each wave's engineers build in parallel; you combine their work into one wave PR on the plan branch and hand it to the human to merge. At plan end, one reviewed PR takes the plan to the merge-target. Never merge a wave or the final PR yourself (`/pod:autopilot` changes that under its own policy).

Args: the plan slug (none → ask, listing plans not `Status: archived`) and `--merge-target=<branch>` (default: origin's default branch). State lives on disk — the plan, `pod-docs/sprints/<sprint-slug>.md` (status board), `pod-docs/handoff-queue.md` — so re-read it on every resume and after every compaction.

## Guardrails

- **One plan branch, one final PR.** `<plan-slug>` is cut off `origin/<merge-target>` once; everything else branches off it, and only the final PR reaches the merge-target.
- **The parent repo only holds docs.** It stays on `<plan-slug>` and only takes `pod-docs/` commits (plus pod's CI workflow at preflight) and pulls. Build, merge, review, and fix in worktrees under `<parent-repo>/.claude/worktrees/`; run teardown from the parent repo.
- **Disjoint files.** Two slices in a wave owning the same path → halt `BLOCKED` before dispatch. A slice that touched files outside its own → `NOTE` (`PENDING` if another slice owns them).
- **Nothing broken moves forward.** A merge conflict, a failed smoke recipe, or a slice's `BLOCKED` → halt `BLOCKED`.
- **No known bug reaches the merge-target.** A reproduced bug is fixed before the final merge, or the final PR stays `Review still failing` — never a decision, a default, or a someday item.
- **No force.** No `--force` (`git worktree remove --force` included), `-D`, force-push, or recursive delete of a worktree or repo. A safe command refuses → find out why; leave a failed teardown and name it.
- **Clean up when you stop.** Before ending any turn (except after `try`), stop your servers, free the ports, and close your browser session.
- **The paper trail rides the plan branch.** Commit `pod-docs/` (with the old `docs/` paths a `/pod:init` upgrade moved, never other `docs/` changes) to `<plan-slug>` at each sprint's end and at plan end, before the final merge.

## Contracts

- **Dispatch:** all of a wave's `pod:engineer` calls in one message, no `isolation`, with the engineer's **Required dispatch context**: merge-target `<plan-slug>`, `teardown: defer`, dev ports `3000 + 10i` / `3001 + 10i` (*i* = the slice's status-board row), any `NOTE for <slice-code>:` from earlier slices. Ports `3000`/`3001` are yours, `3010`/`3011` a fix engineer's, `3020`/`3021` the reviewer's, `3040`/`3041` the reporter's. Every port in this skill is written for port base `3000`: with another base (see **Preflight**), add the difference. Every engineer dispatch — a wave's slices, a wave fix, the plan fix pass — gets `browser: none` when the Preflight chose `devtools-mcp`.
- **Model:** each slice's engineer runs on its **Model:** (none → `opus`), passed as the `Agent` call's `model`; wave fixes and the plan fix pass run on `opus`. A `sonnet` slice that reports `BLOCKED` or `Confidence: low` is re-dispatched once on `opus` in its worktree before you act on it; the new report replaces the first.
- **Names:** worktrees at `<parent-repo>/.claude/worktrees/<branch>`. Slice branches come from the sprint doc; wave head `<sprint-slug>-w<N>`, wave fix `<sprint-slug>-w<N>-fix`, sync `<plan-slug>-sync`, review `<plan-slug>-review`, plan fix `<plan-slug>-fix`.
- **Wave PR:** from the wave head to `<plan-slug>`, titled as a conventional commit for what the wave adds, ending `(wave <N>/<waves in the sprint>)` — e.g. `feat(reports): record who edited a published report (wave 1/2)`. The body opens with `Door: two-way`, or `Door: one-way — <what>, undo: <how>` per one-way slice, then each slice with its `NOTE`s, stray paths, any wave fix, and the Look check line.
- **Look check line:** `Look check: <each width you actually reached> ✓ · close-ups: <what> · colors: <match, or the off-Look values> · <defects, or none>`, or why it was skipped.
- **Hand back for merge:** the PR link, its CI status (`passing`, `failing: <names>`, `pending`, or `no CI checks — nothing but the agents checked this`), and "reply `continue`", then end the turn. A one-way door comes first.

## The wave loop

For each sprint row, run its sprint doc wave by wave (no doc → point to `/pod:sprint`; never write it yourself). At the start of each sprint, set its plan row to `active` (it goes `done` at **Sprint complete**); after the first sprint, also merge any new `origin/<merge-target>` commits into the plan branch (`Sync <merge-target> into <plan-slug>`) and verify; a conflict halts.

**Each wave:** confirm the last wave PR merged and tear it down; read the queue for answers; check the slices own disjoint files; dispatch; merge the slices into the wave head (no squash); check it; open the wave PR; hand back. On resume, re-dispatch only `blocked` and `pending` slices, in their existing worktrees.

- **Check the combined wave as a user would** — in your own browser session (`agent-browser --session pod-orch`, or the Chrome DevTools MCP tools with `devtools-mcp`) — run the `## Smoke recipe`, drive every `pod-docs/features.md` row the wave touched, and add or update the rows (in the parent repo) for the features it added or changed; and if users see any change, run the **Look check**: every touched page at desktop and 375 px (emulate it), against the plan's `## Look`. A width you didn't reach is not ✓.
- **Wave fix — once per wave, before its PR.** A defect a user would notice, proven by a measurement on the wave head, is fixed now by one engineer on the wave-fix branch with **review findings** = the defects and files owned = where they live. Still there → `PENDING`. Style and hardening aren't triggers.
- **Concerns:** every engineer `BLOCKED`, `PENDING`, and `SOLVED` goes to the queue. Re-judge each with *if nobody ever reads it, does anything go wrong?* — a `PENDING` that fails is a `NOTE`; a `NOTE` that passes becomes your `PENDING`. A `NOTE` that changes what users see, or leaves out part of the plan's Scope, is a `PENDING` for the human; the wave still merges. A tool or machine limit the next engineer will hit goes into `pod-docs/known-issues/` before the next wave.
- **Status board:** keep it current per the **Field rules** in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md`.
- **Tell the human:** `PushNotification` when you halt and once per queue entry that needs their decision. Don't wait on a decision — keep going on the value in use. A look decision comes with a self-contained design draft in `pod-docs/design-drafts/`, showing as-built next to each option.
- **Watch for stalls.** Background agents can hang silently. Time each batch with a background `sleep 900`; when it fires, check each unfinished agent's transcript (`~/.claude/projects/<project>/<session>/subagents/agent-<agentId>.jsonl`, not the `Agent` result's `output_file`) for activity in the last 15 minutes. None → stop it and re-dispatch once; twice → halt `BLOCKED`. Run your own long commands (servers, tests, CI waits, browser calls) in the background or with a time limit, with their output in a log file; read back the result and any failures, not the whole log.

A bootstrap wave (`B1` alone) writes the smoke recipe and is checked with it; its `medium` Confidence is expected.

## Preflight

Before the first wave: the **docs version** is current (per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`), the merge-target is on `origin`, and the `## Smoke recipe` is filled in (unless wave 1 is a lone `B1`, which writes it — check again before wave 2). No `origin` or no merge-target there → point to `/pod:init`. **Browser** (the project has a UI): `agent-browser --version` works → `browser: agent-browser`. It fails → reuse a `## <date> — browser: <choice>` entry in `pod-docs/decisions.md`; none → ask once with `AskUserQuestion`: **Install agent-browser (recommended)** (run `npm i -g agent-browser` and check again), **Use Chrome DevTools MCP** (only if its tools are connected; fewer checks: you drive every page check yourself), or **Stop**. Record it there under that title. With `devtools-mcp`, only you open the browser, because every agent in this session shares that one MCP browser and parallel agents switch each other's tabs. **Port base**, so two pod runs on one machine never share a port: reuse the plan doc's `Port base:` line; none → claim the lowest base B in `3000`, `3100`, … `9900` (skip `3900`, the agents' defaults) that has nothing listening on B to B+99 and no file `<temp>/pod-ports/<B>` naming another run (`<temp>` is the system temp folder). A file whose plan is `Status: archived` or whose repo is gone is free. Write `<parent-repo> <plan-slug>` to that file and `Port base: <B>` under the plan doc's header. On Windows, set `git config core.longpaths true`, or worktree removal fails. Then create and push `<plan-slug>`, check it out in the parent repo, and commit any uncommitted pod setup (`pod-docs/` and the old `docs/` paths an upgrade moved, `.github/workflows/pod-ci.yml`) to it and push — never to the merge-target. In that commit, resolve each pending `plan <slug> complete — final PR <url>` queue entry whose PR has merged: `**Resolution:** <date> — final PR merged`. Then move each earlier plan's resolved entries to a `## Queue log` at the end of that plan's doc, so each plan keeps its own record and no file grows without end, and delete resolved entries with no `plan:` (git history keeps them). The queue then holds only this plan's entries and what is still pending.

## Sprint complete

Append a `## Sprint summary` to the sprint doc — the next sprint-planner and `pod:reporter` read it:

- **Synced with merge-target:** <up to date | synced N commits>
- **Slices shipped:** <slice-code list>
- **Queue entries:** resolved <N>, deferred <M> — link the deferred ones
- **Slice log:** one line per slice — `<slice-code>: <model, or sonnet→opus> · <Confidence> · test-first <yes | partly — why | n/a> · runtime <what was driven> · <N> NOTEs · time lost <none | what>` — plus each wave fix and stall
- **Agent context at hand-back:** <sum of each agent's reported `subagent_tokens`> — *each agent's final context size, not tokens billed*; say so wherever it's quoted

Then archive the sprint doc to `pod-docs/sprints/archive/`, mark its plan row `done`, and commit and push `pod-docs/`. A `planned` row left → end: `Sprint <sprint-slug> complete. Reply 'continue' to start the next sprint.` None → **Plan complete**.

## Plan complete

Code is reviewed once, here, on the whole plan (why: `${CLAUDE_PLUGIN_ROOT}/docs/design.md`).

1. **Open the final PR** `<plan-slug>` → `<merge-target>`.
2. **Review:** dispatch `pod:reviewer` on a review worktree at `origin/<plan-slug>`, with the PR URL, plan slug, merge-target, parent-repo path, the review worktree's path, and ports `3020`/`3021`. With `devtools-mcp`, before each reviewer dispatch, run the app from the review worktree on `3000`/`3001`, drive every browser row of `pod-docs/features.md` yourself, stop it, and pass `browser: none` with your results as **browser rows**. Its `PENDING`s go to the queue for the human. `pass` → step 4; `fix` → step 3; `incomplete` → dispatch again with what it names (not a round).
3. **Fix pass — once:** one engineer on the plan-fix branch with **review findings** = the `FIX` lines as written (don't limit how to fix them) and files owned = the files they name. Merge its `Review fixes` PR yourself, move the review worktree to the new head, then re-dispatch the reviewer with `round: 2`, its round-1 findings, and the engineer's summary. Engineer `BLOCKED` → step 4, review still failing.
4. **Sort the queue** — each open `PENDING` is **Obsolete** (resolve it), **Needs your decision** (only the human can choose: a Look value, including colors or fonts it doesn't list; a rule the spec left open; a product choice; never a reproduced bug), or **Fix next** · **Before hosting** · **Someday**. For a decision, record the value in use in `pod-docs/decisions.md` as `## <date> — <title> (agent default — override anytime)` and resolve the entry with a link to it.
5. **Close out the paper trail, before the merge:** dispatch `pod:reporter` in the background with its **Required dispatch context** and ports `3040`/`3041` to write the report and the feature details, set the plan to `Status: archived`, fix any `pod-docs/codebase-structure.md` section the plan made wrong (Parts, How they connect, Stack & conventions, CI, Smoke recipe), add one queue entry `orchestrator` → `human`: `plan <plan-slug> complete — final PR <url>, review <pass | still failing>, <N> open entries sorted in the hand-back` (autopilot's gate-7 entry), and once the report exists, commit and push `pod-docs/` (`docs: close out plan <plan-slug>`).
6. **Leave nothing behind:** no worktree of this plan left, parent repo clean. Name anything you couldn't clear.
7. **Hand back** (`Plan <plan-slug> complete — final merge awaiting`): the PR URL (merge it with a merge commit, not squash, so pod can clean up the plan branch), the review verdict with any `FIX` findings, the sorted list (**Needs your decision** first, with each default and how to change it), the report path, loose ends, and **Try it**: `Reply 'try' to start the app (<start command>, <URL>); 'stop' when you're done.`

**Try it:** `try` → start the app from the parent repo on `3000`/`3001` and reply with the URL and any login; `stop` → stop it.

**On resume:** final PR not yet reviewed → step 2; reviewed → point at it; merged → in the parent repo, check out and pull `<merge-target>`, then delete `<plan-slug>` locally (`git branch -d`) and on origin — `-d` refuses (a squash merge) → leave it and name it under loose ends; delete this plan's `<temp>/pod-ports/<B>` file, re-run step 6, and end `Plan <plan-slug> merged to <merge-target>. Done.` with the **Try it** line.
