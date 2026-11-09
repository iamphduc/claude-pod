# AI Elements (Vercel) variant

## Summary

- The whole demo is built from AI Elements parts: Plan (the run), Agent (each agent), Task (the wave tree), Tool (tool calls), Confirmation (decisions), CodeBlock (install step). Only the status dot, figures line, "Needs you" panel and replay clock are hand-rolled.
- About 11 minutes by the timing log (23:18:02Z to 23:28:44Z, plus writing these notes). Build and typecheck passed first try; all the time in verify went to visual bugs found in screenshots.
- It looks like Open AFlow with little effort, because AI Elements is plain shadcn/Tailwind with neutral defaults. The costs are shiki (11 MB `dist`, 332 files) and having to edit the copied source in four places.

## What the library covered

From the library (copied from `packages/elements/src` into `src/components/ai-elements/`):

- **Plan / PlanHeader / PlanTitle / PlanDescription / PlanAction / PlanTrigger / PlanContent**: the run card. `isStreaming` shows the title and description with the Shimmer while the replay runs. It also lets you fold the whole run.
- **Agent / AgentHeader / AgentContent**: one card per agent (orchestrator, sprint planner, three engineers), with the model as the library's Badge.
- **Task / TaskTrigger / TaskContent**: the "Sprint 2 · Wave 1 · 4 agents" tree under the orchestrator (fold with a left rule).
- **Tool / ToolHeader / ToolContent / ToolInput / ToolOutput**: every tool call. `run.ts` tool calls are mapped to AI SDK `DynamicToolUIPart` (`input-available` = running, `output-available` = success, `output-error` = failed). The failed Bash opens by default to show its error.
- **Confirmation / ConfirmationTitle / ConfirmationRequest / ConfirmationAccepted / ConfirmationRejected / ConfirmationActions / ConfirmationAction**: the three decisions. A click moves the part from `approval-requested` to `approval-responded`. Option 1 maps to `approved: true` and option 2 to `approved: false`. Both then fold into one line showing the chosen answer, and focus moves to that line.
- **CodeBlock / CodeBlockHeader / CodeBlockCopyButton**: the copyable install commands (and, inside ToolInput/ToolOutput, the JSON args and results).
- **Shimmer**: through Plan.

Hand-rolled, and why:

- **Status dot + word in a fixed 72 px column** (`StatusCell`). AI Elements has no agent status at all. `Agent` has no status prop, and the only status visual is Tool's state badge (icon + label pill).
- **Figures line** (duration · tokens · cost, mono, inline after the title). No piece exists for usage; `context.tsx` is a token-window meter for one model, not per-agent figures.
- **"Needs you" panel** with a count, around the Confirmations. Confirmation is just one Alert; there is no list or inbox piece. `queue.tsx` is for queued chat messages and todos, not decisions.
- **Replay clock** (`useReplay`: requestAnimationFrame, 9 s, skipped under reduced motion) and the mapping in `src/demo/mapRun.ts`.
- **Run summary row** (total time, tokens, cost) inside PlanContent, since PlanDescription only takes a `string`.
- The rest of the page (hero, features, privacy, steps, footer, theme toggle) uses shadcn Button only; AI Elements has nothing for marketing sections, and isn't meant to.

Edits I made to the copied library source (the shadcn "you own the code" model makes this normal, but each one is a fork to maintain):

1. `agent.tsx` `AgentHeader`: it ignores `children` (it spreads props but writes its own children) and always draws a `BotIcon` first. I added a `leading` slot (the status column goes there, so the dot comes first) and render `children` after the model badge (figures). I also added `flex-wrap min-w-0` for 390 px.
2. `tool.tsx` status icons are hard-coded `text-green-600 / text-red-600 / text-yellow-600 / text-blue-600`. I swapped them for the Open AFlow status tokens. The header row got `flex-wrap min-w-0` so long titles don't overflow on mobile.
3. `tool.tsx` `ToolOutput`: the error text had no padding, and it also rendered an empty `<div>` for a missing output. I added padding and skip the empty output.
4. `button.tsx` (shadcn): I removed `shadow-xs` from the outline variant (Open AFlow allows only the menu shadow).

## Pros

- **The parts match the product's nouns.** Plan, Agent, Task, Tool and Confirmation cover the run, its agents, the wave tree, tool calls and decisions with no wrapper library. The tool-state model (`input-available` / `output-available` / `output-error`) maps 1:1 onto running / success / error from `run.ts`.
- **Composable and small.** Each part is a 70–170 line file of Tailwind + Radix Collapsible. Reading all the ones I used took minutes, and changing one is a plain edit, not a fight with props.
- **Theming is almost free.** The defaults are neutral shadcn (greys, `border`, `muted`). Mapping its colour names onto `tokens.css` in one `@theme` block was enough to make it read as Open AFlow in light and dark.
- **Confirmation has the right state machine** (request, then accepted or rejected) and hides its own actions once answered, so "click to confirm and fold away" needed no extra state beyond the answer.
- **The copy button and dual-theme syntax highlighting come built in** (CodeBlockCopyButton, shiki github-light/dark through the `dark:` variant).

## Cons

