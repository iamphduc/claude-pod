import { expect, test } from 'claude-code/testing'

import { ageNote, buildTree, fit, formatAge, prState, latestHalt, sliceOf, parseDispatch, parsePlan, parseSprint, prefixes, summarize, tableRows, visibleLines } from './model'

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

test('visibleLines folds a finished sprint with a board, and opens it on request', () => {
  const done = SPRINT.replaceAll('| pending |', '| done |')
  const plan = parsePlan(PLAN.replace('| ui | Build the screens | active |', '| ui | Build the screens | done |'), 'long-runs')
  const lines = buildTree({ plan, sprints: [parseSprint(done, true)!], spawns: {}, live: [] })

  const folded = visibleLines(lines, [])
  expect(folded.some(l => l.kind === 'slice')).toBe(false)
  expect(folded.find(l => l.sprint === 'ui' && l.kind === 'sprint')?.detail).toBe('2 waves · 4 slices')

  const opened = visibleLines(lines, ['ui'])
  expect(opened.filter(l => l.kind === 'slice')).toHaveLength(4)
})

test('visibleLines never folds a sprint that is running or has no board', () => {
  const lines = buildTree({ plan: parsePlan(PLAN, 'long-runs'), sprints: [parseSprint(SPRINT, false)!], spawns: {}, live: [] })
  const shown = visibleLines(lines, [])
  expect(shown.filter(l => l.kind === 'slice')).toHaveLength(4)
  expect(shown.some(l => l.kind === 'sprint' && l.text === 'core')).toBe(true)
})

test('prState reads the board PR cell', () => {
  expect(prState('—')).toEqual({ state: 'none' })
  expect(prState('merged')).toEqual({ state: 'merged' })
  expect(prState('skipped — verification failed')).toEqual({ state: 'skipped' })
  expect(prState('blocked')).toEqual({ state: 'blocked' })
  expect(prState('https://github.com/me/app/pull/12')).toEqual({ state: 'open', number: '12' })
  expect(prState('[#12](https://github.com/me/app/pull/12)')).toEqual({ state: 'open', number: '12' })
})

const waveNote = (pr: string, status = 'pushed') => {
  const board = SPRINT.replaceAll('| ui-B1 | — | pending |', `| ui-B1 | ${pr} | ${status} |`).replaceAll('| ui-B2 | — | pending |', `| ui-B2 | ${pr} | ${status} |`)
  const lines = buildTree({ plan: parsePlan(PLAN, 'long-runs'), sprints: [parseSprint(board, false)!], spawns: {}, live: [] })
  return lines.find(l => l.kind === 'wave' && l.text === 'wave 2')
}

test('a wave with an open PR says so', () => {
  expect(waveNote('https://github.com/me/app/pull/12')).toMatchObject({ status: 'running', note: 'PR #12 open · 0/2 done' })
})

test('an open PR wins even when every slice is marked done', () => {
  expect(waveNote('https://github.com/me/app/pull/12', 'done')).toMatchObject({ status: 'running', note: 'PR #12 open · 2/2 done' })
})

test('a merged wave is done, and a skipped one is blocked', () => {
  expect(waveNote('merged', 'done')).toMatchObject({ status: 'done', note: '2/2 done' })
  expect(waveNote('skipped — verification failed')).toMatchObject({ status: 'blocked', note: 'skipped · 0/2 done' })
})

test('fit keeps the note and shortens the name when the row is too long', () => {
  expect(fit('├─ ✓ short', '3 waves', 40)).toBe('├─ ✓ short  3 waves')
  const row = fit('├─ ✓ king-safety-endgame', '3 waves · 3 slices', 40)
  expect(row).toBe('├─ ✓ king-safety-en…  3 waves · 3 slices')
  expect(row.length).toBeLessThanOrEqual(40)
})

test('fit keeps the whole name and cuts the end of a long note', () => {
  const row = fit('└─ ● engineer', '4m · Fix inaudible capture sound', 40)
  expect(row).toBe('└─ ● engineer  4m · Fix inaudible captu…')
  expect(row.length).toBeLessThanOrEqual(40)
})

