/**
 * Smoke-checks the generated site.
 *
 * This exists because of a failure mode that bit twice during the build: an auto-import name
 * that does not resolve renders as an empty comment node, and Vue's "failed to resolve
 * component" warning is dev-only — so `nuxt generate` reported 0 errors, 0 warnings while the
 * page was missing its header, footer and hero.
 *
 * An exit code is not evidence that a page has content in it. This asserts the things whose
 * absence the build cannot detect.
 *
 * Usage: node scripts/check-output.mjs   (after `npm run generate`)
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import process from 'node:process'

const DIST = '.output/public'

/** Each route, and the markers that prove it actually rendered. */
const EXPECTATIONS = [
  {
    route: '/',
    file: `${DIST}/index.html`,
    contains: [
      ['skip link', /<a href="#main"/],
      ['header landmark', /<header/],
      ['main landmark', /<main id="main" tabindex="-1"/],
      ['footer landmark', /<footer/],
      ['labelled main nav', /<nav aria-label="Main"/],
      ['hero h1', /<h1[^>]*>/],
      ['hero actions', /View my work/],
      ['about section', /id="about"/],
    ],
  },
  {
    route: '/blog',
    file: `${DIST}/blog/index.html`,
    contains: [
      ['header landmark', /<header/],
      ['main landmark', /<main id="main"/],
    ],
  },
  {
    route: '/design-system',
    file: `${DIST}/design-system/index.html`,
    contains: [
      ['noindex', /<meta name="robots" content="noindex/],
      ['ramps', /Three ramps/],
      ['components', /Four variants/],
    ],
  },
]

/** Structural rules that must hold on every indexable page. */
const RULES = [
  {
    name: 'exactly one <h1>',
    test: html => (html.match(/<h1[\s>]/g) ?? []).length === 1,
  },
  {
    name: 'at most one aria-current="page"',
    test: html => (html.match(/aria-current="page"/g) ?? []).length <= 1,
  },
]

let failures = 0

function fail(message) {
  failures += 1
  console.error(`  ✖ ${message}`)
}

for (const { route, file, contains } of EXPECTATIONS) {
  if (!existsSync(file)) {
    fail(`${route}: ${file} was not generated`)
    continue
  }

  const html = await readFile(file, 'utf8')
  console.log(`${route}`)

  for (const [label, pattern] of contains) {
    if (pattern.test(html)) console.log(`  ✓ ${label}`)
    else fail(`${route}: missing ${label} (${pattern})`)
  }

  for (const rule of RULES) {
    if (rule.test(html)) console.log(`  ✓ ${rule.name}`)
    else fail(`${route}: ${rule.name}`)
  }
}

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}

console.log('\nAll output checks passed.')
