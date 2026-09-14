<script setup lang="ts">
/**
 * A post in the listing.
 *
 * The title link owns the whole card through .ds-card-link, so the card is one tab stop whose
 * accessible name is the title. The tags sit *outside* that link's stretched area in reading
 * order but above it in stacking order, so they stay readable without becoming part of the
 * link's name.
 */
const { post } = defineProps<{
  post: {
    path: string
    title: string
    description: string
    date: string
    tags?: string[]
    readingTime?: number
  }
}>()
</script>

<template>
  <DsCard as="article" interactive class="h-full">
    <div class="flex h-full flex-col">
      <h3 class="text-xl font-bold text-balance">
        <NuxtLink :to="post.path" class="ds-card-link">
          {{ post.title }}
        </NuxtLink>
      </h3>

      <p class="mt-3 flex-1 text-fg-muted text-pretty">
        {{ post.description }}
      </p>

      <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
        <PostMeta :date="post.date" :reading-time="post.readingTime" />
        <div class="relative z-10">
          <TagList :tags="post.tags ?? []" size="sm" />
        </div>
      </div>
    </div>
  </DsCard>
</template>
