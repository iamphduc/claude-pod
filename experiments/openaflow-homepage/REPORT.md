# Open AFlow homepage: four agent UI libraries compared

The same homepage for [Open AFlow](https://github.com/alvionlabs/openaflow), built four times on 2026-11-09.
Each build used a different library for the live demo (a fake pod run with 5 agents, 7 tool calls and 3 decisions).
Same brief (`SPEC.md`), same copy and data (`shared/`), same Open AFlow tokens. One agent per library, all running at the same time.

**You judge the UI.** Screenshots are in `screenshots/`. This report covers time, cost and what went wrong.

## Results at a glance

| | AgentPrism | tool-ui | AI Elements | affectUI (free) |
|---|---|---|---|---|
| **Build time** (agent, min) | 9.4 | 12.2 | 10.7 | **6.0** |
| Where the time went | verify 3.7 (mobile overflow) | page 5.7 (fitting library pieces into the layout) | verify 6.0 (visual bugs found in screenshots) | evenly spread |
| Edits to copied library files | 4 | 4 | 4 | **0** |
| Demo parts from the library | tree, details panel | agents, tool calls, terminal, decisions | run, agents, wave tree, tool calls, decisions | tool calls, decisions |
| Demo parts hand-rolled | decisions, run header, replay | run header, status dot | status dot, figures, "needs you" list, replay | **agent list** (the core), replay |
| Needs Tailwind | **v3** (not v4) | v4 | v4 | **none** |
| Installed packages | 162 | 122 | 190 | **26** |
| `node_modules` | 135 MB | 212 MB | 242 MB | **105 MB** |
| **JS loaded on first visit** (gzip) | 105 KB | 199 KB | 187 KB | **85 KB** |
| CSS loaded (gzip) | 8 KB | 41 KB | 40 KB | **3 KB** |
| `dist` size / JS files | 1 MB / 1 | 11 MB / 309 | 11 MB / 298 | 1 MB / 1 |
| Clean install / build (s) | 3.3 / 6.5 | 4.1 / 1.9 | 4.2 / 4.9 | **1.3 / 0.8** |
| Lighthouse perf / a11y / best | 74 / 97 / 100 | 66 / 99 / 100 | 67 / 95 / 96 | **76 / 100 / 100** |
| Lighthouse a11y fails | link name ≠ label, small tap target | `role` not allowed on element | small tap target | none |
| Agent's fit score | 3 / 5 | 3 / 5 | **4 / 5** | 3.5 / 5 |

The numbers above were measured by `scripts/measure.mjs`, the same way for all four (raw data in `results/metrics.json`).
Build times come from each agent's `timing.tsv`. I cross-checked them against file times and the agents' total run times.

## One line each

- **affectUI**: fastest, lightest, no edits needed. But the most important part, the agent tree, is paid, so the core of the demo is hand-made.
- **AI Elements**: covers the most of the demo and was easiest to theme. Heavy, because its code blocks pull in shiki with every language.
- **AgentPrism**: the only real trace tree, with a strong details panel. But it reads as a debugging tool, needs Tailwind 3, and has no decisions or live status.
- **tool-ui**: good status steps and a nice "answered" receipt. But it's built for one tool result inside a chat, and it fought the layout the most.

## Per library

### AgentPrism (Evil Martians)
- **Pros:** OTel spans in, a full tree out (tokens, cost, time, timeline bars, error callout) through its own adapter. The details panel (input/output, attributes, raw) comes free. Strict types out of the box.
- **Cons:** covers about half the demo. No decisions, no actions. Statuses are only success/error/warning/pending: "still running" shows up as a yellow warning unless you fix the data after converting it. Needs **Tailwind 3** with preflight. Its theme only follows the OS, not a `data-theme` toggle. Default rows break Open AFlow's rules (dot on the right, titles cut at 128 px, uppercase `AGENT INVOCATION` badges).
- **Biggest time sink:** the page was 461 px wide at a 390 px screen (`1fr` grid in `SpanCard`).

### tool-ui (assistant-ui)
- **Pros:** works without the assistant-ui runtime. Zod schemas on every component caught a real replay bug. ProgressTracker's four states fit agents and tool calls. The ApprovalCard receipt does "confirm and fold away" by itself.
- **Cons:** ApprovalCard is approve/deny only. The receipt said "Approved" for any answer, and **Escape picks the second answer**. `import { icons } from "lucide-react"` pulled in every icon (+174 KB gzip until trimmed). CodeBlock loads shiki to show two lines of plain text. Terminal crashed under Vite 8 (a CJS import). No generic tool-call card, no tree, no figures slot.
- **Biggest time sink:** fitting the pieces into the page (container query breakpoints, focus after answering, wrapping on mobile).

### AI Elements (Vercel)
- **Pros:** Plan, Agent, Task, Tool and Confirmation match the product's nouns. Tool states map 1:1 to running/success/error. Plain shadcn colours, so one `@theme` block made it look like Open AFlow.
- **Cons:** every Tool goes through CodeBlock, so shiki ships 298 JS files and a 600 KB main chunk. `Agent` shows an agent's *definition*, not a running agent: no status, time, tokens or cost. `AgentHeader` drops its children. `Confirmation` uses `role="alert"`, so each new decision is read out as an alert. `content-visibility: auto` leaves code blocks blank in screenshots and print. `npm i` gets newer major versions than the library was tested with, so you must pin them.
- **Biggest time sink:** visual bugs only seen in screenshots (blank code blocks, squashed header on mobile, 7 px sideways scroll).

### affectUI (free items)
- **Pros:** one file per item, no Tailwind, Radix or icon package. 7 files copied, zero edits, strict types passed on the first try. Tool Call Card and Decision Inbox props match `run.ts` almost field for field. Best a11y score, smallest bundle.
- **Cons:** Agent Tree and Trace Waterfall are Pro, so the agent list, the part that sells Open AFlow, is hand-made. Dark mode follows `.dark` or `data-theme` only, never the OS. Each item has its own CSS variable namespace (~20 overrides each) and hard-codes Inter. Narrow slots: `Button` can't be a link, `CopyButton` isn't exported, the inbox's copy text is fixed. Some fixes needed internal class names, which aren't a stable API.
- **Note:** its lower SEO score (83) is because the page left out `<meta name="description">`. That's the agent's fault, not the library's.

## What every library was missing

All four agents hand-rolled the same things. This is the clearest signal in the test:

1. **Live status of an agent** (running / blocked / needs you / done / idle) as a dot in a fixed column. No library has a "blocked" or "needs you" state.
2. **Figures after the title** (time, tokens, cost). Only AgentPrism has token and cost badges, and they needed fixing.
3. **A list of decisions with two equal answers.** Everyone models it as approve/deny, which breaks the wording, Escape and screen reader behaviour.
4. **Replay or live updates over time.** All four are pure views. Every agent wrote its own clock.
5. **Theme that follows the OS and a manual toggle at the same time.** Every library got this wrong in a different way.

## What to improve

### On the variants (before you pick one)
- **affectUI:** add the meta description. The hero has too much empty space above the demo. The agent list is flat and long; nest the engineers under the wave.
- **AgentPrism:** drop or soften the uppercase category badges. Show a "Blocked" word next to the red dot. Fix the two a11y fails.
- **AI Elements:** swap the CodeBlock in Tool for a plain `<pre>` (or shiki core with just `json` and `bash`). That removes about 100 KB gzip and 290 files. Center the hero like the others, or keep left on purpose.
- **tool-ui:** same CodeBlock fix. Tool calls are listed apart from their agents, so you can't see who ran what. Put the primary answer first (it's on the right now). Fix the `role` a11y fail.

