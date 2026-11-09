# AgentPrism variant: notes

## Summary

- AgentPrism's `TreeView` + `DetailsView` render the run's agents and tool calls well once `run.ts` is turned into an OTLP document; the official `openTelemetrySpanAdapter` does the conversion.
- It is a trace viewer, not an agent-action kit: decisions, the run header, the replay and the rest of the page are hand-rolled.
- Theming onto Open AFlow was a mechanical token remap (83 OKLCH tokens), but four copied components had to be edited to meet Open AFlow's rules and to fit a 390 px screen.

## What the library covered

From the library (copied `packages/ui/src/components` as the readme says, plus npm `@evilmartians/agent-prism-data` / `-types` 1.0.0):

- **Run tree**: `TreeView` → `SpanCard` rows for orchestrator → planner / three engineers → tool calls, with connectors, collapse/expand, status dot, category badge, `TokensBadge`, `PriceBadge`, the timeline bar and the duration. It supports keyboard selection (`role="tree"`, Enter/Space).
- **Details**: `DetailsView` for the selected span, with In/Out (JSON/Plain input, output), Attributes and RAW tabs. The failed `Bash` call shows the library's own error callout (from the `error.message` attribute plus OTel status code 2). It opens on that call by default.
- **Data**: `openTelemetrySpanAdapter.convertRawDocumentsToSpans`, plus `flattenSpans`, `formatDuration`, `getTotalTokens`, `getTotalCost`. The adapter derives category from `gen_ai.operation.name` (`invoke_agent` / `execute_tool`), tokens/cost from `gen_ai.usage.total_tokens` / `gen_ai.usage.cost`, input and output from `input.value` / `output.value`.
- **Copy button** in Get started: the library's `CopyButton`.

Hand-rolled, and why:

- **Decisions (all three, with two answers each)**: AgentPrism has no approval, question or action component. They are plain `<button>`s. Clicking one shows "Done: Merge" (role=status) and after 1.4 s folds the card away (grid-rows 0fr transition, instant under reduced motion), then moves focus to the list. Each decision appears in the replay once the event it is about has happened.
- **Run header** (repo, plan, stage, elapsed, total tokens, cost, Replay): `TraceList` / `TraceViewer` do have a trace header, but they are built for choosing among many traces, and they bring a resizable 3-pane layout. For one run on a homepage I composed `TreeView` + `DetailsView` myself.
- **Replay**: `runToOtlp(at)` rebuilds the OTLP document for time `at` (spans not started yet are left out, unfinished spans have no status and end at `at`, tokens/cost grow in proportion). A rAF loop runs `at` from 0 to 19m 24s over 6 s. The library just re-renders new spans; it has no live/streaming notion.
- **"running" status**: OTLP has no "in progress" status. The adapter maps an unset status to `warning` (yellow), so I post-process those spans to AgentPrism's own `pending` status, which I mapped to Open AFlow's `--running` blue. "blocked" has no equivalent; the blocked engineer is an `error` span (red dot), which is Open AFlow's blocked colour anyway.
- **Agent avatar**: set through `metadata.brand = { type: "anthropic" }` after conversion; the adapter never fills `metadata`.

Edits to the copied components (the copy-and-own model allows this, but upgrading means re-applying them):

1. `SpanCard.tsx`: the status dot moved from the far right to the first position, in a fixed 16 px column (Open AFlow rule). The title's `max-w-32` (128 px) truncation was replaced with `max-w-[calc(100%-2.75rem)]`; "Bash · Ran the notification tests" was cut to "Bash · Ran th…". `CONTENT_BASE_WIDTH` went from 320 to 440.
2. `SpanCard.tsx`: the grid template `Npx 1fr` became `Npx minmax(0, 1fr)`. With `1fr`, the nowrap title's min-content pushed the page to 461 px wide at a 390 px viewport.
3. `TokensBadge.tsx`: the raw `48210` became `48.2k tokens`. `PriceBadge.tsx`: `$ 0.92` became `$0.92`.
4. `SpanCardTimeline.tsx`: added `minWidth: 2` to the bar. A 1 s tool call on a 19 min run is 0.1 % wide and was invisible.

## Pros

- The real data path: an OTLP/GenAI-conventions document goes in and you get a tree with tokens, cost, durations, a timeline and an error callout. If pod ever emits OTel spans, Open AFlow could render them with no mapping code.
- `DetailsView` is substantial for free: JSON/plain input toggle, the error callout for failed tool calls, Attributes and RAW tabs, and copy buttons. Hand-rolling that would take far longer than the rest of the demo.
- The components are copied source, so every mismatch could be fixed in place; nothing was locked.
- Strict types. The copied components plus the npm 1.0.0 packages typechecked under `strict` + `noUncheckedIndexedAccess` on the first `tsc` run, with no shims.
- Theming goes through one set of CSS variables (`--agentprism-*`) used everywhere through Tailwind colour names. Remapping it was a single generated file.

## Cons