- **shiki bundles every language.** `CodeBlock` imports `createHighlighter` from `shiki`, so Vite emits 332 chunks and an 11 MB `dist` (most lazy-loaded, never fetched). The main JS is 603 kB (192 kB gzip) for one landing page, and Vite prints the >500 kB chunk warning. Tool and ToolInput/ToolOutput always go through CodeBlock, so even showing `{"command": ...}` pulls in shiki. You can't opt out without editing `tool.tsx`.
- **No status or usage concept for agents.** `Agent` was built to show an agent *definition* (instructions, tool schemas, output schema: `AgentTool` takes an AI SDK `Tool` schema, not a call). It is not built to show a running agent. Status, time, tokens and cost all had to be hand-rolled. AgentHeader could not even take children without a source edit.
- **Confirmation assumes approve/reject.** Two neutral answers ("Mock the API" / "Skip the check", "Continue" / "Auto-continue") have to be squeezed into `approved: true/false`, and Rejected/Accepted are separate slots, so I render the same folded line in both. It is also an `Alert` with `role="alert"`, so each decision that appears during the replay is announced as an alert.
- **Small layout bugs in the defaults.** `PlanHeader` adds `flex` on top of CardHeader's grid, so title, description and actions sit in one row and squash on mobile (fixed with `className="grid"`). CodeBlockContainer sets `content-visibility: auto` inline, so code is blank in full-page screenshots and print until scrolled into view (fixed with an `!important` CSS rule). Tool has a built-in `mb-4` you must cancel inside lists. Task's default trigger is a `div` made clickable via `asChild`, with no button role or keyboard support; I passed a real `<button>`.
- **Version drift.** Plain `npm i` gives shiki 4, ai 7, lucide 1.x and TypeScript 7, all newer than the library's tested versions (shiki 3.22, ai 6, lucide 0.577). I pinned to the library's versions rather than find out what breaks.

## Friction log

- Latest-version installs (shiki 4, ai 7, lucide 1.x, TS 7) didn't match the library's package.json. I pinned them to the library versions. ~1 min.
- Copied files import `@repo/shadcn-ui/...`. I rewrote that to `@/` with one `sed` and added the `@` alias in Vite and tsconfig. <1 min.
- Name clash: `tokens.css` owns `--muted` (a text colour) and `--border`, and shadcn's convention also uses `--muted` (a fill). So I skipped shadcn's intermediate `--background/--muted` variables and pointed Tailwind's `--color-*` straight at the Open AFlow tokens. ~1 min of thought, no bugs.
- The `dark:` variant had to follow the OS *and* `data-theme`. I wrote a block `@custom-variant dark` with a media query plus `[data-theme=dark]` (the library assumes a `.dark` class). ~1 min.
- AgentHeader drops children and forces a bot icon. Source edit. ~1 min.
- Blank code blocks in screenshots: `content-visibility: auto` on CodeBlockContainer. Found by probing `innerText` with Playwright; fixed with CSS. ~2 min.
- 7 px horizontal overflow at 390 px: the demo grid's implicit column took the content's min width. Fixed with `grid-cols-[minmax(0,1fr)]`. ~1 min.
- PlanHeader `flex` squashing the title on mobile. Fixed with `className="grid"`. ~1 min.
- The copy button overlapped long commands on mobile when absolutely positioned. Moved it into the library's `CodeBlockHeader` / `CodeBlockActions` instead. ~1 min.
- A shell heredoc that wrote two files was blocked by the sandbox's command checker (a tooling issue, not the library). Rewrote with the file tool. ~1 min.

## Theming

Easy. Every colour is a shadcn semantic class (`bg-muted`, `text-muted-foreground`, `border`, `bg-primary`), so one `@theme` block mapping about 18 names to `tokens.css` re-skinned everything. The exceptions were the hard-coded Tailwind palette colours in `tool.tsx`'s status icons (green/red/yellow/blue-600), which needed a source edit, and the `dark:` variant. Radius: Tailwind's `--radius-sm/md/lg` are emitted in a layer, so the unlayered values in `tokens.css` (6/8/12 px) win, which matches Open AFlow. Shadows: I removed `shadow-xs` from the outline Button, and Plan already passes `shadow-none` to its Card. Geist comes from `@fontsource/geist`. The library's look (thin borders, small type, muted greys) is already close to Open AFlow's calm black-and-white, so nothing fought the design. Spacing uses Tailwind's 4 px scale. Some library defaults are `py-0.5`/`gap-1.5` (2 px / 6 px) inside badges, which I left alone.

## Dependencies added

Runtime: `react@19`, `react-dom@19`, `radix-ui` (umbrella package; Collapsible, Accordion, Select, Slot), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react@0.577`, `motion` (Shimmer), `shiki@3.22` (CodeBlock), `@fontsource/geist`, `@fontsource/geist-mono`.

Dev: `vite`, `@vitejs/plugin-react`, `typescript@5.9`, `@types/react`, `@types/react-dom`, `@types/node`, `tailwindcss@4`, `@tailwindcss/vite`, `tw-animate-css` (the `animate-in/out` classes on Tool/Task content), and `ai@6` **for types only** (`DynamicToolUIPart`, `ToolUIPart`). Nothing from `ai` lands in the bundle.

Peers: React 19, Tailwind v4, shadcn base pieces (button, badge, card, alert, collapsible, accordion, select, scroll-area: `select` only because CodeBlock imports its language selector, and `accordion` only because agent.tsx imports it for `AgentTools`). `node_modules` is 242 MB.

## Fit for Open AFlow

**4 / 5.** The parts map onto Open AFlow's run, agents, tool calls and decisions better than I expected. They re-skin to the Open AFlow tokens in one CSS block, and owning the source means every gap was a 2-line edit. It loses a point for shiki's weight and because it has no concept of agent status or usage: the two things Open AFlow is most about (status dots, tokens/cost) are exactly what I had to hand-roll.

- **Homepage:** yes, but I would swap ToolInput/ToolOutput's CodeBlock for a plain `<pre>`, or load shiki's fine-grained core with just `json` and `bash`, to cut the 600 kB bundle.
- **The app itself:** a reasonable base for the tool-call and decision views (Tool, Confirmation, CodeBlock), copied in and adapted. The run and agent views would still be Open AFlow's own components, since `Agent` is a definition viewer, not a live-agent row.
