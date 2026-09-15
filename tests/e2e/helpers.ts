import type { Page } from '@playwright/test'

/** The five route shapes. Every other page on the site is one of these with different content. */
export const ROUTES = [
  '/',
  '/blog',
  '/blog/markdown-kitchen-sink',
  '/blog/tag/css',
  '/design-system',
] as const

export const THEMES = ['dark', 'light'] as const

export type Theme = (typeof THEMES)[number]

/**
 * Load `route` with `theme` applied before first paint.
 *
 * The theme is stored, not clicked: @nuxtjs/color-mode's inline script reads localStorage and
 * stamps the class on <html> before anything renders, so the page is measured in the theme
 * rather than measured mid-transition into it. That needs one throwaway load to reach the right
 * origin's storage, then a real one.
 */
export async function setTheme(page: Page, theme: Theme, route = '/') {
  await page.goto(route)
  await page.evaluate((value) => {
    try { localStorage.setItem('ds-theme', value) }
    catch { /* storage blocked; the test will still run in the default theme */ }
  }, theme)
  await page.goto(route)
  await page.waitForFunction(
    value => document.documentElement.classList.contains(value),
    theme,
    { timeout: 5000 },
  )
}
