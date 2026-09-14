<script setup lang="ts">
/**
 * Hidden from sight, present for assistive technology.
 *
 * The clip-path pattern, not `width: 0` or `display: none` — both of those remove the element
 * from the accessibility tree too, which defeats the point. `white-space: nowrap` stops a long
 * string reflowing the page it is clipped out of.
 */
const { as = 'span' } = defineProps<{ as?: string }>()
</script>

<template>
  <component
    :is="as"
    class="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0"
    style="clip-path: inset(50%); clip: rect(0 0 0 0); margin: -1px"
  >
    <slot />
  </component>
</template>
