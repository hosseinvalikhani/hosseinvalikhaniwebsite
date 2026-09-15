import { expect, test } from '@playwright/test'
import { ROUTES } from './helpers'

/**
 * Every route must load everything it asks for.
 *
 * This exists because of a bug that nothing else caught. Inlining the stylesheet moved
 * `url(../_fonts/x.woff2)` out of `/_nuxt/entry.css` and into the page, where a relative URL
 * resolves against the page instead — correct at `/`, and 404 on `/blog/tag/css`, which became
 * `/blog/_fonts/x.woff2`.
 *
 * The page still rendered. Nothing threw. The only symptoms were prose quietly set in Arial and
 * two console 404s, and it was found by a Lighthouse best-practices score dropping to 96 on one
 * nested route. A request that fails is worth asserting on directly rather than inferring from a
 * score, and nested routes are worth testing precisely because the root path hides this class of
 * bug by being the one depth at which relative paths happen to work.
 */
for (const route of ROUTES) {
  test(`no failed requests: ${route}`, async ({ page }) => {
    const failures: string[] = []

    page.on('response', (response) => {
      if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`)
    })
    page.on('requestfailed', (request) => {
      failures.push(`failed ${request.url()} (${request.failure()?.errorText})`)
    })

    await page.goto(route, { waitUntil: 'networkidle' })
    expect(failures, failures.join('\n')).toEqual([])
  })
}

test('the web font actually loads, rather than silently falling back', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'networkidle' })

    const loaded = await page.evaluate(async () => {
      await document.fonts.ready
      return [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family)
    })

    expect(loaded, `${route} loaded no Inter face`).toContain('Inter')
  }
})

test('no console errors on any route', async ({ page }) => {
  for (const route of ROUTES) {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })

    await page.goto(route, { waitUntil: 'networkidle' })
    expect(errors, `${route}`).toEqual([])
    page.removeAllListeners('console')
  }
})
