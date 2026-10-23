# pod commands and files

The details behind the [README](../README.md): every command, the pod-flow pane, browser setup, the agents, and what pod keeps in your repo.

- [The commands](#the-commands)
- [pod-flow](#pod-flow)
- [Browser setup](#browser-setup)
- [The agents](#the-agents)
- [What pod keeps in your repo](#what-pod-keeps-in-your-repo)
- [Updating](#updating)
- [Credits](#credits)

## The commands

### `/pod:init`: set up a project

Creates pod's files in `pod-docs/` and never overwrites one that already exists. Run it again after an update to bring an older project's files up to date. The **scout** agent reads your codebase and writes a short guide to it (`pod-docs/codebase-structure.md`), including a **smoke recipe**: the steps to start the app and check it works. It also starts `pod-docs/features.md`: for each main feature, how to drive it and what proves it works. Each wave adds rows for what it builds, and the reviewer re-runs them at the end of each plan. Read what the scout wrote and fill in anything it left open. It can also add a basic CI workflow if you don't have one.

### `/pod:ship <idea>`: everything in one go

Runs research → plan → init (only if needed) → autopilot, so you never retype the idea. If the idea is one small change, it first offers to run it as `/pod:fix` instead (so does `/pod:plan`). You still answer the plan interview. Before autopilot starts, it shows you the plan and waits for `go`, because autopilot merges without you. If it stops partway, run `/pod:ship` again and it picks up where it left off.

Options: `--no-research` skips research, `--deep` researches more, and `--max-*` sets autopilot's limits.

### `/pod:research <idea> [--deep]`: look before you build

The **researcher** agent searches the web: what already exists, where it falls short, and how people build it. A narrow idea gets one researcher. A broad one gets up to 3 (`--deep`: up to 5), each looking at a different angle, working at the same time, and one more run combines their findings. Every claim links to its source. It ends with ideas and questions for your plan. The report is saved to `pod-docs/research/<slug>.md` for the agents, and pod opens `pod-docs/research/<slug>.html` for you: cards for what exists, with how close each is to your idea, and each question with its options side by side. This works in any folder, even before `/pod:init`.

### `/pod:plan`: decide what to build

pod interviews you about goals, scope, stack, and risks. Choose the **fast path** to accept its suggested answer wherever there's a safe default. If your project has a UI, you pick a **look** from three options shown in an HTML page (`pod-docs/design-drafts/<slug>-look.html`). The plan is saved to `pod-docs/plans/<slug>.md`.

Before any code, pod shows you an **overview** of what it will build: the parts and how they connect, the main flow step by step, and where the data lives, as diagrams in an HTML page (`pod-docs/design-drafts/<slug>-overview.html`). pod waits until you reply `ok` or send changes. The sprints follow the overview you approved, and the final report draws it again as built, marking any difference.

*Tip:* install the `grilling` skill for a deeper interview:

```
npx -y skills add mattpocock/skills -g -s grilling -y
```

### `/pod:sprint [slug]`: split the next step into work

Writes `pod-docs/sprints/<slug>.md` with slices grouped into waves. **Read it before coding.** This is your best chance to catch two slices that touch the same files.

Options: `--max-width=N` allows wider waves (default 5).

### `/pod:code [slug]`: build, one wave at a time

For each wave, pod starts one engineer per slice, combines their work into one PR, starts the app to check it, and checks the look at desktop and phone sizes. Then it **stops for you to merge**. Reply `continue` for the next wave. When the plan is done, it opens the final PR to `main`. The **reviewer** checks it and fixes any blocking issues once. You also get an HTML report (`pod-docs/reports/<slug>.html`). Any question you didn't answer along the way is saved in `pod-docs/decisions.md` as an *agent default*, so you can change it later.

Each plan claims its own port range (3000, 3100, …) and records it in the plan doc, so two pod runs on one machine, such as two repos overnight, never fight over ports. In a new JavaScript project, engineers use pnpm, so each install reuses one shared store; an existing project keeps the package manager its lockfile names.

Options: `--merge-target=<branch>` (default: your repo's default branch).

### `/pod:autopilot [slug]`: build without stopping for you

Does the same as `/pod:code`, but merges each wave PR itself and moves on to the next sprint. It **stops and notifies you** when something looks risky: a failed check, an engineer who isn't confident, a change that's hard to undo, or a limit you set. If a question comes up, it notifies you and keeps going with a default. Running it means you agree to the auto-merges.

Before it starts, it asks once where to merge. The recommended choice is a `pod-staging` branch: autopilot merges there and, at the end, opens a PR from `pod-staging` to your default branch. The PR's title says what the plans built, and its body has a section per plan: the goal, the features, the decisions made for you, loose ends, and links to the plan's PR and report. A later plan that lands before you merge adds its own section. You merge that PR after a look, so nothing nobody read reaches `main` overnight. Pass `--merge-target=<branch>` to skip the question.

Limits: `--max-sprints=N`, `--max-waves=N` (default 20), `--max-runtime=Nh`, and `--max-width=N` for wider waves. CI is optional but recommended. With CI, every check must pass before a merge. The full rules are in [`skills/autopilot/policy.md`](../skills/autopilot/policy.md).

Run one plan per session: after a plan completes, run `/clear` before the next `/pod:autopilot`. State lives on disk, so nothing is lost, and the next plan starts with a fresh context.

### `/pod:fix <task>`: one change, outside any plan

One engineer builds the change test-first, the reviewer checks it, and you merge the PR. It branches off `main` (or `--merge-target=<branch>`), never off a plan branch. Add `--no-review` for trivial changes. Small, contained fixes run on Sonnet, the rest on Opus; `--model=sonnet|opus` picks one yourself.

### `/pod:create-wave-prompts [sprint] [wave]`: run engineers yourself

Works out the current wave and prints the commands plus one ready-to-paste prompt per slice. Open a terminal per slice, run `claude --agent pod:engineer`, and paste the prompt. Combining the work and opening the PR is up to you.

Options: `--merge-target=<branch>`.

### `/pod:report [slug]`: plan report

Writes an HTML report of a plan: key features, how the parts fit together as built, decisions, data structures, and how the agents worked together. At the end of a plan, the reporter also writes `pod-docs/feature-details/<feature>.md` for each feature the plan added or changed: how it works, why it's built that way, and what to watch out for. Later agents read these before they change a feature.

### `/pod:idea [idea]`: save an idea for later

Saves the idea to `pod-docs/ideas/<slug>.md`, with why it waits and what would make it worth building. Run it with no idea to list what's saved and open `pod-docs/ideas/index.html`, a board of every idea by status (parked, planned, built, dropped). pod updates the board whenever an idea changes. When you later start `/pod:research`, `/pod:plan`, `/pod:ship`, or `/pod:fix` on something a saved idea touches, pod shows it and asks whether to build on it. At the end of `/pod:plan`, pod also offers to save what you left out of scope.

### `/pod:teach [topic]`: learn a codebase

Explains how a codebase works and why it's built that way, so you understand it before you change it. With no topic, it covers the whole system; with one, such as `/pod:teach billing`, it covers only that feature and where it touches the rest. pod reads the code (splitting a big area across a few read-only agents) and looks for the reasons in git history, PRs, and the docs. Every reason is labeled **known** (with its source), **inferred**, or **unknown**.

You get an HTML page, `pod-docs/teach/<topic>.html` (`system.html` with no topic): a map of the parts, the main flow as a diagram with a worked example, where things live, the reasons, what to watch out for, and topics to learn next. It changes no code and works in any repo, even before `/pod:init`. Running it again keeps the old page as `<topic>-1.html`.

## pod-flow

*Optional, experimental.* pod-flow shows a run as a tree (plan, sprints, waves, engineers) beside the transcript. Install it inside Claude Code:

```
/plugin install pod-flow@pod
```

The tree opens beside the transcript when you start `/pod:autopilot` or `/pod:ship`. Its first group, **needs you**, lists the queue entries waiting on your answer: a `BLOCKED`, a decision, a product choice, or a one-way door. At the plan's hand-back, a **Run app** button starts the app for you to look at (it sends `run app`, as if you typed it), above a checklist of the features the plan added or changed. To open it again, run `/pod-flow`. Other commands:

- `/pod-flow preview`: open the tree on this project's docs without a run.
- `/pod-flow text`: print the tree as a few lines, for a narrow terminal.
- `/pod-flow reset`: forget this session's agents, token counts, and folds.

pod-flow only reads your `pod-docs/` files (or `docs/`, before you upgrade) and the session's agent list, and asks `gh` whether the final PR has merged. It needs a Claude Code build with function hooks, which are in early access, so expect rough edges.

## Browser setup

For apps with a UI, agents check pages with [`agent-browser`](https://github.com/vercel-labs/agent-browser), headless: `npm i -g agent-browser`. On Windows, agents run it from Git Bash, because it can hang under PowerShell. When it's missing or doesn't respond, pod offers to install it, to use [chrome-devtools-axi](https://www.npmjs.com/package/chrome-devtools-axi) (`npm i -g chrome-devtools-axi`), or to use the [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) instead. To connect the MCP, follow its README, then restart Claude Code. With the MCP, only one agent can use the browser at a time, so during a plan the engineers skip their own page checks and the orchestrator does them. You get fewer checks.

## The agents

| Agent | What it does |
|---|---|
| **scout** | Reads your codebase and writes the guide that engineers read before coding |
| **researcher** | Searches the web for an idea and links every claim. Never touches code |
| **sprint-planner** | Splits the next part of the plan into slices and waves |
| **engineer** | Builds one slice in its own copy of the repo, test-first, then checks it in the browser |
| **reviewer** | Reviews the final plan PR and every `/pod:fix` PR. Never edits code |
| **reporter** | Writes the HTML report of a finished plan, and the feature details of what it built |

## What pod keeps in your repo

pod keeps its files in `pod-docs/`, apart from your own `docs/`. `pod-docs/README.md` has this overview and a `pod docs: 2` line that tells pod which layout the folder uses.

```
pod-docs/
│  For you: you read these and decide
├── ideas/                  ideas saved for later (/pod:idea); open index.html
├── research/               web research reports; open each .html
├── design-drafts/          look options and plan overviews to check
├── reports/                plan reports
├── teach/                  explanations of your code (/pod:teach)
│
│  Shared: you and the agents both read and write these
├── plans/                  plans; each keeps its resolved notes in a ## Queue log
├── decisions.md            your decisions, which agents must follow
├── handoff-queue.md        open notes between agents and you
│
│  For agents: agents keep these; skim them, fix what's wrong
├── codebase-structure.md   guide to your code (scout writes it, you keep it up to date)
├── features.md             how to prove each feature works (scout starts it, each wave adds rows)
├── feature-details/        how each feature works and why, one file each (written at plan end)
├── known-issues/           gotchas, one file each (e.g. "tests need Docker")
└── sprints/                the current sprint, plus archive/ for finished ones
```

Read each sprint doc before `/pod:code` starts it, even though agents keep it. That's your best chance to catch two slices that touch the same files.

Everything else (the agents, skills, and rules) stays inside the plugin and updates with it.

## Updating

Refresh the catalog, then update the plugins you installed:

```
/plugin marketplace update pod
claude plugin update pod@pod
claude plugin update pod-flow@pod
```

The first line runs inside Claude Code. The other two run in your terminal; skip `pod-flow@pod` if you didn't install it. Run `/reload-plugins` or restart Claude Code to load the new version.

To get updates without asking, turn on **Enable auto-update** for the `pod` marketplace under `/plugin` → **Marketplaces**. It's off by default for marketplaces outside Anthropic's.

Updating never touches your `pod-docs/` files. When a new version changes their layout, pod stops and asks you to run `/pod:init`, which shows what will move and waits for your yes. Projects from pod 0.1.2 or earlier keep pod's files in `docs/`; `/pod:init` moves them to `pod-docs/` with `git mv` and leaves the rest of `docs/` alone. See [`CHANGELOG.md`](../CHANGELOG.md) for what changed.

**Other ways to install:** use a local clone with `/plugin marketplace add /path/to/claude-pod`, or try it for one session with `claude --plugin-dir /path/to/claude-pod`.

## Credits

Several of pod's checks come from **pstack**, a Cursor plugin by Lauren Tan. Flavio Copes explains it in [A deep dive into pstack](https://flaviocopes.com/pstack). pod borrows these ideas, adapted to its own flow:

- **Reproduce before fixing:** `/pod:fix` reproduces a bug and names its cause before changing code (from pstack's Bug fix playbook).
- **Dismissed findings:** the reviewer lists what it checked and dropped, so you can overrule it (from `/interrogate`).
- **Feature map:** `pod-docs/features.md` records how to prove each feature works on the running app (from `/create-verification-skill`).
- **Contract friction:** engineers report a design that keeps fighting back instead of working around it (from `/architect`).
- **Teach:** `/pod:teach` joins how the code works with why it's built that way, splits a big area across parallel readers, and labels each reason known, inferred, or unknown (from `/teach`, `/how`, and `/why`).

