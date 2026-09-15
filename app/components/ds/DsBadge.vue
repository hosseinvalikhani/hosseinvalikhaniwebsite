<script setup lang="ts">
import { variants } from '~/design/variants'

/**
 * A non-interactive chip: a tag, a skill, a status.
 *
 * Deliberately a <span>, not a button or a link — when a tag needs to navigate, it is wrapped
 * in a DsLink so the interactive element is the thing that says it is interactive.
 *
 * The `sm` padding is set by WCAG 2.2 Target Size, not by taste. A linked chip is the target,
 * and the link box is exactly the chip box, so `py-0.5` made it 22px tall — under the 24×24
 * minimum. The spacing exception does not rescue it either: chips sit 8px apart, so the 24px
 * circles the exception measures would overlap. `py-1` puts it at 26px and the question closes.
 */
const { variant = 'neutral', size = 'md' } = defineProps<{
  variant?: 'neutral' | 'accent' | 'echo'
  size?: 'sm' | 'md'
}>()

const classes = variants(
  'inline-flex items-center rounded-chip font-medium whitespace-nowrap',
  {
    variant: {
      neutral: 'bg-raised text-fg-muted border border-hairline',
      // accent-text, not accent: this is type on the canvas, so it needs the 700 step in light.
      accent: 'bg-brand-400/10 text-accent-text border border-brand-400/25',
      echo: 'bg-echo-400/10 text-link border border-echo-400/25',
    },
    size: {
      sm: 'text-xs px-2.5 py-1',
      md: 'text-sm px-2.5 py-1',
    },
  },
  { variant: 'neutral', size: 'md' },
)
</script>

<template>
  <span :class="classes({ variant, size })">
    <slot />
  </span>
</template>
