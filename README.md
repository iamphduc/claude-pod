# pod

Ship a plan in **waves** of parallel Claude engineers: strategy → sprint → parallel waves → review, with you as the merge gate between every wave.

A *wave* is a batch of slices with non-overlapping file ownership, built concurrently in isolated worktrees. Each wave integrates into **one PR** onto a long-lived **plan branch**, is verified, and lands behind you; then the next wave dispatches. At the plan's end, **one final PR** merges the plan branch to `main`. Run it with `/pod:code`, or unattended with `/pod:autopilot`.

## Install

Requires Claude Code, `git`, and an authenticated `gh` CLI. pod is a Claude Code plugin. Inside Claude Code, run:

```
/plugin marketplace add iamphduc/claude-pod
/plugin install pod@pod
```

Then, from your project root (new or existing repo), run `/pod:init`. It creates the files your project owns — it never overwrites one that already exists:

- `docs/codebase-structure.md` — a high-level codebase brief (what it is, its parts, how they connect — no file lists). The **scout** agent reads your whole codebase and its docs, drafts the brief (including a **Key docs** list), and runs its **`## Smoke recipe`** once to prove it works. Engineers read the brief before coding and use the recipe to browser-verify each slice.
- `docs/decisions.md` — architectural decisions, as you make them.
- `docs/known-issues/` — durable gotchas (codegen before typecheck, tests need Docker, …); the scout seeds it, one file each.
- `docs/handoff-queue.md`, plus empty `docs/plans/` and `docs/sprints/archive/`.

Review the scout's draft and fill anything it left open. The agents, skills, templates, and policy docs stay inside the plugin — nothing else is copied into your repo.

To use a local clone instead of GitHub, pass its path: `/plugin marketplace add /path/to/claude-pod`. For a one-off session without installing: `claude --plugin-dir /path/to/claude-pod`.

**Optional:** install the `grilling` skill for a deeper `/pod:plan` interview. Without it, pod runs its own shorter interview.

```
npx -y skills add mattpocock/skills -g -s grilling -y
```

### Update

```
/plugin marketplace update pod
```

The plugin is replaced as a whole, so retired agents and skills disappear on their own. Your `docs/` files are never touched.

### Moving from the old copy-based install

The old scripts copied everything into your repo, and those copies take priority over the plugin's skills. Delete them, then install the plugin as above (keep your `codebase-structure.md`, `decisions.md`, `handoff-queue.md`, plans, and sprints):

```bash
rm -f  .claude/agents/waves-*.md \
       .claude/agents/engineer-junior.md .claude/agents/engineer-senior.md \
       .claude/agents/reviewer.md .claude/agents/sprint-planner.md \
       docs/engineer-protocol.md docs/autonomous-policy.md
rm -rf .claude/skills/{autopilot,code,fix,plan,sprint,wave-prompts,review,waves-review} \
       docs/templates
```

## Agents

| Agent | Called by | Job |
|---|---|---|
| `pod:scout` | `/pod:init` | Reads the whole codebase and its docs; drafts `docs/codebase-structure.md` and `docs/known-issues/`, proving the smoke recipe works |
| `pod:sprint-planner` | `/pod:sprint`, `/pod:autopilot` | Turns the next plan row into a sprint doc: slices grouped into waves, each success criterion naming its test |
| `pod:engineer` | `/pod:code`, `/pod:autopilot`, `/pod:fix` | Builds one slice in its own worktree, test-first: writes each criterion's test, watches it fail, makes it pass; then checks it in the browser |
| `pod:reviewer` | `/pod:code`, `/pod:autopilot`, `/pod:fix` | Reviews the whole plan once, at the final PR (wave by wave, then as a whole), and every `/pod:fix` PR; one fix pass for blocking findings. Never edits code |

## Manual flow — you ride each wave

| Step | Skill | What happens |
|---|---|---|
| 1 | `/pod:plan` | Planner interviews you (answer *How deep?* with the fast path to take its recommended answer on anything with a safe default). When there's a UI, it writes an HTML draft, `docs/design-drafts/look-directions.html`, with three **look** directions and every component in every state, and you pick one. Then it writes `docs/plans/<slug>.md` |
| 2 | `/pod:sprint [slug]` | Drafts `docs/sprints/<slug>.md` — slices grouped into waves by file ownership |
| — | *read the sprint doc* | **Your quality gate** — catch bad wave grouping or overlapping file ownership before any engineer runs |
| 3 | `/pod:code [slug]` | Runs the **wave loop**: one worktree per slice, all engineers in the wave dispatched at once, then integrates them into **one PR** onto the plan branch, runs the smoke test on the combined wave, checks the **look** at desktop and phone widths on UI waves (noted in the PR), and halts for you to merge |
| — | merge the wave's PR, reply `continue` | Next wave dispatches — repeat until the sprint's waves are done, then the sprint archives and `continue` chains into the next one. Each new sprint starts by merging anything new on `main` into the plan branch |
| 4 | *plan complete* | Opens one final PR (plan branch → `main`). The **reviewer** reads it wave by wave, then as a whole; blocking findings get one fix pass. Then it halts for you to merge, with the verdict, the leftover non-blocking findings sorted, and an **HTML report** of the plan (`docs/reports/<slug>.html`, about 2,000 words: key features, key decisions, data structures, and how the agents worked together; also `/pod:report [slug]` any time). Any choice you didn't answer during the run is written to `docs/decisions.md` as an *agent default*, so you can override it later |

