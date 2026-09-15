import { defineConfig } from 'vitest/config'

/**
 * Unit tests only — the pure logic that has no Nuxt runtime around it.
 *
 * Anything that needs a rendered page is an end-to-end test against the *built* output
 * (tests/e2e), because this site ships no client framework: mounting a component in a test
 * renderer would exercise a code path production does not have.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.spec.ts', 'tests/*.spec.ts'],
    reporters: ['default'],
  },
})
