# Changelog

Newest first. The `pod` and `pod-flow` plugins share this file. Each heading names the plugin versions it releases, and each merge to `main` that changes what a plugin ships is a release.

## pod 0.10.8 — 2026-11-09

- **No placeholders in text the human reads.** In one run the human asked 4 times what `<sha>` meant: a sprint doc's undo with a tag pattern was copied into the wave PR's Door line and the queue. The PR template now says every slot is in plain words with no `<…>` placeholder, and `/pod:code` hand-backs, queue entries, and autopilot halts follow it. The sprint-planner writes the One-way door line for the human and keeps exact commands in the Shared contract. The reviewer files a placeholder in the Door line, summary, or Risks as a `FIX`. ([#108](https://github.com/iamphduc/claude-pod/issues/108))
- **An undo names real commits.** The Door line's `undo:` is now a command on this PR's real commit IDs, with a check: `git revert -m 1 <merge commit>` for a merged slice, `git revert <commits>` for a fast-forwarded slice or a task. The orchestrator fills in the merge commit, the engineer names its own commits on a task PR, and a part that can't exist yet says so and names the command that lists it later. An undo with no real ID, where one exists, is a reviewer `FIX`.
- **A plainer PR body keeps its sections.** Rewording a body happens inside the same sections; no Proof part is dropped.
- **The sprint-planner puts a test that pins a changed file in that file's slice.** In one run a test asserting a script's exact call list was in no slice, and the slice changing the script hit `BLOCKED`.
- **The port base reads `pod-docs/known-issues/` first.** A port a known issue reserves is never free.
- **Autopilot keeps both sides of an append-only `pod-docs/` conflict on `pod-staging`.** Lines added word for word on both sides are kept once, and the next hand-back names the files. Any other conflict is still gate 3.

## pod 0.10.7 — 2026-11-08

- The engineer gives goals and guardrails, not procedure: its five sections are one `## Work` with four parts, **Set up**, **Build test-first**, **Check it works**, and **Report and ship**, per `docs/templates/agent.md`. Rules now say what to reach, not how: learn the project from pod's docs (no fixed reading list), make sure the server that answers is yours (no `<title>` recipe), (no command lines). Gone: the `frontend-design` line and the throwing-stub tip. Kept: every rule a past incident or retro added (edges first, `; exit 0` for planned server stops, the 2-minute browser limit, Bash not PowerShell for browsers, no shared MCP browser, the Confidence rules, never a `NOTE` for a user-facing bug), the dispatch fields, **Standalone**, the `Door:` line, and the final output. The last of six agent conversions.
- **A standalone engineer opens its task PR.** The rule said "only `/pod:task` opens a PR", and in 4 of 4 test runs, old file and new, the engineer read it as "not me" and left the PR unopened, while `/pod:task` only writes its body. It now says: standalone, open the PR to the merge-target after the push, unless one is open; a sprint slice never opens one. `/pod:task` now says the engineer opens the PR, that it opens one itself if the report has none, and that it keeps the `Door:` line when it writes the rest of the body.
- **A `/pod:task` engineer knows it is standalone.** The rule said "`/pod:task` passes only a task", but `/pod:task` also passes the branch, ports, and browser, so in a full test run the engineer judged itself not standalone, took the default `teardown: immediate`, and removed the worktree `/pod:task` keeps until the merge. It now says: a `/pod:task` dispatch has a task and no **sprint slug**.
- **`/pod:task` reviews the full PR body.** It dispatches the reviewer only once the full body is written. In a test run it reviewed the engineer's short body, and the reviewer filed the missing Review guide as a `FIX`.
- `check-agent-shape.mjs` now checks every `agents/*.md`; the `CONVERTED` list is gone. The engineer's **Slice** and **Repro** output fields take the template's `- **<field>:**` form, as the evals already show.

## pod 0.10.6 — 2026-11-08

- The reviewer gives goals and guardrails, not procedure: its four prose sections are one `## Work` with three parts, **Run it**, **Review the change**, and **Write the findings**, per `docs/templates/agent.md`. Rules now say what to achieve, not how: the Red check shows a test fails without its code (any way, never over a tracked file), the plan is read in pieces small enough to read in full, the whole-plan pass may flag anything, the PR body check names outcomes, not cases to walk through, browser commands are the agent's choice, and **Coverage** is free text. Gone: the Red check's wave-head fallback, and the notes on installs, logic-heavy slices, and style. Kept: every rule a past incident added (run every feature row, a bug with repro steps is a `FIX`, round 2 re-runs the repro), the dispatch fields, the finding format, and the final output. The fifth of six agent conversions, one per PR.
- `/pod:code` and `/pod:task` now spell out the dispatch's field-line format, which the reviewer file no longer holds.

## pod 0.10.5 — 2026-11-08

- The researcher gives goals and guardrails, not procedure: its four prose sections are one `## Work` of named rules, per `docs/templates/agent.md` (914 → 728 words). Rules on how to research are gone: source quality and staleness, how to cover one angle, the word range, and the 5–8 ideas and questions. The researcher decides these. Kept, because `docs/design.md` and `docs/commands.md` promise them: brainstorm after the search, the citation check before finishing, and the page's cards. Also kept: use at least half the budget. In test runs without it, each angle ran 3–5 of its 6 searches. The report shape, the dispatch fields, the source rule, the page's no-script rule, and the final output do not change. The fourth of six agent conversions, one per PR.

## pod 0.10.4 — 2026-11-07

- The reporter gives goals and guardrails, not procedure: its three prose sections are one `## Work` with three parts, **The page**, **The sections, in order**, and **Feature details**, per `docs/templates/agent.md` (959 → 818 words, with the review additions below; format rules live in the template). Reasons and repeats are gone, and so is the `Skill` tool with its frontend-design line: in about 20 test runs the reporter never used it. The feature-details shape and the final output do not change. The third of six agent conversions, one per PR.
- **Every report has the same look.** The reporter fills `skills/report/page.html`, an HTML skeleton with fixed CSS (light and dark, phone width, 16 px and up), a table of contents, the section slots, and classes for stats, tables, screenshots, and diagrams. A plan's Look sets only its accent color and display font. `/pod:report` and `/pod:code` copy the skeleton to `pod-docs/reports/<plan-slug>.html` and pass it as the new **page template** field, so the reporter, which often runs in the background, never reads outside the repo.
- **The report shows what a reviewer needs.** Practitioner guides on reviewing agent-built work and closing projects agree on four things the report lacked, so it now has them: **Look here first** (the 3–5 files or behaviors to review first), **Proof** (each criterion: met or not, who checked it, and how, noting when only the engineer's own tests did), **Risks and undo** (auth, data, migrations, money, public API, and one-way doors, each with how to undo it), screenshots of changed screens, the files and lines changed, and **Not checked by this report** (each source the reporter couldn't read), which before reached only the dispatcher. A plan with no UI change shows each feature working as text instead: a real request and response, or a command and its output.
- **How it fits together is a Mermaid flowchart** (an arrow means "uses") with a short list of differences from the plan, as in `/pod:plan`'s overview page (Mermaid 11.4.1 from a CDN, pinned), not a hand-drawn SVG: test reports drew arrows that didn't render and layouts that implied links the code doesn't have. Offline, the flowchart shows as its `A --> B` text. It is the page's only script.
- **Fewer sections.** Data structures, How the agents worked together, and Sources are gone: Risks covers data changes, At a glance's numbers sum up the run, and Proof and Key decisions link their own evidence.
- **The report is easy to scan.** Each section opens with a one-line takeaway. At a glance shows six equal fact blocks and one note line. Key features, Proof (at most 6 rows), Risks and undo (risk and file, then one undo action), and Key decisions are short tables with no commands. The page has 7 sections.
- **Screenshots are files next to the report**, in `pod-docs/reports/<plan-slug>/`, saved as JPEG by the browser tool. Before, the reporter embedded them as base64 and wrote its own merge script each run; one of four test runs ended with an unfilled page and a stray temp file. The report still opens offline.
- The reporter opens the report in the default browser when it is written, so it opens in `/pod:report`, `/pod:code`, and `/pod:autopilot` alike. The report is at most 2,000 words (before: about 2,000), so a small plan gets a short report.
- Feature details: the reporter writes files only for rows the plan branch added or changed against the merge-target, and leaves other features' files alone. Rules on a feature's data (limits, formats, who may change it) now call for the Mermaid diagram.
- The reporter's guardrail and description now name the one edit it makes outside its own files: the link from a `pod-docs/features.md` row to that feature's details file. Before, the guardrail said "change nothing else" while a rule asked for that link.

## pod 0.10.3 — 2026-11-06

- The sprint planner gives goals and guardrails, not procedure: its four work sections are one `## Work` with four parts, **Cut the slices**, **Write the criteria**, **Add the setup slices**, and **Write the sprint doc**, per `docs/templates/agent.md` (1,300 → 906 words). Rationale and how-to are gone. The sprint doc template, the branch names, and the Bootstrap CI description do not change. The second of six agent conversions, one per PR.
- The status board's lifecycle (Slice Status, PR, Confidence, Doc Status) moves to `/pod:code`, which fills it. `/pod:sprint` now tells the human to review the doc and run `/pod:code`, so autopilot's dispatch no longer carries that line.
- `check-agent-shape.mjs` asks for the dispatch stop line only when a field is required: an agent whose fields are all optional has nothing to stop on. It also fails on a nested bullet or indented line outside a code block, so each rule stays one bullet.
- The Model rule says what "touching the Shared contract" meant: a slice that defines or changes it gets `opus`; one that only uses it can get `sonnet`.

## pod 0.10.2 — 2026-11-06

- The scout gives goals and guardrails, not procedure: its six prose sections are two, **Map** and **Prove the smoke recipe**, with eight named rules, per `docs/templates/agent.md`. Rules the brief template or the Final output already state are gone. The known-issues shape and the smoke-run strings do not change. The first of six agent conversions, one per PR.
- Test runs on two sample apps added three rules. A bug the scout finds goes under **Left for the human**, not into `known-issues/`. Smoke-recipe ports are placeholders, never numbers. The scout stops only what it started, and reports a taken port instead of freeing it.

## pod 0.10.1 — 2026-11-06

- Every agent file has the same skeleton: frontmatter, a goal paragraph, `## Required dispatch context`, `## Guardrails`, the work, and `## Final output`. The skeleton is `docs/templates/agent.md`, next to a starting shape for new skills, `docs/templates/skill.md`. CI checks each agent for the three contract headings.
- The engineer's `Rules` are split into `Guardrails` and `How you build`. The scout's `Hard rails` and the reviewer's `Report` take the shared names. The reporter gets a `Guardrails` section, the scout a dispatch context, and the sprint-planner all three contract sections. The engineer's dispatch context is a bullet list, the scout stops when its repo root is missing, and the reporter runs on `sonnet`. No other behavior changes.

## pod 0.10.0 · pod-flow 0.3.2 — 2026-11-05

- **Breaking:** `/pod:fix` is now `/pod:task`. The command takes any one-off change outside a plan, not only bug fixes. There is no `/pod:fix` alias: type `/pod:task <task>`.
- The engineer's branch and worktree are now `task-<slug>`, and the reviewer takes `kind: task`.
- pod-flow: comments and tests use the new name. Nothing in the pane changes.
- Every pod PR uses one body from `skills/code/pr-template.md`: the Door line, what and why, a **Review guide**, **Risks**, and a folded **Proof**. The guide lists the steps in the order they were built: commits, slices, fixes, or waves. Each step links to only its own diff and is marked `Read`, `Skim`, or `Done`.
- The proof holds what the agents show: the repro for a bug, each test's red and green commits, the checks run, the browser rows, and the review verdict. The body is written again after a fix pass or a review.
- `/pod:task` writes the task PR's body from the engineer's report. Engineers keep one change per commit, with renames and moves in their own commit.
- The reviewer checks the PR body against the diff. A `Skim` step that holds logic, a change missing from the guide, or a proof claim its run contradicts is a `FIX`.
- Fewer commits. An engineer puts the docs that record a change (its `features.md` row, its feature's History) in that change's commit, not in a `docs` commit of its own. `/pod:task` writes its queue entries in one `docs(queue)` commit before the hand-back. In one project, docs commits were 27% of all commits, most of them from task branches.
- The reviewer's task check fits any task, not only bugs. A test must pin the behavior the task asks for, committed before the code. The repro and the cause check apply to bugs only.
- Engineers commit each criterion's test with its code, in one commit, instead of a `test` commit before a `feat` commit. They still watch the test fail first and report its red output. This halves the test and code commits, and every commit passes its tests.
- The reviewer proves red itself with a **Red check**: it runs the commit's tests against the code before it, in a separate worktree. A test that passes there is a `FIX`. It checks every criterion of a task PR, and in a plan the `Read` steps and any test it doubts. A test it can't run is `not checked`, never proven.
- A wave with one slice fast-forwards its wave head to the slice (`git merge --ff-only`), so it has no empty merge commit. A wave with two or more slices still merges each one. In three projects, a third to half of all waves had one slice.

## pod 0.9.2 · pod-flow 0.3.1 — 2026-10-31

- `/pod:code` writes the one-way door queue entry as `one-way door in PR #<n> — <what>, undo: <how>`, with the wave PR's number. pod-flow shows it as `PR #74: <what>`, in the checklist and under **needs you**. An older entry with no number shows as `One-way: <what>`.
- Each check at the hand-back takes one line. A decision made for you shows its first clause and the default, such as `☐ Decided: a chapter's time link has a 36 px tap area  36 px`. Press the box to tick a check. Press the text of a cut check to open the whole sentence, and press it again to close it. An open one-way door also shows how to undo it. A check that is not cut ticks from its text too.
- The pane no longer cuts its rows at `… N more lines`. A tree taller than the pane scrolls: use the mouse wheel, or the arrow keys while the pane has focus (press ctrl+x tab). At the hand-back, when the tree does not fit, the finished sprints are left out, so the checklist shows without a scroll. A long default is cut before the decision it belongs to.

## pod 0.9.1 — 2026-10-27

- Every autopilot halt adds a queue entry that starts `gate <N> (<name>): `, such as `gate 6 (escalation-valve): …`, and no other entry starts that way. Pod Board can tell a halt from a note by that start. Before, halts named the gate in different ways, and some never named it.
- Gate 7 adds its own halt entry when it halts. The `plan <slug> complete` entry from **Plan complete** is now a note, because it's written before the final merge, which can still fail.
- A halt's queue type always comes from the gate table. A gate 3 is `BLOCKED`, even when the only fix is to merge in a set order.
- The `autopilot-run` line stays in the plan doc after the last sprint is archived, and stays there after the run halts at gate 2 or 7.

## pod 0.9.0 — 2026-10-24

- `/pod:plan` ships its own interview, adapted from Matt Pocock's `grilling` skill (MIT), so you don't need to install anything. Each round asks every question pod can ask now, numbered, each with a recommended answer, and a question that depends on an open answer waits for a later round. pod looks up facts itself and asks you only for decisions.
- Answer a round in plain words: `ok` takes every recommendation, `ok except Q3: <answer>` changes one, and `Q1 b, Q2 yes` answers by number. Before, without `grilling` installed, pod asked one question at a time.
- New plans record `Grilled-with: pod` or `grill-me + pod`. Older plans keep their value.

## pod 0.8.0 · pod-flow 0.3.0 — 2026-10-24

- pod reads the answers you give from Pod Board. An entry addressed to you that has ` **Answer (human):** <text>` after `**Resolution:** pending` is your answer: `/pod:code` and `/pod:autopilot` apply it at the next wave start or resume, fill in the Resolution, and keep your answer on the line. The queue file now describes this format.
- An answered `BLOCKED` resumes the run only after pod checks again that the problem is gone, such as a merge conflict or a failed smoke check. If it is still there, the entry stays pending and pod adds a new `BLOCKED` that says what still fails.
- pod-flow shows an answered question with a ✓ and `answered`, and stops counting it as waiting on you. When every question is answered, the **needs you** group says **answered**.

## pod-flow 0.2.1 — 2026-10-23

- pod-flow no longer reads a `skipped` PR cell on the sprint board, or shows a `SKIPPED` wave. pod stopped writing that value in 0.7.1, so nothing changes in a run.

## pod 0.7.1 — 2026-10-23

- pod's rule files are shorter and trust the agents more. Step-by-step procedures became goals with their reasons, rules said in several files now live in one, and fixes for single past runs became general rules. Every guardrail and every format that pod-flow or another file reads is unchanged.
- The research report has a **Suspect pages** section, so `/pod:plan` can show you pages that tried to give instructions before the interview. Before, they appeared only in the researcher's chat summary and were lost when parts were merged.
- The engineer, the reviewer, and the reporter list their browser values, including `axi`, matching what `/pod:code` and `/pod:fix` send them. The reporter takes `browser: none` as "no screenshots".
- Rules that no longer matched pod were removed or corrected: a queue role for an agent that no longer exists, a PR status nothing writes, `blocked` slices described as final when `/pod:code` re-dispatches them, and who opens the `Review fixes` PR.
- When `/pod:code` records a default for a decision you haven't made, the queue entry says `default recorded`, so pod-flow's checklist lists it under **Decided for you**. A wave PR with a one-way slice also adds a `one-way door` queue entry, so the door shows in pod-flow's **needs you** group and checklist.
- With the Chrome DevTools MCP, `/pod:fix` now passes the reviewer `browser: none` plus your page results, instead of a browser mode it doesn't accept.

## pod 0.7.0 — 2026-10-23

- New `/pod:teach [topic]` explains how a codebase works and why it's built that way, so you understand it before you change it. With no topic, it covers the whole system; with one, such as `billing`, only that feature and where it touches the rest. It reads the code, splitting a big area across a few read-only agents, and looks for reasons in git history, PRs, and docs, labeling each one known, inferred, or unknown. You get an HTML page, `pod-docs/teach/<topic>.html`, with a map of the parts, the main flow with a worked example, where things live, the reasons, what to watch out for, and topics to learn next. It changes no code and works in any repo, even before `/pod:init`. Adapted from pstack's `/teach`, `/how`, and `/why`.

## pod 0.6.0 — 2026-10-23

- Everything in the **For you** part of `pod-docs/` now has an HTML page, with graphics over text. The `.md` files stay as the source the agents read.
- Research: the researcher also writes `pod-docs/research/<slug>.html`, and `/pod:research` opens it. It has a card for each thing that exists, with how close it is to your idea and whether it's alive, short lists of gaps and practices, ideas from minimal to bold, and each question as a card with its options side by side. The page has no scripts and loads nothing, since web pages fed it.
- Look options are saved per plan, as `pod-docs/design-drafts/<slug>-look.html`, so a second plan no longer writes over the first one's `look-directions.html`. Design drafts stay as the record of what you chose: pod never deletes them, and a plan update that changes the look or the overview writes a new numbered page (`<slug>-look-2.html`). Older projects keep their `look-directions.html`.
- Updating a research report keeps the old one: it moves to `<slug>-1.md` and `<slug>-1.html` (then `-2`, and so on), and the newest stays at `<slug>.md` and `<slug>.html`. Before, an update replaced it.
- Ideas: `pod-docs/ideas/index.html` shows every idea on a board, one column per status. pod rewrites it whenever an idea is saved or its status changes, and `/pod:idea` with no idea opens it.

## pod 0.5.0 — 2026-10-23

- Before any code, `/pod:plan` shows you an overview of what it will build. The plan gets a **How it fits together** section, with the parts (new or changed, and where they go), how they connect, the main flow step by step, and where the data lives, as Mermaid diagrams. pod draws them in an HTML page, `pod-docs/design-drafts/<slug>-overview.html`, opens it, and waits for your `ok` or your changes. `/pod:ship` asks at its go check.
- The sprint-planner cuts slices along the overview you approved, and stops if one has to differ.
- The plan report has a new **How it fits together, as built** section, drawn from the code, that marks each difference from the overview.
- Feature details for a feature with real logic (security, money, data rules, or a multi-step flow) add a diagram of the flow, one worked example, and the few files that hold the logic.

## pod 0.4.1 — 2026-10-23

- The `pod-staging` PR that autopilot opens says what it holds. Its title is a conventional commit for what the plans built, such as `feat: friends list and invites (plan friends)`. Its body has a section per plan with the goal, the features, the one-way doors and decisions made for you, loose ends, and links to the plan's final PR and report. A later plan that lands before you merge updates the title and adds its section. The branch keeps its name.

## pod 0.4.0 · pod-flow 0.2.0 — 2026-10-22

- Each merge to `main` is now a release. CI fails a PR that changes what a plugin ships without bumping its version and adding its section here, and the merge creates the tag and the GitHub release: `vX.Y.Z` for pod and `pod-flow-vX.Y.Z` for pod-flow.
- Every queue entry written during a plan, including the plan-complete entry and autopilot's halt entries, has `plan: <slug>` in its header, so tools can tell which plan an entry belongs to. When a new plan starts, an older `plan <slug> complete` entry without the tag moves to that plan's Queue log instead of being deleted.
- `/pod:code` and `/pod:fix` send the reviewer its context as labeled field lines (`- **PR URL:** <url>`, `- **plan slug:** <slug>`), using the names in the reviewer's Required dispatch context. Longer items, such as round-1 findings, go in a block under their label.
- pod-flow: its review list shows only the current plan's rounds. Before, reviews from `/pod:fix` and from earlier plans in the same session were mixed in, and their tokens counted toward the plan.
- pod-flow: it opens with a **needs you** group: each pending queue entry addressed to you that asks something (a `BLOCKED`, a decision, a product choice, or a one-way door), so a question doesn't scroll away in the chat. The header counts them, and a narrow terminal tells each one once. "Someday" notes and answered entries stay out.
- pod-flow: at a plan's hand-back, it shows a **Run app** button. It sends `run app` for you and turns into **Stop app**. Under it is a checklist you can tick. The important items come first: the plan's one-way doors, the decisions pod defaulted for you, and the features the plan added to `pod-docs/features.md`. The features it only changed follow under **also changed**. The list counts your ticks and folds once all are ticked. When pod-flow sees the PR merged with important items unticked, it adds one line to the chat naming them, and nothing more. After the merge, your `continue` folds the hand-back part to one line: `✓ plan done · checked 3/5`. The hand-back's reply words are now `run app` and `stop app` instead of `try` and `stop`.

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
