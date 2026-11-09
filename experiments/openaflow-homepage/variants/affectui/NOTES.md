# affectUI variant: notes

## Summary

- The tool calls and the three decisions come from affectUI's free items. Its Tool Call Card and Decision Inbox fit this run almost one to one. The agent run list is hand-rolled because Agent Tree / Trace Waterfall are Pro.
- No Tailwind, no shadcn, no Radix: each item is one `.tsx` with its CSS injected through React 19 `<style href precedence>`. The only deps are React 19 and Vite/TS.
- `npm run build` and `npx tsc --noEmit` passed on the first try (TS 7.0.2, strict, `noUnusedLocals`), and the preview showed no console errors. `timing.tsv` totals about 6 min from the clock readings. That is as `date -u` returned it; the steps really went that fast.

## What the library covered

From affectUI (copied verbatim into `src/affectui/`, not edited):

- **`tool-call-card-clean.tsx` → `ToolCallCard`**: all 7 tool calls. `run.ts`'s `ToolCall` maps almost field for field: `name`, `summary`, `status` (same three values), `args`, `result`, `error`, and `duration = end - start`. For the call that is still running, `startedAt` is set to the wall clock minus its elapsed run time, so the live timer reads a real figure. The failed call opens by default (`defaultOpen`) and shows the error panel. There is no `onRetry`, since nothing runs behind it. I passed a tool icon per tool name through the `icon` slot.
- **`decision-inbox-clean.tsx` → `DecisionInbox`**: all three decisions. `options[0]/[1]` → `primary`/`secondary`. Clicking one confirms it, folds the row away and lowers the count ("3 need your input" → "All caught up"), all inside the component with no backend. During the replay, decisions are added to the `decisions` prop as their agent stops. The component takes new ids without trouble (it falls back to `{open:true}`). I remount it with `key` on replay so answered rows come back.
- **`number-ticker.tsx`**: the run's total tokens and cost in the window bar. They roll during the replay.
- **`shimmer-loader.tsx` → `ShimmerText`**: the summary of the running tool call.
- **`button-clean.tsx` → `Button`**: the Replay button (its `loading` shimmer is used while it replays), the header theme toggle (icon-only ghost) and the copy button on the install code block.
- **`grid-background.tsx`**: the faint drifting grid behind the hero.
- **`text-reveal.tsx`**: the hero tagline (`as="h1"`). Screen readers get the whole sentence.

Hand-rolled, and why:

- **Agent run list** (orchestrator → planner + three engineers, with a status dot and word in a fixed 88 px column, then the model tag, time, tokens and cost inline after the title). affectUI's Agent Tree, Agent Inbox and Trace Waterfall are Pro and not in the repo. I did not try to copy their look. Nothing free shows an agent with status, time and cost. Progress Tracker is an onboarding checklist with done/not-done only, and it has no running, blocked or figures.
- **Replay clock**: an 8 s timer that walks the sim time 0 → 1,164,000 ms and works out each agent's and tool's status from `run.ts` (blocked turns on after its failed call ends). Tokens and cost scale linearly. affectUI has no run/timeline model; the items are pure views.
- **Link buttons** (Download, GitHub): affectUI's `Button` is `ComponentPropsWithRef<"button">` only. It has no `href`, `asChild` or polymorphic `as`, so the CTAs are hand-rolled `<a>` elements styled with our tokens.
- **Code block for install step 2**: Tool Call Card has a nice internal `CopyButton` and code panel, but neither is exported. I used a plain `<pre>` plus the library `Button` for copy.
- Header, features, privacy, steps and footer are plain CSS. Nothing in the free set is a feature grid or a steps list (Tips Panel needs one action per tip).
- **Not used**: `agent-team` illustration. It needs three avatar photo URLs and its tools are a fixed sales-logo enum (`linkedin | hubspot | slack | gmail | salesforce`). It would have meant inventing content, so I left it out. `thinking-loader` would only repeat what the running tool card already shows, and its default phases ("Searching the web"…) are chat copy.

## Pros

- **The data shapes match agent data closely.** `ToolCallCard`'s props are nearly `run.ts`'s `ToolCall` (the same `"running" | "success" | "error"` status, raw `args`/`result` objects pretty-printed and highlighted). `DecisionInbox` is literally "title, detail, two answers, confirm and fold away", which is exactly the spec. I needed almost no mapping code.
- **Zero setup cost.** One file per item, no Tailwind, no shadcn `cn()`/`utils`, no Radix, no icon package. I copied 7 files, they type-checked under strict TS 7 with no changes, and the bundle is 88 kB gzipped including React.
- **Themeable through CSS variables.** Every colour, shadow and font is a `--ui-*` variable with a comment saying "override them on .ui-x", so I mapped them to Open AFlow tokens without editing the source.
- Real `<button>`s with `aria-expanded`/`aria-controls`, `inert` on closed bodies, polite live regions, visible `:focus-visible` rings, `prefers-reduced-motion` handled in every item I used. Container queries on the cards made the 390 px layout work without effort.
- The small touches are well made: the error card opens itself, the running timer ticks, and Decision Inbox's head flips to "All caught up".

