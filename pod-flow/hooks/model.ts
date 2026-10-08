import type { Dispatch, TreeLine } from '../types'

export type Row = {
  wave: number
  slice: string
  title: string
  branch: string
  pr: string
  status: string
  confidence: string
}

export type SprintDoc = { slug: string; plan: string; isArchived: boolean; rows: Row[] }

export type PlanDoc = {
  slug: string
  title: string
  status: string
  sprints: { slug: string; goal: string; status: string }[]
}

export type LiveAgent = { id: string; type: string; status: string }

const cellsOf = (line: string) =>
  line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim())

const isRow = (line: string) => /^\s*\|/.test(line)

/** The header cells and body rows of the first table whose first header cell is `first`. */
export function readTable(md: string, first: string): { headers: string[]; rows: string[][] } {
  const lines = md.split(/\r?\n/)
  const at = lines.findIndex(
    line => isRow(line) && (cellsOf(line)[0] ?? '').toLowerCase() === first.toLowerCase(),
  )
  if (at < 0) return { headers: [], rows: [] }
  const rows: string[][] = []
  for (const line of lines.slice(at + 2)) {
    if (!isRow(line)) break
    rows.push(cellsOf(line))
  }
  return { headers: cellsOf(lines[at] ?? '').map(h => h.toLowerCase()), rows }
}

/** The body rows of the first table whose first header cell is `first`. */
export function tableRows(md: string, first: string): string[][] {
  return readTable(md, first).rows
}

/** A row's cell by header name; a column the table lacks reads as `fallback`. */
const cellBy = (headers: string[], row: string[], name: string, fallback = '') => {
  const at = headers.indexOf(name)
  return at < 0 ? fallback : (row[at] ?? fallback)
}

function sprintRows(md: string): PlanDoc['sprints'] {
  const { headers, rows } = readTable(md, 'Sprint')
  return rows.map(row => ({
    slug: cellBy(headers, row, 'sprint'),
    goal: cellBy(headers, row, 'goal'),
    status: cellBy(headers, row, 'status', 'planned'),
  }))
}

export function parsePlan(md: string, slug: string): PlanDoc {
  return {
    slug,
    title: /^#\s+(.+)$/m.exec(md)?.[1]?.replace(/^Plan:\s*/i, '') ?? slug,
    status: /Status:\s*(\w+)/.exec(md)?.[1] ?? 'active',
    sprints: sprintRows(md),
  }
}

const STATUS_WORDS = ['pending', 'pushed', 'done', 'merged', 'blocked']

/** The status in a cell, even when a PR link sits in front of it (`[#225](…) merged`). */
const statusWord = (cell: string) => {
  const words = cell.toLowerCase().split(/[^a-z]+/).filter(w => STATUS_WORDS.includes(w))
  return words.at(-1) ?? cell
}

function boardRows(md: string): Row[] {
  const { headers, rows } = readTable(md, 'Wave')
  return rows.map(row => ({
    wave: Number(cellBy(headers, row, 'wave')) || 0,
    slice: cellBy(headers, row, 'slice'),
    title: cellBy(headers, row, 'title'),
    branch: cellBy(headers, row, 'branch'),
    pr: cellBy(headers, row, 'pr', '—'),
    status: statusWord(cellBy(headers, row, 'status', 'pending')),
    confidence: cellBy(headers, row, 'confidence', '—'),
  }))
}

/** `fileSlug` stands in for older sprint docs that have no `Slug:` header. */
export function parseSprint(md: string, isArchived: boolean, fileSlug?: string): SprintDoc | undefined {
  const slug = /Slug:\s*([\w-]+)/.exec(md)?.[1] ?? fileSlug
  if (!slug) return undefined
  return {
    slug,
    plan: /From plan:\s*docs\/plans\/([\w-]+)\.md/.exec(md)?.[1] ?? '',
    isArchived,
    rows: boardRows(md),
  }
}

/** The newest still-pending entry the orchestrator wrote: a halt waiting on the human, and its queue type. */
export function latestHalt(queue: string): { body: string; type: string } | undefined {
  const halt = parseQueue(queue).filter(e => e.isPending && /^orchestrator\b/i.test(e.route)).at(-1)
  return halt && { body: halt.body, type: halt.type }
}

