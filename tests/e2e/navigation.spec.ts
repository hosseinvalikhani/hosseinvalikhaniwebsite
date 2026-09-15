import { expect, test } from '@playwright/test'

/**
 * Regression tests for two bugs found by review rather than by any check.
 *
 * Both were invisible to the tooling of the time: the indicator bug looked like a styling quirk,
 * and the scroll offset looked like generous whitespace. They are pinned here because the causes
 * — an attribute-presence selector, and two scroll offsets that add rather than reinforce — are
 * both the kind of thing a later simplification reintroduces without noticing.
 */

const SECTIONS = ['about', 'experience', 'skills', 'contact'] as const

test.describe('section indicator', () => {
  for (const section of SECTIONS) {
    test(`clicking "${section}" marks that section, not the one before it`, async ({ page }) => {
      await page.goto('/')
      await page.locator(`[data-ds-section-link="${section}"]`).click()

      // Wait out the smooth scroll and let the observer settle.
      await page.waitForTimeout(1200)

      const current = await page.$$eval(
        '[data-ds-section-link]',
        els => els.filter(el => el.getAttribute('aria-current') === 'true')
          .map(el => (el as HTMLElement).dataset.dsSectionLink),
      )
      expect(current).toEqual([section])
    })
  }

  test('tracks the section under the reader while scrolling', async ({ page }) => {
    await page.goto('/')

    for (const section of SECTIONS) {
      await page.evaluate((id) => {
        const el = document.getElementById(id)!
        const middle = window.scrollY + el.getBoundingClientRect().top + Math.min(el.offsetHeight / 2, 300)
        window.scrollTo({ top: middle, behavior: 'instant' })
      }, section)
      await page.waitForTimeout(500)

      const current = await page.$$eval(
        '[data-ds-section-link]',
        els => els.filter(el => el.getAttribute('aria-current') === 'true')
          .map(el => (el as HTMLElement).dataset.dsSectionLink),
      )
      expect(current, `scrolled to the middle of ${section}`).toEqual([section])
    }
  })

  /**
   * The bug itself: `.ds-nav-link[aria-current]` matched `aria-current="false"` too, because
   * attribute-presence selectors do not care about the value. Every nav item rendered as current.
   */
  test('marks at most one link current at a time', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(800)
    const count = await page.locator('[data-ds-section-link][aria-current="true"]').count()
    expect(count).toBeLessThanOrEqual(1)
  })
})

test.describe('hash targets clear the sticky header', () => {
  test('a section lands below the header, not behind it', async ({ page }) => {
    await page.goto('/')
    const headerHeight = await page.locator('[data-ds-header]').evaluate(el => el.getBoundingClientRect().height)

    for (const section of SECTIONS) {
      await page.goto(`/#${section}`)
      await page.waitForTimeout(600)
      const top = await page.locator(`#${section}`).evaluate(el => el.getBoundingClientRect().top)

      expect(top, `#${section} must not be behind the header`).toBeGreaterThanOrEqual(headerHeight)
      // And not parked absurdly far down: scroll-padding and scroll-margin used to stack, which
      // put every target at twice the intended offset.
      expect(top, `#${section} is offset too far`).toBeLessThan(headerHeight + 64)
    }
  })

  test('a post heading anchor clears the header too', async ({ page }) => {
    await page.goto('/blog/markdown-kitchen-sink')
    const headerHeight = await page.locator('[data-ds-header]').evaluate(el => el.getBoundingClientRect().height)

    const ids = await page.$$eval('article h2[id]', els => els.slice(0, 3).map(el => el.id))
    expect(ids.length).toBeGreaterThan(0)

    for (const id of ids) {
      await page.goto(`/blog/markdown-kitchen-sink#${id}`)
      await page.waitForTimeout(500)
      const top = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top)
      expect(top, `#${id}`).toBeGreaterThanOrEqual(headerHeight)
      expect(top, `#${id} is offset too far`).toBeLessThan(headerHeight + 64)
    }
  })
})
