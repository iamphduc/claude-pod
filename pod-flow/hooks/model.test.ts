import { expect, test } from 'claude-code/testing'

import { ageNote, buildTree, formatAge, latestHalt, sliceOf, parseDispatch, parsePlan, parseSprint, prefixes, summarize, tableRows } from './model'

const PLAN = `# Plan: Long runs

_Generated: 2026-10-01 · Status: active · Grilled-with: pod_

## Sprints

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| core | Build the core | done | — |
| ui | Build the screens | active | core |
| polish | Tidy up | planned | ui |
`

const SPRINT = `# Sprint: UI

_From plan: docs/plans/long-runs.md · Slug: ui · Status: active · Generated: 2026-10-02_

## Status board

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | List screen | ui-A1 | merged | done | high | — |
| 1 | A2 | Detail screen | ui-A2 | merged | done | medium | — |
| 2 | B1 | Search box | ui-B1 | — | pending | — | A1 |
| 2 | B2 | Filters | ui-B2 | — | pending | — | A1 |

## Shared contract
`

test('tableRows reads the body of the table by its first header', () => {
  expect(tableRows(SPRINT, 'Wave')).toHaveLength(4)
  expect(tableRows(SPRINT, 'Nope')).toEqual([])
})

test('parsePlan reads the title, status and sprint rows', () => {
  const plan = parsePlan(PLAN, 'long-runs')
  expect(plan.title).toBe('Long runs')
  expect(plan.status).toBe('active')
  expect(plan.sprints.map(s => `${s.slug}:${s.status}`)).toEqual(['core:done', 'ui:active', 'polish:planned'])
})

test('parseSprint reads the slug, plan and board', () => {
  const sprint = parseSprint(SPRINT, false)
  expect(sprint?.slug).toBe('ui')
  expect(sprint?.plan).toBe('long-runs')
  expect(sprint?.rows[2]).toEqual({
    wave: 2,
    slice: 'B1',
    title: 'Search box',
    branch: 'ui-B1',
    pr: '—',
    status: 'pending',
    confidence: '—',
  })
})

test('parseSprint returns nothing for a doc with no slug', () => {
  expect(parseSprint('# Not a sprint', false)).toBeUndefined()
})

test('parseDispatch reads sprint, slice and branch from a dispatch prompt', () => {
  const prompt = ['- sprint slug:      ui', '- slice code:       B1', '- branch name:      ui-B1'].join('\n')
  expect(parseDispatch(prompt)).toEqual({ sprint: 'ui', slice: 'B1', branch: 'ui-B1' })
  expect(parseDispatch('Draft the next sprint.')).toEqual({ sprint: undefined, slice: undefined, branch: undefined })
})

test('latestHalt returns the newest pending orchestrator entry only', () => {
  const queue = [
    '- `[2026-10-01 · BLOCKED · orchestrator → human · sprint: ui]` Gate 4: wave check failed **Resolution:** 2026-10-01 — fixed',
    '- `[2026-10-02 · PENDING · engineer → orchestrator · sprint: ui · slice: B1]` NOTE for B2 **Resolution:** pending',
    '- `[2026-10-03 · BLOCKED · orchestrator → human · sprint: ui]` Gate 6: low confidence on B1 **Resolution:** pending',
  ].join('\n')
  expect(latestHalt(queue)).toBe('Gate 6: low confidence on B1')
  expect(latestHalt('- `[2026-10-01 · BLOCKED · orchestrator → human]` Done **Resolution:** 2026-10-02 — ok')).toBeUndefined()
})

test('buildTree maps plan, sprints, waves and slices, and marks a live engineer', () => {
  const lines = buildTree({
    plan: parsePlan(PLAN, 'long-runs'),
    sprints: [parseSprint(SPRINT, false)!],
    spawns: { agent1: { type: 'pod:engineer', description: 'B1', sprint: 'ui', slice: 'B1', branch: 'ui-B1' } },
    live: [{ id: 'agent1', type: 'pod:engineer', status: 'running' }],
  })
  const text = lines.map(l => `${l.depth} ${l.kind} ${l.text.split(' ')[0]} ${l.status}`)
  expect(text).toContain('0 plan Long running')
  expect(text).toContain('1 sprint ui running')
  expect(text).toContain('2 wave wave done')
  expect(text).toContain('3 slice B1 running')
  expect(text).toContain('3 slice B2 waiting')
  expect(lines.find(l => l.kind === 'wave' && l.text === 'wave 2')?.status).toBe('running')
  expect(lines.find(l => l.kind === 'wave' && l.text === 'wave 1')?.note).toBe('2/2 done')
})