test('an agent line puts its age before its description', () => {
  const lines = buildTree({
    plan: parsePlan(PLAN, 'long-runs'),
    sprints: [],
    spawns: { f1: { type: 'pod:engineer', description: 'Fix inaudible capture sound', startedAt: 0 } },
    live: [{ id: 'f1', type: 'pod:engineer', status: 'running' }],
    now: 240_000,
    lastSeen: { f1: 230_000 },
  })
  expect(lines.find(l => l.kind === 'agent')?.note).toBe('4m · Fix inaudible capture sound')
})

test('the plan shows done once every sprint is done and no agent runs', () => {
  const done = parsePlan(PLAN.replace('| ui | Build the screens | active |', '| ui | Build the screens | done |').replace('planned', 'done'), 'long-runs')
  expect(buildTree({ plan: done, sprints: [], spawns: {}, live: [] })[0]?.status).toBe('done')
  const busy = buildTree({ plan: done, sprints: [], spawns: {}, live: [{ id: 'f1', type: 'pod:engineer', status: 'running' }] })
  expect(busy[0]?.status).toBe('running')
})

// A board as chess-web writes it: extra Difficulty and Agent columns, no Confidence, "#3 merged" in PR.
const CHESS_BOARD = `# Sprint: Engine Foundation

_From plan: docs/plans/pure-engine-refactor.md · Slug: engine-foundation · Status: archived · Generated: 2026-06-04_

## Status board

| Wave | Slice | Title | Difficulty | Agent | Branch | PR | Status | Depends on |
|------|-------|-------|------------|-------|--------|----|--------|------------|
| 1 | harness | Stand up the Vitest test harness | 2 | engineer-junior | engine-foundation-harness | #3 merged | done | — |
| 2 | gamestate | Define the immutable GameState | 3 | engineer-senior | engine-foundation-gamestate | #4 merged | done | harness |
| 2 | tracer | Tracer-bullet legalMoves | 3 | engineer-senior | engine-foundation-tracer | #5 merged | done | harness |
`

const CHESS_PLAN = `# Plan: Pure engine

_Generated: 2026-06-01 · Status: active_

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| engine-foundation | Build the engine base | done | — |
`

test('parseSprint reads a board by its header names, whatever the column order', () => {
  const sprint = parseSprint(CHESS_BOARD, true)
  expect(sprint?.rows[0]).toEqual({
    wave: 1,
    slice: 'harness',
    title: 'Stand up the Vitest test harness',
    branch: 'engine-foundation-harness',
    pr: '#3 merged',
    status: 'done',
    confidence: '—',
  })
})

test("a board with a different layout still shows merged waves as done with no stray notes", () => {
  const lines = buildTree({
    plan: parsePlan(CHESS_PLAN, 'pure-engine'),
    sprints: [parseSprint(CHESS_BOARD, true)!],
    spawns: {},
    live: [],
  })
  const waves = lines.filter(l => l.kind === 'wave')
  expect(waves.map(w => `${w.text} ${w.status} ${w.note}`)).toEqual(['wave 1 done 1/1 done', 'wave 2 done 2/2 done'])
  const slices = lines.filter(l => l.kind === 'slice')
  expect(slices.every(l => l.status === 'done' && l.note === undefined)).toBe(true)
})

test('an open PR in that layout shows on its wave', () => {
  const open = CHESS_BOARD.replaceAll('| #4 merged | done |', '| https://github.com/me/chess/pull/4 | pushed |').replaceAll('| #5 merged | done |', '| https://github.com/me/chess/pull/4 | pushed |')
  const lines = buildTree({ plan: parsePlan(CHESS_PLAN, 'pure-engine'), sprints: [parseSprint(open, false)!], spawns: {}, live: [] })
  expect(lines.find(l => l.kind === 'wave' && l.text === 'wave 2')).toMatchObject({ status: 'running', note: 'PR #4 open · 0/2 done' })
})

