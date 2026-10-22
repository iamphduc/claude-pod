import { expect, mock, test } from 'claude-code/testing'

const PLAN = `# Plan: Demo

_Generated: 2026-10-01 · Status: active_

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| one | First | active | — |
`

const SPRINT = `# Sprint: One

_From plan: pod-docs/plans/demo.md · Slug: one · Status: active · Generated: 2026-10-01_

| Wave | Slice | Title | Branch | PR | Status | Confidence | Depends on |
|------|-------|-------|--------|----|--------|------------|------------|
| 1 | A1 | First slice | one-A1 | — | pending | — | — |
`

const docs = (): Record<string, string> => ({
  'pod-docs/plans/demo.md': PLAN,
  'pod-docs/sprints/one.md': SPRINT,
})

// The engine hands fs hooks an absolute path (on Windows, with backslashes): match on its end.
const endsAt = (path: string, rel: string) => path.replaceAll('\\', '/').endsWith(`/${rel}`)

// A test flips this to make the engine's agent list fail.
let isListBroken = false

// A root that is absolute on every platform; Windows adds its drive letter, so matching drops it.
const ROOT = '/proj'
const fromRoot = (path: string) => path.replaceAll('\\', '/').replace(/^[A-Za-z]:/, '')

const world = (on: Parameters<typeof mock.clock>[0], opened: string[], isPlaced = true, logged: string[] = [], files = docs(), isShown = isPlaced, agents: { id: string; type: string; status: string }[] = [], root = ROOT) => {
  const clock = mock.clock(on)
  on('session.root', () => ({ value: root }))
  // Docs live only in the main checkout, /proj: a worktree's copy is old, so here it has none.
  const isOutsideDocs = (path: string) => !/^\/proj\/(pod-)?docs\//.test(fromRoot(path))
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
  on('agent.list', () => {
    if (isListBroken) throw new Error('gone')
    return { value: agents as never }
  })
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
  return clock
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
  files['pod-docs/sprints/one.md'] = SPRINT.replace('| pending |', '| blocked |')
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect(logged).toEqual(['✗ BLOCKED · one · A1 First slice'])
})

test('a drawn pane keeps milestones out of the transcript', async ($, on) => {
  const logged: string[] = []
  const files = docs()
  world(on, [], true, logged, files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  files['pod-docs/sprints/one.md'] = SPRINT.replace('| pending |', '| blocked |')
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect(logged).toEqual([])
})

test('a pane behind another plugin pane counts as hidden', async ($, on) => {
  const logged: string[] = []
  const files = docs()
  world(on, [], true, logged, files, false)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  files['pod-docs/sprints/one.md'] = SPRINT.replace('| pending |', '| blocked |')
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
  const files = { ...docs(), 'pod-docs/handoff-queue.md': '- `[2026-10-06 · BLOCKED · orchestrator → human]` Gate 4: wave check failed **Resolution:** pending' }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 120 } as never })
  const hint = await pane.find({ type: 'Text', text: /➜ fix it first/ })
  expect(hint).toMatchObject({ props: { color: 'cyan' } })
  expect((hint as { props?: { dimColor?: boolean } }).props?.dimColor).toBeFalsy()
})

test('the pane opens with the questions waiting on you, above the sprints, and not dim', async ($, on) => {
  const queue = [
    '- `[2026-10-06 · PENDING · reviewer → human · plan: demo]` **Someday:** rename the helper. **Resolution:** pending',
    '- `[2026-10-06 · PENDING · engineer → human · plan: demo · sprint: one · slice: A1]` needs your decision: the input border. **Resolution:** pending',
  ].join('\n')
  world(on, [], true, [], { ...docs(), 'pod-docs/handoff-queue.md': queue })
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 120 } as never })
  expect(await pane.find({ type: 'Text', text: /^Demo · sprint 1\/1 · wave 1\/1 · 1 question$/ })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /^◐ needs you  1$/ })).toMatchObject({ props: { color: 'cyan' } })
  const question = await pane.find({ type: 'Text', text: /^└─ \? the input border\.  A1 · engineer$/ })
  expect(question).toMatchObject({ props: { color: 'cyan' } })
  expect((question as { props?: { dimColor?: boolean } }).props?.dimColor).toBeFalsy()
  expect(await pane.find({ type: 'Text', text: /rename the helper/ })).toBeUndefined()
  const drawn = JSON.stringify(await pane.drawn())
  expect(drawn.indexOf('needs you')).toBeLessThan(drawn.indexOf('● one'))
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

