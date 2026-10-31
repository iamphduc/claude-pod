import type { ModelUsage } from 'claude-code'

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
    status: cellBy(headers, row, 'status', 'planned').toLowerCase(),
  }))
}

export function parsePlan(md: string, slug: string): PlanDoc {
  return {
    slug,
    title: /^#\s+(.+)$/m.exec(md)?.[1]?.replace(/^Plan:\s*/i, '') ?? slug,
    // Letters only: a header that ends on its status (`· Status: archived_`) keeps the italic's `_` out.
    status: (/Status:\s*([A-Za-z]+)/.exec(md)?.[1] ?? 'active').toLowerCase(),
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
    plan: /From plan:\s*(?:pod-)?docs\/plans\/([\w-]+)\.md/.exec(md)?.[1] ?? '',
    isArchived,
    rows: boardRows(md),
  }
}

/** A halt entry names its gate, by number or by name (the gate table in skills/autopilot/policy.md). */
const GATE = /\bgate\s*\d|blocked-concern|plan-review-fail|auto-merge-fail|inter-wave-verify|safety-bound|escalation-valve|plan-complete/i

/**
 * The newest still-pending halt the orchestrator wrote, and its queue type: an entry that names a gate,
 * or the plan-complete hand-back. Its other pending notes (a "someday" idea) don't stop the run.
 */
export function latestHalt(queue: string, plan?: PlanDoc): { body: string; type: string } | undefined {
  const halt = parseQueue(queue)
    .filter(isHalt)
    .filter(e => !plan || isForPlan(e, plan))
    .at(-1)
  return halt && { body: halt.body, type: halt.type }
}

const isHalt = (e: QueueEntry) => e.isPending && /^orchestrator\b/i.test(e.route) && (GATE.test(e.body) || HAND_BACK.test(e.body))

/** What only the person can answer: a BLOCKED entry, or a decision, product choice or one-way door, by how the body opens. */
const ASKS = /^[^:]{0,40}\b(decision|product choice)\b|^one-way door/i

