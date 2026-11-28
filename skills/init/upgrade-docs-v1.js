#!/usr/bin/env node
// Moves a project's pod files from pod docs version 1 (in docs/) to version 2 (in pod-docs/).
// Run it once, from the project root: node <pod>/skills/init/upgrade-docs-v1.js
// CommonJS on purpose: with no package.json around it, every Node version reads a .js file this way.
// It changes only pod's own files, commits nothing, and stops before it changes anything if it can't do the whole move.
const { execFileSync } = require('node:child_process')
const { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

/** pod's files in a version-1 project. Nothing else in docs/ moves: the rest is the project's own. */
const POD_FILES = [
  'codebase-structure.md', 'decisions.md', 'features.md', 'handoff-queue.md', 'handoff-queue-archive.md',
  'known-issues', 'research', 'plans', 'sprints', 'design-drafts', 'reports',
]

const README = join(__dirname, 'scaffold', 'pod-docs', 'README.md')
const OLD_PATH = new RegExp(`(?<![\\w./-])docs/(${POD_FILES.map(n => n.replace('.', '\\.')).join('|')})`, 'g')

const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const isTracked = (root, path) => {
  try { return git(root, 'ls-files', '--error-unmatch', path) !== '' } catch { return false }
}
const markdownFiles = dir =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? markdownFiles(path) : name.endsWith('.md') ? [path] : []
  })

/** Moves the files and returns what it did, as lines for the human. Throws, having changed nothing, when it can't. */
function upgrade(root) {
  if (existsSync(join(root, 'pod-docs', 'README.md')) && /pod docs: \d+/.test(readFileSync(join(root, 'pod-docs', 'README.md'), 'utf8')))
    throw new Error('pod-docs/README.md already has a `pod docs:` line: nothing to move.')
  const found = POD_FILES.filter(name => existsSync(join(root, 'docs', name)))
  if (!found.includes('codebase-structure.md') && !found.includes('handoff-queue.md'))
    throw new Error('No docs/codebase-structure.md or docs/handoff-queue.md: this is not a version-1 pod project.')
  if (git(root, 'status', '--porcelain').trim()) throw new Error('The git tree has changes. Commit or stash them first, so the move is easy to review.')
  const clash = found.filter(name => existsSync(join(root, 'pod-docs', name)))
  if (clash.length) throw new Error(`These are in both docs/ and pod-docs/: ${clash.join(', ')}. Merge them by hand, then run this again.`)

  mkdirSync(join(root, 'pod-docs'), { recursive: true })
  for (const name of found) {
    if (isTracked(root, `docs/${name}`)) git(root, 'mv', `docs/${name}`, `pod-docs/${name}`)
    else renameSync(join(root, 'docs', name), join(root, 'pod-docs', name))
  }
  let fixed = 0
  for (const file of markdownFiles(join(root, 'pod-docs'))) {
    const text = readFileSync(file, 'utf8')
    const next = text.replace(OLD_PATH, 'pod-docs/$1')
    if (next !== text) writeFileSync(file, next), fixed++
  }
  writeFileSync(join(root, 'pod-docs', 'README.md'), readFileSync(README, 'utf8'))

  let others = ''
  try { others = git(root, 'grep', '-n', '-E', `(^|[^-./[:alnum:]_])docs/(${POD_FILES.join('|')})`, '--', '.', ':!pod-docs') } catch {}
  return [
    `Moved to pod-docs/: ${found.join(', ')}.`,
    `Fixed old docs/ links in ${fixed} file(s), and wrote pod-docs/README.md (pod docs: 2).`,
    found.includes('handoff-queue-archive.md') ? 'pod no longer uses pod-docs/handoff-queue-archive.md: delete it when you like.' : '',
    others ? `These files outside pod-docs/ still name an old path; fix them by hand:\n${others.trim()}` : '',
    'Check the move with `git status`, commit it, then run /pod:init to add any newer files.',
  ].filter(Boolean)
}

module.exports = { POD_FILES, upgrade }

if (require.main === module) {
  try {
    console.log(upgrade(process.argv[2] ?? process.cwd()).join('\n'))
  } catch (error) {
    console.error(`Nothing changed. ${error.message}`)
    process.exit(1)
  }
}
