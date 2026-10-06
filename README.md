# pod

pod is a Claude Code plugin that turns an idea into working code using a small team of Claude agents.

You describe what you want. pod interviews you, writes a plan, splits it into small pieces, and has several Claude engineers build those pieces **at the same time**, each in its own copy of the repo. Every batch of work becomes one pull request. You decide what gets merged, or let autopilot merge for you.

```
idea → research → plan → sprints → waves of parallel engineers → review → merged to main
```

## Quick start

You need Claude Code, `git`, and the GitHub CLI (`gh`), logged in.

**1. Install** (inside Claude Code):

```
/plugin marketplace add iamphduc/claude-pod
/plugin install pod@pod
```

**2. Set up your project** (from the repo root, new or existing):

```
/pod:init
```

**3. Ship an idea:**

```
/pod:ship a habit tracker with streaks and reminders
```

That's it. pod researches the idea, interviews you, writes the plan, asks you to reply `go`, and then builds it.

## Which command do I use?

| I want to… | Run |
|---|---|
| Go from an idea to shipped code in one command | `/pod:ship <idea>` |
| Just look into an idea first | `/pod:research <idea>` |
| Make a plan, then control each step myself | `/pod:plan`, then `/pod:sprint`, then `/pod:code` |
| Run an existing plan without me | `/pod:autopilot` |
| Make one small change, outside any plan | `/pod:fix <task>` |
| Run each engineer myself in my own terminals | `/pod:create-wave-prompts` |
| Get a report on a finished plan | `/pod:report` |

## How it works

A few words pod uses:

- **Plan**: what you're building and why, in up to 4 sprints. Saved in `docs/plans/`.
- **Sprint**: one step of the plan, split into slices. Saved in `docs/sprints/`.
- **Slice**: a piece of work small enough for one engineer. Each slice owns its own files.
- **Wave**: a group of slices that don't touch the same files, so they can be built at the same time.
- **Plan branch**: a branch that collects every wave. It merges into `main` once, at the end.

```
┌─ for each sprint ───────────────────────────────────────────┐
│                                                             │
│   ┌─ for each wave ──────────────────────────────────────┐  │
│   │  engineers build their slices at the same time       │  │
│   │  → combined into one PR onto the plan branch         │  │
│   │  → app is started and checked                        │  │
│   │  → you merge it (or autopilot does)                  │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
then: one final PR (plan branch → main), reviewed, then merged
```

Engineers work **test-first**: they write a test for each goal, watch it fail, then make it pass. They also check UI work in a real browser. The code is reviewed once, on the final PR. [`docs/design.md`](docs/design.md) explains why.

## The commands

### `/pod:init`: set up a project

Creates pod's files in `docs/` and never overwrites one that already exists. The **scout** agent reads your codebase and writes a short guide to it (`docs/codebase-structure.md`), including a **smoke recipe**: the steps to start the app and check it works. It also starts `docs/features.md`: for each main feature, how to drive it and what proves it works. Each wave adds rows for what it builds, and the reviewer re-runs them at the end of each plan. Read what the scout wrote and fill in anything it left open. It can also add a basic CI workflow if you don't have one.

### `/pod:ship <idea>`: everything in one go

Runs research → plan → init (only if needed) → autopilot, so you never retype the idea. You still answer the plan interview. Before autopilot starts, it shows you the plan and waits for `go`, because autopilot merges without you. If it stops partway, run `/pod:ship` again and it picks up where it left off.

Options: `--no-research` skips research, `--deep` researches more, and `--max-*` sets autopilot's limits.

### `/pod:research <idea> [--deep]`: look before you build

The **researcher** agent searches the web: what already exists, where it falls short, and how people build it. Every claim links to its source. It ends with ideas and questions for your plan. The report is saved to `docs/research/<slug>.md`. This works in any folder, even before `/pod:init`.

### `/pod:plan`: decide what to build

pod interviews you about goals, scope, stack, and risks. Choose the **fast path** to accept its suggested answer wherever there's a safe default. If your project has a UI, you pick a **look** from three options shown in an HTML page (`docs/design-drafts/look-directions.html`). The plan is saved to `docs/plans/<slug>.md`.

*Tip:* install the `grilling` skill for a deeper interview:

```
npx -y skills add mattpocock/skills -g -s grilling -y
```

### `/pod:sprint [slug]`: split the next step into work

Writes `docs/sprints/<slug>.md` with slices grouped into waves. **Read it before coding.** This is your best chance to catch two slices that touch the same files.

### `/pod:code [slug]`: build, one wave at a time

For each wave, pod starts one engineer per slice, combines their work into one PR, starts the app to check it, and checks the look at desktop and phone sizes. Then it **stops for you to merge**. Reply `continue` for the next wave. When the plan is done, it opens the final PR to `main`. The **reviewer** checks it and fixes any blocking issues once. You also get an HTML report (`docs/reports/<slug>.html`). Any question you didn't answer along the way is saved in `docs/decisions.md` as an *agent default*, so you can change it later.

