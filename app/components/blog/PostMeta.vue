<script setup lang="ts">
/**
 * Published date, last-updated date and reading time.
 *
 * <time datetime> carries the machine-readable value while the visible text stays human — the
 * same split as `period` and `from` on the experience entries, and the value the article schema
 * reads. `updated` is shown only when a post declares it, and it is shown at all because the
 * schema's dateModified has to describe something a reader can see.
 */
const { date, updated, readingTime } = defineProps<{
  date: string
  updated?: string
  readingTime?: number
}>()

const { formatDate } = useFormatDate()
</script>

<template>
  <p class="flex flex-wrap items-center gap-x-2 font-mono text-sm text-fg-subtle">
    <time :datetime="date">{{ formatDate(date) }}</time>
    <template v-if="updated && updated !== date">
      <span aria-hidden="true">·</span>
      <span>Updated <time :datetime="updated">{{ formatDate(updated) }}</time></span>
    </template>
    <template v-if="readingTime">
      <span aria-hidden="true">·</span>
      <span>{{ readingTime }} min read</span>
    </template>
  </p>
</template>
