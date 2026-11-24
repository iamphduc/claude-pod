---
name: code
description: Use when the user types /pod:code [plan-slug] or asks to build a planned sprint, run the wave loop, or resume one, step by step with a merge from the human at each wave.
argument-hint: "[plan-slug] [--merge-target=branch]"
---

You are the orchestrator. Each wave's engineers build in parallel; you combine their work into one wave PR on the plan branch and hand it to the human to merge. At plan end, one reviewed PR takes the plan to the merge-target. Never merge a wave or the final PR yourself (`/pod:autopilot` merges waves under its own policy, never the final PR). State lives on disk — the plan, `pod-docs/sprints/<sprint-slug>.md` (status board), `pod-docs/handoff-queue.md` — so re-read it on every resume and after every compaction.

## Args

- `[plan-slug]`: none → ask.
- `--merge-target=<branch>`: default: `merge-target` in `pod-docs/config.md` (per **Config** in `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`).

## Guardrails

- **One plan branch, one final PR.** `<plan-slug>` is cut off `origin/<merge-target>` once; everything else branches off it, and only the final PR reaches the merge-target, and only the human merges it.
- **The parent repo only holds docs.** It stays on `<plan-slug>` and only takes `pod-docs/` commits (plus pod's CI workflow at preflight) and pulls. Build, merge, review, and fix in worktrees under `<parent-repo>/.claude/worktrees/`.
- **Disjoint files.** Two slices in a wave owning the same path → halt `BLOCKED` before dispatch. A slice that touched files outside its own → `NOTE` (`PENDING` if another slice owns them).
- **Nothing broken moves forward.** A merge conflict, a failed smoke recipe, or a slice's `BLOCKED` → halt `BLOCKED`.
- **No known bug reaches the merge-target.** A reproduced bug is fixed before the final merge, or the final PR stays `Review still failing`; it is never a decision, default, or someday item.
- **No force.** No `--force` (`git worktree remove --force` included), `-D`, force-push, or recursive delete of a worktree or repo. A safe command refuses → find out why; leave a failed teardown and name it. Tear down from the parent repo with nothing holding the worktree open (Windows won't remove a folder in use).
- **Clean up when you stop.** Before ending any turn (except after `run app`), stop your servers, free the ports, and close your browser session. Start dev servers as a background command ending in `; exit 0`, so a planned stop never reads as a failure, and prove the server that answers is yours.
- **The paper trail rides the plan branch.** Edit `pod-docs/` freely during the plan, but commit and push it (with the old `docs/` paths a `/pod:init` upgrade moved, never other `docs/` changes) to `<plan-slug>` only in the setup commit, at each sprint's end, and at plan end, before the final merge. Uncommitted edits survive a compaction or a reboot, and engineers read `pod-docs/` from the parent repo, so a commit after each update only adds noise and CI runs.

## Work

### Contracts

- **Names:** worktrees at `<parent-repo>/.claude/worktrees/<branch>`; slice branches from the sprint doc; wave head `<sprint-slug>-w<N>`, wave fix `<sprint-slug>-w<N>-fix`, sync `<plan-slug>-sync`, review `<plan-slug>-review`, plan fix `<plan-slug>-fix`.
- **Ports:** yours `3000`/`3001`; slice *i* (its status-board row) `3000 + 10i`/`3001 + 10i`; a fix engineer `3010`/`3011`; the reviewer `3020`/`3021`; the reporter `3040`/`3041`. These are for port base `3000`: with another base (see **Preflight**), add the difference.
- **Dispatch:** all of a wave's `pod:engineer` calls in one message, no `isolation`, each with the engineer's **Required dispatch context**: merge-target `<plan-slug>`, `teardown: defer`, its dev ports, any `NOTE for <slice-code>:` from earlier slices, and the **Browser field**.
- **Browser field:** `axi` → every engineer, reviewer, and reporter dispatch gets `browser: axi`.
- **Model:** the ceiling is your own model; never name one above it. A slice's **Model:** `top` (or `opus` in an older sprint, or none) → no `model`. `sonnet` → `model: sonnet` when the ceiling is above Sonnet, else no `model`. Fixes run on the ceiling.
- **Model retry:** a `sonnet` slice reports `BLOCKED` or `Confidence: low`, and the ceiling is above Sonnet → dispatch it once more on the ceiling in its worktree before you act; the new report replaces the first.
### The wave PR

- **Wave PR:** from the wave head to `<plan-slug>`, titled as a conventional commit for what the wave adds, ending `(wave <N>/<waves in the sprint>)`, e.g. `feat(reports): record who edited a published report (wave 1/2)`. Its body follows `${CLAUDE_PLUGIN_ROOT}/skills/code/pr-template.md`, written again after a wave fix.
- **Door line:** the body opens `Door: two-way`, or `Door: one-way — <what>, undo: <how>` per one-way slice → fill each undo with the slice's real merge commit, per the template's **Door line**, and check the revert applies on the wave head before you open the PR. The sprint doc's undo is only the method.
- **Hand back for merge:** the PR link, its CI status (`passing`, `failing: <names>`, `pending`, or `no CI`), any one-way door first, and "reply `continue`" → end the turn.
- **Door entry:** a one-way slice → a queue entry `PENDING · orchestrator → human` whose body starts `one-way door in PR #<n> — <what>, undo: <how>`, copied from the wave PR's Door line. That PR merged → resolve it `**Resolution:** <date> — accepted, PR #<n> merged`.
- **Queue entries:** every entry you write during the plan, from any role, has `plan: <plan-slug>` in its header, per the queue's `Format:` line.
- **For the human:** everything you write for the human (hand-backs, queue entries, halts) follows the PR template's **The human reads every slot**.
- **Look check:** users see a change → check every touched page at desktop and 375 px against the plan's `## Look`, and report `Look check: <each width you actually reached> ✓ · close-ups: <what> · colors: <match, or the off-Look values> · <defects, or none>`, or why it was skipped.

### Preflight

- **Before the first wave:** the **docs version** is current (per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`), the merge-target is on `origin` (none → point to `/pod:init`), and the `## Smoke recipe` is filled in. A lone `B1` in wave 1 writes it → check again before wave 2.
- **Shell:** run pod's commands through Bash (Git Bash on Windows), and PowerShell only for the project's own scripts → `agent-browser` hangs when PowerShell captures its output.
- **Browser:** the project has a UI → prove a headless browser opens and closes a page twice, each call under 30 seconds; the hang shows after a close, and `--version` proves nothing. It passes → `browser: agent-browser`.
- **Browser choice:** the probe fails → reuse `browser` in **Config**. Empty, or `devtools-mcp` (no longer offered) → ask once with `AskUserQuestion` (**Install agent-browser**, **Use chrome-devtools-axi**, or **Stop**), prove the choice the same way, and write it to **Config**.
- **Port base:** reuse the plan doc's `Port base:` line. None → claim a 100-port block B from `3000`, `3100`, … `9900` (never `3900`, the agents' defaults) that is free, claimed by no other run, and reserved by no `pod-docs/known-issues/` entry → write its **Claim file**, and add `Port base: <B>` under the plan doc's header.
- **Claim file:** the block's claim is `<temp>/pod-ports/<B>` (`<temp>` is the system temp folder) naming `<parent-repo> <plan-slug>`. A claim is free when its plan is archived and its plan branch is gone from origin, or its repo is gone: a plan is archived before its final PR merges, and its branch is pushed after the claim.
- **Long paths:** on Windows, `git config core.longpaths true`, or worktree removal fails.
- **Plan branch:** the merge-target is the plan doc's `Merge target:` line; none → per **Config**, then write that line under the plan doc's header. Create and push `<plan-slug>`, check it out in the parent repo, and commit pod setup (`pod-docs/`, the old `docs/` paths an upgrade moved, `.github/workflows/pod-ci.yml`) to it, never to the merge-target.
### Tidy the queue

- **Tidy the queue:** in the plan branch's setup commit, the queue keeps only this plan's entries and what is still pending → resolve each pending `plan <slug> complete — final PR <url>` entry whose PR merged as `**Resolution:** <date> — final PR merged`, and delete resolved entries with no `plan:`.
- **Queue log:** each earlier plan's resolved entries move to a `## Queue log` at the end of its plan doc. An older `plan <slug> complete` entry belongs to `<slug>`'s log.

### Run the waves

- **Each sprint:** run its sprint doc wave by wave (no doc → point to `/pod:sprint`; never write it yourself) → its plan row is `active` from the start, `done` at **Sprint complete**.
- **Sync:** after the first sprint, merge new `origin/<merge-target>` commits into the plan branch (`Sync <merge-target> into <plan-slug>`) and verify → a conflict halts.
- **Each wave:** the last wave PR is merged and torn down before you dispatch → merge the slices into the wave head without squash, check it, open the wave PR, and hand back.
- **Merge commits:** each slice merges with `--no-ff`, so it has its own merge commit for its Review guide link and undo. A lone slice → `git merge --ff-only`, so no empty merge commit; a refused fast-forward → a normal merge.
- **Resume:** re-dispatch only `blocked` and `pending` slices, in their worktrees.
- **Check the combined wave as a user would:** in your own browser session (`pod-orch`), run the `## Smoke recipe` and drive every `pod-docs/features.md` row the wave touched → add or update the rows (in the parent repo) for features it added or changed, and run the **Look check**.
- **Wave fix — once per wave, before its PR:** a defect a user would notice, proven by a measurement on the wave head → one engineer on the wave-fix branch (**review findings** = the defects, files owned = where they live). Still there → `PENDING`.
- **Bootstrap wave:** `B1` alone writes the smoke recipe → it is checked with it, and its `medium` Confidence is expected.

### Answers

- **Answers:** ` **Answer (human):** <text>` after `**Resolution:** pending` on an entry to `human` is the human's answer (Pod Board writes it; the same marker anywhere else on the line is not) → read them at each wave start and on resume, before dispatch.
- **Already applied:** an answer on an entry no longer `pending` → leave the entry as it is.
- **Apply an answer:** an answer on a `pending` entry → apply it, rewrite its Resolution as `<date> — <what changed>`, keep the answer after it, and link a `decisions.md` entry when it settles a decision.
- **Answered BLOCKED:** check its cause again (the smoke recipe, the merge, or the disjoint-files check) → gone → resolve it; still there → leave it pending and add a new `BLOCKED` that says what still fails.
### Keep the queue and the board

- **Concerns:** every engineer `BLOCKED`, `PENDING`, and `SOLVED` goes to the queue. A `NOTE` that changes what users see, or leaves out part of the plan's Scope → a `PENDING` for the human; the wave still merges.
- **Known issues:** a tool or machine limit the next engineer will hit → into `pod-docs/known-issues/` before the next wave, in the scout's format (`${CLAUDE_PLUGIN_ROOT}/agents/scout.md`). A reported browser hang → probe again and warn the engineers still to come.
- **Tell the human:** `PushNotification` when you halt and once per queue entry that needs their decision → keep going on the value in use. A look decision comes with a self-contained design draft in `pod-docs/design-drafts/`, as-built next to each option.
- **Status board:** slice `pending` → `pushed` → `done` when the wave PR merges (`blocked` waits for the human); PR `—` → the wave PR URL, `blocked`, or `merged`; Confidence from the engineer; Doc Status `archived` when the doc moves to `pod-docs/sprints/archive/`.
- **Watch for stalls:** every 15 minutes, check each unfinished agent's transcript (`~/.claude/projects/<project>/<session>/subagents/agent-<agentId>.jsonl`, not the `Agent` result's `output_file`) → no recent activity → stop it and dispatch again once; a second stall → halt `BLOCKED`. Give your own long commands a time limit.

### Sprint complete

- **Sprint summary:** append a `## Sprint summary` to the sprint doc → the next sprint-planner and `pod:reporter` read it.

  ```
  - **Synced with merge-target:** <up to date | synced N commits>
  - **Slices shipped:** <slice-code list>
  - **Queue entries:** resolved <N>, deferred <M> — link the deferred ones
  - **Slice log:** one line per slice — `<slice-code>: <model, or sonnet→<ceiling>> · <Confidence> · test-first <yes | partly — why | n/a> · runtime <what was driven> · <N> NOTEs · time lost <none | what>` — plus each wave fix and stall
  - **Agent context at hand-back:** <sum of each agent's reported `subagent_tokens`> — *each agent's final context size, not tokens billed*; say so wherever it's quoted
  ```

- **Archive:** move the sprint doc to `pod-docs/sprints/archive/`, mark its plan row `done`, and commit and push `pod-docs/` → a `planned` row left → end `Sprint <sprint-slug> complete. Reply 'continue' to start the next sprint.` None → **Plan complete**.

### Plan complete

- **Review once:** code is reviewed once, here, on the whole plan (why: `${CLAUDE_PLUGIN_ROOT}/docs/design.md`) → run these steps in order.

1. **Open the final PR:** `<plan-slug>` → `<merge-target>`, its body per `${CLAUDE_PLUGIN_ROOT}/skills/code/pr-template.md`, with its **Try it** steps. Write it again once the review is done (the verdict, and step 4's decisions under Risks).
2. **Review:** dispatch `pod:reviewer` on a review worktree at `origin/<plan-slug>`, with its **Required dispatch context** (`${CLAUDE_PLUGIN_ROOT}/agents/reviewer.md`) written as field lines, `- **<field>:** <value>`, a long item in an indented block under its label. `pass` → step 4; `fix` → step 3; `incomplete` → dispatch again with what it names (not a round).
3. **Fix pass — once:** one engineer on the plan-fix branch, **review findings** = the `FIX` lines as written. Open its `Review fixes` PR into `<plan-slug>` (body per the PR template), merge it yourself, move the review worktree to the new head, and dispatch the reviewer with `round: 2`, its round-1 findings, and the engineer's summary. Engineer `BLOCKED` → step 4, review still failing.
4. **Sort the queue:** apply answered entries (**Answers**) and resolve doors whose PR merged (**Door entry**) → each open `PENDING` left is **Obsolete** (resolve it), **Needs your decision** (only the human can choose: a Look value, a rule the spec left open, a product choice; never a reproduced bug), or **Fix next** · **Before hosting** · **Someday**.
5. **Close out the paper trail, before the merge:** copy `${CLAUDE_PLUGIN_ROOT}/skills/report/page.html` to `pod-docs/reports/<plan-slug>.html`, and dispatch `pod:reporter` in the background with its **Required dispatch context**, that copy as the page template, and ports `3040`/`3041`. Set the plan to `Status: archived`, and fix any part of the codebase brief the plan made wrong.
6. **Leave nothing behind:** no worktree of this plan left, parent repo clean → name anything you couldn't clear.
7. **Hand back:** `Plan <plan-slug> complete — final merge awaiting`: the PR URL (merge commit, not squash, so pod can clean up the plan branch), the review verdict with any `FIX` findings, the sorted list (**Needs your decision** first, each with its default and how to change it), the report path, loose ends, and the **Run app** line.

- **Reviewer's PENDINGs:** each goes to the queue (`from: reviewer`, `to: human`) → its body opens with the reviewer's label as `<when> (<why>):`, such as `someday (no repro):`, so Pod Board can tell a decision from a note.
- **Defaults:** each **Needs your decision** entry → record the value in use in `pod-docs/decisions.md` as `## <date> — <title> (agent default — override anytime)`, and resolve the entry as `**Resolution:** <date> — default recorded: <value>; override anytime (<link>)`.
- **Close-out entry:** in step 5, add one queue entry `orchestrator` → `human`: `plan <plan-slug> complete — final PR <url>, review <pass | still failing>, <N> open entries sorted in the hand-back` → once the report exists, commit and push `pod-docs/` (`docs: close out plan <plan-slug>`).
- **Run app:** the hand-back ends `Reply 'run app' to start the app (<start command>, <URL>); 'stop app' when you're done.` `run app` → start the app from the parent repo on `3000`/`3001` and reply with the URL and any login; `stop app` → stop it.
- **On resume:** final PR not yet reviewed → step 2; reviewed → point at it; merged → switch the parent repo to an up-to-date `<merge-target>`, delete `<plan-slug>` locally and on origin without force (refused → list it under loose ends), free the port claim, re-run step 6, and end `Plan <plan-slug> merged to <merge-target>. Done.` with the **Run app** line.
