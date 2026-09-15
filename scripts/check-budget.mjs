/**
 * Measures the JavaScript and CSS each prerendered route actually loads.
 *
 * "Total JS" means every byte of script a cold visitor parses for that route:
 *
 * - External files the HTML asks for up front — `<script src>` and `modulepreload` — from
 *   anywhere, not just `/_nuxt`. Scoping this to the build directory is the obvious shortcut and
 *   it is wrong: it would step straight over /enhance.js, which after Phase 13 is the only
 *   script on the site, and report a flattering zero.
 * - Inline executable script, which here is @nuxtjs/color-mode's no-flash snippet. It is parsed
 *   and run like any other, and on a page with no external JS it would otherwise read as nothing.
 *
 * `application/ld+json` and `speculationrules` are excluded: both are data the browser reads,
 * never code it executes.
 *
 * Chunks reachable only through a dynamic import are not counted — nothing fetches them until
 * something asks.
 *
 * Sizes come from the `.gz` files Nitro precompresses, so this is the number on the wire rather
 * than a guess at what a CDN might do.
 *
 * Usage: node scripts/check-budget.mjs   (after `npm run generate`)
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import process from 'node:process'

const DIST = '.output/public'

/** Phase 13's table. Bytes, not kilobytes, so the comparison is exact. */
const BUDGET = {
  js: 90 * 1024,
  css: 15 * 1024,
}

/**
 * The SPA shell — no page component, so whatever it loads is the floor every other route builds
 * on. Before Phase 13 that floor was 88 KB, which is the measurement the phase turned on.
 */
const SHELL = '/200.html'

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.name.endsWith('.html')) yield path
  }
}

const transferSize = async (path) => {
  try { return (await stat(`${DIST}${path}.gz`)).size }
  catch { return (await stat(`${DIST}${path}`)).size }
}

const LINK = /<link\b[^>]*\bhref="(\/[^"]+)"[^>]*>/g
const SCRIPT_SRC = /<script\b[^>]*\bsrc="(\/[^"]+)"/g
const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script>/g
const NOT_CODE = /type="application\/ld\+json"|type="speculationrules"/
const STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/g

async function measure(file) {
  const html = await readFile(file, 'utf8')
  const js = new Set()
  const css = new Set()

  for (const match of html.matchAll(LINK)) {
    if (match[1].endsWith('.css')) css.add(match[1])
    // `rel="preload"` alone is not enough to mean script — the hero avatar is preloaded as an
    // image, and counting it as JS quietly inflated this route by the size of an SVG.
    else if (/rel="modulepreload"/.test(match[0]) || /as="script"/.test(match[0])) js.add(match[1])
  }
  for (const match of html.matchAll(SCRIPT_SRC)) js.add(match[1])

  let inlineBytes = 0
  for (const match of html.matchAll(SCRIPT_BLOCK)) {
    if (/\bsrc=/.test(match[1]) || NOT_CODE.test(match[1])) continue
    inlineBytes += Buffer.byteLength(match[2])
  }

  let jsBytes = inlineBytes
  for (const path of js) jsBytes += await transferSize(path)

  /*
    CSS is inlined into every page (see the prerender hook in nuxt.config), so counting only
    <link rel="stylesheet"> would report 0 KB and call it a pass. Bytes do not stop counting
    because they moved: the inline block is compressed with the HTML around it, so it is measured
    the same way — by compressing it and taking the result.
  */
  let cssBytes = 0
  for (const path of css) cssBytes += await transferSize(path)
  for (const match of html.matchAll(STYLE_BLOCK)) {
    cssBytes += gzipSync(Buffer.from(match[1])).length
  }

  return {
    route: file.slice(DIST.length).split('\\').join('/'),
    jsBytes,
    inlineBytes,
    cssBytes,
    files: js.size,
  }
}

const files = []
for await (const file of walk(DIST)) files.push(file)

const rows = []
for (const file of files.sort()) rows.push(await measure(file))

const kb = bytes => `${(bytes / 1024).toFixed(1)} KB`
const failures = []

for (const row of rows) {
  const jsOk = row.jsBytes <= BUDGET.js
  const cssOk = row.cssBytes <= BUDGET.css
  if (!jsOk) failures.push(`${row.route}: JS ${kb(row.jsBytes)} over the ${kb(BUDGET.js)} budget`)
  if (!cssOk) failures.push(`${row.route}: CSS ${kb(row.cssBytes)} over the ${kb(BUDGET.css)} budget`)
  console.log(
    `${jsOk && cssOk ? 'ok  ' : 'FAIL'} ${row.route.padEnd(56)}`
    + ` js ${kb(row.jsBytes).padStart(8)} (${row.files} file${row.files === 1 ? '' : 's'}`
    + ` + ${kb(row.inlineBytes)} inline)  css ${kb(row.cssBytes).padStart(8)}`,
  )
}

const shell = rows.find(r => r.route === SHELL)
const worst = rows.reduce((a, b) => (b.jsBytes > a.jsBytes ? b : a))
const pct = row => `${((row.jsBytes / BUDGET.js) * 100).toFixed(0)}% of the JS budget`

if (shell) console.log(`\nFloor (${SHELL}, no page component): ${kb(shell.jsBytes)} — ${pct(shell)}.`)
console.log(`Worst route: ${kb(worst.jsBytes)} on ${worst.route} — ${pct(worst)}.`)

if (failures.length) {
  console.error(`\n${failures.length} budget failure(s):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log('\nEvery route is within the Phase 13 budgets.')
