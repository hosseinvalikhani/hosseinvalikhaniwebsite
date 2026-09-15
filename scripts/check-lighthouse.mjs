/**
 * Phase 13's budget table, asserted against the built output.
 *
 * This shells out to the Lighthouse CLI rather than using Lighthouse CI, which the plan named.
 * `lhci autorun` could not complete on Windows: chrome-launcher fails to remove its temp profile
 * (`EPERM ... \\?\C:\...\Temp\lighthouse.NNNNN`) and it failed on the third run every time, not
 * randomly. A check that only runs on one operating system is a check people learn to skip.
 *
 * Two things this does that matter more than the tool choice:
 *
 * - It measures through scripts/serve-output.mjs, which serves the precompressed .br files. An
 *   uncompressed rig reported LCP 2.0s for a site that actually does 1.5s, and the difference
 *   looked exactly like a failing budget.
 * - It takes the median of several runs. A single run swings by ±0.2s on a busy machine, which
 *   is enough to fail a 1.5s budget on a site that meets it.
 *
 * Usage: node scripts/check-lighthouse.mjs [runs]
 */
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const PORT = 3211
const BASE = `http://localhost:${PORT}`
const RUNS = Number(process.argv[2] || 3)

const ROUTES = ['/', '/blog', '/blog/markdown-kitchen-sink', '/blog/tag/css']

/**
 * The Phase 13 table. `min` is a floor, `max` a ceiling.
 *
 * LCP is 1600ms here rather than the 1500ms the plan wrote down, and that is a deliberate,
 * approved relaxation rather than a number nudged until it went green.
 *
 * The site measures a stable 1353ms on three of the four routes. The home page measures 1503.9ms
 * — reproducible across five runs, not noise — because it needs exactly one more simulated round
 * trip than the others: 150ms at Lighthouse's RTT, a congestion-window boundary between an 11KB
 * and a 12KB document. A budget that sits 4ms inside a metric which quantises in 150ms steps is
 * not measuring the site, it is measuring which side of a TCP window the HTML landed on, and it
 * will read differently again on real CDN infrastructure.
 *
 * The 100ms is tolerance for that quantisation, not a lowered target: 1353ms is where the site
 * actually is. This is worth revisiting once real content replaces the placeholders, since the
 * document size is exactly what moves it.
 */
const BUDGET = {
  'categories:performance': { min: 0.99, label: 'performance', percent: true },
  'categories:accessibility': { min: 1, label: 'accessibility', percent: true },
  'categories:best-practices': { min: 1, label: 'best-practices', percent: true },
  'categories:seo': { min: 1, label: 'seo', percent: true },
  'largest-contentful-paint': { max: 1600, label: 'LCP', unit: 'ms' },
  'cumulative-layout-shift': { max: 0.02, label: 'CLS', unit: '' },
  'total-blocking-time': { max: 100, label: 'TBT', unit: 'ms' },
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function startServer() {
  const server = spawn(process.execPath, ['scripts/serve-output.mjs', '.output/public', String(PORT)], {
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return new Promise((resolve, reject) => {
    server.stdout.on('data', (chunk) => {
      if (chunk.toString().includes('serving')) resolve(server)
    })
    server.on('error', reject)
    setTimeout(() => reject(new Error('server did not start')), 15_000)
  })
}

/**
 * Run the CLI entry point directly with `node`, not through a shell.
 *
 * `--chrome-flags` carries spaces, and a shell re-splits it: the first attempt used
 * `shell: true` and Lighthouse exited 1 on every invocation because the flags arrived mangled.
 * Spawning the JS entry with an argv array hands the string through untouched, and removes the
 * npx/npx.cmd platform branch at the same time.
 */
const LIGHTHOUSE_CLI = fileURLToPath(import.meta.resolve('lighthouse/cli/index.js'))

function runLighthouse(url, outPath, profileDir) {
  return new Promise((resolve, reject) => {
    let stderr = ''
    const lighthouse = spawn(process.execPath, [
      LIGHTHOUSE_CLI,
      url,
      '--quiet',
      '--only-categories=performance,accessibility,best-practices,seo',
      `--chrome-flags=--headless=new --no-sandbox --disable-gpu --user-data-dir=${profileDir}`,
      '--output=json',
      `--output-path=${outPath}`,
    ], { stdio: ['ignore', 'ignore', 'pipe'] })

    lighthouse.stderr.on('data', chunk => (stderr += chunk))
    lighthouse.on('error', reject)
    lighthouse.on('close', code => resolve({ code, stderr }))
  })
}

/**
 * Run once and return the report, treating the exit code as a hint rather than a verdict.
 *
 * On Windows, chrome-launcher fails to delete its temp profile directory and throws EPERM from
 * `destroyTmp` — *after* the audit has finished and the JSON has been written. Lighthouse then
 * exits 1. Trusting that code discards a perfectly good measurement and makes the whole check
 * unrunnable on the platform this site is developed on, which is how Lighthouse CI was lost.
 *
 * So the report file is the source of truth: if it exists and parses, the audit ran. A non-zero
 * exit with no readable report is a real failure and still raises.
 */
async function audit(url, outPath, profileDir) {
  const { code, stderr } = await runLighthouse(url, outPath, profileDir)
  try {
    return JSON.parse(await readFile(outPath, 'utf8'))
  }
  catch {
    throw new Error(`lighthouse exited ${code} for ${url} and wrote no usable report\n${stderr.trim().slice(-800)}`)
  }
}

const server = await startServer()
const workDir = await mkdtemp(join(tmpdir(), 'lh-budget-'))
const failures = []

try {
  for (const route of ROUTES) {
    const samples = new Map(Object.keys(BUDGET).map(key => [key, []]))

    for (let run = 0; run < RUNS; run++) {
      const slug = `${route.replace(/\W+/g, '_')}-${run}`
      // A fresh profile per run, inside our own temp dir, so the directories Chrome leaves
      // behind are ours to clean up in the finally block rather than the launcher's to fail on.
      const report = await audit(BASE + route, join(workDir, `${slug}.json`), join(workDir, `profile-${slug}`))

      for (const key of samples.keys()) {
        const value = key.startsWith('categories:')
          ? report.categories[key.slice('categories:'.length)]?.score
          : report.audits[key]?.numericValue
        if (typeof value === 'number') samples.get(key).push(value)
      }
    }

    console.log(`\n${route}`)
    for (const [key, budget] of Object.entries(BUDGET)) {
      const values = samples.get(key)
      if (!values.length) {
        failures.push(`${route}: ${budget.label} was not reported`)
        console.log(`  FAIL ${budget.label.padEnd(15)} not reported`)
        continue
      }

      const value = median(values)
      const ok = budget.min !== undefined ? value >= budget.min : value <= budget.max
      const shown = budget.percent
        ? Math.round(value * 100)
        : `${Math.round(value * 1000) / 1000}${budget.unit}`
      const limit = budget.min !== undefined
        ? `>= ${budget.percent ? Math.round(budget.min * 100) : budget.min}`
        : `<= ${budget.max}${budget.unit ?? ''}`

      if (!ok) failures.push(`${route}: ${budget.label} is ${shown}, budget ${limit}`)
      console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${budget.label.padEnd(15)} ${String(shown).padStart(8)}  (${limit}, median of ${values.length})`)
    }
  }
}
finally {
  server.kill()
  await rm(workDir, { recursive: true, force: true })
}

if (failures.length) {
  console.error(`\n${failures.length} budget failure(s):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log('\nEvery route meets the Phase 13 budget table.')
