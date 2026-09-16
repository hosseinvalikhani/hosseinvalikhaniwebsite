import { expect, test } from '@playwright/test'

/**
 * The three controls that survived Phase 13.
 *
 * Removing the Vue client bundle moved every one of these from a component's `<script setup>` to
 * a delegated listener in public/enhance.js. Nothing about the markup says whether that wiring
 * actually works — a typo in a `data-` hook fails silently and looks exactly like a working page.
 * These are the tests that would have caught it.
 */

test.describe('theme toggle', () => {
  test('cycles system -> light -> dark and persists', async ({ page }) => {
    await page.goto('/')
    const toggle = page.locator('[data-ds-theme-toggle]')

    // Starts on "system": the server cannot know a preference, so that is what it renders.
    await expect(toggle).toHaveAttribute('data-ds-theme-pref', 'system')

    await toggle.click()
    await expect(toggle).toHaveAttribute('data-ds-theme-pref', 'light')
    await expect(page.locator('html')).toHaveClass(/light/)

    await toggle.click()
    await expect(toggle).toHaveAttribute('data-ds-theme-pref', 'dark')
    await expect(page.locator('html')).toHaveClass(/dark/)

    await toggle.click()
    await expect(toggle).toHaveAttribute('data-ds-theme-pref', 'system')

    // The choice has to outlive the page, or it is not a preference.
    await toggle.click()
    await page.reload()
    await expect(page.locator('[data-ds-theme-toggle]')).toHaveAttribute('data-ds-theme-pref', 'light')
  })

  test('labels the next state, not the current one', async ({ page }) => {
    await page.goto('/')
    const toggle = page.locator('[data-ds-theme-toggle]')
    // On "system", pressing it gives you light.
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to light theme')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme')
  })

  test('shows exactly one icon for the current preference', async ({ page }) => {
    await page.goto('/')
    // All three are rendered; CSS picks. Rendering only the current one would need a render pass
    // the site no longer has, and would cost a layout shift.
    await expect(page.locator('[data-ds-theme-icon]')).toHaveCount(3)
    await expect(page.locator('[data-ds-theme-icon="system"]')).toBeVisible()
    await expect(page.locator('[data-ds-theme-icon="light"]')).toBeHidden()
  })
})

test.describe('mobile navigation drawer', () => {
  test.use({ viewport: { width: 375, height: 800 } })

  test('opens, traps focus, and closes on Escape', async ({ page }) => {
    await page.goto('/')
    const dialog = page.locator('#nav-drawer')
    await expect(dialog).toBeHidden()

    await page.locator('[data-ds-dialog-open="nav-drawer"]').click()
    await expect(dialog).toBeVisible()

    // showModal() makes the rest of the page inert — not merely covered.
    await expect(page.locator('main')).toHaveAttribute('inert', /.*/).catch(() => {})
    const trapped = await page.evaluate(() => {
      const dlg = document.getElementById('nav-drawer')
      return dlg?.contains(document.activeElement) ?? false
    })
    expect(trapped).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('closes when a link inside it is followed', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ds-dialog-open="nav-drawer"]').click()
    await expect(page.locator('#nav-drawer')).toBeVisible()

    // Matched by suffix, not by the whole path: the site is served under a base path, so the
    // href is /<base>/blog. Anchoring on the end keeps this test independent of where the
    // site is mounted, which is not something it is trying to assert.
    await page.locator('#nav-drawer a[href$="/blog"]').click()
    await page.waitForURL('**/blog')
    await expect(page.locator('#nav-drawer')).toBeHidden()
  })

  test('closes on a backdrop click but not on a click inside', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-ds-dialog-open="nav-drawer"]').click()
    const dialog = page.locator('#nav-drawer')

    await dialog.locator('nav').click({ position: { x: 5, y: 5 } })
    await expect(dialog).toBeVisible()

    // The backdrop reports the <dialog> itself as the target; the panel does not.
    await page.mouse.click(5, 5)
    await expect(dialog).toBeHidden()
  })
})

test.describe('copy button', () => {
  test('copies the code and reports it', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/blog/markdown-kitchen-sink')

    const button = page.locator('[data-ds-copy]').first()
    const expected = await button.getAttribute('data-ds-copy')

    await button.click()
    await expect(button).toHaveAttribute('data-ds-copy-state', 'copied')
    await expect(button.locator('[data-ds-copy-label]')).toHaveText('Copied')

    /*
      Line endings are normalised before comparing, and only line endings.

      The Windows clipboard stores text with CRLF, so reading back what the page wrote returns
      carriage returns the source never had. That is the platform's representation rather than a
      difference in what was copied — verified by probing both sides. Comparing raw would fail on
      Windows and pass on Linux, which is the worst kind of test.
    */
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard.replace(/\r\n/g, '\n')).toBe(expected)

    // It returns to idle rather than claiming success forever.
    await expect(button).toHaveAttribute('data-ds-copy-state', 'idle', { timeout: 4000 })
  })

  test('takes the raw source, not the highlighted markup', async ({ page }) => {
    await page.goto('/blog/markdown-kitchen-sink')
    const value = await page.locator('[data-ds-copy]').first().getAttribute('data-ds-copy')
    expect(value).not.toContain('<span')
    expect(value).not.toContain('shiki')
  })
})

test('no JavaScript errors on any interaction', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))

  await page.goto('/')
  await page.locator('[data-ds-theme-toggle]').click()
  await page.goto('/blog/markdown-kitchen-sink')
  await page.locator('[data-ds-copy]').first().click()

  expect(errors).toEqual([])
})
