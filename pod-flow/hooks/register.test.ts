import { expect, mock, test } from 'claude-code/testing'

const PLAN = `# Plan: Demo

_Generated: 2026-10-01 · Status: active_

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | First | active | — |
`

const SPRINT = `# Sprint: One

_From plan: docs/plans/demo.md · Slug: one · Status: active · Generated: 2026-10-01_

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | First slice | one-A1 | — | pending | — | — |
`

const FILES: Record<string, string> = {
  'docs/plans/demo.md': PLAN,
  'docs/sprints/one.md': SPRINT,
}

const world = (on: Parameters<typeof mock.clock>[0], opened: string[]) => {
  mock.clock(on)
  on('fs.list', (_$, e) => {
    const names = Object.keys(FILES).filter(p => p.startsWith(`${e.path}/`))
    return {
      value: names.map(p => ({ name: p.split('/').at(-1)!, kind: 'file' as const, size: 1, mtimeMs: 1, isLink: false })),
    }
  })
  on('fs.read', (_$, e) => {
    const text = FILES[e.path]
    if (text === undefined) throw new Error('ENOENT')
    return { value: text }
  })
  on('agent.list', () => ({ value: [] }))
  on('skill.prompt', (_$, e) => ({ text: e.text }))
  on('ui.open', (_$, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true as const } }
  })
}

test('starting /pod:autopilot opens the pane', async ($, on) => {
  const opened: string[] = []
  world(on, opened)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect(opened).toEqual(['pod-flow'])
})

test('another skill leaves the pane closed', async ($, on) => {
  const opened: string[] = []
  world(on, opened)
  await $.skill.prompt({ skill: 'pod:fix', text: 'fix it' })
  expect(opened).toEqual([])
})