/** What to do after a halt: a BLOCKED gate needs a fix first, a PENDING one only a resume (skills/autopilot/policy.md). */
export const resumeHint = (type: string | undefined): string[] =>
  type === 'BLOCKED' ? ['fix it first', 'then /pod:autopilot to resume'] : ['/pod:autopilot to resume']

export type QueueEntry = {
  type: string
  route: string
  sprint?: string
  slice?: string
  body: string
  isPending: boolean
}

/** The entries of the handoff queue: `- [date · TYPE · from → to · sprint: x · slice: y] body **Resolution:** …`. */
export function parseQueue(queue: string): QueueEntry[] {
  return queue.split(/\r?\n/).flatMap(line => {
    const m = /^-\s*`?\[([^\]]+)\]`?\s*(.*)$/.exec(line.trim())
    if (!m) return []
    const head = (m[1] ?? '').split('·').map(part => part.trim())
    const field = (name: string) => head.find(h => h.toLowerCase().startsWith(`${name}:`))?.slice(name.length + 1).trim()
    const rest = m[2] ?? ''
    return [
      {
        type: (head[1] ?? '').toUpperCase(),
        route: head[2] ?? '',
        sprint: field('sprint'),
        slice: field('slice'),
        body: rest.replace(/\*\*Resolution:\*\*.*$/i, '').trim(),
        isPending: /\*\*Resolution:\*\*\s*pending/i.test(rest),
      },
    ]
  })
}

/** An entry's first sentence as plain text: no bold, code ticks or link syntax. */
export function concernText(body: string): string {
  const plain = body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/^\s*(someday|fix next|needs your decision|before hosting)\s*:\s*/i, '')
    .trim()
  return plain.split(/(?<=[.!?])\s/)[0] ?? plain
}

const MAX_CONCERNS = 2

/**
 * The still-pending entries worth showing under a slice: the newest few. A finished slice shows
 * only a BLOCKED one, since the rest of its queue is notes that never get resolved.
 */
export function concernsFor(entries: QueueEntry[], sprint: string, row: Row): QueueEntry[] {
  const finished = isDone(row)
  return entries
    .filter(e => e.isPending && e.slice === row.slice && (!e.sprint || e.sprint === sprint))
    .filter(e => e.type !== 'SOLVED' && (!finished || e.type === 'BLOCKED'))
    .slice(-MAX_CONCERNS)
}

/** What an engineer's dispatch prompt says about where it works. */
export function parseDispatch(prompt: string): Pick<Dispatch, 'sprint' | 'slice' | 'branch'> {
  const field = (name: string) =>
    new RegExp(`${name}\\W{0,4}[:=]\\s*\`?([\\w.-]+)`, 'i').exec(prompt)?.[1]
  return {
    sprint: field('sprint slug'),
    slice: field('slice code'),
    branch: field('branch(?: name)?'),
  }
}

