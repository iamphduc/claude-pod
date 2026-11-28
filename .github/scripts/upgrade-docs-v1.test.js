// Tests for skills/init/upgrade-docs-v1.js, on scratch git repos. Run: node --test .github/scripts/upgrade-docs-v1.test.js
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { dirname, join } = require('node:path')
const { upgrade } = require('../../skills/init/upgrade-docs-v1.js')

const git = (root, ...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd: root, encoding: 'utf8' })

/** A committed version-1 project: pod's files in docs/, plus the project's own guide and a CLAUDE.md that names an old path. */
function v1Project(t) {
  const root = mkdtempSync(join(tmpdir(), 'pod-v1-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const files = {
    'docs/codebase-structure.md': '# Brief\n',
    'docs/handoff-queue.md': '# Queue\n- see docs/plans/demo.md, pod-docs/x and mydocs/plans/y\n',
    'docs/plans/demo.md': '# Plan\n',
    'docs/sprints/one.md': '_From plan: docs/plans/demo.md_\n',
    'docs/guide.md': '# My own guide\n',
    'CLAUDE.md': 'Read docs/handoff-queue.md first.\n',
  }
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  git(root, 'init', '-q')
  git(root, 'add', '-A')
  git(root, 'commit', '-qm', 'v1')
  return root
}

const read = (root, path) => readFileSync(join(root, path), 'utf8')

test('moves only pod files, fixes their links, writes the version line, and names old paths elsewhere', t => {
  const root = v1Project(t)
  const report = upgrade(root).join('\n')
  for (const path of ['codebase-structure.md', 'handoff-queue.md', 'plans/demo.md', 'sprints/one.md']) {
    assert.ok(existsSync(join(root, 'pod-docs', path)), `pod-docs/${path}`)
    assert.ok(!existsSync(join(root, 'docs', path)), `docs/${path} moved`)
  }
  assert.equal(read(root, 'docs/guide.md'), '# My own guide\n')
  assert.equal(read(root, 'pod-docs/sprints/one.md'), '_From plan: pod-docs/plans/demo.md_\n')
  assert.match(read(root, 'pod-docs/handoff-queue.md'), /see pod-docs\/plans\/demo\.md, pod-docs\/x and mydocs\/plans\/y/)
  assert.match(read(root, 'pod-docs/README.md'), /pod docs: 2/)
  assert.match(git(root, 'status', '--porcelain'), /R {2}docs\/plans\/demo\.md -> pod-docs\/plans\/demo\.md/)
  assert.match(report, /CLAUDE\.md:1:/)
  assert.equal(read(root, 'CLAUDE.md'), 'Read docs/handoff-queue.md first.\n')
})

test('refuses a tree with changes, and changes nothing', t => {
  const root = v1Project(t)
  writeFileSync(join(root, 'docs/plans/draft.md'), 'draft\n')
  assert.throws(() => upgrade(root), /git tree has changes/)
  assert.ok(existsSync(join(root, 'docs/handoff-queue.md')))
  assert.ok(!existsSync(join(root, 'pod-docs')))
})

test('refuses a file that is in both docs/ and pod-docs/, before moving anything', t => {
  const root = v1Project(t)
  mkdirSync(join(root, 'pod-docs'))
  writeFileSync(join(root, 'pod-docs/decisions.md'), '# new\n')
  writeFileSync(join(root, 'docs/decisions.md'), '# old\n')
  git(root, 'add', '-A')
  git(root, 'commit', '-qm', 'both')
  assert.throws(() => upgrade(root), /both docs\/ and pod-docs\/: decisions\.md/)
  assert.ok(existsSync(join(root, 'docs/handoff-queue.md')))
})

test('refuses to run twice, or on a project that is not version 1', t => {
  const root = v1Project(t)
  upgrade(root)
  assert.throws(() => upgrade(root), /already has a `pod docs:` line/)
  const plain = mkdtempSync(join(tmpdir(), 'pod-none-'))
  t.after(() => rmSync(plain, { recursive: true, force: true }))
  git(plain, 'init', '-q')
  assert.throws(() => upgrade(plain), /not a version-1 pod project/)
})
