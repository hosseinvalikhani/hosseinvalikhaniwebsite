<script setup lang="ts">
/**
 * Previous and next post.
 *
 * Two crawlable links from every post to its neighbours, so no post is only reachable through
 * the listing — and the reader who finished one has somewhere to go that is not the back button.
 *
 * The surround query returns navigation items — a title and a path — rather than full posts, so
 * two neighbouring post bodies never reach this page's payload.
 */
const { path } = defineProps<{ path: string }>()

const { data: surroundings } = await useAsyncData(`blog-surround-${path}`, () =>
  queryCollectionItemSurroundings('blog', path)
    .where('draft', '=', false)
    .order('date', 'DESC'),
)

// Ordered newest first, so the item *before* this one in the list is the newer post.
const newer = computed(() => surroundings.value?.[0] ?? null)
const older = computed(() => surroundings.value?.[1] ?? null)
</script>

<template>
  <nav v-if="newer || older" aria-label="More posts" class="grid gap-4 sm:grid-cols-2">
    <DsCard v-if="older" interactive>
      <span class="font-mono text-xs uppercase tracking-wider text-fg-subtle">Previous</span>
      <p class="mt-2 font-bold text-balance">
        <NuxtLink :to="older.path" class="ds-card-link">
          {{ older.title }}
        </NuxtLink>
      </p>
    </DsCard>

    <DsCard v-if="newer" interactive class="sm:col-start-2 sm:text-end">
      <span class="font-mono text-xs uppercase tracking-wider text-fg-subtle">Next</span>
      <p class="mt-2 font-bold text-balance">
        <NuxtLink :to="newer.path" class="ds-card-link">
          {{ newer.title }}
        </NuxtLink>
      </p>
    </DsCard>
  </nav>
</template>
