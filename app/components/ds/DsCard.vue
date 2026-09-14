<script setup lang="ts">
/**
 * A surface panel. Deliberately dumb: it draws an edge and a background, nothing else.
 *
 * To make a whole card clickable, put `class="ds-card-link"` on the link that should own it —
 * normally the title. That link's `::after` then covers the card, which gives one tab stop and
 * an accessible name equal to the title.
 *
 * The alternatives are both worse: a click handler on the container leaves keyboard users with
 * nothing to focus, and wrapping the entire card in an `<a>` makes its accessible name the
 * card's full text content, read out in one breath.
 */
const { as = 'div', interactive = false } = defineProps<{
  as?: string
  /** Hover affordance for cards made clickable by a `ds-card-link` inside them. */
  interactive?: boolean
}>()
</script>

<template>
  <component
    :is="as"
    class="relative rounded-card border border-hairline bg-surface transition-colors duration-base ease-out-quint"
    :class="interactive ? 'hover:border-hairline-strong hover:bg-raised' : ''"
  >
    <slot name="media" />
    <div class="p-6">
      <slot />
    </div>
  </component>
</template>