const PR4 = 'https://github.com/me/chess/pull/4'

test('a done slice with a PR link is merged once the sprint is archived', () => {
  const board = CHESS_BOARD.replaceAll('| #4 merged |', `| ${PR4} |`).replaceAll('| #5 merged |', `| ${PR4} |`)
  const lines = buildTree({ plan: parsePlan(CHESS_PLAN, 'pure-engine'), sprints: [parseSprint(board, true)!], spawns: {}, live: [] })
  expect(lines.find(l => l.kind === 'wave' && l.text === 'wave 2')).toMatchObject({ status: 'done', note: '2/2 done' })
})

test('a done slice with a PR link is merged once a later wave has started', () => {
  const board = `| Wave | Slice | Title | Branch | PR | Status |
|------|-------|-------|--------|----|--------|
| 1 | A | one | b-A | ${PR4} | done |
| 2 | B | two | b-B | — | pushed |
`
  const doc = parseSprint(`_From plan: docs/plans/p.md · Slug: s · Status: active_\n\n${board}`, false)!
  const plan = parsePlan(`# Plan: P\n\n_Status: active_\n\n| Sprint | Goal | Status | Depends on |\n|---|---|---|---|\n| s | g | active | — |\n`, 'p')
  const lines = buildTree({ plan, sprints: [doc], spawns: {}, live: [] })
  expect(lines.find(l => l.kind === 'wave' && l.text === 'wave 1')).toMatchObject({ status: 'done' })
})

test('merged as a status counts as done', () => {
  const board = CHESS_BOARD.replaceAll('| #3 merged | done |', '| — | merged |').replaceAll('| #4 merged | done |', '| — | merged |').replaceAll('| #5 merged | done |', '| — | merged |')
  const lines = buildTree({ plan: parsePlan(CHESS_PLAN, 'pure-engine'), sprints: [parseSprint(board, false)!], spawns: {}, live: [] })
  expect(lines.filter(l => l.kind === 'wave').every(w => w.status === 'done')).toBe(true)
})

test('a status cell with a PR link in front still reads as its status word', () => {
  const board = CHESS_BOARD.replace('| #3 merged | done |', '| — | [#225](https://github.com/me/chess/pull/225) merged |')
  expect(parseSprint(board, true)?.rows[0]?.status).toBe('merged')
})

test('parseSprint falls back to the file name when a doc has no Slug header', () => {
  expect(parseSprint('# Old sprint\n\n' + tableRowsFixture(), true, 'roster-foundation')?.slug).toBe('roster-foundation')
  expect(parseSprint('# Old sprint', true)).toBeUndefined()
})

function tableRowsFixture() {
  return '| Wave | Slice | Title | Status |\n|---|---|---|---|\n| 1 | a | t | done |\n'
}

test('a finished plan waiting on its final PR is a hand-back, not a halt', () => {
  const done = parsePlan(PLAN.replace('| ui | Build the screens | active |', '| ui | Build the screens | done |').replace('planned', 'done'), 'long-runs')
  const lines = buildTree({ plan: done, sprints: [], spawns: {}, live: [], halt: 'plan board-feel complete — final PR https://github.com/me/app/pull/55' }).filter(l => l.kind !== 'sprint')
  expect(lines.at(-1)).toMatchObject({ kind: 'halt', text: 'waiting on you', status: 'pushed' })
  const summary = summarize(buildTree({ plan: done, sprints: [], spawns: {}, live: [], halt: 'plan board-feel complete' }))
  expect(summary).toContain('waiting on you')
  expect(summary).not.toContain('blocked')
})

test('a gate halt still counts as blocked', () => {
  const lines = buildTree({ plan: parsePlan(PLAN, 'long-runs'), sprints: [], spawns: {}, live: [], halt: 'Gate 4: wave check failed' })
  expect(lines.at(-1)).toMatchObject({ kind: 'halt', text: 'halted', status: 'blocked' })
  expect(summarize(lines)).toContain('1 blocked')
})
