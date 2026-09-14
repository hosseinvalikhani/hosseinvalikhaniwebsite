<script setup lang="ts">
/**
 * Post tags.
 *
 * A real list, so "4 items" is announced rather than four floating words. The label names the
 * list for anyone who lands on it out of context — "Tags" read alone is ambiguous when a page
 * has several lists on it.
 */
const { tags, size = 'md' } = defineProps<{
  tags: string[]
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <ul v-if="tags.length" class="flex flex-wrap gap-2" aria-label="Tags">
    <li v-for="tag in tags" :key="tag">
      <DsBadge :size="size">
        {{ tag }}
      </DsBadge>
    </li>
  </ul>
</template>