test("a new run on a new plan leaves out the last run's rounds and tokens, and a resume keeps them", async ($, on) => {
  const files = docs()
  world(on, [], true, [], files)
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  let next = 0
  on('agent.spawn', () => ({ agentId: `r${++next}`, model: 'claude-opus-5-5' }))
  on('turn.complete', () => ({ text: '' }))
  const usage = { input_tokens: 10, output_tokens: 200, cache_creation_input_tokens: 3000, cache_read_input_tokens: 0, model: 'm' }
  const review = async (prompt: string) => {
    await $.agent.spawn({ subagentType: 'pod:reviewer', description: 'Review plan', prompt } as never)
    await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer', agentId: `r${next}`, usage })
  }
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  await review('plan slug: demo · round: 1')
  // A resume of the same plan keeps its round.
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'continue' })
  await review('plan slug: demo · round: 2')
  expect((await run($, 'text')).text).toContain('review · 2 rounds')

  // The next plan, in the same session: the demo plan's reviews and tokens are not its.
  files['pod-docs/plans/demo.md'] = PLAN.replace('Status: active', 'Status: archived')
  files['pod-docs/plans/next.md'] = PLAN.replace('# Plan: Demo', '# Plan: Next')
  await $.skill.prompt({ skill: 'pod:ship', text: 'next idea' })
  expect((await run($, 'text')).text).not.toContain('review')
  await review('plan slug: next · round: 1')
  // A reviewer that names no plan, as /pod:fix sends: not a round of this plan's review.
  await review('kind: fix · round: 2')
  const { text } = await run($, 'text')
  expect(text).toContain('review · 1 round')
  // This run's two reviewers, 3.2k each; the fix review counts for the plan, not as a round.
  expect(text).toContain('Next · sprint 1/1 · 6.4k tokens')
})

test('a sprint-planner spawned during the run shows as drafting under its sprint', async ($, on) => {
  const files = { 'pod-docs/plans/demo.md': PLAN.replace('| one | First | active |', '| one | First | done |\n| two | Second | planned |') }
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
  world(on, [], true, [], docs(), true, [], `${ROOT}/.claude/worktrees/one-w1`)
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await run($, 'preview')
  expect((await run($, 'text')).text).toBe('Demo · sprint 1/1 · wave 1/1\n● one')
})

// A project from before docs version 2 keeps pod's files in docs/.
const oldLayout = (): Record<string, string> => ({
  'docs/plans/demo.md': PLAN,
  'docs/sprints/one.md': SPRINT.replace('From plan: pod-docs/plans', 'From plan: docs/plans'),
})

test('a project not upgraded yet still shows its tree from docs/', async ($, on) => {
  world(on, [], true, [], oldLayout())
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await run($, 'preview')
  expect((await run($, 'text')).text).toBe('Demo · sprint 1/1 · wave 1/1\n● one')
})

test('once pod-docs/ has a plan, the old docs/ copy is ignored', async ($, on) => {
  const old = Object.fromEntries(Object.entries(oldLayout()).map(([p, md]) => [p, md.replace('# Plan: Demo', '# Plan: Old')]))
  world(on, [], true, [], { ...old, ...docs() })
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await run($, 'preview')
  expect((await run($, 'text')).text).toBe('Demo · sprint 1/1 · wave 1/1\n● one')
})

const close = (files: Record<string, string>) => {
  // What a run's close-out leaves: the plan archived, its sprint done and moved to the archive.
  files['pod-docs/plans/demo.md'] = PLAN.replace('Status: active', 'Status: archived').replace('| one | First | active |', '| one | First | done |')
  files['pod-docs/sprints/archive/one.md'] = SPRINT.replace('Status: active', 'Status: archived').replace('| pending |', '| done |')
  delete files['pod-docs/sprints/one.md']
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
  expect((await run($, 'text')).text).toBe('Plan finished. Waiting for the next run.')
})

test('starting a new run clears the tree of the plan the last run finished', async ($, on) => {
  const files = docs()
  world(on, [], true, [], files)
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  close(files)
  await $.skill.prompt({ skill: 'pod:ship', text: 'next idea' })
  expect((await run($, 'text')).text).toBe('Plan finished. Waiting for the next run.')
})

test('a narrow pane shows the whole hand-back label, waiting', async ($, on) => {
  const files = { ...docs(), 'pod-docs/handoff-queue.md': '- `[2026-10-09 · PENDING · orchestrator → human · plan: demo]` plan demo complete — final PR https://github.com/me/demo/pull/8, review pass **Resolution:** pending' }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 42 } as never })
  expect(await pane.find({ type: 'Text', text: /◐ waiting {2}plan demo/ })).toBeDefined()
})