test('buildTree lists a running agent that matches no slice', () => {
  const lines = buildTree({
    plan: parsePlan(PLAN, 'long-runs'),
    sprints: [],
    spawns: {},
    live: [{ id: 'r1', type: 'pod:reviewer', status: 'running' }],
  })
  expect(lines.some(l => l.kind === 'agent' && l.text === 'reviewer')).toBe(true)
})

test('buildTree shows a halt only when no agent is running', () => {
  const input = { plan: parsePlan(PLAN, 'long-runs'), sprints: [], spawns: {}, halt: 'Gate 2: plan review failed —' }
  const idle = buildTree({ ...input, live: [] })
  expect(idle.at(-1)).toMatchObject({ kind: 'halt', status: 'blocked', note: 'Gate 2: plan review failed' })
  const busy = buildTree({ ...input, live: [{ id: 'r1', type: 'pod:reviewer', status: 'running' }] })
  expect(busy.some(l => l.kind === 'halt')).toBe(false)
})

test('sliceOf falls back to a slice code in the description or branch', () => {
  const codes = ['A1', 'B1']
  expect(sliceOf({ type: 'pod:engineer', description: 'B1 search box' }, codes)).toBe('B1')
  expect(sliceOf({ type: 'pod:engineer', description: 'work', branch: 'ui-A1' }, codes)).toBe('A1')
  expect(sliceOf({ type: 'pod:engineer', description: 'Draft the sprint' }, codes)).toBeUndefined()
  expect(sliceOf({ type: 'pod:engineer', description: 'x', slice: 'B1' }, codes)).toBe('B1')
})

test('buildTree marks the slice live when the prompt gave no slice code', () => {
  const lines = buildTree({
    plan: parsePlan(PLAN, 'long-runs'),
    sprints: [parseSprint(SPRINT, false)!],
    spawns: { e1: { type: 'pod:engineer', description: 'B1 search box' } },
    live: [{ id: 'e1', type: 'pod:engineer', status: 'running' }],
  })
  expect(lines.find(l => l.kind === 'slice' && l.text.startsWith('B1'))?.status).toBe('running')
  expect(lines.some(l => l.kind === 'agent')).toBe(false)
})

test('prefixes draw branches and close them under the last sibling', () => {
  const lines = buildTree({
    plan: parsePlan(PLAN, 'long-runs'),
    sprints: [parseSprint(SPRINT, false)!],
    spawns: {},
    live: [],
  })
  const stems = prefixes(lines)
  expect(stems[0]).toBe('')
  expect(stems[1]).toBe('├─ ')
  expect(stems.at(-1)).toBe('└─ ')
})

test('summarize reports sprint, wave, running and blocked counts', () => {
  const lines = buildTree({
    plan: parsePlan(PLAN, 'long-runs'),
    sprints: [parseSprint(SPRINT, false)!],
    spawns: { e1: { type: 'pod:engineer', description: 'B1 search box' } },
    live: [{ id: 'e1', type: 'pod:engineer', status: 'running' }],
  })
  expect(summarize(lines)).toBe('sprint 2/3 · wave 2/2 · 1 running')
})

test('summarize counts blocked slices and says when all sprints are done', () => {
  const blocked = parseSprint(SPRINT.replaceAll('| pending | — | A1 |', '| blocked | — | A1 |'), false)!
  const lines = buildTree({ plan: parsePlan(PLAN, 'long-runs'), sprints: [blocked], spawns: {}, live: [] })
  expect(summarize(lines)).toContain('2 blocked')
  const done = parsePlan(PLAN.replace('| ui | Build the screens | active |', '| ui | Build the screens | done |').replace('planned', 'done'), 'long-runs')
  expect(summarize(buildTree({ plan: done, sprints: [], spawns: {}, live: [] }))).toBe('all sprints done')
})

test('formatAge writes seconds, minutes and hours', () => {
  expect([45_000, 180_000, 3_900_000].map(formatAge)).toEqual(['45s', '3m', '1h05m'])
})

test('ageNote adds a quiet flag after two silent minutes', () => {
  expect(ageNote(0, 170_000, 180_000)).toBe('3m')
  expect(ageNote(0, 30_000, 180_000)).toBe('3m · quiet 2m')
  expect(ageNote(0, undefined, 60_000)).toBe('1m')
  expect(ageNote(undefined, undefined, 60_000)).toBeUndefined()
})

test('buildTree shows how long a running engineer has run', () => {
  const lines = buildTree({
    plan: parsePlan(PLAN, 'long-runs'),
    sprints: [parseSprint(SPRINT, false)!],
    spawns: { e1: { type: 'pod:engineer', description: 'B1 search box', startedAt: 0 } },
    live: [{ id: 'e1', type: 'pod:engineer', status: 'running' }],
    now: 300_000,
    lastSeen: { e1: 100_000 },
  })
  expect(lines.find(l => l.kind === 'slice' && l.text.startsWith('B1'))?.note).toBe('5m · quiet 3m')
})