## Cons

- **The pieces that matter most for this product are paid.** For a "see every agent of a run" demo, the free set covers the leaves (tool calls, decisions) but not the spine (agent tree with status, time, cost). I hand-rolled that part, and it is the most product-specific part of the page.
- **Dark mode does not follow the OS.** Each item switches only on `.dark` or `[data-theme="dark"]` on an ancestor, never on `prefers-color-scheme`. With "System" on a dark OS, the stock items would render white cards on a black page. Mapping every `--ui-*` variable to our tokens (which do follow the media query) fixed it, but it means overriding about 20 variables per item.
- **Each item has its own variable namespace and font stack** (`--ui-tclc-*`, `--ui-dic-*`, `--ui-btnc-*`; all hard-code `"Inter"`). There is no shared theme layer, so the token mapping repeats for every item (about 90 lines of CSS for 4 items).
- Content slots are narrow. `Decision.title` is a `string`, so there is no way to add the agent or a kind tag to a decision row. `Button` cannot be a link. `CopyButton` and the code panel inside Tool Call Card are not exported. Decision Inbox hard-codes "need your input", "All caught up" and the empty text with no props for them.
- The library's own look sometimes clashes with DESIGN.md: hairline shadows instead of borders, a blue accent check for "done", green answer text, red "Failed" text. Each needed a targeted override of internal class names (`.ui-tclc__ok circle`, `.ui-dic__done`), and those class names are not a public API.

## Friction log

- `tsc` could not resolve `import "./styles.css"` under `types: []` → added `src/vite-env.d.ts` with `/// <reference types="vite/client" />`. About 0.5 min.
- Library dark mode does not follow the OS (see Cons) → mapped all `--ui-*` vars to our tokens under `.oaf .ui-x`. The extra class is needed to beat the items' `:where(.dark,[data-theme=dark]) .ui-x` rule (0,1,0) and their base rule. About 1 min, because I spotted it while reading the source. Otherwise it would only have shown up in the dark-OS screenshot.
- Decision Inbox has `max-width: 440px` baked in → overrode `max-width: none` so it fills its column. Under 0.5 min.
- Wanted the library `Button` for the hero CTAs, but it is button-only → hand-rolled `.lbtn` links. Under 0.5 min.
- Status dots did not line up between the orchestrator row and its nested children (DESIGN.md wants one rail) → padded the top-level row so both rails meet. This was my own layout, not the library. About 1 min.
- `habit-tracker` in mono at weight 600 was faux-bolded (Geist Mono ships 400/500 only) → 500. Under 0.5 min.
- No problem with React 19 `<style href precedence>` hoisting or with the items under StrictMode.

## Theming

Moderate, and all done without touching library source. The tokens map cleanly: card → `--bg`, ink → `--fg`, text/muted → `--muted`, line → `--border`, solid button → `--primary-bg`/`--primary-fg`, accent → `--running`, alert → `--needs-you`, ok → `--ready`, red → `--danger`, mono → `--mono`, font → `--font`. I replaced hairline-plus-lift shadows with a `0 0 0 1px var(--border)` ring, because Open AFlow keeps its one shadow for the menu. I muted the JSON highlight colours to fg/muted to keep it black and white. Extra overrides on internal class names: green "done" check (instead of the blue accent), and black answer text with only the mark coloured. The clean style (white, quiet grays, 13 px) was already close to Open AFlow's look, which helped a lot. The work is mostly repetitive: about 20 variables × 4 items, because the items share no theme. The OS-dark gap is the one real trap.

## Dependencies added

- `react@^19.3.1`, `react-dom@^19.3.1` (affectUI requires React 19: it relies on `<style href precedence>` hoisting and `ref` as a prop).
- Dev: `vite@^8.3.7`, `@vitejs/plugin-react@^6.3.0`, `typescript@^7.0.2`, `@types/react`, `@types/react-dom`.
- No Tailwind, shadcn, Radix, animation or icon library. Geist woff2 files are copied from Open AFlow's `packages/web/public/fonts` (OFL). affectUI files are copied by hand from `/home/user/vendor/affectui` (shadcn registry blocked).

## Fit for Open AFlow

**3.5 / 5.** For the homepage: yes, I would pick it. It is cheap to add, it does not drag in Tailwind or Radix, and Tool Call Card plus Decision Inbox say "agents need you" better than a hand-made mock would. For the app itself: only partly. Decision Inbox and Tool Call Card could drop into the app's run view after the same token mapping. But the app's core (run tree, wave board, per-agent status and cost) is exactly what is behind the Pro paywall. The per-item variable namespaces and the non-public class names I had to override would turn into upkeep across releases ("files are synced from the affectUI source on every release"). I would buy Pro and look at Agent Tree before committing the app to it.
