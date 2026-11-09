// Fails when an agent file doesn't match docs/templates/agent.md.
//   node .github/scripts/check-agent-shape.mjs [file …]   run from the repo root; no args checks every agent in CONVERTED.
import { readFileSync } from 'node:fs'

// Agents converted to the template shape. Each plan-A PR adds its agent. When all six are in, check every agents/*.md.
const CONVERTED = ['scout', 'sprint-planner', 'reporter', 'researcher']

const SECTIONS = ['Required dispatch context', 'Guardrails', 'Work', 'Final output']

function check(file) {
  const errors = []
  const fail = (line, msg) => errors.push(`${file}:${line}: ${msg}`)
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)

  // Frontmatter
  if (lines[0] !== '---') return [`${file}:1: no frontmatter`]
  const end = lines.indexOf('---', 1)
  const front = Object.fromEntries(lines.slice(1, end).map(l => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()]))
  if (!front.name) fail(2, 'frontmatter has no `name`')
  if (!front.description) fail(2, 'frontmatter has no `description`')
  else if (!front.description.startsWith('Only for ')) fail(3, '`description` starts with "Only for <job>, dispatched by <skills>."')

  // Split the body into the goal and ## sections, skipping code fences.
  const sections = []
  let goal = null
  let fence = false
  for (let i = end + 1; i < lines.length; i++) {
    const line = lines[i]
    const n = i + 1
    if (/^\s*```/.test(line)) fence = !fence
    if (!fence && line.startsWith('## ')) { sections.push({ name: line.slice(3).trim(), line: n, body: [] }); continue }
    if (!fence && line.startsWith('### ')) {
      if (sections.at(-1)?.name !== 'Work') fail(n, 'a `### <part>` subsection goes only under `## Work`')
      continue
    }
    if (!line.trim() || /^<!--.*-->$/.test(line.trim())) continue
    if (sections.length) sections.at(-1).body.push({ text: line, n, fenced: fence || /^\s*```/.test(line) })
    else if (goal === null) goal = n
    else fail(n, 'the goal is one paragraph, before the first ## section')
  }
  if (goal === null) fail(end + 2, 'no goal paragraph after the frontmatter')

  // The same four sections in every agent, in this order.
  const names = sections.map(s => s.name)
  if (names.join('|') !== SECTIONS.join('|')) {
    fail(sections[0]?.line ?? end + 2, `the sections are ${SECTIONS.map(x => `\`## ${x}\``).join(', ')}, in that order; found ${names.map(x => `\`## ${x}\``).join(', ') || 'none'}`)
  }

  for (const s of sections) {
    // One bullet per field, guardrail, rule, or output: no nested bullets or indented text, except a code block under its rule.
    for (const { text, n } of s.body.filter(b => !b.fenced && /^\s/.test(b.text))) {
      fail(n, `\`## ${s.name}\` has an indented line: each item is one bullet, with no nested bullets (a format goes in a code block under its rule)`)
    }
    const top = s.body.filter(b => !b.fenced && !/^\s/.test(b.text))
    for (const { text, n } of top) {
      const bullet = text.startsWith('- ')
      if (s.name === 'Required dispatch context') {
        if (bullet && !/^- \*\*[^*]+\*\*/.test(text)) fail(n, 'a dispatch field is `- **<field>**: <what it is>`')
        if (!bullet && !/missing → stop/.test(text)) fail(n, 'the only line that is not a field is the stop line: "… missing → stop …"')
      } else if (s.name === 'Guardrails') {
        if (!bullet) fail(n, 'a guardrail is a bullet, not prose')
      } else if (s.name === 'Final output') {
        if (!/^- \*\*[^*]+:\*\*/.test(text)) fail(n, 'an output field is `- **<field>:** <what the dispatcher reads back>`')
      } else if (!bullet) {
        // Any other section is checked as work, so a misnamed one still gets its rules checked.
        fail(n, `\`## ${s.name}\` has prose: \`## Work\` holds only rules (a format goes in a code block under its rule)`)
      } else if (!/^- \*\*[^*]+:\*\* .*→/.test(text)) {
        fail(n, 'a rule is `- **<Rule name>:** <goal or constraint> → <result>`')
      }
    }
    // The stop line is needed only when a field is required; an agent whose fields are all optional has nothing to stop on.
    const required = top.some(b => b.text.startsWith('- ') && !b.text.includes('*(optional'))
    if (s.name === 'Required dispatch context' && required && !top.some(b => /missing → stop/.test(b.text))) fail(s.line, 'no stop line: "<field> missing → stop and say which."')
  }
  return errors
}

const files = process.argv.length > 2 ? process.argv.slice(2) : CONVERTED.map(a => `agents/${a}.md`)
const errors = files.flatMap(check)
if (errors.length) {
  console.error(`${errors.length} agent shape error(s), per docs/templates/agent.md:\n${errors.map(e => `  ${e}`).join('\n')}`)
  process.exit(1)
}
console.log(`agent shape ok: ${files.join(', ')}`)
