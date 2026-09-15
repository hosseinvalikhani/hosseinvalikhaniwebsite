import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

/**
 * Tests for the project's own lint rules.
 *
 * This file exists because of how the raw-ramp ban failed: it was written as a core
 * `no-restricted-syntax` rule, and core ESLint rules never traverse a Vue template — only rules
 * that ask vue-eslint-parser for the template body do. It matched nothing, reported clean on
 * every run, and read exactly like coverage.
 *
 * A custom rule that has never been shown to fail is an assumption, not a check. These feed it
 * a violation and assert it is caught.
 */
const eslint = new ESLint({ cwd: process.cwd() })

async function lint(code: string, filePath: string) {
  const results = await eslint.lintText(code, { filePath })
  return results[0]?.messages ?? []
}

const component = (classAttr: string) => `<template>
  <div class="${classAttr}">text</div>
</template>
`

describe('the raw-ramp-class ban', () => {
  it('rejects a tier-1 ramp step in application code', async () => {
    const messages = await lint(component('text-slate-400'), 'app/components/home/Probe.vue')
    expect(messages.map(m => m.ruleId)).toContain('vue/no-restricted-syntax')
  })

  it.each([
    'bg-brand-400',
    'border-echo-700',
    'ring-signal-400',
    'text-danger-600',
  ])('rejects %s', async (cls) => {
    const messages = await lint(component(cls), 'app/components/home/Probe.vue')
    expect(messages.map(m => m.ruleId)).toContain('vue/no-restricted-syntax')
  })

  it('allows semantic tokens', async () => {
    const messages = await lint(component('bg-surface text-fg-muted border-hairline'), 'app/components/home/Probe.vue')
    expect(messages.map(m => m.ruleId)).not.toContain('vue/no-restricted-syntax')
  })

  /** The design system is where the mapping from ramp step to role actually lives. */
  it('allows ramp steps inside app/components/ds', async () => {
    const messages = await lint(component('text-slate-400'), 'app/components/ds/Probe.vue')
    expect(messages.map(m => m.ruleId)).not.toContain('vue/no-restricted-syntax')
  })

  /** The style guide's whole job is displaying the ramps. */
  it('allows ramp steps in the style guide', async () => {
    const messages = await lint(component('text-slate-400'), 'app/pages/design-system.vue')
    expect(messages.map(m => m.ruleId)).not.toContain('vue/no-restricted-syntax')
  })
})

describe('the accessibility plugin', () => {
  it('is wired up and catching real violations', async () => {
    const code = `<template>\n  <img src="/x.png">\n</template>\n`
    const messages = await lint(code, 'app/components/home/Probe.vue')
    expect(messages.map(m => m.ruleId)).toContain('vuejs-accessibility/alt-text')
  })
})
