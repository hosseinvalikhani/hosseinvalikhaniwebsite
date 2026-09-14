<script setup lang="ts">
import { variants } from '~/design/variants'

/**
 * A non-interactive chip: a tag, a skill, a status.
 *
 * Deliberately a <span>, not a button or a link — when a tag needs to navigate, it is wrapped
 * in a DsLink so the interactive element is the thing that says it is interactive.
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
      sm: 'text-xs px-2 py-0.5',
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
