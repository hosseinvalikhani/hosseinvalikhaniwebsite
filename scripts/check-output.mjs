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
      ['post cards rendered', /ds-card-link/],
      ['reading time injected', /\d+ min read/],
    ],
  },
  {
    route: '/blog/markdown-kitchen-sink',
    file: `${DIST}/blog/markdown-kitchen-sink/index.html`,
    contains: [
      ['breadcrumb', /<nav aria-label="Breadcrumb"/],
      // Prose overrides resolve by bare name at render time; if the registration is wrong,
      // Content silently falls back to its own defaults and nothing errors.
      ['custom ProseH2', /<h2 id="[^"]*" class="group /],
      ['keyboard-scrollable code block', /<pre tabindex="0" role="region"/],
      ['keyboard-scrollable table', /role="region" aria-label="Table"/],
      ['syntax highlighting', /shiki-themes/],
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
  {
    // A srcset whose largest candidate is a handful of pixels means the page ships a blurred
    // smear where an image should be. @nuxt/image produces this silently when `sizes` uses a
    // unit it cannot resolve, so the generated markup is the only place it is visible.
    name: 'no degenerate image candidates in srcset',
    test: (html) => {
      const srcsets = html.match(/srcset="[^"]*"/g) ?? []
      return srcsets.every((set) => {
        const widths = [...set.matchAll(/ (\d+)w/g)].map(m => Number(m[1]))
        return widths.length === 0 || Math.max(...widths) >= 64
      })
    },
  },
  {
    // An <img> with no width/height reserves no space, so everything below it jumps when the
    // image arrives. Markdown cannot express dimensions, so this is easy to forget and
    // invisible until someone loads the page on a slow connection.
    name: 'every image declares width and height',
    // Attributes are space-separated, so a leading space is a sufficient word boundary.
    // It also avoids the backslash-b word-boundary escape, which collapses to a literal
    // backspace character in most string contexts. That is not theoretical: this rule was
    // first written with it, the pattern then matched no <img> at all, and .every() over an
    // empty array reported a pass. A check that silently matches nothing is worse than none.
    test: (html) => {
      const images = html.match(/<img\s[^>]*>/g) ?? []
      return images.every(tag => / width="/.test(tag) && / height="/.test(tag))
    },
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
