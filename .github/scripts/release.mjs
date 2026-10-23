// Keeps each merge to main a release.
//   node release.mjs check <base-ref>  PR: a plugin whose shipped files changed bumps its version and adds its changelog section.
//   node release.mjs publish           main: tags and publishes each plugin version that has no release yet.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PLUGINS = [
  {
    name: 'pod',
    manifest: '.claude-plugin/plugin.json',
    tag: v => `v${v}`,
    ships: f => /^(skills|agents)\//.test(f) || f === '.claude-plugin/plugin.json',
  },
  {
    name: 'pod-flow',
    manifest: 'pod-flow/.claude-plugin/plugin.json',
    tag: v => `pod-flow-v${v}`,
    ships: f => /^pod-flow\/(hooks|types|\.claude-plugin)\//.test(f) && !f.endsWith('.test.ts'),
  },
]

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const versionAt = (ref, p) => JSON.parse(git('show', `${ref}:${p.manifest}`)).version
const tagExists = tag => git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`) !== ''
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function isNewer(next, prev) {
  const a = next.split('.').map(Number)
  const b = prev.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return false
}

/** The body of the CHANGELOG.md section whose heading names `<plugin> <version>`, or ''. */
export function notesFor(changelog, name, version) {
  const heading = new RegExp(`^## (.* )?${escape(name)} ${escape(version)}( |$)`)
  const lines = changelog.split(/\r?\n/)
  const start = lines.findIndex(l => heading.test(l))
  if (start < 0) return ''
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim()
}

function check(base) {
  const changed = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean)
  const changelog = readFileSync('CHANGELOG.md', 'utf8')
  const errors = []
  for (const p of PLUGINS) {
    const files = changed.filter(p.ships)
    const prev = versionAt(base, p)
    const next = versionAt('HEAD', p)
    if (prev === next) {
      if (files.length) errors.push(`${p.name}: this PR changes what it ships (${files.join(', ')}) but keeps version ${next}. Bump the version in ${p.manifest}.`)
      continue
    }
    if (!isNewer(next, prev)) errors.push(`${p.name}: version ${next} isn't newer than ${prev}.`)
    if (!notesFor(changelog, p.name, next)) errors.push(`${p.name}: CHANGELOG.md has no section headed "## ${p.name} ${next} — <date>".`)
    if (tagExists(p.tag(next))) errors.push(`${p.name}: tag ${p.tag(next)} already exists.`)
    if (!errors.length) console.log(`${p.name} ${prev} → ${next}`)
  }
  if (errors.length) {
    console.error(errors.join('\n'))
    process.exit(1)
  }
}

function publish() {
  const changelog = readFileSync('CHANGELOG.md', 'utf8')
  const sha = process.env.GITHUB_SHA || git('rev-parse', 'HEAD')
  for (const p of PLUGINS) {
    const version = versionAt('HEAD', p)
    const tag = p.tag(version)
    if (tagExists(tag)) {
      console.log(`${p.name} ${version}: already released as ${tag}`)
      continue
    }
    const notes = notesFor(changelog, p.name, version)
    if (!notes) throw new Error(`CHANGELOG.md has no section for ${p.name} ${version}`)
    const file = join(tmpdir(), `${tag}.md`)
    writeFileSync(file, notes + '\n')
    const args = ['release', 'create', tag, '--target', sha, '--title', `${p.name} ${version}`, '--notes-file', file]
    // pod is the main plugin, so its release stays the one marked Latest.
    if (p.name !== 'pod') args.push('--latest=false')
    execFileSync('gh', args, { stdio: 'inherit' })
  }
}

const [mode, base] = process.argv.slice(2)
if (mode === 'check' && base) check(base)
else if (mode === 'publish') publish()
else if (mode) {
  console.error('usage: node release.mjs check <base-ref> | publish')
  process.exit(2)
}
