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
import { readdir, readFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
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
      ['og image', /property="og:image"/],
      ['feed autodiscovery', /rel="alternate" type="application\/rss\+xml"/],
      ['ProfilePage schema', /"ProfilePage"/],
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
      ['article schema', /"BlogPosting"/],
      // The article must point at the site-wide Person rather than restating it inline.
      ['author linked to the site identity', /"author":\{"@id":"[^"]*#identity"\}/],
      ['og:type article', /property="og:type" content="article"/],
    ],
  },
  {
    route: '/blog/tag/accessibility',
    file: `${DIST}/blog/tag/accessibility/index.html`,
    contains: [
      ['tag heading', /accessibility/],
      ['post cards rendered', /ds-card-link/],
      ['breadcrumb', /<nav aria-label="Breadcrumb"/],
    ],
  },
  {
    // Nuxt writes an empty SPA shell here by default; scripts/static-404.mjs replaces it with
    // the prerendered route. If that step is skipped the file still exists and still returns
    // 404, it is just blank without JavaScript — which no build error would reveal.
    route: '/404.html (static, not the SPA shell)',
    file: `${DIST}/404.html`,
    contains: [
      ['rendered heading', /This page does not exist/],
      ['header landmark', /<header/],
      ['footer landmark', /<footer/],
      ['noindex', /name="robots" content="noindex/],
    ],
  },
  {
    route: '/rss.xml',
    file: `${DIST}/rss.xml`,
    contains: [
      ['rss root', /<rss version="2\.0"/],
      // Without atom:self some aggregators cannot identify a feed after a domain change and
      // re-deliver every item as new.
      ['atom self link', /rel="self"/],
      ['absolute item links', /<link>https:\/\//],
      ['no unresolved site url', /^(?!.*localhost)[\s\S]*$/],
    ],
  },
  {
    route: '/feed.json',
    file: `${DIST}/feed.json`,
    contains: [
      ['json feed 1.1', /jsonfeed\.org\/version\/1\.1/],
      ['absolute item ids', /"id":"https:\/\//],
    ],
  },
  {
    route: '/llms.txt',
    file: `${DIST}/llms.txt`,
    contains: [
      ['heading', /^# /],
      ['posts section', /## Posts/],
    ],
  },
  {
    route: '/robots.txt',
    file: `${DIST}/robots.txt`,
    contains: [
      ['sitemap reference', /Sitemap: https:\/\//],
      ['style guide disallowed', /Disallow: \/design-system/],
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

/**
 * Structural rules that must hold on every indexable HTML page.
 *
 * They are applied only to files ending in .html — running "exactly one <h1>" against
 * rss.xml or robots.txt produces failures that are noise, and noise is how a failing check
 * gets ignored.
 */
const RULES = [
  {
    // A page with no canonical, or with two, is the most common way a prerendered site ends up
    // competing with itself in search results.
    name: 'exactly one canonical link',
    test: html => (html.match(/rel="canonical"/g) ?? []).length === 1,
  },
  {
    // One merged graph, not several disconnected ones. nuxt-schema-org assigns stable @ids and
    // merges every page's additions; several blocks would mean something bypassed it.
    name: 'exactly one JSON-LD block, and it parses',
    test: (html) => {
      const blocks = html.match(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g) ?? []
      if (blocks.length !== 1) return false
      try {
        JSON.parse(blocks[0].replace(/^[^>]*>/, '').replace(/<\/script>$/, ''))
        return true
      }
      catch {
        return false
      }
    },
  },
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

/**
 * content/blog/draft-should-not-appear.md is a permanent fixture: a post with draft: true whose
 * text must never reach the built site. Draft filtering has to hold in five separate places
 * (listing query, tag pages, sitemap, both feeds, llms.txt) and a leak in any one of them is
 * silent — the post simply appears where it should not.
 */
const DRAFT_MARKER = 'A draft that must not be published'
const DRAFT_MUST_NOT_APPEAR_IN = [
  'sitemap.xml',
  'rss.xml',
  'feed.json',
  'llms.txt',
  'blog/index.html',
  'blog/tag/meta/index.html',
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

  if (!file.endsWith('.html')) continue

  for (const rule of RULES) {
    if (rule.test(html)) console.log(`  ✓ ${rule.name}`)
    else fail(`${route}: ${rule.name}`)
  }
}

console.log('draft exclusion')
for (const relative of DRAFT_MUST_NOT_APPEAR_IN) {
  const file = `${DIST}/${relative}`
  if (!existsSync(file)) {
    fail(`draft check: ${file} was not generated`)
    continue
  }
  const contents = await readFile(file, 'utf8')
  if (contents.includes(DRAFT_MARKER)) fail(`draft leaked into ${relative}`)
  else console.log(`  ✓ absent from ${relative}`)
}

/*
  Metadata across every prerendered route, not just the named ones above.

  EXPECTATIONS lists routes by hand, which is the right shape for "did this page render at all"
  and the wrong shape for "is every page's metadata sound" — a new route would simply never be
  checked. This walks the output instead, so coverage grows with the site.

  Uniqueness is the part that cannot be checked one page at a time. Two routes sharing a title or
  a description is how a small site ends up competing with itself in search results, and it only
  becomes visible when they are all in the same list.

  Pages marked noindex are excluded from the uniqueness comparison but still have to carry a
  title: /404 and /design-system are deliberately not indexable, and /404.html is a byte-for-byte
  copy of /404/index.html, so requiring them to differ would be asserting a bug.
*/
async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* htmlFiles(path)
    else if (entry.name.endsWith('.html')) yield path
  }
}

console.log('metadata')

const titles = new Map()
const descriptions = new Map()

for await (const file of htmlFiles(DIST)) {
  const route = file.slice(DIST.length).split(sep).join('/')

  // The SPA fallback shell has no page component and therefore no metadata by design.
  if (route === '/200.html') continue

  const html = await readFile(file, 'utf8')
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim()
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim()
  const canonicals = (html.match(/rel="canonical"/g) ?? []).length
  const noindex = /content="[^"]*noindex/.test(html)

  if (!title) fail(`${route}: no <title>`)
  if (!description) fail(`${route}: no meta description`)
  if (canonicals !== 1) fail(`${route}: ${canonicals} canonical links, expected exactly 1`)

  if (noindex) continue
  if (title) {
    if (titles.has(title)) fail(`${route}: duplicate title, shared with ${titles.get(title)} — "${title}"`)
    else titles.set(title, route)
  }
  if (description) {
    if (descriptions.has(description)) fail(`${route}: duplicate description, shared with ${descriptions.get(description)}`)
    else descriptions.set(description, route)
  }
}

console.log(`  ✓ ${titles.size} indexable route(s) with a unique title and description`)

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}

console.log('\nAll output checks passed.')
