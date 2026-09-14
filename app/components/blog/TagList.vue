<script setup lang="ts">
/**
 * Post tags.
 *
 * A real list, so "4 items" is announced rather than four floating words. The label names the
 * list for anyone who lands on it out of context.
 *
 * When linked, each chip is a link to its tag page — which is also what lets the prerenderer
 * discover those pages at all, since crawlLinks only follows links that exist in the markup.
 */
const { tags, size = 'md', linked = false } = defineProps<{
  tags: string[]
  size?: 'sm' | 'md'
  linked?: boolean
}>()
</script>

<template>
  <ul v-if="tags.length" class="flex flex-wrap gap-2" aria-label="Tags">
    <li v-for="tag in tags" :key="tag">
      <!--
        On a tag page, the chip for that same tag is exact-active and Vue Router would mark it
        aria-current="page" — competing with the breadcrumb, which is the element that actually
        tells you where you are. A tag chip is a filter link, not a position in a navigational
        set, so it never claims currency.
      -->
      <NuxtLink
        v-if="linked"
        :to="tagPath(tag)"
        aria-current-value="false"
        class="inline-block rounded-chip transition-opacity duration-fast hover:opacity-80"
      >
        <DsBadge :size="size" variant="echo">
          {{ tag }}
        </DsBadge>
      </NuxtLink>
      <DsBadge v-else :size="size">
        {{ tag }}
      </DsBadge>
    </li>
  </ul>
</template>
