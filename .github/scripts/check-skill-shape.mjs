// Fails when a skill file doesn't match docs/templates/skill.md.
//   node .github/scripts/check-skill-shape.mjs [file …]   run from the repo root; no args checks every skills/*/SKILL.md.
// The description and emphasis checks run on every skill. The body shape runs only on skills in CONVERTED;
// each conversion PR adds its skill.
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const CONVERTED = ['idea', 'teach', 'code', 'task']
const SECTIONS = ['Guardrails', 'Work', 'Hand back']
const MAX_LINES = 500
const MAX_RULE_WORDS = 60
const MAX_PART_RULES = 8

function check(file) {
  const errors = []
  const warnings = []
  const fail = (line, msg) => errors.push(`${file}:${line}: ${msg}`)
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  const skill = file.split('/').at(-2)

  // Frontmatter
  if (lines[0] !== '---') return { errors: [`${file}:1: no frontmatter`], warnings }
  const end = lines.indexOf('---', 1)
  const front = Object.fromEntries(lines.slice(1, end).map(l => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()]))
  if (front.name !== skill) fail(2, `\`name\` is the folder name, \`${skill}\``)
  const d = front.description
  if (!d) fail(3, 'frontmatter has no `description`')
  else {
    if (!d.startsWith(`Use when the user types /pod:${skill}`)) fail(3, `\`description\` starts with "Use when the user types /pod:${skill}"`)
    if (d.includes('<')) fail(3, '`description` writes args as `[arg]`: `<arg>` shows as `&lt;arg&gt;` in the skill list')
  }

  // Emphasis: give the reason, not CAPS.
  let fence = false
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) fence = !fence
    if (!fence && /\b(MUST|NEVER|ALWAYS|CRITICAL|IMPORTANT)\b/.test(line.replace(/`[^`]*`/g, ''))) fail(i + 1, 'no CAPS emphasis: give the reason instead')
  })
  if (lines.length > MAX_LINES) warnings.push(`${file}: ${lines.length} lines, over ${MAX_LINES}: move what most runs don't need to a file the skill links`)

  if (!CONVERTED.includes(skill)) return { errors, warnings }

  // Split the body into the intro (goal, then the optional Docs version line) and ## sections, skipping code fences.
  const sections = []
  const intro = []
  fence = false
  let prevBlank = true
  for (let i = end + 1; i < lines.length; i++) {
    const line = lines[i]
    const n = i + 1
    if (/^\s*```/.test(line)) fence = !fence
    if (!fence && line.startsWith('## ')) { sections.push({ name: line.slice(3).trim(), line: n, body: [] }); continue }
    if (!fence && line.startsWith('### ')) {
      if (sections.at(-1)?.name !== 'Work') fail(n, 'a `### <part>` subsection goes only under `## Work`')
      continue
    }
    const blank = !line.trim() || /^<!--.*-->$/.test(line.trim())
    if (blank) { prevBlank = true; continue }
    if (sections.length) sections.at(-1).body.push({ text: line, n, fenced: fence || /^\s*```/.test(line) })
    else if (prevBlank) intro.push({ text: line, n })
    prevBlank = false
  }
  if (!intro.length) fail(end + 2, 'no goal paragraph after the frontmatter')
  const docs = intro.slice(1)
  if (docs.length > 1 || (docs.length === 1 && !docs[0].text.startsWith('**Docs version** first'))) {
    fail(intro[1].n, 'before the first `##` section: the goal paragraph, then only the `**Docs version** first` line')
  }

  // ## Work is required; ## Guardrails and ## Hand back are optional; the order is fixed.
  const names = sections.map(s => s.name)
  const order = SECTIONS.filter(x => names.includes(x))
  if (names.join('|') !== order.join('|') || !names.includes('Work')) {
    fail(sections[0]?.line ?? end + 2, `the sections are \`## Guardrails\` (optional), \`## Work\`, \`## Hand back\` (optional), in that order; found ${names.map(x => `\`## ${x}\``).join(', ') || 'none'}`)
  }

  for (const s of sections) {
    for (const { n } of s.body.filter(b => !b.fenced && /^\s/.test(b.text))) {
      fail(n, `\`## ${s.name}\` has an indented line: each item is one bullet, with no nested bullets (a format goes in a code block under its rule)`)
    }
    for (const { text, n } of s.body.filter(b => !b.fenced && !/^\s/.test(b.text))) {
      if (s.name === 'Guardrails') {
        if (!text.startsWith('- ')) fail(n, 'a guardrail is a bullet, not prose')
      } else if (s.name === 'Hand back') {
        if (!/^- \*\*[^*]+:\*\*/.test(text)) fail(n, 'a hand-back field is `- **<field>:** <what the human sees>`')
      } else if (/^\d+\. /.test(text)) {
        // Numbered steps: for an order that does harm when broken, or a step number another file cites.
        if (!/^\d+\. \*\*[^*]+:\*\* /.test(text)) fail(n, 'a step is `<N>. **<Step name>:** <goal or constraint> → <result>`')
      } else if (!/^- \*\*[^*]+:\*\* /.test(text)) {
        fail(n, `\`## ${s.name}\` holds only rules or numbered steps: a rule is \`- **<Rule name>:** <goal or constraint> → <result>\` (a format goes in a code block under its rule)`)
      }
      // A long rule is two rules; warn, since only a reader can split it well.
      const words = text.replace(/`[^`]*`/g, 'x').split(/\s+/).filter(Boolean).length
      if (s.name === 'Work' && words > MAX_RULE_WORDS) warnings.push(`${file}:${n}: a rule of ${words} words, over ${MAX_RULE_WORDS}: split it into rules with one condition and result each`)
    }
  }
  // A part with too many rules is a wall: split it into parts named for what each produces.
  let part = null, count = 0
  const flush = () => { if (part && count > MAX_PART_RULES) warnings.push(`${file}:${part.n}: \`### ${part.name}\` holds ${count} rules, over ${MAX_PART_RULES}: split the part`) }
  fence = false
  for (let i = end + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*```/.test(line)) fence = !fence
    if (fence) continue
    if (line.startsWith('## ') || line.startsWith('### ')) { flush(); part = line.startsWith('### ') ? { name: line.slice(4).trim(), n: i + 1 } : null; count = 0 }
    // A run of numbered steps is one ordered block, so it counts once.
    else if (part && /^- \*\*/.test(line)) count++
    else if (part && /^1\. \*\*/.test(line)) count++
  }
  flush()
  return { errors, warnings }
}

const files = process.argv.length > 2
  ? process.argv.slice(2).map(f => f.replace(/\\/g, '/'))
  : readdirSync('skills').map(d => `skills/${d}/SKILL.md`).filter(f => existsSync(f))
const results = files.map(check)
const errors = results.flatMap(r => r.errors)
for (const w of results.flatMap(r => r.warnings)) console.warn(`warning: ${w}`)
if (errors.length) {
  console.error(`${errors.length} skill shape error(s), per docs/templates/skill.md:\n${errors.map(e => `  ${e}`).join('\n')}`)
  process.exit(1)
}
console.log(`skill shape ok: ${files.length} skills; full shape: ${CONVERTED.join(', ')}`)