### For our own library
- **Copy affectUI's packaging:** one file, no Tailwind, React 19 `<style href precedence>`. It won on every cost number, and its copied files needed zero edits.
- **Copy AgentPrism's data path:** an adapter from OTel GenAI spans, and AG-UI events next. Add a real "running" status, which OTel lacks.
- **Build the five missing pieces above first.** Every library left them to the user, and they're the core of a pod run view.
- **Never ship shiki by default.** Two of four libraries had 11 MB builds because of it.
- **One shared theme layer**, not one namespace per component. Follow `prefers-color-scheme` *and* `data-theme` / `.dark` out of the box.
- **Decisions are not approvals.** Two equal answers, no Escape shortcut to an answer, `role="status"` not `alert`, and focus moves to the next decision after answering.

## Limits of this test
- **One run per library, by one agent.** Treat the build times as rough sizes of the gaps, not exact numbers. The agents also read the same brief, so learning time for a human would be higher everywhere.
- **The shadcn registries were blocked here**, so all four copied source from GitHub. The `npx shadcn add` path wasn't tested. It would likely help AI Elements and tool-ui more than the others.
- **Lighthouse ran in a shared container.** Use the scores to compare the four with each other, not as real-world numbers.
- **The libraries change fast.** Versions as of 2026-11-09: AgentPrism data/types 1.0.0, AI Elements and tool-ui from their main branches, affectUI from its main branch.

## Run one yourself

```bash
cd experiments/openaflow-homepage/variants/affectui
```

```bash
npm ci && npm run build && npx vite preview --port 5104
```

Ports: agent-prism 5101, tool-ui 5102, ai-elements 5103, affectui 5104. Use `node scripts/measure.mjs` from `experiments/openaflow-homepage` to measure again.
