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

const waveStatus = (rows: Row[], liveSlices: Set<string>) => {
  if (rows.every(r => r.status === 'done' || /merged/i.test(r.pr))) return 'done'
  if (rows.some(r => r.status === 'blocked')) return 'blocked'
  if (rows.some(r => liveSlices.has(r.slice) || r.status === 'pushed')) return 'running'
  return 'waiting'
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

export type TreeInput = {
  plan: PlanDoc
  sprints: SprintDoc[]
  spawns: Record<string, Dispatch>
  live: LiveAgent[]
  halt?: string
}

export function buildTree({ plan, sprints, spawns, live, halt }: TreeInput): TreeLine[] {
  const running = live.filter(a => a.status === 'running')
  const dispatchOf = (a: LiveAgent) => spawns[a.id]
  const codes = sprints.flatMap(s => s.rows.map(r => r.slice))
  const liveSlices = new Set(
    running.flatMap(a => {
      const slice = sliceOf(dispatchOf(a), codes)
      return slice ? [slice] : []
    }),
  )
  const lines: TreeLine[] = [
    { depth: 0, kind: 'plan', text: plan.title, status: plan.status === 'archived' ? 'done' : 'running' },
  ]

  for (const sprint of plan.sprints) {
    const doc = sprints.find(s => s.slug === sprint.slug)
    lines.push({
      depth: 1,
      kind: 'sprint',
      text: sprint.slug,
      status: sprint.status === 'done' ? 'done' : sprint.status === 'active' ? 'running' : 'waiting',
      note: short(sprint.goal, 48),
    })
    const waves = [...new Set((doc?.rows ?? []).map(r => r.wave))].sort((a, b) => a - b)
    for (const wave of waves) {
      const rows = doc!.rows.filter(r => r.wave === wave)
      const doneCount = rows.filter(r => r.status === 'done').length
      lines.push({
        depth: 2,
        kind: 'wave',
        text: `wave ${wave}`,
        status: waveStatus(rows, liveSlices),
        note: `${doneCount}/${rows.length} done`,
      })
      for (const row of rows) {
        const isLive = liveSlices.has(row.slice)
        lines.push({
          depth: 3,
          kind: 'slice',
          text: `${row.slice} ${short(row.title, 40)}`,
          status: isLive ? 'running' : (SLICE_STATUS[row.status] ?? row.status),
          note: row.confidence === '—' ? undefined : row.confidence,
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
      note: short(d?.description ?? '', 40) || undefined,
    })
  }

  const haltText = halt?.replace(/^[\s—-]+|[\s—-]+$/g, '')
  if (haltText && running.length === 0) {
    lines.push({ depth: 1, kind: 'halt', text: 'waiting on you', status: 'blocked', note: haltText })
  }
  return lines
}
