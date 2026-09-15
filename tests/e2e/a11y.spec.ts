import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { ROUTES, setTheme, THEMES } from './helpers'

/**
 * axe across every route in both themes.
 *
 * Both themes is the point of doing this at all. Nearly every rule axe can fail here is a colour
 * rule, and a colour rule only fails in the theme whose values are wrong — Phase 12 found a
 * contrast failure that existed only in the default theme, on every page.
 *
 * axe finds roughly a third of WCAG issues and none of the ones about meaning. docs/accessibility.md
 * lists what stays manual; this is the floor, not the ceiling.
 */
for (const route of ROUTES) {
  for (const theme of THEMES) {
    test(`axe: ${route} (${theme})`, async ({ page }) => {
      await setTheme(page, theme, route)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()

      // Name the offending selectors in the failure rather than just the count.
      const summary = results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)
      expect(summary, summary.join('\n')).toEqual([])
    })
  }
}

test('the skip link is the first thing a keyboard reaches', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')

  const focused = page.locator(':focus')
  await expect(focused).toHaveAttribute('href', '#main')

  // And following it must actually move focus, which is what tabindex="-1" on <main> is for.
  await page.keyboard.press('Enter')
  await expect(page.locator(':focus')).toHaveAttribute('id', 'main')
})

test('every page has exactly one h1 and no skipped heading levels', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route)

    const levels = await page.$$eval('h1, h2, h3, h4, h5, h6', els => els.map(el => Number(el.tagName[1])))
    expect(levels.filter(l => l === 1), `${route} h1 count`).toHaveLength(1)

    for (let i = 1; i < levels.length; i++) {
      expect(levels[i], `${route}: h${levels[i - 1]} -> h${levels[i]}`).toBeLessThanOrEqual(levels[i - 1] + 1)
    }
  }
})
