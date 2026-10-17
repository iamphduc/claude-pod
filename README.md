# pod

pod is a Claude Code plugin that turns an idea into working code using a small team of Claude agents.

You describe what you want. pod interviews you, writes a plan, splits it into small pieces, and has several Claude engineers build those pieces **at the same time**, each in its own copy of the repo. Every batch of work becomes one pull request. You decide what gets merged, or let autopilot merge for you.

```
idea → research → plan → sprints → waves of parallel engineers → review → merged to main
```

## Quick start

You need Claude Code, `git`, and the GitHub CLI (`gh`), logged in. For apps with a UI, agents check pages with [`agent-browser`](https://github.com/vercel-labs/agent-browser): `npm i -g agent-browser`. Without it, pod offers to install it or to use the [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) instead. With the MCP, only one agent can use the browser at a time, so during a plan the engineers skip their own page checks and the orchestrator does them. You get fewer checks.

**1. Install** (inside Claude Code):

```
/plugin marketplace add iamphduc/claude-pod
/plugin install pod@pod
```

*Optional, experimental:* to watch a run as a tree (plan, sprints, waves, engineers), also install pod-flow:

```
/plugin install pod-flow@pod
```

The tree opens beside the transcript when you start `/pod:autopilot` or `/pod:ship`. To open it again, run `/pod-flow`. Other commands:

- `/pod-flow preview`: open the tree on this project's docs without a run.
- `/pod-flow text`: print the tree as a few lines, for a narrow terminal.
- `/pod-flow reset`: forget this session's agents, token counts, and folds.

pod-flow only reads your `pod-docs/` files (or `docs/`, before you upgrade) and the session's agent list, and asks `gh` whether the final PR has merged. It needs a Claude Code build with function hooks, which are in early access, so expect rough edges.

**2. Ship an idea** (from the repo root, new or existing):

```
/pod:ship a habit tracker with streaks and reminders
```

That's it. pod researches the idea, interviews you, writes the plan, sets pod up in the project if needed, asks you to reply `go`, and then builds it. A small change runs as one fix instead of a plan. After a stop, run `/pod:ship` again to pick up where it left off.

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
| Save an idea for later | `/pod:idea <idea>` |

## How it works

A few words pod uses:

- **Plan**: what you're building and why, in up to 4 sprints. Saved in `pod-docs/plans/`.
- **Sprint**: one step of the plan, split into slices. Saved in `pod-docs/sprints/`.
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

Engineers work **test-first**: they write a test for each goal, watch it fail, then make it pass. They also check UI work in a real browser. The code is reviewed once, on the final PR. [`pod-docs/design.md`](pod-docs/design.md) explains why.

## The commands

### `/pod:init`: set up a project

Creates pod's files in `pod-docs/` and never overwrites one that already exists. Run it again after an update to bring an older project's files up to date. The **scout** agent reads your codebase and writes a short guide to it (`pod-docs/codebase-structure.md`), including a **smoke recipe**: the steps to start the app and check it works. It also starts `pod-docs/features.md`: for each main feature, how to drive it and what proves it works. Each wave adds rows for what it builds, and the reviewer re-runs them at the end of each plan. Read what the scout wrote and fill in anything it left open. It can also add a basic CI workflow if you don't have one.

### `/pod:ship <idea>`: everything in one go

Runs research → plan → init (only if needed) → autopilot, so you never retype the idea. If the idea is one small change, it first offers to run it as `/pod:fix` instead (so does `/pod:plan`). You still answer the plan interview. Before autopilot starts, it shows you the plan and waits for `go`, because autopilot merges without you. If it stops partway, run `/pod:ship` again and it picks up where it left off.

Options: `--no-research` skips research, `--deep` researches more, and `--max-*` sets autopilot's limits.

### `/pod:research <idea> [--deep]`: look before you build

The **researcher** agent searches the web: what already exists, where it falls short, and how people build it. A narrow idea gets one researcher. A broad one gets up to 3 (`--deep`: up to 5), each looking at a different angle, working at the same time, and one more run combines their findings. Every claim links to its source. It ends with ideas and questions for your plan. The report is saved to `pod-docs/research/<slug>.md`. This works in any folder, even before `/pod:init`.

### `/pod:plan`: decide what to build

pod interviews you about goals, scope, stack, and risks. Choose the **fast path** to accept its suggested answer wherever there's a safe default. If your project has a UI, you pick a **look** from three options shown in an HTML page (`pod-docs/design-drafts/look-directions.html`). The plan is saved to `pod-docs/plans/<slug>.md`.

*Tip:* install the `grilling` skill for a deeper interview:

```
npx -y skills add mattpocock/skills -g -s grilling -y
```

### `/pod:sprint [slug]`: split the next step into work

Writes `pod-docs/sprints/<slug>.md` with slices grouped into waves. **Read it before coding.** This is your best chance to catch two slices that touch the same files.

Options: `--max-width=N` allows wider waves (default 5).

### `/pod:code [slug]`: build, one wave at a time

For each wave, pod starts one engineer per slice, combines their work into one PR, starts the app to check it, and checks the look at desktop and phone sizes. Then it **stops for you to merge**. Reply `continue` for the next wave. When the plan is done, it opens the final PR to `main`. The **reviewer** checks it and fixes any blocking issues once. You also get an HTML report (`pod-docs/reports/<slug>.html`). Any question you didn't answer along the way is saved in `pod-docs/decisions.md` as an *agent default*, so you can change it later.

Options: `--merge-target=<branch>` (default: your repo's default branch).

### `/pod:autopilot [slug]`: build without stopping for you

Does the same as `/pod:code`, but merges each wave PR itself and moves on to the next sprint. It **stops and notifies you** when something looks risky: a failed check, an engineer who isn't confident, a change that's hard to undo, or a limit you set. If a question comes up, it notifies you and keeps going with a default. Running it means you agree to the auto-merges.

Limits: `--max-sprints=N`, `--max-waves=N` (default 20), `--max-runtime=Nh`, and `--max-width=N` for wider waves. CI is optional but recommended. With CI, every check must pass before a merge. The full rules are in [`skills/autopilot/policy.md`](skills/autopilot/policy.md).

Run one plan per session: after a plan completes, run `/clear` before the next `/pod:autopilot`. State lives on disk, so nothing is lost, and the next plan starts with a fresh context.

### `/pod:fix <task>`: one change, outside any plan

One engineer builds the change test-first, the reviewer checks it, and you merge the PR. It branches off `main` (or `--merge-target=<branch>`), never off a plan branch. Add `--no-review` for trivial changes. Small, contained fixes run on Sonnet, the rest on Opus; `--model=sonnet|opus` picks one yourself.

### `/pod:create-wave-prompts [sprint] [wave]`: run engineers yourself

Works out the current wave and prints the commands plus one ready-to-paste prompt per slice. Open a terminal per slice, run `claude --agent pod:engineer`, and paste the prompt. Combining the work and opening the PR is up to you.

Options: `--merge-target=<branch>`.

### `/pod:report [slug]`: plan report

Writes an HTML report of a plan: key features, decisions, data structures, and how the agents worked together.

### `/pod:idea [idea]`: save an idea for later

Saves the idea to `pod-docs/ideas/<slug>.md`, with why it waits and what would make it worth building. Run it with no idea to list what's saved. When you later start `/pod:research`, `/pod:plan`, `/pod:ship`, or `/pod:fix` on something a saved idea touches, pod shows it and asks whether to build on it. At the end of `/pod:plan`, pod also offers to save what you left out of scope.

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

pod keeps its files in `pod-docs/`, apart from your own `docs/`. `pod-docs/README.md` has this overview and a `pod docs: 2` line that tells pod which layout the folder uses.

```
pod-docs/
│  For you: you read these and decide
├── ideas/                  ideas saved for later (/pod:idea)
├── research/               web research reports
├── design-drafts/          look options to choose from
├── reports/                plan reports
│
│  Shared: you and the agents both read and write these
├── plans/                  plans; each keeps its resolved notes in a ## Queue log
├── decisions.md            your decisions, which agents must follow
├── handoff-queue.md        open notes between agents and you
│
│  For agents: agents keep these; skim them, fix what's wrong
├── codebase-structure.md   guide to your code (scout writes it, you keep it up to date)
├── features.md             how to prove each feature works (scout starts it, each wave adds rows)
├── known-issues/           gotchas, one file each (e.g. "tests need Docker")
└── sprints/                the current sprint, plus archive/ for finished ones
```

Read each sprint doc before `/pod:code` starts it, even though agents keep it. That's your best chance to catch two slices that touch the same files.

Everything else (the agents, skills, and rules) stays inside the plugin and updates with it.

## Update

Refresh the catalog, then update the plugins you installed:

```
/plugin marketplace update pod
claude plugin update pod@pod
claude plugin update pod-flow@pod
```

The first line runs inside Claude Code. The other two run in your terminal; skip `pod-flow@pod` if you didn't install it. Run `/reload-plugins` or restart Claude Code to load the new version.

To get updates without asking, turn on **Enable auto-update** for the `pod` marketplace under `/plugin` → **Marketplaces**. It's off by default for marketplaces outside Anthropic's.

Updating never touches your `pod-docs/` files. When a new version changes their layout, pod stops and asks you to run `/pod:init`, which shows what will move and waits for your yes. Projects from pod 0.1.2 or earlier keep pod's files in `docs/`; `/pod:init` moves them to `pod-docs/` with `git mv` and leaves the rest of `docs/` alone. See [`CHANGELOG.md`](CHANGELOG.md) for what changed.

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

## Checking a change

Run these from the repo root before you open a PR. CI runs the first two on every PR.

```
claude plugin validate . && claude plugin validate ./pod-flow
cd pod-flow && claude plugin test .
```

To typecheck pod-flow, load it in a session once so Claude Code writes its types (`claude --plugin-dir ./pod-flow`), then run `npx tsc --noEmit -p .` from `pod-flow/`.

The rule files in `agents/` and `skills/` have no tests. To try a rule change, run pod on a scratch repo with `claude --plugin-dir /path/to/claude-pod`.

## Credits

Several of pod's checks come from **pstack**, a Cursor plugin by Lauren Tan. Flavio Copes explains it in [A deep dive into pstack](https://flaviocopes.com/pstack). pod borrows these ideas, adapted to its own flow:

- **Reproduce before fixing:** `/pod:fix` reproduces a bug and names its cause before changing code (from pstack's Bug fix playbook).
- **Dismissed findings:** the reviewer lists what it checked and dropped, so you can overrule it (from `/interrogate`).
- **Feature map:** `pod-docs/features.md` records how to prove each feature works on the running app (from `/create-verification-skill`).
- **Contract friction:** engineers report a design that keeps fighting back instead of working around it (from `/architect`).

Ideas for pod itself that are still under consideration are in [`docs/ideas/`](docs/ideas/).

## License

[MIT](LICENSE)
