import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Dispatch, TreeLine } from '../types'
import { buildTree, changedFeatures, fit, foldKey, GLYPH, header, isFoldable, latestHalt, mainCheckout, milestones, parseDispatch, parseQueue, parsePlan, parseSprint, prefixes, pullOf, questionGlyph, snapshot, turnTokens, visibleLines } from './model'
import type { FeatureCheck, PlanDoc, SprintDoc } from './model'

const PANE = 'pod-flow'
const REFRESH_MS = 3000
const RUN_SKILL = /(^|:)(autopilot|ship)$/

const isActive = atom({ plugin: 'pod-flow', key: 'isActive' } as const, false)
const lines = atom({ plugin: 'pod-flow', key: 'lines' } as const, [] as TreeLine[])
const expanded = atom({ plugin: 'pod-flow', key: 'expanded' } as const, [] as string[])
const spawns = atom({ plugin: 'pod-flow', key: 'spawns' } as const, {} as Record<string, Dispatch>)
const tokens = atom({ plugin: 'pod-flow', key: 'tokens' } as const, {} as Record<string, number>)
const planShown = atom({ plugin: 'pod-flow', key: 'planShown' } as const, '')
const NO_PLAN = 'No plan in pod-docs/plans yet.'
const emptyNote = atom({ plugin: 'pod-flow', key: 'emptyNote' } as const, NO_PLAN)
// The hand-back's checklist: what you ticked, and whether you pressed Run app. Yours alone, never in pod's docs.
const ticked = atom({ plugin: 'pod-flow', key: 'ticked' } as const, [] as string[])
const isAppRunning = atom({ plugin: 'pod-flow', key: 'isAppRunning' } as const, false)

const COLOR: Record<string, string | undefined> = {
  running: 'yellow',
  pushed: 'cyan',
  done: 'green',
  blocked: 'red',
}

type Dollar = EngineInterface

const PULL_CHECK_MS = 30_000

let isTimerOn = false
let refreshing: Promise<void> = Promise.resolve()
let told: Set<string> | undefined
const lastSeen: Record<string, number> = {}
const merged = new Set<number>()
const pullCheckedAt: Record<number, number> = {}
const checksOf: Record<number, FeatureCheck[]> = {}
const diffAskedAt: Record<number, number> = {}
// The latest `gh` calls a refresh started.
let ghWork: Promise<unknown> = Promise.resolve()
const GH_WAIT_MS = 5000

/** Reads the features the hand-back's PR added or changed, once per PR; a failed `gh` tries again after PULL_CHECK_MS. */
async function loadChecks($: Dollar, number: number, cwd: string) {
  const now = await $.clock.now()
  if (checksOf[number] || now - (diffAskedAt[number] ?? -Infinity) < PULL_CHECK_MS) return
  diffAskedAt[number] = now
  try {
    const { exitCode, stdout } = await $.process.run(['gh', 'pr', 'diff', String(number)], { cwd, timeoutMs: 20_000 })
    if (exitCode === 0) {
      checksOf[number] = changedFeatures(stdout)
      void refresh($)
    }
  } catch {
    // No checklist yet: the button still shows.
  }
}

/**
 * Asks GitHub whether the hand-back's PR has merged, at most once per PULL_CHECK_MS, off the refresh path.
 * No `gh`, no login or no network leaves the row as it is.
 */
async function checkPull($: Dollar, number: number, cwd: string) {
  const now = await $.clock.now()
  if (merged.has(number) || now - (pullCheckedAt[number] ?? -Infinity) < PULL_CHECK_MS) return
  pullCheckedAt[number] = now
  try {
    const { exitCode, stdout } = await $.process.run(['gh', 'pr', 'view', String(number), '--json', 'state', '--jq', '.state'], { cwd, timeoutMs: 10_000 })
    if (exitCode === 0 && stdout.trim() === 'MERGED') {
      merged.add(number)
      void refresh($)
    }
  } catch {
    // The row stays as it is.
  }
}

async function readText($: Dollar, path: string): Promise<string> {
  try {
    return String(await $.fs.read(path))
  } catch {
    return ''
  }
}

async function listNames($: Dollar, dir: string): Promise<{ name: string; mtimeMs: number }[]> {
  try {
    const entries = await $.fs.list(dir)
    return entries.filter((f: { kind: string; name: string }) => f.kind === 'file' && f.name.endsWith('.md'))
  } catch {
    return []
  }
}

