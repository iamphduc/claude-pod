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

test('the turns of a spawned agent add up its tokens, and other loops add none', async ($, on) => {
  world(on, [])
  on('agent.spawn', () => ({ agentId: 'a1', model: 'claude-opus-5-5' }))
  on('turn.complete', () => ({ text: '' }))
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  await $.agent.spawn({ subagentType: 'pod:engineer', description: 'A1', prompt: 'sprint slug: one · slice code: A1' } as never)
  const usage = { input_tokens: 10, output_tokens: 200, cache_creation_input_tokens: 3000, cache_read_input_tokens: 90_000, model: 'm' }
  const turn = { answer: '', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer' as const, usage }
  await $.turn.complete({ ...turn, agentId: 'a1' })
  await $.turn.complete({ ...turn, agentId: 'a1' })
  await $.turn.complete({ ...turn, agentId: 'stranger' })
  await $.turn.complete(turn)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 120 } as never })
  const drawn = JSON.stringify(await pane.drawn())
  // 2 × (10 + 200 + 3000): the stranger and the main loop add nothing.
  expect(drawn).toContain('one  6.4k tokens · First')
  expect(drawn).not.toContain('13k')
})

test('the resume hint under a halt is drawn cyan, not dim', async ($, on) => {
  const files = { ...docs(), 'docs/handoff-queue.md': '- `[2026-10-06 · BLOCKED · orchestrator → human]` Gate 4: wave check failed **Resolution:** pending' }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 120 } as never })
  const hint = await pane.find({ type: 'Text', text: /➜ fix it first/ })
  expect(hint).toMatchObject({ props: { color: 'cyan' } })
  expect((hint as { props?: { dimColor?: boolean } }).props?.dimColor).toBeFalsy()
})

const run = ($: { command: { run: (input: never) => Promise<unknown> } }, args: string) =>
  $.command.run({ command: 'pod-flow', args } as never) as Promise<{ text: string }>

test('/pod-flow prints a short snapshot when the pane cannot be placed', async ($, on) => {
  world(on, [], false)
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  const { text } = await run($, 'preview')
  expect(text).toBe('sprint 1/1 · wave 1/1\n└─ ● one\n(no pane: terminal is 100 columns, below 144)')
})

test('/pod-flow opens the pane when it fits, and /pod-flow text always prints', async ($, on) => {
  world(on, [])
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  expect((await run($, 'preview')).text).toBe('pod flow preview opened.')
  expect((await run($, 'text')).text).toBe('sprint 1/1 · wave 1/1\n└─ ● one')
})

test('/pod-flow prints the snapshot where nothing draws, as under -p', async ($, on) => {
  const opened: string[] = []
  world(on, opened)
  on('session.surfaces', () => ({ value: [] }))
  expect((await run($, 'preview')).text).toBe('sprint 1/1 · wave 1/1\n└─ ● one')
  expect(opened).toEqual([])
})