/** The board slice an agent works on: its prompt's slice code, else a code named in its description or branch. */
export function sliceOf(d: Dispatch | undefined, codes: string[]): string | undefined {
  if (!d) return undefined
  if (d.slice && codes.includes(d.slice)) return d.slice
  const words = `${d.description} ${d.branch ?? ''}`.toLowerCase().split(/[\s,;:()[\]"'`-]+/)
  return codes.find(code => words.includes(code.toLowerCase()))
}

const SLICE_STATUS: Record<string, string> = {
  pending: 'waiting',
  pushed: 'pushed',
  done: 'done',
  merged: 'done',
  blocked: 'blocked',
}

/** What a board's PR cell says: nothing yet, a wave PR open, merged, skipped, or blocked. */
export function prState(pr: string): { state: 'none' | 'open' | 'merged' | 'skipped' | 'blocked'; number?: string } {
  if (/merged/i.test(pr)) return { state: 'merged' }
  if (/skipped/i.test(pr)) return { state: 'skipped' }
  if (/blocked/i.test(pr)) return { state: 'blocked' }
  if (/https?:\/\//i.test(pr)) return { state: 'open', number: /\/pull\/(\d+)/.exec(pr)?.[1] }
  return { state: 'none' }
}

/** A slice is finished when its status says so, or its PR cell says merged. */
export const isDone = (row: Row) =>
  row.status === 'done' || row.status === 'merged' || prState(row.pr).state === 'merged'

/**
 * A link on a finished slice is its wave's PR. It is merged once the wave is settled (the sprint is
 * archived, or a later wave has started); before that the PR may still be open.
 */
const waveStatus = (rows: Row[], liveSlices: Set<string>, isSettled: boolean): { status: string; tag?: string } => {
  const prs = rows.map(r => {
    if (r.status === 'merged' || prState(r.pr).state === 'merged') return { state: 'merged' as const }
    if (r.status === 'done' && isSettled) return { state: 'merged' as const }
    return prState(r.pr)
  })
  if (prs.some(p => p.state === 'skipped')) return { status: 'blocked', tag: 'skipped' }
  const open = prs.find(p => p.state === 'open')
  if (open) return { status: 'running', tag: open.number ? `PR #${open.number} open` : 'PR open' }
  if (rows.every(isDone)) return { status: 'done' }
  if (rows.some(r => r.status === 'blocked')) return { status: 'blocked' }
  if (rows.some(r => liveSlices.has(r.slice) || r.status === 'pushed')) return { status: 'running' }
  return { status: 'waiting' }
}

const short = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/** One line of overall progress: where the run is, and what needs a look. */
export function summarize(lines: TreeLine[]): string {
  const sprints = lines.filter(l => l.kind === 'sprint')
  if (sprints.length === 0) return ''
  const doneSprints = sprints.filter(l => l.status === 'done').length
  const active = lines.findIndex(l => l.kind === 'sprint' && l.status === 'running')
  const parts: string[] = []
  if (doneSprints === sprints.length) {
    parts.push('all sprints done')
  } else {
    parts.push(`sprint ${Math.min(doneSprints + 1, sprints.length)}/${sprints.length}`)
    if (active >= 0) {
      const rest = lines.slice(active + 1)
      const end = rest.findIndex(l => l.kind === 'sprint')
      const waves = (end < 0 ? rest : rest.slice(0, end)).filter(l => l.kind === 'wave')
      const doneWaves = waves.filter(l => l.status === 'done').length
      if (waves.length > 0) parts.push(`wave ${Math.min(doneWaves + 1, waves.length)}/${waves.length}`)
    }
  }
  const working = lines.filter(l => (l.kind === 'slice' || l.kind === 'agent') && l.status === 'running').length
  const blocked = lines.filter(l => l.status === 'blocked' && l.kind !== 'wave' && l.kind !== 'concern').length
  if (working > 0) parts.push(`${working} running`)
  if (blocked > 0) parts.push(`${blocked} blocked`)
  if (lines.some(l => l.kind === 'halt' && l.status === 'pushed')) parts.push('waiting on you')
  return parts.join(' · ')
}

/** The symbol for each status, shared by the tree and the transcript lines. */
export const GLYPH: Record<string, string> = { running: '●', pushed: '◐', done: '✓', blocked: '✗', waiting: '○' }

/**
 * The run's turning points in the tree: a wave opens its PR, finishes or is skipped, a slice is blocked,
 * a sprint or the plan finishes, the run stops. Keyed so each is told once; the text leads with the tree's symbol,
 * and what needs the person (blocked, skipped, halted, waiting on you) leads with that in capitals.
 */
export function milestones(lines: TreeLine[]): Map<string, string> {
  const found = new Map<string, string>()
  const sprintCount = lines.filter(l => l.kind === 'sprint').length
  let sprintNumber = 0
  for (const [i, line] of lines.entries()) {
    const where = `${line.sprint} · ${line.text}`
    if (line.kind === 'plan' && line.status === 'done') found.set('plan', `${GLYPH.done} plan ${line.text} done`)
    if (line.kind === 'sprint') {
      sprintNumber++
      if (line.status === 'done') found.set(`sprint ${line.text}`, `${GLYPH.done} sprint ${line.text} done (${sprintNumber}/${sprintCount})`)
    }
    if (line.kind === 'wave') {
      const pr = /PR (#\d+ )?open/.exec(line.note ?? '')?.[0]
      if (pr) found.set(`${where} ${pr}`, `${GLYPH.pushed} ${where} · ${pr}`)
      if (line.status === 'done') found.set(`${where} done`, `${GLYPH.done} ${where} done`)
      if (line.status === 'blocked' && line.note?.includes('skipped')) found.set(`${where} skipped`, `${GLYPH.blocked} SKIPPED · ${where}`)
    }
    if (line.kind === 'slice' && line.status === 'blocked') found.set(`${where} blocked`, `${GLYPH.blocked} BLOCKED · ${where}`)
    if (line.kind === 'halt') {
      // The action leads, so the line says what to do before why.
      const after = lines.slice(i + 1)
      const end = after.findIndex(l => l.kind !== 'hint')
      const hint = (end < 0 ? after : after.slice(0, end)).map(l => l.text).join(', ')
      found.set(`halt ${line.note}`, [`${GLYPH[line.status]} ${line.text.toUpperCase()}`, hint, line.note].filter(Boolean).join(' · '))
    }
  }
  return found
}

/** A finished sprint with a board folds to its own line unless the person opened it. */
export function visibleLines(lines: TreeLine[], expanded: string[]): TreeLine[] {
  const folded = new Set(
    lines.filter(l => l.kind === 'sprint' && l.status === 'done' && l.detail && !expanded.includes(l.sprint ?? '')).map(l => l.sprint),
  )
  return lines.filter(l => l.kind === 'sprint' || !folded.has(l.sprint))
}

const MIN_HEAD = 16

/**
 * One row's text in `width` cells. A long name gives way with `…` and the note after it stays
 * whole; when the note is long too, the name keeps its room and the note loses its end.
 */
export function fit(head: string, note: string | undefined, width: number): string {
  const tail = note ? `  ${note}` : ''
  if (head.length + tail.length <= width) return `${head}${tail}`
  const room = width - tail.length
  if (room >= MIN_HEAD) return `${head.slice(0, room - 1)}…${tail}`
  const shortHead = head.length > MIN_HEAD ? `${head.slice(0, MIN_HEAD - 1)}…` : head
  const noteRoom = width - shortHead.length - 2
  if (!note || noteRoom < 4) return `${head}${tail}`.slice(0, Math.max(0, width - 1)) + '…'
  return `${shortHead}  ${note.slice(0, noteRoom - 1)}…`
}

/** The branch drawing (`├─ `, `└─ `, `│  `) in front of each line. */
export function prefixes(lines: TreeLine[]): string[] {
  const hasLater: boolean[] = []
  const stems: string[] = []
  return lines.map((line, i) => {
    if (line.depth === 0) return ''
    // A continued row keeps the row above's stem, with its branch turned into a plain rail.
    if (line.isContinued) return (stems[i] = (stems[i - 1] ?? '').replace('└─ ', '   ').replace('├─ ', '│  '))
    const after = lines.slice(i + 1).find(l => l.depth <= line.depth && !l.isContinued)
    const isLast = after?.depth !== line.depth
    hasLater[line.depth] = !isLast
    let stem = ''
    for (let d = 1; d < line.depth; d++) stem += hasLater[d] ? '│  ' : '   '
    return (stems[i] = `${stem}${isLast ? '└─ ' : '├─ '}`)
  })
}

const HAND_BACK = /(complete|final PR|hand-?back|awaiting)/i

export const QUIET_MS = 2 * 60 * 1000

/** `45s`, `3m`, `1h05m`. */
export function formatAge(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}m`
}

/** How long an agent has run, and how long it has been silent once that passes QUIET_MS. */
export function ageNote(startedAt: number | undefined, lastAt: number | undefined, now: number | undefined): string | undefined {
  if (startedAt === undefined || now === undefined) return undefined
  const note = formatAge(now - startedAt)
  const silent = now - (lastAt ?? startedAt)
  return silent >= QUIET_MS ? `${note} · quiet ${formatAge(silent)}` : note
}

export type TreeInput = {
  plan: PlanDoc
  sprints: SprintDoc[]
  spawns: Record<string, Dispatch>
  live: LiveAgent[]
  halt?: string
  haltType?: string
  now?: number
  queue?: QueueEntry[]
  lastSeen?: Record<string, number>
}

export function buildTree({ plan, sprints, spawns, live, halt, haltType, now, lastSeen = {}, queue = [] }: TreeInput): TreeLine[] {
  const running = live.filter(a => a.status === 'running')
  const dispatchOf = (a: LiveAgent) => spawns[a.id]
  const codes = sprints.flatMap(s => s.rows.map(r => r.slice))
  const agentOfSlice = new Map<string, LiveAgent>()
  for (const a of running) {
    const slice = sliceOf(dispatchOf(a), codes)
    if (slice) agentOfSlice.set(slice, a)
  }
  const liveSlices = new Set(agentOfSlice.keys())
  const ageOf = (a: LiveAgent | undefined) =>
    a ? ageNote(dispatchOf(a)?.startedAt, lastSeen[a.id], now) : undefined
  const isPlanDone =
    plan.status === 'archived' ||
    (plan.sprints.length > 0 && plan.sprints.every(s => s.status === 'done') && running.length === 0)
  const lines: TreeLine[] = [
    { depth: 0, kind: 'plan', text: plan.title, status: isPlanDone ? 'done' : 'running' },
  ]

  for (const sprint of plan.sprints) {
    const doc = sprints.find(s => s.slug === sprint.slug)
    const waves = [...new Set((doc?.rows ?? []).map(r => r.wave))].sort((a, b) => a - b)
    const slices = doc?.rows.length ?? 0
    lines.push({
      depth: 1,
      kind: 'sprint',
      text: sprint.slug,
      status: sprint.status === 'done' ? 'done' : sprint.status === 'active' ? 'running' : 'waiting',
      note: short(sprint.goal, 48),
      sprint: sprint.slug,
      detail: doc ? `${waves.length} ${waves.length === 1 ? 'wave' : 'waves'} · ${slices} ${slices === 1 ? 'slice' : 'slices'}` : undefined,
    })
    for (const wave of waves) {
      const rows = doc!.rows.filter(r => r.wave === wave)
      const doneCount = rows.filter(isDone).length
      const later = doc!.rows.filter(r => r.wave > wave)
      const isSettled = doc!.isArchived || later.some(r => r.status !== 'pending' || liveSlices.has(r.slice))
      const state = waveStatus(rows, liveSlices, isSettled)
      lines.push({
        depth: 2,
        kind: 'wave',
        text: `wave ${wave}`,
        status: state.status,
        note: [state.tag, `${doneCount}/${rows.length} done`].filter(Boolean).join(' · '),
        sprint: sprint.slug,
      })
      for (const row of rows) {
        const isLive = liveSlices.has(row.slice)
        lines.push({
          depth: 3,
          kind: 'slice',
          text: `${row.slice} ${short(row.title, 40)}`,
          status: isLive ? 'running' : (SLICE_STATUS[row.status] ?? row.status),
          note: isLive ? ageOf(agentOfSlice.get(row.slice)) : row.confidence === '—' ? undefined : row.confidence,
          sprint: sprint.slug,
        })
        for (const entry of concernsFor(queue, sprint.slug, row)) {
          lines.push({
            depth: 4,
            kind: 'concern',
            text: short(concernText(entry.body), 80),
            status: entry.type === 'BLOCKED' ? 'blocked' : 'waiting',
            sprint: sprint.slug,
          })
        }
      }
    }
  }

  // Agents that match no slice (the planner, the reviewer, the reporter).
  for (const agent of running) {
    const d = dispatchOf(agent)
    if (sliceOf(d, codes)) continue
    lines.push({
      depth: 1,
      kind: 'agent',
      text: (d?.type ?? agent.type).replace(/^pod:/, ''),
      status: 'running',
      note: [ageOf(agent), short(d?.description ?? '', 40)].filter(Boolean).join(' · ') || undefined,
    })
  }

  const haltText = halt?.replace(/^[\s—-]+|[\s—-]+$/g, '')
  if (haltText && running.length === 0) {
    // A finished plan's final PR is a hand-back for you to merge, not a failure.
    const isHandBack = HAND_BACK.test(haltText)
    lines.push({
      depth: 1,
      kind: 'halt',
      text: isHandBack ? 'waiting on you' : 'halted',
      status: isHandBack ? 'pushed' : 'blocked',
      note: haltText,
    })
    // On lines of their own, short enough for a narrow pane, so a long reason never hides them.
    if (!isHandBack) {
      resumeHint(haltType).forEach((text, n) => lines.push({ depth: 2, kind: 'hint', text, status: 'waiting', isContinued: n > 0 }))
    }
  }
  return lines
}
