import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Dispatch, TreeLine } from '../types'
import { buildTree, latestHalt, parseDispatch, parsePlan, parseSprint, prefixes, summarize } from './model'
import type { PlanDoc, SprintDoc } from './model'

const PANE = 'pod-flow'
const REFRESH_MS = 3000
const RUN_SKILL = /(^|:)(autopilot|ship)$/

const isActive = atom({ plugin: 'pod-flow', key: 'isActive' } as const, false)
const lines = atom({ plugin: 'pod-flow', key: 'lines' } as const, [] as TreeLine[])
const spawns = atom({ plugin: 'pod-flow', key: 'spawns' } as const, {} as Record<string, Dispatch>)

const GLYPH: Record<string, string> = { running: '●', pushed: '◐', done: '✓', blocked: '✗', waiting: '○' }
const COLOR: Record<string, string | undefined> = {
  running: 'yellow',
  pushed: 'cyan',
  done: 'green',
  blocked: 'red',
}

type Dollar = EngineInterface

let isTimerOn = false
const lastSeen: Record<string, number> = {}

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

async function newestActivePlan($: Dollar): Promise<PlanDoc | undefined> {
  const files = (await listNames($, 'docs/plans')).sort((a, b) => b.mtimeMs - a.mtimeMs)
  for (const file of files) {
    const plan = parsePlan(await readText($, `docs/plans/${file.name}`), file.name.replace(/\.md$/, ''))
    if (plan.status !== 'archived' && plan.sprints.length > 0) return plan
  }
  return undefined
}

async function sprintDocs($: Dollar, dir: string, isArchived: boolean): Promise<SprintDoc[]> {
  const docs: SprintDoc[] = []
  for (const file of await listNames($, dir)) {
    const doc = parseSprint(await readText($, `${dir}/${file.name}`), isArchived)
    if (doc) docs.push(doc)
  }
  return docs
}

async function refresh($: Dollar) {
  const plan = await newestActivePlan($)
  if (!plan) {
    await update($, lines, () => [])
    return
  }
  const sprints = [
    ...(await sprintDocs($, 'docs/sprints', false)),
    ...(await sprintDocs($, 'docs/sprints/archive', true)),
  ].filter(s => s.plan === plan.slug)
  const live = (await $.agent.list()).map((a: { id: string; type: string; status: string }) => ({ id: a.id, type: a.type, status: a.status }))
  const halt = latestHalt(await readText($, 'docs/handoff-queue.md'))
  const known = await read($, spawns)
  const now = await $.clock.now()
  await update($, lines, () => buildTree({ plan, sprints, spawns: known, live, halt, now, lastSeen }))
}

async function activate($: Dollar) {
  await update($, isActive, () => true)
  if (!isTimerOn) {
    isTimerOn = true
    $.clock.every(REFRESH_MS, () => void refresh($))
  }
  void $.ui.open({ id: PANE, title: 'pod flow' })
  await refresh($)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pod-flow',
      description: 'Show the pod run tree (during /pod:autopilot or /pod:ship)',
    })
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

  on('tool.call', async ($, e, next) => {
    if (e.agentId) lastSeen[e.agentId] = await $.clock.now()
    return next(e)
  })

  on('command.run', { command: 'pod-flow' }, async $ => {
    if (!(await read($, isActive))) {
      return { text: 'No /pod:autopilot or /pod:ship run in this session yet.' }
    }
    await $.ui.open({ id: PANE, title: 'pod flow' })
    return { text: 'pod flow opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const rows = await read($, lines)
    const stems = prefixes(rows)
    const summary = summarize(rows)
    const room = Math.max(1, (e.viewport?.rows ?? 30) - 5)

    return (
      <Box flexDirection="column">
        {rows.length === 0 && <Text dimColor>Waiting for the plan and sprint docs.</Text>}
        {summary && <Text wrap="truncate-end" bold>{summary}</Text>}
        {rows.slice(0, room).map((row, i) => (
          <Text wrap="truncate-end" color={COLOR[row.status]} dimColor={row.status === 'waiting'}>
            {stems[i]}
            {GLYPH[row.status] ?? '·'} {row.text}
            {row.note ? `  ${row.note}` : ''}
          </Text>
        ))}
        {rows.length > room && <Text dimColor>… {rows.length - room} more lines</Text>}
      </Box>
    )
  })
}