/** pod's docs folder: `pod-docs/` since docs version 2; a project not upgraded yet keeps its plans in `docs/`. */
async function docsDir($: Dollar, root: string): Promise<string> {
  const current = `${root}/pod-docs`
  if ((await listNames($, `${current}/plans`)).length) return current
  return (await listNames($, `${root}/docs/plans`)).length ? `${root}/docs` : current
}

/**
 * The newest plan not archived; else the one this run showed, which the run's close-out archived.
 * With none to show, why: the pane says that in place of a tree.
 */
async function planToShow($: Dollar, docs: string): Promise<PlanDoc | string> {
  const files = (await listNames($, `${docs}/plans`)).sort((a, b) => b.mtimeMs - a.mtimeMs)
  if (files.length === 0) return NO_PLAN
  const shown = await read($, planShown)
  let finished: PlanDoc | undefined
  let hasEmpty = false
  for (const file of files) {
    const plan = parsePlan(await readText($, `${docs}/plans/${file.name}`), file.name.replace(/\.md$/, ''))
    if (plan.sprints.length === 0) {
      hasEmpty = true
      continue
    }
    if (plan.status !== 'archived') return plan
    if (plan.slug === shown) finished = plan
  }
  // A plan still being written is newer news than an archived one.
  return finished ?? (hasEmpty ? 'Plan has no sprints yet.' : 'Plan finished. Waiting for the next run.')
}

async function sprintDocs($: Dollar, dir: string, isArchived: boolean): Promise<SprintDoc[]> {
  const docs: SprintDoc[] = []
  for (const file of await listNames($, dir)) {
    const doc = parseSprint(await readText($, `${dir}/${file.name}`), isArchived, file.name.replace(/\.md$/, ''))
    if (doc) docs.push(doc)
  }
  return docs
}

/**
 * A narrow terminal, or another plugin's pane in front, hides the tree: tell the run's milestones in the transcript instead.
 * What was already true when this module loaded is not news, so the first tree only sets the baseline.
 */
async function logMilestones($: Dollar) {
  const all = await read($, lines)
  if (all.length === 0) return
  const found = milestones(all)
  if (!told) {
    told = new Set(found.keys())
    return
  }
  // Hidden also when placed but behind another pane (only one is shown at a time).
  const isVisible = (await $.ui.panes()).some(pane => pane.id === PANE && pane.isPlaced && pane.isShown)
  for (const [key, text] of found) {
    if (told.has(key)) continue
    told.add(key)
    if (!isVisible) $.ui.log(text)
  }
}

/** One refresh at a time, so a slow one never draws over a newer tree; a failed engine call keeps the last tree. */
async function refresh($: Dollar): Promise<void> {
  // Each call waits for the one before it and then runs on its own `$`: a hook's `$` is only good while that hook runs.
  const run = refreshing.then(async () => {
    try {
      await buildLines($)
      await logMilestones($)
    } catch {
      // The tree stays as it was; the next tick tries again.
    }
  })
  refreshing = run
  await run
}

async function buildLines($: Dollar) {
  // The main checkout's docs, even while the run works in one of its worktrees, whose copy of the board is old.
  const root = mainCheckout(await $.session.root())
  const docs = await docsDir($, root)
  const plan = await planToShow($, docs)
  if (typeof plan === 'string') {
    await update($, lines, () => [])
    if (plan !== (await read($, emptyNote))) await update($, emptyNote, () => plan)
    return
  }
  if (plan.slug !== (await read($, planShown))) await update($, planShown, () => plan.slug)
  const sprints = [
    ...(await sprintDocs($, `${docs}/sprints`, false)),
    ...(await sprintDocs($, `${docs}/sprints/archive`, true)),
  ].filter(s => s.plan === '' || s.plan === plan.slug)
  const live = (await $.agent.list()).map((a: { id: string; type: string; status: string }) => ({ id: a.id, type: a.type, status: a.status }))
  const queueText = await readText($, `${docs}/handoff-queue.md`)
  const halt = latestHalt(queueText, plan)
  const pull = halt && pullOf(halt.body)
  // Off the refresh path; kept so a text answer can wait for it.
  // A call already under way makes the next one return at once: chained, so the wait still covers it.
  if (pull) ghWork = Promise.all([ghWork, checkPull($, Number(pull[1]), root), loadChecks($, Number(pull[1]), root)])
  const queue = parseQueue(queueText)
  const known = await read($, spawns)
  const spent = await read($, tokens)
  const now = await $.clock.now()
  const checks = pull ? (checksOf[Number(pull[1])] ?? []) : []
  const app = { checks, ticked: await read($, ticked), isAppRunning: await read($, isAppRunning) }
  await update($, lines, () => buildTree({ plan, sprints, spawns: known, live, halt: halt?.body, haltType: halt?.type, now, lastSeen, queue, tokens: spent, merged: [...merged], ...app }))
}

