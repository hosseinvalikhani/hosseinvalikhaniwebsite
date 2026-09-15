import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against the **built** output, never the dev server.
 *
 * That is not a preference. `features.noScripts` is production-only, so in dev the page still
 * hydrates and a test would exercise a code path production does not have — the one thing these
 * tests exist to rule out. The precompressed files Lighthouse and the budget check read only
 * exist after a build, too.
 */
const PORT = 3210
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    // `generate` is assumed to have run; the CI workflow does it as its own step so a build
    // failure is reported as a build failure rather than as a timed-out web server.
    command: `node scripts/serve-output.mjs .output/public ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
