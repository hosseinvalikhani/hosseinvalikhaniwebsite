/**
 * Measures every semantic token pair the site actually renders, in both themes.
 *
 * This exists because the Phase 12 audit found a failure that reading the CSS could never have
 * caught: `--ds-fg-subtle` was slate-500, which *looks* like a reasonable third text tier and
 * measures 3.46:1 on the raised surface. Dates, reading time, table headers and the copyright
 * line were all shipping below AA, in the default theme, on every page.
 *
 * A contrast table written by hand goes stale the first time a token moves. This reads the
 * tokens out of tokens.css, so it can only ever report what is really there.
 *
 * Usage: node scripts/check-contrast.mjs
 */
import { readFile } from 'node:fs/promises'
import process from 'node:process'

const TOKENS = 'app/assets/css/tokens.css'

/**
 * Parse the two theme blocks. `:root, :root.dark` is the default theme and `:root.light` the
 * other; the `prefers-contrast: more` block only ever widens what these establish, so passing
 * here is what matters.
 */
async function readThemes() {
  const css = await readFile(TOKENS, 'utf8')

  const block = (selector) => {
    const start = css.indexOf(selector)
    if (start === -1) throw new Error(`${TOKENS}: no "${selector}" block`)
    const open = css.indexOf('{', start)
    const close = css.indexOf('}', open)
    return Object.fromEntries(
      [...css.slice(open, close).matchAll(/--ds-([\w-]+):\s*(#[0-9a-f]{6})/gi)]
        .map(([, name, hex]) => [name, hex.toLowerCase()]),
    )
  }

  return { dark: block(':root,\n:root.dark'), light: block(':root.light') }
}

const channel = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => channel(Number.parseInt(hex.slice(i, i + 2), 16) / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** The three backgrounds anything can land on, worst case included. */
const SURFACES = ['canvas', 'surface', 'raised']

/**
 * 4.5:1 — everything below is ordinary body text somewhere on the site. `fg-subtle` is the one
 * that invites the wrong assumption: the name says de-emphasised, but it carries post dates,
 * reading time, table headers and the footer line, all at 13–14px, all of it text.
 */
const TEXT = ['fg', 'fg-muted', 'fg-subtle', 'accent-text', 'link', 'link-hover', 'signal', 'danger']

/**
 * 3:1 — boundaries and indicators that identify a component (1.4.11).
 *
 * `hairline` is absent by design: it draws card edges and section rules, which identify nothing.
 * `accent` is absent for the same reason — as a fill it is measured through `accent-edge`, and
 * its other uses (the avatar ring, the blockquote rule, the timeline node) are decoration.
 * Holding decoration to a component threshold is how a rule stops being taken seriously.
 */
const NON_TEXT = [
  ['on-accent', 'accent', 'button label on its fill'],
  ['on-accent', 'accent-hover', 'button label, hovered'],
  ['focus', 'canvas', 'focus ring'],
  ['focus', 'surface', 'focus ring on a card'],
  ['focus', 'raised', 'focus ring on a raised panel'],
  ['hairline-strong', 'canvas', 'secondary button and contact chip borders'],
  ['hairline-strong', 'surface', 'the same borders inside a card'],
  ['accent-edge', 'canvas', 'primary button edge'],
  ['accent-edge', 'surface', 'primary button edge inside a card'],
  ['accent-edge', 'raised', 'primary button edge on a raised panel'],
]

const themes = await readThemes()
const failures = []

for (const [theme, t] of Object.entries(themes)) {
  console.log(`\n${theme}`)

  for (const fg of TEXT) {
    for (const bg of SURFACES) {
      const r = ratio(t[fg], t[bg])
      const ok = r >= 4.5
      if (!ok) failures.push(`${theme}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs 4.5:1 (1.4.3)`)
      console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${`${fg} on ${bg}`.padEnd(30)} ${r.toFixed(2)}:1`)
    }
  }

  for (const [fg, bg, what] of NON_TEXT) {
    const r = ratio(t[fg], t[bg])
    const ok = r >= 3
    if (!ok) failures.push(`${theme}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs 3:1 — ${what} (1.4.11)`)
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${`${fg} on ${bg}`.padEnd(30)} ${r.toFixed(2)}:1  ${what}`)
  }
}

if (failures.length) {
  console.error(`\n${failures.length} contrast failure(s):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log('\nAll token pairs meet WCAG 2.2 AA in both themes.')
