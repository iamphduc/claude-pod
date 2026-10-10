import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Dispatch, TreeLine } from '../types'
import { buildTree, fit, GLYPH, header, latestHalt, mainCheckout, milestones, parseDispatch, parseQueue, parsePlan, parseSprint, prefixes, pullOf, snapshot, turnTokens, visibleLines } from './model'
import type { PlanDoc, SprintDoc } from './model'

const PANE = 'pod-flow'
const REFRESH_MS = 3000
const RUN_SKILL = /(^|:)(autopilot|ship)$/

const isActive = atom({ plugin: 'pod-flow', key: 'isActive' } as const, false)
const lines = atom({ plugin: 'pod-flow', key: 'lines' } as const, [] as TreeLine[])
const expanded = atom({ plugin: 'pod-flow', key: 'expanded' } as const, [] as string[])
const spawns = atom({ plugin: 'pod-flow', key: 'spawns' } as const, {} as Record<string, Dispatch>)
const tokens = atom({ plugin: 'pod-flow', key: 'tokens' } as const, {} as Record<string, number>)
const planShown = atom({ plugin: 'pod-flow', key: 'planShown' } as const, '')

const COLOR: Record<string, string | undefined> = {
  running: 'yellow',
  pushed: 'cyan',
  done: 'green',
  blocked: 'red',
}

type Dollar = EngineInterface

const PULL_CHECK_MS = 30_000

let isTimerOn = false
let told: Set<string> | undefined
const lastSeen: Record<string, number> = {}
const merged = new Set<number>()
const pullCheckedAt: Record<number, number> = {}

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

/** The newest plan not archived; else the one this run showed, which the run's close-out archived. */
async function planToShow($: Dollar, docs: string): Promise<PlanDoc | undefined> {
  const files = (await listNames($, `${docs}/plans`)).sort((a, b) => b.mtimeMs - a.mtimeMs)
  const shown = await read($, planShown)
  let finished: PlanDoc | undefined
  for (const file of files) {
    const plan = parsePlan(await readText($, `${docs}/plans/${file.name}`), file.name.replace(/\.md$/, ''))
    if (plan.sprints.length === 0) continue
    if (plan.status !== 'archived') return plan
    if (plan.slug === shown) finished = plan
  }
  return finished
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

async function refresh($: Dollar) {
  await buildLines($)
  await logMilestones($)
}

async function buildLines($: Dollar) {
  // The main checkout's docs, even while the run works in one of its worktrees, whose copy of the board is old.
  const root = mainCheckout(await $.session.root())
  const docs = `${root}/docs`
  const plan = await planToShow($, docs)
  if (!plan) {
    await update($, lines, () => [])
    return
  }
  if (plan.slug !== (await read($, planShown))) await update($, planShown, () => plan.slug)
  const sprints = [
    ...(await sprintDocs($, `${docs}/sprints`, false)),
    ...(await sprintDocs($, `${docs}/sprints/archive`, true)),
  ].filter(s => s.plan === '' || s.plan === plan.slug)
  const live = (await $.agent.list()).map((a: { id: string; type: string; status: string }) => ({ id: a.id, type: a.type, status: a.status }))
  const queueText = await readText($, `${docs}/handoff-queue.md`)
  const halt = latestHalt(queueText)
  const pull = halt && pullOf(halt.body)
  if (pull) void checkPull($, Number(pull[1]), root)
  const queue = parseQueue(queueText)
  const known = await read($, spawns)
  const spent = await read($, tokens)
  const now = await $.clock.now()
  await update($, lines, () => buildTree({ plan, sprints, spawns: known, live, halt: halt?.body, haltType: halt?.type, now, lastSeen, queue, tokens: spent, merged: [...merged] }))
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
      argumentHint: '[text|reset]',
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
    const text = snapshot(await read($, lines)) || 'Waiting for the plan and sprint docs.'
    if (arg === 'text') return { text }
    // Where no pane can draw (-p, a narrow terminal, a surface without panes), the run comes back as a few lines.
    if ((await $.session.surfaces()).length === 0) return { text }
    const opened = await $.ui.open({ id: PANE, title: 'pod flow' })
    if (!opened.isPlaced) return { text: `${text}\n(no pane: ${opened.reason})` }
    return { text: arg === 'preview' ? 'pod flow preview opened.' : 'pod flow opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const all = await read($, lines)
    const open = await read($, expanded)
    const summary = header(all)
    // The plan is the header, the tree's root: its rows start at the sprints.
    const rows = visibleLines(all, open).filter(l => l.kind !== 'plan')
    const stems = prefixes(rows)
    const room = Math.max(1, (e.viewport?.rows ?? 30) - 5)
    const width = Math.max(20, e.props.bodyColumns - 2)
    // A blank line before each tree sets it apart from the header and the tree above. It takes a row of the room too.
    const isGap = (i: number) => rows[i]!.depth <= 1 && !rows[i]!.isContinued
    let shown = 0
    for (let used = 0; shown < rows.length; shown++) {
      used += isGap(shown) ? 2 : 1
      if (used > room) break
    }

    const draw = (row: TreeLine, i: number) => {
      const glyph = row.isContinued ? ' ' : row.kind === 'concern' ? '⚠' : row.kind === 'hint' ? '➜' : (GLYPH[row.status] ?? '·')
      const isFoldable = row.kind === 'sprint' && row.status === 'done' && row.detail !== undefined
      if (isFoldable) {
        const isOpen = open.includes(row.sprint ?? '')
        const toggle = () =>
          update($, expanded, list =>
            list.includes(row.sprint ?? '') ? list.filter(s => s !== row.sprint) : [...list, row.sprint ?? ''],
          )
        // Only a finished sprint folds, so the fold arrow stands in for its ✓.
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
        // The resume hint is what you do next: cyan, as a hand-back is, never dim.
        <Text wrap="truncate-end" color={row.kind === 'hint' ? 'cyan' : COLOR[row.status]} dimColor={row.kind !== 'hint' && row.status === 'waiting'}>
          {fit(`${stems[i]}${glyph} ${row.text}`, row.note, width)}
        </Text>
      )
    }

    return (
      <Box flexDirection="column">
        {summary && <Text wrap="truncate-end" bold>{summary}</Text>}
        {rows.length === 0 && <Text dimColor>Waiting for the plan and sprint docs.</Text>}
        {rows.slice(0, shown).map((row, i) => (isGap(i) ? <Box marginTop={1}>{draw(row, i)}</Box> : draw(row, i)))}
        {rows.length > shown && <Text dimColor>… {rows.length - shown} more lines</Text>}
      </Box>
    )
  })
}
