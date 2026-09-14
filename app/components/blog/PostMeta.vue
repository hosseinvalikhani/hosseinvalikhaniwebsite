<script setup lang="ts">
/**
 * Published date and reading time.
 *
 * <time datetime> carries the machine-readable value while the visible text stays human — the
 * same split as `period` and `from` on the experience entries, and the value Phase 10's
 * article schema will read.
 */
const { date, readingTime } = defineProps<{
  date: string
  readingTime?: number
}>()

const { formatDate } = useFormatDate()
</script>

<template>
  <p class="flex flex-wrap items-center gap-x-2 font-mono text-sm text-fg-subtle">
    <time :datetime="date">{{ formatDate(date) }}</time>
    <template v-if="readingTime">
      <span aria-hidden="true">·</span>
      <span>{{ readingTime }} min read</span>
    </template>
  </p>
</template>
