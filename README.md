# pod

pod is a Claude Code plugin that turns an idea into working code using a small team of Claude agents.

You describe what you want. pod interviews you, writes a plan, splits it into small pieces, and has several Claude engineers build those pieces **at the same time**, each in its own copy of the repo. Every batch of work becomes one pull request. You decide what gets merged, or let autopilot merge for you.

```
idea → research → plan → sprints → waves of parallel engineers → review → merged to main
```

## Quick start

You need Claude Code, `git`, and the GitHub CLI (`gh`), logged in. For apps with a UI, also install `agent-browser` (`npm i -g agent-browser`) so agents can check pages. If it doesn't work on your machine, pod offers other options; see [Browser setup](docs/commands.md#browser-setup).

**1. Install** (inside Claude Code):

```
/plugin marketplace add iamphduc/claude-pod
/plugin install pod@pod
```

**2. Ship an idea** (from the repo root, new or existing):

```
/pod:ship a habit tracker with streaks and reminders
```

pod researches the idea, interviews you, shows you an overview of what it will build, and waits for you to reply `go`. Then it builds. A small change runs as one fix instead of a plan. After a stop, run `/pod:ship` again to pick up where it left off.

*Optional:* install `pod-flow@pod` to watch a run as a live tree beside the transcript; see [pod-flow](docs/commands.md#pod-flow).

## Which command do I use?

| I want to… | Run |
|---|---|
| Go from an idea to shipped code in one command | `/pod:ship <idea>` |
| Just look into an idea first | `/pod:research <idea>` |
| Make a plan, then control each step myself | `/pod:plan`, then `/pod:sprint`, then `/pod:code` |
| Run an existing plan without me | `/pod:autopilot` |
| Make one small change, outside any plan | `/pod:fix <task>` |
| Learn how a codebase, or one feature of it, works and why | `/pod:teach [topic]` |
| Save an idea for later | `/pod:idea <idea>` |
| Get a report on a finished plan | `/pod:report` |
| Run each engineer myself in my own terminals | `/pod:create-wave-prompts` |

Each command is explained in [docs/commands.md](docs/commands.md).

## How it works

- **Plan:** what you're building and why, in up to 4 sprints.
- **Sprint:** one step of the plan, split into slices.
- **Slice:** a piece of work small enough for one engineer. Each slice owns its own files.
- **Wave:** slices that don't touch the same files, so they're built at the same time.

```
┌─ for each sprint ───────────────────────────────────────────┐
│   ┌─ for each wave ──────────────────────────────────────┐  │
│   │  engineers build their slices at the same time       │  │
│   │  → combined into one PR onto the plan branch         │  │
│   │  → app is started and checked                        │  │
│   │  → you merge it (or autopilot does)                  │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
then: one final PR (plan branch → main), reviewed, then merged
```

Engineers work **test-first** and check UI work in a real browser. The code is reviewed once, on the final PR. pod keeps its files in `pod-docs/`, and the pages meant for you are HTML: the plan overview, research, reports, and explanations of your code.

## Update

```
/plugin marketplace update pod
claude plugin update pod@pod
```

The first line runs inside Claude Code, the second in your terminal (also `claude plugin update pod-flow@pod` if you use it). Then run `/reload-plugins`. Updating never touches your `pod-docs/` files; if a new version changes their layout, pod asks you to run `/pod:init`. Auto-update and other ways to install are in [Updating](docs/commands.md#updating). See [CHANGELOG.md](CHANGELOG.md) for what changed.

## Learn more

- [docs/commands.md](docs/commands.md): every command, pod-flow, the agents, and what pod keeps in your repo
- [docs/design.md](docs/design.md): why pod works the way it does
- [CONTRIBUTING.md](CONTRIBUTING.md): changing pod itself, checking a change, and releasing

## Credits

Several of pod's checks come from **pstack**, a Cursor plugin by Lauren Tan ([a deep dive](https://flaviocopes.com/pstack)). The `/pod:plan` interview is adapted from Matt Pocock's [`grilling`](https://github.com/mattpocock/skills) skill. See [what pod borrows](docs/commands.md#credits).

## License

[MIT](LICENSE)