### Which command, and what it branches off

The three execution commands differ by **base branch**, not by size of change:

| Command | Cuts off | Lands on | Cleans up after itself |
|---|---|---|---|
| `/pod:code`, `/pod:autopilot` | the plan branch | plan branch, one PR per wave | the orchestrator, post-merge |
| `/pod:fix <task>` | trunk (`origin`'s default branch, or `--merge-target=`) | trunk, one PR — reviewed, with one fix pass, before it comes to you (`--no-review` skips it for trivial changes) | the `/pod:fix` loop, after you merge |

`/pod:fix` is for work that stands alone — it never touches a plan branch, so running it mid-plan gives you a change that diverges from the plan until both land on trunk. The reviewer has no command of its own: `/pod:code` dispatches it on the final plan PR, and `/pod:fix` on its PR. Waves are trusted to their engineers' checks and the smoke test; the code is reviewed once, at plan end — see [`docs/design.md`](docs/design.md) for why.

Prefer to run each engineer yourself, in a terminal you can watch? `/pod:create-wave-prompts [sprint-slug] [wave]` works out the current wave from git and GitHub (a merged `Wave <N>` PR marks a wave done), then prints the worktree commands plus one paste-ready block per slice: open a terminal per slice at the project root, run `claude --agent pod:engineer`, and paste its block. It only writes text — combining the wave and opening its PR is then up to you.

## Autonomous flow — the waves ride themselves

`/pod:autopilot [plan-slug] [--max-sprints=N] [--max-waves=N] [--max-runtime=Nh] [--no-ci]` runs the whole plan unattended: dispatches each wave, integrates + verifies it, auto-merges the wave PR onto the plan branch (escalating risky ones), chains sprints, then opens the final plan→`main` PR, has the reviewer check it, and merges it on a pass — halting + notifying at each gate. It also sends you a notification when a choice needs you (for a look choice, with an HTML draft to compare options); the run keeps going with a default meanwhile. Invoking it is your consent to the auto-merges. It requires CI that runs on pull requests — a PR with no checks is never auto-merged — unless you pass `--no-ci`; `/pod:init` offers a minimal CI workflow if your repo has none. Criteria, defaults, and resume behavior live in the plugin's `skills/autopilot/policy.md`.

```
                                       ┌────────────────────────────────── SPRINT LOOP (outer) ──────────────────────────────────┐
                                       v                                                                                         │
┌───────────┐   ┌────────────┐   ┌────────────┐   ╔═══════════ WAVE LOOP (inner) ═══════════╗                   ┌───────────┐    │
│ autopilot │──>│ Read policy│──>│ Read sprint│──>║ ┌──────────┐   ┌──────────┐   ┌───────┐ ║──────────────────>│ Archive   │    │
│ plan-slug │   │ + bounds   │   │ doc        │   ║ │ Dispatch │──>│Integrate │──>│ Merge │ ║                   │ +mark     │    │
└───────────┘   └────────────┘   └────────────┘   ║ │ engineers│   │+ verify  │   │wave PR│ ║                   │ plan row  │    │
                                                  ║ └──────────┘   └──────────┘   └───┬───┘ ║                   └─────┬─────┘    │
                                                  ║      ^                            │     ║                         │          │
                                                  ║      └──── more waves <───────────┘     ║                         │          │
                                                  ╚═════════════════════════════════════════╝                         │          │
                                                                                        ┌─────────────────────────────┘          │
                                                                                        │                                        │
                        ┌──────────────┐                                       planned rows left?                                │
                        │ Plan complete│<──── no ───────────────────────────────────────┴─────── yes ───────┐                    │
                        └──────────────┘                                                       ┌────────────v─────────────┐      │
                                                                                               │sprint-planner drafts next│──────┘
                                                                                               │sprint ──> (re-read doc)  │
                                                                                               └──────────────────────────┘

Any policy gate at any step → halt + notify, then end the turn.
```

## State on disk

```
docs/
|-- known-issues/*.md     # durable constraints
|-- plans/<slug>.md       # strategic plans
|-- sprints/
|   |-- archive/          # completed sprints
|   `-- <slug>.md         # active sprint — status board + per-slice detail
|-- codebase-structure.md # high-level codebase brief (scout drafts, you maintain)
|-- decisions.md          # architectural decisions, authoritative (you maintain)
|-- design-drafts/*.html  # look options to pick from
|-- reports/<slug>.html   # plan report
`-- handoff-queue.md      # inter-agent comms — BLOCKED halts, PENDING defers, SOLVED informational
```

The rules the agents follow live in the plugin, not your repo, so they update with it. Each agent's full instructions are in its own file under `agents/` — they load automatically when the agent starts, so background agents never have to go read a separate file. Skill-only rules sit next to their skill: `skills/autopilot/policy.md` (autopilot's merge criteria and halt gates) and `skills/plan/template.md` (the plan template).
