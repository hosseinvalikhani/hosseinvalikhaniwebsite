import type { Page } from '@playwright/test'
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

/**
 * Waits for a smooth scroll to finish, instead of guessing how long one takes.
 *
 * `scroll-behavior: smooth` in base.css animates every hash landing, and the duration is the
 * browser's to pick — it grows with the distance and with how busy the main thread is. A fixed
 * timeout therefore encodes the machine it was written on. It did: the jump to #contact is
 * ~2700px and takes ~900ms to settle, against the 600ms this file used to wait, so the assertion
 * was reading a position mid-flight and only passing because the local machine was fast enough.
 * CI was not, and failed with 147px and then 158px for a landing that settles at 89px — a test
 * about layout failing with a number about timing.
 *
 * So: poll the scroll position until it stops moving. The `scrollTop > 0` condition covers the
 * other half of it — the browser does not always begin the scroll in the same task as the
 * navigation (measured at up to a second after `goto` on a cold page), and without it a settle
 * check resolves instantly against a page that has not started moving yet. The elapsed-time
 * fallback keeps that from hanging on a target that genuinely needs no scroll.
 */
async function settleScroll(page: Page) {
  await page.waitForFunction(() => new Promise<boolean>((resolve) => {
    const box = document.scrollingElement!
    const startedAt = performance.now()
    let previous = box.scrollTop
    let idleFrames = 0

    const tick = () => {
      idleFrames = box.scrollTop === previous ? idleFrames + 1 : 0
      previous = box.scrollTop

      if (idleFrames >= 10 && (box.scrollTop > 0 || performance.now() - startedAt > 1500))
        resolve(true)
      else
        requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }), null, { timeout: 10_000 })
}

/** The sections the nav currently marks as read. Normally none or one. */
function currentSectionLinks(page: Page) {
  return page.$$eval(
    '[data-ds-section-link]',
    els => els.filter(el => el.getAttribute('aria-current') === 'true')
      .map(el => (el as HTMLElement).dataset.dsSectionLink),
  )
}

/*
 * The two tests that name an expected section retry the assertion rather than wait a fixed time
 * for the IntersectionObserver in enhance.js to answer. A fixed wait races the observer's
 * readiness: run on their own rather than behind a loaded suite, `tracks the section under the
 * reader` failed 5 times out of 5 with *nothing* marked, because the page finished loading before
 * the script was listening. It had never failed in the suite, where other tests slowed it down.
 *
 * Retrying does not soften what they pin. The bug they exist for — the indicator naming the
 * section before the one you are reading — is a wrong answer that stays wrong, so the poll runs
 * out its timeout and fails exactly as it would have.
 */
test.describe('section indicator', () => {
  for (const section of SECTIONS) {
    test(`clicking "${section}" marks that section, not the one before it`, async ({ page }) => {
      await page.goto('/')
      await page.locator(`[data-ds-section-link="${section}"]`).click()

      await settleScroll(page)
      await expect.poll(() => currentSectionLinks(page)).toEqual([section])
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

      await expect.poll(
        () => currentSectionLinks(page),
        { message: `scrolled to the middle of ${section}` },
      ).toEqual([section])
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
      await settleScroll(page)
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
      await settleScroll(page)
      const top = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top)
      expect(top, `#${id}`).toBeGreaterThanOrEqual(headerHeight)
      expect(top, `#${id} is offset too far`).toBeLessThan(headerHeight + 64)
    }
  })
})
