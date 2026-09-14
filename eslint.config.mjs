// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // TypeScript's `prop?: T` already states that a prop is optional and defaults to
    // undefined. Requiring a literal `undefined` default on top of that adds noise without
    // adding information, and it fights Vue 3.5's reactive props destructure.
    'vue/require-default-prop': 'off',
  },
})
