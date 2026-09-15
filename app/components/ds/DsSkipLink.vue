<script setup lang="ts">
/**
 * The first focusable element on the page.
 *
 * Visually hidden until focused — never `display: none` or `visibility: hidden`, both of which
 * remove it from the tab order entirely and make it useless to the people it exists for.
 *
 * The target needs `tabindex="-1"` for focus to actually land on it in every browser; the
 * layout sets that on <main>.
 *
 * `fixed`, not `absolute`. With `absolute` the containing block is the initial one, so `top-4`
 * meant four units from the top of the *document* — reach the link again from part-way down a
 * long post and it slides into a position that is already scrolled off screen, which is a
 * focused element the visitor cannot see (2.4.11 Focus Not Obscured).
 */
const { to = '#main', label = 'Skip to main content' } = defineProps<{
  to?: string
  label?: string
}>()
</script>

<template>
  <a
    :href="to"
    class="fixed start-4 top-4 z-50 -translate-y-24 rounded-control bg-accent px-5 py-3 font-medium text-on-accent transition-transform duration-fast ease-out-quint focus-visible:translate-y-0"
  >
    {{ label }}
  </a>
</template>
