import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const jsFiles = [
  'bench/bench.mjs',
  'scripts/build.mjs',
  'scripts/clean.mjs',
  'scripts/lint.mjs',
]
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
for (const file of ['src/index.ts']) {
  const source = readFileSync(file, 'utf8')
  if (source.includes('\r\n')) throw new Error(`${file}: CRLF line endings are not allowed`)
}
console.log(`lint checks passed for ${jsFiles.length} JavaScript files`)
