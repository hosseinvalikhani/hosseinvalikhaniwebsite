<script setup lang="ts">
/**
 * Horizontal rhythm. `page` is the 72rem shell; `prose` is the 65ch measure that long-form
 * copy needs to stay readable.
 */
const { width = 'page', as = 'div' } = defineProps<{
  width?: 'page' | 'prose'
  as?: string
}>()
</script>

<template>
  <component
    :is="as"
    class="mx-auto w-full px-6 sm:px-8"
    :class="width === 'prose' ? 'max-w-prose' : 'max-w-page'"
  >
    <slot />
  </component>
</template>