/** Keeps the tree fresh: a timer, started once per load of this module. */
async function startRefreshing($: Dollar) {
  if (!isTimerOn) {
    isTimerOn = true
    $.clock.every(REFRESH_MS, () => void refresh($))
  }
  await refresh($)
}

async function activate($: Dollar) {
  await update($, isActive, () => true)
  // A new run starts from the docs: a plan the last run finished doesn't stand in for it.
  await update($, planShown, () => '')
  void $.ui.open({ id: PANE, title: 'pod flow' })
  await startRefreshing($)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pod-flow',
      description: 'Show the pod run tree (during /pod:autopilot or /pod:ship)',
      argumentHint: '[preview|text|reset]',
    })
    // A reload runs this again with the run's state kept: pick the refresh back up.
    if (await read($, isActive)) await startRefreshing($)
    return next(e)
  })

  on('skill.prompt', async ($, e, next) => {
    const result = await next(e)
    if (RUN_SKILL.test(e.skill)) await activate($)
    return result
  })

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    if ('agentId' in result && result.agentId && (await read($, isActive))) {
      const dispatch: Dispatch = {
        type: e.subagentType,
        description: e.description,
        startedAt: await $.clock.now(),
        runPlan: await read($, planShown),
        ...parseDispatch(e.prompt),
      }
      await update($, spawns, known => ({ ...known, [result.agentId as string]: dispatch }))
      void refresh($)
    }
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    // Only agents this run spawned: each subagent run is one turn, its usage summed over its requests.
    const id = e.agentId
    if (id && e.usage && (await read($, spawns))[id]) {
      const n = turnTokens(e.usage)
      await update($, tokens, known => ({ ...known, [id]: (known[id] ?? 0) + n }))
    }
    return result
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId) lastSeen[e.agentId] = await $.clock.now()
    return next(e)
  })

  on('command.run', { command: 'pod-flow' }, async ($, e) => {
    const arg = e.args.trim()
    // `/pod-flow reset` forgets this session's agents (rounds, tokens) and folds, as after a test with fake agents.
    if (arg === 'reset') {
      await update($, spawns, () => ({}))
      await update($, tokens, () => ({}))
      await update($, expanded, () => [])
      await update($, planShown, () => '')
      await update($, ticked, () => [])
      await update($, isAppRunning, () => false)
      for (const id of Object.keys(lastSeen)) delete lastSeen[id]
      merged.clear()
      for (const n of Object.keys(pullCheckedAt)) delete pullCheckedAt[Number(n)]
      // The next tree sets a fresh baseline, so nothing already there is told again.
      told = undefined
      if (await read($, isActive)) await refresh($)
      return { text: 'pod flow reset.' }
    }
    // `/pod-flow preview` opens the tree without a run, to try the mod on a project's docs.
    if (arg === 'preview') {
      await update($, isActive, () => true)
    } else if (!(await read($, isActive))) {
      return { text: 'No /pod:autopilot or /pod:ship run in this session yet. Use /pod-flow preview to try it.' }
    }
    await startRefreshing($)
    // A pane redraws when `gh` answers; text is read once (under -p there's no second call), so it waits for `gh` a little.
    const textNow = async () => {
      await Promise.race([ghWork, $.clock.sleep(GH_WAIT_MS)])
      await refresh($)
      return snapshot(await read($, lines)) || (await read($, emptyNote))
    }
    if (arg === 'text') return { text: await textNow() }
    // Where no pane can draw (-p, a narrow terminal, a surface without panes), the run comes back as a few lines.
    if ((await $.session.surfaces()).length === 0) return { text: await textNow() }
    const opened = await $.ui.open({ id: PANE, title: 'pod flow' })
    if (!opened.isPlaced) return { text: `${await textNow()}\n(no pane: ${opened.reason})` }
    return { text: arg === 'preview' ? 'pod flow preview opened.' : 'pod flow opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const all = await read($, lines)
    const open = await read($, expanded)
    const note = await read($, emptyNote)
    const width = Math.max(20, e.props.bodyColumns - 2)
    const summary = header(all, width)
    // The plan is the header, the tree's root: its rows start at the sprints.
    const rows = visibleLines(all, open).filter(l => l.kind !== 'plan')
    const stems = prefixes(rows)
    const room = Math.max(1, (e.viewport?.rows ?? 30) - 5)
    // A blank line before each tree sets it apart from the header and the tree above. It takes a row of the room too.
    const isGap = (i: number) => rows[i]!.depth <= 1 && !rows[i]!.isContinued
    let shown = 0
    for (let used = 0; shown < rows.length; shown++) {
      used += isGap(shown) ? 2 : 1
      if (used > room) break
    }

    const draw = (row: TreeLine, i: number) => {
      const glyph = row.isContinued ? ' ' : row.kind === 'concern' ? '⚠' : row.kind === 'hint' ? '➜' : row.kind === 'question' ? questionGlyph(row) : (GLYPH[row.status] ?? '·')
      // What you do next, or what waits on you: never dim.
      const isForYou = row.kind === 'hint' || row.kind === 'question'
      if (row.kind === 'app') {
        // Sends your reply, as if typed: the orchestrator starts or stops the app per /pod:code's **Run app**.
        const press = async () => {
          const isRunning = await read($, isAppRunning)
          await $.prompt.submit({ text: isRunning ? 'stop app' : 'run app', asUser: true })
          await update($, isAppRunning, () => !isRunning)
          await refresh($)
        }
        return <Button key="run-app" plain label={fit(`${stems[i]}${glyph} ${row.text}`, row.note, width)} onPress={press} />
      }
      if (row.kind === 'check') {
        const tick = async () => {
          await update($, ticked, list => (list.includes(row.text) ? list.filter(t => t !== row.text) : [...list, row.text]))
          await refresh($)
        }
        const box = row.status === 'done' ? '☑' : '☐'
        return <Button key={`check:${row.text}`} plain dimColor={row.status === 'done'} label={fit(`${stems[i]}${box} ${row.text}`, row.note, width)} onPress={tick} />
      }
      if (isFoldable(row)) {
        const key = foldKey(row)
        const isOpen = open.includes(key)
        const toggle = () => update($, expanded, list => (list.includes(key) ? list.filter(s => s !== key) : [...list, key]))
        // Only a finished sprint or wave folds, so the fold arrow stands in for its ✓.
        const name = `${stems[i]}${isOpen ? '▾' : '▸'} ${row.text}`
        if (!isOpen && row.blockedCount) {
          // A Button takes no color: the red count is its own Text beside it, so a folded ✗ still shows.
          return (
            <Box flexDirection="row">
              <Button plain dimColor label={name} onPress={toggle} />
              <Text wrap="truncate-end" color="red">{`  ${row.detail} · ${row.blockedCount} blocked`}</Text>
            </Box>
          )
        }
        return <Button plain dimColor label={fit(name, isOpen ? row.note : row.detail, width)} onPress={toggle} />
      }
      return (
        // Cyan, as a hand-back is; a blocked question stays red.
        <Text wrap="truncate-end" color={isForYou && row.status !== 'blocked' ? 'cyan' : COLOR[row.status]} dimColor={!isForYou && row.status === 'waiting'}>
          {fit(`${stems[i]}${glyph} ${row.text}`, row.note, width)}
        </Text>
      )
    }

    return (
      <Box flexDirection="column">
        {summary && <Text wrap="truncate-end" weight="semibold">{summary}</Text>}
        {rows.length === 0 && <Text dimColor>{note}</Text>}
        {rows.slice(0, shown).map((row, i) => (isGap(i) ? <Box marginTop={1}>{draw(row, i)}</Box> : draw(row, i)))}
        {rows.length > shown && <Text dimColor>… {rows.length - shown} more lines</Text>}
      </Box>
    )
  })
}
