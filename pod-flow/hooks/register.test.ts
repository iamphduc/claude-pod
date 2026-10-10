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

const world = (on: Parameters<typeof mock.clock>[0], opened: string[], isPlaced = true, logged: string[] = [], files = docs(), isShown = isPlaced, agents: { id: string; type: string; status: string }[] = [], root = 'E:\\proj') => {
  mock.clock(on)
  on('session.root', () => ({ value: root }))
  // Docs live only in the main checkout, E:\proj: a worktree's copy is old, so here it has none.
  const isOutsideDocs = (path: string) => !path.replaceAll('\\', '/').startsWith('E:/proj/docs')
  on('fs.list', (_$, e) => {
    const names = isOutsideDocs(e.path) ? [] : Object.keys(files).filter(p => endsAt(e.path, p.slice(0, p.lastIndexOf('/'))))
    return {
      value: names.map(p => ({ name: p.split('/').at(-1)!, kind: 'file' as const, size: 1, mtimeMs: 1, isLink: false })),
    }
  })
  on('fs.read', (_$, e) => {
    const file = isOutsideDocs(e.path) ? undefined : Object.keys(files).find(p => endsAt(e.path, p))
    if (file === undefined) throw new Error('ENOENT')
    return { value: files[file]! }
  })
  on('agent.list', () => ({ value: agents as never }))
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
  expect(text).toBe('Demo · sprint 1/1 · wave 1/1\n● one\n(no pane: terminal is 100 columns, below 144)')
})

test('/pod-flow opens the pane when it fits, and /pod-flow text always prints', async ($, on) => {
  world(on, [])
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  expect((await run($, 'preview')).text).toBe('pod flow preview opened.')
  expect((await run($, 'text')).text).toBe('Demo · sprint 1/1 · wave 1/1\n● one')
})

test('/pod-flow prints the snapshot where nothing draws, as under -p', async ($, on) => {
  const opened: string[] = []
  world(on, opened)
  on('session.surfaces', () => ({ value: [] }))
  expect((await run($, 'preview')).text).toBe('Demo · sprint 1/1 · wave 1/1\n● one')
  expect(opened).toEqual([])
})

test('/pod-flow reset forgets the session agents, so their rounds and tokens leave the tree', async ($, on) => {
  world(on, [])
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  on('agent.spawn', () => ({ agentId: 'r1', model: 'claude-opus-5-5' }))
  on('turn.complete', () => ({ text: '' }))
  await run($, 'preview')
  await $.agent.spawn({ subagentType: 'pod:reviewer', description: 'Review plan', prompt: 'plan slug: demo · round: 1' } as never)
  const usage = { input_tokens: 10, output_tokens: 200, cache_creation_input_tokens: 3000, cache_read_input_tokens: 0, model: 'm' }
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer', agentId: 'r1', usage })
  expect((await run($, 'text')).text).toContain('review · 1 round')
  expect((await run($, 'reset')).text).toBe('pod flow reset.')
  const { text } = await run($, 'text')
  expect(text).not.toContain('review')
  expect(text).not.toContain('tokens')
})

test('a sprint-planner spawned during the run shows as drafting under its sprint', async ($, on) => {
  const files = { 'docs/plans/demo.md': PLAN.replace('| one | First | active |', '| one | First | done |\n| two | Second | planned |') }
  world(on, [], true, [], files, true, [{ id: 'p1', type: 'pod:sprint-planner', status: 'running' }])
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  on('agent.spawn', () => ({ agentId: 'p1', model: 'claude-opus-5-5' }))
  await run($, 'preview')
  await $.agent.spawn({ subagentType: 'pod:sprint-planner', description: 'Draft next sprint', prompt: 'plan slug: demo' } as never)
  expect((await run($, 'text')).text).toBe('Demo · sprint 2/2 · 1 running\n✓ 1 sprint done\n● two\n└─ ● drafting 0s')
})

test('an agent links to its slice by the markdown fields alone, whatever its description says', async ($, on) => {
  world(on, [], true, [], docs(), true, [{ id: 'e1', type: 'pod:engineer', status: 'running' }])
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  on('agent.spawn', () => ({ agentId: 'e1', model: 'claude-opus-5-5' }))
  await run($, 'preview')
  await $.agent.spawn({ subagentType: 'pod:engineer', description: 'background helper', prompt: '- **sprint slug:** one\n- **slice code:** A1' } as never)
  expect((await run($, 'text')).text).toBe('Demo · sprint 1/1 · wave 1/1 · 1 running\n● one\n└─ ● wave 1 · A1 First slice 0s')
})

test('a session working in a worktree still reads the main checkout docs', async ($, on) => {
  world(on, [], true, [], docs(), true, [], 'E:\\proj\\.claude\\worktrees\\one-w1')
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await run($, 'preview')
  expect((await run($, 'text')).text).toBe('Demo · sprint 1/1 · wave 1/1\n● one')
})

