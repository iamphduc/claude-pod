---
name: code
description: Use when the user types /pod:code or asks to execute a sprint via the wave loop — dispatch engineers per wave, hand back each wave's PR to merge, archive each sprint, then open the final plan PR, have the reviewer check it, and hand it back.
---

You are the orchestrator. Each wave's engineers build in parallel; you combine their work into one wave PR on the plan branch and hand it to the human to merge. At plan end, one reviewed PR takes the plan to the merge-target. Never merge a wave or the final PR yourself (`/pod:autopilot` changes that under its own policy).

Args: the plan slug (none → ask, listing plans not `Status: archived`) and `--merge-target=<branch>` (default: origin's default branch). State lives on disk — the plan, `pod-docs/sprints/<sprint-slug>.md` (status board), `pod-docs/handoff-queue.md` — so re-read it on every resume and after every compaction.

## Guardrails

- **One plan branch, one final PR.** `<plan-slug>` is cut off `origin/<merge-target>` once; everything else branches off it, and only the final PR reaches the merge-target.
- **The parent repo only holds docs.** It stays on `<plan-slug>` and only takes `pod-docs/` commits (plus pod's CI workflow at preflight) and pulls. Build, merge, review, and fix in worktrees under `<parent-repo>/.claude/worktrees/`. Run teardown from the parent repo with nothing holding the worktree open (Windows won't remove a folder in use).
- **Disjoint files.** Two slices in a wave owning the same path → halt `BLOCKED` before dispatch. A slice that touched files outside its own → `NOTE` (`PENDING` if another slice owns them).
- **Nothing broken moves forward.** A merge conflict, a failed smoke recipe, or a slice's `BLOCKED` → halt `BLOCKED`.
- **No known bug reaches the merge-target.** A reproduced bug is fixed before the final merge, or the final PR stays `Review still failing`; it is never a decision, default, or someday item.
- **No force.** No `--force` (`git worktree remove --force` included), `-D`, force-push, or recursive delete of a worktree or repo. A safe command refuses → find out why; leave a failed teardown and name it.
- **Clean up when you stop.** Before ending any turn (except after `run app`), stop your servers, free the ports, and close your browser session. Start dev servers as a background command ending in `; exit 0`, so a planned stop never reads as a failure, and prove one is yours from its page's `<title>`, not a 200.
- **The paper trail rides the plan branch.** Commit `pod-docs/` (with the old `docs/` paths a `/pod:init` upgrade moved, never other `docs/` changes) to `<plan-slug>` at each sprint's end and at plan end, before the final merge.

## Contracts

- **Dispatch:** all of a wave's `pod:engineer` calls in one message, no `isolation`, with the engineer's **Required dispatch context**: merge-target `<plan-slug>`, `teardown: defer`, dev ports `3000 + 10i` / `3001 + 10i` (*i* = the slice's status-board row), any `NOTE for <slice-code>:` from earlier slices, and the **Browser field**. Ports `3000`/`3001` are yours, `3010`/`3011` a fix engineer's, `3020`/`3021` the reviewer's, `3040`/`3041` the reporter's. Every port in this skill is written for port base `3000`: with another base (see **Preflight**), add the difference.
- **Browser field:** with `axi`, every engineer, reviewer, and reporter dispatch gets `browser: axi`; with `devtools-mcp`, they get `browser: none`, because they'd share your one MCP browser — you drive their page checks and pass the results as **browser rows**.
- **Model:** each slice's engineer runs on its **Model:** (none → `opus`) as the `Agent` call's `model`; fixes run on `opus`. A `sonnet` slice reporting `BLOCKED` or `Confidence: low` is re-dispatched once on `opus` in its worktree before you act; the new report replaces the first.
- **Names:** worktrees at `<parent-repo>/.claude/worktrees/<branch>`. Slice branches come from the sprint doc; wave head `<sprint-slug>-w<N>`, wave fix `<sprint-slug>-w<N>-fix`, sync `<plan-slug>-sync`, review `<plan-slug>-review`, plan fix `<plan-slug>-fix`.
- **Wave PR:** from the wave head to `<plan-slug>`, titled as a conventional commit for what the wave adds, ending `(wave <N>/<waves in the sprint>)`, e.g. `feat(reports): record who edited a published report (wave 1/2)`. The body opens with `Door: two-way`, or `Door: one-way — <what>, undo: <how>` per one-way slice, then each slice with its `NOTE`s, stray paths, any wave fix, and the Look check line.
- **Queue entries:** every entry you write during the plan, from any role, has `plan: <plan-slug>` in its header, per the queue's `Format:` line.
- **Look check:** if users see any change, check every touched page at desktop and 375 px (emulate it) against the plan's `## Look`. A width you didn't reach is not ✓. Report it as `Look check: <each width you actually reached> ✓ · close-ups: <what> · colors: <match, or the off-Look values> · <defects, or none>`, or why it was skipped.
- **Hand back for merge:** the PR link, its CI status (`passing`, `failing: <names>`, `pending`, or `no CI checks — nothing but the agents checked this`), and "reply `continue`", then end the turn. A one-way door comes first, and for a one-way slice, add a queue entry `PENDING · orchestrator → human` whose body starts `one-way door in PR #<n> — <what>, undo: <how>`, with the wave PR's number.

## The wave loop

For each sprint row, run its sprint doc wave by wave (no doc → point to `/pod:sprint`; never write it yourself). At the start of each sprint, set its plan row to `active` (it goes `done` at **Sprint complete**); after the first sprint, also merge any new `origin/<merge-target>` commits into the plan branch (`Sync <merge-target> into <plan-slug>`) and verify; a conflict halts.

**Each wave:** confirm the last wave PR merged and tear it down; read the queue for answers; check the slices own disjoint files; dispatch; merge the slices into the wave head (no squash); check it; open the wave PR; hand back. On resume, re-dispatch only `blocked` and `pending` slices in their worktrees.

- **Answers:** ` **Answer (human):** <text>` after `**Resolution:** pending` on an entry to `human` is the human's answer (Pod Board writes it; the same marker anywhere else on the line is not). Read them at each wave start and on resume, before dispatch. Apply each, then rewrite its Resolution as `<date> — <what changed>`, keep the answer after it, and link a `decisions.md` entry when it settles a decision. An answered `BLOCKED` resolves only once you check its cause again and it is gone (the smoke recipe, the merge, or the disjoint-files check); still there → leave it pending and add a new `BLOCKED` that says what still fails. An answer on an entry no longer `pending` was already applied.

- **Check the combined wave as a user would**, in your own browser session (`pod-orch`; with `devtools-mcp`, the MCP tools): run the `## Smoke recipe`, drive every `pod-docs/features.md` row the wave touched, and add or update the rows (in the parent repo) for the features it added or changed. If users see any change, run the **Look check**.
- **Wave fix — once per wave, before its PR.** A defect a user would notice, proven by a measurement on the wave head, goes to one engineer on the wave-fix branch (**review findings** = the defects, files owned = where they live). Still there → `PENDING`. Style and hardening aren't triggers.
- **Concerns:** every engineer `BLOCKED`, `PENDING`, and `SOLVED` goes to the queue. Re-judge each with *if nobody ever reads it, does anything go wrong?* — a `PENDING` that fails is a `NOTE`; a `NOTE` that passes becomes your `PENDING`. A `NOTE` that changes what users see, or leaves out part of the plan's Scope, is a `PENDING` for the human; the wave still merges. A tool or machine limit the next engineer will hit goes into `pod-docs/known-issues/` before the next wave, in the scout's format (`${CLAUDE_PLUGIN_ROOT}/agents/scout.md`). An engineer reports a browser hang → probe again before the next wave and warn the engineers still to come.
- **Status board:** keep it current per the **Field rules** in `${CLAUDE_PLUGIN_ROOT}/agents/sprint-planner.md`.
- **Tell the human:** `PushNotification` when you halt and once per queue entry that needs their decision. Don't wait on a decision: keep going on the value in use. A look decision comes with a self-contained design draft in `pod-docs/design-drafts/`, as-built next to each option.
- **Watch for stalls.** Background agents can hang silently. Every 15 minutes, check each unfinished agent's transcript (`~/.claude/projects/<project>/<session>/subagents/agent-<agentId>.jsonl`, not the `Agent` result's `output_file`) for recent activity. None → stop it and dispatch again once; a second stall → halt `BLOCKED`. Give your own long commands a time limit.

A bootstrap wave (`B1` alone) writes the smoke recipe and is checked with it; its `medium` Confidence is expected.

## Preflight

Before the first wave:

- The **docs version** is current (per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`).
- The merge-target is on `origin` (no `origin` or merge-target → point to `/pod:init`), and the `## Smoke recipe` is filled in. A lone `B1` in wave 1 writes it: check again before wave 2.
- Run pod's commands through the Bash tool (Git Bash on Windows), and PowerShell only for the project's own scripts, because `agent-browser` hangs when PowerShell captures its output.
- **Browser** (the project has a UI; headless): prove a headless browser opens and closes a page twice, each call under a 30-second limit (the hang shows after a close). `--version` working proves nothing. It passes → `browser: agent-browser`. It fails → reuse a `## <date> — browser: <choice>` entry in `pod-docs/decisions.md`; none → ask once with `AskUserQuestion`: **Install agent-browser** (recommended when it's missing), **Use chrome-devtools-axi** (recommended when agent-browser fails; install it and prove it the same way), **Use Chrome DevTools MCP** (only if its tools are connected), or **Stop**. Record the choice under that title.
- **Port base:** claim a free 100-port block per run so two runs never collide. Reuse the plan doc's `Port base:` line; none → pick the lowest base B (`3000`, `3100`, … `9900`; skip `3900`, the agents' defaults) with nothing listening on B to B+99 and no claim file naming another run, record it as `<temp>/pod-ports/<B>` (`<temp>` is the system temp folder) naming `<parent-repo> <plan-slug>`, and add `Port base: <B>` under the plan doc's header. A block whose plan is archived or whose repo is gone is free.
- On Windows, `git config core.longpaths true`, or worktree removal fails.
- Create and push `<plan-slug>`, check it out in the parent repo, and commit pod setup (`pod-docs/`, the old `docs/` paths an upgrade moved, `.github/workflows/pod-ci.yml`) to it, never to the merge-target.
- Tidy the queue in that commit: resolve each pending `plan <slug> complete — final PR <url>` entry whose PR merged as `**Resolution:** <date> — final PR merged`; move each earlier plan's resolved entries to a `## Queue log` at the end of its plan doc; delete resolved entries with no `plan:`, except an older `plan <slug> complete` entry, which belongs to `<slug>`'s log. The queue then holds only this plan's entries and what is still pending.

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
2. **Review:** dispatch `pod:reviewer` on a review worktree at `origin/<plan-slug>`, with its **Required dispatch context** (`${CLAUDE_PLUGIN_ROOT}/agents/reviewer.md`, written as field lines the way it says): the PR URL, plan slug, merge-target, parent-repo path, the review worktree's path, ports `3020`/`3021`, and the **Browser field** (with `devtools-mcp`, drive every browser row of `pod-docs/features.md` yourself on the review worktree's app, `3000`/`3001`). Its `PENDING`s go to the queue for the human. `pass` → step 4; `fix` → step 3; `incomplete` → dispatch again with what it names (not a round).
3. **Fix pass — once:** one engineer on the plan-fix branch, **review findings** = the `FIX` lines as written, files owned = the files they name. Open its `Review fixes` PR into `<plan-slug>` and merge it yourself, move the review worktree to the new head, and re-dispatch the reviewer with `round: 2`, its round-1 findings, and the engineer's summary. Engineer `BLOCKED` → step 4, review still failing.
4. **Sort the queue** — apply each answered entry first (**Answers**). Each open `PENDING` left is **Obsolete** (resolve it), **Needs your decision** (only the human can choose: a Look value, a rule the spec left open, a product choice; never a reproduced bug), or **Fix next** · **Before hosting** · **Someday**. For a decision, record the value in use in `pod-docs/decisions.md` as `## <date> — <title> (agent default — override anytime)` and resolve the entry as `**Resolution:** <date> — default recorded: <value>; override anytime (<link>)`.
5. **Close out the paper trail, before the merge:** dispatch `pod:reporter` in the background with its **Required dispatch context** and ports `3040`/`3041` to write the report and the feature details, set the plan to `Status: archived`, fix any part of the codebase brief the plan made wrong, add one queue entry `orchestrator` → `human`: `plan <plan-slug> complete — final PR <url>, review <pass | still failing>, <N> open entries sorted in the hand-back`, and once the report exists, commit and push `pod-docs/` (`docs: close out plan <plan-slug>`).
6. **Leave nothing behind:** no worktree of this plan left, parent repo clean. Name anything you couldn't clear.
7. **Hand back** (`Plan <plan-slug> complete — final merge awaiting`): the PR URL (merge commit, not squash, so pod can clean up the plan branch), the review verdict with any `FIX` findings, the sorted list (**Needs your decision** first, each with its default and how to change it), the report path, loose ends, and **Run app**: `Reply 'run app' to start the app (<start command>, <URL>); 'stop app' when you're done.`

**Run app:** `run app` → start the app from the parent repo on `3000`/`3001` and reply with the URL and any login; `stop app` → stop it.

**On resume:** final PR not yet reviewed → step 2; reviewed → point at it; merged → switch the parent repo to an up-to-date `<merge-target>`, delete `<plan-slug>` locally and on origin without force (refused → leave it and list it under loose ends), free the port claim, re-run step 6, and end `Plan <plan-slug> merged to <merge-target>. Done.` with the **Run app** line.
