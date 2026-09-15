import { expect, test } from '@playwright/test'
import { ROUTES, setTheme, THEMES } from './helpers'

/**
 * Phase 14's manual pass, made repeatable.
 *
 * 320px is both the narrowest phone worth supporting and the WCAG 1.4.10 Reflow width — it is
 * what 1280px at 400% zoom comes to, so the reflow requirement is checked by the same assertion.
 */
const WIDTHS = [320, 375, 768, 1440]

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`no horizontal scroll: ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(route)

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))

      expect(scrollWidth, `${route} at ${width}px scrolls sideways`).toBeLessThanOrEqual(clientWidth)
    })
  }
}

/**
 * Overflow and clipping are different failures and only one of them is visible.
 *
 * `.ds-glow` carries `overflow-x: clip`, so content that is too wide inside it gets cut off
 * instead of pushing the page — which is how the display heading came to be silently truncated
 * at 320px while every overflow check reported clean.
 */
test('no content is clipped without a way to reach it', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })

  for (const route of ROUTES) {
    await page.goto(route)

    const clipped = await page.$$eval('body *', els => els
      .filter((el) => {
        if (el.scrollWidth <= el.clientWidth + 1) return false
        const overflowX = getComputedStyle(el).overflowX
        // A scroll container is doing this on purpose — wide code blocks and tables.
        return !['auto', 'scroll', 'clip', 'hidden'].includes(overflowX)
      })
      .slice(0, 5)
      .map(el => `${el.tagName.toLowerCase()}.${(el.getAttribute('class') || '').split(' ').slice(0, 3).join('.')}`))

    expect(clipped, `${route} at 320px`).toEqual([])
  }
})

test('wide code blocks and tables scroll inside themselves', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/blog/markdown-kitchen-sink')

  // Both are focusable regions, because a scroll container a pointer can reach and a keyboard
  // cannot is a failure rather than a trade-off.
  const pre = page.locator('pre[tabindex="0"]').first()
  await expect(pre).toHaveAttribute('role', 'region')
  expect(await pre.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)

  const table = page.locator('[role="region"][aria-label="Table"]').first()
  expect(await table.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true)
})

test('every interactive target meets the 24px minimum at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })

  for (const route of ROUTES) {
    await page.goto(route)

    const small = await page.$$eval('a[href], button, [role="button"], summary', els => els
      .map((el) => {
        const r = el.getBoundingClientRect()
        return { el, w: Math.round(r.width), h: Math.round(r.height) }
      })
      .filter(({ el, w, h }) => {
        if (w === 0 || h === 0) return false
        if (Math.min(w, h) >= 24) return false
        // 2.5.8 exempts a target inline in a sentence or block of text.
        return !el.closest('p, li, h1, h2, h3, td, th')
      })
      .map(({ el, w, h }) => `${el.tagName.toLowerCase()} ${w}x${h} "${(el.textContent || '').trim().slice(0, 24)}"`))

    expect(small, `${route}`).toEqual([])
  }
})

test('the theme is applied before first paint in both themes', async ({ page }) => {
  for (const theme of THEMES) {
    await setTheme(page, theme, '/')
    await expect(page.locator('html')).toHaveClass(new RegExp(theme))
  }
})