- It covers half the demo. There is nothing for decisions, approvals, actions or a live run state. The span status is only `success | error | warning | pending`; "blocked" and "needs-you" don't exist.
- The OTel adapter can't express "still running": an unset status becomes `warning`. You must post-process the converted spans or patch the adapter.
- Default row layout breaks Open AFlow rules: the status dot sits at the far right after the duration, titles truncate at 128 px, and category badges are uppercase ("AGENT INVOCATION", "TOOL"). I left the uppercase badges because changing them means editing `SpanBadge` for little gain.
- It needs **Tailwind CSS 3** (3.4.17, a JS config with `agentPrismTailwindColors`). Tailwind v4 is not supported, and preflight has to stay on, because the components assume its resets.
- The theme can't follow `data-theme`. The shipped `theme.css` switches only on `@media (prefers-color-scheme)`, nested inside `:root`. A site with a manual toggle can't use it as is, so I replaced it.
- The tree's fixed pixel content widths (`CONTENT_BASE_WIDTH`, a 20 px connector per level) are tuned for a wide debug pane. On mobile each row wraps to two or three lines. It works, but it is dense.

## Friction log

- `npm i -D @vitejs/plugin-react` took the latest v6, which wants Vite 8 (ERESOLVE). Pinning `@vitejs/plugin-react@^5` fixed it. About 1 min.
- `theme.css` has no `data-theme` hook and stores colours as OKLCH triplets (`L C H`), while Open AFlow's tokens are hex. I wrote `scripts/gen-theme.mjs`, which converts hex to OKLCH and emits the light, dark-media and `[data-theme=dark]` blocks for all 83 tokens. About 2 min.
- The status dot was on the right and titles truncated at 128 px, so I patched `SpanCard`. About 1 min.
- At 390 px the page was 461 px wide. Cause 1: the `SpanCard` grid `1fr` column (fixed with `minmax(0,1fr)`). Cause 2: my own install-steps grid had the same issue with the `<pre>` (fixed the same way). About 2 min.
- The copy button overlapped long code lines on mobile, so the code block became a flex row. Under 1 min.
- The run header totals stayed at the final value during replay; they are now summed from the current spans. Under 1 min.
- Not the library: the session scratchpad is shared with the other variant agents, and my `wide.cjs` helper there was overwritten by another agent's script (it measured port 5103). I moved my helper scripts into `variants/agent-prism/scripts/`. About 1 min.

## Theming

Moderate, mostly mechanical. All colour goes through `--agentprism-*` variables, so I skipped the library `theme.css` and generated `src/agentprism-openaflow.css` from `shared/tokens.css`:

- background/foreground/border map to `--bg`/`--fg`/`--border`.
- secondary/muted map to `--hover`.
- success/error/warning/pending map to `--ready`/`--blocked`/`--needs-you`/`--running`, used only for dots.
- Every category colour (purple LLM, indigo agent, orange tool, and so on) is neutral grey: badges are `--hover`/`--muted`, timeline bars are `--muted` (agents) and `--faint` (tools). The default demo is quite colourful, so this is the biggest visual change.

Fonts: Geist was applied by setting `font-family` on the tree. The parts I could not reach through tokens needed the component edits listed above: dot position, title width, badge text, the 2 px timeline minimum. Tailwind preflight stays on, so my page CSS sets heading sizes itself.

## Dependencies added

- Runtime: `react@19`, `react-dom@19`, `@evilmartians/agent-prism-data@1.0.0`, `@evilmartians/agent-prism-types@1.0.0`, `@radix-ui/react-collapsible`, `@radix-ui/react-tabs`, `classnames@2.5.1`, `lucide-react@^0.534` (also used for the page's icons), `react-json-pretty`, `react-resizable-panels@^3`. The last one is only used by `TraceViewer`, which I don't render, but it is needed for the copied folder to typecheck.
- Dev: `vite@7`, `@vitejs/plugin-react@5`, `typescript@~5.8`, `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss@3.4.17`, `postcss`, `autoprefixer`.
- Peer requirements: React 19+, Tailwind CSS **3** (not 4) with preflight, and a TS setup that accepts the copied files under `strict`.
- Size: JS bundle 338 kB (108 kB gzip), CSS 50 kB (8.6 kB gzip).

## Fit for Open AFlow

**3 / 5.**

- **Homepage**: usable but not my first pick. The tree reads as "trace debugger" more than "your pod run at a glance". The uppercase "AGENT INVOCATION" badges, timeline bars and RAW tabs are developer-tool vocabulary, and the part that sells Open AFlow (it tells you what needs you, and you act from the app) is entirely hand-rolled.
- **App itself**: a "run inspector" view where a user drills into one agent's tool calls, inputs, outputs and errors. There the `DetailsView` and the OTel data path are real value. But it doesn't fit the main board: no live statuses, no blocked/needs-you, no actions. Also, Open AFlow's plain-CSS token system would have to take on Tailwind 3 just for these components.
