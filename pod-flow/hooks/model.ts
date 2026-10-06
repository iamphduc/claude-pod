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

/** The body rows of the first table whose first header cell is `first`. */
export function tableRows(md: string, first: string): string[][] {
  const lines = md.split(/\r?\n/)
  const at = lines.findIndex(
    line => isRow(line) && (cellsOf(line)[0] ?? '').toLowerCase() === first.toLowerCase(),
  )
  if (at < 0) return []
  const rows: string[][] = []
  for (const line of lines.slice(at + 2)) {
    if (!isRow(line)) break
    rows.push(cellsOf(line))
  }
  return rows
}

export function parsePlan(md: string, slug: string): PlanDoc {
  return {
    slug,
    title: /^#\s+(.+)$/m.exec(md)?.[1]?.replace(/^Plan:\s*/i, '') ?? slug,
    status: /Status:\s*(\w+)/.exec(md)?.[1] ?? 'active',
    sprints: tableRows(md, 'Sprint').map(([slug, goal, status]) => ({
      slug: slug ?? '',
      goal: goal ?? '',
      status: status ?? 'planned',
    })),
  }
}

export function parseSprint(md: string, isArchived: boolean): SprintDoc | undefined {
  const slug = /Slug:\s*([\w-]+)/.exec(md)?.[1]
  if (!slug) return undefined
  return {
    slug,
    plan: /From plan:\s*docs\/plans\/([\w-]+)\.md/.exec(md)?.[1] ?? '',
    isArchived,
    rows: tableRows(md, 'Wave').map(([wave, slice, title, branch, pr, status, confidence]) => ({
      wave: Number(wave) || 0,
      slice: slice ?? '',
      title: title ?? '',
      branch: branch ?? '',
      pr: pr ?? '—',
      status: status ?? 'pending',
      confidence: confidence ?? '—',
    })),
  }
}

/** The newest still-pending entry the orchestrator wrote: a halt waiting on the human. */
export function latestHalt(queue: string): string | undefined {
  const halts = queue.split(/\r?\n/).flatMap(line => {
    const m = /^-\s*`?\[([^\]]+)\]`?\s*(.*)$/.exec(line.trim())
    if (!m) return []
    const head = (m[1] ?? '').split('·').map(part => part.trim())
    const isOrchestrator = /^orchestrator\b/i.test(head[2] ?? '')
    const isPending = /\*\*Resolution:\*\*\s*pending/i.test(m[2] ?? '')
    if (!isOrchestrator || !isPending) return []
    return [(m[2] ?? '').replace(/\*\*Resolution:\*\*.*$/i, '').trim()]
  })
  return halts.at(-1)
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

const waveStatus = (rows: Row[], liveSlices: Set<string>): { status: string; tag?: string } => {
  const prs = rows.map(r => prState(r.pr))
  if (prs.some(p => p.state === 'skipped')) return { status: 'blocked', tag: 'skipped' }
  const open = prs.find(p => p.state === 'open')
  if (open) return { status: 'running', tag: open.number ? `PR #${open.number} open` : 'PR open' }
  if (rows.every(r => r.status === 'done' || /merged/i.test(r.pr))) return { status: 'done' }
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
  const blocked = lines.filter(l => l.status === 'blocked' && l.kind !== 'wave').length
  if (working > 0) parts.push(`${working} running`)
  if (blocked > 0) parts.push(`${blocked} blocked`)
  return parts.join(' · ')
}

/** A finished sprint with a board folds to its own line unless the person opened it. */
export function visibleLines(lines: TreeLine[], expanded: string[]): TreeLine[] {
  const folded = new Set(
    lines.filter(l => l.kind === 'sprint' && l.status === 'done' && l.detail && !expanded.includes(l.sprint ?? '')).map(l => l.sprint),
  )
  return lines.filter(l => l.kind === 'sprint' || !folded.has(l.sprint))
}

/** The branch drawing (`├─ `, `└─ `, `│  `) in front of each line. */
export function prefixes(lines: TreeLine[]): string[] {
  const hasLater: boolean[] = []
  return lines.map((line, i) => {
    if (line.depth === 0) return ''
    const after = lines.slice(i + 1).find(l => l.depth <= line.depth)
    const isLast = after?.depth !== line.depth
    hasLater[line.depth] = !isLast
    let stem = ''
    for (let d = 1; d < line.depth; d++) stem += hasLater[d] ? '│  ' : '   '
    return `${stem}${isLast ? '└─ ' : '├─ '}`
  })
}

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
  now?: number
  lastSeen?: Record<string, number>
}

export function buildTree({ plan, sprints, spawns, live, halt, now, lastSeen = {} }: TreeInput): TreeLine[] {
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
  const lines: TreeLine[] = [
    { depth: 0, kind: 'plan', text: plan.title, status: plan.status === 'archived' ? 'done' : 'running' },
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
      const doneCount = rows.filter(r => r.status === 'done').length
      const state = waveStatus(rows, liveSlices)
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
      note: [short(d?.description ?? '', 40), ageOf(agent)].filter(Boolean).join(' · ') || undefined,
    })
  }

  const haltText = halt?.replace(/^[\s—-]+|[\s—-]+$/g, '')
  if (haltText && running.length === 0) {
    lines.push({ depth: 1, kind: 'halt', text: 'waiting on you', status: 'blocked', note: haltText })
  }
  return lines
}