const handBack = (pull: number) => ({
  ...docs(),
  'pod-docs/handoff-queue.md': `- \`[2026-10-09 · PENDING · orchestrator → human · plan: demo]\` plan demo complete — final PR https://github.com/me/demo/pull/${pull}, review pass **Resolution:** pending`,
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
  // Two trees, sprint one and the hand-back: a gap over each. Run app has a divider instead, and a gap below.
  const drawn = JSON.stringify(await pane.drawn())
  expect(drawn.match(/"marginTop":1/g) ?? []).toHaveLength(2)
  expect(await pane.find({ type: 'Text', text: /^─{20,}$/ })).toMatchObject({ props: { dimColor: true } })
  expect(drawn.match(/"marginBottom":1/g) ?? []).toHaveLength(1)
})

test("a new plan's tree leaves out the last plan's hand-back", async ($, on) => {
  const files = { ...docs(), 'pod-docs/handoff-queue.md': handBack(7)['pod-docs/handoff-queue.md']!.replace('plan: demo', 'plan: older').replace('plan demo', 'plan older') }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const text = (await run($, 'text')).text
  expect(text).not.toContain('waiting')
  expect(text).not.toContain('PR #7')
})

test('a narrow pane keeps what needs you in the header, over the plan name', async ($, on) => {
  const files = { ...handBack(12), 'pod-docs/plans/demo.md': PLAN.replace('# Plan: Demo', '# Plan: A rather long plan name') }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 42 } as never })
  expect(await pane.find({ type: 'Text', text: /^sprint 1\/1 · wave 1\/1 · waiting on you$/ })).toBeDefined()
})

test('with no tree, the pane and the text say why', async ($, on) => {
  const files: Record<string, string> = {}
  world(on, [], true, [], files)
  on('session.surfaces', () => ({ value: ['terminal' as const] }))
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  expect((await run($, 'text')).text).toBe('No plan in pod-docs/plans yet.')
  // A plan still being written has no sprint table yet.
  files['pod-docs/plans/demo.md'] = '# Plan: Demo\n\n_Generated: 2026-10-10 · Status: active_\n'
  expect((await run($, 'text')).text).toBe('Plan has no sprints yet.')
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 80 } as never })
  expect(await pane.find({ type: 'Text', text: 'Plan has no sprints yet.' })).toBeDefined()
})

test('a finished wave in a running sprint draws folded, as a button', async ($, on) => {
  const files = { ...docs(), 'pod-docs/sprints/one.md': `${SPRINT}| 2 | A2 | Second slice | one-A2 | — | pending | — | A1 |\n`.replace('| one-A1 | — | pending | — |', '| one-A1 | merged | done | high |') }
  world(on, [], true, [], files)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 80 } as never })
  expect(await pane.find({ type: 'Button', text: /^├─ ▸ wave 1 {2}1 slice$/ })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /A1 First slice/ })).toBeUndefined()
  expect(await pane.find({ type: 'Text', text: /A2 Second slice/ })).toBeDefined()
})