### `/pod:autopilot [slug]`: build without stopping for you

Does the same as `/pod:code`, but merges each wave PR itself and moves on to the next sprint. It **stops and notifies you** when something looks risky: a failed check, an engineer who isn't confident, a change that's hard to undo, or a limit you set. If a question comes up, it notifies you and keeps going with a default. Running it means you agree to the auto-merges.

Limits: `--max-sprints=N`, `--max-waves=N` (default 20), `--max-runtime=Nh`. CI is optional but recommended. With CI, every check must pass before a merge. The full rules are in [`skills/autopilot/policy.md`](skills/autopilot/policy.md).

### `/pod:fix <task>`: one change, outside any plan

One engineer builds the change test-first, the reviewer checks it, and you merge the PR. It branches off `main` (or `--merge-target=<branch>`), never off a plan branch. Add `--no-review` for trivial changes.

### `/pod:create-wave-prompts [sprint] [wave]`: run engineers yourself

Works out the current wave and prints the commands plus one ready-to-paste prompt per slice. Open a terminal per slice, run `claude --agent pod:engineer`, and paste the prompt. Combining the work and opening the PR is up to you.

### `/pod:report [slug]`: plan report

Writes an HTML report of a plan: key features, decisions, data structures, and how the agents worked together.

## The agents

| Agent | What it does |
|---|---|
| **scout** | Reads your codebase and writes the guide that engineers read before coding |
| **researcher** | Searches the web for an idea and links every claim. Never touches code |
| **sprint-planner** | Splits the next part of the plan into slices and waves |
| **engineer** | Builds one slice in its own copy of the repo, test-first, then checks it in the browser |
| **reviewer** | Reviews the final plan PR and every `/pod:fix` PR. Never edits code |
| **reporter** | Writes the HTML report of a finished plan |

## What pod keeps in your repo

```
docs/
├── codebase-structure.md   guide to your code (scout writes it, you keep it up to date)
├── decisions.md            your architectural decisions
├── features.md             how to prove each feature works (scout starts it, each wave adds rows)
├── known-issues/           gotchas, one file each (e.g. "tests need Docker")
├── research/               web research reports
├── plans/                  plans
├── sprints/                the current sprint, plus archive/ for finished ones
├── design-drafts/          look options to choose from
├── reports/                plan reports
└── handoff-queue.md        notes between agents and you
```

Everything else (the agents, skills, and rules) stays inside the plugin and updates with it.

## Update

```
/plugin marketplace update pod
```

Your `docs/` files are never touched.

**Other ways to install:** use a local clone with `/plugin marketplace add /path/to/claude-pod`, or try it for one session with `claude --plugin-dir /path/to/claude-pod`.

## Editing pod's rules

The files in `agents/` and `skills/` are read by agents on every run, so each line costs tokens and takes the agent's attention. Only keep three kinds of lines:

- **Guardrails** that prevent real damage or keep you in control. For example: never touch `main`, never force-push, stay inside your own files, you decide what merges, tests come first, and keep secrets out.
- **Contracts**: the exact formats agents pass to each other (dispatch fields, hand-backs, queue entries, the status board, PR titles).
- **The goal and the reason** for each role, in a sentence or two.

Put each rule on the right side: a **skill** is a command you type, and an **agent** is a worker it sends out. See "Where rules live" in [`docs/design.md`](docs/design.md).

Leave out everything else: fixes for one project's bug, commands the model already knows, step-by-step procedures, stories from past runs, and rules repeated from another file. When a test run finds a problem, fix it with a general check, not a new bullet that names the bug.

Why:

- Anthropic, [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): assume Claude is already smart, and add only what it doesn't know.
- Anthropic, [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices): newer models follow short instructions *with a reason* better than long lists of ALWAYS/NEVER rules.
- ETH Zurich, "Evaluating AGENTS.md" ([summary](https://developer.upsun.com/posts/ai/agents-md-less-is-more)): instruction files for coding agents gave little or negative gain while adding over 20% cost.

## Credits

Several of pod's checks come from **pstack**, a Cursor plugin by Lauren Tan. Flavio Copes explains it in [A deep dive into pstack](https://flaviocopes.com/pstack). pod borrows these ideas, adapted to its own flow:

- **Reproduce before fixing:** `/pod:fix` reproduces a bug and names its cause before changing code (from pstack's Bug fix playbook).
- **Dismissed findings:** the reviewer lists what it checked and dropped, so you can overrule it (from `/interrogate`).
- **Feature map:** `docs/features.md` records how to prove each feature works on the running app (from `/create-verification-skill`).
- **Contract friction:** engineers report a design that keeps fighting back instead of working around it (from `/architect`).

Ideas still under consideration are in [`docs/ideas/`](docs/ideas/).