/** The pending entries to the human that ask something of them, the halt aside (it has its own line). Most are notes. */
export function questionsFor(entries: QueueEntry[], plan: PlanDoc): QueueEntry[] {
  return entries.filter(
    e =>
      e.isPending &&
      /→\s*human\b/i.test(e.route) &&
      isForPlan(e, plan) &&
      !isHalt(e) &&
      (e.type === 'BLOCKED' || (e.type === 'PENDING' && ASKS.test(e.body.replace(/[*`]/g, '').trim()))),
  )
}

/**
 * Whether an entry belongs to this plan, by its `plan:` or else its `sprint:`. A finished plan's hand-back stays
 * pending in the queue, so without this the next plan's tree shows it. An entry naming neither is kept.
 */
const isForPlan = (entry: QueueEntry, plan: PlanDoc) =>
  entry.plan ? entry.plan === plan.slug : entry.sprint ? plan.sprints.some(s => s.slug === entry.sprint) : true

/** What to do after a halt: a BLOCKED gate needs a fix first, a PENDING one only a resume (skills/autopilot/policy.md). */
export const resumeHint = (type: string | undefined): string[] =>
  type === 'BLOCKED' ? ['fix it first', 'then /pod:autopilot to resume'] : ['/pod:autopilot to resume']

export type QueueEntry = {
  type: string
  route: string
  plan?: string
  sprint?: string
  slice?: string
  body: string
  isPending: boolean
  resolution?: string
  /** What the human wrote back from Pod Board: ` **Answer (human):** <text>`, after the Resolution. */
  answer?: string
}

/** Pod Board's answer marker. Counted only after `**Resolution:**`, so one quoted in a body is not an answer. */
const ANSWER = /\s*\*\*Answer \(human\):\*\*\s*(.*)$/i

/** The entries of the handoff queue: `- [date · TYPE · from → to · sprint: x · slice: y] body **Resolution:** …`. */
export function parseQueue(queue: string): QueueEntry[] {
  return queue.split(/\r?\n/).flatMap(line => {
    const m = /^-\s*`?\[([^\]]+)\]`?\s*(.*)$/.exec(line.trim())
    if (!m) return []
    const head = (m[1] ?? '').split('·').map(part => part.trim())
    const field = (name: string) => head.find(h => h.toLowerCase().startsWith(`${name}:`))?.slice(name.length + 1).trim()
    const rest = m[2] ?? ''
    const settled = /\*\*Resolution:\*\*(.*)$/i.exec(rest)?.[1] ?? ''
    const answer = ANSWER.exec(settled)?.[1]?.trim()
    const resolution = settled.replace(ANSWER, '')
    return [
      {
        type: (head[1] ?? '').toUpperCase(),
        route: head[2] ?? '',
        plan: field('plan'),
        sprint: field('sprint'),
        slice: field('slice'),
        body: rest.replace(/\*\*Resolution:\*\*.*$/i, '').trim(),
        isPending: /^\s*pending/i.test(resolution),
        // What it was settled with, its date left off: `default recorded: 1px grey; override anytime`.
        resolution: /^\s*(?:\d{4}-\d\d-\d\d\s*[—-]\s*)?(.*)$/.exec(resolution)?.[1]?.trim() || undefined,
        answer: answer || undefined,
      },
    ]
  })
}

/** An entry's first sentence as plain text: no bold, code ticks or link syntax. */
export function concernText(body: string): string {
  const plain = body
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*`]/g, '')
    // A leading label, such as `Someday:`, `needs your decision:` or `now (product choice):`.
    .replace(/^\s*(someday|fix next|needs your decision|decision|before hosting|now)\s*(\([^)]*\))?\s*:\s*/i, '')
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

/** The repo a path sits in: a worktree under `.claude/worktrees/` gives the checkout above it. */
export const mainCheckout = (dir: string) => dir.replace(/[\\/]\.claude[\\/]worktrees[\\/].*$/, '')

/** What an engineer's dispatch prompt says about where it works. */
export function parseDispatch(prompt: string): Pick<Dispatch, 'sprint' | 'slice' | 'branch' | 'plan' | 'round'> {
  // Pod writes its fields as markdown, `- **slice code:** D1`: the closing `**` sits between the colon and the value.
  const field = (name: string) =>
    new RegExp(`\\b${name}\\W{0,4}[:=][\\s*_\`]*([\\w.-]+)`, 'i').exec(prompt)?.[1]
  const round = Number(field('round'))
  return {
    sprint: field('sprint slug'),
    slice: field('slice code'),
    branch: field('(?<!merge-target |plan |wave head )branch(?: name)?'),
    plan: field('plan slug'),
    round: Number.isInteger(round) && round > 0 ? round : undefined,
  }
}

const WAVE_FIX = /^(.+)-w(\d+)-fix$/

/** A plan review round, the plan's fix pass, or a wave's fix, told by the agent's type and branch. */
export function roundOf(d: Dispatch | undefined, planSlug: string): { text: string; sprint?: string; wave?: number } | undefined {
  if (!d) return undefined
  // A reviewer that names no plan is a /pod:fix review, not a round of this one.
  if (/(^|:)reviewer$/.test(d.type)) return d.plan === planSlug ? { text: `round ${d.round ?? 1}` } : undefined
  const branch = d.branch ?? ''
  if (branch === `${planSlug}-fix`) return { text: 'fix pass' }
  const wave = WAVE_FIX.exec(branch)
  return wave ? { text: 'wave fix', sprint: d.sprint ?? wave[1], wave: Number(wave[2]) } : undefined
}

/** The board slice an agent works on: its prompt's slice code, else a code named in its description or branch. */
export function sliceOf(d: Dispatch | undefined, codes: string[]): string | undefined {
  if (!d) return undefined
  if (d.slice && codes.includes(d.slice)) return d.slice
  const words = `${d.description} ${d.branch ?? ''}`.toLowerCase().split(/[\s,;:()[\]"'`-]+/)
  return codes.find(code => words.includes(code.toLowerCase()))
}

/** The sprint an agent's slice belongs to: the one its dispatch names, else the first board with that code. */
function sprintOfSlice(d: Dispatch | undefined, slice: string, sprints: SprintDoc[]): string | undefined {
  return (sprints.find(s => s.slug === d?.sprint && s.rows.some(r => r.slice === slice)) ?? sprints.find(s => s.rows.some(r => r.slice === slice)))?.slug
}
const sliceKey = (sprint: string, slice: string) => `${sprint}/${slice}`

const SLICE_STATUS: Record<string, string> = {
  pending: 'waiting',
  pushed: 'pushed',
  done: 'done',
  merged: 'done',
  blocked: 'blocked',
}

/** What a board's PR cell says: nothing yet, a wave PR open, merged, or blocked. */
export function prState(pr: string): { state: 'none' | 'open' | 'merged' | 'blocked'; number?: string } {
  if (/merged/i.test(pr)) return { state: 'merged' }
  if (/blocked/i.test(pr)) return { state: 'blocked' }
  if (/https?:\/\//i.test(pr)) return { state: 'open', number: /\/pull\/(\d+)/.exec(pr)?.[1] }
  return { state: 'none' }
}

/** A slice is finished when its status says so, or its PR cell says merged. */
// A blocked status wins over a merged PR cell, so a wave never counts a ✗ slice as done.
export const isDone = (row: Row) =>
  row.status !== 'blocked' &&
  (row.status === 'done' || row.status === 'merged' || prState(row.pr).state === 'merged')

/**
 * A link on a finished slice is its wave's PR. It is merged once the wave is settled (the sprint is
 * archived, or a later wave has started); before that the PR may still be open.
 */
const waveStatus = (rows: Row[], sprint: string, liveSlices: Set<string>, isSettled: boolean): { status: string; tag?: string } => {
  const prs = rows.map(r => {
    if (r.status === 'merged' || prState(r.pr).state === 'merged') return { state: 'merged' as const }
    if (r.status === 'done' && isSettled) return { state: 'merged' as const }
    return prState(r.pr)
  })
  const open = prs.find(p => p.state === 'open')
  if (open) return { status: 'running', tag: open.number ? `PR #${open.number} open` : 'PR open' }
  if (rows.every(isDone)) return { status: 'done' }
  if (rows.some(r => r.status === 'blocked')) return { status: 'blocked' }
  if (rows.some(r => liveSlices.has(sliceKey(sprint, r.slice)) || r.status === 'pushed')) return { status: 'running' }
  return { status: 'waiting' }
}

export const short = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

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
  const working = lines.filter(l => (l.kind === 'slice' || l.kind === 'agent' || l.kind === 'round') && l.status === 'running').length
  const blocked = lines.filter(l => l.status === 'blocked' && l.kind !== 'wave' && l.kind !== 'concern' && l.kind !== 'question' && l.kind !== 'review' && l.kind !== 'halt').length
  // An answered question waits on pod now, not on you.
  const questions = lines.filter(l => l.kind === 'question' && l.status !== 'done').length
  if (working > 0) parts.push(`${working} running`)
  if (blocked > 0) parts.push(`${blocked} blocked`)
  if (questions > 0) parts.push(`${questions} ${questions === 1 ? 'question' : 'questions'}`)
  // A halt says so itself, not as one more blocked row.
  if (lines.some(l => l.kind === 'halt' && l.status === 'blocked')) parts.push('halted')
  if (lines.some(l => l.kind === 'halt' && l.status === 'pushed')) parts.push('waiting on you')
  return parts.join(' · ')
}

/** The shortest cut plan name worth showing in the header; narrower, it is left out. */
const MIN_NAME = 8

/** The line over the tree: the plan's name, where the run is, and the plan's tokens. It is the tree's root. */
export function header(lines: TreeLine[], width = Infinity): string {
  const plan = lines.find(l => l.kind === 'plan')
  const rest = [summarize(lines), plan?.note].filter(Boolean).join(' · ')
  const full = [plan?.text, rest].filter(Boolean).join(' · ')
  if (full.length <= width || !plan || !rest) return full
  // The name gives way first: where the run is and what needs you are the point of the line.
  const room = width - rest.length - ' · '.length
  return room >= MIN_NAME ? `${plan.text.slice(0, room - 1)}… · ${rest}` : rest
}

/** The symbol for each status, shared by the tree and the transcript lines. */
export const GLYPH: Record<string, string> = { running: '●', pushed: '◐', done: '✓', blocked: '✗', waiting: '○' }

/** How many unticked features the reminder names before `and N more`. */
const REMINDER_NAMES = 3

/** A soft reminder for a `continue` with features still unticked at the hand-back: it names them and goes on. */
export function uncheckedReminder(lines: TreeLine[]): string | undefined {
  const left = lines.filter(l => l.kind === 'check' && l.isImportant && l.status !== 'done').map(l => short(l.text, 40))
  if (left.length === 0) return undefined
  const names = left.length > REMINDER_NAMES ? `${left.slice(0, REMINDER_NAMES).join('; ')} and ${left.length - REMINDER_NAMES} more` : left.join('; ')
  const end = /[.…]$/.test(names) ? '' : '.'
  return `☐ Merged with ${left.length} important ${left.length === 1 ? 'check' : 'checks'} not ticked: ${names}${end}`
}

/** The divider over Run app in the text version, which has no width to fill. */
const DIVIDER = 30

/** A question waits with a `?`; a blocked one keeps its `✗`, and an answered one has a `✓`. */
export const questionGlyph = (line: TreeLine) => (line.status === 'blocked' ? GLYPH.blocked : line.status === 'done' ? GLYPH.done : '?')

/**
 * The run's turning points in the tree: a wave opens its PR or finishes, a slice is blocked,
 * a sprint or the plan finishes, the run stops. Keyed so each is told once; the text leads with the tree's symbol,
 * and what needs the person (blocked, halted, waiting on you) leads with that in capitals.
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
    }
    if (line.kind === 'slice' && line.status === 'blocked') found.set(`${where} blocked`, `${GLYPH.blocked} BLOCKED · ${where}`)
    if (line.kind === 'question' && line.status !== 'done') found.set(`question ${line.text}`, [`${questionGlyph(line)} NEEDS YOU`, line.text, line.note].filter(Boolean).join(' · '))
    if (line.kind === 'halt') {
      // The action leads, so the line says what to do before why.
      const after = lines.slice(i + 1)
      const end = after.findIndex(l => l.kind !== 'hint')
      const hint = (end < 0 ? after : after.slice(0, end)).map(l => l.text).join(', ')
      // A merged hand-back needs nothing from the person, so it isn't in capitals.
      const text = line.status === 'done' ? line.text : line.text.toUpperCase()
      found.set(`halt ${line.note ?? line.text}`, [`${GLYPH[line.status]} ${text}`, hint, line.note].filter(Boolean).join(' · '))
    }
  }
  return found
}

/**
 * The run as a little tree, for where no pane can draw: finished sprints as one count, then only
 * what is running, blocked or waiting on you.
 */
export function snapshot(lines: TreeLine[]): string {
  const rows: TreeLine[] = []
  const row = (depth: number, text: string) => rows.push({ depth, kind: 'plan', text, status: '' })
  const summary = header(lines)
  if (summary) row(0, summary)
  // What waits on you comes first, as in the pane.
  for (const line of lines) {
    if (line.kind === 'ask') row(1, `${GLYPH[line.status]} ${line.text} · ${line.note}`)
    if (line.kind === 'question') row(2, `${questionGlyph(line)} ${line.text}  ${line.note ?? ''}`.trimEnd())
  }
  const sprints = lines.filter(l => l.kind === 'sprint')
  const done = sprints.filter(l => l.status === 'done').length
  if (done > 0) row(1, `${GLYPH.done} ${done} ${done === 1 ? 'sprint' : 'sprints'} done`)
  for (const [i, line] of lines.entries()) {
    const glyph = GLYPH[line.status] ?? '·'
    if (line.kind === 'sprint') {
      // Under each sprint: one line per wave with work running, and each blocked slice.
      const end = lines.findIndex((l, n) => n > i && l.depth <= 1)
      const body = lines.slice(i + 1, end < 0 ? undefined : end)
      const children: string[] = []
      let wave: TreeLine | undefined
      let busy: string[] = []
      const closeWave = () => {
        if (wave && busy.length > 0) children.push(`${GLYPH.running} ${wave.text} · ${busy.join(' · ')}`)
        busy = []
      }
      for (const l of body) {
        if (l.kind === 'wave') {
          closeWave()
          wave = l
        } else if (l.kind === 'agent') {
          children.push(`${GLYPH.running} ${[l.text, l.note].filter(Boolean).join(' ')}`)
        } else if ((l.kind === 'slice' || l.kind === 'round') && l.status === 'running') {
          busy.push([l.text, l.note].filter(Boolean).join(' '))
        } else if (l.kind === 'slice' && l.status === 'blocked') {
          closeWave()
          children.push(`${GLYPH.blocked} ${wave?.text} · ${l.text.split(' ')[0]} blocked`)
        }
      }
      closeWave()
      // A finished sprint with nothing to show is already in the count above.
      if (line.status === 'done' && children.length === 0) continue
      row(1, `${glyph} ${line.text}`)
      for (const child of children) row(2, child)
    } else if (line.kind === 'review') {
      const after = lines.slice(i + 1)
      const end = after.findIndex(l => l.kind !== 'round')
      const rounds = end < 0 ? after : after.slice(0, end)
      const live = rounds.find(r => r.status === 'running')
      row(1, `${glyph} review · ${live ? [live.text, live.note].filter(Boolean).join(' ') : `${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'}`}`)
    } else if (line.kind === 'agent' && line.depth === 1) {
      row(1, `${glyph} ${[line.text, line.note].filter(Boolean).join(' · ')}`)
    } else if (line.kind === 'halt') {
      row(1, `${glyph} ${line.text}  ${line.note ?? ''}`.trimEnd())
      const after = lines.slice(i + 1)
      const end = after.findIndex(l => l.kind !== 'hint')
      const hints = end < 0 ? after : after.slice(0, end)
      if (hints.length > 0) row(2, `➜ ${hints.map(h => h.text).join(', ')}`)
    } else if (line.kind === 'app' && line.status === 'done') {
      row(1, [`${glyph} ${line.text}`, line.note].filter(Boolean).join(' · '))
    } else if (line.kind === 'app') {
      // No button where no pane draws: say what to reply. A divider sets your part apart from the run, as in the pane.
      row(1, '─'.repeat(DIVIDER))
      row(1, `${glyph} ${line.text}  reply '${line.text.toLowerCase()}'`)
      if (line.detail) row(1, line.detail)
    } else if (line.kind === 'also' && !lines.some(l => l.kind === 'app' && l.detail)) {
      row(1, `${line.text}:`)
    } else if (line.kind === 'check' && !lines.some(l => l.kind === 'app' && l.detail)) {
      // A plain list, no tree: the name whole, then how to reach it on a line of its own.
      row(1, `${line.status === 'done' ? '☑' : '☐'} ${line.text}`)
      if (line.note) row(1, `  ${line.note}`)
    }
  }
  const stems = prefixes(rows)
  return rows.map((r, i) => `${stems[i]}${r.text}`).join('\n')
}

/** A finished sprint with a board folds to its own line unless the person opened it. */
export function visibleLines(lines: TreeLine[], expanded: string[]): TreeLine[] {
  const shown: TreeLine[] = []
  // A folded row hides what is under it: the rows after it, down to the next at its depth or above.
  let foldedAt = Infinity
  for (const line of lines) {
    if (line.depth > foldedAt) continue
    foldedAt = Infinity
    shown.push(line)
    if (isFoldable(line) && !expanded.includes(foldKey(line))) foldedAt = line.depth
  }
  return shown
}

/** A finished sprint with a board folds, so does a finished wave in a sprint still running, and the checklist once all are ticked. */
export const isFoldable = (line: TreeLine) =>
  line.detail !== undefined && (((line.kind === 'sprint' || line.kind === 'wave') && line.status === 'done') || line.kind === 'app')

/** What `expanded` keeps for an opened row: the sprint's slug, the sprint and wave, or `checks`. */
export const foldKey = (line: TreeLine) => (line.kind === 'app' ? 'checks' : line.kind === 'wave' ? `${line.sprint}/${line.text}` : (line.sprint ?? ''))

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

/**
 * The branch drawing (`├─ `, `└─ `, `│  `) in front of each line. The plan is the header, so each of its rows
 * (a sprint, the review, a halt) is a tree of its own, with no branch to a root.
 */
export function prefixes(lines: TreeLine[]): string[] {
  const hasLater: boolean[] = []
  const stems: string[] = []
  return lines.map((line, i) => {
    if (line.depth <= 1) return (stems[i] = '')
    // A continued row keeps the row above's stem, with its branch turned into a plain rail.
    if (line.isContinued) return (stems[i] = (stems[i - 1] ?? '').replace('└─ ', '   ').replace('├─ ', '│  '))
    const after = lines.slice(i + 1).find(l => l.depth <= line.depth && !l.isContinued)
    const isLast = after?.depth !== line.depth
    hasLater[line.depth] = !isLast
    let stem = ''
    for (let d = 2; d < line.depth; d++) stem += hasLater[d] ? '│  ' : '   '
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

/** A token count in a few characters: `950`, `9.9k`, `410k`, `1.2M`. */
export function formatTokens(n: number): string {
  if (n < 1000) return `${n}`
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

/** What a turn adds to an agent's total. Cache reads cost a tenth as much and would swamp the rest, so they stay out. */
export const turnTokens = (u: ModelUsage) =>
  u.input_tokens + u.output_tokens + u.cache_creation_input_tokens

/** The spawns of runs on this plan: a session can run several plans, and its spawns outlive each run. */
const spawnsOf = (spawns: Record<string, Dispatch>, planSlug: string) =>
  Object.fromEntries(Object.entries(spawns).filter(([, d]) => !d.runPlan || d.runPlan === planSlug))

export type TokenTotals ={ sprints: Map<string, number>; review: number; plan: number }

/** Each spawned agent's tokens, added to the sprint or review it worked for, and to the plan. */
export function tokenTotals(spawns: Record<string, Dispatch>, tokens: Record<string, number>, sprints: SprintDoc[], planSlug: string): TokenTotals {
  const totals: TokenTotals = { sprints: new Map(), review: 0, plan: 0 }
  const codes = sprints.flatMap(s => s.rows.map(r => r.slice))
  for (const [id, d] of Object.entries(spawnsOf(spawns, planSlug))) {
    const n = tokens[id] ?? 0
    if (n === 0) continue
    totals.plan += n
    const round = roundOf(d, planSlug)
    if (round && round.wave === undefined) {
      totals.review += n
      continue
    }
    const slice = round ? undefined : sliceOf(d, codes)
    const sprint = round?.sprint ?? (slice && sprintOfSlice(d, slice, sprints))
    if (sprint) totals.sprints.set(sprint, (totals.sprints.get(sprint) ?? 0) + n)
  }
  return totals
}

const tokenNote = (n: number | undefined) => (n ? `${formatTokens(n)} tokens` : undefined)

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
  /** Tokens per agent id, summed over its turns. */
  tokens?: Record<string, number>
  /** Pull request numbers known to be merged: the queue keeps a hand-back pending after its PR merges. */
  merged?: number[]
  /** The features the hand-back's PR added or changed, to check by hand; the ones ticked; whether the app was started. */
  checks?: FeatureCheck[]
  ticked?: string[]
  isAppRunning?: boolean
  /** You said continue after the hand-back's PR merged: the hand-back part folds to one line. */
  isHandBackClosed?: boolean
}

export type FeatureCheck = { feature: string; reach: string; isNew: boolean }

/**
 * The `features.md` rows a PR's diff adds or changes, from `gh pr diff`: a changed row is removed and added,
 * so its added line is enough, and a row added with no removed row of its name is new. Each row's Feature and
 * "User reaches it by" cells, as plain text.
 */
export function changedFeatures(diff: string): FeatureCheck[] {
  const rows: { sign: string; feature: string; reach: string }[] = []
  let isFeatures = false
  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith('diff --git ')) isFeatures = /\/(pod-)?docs\/features\.md$/.test(line)
    const m = /^([+-])\s*\|(.*)$/.exec(line)
    if (!isFeatures || !m || /^[\s:|-]+$/.test(m[2] ?? '')) continue
    const [feature = '', reach = ''] = (m[2] ?? '').split('|').map(cell => concernText(cell.trim()))
    if (feature && feature !== 'Feature') rows.push({ sign: m[1] ?? '', feature, reach })
  }
  const removed = new Set(rows.filter(r => r.sign === '-').map(r => r.feature))
  return rows.filter(r => r.sign === '+').map(r => ({ feature: r.feature, reach: r.reach, isNew: !removed.has(r.feature) }))
}

/**
 * What only the person can judge before the merge, first: the plan's one-way doors, the decisions pod defaulted
 * for them, and the features it added. The features it only changed come after.
 */
function checklist(queue: QueueEntry[], plan: PlanDoc, checks: FeatureCheck[]): { text: string; note?: string; detail?: string; isImportant: boolean }[] {
  const mine = queue.filter(e => isForPlan(e, plan) && e.plan)
  const doors = mine
    .filter(e => /one-way door/i.test(e.body))
    .map(e => {
      const first = concernText(e.body)
      const whole = withoutUndo(/^one-way door/i.test(first) ? first : `One-way door: ${first}`)
      // Short, as `Decided:` is: `PR #74: …`. The open row says it whole, with how to undo it,
      // what you weigh before you merge a door.
      const undo = undoOf(e.body)
      return { text: shortDoor(whole), detail: `${whole}.${undo ? ` Undo: ${undo}.` : ''}`, isImportant: true }
    })
  const decided = mine
    .filter(e => !e.isPending && /default recorded/i.test(e.resolution ?? ''))
    // One line each: the decision's first clause, and the default alone. The whole sentence opens under it.
    .map(e => {
      const value = defaultOf(e.resolution ?? '')
      const detail = [`Decided: ${concernText(e.body)}`, value && `Default: ${value}.`].filter(Boolean).join(' ')
      return { text: `Decided: ${firstClause(concernText(e.body))}`, note: value, detail, isImportant: true }
    })
  const features = checks.map(c => ({ text: c.feature, note: c.reach || undefined, isImportant: c.isNew }))
  return [...doors, ...decided, ...features.filter(f => f.isImportant), ...features.filter(f => !f.isImportant)]
}

/** A sentence up to its first `;`, `(` or comma: the reason after it is too long for one line. */
const firstClause = (text: string) => text.split(/\s*[;(]|,\s/)[0]!.replace(/[.\s]+$/, '')

/** A door's sentence up to its `, undo: <how>`, with no end stop. */
const withoutUndo = (text: string) => text.split(/,?\s*\bundo:/i)[0]!.replace(/[.\s]+$/, '')

/**
 * A door named by its PR, as you know it: `one-way door in PR #74 — <what>, undo: <how>` reads
 * `PR #74: <what>`. One with no PR number reads `One-way: <what>`. The older `in PR #74: <what>` too.
 */
const shortDoor = (text: string) => {
  const m = /^one-way door(?: in PR (#\d+))?\s*[—–:-]\s*(.*)$/i.exec(withoutUndo(text))
  return m ? `${m[1] ? `PR ${m[1]}` : 'One-way'}: ${m[2]}` : text
}

/** The sentence after a door's `Undo:`, plain: `restore the backup`. */
const undoOf = (body: string) =>
  /\bUndo:\s*(.+?)(?:\.(?:\s|$)|$)/i.exec(body.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*`]/g, ''))?.[1]?.trim() || undefined

/** The value from `default recorded: 36 px; override anytime ([decision](…))`: `36 px`. */
const defaultOf = (resolution: string) =>
  concernText(/default recorded:\s*([^;]*)/i.exec(resolution)?.[1] ?? '').replace(/[.\s]+$/, '') || undefined

/** The pull request a halt or hand-back links to, by its number. */
export const pullOf = (text: string) => /https?:\/\/[^\s,;)]+?\/pull\/(\d+)/.exec(text)

const ENDED = new Set(['completed', 'failed', 'killed'])
const PLANNER = /(^|:)sprint-planner$/

export function buildTree({ plan, sprints, spawns, live, halt, haltType, now, lastSeen = {}, queue = [], tokens = {}, merged = [], checks = [], ticked = [], isAppRunning = false, isHandBackClosed = false }: TreeInput): TreeLine[] {
  const spent = tokenTotals(spawns, tokens, sprints, plan.slug)
  // Live until it ends: an agent `waiting` on its own background work, `pending` or `idle` is still at it.
  const running = live.filter(a => !ENDED.has(a.status))
  const dispatchOf = (a: LiveAgent) => spawns[a.id]
  const codes = sprints.flatMap(s => s.rows.map(r => r.slice))
  const agentOfSlice = new Map<string, LiveAgent>()
  // Kept after they finish (the spawn record outlives the agent), so the order of rounds stays on screen.
  const rounds = Object.entries(spawnsOf(spawns, plan.slug))
    .map(([id, d]) => ({ id, d, round: roundOf(d, plan.slug) }))
    .filter(r => r.round !== undefined)
    .sort((a, b) => (a.d.startedAt ?? 0) - (b.d.startedAt ?? 0))
  const roundIds = new Set(rounds.map(r => r.id))
  const roundStatus = (id: string) => {
    const status = live.find(a => a.id === id)?.status
    if (status === 'failed' || status === 'killed') return 'blocked'
    return status === undefined || status === 'completed' ? 'done' : 'running'
  }
  const roundLine = (r: (typeof rounds)[number], depth: number, sprint?: string): TreeLine => {
    const status = roundStatus(r.id)
    const agent = live.find(a => a.id === r.id)
    return { depth, kind: 'round', text: r.round!.text, status, note: status === 'running' ? ageOf(agent) : undefined, sprint }
  }
  for (const a of running) {
    if (roundIds.has(a.id)) continue
    const slice = sliceOf(dispatchOf(a), codes)
    const sprint = slice && sprintOfSlice(dispatchOf(a), slice, sprints)
    if (slice && sprint) agentOfSlice.set(sliceKey(sprint, slice), a)
  }
  const liveSlices = new Set(agentOfSlice.keys())
  const ageOf = (a: LiveAgent | undefined) =>
    a ? ageNote(dispatchOf(a)?.startedAt, lastSeen[a.id], now) : undefined
  // Autopilot hands the planner only the plan slug: it drafts the first sprint not done that has no doc yet.
  const planners = running.filter(a => PLANNER.test(dispatchOf(a)?.type ?? a.type))
  const drafted = planners.length > 0 ? plan.sprints.find(s => s.status !== 'done' && !sprints.some(d => d.slug === s.slug))?.slug : undefined
  const isPlanDone =
    plan.status === 'archived' ||
    (plan.sprints.length > 0 && plan.sprints.every(s => s.status === 'done') && running.length === 0)
  const lines: TreeLine[] = [
    { depth: 0, kind: 'plan', text: plan.title, status: isPlanDone ? 'done' : 'running', note: tokenNote(spent.plan) },
  ]

  // First, what waits on you: in the chat, a question scrolls away under the run's own messages.
  // One answered from Pod Board stays in view, marked answered, until pod applies it and fills in its Resolution.
  const questions = questionsFor(queue, plan)
  if (questions.length > 0) {
    const waiting = questions.filter(e => !e.answer).length
    lines.push(
      waiting > 0
        ? { depth: 1, kind: 'ask', text: 'needs you', status: 'pushed', note: `${waiting}` }
        : { depth: 1, kind: 'ask', text: 'answered', status: 'done', note: `${questions.length}` },
    )
    for (const entry of questions) {
      const from = entry.route.split('→')[0]?.trim()
      lines.push({
        depth: 2,
        kind: 'question',
        text: short(shortDoor(concernText(entry.body)), 80),
        status: entry.answer ? 'done' : entry.type === 'BLOCKED' ? 'blocked' : 'waiting',
        note: [entry.answer && 'answered', entry.slice, from].filter(Boolean).join(' · ') || undefined,
      })
    }
  }

  for (const sprint of plan.sprints) {
    const doc = sprints.find(s => s.slug === sprint.slug)
    const waves = [...new Set((doc?.rows ?? []).map(r => r.wave))].sort((a, b) => a - b)
    const slices = doc?.rows.length ?? 0
    const blockedCount = (doc?.rows ?? []).filter(r => r.status === 'blocked').length
    // The plan's cell can lag: a sprint doc not yet archived means the sprint has started, and pod archives it only once it is done.
    const sprintStatus = sprint.status === 'done' || doc?.isArchived ? 'done' : sprint.status === 'active' || doc || sprint.slug === drafted ? 'running' : 'waiting'
    lines.push({
      depth: 1,
      kind: 'sprint',
      text: sprint.slug,
      status: sprintStatus,
      note: [tokenNote(spent.sprints.get(sprint.slug)), sprint.goal].filter(Boolean).join(' · '),
      sprint: sprint.slug,
      detail: doc
        ? [`${waves.length} ${waves.length === 1 ? 'wave' : 'waves'}`, `${slices} ${slices === 1 ? 'slice' : 'slices'}`, tokenNote(spent.sprints.get(sprint.slug))].filter(Boolean).join(' · ')
        : undefined,
      blockedCount: blockedCount || undefined,
    })
    if (sprint.slug === drafted) {
      for (const a of planners) lines.push({ depth: 2, kind: 'agent', text: 'drafting', status: 'running', note: ageOf(a), sprint: sprint.slug })
    }
    for (const wave of waves) {
      const rows = doc!.rows.filter(r => r.wave === wave)
      const doneCount = rows.filter(isDone).length
      const later = doc!.rows.filter(r => r.wave > wave)
      const isSettled = doc!.isArchived || later.some(r => r.status !== 'pending' || liveSlices.has(sliceKey(sprint.slug, r.slice)))
      const state = waveStatus(rows, sprint.slug, liveSlices, isSettled)
      const fixes = rounds.filter(r => r.round!.sprint === sprint.slug && r.round!.wave === wave).map(r => roundLine(r, 3, sprint.slug))
      const status = fixes.some(l => l.status === 'running') ? 'running' : state.status
      // In a sprint still running, a finished wave folds to one row, so the wave at work stays in view.
      // One with a queue entry stays open: the entry is still for you to read.
      const isFoldable = status === 'done' && sprintStatus !== 'done' && !rows.some(r => concernsFor(queue, sprint.slug, r).length > 0)
      lines.push({
        depth: 2,
        kind: 'wave',
        text: `wave ${wave}`,
        status,
        // A finished wave's ✓ and its slices below already say it all: the count shows only while it is unfinished.
        note: [state.tag, status === 'done' ? '' : `${doneCount}/${rows.length}`].filter(Boolean).join(' · ') || undefined,
        sprint: sprint.slug,
        detail: isFoldable ? `${rows.length} ${rows.length === 1 ? 'slice' : 'slices'}` : undefined,
      })
      for (const row of rows) {
        const isLive = liveSlices.has(sliceKey(sprint.slug, row.slice))
        lines.push({
          depth: 3,
          kind: 'slice',
          text: `${row.slice} ${row.title}`,
          status: isLive ? 'running' : (SLICE_STATUS[row.status] ?? row.status),
          note: isLive ? ageOf(agentOfSlice.get(sliceKey(sprint.slug, row.slice))) : row.confidence === '—' ? undefined : row.confidence,
          sprint: sprint.slug,
        })
        for (const entry of concernsFor(queue, sprint.slug, row)) {
          lines.push({
            depth: 4,
            kind: 'concern',
            text: short(shortDoor(concernText(entry.body)), 80),
            status: entry.type === 'BLOCKED' ? 'blocked' : 'waiting',
            sprint: sprint.slug,
          })
        }
      }
      lines.push(...fixes)
    }
  }

  // The final PR's review: round 1, the fix pass, round 2, in the order they ran.
  const reviews = rounds.filter(r => r.round!.wave === undefined)
  if (reviews.length > 0) {
    const children = reviews.map(r => roundLine(r, 2))
    const isRunning = children.some(l => l.status === 'running')
    lines.push({ depth: 1, kind: 'review', text: 'review', status: isRunning ? 'running' : children.at(-1)!.status, note: tokenNote(spent.review) })
    lines.push(...children)
  }

  // Agents that match no slice or round (the planner, the reporter).
  for (const agent of running) {
    const d = dispatchOf(agent)
    if (roundIds.has(agent.id) || sliceOf(d, codes) || (drafted && planners.includes(agent))) continue
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
    // A BLOCKED entry, or a final review still failing, is never yours to merge: it halts, even when it names the final PR.
    const isHandBack = haltType !== 'BLOCKED' && !/still failing/i.test(haltText) && HAND_BACK.test(haltText)
    // A pull request URL reads as its short number.
    const pull = pullOf(haltText)
    // At the hand-back, merged or not: run the app and look at what the plan changed.
    const items = checklist(queue, plan, checks)
    const tickedCount = items.filter(c => ticked.includes(c.text)).length
    const hasAlso = items.some(c => c.isImportant) && items.some(c => !c.isImportant)
    const appLines = (): TreeLine[] =>
      // After the merge and your continue, nothing is left to do here: one line says how it went.
      isHandBackClosed
        ? [{ depth: 1, kind: 'app', text: 'plan done', status: 'done', note: items.length > 0 ? `checked ${tickedCount}/${items.length}` : undefined }]
        : [
            {
              depth: 1,
              kind: 'app',
              text: isAppRunning ? 'Stop app' : 'Run app',
              status: isAppRunning ? 'running' : 'waiting',
              note: items.length > 0 ? `check these (${tickedCount}/${items.length})` : undefined,
              // All ticked: the list folds to this line, and opens again when pressed.
              detail: items.length > 0 && tickedCount === items.length ? `✓ all ${items.length} checked` : undefined,
            },
            ...items.flatMap((c, n): TreeLine[] => [
              // The first that isn't important gets a label over it.
              ...(hasAlso && !c.isImportant && items[n - 1]?.isImportant ? [{ depth: 2, kind: 'also' as const, text: 'also changed', status: '' }] : []),
              { depth: 2, kind: 'check', text: c.text, status: ticked.includes(c.text) ? 'done' : 'waiting', note: c.note, detail: c.detail, isImportant: c.isImportant || undefined },
            ]),
          ]
    if (isHandBack && pull && merged.includes(Number(pull[1]))) {
      // Nothing left for you: the hand-back's PR is in.
      lines.push({ depth: 1, kind: 'halt', text: `PR #${pull[1]} merged`, status: 'done' })
      return [...lines, ...appLines()]
    }
    lines.push({
      depth: 1,
      kind: 'halt',
      // Short, so a narrow pane never cuts it: the hint below says what you are waited on for.
      text: isHandBack ? 'waiting' : 'halted',
      status: isHandBack ? 'pushed' : 'blocked',
      note: pull ? haltText.replace(pull[0], `#${pull[1]}`) : haltText,
    })
    // On lines of their own, short enough for a narrow pane, so a long reason never hides them.
    if (!isHandBack) {
      resumeHint(haltType).forEach((text, n) => lines.push({ depth: 2, kind: 'hint', text, status: 'waiting', isContinued: n > 0 }))
    } else if (pull) {
      // The note's end is the first thing a narrow pane cuts, so the PR to merge gets a line of its own.
      lines.push({ depth: 2, kind: 'hint', text: `merge PR #${pull[1]}`, status: 'waiting' })
    }
    if (isHandBack) lines.push(...appLines())
  }
  return lines
}
