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

const docs = (): Record<string, string> => ({
  'docs/plans/demo.md': PLAN,
  'docs/sprints/one.md': SPRINT,
})

// The engine hands fs hooks an absolute path (on Windows, with backslashes): match on its end.
const endsAt = (path: string, rel: string) => path.replaceAll('\\', '/').endsWith(`/${rel}`)

const world = (on: Parameters<typeof mock.clock>[0], opened: string[], isPlaced = true, logged: string[] = [], files = docs(), isShown = isPlaced) => {
  mock.clock(on)
  on('fs.list', (_$, e) => {
    const names = Object.keys(files).filter(p => endsAt(e.path, p.slice(0, p.lastIndexOf('/'))))
    return {
      value: names.map(p => ({ name: p.split('/').at(-1)!, kind: 'file' as const, size: 1, mtimeMs: 1, isLink: false })),
    }
  })
  on('fs.read', (_$, e) => {
    const file = Object.keys(files).find(p => endsAt(e.path, p))
    if (file === undefined) throw new Error('ENOENT')
    return { value: files[file]! }
  })
  on('agent.list', () => ({ value: [] }))
  on('skill.prompt', (_$, e) => ({ text: e.text }))
  on('ui.open', (_$, e) => {
    opened.push(e.id)
    return { value: isPlaced ? { isPlaced: true as const } : { isPlaced: false as const, reason: 'terminal is 100 columns, below 144' } }
  })
  on('ui.panes', () => ({ value: opened.map(id => ({ id, title: 'pod flow', isShown, isFocused: false, isPlaced })) }))
  on('ui.log', (_$, e) => {
    logged.push(e.text)
    return { value: undefined }
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

test('a narrow terminal tells each new milestone in the transcript, once', async ($, on) => {
  const logged: string[] = []
  const files = docs()
  world(on, [], false, logged, files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect(logged).toEqual([])
  files['docs/sprints/one.md'] = SPRINT.replace('| pending |', '| blocked |')
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect(logged).toEqual(['✗ BLOCKED · one · A1 First slice'])
})

test('a drawn pane keeps milestones out of the transcript', async ($, on) => {
  const logged: string[] = []
  const files = docs()
  world(on, [], true, logged, files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  files['docs/sprints/one.md'] = SPRINT.replace('| pending |', '| blocked |')
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect(logged).toEqual([])
})

test('a pane behind another plugin pane counts as hidden', async ($, on) => {
  const logged: string[] = []
  const files = docs()
  world(on, [], true, logged, files, false)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  files['docs/sprints/one.md'] = SPRINT.replace('| pending |', '| blocked |')
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect(logged).toEqual(['✗ BLOCKED · one · A1 First slice'])
})