test('at the hand-back, Run app sends your reply and turns into Stop app, and each changed feature ticks', async ($, on) => {
  const diff = [
    'diff --git a/pod-docs/features.md b/pod-docs/features.md',
    '+++ b/pod-docs/features.md',
    '+| Saved keys | Settings → API keys | save, reload | the key reads back masked |',
  ].join('\n')
  const asked: string[] = []
  const sent: { text: string; asUser?: boolean }[] = []
  world(on, [], true, [], handBack(12))
  on('process.run', (_$, e) => {
    asked.push(e.argv.slice(0, 3).join(' '))
    const isDiff = e.argv[2] === 'diff'
    return { value: { exitCode: 0, stdout: isDiff ? diff : 'OPEN\n', stderr: '' } as never }
  })
  on('prompt.submit', (_$, e) => {
    sent.push({ text: e.text, asUser: (e.origin as { asUser?: boolean } | undefined)?.asUser })
    return { text: e.text } as never
  })
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  // The diff is read once per PR, beside the merge check.
  await run($, 'text')
  expect(asked.filter(a => a === 'gh pr diff')).toHaveLength(1)
  const pane = await $.ui.mount({ plugin: 'pod-flow', surface: 'terminal', component: 'Pane', requestId: 'pod-flow', props: { bodyColumns: 100 } as never })
  // A primary button, not a plain row; each feature whole on its line, how to reach it below, wrapped.
  expect(await pane.find({ type: 'Button', text: /^Run app$/ })).toMatchObject({ props: { variant: 'primary' } })
  expect(await pane.find({ type: 'Text', text: /^ {2}then check these \(0\/1\):$/ })).toBeDefined()
  // A plain list, no tree lines.
  expect(await pane.find({ type: 'Button', text: /^☐ Saved keys$/ })).toBeDefined()
  expect(await pane.find({ type: 'Text', text: /^Settings → API keys$/ })).toMatchObject({ props: { wrap: 'wrap' } })

  await pane.press({ key: 'run-app' })
  expect(sent).toEqual([{ text: 'run app', asUser: true }])
  expect(await pane.find({ type: 'Button', text: /^Stop app$/ })).toBeDefined()
  await pane.press({ key: 'run-app' })
  expect(sent.at(-1)).toEqual({ text: 'stop app', asUser: true })
  expect(await pane.find({ type: 'Button', text: /^Run app$/ })).toBeDefined()

  // The last tick folds the list; pressing the fold opens it again.
  await pane.press({ key: 'check:Saved keys' })
  expect(await pane.find({ type: 'Button', text: /^Saved keys/ })).toBeUndefined()
  expect(await pane.find({ type: 'Button', text: /^▸ ✓ all 1 checked$/ })).toBeDefined()
  await pane.press({ key: 'checks' })
  expect(await pane.find({ type: 'Button', text: /^▾ ✓ all 1 checked$/ })).toBeDefined()
  expect(await pane.find({ type: 'Button', text: /^☑ Saved keys$/ })).toBeDefined()
  // A tick is yours alone: nothing goes to the chat.
  expect(sent).toHaveLength(2)
})

test('the merge brings one soft reminder of the important checks left; continue after it folds the hand-back to one line', async ($, on) => {
  // A new feature (important) and a changed one (not).
  const diff = 'diff --git a/pod-docs/features.md b/pod-docs/features.md\n-| Sign in | /login | post | cookie |\n+| Sign in | /login or a link | post | cookie |\n+| Saved keys | Settings | save | masked |'
  const logged: string[] = []
  let state = 'OPEN'
  const clock = world(on, [], true, logged, handBack(14))
  on('process.run', (_$, e) => ({ value: { exitCode: 0, stdout: e.argv[2] === 'diff' ? diff : `${state}\n`, stderr: '' } as never }))
  // Core takes the prompt as typed.
  on('prompt.submit', (_$, e) => ({ text: e.text }) as never)
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  await run($, 'text')

  // Before the merge, continue changes nothing and says nothing.
  expect((await $.prompt.submit({ text: 'continue' } as never)).text).toBe('continue')
  expect((await run($, 'text')).text).toContain('☐ Saved keys')
  expect(logged).toEqual([])

  // The merge is seen on the next check: one line, for the important check only.
  state = 'MERGED'
  await clock.advance(31_000)
  await run($, 'text')
  expect(logged).toEqual(['☐ Merged with 1 important check not ticked: Saved keys.'])
  await run($, 'text')
  expect(logged).toHaveLength(1)

  // Continue after the merge: the hand-back part is one line, and your reply goes through as typed.
  expect((await $.prompt.submit({ text: 'continue' } as never)).text).toBe('continue')
  const { text } = await run($, 'text')
  expect(text).toContain('✓ plan done · checked 0/2')
  expect(text).not.toContain('Run app')
})

test('the first /pod-flow text already has the checklist, as under -p, where there is no second call', async ($, on) => {
  const diff = 'diff --git a/pod-docs/features.md b/pod-docs/features.md\n+| Saved keys | Settings → API keys | save | masked |'
  world(on, [], true, [], handBack(13))
  // No surface draws, as under -p.
  on('session.surfaces', () => ({ value: [] }))
  // gh answers after the refresh that asked it has drawn the tree.
  on('process.run', (_$, e) => {
    return { value: { exitCode: 0, stdout: e.argv[2] === 'diff' ? diff : 'OPEN\n', stderr: '' } as never }
  })
  const { text } = await run($, 'preview')
  expect(text).toContain("○ Run app  reply 'run app'")
  expect(text).toContain('\n☐ Saved keys\n  Settings → API keys')
})

test('a failing engine call during refresh leaves the tree as it was', async ($, on) => {
  isListBroken = false
  world(on, [])
  await $.skill.prompt({ skill: 'pod:autopilot', text: 'run' })
  isListBroken = true
  try {
    const { text } = await run($, 'text')
    expect(text).toContain('one')
  } finally {
    isListBroken = false
  }
})
