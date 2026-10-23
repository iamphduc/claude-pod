// Fails when a string that pod-flow, the evals, or another rule file reads is missing from pod's rule files.
//   node .github/scripts/contracts.mjs   run from the repo root; the list is contracts.txt next to this file.
import { existsSync, readFileSync } from 'node:fs'

const list = readFileSync(new URL('contracts.txt', import.meta.url), 'utf8')
const missing = []
for (const line of list.split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue
  const at = line.indexOf('|')
  const file = line.slice(0, at)
  const text = line.slice(at + 1)
  if (!existsSync(file) || !readFileSync(file, 'utf8').includes(text)) missing.push(`${file}: ${text}`)
}

if (missing.length) {
  console.error(`${missing.length} contract string(s) missing:\n${missing.map(m => `  ${m}`).join('\n')}`)
  process.exit(1)
}
console.log('all contract strings present')