const close = (files: Record<string, string>) => {
  // What a run's close-out leaves: the plan archived, its sprint done and moved to the archive.
  files['docs/plans/demo.md'] = PLAN.replace('Status: active', 'Status: archived').replace('| one | First | active |', '| one | First | done |')
  files['docs/sprints/archive/one.md'] = SPRINT.replace('Status: active', 'Status: archived').replace('| pending |', '| done |')
  delete files['docs/sprints/one.md']
}

test('the tree stays once the run archives its plan', async ($, on) => {
  const files = docs()
  world(on, [], true, [], files)
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  close(files)
  expect((await run($, 'text')).text).toBe('Demo · all sprints done\n✓ 1 sprint done')
})

test('an archived plan this session never showed stays hidden', async ($, on) => {
  const files = docs()
  close(files)
  world(on, [], true, [], files)
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect((await run($, 'text')).text).toBe('Waiting for the plan and sprint docs.')
})

test('starting a new run clears the tree of the plan the last run finished', async ($, on) => {
  const files = docs()
  world(on, [], true, [], files)
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  close(files)
  await $.skill.prompt({ skill: 'pod:ship', text: 'next idea' })
  expect((await run($, 'text')).text).toBe('Waiting for the plan and sprint docs.')
})

test('a narrow pane shows the whole hand-back label, waiting', async ($, on) => {
  const files = { ...docs(), 'docs/handoff-queue.md': '- `[2026-10-09 · PENDING · orchestrator → human · plan: demo]` plan demo complete — final PR https://github.com/me/demo/pull/8, review pass **Resolution:** pending' }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 42 } as never })
  expect(await pane.find({ type: 'Text', text: /◐ waiting {2}plan demo/ })).toBeDefined()
})

const handBack = (pull: number) => ({
  ...docs(),
  'docs/handoff-queue.md': `- \`[2026-10-09 · PENDING · orchestrator → human · plan: demo]\` plan demo complete — final PR https://github.com/me/demo/pull/${pull}, review pass **Resolution:** pending`,
})

test('a hand-back whose PR has merged shows it merged, with nothing left to do', async ($, on) => {
  const asked: string[][] = []
  world(on, [], true, [], handBack(9))
  on('process.run', (_$, e) => {
    asked.push([...e.argv])
    return { value: { exitCode: 0, stdout: 'MERGED\n', stderr: '' } as never }
  })
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const text = (await run($, 'text')).text
  expect(asked[0]).toEqual(['gh', 'pr', 'view', '9', '--json', 'state', '--jq', '.state'])
  expect(text).toContain('✓ PR #9 merged')
  expect(text).not.toContain('merge PR #9')
  expect(text).not.toContain('waiting')
})

test('a hand-back stays waiting when gh cannot tell', async ($, on) => {
  world(on, [], true, [], handBack(10))
  on('process.run', () => ({ value: { exitCode: 1, stdout: '', stderr: 'gh: not logged in' } as never }))
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const text = (await run($, 'text')).text
  expect(text).toContain('waiting')
  expect(text).toContain('merge PR #10')
})

test('the pane puts the plan in its header, and the tree starts at the sprints', async ($, on) => {
  world(on, [])
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 80 } as never })
  expect(await pane.find({ type: 'Text', text: /^Demo · sprint 1\/1 · wave 1\/1$/ })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /● Demo/ })).toBeUndefined()
  expect(await pane.find({ type: 'Text', text: /^● one/ })).toBeDefined()
})

test('a blank line sets each tree apart, the first from the header too', async ($, on) => {
  world(on, [], true, [], handBack(11))
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 80 } as never })
  // Two trees, sprint one and the hand-back: a gap over each.
  const gaps = JSON.stringify(await pane.drawn()).match(/"marginTop":1/g) ?? []
  expect(gaps).toHaveLength(2)
})

test("a new plan's tree leaves out the last plan's hand-back", async ($, on) => {
  const files = { ...docs(), 'docs/handoff-queue.md': handBack(7)['docs/handoff-queue.md']!.replace('plan: demo', 'plan: older').replace('plan demo', 'plan older') }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const text = (await run($, 'text')).text
  expect(text).not.toContain('waiting')
  expect(text).not.toContain('PR #7')
})

test('a narrow pane keeps what needs you in the header, over the plan name', async ($, on) => {
  const files = { ...handBack(12), 'docs/plans/demo.md': PLAN.replace('# Plan: Demo', '# Plan: A rather long plan name') }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 42 } as never })
  expect(await pane.find({ type: 'Text', text: /^sprint 1\/1 · wave 1\/1 · waiting on you$/ })).toBeDefined()
})
