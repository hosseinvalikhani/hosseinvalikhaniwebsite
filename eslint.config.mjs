// @ts-check
import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'
import withNuxt from './.nuxt/eslint.config.mjs'

/**
 * The raw-ramp-class ban.
 *
 * Tier 1 of the token layer — `brand-400`, `slate-800`, `echo-700` — exists so that the semantic
 * tokens have somewhere to point. Reaching past them to a ramp step in application code is how a
 * design system quietly stops being one: the value is correct today and wrong the moment the
 * theme flips, because a ramp step names a colour and a semantic token names a role.
 *
 * `app/components/ds/**` is exempt because that is where the mapping lives, and the style guide is
 * exempt because its entire job is displaying the ramps.
 */
const RAW_RAMP = String.raw`\b(bg|text|border|ring|from|to|via|decoration|outline|fill|stroke|shadow|accent|caret|divide|placeholder)-(brand|echo|slate|signal|danger)-\d{2,3}\b`

export default withNuxt(
  ...vuejsAccessibility.configs['flat/recommended'],

  {
    rules: {
      // TypeScript's `prop?: T` already states that a prop is optional and defaults to
      // undefined. Requiring a literal `undefined` default on top of that adds noise without
      // adding information, and it fights Vue 3.5's reactive props destructure.
      'vue/require-default-prop': 'off',

      /*
        Icons are aria-hidden by construction (see DsIcon), and an icon-only control's name comes
        from the aria-label the prop type forces the caller to supply. The rule cannot see either,
        so it flags every icon button in the codebase. The guarantee it is asking for is enforced
        by TypeScript instead, which is stricter.
      */
      'vuejs-accessibility/anchor-has-content': 'off',

      /*
        `aria-current-value` is NuxtLink's *prop*, not a DOM attribute — it decides what value the
        router stamps into the real `aria-current`. A template linter cannot tell a component prop
        from an attribute, so it reads every one of ours as an invalid ARIA attribute. The rule has
        no option to teach it otherwise.

        Nothing is lost by turning it off: axe's `aria-valid-attr` is the same check, run against
        rendered DOM in tests/e2e/a11y.spec.ts, where NuxtLink has already consumed the prop and
        only real attributes remain. That is the more truthful place to ask the question anyway.
      */
      'vuejs-accessibility/aria-props': 'off',
    },
  },

  {
    // Vue files only: the ban is about class attributes, which is where these appear.
    files: ['app/**/*.vue'],
    ignores: ['app/components/ds/**', 'app/pages/design-system.vue'],
    rules: {
      /*
        `vue/no-restricted-syntax`, not the core rule.

        Core ESLint rules never traverse the template: vue-eslint-parser only exposes template AST
        to rules that ask for it, so the core version of this matched nothing and reported clean
        forever. A rule that cannot fail is worse than no rule, because it reads as coverage.
        This one is verified by tests/lint-rules.spec.ts, which feeds it a violation and asserts
        it is caught.
      */
      'vue/no-restricted-syntax': ['error', {
        selector: `VAttribute[key.name='class'] > VLiteral[value=/${RAW_RAMP}/]`,
        message: 'Use a semantic token (bg-surface, text-fg-muted, border-hairline) rather than a raw ramp step. Ramp steps are tier 1 and only app/components/ds/** may name them.',
      }],
    },
  },

  {
    // Node scripts are not part of the app, and run outside the Nuxt auto-import context.
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
)
